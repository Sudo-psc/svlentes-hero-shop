// User Behavior Tracking Service for Intelligent Reminder System

import { type Notification, type NotificationInteraction } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import {
  type UserBehaviorMetrics,
  NotificationChannel,
  InteractionType,
} from '@/types/reminders'

const NOTIFICATION_CHANNELS: readonly NotificationChannel[] = [
  NotificationChannel.EMAIL,
  NotificationChannel.WHATSAPP,
  NotificationChannel.SMS,
  NotificationChannel.PUSH,
] as const

const MIN_HOURLY_SAMPLE_SIZE = 3

const FREQUENCY_BUCKETS = [
  { id: 1, maxPerDay: 1 },
  { id: 3, maxPerDay: 3 },
  { id: 5, maxPerDay: Number.POSITIVE_INFINITY },
] as const

type BehaviorNotification = Pick<Notification, 'channel' | 'sentAt'> & {
  interactions: Array<Pick<NotificationInteraction, 'actionType' | 'timestamp'>>
}

interface ChannelRateMetrics {
  emailOpenRate: number
  emailClickRate: number
  whatsappOpenRate: number
  whatsappClickRate: number
  smsOpenRate: number
  smsClickRate: number
  pushOpenRate: number
  pushClickRate: number
}

interface AggregatedBehaviorMetrics {
  channelRates: ChannelRateMetrics
  bestHourOfDay: number | null
  averageResponseTime: number | null
  preferredFrequency: number
  conversionRate: number
}

const CHANNEL_KEY_MAP: Record<
  NotificationChannel,
  { open: keyof ChannelRateMetrics; click: keyof ChannelRateMetrics }
> = {
  [NotificationChannel.EMAIL]: {
    open: 'emailOpenRate',
    click: 'emailClickRate',
  },
  [NotificationChannel.WHATSAPP]: {
    open: 'whatsappOpenRate',
    click: 'whatsappClickRate',
  },
  [NotificationChannel.SMS]: {
    open: 'smsOpenRate',
    click: 'smsClickRate',
  },
  [NotificationChannel.PUSH]: {
    open: 'pushOpenRate',
    click: 'pushClickRate',
  },
}

/**
 * Behavior Service
 * Tracks and analyzes user behavior patterns for ML optimization
 */
export class BehaviorService {
  /**
   * Update user behavior metrics after interaction
   */
  async updateUserBehavior(userId: string): Promise<void> {
    const last90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    // Get all notifications and interactions
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        sentAt: { gte: last90d },
        status: { in: ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'] },
      },
      include: {
        interactions: true,
      },
    })

    const {
      channelRates,
      bestHourOfDay,
      averageResponseTime,
      preferredFrequency,
      conversionRate,
    } = this.aggregateBehaviorMetrics(notifications)

    // Get current fatigue score (calculated separately by ML service)
    const { mlService } = await import('./ml-service')
    const fatigueScore = await mlService.calculateFatigueScore(userId)

    // Upsert user behavior
    await prisma.userBehavior.upsert({
      where: { userId },
      create: {
        userId,
        ...channelRates,
        bestHourOfDay,
        averageResponseTime,
        preferredFrequency,
        currentFatigueScore: fatigueScore,
        conversionRate,
      },
      update: {
        ...channelRates,
        bestHourOfDay,
        averageResponseTime,
        preferredFrequency,
        currentFatigueScore: fatigueScore,
        conversionRate,
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Get user behavior metrics
   */
  async getUserBehavior(userId: string): Promise<UserBehaviorMetrics | null> {
    const behavior = await prisma.userBehavior.findUnique({
      where: { userId },
    })

    if (!behavior) return null

    return {
      userId: behavior.userId,
      emailOpenRate: behavior.emailOpenRate,
      emailClickRate: behavior.emailClickRate,
      whatsappOpenRate: behavior.whatsappOpenRate,
      whatsappClickRate: behavior.whatsappClickRate,
      smsOpenRate: behavior.smsOpenRate,
      smsClickRate: behavior.smsClickRate,
      pushOpenRate: behavior.pushOpenRate,
      pushClickRate: behavior.pushClickRate,
      bestHourOfDay: behavior.bestHourOfDay || undefined,
      averageResponseTime: behavior.averageResponseTime || undefined,
      preferredFrequency: behavior.preferredFrequency,
      currentFatigueScore: behavior.currentFatigueScore,
      conversionRate: behavior.conversionRate,
    }
  }

  private aggregateBehaviorMetrics(
    notifications: BehaviorNotification[]
  ): AggregatedBehaviorMetrics {
    const channelTotals: Record<
      NotificationChannel,
      { total: number; opened: number; clicked: number }
    > = {
      [NotificationChannel.EMAIL]: { total: 0, opened: 0, clicked: 0 },
      [NotificationChannel.WHATSAPP]: { total: 0, opened: 0, clicked: 0 },
      [NotificationChannel.SMS]: { total: 0, opened: 0, clicked: 0 },
      [NotificationChannel.PUSH]: { total: 0, opened: 0, clicked: 0 },
    }

    const hourEngagement = new Map<number, { total: number; engaged: number }>()
    const dailyEngagement = new Map<string, { total: number; engaged: number }>()
    const responseTimes: number[] = []
    let conversionCount = 0

    for (const notification of notifications) {
      const channel = notification.channel as NotificationChannel

      if (!NOTIFICATION_CHANNELS.includes(channel)) {
        continue
      }

      const channelStats = channelTotals[channel]
      channelStats.total += 1

      let hasOpened = false
      let hasClicked = false
      let hasConverted = false
      let firstEngagement: Date | null = null

      for (const interaction of notification.interactions) {
        if (
          interaction.actionType === InteractionType.OPENED ||
          interaction.actionType === InteractionType.CLICKED
        ) {
          if (!firstEngagement || interaction.timestamp < firstEngagement) {
            firstEngagement = interaction.timestamp
          }
        }

        if (interaction.actionType === InteractionType.OPENED) {
          hasOpened = true
        } else if (interaction.actionType === InteractionType.CLICKED) {
          hasClicked = true
        } else if (interaction.actionType === InteractionType.CONVERTED) {
          hasConverted = true
        }
      }

      if (hasOpened) {
        channelStats.opened += 1
      }

      if (hasClicked) {
        channelStats.clicked += 1
      }

      if (hasConverted) {
        conversionCount += 1
      }

      if (!notification.sentAt) {
        continue
      }

      const sentAt = notification.sentAt
      const hour = sentAt.getHours()
      const hourStats = hourEngagement.get(hour) ?? { total: 0, engaged: 0 }
      hourStats.total += 1

      if (hasOpened || hasClicked) {
        hourStats.engaged += 1
      }

      hourEngagement.set(hour, hourStats)

      const dayKey = sentAt.toISOString().split('T')[0]
      const dayStats = dailyEngagement.get(dayKey) ?? { total: 0, engaged: 0 }
      dayStats.total += 1

      if (hasOpened || hasClicked) {
        dayStats.engaged += 1
      }

      dailyEngagement.set(dayKey, dayStats)

      if (firstEngagement) {
        const responseTime =
          (firstEngagement.getTime() - sentAt.getTime()) / (1000 * 60)

        if (responseTime >= 0 && responseTime < 24 * 60) {
          responseTimes.push(responseTime)
        }
      }
    }

    const channelRates: ChannelRateMetrics = {
      emailOpenRate: 0,
      emailClickRate: 0,
      whatsappOpenRate: 0,
      whatsappClickRate: 0,
      smsOpenRate: 0,
      smsClickRate: 0,
      pushOpenRate: 0,
      pushClickRate: 0,
    }

    for (const channel of NOTIFICATION_CHANNELS) {
      const stats = channelTotals[channel]
      const keys = CHANNEL_KEY_MAP[channel]

      if (stats.total === 0) {
        channelRates[keys.open] = 0
        channelRates[keys.click] = 0
        continue
      }

      channelRates[keys.open] = stats.opened / stats.total
      channelRates[keys.click] = stats.clicked / stats.total
    }

    let bestHour: number | null = null
    let bestRate = 0

    for (const [hour, data] of hourEngagement.entries()) {
      if (data.total < MIN_HOURLY_SAMPLE_SIZE) {
        continue
      }

      const rate = data.engaged / data.total

      if (rate > bestRate) {
        bestRate = rate
        bestHour = hour
      }
    }

    const frequencyRates: Record<number, number[]> = {
      1: [],
      3: [],
      5: [],
    }

    for (const data of dailyEngagement.values()) {
      const rate = data.engaged / data.total
      const bucket =
        FREQUENCY_BUCKETS.find((tier) => data.total <= tier.maxPerDay)?.id ?? 5

      frequencyRates[bucket].push(rate)
    }

    let preferredFrequency = 3
    let highestFrequencyRate = 0

    for (const [frequency, rates] of Object.entries(frequencyRates)) {
      if (rates.length === 0) {
        continue
      }

      const averageRate =
        rates.reduce((sum, value) => sum + value, 0) / rates.length

      if (averageRate > highestFrequencyRate) {
        highestFrequencyRate = averageRate
        preferredFrequency = Number(frequency)
      }
    }

    const averageResponseTime =
      responseTimes.length === 0
        ? null
        : Math.round(
            responseTimes.reduce((sum, value) => sum + value, 0) /
              responseTimes.length
          )

    const conversionRate =
      notifications.length === 0 ? 0 : conversionCount / notifications.length

    return {
      channelRates,
      bestHourOfDay: bestHour,
      averageResponseTime,
      preferredFrequency,
      conversionRate,
    }
  }

  /**
   * Increment fatigue score when user doesn't engage
   */
  async incrementFatigueScore(userId: string): Promise<void> {
    const behavior = await prisma.userBehavior.findUnique({
      where: { userId },
    })

    if (behavior) {
      const newScore = Math.min(100, behavior.currentFatigueScore + 5)

      await prisma.userBehavior.update({
        where: { userId },
        data: {
          currentFatigueScore: newScore,
        },
      })
    }
  }

  /**
   * Decrease fatigue score when user engages
   */
  async decreaseFatigueScore(userId: string): Promise<void> {
    const behavior = await prisma.userBehavior.findUnique({
      where: { userId },
    })

    if (behavior) {
      const newScore = Math.max(0, behavior.currentFatigueScore - 10)

      await prisma.userBehavior.update({
        where: { userId },
        data: {
          currentFatigueScore: newScore,
        },
      })
    }
  }
}

// Export singleton instance
export const behaviorService = new BehaviorService()
