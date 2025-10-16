import { NextRequest, NextResponse } from 'next/server'
import { logger, LogCategory } from '@/lib/logger'
import { paymentService } from '@/lib/services/payment-service'
import { SubscriptionService } from '@/lib/database/subscription-service'
import { emailService } from '@/lib/services/email-service'

// Prevent this route from being evaluated at build time
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface AsaasWebhookEvent {
    event: string
    payment?: {
        object: string
        id: string
        dateCreated: string
        customer: string
        subscription?: string
        installment?: string
        value: number
        netValue: number
        originalValue?: number
        interestValue?: number
        description: string
        billingType: string
        status: string
        dueDate: string
        originalDueDate: string
        paymentDate?: string
        clientPaymentDate?: string
        invoiceUrl: string
        invoiceNumber?: string
        externalReference?: string
        deleted: boolean
    }
}

interface WebhookLog {
    eventType: string
    paymentId?: string
    timestamp: string
    customerId?: string
    subscriptionId?: string
    amount?: number
    status: 'success' | 'error'
    details?: any
    error?: string
}

function logWebhookEvent(log: WebhookLog) {
    // Use secure logger instead of console.log
    // In production, PII is automatically sanitized and only sent to backend
    logger.logWebhook(log.eventType, {
        paymentId: log.paymentId,
        status: log.status,
        timestamp: log.timestamp,
        // Do NOT log: customerId, subscriptionId, amount (PII/financial data)
        error: log.error
    })
}

/**
 * Lookup user by Asaas customer ID
 * Used for email notifications after payment events
 */
async function getUserByAsaasCustomerId(asaasCustomerId: string): Promise<{
    userId: string
    email: string
    name: string
} | null> {
    try {
        // Import Prisma client dynamically to avoid build-time issues
        const { PrismaClient } = await import('@prisma/client')
        const prisma = new PrismaClient()

        const user = await prisma.user.findUnique({
            where: { asaasCustomerId },
            select: {
                id: true,
                email: true,
                name: true
            }
        })

        await prisma.$disconnect()

        if (!user) {
            logger.warn(LogCategory.WEBHOOK, 'User not found by Asaas customer ID', {
                asaasCustomerId
            })
            return null
        }

        return {
            userId: user.id,
            email: user.email,
            name: user.name
        }
    } catch (error) {
        logger.error(LogCategory.WEBHOOK, 'Error looking up user by Asaas customer ID', error as Error, {
            asaasCustomerId
        })
        return null
    }
}

async function handlePaymentCreated(payment: any) {
    try {
        logWebhookEvent({
            eventType: 'PAYMENT_CREATED',
            paymentId: payment.id,
            timestamp: new Date().toISOString(),
            customerId: payment.customer,
            subscriptionId: payment.subscription,
            amount: payment.value,
            status: 'success',
            details: {
                billingType: payment.billingType,
                dueDate: payment.dueDate,
                description: payment.description,
            }
        })

        // Secure logging - PII sanitized in production
        logger.logPayment('created', {
            paymentId: payment.id,
            status: payment.status,
            dueDate: payment.dueDate
        })

        // Persist payment to database
        // TODO: Add logic to lookup userId from payment.customer
        const user = await getUserByAsaasCustomerId(payment.customer)

        const paymentData = paymentService.mapAsaasWebhookToPayment(payment, {
            userId: user?.userId,
            subscriptionId: payment.subscription
        })

        await paymentService.createOrUpdatePayment(paymentData)

        logger.info(LogCategory.WEBHOOK, 'Payment created and persisted', {
            paymentId: payment.id
        })

    } catch (error) {
        logger.error(LogCategory.WEBHOOK, 'Error handling payment created', error as Error, {
            paymentId: payment.id
        })
        throw error
    }
}

async function handlePaymentReceived(payment: any) {
    try {
        logWebhookEvent({
            eventType: 'PAYMENT_RECEIVED',
            paymentId: payment.id,
            timestamp: new Date().toISOString(),
            customerId: payment.customer,
            subscriptionId: payment.subscription,
            amount: payment.value,
            status: 'success',
            details: {
                paymentDate: payment.paymentDate,
                netValue: payment.netValue,
                externalReference: payment.externalReference,
            }
        })

        // Secure logging - no PII/financial data in production logs
        logger.logBusiness('payment_confirmed', {
            paymentId: payment.id,
            paymentDate: payment.paymentDate,
            currency: 'BRL'
        })

        // Update payment status in database
        await paymentService.updatePaymentStatus(payment.id, {
            status: 'RECEIVED',
            paymentDate: new Date(payment.paymentDate || payment.clientPaymentDate),
            netValue: payment.netValue
        })

        // If this is a subscription payment, activate subscription
        if (payment.subscription) {
            const subscription = await SubscriptionService.getSubscriptionByAsaasId(payment.subscription)

            if (subscription) {
                // Activate subscription (handles first payment and renewals)
                await SubscriptionService.activateSubscription(subscription.id)

                // Record payment
                await SubscriptionService.recordPayment(
                    subscription.id,
                    payment.id,
                    payment.value,
                    new Date(payment.paymentDate || payment.clientPaymentDate)
                )

                logger.info(LogCategory.WEBHOOK, 'Subscription activated and payment recorded', {
                    subscriptionId: subscription.id,
                    paymentId: payment.id
                })

                // Send confirmation email
                // TODO: Get user details from database
                const user = await getUserByAsaasCustomerId(payment.customer)

                if (user) {
                    const result = await emailService.sendPaymentConfirmation({
                        paymentId: payment.id,
                        recipientName: user.name,
                        recipientEmail: user.email,
                        amount: payment.value,
                        paymentMethod: payment.billingType,
                        paymentDate: new Date(payment.paymentDate || payment.clientPaymentDate),
                        invoiceUrl: payment.invoiceUrl
                    })

                    if (!result.success) {
                        logger.warn(LogCategory.WEBHOOK, 'Payment confirmation email failed', {
                            paymentId: payment.id,
                            error: result.error
                        })
                    } else {
                        logger.info(LogCategory.WEBHOOK, 'Payment confirmation email sent', {
                            paymentId: payment.id
                        })
                    }
                } else {
                    logger.warn(LogCategory.WEBHOOK, 'User not found for payment confirmation email', {
                        paymentId: payment.id,
                        asaasCustomerId: payment.customer
                    })
                }
            } else {
                logger.warn(LogCategory.WEBHOOK, 'Subscription not found for payment', {
                    paymentId: payment.id,
                    asaasSubscriptionId: payment.subscription
                })
            }
        }

    } catch (error) {
        logger.error(LogCategory.WEBHOOK, 'Error handling payment received', error as Error, {
            paymentId: payment.id
        })
        throw error
    }
}

async function handlePaymentConfirmed(payment: any) {
    try {
        logWebhookEvent({
            eventType: 'PAYMENT_CONFIRMED',
            paymentId: payment.id,
            timestamp: new Date().toISOString(),
            customerId: payment.customer,
            subscriptionId: payment.subscription,
            amount: payment.value,
            status: 'success',
            details: {
                confirmedDate: payment.confirmedDate,
                netValue: payment.netValue,
            }
        })

        // Secure logging - no PII in production
        logger.logPayment('confirmed', {
            paymentId: payment.id,
            confirmedDate: payment.confirmedDate
        })

        // TODO: Update payment status in database
        // await PaymentService.updatePaymentStatus(payment.id, 'CONFIRMED')
    } catch (error) {
        logger.error(LogCategory.WEBHOOK, 'Error handling payment confirmed', error as Error, {
            paymentId: payment.id
        })
        throw error
    }
}

async function handlePaymentOverdue(payment: any) {
    try {
        logWebhookEvent({
            eventType: 'PAYMENT_OVERDUE',
            paymentId: payment.id,
            timestamp: new Date().toISOString(),
            customerId: payment.customer,
            subscriptionId: payment.subscription,
            amount: payment.value,
            status: 'success',
            details: {
                dueDate: payment.dueDate,
                originalDueDate: payment.originalDueDate,
            }
        })

        // Secure logging
        logger.logPayment('overdue', {
            paymentId: payment.id,
            dueDate: payment.dueDate
        })

        // Update payment status
        await paymentService.updatePaymentStatus(payment.id, {
            status: 'OVERDUE'
        })

        // Mark subscription as overdue
        if (payment.subscription) {
            const subscription = await SubscriptionService.getSubscriptionByAsaasId(payment.subscription)

            if (subscription) {
                await SubscriptionService.markAsOverdue(subscription.id)

                logger.info(LogCategory.WEBHOOK, 'Subscription marked as overdue', {
                    subscriptionId: subscription.id,
                    paymentId: payment.id
                })

                // Send overdue notification
                // TODO: Get user details from database
                const user = await getUserByAsaasCustomerId(payment.customer)

                if (user) {
                    const daysOverdue = Math.floor(
                        (Date.now() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                    )

                    const result = await emailService.sendOverdueNotification({
                        subscriptionId: subscription.id,
                        recipientName: user.name,
                        recipientEmail: user.email,
                        amount: payment.value,
                        dueDate: new Date(payment.dueDate),
                        daysOverdue,
                        paymentLink: payment.invoiceUrl || `https://svlentes.shop/area-assinante/pagamentos/${payment.id}`
                    })

                    if (!result.success) {
                        logger.warn(LogCategory.WEBHOOK, 'Overdue notification email failed', {
                            paymentId: payment.id,
                            error: result.error
                        })
                    } else {
                        logger.info(LogCategory.WEBHOOK, 'Overdue notification email sent', {
                            paymentId: payment.id,
                            daysOverdue
                        })
                    }
                } else {
                    logger.warn(LogCategory.WEBHOOK, 'User not found for overdue notification email', {
                        paymentId: payment.id,
                        asaasCustomerId: payment.customer
                    })
                }
            } else {
                logger.warn(LogCategory.WEBHOOK, 'Subscription not found for overdue payment', {
                    paymentId: payment.id,
                    asaasSubscriptionId: payment.subscription
                })
            }
        }

    } catch (error) {
        logger.error(LogCategory.WEBHOOK, 'Error handling payment overdue', error as Error, {
            paymentId: payment.id
        })
        throw error
    }
}

async function handlePaymentRefunded(payment: any) {
    try {
        logWebhookEvent({
            eventType: 'PAYMENT_REFUNDED',
            paymentId: payment.id,
            timestamp: new Date().toISOString(),
            customerId: payment.customer,
            subscriptionId: payment.subscription,
            amount: payment.value,
            status: 'success',
            details: {
                refundDate: new Date().toISOString(),
            }
        })

        // Secure logging
        logger.logPayment('refunded', {
            paymentId: payment.id,
            refundDate: new Date().toISOString()
        })

        // Record refund in database
        await paymentService.recordRefund(payment.id)

        logger.info(LogCategory.WEBHOOK, 'Payment refund recorded', {
            paymentId: payment.id
        })

        // Handle subscription refund
        if (payment.subscription) {
            const subscription = await SubscriptionService.getSubscriptionByAsaasId(payment.subscription)

            if (subscription) {
                await SubscriptionService.handleRefund(
                    subscription.id,
                    payment.value,
                    'Refund processed by Asaas'
                )

                logger.info(LogCategory.WEBHOOK, 'Subscription refund handled', {
                    subscriptionId: subscription.id,
                    paymentId: payment.id
                })

                // Send refund confirmation email
                // TODO: Get user details from database
                const user = await getUserByAsaasCustomerId(payment.customer)

                if (user) {
                    const result = await emailService.sendRefundConfirmation(
                        user.email,
                        {
                            refundId: `refund_${payment.id}_${Date.now()}`,
                            paymentId: payment.id,
                            amount: payment.value,
                            reason: 'Payment refunded by Asaas',
                            refundDate: new Date(),
                            estimatedDays: 5
                        }
                    )

                    if (!result.success) {
                        logger.warn(LogCategory.WEBHOOK, 'Refund confirmation email failed', {
                            paymentId: payment.id,
                            error: result.error
                        })
                    } else {
                        logger.info(LogCategory.WEBHOOK, 'Refund confirmation email sent', {
                            paymentId: payment.id
                        })
                    }
                } else {
                    logger.warn(LogCategory.WEBHOOK, 'User not found for refund confirmation email', {
                        paymentId: payment.id,
                        asaasCustomerId: payment.customer
                    })
                }
            } else {
                logger.warn(LogCategory.WEBHOOK, 'Subscription not found for refunded payment', {
                    paymentId: payment.id,
                    asaasSubscriptionId: payment.subscription
                })
            }
        }

    } catch (error) {
        logger.error(LogCategory.WEBHOOK, 'Error handling payment refunded', error as Error, {
            paymentId: payment.id
        })
        throw error
    }
}

export async function POST(request: NextRequest) {
    try {
        const asaasToken = request.headers.get('asaas-access-token')
        const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN

        if (expectedToken && asaasToken !== expectedToken) {
            logger.logSecurity('webhook_auth_failed', {
                source: 'asaas',
                reason: 'invalid_token'
            })
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body: AsaasWebhookEvent = await request.json()

        logger.info(LogCategory.WEBHOOK, `Webhook received: ${body.event}`, {
            event: body.event,
            paymentId: body.payment?.id
        })

        if (!body.event || !body.payment) {
            logger.warn(LogCategory.WEBHOOK, 'Invalid webhook payload received', {
                hasEvent: !!body.event,
                hasPayment: !!body.payment
            })
            return NextResponse.json(
                { error: 'Invalid webhook payload' },
                { status: 400 }
            )
        }

        switch (body.event) {
            case 'PAYMENT_CREATED':
                await handlePaymentCreated(body.payment)
                break

            case 'PAYMENT_UPDATED':
                logger.info(LogCategory.WEBHOOK, 'Payment updated', { paymentId: body.payment.id })
                break

            case 'PAYMENT_CONFIRMED':
            case 'PAYMENT_RECEIVED':
                await handlePaymentConfirmed(body.payment)
                await handlePaymentReceived(body.payment)
                break

            case 'PAYMENT_OVERDUE':
                await handlePaymentOverdue(body.payment)
                break

            case 'PAYMENT_DELETED':
                logger.info(LogCategory.WEBHOOK, 'Payment deleted', { paymentId: body.payment.id })
                break

            case 'PAYMENT_RESTORED':
                logger.info(LogCategory.WEBHOOK, 'Payment restored', { paymentId: body.payment.id })
                break

            case 'PAYMENT_REFUNDED':
                await handlePaymentRefunded(body.payment)
                break

            case 'PAYMENT_RECEIVED_IN_CASH_UNDONE':
                logger.info(LogCategory.WEBHOOK, 'Payment cash undone', { paymentId: body.payment.id })
                break

            case 'PAYMENT_CHARGEBACK_REQUESTED':
                logger.warn(LogCategory.WEBHOOK, 'Chargeback requested', { paymentId: body.payment.id })
                break

            case 'PAYMENT_CHARGEBACK_DISPUTE':
                logger.warn(LogCategory.WEBHOOK, 'Chargeback dispute', { paymentId: body.payment.id })
                break

            case 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL':
                logger.info(LogCategory.WEBHOOK, 'Awaiting chargeback reversal', { paymentId: body.payment.id })
                break

            case 'PAYMENT_DUNNING_RECEIVED':
                logger.info(LogCategory.WEBHOOK, 'Dunning received', { paymentId: body.payment.id })
                break

            case 'PAYMENT_DUNNING_REQUESTED':
                logger.info(LogCategory.WEBHOOK, 'Dunning requested', { paymentId: body.payment.id })
                break

            case 'PAYMENT_BANK_SLIP_VIEWED':
                logger.debug(LogCategory.WEBHOOK, 'Bank slip viewed', { paymentId: body.payment.id })
                break

            case 'PAYMENT_CHECKOUT_VIEWED':
                logger.debug(LogCategory.WEBHOOK, 'Checkout viewed', { paymentId: body.payment.id })
                break

            default:
                logger.warn(LogCategory.WEBHOOK, 'Unknown webhook event received', {
                    event: body.event,
                    paymentId: body.payment.id
                })
        }

        return NextResponse.json({ received: true }, { status: 200 })
    } catch (error: any) {
        logger.error(LogCategory.WEBHOOK, 'Error processing webhook', error, {
            errorMessage: error.message
        })

        logWebhookEvent({
            eventType: 'WEBHOOK_ERROR',
            timestamp: new Date().toISOString(),
            status: 'error',
            error: error.message,
            details: error,
        })

        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        )
    }
}
