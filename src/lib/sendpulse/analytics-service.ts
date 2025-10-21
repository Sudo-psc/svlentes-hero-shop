/**
 * SendPulse Analytics Service
 * Track conversation metrics, message statistics, and performance
 */
import type {
  ConversationMetrics,
  MessageMetrics,
  AnalyticsSummary,
  AnalyticsTimeframe,
  MessageType
} from './types'
export class AnalyticsService {
  private conversations: Map<string, ConversationMetrics> = new Map()
  private messageHistory: Array<{
    contactId: string
    type: MessageType | 'template'
    status: 'sent' | 'delivered' | 'read' | 'failed'
    timestamp: string
    direction: 'inbound' | 'outbound'
  }> = []
  private maxHistorySize = 10000
  /**
   * Track message sent
   */
  trackMessage(
    contactId: string,
    botId: string,
    type: MessageType | 'template',
    direction: 'inbound' | 'outbound' = 'outbound'
  ): void {
    const metrics = this.getOrCreateMetrics(contactId, botId)
    metrics.totalMessages++
    if (direction === 'outbound') {
      metrics.sentByBot++
    } else {
      metrics.sentByUser++
    }
    metrics.messagesByType[type] = (metrics.messagesByType[type] || 0) + 1
    metrics.lastActivity = new Date().toISOString()
    this.conversations.set(contactId, metrics)
    // Add to history
    this.addToHistory({
      contactId,
      type,
      status: 'sent',
      timestamp: new Date().toISOString(),
      direction
    })
  }
  /**
   * Update message status
   */
  updateMessageStatus(
    contactId: string,
    status: 'delivered' | 'read' | 'failed'
  ): void {
    const metrics = this.conversations.get(contactId)
    if (!metrics) return
    const total = metrics.sentByBot
    if (status === 'delivered') {
      const delivered = Math.min(total, metrics.sentByBot)
      metrics.deliveryRate = total > 0 ? (delivered / total) * 100 : 0
    } else if (status === 'read') {
      const read = Math.min(total, metrics.sentByBot)
      metrics.readRate = total > 0 ? (read / total) * 100 : 0
    } else if (status === 'failed') {
      const failed = 1
      metrics.failureRate = total > 0 ? (failed / total) * 100 : 0
    }
    this.conversations.set(contactId, metrics)
  }
  /**
   * Track response time
   */
  trackResponseTime(contactId: string, responseTimeMs: number): void {
    const metrics = this.conversations.get(contactId)
    if (!metrics) return
    // Calculate rolling average
    const totalMessages = metrics.sentByBot + metrics.sentByUser
    const currentAvg = metrics.averageResponseTime
    metrics.averageResponseTime =
      (currentAvg * (totalMessages - 1) + responseTimeMs) / totalMessages
    this.conversations.set(contactId, metrics)
  }
  /**
   * Get metrics for specific contact
   */
  getConversationMetrics(contactId: string): ConversationMetrics | null {
    return this.conversations.get(contactId) || null
  }
  /**
   * Get all conversation metrics
   */
  getAllMetrics(): ConversationMetrics[] {
    return Array.from(this.conversations.values())
  }
  /**
   * Get summary analytics for timeframe
   */
  getSummary(timeframe?: AnalyticsTimeframe): AnalyticsSummary {
    const start = timeframe?.start || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const end = timeframe?.end || new Date().toISOString()
    const filteredHistory = this.messageHistory.filter(msg =>
      msg.timestamp >= start && msg.timestamp <= end
    )
    const messageMetrics = this.calculateMessageMetrics(filteredHistory)
    const conversationMetrics = this.calculateConversationMetrics(start, end)
    return {
      timeframe: timeframe || {
        start,
        end,
        granularity: 'day'
      },
      conversations: conversationMetrics,
      messages: messageMetrics,
      contacts: {
        total: this.conversations.size,
        new: 0, // TODO: Track new vs returning
        active: Array.from(this.conversations.values()).filter(
          m => new Date(m.lastActivity) >= new Date(start)
        ).length,
        returning: 0
      },
      performance: {
        averageResponseTime: this.calculateAverageResponseTime(),
        deliveryRate: this.calculateAverageRate('deliveryRate'),
        readRate: this.calculateAverageRate('readRate'),
        failureRate: this.calculateAverageRate('failureRate')
      }
    }
  }
  /**
   * Calculate message metrics from history
   */
  private calculateMessageMetrics(history: typeof this.messageHistory): MessageMetrics {
    const byType: Record<MessageType | 'template', number> = {
      text: 0,
      image: 0,
      document: 0,
      interactive: 0,
      template: 0
    }
    const byHour: Record<string, number> = {}
    const byDay: Record<string, number> = {}
    let sent = 0, delivered = 0, read = 0, failed = 0
    history.forEach(msg => {
      byType[msg.type] = (byType[msg.type] || 0) + 1
      const hour = msg.timestamp.substring(0, 13) // YYYY-MM-DDTHH
      const day = msg.timestamp.substring(0, 10) // YYYY-MM-DD
      byHour[hour] = (byHour[hour] || 0) + 1
      byDay[day] = (byDay[day] || 0) + 1
      if (msg.status === 'sent') sent++
      else if (msg.status === 'delivered') delivered++
      else if (msg.status === 'read') read++
      else if (msg.status === 'failed') failed++
    })
    return {
      total: history.length,
      sent,
      delivered,
      read,
      failed,
      byType,
      byHour,
      byDay
    }
  }
  /**
   * Calculate conversation metrics
   */
  private calculateConversationMetrics(start: string, end: string): {
    total: number
    active: number
    closed: number
    averageDuration: number
  } {
    const conversations = Array.from(this.conversations.values())
    const activeConversations = conversations.filter(
      m => m.lastActivity >= start && m.lastActivity <= end
    )
    const totalDuration = conversations.reduce(
      (sum, m) => sum + m.conversationDuration,
      0
    )
    return {
      total: conversations.length,
      active: activeConversations.length,
      closed: conversations.length - activeConversations.length,
      averageDuration: conversations.length > 0 ? totalDuration / conversations.length : 0
    }
  }
  /**
   * Calculate average response time across all conversations
   */
  private calculateAverageResponseTime(): number {
    const metrics = Array.from(this.conversations.values())
    if (metrics.length === 0) return 0
    const total = metrics.reduce((sum, m) => sum + m.averageResponseTime, 0)
    return total / metrics.length
  }
  /**
   * Calculate average rate (delivery, read, failure) across conversations
   */
  private calculateAverageRate(
    rateType: 'deliveryRate' | 'readRate' | 'failureRate'
  ): number {
    const metrics = Array.from(this.conversations.values())
    if (metrics.length === 0) return 0
    const total = metrics.reduce((sum, m) => sum + m[rateType], 0)
    return total / metrics.length
  }
  /**
   * Get or create metrics for contact
   */
  private getOrCreateMetrics(contactId: string, botId: string): ConversationMetrics {
    let metrics = this.conversations.get(contactId)
    if (!metrics) {
      metrics = {
        contact_id: contactId,
        bot_id: botId,
        totalMessages: 0,
        sentByBot: 0,
        sentByUser: 0,
        averageResponseTime: 0,
        conversationDuration: 0,
        lastActivity: new Date().toISOString(),
        messagesByType: {
          text: 0,
          image: 0,
          document: 0,
          interactive: 0,
          template: 0
        },
        deliveryRate: 100,
        readRate: 0,
        failureRate: 0
      }
    }
    return metrics
  }
  /**
   * Add message to history
   */
  private addToHistory(message: typeof this.messageHistory[0]): void {
    this.messageHistory.push(message)
    // Limit history size
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift()
    }
  }
  /**
   * Clear all analytics data
   */
  clear(): void {
    this.conversations.clear()
    this.messageHistory = []
  }
  /**
   * Get analytics statistics
   */
  getStats(): {
    totalConversations: number
    totalMessages: number
    historySize: number
    oldestMessage: string | null
    newestMessage: string | null
  } {
    return {
      totalConversations: this.conversations.size,
      totalMessages: this.messageHistory.length,
      historySize: this.messageHistory.length,
      oldestMessage: this.messageHistory[0]?.timestamp || null,
      newestMessage: this.messageHistory[this.messageHistory.length - 1]?.timestamp || null
    }
  }
}
// Singleton instance
export const analyticsService = new AnalyticsService()