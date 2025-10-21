'use client'
import { useEffect } from 'react'
import { preloadCriticalResources, addResourceHints } from '@/lib/cache'
export function ResourcePreloader() {
    useEffect(() => {
        // Preload critical resources
        preloadCriticalResources()
        // Add resource hints
        addResourceHints()
        // Preload critical API endpoints
        if (typeof window !== 'undefined') {
            // Prefetch critical data (removed non-existent endpoints)
            // Note: pricing-plans and doctor-info are static data imports, not API routes
        }
    }, [])
    return null
}