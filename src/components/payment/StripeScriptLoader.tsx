'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'

interface StripeScriptLoaderProps {
  onScriptLoaded?: () => void
  onScriptError?: (error: Error) => void
  onFallbackActivated?: () => void
  maxRetries?: number
  timeout?: number
}

export const StripeScriptLoader: React.FC<StripeScriptLoaderProps> = ({
  onScriptLoaded,
  onScriptError,
  onFallbackActivated,
  maxRetries = 3,
  timeout = 10000 // 10 segundos timeout
}) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error' | 'fallback'>('loading')
  const [retryCount, setRetryCount] = useState(0)
  const hasLoadedRef = useRef(false) // Prevent multiple load attempts

  const loadScriptWithTimeout = useCallback((
    src: string,
    timeoutMs: number
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Timeout timer
      const timeoutId = setTimeout(() => {
        reject(new Error(`Script loading timeout after ${timeoutMs}ms`))
      }, timeoutMs)

      // Check if script already exists
      if (document.querySelector(`script[src="${src}"]`)) {
        clearTimeout(timeoutId)
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.crossOrigin = 'anonymous'

      const cleanup = () => {
        clearTimeout(timeoutId)
        script.onload = null
        script.onerror = null
      }

      script.onload = () => {
        cleanup()
        resolve()
      }

      script.onerror = (error) => {
        cleanup()
        reject(new Error(`Failed to load script: ${error}`))
      }

      document.head.appendChild(script)
    })
  }, [])

  const loadScript = useCallback(async () => {
    try {
      setStatus('loading')
      console.log('[STRIPE_SCRIPT_LOADER] Loading Stripe Pricing Table script...')

      await loadScriptWithTimeout('https://js.stripe.com/v3/pricing-table.js', timeout)

      setStatus('loaded')
      setRetryCount(0)
      onScriptLoaded?.()
      console.log('[STRIPE_SCRIPT_LOADER] Script loaded successfully')

    } catch (error) {
      console.error('[STRIPE_SCRIPT_LOADER] Script loading failed:', error)

      // Detectar erros 503 específicos e ativar fallback imediatamente
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
      if (errorMessage.includes('503') || errorMessage.includes('service unavailable') || errorMessage.includes('timeout')) {
        console.log('[STRIPE_SCRIPT_LOADER] 503/timeout error detected, activating fallback immediately')
        setStatus('fallback')
        const finalError = error instanceof Error ? error : new Error('Service unavailable (503)')
        onScriptError?.(finalError)
        onFallbackActivated?.()
        return
      }

      // Reduzir tentativas para ativação mais rápida do fallback
      if (retryCount < maxRetries) {
        console.log(`[STRIPE_SCRIPT_LOADER] Retrying... (${retryCount + 1}/${maxRetries})`)
        setRetryCount(prev => prev + 1)

        // Reduzir delay para ativação mais rápida do fallback (500ms ao invés de 2000ms)
        const delay = Math.min(300 * Math.pow(1.2, retryCount), 800)
        setTimeout(() => {
          loadScript()
        }, delay)
      } else {
        setStatus('fallback')
        const finalError = error instanceof Error ? error : new Error('Unknown error')
        onScriptError?.(finalError)
        onFallbackActivated?.()
        console.log('[STRIPE_SCRIPT_LOADER] Max retries reached, activating fallback')
      }
    }
  }, [retryCount, maxRetries, timeout, loadScriptWithTimeout, onScriptLoaded, onScriptError, onFallbackActivated])

  useEffect(() => {
    // Only load script once on mount
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadScript()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Monitorar erros de rede específicos do Stripe - detectar 503 imediatamente
  useEffect(() => {
    const handleStripeError = (event: ErrorEvent) => {
      const message = event.message || ''
      if (message.includes('503') || message.includes('service unavailable')) {
        console.error('[STRIPE_SCRIPT_LOADER] 503 error detected, activating fallback immediately:', event)
        if (status === 'loading' || status === 'loaded') {
          setStatus('fallback')
          onFallbackActivated?.()
        }
        return
      }

      if (message && (
        message.includes('js.stripe.com') ||
        message.includes('api.js') ||
        message.includes('getProjectConfig') ||
        message.includes('trusted-types') ||
        message.includes('pricing-table.js') ||
        message.includes('400') ||
        message.includes('Failed to load resource')
      )) {
        console.error('[STRIPE_SCRIPT_LOADER] Stripe network error detected:', event)
        if (status === 'loading' || status === 'loaded') {
          setStatus('fallback')
          onFallbackActivated?.()
        }
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message = reason?.message || reason?.toString() || ''

      if (message.includes('503') || message.includes('service unavailable')) {
        console.error('[STRIPE_SCRIPT_LOADER] 503 promise rejection detected, activating fallback immediately:', reason)
        event.preventDefault()
        if (status === 'loading' || status === 'loaded') {
          setStatus('fallback')
          onFallbackActivated?.()
        }
        return
      }

      if (reason && (
        message.includes('js.stripe.com') ||
        message.includes('Stripe') ||
        message.includes('400') ||
        message.includes('pricing-table') ||
        message.includes('Failed to load')
      )) {
        console.error('[STRIPE_SCRIPT_LOADER] Stripe promise rejection:', reason)
        event.preventDefault()
        if (status === 'loading' || status === 'loaded') {
          setStatus('fallback')
          onFallbackActivated?.()
        }
      }
    }

    window.addEventListener('error', handleStripeError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleStripeError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [status, onFallbackActivated])

  return null // Component invisível, apenas gerencia o carregamento
}

// Hook para usar o carregador
export const useStripeScriptLoader = (options?: Partial<StripeScriptLoaderProps>) => {
  const [scriptStatus, setScriptStatus] = useState<'loading' | 'loaded' | 'error' | 'fallback'>('loading')
  const [error, setError] = useState<Error | null>(null)

  const handleScriptLoaded = useCallback(() => {
    setScriptStatus('loaded')
    setError(null)
  }, [])

  const handleScriptError = useCallback((err: Error) => {
    setScriptStatus('error')
    setError(err)
  }, [])

  const handleFallbackActivated = useCallback(() => {
    setScriptStatus('fallback')
    setError(new Error('Using fallback pricing system'))
  }, [])

  const StripeScriptLoaderComponent = useCallback(() => (
    <StripeScriptLoader
      onScriptLoaded={handleScriptLoaded}
      onScriptError={handleScriptError}
      onFallbackActivated={handleFallbackActivated}
      {...options}
    />
  ), [handleScriptLoaded, handleScriptError, handleFallbackActivated, options])

  return {
    StripeScriptLoaderComponent,
    scriptStatus,
    error,
    isLoaded: scriptStatus === 'loaded',
    isLoading: scriptStatus === 'loading',
    hasError: scriptStatus === 'error' || scriptStatus === 'fallback'
  }
}