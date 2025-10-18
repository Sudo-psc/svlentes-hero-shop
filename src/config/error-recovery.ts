/**
 * Advanced Error Recovery Module for Centralized Configuration
 *
 * Features:
 * - Circuit breaker pattern to prevent cascading failures
 * - Retry logic with exponential backoff
 * - Health monitoring and metrics tracking
 * - Graceful degradation strategies
 */

export interface CircuitBreakerConfig {
  failureThreshold: number // Number of failures before opening circuit
  resetTimeout: number     // Time (ms) before attempting reset
  monitorWindow: number    // Time window (ms) for failure tracking
}

export interface RetryConfig {
  maxAttempts: number
  initialDelay: number    // Initial delay in ms
  maxDelay: number        // Maximum delay in ms
  backoffMultiplier: number // Exponential backoff factor
}

export interface HealthMetrics {
  totalAttempts: number
  successCount: number
  failureCount: number
  lastSuccess: Date | null
  lastFailure: Date | null
  currentState: 'healthy' | 'degraded' | 'failed'
  circuitState: CircuitState
}

export enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation
  OPEN = 'OPEN',       // Failing fast, not attempting calls
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

/**
 * Circuit Breaker Implementation
 *
 * Prevents repeated attempts to load config when system is known to be failing.
 * Transitions between CLOSED (normal), OPEN (failing), and HALF_OPEN (testing) states.
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private nextAttemptTime = 0
  private failures: Date[] = []

  constructor(private config: CircuitBreakerConfig) {}

  /**
   * Check if circuit allows operation
   */
  canAttempt(): boolean {
    const now = Date.now()

    // Clean old failures outside monitor window
    this.failures = this.failures.filter(
      failure => now - failure.getTime() < this.config.monitorWindow
    )

    if (this.state === CircuitState.OPEN) {
      // Check if enough time has passed to try again
      if (now >= this.nextAttemptTime) {
        this.state = CircuitState.HALF_OPEN
        return true
      }
      return false
    }

    return true
  }

  /**
   * Record successful operation
   */
  recordSuccess(): void {
    this.failureCount = 0
    this.failures = []
    this.state = CircuitState.CLOSED
  }

  /**
   * Record failed operation
   */
  recordFailure(): void {
    const now = new Date()
    this.failures.push(now)
    this.failureCount++

    if (this.state === CircuitState.HALF_OPEN) {
      // Failed while testing - go back to OPEN
      this.openCircuit()
    } else if (this.failureCount >= this.config.failureThreshold) {
      // Reached failure threshold - open circuit
      this.openCircuit()
    }
  }

  /**
   * Open circuit and set reset timer
   */
  private openCircuit(): void {
    this.state = CircuitState.OPEN
    this.nextAttemptTime = Date.now() + this.config.resetTimeout
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * Reset circuit breaker (for testing/admin purposes)
   */
  reset(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.failures = []
    this.nextAttemptTime = 0
  }
}

/**
 * Retry Logic with Exponential Backoff
 *
 * Implements retry strategy with exponential backoff and jitter
 * to prevent thundering herd problem.
 */
export class RetryStrategy {
  constructor(private config: RetryConfig) {}

  /**
   * Execute operation with retry logic
   */
  async execute<T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: Error | undefined
    let attempt = 0

    while (attempt < this.config.maxAttempts) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        attempt++

        if (attempt >= this.config.maxAttempts) {
          // Max attempts reached, throw error
          break
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt)
        console.warn(
          `[RetryStrategy] ${context} failed (attempt ${attempt}/${this.config.maxAttempts}). ` +
          `Retrying in ${delay}ms... Error: ${lastError.message}`
        )

        await this.sleep(delay)
      }
    }

    throw new Error(
      `${context} failed after ${this.config.maxAttempts} attempts. ` +
      `Last error: ${lastError?.message}`
    )
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number): number {
    // Exponential backoff: initialDelay * (backoffMultiplier ^ attempt)
    const exponentialDelay = Math.min(
      this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attempt - 1),
      this.config.maxDelay
    )

    // Add jitter (random variation ±25%) to prevent thundering herd
    const jitter = exponentialDelay * (0.75 + Math.random() * 0.5)

    return Math.floor(jitter)
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Health Monitor
 *
 * Tracks config system health and provides metrics.
 */
export class HealthMonitor {
  private metrics: HealthMetrics = {
    totalAttempts: 0,
    successCount: 0,
    failureCount: 0,
    lastSuccess: null,
    lastFailure: null,
    currentState: 'healthy',
    circuitState: CircuitState.CLOSED
  }

  /**
   * Record successful operation
   */
  recordSuccess(): void {
    this.metrics.totalAttempts++
    this.metrics.successCount++
    this.metrics.lastSuccess = new Date()
    this.updateHealthState()
  }

  /**
   * Record failed operation
   */
  recordFailure(): void {
    this.metrics.totalAttempts++
    this.metrics.failureCount++
    this.metrics.lastFailure = new Date()
    this.updateHealthState()
  }

  /**
   * Update circuit state in metrics
   */
  updateCircuitState(state: CircuitState): void {
    this.metrics.circuitState = state
    this.updateHealthState()
  }

  /**
   * Update overall health state based on metrics
   */
  private updateHealthState(): void {
    if (this.metrics.circuitState === CircuitState.OPEN) {
      this.metrics.currentState = 'failed'
      return
    }

    const totalAttempts = this.metrics.totalAttempts
    if (totalAttempts === 0) {
      this.metrics.currentState = 'healthy'
      return
    }

    const successRate = this.metrics.successCount / totalAttempts

    if (successRate >= 0.95) {
      this.metrics.currentState = 'healthy'
    } else if (successRate >= 0.7) {
      this.metrics.currentState = 'degraded'
    } else {
      this.metrics.currentState = 'failed'
    }
  }

  /**
   * Get current health metrics
   */
  getMetrics(): HealthMetrics {
    return { ...this.metrics }
  }

  /**
   * Get simple health status
   */
  getHealthStatus(): 'healthy' | 'degraded' | 'failed' {
    return this.metrics.currentState
  }

  /**
   * Check if system is operational
   */
  isOperational(): boolean {
    return this.metrics.currentState !== 'failed'
  }

  /**
   * Reset metrics (for testing/admin purposes)
   */
  reset(): void {
    this.metrics = {
      totalAttempts: 0,
      successCount: 0,
      failureCount: 0,
      lastSuccess: null,
      lastFailure: null,
      currentState: 'healthy',
      circuitState: CircuitState.CLOSED
    }
  }
}

/**
 * Error Recovery Manager
 *
 * Coordinates circuit breaker, retry logic, and health monitoring.
 */
export class ErrorRecoveryManager {
  private circuitBreaker: CircuitBreaker
  private retryStrategy: RetryStrategy
  private healthMonitor: HealthMonitor

  constructor(
    circuitConfig: CircuitBreakerConfig = {
      failureThreshold: 3,
      resetTimeout: 60000, // 1 minute
      monitorWindow: 300000 // 5 minutes
    },
    retryConfig: RetryConfig = {
      maxAttempts: 3,
      initialDelay: 100,
      maxDelay: 5000,
      backoffMultiplier: 2
    }
  ) {
    this.circuitBreaker = new CircuitBreaker(circuitConfig)
    this.retryStrategy = new RetryStrategy(retryConfig)
    this.healthMonitor = new HealthMonitor()
  }

  /**
   * Execute operation with full error recovery
   */
  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T> {
    // Check circuit breaker
    if (!this.circuitBreaker.canAttempt()) {
      this.healthMonitor.updateCircuitState(this.circuitBreaker.getState())
      throw new Error(
        `Circuit breaker is OPEN for ${context}. System is failing, not attempting operation.`
      )
    }

    try {
      // Execute with retry logic
      const result = await this.retryStrategy.execute(operation, context)

      // Record success
      this.circuitBreaker.recordSuccess()
      this.healthMonitor.recordSuccess()
      this.healthMonitor.updateCircuitState(this.circuitBreaker.getState())

      return result
    } catch (error) {
      // Record failure
      this.circuitBreaker.recordFailure()
      this.healthMonitor.recordFailure()
      this.healthMonitor.updateCircuitState(this.circuitBreaker.getState())

      throw error
    }
  }

  /**
   * Get health metrics
   */
  getHealthMetrics(): HealthMetrics {
    return this.healthMonitor.getMetrics()
  }

  /**
   * Get health status
   */
  getHealthStatus(): 'healthy' | 'degraded' | 'failed' {
    return this.healthMonitor.getHealthStatus()
  }

  /**
   * Check if system is operational
   */
  isOperational(): boolean {
    return this.healthMonitor.isOperational()
  }

  /**
   * Reset error recovery (for testing/admin purposes)
   */
  reset(): void {
    this.circuitBreaker.reset()
    this.healthMonitor.reset()
  }
}

// Singleton instance for global use
export const errorRecovery = new ErrorRecoveryManager()
