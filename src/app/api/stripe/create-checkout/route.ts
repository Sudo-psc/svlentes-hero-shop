import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { logger, LogCategory } from '@/lib/logger'
import { pricingPlans } from '@/data/pricing-plans'
import { z } from 'zod'
// Initialize Stripe with secret key (if available)
let stripe: Stripe | null = null
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover',
  })
}
// Simplified schema - only accept planId and customerEmail from client
const checkoutRequestSchema = z.object({
  planId: z.string().min(1, 'ID do plano é obrigatório'),
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
    const { planId, customerEmail } = validatedData.data
    // Look up plan server-side to prevent price tampering
    const selectedPlan = pricingPlans.find(plan => plan.id === planId)
    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }
    // Get canonical URLs from server config
    const { successUrl, cancelUrl } = getCanonicalUrls()
    // Use monthly price for Stripe (can be adjusted for annual billing)
    const amount = selectedPlan.priceMonthly
    logger.logPayment('stripe_checkout_attempt', {
      planId,
      planName: selectedPlan.name,
      amount,
      emailDomain: getEmailDomain(customerEmail),
    })
    // Create Stripe Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: selectedPlan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          plan_id: planId,
          source: 'website_fallback',
        },
      },
      locale: 'pt-BR',
      billing_address_collection: 'auto',
    })
    logger.logPayment('stripe_checkout_created', {
      sessionId: session.id,
      planId,
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