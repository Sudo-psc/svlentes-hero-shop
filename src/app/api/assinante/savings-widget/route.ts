import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import {
  ApiErrorHandler,
  ErrorType,
  generateRequestId,
  validateFirebaseAuth,
  createSuccessResponse,
} from '@/lib/api-error-handler'

/**
 * GET /api/assinante/savings-widget
 * Retorna economia acumulada total + tendência mensal (últimos 6 meses)
 *
 * Features de Resiliência:
 * - Error handling com fallback para cálculos default
 * - LGPD-compliant logging
 * - Timeout protection (10s)
 * - Graceful degradation para trend data
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  const context = {
    api: '/api/assinante/savings-widget',
    requestId,
    timestamp: new Date(),
  }

  // Rate limiting
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.read)
  if (rateLimitResult) {
    return rateLimitResult
  }

  return ApiErrorHandler.wrapApiHandler(async () => {
    // Validar autenticação
    const authResult = await validateFirebaseAuth(
      request.headers.get('Authorization'),
      adminAuth,
      context
    )

    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { uid } = authResult

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
    })

    if (!user) {
      return ApiErrorHandler.handleError(
        ErrorType.NOT_FOUND,
        'Usuário não encontrado',
        { ...context, userId: uid }
      )
    }

    // Buscar assinatura ativa
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        monthlyValue: true,
        startDate: true,
      },
    })

    if (!subscription) {
      return ApiErrorHandler.handleError(
        ErrorType.NOT_FOUND,
        'Assinatura ativa não encontrada',
        { ...context, userId: user.id }
      )
    }

    const monthlyValue = Number(subscription.monthlyValue)
    const theoreticalRetailPrice = monthlyValue * 1.5 // 50% mais caro compra avulsa

    // === BUSCAR TODOS PAGAMENTOS CONFIRMADOS ===
    const allPayments = await prisma.payment.findMany({
      where: {
        userId: user.id,
        subscriptionId: subscription.id,
        status: {
          in: ['RECEIVED', 'CONFIRMED']
        }
      },
      select: {
        amount: true,
        paymentDate: true,
        confirmedDate: true
      },
      orderBy: {
        paymentDate: 'asc'
      }
    })

    // === CÁLCULO 1: Economia Total ===
    const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    const monthsActive = allPayments.length
    const theoreticalRetailTotal = theoreticalRetailPrice * monthsActive
    const totalSavings = theoreticalRetailTotal - totalPaid

    // === CÁLCULO 2: Economia no Mês Atual ===
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const currentMonthPayments = allPayments.filter(p => {
      const paymentDate = p.paymentDate || p.confirmedDate
      if (!paymentDate) return false
      const date = new Date(paymentDate)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    const currentMonthPaid = currentMonthPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    )
    const currentMonthRetailCost = theoreticalRetailPrice * currentMonthPayments.length
    const savingsThisMonth = currentMonthRetailCost - currentMonthPaid

    // === CÁLCULO 3: Tendência dos Últimos 6 Meses ===
    // Agrupar pagamentos por mês
    const savingsTrend: Array<{ month: string; amount: number }> = []

    // Gerar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now)
      targetDate.setMonth(targetDate.getMonth() - i)
      const targetMonth = targetDate.getMonth()
      const targetYear = targetDate.getFullYear()

      // Filtrar pagamentos deste mês
      const monthPayments = allPayments.filter(p => {
        const paymentDate = p.paymentDate || p.confirmedDate
        if (!paymentDate) return false
        const date = new Date(paymentDate)
        return date.getMonth() === targetMonth && date.getFullYear() === targetYear
      })

      // Calcular economia do mês
      const monthPaid = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      const monthRetailCost = theoreticalRetailPrice * monthPayments.length
      const monthSavings = monthRetailCost - monthPaid

      // Formatar nome do mês (ex: "Jan/2025")
      const monthName = targetDate.toLocaleDateString('pt-BR', {
        month: 'short',
        year: 'numeric'
      })

      savingsTrend.push({
        month: monthName,
        amount: Math.max(0, Math.round(monthSavings * 100) / 100)
      })
    }

    // === FALLBACK HANDLING ===
    // Se cálculos falharem, retornar estrutura válida com zeros
    let savingsData
    try {
      savingsData = {
        totalSavings: Math.max(0, Math.round(totalSavings * 100) / 100),
        savingsThisMonth: Math.max(0, Math.round(savingsThisMonth * 100) / 100),
        savingsTrend,
        metadata: {
          monthsActive,
          averageMonthlySavings: monthsActive > 0
            ? Math.round((totalSavings / monthsActive) * 100) / 100
            : 0,
          subscriptionStartDate: subscription.startDate.toISOString(),
        },
      }
    } catch (calcError) {
      console.warn('[savings-widget] Error ao calcular economia, usando fallback:', calcError)

      // Fallback: valores zero mas estrutura válida
      const now = new Date()
      const fallbackTrend = []

      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(now)
        targetDate.setMonth(targetDate.getMonth() - i)
        const monthName = targetDate.toLocaleDateString('pt-BR', {
          month: 'short',
          year: 'numeric',
        })

        fallbackTrend.push({
          month: monthName,
          amount: 0,
        })
      }

      savingsData = {
        totalSavings: 0,
        savingsThisMonth: 0,
        savingsTrend: fallbackTrend,
        metadata: {
          monthsActive: 0,
          averageMonthlySavings: 0,
          subscriptionStartDate: subscription.startDate.toISOString(),
        },
      }
    }

    return createSuccessResponse(savingsData, requestId)
  }, context)
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'
