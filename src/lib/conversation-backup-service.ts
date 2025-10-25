/**
 * Conversation Backup Service
 * Serviço para backup redundante de conversas no Airtable
 */

import { airtableClient, AirtableConversationRecord, AirtableInteractionRecord } from '@/lib/airtable-client'
import { logger, LogCategory } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

export interface BackupResult {
  success: boolean
  airtableId?: string
  error?: string
  fallbackUsed: boolean
}

export class ConversationBackupService {
  private backupQueue: Map<string, any> = new Map()
  private isProcessingQueue: boolean = false

  /**
   * Backup conversation to Airtable
   */
  async backupConversation(conversationData: any): Promise<BackupResult> {
    try {
      // Check if Airtable is configured
      if (!airtableClient.isConfigured()) {
        return {
          success: false,
          error: 'Airtable not configured',
          fallbackUsed: false
        }
      }

      const record: AirtableConversationRecord = {
        fields: {
          ConversationId: conversationData.id,
          CustomerPhone: conversationData.customerPhone,
          CustomerName: conversationData.customerName || '',
          Status: this.mapStatus(conversationData.status),
          StartedAt: conversationData.startedAt?.toISOString() || new Date().toISOString(),
          LastActivity: conversationData.lastActivity?.toISOString() || new Date().toISOString(),
          MessageCount: conversationData.messageCount || 0,
          Intent: conversationData.intent || '',
          Sentiment: conversationData.sentiment || '',
          Priority: conversationData.priority || 'MEDIUM',
          AssignedAgent: conversationData.assignedAgentId || '',
          Tags: JSON.stringify(conversationData.tags || []),
          Metadata: JSON.stringify(conversationData.metadata || {}),
          CreatedAt: conversationData.createdAt?.toISOString() || new Date().toISOString(),
          UpdatedAt: new Date().toISOString()
        }
      }

      const result = await airtableClient.createConversation(record)

      if (result) {
        logger.info(LogCategory.SYSTEM, 'Conversation backed up to Airtable successfully', {
          conversationId: conversationData.id,
          airtableId: result.id
        })

        return {
          success: true,
          airtableId: result.id,
          fallbackUsed: false
        }
      }

      return {
        success: false,
        error: 'Failed to create Airtable record',
        fallbackUsed: false
      }

    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Error backing up conversation to Airtable', {
        error: error instanceof Error ? error.message : 'Unknown error',
        conversationId: conversationData.id
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackUsed: false
      }
    }
  }

  /**
   * Backup interaction to Airtable
   */
  async backupInteraction(interactionData: any): Promise<BackupResult> {
    try {
      if (!airtableClient.isConfigured()) {
        return {
          success: false,
          error: 'Airtable not configured',
          fallbackUsed: false
        }
      }

      const record: AirtableInteractionRecord = {
        fields: {
          InteractionId: interactionData.id,
          ConversationId: interactionData.conversationId,
          MessageId: interactionData.messageId,
          Direction: interactionData.direction || 'inbound',
          Content: interactionData.content,
          Intent: interactionData.intent || '',
          Response: interactionData.response || '',
          ProcessingTime: interactionData.processingTime || 0,
          Status: interactionData.status || 'sent',
          ErrorMessage: interactionData.errorMessage || '',
          Timestamp: interactionData.timestamp?.toISOString() || new Date().toISOString(),
          CreatedAt: interactionData.createdAt?.toISOString() || new Date().toISOString()
        }
      }

      const result = await airtableClient.createInteraction(record)

      if (result) {
        return {
          success: true,
          airtableId: result.id,
          fallbackUsed: false
        }
      }

      return {
        success: false,
        error: 'Failed to create Airtable interaction',
        fallbackUsed: false
      }

    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Error backing up interaction to Airtable', {
        error: error instanceof Error ? error.message : 'Unknown error',
        interactionId: interactionData.id
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackUsed: false
      }
    }
  }

  /**
   * Fallback: Store interaction when database is unavailable
   */
  async storeInteractionFallback(interactionData: any): Promise<BackupResult> {
    try {
      logger.warn(LogCategory.SYSTEM, 'Using Airtable fallback for interaction storage', {
        interactionId: interactionData.id
      })

      // Try to store in Airtable
      const airtableResult = await this.backupInteraction(interactionData)

      if (airtableResult.success) {
        // Queue for later sync to primary database
        this.backupQueue.set(interactionData.id, {
          type: 'interaction',
          data: interactionData,
          airtableId: airtableResult.airtableId,
          timestamp: new Date()
        })

        // Start background sync if not already running
        this.startBackgroundSync()

        return {
          success: true,
          airtableId: airtableResult.airtableId,
          fallbackUsed: true
        }
      }

      // If Airtable also fails, store in memory queue
      this.backupQueue.set(interactionData.id, {
        type: 'interaction',
        data: interactionData,
        timestamp: new Date(),
        retries: 0
      })

      return {
        success: true,
        fallbackUsed: true,
        error: 'Stored in memory queue for retry'
      }

    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Fallback storage failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackUsed: true
      }
    }
  }

  /**
   * Fallback: Store conversation when database is unavailable
   */
  async storeConversationFallback(conversationData: any): Promise<BackupResult> {
    try {
      logger.warn(LogCategory.SYSTEM, 'Using Airtable fallback for conversation storage', {
        conversationId: conversationData.id
      })

      const airtableResult = await this.backupConversation(conversationData)

      if (airtableResult.success) {
        this.backupQueue.set(conversationData.id, {
          type: 'conversation',
          data: conversationData,
          airtableId: airtableResult.airtableId,
          timestamp: new Date()
        })

        this.startBackgroundSync()

        return {
          success: true,
          airtableId: airtableResult.airtableId,
          fallbackUsed: true
        }
      }

      this.backupQueue.set(conversationData.id, {
        type: 'conversation',
        data: conversationData,
        timestamp: new Date(),
        retries: 0
      })

      return {
        success: true,
        fallbackUsed: true,
        error: 'Stored in queue for retry'
      }

    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Fallback conversation storage failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackUsed: true
      }
    }
  }

  /**
   * Recover conversation from Airtable
   */
  async recoverConversation(conversationId: string): Promise<any | null> {
    try {
      const airtableRecord = await airtableClient.findConversation(conversationId)

      if (!airtableRecord) {
        return null
      }

      logger.info(LogCategory.SYSTEM, 'Recovered conversation from Airtable', {
        conversationId,
        airtableId: airtableRecord.id
      })

      return {
        id: airtableRecord.fields.ConversationId,
        customerPhone: airtableRecord.fields.CustomerPhone,
        customerName: airtableRecord.fields.CustomerName,
        status: airtableRecord.fields.Status,
        startedAt: new Date(airtableRecord.fields.StartedAt),
        lastActivity: new Date(airtableRecord.fields.LastActivity),
        messageCount: airtableRecord.fields.MessageCount,
        intent: airtableRecord.fields.Intent,
        sentiment: airtableRecord.fields.Sentiment,
        priority: airtableRecord.fields.Priority,
        tags: JSON.parse(airtableRecord.fields.Tags || '[]'),
        metadata: JSON.parse(airtableRecord.fields.Metadata || '{}'),
        source: 'airtable_recovery'
      }

    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to recover conversation from Airtable', {
        error: error instanceof Error ? error.message : 'Unknown error',
        conversationId
      })
      return null
    }
  }

  /**
   * Recover conversation history from Airtable
   */
  async recoverConversationHistory(conversationId: string): Promise<any[]> {
    try {
      const interactions = await airtableClient.getConversationInteractions(conversationId)

      return interactions.map(record => ({
        id: record.fields.InteractionId,
        conversationId: record.fields.ConversationId,
        messageId: record.fields.MessageId,
        direction: record.fields.Direction,
        content: record.fields.Content,
        intent: record.fields.Intent,
        response: record.fields.Response,
        processingTime: record.fields.ProcessingTime,
        status: record.fields.Status,
        timestamp: new Date(record.fields.Timestamp),
        source: 'airtable_recovery'
      }))

    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to recover conversation history from Airtable', {
        error: error instanceof Error ? error.message : 'Unknown error',
        conversationId
      })
      return []
    }
  }

  /**
   * Start background sync process
   */
  private startBackgroundSync(): void {
    if (this.isProcessingQueue) {
      return
    }

    this.isProcessingQueue = true

    // Process queue every 5 minutes
    setTimeout(() => this.processBackupQueue(), 5 * 60 * 1000)
  }

  /**
   * Process backup queue - sync back to primary database
   */
  private async processBackupQueue(): Promise<void> {
    try {
      if (this.backupQueue.size === 0) {
        this.isProcessingQueue = false
        return
      }

      logger.info(LogCategory.SYSTEM, 'Processing backup queue', {
        queueSize: this.backupQueue.size
      })

      const entries = Array.from(this.backupQueue.entries())

      for (const [id, item] of entries) {
        try {
          // Try to sync back to primary database
          if (item.type === 'conversation') {
            await this.syncConversationToDatabase(item.data)
          } else if (item.type === 'interaction') {
            await this.syncInteractionToDatabase(item.data)
          }

          // Remove from queue if successful
          this.backupQueue.delete(id)

          logger.info(LogCategory.SYSTEM, 'Synced backup item to database', {
            id,
            type: item.type
          })

        } catch (error) {
          // Increment retry counter
          item.retries = (item.retries || 0) + 1

          if (item.retries > 3) {
            logger.error(LogCategory.SYSTEM, 'Max retries reached for backup item', {
              id,
              type: item.type,
              retries: item.retries
            })
            this.backupQueue.delete(id)
          }
        }
      }

      // Schedule next run
      setTimeout(() => this.processBackupQueue(), 5 * 60 * 1000)

    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Error processing backup queue', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      this.isProcessingQueue = false
    }
  }

  /**
   * Sync conversation back to primary database
   */
  private async syncConversationToDatabase(conversationData: any): Promise<void> {
    try {
      await prisma.whatsAppConversation.upsert({
        where: { id: conversationData.id },
        create: conversationData,
        update: conversationData
      })
    } catch (error) {
      throw new Error(`Failed to sync conversation: ${error}`)
    }
  }

  /**
   * Sync interaction back to primary database
   */
  private async syncInteractionToDatabase(interactionData: any): Promise<void> {
    try {
      await prisma.whatsAppInteraction.upsert({
        where: { id: interactionData.id },
        create: interactionData,
        update: interactionData
      })
    } catch (error) {
      throw new Error(`Failed to sync interaction: ${error}`)
    }
  }

  /**
   * Map status to Airtable format
   */
  private mapStatus(status: string): 'active' | 'closed' | 'escalated' {
    if (status === 'ESCALATED') return 'escalated'
    if (status === 'CLOSED') return 'closed'
    return 'active'
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): { size: number; items: any[] } {
    return {
      size: this.backupQueue.size,
      items: Array.from(this.backupQueue.values()).map(item => ({
        type: item.type,
        timestamp: item.timestamp,
        retries: item.retries || 0,
        hasAirtableId: !!item.airtableId
      }))
    }
  }
}

// Singleton instance
export const conversationBackupService = new ConversationBackupService()
