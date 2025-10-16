// React imports for the utilities
import React from 'react'

// Performance optimization utilities

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

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
    elementRef: React.RefObject<Element>,
    options: IntersectionObserverInit = {}
) => {
    const [isIntersecting, setIsIntersecting] = React.useState(false)
    const [hasIntersected, setHasIntersected] = React.useState(false)

    React.useEffect(() => {
        const element = elementRef.current
        if (!element) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsIntersecting(entry.isIntersecting)
                if (entry.isIntersecting && !hasIntersected) {
                    setHasIntersected(true)
                }
            },
            {
                threshold: 0.1,
                rootMargin: '50px',
                ...options,
            }
        )

        observer.observe(element)

        return () => {
            observer.unobserve(element)
        }
    }, [elementRef, hasIntersected, options])

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

    console.log(`${name} took ${end - start} milliseconds`)
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
        console.log('LCP:', lastEntry.startTime)
    })

    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

    // Track FID (First Input Delay)
    const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            console.log('FID:', (entry as any).processingStart - entry.startTime)
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