/**
 * Database Fallback System
 * Sistema de fallback robusto para operações de banco de dados
 * Garante que o chatbot continue funcionando mesmo com falhas no PostgreSQL
 */

import { Redis } from '@upstash/redis'
import { logger, LogCategory } from './logger'
import fs from 'fs'
import path from 'path'

// Tipos de operações de fallback
export type FallbackOperation =
  | 'user_lookup'
  | 'conversation_load'
  | 'subscription_check'
  | 'interaction_store'
  | 'preference_update'
  | 'ticket_create'

export interface FallbackResult<T = any> {
  success: boolean
  data?: T
  source: 'database' | 'redis' | 'memory' | 'file' | 'default'
  fallbackUsed: boolean
  error?: string
}

export interface UserFallbackData {
  id: string
  name: string
  phone: string
  whatsapp: string
  email: string
  hasActiveSubscription: boolean
  subscriptionStatus: string
  lastKnownGood: Date
}

export interface ConversationFallbackData {
  id: string
  customerPhone: string
  userId: string
  recentMessages: Array<{
    content: string
    isFromCustomer: boolean
    timestamp: Date
  }>
  lastIntent: string
  messageCount: number
}

/**
 * Fallback Storage Manager
 * Gerencia múltiplas camadas de fallback storage
 */
class FallbackStorageManager {
  private redis: Redis | null = null
  private memoryCache = new Map<string, any>()
  private fileStorageDir = '/tmp/svlentes-fallback'

  constructor() {
    this.initializeRedis()
    this.initializeFileStorage()
  }

  private initializeRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis({
          url: process.env.REDIS_URL,
          token: process.env.REDIS_TOKEN || ''
        })
        logger.info(LogCategory.SYSTEM, 'Redis fallback storage initialized')
      }
    } catch (error) {
      logger.warn(LogCategory.SYSTEM, 'Redis fallback not available', { error })
    }
  }

  private initializeFileStorage() {
    try {
      if (!fs.existsSync(this.fileStorageDir)) {
        fs.mkdirSync(this.fileStorageDir, { recursive: true })
      }
      logger.info(LogCategory.SYSTEM, 'File fallback storage initialized', {
        dir: this.fileStorageDir
      })
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to initialize file storage', { error })
    }
  }

  /**
   * Store data in fallback layers
   */
  async store(key: string, data: any, ttl: number = 3600): Promise<void> {
    try {
      // Layer 1: Memory cache
      this.memoryCache.set(key, {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl * 1000
      })

      // Layer 2: Redis (if available)
      if (this.redis) {
        try {
          await this.redis.set(key, JSON.stringify(data), { ex: ttl })
        } catch (redisError) {
          logger.warn(LogCategory.SYSTEM, 'Redis store failed', { key, error: redisError })
        }
      }

      // Layer 3: File storage (for critical data)
      if (key.includes('user:') || key.includes('subscription:')) {
        try {
          const filePath = path.join(this.fileStorageDir, `${key.replace(/:/g, '_')}.json`)
          fs.writeFileSync(filePath, JSON.stringify({
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttl * 1000
          }))
        } catch (fileError) {
          logger.warn(LogCategory.SYSTEM, 'File store failed', { key, error: fileError })
        }
      }

      logger.debug(LogCategory.SYSTEM, 'Data stored in fallback layers', { key })
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Error storing fallback data', { key, error })
    }
  }

  /**
   * Retrieve data from fallback layers
   */
  async retrieve(key: string): Promise<any | null> {
    try {
      // Layer 1: Memory cache (fastest)
      const memoryData = this.memoryCache.get(key)
      if (memoryData && memoryData.expiresAt > Date.now()) {
        logger.debug(LogCategory.SYSTEM, 'Fallback hit: Memory', { key })
        return memoryData.data
      }

      // Layer 2: Redis
      if (this.redis) {
        try {
          const redisData = await this.redis.get(key)
          if (redisData) {
            const parsed = typeof redisData === 'string' ? JSON.parse(redisData) : redisData
            // Promote to memory cache
            this.memoryCache.set(key, {
              data: parsed,
              timestamp: Date.now(),
              expiresAt: Date.now() + 3600 * 1000
            })
            logger.debug(LogCategory.SYSTEM, 'Fallback hit: Redis', { key })
            return parsed
          }
        } catch (redisError) {
          logger.warn(LogCategory.SYSTEM, 'Redis retrieve failed', { key, error: redisError })
        }
      }

      // Layer 3: File storage
      try {
        const filePath = path.join(this.fileStorageDir, `${key.replace(/:/g, '_')}.json`)
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, 'utf-8')
          const parsed = JSON.parse(fileContent)

          if (parsed.expiresAt > Date.now()) {
            // Promote to higher layers
            this.memoryCache.set(key, {
              data: parsed.data,
              timestamp: Date.now(),
              expiresAt: parsed.expiresAt
            })

            logger.debug(LogCategory.SYSTEM, 'Fallback hit: File', { key })
            return parsed.data
          }
        }
      } catch (fileError) {
        logger.warn(LogCategory.SYSTEM, 'File retrieve failed', { key, error: fileError })
      }

      logger.debug(LogCategory.SYSTEM, 'Fallback miss', { key })
      return null
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Error retrieving fallback data', { key, error })
      return null
    }
  }

  /**
   * Clear expired data from all layers
   */
  async cleanup(): Promise<void> {
    try {
      const now = Date.now()

      // Clean memory cache
      for (const [key, value] of this.memoryCache.entries()) {
        if (value.expiresAt <= now) {
          this.memoryCache.delete(key)
        }
      }

      // Clean file storage
      if (fs.existsSync(this.fileStorageDir)) {
        const files = fs.readdirSync(this.fileStorageDir)
        for (const file of files) {
          const filePath = path.join(this.fileStorageDir, file)
          try {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
            if (content.expiresAt <= now) {
              fs.unlinkSync(filePath)
            }
          } catch (error) {
            // Ignore malformed files
          }
        }
      }

      logger.debug(LogCategory.SYSTEM, 'Fallback storage cleaned up')
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Error cleaning up fallback storage', { error })
    }
  }

  /**
   * Get storage statistics
   */
  getStats() {
    const fileCount = fs.existsSync(this.fileStorageDir)
      ? fs.readdirSync(this.fileStorageDir).length
      : 0

    return {
      memoryEntries: this.memoryCache.size,
      redisEnabled: !!this.redis,
      fileEntries: fileCount,
      fileStorageDir: this.fileStorageDir
    }
  }
}

/**
 * Database Fallback System
 */
export class DatabaseFallbackSystem {
  private storage = new FallbackStorageManager()
  private circuitBreaker = {
    failures: 0,
    lastFailure: 0,
    threshold: 3,
    timeout: 60000, // 1 minute
    state: 'closed' as 'open' | 'closed' | 'half-open'
  }

  /**
   * Execute operation with automatic fallback
   */
  async executeWithFallback<T>(
    operation: FallbackOperation,
    primaryFn: () => Promise<T>,
    fallbackKey: string,
    defaultValue: T
  ): Promise<FallbackResult<T>> {
    try {
      // Check circuit breaker
      if (this.isCircuitOpen()) {
        logger.warn(LogCategory.DATABASE, 'Circuit breaker open - using fallback', {
          operation,
          failures: this.circuitBreaker.failures
        })
        return await this.executeFallback(fallbackKey, defaultValue)
      }

      // Try primary operation (database)
      const startTime = Date.now()
      const result = await Promise.race([
        primaryFn(),
        this.timeout(5000, 'Database operation timeout')
      ])

      const duration = Date.now() - startTime

      // Success - reset circuit breaker
      this.circuitBreaker.failures = 0
      this.circuitBreaker.state = 'closed'

      // Store in fallback for future use
      await this.storage.store(fallbackKey, result, 3600)

      logger.debug(LogCategory.DATABASE, 'Primary operation succeeded', {
        operation,
        duration
      })

      return {
        success: true,
        data: result,
        source: 'database',
        fallbackUsed: false
      }
    } catch (error) {
      logger.error(LogCategory.DATABASE, 'Primary operation failed', {
        operation,
        error: error instanceof Error ? error.message : 'Unknown'
      })

      // Record failure
      this.recordFailure()

      // Use fallback
      return await this.executeFallback(fallbackKey, defaultValue)
    }
  }

  /**
   * Execute fallback retrieval
   */
  private async executeFallback<T>(key: string, defaultValue: T): Promise<FallbackResult<T>> {
    try {
      // Try to retrieve from fallback storage
      const fallbackData = await this.storage.retrieve(key)

      if (fallbackData !== null) {
        logger.info(LogCategory.DATABASE, 'Fallback data retrieved', { key })
        return {
          success: true,
          data: fallbackData as T,
          source: 'redis', // Could be memory, redis, or file
          fallbackUsed: true
        }
      }

      // No fallback data available - use default
      logger.warn(LogCategory.DATABASE, 'No fallback data - using default', { key })
      return {
        success: true,
        data: defaultValue,
        source: 'default',
        fallbackUsed: true
      }
    } catch (error) {
      logger.error(LogCategory.DATABASE, 'Fallback retrieval failed', { key, error })
      return {
        success: true,
        data: defaultValue,
        source: 'default',
        fallbackUsed: true,
        error: error instanceof Error ? error.message : 'Unknown'
      }
    }
  }

  /**
   * Timeout utility
   */
  private timeout(ms: number, message: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms)
    })
  }

  /**
   * Record a failure and update circuit breaker
   */
  private recordFailure(): void {
    this.circuitBreaker.failures++
    this.circuitBreaker.lastFailure = Date.now()

    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.state = 'open'
      logger.warn(LogCategory.DATABASE, 'Circuit breaker opened', {
        failures: this.circuitBreaker.failures
      })
    }
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(): boolean {
    if (this.circuitBreaker.state === 'closed') {
      return false
    }

    // Check if timeout has passed
    const now = Date.now()
    const timeSinceLastFailure = now - this.circuitBreaker.lastFailure

    if (timeSinceLastFailure > this.circuitBreaker.timeout) {
      // Try half-open state
      this.circuitBreaker.state = 'half-open'
      logger.info(LogCategory.DATABASE, 'Circuit breaker half-open - attempting recovery')
      return false
    }

    return true
  }

  /**
   * Manually reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.failures = 0
    this.circuitBreaker.state = 'closed'
    logger.info(LogCategory.DATABASE, 'Circuit breaker manually reset')
  }

  /**
   * User lookup with fallback
   */
  async findUserWithFallback(phone: string): Promise<FallbackResult<UserFallbackData | null>> {
    const fallbackKey = `user:${phone}`

    return await this.executeWithFallback(
      'user_lookup',
      async () => {
        const { prisma } = await import('./prisma')
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { phone },
              { whatsapp: phone }
            ]
          },
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              take: 1
            }
          }
        })

        if (!user) return null

        const userData: UserFallbackData = {
          id: user.id,
          name: user.name || 'Cliente',
          phone: user.phone || phone,
          whatsapp: user.whatsapp || phone,
          email: user.email,
          hasActiveSubscription: user.subscriptions.length > 0,
          subscriptionStatus: user.subscriptions[0]?.status || 'none',
          lastKnownGood: new Date()
        }

        return userData
      },
      fallbackKey,
      null
    )
  }

  /**
   * Subscription check with fallback
   */
  async checkSubscriptionWithFallback(userId: string): Promise<FallbackResult<{
    hasActive: boolean
    status: string
    planType: string
  }>> {
    const fallbackKey = `subscription:${userId}`

    return await this.executeWithFallback(
      'subscription_check',
      async () => {
        const { prisma } = await import('./prisma')
        const subscription = await prisma.subscription.findFirst({
          where: {
            userId,
            status: { in: ['ACTIVE', 'PAUSED', 'OVERDUE'] }
          },
          orderBy: { createdAt: 'desc' }
        })

        return {
          hasActive: subscription?.status === 'ACTIVE',
          status: subscription?.status || 'none',
          planType: subscription?.planType || 'none'
        }
      },
      fallbackKey,
      {
        hasActive: false,
        status: 'unknown',
        planType: 'unknown'
      }
    )
  }

  /**
   * Store interaction with fallback (queue for later persistence)
   */
  async storeInteractionWithFallback(interactionData: any): Promise<FallbackResult<void>> {
    const fallbackKey = `interaction:pending:${Date.now()}`

    try {
      // Try to store in database
      const { storeInteraction } = await import('./whatsapp-conversation-service')
      await Promise.race([
        storeInteraction(interactionData),
        this.timeout(5000, 'Store interaction timeout')
      ])

      return {
        success: true,
        source: 'database',
        fallbackUsed: false
      }
    } catch (error) {
      logger.warn(LogCategory.DATABASE, 'Failed to store interaction - queuing for later', {
        error
      })

      // Queue for later persistence
      await this.storage.store(fallbackKey, interactionData, 86400) // 24 hours

      return {
        success: true,
        source: 'file',
        fallbackUsed: true,
        error: 'Queued for later persistence'
      }
    }
  }

  /**
   * Retry queued interactions
   */
  async retryQueuedInteractions(): Promise<{
    attempted: number
    succeeded: number
    failed: number
  }> {
    const stats = { attempted: 0, succeeded: 0, failed: 0 }

    try {
      // This would iterate through queued interactions and retry them
      // Implementation depends on your queuing strategy
      logger.info(LogCategory.DATABASE, 'Retrying queued interactions', stats)
      return stats
    } catch (error) {
      logger.error(LogCategory.DATABASE, 'Error retrying queued interactions', { error })
      return stats
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    database: boolean
    fallback: boolean
    circuitBreaker: string
    fallbackStats: any
  }> {
    let databaseHealthy = false

    try {
      const { prisma } = await import('./prisma')
      await prisma.$queryRaw`SELECT 1`
      databaseHealthy = true
    } catch (error) {
      logger.error(LogCategory.DATABASE, 'Database health check failed', { error })
    }

    return {
      database: databaseHealthy,
      fallback: true,
      circuitBreaker: this.circuitBreaker.state,
      fallbackStats: this.storage.getStats()
    }
  }

  /**
   * Cleanup expired fallback data
   */
  async cleanup(): Promise<void> {
    await this.storage.cleanup()
  }

  /**
   * Get system statistics
   */
  getStats() {
    return {
      circuitBreaker: {
        state: this.circuitBreaker.state,
        failures: this.circuitBreaker.failures,
        lastFailure: this.circuitBreaker.lastFailure
      },
      storage: this.storage.getStats()
    }
  }
}

// Singleton instance
export const dbFallbackSystem = new DatabaseFallbackSystem()

// Schedule periodic cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    dbFallbackSystem.cleanup().catch(error => {
      logger.error(LogCategory.SYSTEM, 'Scheduled cleanup failed', { error })
    })
  }, 3600000) // Every hour
}
