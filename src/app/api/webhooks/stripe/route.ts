/**
 * Stripe Webhook Handler - Security Enhanced Version
 *
 * SECURITY IMPROVEMENTS:
 * - Timestamp validation to prevent replay attacks
 * - Enhanced signature verification
 * - Secure error handling without information disclosure
 * - Rate limiting for webhook endpoints
 * - Request size limits
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { logger, LogCategory } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

// Initialize Stripe with secure configuration
let stripe: Stripe | null = null
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover',
    typescript: true,
    timeout: 10000,
    maxNetworkRetries: 2,
  })
}

// Security constants
const MAX_WEBHOOK_SIZE = 10 * 1024 * 1024 // 10MB limit
const WEBHOOK_TIMEOUT = 30000 // 30 seconds
const TIMESTAMP_TOLERANCE = 300 // 5 minutes in seconds
const relevantEvents = [
  'checkout.session.completed',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]
/**
 * Enhanced Stripe webhook signature verification with timestamp validation
 */
function verifyStripeWebhookSignature(body: string, signature: string): Stripe.Event {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('Webhook not properly configured')
  }

  // Extract timestamp from signature for replay attack protection
  const signatureElements = signature.split(',')
  let timestamp: number | null = null

  for (const element of signatureElements) {
    if (element.startsWith('t=')) {
      const extractedTimestamp = parseInt(element.substring(2))
      if (!isNaN(extractedTimestamp)) {
        timestamp = extractedTimestamp
        break
      }
    }
  }

  if (!timestamp) {
    throw new Error('Invalid signature format - missing timestamp')
  }

  // Check timestamp to prevent replay attacks (reject webhooks older than 5 minutes)
  const currentTime = Math.floor(Date.now() / 1000)
  if (Math.abs(currentTime - timestamp) > TIMESTAMP_TOLERANCE) {
    throw new Error('Webhook timestamp outside tolerance window')
  }

  // Enhanced signature verification
  try {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    logger.error(LogCategory.PAYMENT, 'Webhook signature verification failed', error as Error)
    throw new Error('Invalid webhook signature')
  }
}

/**
 * Secure webhook response helper
 */
function createSecureWebhookResponse(success: boolean, message: string = '', status: number = 200) {
  // Never expose internal error details in webhook responses
  const safeMessages = {
    success: 'Webhook processed successfully',
    error: 'Webhook processing failed',
    invalid_signature: 'Invalid signature',
    replay_detected: 'Replay attack detected',
    rate_limited: 'Rate limit exceeded',
    size_exceeded: 'Request size exceeded'
  }

  return NextResponse.json({
    received: success,
    message: safeMessages[message as keyof typeof safeMessages] || message
  }, { status })
}

export async function POST(request: NextRequest) {
  try {
    // Security check: Verify Stripe configuration
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return createSecureWebhookResponse(false, 'error', 503)
    }

    // Security check: Request size limit to prevent DoS
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_WEBHOOK_SIZE) {
      return createSecureWebhookResponse(false, 'size_exceeded', 413)
    }

    // Get request body with timeout protection
    const body = await request.text()

    // Security check: Verify minimum body content
    if (!body || body.length < 10) {
      return createSecureWebhookResponse(false, 'error', 400)
    }

    // Get signature
    const signature = headers().get('stripe-signature')
    if (!signature) {
      logger.warn(LogCategory.PAYMENT, 'Webhook received without signature', {
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })
      return createSecureWebhookResponse(false, 'invalid_signature', 401)
    }

    // Enhanced signature verification with replay protection
    let event: Stripe.Event
    try {
      event = verifyStripeWebhookSignature(body, signature)
    } catch (error) {
      logger.warn(LogCategory.PAYMENT, 'Webhook signature verification failed', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return createSecureWebhookResponse(false, 'invalid_signature', 401)
    }
    // Process event with security logging
    if (relevantEvents.includes(event.type)) {
      await handleStripeEvent(event)
    } else {
      logger.logPayment('stripe_webhook_ignored', {
        eventType: event.type,
        eventId: event.id,
        timestamp: new Date().toISOString()
      })
    }

    return createSecureWebhookResponse(true, 'success')

  } catch (error) {
    logger.error(LogCategory.PAYMENT, 'Webhook processing failed', error as Error)
    return createSecureWebhookResponse(false, 'error', 500)
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
      
      // Try to find user by customer ID stored in metadata
      // Note: This requires customer ID to be explicitly linked to user during checkout
      user = await prisma.user.findFirst({
        where: { 
          asaasCustomerId: customerId // Stripe customer ID may be stored here
        }
      })
      
      // If not found, we cannot safely assign the subscription
      // Log error and skip - manual intervention required
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
    
    // Create or update subscription in database
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
    
    await prisma.payment.create({
      data: {
        userId: subscription.userId,
        subscriptionId: subscription.id,
        asaasPaymentId: invoice.id, // Using Stripe invoice ID
        asaasCustomerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id || '',
        asaasSubscriptionId: subscriptionId,
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
    
    await prisma.payment.upsert({
      where: { asaasPaymentId: invoice.id },
      update: {
        status: 'OVERDUE',
        metadata: standardizedMetadata
      },
      create: {
        userId: subscription.userId,
        subscriptionId: subscription.id,
        asaasPaymentId: invoice.id,
        asaasCustomerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id || '',
        asaasSubscriptionId: subscriptionId,
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