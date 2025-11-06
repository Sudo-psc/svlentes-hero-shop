/**
 * Stripe Client Configuration
 *
 * Centralized Stripe initialization with proper timeout and retry settings
 * to prevent hanging requests and improve reliability.
 *
 * @author Dr. Philipe Saraiva Cruz
 */

import Stripe from 'stripe'

// Configuration constants
const STRIPE_API_VERSION = '2024-11-20.acacia' as const
const STRIPE_TIMEOUT_MS = 10000 // 10 seconds
const STRIPE_MAX_RETRIES = 2

/**
 * Initialize Stripe client with production-ready configuration
 *
 * Features:
 * - 10-second timeout to prevent hanging requests
 * - 2 automatic retries with exponential backoff
 * - Type-safe TypeScript support
 * - Proper error handling
 *
 * @throws {Error} If STRIPE_SECRET_KEY is not configured
 * @returns {Stripe} Configured Stripe client instance
 */
export function createStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured. Please set this environment variable.'
    )
  }

  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
    timeout: STRIPE_TIMEOUT_MS,
    maxNetworkRetries: STRIPE_MAX_RETRIES,
    telemetry: false, // Disable telemetry for privacy
  })
}

/**
 * Singleton Stripe client instance
 * Reuses the same client across API routes for better performance
 */
let stripeInstance: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    stripeInstance = createStripeClient()
  }
  return stripeInstance
}

/**
 * Type-safe Stripe error handler
 *
 * @param error - Error from Stripe API
 * @returns Structured error response
 */
export function handleStripeError(error: unknown): {
  error: string
  message: string
  code?: string
  statusCode: number
} {
  // Stripe-specific errors
  if (error && typeof error === 'object' && 'type' in error) {
    const stripeError = error as Stripe.StripeError

    switch (stripeError.type) {
      case 'StripeCardError':
        return {
          error: 'Erro no cartão',
          message: stripeError.message || 'Cartão recusado pela operadora.',
          code: stripeError.code,
          statusCode: 402,
        }

      case 'StripeRateLimitError':
        return {
          error: 'Limite de requisições excedido',
          message: 'Muitas requisições. Tente novamente em alguns segundos.',
          code: stripeError.code,
          statusCode: 429,
        }

      case 'StripeInvalidRequestError':
        return {
          error: 'Requisição inválida',
          message: stripeError.message || 'Dados inválidos enviados para o Stripe.',
          code: stripeError.code,
          statusCode: 400,
        }

      case 'StripeAPIError':
        return {
          error: 'Erro no Stripe',
          message: 'Erro de comunicação com o Stripe. Tente novamente.',
          code: stripeError.code,
          statusCode: 502,
        }

      case 'StripeConnectionError':
        return {
          error: 'Erro de conexão',
          message: 'Não foi possível conectar ao Stripe. Verifique sua conexão.',
          code: stripeError.code,
          statusCode: 503,
        }

      case 'StripeAuthenticationError':
        return {
          error: 'Erro de autenticação',
          message: 'Credenciais do Stripe inválidas. Contate o suporte.',
          code: stripeError.code,
          statusCode: 401,
        }

      default:
        return {
          error: 'Erro no processamento',
          message: stripeError.message || 'Erro desconhecido do Stripe.',
          code: stripeError.code,
          statusCode: 500,
        }
    }
  }

  // Generic errors
  if (error instanceof Error) {
    return {
      error: 'Erro interno',
      message: error.message || 'Ocorreu um erro ao processar sua solicitação.',
      statusCode: 500,
    }
  }

  // Unknown errors
  return {
    error: 'Erro desconhecido',
    message: 'Ocorreu um erro inesperado. Tente novamente.',
    statusCode: 500,
  }
}

/**
 * Export default singleton instance for convenience
 */
export const stripe = getStripeClient()
