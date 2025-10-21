import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAsaasClient } from '@/lib/asaas'
import { NotificationService } from '@/lib/notifications-advanced'
import { saveHistoryWithBackup } from '@/lib/history-redundancy'
import { z } from 'zod'
const changePlanSchema = z.object({
  newPlanId: z.string().min(1, 'ID do plano é obrigatório')
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
    const { newPlanId } = changePlanSchema.parse(body)
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
    // Load pricing plans to get new plan details
    const { getPricingPlans } = await import('@/data/pricing-plans')
    const plans = getPricingPlans()
    const newPlan = plans.find(p => p.id === newPlanId)
    if (!newPlan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }
    // Update subscription in Asaas
    const asaas = getAsaasClient()
    await asaas.updateSubscription(subscription.asaasSubscriptionId, {
      value: newPlan.priceMonthly,
      description: `Assinatura ${newPlan.name} - ${user.email}`
    })
    // Store old values for history
    const oldPlan = {
      planType: subscription.planType,
      monthlyValue: subscription.monthlyValue.toString()
    }
    // Update subscription in database
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planType: newPlan.name,
        monthlyValue: newPlan.priceMonthly
      },
      include: {
        benefits: true
      }
    })
    // Register change in history with redundancy backup
    await saveHistoryWithBackup({
      subscriptionId: subscription.id,
      userId: user.id,
      changeType: 'PLAN_CHANGE',
      description: `Plano alterado de "${oldPlan.planType}" para "${newPlan.name}"`,
      oldValue: oldPlan,
      newValue: {
        planType: newPlan.name,
        monthlyValue: newPlan.priceMonthly.toString()
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined
    })
    // Send notifications with advanced service (async, don't wait)
    const priceDiff = newPlan.priceMonthly - parseFloat(oldPlan.monthlyValue)
    NotificationService.send({
      userId: user.id,
      eventType: 'plan_change',
      subject: 'Plano de Assinatura Alterado',
      message: `Seu plano foi alterado com sucesso de "${oldPlan.planType}" para "${newPlan.name}".\n\nNovo valor mensal: R$ ${newPlan.priceMonthly.toFixed(2)}\nDiferença: ${priceDiff >= 0 ? '+' : ''}R$ ${priceDiff.toFixed(2)}\n\nA alteração será aplicada na próxima renovação.`,
      priority: 'medium',
      metadata: {
        oldPlan: oldPlan.planType,
        newPlan: newPlan.name,
        oldValue: oldPlan.monthlyValue,
        newValue: newPlan.priceMonthly,
        priceDifference: priceDiff
      }
    }).catch(err => console.error('Error sending notifications:', err))
    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        planType: updatedSubscription.planType,
        monthlyValue: updatedSubscription.monthlyValue,
        status: updatedSubscription.status,
        renewalDate: updatedSubscription.renewalDate,
        benefits: updatedSubscription.benefits
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error changing plan:', error)
    return NextResponse.json(
      { error: 'Erro ao alterar plano. Tente novamente mais tarde.' },
      { status: 500 }
    )
  }
}