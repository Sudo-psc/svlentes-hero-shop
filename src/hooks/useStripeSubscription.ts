'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export interface StripeSubscriptionData {
  id: string
  status: string
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
  canceled_at: number | null
  created: number
  plan: {
    id: string
    name: string
    description: string
    amount: number
    currency: string
    interval: string
    interval_count: number
  }
  payment_method: {
    type: string
    card?: {
      brand: string
      last4: string
      exp_month: number
      exp_year: number
    }
  } | null
  customer: {
    id: string
    email: string | null
  }
  latest_invoice: string | null
  billing_cycle_anchor: number
  metadata: Record<string, string>
}

interface UseStripeSubscriptionReturn {
  subscription: StripeSubscriptionData | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook para buscar dados da assinatura ativa do usuário no Stripe
 *
 * @returns {UseStripeSubscriptionReturn} Dados da assinatura, estado de loading e erro
 *
 * @example
 * ```tsx
 * function SubscriptionCard() {
 *   const { subscription, isLoading, error, refetch } = useStripeSubscription()
 *
 *   if (isLoading) return <Loading />
 *   if (error) return <Error message={error} />
 *   if (!subscription) return <NoSubscription />
 *
 *   return (
 *     <div>
 *       <h3>{subscription.plan.name}</h3>
 *       <p>R$ {(subscription.plan.amount / 100).toFixed(2)}/mês</p>
 *     </div>
 *   )
 * }
 * ```
 *
 * @author Dr. Philipe Saraiva Cruz
 */
export function useStripeSubscription(): UseStripeSubscriptionReturn {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<StripeSubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = async () => {
    if (!user) {
      setIsLoading(false)
      setError('Usuário não autenticado')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Obter token do Firebase
      const token = await user.getIdToken()

      // Buscar assinatura do Stripe
      const response = await fetch('/api/stripe/subscription', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        if (response.status === 404) {
          setError('Nenhuma assinatura ativa encontrada')
          setSubscription(null)
          return
        }

        throw new Error(errorData.message || 'Erro ao buscar assinatura')
      }

      const data = await response.json()
      setSubscription(data.subscription)

    } catch (err) {
      console.error('[useStripeSubscription] Error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar assinatura')
      setSubscription(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [user?.uid]) // Recarregar quando usuário mudar

  return {
    subscription,
    isLoading,
    error,
    refetch: fetchSubscription
  }
}
