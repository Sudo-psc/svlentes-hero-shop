// Analytics Service for Intelligent Reminder System
import { prisma } from '@/lib/prisma'
import {
  type EngagementAnalytics,
  type ChannelMetrics,
  type AnalyticsQuery,
  NotificationChannel,
  NotificationType,
} from '@/types/reminders'
/**
 * Analytics Service
 * Provides engagement metrics, reports, and dashboard data
 */
export class AnalyticsService {
  /**
   * Get engagement analytics for a period
   */
  async getEngagementAnalytics(query: AnalyticsQuery): Promise<EngagementAnalytics> {
    const { userId, startDate, endDate, channels, types } = query
    // Build where clause
    const where: any = {
      sentAt: {
        gte: startDate,
        lte: endDate,
      },
    }
    if (userId) where.userId = userId
    if (channels && channels.length > 0) where.channel = { in: channels }
    if (types && types.length > 0) where.type = { in: types }
    // Get all notifications in period
    const notifications = await prisma.notification.findMany({
      where,
      include: {
        interactions: true,
      },
    })
    // Calculate global metrics
    const totalSent = notifications.length
    const totalDelivered = notifications.filter((n: any) =>
      n.interactions.some((i: any) => i.actionType === 'DELIVERED')
    ).length
    const totalOpened = notifications.filter((n: any) =>
      n.interactions.some((i: any) => i.actionType === 'OPENED')
    ).length
    const totalClicked = notifications.filter((n: any) =>
      n.interactions.some((i: any) => i.actionType === 'CLICKED')
    ).length
    const totalConverted = notifications.filter((n: any) =>
      n.interactions.some((i: any) => i.actionType === 'CONVERTED')
    ).length
    // Calculate rates
    const engagementRate = totalSent > 0 ? (totalOpened + totalClicked) / totalSent : 0
    // Calculate opt-out rate
    const optOutCount = await prisma.interaction.count({
      where: {
        actionType: 'OPTED_OUT',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    })
    const optOutRate = totalSent > 0 ? optOutCount / totalSent : 0
    // Calculate average response time
    const avgResponseTime = this.calculateAverageResponseTime(notifications)
    // Get metrics by channel
    const byChannel = await this.getChannelMetrics(notifications)
    // Get metrics by type
    const byType: Record<NotificationType, any> = {} as any
    Object.values(NotificationType).forEach((type) => {
      const typeNotifs = notifications.filter((n: any) => n.type === type)
      byType[type] = {
        sent: typeNotifs.length,
        opened: typeNotifs.filter((n: any) => n.interactions.some((i: any) => i.actionType === 'OPENED')).length,
        converted: typeNotifs.filter((n: any) => n.interactions.some((i: any) => i.actionType === 'CONVERTED'))
          .length,
      }
    })
    return {
      period: {
        start: startDate,
        end: endDate,
      },
      global: {
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        totalConverted,
        engagementRate,
        optOutRate,
        avgResponseTime,
      },
      byChannel,
      byType,
    }
  }
  /**
   * Get metrics breakdown by channel
   */
  private async getChannelMetrics(notifications: any[]): Promise<ChannelMetrics[]> {
    const channels = [
      NotificationChannel.EMAIL,
      NotificationChannel.WHATSAPP,
      NotificationChannel.SMS,
      NotificationChannel.PUSH,
    ]
    return channels.map((channel) => {
      const channelNotifs = notifications.filter((n: any) => n.channel === channel)
      const sent = channelNotifs.length
      const delivered = channelNotifs.filter((n: any) =>
        n.interactions.some((i: any) => i.actionType === 'DELIVERED')
      ).length
      const opened = channelNotifs.filter((n: any) =>
        n.interactions.some((i: any) => i.actionType === 'OPENED')
      ).length
      const clicked = channelNotifs.filter((n: any) =>
        n.interactions.some((i: any) => i.actionType === 'CLICKED')
      ).length
      const failed = channelNotifs.filter((n: any) => n.status === 'FAILED').length
      const deliveryRate = sent > 0 ? delivered / sent : 0
      const openRate = sent > 0 ? opened / sent : 0
      const clickRate = sent > 0 ? clicked / sent : 0
      const avgResponseTime = this.calculateAverageResponseTime(channelNotifs)
      return {
        channel,
        sent,
        delivered,
        opened,
        clicked,
        failed,
        openRate,
        clickRate,
        deliveryRate,
        avgResponseTime,
      }
    })
  }
  /**
   * Calculate average response time in minutes
   */
  private calculateAverageResponseTime(notifications: any[]): number {
    const responseTimes: number[] = []
    notifications.forEach((notif) => {
      if (!notif.sentAt) return
      const firstInteraction = notif.interactions.find(
        (i: any) => i.actionType === 'OPENED' || i.actionType === 'CLICKED'
      )
      if (firstInteraction) {
        const responseTime =
          (new Date(firstInteraction.timestamp).getTime() - new Date(notif.sentAt).getTime()) /
          (1000 * 60)
        if (responseTime >= 0 && responseTime < 24 * 60) {
          responseTimes.push(responseTime)
        }
      }
    })
    if (responseTimes.length === 0) return 0
    return Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
  }
  /**
   * Get real-time dashboard metrics (last 24 hours)
   */
  async getDashboardMetrics(): Promise<any> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const now = new Date()
    const analytics = await this.getEngagementAnalytics({
      startDate: last24h,
      endDate: now,
    })
    // Get ML model accuracy
    const { mlService } = await import('./ml-service')
    const modelMetrics = await mlService.getModelAccuracy()
    // Get active users count
    const activeUsers = await prisma.user.count()
    // Get pending notifications
    const pendingCount = await prisma.notification.count({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
    })
    return {
      ...analytics,
      mlModel: modelMetrics,
      activeUsers,
      pendingNotifications: pendingCount,
      timestamp: now,
    }
  }
  /**
   * Create analytics snapshot for faster queries
   */
  async createDailySnapshot(date: Date): Promise<void> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    const analytics = await this.getEngagementAnalytics({
      startDate: startOfDay,
      endDate: endOfDay,
    })
    // Prepare channel metrics as JSON
    const emailMetrics = analytics.byChannel.find((c) => c.channel === NotificationChannel.EMAIL)
    const whatsappMetrics = analytics.byChannel.find((c) => c.channel === NotificationChannel.WHATSAPP)
    const smsMetrics = analytics.byChannel.find((c) => c.channel === NotificationChannel.SMS)
    const pushMetrics = analytics.byChannel.find((c) => c.channel === NotificationChannel.PUSH)
    await prisma.analyticsSnapshot.upsert({
      where: { date: startOfDay },
      create: {
        date: startOfDay,
        totalSent: analytics.global.totalSent,
        totalDelivered: analytics.global.totalDelivered,
        totalOpened: analytics.global.totalOpened,
        totalClicked: analytics.global.totalClicked,
        emailMetrics: emailMetrics || {},
        whatsappMetrics: whatsappMetrics || {},
        smsMetrics: smsMetrics || {},
        pushMetrics: pushMetrics || {},
        avgResponseTime: analytics.global.avgResponseTime,
        optOutRate: analytics.global.optOutRate,
      },
      update: {
        totalSent: analytics.global.totalSent,
        totalDelivered: analytics.global.totalDelivered,
        totalOpened: analytics.global.totalOpened,
        totalClicked: analytics.global.totalClicked,
        emailMetrics: emailMetrics || {},
        whatsappMetrics: whatsappMetrics || {},
        smsMetrics: smsMetrics || {},
        pushMetrics: pushMetrics || {},
        avgResponseTime: analytics.global.avgResponseTime,
        optOutRate: analytics.global.optOutRate,
      },
    })
  }
  /**
   * Export analytics report
   */
  async exportReport(
    format: 'CSV' | 'JSON',
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    const analytics = await this.getEngagementAnalytics({
      startDate,
      endDate,
    })
    if (format === 'JSON') {
      return JSON.stringify(analytics, null, 2)
    }
    // CSV format
    const lines: string[] = []
    // Global metrics
    lines.push('Metric,Value')
    lines.push(`Period Start,${startDate.toISOString()}`)
    lines.push(`Period End,${endDate.toISOString()}`)
    lines.push(`Total Sent,${analytics.global.totalSent}`)
    lines.push(`Total Delivered,${analytics.global.totalDelivered}`)
    lines.push(`Total Opened,${analytics.global.totalOpened}`)
    lines.push(`Total Clicked,${analytics.global.totalClicked}`)
    lines.push(`Total Converted,${analytics.global.totalConverted}`)
    lines.push(`Engagement Rate,${(analytics.global.engagementRate * 100).toFixed(2)}%`)
    lines.push(`Opt-Out Rate,${(analytics.global.optOutRate * 100).toFixed(2)}%`)
    lines.push(`Avg Response Time,${analytics.global.avgResponseTime} minutes`)
    // Channel metrics
    lines.push('')
    lines.push('Channel,Sent,Delivered,Opened,Clicked,Failed,Open Rate,Click Rate,Delivery Rate')
    analytics.byChannel.forEach((channel) => {
      lines.push(
        `${channel.channel},${channel.sent},${channel.delivered},${channel.opened},${channel.clicked},${channel.failed},${(channel.openRate * 100).toFixed(2)}%,${(channel.clickRate * 100).toFixed(2)}%,${(channel.deliveryRate * 100).toFixed(2)}%`
      )
    })
    return lines.join('\n')
  }
}
// Export singleton instance
export const analyticsService = new AnalyticsService()