import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asaas } from '@/lib/asaas'
import { pricingPlans } from '@/data/pricing-plans'

// Schema para validação dos dados do checkout
const checkoutRequestSchema = z.object({
    planId: z.enum(['basic', 'premium', 'vip'], {
        errorMap: () => ({ message: 'Plano inválido' })
    }),
    billingInterval: z.enum(['monthly', 'annual'], {
        errorMap: () => ({ message: 'Intervalo de cobrança inválido' })
    }),
    billingType: z.enum(['BOLETO', 'CREDIT_CARD', 'PIX'], {
        errorMap: () => ({ message: 'Tipo de pagamento inválido' })
    }).default('PIX'),
    customerData: z.object({
        name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
        email: z.string().email('Email inválido'),
        phone: z.string().min(10, 'Telefone inválido'),
        cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido'),
        address: z.object({
            street: z.string().min(3, 'Endereço inválido'),
            number: z.string().min(1, 'Número inválido'),
            complement: z.string().optional(),
            neighborhood: z.string().min(2, 'Bairro inválido'),
            postalCode: z.string().min(8, 'CEP inválido'),
            city: z.string().min(2, 'Cidade inválida'),
            state: z.string().length(2, 'Estado inválido'),
        }).optional(),
    }),
    metadata: z.record(z.string()).optional(),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validar dados de entrada
        const validatedData = checkoutRequestSchema.parse(body)

        const { planId, billingInterval, billingType, customerData, metadata = {} } = validatedData

        // Encontrar o plano selecionado
        const selectedPlan = pricingPlans.find(plan => plan.id === planId)
        if (!selectedPlan) {
            return NextResponse.json(
                { error: 'Plano não encontrado' },
                { status: 400 }
            )
        }

        // Calcular o valor baseado no intervalo
        const planValue = billingInterval === 'annual'
            ? selectedPlan.priceAnnual
            : selectedPlan.priceMonthly

        // 1. Criar ou atualizar cliente no Asaas
        let customer

        // Verificar se cliente já existe
        const existingCustomers = await asaas.listCustomers({
            email: customerData.email,
            limit: 1,
        })

        if (existingCustomers.data && existingCustomers.data.length > 0) {
            // Atualizar cliente existente
            customer = await asaas.updateCustomer(existingCustomers.data[0].id, {
                name: customerData.name,
                mobilePhone: customerData.phone,
                ...(customerData.address && {
                    address: customerData.address.street,
                    addressNumber: customerData.address.number,
                    complement: customerData.address.complement,
                    province: customerData.address.neighborhood,
                    postalCode: customerData.address.postalCode.replace(/\D/g, ''),
                }),
            })
        } else {
            // Criar novo cliente
            customer = await asaas.createCustomer({
                name: customerData.name,
                cpfCnpj: customerData.cpfCnpj.replace(/\D/g, ''),
                email: customerData.email,
                mobilePhone: customerData.phone.replace(/\D/g, ''),
                ...(customerData.address && {
                    address: customerData.address.street,
                    addressNumber: customerData.address.number,
                    complement: customerData.address.complement,
                    province: customerData.address.neighborhood,
                    postalCode: customerData.address.postalCode.replace(/\D/g, ''),
                }),
                externalReference: `plan_${planId}_email_${customerData.email}`,
            })
        }

        // 2. Calcular próxima data de vencimento (7 dias a partir de hoje)
        const nextDueDate = new Date()
        nextDueDate.setDate(nextDueDate.getDate() + 7)
        const nextDueDateStr = nextDueDate.toISOString().split('T')[0]

        // 3. Determinar ciclo de cobrança
        const cycle = billingInterval === 'annual' ? 'YEARLY' : 'MONTHLY'

        // 4. Criar assinatura no Asaas
        const subscription = await asaas.createSubscription({
            customer: customer.id,
            billingType,
            value: planValue,
            nextDueDate: nextDueDateStr,
            cycle,
            description: `Assinatura ${selectedPlan.name} - SV Lentes`,
            externalReference: `plan_${planId}_${metadata.source || 'web'}`,
        })

        // 5. Buscar primeira cobrança gerada
        const payments = await asaas.listPayments({
            subscription: subscription.id,
            limit: 1,
        })

        const firstPayment = payments.data && payments.data.length > 0 ? payments.data[0] : null

        // 6. Se for PIX, buscar QR Code
        let pixData = null
        if (billingType === 'PIX' && firstPayment) {
            try {
                pixData = await asaas.getPixQrCode(firstPayment.id)
            } catch (error) {
                console.error('Erro ao buscar QR Code PIX:', error)
            }
        }

        // Log da criação para analytics
        console.log('Checkout Asaas created:', {
            customerId: customer.id,
            subscriptionId: subscription.id,
            paymentId: firstPayment?.id,
            planId,
            billingInterval,
            billingType,
            amount: planValue,
        })

        return NextResponse.json({
            success: true,
            customer: {
                id: customer.id,
                email: customer.email,
                name: customer.name,
            },
            subscription: {
                id: subscription.id,
                status: subscription.status,
                nextDueDate: subscription.nextDueDate,
                value: subscription.value,
            },
            payment: firstPayment ? {
                id: firstPayment.id,
                status: firstPayment.status,
                dueDate: firstPayment.dueDate,
                value: firstPayment.value,
                invoiceUrl: firstPayment.invoiceUrl,
                bankSlipUrl: firstPayment.bankSlipUrl,
                ...(pixData && {
                    pix: {
                        qrCode: pixData.encodedImage,
                        payload: pixData.payload,
                        expirationDate: pixData.expirationDate,
                    }
                }),
            } : null,
            plan: {
                id: planId,
                name: selectedPlan.name,
                billingInterval,
                amount: planValue,
            }
        })

    } catch (error) {
        console.error('Erro ao criar checkout Asaas:', error)

        // Tratar erros de validação
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: 'Dados inválidos',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                },
                { status: 400 }
            )
        }

        // Tratar erros da API Asaas
        if (error instanceof Error && error.message.includes('Asaas')) {
            return NextResponse.json(
                { error: 'Erro no processamento do pagamento. Tente novamente.' },
                { status: 500 }
            )
        }

        // Erro genérico
        return NextResponse.json(
            { error: 'Erro interno do servidor. Tente novamente.' },
            { status: 500 }
        )
    }
}

// Endpoint GET para obter informações dos planos disponíveis
export async function GET() {
    try {
        // Retornar informações dos planos para o frontend
        const plansInfo = pricingPlans.map(plan => ({
            id: plan.id,
            name: plan.name,
            priceMonthly: plan.priceMonthly,
            priceAnnual: plan.priceAnnual,
            features: plan.features,
            recommended: plan.recommended,
            ctaText: plan.ctaText,
        }))

        return NextResponse.json({
            plans: plansInfo,
            currency: 'BRL',
            locale: 'pt-BR',
        })

    } catch (error) {
        console.error('Erro ao obter informações dos planos:', error)
        return NextResponse.json(
            { error: 'Erro ao carregar informações dos planos' },
            { status: 500 }
        )
    }
}