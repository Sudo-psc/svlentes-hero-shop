// ML Service for Intelligent Reminder System
// Implements channel selection and optimal timing prediction

import { prisma } from '@/lib/prisma'
import {
  type MLPredictionResult,
  type MLFeatures,
  type ChannelSelectionResult,
  type FatigueScoreInput,
  NotificationChannel,
} from '@/types/reminders'

const MODEL_VERSION = '1.0.0-mvp'

/**
 * ML Service
 * Provides machine learning predictions for channel selection and timing optimization
 */
export class MLService {
  /**
   * Predict optimal channel for user
   * MVP: Uses rule-based logic with historical data
   * TODO: Replace with trained ML model (sklearn/XGBoost)
   */
  async predictOptimalChannel(userId: string): Promise<MLPredictionResult> {
    const features = await this.extractFeatures(userId)
    
    // Get channel with highest engagement
    const channelScores = {
      [NotificationChannel.EMAIL]: this.calculateChannelScore(
        features.channelHistory[NotificationChannel.EMAIL] || 0,
        0.3 // Base weight for email
      ),
      [NotificationChannel.WHATSAPP]: this.calculateChannelScore(
        features.channelHistory[NotificationChannel.WHATSAPP] || 0,
        0.4 // Base weight for WhatsApp (typically higher engagement)
      ),
      [NotificationChannel.SMS]: this.calculateChannelScore(
        features.channelHistory[NotificationChannel.SMS] || 0,
        0.2 // Base weight for SMS
      ),
      [NotificationChannel.PUSH]: this.calculateChannelScore(
        features.channelHistory[NotificationChannel.PUSH] || 0,
        0.25 // Base weight for push
      ),
    }

    // Adjust for fatigue
    const fatigueMultiplier = 1 - (features.fatigueScore / 200)
    Object.keys(channelScores).forEach((channel) => {
      channelScores[channel as NotificationChannel] *= fatigueMultiplier
    })

    // Select channel with highest score
    const optimalChannel = Object.entries(channelScores).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0] as NotificationChannel

    const confidence = channelScores[optimalChannel]

    // Predict optimal time
    const optimalTime = await this.predictOptimalTime(userId, features)

    // Store prediction
    await this.storePrediction(userId, optimalChannel, optimalTime, confidence, features)

    return {
      channel: optimalChannel,
      time: optimalTime,
      confidence,
      features,
    }
  }

  /**
   * Predict optimal time for notification
   */
  async predictOptimalTime(userId: string, features: MLFeatures): Promise<Date> {
    const now = new Date()
    const currentHour = now.getHours()

    // Use user's best hour if available
    let targetHour = features.hourOfDay || currentHour

    // Avoid quiet hours (typically late night/early morning)
    if (targetHour < 8) targetHour = 9
    if (targetHour > 21) targetHour = 19

    // Calculate next occurrence of target hour
    const targetDate = new Date(now)
    
    if (currentHour < targetHour) {
      // Same day
      targetDate.setHours(targetHour, 0, 0, 0)
    } else {
      // Next day
      targetDate.setDate(targetDate.getDate() + 1)
      targetDate.setHours(targetHour, 0, 0, 0)
    }

    return targetDate
  }

  /**
   * Calculate fatigue score (0-100)
   * Higher score = more fatigued = reduce frequency
   */
  async calculateFatigueScore(userId: string): Promise<number> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Count recent notifications
    const recentCount = await prisma.notification.count({
      where: {
        userId,
        sentAt: { gte: last24h },
      },
    })

    // Count recent interactions
    const interactionCount = await prisma.interaction.count({
      where: {
        userId,
        timestamp: { gte: last24h },
        actionType: { in: ['OPENED', 'CLICKED'] },
      },
    })

    // Calculate interaction rate
    const interactionRate = recentCount > 0 ? interactionCount / recentCount : 0

    // Check for opt-outs
    const optOutCount = await prisma.interaction.count({
      where: {
        userId,
        timestamp: { gte: last7d },
        actionType: 'OPTED_OUT',
      },
    })

    // Calculate fatigue score
    let score = 0

    // High notification count increases fatigue
    if (recentCount > 5) score += 30
    else if (recentCount > 3) score += 20
    else if (recentCount > 1) score += 10

    // Low interaction rate increases fatigue
    if (interactionRate < 0.2) score += 30
    else if (interactionRate < 0.4) score += 20
    else if (interactionRate < 0.6) score += 10

    // Opt-outs significantly increase fatigue
    if (optOutCount > 0) score += 40

    return Math.min(100, score)
  }

  /**
   * Select channel with fallback options
   */
  async selectChannelWithFallback(userId: string): Promise<ChannelSelectionResult> {
    const prediction = await this.predictOptimalChannel(userId)
    
    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userBehavior: true },
    })

    const preferences = (user?.preferences as any) || {}

    // Check if predicted channel is enabled
    const isPrimaryEnabled = preferences.channels?.[prediction.channel.toLowerCase()]?.enabled !== false

    // Build fallback list
    const allChannels = [
      NotificationChannel.EMAIL,
      NotificationChannel.WHATSAPP,
      NotificationChannel.SMS,
      NotificationChannel.PUSH,
    ]

    const fallback = allChannels.filter((ch) => {
      if (ch === prediction.channel) return false
      const isEnabled = preferences.channels?.[ch.toLowerCase()]?.enabled !== false
      return isEnabled
    })

    const primary = isPrimaryEnabled ? prediction.channel : (fallback[0] || NotificationChannel.EMAIL)

    return {
      primary,
      fallback,
      score: prediction.confidence,
      reason: isPrimaryEnabled
        ? 'ML prediction based on historical engagement'
        : 'Fallback - predicted channel disabled',
    }
  }

  /**
   * Determine if notification should be sent based on frequency limits
   */
  async shouldSendNotification(userId: string): Promise<boolean> {
    const fatigueScore = await this.calculateFatigueScore(userId)

    // Don't send if fatigue score > 70
    if (fatigueScore > 70) {
      return false
    }

    // Check frequency limits
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const todayCount = await prisma.notification.count({
      where: {
        userId,
        sentAt: { gte: last24h },
        status: { in: ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'] },
      },
    })

    // Get user behavior
    const behavior = await prisma.userBehavior.findUnique({
      where: { userId },
    })

    const maxPerDay = behavior?.preferredFrequency || 3

    return todayCount < maxPerDay
  }

  /**
   * Extract features for ML model
   */
  private async extractFeatures(userId: string): Promise<MLFeatures> {
    const now = new Date()
    const last90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    // Get user behavior
    const behavior = await prisma.userBehavior.findUnique({
      where: { userId },
    })

    // Get channel engagement history
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        createdAt: { gte: last90d },
      },
      include: {
        interactions: true,
      },
    })

    const channelHistory: Record<NotificationChannel, number> = {
      [NotificationChannel.EMAIL]: 0,
      [NotificationChannel.WHATSAPP]: 0,
      [NotificationChannel.SMS]: 0,
      [NotificationChannel.PUSH]: 0,
    }

    // Calculate engagement rate per channel
    notifications.forEach((notif) => {
      const hasEngagement = notif.interactions.some(
        (i) => i.actionType === 'OPENED' || i.actionType === 'CLICKED'
      )
      if (hasEngagement) {
        channelHistory[notif.channel] = (channelHistory[notif.channel] || 0) + 1
      }
    })

    // Recent engagement
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentNotifs = notifications.filter((n) => n.createdAt >= last7d)
    const recentEngagement = recentNotifs.filter((n) =>
      n.interactions.some((i) => i.actionType === 'OPENED' || i.actionType === 'CLICKED')
    ).length

    const recentEngagementRate = recentNotifs.length > 0 ? recentEngagement / recentNotifs.length : 0

    // Calculate fatigue score
    const fatigueScore = await this.calculateFatigueScore(userId)

    return {
      hourOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
      channelHistory,
      recentEngagement: recentEngagementRate,
      fatigueScore,
      avgResponseTime: behavior?.averageResponseTime || 0,
      preferredFrequency: behavior?.preferredFrequency || 3,
    }
  }

  /**
   * Calculate channel score
   */
  private calculateChannelScore(historicalEngagement: number, baseWeight: number): number {
    // Combine historical engagement with base weight
    const engagementScore = Math.min(historicalEngagement / 10, 1) // Normalize to 0-1
    return baseWeight * 0.3 + engagementScore * 0.7
  }

  /**
   * Store ML prediction for tracking
   */
  private async storePrediction(
    userId: string,
    channel: NotificationChannel,
    time: Date,
    confidence: number,
    features: MLFeatures
  ): Promise<void> {
    await prisma.mLPrediction.create({
      data: {
        userId,
        predictedChannel: channel,
        predictedTime: time,
        confidenceScore: confidence,
        modelVersion: MODEL_VERSION,
        features: features as any,
      },
    })
  }

  /**
   * Update prediction accuracy after actual send
   */
  async updatePredictionAccuracy(
    predictionId: string,
    actualChannel: NotificationChannel,
    actualTime: Date
  ): Promise<void> {
    const prediction = await prisma.mLPrediction.findUnique({
      where: { id: predictionId },
    })

    if (!prediction) return

    const wasAccurate =
      prediction.predictedChannel === actualChannel &&
      Math.abs(prediction.predictedTime.getTime() - actualTime.getTime()) < 30 * 60 * 1000 // Within 30 minutes

    await prisma.mLPrediction.update({
      where: { id: predictionId },
      data: {
        actualChannel,
        actualTime,
        wasAccurate,
      },
    })
  }

  /**
   * Get model accuracy metrics
   */
  async getModelAccuracy(): Promise<{ accuracy: number; totalPredictions: number }> {
    const predictions = await prisma.mLPrediction.findMany({
      where: {
        wasAccurate: { not: null },
      },
    })

    const totalPredictions = predictions.length
    const accuratePredictions = predictions.filter((p) => p.wasAccurate).length

    const accuracy = totalPredictions > 0 ? accuratePredictions / totalPredictions : 0

    return {
      accuracy,
      totalPredictions,
    }
  }
}

// Export singleton instance
export const mlService = new MLService()
