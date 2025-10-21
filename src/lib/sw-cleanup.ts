// Service Worker cleanup utility
// This helps remove any cached service workers that might be causing issues
export const unregisterServiceWorkers = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return
    }
    try {
        const registrations = await navigator.serviceWorker.getRegistrations()
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
    } catch (error) {
        console.error('Error cleaning up service workers:', error)
    }
}
// Auto-cleanup on development
if (process.env.NODE_ENV === 'development') {
    if (typeof window !== 'undefined') {
        unregisterServiceWorkers()
    }
}