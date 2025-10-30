import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { adminAuth } from '@/lib/firebase-admin'

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

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const headersList = await headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticação inválido' },
        { status: 401 }
      )
    }

    const token = authorization.split('Bearer ')[1]
    
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin não inicializado' },
        { status: 500 }
      )
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token)
    
    if (!decodedToken?.uid) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await request.json().catch(() => ({}))
    const { returnUrl } = body

    // 3. Get or find Stripe customer ID
    // First, try to get customer from Firebase user metadata
    let stripeCustomerId = decodedToken.stripeCustomerId

    if (!stripeCustomerId) {
      // Search for customer by email
      const customers = await stripe.customers.list({
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

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl || defaultReturnUrl,
    })

    // 5. Log access for audit (LGPD compliance)
    console.log('[STRIPE_PORTAL_ACCESS]', {
      userId: decodedToken.uid,
      email: decodedToken.email,
      stripeCustomerId,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    })

    // 6. Return session URL
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
