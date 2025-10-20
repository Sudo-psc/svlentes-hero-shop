import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { logger, LogCategory } from '@/lib/logger'
// Initialize Stripe with secret key (if available)
let stripe: Stripe | null = null
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover',
  })
}
const relevantEvents = [
  'checkout.session.completed',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]
export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Stripe webhook não está configurado' },
        { status: 503 }
      )
    }
    const body = await request.text()
    const signature = headers().get('stripe-signature')
    if (!signature) {
      logger.error(LogCategory.PAYMENT, 'Missing Stripe signature', new Error('No signature'))
      return NextResponse.json(
        { error: 'Assinatura ausente' },
        { status: 400 }
      )
    }
    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      logger.error(LogCategory.PAYMENT, 'Invalid Stripe signature', err as Error)
      return NextResponse.json(
        { error: 'Assinatura inválida' },
        { status: 400 }
      )
    }
    // Handle relevant events
    if (relevantEvents.includes(event.type)) {
      await handleStripeEvent(event)
    } else {
      logger.logPayment('stripe_webhook_ignored', {
        eventType: event.type,
        eventId: event.id,
      })
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error(LogCategory.PAYMENT, 'Failed to process Stripe webhook', error as Error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
async function handleStripeEvent(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session | Stripe.Subscription | Stripe.Invoice
  switch (event.type) {
    case 'checkout.session.completed': {
      const completedSession = session as Stripe.Checkout.Session
      await handleCheckoutCompleted(completedSession)
      break
    }
    case 'customer.subscription.created': {
      const createdSubscription = session as Stripe.Subscription
      await handleSubscriptionCreated(createdSubscription)
      break
    }
    case 'customer.subscription.updated': {
      const updatedSubscription = session as Stripe.Subscription
      await handleSubscriptionUpdated(updatedSubscription)
      break
    }
    case 'customer.subscription.deleted': {
      const deletedSubscription = session as Stripe.Subscription
      await handleSubscriptionDeleted(deletedSubscription)
      break
    }
    case 'invoice.payment_succeeded': {
      const succeededInvoice = session as Stripe.Invoice
      await handleInvoicePaymentSucceeded(succeededInvoice)
      break
    }
    case 'invoice.payment_failed': {
      const failedInvoice = session as Stripe.Invoice
      await handleInvoicePaymentFailed(failedInvoice)
      break
    }
    default:
      logger.logPayment('stripe_unhandled_event', {
        eventType: event.type,
        eventId: event.id,
      })
  }
}
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  logger.logPayment('stripe_checkout_completed', {
    sessionId: session.id,
    customerEmail: session.customer_email,
    subscriptionId: session.subscription,
    metadata: session.metadata,
  })
  // Here you can:
  // 1. Create/update customer in your database
  // 2. Create subscription record
  // 3. Send welcome email
  // 4. Notify admin team
}
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  logger.logPayment('stripe_subscription_created', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
  })
}
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.logPayment('stripe_subscription_updated', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
  })
}
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.logPayment('stripe_subscription_deleted', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
  })
}
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  logger.logPayment('stripe_invoice_payment_succeeded', {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
    customerId: invoice.customer,
    amount_paid: invoice.amount_paid,
    currency: invoice.currency,
  })
}
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logger.logPayment('stripe_invoice_payment_failed', {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
    customerId: invoice.customer,
    amount_due: invoice.amount_due,
    attempt_count: invoice.attempt_count,
  })
}