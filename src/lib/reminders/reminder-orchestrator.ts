// Reminder Orchestrator - Brings together all services for intelligent notifications

import { notificationService } from './notification-service'
import { mlService } from './ml-service'
import { behaviorService } from './behavior-service'
import {
  type CreateReminderInput,
  type NotificationSendResult,
  NotificationChannel,
  InteractionType,
} from '@/types/reminders'

/**
 * Reminder Orchestrator
 * High-level service that coordinates notification creation, ML predictions, and sending
 */
export class ReminderOrchestrator {
  /**
   * Create and schedule an intelligent reminder
   * Uses ML to optimize channel and timing
   */
  async createIntelligentReminder(input: CreateReminderInput): Promise<string> {
    // Check if we should send notification based on fatigue
    const shouldSend = await mlService.shouldSendNotification(input.userId)
    
    if (!shouldSend) {
      throw new Error('User fatigue score too high - notification skipped')
    }

    // Get channel selection with ML
    let channel: NotificationChannel
    let scheduledAt: Date

    if (input.preferredChannel) {
      // User preference overrides ML
      channel = input.preferredChannel
      scheduledAt = input.scheduledAt || new Date()
    } else {
      // Use ML prediction
      const channelSelection = await mlService.selectChannelWithFallback(input.userId)
      channel = channelSelection.primary

      // Get optimal timing
      const prediction = await mlService.predictOptimalChannel(input.userId)
      scheduledAt = input.scheduledAt || prediction.time
    }

    // Create notification
    const notificationId = await notificationService.createNotification({
      userId: input.userId,
      channel,
      type: input.type,
      subject: input.subject,
      content: input.content,
      metadata: input.metadata,
      scheduledAt,
    })

    return notificationId
  }

  /**
   * Send notification with fallback support
   */
  async sendWithFallback(notificationId: string): Promise<NotificationSendResult> {
    const notification = await notificationService.getNotification(notificationId)
    
    if (!notification) {
      throw new Error('Notification not found')
    }

    // Try primary channel
    let result = await notificationService.sendNotification(notificationId)

    // If failed and delivery rate is low, try fallback
    if (!result.success) {
      const channelSelection = await mlService.selectChannelWithFallback(notification.userId)
      
      if (channelSelection.fallback.length > 0) {
        // Try first fallback channel
        const fallbackChannel = channelSelection.fallback[0]
        
        // Create new notification with fallback channel
        const fallbackId = await notificationService.createNotification({
          userId: notification.userId,
          channel: fallbackChannel,
          type: notification.type,
          subject: notification.subject,
          content: notification.content,
          metadata: {
            ...notification.metadata,
            originalNotificationId: notificationId,
            isFallback: true,
          },
          scheduledAt: new Date(),
        })

        result = await notificationService.sendNotification(fallbackId)
      }
    }

    return result
  }

  /**
   * Process scheduled notifications (called by cron/scheduler)
   */
  async processScheduledNotifications(limit = 100): Promise<number> {
    const scheduled = await notificationService.getScheduledNotifications(limit)
    
    let processed = 0

    for (const notification of scheduled) {
      try {
        await this.sendWithFallback(notification.id)
        processed++
      } catch (error) {
        console.error(`Failed to process notification ${notification.id}:`, error)
      }
    }

    return processed
  }

  /**
   * Handle notification interaction (webhook callback)
   */
  async handleInteraction(
    notificationId: string,
    userId: string,
    actionType: InteractionType,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Record interaction
    await notificationService.recordInteraction(notificationId, userId, actionType, metadata)

    // Update user behavior
    await behaviorService.updateUserBehavior(userId)

    // Adjust fatigue score
    if (actionType === InteractionType.OPENED || actionType === InteractionType.CLICKED) {
      await behaviorService.decreaseFatigueScore(userId)
    } else if (actionType === InteractionType.DISMISSED || actionType === InteractionType.OPTED_OUT) {
      await behaviorService.incrementFatigueScore(userId)
    }
  }

  /**
   * Batch create reminders for multiple users
   */
  async createBatchReminders(
    userIds: string[],
    content: string,
    type: CreateReminderInput['type'],
    metadata?: Record<string, any>
  ): Promise<string[]> {
    const notificationIds: string[] = []

    for (const userId of userIds) {
      try {
        const id = await this.createIntelligentReminder({
          userId,
          type,
          content,
          metadata,
        })
        notificationIds.push(id)
      } catch (error) {
        console.error(`Failed to create reminder for user ${userId}:`, error)
      }
    }

    return notificationIds
  }

  /**
   * Get user notification history
   */
  async getUserHistory(userId: string, limit = 50) {
    return notificationService.getNotificationsByUser(userId, limit)
  }

  /**
   * Cancel scheduled reminder
   */
  async cancelReminder(notificationId: string): Promise<void> {
    return notificationService.cancelNotification(notificationId)
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: Record<string, any>): Promise<void> {
    const { prisma } = await import('@/lib/prisma')
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences,
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<any> {
    const { prisma } = await import('@/lib/prisma')
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    })

    return user?.preferences || {}
  }
}

// Export singleton instance
export const reminderOrchestrator = new ReminderOrchestrator()
