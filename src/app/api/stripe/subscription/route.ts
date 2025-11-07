import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripe-client'
import { verifyAuthToken, logAccess } from '@/lib/api-auth'

/**
 * API Route: Get User's Active Stripe Subscription
 *
 * Fetches the user's active subscription data from Stripe,
 * including plan details, billing info, and payment status.
 *
 * @route GET /api/stripe/subscription
 * @access Protected (requires Firebase auth token)
 *
 * @returns {object} { subscription: StripeSubscription }
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/stripe/subscription', {
 *   headers: {
 *     'Authorization': `Bearer ${token}`
 *   }
 * })
 * const { subscription } = await response.json()
 * ```
 *
 * @author Dr. Philipe Saraiva Cruz
 */

import { withAuth } from '@/lib/auth-middleware'

export const GET = withAuth(async (request, { user, security }) => {
  try {
    const stripeClient = getStripeClient()
    if (!stripeClient) {
      return NextResponse.json(
        { error: 'Serviço de pagamento temporariamente indisponível.' },
        { status: 503 }
      )
    }

    const decodedToken = user

    // 2. Get Stripe customer ID
    let stripeCustomerId = decodedToken.stripeCustomerId

    if (!stripeCustomerId) {
      // Search for customer by email
      const customers = await stripeClient.customers.list({
        email: decodedToken.email,
        limit: 1,
      })

      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id
      } else {
        return NextResponse.json(
          {
            error: 'Cliente não encontrado',
            message: 'Você ainda não possui uma assinatura ativa.'
          },
          { status: 404 }
        )
      }
    }

    // 3. Fetch active subscriptions for this customer
    const subscriptions = await stripeClient.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      expand: ['data.default_payment_method', 'data.items.data.price.product'],
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        {
          error: 'Assinatura não encontrada',
          message: 'Você não possui uma assinatura ativa no momento.'
        },
        { status: 404 }
      )
    }

    const subscription = subscriptions.data[0]
    const subscriptionItem = subscription.items.data[0]
    const price = subscriptionItem.price
    const product = typeof price.product === 'string'
      ? null
      : price.product as Stripe.Product

    // 4. Get payment method details
    const paymentMethod = subscription.default_payment_method
    let paymentMethodDetails = null

    if (paymentMethod && typeof paymentMethod !== 'string') {
      paymentMethodDetails = {
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
        } : null,
      }
    }

    // 5. Build response
    const subscriptionData = {
      id: subscription.id,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at,
      created: subscription.created,

      // Plan details
      plan: {
        id: product?.id || price.id,
        name: product?.name || 'Plano de Assinatura',
        description: product?.description || '',
        amount: price.unit_amount || 0,
        currency: price.currency,
        interval: price.recurring?.interval || 'month',
        interval_count: price.recurring?.interval_count || 1,
      },

      // Payment details
      payment_method: paymentMethodDetails,

      // Customer details
      customer: {
        id: stripeCustomerId,
        email: decodedToken.email,
      },

      // Billing
      latest_invoice: subscription.latest_invoice,
      billing_cycle_anchor: subscription.billing_cycle_anchor,

      // Additional metadata
      metadata: subscription.metadata,
    }

    // 6. Log access for audit (LGPD compliance)
    logAccess(decodedToken.uid, decodedToken.email, 'STRIPE_SUBSCRIPTION_ACCESS', {
      subscriptionId: subscription.id,
      requestId: security.requestId
    })

    return NextResponse.json({
      subscription: subscriptionData,
    }, { status: 200 })

  } catch (error: any) {
    console.error('[STRIPE_SUBSCRIPTION_ERROR]', {
      error: error.message,
      userId: decodedToken.uid,
      requestId: security.requestId,
      timestamp: new Date().toISOString()
    })

    // Use secure error handling
    const { createSecureErrorResponse } = await import('@/lib/stripe-client')
    const errorResult = createSecureErrorResponse({
      error: 'system_error',
      message: 'Erro ao processar solicitação',
      statusCode: 500
    } as any)

    return NextResponse.json(errorResult, { status: 500 })
  }
}, { requireAuth: true })

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BASE_URL || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
