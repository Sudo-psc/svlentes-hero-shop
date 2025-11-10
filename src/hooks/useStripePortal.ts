import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

class AuthTokenExpiredError extends Error {
  constructor(message: string = 'Token expirado') {
    super(message)
    this.name = 'AuthTokenExpiredError'
  }
}

class PortalRequestTimeoutError extends Error {
  constructor(message: string = 'Tempo limite ao iniciar portal') {
    super(message)
    this.name = 'PortalRequestTimeoutError'
  }
}

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

  const logAndSetError = useCallback((message: string, err?: unknown) => {
    console.error('[useStripePortal] Portal access error', {
      message,
      originalError: err instanceof Error ? err.message : err,
    })
    setError(message)
    setIsLoading(false)
  }, [])

  // Check if Stripe is configured
  const isAvailable = Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes('your_stripe')
  )

  const executePortalRequest = useCallback(async (
    forceTokenRefresh: boolean,
    returnUrl?: string
  ) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const token = await user.getIdToken(forceTokenRefresh)
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
    const timeoutMs = 1000 * 15 // 15 segundos para evitar quedas de rede demoradas
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined

    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ returnUrl }),
        signal: controller?.signal,
        cache: 'no-store',
      })

      if (response.status === 401) {
        throw new AuthTokenExpiredError('Sessão expirada. Atualizando credenciais...')
      }

      if (!response.ok) {
        let message = 'Erro ao acessar portal de pagamentos'
        try {
          const errorData = await response.json()
          message = errorData.message || errorData.error || message
        } catch (parseError) {
          console.warn('[useStripePortal] Falha ao interpretar resposta de erro do portal', parseError)
        }
        throw new Error(message)
      }

      const { url } = await response.json()
      window.location.assign(url)
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new PortalRequestTimeoutError('Tempo limite atingido. Verifique sua conexão e tente novamente.')
      }
      throw err
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [user])

  const openPortal = useCallback(async (returnUrl?: string) => {
    if (!user) {
      setError('Você precisa estar autenticado para acessar o portal')
      return
    }

    if (!isAvailable) {
      setError('Portal de pagamentos não configurado. Entre em contato com o suporte.')
      return
    }

    if (!user.emailVerified) {
      setError('Confirme seu email para acessar o portal de pagamentos.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await executePortalRequest(false, returnUrl)
    } catch (error) {
      if (error instanceof AuthTokenExpiredError) {
        try {
          await executePortalRequest(true, returnUrl)
          return
        } catch (retryError) {
          if (retryError instanceof PortalRequestTimeoutError) {
            logAndSetError(retryError.message, retryError)
            return
          }

          if (retryError instanceof AuthTokenExpiredError) {
            logAndSetError('Sessão expirada. Faça login novamente para acessar o portal.', retryError)
            return
          }

          logAndSetError(
            retryError instanceof Error
              ? retryError.message
              : 'Não foi possível abrir o portal de pagamentos. Tente novamente.',
            retryError
          )
          return
        }
      }

      if (error instanceof PortalRequestTimeoutError) {
        logAndSetError(error.message, error)
        return
      }

      logAndSetError(
        error instanceof Error
          ? error.message
          : 'Não foi possível abrir o portal de pagamentos. Tente novamente.',
        error
      )
    }
    // Não definimos isLoading como falso em caso de sucesso porque ocorre redirecionamento imediato
  }, [executePortalRequest, isAvailable, logAndSetError, user])

  return {
    openPortal,
    isLoading,
    error,
    isAvailable,
  }
}
