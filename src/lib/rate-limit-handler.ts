/**
 * Rate Limiting Handler Utility
 *
 * Provides intelligent retry logic for rate-limited requests
 * with exponential backoff and user-friendly error handling.
 *
 * @author Dr. Philipe Saraiva Cruz
 */

import React, { useCallback, useState } from 'react'

export interface RateLimitConfig {
  maxRetries?: number
  baseDelay?: number // milliseconds
  maxDelay?: number // milliseconds
  onRetry?: (attempt: number, delay: number) => void
  onRateLimit?: (retryAfter: number) => void
}

export interface RateLimitResponse {
  success: boolean
  data?: any
  error?: string
  retryAfter?: number
  attempts: number
}

class RateLimitHandler {
  private static instance: RateLimitHandler
  private retryAttempts = new Map<string, { count: number; lastAttempt: number }>()

  static getInstance(): RateLimitHandler {
    if (!RateLimitHandler.instance) {
      RateLimitHandler.instance = new RateLimitHandler()
    }
    return RateLimitHandler.instance
  }

  /**
   * Execute a request with intelligent rate limiting handling
   */
  async executeWithRetry(
    key: string,
    requestFn: () => Promise<Response>,
    config: RateLimitConfig = {}
  ): Promise<RateLimitResponse> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      onRetry,
      onRateLimit
    } = config

    let attempt = 0

    while (attempt <= maxRetries) {
      try {
        const response = await requestFn()

        if (response.status === 429) {
          const retryAfter = this.parseRetryAfter(response)

          if (attempt >= maxRetries) {
            return {
              success: false,
              error: `Rate limit exceeded after ${maxRetries} attempts`,
              retryAfter,
              attempts: attempt + 1
            }
          }

          // Calculate delay with exponential backoff
          const delay = Math.min(
            baseDelay * Math.pow(2, attempt),
            maxDelay
          )

          onRateLimit?.(retryAfter || delay)
          onRetry?.(attempt + 1, delay)

          // Wait before retry
          await this.sleep(delay)
          attempt++
          continue
        }

        if (!response.ok) {
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
            attempts: attempt + 1
          }
        }

        const data = await response.json()
        return {
          success: true,
          data,
          attempts: attempt + 1
        }

      } catch (error) {
        if (attempt >= maxRetries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            attempts: attempt + 1
          }
        }

        const delay = Math.min(
          baseDelay * Math.pow(2, attempt),
          maxDelay
        )

        onRetry?.(attempt + 1, delay)
        await this.sleep(delay)
        attempt++
      }
    }

    return {
      success: false,
      error: 'Maximum retry attempts exceeded',
      attempts: attempt + 1
    }
  }

  /**
   * Parse Retry-After header from response
   */
  private parseRetryAfter(response: Response): number | null {
    const retryAfterHeader = response.headers.get('Retry-After')

    if (!retryAfterHeader) {
      return null
    }

    const retryAfter = parseInt(retryAfterHeader, 10)
    return isNaN(retryAfter) ? null : retryAfter * 1000 // Convert to milliseconds
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Clear retry history for a specific key
   */
  clearRetryHistory(key: string): void {
    this.retryAttempts.delete(key)
  }

  /**
   * Get retry count for a specific key
   */
  getRetryCount(key: string): number {
    return this.retryAttempts.get(key)?.count || 0
  }
}

export const rateLimitHandler = RateLimitHandler.getInstance()

/**
 * Enhanced fetch wrapper with rate limiting support
 */
export async function fetchWithRateLimit(
  url: string,
  options: RequestInit = {},
  rateLimitConfig: RateLimitConfig = {}
): Promise<RateLimitResponse> {
  const key = `${url}:${JSON.stringify(options)}`

  return rateLimitHandler.executeWithRetry(
    key,
    () => fetch(url, options),
    rateLimitConfig
  )
}

/**
 * Hook for React components to handle rate limiting
 */
export function useRateLimitRetry() {
  const [isRateLimited, setIsRateLimited] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0)
  const [retryIn, setRetryIn] = React.useState<number | null>(null)

  const executeWithRetry = useCallback(async (
    key: string,
    requestFn: () => Promise<Response>,
    config: RateLimitConfig = {}
  ) => {
    setIsRateLimited(false)
    setRetryIn(null)

    const result = await rateLimitHandler.executeWithRetry(key, requestFn, {
      onRateLimit: (retryAfter) => {
        setIsRateLimited(true)
        setRetryIn(retryAfter)

        // Countdown timer
        const interval = setInterval(() => {
          setRetryIn(prev => {
            if (prev !== null && prev > 1000) {
              return prev - 1000
            }
            clearInterval(interval)
            return 0
          })
        }, 1000)
      },
      onRetry: (attempt) => {
        setRetryCount(attempt)
      },
      ...config
    })

    setIsRateLimited(false)
    setRetryIn(null)

    return result
  }, [])

  return {
    executeWithRetry,
    isRateLimited,
    retryCount,
    retryIn
  }
}