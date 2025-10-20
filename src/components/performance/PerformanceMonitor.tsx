'use client'
import { useEffect } from 'react'
import { trackWebVitals } from '@/lib/performance'
export function PerformanceMonitor() {
    useEffect(() => {
        // Track Web Vitals
        trackWebVitals()
        // Track page load performance
        if (typeof window !== 'undefined') {
            window.addEventListener('load', () => {
                // Track page load time
                const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
                if (navigation) {
                }
                // Track resource loading
                const resources = performance.getEntriesByType('resource')
                const slowResources = resources.filter(resource => resource.duration > 1000)
                if (slowResources.length > 0) {
                    console.warn('Slow resources detected:', slowResources)
                }
            })
        }
    }, [])
    return null
}