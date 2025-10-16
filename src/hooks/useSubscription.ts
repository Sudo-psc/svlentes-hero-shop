/**
 * useSubscription Hook
 * Manages subscription data fetching and state for authenticated users
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
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
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [user, setUser] = useState<SubscriptionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<SubscriptionStatus>('loading')

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
          throw new Error('Não autenticado')
        }

        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao carregar assinatura')
      }

      const data: SubscriptionResponse = await response.json()

      setSubscription(data.subscription)
      setUser(data.user)
      setStatus('authenticated')
    } catch (err: any) {
      console.error('[useSubscription] Error:', err)
      setError(err.message || 'Erro ao carregar dados')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }, [authUser])

  const updateShippingAddress = useCallback(async (address: any): Promise<boolean> => {
    if (!authUser) {
      setError('Usuário não autenticado')
      return false
    }

    try {
      const token = await authUser.getIdToken()

      const response = await fetch('/api/assinante/subscription', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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
