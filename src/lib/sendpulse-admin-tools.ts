/**
 * SendPulse Administrative Tools using MCP
 *
 * High-level administrative operations for:
 * - Bot analytics and monitoring
 * - Subscriber management
 * - Troubleshooting and diagnostics
 * - Bulk operations
 *
 * Uses MCP SendPulse client for advanced operations
 * not easily achievable with direct API
 */

import { mcpSendPulseClient } from './mcp-sendpulse-client'
import { logger, LogCategory } from './logger'

export interface BotHealthReport {
  botId: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  metrics: {
    totalSubscribers: number
    activeConversations: number
    messagesLast24h: number
    deliveryRate: number
  }
  issues: string[]
  recommendations: string[]
  timestamp: string
}

export interface SubscriberInsight {
  subscriberId: string
  phone: string
  name?: string
  status: 'active' | 'blocked' | 'inactive'
  conversationWindow: 'open' | 'closed'
  lastInteraction?: string
  variables: Record<string, any>
  tags: string[]
  engagement: {
    totalMessages: number
    lastMessageDate?: string
    avgResponseTime?: number
  }
}

export interface TroubleshootingReport {
  phone: string
  issue: string
  diagnosis: {
    botAccessible: boolean
    subscriberExists: boolean
    conversationWindowOpen: boolean
    blockedByUser: boolean
  }
  recommendations: string[]
  mcpAvailable: boolean
  timestamp: string
}

/**
 * SendPulse Admin Tools
 */
export class SendPulseAdminTools {
  /**
   * Check if MCP tools are available
   */
  async checkMCPAvailability(): Promise<boolean> {
    if (!mcpSendPulseClient.isAvailable()) {
      logger.warn(LogCategory.SENDPULSE, 'MCP SendPulse not configured')
      return false
    }

    try {
      const tools = await mcpSendPulseClient.listTools()
      logger.info(LogCategory.SENDPULSE, `MCP available with ${tools.length} tools`)
      return tools.length > 0
    } catch (error) {
      logger.error(LogCategory.SENDPULSE, 'MCP availability check failed', {
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return false
    }
  }

  /**
   * Get comprehensive bot health report
   */
  async getBotHealthReport(botId: string): Promise<BotHealthReport> {
    const issues: string[] = []
    const recommendations: string[] = []

    try {
      // Get bot statistics via MCP
      const stats = await mcpSendPulseClient.getBotStats(botId)

      if (!stats) {
        issues.push('Unable to fetch bot statistics')
        return {
          botId,
          status: 'unhealthy',
          metrics: {
            totalSubscribers: 0,
            activeConversations: 0,
            messagesLast24h: 0,
            deliveryRate: 0
          },
          issues,
          recommendations: ['Check bot configuration in SendPulse dashboard'],
          timestamp: new Date().toISOString()
        }
      }

      // Parse metrics
      const metrics = {
        totalSubscribers: stats.subscribers_count || 0,
        activeConversations: stats.active_conversations || 0,
        messagesLast24h: stats.messages_24h || 0,
        deliveryRate: stats.delivery_rate || 0
      }

      // Health assessment
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

      if (metrics.deliveryRate < 0.5) {
        status = 'unhealthy'
        issues.push('Very low delivery rate (<50%)')
        recommendations.push('Check WhatsApp Business account status')
        recommendations.push('Verify phone number is not blocked')
      } else if (metrics.deliveryRate < 0.8) {
        status = 'degraded'
        issues.push('Moderate delivery rate (50-80%)')
        recommendations.push('Monitor message templates approval status')
      }

      if (metrics.totalSubscribers === 0) {
        issues.push('No subscribers found')
        recommendations.push('Promote WhatsApp number to attract subscribers')
      }

      if (metrics.messagesLast24h === 0) {
        issues.push('No messages sent in last 24 hours')
        recommendations.push('Check if bot workflows are active')
      }

      return {
        botId,
        status,
        metrics,
        issues,
        recommendations,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      logger.error(LogCategory.SENDPULSE, 'Failed to get bot health report', {
        botId,
        error: error instanceof Error ? error.message : 'Unknown'
      })

      return {
        botId,
        status: 'unhealthy',
        metrics: {
          totalSubscribers: 0,
          activeConversations: 0,
          messagesLast24h: 0,
          deliveryRate: 0
        },
        issues: ['MCP unavailable - cannot fetch statistics'],
        recommendations: ['Use direct API for basic operations', 'Check MCP configuration'],
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Get detailed subscriber insights
   */
  async getSubscriberInsight(
    botId: string,
    phone: string
  ): Promise<SubscriberInsight | null> {
    try {
      // Search for subscriber
      const subscribers = await mcpSendPulseClient.searchSubscribers({
        bot_id: botId,
        filter: { phone },
        limit: 1
      })

      if (subscribers.length === 0) {
        logger.warn(LogCategory.SENDPULSE, 'Subscriber not found', { phone })
        return null
      }

      const sub = subscribers[0]

      return {
        subscriberId: sub.id,
        phone: sub.phone,
        name: sub.name,
        status: sub.is_blocked ? 'blocked' : (sub.is_active ? 'active' : 'inactive'),
        conversationWindow: sub.is_chat_opened ? 'open' : 'closed',
        lastInteraction: sub.last_interaction_at,
        variables: sub.variables || {},
        tags: sub.tags || [],
        engagement: {
          totalMessages: sub.messages_count || 0,
          lastMessageDate: sub.last_message_at,
          avgResponseTime: sub.avg_response_time
        }
      }

    } catch (error) {
      logger.error(LogCategory.SENDPULSE, 'Failed to get subscriber insight', {
        phone,
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return null
    }
  }

  /**
   * Troubleshoot message delivery issues
   */
  async troubleshootDelivery(
    botId: string,
    phone: string,
    issueDescription: string
  ): Promise<TroubleshootingReport> {
    const mcpAvailable = mcpSendPulseClient.isAvailable()

    if (!mcpAvailable) {
      return {
        phone,
        issue: issueDescription,
        diagnosis: {
          botAccessible: false,
          subscriberExists: false,
          conversationWindowOpen: false,
          blockedByUser: false
        },
        recommendations: [
          'MCP not configured - limited troubleshooting',
          'Check direct API logs',
          'Verify phone number format',
          'Check SendPulse dashboard manually'
        ],
        mcpAvailable: false,
        timestamp: new Date().toISOString()
      }
    }

    try {
      // Use MCP troubleshooting
      const result = await mcpSendPulseClient.troubleshootDelivery({
        bot_id: botId,
        phone
      })

      const diagnosis = {
        botAccessible: !!result.botStatus,
        subscriberExists: result.subscriberExists,
        conversationWindowOpen: result.subscriberStatus?.is_chat_opened || false,
        blockedByUser: result.subscriberStatus?.is_blocked || false
      }

      return {
        phone,
        issue: issueDescription,
        diagnosis,
        recommendations: result.recommendations,
        mcpAvailable: true,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      logger.error(LogCategory.SENDPULSE, 'Troubleshooting failed', {
        phone,
        error: error instanceof Error ? error.message : 'Unknown'
      })

      return {
        phone,
        issue: issueDescription,
        diagnosis: {
          botAccessible: false,
          subscriberExists: false,
          conversationWindowOpen: false,
          blockedByUser: false
        },
        recommendations: ['Troubleshooting failed - check logs'],
        mcpAvailable: true,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Bulk update subscriber variables (e.g., for segmentation)
   */
  async bulkUpdateSubscribers(
    botId: string,
    filters: Record<string, any>,
    variables: Record<string, any>
  ): Promise<{
    total: number
    updated: number
    failed: number
    errors: string[]
  }> {
    const errors: string[] = []
    let updated = 0
    let failed = 0

    try {
      // Get subscribers matching filter
      const subscribers = await mcpSendPulseClient.searchSubscribers({
        bot_id: botId,
        filter: filters,
        limit: 1000
      })

      const total = subscribers.length

      logger.info(LogCategory.SENDPULSE, `Bulk updating ${total} subscribers`, {
        botId,
        filters,
        variables
      })

      // Update each subscriber
      for (const sub of subscribers) {
        try {
          const success = await mcpSendPulseClient.updateSubscriberVariables(
            sub.id,
            variables
          )

          if (success) {
            updated++
          } else {
            failed++
            errors.push(`Failed to update subscriber ${sub.id}`)
          }

        } catch (error) {
          failed++
          errors.push(`Error updating ${sub.id}: ${error instanceof Error ? error.message : 'Unknown'}`)
        }
      }

      logger.info(LogCategory.SENDPULSE, 'Bulk update completed', {
        total,
        updated,
        failed
      })

      return { total, updated, failed, errors }

    } catch (error) {
      logger.error(LogCategory.SENDPULSE, 'Bulk update failed', {
        error: error instanceof Error ? error.message : 'Unknown'
      })

      return {
        total: 0,
        updated: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Get analytics report using MCP
   */
  async getAnalyticsReport(
    botId: string,
    dateRange?: { from: string; to: string }
  ): Promise<any> {
    try {
      return await mcpSendPulseClient.getAnalytics(botId, dateRange)
    } catch (error) {
      logger.error(LogCategory.SENDPULSE, 'Failed to get analytics report', {
        botId,
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return null
    }
  }

  /**
   * Export subscribers for reporting
   */
  async exportSubscribersReport(
    botId: string,
    filters?: Record<string, any>
  ): Promise<any[]> {
    try {
      return await mcpSendPulseClient.exportSubscribers(botId, filters)
    } catch (error) {
      logger.error(LogCategory.SENDPULSE, 'Failed to export subscribers', {
        botId,
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return []
    }
  }
}

// Singleton instance
export const sendPulseAdminTools = new SendPulseAdminTools()
