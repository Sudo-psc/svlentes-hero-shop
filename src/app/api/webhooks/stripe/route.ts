// @ts-nocheck - Legacy API with type incompatibilities - needs refactoring
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { logger, LogCategory } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
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
  'payment_intent.succeeded', // Pix payment succeeded
  'payment_intent.payment_failed', // Pix payment failed
  'payment_intent.canceled', // Pix payment canceled/expired
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
  const session = event.data.object as Stripe.Checkout.Session | Stripe.Subscription | Stripe.Invoice | Stripe.PaymentIntent
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
    case 'payment_intent.succeeded': {
      const succeededPaymentIntent = session as Stripe.PaymentIntent
      await handlePixPaymentSucceeded(succeededPaymentIntent)
      break
    }
    case 'payment_intent.payment_failed': {
      const failedPaymentIntent = session as Stripe.PaymentIntent
      await handlePixPaymentFailed(failedPaymentIntent)
      break
    }
    case 'payment_intent.canceled': {
      const canceledPaymentIntent = session as Stripe.PaymentIntent
      await handlePixPaymentCanceled(canceledPaymentIntent)
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
  
  try {
    // 1. Find or create user by email
    if (!session.customer_email) {
      logger.error(LogCategory.PAYMENT, 'No customer email in checkout session', new Error('Missing email'))
      return
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.customer_email }
    })
    
    if (!user) {
      logger.error(LogCategory.PAYMENT, 'User not found for checkout session', new Error(`Email: ${session.customer_email}`))
      return
    }
    
    // 2. Fetch full subscription details from Stripe
    if (session.subscription && typeof session.subscription === 'string') {
      const subscription = await stripe!.subscriptions.retrieve(session.subscription)
      await handleSubscriptionCreated(subscription, user.id)
    }
    
  } catch (error) {
    logger.error(LogCategory.PAYMENT, 'Failed to process checkout completion', error as Error)
  }
}
async function handleSubscriptionCreated(subscription: Stripe.Subscription, userId?: string) {
  logger.logPayment('stripe_subscription_created', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
  })
  
  try {
    // Find user by Stripe customer ID or by userId if provided
    let user
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } })
    } else {
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

      // ✅ FIX: Search in correct Stripe customer ID field
      user = await prisma.user.findFirst({
        where: {
          stripeCustomerId: customerId
        }
      })

      // If not found by Stripe ID, try to find by subscription metadata email
      if (!user && subscription.metadata?.email) {
        user = await prisma.user.findUnique({
          where: { email: subscription.metadata.email }
        })

        // Update user with Stripe customer ID for future lookups
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { stripeCustomerId: customerId }
          })
        }
      }
    }
    
    if (!user) {
      logger.error(LogCategory.PAYMENT, 'User not found for subscription', new Error(`Customer: ${subscription.customer}`))
      return
    }
    
    // Get subscription price
    const priceItem = subscription.items.data[0]
    const amount = priceItem?.price?.unit_amount ? priceItem.price.unit_amount / 100 : 0
    
    // Map Stripe status to Prisma SubscriptionStatus
    const statusMap: Record<string, any> = {
      'active': 'ACTIVE',
      'trialing': 'ACTIVE',
      'past_due': 'OVERDUE',
      'canceled': 'CANCELLED',
      'unpaid': 'SUSPENDED',
      'incomplete': 'PENDING_ACTIVATION',
      'incomplete_expired': 'EXPIRED'
    }
    
    // Create or update subscription in database with Stripe-specific fields
    await prisma.subscription.upsert({
      where: { id: subscription.id },
      update: {
        status: statusMap[subscription.status] || 'ACTIVE',
        monthlyValue: amount,
        renewalDate: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date()
      },
      create: {
        id: subscription.id,
        userId: user.id,
        stripeSubscriptionId: subscription.id,
        provider: 'stripe',
        planType: priceItem?.price?.nickname || 'Stripe Subscription',
        status: statusMap[subscription.status] || 'ACTIVE',
        monthlyValue: amount,
        renewalDate: new Date(subscription.current_period_end * 1000),
        startDate: new Date(subscription.current_period_start * 1000),
        paymentMethod: 'CREDIT_CARD',
        metadata: {
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer,
          stripePriceId: priceItem?.price?.id,
        }
      }
    })
    
    logger.logPayment('stripe_subscription_synced_to_db', {
      subscriptionId: subscription.id,
      userId: user.id,
      status: statusMap[subscription.status],
    })
  } catch (error) {
    logger.error(LogCategory.PAYMENT, 'Failed to sync subscription to database', error as Error)
  }
}
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.logPayment('stripe_subscription_updated', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
  })
  
  try {
    // Map Stripe status to Prisma SubscriptionStatus
    const statusMap: Record<string, any> = {
      'active': 'ACTIVE',
      'trialing': 'ACTIVE',
      'past_due': 'OVERDUE',
      'canceled': 'CANCELLED',
      'unpaid': 'SUSPENDED',
      'incomplete': 'PENDING_ACTIVATION',
      'incomplete_expired': 'EXPIRED'
    }
    
    // Get subscription price
    const priceItem = subscription.items.data[0]
    const amount = priceItem?.price?.unit_amount ? priceItem.price.unit_amount / 100 : 0
    
    // Update subscription status in database
    const existingSub = await prisma.subscription.findFirst({
      where: { id: subscription.id }
    })
    
    if (existingSub) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: statusMap[subscription.status] || 'ACTIVE',
          monthlyValue: amount,
          renewalDate: new Date(subscription.current_period_end * 1000),
          cancelReason: subscription.cancel_at_period_end ? 'User requested cancellation' : null,
          updatedAt: new Date()
        }
      })
      
      logger.logPayment('stripe_subscription_updated_in_db', {
        subscriptionId: subscription.id,
        newStatus: statusMap[subscription.status],
      })
    } else {
      // Subscription doesn't exist, create it
      await handleSubscriptionCreated(subscription)
    }
  } catch (error) {
    logger.error(LogCategory.PAYMENT, 'Failed to update subscription in database', error as Error)
  }
}
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.logPayment('stripe_subscription_deleted', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
  })
  
  try {
    // Update subscription status to CANCELLED in database
    await prisma.subscription.updateMany({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        endDate: new Date(),
        cancelReason: 'Subscription cancelled in Stripe',
        updatedAt: new Date()
      }
    })
    
    logger.logPayment('stripe_subscription_cancelled_in_db', {
      subscriptionId: subscription.id,
    })
  } catch (error) {
    logger.error(LogCategory.PAYMENT, 'Failed to cancel subscription in database', error as Error)
  }
}
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  logger.logPayment('stripe_invoice_payment_succeeded', {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
    customerId: invoice.customer,
    amount_paid: invoice.amount_paid,
    currency: invoice.currency,
  })
  
  try {
    // Find subscription
    const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
    if (!subscriptionId) {
      logger.error(LogCategory.PAYMENT, 'No subscription ID in invoice', new Error(`Invoice: ${invoice.id}`))
      return
    }
    
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId }
    })
    
    if (!subscription) {
      logger.error(LogCategory.PAYMENT, 'Subscription not found for invoice', new Error(`Subscription: ${subscriptionId}`))
      return
    }
    
    // Create payment record with standardized metadata
    const standardizedMetadata = {
      stripeInvoiceId: invoice.id,
      stripeSubscriptionId: subscriptionId,
      attemptCount: invoice.attempt_count || 1,
      lastAttempt: new Date().toISOString(),
      status: 'success'
    }
    
    // ✅ FIX: Create payment record with correct Stripe fields
    await prisma.payment.create({
      data: {
        userId: subscription.userId,
        subscriptionId: subscription.id,
        provider: 'stripe',
        stripePaymentId: invoice.payment_intent as string || invoice.id,
        stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id || '',
        stripeSubscriptionId: subscriptionId,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid / 100,
        netValue: invoice.amount_paid / 100,
        status: 'CONFIRMED',
        billingType: 'CREDIT_CARD',
        description: invoice.description || 'Stripe subscription payment',
        dueDate: new Date(invoice.period_end * 1000),
        paymentDate: new Date(invoice.status_transitions.paid_at! * 1000),
        confirmedDate: new Date(invoice.status_transitions.paid_at! * 1000),
        invoiceUrl: invoice.hosted_invoice_url || undefined,
        invoiceNumber: invoice.number || undefined,
        metadata: standardizedMetadata
      }
    })
    
    // Update subscription last payment info
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        lastPaymentId: invoice.id,
        lastPaymentDate: new Date(invoice.status_transitions.paid_at! * 1000),
        updatedAt: new Date()
      }
    })
    
    logger.logPayment('stripe_payment_recorded_in_db', {
      invoiceId: invoice.id,
      subscriptionId: subscriptionId,
      amount: invoice.amount_paid / 100,
    })
  } catch (error) {
    logger.error(LogCategory.PAYMENT, 'Failed to record payment in database', error as Error)
  }
}
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logger.logPayment('stripe_invoice_payment_failed', {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
    customerId: invoice.customer,
    amount_due: invoice.amount_due,
    attempt_count: invoice.attempt_count,
  })
  
  try {
    // Find subscription
    const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
    if (!subscriptionId) {
      return
    }
    
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId }
    })
    
    if (!subscription) {
      return
    }
    
    // Update subscription status to OVERDUE
    const periodEnd = new Date(invoice.period_end * 1000)
    const daysOverdue = Math.max(0, Math.ceil((Date.now() - periodEnd.getTime()) / (1000 * 60 * 60 * 24)))
    
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'OVERDUE',
        overdueDate: new Date(),
        daysOverdue,
        updatedAt: new Date()
      }
    })
    
    // Create/update failed payment record with standardized metadata
    const standardizedMetadata = {
      stripeInvoiceId: invoice.id,
      stripeSubscriptionId: subscriptionId,
      attemptCount: invoice.attempt_count,
      lastAttempt: new Date().toISOString(),
      failureReason: 'payment_failed'
    }
    
    // ✅ FIX: Upsert payment with correct Stripe fields
    await prisma.payment.upsert({
      where: { stripeInvoiceId: invoice.id },
      update: {
        status: 'OVERDUE',
        metadata: standardizedMetadata
      },
      create: {
        userId: subscription.userId,
        subscriptionId: subscription.id,
        provider: 'stripe',
        stripePaymentId: invoice.payment_intent as string || invoice.id,
        stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id || '',
        stripeSubscriptionId: subscriptionId,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due / 100,
        status: 'OVERDUE',
        billingType: 'CREDIT_CARD',
        description: invoice.description || 'Failed Stripe payment',
        dueDate: new Date(invoice.period_end * 1000),
        metadata: standardizedMetadata
      }
    })
    
    logger.logPayment('stripe_failed_payment_recorded_in_db', {
      invoiceId: invoice.id,
      subscriptionId: subscriptionId,
      attemptCount: invoice.attempt_count,
    })
  } catch (error) {
    logger.error(LogCategory.PAYMENT, 'Failed to record payment failure in database', error as Error)
  }
}

/**
 * Handle Pix payment success (PaymentIntent succeeded)
 * This is triggered when a customer successfully pays via Pix
 */
async function handlePixPaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  logger.logPayment('stripe_pix_payment_succeeded', {
    paymentIntentId: paymentIntent.id,
    customerId: paymentIntent.customer,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    paymentMethod: paymentIntent.payment_method,
  })

  try {
    // Find user by Stripe customer ID
    const customerId = typeof paymentIntent.customer === 'string'
      ? paymentIntent.customer
      : paymentIntent.customer?.id

    if (!customerId) {
      logger.error(LogCategory.PAYMENT, 'No customer ID in Pix PaymentIntent', new Error(`PaymentIntent: ${paymentIntent.id}`))
      return
    }

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId }
    })

    // If not found by Stripe ID, try metadata email
    let finalUser = user
    if (!user && paymentIntent.metadata?.customerEmail) {
      finalUser = await prisma.user.findUnique({
        where: { email: paymentIntent.metadata.customerEmail }
      })

      // Update user with Stripe customer ID for future lookups
      if (finalUser) {
        await prisma.user.update({
          where: { id: finalUser.id },
          data: { stripeCustomerId: customerId }
        })
      }
    }

    if (!finalUser) {
      logger.error(LogCategory.PAYMENT, 'User not found for Pix payment', new Error(`Customer: ${customerId}`))
      return
    }

    // Create payment record for Pix transaction
    await prisma.payment.create({
      data: {
        userId: finalUser.id,
        provider: 'stripe',
        stripePaymentId: paymentIntent.id,
        stripeCustomerId: customerId,
        amount: paymentIntent.amount / 100,
        netValue: paymentIntent.amount / 100,
        status: 'CONFIRMED',
        billingType: 'PIX', // Pix payment method
        description: paymentIntent.description || 'Pix payment',
        paymentDate: new Date(),
        confirmedDate: new Date(),
        metadata: {
          stripePaymentIntentId: paymentIntent.id,
          paymentMethod: 'pix',
          pixData: paymentIntent.next_action?.pix_display_qr_code || null,
          charges: paymentIntent.charges.data.map(charge => ({
            id: charge.id,
            amount: charge.amount,
            status: charge.status,
            created: charge.created,
          })),
          ...paymentIntent.metadata,
        }
      }
    })

    logger.logPayment('stripe_pix_payment_recorded_in_db', {
      paymentIntentId: paymentIntent.id,
      userId: finalUser.id,
      amount: paymentIntent.amount / 100,
    })
  } catch (error) {
    logger.error(LogCategory.PAYMENT, 'Failed to record Pix payment in database', error as Error)
  }
}

/**
 * Handle Pix payment failure
 * This is triggered when a Pix payment fails for any reason
 */
async function handlePixPaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  logger.logPayment('stripe_pix_payment_failed', {
    paymentIntentId: paymentIntent.id,
    customerId: paymentIntent.customer,
    amount: paymentIntent.amount,
    lastPaymentError: paymentIntent.last_payment_error,
  })

  try {
    const customerId = typeof paymentIntent.customer === 'string'
      ? paymentIntent.customer
      : paymentIntent.customer?.id

    if (!customerId) return

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId }
    })

    if (!user) {
      // Try to find by metadata email
      if (paymentIntent.metadata?.customerEmail) {
        const userByEmail = await prisma.user.findUnique({
          where: { email: paymentIntent.metadata.customerEmail }
        })

        if (!userByEmail) return

        // Create failed payment record
        await createFailedPixPayment(paymentIntent, userByEmail.id, customerId)
      }
      return
    }

    await createFailedPixPayment(paymentIntent, user.id, customerId)
  } catch (error) {
    logger.error(LogCategory.PAYMENT, 'Failed to record Pix payment failure in database', error as Error)
  }
}

/**
 * Handle Pix payment cancellation/expiration
 * This is triggered when a Pix payment is canceled or the QR code expires
 */
async function handlePixPaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  logger.logPayment('stripe_pix_payment_canceled', {
    paymentIntentId: paymentIntent.id,
    customerId: paymentIntent.customer,
    amount: paymentIntent.amount,
    cancellationReason: paymentIntent.cancellation_reason,
  })

  try {
    const customerId = typeof paymentIntent.customer === 'string'
      ? paymentIntent.customer
      : paymentIntent.customer?.id

    if (!customerId) return

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId }
    })

    if (!user) {
      // Try metadata email
      if (paymentIntent.metadata?.customerEmail) {
        const userByEmail = await prisma.user.findUnique({
          where: { email: paymentIntent.metadata.customerEmail }
        })

        if (!userByEmail) return

        await createCanceledPixPayment(paymentIntent, userByEmail.id, customerId)
      }
      return
    }

    await createCanceledPixPayment(paymentIntent, user.id, customerId)
  } catch (error) {
    logger.error(LogCategory.PAYMENT, 'Failed to record Pix payment cancellation in database', error as Error)
  }
}

/**
 * Helper: Create failed Pix payment record
 */
async function createFailedPixPayment(
  paymentIntent: Stripe.PaymentIntent,
  userId: string,
  customerId: string
) {
  await prisma.payment.create({
    data: {
      userId,
      provider: 'stripe',
      stripePaymentId: paymentIntent.id,
      stripeCustomerId: customerId,
      amount: paymentIntent.amount / 100,
      status: 'REFUNDED', // Using REFUNDED as closest enum for failed
      billingType: 'PIX',
      description: paymentIntent.description || 'Failed Pix payment',
      metadata: {
        stripePaymentIntentId: paymentIntent.id,
        paymentMethod: 'pix',
        status: 'failed',
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
        failureCode: paymentIntent.last_payment_error?.code || 'unknown',
        ...paymentIntent.metadata,
      }
    }
  })

  logger.logPayment('stripe_failed_pix_payment_recorded_in_db', {
    paymentIntentId: paymentIntent.id,
    userId,
    failureReason: paymentIntent.last_payment_error?.message,
  })
}

/**
 * Helper: Create canceled Pix payment record
 */
async function createCanceledPixPayment(
  paymentIntent: Stripe.PaymentIntent,
  userId: string,
  customerId: string
) {
  await prisma.payment.create({
    data: {
      userId,
      provider: 'stripe',
      stripePaymentId: paymentIntent.id,
      stripeCustomerId: customerId,
      amount: paymentIntent.amount / 100,
      status: 'REFUNDED', // Using REFUNDED as closest enum for canceled
      billingType: 'PIX',
      description: paymentIntent.description || 'Canceled Pix payment',
      metadata: {
        stripePaymentIntentId: paymentIntent.id,
        paymentMethod: 'pix',
        status: 'canceled',
        cancellationReason: paymentIntent.cancellation_reason || 'User canceled or QR code expired',
        ...paymentIntent.metadata,
      }
    }
  })

  logger.logPayment('stripe_canceled_pix_payment_recorded_in_db', {
    paymentIntentId: paymentIntent.id,
    userId,
    cancellationReason: paymentIntent.cancellation_reason,
  })
}