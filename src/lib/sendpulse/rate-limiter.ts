/**
 * SendPulse Rate Limiter
 * Token bucket algorithm for API rate limiting protection
 * Prevents exceeding SendPulse API rate limits
 */
import type { RateLimitConfig, RateLimitState } from './types'
import { SendPulseRateLimitError } from './errors'
export class RateLimiter {
  private config: RateLimitConfig
  private state: RateLimitState
  constructor(config?: Partial<RateLimitConfig>) {
    // Default config based on WhatsApp Business API typical limits
    this.config = {
      maxRequests: 80, // 80 requests per second (conservative)
      windowMs: 1000, // 1 second window
      strategy: 'token-bucket',
      burstSize: 100, // Allow burst of 100 requests
      ...config
    }
    // Initialize state
    this.state = {
      tokens: this.config.burstSize || this.config.maxRequests,
      lastRefill: Date.now(),
      requestCount: 0,
      windowStart: Date.now()
    }
  }
  /**
   * Acquire a token to make a request
   * Blocks until a token is available
   */
  async acquire(): Promise<void> {
    if (this.config.strategy === 'token-bucket') {
      await this.acquireTokenBucket()
    } else if (this.config.strategy === 'sliding-window') {
      await this.acquireSlidingWindow()
    } else {
      await this.acquireFixedWindow()
    }
  }
  /**
   * Token bucket algorithm implementation
   */
  private async acquireTokenBucket(): Promise<void> {
    // Refill tokens based on elapsed time
    this.refillTokens()
    // If no tokens available, wait
    if (this.state.tokens < 1) {
      const waitTime = this.calculateWaitTime()
      if (waitTime > 0) {
        await this.wait(waitTime)
        return this.acquireTokenBucket() // Retry after waiting
      }
    }
    // Consume a token
    this.state.tokens -= 1
  }
  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now()
    const elapsed = now - this.state.lastRefill
    const refillRate = this.config.maxRequests / this.config.windowMs
    const tokensToAdd = Math.floor(elapsed * refillRate)
    if (tokensToAdd > 0) {
      this.state.tokens = Math.min(
        this.state.tokens + tokensToAdd,
        this.config.burstSize || this.config.maxRequests
      )
      this.state.lastRefill = now
    }
  }
  /**
   * Calculate wait time until next token is available
   */
  private calculateWaitTime(): number {
    const refillRate = this.config.maxRequests / this.config.windowMs
    const timeForOneToken = 1 / refillRate
    return Math.ceil(timeForOneToken)
  }
  /**
   * Sliding window algorithm implementation
   */
  private async acquireSlidingWindow(): Promise<void> {
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    // In a real implementation, we'd track individual request timestamps
    // For now, simplified version with request count
    if (now - this.state.windowStart >= this.config.windowMs) {
      // New window
      this.state.requestCount = 0
      this.state.windowStart = now
    }
    if (this.state.requestCount >= this.config.maxRequests) {
      // Wait until window resets
      const waitTime = this.config.windowMs - (now - this.state.windowStart)
      if (waitTime > 0) {
        await this.wait(waitTime)
        return this.acquireSlidingWindow()
      }
    }
    this.state.requestCount += 1
  }
  /**
   * Fixed window algorithm implementation
   */
  private async acquireFixedWindow(): Promise<void> {
    const now = Date.now()
    // Reset counter if window has passed
    if (now - this.state.windowStart >= this.config.windowMs) {
      this.state.requestCount = 0
      this.state.windowStart = now
    }
    // Check if limit exceeded
    if (this.state.requestCount >= this.config.maxRequests) {
      const waitTime = this.config.windowMs - (now - this.state.windowStart)
      if (waitTime > 0) {
        await this.wait(waitTime)
        return this.acquireFixedWindow()
      }
    }
    this.state.requestCount += 1
  }
  /**
   * Wait for specified milliseconds
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  /**
   * Check if rate limit would be exceeded
   */
  canAcquire(): boolean {
    if (this.config.strategy === 'token-bucket') {
      this.refillTokens()
      return this.state.tokens >= 1
    } else {
      const now = Date.now()
      if (now - this.state.windowStart >= this.config.windowMs) {
        return true // New window
      }
      return this.state.requestCount < this.config.maxRequests
    }
  }
  /**
   * Get current rate limit state
   */
  getState(): Readonly<RateLimitState> {
    if (this.config.strategy === 'token-bucket') {
      this.refillTokens()
    }
    return { ...this.state }
  }
  /**
   * Get rate limit statistics
   */
  getStats(): {
    availableTokens: number
    maxTokens: number
    requestCount: number
    windowProgress: number // 0-1
    strategy: string
  } {
    const now = Date.now()
    const windowElapsed = now - this.state.windowStart
    const windowProgress = Math.min(windowElapsed / this.config.windowMs, 1)
    if (this.config.strategy === 'token-bucket') {
      this.refillTokens()
      return {
        availableTokens: this.state.tokens,
        maxTokens: this.config.burstSize || this.config.maxRequests,
        requestCount: this.state.requestCount,
        windowProgress,
        strategy: this.config.strategy
      }
    } else {
      return {
        availableTokens: this.config.maxRequests - this.state.requestCount,
        maxTokens: this.config.maxRequests,
        requestCount: this.state.requestCount,
        windowProgress,
        strategy: this.config.strategy
      }
    }
  }
  /**
   * Reset rate limiter state
   */
  reset(): void {
    this.state = {
      tokens: this.config.burstSize || this.config.maxRequests,
      lastRefill: Date.now(),
      requestCount: 0,
      windowStart: Date.now()
    }
  }
  /**
   * Update rate limit configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config }
    // Adjust current tokens if burst size changed
    if (config.burstSize !== undefined) {
      this.state.tokens = Math.min(this.state.tokens, config.burstSize)
    }
  }
}
// Singleton instance with default WhatsApp Business API limits
export const rateLimiter = new RateLimiter({
  maxRequests: 80, // Conservative limit
  windowMs: 1000,
  strategy: 'token-bucket',
  burstSize: 100
})