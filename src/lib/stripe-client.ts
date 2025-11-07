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
const STRIPE_API_VERSION = '2025-09-30.clover' as const
const STRIPE_TIMEOUT_MS = 10000
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
export function createStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Stripe integration disabled: missing STRIPE_SECRET_KEY')
    }
    return null
  }

  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
    timeout: STRIPE_TIMEOUT_MS,
    maxNetworkRetries: STRIPE_MAX_RETRIES,
    telemetry: false,
  })
}

/**
 * Singleton Stripe client instance
 * Reuses the same client across API routes for better performance
 */
let stripeInstance: Stripe | null | undefined

export function getStripeClient(): Stripe | null {
  if (stripeInstance === undefined) {
    stripeInstance = createStripeClient()
  }
  return stripeInstance ?? null
}

/**
 * Type-safe Stripe error handler
 *
 * @param error - Error from Stripe API
 * @returns Structured error response
 */
/**
 * Secure Stripe Error Handler
 *
 * SECURITY ENHANCEMENTS:
 * - Prevents information disclosure in error messages
 * - Logs detailed errors securely for debugging
 * - Returns safe, generic error messages to clients
 * - Maintains security error codes for proper handling
 */
export function handleStripeError(error: unknown): {
  error: string
  message: string
  code?: string
  statusCode: number
  secure: boolean
} {
  // Log detailed error for debugging (never expose to client)
  const logError = (details: Record<string, any>) => {
    console.error('[Stripe Error]', {
      timestamp: new Date().toISOString(),
      ...details,
      // Never log raw error data that might contain sensitive information
    })
  }

  // Stripe-specific errors with secure handling
  if (error && typeof error === 'object' && 'type' in error) {
    const stripeError = error as Stripe.StripeError

    // Log detailed error for debugging
    logError({
      type: stripeError.type,
      code: stripeError.code,
      statusCode: stripeError.statusCode,
      requestId: stripeError.requestId
    })

    switch (stripeError.type) {
      case 'StripeCardError':
        return {
          error: 'payment_failed',
          message: 'Não foi possível processar o pagamento. Verifique os dados do cartão.',
          // Keep code for client handling but don't expose specific reason
          code: 'payment_declined',
          statusCode: 402,
          secure: true
        }

      case 'StripeRateLimitError':
        return {
          error: 'rate_limit_exceeded',
          message: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
          code: 'rate_limit',
          statusCode: 429,
          secure: true
        }

      case 'StripeInvalidRequestError':
        // Never expose request details that might help attackers
        return {
          error: 'invalid_request',
          message: 'Requisição inválida. Verifique os dados e tente novamente.',
          code: 'validation_error',
          statusCode: 400,
          secure: true
        }

      case 'StripeAPIError':
        return {
          error: 'service_error',
          message: 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.',
          code: 'service_unavailable',
          statusCode: 502,
          secure: true
        }

      case 'StripeConnectionError':
        return {
          error: 'connection_error',
          message: 'Não foi possível conectar ao serviço de pagamento. Verifique sua conexão.',
          code: 'connection_failed',
          statusCode: 503,
          secure: true
        }

      case 'StripeAuthenticationError':
        // Never reveal authentication issues to users
        return {
          error: 'service_error',
          message: 'Serviço temporariamente indisponível. Contate o suporte.',
          code: 'service_error',
          statusCode: 503,
          secure: true
        }

      default:
        return {
          error: 'processing_error',
          message: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
          code: 'unknown_error',
          statusCode: 500,
          secure: true
        }
    }
  }

  // Generic errors - never expose error details
  if (error instanceof Error) {
    logError({
      message: error.message,
      stack: error.stack ? 'stack_present' : 'no_stack'
    })

    return {
      error: 'system_error',
      message: 'Ocorreu um erro inesperado. Tente novamente.',
      code: 'system_error',
      statusCode: 500,
      secure: true
    }
  }

  // Unknown errors
  logError({
    type: 'unknown_error',
    dataType: typeof error
  })

  return {
    error: 'unknown_error',
    message: 'Ocorreu um erro inesperado. Tente novamente.',
    code: 'unknown_error',
    statusCode: 500,
    secure: true
  }
}

/**
 * Create secure error response for APIs
 */
export function createSecureErrorResponse(errorResult: ReturnType<typeof handleStripeError>) {
  return {
    success: false,
    error: errorResult.error,
    message: errorResult.message,
    // Only include code if it's safe for client handling
    ...(errorResult.code && ['payment_declined', 'rate_limit', 'validation_error'].includes(errorResult.code) && {
      code: errorResult.code
    }),
    timestamp: new Date().toISOString(),
    // Never include stack traces or internal error details
  }
}

/**
 * Export default singleton instance for convenience
 */
export const stripe = getStripeClient()
