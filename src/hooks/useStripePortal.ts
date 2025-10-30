import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface UseStripePortalReturn {
  openPortal: (returnUrl?: string) => Promise<void>
  isLoading: boolean
  error: string | null
  isAvailable: boolean
}

/**
 * Custom hook for managing Stripe Customer Portal access
 * 
 * Provides a secure way to redirect users to the Stripe Customer Portal
 * where they can manage subscriptions, payment methods, and billing info.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { openPortal, isLoading, error } = useStripePortal()
 * 
 *   const handleManageSubscription = async () => {
 *     await openPortal('/area-assinante/dashboard?tab=payment')
 *   }
 * 
 *   return (
 *     <button onClick={handleManageSubscription} disabled={isLoading}>
 *       {isLoading ? 'Carregando...' : 'Gerenciar Assinatura'}
 *     </button>
 *   )
 * }
 * ```
 * 
 * @author Dr. Philipe Saraiva Cruz
 */
export function useStripePortal(): UseStripePortalReturn {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if Stripe is configured
  const isAvailable = Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes('your_stripe')
  )

  const openPortal = useCallback(async (returnUrl?: string) => {
    if (!user) {
      setError('Você precisa estar autenticado para acessar o portal')
      return
    }

    if (!isAvailable) {
      setError('Portal de pagamentos não configurado. Entre em contato com o suporte.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get Firebase ID token
      const token = await user.getIdToken()

      // Call API to create portal session
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ returnUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Erro ao acessar portal')
      }

      const { url } = await response.json()

      // Redirect to Stripe Customer Portal
      window.location.href = url

    } catch (err: any) {
      console.error('[STRIPE_PORTAL_ERROR]', err)
      setError(err.message || 'Erro ao abrir portal de gerenciamento')
      setIsLoading(false)
    }
    // Note: Don't set isLoading to false on success because we're redirecting
  }, [user, isAvailable])

  return {
    openPortal,
    isLoading,
    error,
    isAvailable,
  }
}
