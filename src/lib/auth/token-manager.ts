/**
 * Token Manager - Optimizes Firebase token storage with debouncing
 *
 * Prevents multiple simultaneous calls to set-token endpoint
 * and handles rate limiting gracefully.
 *
 * @author Dr. Philipe Saraiva Cruz
 */

import React from 'react'

import { fetchWithRateLimit, RateLimitConfig } from '@/lib/rate-limit-handler'

interface TokenManagerConfig extends RateLimitConfig {
  debounceMs?: number
}

class TokenManager {
  private static instance: TokenManager
  private pendingRequests = new Map<string, Promise<void>>()
  private lastStoredToken: string | null = null
  private debounceTimers = new Map<string, NodeJS.Timeout>()

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager()
    }
    return TokenManager.instance
  }

  /**
   * Store token with debouncing and rate limit handling
   */
  async storeToken(token: string, config: TokenManagerConfig = {}): Promise<void> {
    const { debounceMs = 300, ...rateLimitConfig } = config

    // Avoid storing the same token multiple times
    if (this.lastStoredToken === token) {
      return
    }

    const key = 'store-token'

    // Clear existing debounce timer
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key)!)
    }

    // Create new debounced request
    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          await this.executeWithRateLimit(key, token, rateLimitConfig)
          this.lastStoredToken = token
          this.debounceTimers.delete(key)
          resolve()
        } catch (error) {
          this.debounceTimers.delete(key)
          reject(error)
        }
      }, debounceMs)

      this.debounceTimers.set(key, timer)
    })
  }

  /**
   * Clear token immediately (no debounce)
   */
  async clearToken(config: RateLimitConfig = {}): Promise<void> {
    const key = 'clear-token'

    // Clear any pending clear requests
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    const request = this.executeWithRateLimit(key, null, config)
    this.pendingRequests.set(key, request)

    try {
      await request
      this.lastStoredToken = null
    } finally {
      this.pendingRequests.delete(key)
    }
  }

  /**
   * Execute request with rate limiting
   */
  private async executeWithRateLimit(
    key: string,
    token: string | null,
    config: RateLimitConfig
  ): Promise<void> {
    const result = await fetchWithRateLimit(
      '/api/auth/set-token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(token ? { token } : { action: 'clear' })
        })
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        onRetry: (attempt, delay) => {
          console.warn(`[TOKEN_MANAGER] Rate limited, retrying in ${delay}ms (attempt ${attempt})`)
        },
        onRateLimit: (retryAfter) => {
          console.warn(`[TOKEN_MANAGER] Rate limited, retry after ${retryAfter}ms`)
        },
        ...config
      }
    )

    if (!result.success) {
      throw new Error(`Failed to store token: ${result.error}`)
    }
  }

  /**
   * Check if token is currently being stored
   */
  isStoringToken(): boolean {
    return this.pendingRequests.has('store-token') || this.debounceTimers.has('store-token')
  }

  /**
   * Get last stored token
   */
  getLastStoredToken(): string | null {
    return this.lastStoredToken
  }

  /**
   * Clear all pending operations
   */
  clearPendingOperations(): void {
    // Clear debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer))
    this.debounceTimers.clear()

    // Note: We don't clear pendingRequests here as they might be resolving
  }
}

export const tokenManager = TokenManager.getInstance()

/**
 * React hook for token management
 */
export function useTokenManager() {
  const [isStoring, setIsStoring] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const storeToken = React.useCallback(async (token: string, config?: TokenManagerConfig) => {
    setIsStoring(true)
    setError(null)

    try {
      await tokenManager.storeToken(token, config)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to store token'
      setError(errorMessage)
      throw err
    } finally {
      setIsStoring(false)
    }
  }, [])

  const clearToken = React.useCallback(async (config?: RateLimitConfig) => {
    setIsStoring(true)
    setError(null)

    try {
      await tokenManager.clearToken(config)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear token'
      setError(errorMessage)
      throw err
    } finally {
      setIsStoring(false)
    }
  }, [])

  return {
    storeToken,
    clearToken,
    isStoring,
    error,
    isStoringToken: () => tokenManager.isStoringToken(),
    getLastStoredToken: () => tokenManager.getLastStoredToken()
  }
}