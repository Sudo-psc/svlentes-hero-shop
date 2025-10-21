import { NextRequest, NextResponse } from 'next/server'
import { logger, LogCategory } from '@/lib/logger'
import { svlentesRateLimits } from '@/lib/rate-limiting-enhanced'
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
    logger.logWebhook(log.eventType, {
        paymentId: log.paymentId,
        customerId: log.customerId,
        subscriptionId: log.subscriptionId,
        statusCode: log.status === 'success' ? 200 : 500,
        ...log.details
    })
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
    } catch (error) {
        logger.error(LogCategory.WEBHOOK, 'Error handling payment created', error as Error, {
            paymentId: payment.id,
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
        logger.info(LogCategory.WEBHOOK, 'Payment received - conversion event', {
            event: 'payment_confirmed',
            paymentId: payment.id,
            customerId: payment.customer,
            value: payment.value,
            currency: 'BRL',
            externalReference: payment.externalReference,
        })
    } catch (error) {
        logger.error(LogCategory.WEBHOOK, 'Error handling payment received', error as Error, {
            paymentId: payment.id,
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
        logger.info(LogCategory.WEBHOOK, 'Payment confirmed', {
            paymentId: payment.id,
            customer: payment.customer,
            value: payment.value,
        })
    } catch (error) {
        logger.error(LogCategory.WEBHOOK, 'Error handling payment confirmed', error as Error, {
            paymentId: payment.id,
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
        logger.warn(LogCategory.WEBHOOK, 'Payment overdue', {
            paymentId: payment.id,
            customer: payment.customer,
            dueDate: payment.dueDate,
        })
    } catch (error) {
        logger.error(LogCategory.WEBHOOK, 'Error handling payment overdue', error as Error, {
            paymentId: payment.id,
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
        logger.info(LogCategory.WEBHOOK, 'Payment refunded', {
            paymentId: payment.id,
            customer: payment.customer,
            value: payment.value,
        })
    } catch (error) {
        logger.error(LogCategory.WEBHOOK, 'Error handling payment refunded', error as Error, {
            paymentId: payment.id,
        })
        throw error
    }
}
// 🚀 Quick Win: Handler principal com rate limiting
async function handleAsaasWebhook(request: NextRequest): Promise<NextResponse> {
    try {
        const asaasToken = request.headers.get('asaas-access-token')
        const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN
        if (expectedToken && asaasToken !== expectedToken) {
            logger.warn(LogCategory.WEBHOOK, 'ASAAS webhook authentication failed', {
                reason: 'Invalid token',
            })
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }
        const body: AsaasWebhookEvent = await request.json()
        if (!body.event || !body.payment) {
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
                break
            case 'PAYMENT_RESTORED':
                break
            case 'PAYMENT_REFUNDED':
                await handlePaymentRefunded(body.payment)
                break
            case 'PAYMENT_RECEIVED_IN_CASH_UNDONE':
                break
            case 'PAYMENT_CHARGEBACK_REQUESTED':
                break
            case 'PAYMENT_CHARGEBACK_DISPUTE':
                break
            case 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL':
                break
            case 'PAYMENT_DUNNING_RECEIVED':
                break
            case 'PAYMENT_DUNNING_REQUESTED':
                break
            case 'PAYMENT_BANK_SLIP_VIEWED':
                break
            case 'PAYMENT_CHECKOUT_VIEWED':
                break
            default:
        }
        return NextResponse.json({ received: true }, { status: 200 })
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error(LogCategory.WEBHOOK, 'Error processing ASAAS webhook', error as Error)
        logWebhookEvent({
            eventType: 'WEBHOOK_ERROR',
            timestamp: new Date().toISOString(),
            status: 'error',
            error: errorMessage,
            details: error,
        })
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        )
    }
}

// 🚀 Quick Win: Nova função POST com rate limiting
export const POST = svlentesRateLimits.asaasWebhook(handleAsaasWebhook);