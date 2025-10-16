import { NextRequest, NextResponse } from 'next/server'
import { AirtableSubscriptionService } from '@/lib/airtable'
import {
  Subscription,
  SubscriptionUpdateData
} from '@/types/subscription'

// GET - Buscar assinatura do usuário logado
export async function GET(request: NextRequest) {
  try {
    // Obter token de autenticação do header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autorizado - Token ausente' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]

    // Verificar token Firebase (implementar validação real)
    // Por enquanto, vamos simular a validação
    const userId = token // Simplificado - implementar verificação real

    if (!userId) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Buscar assinatura do usuário
    const subscription = await AirtableSubscriptionService.getSubscriptionByUserId(userId)

    if (!subscription) {
      return NextResponse.json(
        { error: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ subscription })
  } catch (error: any) {
    console.error('Erro ao buscar assinatura:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova assinatura
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

    // Validar dados obrigatórios
    const requiredFields = ['plan', 'lensType', 'bothEyes', 'monthlyPrice', 'paymentMethod', 'deliveryAddress', 'contactInfo']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo obrigatório ausente: ${field}` },
          { status: 400 }
        )
      }
    }

    // Criar objeto de assinatura
    const subscriptionData = {
      userId,
      email: body.email,
      displayName: body.displayName,
      plan: body.plan,
      status: 'active' as const,
      lensType: body.lensType,
      bothEyes: body.bothEyes,
      differentGrades: body.differentGrades || false,
      monthlyPrice: body.monthlyPrice,
      nextBillingDate: body.nextBillingDate,
      startDate: body.startDate || new Date().toISOString(),
      paymentMethod: body.paymentMethod,
      deliveryAddress: body.deliveryAddress,
      contactInfo: body.contactInfo,
      metadata: body.metadata
    }

    const subscription = await AirtableSubscriptionService.createSubscription(subscriptionData)

    return NextResponse.json({
      message: 'Assinatura criada com sucesso',
      subscription
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erro ao criar assinatura:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar assinatura' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar assinatura existente
export async function PUT(request: NextRequest) {
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
    const { subscriptionId, updates } = body

    if (!subscriptionId || !updates) {
      return NextResponse.json(
        { error: 'ID da assinatura e atualizações são obrigatórios' },
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

    const updatedSubscription = await AirtableSubscriptionService.updateSubscription(subscriptionId, updates)

    return NextResponse.json({
      message: 'Assinatura atualizada com sucesso',
      subscription: updatedSubscription
    })

  } catch (error: any) {
    console.error('Erro ao atualizar assinatura:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar assinatura' },
      { status: 500 }
    )
  }
}