// @ts-nocheck - Legacy API with type incompatibilities - needs refactoring
import { NextRequest, NextResponse } from 'next/server'
import { logger, LogCategory } from '@/lib/logger'
import { pricingPlans } from '@/data/pricing-plans'
import { z } from 'zod'
import { getStripeClient, handleStripeError } from '@/lib/stripe-client'

// Get Stripe client with proper timeout configuration
const stripe = getStripeClient()
// Simplified schema - only accept priceId and customerEmail from client
const checkoutRequestSchema = z.object({
  priceId: z.string().min(1, 'ID do preço é obrigatório'),
  customerEmail: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
})
// Get canonical URLs from server config
function getCanonicalUrls() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://svlentes.com.br'
  return {
    successUrl: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${baseUrl}/cancel`,
  }
}
// Extract email domain for logging (PII-safe)
function getEmailDomain(email: string): string {
  try {
    const domain = email.split('@')[1]
    return domain || 'unknown'
  } catch {
    return 'invalid'
  }
}
export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe não está configurado. Entre em contato com o suporte.' },
        { status: 503 }
      )
    }
    const body = await request.json()
    // Validate client input using Zod schema
    const validatedData = checkoutRequestSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validatedData.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }
    const { priceId, customerEmail } = validatedData.data

    // Validate price ID format
    if (!priceId.startsWith('price_')) {
      return NextResponse.json(
        { error: 'ID do preço inválido' },
        { status: 400 }
      )
    }

    // Get canonical URLs from server config
    const { successUrl, cancelUrl } = getCanonicalUrls()

    logger.logPayment('stripe_checkout_attempt', {
      priceId,
      emailDomain: getEmailDomain(customerEmail),
    })

    // First, retrieve the price to determine if it's recurring or one-time
    const price = await stripe.prices.retrieve(priceId)
    const isRecurring = !!price.recurring

    // Create Stripe Checkout Session
    const sessionConfig: any = {
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isRecurring ? 'subscription' : 'payment',
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: 'pt-BR',
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['BR'],
      },
      phone_number_collection: {
        enabled: true,
      },
      allow_promotion_codes: true,
      automatic_tax: {
        enabled: false,
      },
      metadata: {
        source: 'website_fallback',
        price_id: priceId,
        price_type: isRecurring ? 'subscription' : 'payment',
      },
    }

    // Add subscription_data only for recurring prices
    if (isRecurring) {
      sessionConfig.subscription_data = {
        metadata: {
          source: 'website_fallback',
          price_id: priceId,
        },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    logger.logPayment('stripe_checkout_created', {
      sessionId: session.id,
      priceId,
      emailDomain: getEmailDomain(customerEmail),
    })
    return NextResponse.json({
      sessionId: session.id,
      checkoutUrl: session.url,
    })
  } catch (error) {
    logger.error(LogCategory.PAYMENT, 'Failed to create Stripe checkout session', error as Error)
    if (error instanceof Error) {
      // Handle specific Stripe errors
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Erro de configuração do Stripe. Contate o suporte.' },
          { status: 500 }
        )
      }
    }
    return NextResponse.json(
      { error: 'Erro ao processar pagamento com Stripe. Tente novamente.' },
      { status: 500 }
    )
  }
}