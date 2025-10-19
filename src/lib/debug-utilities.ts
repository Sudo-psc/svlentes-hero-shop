/**
 * Debugging Utilities for SendPulse Integration
 * Comprehensive debugging tools for message tracking and troubleshooting
 */

import { logger, LogCategory } from './logger'
import { messageStatusTracker, MessageStatus } from './message-status-tracker'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Debug Level
 */
export enum DebugLevel {
  MINIMAL = 'minimal',
  STANDARD = 'standard',
  VERBOSE = 'verbose',
  TRACE = 'trace'
}

/**
 * Message Flow Event
 */
export interface MessageFlowEvent {
  timestamp: Date
  stage: string
  status: string
  duration?: number
  data?: Record<string, any>
}

/**
 * Message Debug Info
 */
export interface MessageDebugInfo {
  messageId: string
  phone: string
  status: MessageStatus
  flowEvents: MessageFlowEvent[]
  totalDuration: number
  stages: {
    received?: Date
    processed?: Date
    sent?: Date
    delivered?: Date
    read?: Date
    failed?: Date
  }
  durations: {
    processing?: number
    delivery?: number
    readTime?: number
  }
  errorInfo?: {
    errorCode: string
    errorMessage: string
    timestamp: Date
  }
  metadata?: Record<string, any>
}

/**
 * Conversation Debug Info
 */
export interface ConversationDebugInfo {
  conversationId: string
  phone: string
  messageCount: number
  lastMessageAt: Date
  intents: string[]
  sentiments: string[]
  escalations: number
  tickets: number
  averageResponseTime: number
  messages: Array<{
    messageId: string
    timestamp: Date
    isFromCustomer: boolean
    intent?: string
    sentiment?: string
    escalated: boolean
  }>
}

/**
 * System Health Status
 */
export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'critical'
  checks: {
    database: boolean
    sendpulse: boolean
    langchain: boolean
  }
  metrics: {
    messagesLast24h: number
    failureRate: number
    averageDeliveryTime: number
    averageResponseTime: number
  }
  alerts: string[]
}

/**
 * Debug Utilities Class
 */
export class DebugUtilities {
  private debugLevel: DebugLevel = DebugLevel.STANDARD

  /**
   * Set debug level
   */
  setDebugLevel(level: DebugLevel): void {
    this.debugLevel = level
    logger.info(LogCategory.SYSTEM, `Debug level set to: ${level}`)
  }

  /**
   * Get comprehensive message debug info
   */
  async getMessageDebugInfo(messageId: string): Promise<MessageDebugInfo | null> {
    try {
      const timer = logger.startTimer()

      // Get message interaction
      const interaction = await prisma.whatsAppInteraction.findUnique({
        where: { messageId },
        include: {
          conversation: true,
          user: true
        }
      })

      if (!interaction) {
        logger.warn(LogCategory.WHATSAPP, `Message not found: ${messageId}`)
        return null
      }

      // Parse metadata
      const metadata = interaction.intent ? JSON.parse(interaction.intent) : {}
      const statusHistory = metadata.statusHistory || []

      // Build flow events
      const flowEvents: MessageFlowEvent[] = []

      flowEvents.push({
        timestamp: interaction.createdAt,
        stage: 'received',
        status: 'received',
        data: {
          phone: interaction.customerPhone,
          contentLength: interaction.content.length
        }
      })

      if (interaction.response) {
        flowEvents.push({
          timestamp: new Date(interaction.createdAt.getTime() + (interaction.processingTime || 0)),
          stage: 'processed',
          status: 'processed',
          duration: interaction.processingTime || undefined,
          data: {
            intent: interaction.intent,
            responseLength: interaction.response.length
          }
        })
      }

      statusHistory.forEach((statusEvent: any) => {
        flowEvents.push({
          timestamp: new Date(statusEvent.timestamp),
          stage: 'status_update',
          status: statusEvent.status,
          data: {
            errorCode: statusEvent.errorCode,
            errorMessage: statusEvent.errorMessage
          }
        })
      })

      // Calculate stages and durations
      const stages: MessageDebugInfo['stages'] = {
        received: interaction.createdAt
      }

      const durations: MessageDebugInfo['durations'] = {
        processing: interaction.processingTime || undefined
      }

      if (metadata.deliveryTime) {
        durations.delivery = metadata.deliveryTime
        stages.delivered = new Date(interaction.createdAt.getTime() + metadata.deliveryTime)
      }

      if (metadata.readTime) {
        durations.readTime = metadata.readTime
        stages.read = new Date((stages.delivered?.getTime() || interaction.createdAt.getTime()) + metadata.readTime)
      }

      // Get error info if failed
      const currentStatus = metadata.currentStatus as MessageStatus
      const errorInfo = (currentStatus === MessageStatus.FAILED || currentStatus === MessageStatus.REJECTED) ? {
        errorCode: statusHistory[statusHistory.length - 1]?.errorCode || 'unknown',
        errorMessage: statusHistory[statusHistory.length - 1]?.errorMessage || 'No error message',
        timestamp: new Date(statusHistory[statusHistory.length - 1]?.timestamp)
      } : undefined

      const debugInfo: MessageDebugInfo = {
        messageId,
        phone: interaction.customerPhone,
        status: currentStatus || MessageStatus.SENT,
        flowEvents,
        totalDuration: Date.now() - interaction.createdAt.getTime(),
        stages,
        durations,
        errorInfo,
        metadata
      }

      const duration = timer()
      logger.debug(LogCategory.WHATSAPP, `Message debug info retrieved in ${duration}ms`, { messageId })

      return debugInfo
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Error getting message debug info', error as Error, { messageId })
      throw error
    }
  }

  /**
   * Get conversation debug info
   */
  async getConversationDebugInfo(phone: string): Promise<ConversationDebugInfo | null> {
    try {
      const timer = logger.startTimer()

      // Get conversation
      const conversation = await prisma.whatsAppConversation.findUnique({
        where: { customerPhone: phone },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 100
          }
        }
      })

      if (!conversation) {
        logger.warn(LogCategory.WHATSAPP, `Conversation not found for phone: ${phone}`)
        return null
      }

      // Collect intents and sentiments
      const intents = new Set<string>()
      const sentiments = new Set<string>()
      let escalations = 0
      let tickets = 0
      let totalResponseTime = 0
      let responseCount = 0

      const messages = conversation.messages.map(msg => {
        if (msg.intent) intents.add(msg.intent)
        if (msg.sentiment) sentiments.add(msg.sentiment)
        if (msg.escalationRequired) escalations++
        if (msg.ticketCreated) tickets++

        // Calculate response time if available
        if (!msg.isFromCustomer && msg.processingTime) {
          totalResponseTime += msg.processingTime
          responseCount++
        }

        return {
          messageId: msg.messageId,
          timestamp: msg.createdAt,
          isFromCustomer: msg.isFromCustomer,
          intent: msg.intent || undefined,
          sentiment: msg.sentiment || undefined,
          escalated: msg.escalationRequired
        }
      })

      const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0

      const debugInfo: ConversationDebugInfo = {
        conversationId: conversation.id,
        phone,
        messageCount: conversation.messageCount,
        lastMessageAt: conversation.lastMessageAt,
        intents: Array.from(intents),
        sentiments: Array.from(sentiments),
        escalations,
        tickets,
        averageResponseTime,
        messages
      }

      const duration = timer()
      logger.debug(LogCategory.WHATSAPP, `Conversation debug info retrieved in ${duration}ms`, { phone })

      return debugInfo
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Error getting conversation debug info', error as Error, { phone })
      throw error
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealthStatus> {
    try {
      const timer = logger.startTimer()
      const alerts: string[] = []

      // Check database
      let databaseHealthy = false
      try {
        await prisma.$queryRaw`SELECT 1`
        databaseHealthy = true
      } catch (error) {
        alerts.push('Database connection failed')
        logger.error(LogCategory.DATABASE, 'Database health check failed', error as Error)
      }

      // Check SendPulse (basic check)
      const sendpulseHealthy = true // TODO: Implement actual SendPulse health check

      // Check LangChain (basic check)
      const langchainHealthy = true // TODO: Implement actual LangChain health check

      // Get metrics from last 24 hours
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const messagesLast24h = await prisma.whatsAppInteraction.count({
        where: {
          createdAt: { gte: yesterday }
        }
      })

      // Get failure rate
      const stats = await messageStatusTracker.getGlobalStats(1)
      const failureRate = stats.failureRate

      // Determine overall status
      let status: 'healthy' | 'degraded' | 'critical' = 'healthy'
      if (!databaseHealthy) {
        status = 'critical'
      } else if (failureRate > 10) {
        status = 'degraded'
        alerts.push(`High failure rate: ${failureRate.toFixed(2)}%`)
      } else if (stats.averageDeliveryTime > 5000) {
        status = 'degraded'
        alerts.push(`Slow delivery times: ${stats.averageDeliveryTime.toFixed(0)}ms`)
      }

      const healthStatus: SystemHealthStatus = {
        status,
        checks: {
          database: databaseHealthy,
          sendpulse: sendpulseHealthy,
          langchain: langchainHealthy
        },
        metrics: {
          messagesLast24h,
          failureRate,
          averageDeliveryTime: stats.averageDeliveryTime,
          averageResponseTime: 0 // TODO: Calculate from interactions
        },
        alerts
      }

      const duration = timer()
      logger.info(LogCategory.SYSTEM, `System health check completed in ${duration}ms`, { status })

      return healthStatus
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Error getting system health', error as Error)
      throw error
    }
  }

  /**
   * Trace webhook processing
   */
  async traceWebhookProcessing(webhookData: any, source: string = 'sendpulse'): Promise<void> {
    if (this.debugLevel === DebugLevel.MINIMAL) return

    logger.debug(LogCategory.WEBHOOK, `Webhook received from ${source}`, {
      source,
      dataKeys: Object.keys(webhookData),
      dataSize: JSON.stringify(webhookData).length
    })

    if (this.debugLevel === DebugLevel.VERBOSE || this.debugLevel === DebugLevel.TRACE) {
      logger.debug(LogCategory.WEBHOOK, 'Full webhook payload', {
        payload: webhookData
      })
    }
  }

  /**
   * Trace message processing pipeline
   */
  async traceMessageProcessing(
    stage: string,
    data: Record<string, any>,
    duration?: number
  ): Promise<void> {
    if (this.debugLevel === DebugLevel.MINIMAL) return

    logger.debug(LogCategory.WHATSAPP, `Message processing: ${stage}`, {
      stage,
      duration,
      ...data
    })
  }

  /**
   * Generate debug report for a message
   */
  async generateMessageReport(messageId: string): Promise<string> {
    const debugInfo = await this.getMessageDebugInfo(messageId)

    if (!debugInfo) {
      return `Message ${messageId} not found`
    }

    let report = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 MESSAGE DEBUG REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Message ID: ${debugInfo.messageId}
Phone: ${debugInfo.phone}
Current Status: ${debugInfo.status}
Total Duration: ${debugInfo.totalDuration}ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 STAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`

    if (debugInfo.stages.received) {
      report += `✅ Received: ${debugInfo.stages.received.toISOString()}\n`
    }
    if (debugInfo.stages.processed) {
      report += `✅ Processed: ${debugInfo.stages.processed.toISOString()} (${debugInfo.durations.processing}ms)\n`
    }
    if (debugInfo.stages.sent) {
      report += `✅ Sent: ${debugInfo.stages.sent.toISOString()}\n`
    }
    if (debugInfo.stages.delivered) {
      report += `✅ Delivered: ${debugInfo.stages.delivered.toISOString()} (${debugInfo.durations.delivery}ms)\n`
    }
    if (debugInfo.stages.read) {
      report += `✅ Read: ${debugInfo.stages.read.toISOString()} (${debugInfo.durations.readTime}ms)\n`
    }
    if (debugInfo.stages.failed) {
      report += `❌ Failed: ${debugInfo.stages.failed.toISOString()}\n`
    }

    report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 FLOW EVENTS (${debugInfo.flowEvents.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`

    debugInfo.flowEvents.forEach((event, index) => {
      report += `${index + 1}. [${event.timestamp.toISOString()}] ${event.stage} → ${event.status}`
      if (event.duration) {
        report += ` (${event.duration}ms)`
      }
      report += '\n'
    })

    if (debugInfo.errorInfo) {
      report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ ERROR DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Error Code: ${debugInfo.errorInfo.errorCode}
Error Message: ${debugInfo.errorInfo.errorMessage}
Timestamp: ${debugInfo.errorInfo.timestamp.toISOString()}
`
    }

    report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`

    return report
  }

  /**
   * Generate conversation report
   */
  async generateConversationReport(phone: string): Promise<string> {
    const debugInfo = await this.getConversationDebugInfo(phone)

    if (!debugInfo) {
      return `Conversation for phone ${phone} not found`
    }

    let report = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 CONVERSATION DEBUG REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phone: ${debugInfo.phone}
Conversation ID: ${debugInfo.conversationId}
Message Count: ${debugInfo.messageCount}
Last Message: ${debugInfo.lastMessageAt.toISOString()}
Average Response Time: ${debugInfo.averageResponseTime.toFixed(0)}ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 STATISTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Unique Intents: ${debugInfo.intents.length}
${debugInfo.intents.map(i => `  • ${i}`).join('\n')}

Sentiments: ${debugInfo.sentiments.length}
${debugInfo.sentiments.map(s => `  • ${s}`).join('\n')}

Escalations: ${debugInfo.escalations}
Tickets Created: ${debugInfo.tickets}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 RECENT MESSAGES (${Math.min(10, debugInfo.messages.length)})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`

    debugInfo.messages.slice(0, 10).forEach((msg, index) => {
      const direction = msg.isFromCustomer ? '📥' : '📤'
      const escalated = msg.escalated ? ' 🚨' : ''
      report += `${index + 1}. ${direction} [${msg.timestamp.toISOString()}] ${msg.messageId}${escalated}\n`
      if (msg.intent) {
        report += `   Intent: ${msg.intent}\n`
      }
      if (msg.sentiment) {
        report += `   Sentiment: ${msg.sentiment}\n`
      }
    })

    report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`

    return report
  }
}

// Singleton instance
export const debugUtilities = new DebugUtilities()
