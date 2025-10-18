/**
 * useSubscription Hook
 * Manages subscription data fetching and state for authenticated users
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCsrfProtection } from './useCsrfProtection'
import type { Subscription, SubscriptionUser, SubscriptionResponse, SubscriptionStatus } from '@/types/subscription'

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
  const maxRetries = 3

  const fetchSubscription = useCallback(async () => {
    if (!authUser) {
      setStatus('unauthenticated')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Get Firebase ID token
      const token = await authUser.getIdToken()

      const response = await fetch('/api/assinante/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          setStatus('unauthenticated')
          console.warn('[useSubscription] Usuário não autenticado')
          throw new Error('Não autenticado')
        }

        if (response.status === 404) {
          // Usuário não encontrado - não é erro, apenas não tem assinatura
          console.info('[useSubscription] Usuário não encontrado no banco de dados')
          setStatus('authenticated')
          setSubscription(null)
          setUser(null)
          setRetryCount(0) // Reset retry count on expected 404
          return
        }

        if (response.status === 503) {
          // Serviço indisponível - pode ser Firebase Admin não configurado
          const errorData = await response.json()
          console.warn('[useSubscription] Serviço temporariamente indisponível:', errorData.message)
          throw new Error(errorData.message || 'Serviço temporariamente indisponível')
        }

        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao carregar assinatura')
      }

      const data: SubscriptionResponse = await response.json()

      setSubscription(data.subscription)
      setUser(data.user)
      setStatus('authenticated')
      setRetryCount(0) // Reset retry count on success
    } catch (err: any) {
      console.error('[useSubscription] Error:', err)
      setError(err.message || 'Erro ao carregar dados')
      setStatus('error')

      // Retry logic com exponential backoff
      if (retryCount < maxRetries && err.message !== 'Não autenticado') {
        const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
        console.log(`[useSubscription] Retry ${retryCount + 1}/${maxRetries} in ${delay}ms`)

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
    }
  }, [authUser, retryCount])

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

      // Refetch subscription data after update
      await fetchSubscription()
      return true
    } catch (err: any) {
      console.error('[useSubscription] Update error:', err)
      setError(err.message || 'Erro ao atualizar endereço')
      return false
    }
  }, [authUser, fetchSubscription])

  // Initial fetch
  useEffect(() => {
    if (!authLoading) {
      fetchSubscription()
    }
  }, [authLoading, fetchSubscription])

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
