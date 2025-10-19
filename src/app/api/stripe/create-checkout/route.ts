import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { logger, LogCategory } from '@/lib/logger'

// Initialize Stripe with secret key (if available)
let stripe: Stripe | null = null

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia',
  })
}

const checkoutRequestSchema = {
  planId: { type: 'string', required: true },
  amount: { type: 'number', required: true },
  planName: { type: 'string', required: true },
  customerEmail: { type: 'string', required: true },
  successUrl: { type: 'string', required: true },
  cancelUrl: { type: 'string', required: true },
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

    // Validate required fields
    for (const [key, config] of Object.entries(checkoutRequestSchema)) {
      if (config.required && !body[key]) {
        return NextResponse.json(
          { error: `Campo ${key} é obrigatório` },
          { status: 400 }
        )
      }
    }

    const {
      planId,
      amount,
      planName,
      customerEmail,
      successUrl,
      cancelUrl
    } = body

    logger.logPayment('stripe_checkout_attempt', {
      planId,
      amount,
      customerEmail,
    })

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: planName,
              description: `Assinatura SV Lentes - ${planName}`,
              metadata: {
                plan_id: planId,
              },
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
            recurring: {
              interval: 'month',
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        plan_id: planId,
        source: 'website_fallback',
      },
      payment_intent_data: {
        metadata: {
          plan_id: planId,
        },
      },
      locale: 'pt-BR',
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['BR'],
      },
      phone_number_collection: {
        enabled: true,
      },
    })

    logger.logPayment('stripe_checkout_created', {
      sessionId: session.id,
      planId,
      customerEmail,
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