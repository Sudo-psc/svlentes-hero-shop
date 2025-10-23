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
 * GET /api/assinante/delivery-timeline
 * Retorna histórico de entregas (últimas 3) + próxima entrega estimada
 *
 * Features de Resiliência:
 * - Error handling com fallback para timeline vazia
 * - LGPD-compliant logging
 * - Timeout protection (10s)
 * - Graceful degradation se dados parciais
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  const context = {
    api: '/api/assinante/delivery-timeline',
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

    // === BUSCAR ÚLTIMAS 3 ENTREGAS CONCLUÍDAS ===
    const pastDeliveries = await prisma.order.findMany({
      where: {
        subscriptionId: subscription.id,
        deliveryStatus: 'DELIVERED'
      },
      orderBy: {
        deliveredAt: 'desc'
      },
      take: 3,
      select: {
        id: true,
        orderDate: true,
        shippingDate: true,
        deliveredAt: true,
        deliveryStatus: true,
        trackingCode: true,
        products: true,
        totalAmount: true,
        estimatedDelivery: true,
        deliveryAddress: true
      }
    })

    // === CALCULAR PRÓXIMA ENTREGA ===
    const now = new Date()
    const nextBillingDate = subscription.nextBillingDate || subscription.renewalDate

    // Buscar próxima entrega pendente/em trânsito (se existir)
    const nextPendingOrder = await prisma.order.findFirst({
      where: {
        subscriptionId: subscription.id,
        deliveryStatus: {
          in: ['PENDING', 'SHIPPED', 'IN_TRANSIT']
        }
      },
      orderBy: {
        orderDate: 'desc'
      },
      select: {
        id: true,
        orderDate: true,
        estimatedDelivery: true,
        deliveryStatus: true,
        trackingCode: true
      }
    })

    // Determinar próxima entrega estimada
    let nextDeliveryEstimate: Date
    let nextDeliveryStatus: string

    if (nextPendingOrder) {
      // Se tem pedido em andamento, usar estimativa dele
      nextDeliveryEstimate = nextPendingOrder.estimatedDelivery || nextBillingDate
      nextDeliveryStatus = nextPendingOrder.deliveryStatus
    } else {
      // Se não tem pedido pendente, assumir próximo ciclo de cobrança
      // Adicionar 5-7 dias para processamento/entrega
      nextDeliveryEstimate = new Date(nextBillingDate)
      nextDeliveryEstimate.setDate(nextDeliveryEstimate.getDate() + 6)
      nextDeliveryStatus = 'scheduled'
    }

    const nextDeliveryDaysRemaining = Math.max(
      0,
      Math.ceil(
        (nextDeliveryEstimate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
    )

    // === FALLBACK HANDLING ===
    // Se algo falhar, retornar estrutura vazia ao invés de erro
    let timelineData
    try {
      timelineData = {
        pastDeliveries: pastDeliveries.map(order => ({
          id: order.id,
          orderDate: order.orderDate.toISOString(),
          shippingDate: order.shippingDate?.toISOString() || null,
          deliveredAt: order.deliveredAt?.toISOString() || null,
          estimatedDelivery: order.estimatedDelivery?.toISOString() || null,
          status: order.deliveryStatus,
          trackingCode: order.trackingCode,
          products: order.products,
          totalAmount: Number(order.totalAmount),
          deliveryAddress: order.deliveryAddress,
          onTime: order.deliveredAt && order.estimatedDelivery
            ? order.deliveredAt <= order.estimatedDelivery
            : null,
        })),
        nextDelivery: {
          estimatedDate: nextDeliveryEstimate.toISOString(),
          daysRemaining: nextDeliveryDaysRemaining,
          status: nextDeliveryStatus,
          trackingCode: nextPendingOrder?.trackingCode || null,
          orderId: nextPendingOrder?.id || null,
        },
      }
    } catch (formatError) {
      console.warn('[delivery-timeline] Error ao formatar dados, usando fallback:', formatError)

      // Fallback: timeline vazia mas válida
      const fallbackDate = new Date()
      fallbackDate.setDate(fallbackDate.getDate() + 30)

      timelineData = {
        pastDeliveries: [],
        nextDelivery: {
          estimatedDate: fallbackDate.toISOString(),
          daysRemaining: 30,
          status: 'scheduled',
          trackingCode: null,
          orderId: null,
        },
      }
    }

    return createSuccessResponse(timelineData, requestId)
  }, context)
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'
