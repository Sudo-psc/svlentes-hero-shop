/**
 * Phase 3 Monitoring
 * Healthcare-grade error monitoring and alerting for Phase 3 features
 *
 * Features:
 * - LGPD-compliant logging (zero PII)
 * - Severity-based alerting
 * - Error aggregation and deduplication
 * - Performance tracking
 * - Circuit breaker monitoring
 */

import {
  Phase3BaseError,
  Phase3ErrorSeverity,
  Phase3ErrorContext,
} from './phase3-error-types'

// ============================================================================
// TYPES
// ============================================================================

export interface ErrorLog {
  feature: 'prescription' | 'payment-history' | 'delivery-preferences'
  operation: string
  errorType: string
  errorCode: string
  severity: Phase3ErrorSeverity
  message: string
  userMessage: string
  timestamp: Date
  context: Record<string, unknown>
  retryable: boolean
  stackTrace?: string
}

export interface PerformanceMetric {
  feature: string
  operation: string
  duration: number
  success: boolean
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface AlertConfig {
  severity: Phase3ErrorSeverity
  threshold: number // número de ocorrências
  windowMs: number // janela de tempo em ms
}

export interface Alert {
  feature: string
  operation: string
  severity: Phase3ErrorSeverity
  count: number
  firstOccurrence: Date
  lastOccurrence: Date
  message: string
}

// ============================================================================
// MONITORING CLASS
// ============================================================================

export class Phase3Monitoring {
  private errorLogs: ErrorLog[] = []
  private performanceMetrics: PerformanceMetric[] = []
  private alerts: Map<string, Alert> = new Map()
  private errorCounts: Map<string, number> = new Map()

  // Alert thresholds
  private alertConfigs: AlertConfig[] = [
    {
      severity: Phase3ErrorSeverity.CRITICAL,
      threshold: 1, // Alert on first critical error
      windowMs: 5 * 60 * 1000, // 5 minutes
    },
    {
      severity: Phase3ErrorSeverity.HIGH,
      threshold: 3,
      windowMs: 5 * 60 * 1000,
    },
    {
      severity: Phase3ErrorSeverity.MEDIUM,
      threshold: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    {
      severity: Phase3ErrorSeverity.LOW,
      threshold: 50,
      windowMs: 60 * 60 * 1000, // 1 hour
    },
  ]

  /**
   * Log Phase 3 error
   */
  logError(error: Phase3BaseError): void {
    const errorLog: ErrorLog = {
      feature: error.context.feature,
      operation: error.context.operation,
      errorType: error.name,
      errorCode: error.code,
      severity: error.severity,
      message: error.message,
      userMessage: error.userMessage,
      timestamp: new Date(),
      context: this.sanitizeContext(error.context),
      retryable: error.retryable,
      stackTrace: this.sanitizeStackTrace(error.stack),
    }

    // Add to logs
    this.errorLogs.push(errorLog)

    // Trim old logs (keep last 1000)
    if (this.errorLogs.length > 1000) {
      this.errorLogs = this.errorLogs.slice(-1000)
    }

    // Console log with severity indicator
    this.consoleLogError(errorLog)

    // Check alert thresholds
    this.checkAlertThresholds(errorLog)

    // Send to monitoring endpoint (non-blocking)
    this.sendToMonitoringEndpoint(errorLog)

    // Send alert if critical
    if (error.severity === Phase3ErrorSeverity.CRITICAL) {
      this.sendAlert(errorLog)
    }
  }

  /**
   * Log performance metric
   */
  logPerformance(metric: PerformanceMetric): void {
    this.performanceMetrics.push(metric)

    // Trim old metrics (keep last 500)
    if (this.performanceMetrics.length > 500) {
      this.performanceMetrics = this.performanceMetrics.slice(-500)
    }

    // Warn on slow operations (>5s)
    if (metric.duration > 5000) {
      console.warn('[Phase3][Performance] Slow operation detected:', {
        feature: metric.feature,
        operation: metric.operation,
        duration: `${metric.duration}ms`,
      })
    }
  }

  /**
   * Track operation performance
   */
  async trackOperation<T>(
    feature: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    let success = false

    try {
      const result = await fn()
      success = true
      return result
    } finally {
      const duration = Date.now() - startTime

      this.logPerformance({
        feature,
        operation,
        duration,
        success,
        timestamp: new Date(),
      })
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(feature?: string): {
    total: number
    bySeverity: Record<Phase3ErrorSeverity, number>
    byFeature: Record<string, number>
    recent: ErrorLog[]
  } {
    const logs = feature
      ? this.errorLogs.filter((log) => log.feature === feature)
      : this.errorLogs

    const bySeverity: Record<Phase3ErrorSeverity, number> = {
      [Phase3ErrorSeverity.LOW]: 0,
      [Phase3ErrorSeverity.MEDIUM]: 0,
      [Phase3ErrorSeverity.HIGH]: 0,
      [Phase3ErrorSeverity.CRITICAL]: 0,
    }

    const byFeature: Record<string, number> = {}

    logs.forEach((log) => {
      bySeverity[log.severity]++
      byFeature[log.feature] = (byFeature[log.feature] || 0) + 1
    })

    return {
      total: logs.length,
      bySeverity,
      byFeature,
      recent: logs.slice(-10), // Last 10 errors
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(feature?: string): {
    total: number
    averageDuration: number
    successRate: number
    slowOperations: number
    recent: PerformanceMetric[]
  } {
    const metrics = feature
      ? this.performanceMetrics.filter((m) => m.feature === feature)
      : this.performanceMetrics

    if (metrics.length === 0) {
      return {
        total: 0,
        averageDuration: 0,
        successRate: 0,
        slowOperations: 0,
        recent: [],
      }
    }

    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0)
    const successCount = metrics.filter((m) => m.success).length
    const slowCount = metrics.filter((m) => m.duration > 5000).length

    return {
      total: metrics.length,
      averageDuration: Math.round(totalDuration / metrics.length),
      successRate: Math.round((successCount / metrics.length) * 100),
      slowOperations: slowCount,
      recent: metrics.slice(-10),
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts.clear()
  }

  /**
   * Clear all monitoring data
   */
  clearAll(): void {
    this.errorLogs = []
    this.performanceMetrics = []
    this.alerts.clear()
    this.errorCounts.clear()
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private sanitizeContext(context: Phase3ErrorContext): Record<string, unknown> {
    // Remove PII (already done in Phase3BaseError, but double-check)
    const sanitized: Record<string, unknown> = {
      feature: context.feature,
      operation: context.operation,
      timestamp: context.timestamp || new Date(),
    }

    // Include userId only (not sensitive PII)
    if (context.userId) {
      sanitized.userId = context.userId
    }

    // Sanitize metadata
    if (context.metadata) {
      sanitized.metadata = this.sanitizeMetadata(context.metadata)
    }

    return sanitized
  }

  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {}
    const sensitiveKeys = ['email', 'cpf', 'phone', 'password', 'token', 'address', 'cep']

    for (const [key, value] of Object.entries(metadata)) {
      // Skip sensitive data
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        continue
      }

      sanitized[key] = value
    }

    return sanitized
  }

  private sanitizeStackTrace(stack?: string): string | undefined {
    if (!stack) return undefined

    // Remove file paths that might contain usernames
    return stack
      .split('\n')
      .map((line) => {
        // Remove absolute paths, keep only relative
        return line.replace(/\/[^\s]+\//g, '')
      })
      .join('\n')
  }

  private consoleLogError(log: ErrorLog): void {
    const severityEmoji = {
      [Phase3ErrorSeverity.LOW]: '🟢',
      [Phase3ErrorSeverity.MEDIUM]: '🟡',
      [Phase3ErrorSeverity.HIGH]: '🟠',
      [Phase3ErrorSeverity.CRITICAL]: '🔴',
    }

    console.error(
      `[Phase3][${severityEmoji[log.severity]}${log.severity}][${log.feature}] ${log.errorCode}:`,
      {
        operation: log.operation,
        message: log.message,
        userMessage: log.userMessage,
        retryable: log.retryable,
        context: log.context,
      }
    )
  }

  private checkAlertThresholds(log: ErrorLog): void {
    const alertKey = `${log.feature}-${log.operation}-${log.severity}`

    // Get config for this severity
    const config = this.alertConfigs.find((c) => c.severity === log.severity)
    if (!config) return

    // Count errors in time window
    const windowStart = Date.now() - config.windowMs
    const recentErrors = this.errorLogs.filter(
      (e) =>
        e.feature === log.feature &&
        e.operation === log.operation &&
        e.severity === log.severity &&
        e.timestamp.getTime() >= windowStart
    )

    if (recentErrors.length >= config.threshold) {
      // Create or update alert
      const existingAlert = this.alerts.get(alertKey)

      if (existingAlert) {
        existingAlert.count = recentErrors.length
        existingAlert.lastOccurrence = new Date()
      } else {
        this.alerts.set(alertKey, {
          feature: log.feature,
          operation: log.operation,
          severity: log.severity,
          count: recentErrors.length,
          firstOccurrence: recentErrors[0].timestamp,
          lastOccurrence: new Date(),
          message: `${log.severity} error threshold exceeded: ${recentErrors.length} errors in ${config.windowMs / 1000}s`,
        })

        console.warn(
          `[Phase3][Alert] ${log.severity} threshold exceeded for ${log.feature}/${log.operation}`
        )
      }
    }
  }

  private async sendToMonitoringEndpoint(log: ErrorLog): Promise<void> {
    // Send to monitoring API (non-blocking, fire and forget)
    try {
      if (typeof window !== 'undefined') {
        // Client-side monitoring
        await fetch('/api/monitoring/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'phase3_error',
            ...log,
          }),
          signal: AbortSignal.timeout(2000),
        }).catch(() => {
          // Silently fail - don't break app for monitoring failures
        })
      }
    } catch {
      // Ignore monitoring failures
    }
  }

  private async sendAlert(log: ErrorLog): Promise<void> {
    // Send critical alert (webhook, email, etc.)
    try {
      if (typeof window === 'undefined') {
        // Server-side alert
        console.error('[Phase3][CRITICAL_ALERT]', {
          feature: log.feature,
          operation: log.operation,
          errorCode: log.errorCode,
          message: log.message,
          timestamp: log.timestamp,
        })

        // TODO: Integrate with alerting service (PagerDuty, Slack, etc.)
        // await sendSlackAlert({ ... })
      }
    } catch {
      // Ignore alert failures
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const phase3Monitoring = new Phase3Monitoring()

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Log Phase 3 error
 */
export function logPhase3Error(error: Phase3BaseError): void {
  phase3Monitoring.logError(error)
}

/**
 * Log Phase 3 performance metric
 */
export function logPhase3Performance(metric: PerformanceMetric): void {
  phase3Monitoring.logPerformance(metric)
}

/**
 * Track Phase 3 operation with performance logging
 */
export async function trackPhase3Operation<T>(
  feature: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return phase3Monitoring.trackOperation(feature, operation, fn)
}

/**
 * Get Phase 3 error statistics
 */
export function getPhase3ErrorStats(feature?: string) {
  return phase3Monitoring.getErrorStats(feature)
}

/**
 * Get Phase 3 performance statistics
 */
export function getPhase3PerformanceStats(feature?: string) {
  return phase3Monitoring.getPerformanceStats(feature)
}

/**
 * Sanitize PII from data for logging
 */
export function sanitizePII(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizePII(item))
  }

  const sanitized: Record<string, unknown> = {}
  const sensitiveKeys = ['email', 'cpf', 'phone', 'password', 'token', 'address', 'cep', 'name']

  for (const [key, value] of Object.entries(data)) {
    // Skip sensitive keys
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
      sanitized[key] = '***REDACTED***'
      continue
    }

    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePII(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}
