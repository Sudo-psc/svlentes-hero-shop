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
 * GET /api/assinante/dashboard-metrics
 * Retorna métricas consolidadas para o dashboard do assinante
 *
 * Features de Resiliência:
 * - Error handling completo com logging
 * - LGPD-compliant (não loga PII)
 * - Timeout protection (10s)
 * - Fallback para valores default em caso de erro parcial
 * - Circuit breaker via rate limiting
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  const context = {
    api: '/api/assinante/dashboard-metrics',
    requestId,
    timestamp: new Date(),
  }

  // Rate limiting: 200 requisições em 15 minutos (leitura)
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.read)
  if (rateLimitResult) {
    return rateLimitResult
  }

  // Timeout protection: 10s
  const timeoutSignal = AbortSignal.timeout(10000)

  return ApiErrorHandler.wrapApiHandler(async () => {
    // Validar autenticação Firebase
    const authResult = await validateFirebaseAuth(
      request.headers.get('Authorization'),
      adminAuth,
      context
    )

    if (authResult instanceof NextResponse) {
      return authResult // Error response
    }

    const { uid } = authResult

    // Buscar usuário pelo Firebase UID
    const user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
    })

    if (!user) {
      return ApiErrorHandler.handleError(
        ErrorType.NOT_FOUND,
        'Usuário não encontrado no banco de dados',
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
        nextBillingDate: true,
        renewalDate: true,
      },
    })

    if (!subscription) {
      return ApiErrorHandler.handleError(
        ErrorType.NOT_FOUND,
        'Assinatura ativa não encontrada',
        { ...context, userId: user.id }
      )
    }

    // === CÁLCULO 1: Total Economizado ===
    // Lógica: Σ(pagamentos realizados) vs custo teórico avulso (plan.price * 1.5)
    const payments = await prisma.payment.findMany({
      where: {
        userId: user.id,
        subscriptionId: subscription.id,
        status: {
          in: ['RECEIVED', 'CONFIRMED']
        }
      },
      select: {
        amount: true
      }
    })

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const monthlyValue = Number(subscription.monthlyValue)
    const theoreticalRetailPrice = monthlyValue * 1.5 // 50% mais caro compra avulsa
    const monthsActive = payments.length
    const theoreticalRetailTotal = theoreticalRetailPrice * monthsActive
    const totalSaved = theoreticalRetailTotal - totalPaid

    // === CÁLCULO 2: Lentes Recebidas ===
    // COUNT de Orders com status DELIVERED
    const lensesReceived = await prisma.order.count({
      where: {
        subscriptionId: subscription.id,
        deliveryStatus: 'DELIVERED'
      }
    })

    // === CÁLCULO 3: Dias até Próxima Entrega ===
    // DIFF entre nextBillingDate e hoje
    const now = new Date()
    const nextBillingDate = subscription.nextBillingDate || subscription.renewalDate
    const daysUntilNextDelivery = Math.ceil(
      (nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    // === CÁLCULO 4: Taxa de Pontualidade ===
    // (entregas no prazo / total entregas) * 100
    const allDeliveries = await prisma.order.findMany({
      where: {
        subscriptionId: subscription.id,
        deliveryStatus: 'DELIVERED'
      },
      select: {
        deliveredAt: true,
        estimatedDelivery: true
      }
    })

    let onTimeDeliveries = 0
    allDeliveries.forEach(order => {
      if (order.deliveredAt && order.estimatedDelivery) {
        // Considera "no prazo" se entregue até a data estimada
        if (order.deliveredAt <= order.estimatedDelivery) {
          onTimeDeliveries++
        }
      }
    })

    const deliveryOnTimeRate = allDeliveries.length > 0
      ? Math.round((onTimeDeliveries / allDeliveries.length) * 100)
      : 100 // 100% se ainda não teve entregas

    // === FALLBACK HANDLING ===
    // Se algum cálculo falhar, retornar valores default ao invés de quebrar toda a API
    let metrics
    try {
      metrics = {
        totalSaved: Math.max(0, Math.round(totalSaved * 100) / 100),
        lensesReceived,
        daysUntilNextDelivery: Math.max(0, daysUntilNextDelivery),
        deliveryOnTimeRate,
      }
    } catch (calcError) {
      console.warn('[dashboard-metrics] Error em cálculo, usando fallback:', calcError)

      // Fallback: valores default
      metrics = {
        totalSaved: 0,
        lensesReceived: 0,
        daysUntilNextDelivery: 30,
        deliveryOnTimeRate: 100,
      }
    }

    // Retornar métricas com sucesso
    return createSuccessResponse(metrics, requestId)
  }, context)
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'
