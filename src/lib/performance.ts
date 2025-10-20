// React imports for the utilities
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
// Performance optimization utilities
// Simple cache implementation
export class SimpleCache<T> {
    private cache = new Map<string, { value: T; timestamp: number; ttl: number }>()
    set(key: string, value: T, ttlMs: number = 5 * 60 * 1000): void {
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl: ttlMs
        })
    }
    get(key: string): T | null {
        const item = this.cache.get(key)
        if (!item) return null
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key)
            return null
        }
        return item.value
    }
    clear(): void {
        this.cache.clear()
    }
    size(): number {
        return this.cache.size
    }
}
// Lazy loading utility for components
export function createLazyComponent<T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
) {
    const LazyComponent = React.lazy(importFunc)
    return function WrappedComponent(props: React.ComponentProps<T>) {
        const fallbackElement = fallback ? React.createElement(fallback) : React.createElement('div', {}, 'Carregando...')
        return React.createElement(
            React.Suspense,
            { fallback: fallbackElement },
            React.createElement(LazyComponent, props)
        )
    }
}
// Network status hook
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true)
    const [connectionType, setConnectionType] = useState<string>('unknown')
    useEffect(() => {
        const updateOnlineStatus = () => {
            setIsOnline(navigator.onLine)
        }
        const updateConnectionType = () => {
            const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
            if (connection) {
                setConnectionType(connection.effectiveType || 'unknown')
            }
        }
        updateOnlineStatus()
        updateConnectionType()
        window.addEventListener('online', updateOnlineStatus)
        window.addEventListener('offline', updateOnlineStatus)
        if ((navigator as any).connection) {
            (navigator as any).connection.addEventListener('change', updateConnectionType)
        }
        return () => {
            window.removeEventListener('online', updateOnlineStatus)
            window.removeEventListener('offline', updateOnlineStatus)
            if ((navigator as any).connection) {
                (navigator as any).connection.removeEventListener('change', updateConnectionType)
            }
        }
    }, [])
    return { isOnline, connectionType }
}
// Optimized fetch with retry and cache
export class OptimizedFetcher {
    private cache = new SimpleCache<any>()
    private retryConfig = { maxRetries: 3, baseDelay: 1000 }
    async fetch<T>(
        url: string,
        options: RequestInit = {},
        cacheKey?: string,
        ttlMs: number = 5 * 60 * 1000
    ): Promise<T> {
        // Verifica cache primeiro
        if (cacheKey) {
            const cached = this.cache.get(cacheKey)
            if (cached) return cached
        }
        let lastError: Error
        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    signal: AbortSignal.timeout(10000) // Timeout de 10s
                })
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                }
                const data = await response.json()
                // Armazena no cache
                if (cacheKey) {
                    this.cache.set(cacheKey, data, ttlMs)
                }
                return data
            } catch (error) {
                lastError = error as Error
                // Se for o último attempt, lança o erro
                if (attempt === this.retryConfig.maxRetries) {
                    break
                }
                // Exponential backoff
                const delay = this.retryConfig.baseDelay * Math.pow(2, attempt)
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }
        throw lastError!
    }
    clearCache(): void {
        this.cache.clear()
    }
}
// Instância global do otimizador de fetch
export const optimizedFetch = new OptimizedFetcher()
// Performance monitor
export class PerformanceMonitor {
    private static measurements = new Map<string, number[]>()
    static start(label: string): void {
        performance.mark(`${label}-start`)
    }
    static end(label: string): number {
        performance.mark(`${label}-end`)
        performance.measure(label, `${label}-start`, `${label}-end`)
        const measure = performance.getEntriesByName(label)[0]
        const duration = measure.duration
        if (!this.measurements.has(label)) {
            this.measurements.set(label, [])
        }
        this.measurements.get(label)!.push(duration)
        // Mantém apenas as últimas 10 medições
        const measurements = this.measurements.get(label)!
        if (measurements.length > 10) {
            measurements.shift()
        }
        return duration
    }
    static getAverage(label: string): number {
        const measurements = this.measurements.get(label)
        if (!measurements || measurements.length === 0) return 0
        return measurements.reduce((sum, duration) => sum + duration, 0) / measurements.length
    }
    static getReport(): Record<string, { average: number; samples: number }> {
        const report: Record<string, { average: number; samples: number }> = {}
        for (const [label, measurements] of this.measurements.entries()) {
            report[label] = {
                average: this.getAverage(label),
                samples: measurements.length
            }
        }
        return report
    }
    static clear(): void {
        this.measurements.clear()
        performance.clearMarks()
        performance.clearMeasures()
    }
}
// Memoization utility
export function memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string
): T {
    const cache = new Map<string, ReturnType<T>>()
    return ((...args: Parameters<T>) => {
        const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
        if (cache.has(key)) {
            return cache.get(key)!
        }
        const result = fn(...args)
        cache.set(key, result)
        return result
    }) as T
}
// Debounce hook for functions
export function useDebounceCallback<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): T {
    const timeoutRef = useRef<NodeJS.Timeout>()
    return useCallback(((...args: Parameters<T>) => {
        clearTimeout(timeoutRef.current!)
        timeoutRef.current = setTimeout(() => fn(...args), delay)
    }) as T, [fn, delay])
}
// Throttle hook for functions
export function useThrottleCallback<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): T {
    const lastCall = useRef(0)
    return useCallback(((...args: Parameters<T>) => {
        const now = Date.now()
        if (now - lastCall.current >= delay) {
            lastCall.current = now
            return fn(...args)
        }
    }) as T, [fn, delay])
}
// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
    elementRef: React.RefObject<Element>,
    options: IntersectionObserverInit = {}
) => {
    const [isIntersecting, setIsIntersecting] = React.useState(false)
    const [hasIntersected, setHasIntersected] = React.useState(false)
    const observerOptions = React.useMemo(
        () => ({ threshold: 0.1, rootMargin: '50px', ...options }),
        [options]
    )
    const observerCallback = React.useCallback(
        ([entry]: IntersectionObserverEntry[]) => {
            const entryState = entry.isIntersecting
            setIsIntersecting(entryState)
            if (entryState && !hasIntersected) {
                setHasIntersected(true)
            }
        },
        [hasIntersected]
    )
    React.useEffect(() => {
        const element = elementRef.current
        if (!element) return
        const observer = new IntersectionObserver(observerCallback, observerOptions)
        observer.observe(element)
        return () => {
            observer.disconnect()
        }
    }, [elementRef, observerCallback, observerOptions])
    return { isIntersecting, hasIntersected }
}
// Debounce utility for performance
export const useDebounce = <T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value)
    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)
        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])
    return debouncedValue
}
// Preload critical resources
export const preloadResource = (href: string, as: string, type?: string) => {
    if (typeof window === 'undefined') return
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    if (type) link.type = type
    document.head.appendChild(link)
}
// Critical CSS inlining utility
export const inlineCriticalCSS = (css: string) => {
    if (typeof window === 'undefined') return
    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)
}
// Performance monitoring
export const measurePerformance = (name: string, fn: () => void) => {
    if (typeof window === 'undefined') return fn()
    const start = performance.now()
    fn()
    const end = performance.now()
}
// Web Vitals tracking
export const trackWebVitals = () => {
    if (typeof window === 'undefined') return
    // Track CLS (Cumulative Layout Shift)
    let clsValue = 0
    const clsEntries: PerformanceEntry[] = []
    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value
                clsEntries.push(entry)
            }
        }
    })
    observer.observe({ type: 'layout-shift', buffered: true })
    // Track LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
    // Track FID (First Input Delay)
    const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            console.log(`FID: ${entry.processingStart - entry.startTime}`)
        }
    })
    fidObserver.observe({ type: 'first-input', buffered: true })
}
// Image optimization utilities
export const getOptimizedImageProps = (
    src: string,
    width: number,
    height: number,
    quality: number = 75
) => {
    return {
        src,
        width,
        height,
        quality,
        placeholder: 'blur' as const,
        blurDataURL: `data:image/svg+xml;base64,${Buffer.from(
            `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/></svg>`
        ).toString('base64')}`,
    }
}