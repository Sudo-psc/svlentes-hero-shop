'use client'
import { useEffect } from 'react'
export function ServiceWorkerCleanup() {
    useEffect(() => {
        // Only run in development or if there are service worker issues
        const cleanupServiceWorkers = async () => {
            if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
                return
            }
            try {
                const registrations = await navigator.serviceWorker.getRegistrations()
                if (registrations.length > 0) {
                    for (const registration of registrations) {
                        await registration.unregister()
                    }
                    // Clear all caches
                    if ('caches' in window) {
                        const cacheNames = await caches.keys()
                        await Promise.all(
                            cacheNames.map(cacheName => caches.delete(cacheName))
                        )
                    }
                    // Reload page to ensure clean state
                    window.location.reload()
                }
            } catch (error) {
                console.error('Error cleaning up service workers:', error)
            }
        }
        // Run cleanup if we detect service worker errors
        const hasServiceWorkerErrors = () => {
            return window.performance.getEntriesByType('navigation').some((entry: any) =>
                entry.name?.includes('sw.js')
            )
        }
        if (process.env.NODE_ENV === 'development' || hasServiceWorkerErrors()) {
            cleanupServiceWorkers()
        }
    }, [])
    return null
}