/**
 * Response Caching System for AI-powered WhatsApp responses
 * Intelligent caching with semantic similarity and TTL management
 */

import * as crypto from 'crypto'
import { logger, LogCategory } from '@/lib/logger'

interface CachedResponse {
  id: string
  key: string
  response: string
  intent: string
  confidence: number
  quickReplies: string[]
  createdAt: number
  expiresAt: number
  accessCount: number
  lastAccessed: number
  similarityThreshold: number
  tags: string[]
  userId?: string
  sessionId?: string
}

interface CacheConfig {
  maxSize: number
  defaultTTL: number
  similarityThreshold: number
  cleanupInterval: number
  enableSemanticCache: boolean
  enableExactCache: boolean
}

export class ResponseCache {
  private cache: Map<string, CachedResponse> = new Map()
  private semanticIndex: Map<string, string[]> = new Map() // intent -> cache keys
  private config: CacheConfig
  private cleanupTimer: NodeJS.Timeout

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      similarityThreshold: 0.85,
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      enableSemanticCache: true,
      enableExactCache: true,
      ...config
    }

    // Start periodic cleanup
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * Generate cache key from message and context
   */
  private generateCacheKey(message: string, context?: any): string {
    const normalizedMessage = message.toLowerCase().trim()
    const contextHash = context ?
      crypto.createHash('md5').update(JSON.stringify(context)).digest('hex').substring(0, 8) : ''

    const combined = `${normalizedMessage}:${contextHash}`
    return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16)
  }

  /**
   * Generate semantic key for intent-based caching
   */
  private generateSemanticKey(message: string, intent: string): string {
    const normalizedMessage = message.toLowerCase().trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(' ')
      .filter(word => word.length > 2) // Remove short words
      .slice(0, 5) // Keep first 5 meaningful words
      .join('-')

    return `${intent}:${normalizedMessage}`
  }

  /**
   * Check if message is suitable for caching
   */
  private isCacheable(message: string, intent: string, confidence: number): boolean {
    // Don't cache very low confidence responses
    if (confidence < 0.7) return false

    // Don't cache emergency or highly personalized messages
    const nonCacheableIntents = ['emergency', 'complaint', 'personal_query']
    if (nonCacheableIntents.includes(intent.toLowerCase())) return false

    // Don't cache very short or very long messages
    if (message.length < 10 || message.length > 500) return false

    // Don't cache messages with personal identifiers
    const personalPatterns = [
      /\b\d{11}\b/, // Phone numbers
      /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/, // CPF
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email
    ]

    return !personalPatterns.some(pattern => pattern.test(message))
  }

  /**
   * Get cached response
   */
  get(message: string, context?: any): CachedResponse | null {
    const key = this.generateCacheKey(message, context)
    const cached = this.cache.get(key)

    if (!cached) return null

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key)
      this.removeFromSemanticIndex(cached)
      return null
    }

    // Update access statistics
    cached.accessCount++
    cached.lastAccessed = Date.now()

    logger.debug(LogCategory.CACHE, 'Cache hit', {
      key,
      intent: cached.intent,
      accessCount: cached.accessCount
    })

    return cached
  }

  /**
   * Get semantically similar responses
   */
  getSemantic(message: string, intent: string, threshold: number = 0.85): CachedResponse | null {
    if (!this.config.enableSemanticCache) return null

    const semanticKey = this.generateSemanticKey(message, intent)
    const similarKeys = this.semanticIndex.get(intent) || []

    for (const cacheKey of similarKeys) {
      const cached = this.cache.get(cacheKey)
      if (!cached || Date.now() > cached.expiresAt) continue

      // Simple similarity check (can be enhanced with actual semantic similarity)
      const similarity = this.calculateSimilarity(message, cached.key)
      if (similarity >= threshold) {
        cached.accessCount++
        cached.lastAccessed = Date.now()

        logger.debug(LogCategory.CACHE, 'Semantic cache hit', {
          originalKey: cacheKey,
          semanticKey,
          similarity,
          intent: cached.intent
        })

        return cached
      }
    }

    return null
  }

  /**
   * Set cached response
   */
  set(
    message: string,
    response: string,
    intent: string,
    confidence: number,
    quickReplies: string[] = [],
    context?: any,
    tags: string[] = []
  ): void {
    if (!this.isCacheable(message, intent, confidence)) {
      logger.debug(LogCategory.CACHE, 'Response not cacheable', {
        intent,
        confidence,
        messageLength: message.length
      })
      return
    }

    const key = this.generateCacheKey(message, context)
    const now = Date.now()

    const cachedResponse: CachedResponse = {
      id: crypto.randomUUID(),
      key: message,
      response,
      intent,
      confidence,
      quickReplies,
      createdAt: now,
      expiresAt: now + this.config.defaultTTL,
      accessCount: 1,
      lastAccessed: now,
      similarityThreshold: this.config.similarityThreshold,
      tags,
      userId: context?.userProfile?.id,
      sessionId: context?.sessionId
    }

    // Check cache size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed()
    }

    this.cache.set(key, cachedResponse)
    this.addToSemanticIndex(cachedResponse, intent)

    logger.debug(LogCategory.CACHE, 'Response cached', {
      key,
      intent,
      confidence,
      ttl: this.config.defaultTTL
    })
  }

  /**
   * Calculate simple text similarity (can be enhanced with embeddings)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))

    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])

    return intersection.size / union.size
  }

  /**
   * Add to semantic index
   */
  private addToSemanticIndex(cached: CachedResponse, intent: string): void {
    if (!this.semanticIndex.has(intent)) {
      this.semanticIndex.set(intent, [])
    }

    const keys = this.semanticIndex.get(intent)!
    if (!keys.includes(cached.id)) {
      keys.push(cached.id)
    }
  }

  /**
   * Remove from semantic index
   */
  private removeFromSemanticIndex(cached: CachedResponse): void {
    const keys = this.semanticIndex.get(cached.intent)
    if (keys) {
      const index = keys.indexOf(cached.id)
      if (index > -1) {
        keys.splice(index, 1)
      }
    }
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, cached] of this.cache.entries()) {
      if (cached.lastAccessed < oldestTime) {
        oldestTime = cached.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      const evicted = this.cache.get(oldestKey)!
      this.cache.delete(oldestKey)
      this.removeFromSemanticIndex(evicted)

      logger.debug(LogCategory.CACHE, 'LRU eviction', {
        evictedKey: oldestKey,
        lastAccessed: new Date(evicted.lastAccessed).toISOString()
      })
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(key)
        this.removeFromSemanticIndex(cached)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      logger.debug(LogCategory.CACHE, 'Cleanup completed', {
        cleanedCount,
        remainingEntries: this.cache.size
      })
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number
    entriesByIntent: Record<string, number>
    averageAccessCount: number
    hitRate: number
    memoryUsage: number
  } {
    const entriesByIntent: Record<string, number> = {}
    let totalAccessCount = 0
    let hitCount = 0

    for (const cached of this.cache.values()) {
      entriesByIntent[cached.intent] = (entriesByIntent[cached.intent] || 0) + 1
      totalAccessCount += cached.accessCount
      if (cached.accessCount > 1) hitCount++
    }

    return {
      totalEntries: this.cache.size,
      entriesByIntent,
      averageAccessCount: this.cache.size > 0 ? totalAccessCount / this.cache.size : 0,
      hitRate: this.cache.size > 0 ? hitCount / this.cache.size : 0,
      memoryUsage: JSON.stringify([...this.cache.entries()]).length
    }
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear()
    this.semanticIndex.clear()
    logger.info(LogCategory.CACHE, 'Cache cleared')
  }

  /**
   * Destroy cache and cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.clear()
  }
}

// Singleton instance
export const responseCache = new ResponseCache({
  maxSize: 500,
  defaultTTL: 20 * 60 * 1000, // 20 minutes for WhatsApp responses
  similarityThreshold: 0.8,
  enableSemanticCache: true,
  enableExactCache: true
})