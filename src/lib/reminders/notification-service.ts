// Core Notification Service for Intelligent Reminder System
import { prisma } from '@/lib/prisma'
import {
  type NotificationPayload,
  type NotificationSendResult,
  NotificationChannel,
  NotificationStatus,
  InteractionType,
} from '@/types/reminders'
/**
 * Notification Service
 * Handles creation, scheduling, and sending of notifications across multiple channels
 */
export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(payload: NotificationPayload): Promise<string> {
    const notification = await prisma.notification.create({
      data: {
        userId: payload.userId,
        channel: payload.channel,
        type: payload.type,
        subject: payload.subject,
        content: payload.content,
        metadata: payload.metadata || {},
        scheduledAt: payload.scheduledAt,
        status: NotificationStatus.SCHEDULED,
      },
    })
    return notification.id
  }
  /**
   * Send a notification through specified channel
   */
  async sendNotification(notificationId: string): Promise<NotificationSendResult> {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
        include: { user: true },
      })
      if (!notification) {
        throw new Error('Notification not found')
      }
      // Update status to SENDING
      await this.updateNotificationStatus(notificationId, NotificationStatus.SENDING)
      // Send through appropriate channel
      let success = false
      let error: string | undefined
      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          success = await this.sendEmail(notification)
          break
        case NotificationChannel.WHATSAPP:
          success = await this.sendWhatsApp(notification)
          break
        case NotificationChannel.SMS:
          success = await this.sendSMS(notification)
          break
        case NotificationChannel.PUSH:
          success = await this.sendPush(notification)
          break
        default:
          throw new Error(`Unsupported channel: ${notification.channel}`)
      }
      // Update notification status
      const newStatus = success ? NotificationStatus.SENT : NotificationStatus.FAILED
      await this.updateNotificationStatus(
        notificationId,
        newStatus,
        success ? new Date() : undefined,
        error
      )
      // Record interaction
      if (success) {
        await this.recordInteraction(notificationId, notification.userId, InteractionType.SENT)
      }
      return {
        success,
        notificationId,
        channel: notification.channel,
        status: newStatus,
        sentAt: success ? new Date() : undefined,
        error,
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error'
      await this.updateNotificationStatus(notificationId, NotificationStatus.FAILED, undefined, error)
      return {
        success: false,
        notificationId,
        channel: NotificationChannel.EMAIL,
        status: NotificationStatus.FAILED,
        error,
      }
    }
  }
  /**
   * Send email notification
   */
  private async sendEmail(notification: any): Promise<boolean> {
    try {
      // Import email service dynamically to avoid circular dependencies
      const { sendEmail } = await import('@/lib/email')
      const result = await sendEmail({
        to: notification.user.email,
        subject: notification.subject || 'Notification',
        html: notification.content,
      })
      return result && 'id' in result
    } catch (error) {
      console.error('Email send failed:', error)
      return false
    }
  }
  /**
   * Send WhatsApp notification via SendPulse
   */
  private async sendWhatsApp(notification: any): Promise<boolean> {
    try {
      const { sendPulseClient } = await import('@/lib/sendpulse-client')
      const phone = notification.user.whatsapp || notification.user.phone || notification.metadata?.phone
      if (!phone) {
        throw new Error('Phone number not available')
      }
      const quickReplies = notification.metadata?.quickReplies || []
      const result = await sendPulseClient.sendMessageWithQuickReplies({
        phone,
        message: notification.content,
        quickReplies
      })
      return result && !result.error
    } catch (error) {
      console.error('WhatsApp send failed:', error)
      return false
    }
  }
  /**
   * Send SMS notification via SendPulse
   */
  private async sendSMS(notification: any): Promise<boolean> {
    try {
      const { sendPulseClient } = await import('@/lib/sendpulse-client')
      const phone = notification.user.phone || notification.metadata?.phone
      if (!phone) {
        throw new Error('Phone number not available')
      }
      const result = await sendPulseClient.sendMessage({
        phone,
        message: notification.content
      })
      return result && !result.error
    } catch (error) {
      console.error('SMS send failed:', error)
      return false
    }
  }
  /**
   * Send push notification
   */
  private async sendPush(notification: any): Promise<boolean> {
    try {
      const { sendPushNotification } = await import('@/lib/firebase-push')
      const token = notification.metadata?.pushToken
      if (!token) {
        throw new Error('Push token not available')
      }
      const result = await sendPushNotification({
        token,
        title: notification.subject || 'Notification',
        body: notification.content,
        data: notification.metadata || {},
        userId: notification.userId,
        type: 'transactional'
      })
      return result.success
    } catch (error) {
      console.error('Push send failed:', error)
      return false
    }
  }
  /**
   * Update notification status
   */
  async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
    sentAt?: Date,
    errorMessage?: string
  ): Promise<void> {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status,
        sentAt,
        errorMessage,
        updatedAt: new Date(),
      },
    })
  }
  /**
   * Record user interaction with notification
   */
  async recordInteraction(
    notificationId: string,
    userId: string,
    actionType: InteractionType,
    metadata?: Record<string, any>
  ): Promise<void> {
    await prisma.interaction.create({
      data: {
        notificationId,
        userId,
        actionType,
        metadata: metadata || {},
      },
    })
    // Update notification status based on interaction
    if (actionType === InteractionType.DELIVERED) {
      await this.updateNotificationStatus(notificationId, NotificationStatus.DELIVERED, undefined)
    } else if (actionType === InteractionType.OPENED) {
      await this.updateNotificationStatus(notificationId, NotificationStatus.OPENED, undefined)
    } else if (actionType === InteractionType.CLICKED) {
      await this.updateNotificationStatus(notificationId, NotificationStatus.CLICKED, undefined)
    }
  }
  /**
   * Get notifications by user
   */
  async getNotificationsByUser(userId: string, limit = 50): Promise<any[]> {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { scheduledAt: 'desc' },
      take: limit,
      include: {
        interactions: {
          orderBy: { timestamp: 'desc' },
        },
      },
    })
  }
  /**
   * Get scheduled notifications ready to send
   */
  async getScheduledNotifications(limit = 100): Promise<any[]> {
    return prisma.notification.findMany({
      where: {
        status: NotificationStatus.SCHEDULED,
        scheduledAt: {
          lte: new Date(),
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: limit,
    })
  }
  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.CANCELLED,
        updatedAt: new Date(),
      },
    })
  }
  /**
   * Get notification by ID
   */
  async getNotification(notificationId: string): Promise<any> {
    return prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        user: true,
        interactions: {
          orderBy: { timestamp: 'desc' },
        },
      },
    })
  }
}
// Export singleton instance
export const notificationService = new NotificationService()