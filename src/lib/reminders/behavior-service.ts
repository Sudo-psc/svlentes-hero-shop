// User Behavior Tracking Service for Intelligent Reminder System

import { prisma } from '@/lib/prisma'
import { type UserBehaviorMetrics, NotificationChannel } from '@/types/reminders'

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

    // Calculate metrics per channel
    const channelMetrics = this.calculateChannelMetrics(notifications)

    // Calculate best hour of day
    const bestHour = this.calculateBestHourOfDay(notifications)

    // Calculate average response time
    const avgResponseTime = this.calculateAverageResponseTime(notifications)

    // Calculate preferred frequency
    const preferredFrequency = this.calculatePreferredFrequency(notifications)

    // Calculate conversion rate
    const conversionRate = this.calculateConversionRate(notifications)

    // Get current fatigue score (calculated separately by ML service)
    const { mlService } = await import('./ml-service')
    const fatigueScore = await mlService.calculateFatigueScore(userId)

    // Upsert user behavior
    await prisma.userBehavior.upsert({
      where: { userId },
      create: {
        userId,
        ...channelMetrics,
        bestHourOfDay: bestHour,
        averageResponseTime: avgResponseTime,
        preferredFrequency,
        currentFatigueScore: fatigueScore,
        conversionRate,
      },
      update: {
        ...channelMetrics,
        bestHourOfDay: bestHour,
        averageResponseTime: avgResponseTime,
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

  /**
   * Calculate metrics per channel
   */
  private calculateChannelMetrics(notifications: any[]): Record<string, number> {
    const channels = [
      NotificationChannel.EMAIL,
      NotificationChannel.WHATSAPP,
      NotificationChannel.SMS,
      NotificationChannel.PUSH,
    ]

    const metrics: Record<string, number> = {}

    channels.forEach((channel) => {
      const channelNotifs = notifications.filter((n) => n.channel === channel)
      const total = channelNotifs.length

      if (total === 0) {
        metrics[`${channel.toLowerCase()}OpenRate`] = 0
        metrics[`${channel.toLowerCase()}ClickRate`] = 0
        return
      }

      const opened = channelNotifs.filter((n) =>
        n.interactions.some((i: any) => i.actionType === 'OPENED')
      ).length

      const clicked = channelNotifs.filter((n) =>
        n.interactions.some((i: any) => i.actionType === 'CLICKED')
      ).length

      metrics[`${channel.toLowerCase()}OpenRate`] = opened / total
      metrics[`${channel.toLowerCase()}ClickRate`] = clicked / total
    })

    return metrics
  }

  /**
   * Calculate best hour of day for engagement
   */
  private calculateBestHourOfDay(notifications: any[]): number | null {
    const hourEngagement: Record<number, { total: number; engaged: number }> = {}

    notifications.forEach((notif) => {
      if (!notif.sentAt) return

      const hour = new Date(notif.sentAt).getHours()
      
      if (!hourEngagement[hour]) {
        hourEngagement[hour] = { total: 0, engaged: 0 }
      }

      hourEngagement[hour].total++

      const hasEngagement = notif.interactions.some(
        (i: any) => i.actionType === 'OPENED' || i.actionType === 'CLICKED'
      )

      if (hasEngagement) {
        hourEngagement[hour].engaged++
      }
    })

    // Find hour with highest engagement rate
    let bestHour = null
    let bestRate = 0

    Object.entries(hourEngagement).forEach(([hour, data]) => {
      const rate = data.engaged / data.total
      if (rate > bestRate && data.total >= 3) {
        bestRate = rate
        bestHour = parseInt(hour)
      }
    })

    return bestHour
  }

  /**
   * Calculate average response time in minutes
   */
  private calculateAverageResponseTime(notifications: any[]): number | null {
    const responseTimes: number[] = []

    notifications.forEach((notif) => {
      if (!notif.sentAt) return

      const firstInteraction = notif.interactions.find(
        (i: any) => i.actionType === 'OPENED' || i.actionType === 'CLICKED'
      )

      if (firstInteraction) {
        const responseTime =
          (new Date(firstInteraction.timestamp).getTime() - new Date(notif.sentAt).getTime()) /
          (1000 * 60) // Convert to minutes

        if (responseTime >= 0 && responseTime < 24 * 60) {
          responseTimes.push(responseTime)
        }
      }
    })

    if (responseTimes.length === 0) return null

    const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    return Math.round(avgTime)
  }

  /**
   * Calculate preferred frequency based on engagement
   */
  private calculatePreferredFrequency(notifications: any[]): number {
    // Group by day and calculate engagement
    const dailyEngagement: Record<string, { total: number; engaged: number }> = {}

    notifications.forEach((notif) => {
      if (!notif.sentAt) return

      const date = new Date(notif.sentAt).toISOString().split('T')[0]
      
      if (!dailyEngagement[date]) {
        dailyEngagement[date] = { total: 0, engaged: 0 }
      }

      dailyEngagement[date].total++

      const hasEngagement = notif.interactions.some(
        (i: any) => i.actionType === 'OPENED' || i.actionType === 'CLICKED'
      )

      if (hasEngagement) {
        dailyEngagement[date].engaged++
      }
    })

    // Calculate average engagement rate by frequency tier
    const frequencyTiers: Record<number, number[]> = {
      1: [], // 1 per day
      3: [], // 2-3 per day
      5: [], // 4+ per day
    }

    Object.values(dailyEngagement).forEach((data) => {
      const rate = data.engaged / data.total

      if (data.total === 1) {
        frequencyTiers[1].push(rate)
      } else if (data.total <= 3) {
        frequencyTiers[3].push(rate)
      } else {
        frequencyTiers[5].push(rate)
      }
    })

    // Find tier with highest average engagement
    let bestFrequency = 3 // Default
    let bestRate = 0

    Object.entries(frequencyTiers).forEach(([freq, rates]) => {
      if (rates.length === 0) return

      const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length

      if (avgRate > bestRate) {
        bestRate = avgRate
        bestFrequency = parseInt(freq)
      }
    })

    return bestFrequency
  }

  /**
   * Calculate conversion rate
   */
  private calculateConversionRate(notifications: any[]): number {
    if (notifications.length === 0) return 0

    const conversions = notifications.filter((n) =>
      n.interactions.some((i: any) => i.actionType === 'CONVERTED')
    ).length

    return conversions / notifications.length
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
