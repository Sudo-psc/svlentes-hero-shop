import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAsaasClient } from '@/lib/asaas'
import { NotificationService } from '@/lib/notifications-advanced'
import { saveHistoryWithBackup } from '@/lib/history-redundancy'
import { z } from 'zod'
const paymentMethodSchema = z.object({
  billingType: z.enum(['CREDIT_CARD', 'BOLETO', 'PIX']),
  // For credit card updates
  creditCard: z.object({
    holderName: z.string().min(3),
    number: z.string().regex(/^\d{13,19}$/),
    expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/),
    expiryYear: z.string().regex(/^\d{4}$/),
    ccv: z.string().regex(/^\d{3,4}$/)
  }).optional(),
  // For credit card holder info
  creditCardHolderInfo: z.object({
    name: z.string().min(3),
    email: z.string().email(),
    cpfCnpj: z.string().regex(/^\d{11}$|^\d{14}$/),
    postalCode: z.string().regex(/^\d{5}-?\d{3}$/),
    addressNumber: z.string().min(1),
    phone: z.string().regex(/^\d{10,11}$/)
  }).optional()
})
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }
    const body = await req.json()
    const paymentData = paymentMethodSchema.parse(body)
    // Find user by database ID or Firebase UID
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        asaasCustomerId: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
    if (!user) {
      user = await prisma.user.findUnique({
        where: { firebaseUid: userId },
        select: {
          id: true,
          email: true,
          asaasCustomerId: true,
          subscriptions: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })
    }
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    if (user.subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma assinatura ativa encontrada' },
        { status: 404 }
      )
    }
    const subscription = user.subscriptions[0]
    if (!subscription.asaasSubscriptionId) {
      return NextResponse.json(
        { error: 'Assinatura não está vinculada ao Asaas' },
        { status: 400 }
      )
    }
    const asaas = getAsaasClient()
    // Prepare update data for Asaas
    const updateData: any = {
      billingType: paymentData.billingType
    }
    // If updating to credit card, include card details
    if (paymentData.billingType === 'CREDIT_CARD' && paymentData.creditCard && paymentData.creditCardHolderInfo) {
      updateData.creditCard = {
        holderName: paymentData.creditCard.holderName,
        number: paymentData.creditCard.number,
        expiryMonth: paymentData.creditCard.expiryMonth,
        expiryYear: paymentData.creditCard.expiryYear,
        ccv: paymentData.creditCard.ccv
      }
      updateData.creditCardHolderInfo = {
        name: paymentData.creditCardHolderInfo.name,
        email: paymentData.creditCardHolderInfo.email,
        cpfCnpj: paymentData.creditCardHolderInfo.cpfCnpj,
        postalCode: paymentData.creditCardHolderInfo.postalCode.replace('-', ''),
        addressNumber: paymentData.creditCardHolderInfo.addressNumber,
        phone: paymentData.creditCardHolderInfo.phone
      }
    }
    // Update subscription payment method in Asaas
    await asaas.updateSubscription(subscription.asaasSubscriptionId, updateData)
    // Extract last 4 digits if credit card
    let last4: string | null = null
    if (paymentData.billingType === 'CREDIT_CARD' && paymentData.creditCard) {
      last4 = paymentData.creditCard.number.slice(-4)
    }
    // Map billing type to PaymentMethod enum
    const paymentMethodMap: Record<string, any> = {
      'CREDIT_CARD': 'CREDIT_CARD',
      'BOLETO': 'BOLETO',
      'PIX': 'PIX'
    }
    // Store old payment method for history
    const oldPaymentMethod = {
      type: subscription.paymentMethod,
      last4: subscription.paymentMethodLast4
    }
    // Update subscription in database
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        paymentMethod: paymentMethodMap[paymentData.billingType],
        paymentMethodLast4: last4
      },
      select: {
        id: true,
        paymentMethod: true,
        paymentMethodLast4: true
      }
    })
    // Format payment method names for display
    const paymentMethodNames: Record<string, string> = {
      'CREDIT_CARD': 'Cartão de Crédito',
      'DEBIT_CARD': 'Cartão de Débito',
      'BOLETO': 'Boleto Bancário',
      'PIX': 'PIX'
    }
    // Register change in history with redundancy backup
    await saveHistoryWithBackup({
      subscriptionId: subscription.id,
      userId: user.id,
      changeType: 'PAYMENT_METHOD_UPDATE',
      description: `Forma de pagamento alterada de "${paymentMethodNames[oldPaymentMethod.type]}"${oldPaymentMethod.last4 ? ` (final ${oldPaymentMethod.last4})` : ''} para "${paymentMethodNames[paymentData.billingType]}"${last4 ? ` (final ${last4})` : ''}`,
      oldValue: oldPaymentMethod,
      newValue: {
        type: paymentData.billingType,
        last4: last4
      },
      metadata: {
        isCardUpdate: paymentData.billingType === 'CREDIT_CARD' && !!last4
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined
    })
    // Send notifications with advanced service (async, don't wait)
    NotificationService.send({
      userId: user.id,
      eventType: 'payment_method_update',
      subject: 'Forma de Pagamento Atualizada',
      message: `Sua forma de pagamento foi atualizada com sucesso.\n\nNova forma de pagamento: ${paymentMethodNames[paymentData.billingType]}${last4 ? `\nFinal do cartão: •••• ${last4}` : ''}\n\nAs próximas cobranças serão realizadas através desta forma de pagamento.`,
      priority: 'medium',
      metadata: {
        oldMethod: paymentMethodNames[oldPaymentMethod.type],
        newMethod: paymentMethodNames[paymentData.billingType],
        last4: last4
      }
    }).catch(err => console.error('Error sending notifications:', err))
    return NextResponse.json({
      success: true,
      paymentMethod: {
        type: updatedSubscription.paymentMethod,
        last4: updatedSubscription.paymentMethodLast4
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating payment method:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar forma de pagamento. Tente novamente mais tarde.' },
      { status: 500 }
    )
  }
}