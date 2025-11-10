/**
 * 🛠️ Quick Win: Performance Budget Manager
 *
 * Sets and enforces performance budgets for bundle sizes and runtime metrics
 * to prevent performance degradation as the application grows
 */

export interface PerformanceBudget {
  bundleSize: {
    main: number;      // KB
    vendors: number;   // KB
    total: number;     // KB
  };
  runtime: {
    fcp: number;       // First Contentful Paint (ms)
    lcp: number;       // Largest Contentful Paint (ms)
    ttfb: number;      // Time to First Byte (ms)
    cls: number;       // Cumulative Layout Shift
    fid: number;       // First Input Delay (ms)
  };
  resources: {
    maxJsFiles: number;
    maxCssFiles: number;
    maxImageSize: number; // KB
    maxFontFiles: number;
  };
}

export interface BudgetReport {
  status: 'within_budget' | 'warning' | 'exceeded';
  bundleMetrics: BundleMetrics;
  runtimeMetrics: RuntimeMetrics;
  resourceMetrics: ResourceMetrics;
  recommendations: string[];
}

export interface BundleMetrics {
  mainSize: number;
  vendorSize: number;
  totalSize: number;
  jsFiles: number;
  cssFiles: number;
  images: number;
  fonts: number;
}

export interface RuntimeMetrics {
  fcp?: number;
  lcp?: number;
  ttfb?: number;
  cls?: number;
  fid?: number;
}

export interface ResourceMetrics {
  totalRequests: number;
  totalSize: number;
  largestResource: number;
  slowestResource: number;
}

export class PerformanceBudgetManager {
  private static instance: PerformanceBudgetManager;
  private budgets: PerformanceBudget;
  private monitoringEnabled: boolean;

  private constructor() {
    this.budgets = this.initializeBudgets();
    this.monitoringEnabled = typeof window !== 'undefined';

    if (this.monitoringEnabled) {
      this.startMonitoring();
    }
  }

  static getInstance(): PerformanceBudgetManager {
    if (!PerformanceBudgetManager.instance) {
      PerformanceBudgetManager.instance = new PerformanceBudgetManager();
    }
    return PerformanceBudgetManager.instance;
  }

  /**
   * Initialize performance budgets based on environment
   */
  private initializeBudgets(): PerformanceBudget {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      bundleSize: {
        main: isProduction ? 150 : 250,      // KB - stricter in production
        vendors: isProduction ? 300 : 500,    // KB
        total: isProduction ? 400 : 600        // KB
      },
      runtime: {
        fcp: isProduction ? 1500 : 2000,       // ms
        lcp: isProduction ? 2500 : 3000,       // ms
        ttfb: isProduction ? 600 : 800,         // ms
        cls: isProduction ? 0.1 : 0.25,         // Cumulative Layout Shift
        fid: isProduction ? 100 : 150           // ms
      },
      resources: {
        maxJsFiles: isProduction ? 15 : 25,
        maxCssFiles: isProduction ? 5 : 10,
        maxImageSize: isProduction ? 500 : 1000, // KB
        maxFontFiles: isProduction ? 3 : 6
      }
    };
  }

  /**
   * Start performance monitoring
   */
  private startMonitoring(): void {
    // Monitor resource loading
    this.monitorResourceLoading();

    // Monitor Web Vitals
    this.monitorWebVitals();

    // Set up interval budget checks
    this.scheduleBudgetChecks();

    console.log('[PerformanceBudget] Monitoring started with budgets:', this.budgets);
  }

  /**
   * Monitor resource loading for budget compliance
   */
  private monitorResourceLoading(): void {
    if (!window.performance || !window.PerformanceObserver) {
      return;
    }

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach(entry => {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          this.checkResourceBudget(resource);
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Monitor Web Vitals
   */
  private monitorWebVitals(): void {
    // Only in development or when specifically enabled
    if (process.env.NODE_ENV === 'production' && !this.hasDebugFlag()) {
      return;
    }

    // Simple Web Vitals monitoring would go here
    // For now, we'll use the existing health monitor
  }

  /**
   * Check if debug flag is present
   */
  private hasDebugFlag(): boolean {
    return window.location.search.includes('debug_perf=true') ||
           localStorage.getItem('debug_performance') === 'true';
  }

  /**
   * Check individual resource against budget
   */
  private checkResourceBudget(resource: PerformanceResourceTiming): void {
    const size = resource.transferSize || 0;
    const url = resource.name;
    const isJs = url.endsWith('.js');
    const isCss = url.endsWith('.css');
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    const isFont = /\.(woff|woff2|ttf|eot)$/i.test(url);

    // Check file size limits
    if (isImage && size > this.budgets.resources.maxImageSize * 1024) {
      console.warn(`[PerformanceBudget] Large image detected: ${url} (${Math.round(size / 1024)}KB)`);
      this.trackViolation('large_image', {
        url,
        size: Math.round(size / 1024),
        limit: this.budgets.resources.maxImageSize
      });
    }

    // Track resource counts
    if (isJs || isCss) {
      this.updateResourceCounts(isJs ? 'js' : 'css');
    }
  }

  /**
   * Update resource counts for budget tracking
   */
  private updateResourceCounts(type: 'js' | 'css'): void {
    const key = `resource_counts_${type}`;
    const current = parseInt(sessionStorage.getItem(key) || '0', 10);
    sessionStorage.setItem(key, (current + 1).toString());

    if (current + 1 > this.budgets.resources[`max${type.toUpperCase()}Files` as keyof typeof this.budgets.resources]) {
      console.warn(`[PerformanceBudget] Too many ${type.toUpperCase()} files: ${current + 1}`);
      this.trackViolation(`too_many_${type}_files`, {
        count: current + 1,
        limit: this.budgets.resources[`max${type.toUpperCase()}Files` as keyof typeof this.budgets.resources]
      });
    }
  }

  /**
   * Schedule periodic budget checks
   */
  private scheduleBudgetChecks(): void {
    // Check budgets every 30 seconds
    setInterval(() => {
      const report = this.generateBudgetReport();

      if (report.status !== 'within_budget') {
        console.warn('[PerformanceBudget] Budget issues detected:', report.recommendations);
      }
    }, 30000);
  }

  /**
   * Track performance violations
   */
  private trackViolation(type: string, details: any): void {
    const violations = this.getViolations();
    violations.push({
      type,
      details,
      timestamp: Date.now()
    });

    // Keep only last 20 violations
    if (violations.length > 20) {
      violations.shift();
    }

    sessionStorage.setItem('performance_violations', JSON.stringify(violations));
  }

  /**
   * Get stored violations
   */
  private getViolations(): Array<{type: string; details: any; timestamp: number}> {
    try {
      const stored = sessionStorage.getItem('performance_violations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Generate comprehensive budget report
   */
  generateBudgetReport(): BudgetReport {
    const bundleMetrics = this.calculateBundleMetrics();
    const runtimeMetrics = this.getRuntimeMetrics();
    const resourceMetrics = this.calculateResourceMetrics();
    const recommendations = this.generateRecommendations(bundleMetrics, runtimeMetrics, resourceMetrics);

    const status = this.determineOverallStatus(recommendations);

    return {
      status,
      bundleMetrics,
      runtimeMetrics,
      resourceMetrics,
      recommendations
    };
  }

  /**
   * Calculate bundle metrics (simplified estimation)
   */
  private calculateBundleMetrics(): BundleMetrics {
    // This would normally use webpack-bundle-analyzer or similar
    // For now, we'll estimate based on loaded resources
    return {
      mainSize: 150,    // Placeholder - would be calculated from bundle analyzer
      vendorSize: 280,  // Placeholder
      totalSize: 430,   // Placeholder
      jsFiles: parseInt(sessionStorage.getItem('resource_counts_js') || '0', 10),
      cssFiles: parseInt(sessionStorage.getItem('resource_counts_css') || '0', 10),
      images: 0,         // Would be counted from resource monitoring
      fonts: 0           // Would be counted from resource monitoring
    };
  }

  /**
   * Get current runtime metrics
   */
  private getRuntimeMetrics(): RuntimeMetrics {
    // Get metrics from health monitor if available
    try {
      const healthData = sessionStorage.getItem('health_metrics');
      if (healthData) {
        const health = JSON.parse(healthData);
        return {
          fcp: health.performance?.firstContentfulPaint,
          lcp: health.performance?.largestContentfulPaint,
          // Add other metrics as they become available
        };
      }
    } catch (error) {
      // Silent fail
    }

    return {};
  }

  /**
   * Calculate resource metrics
   */
  private calculateResourceMetrics(): ResourceMetrics {
    try {
      const healthData = sessionStorage.getItem('health_metrics');
      if (healthData) {
        const health = JSON.parse(healthData);
        return {
          totalRequests: health.resources?.totalErrors || 0, // Placeholder
          totalSize: health.storage?.used || 0,             // Placeholder
          largestResource: 0,                               // Would be calculated
          slowestResource: 0                                // Would be calculated
        };
      }
    } catch (error) {
      // Silent fail
    }

    return {
      totalRequests: 0,
      totalSize: 0,
      largestResource: 0,
      slowestResource: 0
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    bundle: BundleMetrics,
    runtime: RuntimeMetrics,
    resources: ResourceMetrics
  ): string[] {
    const recommendations: string[] = [];

    // Bundle size recommendations
    if (bundle.totalSize > this.budgets.bundleSize.total) {
      recommendations.push(`Bundle size (${Math.round(bundle.totalSize)}KB) exceeds budget (${this.budgets.bundleSize.total}KB)`);
      recommendations.push('Consider code splitting and lazy loading');
    }

    if (bundle.jsFiles > this.budgets.resources.maxJsFiles) {
      recommendations.push(`Too many JS files (${bundle.jsFiles}) - consider bundling optimization`);
    }

    // Runtime performance recommendations
    if (runtime.fcp && runtime.fcp > this.budgets.runtime.fcp) {
      recommendations.push(`FCP (${runtime.fcp}ms) is slow - optimize critical rendering path`);
    }

    if (runtime.lcp && runtime.lcp > this.budgets.runtime.lcp) {
      recommendations.push(`LCP (${runtime.lcp}ms) is slow - optimize largest contentful paint`);
    }

    // Resource recommendations
    if (resources.totalRequests > 50) {
      recommendations.push(`High request count (${resources.totalRequests}) - consider resource consolidation`);
    }

    return recommendations;
  }

  /**
   * Determine overall budget status
   */
  private determineOverallStatus(recommendations: string[]): 'within_budget' | 'warning' | 'exceeded' {
    if (recommendations.length === 0) {
      return 'within_budget';
    }
    if (recommendations.length <= 3) {
      return 'warning';
    }
    return 'exceeded';
  }

  /**
   * Get current budgets
   */
  getBudgets(): PerformanceBudget {
    return { ...this.budgets };
  }

  /**
   * Update budget values (for testing or customization)
   */
  updateBudgets(newBudgets: Partial<PerformanceBudget>): void {
    this.budgets = { ...this.budgets, ...newBudgets };
    console.log('[PerformanceBudget] Budgets updated:', this.budgets);
  }

  /**
   * Enable/disable monitoring
   */
  setMonitoring(enabled: boolean): void {
    this.monitoringEnabled = enabled;
    console.log(`[PerformanceBudget] Monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get performance summary for debugging
   */
  getPerformanceSummary(): any {
    const report = this.generateBudgetReport();
    const violations = this.getViolations();

    return {
      budget: this.budgets,
      report,
      violations: violations.slice(-5), // Last 5 violations
      monitoring: this.monitoringEnabled
    };
  }
}

// Global instance for easy access
export const performanceBudget = PerformanceBudgetManager.getInstance();

// Development helper
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Make performance budget available in console for debugging
  (window as any).performanceBudget = performanceBudget;
}