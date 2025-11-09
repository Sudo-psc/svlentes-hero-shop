/**
 * Sistema de monitoramento e logging de erros
 * Implementa métricas de saúde da aplicação e alertas proativos
 *
 * 🛠️ Enhanced with performance budgeting integration
 */

export interface HealthMetrics {
  timestamp: number;
  performance: {
    loadTime: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    cumulativeLayoutShift?: number;
    firstInputDelay?: number;
  };
  resources: {
    jsErrors: number;
    networkErrors: number;
    storageErrors: number;
    totalErrors: number;
  };
  connectivity: {
    online: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  storage: {
    used: number;
    quota?: number;
    usage: number;
    fallbackActive: boolean;
  };
  memory?: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
}

export interface HealthAlert {
  id: string;
  type: 'performance' | 'errors' | 'storage' | 'connectivity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'critical';
  score: number; // 0-100
  metrics: HealthMetrics;
  alerts: HealthAlert[];
  recommendations: string[];
  // 🛠️ Enhanced with performance budget info
  performanceBudget?: {
    status: 'within_budget' | 'warning' | 'exceeded';
    violations: string[];
  };
}

export class HealthMonitor {
  private static instance: HealthMonitor;
  private metrics: HealthMetrics;
  private alerts: Map<string, HealthAlert> = new Map();
  private alertIdCounter = 0;
  private monitoringInterval: number | null = null;
  private observers: PerformanceObserver[] = [];
  private errorCounts = {
    js: 0,
    network: 0,
    storage: 0,
    total: 0
  };
  private isDestroyed = false;

  private constructor() {
    if (typeof window === 'undefined') return;

    this.metrics = this.initializeMetrics();
    this.setupPerformanceObservers();
    this.setupErrorTracking();
    this.startMonitoring();
  }

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance || HealthMonitor.instance.isDestroyed) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  private initializeMetrics(): HealthMetrics {
    return {
      timestamp: Date.now(),
      performance: {
        loadTime: 0
      },
      resources: {
        jsErrors: 0,
        networkErrors: 0,
        storageErrors: 0,
        totalErrors: 0
      },
      connectivity: {
        online: navigator.onLine
      },
      storage: {
        used: 0,
        usage: 0,
        fallbackActive: false
      }
    };
  }

  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    // Navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.metrics.performance.loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (error) {
      console.warn('[HealthMonitor] Navigation observer não suportado');
    }

    // Web Vitals
    try {
      const vitalsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'largest-contentful-paint') {
            this.metrics.performance.largestContentfulPaint = entry.startTime;
          } else if (entry.entryType === 'first-input') {
            this.metrics.performance.firstInputDelay = (entry as any).processingStart - entry.startTime;
          } else if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            this.metrics.performance.cumulativeLayoutShift =
              (this.metrics.performance.cumulativeLayoutShift || 0) + (entry as any).value;
          }
        });
      });
      vitalsObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      this.observers.push(vitalsObserver);
    } catch (error) {
      console.warn('[HealthMonitor] Web Vitals observer não suportado');
    }

    // Resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let failedResources = 0;

        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;
            if (resource.transferSize === 0 && resource.decodedBodySize === 0) {
              failedResources++;
            }
          }
        });

        if (failedResources > 5) {
          this.createAlert(
            'performance',
            'medium',
            `Muitos recursos (${failedResources}) falharam em carregar`
          );
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn('[HealthMonitor] Resource observer não suportado');
    }
  }

  private setupErrorTracking(): void {
    if (typeof window === 'undefined') return;

    // Contador de erros
    window.addEventListener('error', () => {
      this.errorCounts.js++;
      this.errorCounts.total++;
      this.checkErrorThresholds();
    });

    window.addEventListener('unhandledrejection', () => {
      this.errorCounts.js++;
      this.errorCounts.total++;
      this.checkErrorThresholds();
    });

    // Conectividade
    window.addEventListener('online', () => {
      this.metrics.connectivity.online = true;
      this.resolveAlert('connectivity');
    });

    window.addEventListener('offline', () => {
      this.metrics.connectivity.online = false;
      this.createAlert('connectivity', 'high', 'Conexão com a internet perdida');
    });

    // Network Information API
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.updateConnectivityMetrics(connection);

      connection.addEventListener('change', () => {
        this.updateConnectivityMetrics(connection);
      });
    }
  }

  private updateConnectivityMetrics(connection: any): void {
    this.metrics.connectivity.effectiveType = connection.effectiveType;
    this.metrics.connectivity.downlink = connection.downlink;
    this.metrics.connectivity.rtt = connection.rtt;

    // Alertar sobre conexão lenta
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      this.createAlert('connectivity', 'medium', `Conexão lenta detectada: ${connection.effectiveType}`);
    }
  }

  private checkErrorThresholds(): void {
    const errorRate = this.errorCounts.total;

    if (errorRate >= 20) {
      this.createAlert('errors', 'critical', `Alta taxa de erros: ${errorRate} erros detectados`);
    } else if (errorRate >= 10) {
      this.createAlert('errors', 'high', `Taxa de erros elevada: ${errorRate} erros detectados`);
    } else if (errorRate >= 5) {
      this.createAlert('errors', 'medium', `${errorRate} erros detectados`);
    }
  }

  private createAlert(
    type: HealthAlert['type'],
    severity: HealthAlert['severity'],
    message: string
  ): void {
    const id = `alert_${++this.alertIdCounter}`;
    const alert: HealthAlert = {
      id,
      type,
      severity,
      message,
      timestamp: Date.now(),
      resolved: false
    };

    this.alerts.set(id, alert);

    // Notificar sobre alertas críticas
    if (severity === 'critical' || severity === 'high') {
      this.notifyAlert(alert);
    }
  }

  private resolveAlert(type: string): void {
    this.alerts.forEach(alert => {
      if (alert.type === type && !alert.resolved) {
        alert.resolved = true;
        alert.resolvedAt = Date.now();
      }
    });
  }

  private notifyAlert(alert: HealthAlert): void {
    if (typeof window === 'undefined') return;

    // Disparar evento global
    window.dispatchEvent(new CustomEvent('health-alert', {
      detail: alert
    }));

    // Log no console
    const emoji = alert.severity === 'critical' ? '🚨' :
                  alert.severity === 'high' ? '⚠️' : 'ℹ️';

    console.group(`${emoji} Health Alert - ${alert.severity.toUpperCase()}`);
    console.log('Type:', alert.type);
    console.log('Message:', alert.message);
    console.log('Time:', new Date(alert.timestamp).toLocaleString());
    console.groupEnd();
  }

  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Atualizar métricas a cada 30 segundos
    this.monitoringInterval = window.setInterval(() => {
      this.updateMetrics();
    }, 30000);

    // Atualização inicial
    this.updateMetrics();
  }

  private async updateMetrics(): Promise<void> {
    if (typeof window === 'undefined') return;

    this.metrics.timestamp = Date.now();
    this.metrics.resources = {
      jsErrors: this.errorCounts.js,
      networkErrors: this.errorCounts.network,
      storageErrors: this.errorCounts.storage,
      totalErrors: this.errorCounts.total
    };

    // Métricas de storage
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        this.metrics.storage = {
          used: estimate.usage || 0,
          quota: estimate.quota || undefined,
          usage: estimate.quota ? (estimate.usage || 0) / estimate.quota : 0,
          fallbackActive: false
        };

        // Alertar sobre uso de storage
        if (this.metrics.storage.usage > 0.9) {
          this.createAlert('storage', 'high', 'Armazenamento quase esgotado (90%+)');
        } else if (this.metrics.storage.usage > 0.7) {
          this.createAlert('storage', 'medium', 'Uso elevado de armazenamento (70%+)');
        }
      }
    } catch (error) {
      console.warn('[HealthMonitor] Falha ao obter métricas de storage');
    }

    // Métricas de memória (Chrome)
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.memory = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        };

        // Alertar sobre uso de memória
        const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        if (memoryUsage > 0.9) {
          this.createAlert('performance', 'high', 'Alto uso de memória (90%+)');
        }
      }
    } catch (error) {
      // Silenciosamente ignorar se não suportado
    }

    // Verificar performance
    this.checkPerformanceThresholds();
  }

  private checkPerformanceThresholds(): void {
    if (typeof window === 'undefined') return;

    const { performance } = this.metrics;

    // Load time
    if (performance.loadTime > 5000) {
      this.createAlert('performance', 'medium', `Tempo de carregamento elevado: ${performance.loadTime}ms`);
    }

    // Largest Contentful Paint
    if (performance.largestContentfulPaint && performance.largestContentfulPaint > 4000) {
      this.createAlert('performance', 'medium', `LCP lento: ${Math.round(performance.largestContentfulPaint)}ms`);
    }

    // Cumulative Layout Shift
    if (performance.cumulativeLayoutShift && performance.cumulativeLayoutShift > 0.25) {
      this.createAlert('performance', 'medium', `Layout shift detectado: ${performance.cumulativeLayoutShift.toFixed(2)}`);
    }

    // First Input Delay
    if (performance.firstInputDelay && performance.firstInputDelay > 300) {
      this.createAlert('performance', 'medium', `FID elevado: ${Math.round(performance.firstInputDelay)}ms`);
    }
  }

  /**
   * Realiza verificação completa de saúde
   */
  async checkHealth(): Promise<HealthCheckResult> {
    if (typeof window === 'undefined') {
      return {
        status: 'healthy',
        score: 100,
        metrics: this.initializeMetrics(),
        alerts: [],
        recommendations: []
      };
    }

    await this.updateMetrics();

    const score = this.calculateHealthScore();
    const status = this.getHealthStatus(score);
    const recommendations = this.generateRecommendations();

    // 🛠️ Enhanced with performance budget integration
    let performanceBudgetInfo = undefined;

    try {
      // Try to load performance budget manager
      const { performanceBudget } = await import('../performance/performance-budget');
      const budgetReport = performanceBudget.generateBudgetReport();

      performanceBudgetInfo = {
        status: budgetReport.status,
        violations: budgetReport.recommendations
      };

      // Add performance budget recommendations to main recommendations
      recommendations.push(...budgetReport.recommendations.map(rec =>
        `📊 Performance: ${rec}`
      ));
    } catch (error) {
      // Performance budget not available - continue without it
      console.debug('[HealthMonitor] Performance budget not available');
    }

    return {
      status,
      score,
      metrics: { ...this.metrics },
      alerts: Array.from(this.alerts.values()),
      recommendations,
      performanceBudget: performanceBudgetInfo
    };
  }

  private calculateHealthScore(): number {
    let score = 100;

    // Penalidades por erros
    score -= Math.min(this.errorCounts.total * 2, 30);

    // Penalidades por performance
    if (this.metrics.performance.loadTime > 3000) score -= 10;
    if (this.metrics.performance.largestContentfulPaint && this.metrics.performance.largestContentfulPaint > 4000) score -= 10;
    if (this.metrics.performance.cumulativeLayoutShift && this.metrics.performance.cumulativeLayoutShift > 0.1) score -= 10;

    // Penalidades por storage
    if (this.metrics.storage.usage > 0.8) score -= 15;
    if (this.metrics.storage.usage > 0.6) score -= 5;

    // Penalidades por conectividade
    if (!this.metrics.connectivity.online) score -= 20;

    // Penalidades por alertas ativos
    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved);
    score -= Math.min(activeAlerts.length * 5, 25);

    return Math.max(0, Math.min(100, score));
  }

  private getHealthStatus(score: number): 'healthy' | 'degraded' | 'critical' {
    if (score >= 80) return 'healthy';
    if (score >= 50) return 'degraded';
    return 'critical';
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Baseado nos erros
    if (this.errorCounts.total > 0) {
      recommendations.push('Investigue os erros no console para identificar a causa raiz');
    }

    // Baseado na performance
    if (this.metrics.performance.loadTime > 3000) {
      recommendations.push('Otimize o carregamento de recursos para melhorar o tempo de carregamento');
    }

    // Baseado no storage
    if (this.metrics.storage.usage > 0.7) {
      recommendations.push('Limpe o cache e dados antigos para liberar espaço');
    }

    // Baseado na conectividade
    if (!this.metrics.connectivity.online) {
      recommendations.push('Verifique sua conexão com a internet');
    }

    // Baseado nos alertas
    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved);
    if (activeAlerts.length > 3) {
      recommendations.push('Múltiplos alertas ativos - considere recarregar a página');
    }

    return recommendations;
  }

  /**
   * Obtém métricas atuais
   */
  getMetrics(): HealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Obtém alertas ativos
   */
  getActiveAlerts(): HealthAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Limpa alertas resolvidos antigos
   */
  cleanupOldAlerts(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    this.alerts.forEach((alert, id) => {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < oneHourAgo) {
        this.alerts.delete(id);
      }
    });
  }

  /**
   * Envia métricas para monitoramento remoto
   */
  async sendMetrics(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const health = await this.checkHealth();

      await fetch('/api/health-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(health)
      });
    } catch (error) {
      console.warn('[HealthMonitor] Falha ao enviar métricas:', error);
    }
  }

  /**
   * Para o monitoramento
   */
  stopMonitoring(): void {
    if (this.isDestroyed) return;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('[HealthMonitor] Error disconnecting observer:', error);
      }
    });
    this.observers = [];
  }

  /**
   * Complete cleanup - prevents memory leaks
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.stopMonitoring();

    // Clear all data
    this.alerts.clear();
    this.errorCounts = { js: 0, network: 0, storage: 0, total: 0 };
    this.alertIdCounter = 0;
    this.isDestroyed = true;
  }

  /**
   * Reinicia contadores
   */
  resetCounters(): void {
    this.errorCounts = { js: 0, network: 0, storage: 0, total: 0 };
    this.alerts.clear();
    this.alertIdCounter = 0;
  }
}

// Instância global
export const healthMonitor = HealthMonitor.getInstance();

// Exportar para uso global
declare global {
  interface Window {
    HealthMonitor: HealthMonitor;
  }
}

if (typeof window !== 'undefined') {
  window.HealthMonitor = healthMonitor;
}