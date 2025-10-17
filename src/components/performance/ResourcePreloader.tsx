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
            // Preload Stripe.js
            const stripeScript = document.createElement('link')
            stripeScript.rel = 'preload'
            stripeScript.href = 'https://js.stripe.com/v3/'
            stripeScript.as = 'script'
            document.head.appendChild(stripeScript)

            // Prefetch critical data (removed non-existent endpoints)
            // Note: pricing-plans and doctor-info are static data imports, not API routes
        }
    }, [])

    return null
}