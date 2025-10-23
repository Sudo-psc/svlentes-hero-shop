/**
 * Advanced Conversation Memory System
 * Sistema de memória multi-camadas com cache, fallback e persistência
 */

import { Redis } from '@upstash/redis'
import { logger, LogCategory } from './logger'

// Tipos de memória
export interface ConversationMemory {
  userId: string
  phone: string
  shortTerm: ShortTermMemory
  longTerm: LongTermMemory
  context: ConversationContext
  preferences: UserPreferences
}

export interface ShortTermMemory {
  // Memória da sessão atual (últimos 10 turnos)
  recentMessages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    intent?: string
    sentiment?: string
  }>
  currentTopic?: string
  lastIntent?: string
  lastSentiment?: string
  pendingActions: string[]
  contextVariables: Record<string, any>
}

export interface LongTermMemory {
  // Memória persistente do usuário
  name: string
  preferredName?: string // Apelido preferido
  subscriptionInfo: {
    planType: string
    status: string
    startDate: Date
    renewalDate: Date
    pauseCount: number
    lastPauseDate?: Date
  }
  purchaseHistory: Array<{
    date: Date
    product: string
    value: number
  }>
  supportHistory: {
    totalInteractions: number
    commonIssues: string[]
    resolvedIssues: string[]
    averageResponseTime: number
    satisfactionScore: number
  }
  communicationStyle: {
    formalityLevel: 'formal' | 'casual' | 'very_casual'
    preferredLanguage: string
    emojiUsage: 'none' | 'moderate' | 'frequent'
    responseLength: 'concise' | 'detailed' | 'very_detailed'
  }
  personalizedInfo: {
    lensType?: string
    prescriptionDate?: Date
    doctorName?: string
    deliveryPreference?: string
    preferredContactTime?: string
    specialNeeds?: string[]
  }
}

export interface ConversationContext {
  sessionId: string
  startTime: Date
  lastInteractionTime: Date
  messageCount: number
  isAuthenticated: boolean
  currentState: 'onboarding' | 'authenticated' | 'support' | 'transaction' | 'feedback'
  activeTasks: string[]
  unresolvedIssues: string[]
}

export interface UserPreferences {
  notifications: {
    renewal: boolean
    delivery: boolean
    promotions: boolean
    tips: boolean
  }
  communication: {
    useEmojis: boolean
    detailedExplanations: boolean
    quickReplies: boolean
    voiceMessages: boolean
  }
  privacy: {
    shareData: boolean
    analytics: boolean
    thirdParty: boolean
  }
}

/**
 * Sistema de cache multi-camadas
 */
class MemoryCacheSystem {
  // L1: Memória em processo (mais rápido, mas volátil)
  private l1Cache = new Map<string, ConversationMemory>()
  private l1TTL = 5 * 60 * 1000 // 5 minutos

  // L2: Redis (rápido, persistente entre instâncias)
  private redis: Redis | null = null
  private l2TTL = 30 * 60 // 30 minutos

  // L3: Database (mais lento, mas permanente)
  // Gerenciado pelo whatsapp-conversation-service.ts

  constructor() {
    this.initializeRedis()
  }

  private initializeRedis() {
    try {
      if (process.env.REDIS_URL) {
        // Upstash Redis (serverless-friendly)
        this.redis = new Redis({
          url: process.env.REDIS_URL,
          token: process.env.REDIS_TOKEN || ''
        })
        logger.info(LogCategory.SYSTEM, 'Redis cache initialized for conversation memory')
      } else {
        logger.warn(LogCategory.SYSTEM, 'Redis not configured - using L1 cache only')
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to initialize Redis', { error })
    }
  }

  /**
   * Get memory with fallback chain: L1 → L2 → L3
   */
  async get(key: string): Promise<ConversationMemory | null> {
    try {
      // Try L1 (in-memory)
      const l1Result = this.l1Cache.get(key)
      if (l1Result) {
        logger.debug(LogCategory.SYSTEM, 'Memory cache hit: L1', { key })
        return l1Result
      }

      // Try L2 (Redis)
      if (this.redis) {
        const l2Result = await this.redis.get<ConversationMemory>(key)
        if (l2Result) {
          logger.debug(LogCategory.SYSTEM, 'Memory cache hit: L2', { key })
          // Promote to L1
          this.l1Cache.set(key, l2Result)
          setTimeout(() => this.l1Cache.delete(key), this.l1TTL)
          return l2Result
        }
      }

      logger.debug(LogCategory.SYSTEM, 'Memory cache miss', { key })
      return null
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Error getting memory from cache', { key, error })
      return null
    }
  }

  /**
   * Set memory in all cache layers
   */
  async set(key: string, value: ConversationMemory): Promise<void> {
    try {
      // Set L1
      this.l1Cache.set(key, value)
      setTimeout(() => this.l1Cache.delete(key), this.l1TTL)

      // Set L2
      if (this.redis) {
        await this.redis.set(key, JSON.stringify(value), { ex: this.l2TTL })
      }

      logger.debug(LogCategory.SYSTEM, 'Memory cached', { key })
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Error setting memory cache', { key, error })
    }
  }

  /**
   * Invalidate cache for a key
   */
  async invalidate(key: string): Promise<void> {
    try {
      this.l1Cache.delete(key)
      if (this.redis) {
        await this.redis.del(key)
      }
      logger.debug(LogCategory.SYSTEM, 'Memory cache invalidated', { key })
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Error invalidating cache', { key, error })
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      l1Size: this.l1Cache.size,
      l1TTL: this.l1TTL,
      l2Enabled: !!this.redis,
      l2TTL: this.l2TTL
    }
  }
}

/**
 * Advanced Conversation Memory Manager
 */
export class AdvancedConversationMemory {
  private cache = new MemoryCacheSystem()
  private readonly MAX_SHORT_TERM_MESSAGES = 10
  private readonly MAX_CONTEXT_VARIABLES = 50

  /**
   * Load complete memory for a user (with fallback chain)
   */
  async loadMemory(userId: string, phone: string): Promise<ConversationMemory> {
    const cacheKey = `memory:${userId}:${phone}`

    try {
      // Try cache first
      const cached = await this.cache.get(cacheKey)
      if (cached) {
        return cached
      }

      // Fallback to database
      const memory = await this.loadFromDatabase(userId, phone)

      // Cache for future use
      await this.cache.set(cacheKey, memory)

      return memory
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error loading conversation memory', {
        userId,
        phone,
        error
      })

      // Ultimate fallback: return empty memory
      return this.createEmptyMemory(userId, phone)
    }
  }

  /**
   * Load memory from database (L3)
   */
  private async loadFromDatabase(userId: string, phone: string): Promise<ConversationMemory> {
    try {
      const { prisma } = await import('./prisma')
      const { getConversationHistory, getUserSupportHistory } = await import('./whatsapp-conversation-service')

      // Load user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              orders: {
                orderBy: { createdAt: 'desc' },
                take: 5
              }
            }
          }
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Load conversation history
      const history = await getConversationHistory(phone, this.MAX_SHORT_TERM_MESSAGES)

      // Load support history
      const supportHistory = await getUserSupportHistory(userId)

      // Build memory object
      const subscription = user.subscriptions[0]
      const memory: ConversationMemory = {
        userId,
        phone,
        shortTerm: {
          recentMessages: history.map(msg => ({
            role: msg.isFromCustomer ? 'user' : 'assistant',
            content: msg.content,
            timestamp: msg.createdAt,
            intent: msg.intent || undefined,
            sentiment: msg.sentiment || undefined
          })),
          currentTopic: history[history.length - 1]?.intent || undefined,
          lastIntent: history[history.length - 1]?.intent || undefined,
          lastSentiment: history[history.length - 1]?.sentiment || undefined,
          pendingActions: [],
          contextVariables: {}
        },
        longTerm: {
          name: user.name || 'Cliente',
          preferredName: (user.preferences as any)?.preferredName,
          subscriptionInfo: subscription ? {
            planType: subscription.planType,
            status: subscription.status,
            startDate: subscription.createdAt,
            renewalDate: subscription.renewalDate,
            pauseCount: subscription.pauseCount || 0,
            lastPauseDate: subscription.lastPauseDate || undefined
          } : {
            planType: 'none',
            status: 'none',
            startDate: new Date(),
            renewalDate: new Date(),
            pauseCount: 0
          },
          purchaseHistory: subscription?.orders.map(order => ({
            date: order.createdAt,
            product: order.lensType || 'Lentes',
            value: order.totalValue
          })) || [],
          supportHistory: {
            totalInteractions: supportHistory.totalInteractions,
            commonIssues: [],
            resolvedIssues: [],
            averageResponseTime: 0,
            satisfactionScore: 0
          },
          communicationStyle: {
            formalityLevel: (user.preferences as any)?.communicationStyle?.formalityLevel || 'casual',
            preferredLanguage: 'pt-BR',
            emojiUsage: (user.preferences as any)?.communicationStyle?.emojiUsage || 'moderate',
            responseLength: (user.preferences as any)?.communicationStyle?.responseLength || 'detailed'
          },
          personalizedInfo: {
            lensType: subscription?.lensType || undefined,
            prescriptionDate: undefined,
            doctorName: 'Dr. Philipe Saraiva Cruz',
            deliveryPreference: (user.preferences as any)?.deliveryPreference,
            preferredContactTime: (user.preferences as any)?.preferredContactTime,
            specialNeeds: (user.preferences as any)?.specialNeeds || []
          }
        },
        context: {
          sessionId: `session_${Date.now()}`,
          startTime: new Date(),
          lastInteractionTime: new Date(),
          messageCount: history.length,
          isAuthenticated: true,
          currentState: 'authenticated',
          activeTasks: [],
          unresolvedIssues: []
        },
        preferences: {
          notifications: {
            renewal: (user.preferences as any)?.notifications?.renewal ?? true,
            delivery: (user.preferences as any)?.notifications?.delivery ?? true,
            promotions: (user.preferences as any)?.notifications?.promotions ?? true,
            tips: (user.preferences as any)?.notifications?.tips ?? true
          },
          communication: {
            useEmojis: (user.preferences as any)?.communication?.useEmojis ?? true,
            detailedExplanations: (user.preferences as any)?.communication?.detailedExplanations ?? true,
            quickReplies: (user.preferences as any)?.communication?.quickReplies ?? true,
            voiceMessages: (user.preferences as any)?.communication?.voiceMessages ?? false
          },
          privacy: {
            shareData: (user.preferences as any)?.privacy?.shareData ?? false,
            analytics: (user.preferences as any)?.privacy?.analytics ?? true,
            thirdParty: (user.preferences as any)?.privacy?.thirdParty ?? false
          }
        }
      }

      return memory
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error loading memory from database', {
        userId,
        phone,
        error
      })
      throw error
    }
  }

  /**
   * Create empty memory (fallback when database fails)
   */
  private createEmptyMemory(userId: string, phone: string): ConversationMemory {
    return {
      userId,
      phone,
      shortTerm: {
        recentMessages: [],
        pendingActions: [],
        contextVariables: {}
      },
      longTerm: {
        name: 'Cliente',
        subscriptionInfo: {
          planType: 'unknown',
          status: 'unknown',
          startDate: new Date(),
          renewalDate: new Date(),
          pauseCount: 0
        },
        purchaseHistory: [],
        supportHistory: {
          totalInteractions: 0,
          commonIssues: [],
          resolvedIssues: [],
          averageResponseTime: 0,
          satisfactionScore: 0
        },
        communicationStyle: {
          formalityLevel: 'casual',
          preferredLanguage: 'pt-BR',
          emojiUsage: 'moderate',
          responseLength: 'detailed'
        },
        personalizedInfo: {
          doctorName: 'Dr. Philipe Saraiva Cruz'
        }
      },
      context: {
        sessionId: `session_${Date.now()}`,
        startTime: new Date(),
        lastInteractionTime: new Date(),
        messageCount: 0,
        isAuthenticated: false,
        currentState: 'onboarding',
        activeTasks: [],
        unresolvedIssues: []
      },
      preferences: {
        notifications: {
          renewal: true,
          delivery: true,
          promotions: true,
          tips: true
        },
        communication: {
          useEmojis: true,
          detailedExplanations: true,
          quickReplies: true,
          voiceMessages: false
        },
        privacy: {
          shareData: false,
          analytics: true,
          thirdParty: false
        }
      }
    }
  }

  /**
   * Update memory with new message
   */
  async addMessage(
    userId: string,
    phone: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: {
      intent?: string
      sentiment?: string
      contextUpdates?: Record<string, any>
    }
  ): Promise<void> {
    try {
      const memory = await this.loadMemory(userId, phone)

      // Add to short-term memory
      memory.shortTerm.recentMessages.push({
        role,
        content,
        timestamp: new Date(),
        intent: metadata?.intent,
        sentiment: metadata?.sentiment
      })

      // Keep only recent messages
      if (memory.shortTerm.recentMessages.length > this.MAX_SHORT_TERM_MESSAGES) {
        memory.shortTerm.recentMessages = memory.shortTerm.recentMessages.slice(-this.MAX_SHORT_TERM_MESSAGES)
      }

      // Update context
      if (metadata?.intent) {
        memory.shortTerm.lastIntent = metadata.intent
        memory.shortTerm.currentTopic = metadata.intent
      }
      if (metadata?.sentiment) {
        memory.shortTerm.lastSentiment = metadata.sentiment
      }
      if (metadata?.contextUpdates) {
        memory.shortTerm.contextVariables = {
          ...memory.shortTerm.contextVariables,
          ...metadata.contextUpdates
        }
      }

      memory.context.lastInteractionTime = new Date()
      memory.context.messageCount++

      // Update cache
      const cacheKey = `memory:${userId}:${phone}`
      await this.cache.set(cacheKey, memory)

      logger.debug(LogCategory.WHATSAPP, 'Memory updated', {
        userId,
        phone,
        messageCount: memory.context.messageCount
      })
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error updating memory', {
        userId,
        phone,
        error
      })
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    phone: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    try {
      const memory = await this.loadMemory(userId, phone)

      memory.preferences = {
        ...memory.preferences,
        ...preferences
      }

      // Persist to database
      const { prisma } = await import('./prisma')
      await prisma.user.update({
        where: { id: userId },
        data: {
          preferences: {
            ...(memory.preferences as any)
          }
        }
      })

      // Update cache
      const cacheKey = `memory:${userId}:${phone}`
      await this.cache.set(cacheKey, memory)

      logger.info(LogCategory.WHATSAPP, 'User preferences updated', { userId, phone })
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error updating preferences', {
        userId,
        phone,
        error
      })
    }
  }

  /**
   * Get formatted conversation history for LLM context
   */
  async getConversationContext(userId: string, phone: string): Promise<string> {
    try {
      const memory = await this.loadMemory(userId, phone)

      const messages = memory.shortTerm.recentMessages
        .map(msg => `${msg.role === 'user' ? 'Cliente' : 'Assistente'}: ${msg.content}`)
        .join('\n')

      return messages
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error getting conversation context', {
        userId,
        phone,
        error
      })
      return ''
    }
  }

  /**
   * Get personalization data for response generation
   */
  async getPersonalizationData(userId: string, phone: string): Promise<{
    name: string
    preferredName?: string
    communicationStyle: string
    subscriptionStatus: string
    recentTopics: string[]
  }> {
    try {
      const memory = await this.loadMemory(userId, phone)

      return {
        name: memory.longTerm.name,
        preferredName: memory.longTerm.preferredName,
        communicationStyle: memory.longTerm.communicationStyle.formalityLevel,
        subscriptionStatus: memory.longTerm.subscriptionInfo.status,
        recentTopics: memory.shortTerm.recentMessages
          .filter(msg => msg.intent)
          .map(msg => msg.intent!)
          .slice(-3)
      }
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error getting personalization data', {
        userId,
        phone,
        error
      })
      return {
        name: 'Cliente',
        communicationStyle: 'casual',
        subscriptionStatus: 'unknown',
        recentTopics: []
      }
    }
  }

  /**
   * Clear memory (for testing or user request)
   */
  async clearMemory(userId: string, phone: string): Promise<void> {
    const cacheKey = `memory:${userId}:${phone}`
    await this.cache.invalidate(cacheKey)
    logger.info(LogCategory.WHATSAPP, 'Memory cleared', { userId, phone })
  }

  /**
   * Get memory statistics
   */
  getCacheStats() {
    return this.cache.getStats()
  }
}

// Singleton instance
export const advancedMemory = new AdvancedConversationMemory()
