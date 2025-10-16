/**
 * LangGraph Memory Manager
 * Manages conversation history and state persistence for WhatsApp conversations
 */

import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages'

interface ConversationMemory {
  customerPhone: string
  messages: BaseMessage[]
  metadata: {
    startedAt: Date
    lastMessageAt: Date
    messageCount: number
    customerName?: string
    escalated: boolean
  }
}

/**
 * In-memory conversation store
 * In production, this should be replaced with a database (Redis, PostgreSQL, etc.)
 */
class ConversationMemoryManager {
  private conversations: Map<string, ConversationMemory>
  private maxMessagesPerConversation: number
  private conversationTimeoutMs: number

  constructor(maxMessages: number = 50, timeoutHours: number = 24) {
    this.conversations = new Map()
    this.maxMessagesPerConversation = maxMessages
    this.conversationTimeoutMs = timeoutHours * 60 * 60 * 1000

    // Cleanup old conversations periodically
    this.startCleanupInterval()
  }

  /**
   * Get conversation history for a customer
   */
  getConversation(customerPhone: string): BaseMessage[] {
    const conversation = this.conversations.get(customerPhone)

    if (!conversation) {
      return []
    }

    // Check if conversation has expired
    const now = new Date()
    const lastMessageTime = conversation.metadata.lastMessageAt.getTime()
    const timeSinceLastMessage = now.getTime() - lastMessageTime

    if (timeSinceLastMessage > this.conversationTimeoutMs) {
      // Conversation expired, start fresh
      this.conversations.delete(customerPhone)
      return []
    }

    return conversation.messages
  }

  /**
   * Add a message to conversation history
   */
  addMessage(customerPhone: string, message: BaseMessage, customerName?: string): void {
    let conversation = this.conversations.get(customerPhone)

    if (!conversation) {
      conversation = {
        customerPhone,
        messages: [],
        metadata: {
          startedAt: new Date(),
          lastMessageAt: new Date(),
          messageCount: 0,
          customerName,
          escalated: false,
        },
      }
      this.conversations.set(customerPhone, conversation)
    }

    // Add message
    conversation.messages.push(message)
    conversation.metadata.lastMessageAt = new Date()
    conversation.metadata.messageCount++

    // Update customer name if provided
    if (customerName && !conversation.metadata.customerName) {
      conversation.metadata.customerName = customerName
    }

    // Trim messages if exceeding limit
    if (conversation.messages.length > this.maxMessagesPerConversation) {
      conversation.messages = conversation.messages.slice(-this.maxMessagesPerConversation)
    }
  }

  /**
   * Add user message to conversation
   */
  addUserMessage(customerPhone: string, content: string, customerName?: string): void {
    this.addMessage(customerPhone, new HumanMessage(content), customerName)
  }

  /**
   * Add AI response to conversation
   */
  addAIMessage(customerPhone: string, content: string): void {
    this.addMessage(customerPhone, new AIMessage(content))
  }

  /**
   * Mark conversation as escalated
   */
  markAsEscalated(customerPhone: string): void {
    const conversation = this.conversations.get(customerPhone)
    if (conversation) {
      conversation.metadata.escalated = true
    }
  }

  /**
   * Check if conversation is escalated
   */
  isEscalated(customerPhone: string): boolean {
    const conversation = this.conversations.get(customerPhone)
    return conversation?.metadata.escalated || false
  }

  /**
   * Get conversation metadata
   */
  getMetadata(customerPhone: string) {
    const conversation = this.conversations.get(customerPhone)
    return conversation?.metadata
  }

  /**
   * Clear conversation history for a customer
   */
  clearConversation(customerPhone: string): void {
    this.conversations.delete(customerPhone)
  }

  /**
   * Get conversation summary for logging/analytics
   */
  getConversationSummary(customerPhone: string): string {
    const conversation = this.conversations.get(customerPhone)
    if (!conversation) {
      return 'No conversation found'
    }

    const { metadata, messages } = conversation
    const duration = new Date().getTime() - metadata.startedAt.getTime()
    const durationMinutes = Math.round(duration / 60000)

    return `
Conversation Summary:
- Customer: ${metadata.customerName || customerPhone}
- Started: ${metadata.startedAt.toISOString()}
- Duration: ${durationMinutes} minutes
- Messages: ${metadata.messageCount}
- Escalated: ${metadata.escalated ? 'Yes' : 'No'}
- Last ${Math.min(5, messages.length)} messages:
${messages
  .slice(-5)
  .map((msg, i) => {
    const role = msg instanceof HumanMessage ? 'User' : 'AI'
    const content = msg.content.toString().slice(0, 100)
    return `  ${i + 1}. ${role}: ${content}...`
  })
  .join('\n')}
    `.trim()
  }

  /**
   * Get all active conversations count
   */
  getActiveConversationsCount(): number {
    const now = new Date()
    let count = 0

    for (const conversation of this.conversations.values()) {
      const lastMessageTime = conversation.metadata.lastMessageAt.getTime()
      const timeSinceLastMessage = now.getTime() - lastMessageTime

      if (timeSinceLastMessage <= this.conversationTimeoutMs) {
        count++
      }
    }

    return count
  }

  /**
   * Start cleanup interval to remove old conversations
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupOldConversations()
    }, 60 * 60 * 1000) // Run every hour
  }

  /**
   * Cleanup old conversations
   */
  private cleanupOldConversations(): void {
    const now = new Date()
    const phonesToDelete: string[] = []

    for (const [phone, conversation] of this.conversations.entries()) {
      const lastMessageTime = conversation.metadata.lastMessageAt.getTime()
      const timeSinceLastMessage = now.getTime() - lastMessageTime

      if (timeSinceLastMessage > this.conversationTimeoutMs) {
        phonesToDelete.push(phone)
      }
    }

    for (const phone of phonesToDelete) {
      this.conversations.delete(phone)
    }

    if (phonesToDelete.length > 0) {
      console.log(`Cleaned up ${phonesToDelete.length} old conversations`)
    }
  }

  /**
   * Export conversation history (for backup/analysis)
   */
  exportConversation(customerPhone: string): any {
    const conversation = this.conversations.get(customerPhone)
    if (!conversation) {
      return null
    }

    return {
      customerPhone: conversation.customerPhone,
      metadata: conversation.metadata,
      messages: conversation.messages.map((msg) => ({
        role: msg instanceof HumanMessage ? 'user' : 'assistant',
        content: msg.content,
        timestamp: new Date(),
      })),
    }
  }

  /**
   * Get statistics about memory usage
   */
  getStats() {
    const now = new Date()
    let totalMessages = 0
    let escalatedCount = 0
    let recentConversations = 0

    for (const conversation of this.conversations.values()) {
      totalMessages += conversation.metadata.messageCount

      if (conversation.metadata.escalated) {
        escalatedCount++
      }

      const lastMessageTime = conversation.metadata.lastMessageAt.getTime()
      const hoursSinceLastMessage = (now.getTime() - lastMessageTime) / (60 * 60 * 1000)

      if (hoursSinceLastMessage <= 1) {
        recentConversations++
      }
    }

    return {
      totalConversations: this.conversations.size,
      activeConversations: this.getActiveConversationsCount(),
      recentConversations,
      escalatedConversations: escalatedCount,
      totalMessages,
      averageMessagesPerConversation: totalMessages / Math.max(1, this.conversations.size),
    }
  }
}

// Export singleton instance
export const conversationMemory = new ConversationMemoryManager()
