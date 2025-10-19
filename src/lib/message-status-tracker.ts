/**
 * Message Status Tracker
 * Comprehensive tracking system for SendPulse message delivery status
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Message Status Types from SendPulse
 */
export enum MessageStatus {
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

/**
 * Message Status Update Payload
 */
export interface MessageStatusUpdate {
  messageId: string
  status: MessageStatus
  timestamp: Date
  errorCode?: string
  errorMessage?: string
  metadata?: Record<string, any>
}

/**
 * Message Status Record
 */
export interface MessageStatusRecord {
  id: string
  messageId: string
  conversationId: string
  status: MessageStatus
  previousStatus?: MessageStatus
  timestamp: Date
  errorCode?: string
  errorMessage?: string
  deliveryTime?: number // milliseconds from sent to delivered
  readTime?: number // milliseconds from delivered to read
  metadata?: Record<string, any>
  createdAt: Date
}

/**
 * Message Status Statistics
 */
export interface MessageStatusStats {
  total: number
  queued: number
  sending: number
  sent: number
  delivered: number
  read: number
  failed: number
  rejected: number
  expired: number
  averageDeliveryTime: number // milliseconds
  averageReadTime: number // milliseconds
  deliveryRate: number // percentage
  readRate: number // percentage
  failureRate: number // percentage
}

/**
 * Message Status Tracker Class
 */
export class MessageStatusTracker {
  /**
   * Update message status in database
   */
  async updateStatus(update: MessageStatusUpdate): Promise<MessageStatusRecord | null> {
    try {
      // Find the WhatsApp interaction by messageId
      const interaction = await prisma.whatsAppInteraction.findUnique({
        where: { messageId: update.messageId },
        include: {
          conversation: true
        }
      })

      if (!interaction) {
        console.warn(`[MessageStatus] Message not found: ${update.messageId}`)
        return null
      }

      // Calculate delivery and read times
      const deliveryTime = this.calculateDeliveryTime(interaction, update)
      const readTime = this.calculateReadTime(interaction, update)

      // Update interaction with extended metadata
      const currentMetadata = interaction.intent ? JSON.parse(interaction.intent) : {}
      const updatedMetadata = {
        ...currentMetadata,
        statusHistory: [
          ...(currentMetadata.statusHistory || []),
          {
            status: update.status,
            timestamp: update.timestamp,
            errorCode: update.errorCode,
            errorMessage: update.errorMessage
          }
        ],
        currentStatus: update.status,
        deliveryTime,
        readTime,
        lastStatusUpdate: update.timestamp,
        ...(update.metadata || {})
      }

      // Update the interaction
      await prisma.whatsAppInteraction.update({
        where: { id: interaction.id },
        data: {
          intent: JSON.stringify(updatedMetadata)
        }
      })

      // Return status record
      return {
        id: interaction.id,
        messageId: update.messageId,
        conversationId: interaction.conversationId,
        status: update.status,
        timestamp: update.timestamp,
        errorCode: update.errorCode,
        errorMessage: update.errorMessage,
        deliveryTime,
        readTime,
        metadata: update.metadata,
        createdAt: interaction.createdAt
      }
    } catch (error) {
      console.error('[MessageStatus] Error updating status:', error)
      throw error
    }
  }

  /**
   * Calculate delivery time (sent -> delivered)
   */
  private calculateDeliveryTime(
    interaction: any,
    update: MessageStatusUpdate
  ): number | undefined {
    if (update.status !== MessageStatus.DELIVERED) return undefined

    const sentTime = interaction.createdAt.getTime()
    const deliveredTime = update.timestamp.getTime()
    return deliveredTime - sentTime
  }

  /**
   * Calculate read time (delivered -> read)
   */
  private calculateReadTime(
    interaction: any,
    update: MessageStatusUpdate
  ): number | undefined {
    if (update.status !== MessageStatus.READ) return undefined

    try {
      const metadata = interaction.intent ? JSON.parse(interaction.intent) : {}
      const statusHistory = metadata.statusHistory || []
      const deliveredEntry = statusHistory.find((s: any) => s.status === MessageStatus.DELIVERED)

      if (!deliveredEntry) return undefined

      const deliveredTime = new Date(deliveredEntry.timestamp).getTime()
      const readTime = update.timestamp.getTime()
      return readTime - deliveredTime
    } catch {
      return undefined
    }
  }

  /**
   * Get message status history
   */
  async getStatusHistory(messageId: string): Promise<MessageStatusRecord[]> {
    try {
      const interaction = await prisma.whatsAppInteraction.findUnique({
        where: { messageId }
      })

      if (!interaction || !interaction.intent) {
        return []
      }

      const metadata = JSON.parse(interaction.intent)
      const statusHistory = metadata.statusHistory || []

      return statusHistory.map((entry: any, index: number) => ({
        id: `${interaction.id}_${index}`,
        messageId,
        conversationId: interaction.conversationId,
        status: entry.status,
        timestamp: new Date(entry.timestamp),
        errorCode: entry.errorCode,
        errorMessage: entry.errorMessage,
        deliveryTime: metadata.deliveryTime,
        readTime: metadata.readTime,
        metadata: entry,
        createdAt: interaction.createdAt
      }))
    } catch (error) {
      console.error('[MessageStatus] Error getting status history:', error)
      return []
    }
  }

  /**
   * Get message status statistics for a user
   */
  async getUserStats(userId: string, days: number = 30): Promise<MessageStatusStats> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const interactions = await prisma.whatsAppInteraction.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        }
      })

      const stats: MessageStatusStats = {
        total: interactions.length,
        queued: 0,
        sending: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        rejected: 0,
        expired: 0,
        averageDeliveryTime: 0,
        averageReadTime: 0,
        deliveryRate: 0,
        readRate: 0,
        failureRate: 0
      }

      if (stats.total === 0) return stats

      let totalDeliveryTime = 0
      let totalReadTime = 0
      let deliveryCount = 0
      let readCount = 0

      // Aggregate statistics
      interactions.forEach(interaction => {
        if (!interaction.intent) return

        try {
          const metadata = JSON.parse(interaction.intent)
          const currentStatus = metadata.currentStatus as MessageStatus

          // Count by status
          if (currentStatus) {
            stats[currentStatus] = (stats[currentStatus] || 0) + 1
          }

          // Aggregate timing data
          if (metadata.deliveryTime) {
            totalDeliveryTime += metadata.deliveryTime
            deliveryCount++
          }

          if (metadata.readTime) {
            totalReadTime += metadata.readTime
            readCount++
          }
        } catch {
          // Skip malformed metadata
        }
      })

      // Calculate averages and rates
      stats.averageDeliveryTime = deliveryCount > 0 ? totalDeliveryTime / deliveryCount : 0
      stats.averageReadTime = readCount > 0 ? totalReadTime / readCount : 0
      stats.deliveryRate = stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0
      stats.readRate = stats.delivered > 0 ? (stats.read / stats.delivered) * 100 : 0
      stats.failureRate = stats.total > 0 ? ((stats.failed + stats.rejected) / stats.total) * 100 : 0

      return stats
    } catch (error) {
      console.error('[MessageStatus] Error getting user stats:', error)
      throw error
    }
  }

  /**
   * Get global message status statistics
   */
  async getGlobalStats(days: number = 30): Promise<MessageStatusStats> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const interactions = await prisma.whatsAppInteraction.findMany({
        where: {
          createdAt: { gte: startDate }
        }
      })

      const stats: MessageStatusStats = {
        total: interactions.length,
        queued: 0,
        sending: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        rejected: 0,
        expired: 0,
        averageDeliveryTime: 0,
        averageReadTime: 0,
        deliveryRate: 0,
        readRate: 0,
        failureRate: 0
      }

      if (stats.total === 0) return stats

      let totalDeliveryTime = 0
      let totalReadTime = 0
      let deliveryCount = 0
      let readCount = 0

      // Aggregate statistics
      interactions.forEach(interaction => {
        if (!interaction.intent) return

        try {
          const metadata = JSON.parse(interaction.intent)
          const currentStatus = metadata.currentStatus as MessageStatus

          // Count by status
          if (currentStatus) {
            stats[currentStatus] = (stats[currentStatus] || 0) + 1
          }

          // Aggregate timing data
          if (metadata.deliveryTime) {
            totalDeliveryTime += metadata.deliveryTime
            deliveryCount++
          }

          if (metadata.readTime) {
            totalReadTime += metadata.readTime
            readCount++
          }
        } catch {
          // Skip malformed metadata
        }
      })

      // Calculate averages and rates
      stats.averageDeliveryTime = deliveryCount > 0 ? totalDeliveryTime / deliveryCount : 0
      stats.averageReadTime = readCount > 0 ? totalReadTime / readCount : 0
      stats.deliveryRate = stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0
      stats.readRate = stats.delivered > 0 ? (stats.read / stats.delivered) * 100 : 0
      stats.failureRate = stats.total > 0 ? ((stats.failed + stats.rejected) / stats.total) * 100 : 0

      return stats
    } catch (error) {
      console.error('[MessageStatus] Error getting global stats:', error)
      throw error
    }
  }

  /**
   * Get failed messages for retry
   */
  async getFailedMessages(hours: number = 24): Promise<MessageStatusRecord[]> {
    try {
      const startDate = new Date()
      startDate.setHours(startDate.getHours() - hours)

      const interactions = await prisma.whatsAppInteraction.findMany({
        where: {
          createdAt: { gte: startDate }
        },
        include: {
          conversation: true
        }
      })

      const failedMessages: MessageStatusRecord[] = []

      interactions.forEach(interaction => {
        if (!interaction.intent) return

        try {
          const metadata = JSON.parse(interaction.intent)
          const currentStatus = metadata.currentStatus as MessageStatus

          if (currentStatus === MessageStatus.FAILED || currentStatus === MessageStatus.REJECTED) {
            failedMessages.push({
              id: interaction.id,
              messageId: interaction.messageId,
              conversationId: interaction.conversationId,
              status: currentStatus,
              timestamp: new Date(metadata.lastStatusUpdate),
              errorCode: metadata.statusHistory?.[metadata.statusHistory.length - 1]?.errorCode,
              errorMessage: metadata.statusHistory?.[metadata.statusHistory.length - 1]?.errorMessage,
              metadata,
              createdAt: interaction.createdAt
            })
          }
        } catch {
          // Skip malformed metadata
        }
      })

      return failedMessages
    } catch (error) {
      console.error('[MessageStatus] Error getting failed messages:', error)
      throw error
    }
  }
}

// Singleton instance
export const messageStatusTracker = new MessageStatusTracker()
