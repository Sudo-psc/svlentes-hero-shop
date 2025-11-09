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
  timeout = 15000 // 15 segundos timeout para evitar falsos 503
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

      // Apenas ativar fallback para 503 reais, não timeouts
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
      if (errorMessage.includes('503') && !errorMessage.includes('timeout') && !errorMessage.includes('service unavailable')) {
        console.log('[STRIPE_SCRIPT_LOADER] Real 503 error detected, activating fallback')
        setStatus('fallback')
        const finalError = error instanceof Error ? error : new Error('Real 503 error')
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

  // Monitorar erros de rede específicos do Stripe - menos agressivo
  useEffect(() => {
    const handleStripeError = (event: ErrorEvent) => {
      const message = event.message || ''

      // Apenas ativar fallback para erros 503 reais, não timeouts
      if (message.includes('503') && !message.includes('timeout')) {
        console.error('[STRIPE_SCRIPT_LOADER] Real 503 error detected, activating fallback:', event)
        if (status === 'loading' || status === 'loaded') {
          setStatus('fallback')
          onFallbackActivated?.()
        }
        return
      }

      // Ignorar timeouts e outros erros temporários - só logar
      if (message && (
        message.includes('js.stripe.com') ||
        message.includes('api.js') ||
        message.includes('pricing-table.js') ||
        message.includes('timeout') ||
        message.includes('400')
      )) {
        console.warn('[STRIPE_SCRIPT_LOADER] Stripe resource issue (not activating fallback):', message)
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message = reason?.message || reason?.toString() || ''

      // Apenas ativar fallback para 503 reais
      if (message.includes('503') && !message.includes('timeout')) {
        console.error('[STRIPE_SCRIPT_LOADER] Real 503 promise rejection, activating fallback:', reason)
        event.preventDefault()
        if (status === 'loading' || status === 'loaded') {
          setStatus('fallback')
          onFallbackActivated?.()
        }
        return
      }

      // Logar outros erros sem ativar fallback
      if (reason && (
        message.includes('js.stripe.com') ||
        message.includes('Stripe') ||
        message.includes('400') ||
        message.includes('pricing-table') ||
        message.includes('Failed to load') ||
        message.includes('timeout')
      )) {
        console.warn('[STRIPE_SCRIPT_LOADER] Stripe resource issue (not activating fallback):', message)
        event.preventDefault()
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