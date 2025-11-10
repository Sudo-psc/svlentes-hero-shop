// Hook simplificado para uso do Stripe com retry automático
import { useState, useEffect, useCallback } from 'react'
import { loadStripeWithRetry, createSafeStripeWrapper } from '@/lib/stripe-loader'
import { loadStripe } from '@stripe/stripe-js'

interface UseStripeWithRetryOptions {
  publishableKey: string
  maxRetries?: number
  timeout?: number
  autoLoad?: boolean
}

export function useStripeWithRetry({
  publishableKey,
  maxRetries = 3,
  timeout = 10000,
  autoLoad = true
}: UseStripeWithRetryOptions) {
  const [stripe, setStripe] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const loadStripeWithRetryWrapper = useCallback(async () => {
    if (!publishableKey) {
      setError('No Stripe publishable key provided')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log(`[Stripe] Loading with retry count: ${retryCount + 1}`)

      // Usar nossa implementação com retry
      const stripeInstance = await loadStripeWithRetry(publishableKey, {
        retries: maxRetries,
        timeout: timeout
      })

      if (stripeInstance) {
        console.log('[Stripe] Loaded successfully with retry')
        setStripe(stripeInstance)
        setRetryCount(0)
      } else {
        // Fallback para o carregamento padrão do Stripe
        console.log('[Stripe] Fallback to standard Stripe load')
        const fallbackStripe = await loadStripe(publishableKey)
        if (fallbackStripe) {
          setStripe(fallbackStripe)
          setRetryCount(0)
        } else {
          setError('Failed to load Stripe after multiple attempts')
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Stripe loading failed: ${errorMessage}`)
      console.error('[Stripe] Load error:', err)
    } finally {
      setLoading(false)
    }
  }, [publishableKey, maxRetries, timeout, retryCount])

  // Retry automático
  const retry = useCallback(async () => {
    if (retryCount >= maxRetries) {
      setError('Maximum retry attempts reached')
      return
    }

    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000) // Exponential backoff, max 10s
    console.log(`[Stripe] Retrying in ${delay}ms (attempt ${retryCount + 1})`)

    await new Promise(resolve => setTimeout(resolve, delay))
    setRetryCount(prev => prev + 1)
    await loadStripeWithRetryWrapper()
  }, [loadStripeWithRetryWrapper, retryCount, maxRetries])

  // Reset state
  const reset = useCallback(() => {
    setStripe(null)
    setLoading(false)
    setError(null)
    setRetryCount(0)
  }, [])

  // Auto-load se solicitado
  useEffect(() => {
    if (autoLoad && publishableKey && !stripe && !loading) {
      loadStripeWithRetryWrapper()
    }
  }, [autoLoad, publishableKey, stripe, loading, loadStripeWithRetryWrapper])

  // Wrapper seguro para chamadas do Stripe
  const safeStripe = stripe ? createSafeStripeWrapper(stripe) : null

  return {
    stripe: safeStripe,
    loading,
    error,
    retryCount,
    loadStripe: loadStripeWithRetryWrapper,
    retry,
    reset,
    canRetry: retryCount < maxRetries
  }
}