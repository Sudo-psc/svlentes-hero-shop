/**
 * System Monitor
 * Monitoramento de saúde do sistema e métricas de performance
 */
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: Date
  checks: HealthCheck[]
  metrics: SystemMetrics
}
export interface HealthCheck {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  responseTime: number
  lastChecked: Date
  endpoint?: string
}
export interface SystemMetrics {
  memoryUsage: number
  storageQuota: number
  storageUsage: number
  activeConnections: number
  cacheHitRate: number
  errorRate: number
  averageResponseTime: number
  uptime: number
}
class SystemMonitor {
  private static instance: SystemMonitor
  private healthChecks: Map<string, HealthCheck> = new Map()
  private metrics: SystemMetrics = {
    memoryUsage: 0,
    storageQuota: 0,
    storageUsage: 0,
    activeConnections: 0,
    cacheHitRate: 0,
    errorRate: 0,
    averageResponseTime: 0,
    uptime: 0
  }
  private startTime: Date = new Date()
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null
  private callbacks: ((health: SystemHealth) => void)[] = []
  private constructor() {}
  static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor()
    }
    return SystemMonitor.instance
  }
  /**
   * Iniciar monitoramento
   */
  startMonitoring(interval: number = 30000): void {
    if (this.isMonitoring) return
    this.isMonitoring = true
    // Executar check inicial
    this.performHealthCheck()
    // Configurar monitoramento periódico
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck()
    }, interval)
  }
  /**
   * Parar monitoramento
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return
    this.isMonitoring = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }
  /**
   * Adicionar callback para mudanças de saúde
   */
  onHealthChange(callback: (health: SystemHealth) => void): void {
    this.callbacks.push(callback)
  }
  /**
   * Remover callback
   */
  removeHealthChangeCallback(callback: (health: SystemHealth) => void): void {
    const index = this.callbacks.indexOf(callback)
    if (index > -1) {
      this.callbacks.splice(index, 1)
    }
  }
  /**
   * Realizar check completo de saúde
   */
  private async performHealthCheck(): Promise<void> {
    const checks: HealthCheck[] = []
    // 1. Verificar API principal
    checks.push(await this.checkAPIHealth('/api/health-check'))
    // 2. Verificar API de assinante
    checks.push(await this.checkAPIHealth('/api/assinante/subscription'))
    // 3. Verificar API de autenticação
    checks.push(await this.checkAPIHealth('/api/auth/me'))
    // 4. Verificar conexão WebSocket (se aplicável)
    checks.push(await this.checkWebSocketHealth())
    // 5. Verificar IndexedDB
    checks.push(await this.checkIndexedDBHealth())
    // 6. Verificar localStorage
    checks.push(await this.checkLocalStorageHealth())
    // 7. Verificar memória do navegador
    checks.push(await this.checkMemoryHealth())
    // 8. Verificar conectividade
    checks.push(await this.checkConnectivityHealth())
    // Atualizar health checks
    checks.forEach(check => {
      this.healthChecks.set(check.name, check)
    })
    // Calcular métricas
    await this.calculateMetrics()
    // Determinar status geral
    const health = this.calculateOverallHealth(checks)
    // Notificar callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(health)
      } catch (error) {
        console.error('[SystemMonitor] Callback error:', error)
      }
    })
  }
  /**
   * Verificar saúde de endpoint API
   */
  private async checkAPIHealth(endpoint: string): Promise<HealthCheck> {
    const startTime = Date.now()
    try {
      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      })
      const responseTime = Date.now() - startTime
      if (response.ok) {
        return {
          name: endpoint,
          status: 'pass',
          message: 'API responding normally',
          responseTime,
          lastChecked: new Date(),
          endpoint
        }
      } else {
        return {
          name: endpoint,
          status: 'fail',
          message: `API returned ${response.status}`,
          responseTime,
          lastChecked: new Date(),
          endpoint
        }
      }
    } catch (error) {
      return {
        name: endpoint,
        status: 'fail',
        message: (error as Error).message,
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        endpoint
      }
    }
  }
  /**
   * Verificar saúde do IndexedDB
   */
  private async checkIndexedDBHealth(): Promise<HealthCheck> {
    const startTime = Date.now()
    try {
      if (!('indexedDB' in window)) {
        return {
          name: 'indexeddb',
          status: 'fail',
          message: 'IndexedDB not supported',
          responseTime: Date.now() - startTime,
          lastChecked: new Date()
        }
      }
      const testDB = await this.openTestDatabase()
      const responseTime = Date.now() - startTime
      if (testDB) {
        testDB.close()
        return {
          name: 'indexeddb',
          status: 'pass',
          message: 'IndexedDB working normally',
          responseTime,
          lastChecked: new Date()
        }
      } else {
        return {
          name: 'indexeddb',
          status: 'fail',
          message: 'Failed to open IndexedDB',
          responseTime,
          lastChecked: new Date()
        }
      }
    } catch (error) {
      return {
        name: 'indexeddb',
        status: 'fail',
        message: (error as Error).message,
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      }
    }
  }
  /**
   * Verificar saúde do localStorage
   */
  private async checkLocalStorageHealth(): Promise<HealthCheck> {
    const startTime = Date.now()
    try {
      const testKey = 'system_monitor_test'
      const testValue = Date.now().toString()
      localStorage.setItem(testKey, testValue)
      const retrieved = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)
      const responseTime = Date.now() - startTime
      if (retrieved === testValue) {
        return {
          name: 'localStorage',
          status: 'pass',
          message: 'LocalStorage working normally',
          responseTime,
          lastChecked: new Date()
        }
      } else {
        return {
          name: 'localStorage',
          status: 'fail',
          message: 'LocalStorage read/write failed',
          responseTime,
          lastChecked: new Date()
        }
      }
    } catch (error) {
      return {
        name: 'localStorage',
        status: 'fail',
        message: (error as Error).message,
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      }
    }
  }
  /**
   * Verificar saúde da memória
   */
  private async checkMemoryHealth(): Promise<HealthCheck> {
    const startTime = Date.now()
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usage = memory.usedJSHeapSize / memory.totalJSHeapSize
        const responseTime = Date.now() - startTime
        if (usage < 0.8) {
          return {
            name: 'memory',
            status: 'pass',
            message: `Memory usage: ${Math.round(usage * 100)}%`,
            responseTime,
            lastChecked: new Date()
          }
        } else if (usage < 0.9) {
          return {
            name: 'memory',
            status: 'warn',
            message: `Memory usage high: ${Math.round(usage * 100)}%`,
            responseTime,
            lastChecked: new Date()
          }
        } else {
          return {
            name: 'memory',
            status: 'fail',
            message: `Memory usage critical: ${Math.round(usage * 100)}%`,
            responseTime,
            lastChecked: new Date()
          }
        }
      } else {
        return {
          name: 'memory',
          status: 'warn',
          message: 'Memory API not available',
          responseTime: Date.now() - startTime,
          lastChecked: new Date()
        }
      }
    } catch (error) {
      return {
        name: 'memory',
        status: 'fail',
        message: (error as Error).message,
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      }
    }
  }
  /**
   * Verificar conectividade
   */
  private async checkConnectivityHealth(): Promise<HealthCheck> {
    const startTime = Date.now()
    try {
      const isOnline = navigator.onLine
      if (isOnline) {
        return {
          name: 'connectivity',
          status: 'pass',
          message: 'Online and connected',
          responseTime: Date.now() - startTime,
          lastChecked: new Date()
        }
      } else {
        return {
          name: 'connectivity',
          status: 'fail',
          message: 'Offline',
          responseTime: Date.now() - startTime,
          lastChecked: new Date()
        }
      }
    } catch (error) {
      return {
        name: 'connectivity',
        status: 'fail',
        message: (error as Error).message,
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      }
    }
  }
  /**
   * Verificar WebSocket (se aplicável)
   */
  private async checkWebSocketHealth(): Promise<HealthCheck> {
    const startTime = Date.now()
    try {
      // Verificar se há conexões WebSocket ativas
      const hasActiveConnections = this.getActiveWebSocketConnections() > 0
      return {
        name: 'websocket',
        status: hasActiveConnections ? 'pass' : 'warn',
        message: hasActiveConnections ? 'WebSocket connected' : 'No WebSocket connections',
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      }
    } catch (error) {
      return {
        name: 'websocket',
        status: 'warn',
        message: 'WebSocket check failed',
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      }
    }
  }
  /**
   * Calcular métricas do sistema
   */
  private async calculateMetrics(): Promise<void> {
    try {
      // Memória
      if ('memory' in performance) {
        const memory = (performance as any).memory
        this.metrics.memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize
      }
      // Storage
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate()
          this.metrics.storageQuota = estimate.quota || 0
          this.metrics.storageUsage = estimate.usage || 0
        } catch (error) {
          console.warn('[SystemMonitor] Failed to get storage estimate:', error)
        }
      }
      // Conexões ativas
      this.metrics.activeConnections = this.getActiveWebSocketConnections()
      // Uptime
      this.metrics.uptime = Date.now() - this.startTime.getTime()
    } catch (error) {
      console.error('[SystemMonitor] Failed to calculate metrics:', error)
    }
  }
  /**
   * Calcular status geral de saúde
   */
  private calculateOverallHealth(checks: HealthCheck[]): SystemHealth {
    const passCount = checks.filter(c => c.status === 'pass').length
    const failCount = checks.filter(c => c.status === 'fail').length
    const warnCount = checks.filter(c => c.status === 'warn').length
    const total = checks.length
    let status: 'healthy' | 'degraded' | 'unhealthy'
    if (failCount === 0 && warnCount === 0) {
      status = 'healthy'
    } else if (failCount === 0 && warnCount <= total / 2) {
      status = 'degraded'
    } else {
      status = 'unhealthy'
    }
    return {
      status,
      timestamp: new Date(),
      checks,
      metrics: { ...this.metrics }
    }
  }
  /**
   * Abrir database de teste
   */
  private async openTestDatabase(): Promise<IDBDatabase | null> {
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('system_monitor_test', 1)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
        request.onupgradeneeded = () => {
          const db = request.result
          if (!db.objectStoreNames.contains('test')) {
            db.createObjectStore('test')
          }
        }
      })
    } catch (error) {
      console.error('[SystemMonitor] Failed to open test database:', error)
      return null
    }
  }
  /**
   * Obter conexões WebSocket ativas
   */
  private getActiveWebSocketConnections(): number {
    // Implementar contagem de conexões WebSocket ativas
    // Por enquanto, retorna 0 como placeholder
    return 0
  }
  /**
   * Obter status atual de saúde
   */
  getCurrentHealth(): SystemHealth {
    const checks = Array.from(this.healthChecks.values())
    return this.calculateOverallHealth(checks)
  }
  /**
   * Obter health checks específicos
   */
  getHealthChecks(): Map<string, HealthCheck> {
    return new Map(this.healthChecks)
  }
  /**
   * Obter métricas atuais
   */
  getMetrics(): SystemMetrics {
    return { ...this.metrics }
  }
  /**
   * Limpar dados de monitoramento
   */
  clearData(): void {
    this.healthChecks.clear()
    this.metrics = {
      memoryUsage: 0,
      storageQuota: 0,
      storageUsage: 0,
      activeConnections: 0,
      cacheHitRate: 0,
      errorRate: 0,
      averageResponseTime: 0,
      uptime: 0
    }
  }
}
// Exportar instância singleton
export const systemMonitor = SystemMonitor.getInstance()