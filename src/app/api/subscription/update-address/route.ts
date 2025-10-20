import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAsaasClient } from '@/lib/asaas'
import { NotificationService } from '@/lib/notifications-advanced'
import { saveHistoryWithBackup } from '@/lib/history-redundancy'
import { z } from 'zod'
const addressSchema = z.object({
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  street: z.string().min(3, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 letras')
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
    const addressData = addressSchema.parse(body)
    // Find user by database ID or Firebase UID
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
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
    // Update customer address in Asaas if customer exists
    if (user.asaasCustomerId) {
      const asaas = getAsaasClient()
      await asaas.updateCustomer(user.asaasCustomerId, {
        postalCode: addressData.zipCode.replace('-', ''),
        address: addressData.street,
        addressNumber: addressData.number,
        complement: addressData.complement,
        province: addressData.neighborhood
      })
    }
    // Store old address for history
    const oldAddress = subscription.shippingAddress as any
    // Update subscription shipping address in database
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        shippingAddress: addressData
      },
      select: {
        id: true,
        shippingAddress: true
      }
    })
    // Register change in history with redundancy backup
    await saveHistoryWithBackup({
      subscriptionId: subscription.id,
      userId: user.id,
      changeType: 'ADDRESS_UPDATE',
      description: oldAddress
        ? `Endereço atualizado de "${oldAddress.street}, ${oldAddress.number}" para "${addressData.street}, ${addressData.number}"`
        : `Endereço cadastrado: "${addressData.street}, ${addressData.number}, ${addressData.city}/${addressData.state}"`,
      oldValue: oldAddress || undefined,
      newValue: addressData,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined
    })
    // Send notifications with advanced service (async, don't wait)
    NotificationService.send({
      userId: user.id,
      eventType: 'address_update',
      subject: 'Endereço de Entrega Atualizado',
      message: `Seu endereço de entrega foi atualizado com sucesso.\n\nNovo endereço:\n${addressData.street}, ${addressData.number}${addressData.complement ? ` - ${addressData.complement}` : ''}\n${addressData.neighborhood}\n${addressData.city}/${addressData.state}\nCEP: ${addressData.zipCode}\n\nSuas próximas entregas serão enviadas para este endereço.`,
      priority: 'medium',
      metadata: {
        oldAddress: oldAddress,
        newAddress: addressData
      }
    }).catch(err => console.error('Error sending notifications:', err))
    return NextResponse.json({
      success: true,
      address: updatedSubscription.shippingAddress
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating address:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar endereço. Tente novamente mais tarde.' },
      { status: 500 }
    )
  }
}