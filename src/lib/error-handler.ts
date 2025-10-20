// Global error handling utilities
export const handleNetworkError = (error: Error, context?: string) => {
    console.error(`Network error${context ? ` in ${context}` : ''}:`, error)
    // Don't throw errors for common network issues in production
    if (process.env.NODE_ENV === 'production') {
        return
    }
    // Log additional context in development
    if (error.message.includes('NetworkMonitor') || error.message.includes('Timeout')) {
        console.warn('Network monitoring timeout - this is usually safe to ignore')
        return
    }
    if (error.message.includes('Failed to fetch')) {
        console.warn('Fetch failed - check network connection or API endpoint')
        return
    }
}
export const setupGlobalErrorHandlers = () => {
    if (typeof window === 'undefined') return
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason
        // Ignore common service worker and network errors
        if (error?.message?.includes('NetworkMonitor') ||
            error?.message?.includes('Failed to fetch') ||
            error?.stack?.includes('sw.js')) {
            event.preventDefault()
            console.warn('Suppressed service worker error:', error.message)
            return
        }
        handleNetworkError(error, 'unhandled promise rejection')
    })
    // Handle general errors
    window.addEventListener('error', (event) => {
        const error = event.error
        // Ignore service worker errors
        if (event.filename?.includes('sw.js') ||
            error?.stack?.includes('sw.js')) {
            event.preventDefault()
            console.warn('Suppressed service worker error:', error?.message)
            return
        }
        handleNetworkError(error, 'global error handler')
    })
}