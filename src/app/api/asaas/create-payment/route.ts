import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asaas } from '@/lib/asaas'
import { pricingPlans } from '@/data/pricing-plans'
// Prevent this route from being evaluated at build time
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const paymentRequestSchema = z.object({
    planId: z.enum(['basic', 'premium', 'vip'], {
        errorMap: () => ({ message: 'Plano inválido' })
    }),
    billingInterval: z.enum(['monthly', 'annual'], {
        errorMap: () => ({ message: 'Intervalo de cobrança inválido' })
    }),
    billingType: z.enum(['BOLETO', 'CREDIT_CARD', 'PIX'], {
        errorMap: () => ({ message: 'Tipo de cobrança inválido' })
    }),
    customerData: z.object({
        name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
        email: z.string().email('Email inválido'),
        phone: z.string().optional(),
        cpfCnpj: z.string().optional(),
    }),
    metadata: z.record(z.string()).optional(),
})
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = paymentRequestSchema.parse(body)
        const { planId, billingInterval, billingType, customerData, metadata = {} } = validatedData
        const selectedPlan = pricingPlans.find(plan => plan.id === planId)
        if (!selectedPlan) {
            return NextResponse.json(
                { error: 'Plano não encontrado' },
                { status: 400 }
            )
        }
        let customer
        try {
            customer = await asaas.createCustomer({
                name: customerData.name,
                email: customerData.email,
                phone: customerData.phone,
                mobilePhone: customerData.phone,
                cpfCnpj: customerData.cpfCnpj,
                externalReference: metadata.externalReference || `customer_${Date.now()}`,
                notificationDisabled: false,
            })
        } catch (error: unknown) {
            console.error('Error creating ASAAS customer:', error)
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
            return NextResponse.json(
                {
                    error: 'Erro ao criar cliente',
                    details: errorMessage
                },
                { status: 500 }
            )
        }
        const amount = billingInterval === 'monthly' 
            ? selectedPlan.priceMonthly 
            : selectedPlan.priceAnnual / 12
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 7)
        const dueDateStr = dueDate.toISOString().split('T')[0]
        let payment
        let subscription
        if (billingInterval === 'monthly') {
            try {
                subscription = await asaas.createSubscription({
                    customer: customer.id,
                    billingType: billingType,
                    value: amount,
                    nextDueDate: dueDateStr,
                    cycle: 'MONTHLY',
                    description: `Assinatura ${selectedPlan.name} - SV Lentes`,
                    externalReference: `subscription_${planId}_${Date.now()}`,
                })
                return NextResponse.json({
                    success: true,
                    subscriptionId: subscription.id,
                    customerId: customer.id,
                    invoiceUrl: subscription.invoiceUrl,
                    amount: amount,
                    dueDate: dueDateStr,
                    billingType: billingType,
                })
            } catch (error: unknown) {
                console.error('Error creating ASAAS subscription:', error)
                const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
                return NextResponse.json(
                    {
                        error: 'Erro ao criar assinatura',
                        details: errorMessage
                    },
                    { status: 500 }
                )
            }
        } else {
            try {
                payment = await asaas.createPayment({
                    customer: customer.id,
                    billingType: billingType,
                    value: selectedPlan.priceAnnual,
                    dueDate: dueDateStr,
                    description: `Assinatura Anual ${selectedPlan.name} - SV Lentes`,
                    externalReference: `payment_${planId}_annual_${Date.now()}`,
                })
                let pixQrCode
                if (billingType === 'PIX') {
                    try {
                        pixQrCode = await asaas.getPixQrCode(payment.id)
                    } catch (error) {
                        console.error('Error getting PIX QR code:', error)
                    }
                }
                return NextResponse.json({
                    success: true,
                    paymentId: payment.id,
                    customerId: customer.id,
                    invoiceUrl: payment.invoiceUrl,
                    bankSlipUrl: payment.bankSlipUrl,
                    amount: selectedPlan.priceAnnual,
                    dueDate: dueDateStr,
                    billingType: billingType,
                    pixQrCode: pixQrCode,
                })
            } catch (error: unknown) {
                console.error('Error creating ASAAS payment:', error)
                const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
                return NextResponse.json(
                    {
                        error: 'Erro ao criar pagamento',
                        details: errorMessage
                    },
                    { status: 500 }
                )
            }
        }
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: 'Dados inválidos',
                    details: error.errors
                },
                { status: 400 }
            )
        }
        console.error('Unexpected error in create-payment route:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        return NextResponse.json(
            {
                error: 'Erro interno do servidor',
                details: errorMessage
            },
            { status: 500 }
        )
    }
}