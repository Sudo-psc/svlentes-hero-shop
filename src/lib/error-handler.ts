/**
 * Global Error Handler for Stripe and Chunk Loading Errors
 *
 * This module provides centralized error handling for:
 * - ChunkLoadError: Missing JavaScript chunks
 * - Stripe loading errors: External resource failures
 * - Network errors: Connection issues
 *
 * @author Dr. Philipe Saraiva Cruz
 */

// Error type detection
export const getErrorType = (error: ErrorEvent | string): 'chunk' | 'stripe' | 'network' | 'unknown' => {
  const message = typeof error === 'string' ? error : error.message || ''

  if (message.includes('Loading chunk') || message.includes('chunk')) {
    return 'chunk'
  }

  if (message.includes('Stripe') || message.includes('stripe') || message.includes('js.stripe.com')) {
    return 'stripe'
  }

  if (message.includes('Failed to load resource') || message.includes('Network error')) {
    return 'network'
  }

  return 'unknown'
}

// User-friendly error messages in Portuguese
export const getErrorMessage = (errorType: string): string => {
  switch (errorType) {
    case 'chunk':
      return 'Recursos de carregamento temporariamente indisponíveis. Usando catálogo alternativo.'
    case 'stripe':
      return 'Sistema de pagamento temporariamente indisponível. Usando catálogo seguro alternativo.'
    case 'network':
      return 'Conexão instável detectada. Carregando informações offline.'
    default:
      return 'Ocorreu uma instabilidade. Usando modo alternativo para melhor experiência.'
  }
}

// Global error handler setup
export const setupGlobalErrorHandling = () => {
  if (typeof window === 'undefined') return

  let errorCount = 0
  const maxErrors = 3

  const handleError = (event: ErrorEvent) => {
    event.preventDefault()
    errorCount++

    const errorType = getErrorType(event)
    const errorMessage = getErrorMessage(errorType)

    console.error(`[GLOBAL_ERROR_HANDLER] ${errorType.toUpperCase()} error detected:`, {
      error: event,
      type: errorType,
      count: errorCount,
      url: window.location.href,
      timestamp: new Date().toISOString()
    })

    // Dispatch custom event for components to handle
    window.dispatchEvent(new CustomEvent('app:error', {
      detail: {
        type: errorType,
        message: errorMessage,
        originalError: event,
        retryAvailable: errorCount < maxErrors
      }
    }))

    // If too many errors, suggest page reload
    if (errorCount >= maxErrors) {
      console.warn('[GLOBAL_ERROR_HANDLER] Too many errors detected, suggesting reload')
      window.dispatchEvent(new CustomEvent('app:reload-suggested', {
        detail: {
          message: 'Para melhorar sua experiência, recarregue a página.',
          type: errorType
        }
      }))
    }
  }

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    event.preventDefault()
    errorCount++

    const errorType = getErrorType(event.reason)
    const errorMessage = getErrorMessage(errorType)

    console.error(`[GLOBAL_ERROR_HANDLER] Unhandled promise rejection (${errorType}):`, {
      error: event.reason,
      type: errorType,
      count: errorCount,
      url: window.location.href,
      timestamp: new Date().toISOString()
    })

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('app:error', {
      detail: {
        type: errorType,
        message: errorMessage,
        originalError: event.reason,
        retryAvailable: errorCount < maxErrors
      }
    }))
  }

  // Set up error listeners
  window.addEventListener('error', handleError)
  window.addEventListener('unhandledrejection', handleUnhandledRejection)

  // Return cleanup function
  return () => {
    window.removeEventListener('error', handleError)
    window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }
}

// Retry mechanism for failed resources
export const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      console.warn(`[RETRY] Attempt ${attempt} failed:`, error)

      if (attempt === maxRetries) {
        throw error
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Monitor network connectivity
export const setupNetworkMonitoring = () => {
  if (typeof window === 'undefined') return

  const handleOnline = () => {
    console.log('[NETWORK] Connection restored')
    window.dispatchEvent(new CustomEvent('app:online'))
  }

  const handleOffline = () => {
    console.warn('[NETWORK] Connection lost')
    window.dispatchEvent(new CustomEvent('app:offline'))
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Initial status check
  if (!navigator.onLine) {
    window.dispatchEvent(new CustomEvent('app:offline'))
  }

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

// Legacy exports for compatibility
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

    // Set up the new enhanced error handling
    const cleanup = setupGlobalErrorHandling()

    // Handle unhandled promise rejections with legacy compatibility
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

    // Handle general errors with legacy compatibility
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

    return cleanup
}