// ML Service for Intelligent Reminder System
// Implements channel selection and optimal timing prediction
import { prisma } from '@/lib/prisma'
import { type Prisma } from '@prisma/client'
import {
  type ChannelSelectionResult,
  type MLFeatures,
  type MLPredictionResult,
  type UserPreferences,
  NotificationChannel,
} from '@/types/reminders'
const MODEL_VERSION = '1.0.0-mvp'
const CACHE_TTL_MS = 5 * 60 * 1000
const RECENT_NOTIFICATION_WINDOW_HOURS = 24
const RECENT_ENGAGEMENT_WINDOW_DAYS = 7
const NOTIFICATION_HISTORY_LOOKBACK_DAYS = 90
const OPT_OUT_LOOKBACK_DAYS = 7
const DEFAULT_MAX_NOTIFICATIONS_PER_DAY = 3
const FATIGUE_SEND_THRESHOLD = 70
const FATIGUE_NORMALIZATION_FACTOR = 200
const OPT_OUT_FATIGUE_PENALTY = 40
const CHANNEL_SCORE_WEIGHTS = { base: 0.3, engagement: 0.7 } as const
const QUIET_HOURS = { start: 8, end: 21, fallbackStart: 9, fallbackEnd: 19 } as const
const CHANNEL_BASE_WEIGHTS: Record<NotificationChannel, number> = {
  [NotificationChannel.EMAIL]: 0.3,
  [NotificationChannel.WHATSAPP]: 0.4,
  [NotificationChannel.SMS]: 0.2,
  [NotificationChannel.PUSH]: 0.25,
}
const NOTIFICATION_COUNT_THRESHOLDS: Array<{ limit: number; penalty: number }> = [
  { limit: 5, penalty: 30 },
  { limit: 3, penalty: 20 },
  { limit: 1, penalty: 10 },
]
const INTERACTION_RATE_THRESHOLDS: Array<{ rate: number; penalty: number }> = [
  { rate: 0.2, penalty: 30 },
  { rate: 0.4, penalty: 20 },
  { rate: 0.6, penalty: 10 },
]
const CHANNEL_ORDER: NotificationChannel[] = [
  NotificationChannel.EMAIL,
  NotificationChannel.WHATSAPP,
  NotificationChannel.SMS,
  NotificationChannel.PUSH,
]
const CHANNEL_KEY_MAP: Record<NotificationChannel, keyof UserPreferences['channels']> = {
  [NotificationChannel.EMAIL]: 'email',
  [NotificationChannel.WHATSAPP]: 'whatsapp',
  [NotificationChannel.SMS]: 'sms',
  [NotificationChannel.PUSH]: 'push',
}
interface CachedValue<T> {
  value: T
  expiresAt: number
}
type NotificationWithInteractions = Prisma.NotificationGetPayload<{
  include: { interactions: true }
}>
const DEFAULT_PREFERENCE_FREQUENCY = {
  max_per_day: DEFAULT_MAX_NOTIFICATIONS_PER_DAY,
} as const
const DEFAULT_USER_PREFERENCES: UserPreferences = {
  channels: {},
  frequency: { ...DEFAULT_PREFERENCE_FREQUENCY },
  types: {},
}
function clampHour(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }
  const normalized = Math.trunc(value)
  if (normalized < 0) {
    return 0
  }
  if (normalized > 23) {
    return 23
  }
  return normalized
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
/**
 * ML Service
 * Provides machine learning predictions for channel selection and timing optimization
 */
export class MLService {
  private readonly featureCache = new Map<string, CachedValue<MLFeatures>>()
  private readonly fatigueCache = new Map<string, CachedValue<number>>()
  private readonly preferenceCache = new Map<string, CachedValue<UserPreferences>>()
  async predictOptimalChannel(userId: string): Promise<MLPredictionResult> {
    const features = await this.extractFeatures(userId)
    const channelScores = this.calculateChannelScores(features)
    const optimalChannel = this.selectOptimalChannel(channelScores)
    const confidence = channelScores[optimalChannel]
    const optimalTime = await this.predictOptimalTime(userId, features)
    await this.storePrediction(userId, optimalChannel, optimalTime, confidence, features)
    return {
      channel: optimalChannel,
      time: optimalTime,
      confidence,
      features,
    }
  }
  async predictOptimalTime(userId: string, features: MLFeatures): Promise<Date> {
    const preferences = await this.getUserPreferences(userId)
    const now = new Date()
    const currentHour = now.getHours()
    const baseHour = clampHour(features.hourOfDay)
    const adjustedHour = this.adjustHourForQuietPreferences(baseHour, preferences)
    const targetDate = new Date(now)
    if (currentHour < adjustedHour) {
      targetDate.setHours(adjustedHour, 0, 0, 0)
    } else {
      targetDate.setDate(targetDate.getDate() + 1)
      targetDate.setHours(adjustedHour, 0, 0, 0)
    }
    return targetDate
  }
  async selectChannelWithFallback(userId: string): Promise<ChannelSelectionResult> {
    const prediction = await this.predictOptimalChannel(userId)
    const preferences = await this.getUserPreferences(userId)
    const isPrimaryEnabled = this.isChannelEnabled(preferences, prediction.channel)
    const fallback = CHANNEL_ORDER.filter(
      (channel) => channel !== prediction.channel && this.isChannelEnabled(preferences, channel)
    )
    const primary = isPrimaryEnabled ? prediction.channel : fallback[0] ?? NotificationChannel.EMAIL
    return {
      primary,
      fallback,
      score: prediction.confidence,
      reason: isPrimaryEnabled
        ? 'ML prediction based on historical engagement'
        : 'Fallback - predicted channel disabled',
    }
  }
  async shouldSendNotification(userId: string): Promise<boolean> {
    const features = await this.extractFeatures(userId)
    if (features.fatigueScore > FATIGUE_SEND_THRESHOLD) {
      return false
    }
    const last24h = new Date(Date.now() - RECENT_NOTIFICATION_WINDOW_HOURS * 60 * 60 * 1000)
    const todayCountPromise = prisma.notification.count({
      where: {
        userId,
        sentAt: { gte: last24h },
        status: { in: ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'] },
      },
    })
    const preferencesPromise = this.getUserPreferences(userId)
    const [todayCount, preferences] = await Promise.all([todayCountPromise, preferencesPromise])
    const maxPerDay = preferences.frequency?.max_per_day ?? features.preferredFrequency
    return todayCount < maxPerDay
  }
  private async extractFeatures(userId: string): Promise<MLFeatures> {
    return this.getOrLoad(this.featureCache, userId, async () => {
      const now = new Date()
      const last90d = new Date(Date.now() - NOTIFICATION_HISTORY_LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
      const behaviorPromise = prisma.userBehavior.findUnique({
        where: { userId },
      })
      const notificationsPromise: Promise<NotificationWithInteractions[]> = prisma.notification.findMany({
        where: {
          userId,
          createdAt: { gte: last90d },
        },
        include: {
          interactions: true,
        },
      })
      const fatigueScorePromise = this.getFatigueScore(userId)
      const [behavior, notifications, fatigueScore] = await Promise.all([
        behaviorPromise,
        notificationsPromise,
        fatigueScorePromise,
      ])
      const channelHistory: Record<NotificationChannel, number> = {
        [NotificationChannel.EMAIL]: 0,
        [NotificationChannel.WHATSAPP]: 0,
        [NotificationChannel.SMS]: 0,
        [NotificationChannel.PUSH]: 0,
      }
      notifications.forEach((notification) => {
        const hasEngagement = notification.interactions.some(
          (interaction) => interaction.actionType === 'OPENED' || interaction.actionType === 'CLICKED'
        )
        if (hasEngagement) {
          channelHistory[notification.channel] =
            (channelHistory[notification.channel] ?? 0) + 1
        }
      })
      const last7d = new Date(Date.now() - RECENT_ENGAGEMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000)
      const recentNotifications = notifications.filter(
        (notification) => notification.createdAt >= last7d
      )
      const recentEngagementCount = recentNotifications.filter((notification) =>
        notification.interactions.some(
          (interaction) => interaction.actionType === 'OPENED' || interaction.actionType === 'CLICKED'
        )
      ).length
      const recentEngagementRate =
        recentNotifications.length > 0
          ? recentEngagementCount / recentNotifications.length
          : 0
      return {
        hourOfDay: behavior?.bestHourOfDay ?? now.getHours(),
        dayOfWeek: now.getDay(),
        channelHistory,
        recentEngagement: recentEngagementRate,
        fatigueScore,
        avgResponseTime: behavior?.averageResponseTime ?? 0,
        preferredFrequency: behavior?.preferredFrequency ?? DEFAULT_MAX_NOTIFICATIONS_PER_DAY,
      }
    })
  }
  private calculateChannelScores(features: MLFeatures): Record<NotificationChannel, number> {
    const fatigueMultiplier = 1 - Math.min(features.fatigueScore, FATIGUE_NORMALIZATION_FACTOR) / FATIGUE_NORMALIZATION_FACTOR
    return Object.values(NotificationChannel).reduce<Record<NotificationChannel, number>>(
      (scores, channel) => {
        const historicalEngagement = features.channelHistory[channel] ?? 0
        const baseWeight = CHANNEL_BASE_WEIGHTS[channel]
        const engagementScore = Math.min(historicalEngagement / 10, 1)
        const score =
          baseWeight * CHANNEL_SCORE_WEIGHTS.base +
          engagementScore * CHANNEL_SCORE_WEIGHTS.engagement
        scores[channel] = score * fatigueMultiplier
        return scores
      },
      {
        [NotificationChannel.EMAIL]: 0,
        [NotificationChannel.WHATSAPP]: 0,
        [NotificationChannel.SMS]: 0,
        [NotificationChannel.PUSH]: 0,
      }
    )
  }
  private selectOptimalChannel(channelScores: Record<NotificationChannel, number>): NotificationChannel {
    return (Object.entries(channelScores).reduce((best, current) =>
      current[1] > best[1] ? current : best
    )?.[0] ?? NotificationChannel.EMAIL) as NotificationChannel
  }
  private async storePrediction(
    userId: string,
    channel: NotificationChannel,
    time: Date,
    confidence: number,
    features: MLFeatures
  ): Promise<void> {
    const serializedFeatures = this.serializeFeatures(features)
    await prisma.mLPrediction.create({
      data: {
        userId,
        predictedChannel: channel,
        predictedTime: time,
        confidenceScore: confidence,
        modelVersion: MODEL_VERSION,
        features: serializedFeatures,
      },
    })
  }
  async updatePredictionAccuracy(
    predictionId: string,
    actualChannel: NotificationChannel,
    actualTime: Date
  ): Promise<void> {
    const prediction = await prisma.mLPrediction.findUnique({
      where: { id: predictionId },
      select: {
        predictedChannel: true,
        predictedTime: true,
      },
    })
    if (!prediction) {
      return
    }
    const accuracyWindowMs = 30 * 60 * 1000
    const wasAccurate =
      prediction.predictedChannel === actualChannel &&
      Math.abs(prediction.predictedTime.getTime() - actualTime.getTime()) < accuracyWindowMs
    await prisma.mLPrediction.update({
      where: { id: predictionId },
      data: {
        actualChannel,
        actualTime,
        wasAccurate,
      },
    })
  }
  async getModelAccuracy(): Promise<{ accuracy: number; totalPredictions: number }> {
    const predictions = await prisma.mLPrediction.findMany({
      where: {
        wasAccurate: { not: null },
      },
      select: {
        wasAccurate: true,
      },
    })
    const totalPredictions = predictions.length
    const accuratePredictions = predictions.filter((prediction) => prediction.wasAccurate === true)
      .length
    const accuracy = totalPredictions > 0 ? accuratePredictions / totalPredictions : 0
    return {
      accuracy,
      totalPredictions,
    }
  }
  private async getFatigueScore(userId: string): Promise<number> {
    return this.getOrLoad(this.fatigueCache, userId, () => this.computeFatigueScore(userId))
  }
  private async computeFatigueScore(userId: string): Promise<number> {
    const last24h = new Date(Date.now() - RECENT_NOTIFICATION_WINDOW_HOURS * 60 * 60 * 1000)
    const last7d = new Date(Date.now() - OPT_OUT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
    const [recentCount, interactionCount, optOutCount] = await Promise.all([
      prisma.notification.count({
        where: {
          userId,
          sentAt: { gte: last24h },
        },
      }),
      prisma.interaction.count({
        where: {
          userId,
          timestamp: { gte: last24h },
          actionType: { in: ['OPENED', 'CLICKED'] },
        },
      }),
      prisma.interaction.count({
        where: {
          userId,
          timestamp: { gte: last7d },
          actionType: 'OPTED_OUT',
        },
      }),
    ])
    const interactionRate = recentCount > 0 ? interactionCount / recentCount : 0
    let score = 0
    for (const { limit, penalty } of NOTIFICATION_COUNT_THRESHOLDS) {
      if (recentCount > limit) {
        score += penalty
        break
      }
    }
    for (const { rate, penalty } of INTERACTION_RATE_THRESHOLDS) {
      if (interactionRate < rate) {
        score += penalty
        break
      }
    }
    if (optOutCount > 0) {
      score += OPT_OUT_FATIGUE_PENALTY
    }
    return Math.min(100, score)
  }
  private async getUserPreferences(userId: string): Promise<UserPreferences> {
    return this.getOrLoad(this.preferenceCache, userId, async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true },
      })
      return this.normalizePreferences(user?.preferences)
    })
  }
  private normalizePreferences(preferences: unknown): UserPreferences {
    if (!isRecord(preferences)) {
      return DEFAULT_USER_PREFERENCES
    }
    const channels: UserPreferences['channels'] = {}
    if (isRecord(preferences.channels)) {
      for (const channelKey of Object.values(CHANNEL_KEY_MAP)) {
        const channelValue = preferences.channels[channelKey]
        if (isRecord(channelValue)) {
          channels[channelKey] = {
            enabled: typeof channelValue.enabled === 'boolean' ? channelValue.enabled : true,
          }
          if ('address' in channelValue && typeof channelValue.address === 'string') {
            channels[channelKey]!.address = channelValue.address
          }
          if ('number' in channelValue && typeof channelValue.number === 'string') {
            channels[channelKey]!.number = channelValue.number
          }
          if ('token' in channelValue && typeof channelValue.token === 'string') {
            channels[channelKey]!.token = channelValue.token
          }
        }
      }
    }
    let frequency: UserPreferences['frequency'] = undefined
    if (isRecord(preferences.frequency)) {
      const maxPerDayValue = preferences.frequency.max_per_day
      const quietHoursValue = preferences.frequency.quiet_hours
      const maxPerDay =
        typeof maxPerDayValue === 'number' && Number.isFinite(maxPerDayValue)
          ? maxPerDayValue
          : DEFAULT_MAX_NOTIFICATIONS_PER_DAY
      const quietHours = isRecord(quietHoursValue)
        ? {
            start: clampHour(quietHoursValue.start),
            end: clampHour(quietHoursValue.end),
          }
        : undefined
      frequency = { max_per_day: maxPerDay, quiet_hours: quietHours }
    }
    const fallbackFrequency = DEFAULT_USER_PREFERENCES.frequency ?? {
      ...DEFAULT_PREFERENCE_FREQUENCY,
    }
    return {
      channels,
      frequency: frequency ?? { ...fallbackFrequency },
      types: { ...DEFAULT_USER_PREFERENCES.types },
    }
  }
  private adjustHourForQuietPreferences(hour: number, preferences: UserPreferences): number {
    const quietHours = preferences.frequency?.quiet_hours
    if (!quietHours) {
      let adjustedHour = hour
      if (adjustedHour < QUIET_HOURS.start) {
        adjustedHour = QUIET_HOURS.fallbackStart
      }
      if (adjustedHour > QUIET_HOURS.end) {
        adjustedHour = QUIET_HOURS.fallbackEnd
      }
      return adjustedHour
    }
    const start = clampHour(quietHours.start)
    const end = clampHour(quietHours.end)
    const normalizedHour = clampHour(hour)
    const crossesMidnight = start > end
    const withinQuiet = crossesMidnight
      ? normalizedHour >= start || normalizedHour < end
      : normalizedHour >= start && normalizedHour < end
    if (!withinQuiet) {
      return normalizedHour
    }
    return end % 24
  }
  private isChannelEnabled(preferences: UserPreferences, channel: NotificationChannel): boolean {
    const channelKey = CHANNEL_KEY_MAP[channel]
    const channelPreferences = preferences.channels?.[channelKey]
    return channelPreferences?.enabled !== false
  }
  private serializeFeatures(features: MLFeatures): Prisma.JsonObject {
    const channelHistory = Object.entries(features.channelHistory).reduce<Record<string, number>>(
      (history, [channel, value]) => {
        history[channel] = value
        return history
      },
      {}
    )
    return {
      hourOfDay: features.hourOfDay,
      dayOfWeek: features.dayOfWeek,
      channelHistory,
      recentEngagement: features.recentEngagement,
      fatigueScore: features.fatigueScore,
      avgResponseTime: features.avgResponseTime,
      preferredFrequency: features.preferredFrequency,
    } satisfies Prisma.JsonObject
  }
  private async getOrLoad<T>(
    cache: Map<string, CachedValue<T>>,
    key: string,
    loader: () => Promise<T>
  ): Promise<T> {
    const cached = cache.get(key)
    const now = Date.now()
    if (cached && cached.expiresAt > now) {
      return cached.value
    }
    const value = await loader()
    cache.set(key, { value, expiresAt: now + CACHE_TTL_MS })
    return value
  }
}
// Export singleton instance
export const mlService = new MLService()