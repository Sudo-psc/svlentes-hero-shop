/**
 * LangChain Memory System for WhatsApp Bot
 *
 * Provides persistent conversation memory and context management
 * with LangSmith integration for observability and learning
 */
import { BaseMemory, InputValues, OutputValues } from '@langchain/core/memory'
import { BaseSimpleMessageHistory } from '@langchain/core/chat_history'
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages'
import { getLangSmithConfig, getLangSmithRunConfig } from './langsmith-config'
import { logger, LogCategory } from './logger'
import { prisma } from './prisma'
import { WhatsAppInteraction } from '@prisma/client'
export interface BotMemoryEntry {
  id: string
  sessionId: string
  userId?: string
  phone: string
  timestamp: Date
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: {
    intent?: string
    sentiment?: string
    urgency?: string
    confidence?: number
    escalationRequired?: boolean
    ticketCreated?: boolean
    responseTime?: number
    llmModel?: string
    tokensUsed?: number
    cost?: number
  }
  embedding?: number[]
  summary?: string
  tags: string[]
}
export interface ConversationSummary {
  sessionId: string
  userId?: string
  phone: string
  summary: string
  keyTopics: string[]
  sentiment: string
  resolution: string
  actionItems: string[]
  followUpRequired: boolean
  lastInteraction: Date
  totalInteractions: number
  satisfactionRating?: number
}
export interface PersistentMemoryConfig {
  maxMessages: number
  maxSessions: number
  retentionDays: number
  enableEmbeddings: boolean
  enableSummarization: boolean
  compressionThreshold: number
}
/**
 * Advanced persistent memory system for WhatsApp bot
 */
// Simple message history class to avoid LangChain compatibility issues
class SimpleMessageHistory {
  private messages: (HumanMessage | AIMessage | SystemMessage)[] = []
  async addMessage(message: HumanMessage | AIMessage | SystemMessage): Promise<void> {
    this.messages.push(message)
  }
  async getMessageHistory(): Promise<(HumanMessage | AIMessage | SystemMessage)[]> {
    return [...this.messages]
  }
  clear(): void {
    this.messages = []
  }
}
export class LangChainBotMemory extends BaseMemory {
  private history: Map<string, SimpleMessageHistory> = new Map()
  private summaries: Map<string, ConversationSummary> = new Map()
  private config: PersistentMemoryConfig
  private langsmithConfig: any
  constructor(config: Partial<PersistentMemoryConfig> = {}) {
    super()
    this.config = {
      maxMessages: 50,
      maxSessions: 1000,
      retentionDays: 90,
      enableEmbeddings: false, // Disable to avoid complexity
      enableSummarization: true,
      compressionThreshold: 20,
      ...config
    }
    this.langsmithConfig = getLangSmithConfig()
    logger.info(LogCategory.WHATSAPP, 'LangChain Bot Memory initialized', {
      config: this.config,
      langsmithEnabled: this.langsmithConfig.tracingEnabled
    })
  }
  // Required by BaseMemory
  memoryKeys = ['chat_history', 'conversation_summary', 'key_topics', 'sentiment']
  /**
   * Load conversation history for a session
   */
  async loadSession(sessionId: string): Promise<SimpleMessageHistory> {
    try {
      if (this.history.has(sessionId)) {
        return this.history.get(sessionId)!
      }
      const history = new SimpleMessageHistory()
      // Load from database
      const session = await prisma.chatbotSession.findUnique({
        where: { sessionToken: sessionId },
        include: {
          conversation: {
            include: {
              messages: {
                orderBy: { createdAt: 'asc' },
                take: this.config.maxMessages
              }
            }
          }
        }
      })
      if (session?.conversation?.messages) {
        for (const msg of session.conversation.messages) {
          if (msg.isFromCustomer) {
            await history.addMessage(new HumanMessage(msg.content))
          } else {
            await history.addMessage(new AIMessage(msg.response || msg.content))
          }
        }
      }
      this.history.set(sessionId, history)
      logger.debug(LogCategory.WHATSAPP, 'Session loaded', {
        sessionId,
        messageCount: session?.conversation?.messages?.length || 0
      })
      return history
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error loading session', {
        sessionId,
        errorMessage: error instanceof Error ? error.message : 'Unknown'
      })
      // Return empty history on error
      const emptyHistory = new SimpleMessageHistory()
      this.history.set(sessionId, emptyHistory)
      return emptyHistory
    }
  }
  /**
   * Save conversation interaction with full metadata
   */
  async saveInteraction(
    sessionId: string,
    userMessage: string,
    aiResponse: string,
    metadata: BotMemoryEntry['metadata']
  ): Promise<void> {
    try {
      const history = await this.loadSession(sessionId)
      // Add to memory
      await history.addMessage(new HumanMessage(userMessage))
      await history.addMessage(new AIMessage(aiResponse))
      // Check if we need to compress/summarize
      const messageCount = await history.getMessageHistory()
      if (messageCount.length >= this.config.compressionThreshold && this.config.enableSummarization) {
        await this.compressHistory(sessionId)
      }
      // Store in database with enhanced metadata
      await this.storeInteractionInDB(sessionId, userMessage, aiResponse, metadata)
      // Log to LangSmith
      if (this.langsmithConfig.tracingEnabled) {
        await this.logToLangSmith(sessionId, userMessage, aiResponse, metadata)
      }
      // Update session activity
      await this.updateSessionActivity(sessionId)
      logger.debug(LogCategory.WHATSAPP, 'Interaction saved', {
        sessionId,
        intent: metadata.intent,
        sentiment: metadata.sentiment,
        responseTime: metadata.responseTime
      })
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error saving interaction', {
        sessionId,
        errorMessage: error instanceof Error ? error.message : 'Unknown'
      })
    }
  }
  /**
   * Store interaction in database with full context
   */
  private async storeInteractionInDB(
    sessionId: string,
    userMessage: string,
    aiResponse: string,
    metadata: BotMemoryEntry['metadata']
  ): Promise<void> {
    const session = await prisma.chatbotSession.findUnique({
      where: { sessionToken: sessionId },
      include: { user: true }
    })
    if (!session) return
    // Store the interaction
    await prisma.whatsAppInteraction.create({
      data: {
        conversationId: session.conversationId || undefined,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerPhone: session.phone,
        userId: session.userId,
        content: userMessage,
        isFromCustomer: true,
        intent: metadata.intent,
        sentiment: metadata.sentiment,
        urgency: metadata.urgency,
        response: aiResponse,
        escalationRequired: metadata.escalationRequired || false,
        ticketCreated: metadata.ticketCreated || false,
        llmModel: metadata.llmModel,
        processingTime: metadata.responseTime
      }
    })
  }
  /**
   * Log detailed interaction to LangSmith
   */
  private async logToLangSmith(
    sessionId: string,
    userMessage: string,
    aiResponse: string,
    metadata: BotMemoryEntry['metadata']
  ): Promise<void> {
    try {
      const runConfig = getLangSmithRunConfig({
        sessionId,
        userId: metadata.userId,
        intent: metadata.intent,
        sentiment: metadata.sentiment,
        responseTime: metadata.responseTime,
        confidence: metadata.confidence,
        tags: ['whatsapp-bot', 'memory-storage', metadata.intent || 'unknown']
      })
      // Create detailed log entry
      const logEntry = {
        sessionId,
        timestamp: new Date().toISOString(),
        userMessage: userMessage.substring(0, 500),
        aiResponse: aiResponse.substring(0, 500),
        metadata: {
          intent: metadata.intent,
          sentiment: metadata.sentiment,
          urgency: metadata.urgency,
          confidence: metadata.confidence,
          escalationRequired: metadata.escalationRequired,
          ticketCreated: metadata.ticketCreated,
          responseTime: metadata.responseTime,
          llmModel: metadata.llmModel,
          tokensUsed: metadata.tokensUsed,
          estimatedCost: metadata.cost
        }
      }
      // Store in LangSmith via custom logging
      logger.info(LogCategory.WHATSAPP, 'LangSmith log entry created', {
        sessionId,
        logEntrySize: JSON.stringify(logEntry).length
      });
      logger.info(LogCategory.WHATSAPP, 'Interaction logged to LangSmith', {
        sessionId,
        intent: metadata.intent,
        confidence: metadata.confidence
      })
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error logging to LangSmith', {
        sessionId,
        errorMessage: error instanceof Error ? error.message : 'Unknown'
      })
    }
  }
  /**
   * Compress old conversation history into summary
   */
  private async compressHistory(sessionId: string): Promise<void> {
    try {
      const history = this.history.get(sessionId)
      if (!history) return
      const messages = await history.getMessageHistory()
      if (messages.length < this.config.compressionThreshold) return
      // Keep only recent messages
      const recentMessages = messages.slice(-this.config.maxMessages / 2)
      // Create summary of older messages
      const oldMessages = messages.slice(0, messages.length - recentMessages.length)
      const summary = await this.createConversationSummary(oldMessages)
      // Store summary
      this.summaries.set(sessionId, summary)
      // Update history with recent messages only
      const newHistory = new SimpleMessageHistory()
      if (summary) {
        await newHistory.addMessage(new SystemMessage(
          `Resumo anterior: ${summary.summary}\nTópicos: ${summary.keyTopics.join(', ')}`
        ))
      }
      for (const msg of recentMessages) {
        await newHistory.addMessage(msg)
      }
      this.history.set(sessionId, newHistory)
      logger.info(LogCategory.WHATSAPP, 'History compressed', {
        sessionId,
        originalCount: messages.length,
        compressedCount: recentMessages.length,
        hasSummary: !!summary
      })
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error compressing history', {
        sessionId,
        errorMessage: error instanceof Error ? error.message : 'Unknown'
      })
    }
  }
  /**
   * Create conversation summary from messages
   */
  private async createConversationSummary(messages: any[]): Promise<ConversationSummary | null> {
    try {
      const userMessages = messages.filter(m => m.getType() === 'human')
      const aiMessages = messages.filter(m => m.getType() === 'ai')
      if (userMessages.length === 0) return null
      // Extract key information
      const topics = this.extractTopics(userMessages)
      const sentiments = this.extractSentiments(messages)
      const actions = this.extractActionItems(messages)
      return {
        sessionId: '', // Will be set by caller
        phone: '',
        summary: `Conversa com ${userMessages.length} mensagens trocadas. Tópicos principais: ${topics.join(', ')}`,
        keyTopics: topics,
        sentiment: sentiments.dominant,
        resolution: 'ongoing',
        actionItems: actions,
        followUpRequired: actions.length > 0,
        lastInteraction: new Date(),
        totalInteractions: messages.length
      }
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error creating summary', {
        errorMessage: error instanceof Error ? error.message : 'Unknown'
      })
      return null
    }
  }
  /**
   * Extract key topics from messages
   */
  private extractTopics(messages: any[]): string[] {
    const topics: string[] = []
    const keywords = [
      'assinatura', 'pagamento', 'entrega', 'produto', 'consulta', 'pausar',
      'cancelar', 'reativar', 'endereço', 'troca', 'reembolso', 'suporte'
    ]
    for (const msg of messages) {
      const content = msg.content.toLowerCase()
      for (const keyword of keywords) {
        if (content.includes(keyword) && !topics.includes(keyword)) {
          topics.push(keyword)
        }
      }
    }
    return topics
  }
  /**
   * Extract sentiment analysis from messages
   */
  private extractSentiments(messages: any[]): { dominant: string; distribution: Record<string, number> } {
    const distribution: Record<string, number> = { positive: 0, negative: 0, neutral: 0 }
    for (const msg of messages) {
      // Simple sentiment detection - in production, use proper NLP
      const content = msg.content.toLowerCase()
      if (content.includes('obrigado') || content.includes('bom') || content.includes('ótimo')) {
        distribution.positive++
      } else if (content.includes('problema') || content.includes('erro') || content.includes('ruim')) {
        distribution.negative++
      } else {
        distribution.neutral++
      }
    }
    const dominant = Object.entries(distribution).reduce((a, b) =>
      distribution[a[0] as keyof typeof distribution] > distribution[b[0] as keyof typeof distribution] ? a : b
    )[0]
    return { dominant, distribution }
  }
  /**
   * Extract action items from messages
   */
  private extractActionItems(messages: any[]): string[] {
    const actions: string[] = []
    const actionPatterns = [
      /pausar\s+assinatura/i,
      /cancelar\s+assinatura/i,
      /alterar\s+endereço/i,
      /agendar\s+consulta/i,
      /rastrear\s+pedido/i,
      /falar\s+com\s+atendente/i
    ]
    for (const msg of messages) {
      for (const pattern of actionPatterns) {
        const match = msg.content.match(pattern)
        if (match && !actions.includes(match[0])) {
          actions.push(match[0])
        }
      }
    }
    return actions
  }
  /**
   * Update session activity timestamp
   */
  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      await prisma.chatbotSession.update({
        where: { sessionToken: sessionId },
        data: {
          lastActivityAt: new Date(),
          status: 'ACTIVE'
        }
      })
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error updating session activity', {
        sessionId,
        errorMessage: error instanceof Error ? error.message : 'Unknown'
      })
    }
  }
  /**
   * Get conversation context for AI processing
   */
  async getContext(sessionId: string): Promise<{
    history: string[]
    summary?: ConversationSummary
    metadata: any
  }> {
    try {
      const history = await this.loadSession(sessionId)
      const messages = await history.getMessageHistory()
      const summary = this.summaries.get(sessionId)
      // Convert messages to string format
      const historyStrings = messages.map(msg => {
        const role = msg.getType() === 'human' ? 'User' : 'Assistant'
        return `${role}: ${msg.content}`
      })
      return {
        history: historyStrings,
        summary,
        metadata: {
          messageCount: messages.length,
          hasSummary: !!summary,
          sessionId
        }
      }
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error getting context', {
        sessionId,
        errorMessage: error instanceof Error ? error.message : 'Unknown'
      })
      return {
        history: [],
        metadata: { sessionId, error: true }
      }
    }
  }
  /**
   * Clear old sessions and cleanup memory
   */
  async cleanup(): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)
      // Clean old sessions from database
      const deletedSessions = await prisma.chatbotSession.deleteMany({
        where: {
          lastActivityAt: { lt: cutoffDate },
          status: 'EXPIRED'
        }
      })
      // Clear memory cache for old sessions
      for (const sessionId of Array.from(this.history.keys())) {
        const session = await prisma.chatbotSession.findUnique({
          where: { sessionToken: sessionId }
        })
        if (!session || session.lastActivityAt < cutoffDate) {
          this.history.delete(sessionId)
          this.summaries.delete(sessionId)
        }
      }
      logger.info(LogCategory.WHATSAPP, 'Memory cleanup completed', {
        deletedSessions: deletedSessions.count,
        cutoffDate: cutoffDate.toISOString()
      })
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error during cleanup', {
        error: error instanceof Error ? error.message : 'Unknown'
      })
    }
  }
  // Required BaseMemory methods
  async loadMemoryVariables(values: InputValues): Promise<OutputValues> {
    const sessionId = values.sessionId || 'default'
    const context = await this.getContext(sessionId)
    return {
      chat_history: context.history,
      conversation_summary: context.summary?.summary,
      key_topics: context.summary?.keyTopics || [],
      sentiment: context.summary?.sentiment
    }
  }
  async saveContext(values: InputValues, newValues: OutputValues): Promise<void> {
    // Implementation depends on specific use case
    // Typically called at the end of a conversation turn
  }
  /**
   * Get memory statistics for monitoring
   */
  async getStats(): Promise<any> {
    try {
      const totalSessions = await prisma.chatbotSession.count()
      const activeSessions = await prisma.chatbotSession.count({
        where: { status: 'ACTIVE' }
      })
      const totalInteractions = await prisma.whatsAppInteraction.count()
      const cacheSize = this.history.size
      return {
        totalSessions,
        activeSessions,
        totalInteractions,
        cachedSessions: cacheSize,
        cachedSummaries: this.summaries.size,
        config: this.config
      }
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error getting memory stats', {
        errorMessage: error instanceof Error ? error.message : 'Unknown'
      })
      return null
    }
  }
}
// Singleton instance
export const botMemory = new LangChainBotMemory({
  maxMessages: 50,
  retentionDays: 90,
  enableEmbeddings: false, // Disable for now to save costs
  enableSummarization: true,
  compressionThreshold: 15
})
// Export types are already declared above