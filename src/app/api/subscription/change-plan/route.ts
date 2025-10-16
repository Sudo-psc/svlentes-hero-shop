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
    const { subscriptionId, newPlan, effectiveDate, reason } = body

    if (!subscriptionId || !newPlan) {
      return NextResponse.json(
        { error: 'ID da assinatura e novo plano são obrigatórios' },
        { status: 400 }
      )
    }

    if (!['monthly', 'annual'].includes(newPlan)) {
      return NextResponse.json(
        { error: 'Plano inválido. Deve ser "monthly" ou "annual"' },
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

    if (existingSubscription.plan === newPlan) {
      return NextResponse.json(
        { error: 'O plano selecionado é o mesmo do atual' },
        { status: 400 }
      )
    }

    if (existingSubscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Apenas assinaturas ativas podem ter o plano alterado' },
        { status: 400 }
      )
    }

    // Calcular novo preço com base no plano
    let newMonthlyPrice = existingSubscription.monthlyPrice

    if (newPlan === 'annual') {
      // Aplicar desconto de 20% para plano anual
      newMonthlyPrice = existingSubscription.monthlyPrice * 0.8
    } else {
      // Remover desconto do plano anual
      newMonthlyPrice = existingSubscription.monthlyPrice / 0.8
    }

    // Determinar data efetiva
    let changeDate: Date
    let nextBillingDate: string

    if (effectiveDate === 'immediate') {
      changeDate = new Date()
      nextBillingDate = new Date(changeDate)
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
    } else {
      // Próximo ciclo de cobrança
      changeDate = new Date(existingSubscription.nextBillingDate)
      nextBillingDate = new Date(changeDate)
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
    }

    // Atualizar assinatura
    const updatedSubscription = await AirtableSubscriptionService.updateSubscription(subscriptionId, {
      plan: newPlan,
      monthlyPrice: Math.round(newMonthlyPrice * 100) / 100, // Arredondar para 2 casas decimais
      nextBillingDate: nextBillingDate.toISOString(),
      metadata: {
        ...existingSubscription.metadata,
        planChange: {
          previousPlan: existingSubscription.plan,
          newPlan,
          changeDate: changeDate.toISOString(),
          effectiveDate: effectiveDate,
          reason: reason || ''
        }
      }
    })

    // Enviar notificação por email (implementar)
    // await sendPlanChangeEmail(updatedSubscription, reason)

    return NextResponse.json({
      message: `Plano alterado com sucesso para ${newPlan === 'annual' ? 'Anual' : 'Mensal'}`,
      subscription: updatedSubscription,
      planChange: {
        previousPlan: existingSubscription.plan,
        newPlan,
        effectiveDate: effectiveDate === 'immediate' ? 'Imediata' : `Próxima cobrança (${new Date(existingSubscription.nextBillingDate).toLocaleDateString('pt-BR')})`,
        newMonthlyPrice,
        savings: newPlan === 'annual' ? existingSubscription.monthlyPrice - newMonthlyPrice : 0
      }
    })

  } catch (error: any) {
    console.error('Erro ao alterar plano:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao alterar plano' },
      { status: 500 }
    )
  }
}