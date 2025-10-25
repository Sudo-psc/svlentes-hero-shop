/**
 * Custom hook for subscription mutation operations
 * Centralizes API calls for plan changes, address updates, and payment updates
 *
 * @author Dr. Philipe Saraiva Cruz
 * @date 2025-10-25
 */

import { useState, useCallback } from 'react'
import type { User } from 'firebase/auth'

interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

interface PaymentMethod {
  type: 'credit_card' | 'pix' | 'boleto'
  last4?: string
}

interface MutationResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

interface UseSubscriptionMutationsProps {
  authUser: User | null
  onSuccess?: () => void | Promise<void>
}

interface UseSubscriptionMutationsReturn {
  updatePlan: (newPlanId: string) => Promise<MutationResult>
  updateAddress: (addressData: Address) => Promise<MutationResult>
  updatePayment: (paymentData: PaymentMethod) => Promise<MutationResult>
  isLoading: boolean
}

/**
 * Hook for managing subscription mutations with proper error handling
 * and loading states.
 *
 * @example
 * ```tsx
 * const { updatePlan, updateAddress, isLoading } = useSubscriptionMutations({
 *   authUser,
 *   onSuccess: () => refetch()
 * })
 *
 * await updatePlan('plan-monthly-premium')
 * ```
 */
export function useSubscriptionMutations({
  authUser,
  onSuccess
}: UseSubscriptionMutationsProps): UseSubscriptionMutationsReturn {
  const [isLoading, setIsLoading] = useState(false)

  const updatePlan = useCallback(
    async (newPlanId: string): Promise<MutationResult> => {
      setIsLoading(true)
      try {
        const token = await authUser?.getIdToken()
        if (!token) {
          throw new Error('Usuário não autenticado')
        }

        const response = await fetch('/api/subscription/change-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ newPlanId })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao alterar plano')
        }

        const data = await response.json()

        if (onSuccess) {
          await onSuccess()
        }

        return { success: true, data }
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Erro desconhecido'
        return { success: false, error }
      } finally {
        setIsLoading(false)
      }
    },
    [authUser, onSuccess]
  )

  const updateAddress = useCallback(
    async (addressData: Address): Promise<MutationResult> => {
      setIsLoading(true)
      try {
        const token = await authUser?.getIdToken()
        if (!token) {
          throw new Error('Usuário não autenticado')
        }

        const response = await fetch('/api/subscription/update-address', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(addressData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao atualizar endereço')
        }

        const data = await response.json()

        if (onSuccess) {
          await onSuccess()
        }

        return { success: true, data }
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Erro desconhecido'
        return { success: false, error }
      } finally {
        setIsLoading(false)
      }
    },
    [authUser, onSuccess]
  )

  const updatePayment = useCallback(
    async (paymentData: PaymentMethod): Promise<MutationResult> => {
      setIsLoading(true)
      try {
        const token = await authUser?.getIdToken()
        if (!token) {
          throw new Error('Usuário não autenticado')
        }

        const response = await fetch('/api/subscription/update-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(paymentData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao atualizar forma de pagamento')
        }

        const data = await response.json()

        if (onSuccess) {
          await onSuccess()
        }

        return { success: true, data }
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Erro desconhecido'
        return { success: false, error }
      } finally {
        setIsLoading(false)
      }
    },
    [authUser, onSuccess]
  )

  return {
    updatePlan,
    updateAddress,
    updatePayment,
    isLoading
  }
}
