// Cache configuration and utilities for Next.js
// Static data cache configuration
export const CACHE_CONFIG = {
    // Doctor info - rarely changes
    doctorInfo: {
        revalidate: 86400, // 24 hours
        tags: ['doctor-info']
    },
    // Pricing plans - changes occasionally
    pricingPlans: {
        revalidate: 3600, // 1 hour
        tags: ['pricing-plans']
    },
    // FAQ data - changes occasionally
    faqData: {
        revalidate: 7200, // 2 hours
        tags: ['faq-data']
    },
    // Add-ons data - changes occasionally
    addOnsData: {
        revalidate: 3600, // 1 hour
        tags: ['add-ons-data']
    },
    // Trust indicators - rarely changes
    trustIndicators: {
        revalidate: 86400, // 24 hours
        tags: ['trust-indicators']
    }
}
// Cache headers for API routes
export const getCacheHeaders = (maxAge: number, sMaxAge?: number) => {
    return {
        'Cache-Control': `public, max-age=${maxAge}, s-maxage=${sMaxAge || maxAge}, stale-while-revalidate=86400`,
        'CDN-Cache-Control': `public, max-age=${sMaxAge || maxAge}`,
        'Vercel-CDN-Cache-Control': `public, max-age=${sMaxAge || maxAge}`
    }
}
// Memory cache for client-side data
class MemoryCache {
    private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
    set(key: string, data: any, ttl: number = 300000) { // 5 minutes default
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        })
    }
    get(key: string) {
        const item = this.cache.get(key)
        if (!item) return null
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key)
            return null
        }
        return item.data
    }
    clear() {
        this.cache.clear()
    }
    delete(key: string) {
        this.cache.delete(key)
    }
}
export const memoryCache = new MemoryCache()
// Service Worker cache strategies
export const SW_CACHE_STRATEGIES = {
    // Cache static assets
    staticAssets: {
        urlPattern: /\.(js|css|woff2?|png|jpg|jpeg|webp|svg|ico)$/,
        handler: 'CacheFirst',
        options: {
            cacheName: 'static-assets',
            expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            },
        },
    },
    // Cache API responses
    apiResponses: {
        urlPattern: /^https:\/\/api\./,
        handler: 'NetworkFirst',
        options: {
            cacheName: 'api-responses',
            networkTimeoutSeconds: 3,
            expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutes
            },
        },
    },
    // Cache images
    images: {
        urlPattern: /\.(png|jpg|jpeg|webp|gif|svg)$/,
        handler: 'CacheFirst',
        options: {
            cacheName: 'images',
            expiration: {
                maxEntries: 200,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
            },
        },
    },
}
// Preload critical resources
export const preloadCriticalResources = () => {
    if (typeof window === 'undefined') return
    // Preload critical images
    const imagePreloads = [
        '/icones/drphilipe_perfil.jpeg',
        '/logo.png',
    ]
    imagePreloads.forEach(image => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.href = image
        link.as = 'image'
        document.head.appendChild(link)
    })
}
// Resource hints
export const addResourceHints = () => {
    if (typeof window === 'undefined') return
    // DNS prefetch for external domains
    const dnsPrefetchDomains = [
        'https://js.stripe.com',
        'https://api.whatsapp.com',
        'https://www.google-analytics.com',
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
    ]
    dnsPrefetchDomains.forEach(domain => {
        const link = document.createElement('link')
        link.rel = 'dns-prefetch'
        link.href = domain
        document.head.appendChild(link)
    })
    // Preconnect to critical domains
    const preconnectDomains = [
        'https://js.stripe.com',
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
    ]
    preconnectDomains.forEach(domain => {
        const link = document.createElement('link')
        link.rel = 'preconnect'
        link.href = domain
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
    })
}