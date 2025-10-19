/**
 * Monitoring and error tracking utilities
 * Integrates with various monitoring services
 */

// Types for monitoring
interface ErrorReport {
    message: string
    stack?: string
    url: string
    userAgent: string
    timestamp: string
    userId?: string
    sessionId?: string
    additionalData?: Record<string, any>
}

interface PerformanceMetric {
    name: string
    value: number
    timestamp: string
    url: string
    userAgent: string
    additionalData?: Record<string, any>
}

interface AlertConfig {
    errorThreshold: number
    performanceThreshold: number
    uptimeThreshold: number
    webhookUrl?: string
    emailRecipients?: string[]
}

class MonitoringService {
    private config: AlertConfig
    private errorCount: number = 0
    private lastErrorReset: number = Date.now()
    private lastConversionRates: Record<string, number> = {}

    constructor(config: AlertConfig) {
        this.config = config
        this.setupGlobalErrorHandling()
        this.setupPerformanceMonitoring()
    }

    // Error tracking
    reportError(error: Error, additionalData?: Record<string, any>) {
        const errorReport: ErrorReport = {
            message: error.message,
            stack: error.stack,
            url: typeof window !== 'undefined' ? window.location.href : 'server',
            userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
            timestamp: new Date().toISOString(),
            additionalData
        }

        this.sendErrorReport(errorReport)
        this.checkErrorThreshold()
    }

    // Performance monitoring
    reportPerformance(name: string, value: number, additionalData?: Record<string, any>) {
        const metric: PerformanceMetric = {
            name,
            value,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : 'server',
            userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
            additionalData
        }

        this.sendPerformanceMetric(metric)
        this.checkPerformanceThreshold(name, value)
    }

    // Core Web Vitals monitoring
    monitorWebVitals() {
        if (typeof window === 'undefined') return

        // Monitor LCP (Largest Contentful Paint)
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            this.reportPerformance('LCP', lastEntry.startTime, {
                element: (lastEntry as any).element?.tagName
            })
        })
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

        // Monitor FID (First Input Delay)
        const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                const fid = (entry as any).processingStart - entry.startTime
                this.reportPerformance('FID', fid, {
                    eventType: (entry as any).name
                })
            }
        })
        fidObserver.observe({ type: 'first-input', buffered: true })

        // Monitor CLS (Cumulative Layout Shift)
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!(entry as any).hadRecentInput) {
                    clsValue += (entry as any).value
                }
            }
            this.reportPerformance('CLS', clsValue)
        })
        clsObserver.observe({ type: 'layout-shift', buffered: true })

        // Monitor TTFB (Time to First Byte)
        const navigationEntries = performance.getEntriesByType('navigation')
        if (navigationEntries.length > 0) {
            const navEntry = navigationEntries[0] as PerformanceNavigationTiming
            const ttfb = navEntry.responseStart - navEntry.requestStart
            this.reportPerformance('TTFB', ttfb)
        }
    }

    // Business metrics monitoring
    trackConversion(type: string, value?: number, additionalData?: Record<string, any>) {
        this.reportPerformance(`conversion_${type}`, value || 1, {
            type: 'conversion',
            ...additionalData
        })
    }

    trackUserAction(action: string, additionalData?: Record<string, any>) {
        this.reportPerformance(`user_action_${action}`, 1, {
            type: 'user_action',
            ...additionalData
        })
    }

    reportConversionRate(stage: string, rate: number, metadata?: Record<string, any>) {
        this.reportPerformance(`conversion_rate_${stage}`, rate, {
            stage,
            ...metadata,
        })

        const previousRate = this.lastConversionRates[stage]
        this.lastConversionRates[stage] = rate

        if (previousRate !== undefined && previousRate > 0) {
            const dropPercentage = ((previousRate - rate) / previousRate) * 100

            if (dropPercentage > 20) {
                this.sendAlert('conversion_rate_drop', {
                    stage,
                    previousRate,
                    currentRate: rate,
                    dropPercentage,
                    metadata,
                })
            }
        }
    }

    // Private methods
    private setupGlobalErrorHandling() {
        if (typeof window === 'undefined') return

        // Catch unhandled JavaScript errors
        window.addEventListener('error', (event) => {
            this.reportError(new Error(event.message), {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            })
        })

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.reportError(new Error(`Unhandled promise rejection: ${event.reason}`), {
                reason: event.reason
            })
        })
    }

    private setupPerformanceMonitoring() {
        if (typeof window === 'undefined') return

        // Monitor page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.timing
                const loadTime = perfData.loadEventEnd - perfData.navigationStart
                this.reportPerformance('page_load_time', loadTime)

                const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.navigationStart
                this.reportPerformance('dom_content_loaded', domContentLoaded)
            }, 0)
        })

        // Monitor resource loading
        const resourceObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.duration > 1000) { // Report slow resources (>1s)
                    this.reportPerformance('slow_resource', entry.duration, {
                        name: entry.name,
                        type: (entry as any).initiatorType
                    })
                }
            }
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
    }

    private async sendErrorReport(errorReport: ErrorReport) {
        try {
            // Send to internal logging endpoint
            await fetch('/api/monitoring/errors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(errorReport)
            })

            // Send to external monitoring service (e.g., Sentry, LogRocket)
            if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
                // Sentry integration would go here
                console.log('Sending error to Sentry:', errorReport.message)
            }

            this.errorCount++
        } catch (error) {
            console.error('Failed to send error report:', error)
        }
    }

    private async sendPerformanceMetric(metric: PerformanceMetric) {
        try {
            // Send to internal analytics endpoint
            await fetch('/api/monitoring/performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metric)
            })

            // Send to external analytics service
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'performance_metric', {
                    metric_name: metric.name,
                    metric_value: metric.value,
                    custom_parameter: metric.additionalData
                })
            }
        } catch (error) {
            console.error('Failed to send performance metric:', error)
        }
    }

    private checkErrorThreshold() {
        const now = Date.now()
        const timeSinceReset = now - this.lastErrorReset

        // Reset counter every hour
        if (timeSinceReset > 3600000) {
            this.errorCount = 0
            this.lastErrorReset = now
        }

        // Check if error threshold exceeded
        if (this.errorCount >= this.config.errorThreshold) {
            this.sendAlert('error_threshold_exceeded', {
                errorCount: this.errorCount,
                timeWindow: timeSinceReset
            })
        }
    }

    private checkPerformanceThreshold(name: string, value: number) {
        const thresholds = {
            'LCP': 2500, // 2.5 seconds
            'FID': 100,  // 100ms
            'CLS': 0.1,  // 0.1
            'TTFB': 600, // 600ms
            'page_load_time': 3000 // 3 seconds
        }

        const threshold = thresholds[name as keyof typeof thresholds]
        if (threshold && value > threshold) {
            this.sendAlert('performance_threshold_exceeded', {
                metric: name,
                value,
                threshold
            })
        }
    }

    private async sendAlert(type: string, data: Record<string, any>) {
        try {
            const alert = {
                type,
                timestamp: new Date().toISOString(),
                data,
                environment: process.env.NODE_ENV,
                url: typeof window !== 'undefined' ? window.location.href : 'server'
            }

            // Send to webhook if configured
            if (this.config.webhookUrl) {
                await fetch(this.config.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(alert)
                })
            }

            // Send to internal alerts endpoint
            await fetch('/api/monitoring/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alert)
            })

            console.warn('Alert sent:', type, data)
        } catch (error) {
            console.error('Failed to send alert:', error)
        }
    }
}

// Initialize monitoring service
const monitoringConfig: AlertConfig = {
    errorThreshold: 10, // 10 errors per hour
    performanceThreshold: 3000, // 3 seconds
    uptimeThreshold: 99.9, // 99.9% uptime
    webhookUrl: process.env.MONITORING_WEBHOOK_URL,
    emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',')
}

export const monitoring = new MonitoringService(monitoringConfig)

// Utility functions
export const reportError = (error: Error, additionalData?: Record<string, any>) => {
    monitoring.reportError(error, additionalData)
}

export const reportPerformance = (name: string, value: number, additionalData?: Record<string, any>) => {
    monitoring.reportPerformance(name, value, additionalData)
}

export const trackConversion = (type: string, value?: number, additionalData?: Record<string, any>) => {
    monitoring.trackConversion(type, value, additionalData)
}

export const trackUserAction = (action: string, additionalData?: Record<string, any>) => {
    monitoring.trackUserAction(action, additionalData)
}

export const reportConversionRate = (stage: string, rate: number, metadata?: Record<string, any>) => {
    monitoring.reportConversionRate(stage, rate, metadata)
}

// Initialize Web Vitals monitoring on client side
if (typeof window !== 'undefined') {
    monitoring.monitorWebVitals()
}