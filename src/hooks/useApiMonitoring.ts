/**
 * API Monitoring Hook
 * Track API performance, errors, and health
 *
 * Features:
 * - Response time tracking
 * - Error rate monitoring
 * - Slow query detection (>2s)
 * - Automatic reporting to monitoring endpoint
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'

export interface ApiMetric {
  endpoint: string
  method: string
  responseTime: number
  status: 'success' | 'error'
  statusCode?: number
  error?: string
  timestamp: Date
}

export interface ApiMonitoringStats {
  totalRequests: number
  successCount: number
  errorCount: number
  averageResponseTime: number
  slowQueries: number
  errorRate: number
}

class ApiMonitor {
  private metrics: ApiMetric[] = []
  private readonly MAX_METRICS = 100
  private readonly SLOW_QUERY_THRESHOLD = 2000 // 2s
  private reportingEnabled = true

  /**
   * Track uma requisição API
   */
  track(metric: ApiMetric): void {
    this.metrics.push(metric)

    // Manter apenas últimas 100 métricas
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift()
    }

    // Detectar slow query
    if (metric.responseTime > this.SLOW_QUERY_THRESHOLD) {
      console.warn(`[API Monitor] Slow query detected: ${metric.endpoint} took ${metric.responseTime}ms`)

      // Report para monitoring
      this.reportSlowQuery(metric)
    }

    // Detectar erro
    if (metric.status === 'error') {
      console.error(`[API Monitor] API error: ${metric.endpoint}`, {
        error: metric.error,
        statusCode: metric.statusCode,
      })

      // Report para monitoring
      this.reportError(metric)
    }
  }

  /**
   * Obter estatísticas agregadas
   */
  getStats(): ApiMonitoringStats {
    const totalRequests = this.metrics.length
    const successCount = this.metrics.filter(m => m.status === 'success').length
    const errorCount = this.metrics.filter(m => m.status === 'error').length
    const slowQueries = this.metrics.filter(
      m => m.responseTime > this.SLOW_QUERY_THRESHOLD
    ).length

    const averageResponseTime = totalRequests > 0
      ? Math.round(
          this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
        )
      : 0

    const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0

    return {
      totalRequests,
      successCount,
      errorCount,
      averageResponseTime,
      slowQueries,
      errorRate,
    }
  }

  /**
   * Obter métricas por endpoint
   */
  getMetricsByEndpoint(endpoint: string): ApiMetric[] {
    return this.metrics.filter(m => m.endpoint === endpoint)
  }

  /**
   * Reportar slow query para monitoring
   */
  private async reportSlowQuery(metric: ApiMetric): Promise<void> {
    if (!this.reportingEnabled) return

    try {
      await fetch('/api/monitoring/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'slow_query',
          endpoint: metric.endpoint,
          responseTime: metric.responseTime,
          timestamp: metric.timestamp.toISOString(),
        }),
        signal: AbortSignal.timeout(2000),
      }).catch(() => {
        // Silently fail
      })
    } catch {
      // Ignorar falhas de reporting
    }
  }

  /**
   * Reportar erro para monitoring
   */
  private async reportError(metric: ApiMetric): Promise<void> {
    if (!this.reportingEnabled) return

    try {
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'api_error',
          endpoint: metric.endpoint,
          error: metric.error,
          statusCode: metric.statusCode,
          timestamp: metric.timestamp.toISOString(),
        }),
        signal: AbortSignal.timeout(2000),
      }).catch(() => {
        // Silently fail
      })
    } catch {
      // Ignorar falhas de reporting
    }
  }

  /**
   * Limpar métricas antigas
   */
  clearMetrics(): void {
    this.metrics = []
  }

  /**
   * Habilitar/desabilitar reporting
   */
  setReportingEnabled(enabled: boolean): void {
    this.reportingEnabled = enabled
  }
}

// Singleton instance
const apiMonitor = new ApiMonitor()

/**
 * Hook para monitorar chamadas API
 */
export function useApiMonitoring() {
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Wrapper para fetch com monitoramento
   */
  const monitoredFetch = useCallback(
    async <T = any>(
      endpoint: string,
      options?: RequestInit
    ): Promise<T> => {
      // Cancelar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      const startTime = Date.now()
      const method = options?.method || 'GET'

      try {
        const response = await fetch(endpoint, {
          ...options,
          signal: abortController.signal,
        })

        const responseTime = Date.now() - startTime
        const statusCode = response.status

        if (!response.ok) {
          const error = await response.text()

          // Track erro
          apiMonitor.track({
            endpoint,
            method,
            responseTime,
            status: 'error',
            statusCode,
            error,
            timestamp: new Date(),
          })

          throw new Error(error || `HTTP ${statusCode}`)
        }

        const data = await response.json()

        // Track sucesso
        apiMonitor.track({
          endpoint,
          method,
          responseTime,
          status: 'success',
          statusCode,
          timestamp: new Date(),
        })

        return data
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request foi cancelada - não reportar como erro
          throw error
        }

        const responseTime = Date.now() - startTime

        // Track erro
        apiMonitor.track({
          endpoint,
          method,
          responseTime,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        })

        throw error
      }
    },
    []
  )

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * Obter estatísticas
   */
  const getStats = useCallback(() => {
    return apiMonitor.getStats()
  }, [])

  /**
   * Obter métricas de um endpoint específico
   */
  const getMetricsByEndpoint = useCallback((endpoint: string) => {
    return apiMonitor.getMetricsByEndpoint(endpoint)
  }, [])

  /**
   * Limpar métricas
   */
  const clearMetrics = useCallback(() => {
    apiMonitor.clearMetrics()
  }, [])

  return {
    monitoredFetch,
    getStats,
    getMetricsByEndpoint,
    clearMetrics,
  }
}

/**
 * Hook para monitorar health de múltiplos endpoints
 */
export function useEndpointHealth(endpoints: string[], intervalMs = 60000) {
  const { monitoredFetch } = useApiMonitoring()

  useEffect(() => {
    // Health check inicial
    const checkHealth = async () => {
      for (const endpoint of endpoints) {
        try {
          await monitoredFetch(`${endpoint}`, { method: 'HEAD' })
        } catch (error) {
          console.warn(`[Health Check] ${endpoint} is unhealthy:`, error)
        }
      }
    }

    checkHealth()

    // Periodic health checks
    const interval = setInterval(checkHealth, intervalMs)

    return () => clearInterval(interval)
  }, [endpoints, intervalMs, monitoredFetch])
}

/**
 * Exportar singleton para uso direto
 */
export { apiMonitor }

/**
 * Hook para monitorar métricas específicas da Fase 2
 *
 * Tracking adicional:
 * - Delivery status response times
 * - Contextual actions cache hit rate
 * - WhatsApp redirect count por context
 * - Alertas se delivery-status > 5s
 */
export function usePhase2Monitoring() {
  const { monitoredFetch, getMetricsByEndpoint } = useApiMonitoring()

  /**
   * Obter estatísticas do delivery-status
   */
  const getDeliveryStatusStats = useCallback(() => {
    const metrics = getMetricsByEndpoint('/api/assinante/delivery-status')

    if (metrics.length === 0) {
      return null
    }

    const avgResponseTime = Math.round(
      metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length
    )

    const slowRequests = metrics.filter(m => m.responseTime > 5000).length
    const errorRate = metrics.filter(m => m.status === 'error').length / metrics.length

    return {
      totalRequests: metrics.length,
      avgResponseTime,
      slowRequests,
      errorRate,
      lastRequest: metrics[metrics.length - 1],
    }
  }, [getMetricsByEndpoint])

  /**
   * Obter estatísticas do contextual-actions
   */
  const getContextualActionsStats = useCallback(() => {
    const metrics = getMetricsByEndpoint('/api/assinante/contextual-actions')

    if (metrics.length === 0) {
      return null
    }

    // Cache hit rate baseado em response time (< 100ms provavelmente é cache)
    const cacheHits = metrics.filter(m => m.responseTime < 100).length
    const cacheHitRate = cacheHits / metrics.length

    return {
      totalRequests: metrics.length,
      cacheHits,
      cacheHitRate,
      avgResponseTime: Math.round(
        metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length
      ),
    }
  }, [getMetricsByEndpoint])

  /**
   * Alertar se delivery-status muito lento
   */
  useEffect(() => {
    const checkDeliveryPerformance = () => {
      const stats = getDeliveryStatusStats()

      if (stats && stats.avgResponseTime > 5000) {
        console.warn(
          `[Phase2Monitoring] Delivery-status slow: ${stats.avgResponseTime}ms average`
        )
      }
    }

    const interval = setInterval(checkDeliveryPerformance, 60000) // A cada 1 minuto

    return () => clearInterval(interval)
  }, [getDeliveryStatusStats])

  return {
    monitoredFetch,
    getDeliveryStatusStats,
    getContextualActionsStats,
  }
}
