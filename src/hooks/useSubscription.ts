/**
 * useSubscription Hook
 * Manages subscription data fetching and state for authenticated users
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCsrfProtection } from './useCsrfProtection'
import type { Subscription, SubscriptionUser, SubscriptionResponse, SubscriptionStatus } from '@/types/subscription'
const subscriptionCache = new Map<string, SubscriptionResponse>()
interface UseSubscriptionReturn {
  subscription: Subscription | null
  user: SubscriptionUser | null
  loading: boolean
  error: string | null
  status: SubscriptionStatus
  refetch: () => Promise<void>
  updateShippingAddress: (address: any) => Promise<boolean>
}
export function useSubscription(): UseSubscriptionReturn {
  const { user: authUser, loading: authLoading } = useAuth()
  const { withCsrfHeaders } = useCsrfProtection()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [user, setUser] = useState<SubscriptionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<SubscriptionStatus>('loading')
  const [retryCount, setRetryCount] = useState(0)
  const [isFetching, setIsFetching] = useState(false)
  const maxRetries = 3
  const cacheKey = useMemo(() => authUser?.uid ?? null, [authUser])

  const fetchSubscription = useCallback(async () => {
    if (!authUser || !cacheKey || isFetching) {
      if (!authUser || !cacheKey) {
        setStatus('unauthenticated')
        setLoading(false)
      }
      return
    }

    const cached = subscriptionCache.get(cacheKey)
    if (cached) {
      setSubscription(cached.subscription)
      setUser(cached.user)
      setStatus('authenticated')
      setError(null)
      setLoading(false)
      return
    }

    try {
      setIsFetching(true)
      setLoading(true)
      setError(null)

      const token = await authUser.getIdToken()
      const response = await fetch('/api/assinante/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      // Handle different response statuses
      if (response.status === 401) {
        setStatus('unauthenticated')
        setError('Token de autenticação inválido')
        console.warn('[useSubscription] Usuário não autenticado - response 401')
        return // Don't retry on auth errors
      }

      if (response.status === 404) {
        // Usuário não encontrado - não é erro, apenas não tem assinatura
        setStatus('authenticated')
        setSubscription(null)
        setUser(null)
        setRetryCount(0)
        console.log('[useSubscription] Usuário não encontrado (404) - assinatura inexistente')
        return
      }

      if (response.status === 503) {
        // Serviço indisponível - pode ser Firebase Admin não configurado
        const errorData = await response.json().catch(() => ({ message: 'Serviço temporariamente indisponível' }))
        const errorMessage = errorData.message || 'Serviço temporariamente indisponível'
        console.warn('[useSubscription] Serviço temporariamente indisponível:', errorMessage)
        throw new Error(errorMessage)
      }

      if (!response.ok) {
        // Try to parse error response, fallback to generic error
        let errorMessage = 'Erro ao carregar assinatura'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          console.warn('[useSubscription] Failed to parse error response:', parseError)
        }
        throw new Error(errorMessage)
      }

      // Success - parse successful response
      const data: SubscriptionResponse = await response.json()
      subscriptionCache.set(cacheKey, data)
      setSubscription(data.subscription)
      setUser(data.user)
      setStatus('authenticated')
      setError(null)
      setRetryCount(0) // Reset retry count on success

    } catch (err: any) {
      console.error('[useSubscription] Error:', {
        message: err.message,
        status: err.status,
        retryCount,
        cacheKey
      })

      const errorMessage = err.message || 'Erro interno do servidor'
      setError(errorMessage)
      setStatus('error')

      // Retry logic com exponential backoff - only for non-auth errors
      if (retryCount < maxRetries && !errorMessage.includes('autentic')) {
        const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
        console.log(`[useSubscription] Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`)

        setTimeout(() => {
          setRetryCount(prev => prev + 1)
        }, delay)
      } else if (retryCount >= maxRetries) {
        console.error('[useSubscription] Max retries reached')
        // Send to monitoring/analytics (Sentry, etc.)
        if (typeof window !== 'undefined' && (window as any).Sentry) {
          (window as any).Sentry.captureException(err, {
            tags: { component: 'useSubscription', retryCount },
            contexts: { user: { authUser: authUser?.uid } }
          })
        }
      }
    } finally {
      setLoading(false)
      setIsFetching(false)
    }
  }, [authUser, retryCount, isFetching, cacheKey])
  const updateShippingAddress = useCallback(async (address: any): Promise<boolean> => {
    if (!authUser) {
      setError('Usuário não autenticado')
      return false
    }
    try {
      const token = await authUser.getIdToken()
      const response = await fetch('/api/assinante/subscription', {
        method: 'PUT',
        headers: withCsrfHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ shippingAddress: address }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao atualizar endereço')
      }
      if (cacheKey) {
        subscriptionCache.delete(cacheKey)
      }
      await fetchSubscription()
      return true
    } catch (err: any) {
      console.error('[useSubscription] Update error:', err)
      setError(err.message || 'Erro ao atualizar endereço')
      return false
    }
  }, [authUser, cacheKey, fetchSubscription, withCsrfHeaders])
  // Initial fetch and retry trigger
  useEffect(() => {
    if (!authLoading && authUser) {
      fetchSubscription()
    } else if (!authLoading && !authUser) {
      setStatus('unauthenticated')
      setLoading(false)
      setError(null)
      setSubscription(null)
      setUser(null)
    }
  }, [authLoading, authUser?.uid, retryCount]) // Trigger on retryCount changes for retries
  return {
    subscription,
    user,
    loading: loading || authLoading,
    error,
    status,
    refetch: fetchSubscription,
    updateShippingAddress,
  }
}