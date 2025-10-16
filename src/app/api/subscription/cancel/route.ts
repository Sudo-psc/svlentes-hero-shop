import { NextRequest, NextResponse } from 'next/server'
import { AirtableSubscriptionService } from '@/lib/airtable'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const userId = token // Simplificado

    const body = await request.json()
    const { subscriptionId, reason, effectiveDate } = body

    if (!subscriptionId || !reason) {
      return NextResponse.json(
        { error: 'ID da assinatura e motivo são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se a assinatura pertence ao usuário
    const existingSubscription = await AirtableSubscriptionService.getSubscriptionById(subscriptionId)
    if (!existingSubscription || existingSubscription.userId !== userId) {
      return NextResponse.json(
        { error: 'Assinatura não encontrada ou não pertence ao usuário' },
        { status: 404 }
      )
    }

    if (existingSubscription.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Assinatura já está cancelada' },
        { status: 400 }
      )
    }

    // Cancelar assinatura
    const cancelledSubscription = await AirtableSubscriptionService.cancelSubscription(
      subscriptionId,
      reason,
      effectiveDate ? new Date(effectiveDate) : undefined
    )

    // Enviar notificação por email (implementar)
    // await sendCancellationEmail(existingSubscription, reason)

    return NextResponse.json({
      message: 'Assinatura cancelada com sucesso',
      subscription: cancelledSubscription,
      effectiveDate: cancelledSubscription.endDate
    })

  } catch (error: any) {
    console.error('Erro ao cancelar assinatura:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao cancelar assinatura' },
      { status: 500 }
    )
  }
}