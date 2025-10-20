/**
 * SendPulse Retry Manager
 * Exponential backoff retry logic for transient failures
 * Handles network errors and temporary API issues
 */
import type { RetryConfig, RetryAttempt } from './types'
import { SendPulseNetworkError, SendPulseRateLimitError } from './errors'
export class RetryManager {
  private config: RetryConfig
  private attempts: Map<string, RetryAttempt[]> = new Map()
  constructor(config?: Partial<RetryConfig>) {
    this.config = {
      maxRetries: 3,
      initialDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2, // Exponential: 2^n
      retryableStatusCodes: [429, 500, 502, 503, 504],
      retryableErrors: [
        'ECONNRESET',
        'ETIMEDOUT',
        'ECONNREFUSED',
        'ENETUNREACH',
        'EAI_AGAIN'
      ],
      ...config
    }
  }
  /**
   * Execute function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    operationId?: string
  ): Promise<T> {
    const id = operationId || this.generateOperationId()
    this.attempts.set(id, [])
    return this.executeWithRetry(fn, id, 0)
  }
  /**
   * Internal retry execution
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    operationId: string,
    attempt: number
  ): Promise<T> {
    try {
      const result = await fn()
      // Success - clean up attempts tracking
      this.attempts.delete(operationId)
      return result
    } catch (error) {
      // Record attempt
      this.recordAttempt(operationId, attempt, error as Error)
      // Check if we should retry
      if (attempt >= this.config.maxRetries || !this.isRetryable(error)) {
        this.attempts.delete(operationId)
        throw error
      }
      // Calculate delay and retry
      const delay = this.calculateDelay(attempt, error)
      console.log(
        `[RetryManager] Attempt ${attempt + 1}/${this.config.maxRetries + 1} failed, retrying in ${delay}ms...`,
        error instanceof Error ? error.message : error
      )
      await this.wait(delay)
      return this.executeWithRetry(fn, operationId, attempt + 1)
    }
  }
  /**
   * Check if error is retryable
   */
  private isRetryable(error: unknown): boolean {
    // Rate limit errors (429)
    if (error instanceof SendPulseRateLimitError) {
      return true
    }
    // Network errors
    if (error instanceof SendPulseNetworkError) {
      return true
    }
    // Standard Error with code
    if (error instanceof Error) {
      const err = error as any
      // Check error code (for network errors)
      if (err.code && this.config.retryableErrors.includes(err.code)) {
        return true
      }
      // Check status code (for HTTP errors)
      if (err.statusCode && this.config.retryableStatusCodes.includes(err.statusCode)) {
        return true
      }
      // Check if it's a fetch error
      if (err.cause?.code && this.config.retryableErrors.includes(err.cause.code)) {
        return true
      }
    }
    // Response object with status
    if (typeof error === 'object' && error !== null) {
      const response = error as any
      if (response.status && this.config.retryableStatusCodes.includes(response.status)) {
        return true
      }
    }
    return false
  }
  /**
   * Calculate delay for next retry with exponential backoff
   */
  private calculateDelay(attempt: number, error: unknown): number {
    // Base exponential backoff: initialDelay * (backoffMultiplier ^ attempt)
    let delay = this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attempt)
    // Add jitter (±25%) to prevent thundering herd
    const jitter = delay * 0.25 * (Math.random() - 0.5)
    delay += jitter
    // Respect Retry-After header for rate limits
    if (error instanceof SendPulseRateLimitError && error.context?.retryAfter) {
      const retryAfter = error.context.retryAfter * 1000 // Convert to ms
      delay = Math.max(delay, retryAfter)
    }
    // Cap at max delay
    return Math.min(delay, this.config.maxDelay)
  }
  /**
   * Wait for specified milliseconds
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }
  /**
   * Record retry attempt
   */
  private recordAttempt(operationId: string, attempt: number, error: Error): void {
    const attempts = this.attempts.get(operationId) || []
    attempts.push({
      attempt,
      delay: this.calculateDelay(attempt, error),
      error,
      timestamp: Date.now()
    })
    this.attempts.set(operationId, attempts)
  }
  /**
   * Get retry attempts for an operation
   */
  getAttempts(operationId: string): RetryAttempt[] {
    return this.attempts.get(operationId) || []
  }
  /**
   * Get retry statistics
   */
  getStats(): {
    totalOperations: number
    activeRetries: number
    averageAttempts: number
    config: RetryConfig
  } {
    const activeRetries = this.attempts.size
    let totalAttempts = 0
    Array.from(this.attempts.values()).forEach(attempts => {
      totalAttempts += attempts.length
    })
    const averageAttempts = activeRetries > 0 ? totalAttempts / activeRetries : 0
    return {
      totalOperations: this.attempts.size,
      activeRetries,
      averageAttempts,
      config: { ...this.config }
    }
  }
  /**
   * Clear retry history
   */
  clear(): void {
    this.attempts.clear()
  }
  /**
   * Update retry configuration
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config }
  }
  /**
   * Create a retry wrapper for a function
   */
  wrap<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return (async (...args: any[]) => {
      return this.execute(() => fn(...args))
    }) as T
  }
}
// Singleton instance with default configuration
export const retryManager = new RetryManager({
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2
})