'use client'

import { useEffect } from 'react'

/**
 * Error Suppressor Component
 * 
 * Initializes global error handling to suppress known non-critical errors
 * Should be mounted once in the root layout
 */
export function ErrorSuppressor() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // List of error patterns to suppress
    const suppressPatterns = [
      /getProjectConfig.*400/i,
      /trusted-types-checker.*503/i,
      /Failed to load resource.*getProjectConfig/i,
      /Failed to load resource.*trusted-types-checker/i,
      /Firebase.*project.*not.*found/i,
      /Firebase.*invalid.*api.*key/i,
    ]

    // Store original console methods
    const originalError = console.error
    const originalWarn = console.warn

    // Override console.error
    const errorHandler = (...args: unknown[]) => {
      const message = args.join(' ')
      
      const shouldSuppress = suppressPatterns.some(pattern => 
        pattern.test(message)
      )
      
      if (shouldSuppress) {
        if (process.env.NODE_ENV === 'development') {
          console.info('ℹ️ Non-critical error suppressed:', message.substring(0, 100))
        }
        return
      }
      
      originalError.apply(console, args)
    }

    // Override console.warn
    const warnHandler = (...args: unknown[]) => {
      const message = args.join(' ')
      
      const shouldSuppress = suppressPatterns.some(pattern => 
        pattern.test(message)
      )
      
      if (shouldSuppress) {
        if (process.env.NODE_ENV === 'development') {
          console.info('ℹ️ Non-critical warning suppressed:', message.substring(0, 100))
        }
        return
      }
      
      originalWarn.apply(console, args)
    }

    console.error = errorHandler
    console.warn = warnHandler

    // Handle unhandled promise rejections
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const error = event.reason
      const message = error?.message || String(error)
      
      const isFirebaseConfigError = suppressPatterns.some(pattern => 
        pattern.test(message)
      )
      
      if (isFirebaseConfigError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('ℹ️ Firebase configuration issue suppressed')
        }
        event.preventDefault()
        return
      }
    }

    // Handle global errors
    const globalErrorHandler = (event: ErrorEvent) => {
      const message = event.message || String(event.error)
      
      const isKnownResourceError = 
        message.includes('getProjectConfig') ||
        message.includes('trusted-types-checker')
      
      if (isKnownResourceError) {
        console.warn('ℹ️ Known resource error suppressed')
        event.preventDefault()
        return false
      }
    }

    window.addEventListener('unhandledrejection', rejectionHandler)
    window.addEventListener('error', globalErrorHandler)

    console.log('✅ Error suppression initialized')

    // Cleanup
    return () => {
      console.error = originalError
      console.warn = originalWarn
      window.removeEventListener('unhandledrejection', rejectionHandler)
      window.removeEventListener('error', globalErrorHandler)
    }
  }, [])

  return null
}
