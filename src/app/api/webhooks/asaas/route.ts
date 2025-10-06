import { NextRequest, NextResponse } from 'next/server'

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
    const logEntry = {
        ...log,
        timestamp: new Date().toISOString(),
        source: 'asaas_webhook'
    }

    console.log('ASAAS_WEBHOOK_EVENT:', JSON.stringify(logEntry))
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

        console.log('PAYMENT_CREATED:', {
            paymentId: payment.id,
            customer: payment.customer,
            value: payment.value,
            billingType: payment.billingType,
        })
    } catch (error) {
        console.error('Error handling payment created:', error)
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

        console.log('CONVERSION_EVENT:', {
            event: 'payment_confirmed',
            paymentId: payment.id,
            customerId: payment.customer,
            value: payment.value,
            currency: 'BRL',
            externalReference: payment.externalReference,
        })

    } catch (error) {
        console.error('Error handling payment received:', error)
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

        console.log('PAYMENT_CONFIRMED:', {
            paymentId: payment.id,
            customer: payment.customer,
            value: payment.value,
        })
    } catch (error) {
        console.error('Error handling payment confirmed:', error)
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

        console.log('PAYMENT_OVERDUE:', {
            paymentId: payment.id,
            customer: payment.customer,
            dueDate: payment.dueDate,
        })

    } catch (error) {
        console.error('Error handling payment overdue:', error)
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

        console.log('PAYMENT_REFUNDED:', {
            paymentId: payment.id,
            customer: payment.customer,
            value: payment.value,
        })
    } catch (error) {
        console.error('Error handling payment refunded:', error)
        throw error
    }
}

export async function POST(request: NextRequest) {
    try {
        const asaasToken = request.headers.get('asaas-access-token')
        const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN
        
        if (expectedToken && asaasToken !== expectedToken) {
            console.error('ASAAS_WEBHOOK_AUTH_FAILED: Invalid token')
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body: AsaasWebhookEvent = await request.json()

        console.log(`ASAAS_WEBHOOK_RECEIVED: ${body.event}`)

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
                console.log('PAYMENT_UPDATED:', body.payment.id)
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
                console.log('PAYMENT_DELETED:', body.payment.id)
                break

            case 'PAYMENT_RESTORED':
                console.log('PAYMENT_RESTORED:', body.payment.id)
                break

            case 'PAYMENT_REFUNDED':
                await handlePaymentRefunded(body.payment)
                break

            case 'PAYMENT_RECEIVED_IN_CASH_UNDONE':
                console.log('PAYMENT_RECEIVED_IN_CASH_UNDONE:', body.payment.id)
                break

            case 'PAYMENT_CHARGEBACK_REQUESTED':
                console.log('PAYMENT_CHARGEBACK_REQUESTED:', body.payment.id)
                break

            case 'PAYMENT_CHARGEBACK_DISPUTE':
                console.log('PAYMENT_CHARGEBACK_DISPUTE:', body.payment.id)
                break

            case 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL':
                console.log('PAYMENT_AWAITING_CHARGEBACK_REVERSAL:', body.payment.id)
                break

            case 'PAYMENT_DUNNING_RECEIVED':
                console.log('PAYMENT_DUNNING_RECEIVED:', body.payment.id)
                break

            case 'PAYMENT_DUNNING_REQUESTED':
                console.log('PAYMENT_DUNNING_REQUESTED:', body.payment.id)
                break

            case 'PAYMENT_BANK_SLIP_VIEWED':
                console.log('PAYMENT_BANK_SLIP_VIEWED:', body.payment.id)
                break

            case 'PAYMENT_CHECKOUT_VIEWED':
                console.log('PAYMENT_CHECKOUT_VIEWED:', body.payment.id)
                break

            default:
                console.log('Unknown webhook event:', body.event)
        }

        return NextResponse.json({ received: true }, { status: 200 })
    } catch (error: any) {
        console.error('Error processing ASAAS webhook:', error)

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
