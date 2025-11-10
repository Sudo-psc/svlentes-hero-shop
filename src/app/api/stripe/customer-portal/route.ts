import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripe-client'
import { verifyAuthToken, logAccess } from '@/lib/api-auth'
import { sendStripePortalAccessEmail } from '@/lib/email'

/**
 * API Route: Create Stripe Customer Portal Session
 *
 * Generates a secure session URL for customers to manage their subscriptions,
 * payment methods, and billing information in the Stripe Customer Portal.
 *
 * @route POST /api/stripe/customer-portal
 * @access Protected (requires Firebase auth token)
 *
 * @body {string} [returnUrl] - Optional URL to return to after portal session
 *
 * @returns {object} { url: string } - Stripe Customer Portal session URL
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/stripe/customer-portal', {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': `Bearer ${token}`,
 *     'Content-Type': 'application/json'
 *   },
 *   body: JSON.stringify({
 *     returnUrl: 'https://svlentes.com.br/area-assinante/dashboard'
 *   })
 * })
 * const { url } = await response.json()
 * window.location.href = url
 * ```
 *
 * @author Dr. Philipe Saraiva Cruz
 */

export async function POST(request: NextRequest) {
  try {
    const stripeClient = getStripeClient()
    if (!stripeClient) {
      return NextResponse.json(
        {
          error: 'Stripe não está configurado. Entre em contato com o suporte.'
        },
        { status: 503 }
      )
    }
    // 1. Verify authentication
    const auth = await verifyAuthToken(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json(auth.error, { status: auth.error!.statusCode })
    }

    const decodedToken = auth.user

    // 2. Parse request body
    const body = await request.json().catch(() => ({}))
    const { returnUrl } = body

    // 3. Get or find Stripe customer ID
    // First, try to get customer from Firebase user metadata
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
            error: 'Cliente não encontrado no Stripe',
            message: 'Você ainda não possui uma assinatura ativa. Por favor, assine um plano primeiro.'
          },
          { status: 404 }
        )
      }
    }

    // 4. Create Customer Portal session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://svlentes.com.br'
    const defaultReturnUrl = `${baseUrl}/area-assinante/dashboard`

    const session = await stripeClient.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl || defaultReturnUrl,
    })

    // 5. Log access for audit (LGPD compliance)
    logAccess(decodedToken.uid, decodedToken.email, 'STRIPE_PORTAL_ACCESS', {
      stripeCustomerId,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      returnUrl: returnUrl || defaultReturnUrl,
    })

    // 6. Send transactional email via Resend (fire and forget)
    if (decodedToken.email && process.env.RESEND_API_KEY) {
      void sendStripePortalAccessEmail({
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Assinante',
        portalUrl: session.url,
        returnUrl: returnUrl || defaultReturnUrl,
        accessIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      }).catch(emailError => {
        console.error('[STRIPE_PORTAL_EMAIL_ERROR]', emailError)
      })
    }

    // 7. Return session URL
    return NextResponse.json({
      url: session.url,
      customerId: stripeCustomerId,
    })

  } catch (error: any) {
    console.error('[STRIPE_PORTAL_ERROR]', error)

    // Handle Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { 
          error: 'Erro ao criar sessão do portal',
          message: 'Não foi possível acessar o portal de gerenciamento. Tente novamente.' 
        },
        { status: 400 }
      )
    }

    // Handle authentication errors
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Sessão expirada. Por favor, faça login novamente.' },
        { status: 401 }
      )
    }

    // Generic error
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.' 
      },
      { status: 500 }
    )
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BASE_URL || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
