/**
 * API Response Caching System
 *
 * Comprehensive caching solution for API responses with intelligent invalidation,
 * request deduplication, and cache warming capabilities.
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger, LogCategory } from '@/lib/logger'
import { getCacheHeaders } from '@/lib/cache'

export interface CacheOptions {
  /** Cache duration in seconds */
  maxAge?: number
  /** CDN cache duration in seconds */
  sMaxAge?: number
  /** Custom cache key generator */
  keyGenerator?: (request: NextRequest) => string
  /** Custom cache validation */
  revalidate?: (request: NextRequest) => boolean
  /** Tags for cache invalidation */
  tags?: string[]
  /** Enable request deduplication */
  deduplicate?: boolean
  /** Enable stale-while-revalidate */
  staleWhileRevalidate?: boolean
}

interface CacheEntry {
  data: any
  timestamp: number
  expiresAt: number
  headers: Record<string, string>
  etag?: string
  lastModified?: string
  accessCount: number
}

interface PendingRequest {
  promise: Promise<any>
  timestamp: number
  timeout: NodeJS.Timeout
}

class APICache {
  private cache = new Map<string, CacheEntry>()
  private pendingRequests = new Map<string, PendingRequest>()
  private defaultOptions: CacheOptions = {
    maxAge: 300, // 5 minutes default
    sMaxAge: 3600, // 1 hour CDN default
    deduplicate: true,
    staleWhileRevalidate: true,
  }

  constructor(private maxSize: number = 1000) {}

  /**
   * Generate cache key from request
   */
  private generateKey(request: NextRequest, options: CacheOptions): string {
    const url = new URL(request.url)
    const method = request.method

    // Include relevant parts for cache key
    const keyParts = [
      method,
      url.pathname,
      url.searchParams.toString(),
      request.headers.get('authorization')?.slice(0, 10) || 'anonymous'
    ]

    // Use custom key generator if provided
    if (options.keyGenerator) {
      return options.keyGenerator(request)
    }

    return keyParts.join(':')
  }

  /**
   * Generate ETag for response data
   */
  private generateETag(data: any): string {
    const str = typeof data === 'string' ? data : JSON.stringify(data)
    return `W/"${this.hashString(str)}"`
  }

  /**
   * Simple hash function
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Check if request should be cached
   */
  private shouldCache(request: NextRequest, options: CacheOptions): boolean {
    // Don't cache POST/PUT/DELETE requests by default
    const cacheableMethods = ['GET', 'HEAD']
    if (!cacheableMethods.includes(request.method)) {
      return false
    }

    // Don't cache if Authorization header is present for sensitive data
    const sensitivePaths = ['/api/admin/', '/api/user/profile', '/api/subscription/']
    const isSensitive = sensitivePaths.some(path => request.url.includes(path))
    if (isSensitive && request.headers.get('authorization')) {
      return false
    }

    // Use custom validation if provided
    if (options.revalidate) {
      return options.revalidate(request)
    }

    return true
  }

  /**
   * Check cache entry validity
   */
  private isValid(entry: CacheEntry, allowStale: boolean = false): boolean {
    const now = Date.now()

    // Check if expired
    if (now > entry.expiresAt) {
      return allowStale && (now - entry.expiresAt) < 300000 // Allow 5 minutes stale
    }

    return true
  }

  /**
   * Clean up expired entries and pending requests
   */
  private cleanup(): void {
    const now = Date.now()
    let cleanedCount = 0

    // Clean expired cache entries
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    // Clean pending requests that have timed out
    for (const [key, pending] of this.pendingRequests.entries()) {
      if (now - pending.timestamp > 30000) { // 30 second timeout
        clearTimeout(pending.timeout)
        this.pendingRequests.delete(key)
        cleanedCount++
      }
    }

    // Enforce size limit
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a[1].timestamp - b[1].timestamp)

      const toDelete = entries.slice(0, entries.length - this.maxSize)
      toDelete.forEach(([key]) => this.cache.delete(key))
      cleanedCount += toDelete.length
    }

    if (cleanedCount > 0) {
      logger.debug(LogCategory.CACHE, 'API cache cleanup completed', {
        cleanedCount,
        remainingEntries: this.cache.size,
        pendingRequests: this.pendingRequests.size
      })
    }
  }

  /**
   * Get cached response
   */
  async get(request: NextRequest, options: CacheOptions = {}): Promise<NextResponse | null> {
    const key = this.generateKey(request, { ...this.defaultOptions, ...options })

    // Check if request should be cached
    if (!this.shouldCache(request, options)) {
      return null
    }

    // Check for duplicate requests
    if (options.deduplicate && this.pendingRequests.has(key)) {
      logger.debug(LogCategory.CACHE, 'Request deduplication hit', { key })
      return this.pendingRequests.get(key)!.promise
    }

    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    // Check if entry is valid
    const allowStale = options.staleWhileRevalidate
    if (!this.isValid(entry, allowStale)) {
      this.cache.delete(key)
      return null
    }

    // Create response from cached data
    const response = new NextResponse(JSON.stringify(entry.data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Tag': entry.etag || '',
        'Last-Modified': entry.lastModified || '',
        ...entry.headers,
        ...getCacheHeaders(
          allowStale && !this.isValid(entry) ? 60 : options.maxAge || this.defaultOptions.maxAge!,
          options.sMaxAge || this.defaultOptions.sMaxAge!
        ),
        'X-Cache': allowStale && !this.isValid(entry) ? 'STALE' : 'HIT'
      }
    })

    // Update access statistics
    entry.accessCount++
    logger.debug(LogCategory.CACHE, 'API cache hit', {
      key,
      accessCount: entry.accessCount,
      isStale: !this.isValid(entry) && allowStale
    })

    return response
  }

  /**
   * Set cache entry
   */
  async set(
    request: NextRequest,
    data: any,
    options: CacheOptions = {}
  ): Promise<void> {
    const key = this.generateKey(request, { ...this.defaultOptions, ...options })

    // Check if request should be cached
    if (!this.shouldCache(request, options)) {
      return
    }

    const now = Date.now()
    const maxAge = options.maxAge || this.defaultOptions.maxAge!
    const etag = this.generateETag(data)
    const lastModified = new Date().toUTCString()

    const entry: CacheEntry = {
      data,
      timestamp: now,
      expiresAt: now + (maxAge * 1000),
      headers: {
        'Content-Type': 'application/json',
      },
      etag,
      lastModified,
      accessCount: 1
    }

    // Enforce size limit
    if (this.cache.size >= this.maxSize) {
      this.cleanup()
    }

    this.cache.set(key, entry)

    logger.debug(LogCategory.CACHE, 'API response cached', {
      key,
      maxAge,
      etag,
      dataSize: JSON.stringify(data).length
    })
  }

  /**
   * Invalidate cache entries by tags
   */
  invalidateByTag(tag: string): void {
    let invalidatedCount = 0
    for (const [key, entry] of this.cache.entries()) {
      if (entry.headers['Cache-Tag']?.includes(tag)) {
        this.cache.delete(key)
        invalidatedCount++
      }
    }

    logger.info(LogCategory.CACHE, 'Cache invalidated by tag', {
      tag,
      invalidatedCount,
      remainingEntries: this.cache.size
    })
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: string | RegExp): void {
    let invalidatedCount = 0
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

    for (const [key] of this.cache.entries()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        invalidatedCount++
      }
    }

    logger.info(LogCategory.CACHE, 'Cache invalidated by pattern', {
      pattern: pattern.toString(),
      invalidatedCount,
      remainingEntries: this.cache.size
    })
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number
    hitRate: number
    averageAccessCount: number
    memoryUsage: number
    pendingRequests: number
    entriesByPath: Record<string, number>
  } {
    const entriesByPath: Record<string, number> = {}
    let totalAccessCount = 0
    let hitCount = 0

    for (const [key, entry] of this.cache.entries()) {
      const path = key.split(':')[1]
      entriesByPath[path] = (entriesByPath[path] || 0) + 1
      totalAccessCount += entry.accessCount
      if (entry.accessCount > 1) hitCount++
    }

    return {
      totalEntries: this.cache.size,
      hitRate: this.cache.size > 0 ? hitCount / this.cache.size : 0,
      averageAccessCount: this.cache.size > 0 ? totalAccessCount / this.cache.size : 0,
      memoryUsage: JSON.stringify([...this.cache.entries()]).length,
      pendingRequests: this.pendingRequests.size,
      entriesByPath
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.pendingRequests.clear()
    logger.info(LogCategory.CACHE, 'API cache cleared')
  }

  /**
   * Warm cache with frequently accessed data
   */
  async warmCache(urls: string[]): Promise<void> {
    logger.info(LogCategory.CACHE, 'Cache warming started', { urlCount: urls.length })

    const promises = urls.map(async (url) => {
      try {
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          const request = new Request(url)
          await this.set(request, data, { maxAge: 3600 }) // 1 hour
        }
      } catch (error) {
        logger.warn(LogCategory.CACHE, 'Cache warming failed', { url, error: error.message })
      }
    })

    await Promise.allSettled(promises)
    logger.info(LogCategory.CACHE, 'Cache warming completed')
  }
}

// Global cache instance
export const apiCache = new APICache(500)

/**
 * API caching middleware wrapper
 */
export function withCache<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>,
  options: CacheOptions = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse<T>> => {
    // Try to get from cache first
    const cachedResponse = await apiCache.get(request, options)
    if (cachedResponse) {
      return cachedResponse as NextResponse<T>
    }

    // Execute the handler
    try {
      const response = await handler(request, context)

      // Only cache successful responses
      if (response.status === 200 || response.status === 304) {
        const data = await response.json().catch(() => null)
        if (data) {
          await apiCache.set(request, data, options)
        }
      }

      // Add cache headers
      const cacheHeaders = getCacheHeaders(
        options.maxAge || apiCache['defaultOptions'].maxAge!,
        options.sMaxAge || apiCache['defaultOptions'].sMaxAge!
      )

      Object.entries(cacheHeaders).forEach(([key, value]) => {
        if (!response.headers.has(key)) {
          response.headers.set(key, value)
        }
      })

      response.headers.set('X-Cache', 'MISS')
      return response

    } catch (error) {
      logger.error(LogCategory.CACHE, 'Cache handler error', {
        url: request.url,
        error: error.message
      })
      throw error
    }
  }
}

/**
 * Cache warming utility
 */
export async function warmCache(urls: string[]): Promise<void> {
  await apiCache.warmCache(urls)
}

/**
 * Cache invalidation utilities
 */
export const cacheUtils = {
  invalidateByTag: (tag: string) => apiCache.invalidateByTag(tag),
  invalidateByPattern: (pattern: string | RegExp) => apiCache.invalidateByPattern(pattern),
  clear: () => apiCache.clear(),
  getStats: () => apiCache.getStats()
}

export default apiCache