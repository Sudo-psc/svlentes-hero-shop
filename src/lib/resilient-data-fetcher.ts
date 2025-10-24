/**
 * Resilient Data Fetcher
 * Sistema robusto de fallbacks e redundância para chamadas API
 */
import { z } from 'zod'
// Types para o sistema de resiliência
export interface FetchConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  retries?: number
  fallbackData?: any
  cacheStrategy?: 'memory' | 'localStorage' | 'indexedDB' | 'none'
  cacheTTL?: number
}
export interface FetchResult<T = any> {
  data?: T
  error?: string
  status: 'success' | 'error' | 'fallback' | 'cached'
  fromCache: boolean
  attempts: number
  responseTime: number
}
export interface HealthCheck {
  endpoint: string
  method: 'GET' | 'HEAD'
  timeout: number
  healthy: boolean
  lastChecked: Date
  responseTime?: number
  error?: string
}
class ResilientDataFetcher {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private healthChecks = new Map<string, HealthCheck>()
  private activeRequests = new Map<string, Promise<any>>()
  private circuitBreakers = new Map<string, { failures: number; lastFailure: Date; state: 'closed' | 'open' | 'half-open' }>()
  // Configurações defaults
  private readonly defaultConfig = {
    timeout: 10000,
    retries: 3,
    cacheTTL: 5 * 60 * 1000, // 5 minutos
    circuitBreakerThreshold: 5,
    circuitBreakerTimeout: 60 * 1000, // 1 minuto
  }
  /**
   * Busca dados com múltiplas camadas de fallback
   */
  async fetch<T = any>(config: FetchConfig): Promise<FetchResult<T>> {
    const startTime = Date.now()
    const requestId = this.generateRequestId(config)
    // Verificar se já existe uma request em andamento (deduplication)
    if (this.activeRequests.has(requestId)) {
      try {
        const data = await this.activeRequests.get(requestId)
        return {
          data,
          status: 'success',
          fromCache: false,
          attempts: 1,
          responseTime: Date.now() - startTime
        }
      } catch (error) {
        this.activeRequests.delete(requestId)
      }
    }
    // Implementar a request como uma Promise
    const requestPromise = this.executeRequest<T>(config, startTime, requestId)
    this.activeRequests.set(requestId, requestPromise)
    try {
      const result = await requestPromise
      return result
    } finally {
      this.activeRequests.delete(requestId)
    }
  }
  private async executeRequest<T>(
    config: FetchConfig,
    startTime: number,
    requestId: string
  ): Promise<FetchResult<T>> {
    const mergedConfig = { ...this.defaultConfig, ...config }
    // 1. Verificar cache primeiro
    const cachedData = this.getFromCache<T>(requestId, mergedConfig.cacheTTL)
    if (cachedData) {
      this.stats.total++
      this.stats.cacheHits++
      this.stats.totalResponseTime += Date.now() - startTime

      return {
        data: cachedData,
        status: 'cached',
        fromCache: true,
        attempts: 0,
        responseTime: Date.now() - startTime
      }
    }
    // 2. Verificar circuit breaker
    if (this.isCircuitOpen(config.url)) {
      console.warn(`[ResilientFetcher] Circuit breaker open for ${config.url}`)
      return this.handleCircuitBreakerOpen<T>(config, startTime)
    }
    // 3. Tentar requisição com retries
    let lastError: Error | null = null
    let attempts = 0
    for (let attempt = 0; attempt <= mergedConfig.retries; attempt++) {
      attempts = attempt + 1
      try {
        const result = await this.performRequest<T>(config, mergedConfig)
        // Sucesso! Reset circuit breaker e salvar no cache
        this.resetCircuitBreaker(config.url)
        this.saveToCache(requestId, result.data, mergedConfig.cacheTTL)

        // Update stats
        this.stats.total++
        this.stats.success++
        this.stats.totalResponseTime += Date.now() - startTime

        return {
          data: result.data,
          status: 'success',
          fromCache: false,
          attempts,
          responseTime: Date.now() - startTime
        }
      } catch (error) {
        lastError = error as Error
        console.error(`[ResilientFetcher] Attempt ${attempt + 1} failed:`, error)
        // Se for o último erro, registrar falha no circuit breaker
        if (attempt === mergedConfig.retries) {
          this.recordCircuitBreakerFailure(config.url)
        }
        // Esperar antes de tentar novamente (exponential backoff)
        if (attempt < mergedConfig.retries) {
          await this.delay(Math.pow(2, attempt) * 1000)
        }
      }
    }
    // 4. Todos os retries falharam - tentar fallbacks
    // Update failure stats
    this.stats.total++
    this.stats.failed++
    this.stats.totalResponseTime += Date.now() - startTime

    return this.handleAllRetriesFailed<T>(config, lastError!, attempts, startTime)
  }
  private async performRequest<T>(
    config: FetchConfig,
    mergedConfig: FetchConfig
  ): Promise<{ data: T }> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), mergedConfig.timeout)
    try {
      const response = await fetch(config.url, {
        method: config.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      return { data }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${mergedConfig.timeout}ms`)
        }
        throw error
      }
      throw new Error('Unknown request error')
    }
  }
  private handleAllRetriesFailed<T>(
    config: FetchConfig,
    error: Error,
    attempts: number,
    startTime: number
  ): FetchResult<T> {
    // 1. Tentar retornar dados fallback
    if (config.fallbackData !== undefined) {
      console.warn(`[ResilientFetcher] Using fallback data for ${config.url}`)
      return {
        data: config.fallbackData,
        status: 'fallback',
        fromCache: false,
        attempts,
        responseTime: Date.now() - startTime
      }
    }
    // 2. Tentar obter do cache expirado
    const expiredCache = this.getFromCache<T>(this.generateRequestId(config), 0)
    if (expiredCache) {
      console.warn(`[ResilientFetcher] Using expired cache for ${config.url}`)
      return {
        data: expiredCache,
        status: 'fallback',
        fromCache: true,
        attempts,
        responseTime: Date.now() - startTime
      }
    }
    // 3. Retornar erro
    return {
      error: error.message,
      status: 'error',
      fromCache: false,
      attempts,
      responseTime: Date.now() - startTime
    }
  }
  private handleCircuitBreakerOpen<T>(config: FetchConfig, startTime: number): FetchResult<T> {
    // Circuit breaker aberto - tentar cache ou fallback
    const cachedData = this.getFromCache<T>(this.generateRequestId(config), 0)
    if (cachedData) {
      return {
        data: cachedData,
        status: 'fallback',
        fromCache: true,
        attempts: 0,
        responseTime: Date.now() - startTime
      }
    }
    if (config.fallbackData !== undefined) {
      return {
        data: config.fallbackData,
        status: 'fallback',
        fromCache: false,
        attempts: 0,
        responseTime: Date.now() - startTime
      }
    }
    return {
      error: 'Circuit breaker open - service temporarily unavailable',
      status: 'error',
      fromCache: false,
      attempts: 0,
      responseTime: Date.now() - startTime
    }
  }
  /**
   * Health check para endpoints
   */
  async performHealthCheck(endpoint: string): Promise<HealthCheck> {
    const startTime = Date.now()
    try {
      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      })
      const responseTime = Date.now() - startTime
      const healthCheck: HealthCheck = {
        endpoint,
        method: 'HEAD',
        timeout: 5000,
        healthy: response.ok,
        lastChecked: new Date(),
        responseTime
      }
      this.healthChecks.set(endpoint, healthCheck)
      return healthCheck
    } catch (error) {
      const healthCheck: HealthCheck = {
        endpoint,
        method: 'HEAD',
        timeout: 5000,
        healthy: false,
        lastChecked: new Date(),
        error: (error as Error).message
      }
      this.healthChecks.set(endpoint, healthCheck)
      return healthCheck
    }
  }
  /**
   * Verificar se endpoint está saudável
   */
  isEndpointHealthy(endpoint: string): boolean {
    const healthCheck = this.healthChecks.get(endpoint)
    if (!healthCheck) return true // Assumir saudável se não tiver informação
    // Considerar não saudável se falhar ou último check há mais de 5 minutos
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return healthCheck.healthy && healthCheck.lastChecked > fiveMinutesAgo
  }
  /**
   * Métodos de cache
   */
  private getFromCache<T>(key: string, ttl: number): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    const now = Date.now()
    if (now - cached.timestamp > ttl) {
      this.cache.delete(key)
      return null
    }
    return cached.data as T
  }
  private saveToCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
    // Limpar cache expirado periodicamente
    this.cleanExpiredCache()
  }
  private cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key)
      }
    }
  }
  /**
   * Circuit Breaker methods
   */
  private isCircuitOpen(url: string): boolean {
    const breaker = this.circuitBreakers.get(url)
    if (!breaker) return false
    if (breaker.state === 'open') {
      // Verificar se já pode tentar novamente (half-open)
      const timeSinceFailure = Date.now() - breaker.lastFailure.getTime()
      if (timeSinceFailure > this.defaultConfig.circuitBreakerTimeout) {
        breaker.state = 'half-open'
        return false
      }
      return true
    }
    return false
  }
  private recordCircuitBreakerFailure(url: string): void {
    const breaker = this.circuitBreakers.get(url) || {
      failures: 0,
      lastFailure: new Date(),
      state: 'closed' as const
    }
    breaker.failures++
    breaker.lastFailure = new Date()
    if (breaker.failures >= this.defaultConfig.circuitBreakerThreshold) {
      breaker.state = 'open'
      console.warn(`[ResilientFetcher] Circuit breaker opened for ${url}`)
    }
    this.circuitBreakers.set(url, breaker)
  }
  private resetCircuitBreaker(url: string): void {
    this.circuitBreakers.set(url, {
      failures: 0,
      lastFailure: new Date(),
      state: 'closed'
    })
  }
  /**
   * Utilitários
   */
  private generateRequestId(config: FetchConfig): string {
    return `${config.method || 'GET'}-${config.url}-${JSON.stringify(config.body || '')}`
  }
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  /**
   * Limpar caches e resetar sistema
   */
  clearCache(): void {
    this.cache.clear()
    this.activeRequests.clear()
  }
  resetCircuitBreakers(): void {
    this.circuitBreakers.clear()
  }
  /**
   * Obter estatísticas do sistema
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      activeRequests: this.activeRequests.size,
      circuitBreakersOpen: Array.from(this.circuitBreakers.entries())
        .filter(([_, breaker]) => breaker.state === 'open').length,
      healthChecks: Array.from(this.healthChecks.values()).map(hc => ({
        endpoint: hc.endpoint,
        healthy: hc.healthy,
        lastChecked: hc.lastChecked,
        responseTime: hc.responseTime
      }))
    }
  }

  /**
   * Obter métricas de performance
   */
  private stats = {
    total: 0,
    success: 0,
    failed: 0,
    cacheHits: 0,
    totalResponseTime: 0
  }

  getMetrics() {
    return {
      totalRequests: this.stats.total,
      successfulRequests: this.stats.success,
      failedRequests: this.stats.failed,
      averageResponseTime: this.stats.total > 0 ? this.stats.totalResponseTime / this.stats.total : 0,
      cacheHitRate: this.stats.total > 0 ? this.stats.cacheHits / this.stats.total : 0,
      successRate: this.stats.total > 0 ? this.stats.success / this.stats.total : 0
    }
  }

  /**
   * Health monitoring
   */
  private healthCheckInterval: NodeJS.Timeout | null = null

  startHealthMonitoring(interval: number) {
    this.stopHealthMonitoring()
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck('/api/health-check')
      } catch (error) {
        console.error('[ResilientFetcher] Health check failed:', error)
      }
    }, interval)
  }

  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  /**
   * Cleanup and destroy instance
   */
  destroy() {
    this.stopHealthMonitoring()
    this.clearCache()
    this.resetCircuitBreakers()
    this.activeRequests.clear()
    this.healthChecks.clear()
  }
}
// Singleton instance
export const resilientFetcher = new ResilientDataFetcher()
// Exportar classe para testing ou múltiplas instâncias
export { ResilientDataFetcher }