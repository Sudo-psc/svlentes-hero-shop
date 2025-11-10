/**
 * Global Error Handler for Browser Console
 * 
 * Suppresses known non-critical errors to reduce console noise
 */

if (typeof window !== 'undefined') {
  // Store original console methods
  const originalError = console.error
  const originalWarn = console.warn

  // List of error patterns to suppress or downgrade
  const suppressPatterns = [
    /getProjectConfig.*400/i,
    /trusted-types-checker.*503/i,
    /Failed to load resource.*getProjectConfig/i,
    /Failed to load resource.*trusted-types-checker/i,
    /Firebase.*project.*not.*found/i,
    /Firebase.*invalid.*api.*key/i,
  ]

  // Override console.error to filter Firebase configuration errors
  console.error = (...args: any[]) => {
    const message = args.join(' ')
    
    // Check if this is a suppressable error
    const shouldSuppress = suppressPatterns.some(pattern => 
      pattern.test(message)
    )
    
    if (shouldSuppress && process.env.NODE_ENV === 'development') {
      // Downgrade to warning in development
      console.warn('[Suppressed Error]', ...args)
      console.warn('ℹ️ This error has been automatically suppressed. Configure Firebase properly to resolve.')
      return
    }
    
    // Otherwise, use original error logging
    originalError.apply(console, args)
  }

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason
    const message = error?.message || String(error)
    
    // Check if this is a Firebase configuration error
    const isFirebaseConfigError = suppressPatterns.some(pattern => 
      pattern.test(message)
    )
    
    if (isFirebaseConfigError && process.env.NODE_ENV === 'development') {
      console.warn('[Suppressed Promise Rejection]', error)
      console.warn('ℹ️ Firebase configuration issue detected. Please check your Firebase setup.')
      event.preventDefault() // Prevent default error handling
      return
    }
  })

  // Catch global errors
  window.addEventListener('error', (event) => {
    const message = event.message || String(event.error)
    
    // Check if this is a resource loading error for known issues
    const isKnownResourceError = 
      message.includes('getProjectConfig') ||
      message.includes('trusted-types-checker')
    
    if (isKnownResourceError && process.env.NODE_ENV === 'development') {
      console.warn('[Suppressed Resource Error]', event.message)
      console.warn('ℹ️ Known resource loading issue. This can be safely ignored in development.')
      event.preventDefault() // Prevent default error handling
      return
    }
  })

  console.log('✅ Global error handler initialized')
}

export {}
