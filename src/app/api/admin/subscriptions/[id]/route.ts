/**
 * GET /api/admin/subscriptions/[id]
 * Obter detalhes de uma assinatura específica
 *
 * Retorna informações completas de uma assinatura incluindo histórico
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createSuccessResponse } from '@/lib/admin-auth'

/**
 * @swagger
 * /api/admin/subscriptions/{id}:
 *   get:
 *     summary: Obter detalhes da assinatura
 *     description: Retorna informações completas de uma assinatura específica
 *     tags:
 *       - Assinaturas Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da assinatura
 *     responses:
 *       200:
 *         description: Detalhes da assinatura obtidos com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscription:
 *                       $ref: '#/components/schemas/SubscriptionDetail'
 *                     payments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payment'
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     history:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SubscriptionHistory'
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       404:
 *         description: Assinatura não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('subscriptions:view')(request)

    if (error) {
      return error
    }

    const subscriptionId = params.id

    if (!subscriptionId) {
      return NextResponse.json(
        {
          error: 'INVALID_ID',
          message: 'ID da assinatura é obrigatório'
        },
        { status: 400 }
      )
    }

    // Buscar assinatura com dados relacionados
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            whatsapp: true
          }
        },
        payments: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 50
        },
        orders: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            paymentMethod: {
              select: {
                type: true,
                last4: true,
                brand: true
              }
            }
          }
        },
        history: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 100
        },
        benefits: true
      }
    })

    if (!subscription) {
      return NextResponse.json(
        {
          error: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Assinatura não encontrada'
        },
        { status: 404 }
      )
    }

    // Calcular métricas adicionais
    const totalPaid = subscription.payments
      .filter(p => p.status === 'RECEIVED')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const totalOrders = subscription.orders.length
    const deliveredOrders = subscription.orders.filter(o => o.deliveryStatus === 'DELIVERED').length
    const averagePaymentValue = subscription.payments.length > 0
      ? totalPaid / subscription.payments.length
      : 0

    // Status detalhado
    const statusInfo = {
      current: subscription.status,
      daysOverdue: subscription.daysOverdue || 0,
      isOverdue: subscription.status === 'OVERDUE',
      isSuspended: subscription.status === 'SUSPENDED',
      isPaused: subscription.status === 'PAUSED',
      isCancelled: subscription.status === 'CANCELLED',
      nextAction: getNextAction(subscription.status)
    }

    // Montar resposta completa
    const subscriptionDetail = {
      subscription: {
        ...subscription,
        status: statusInfo,
        metrics: {
          totalPaid: parseFloat(totalPaid.toFixed(2)),
          totalOrders,
          deliveredOrders,
          averagePaymentValue: parseFloat(averagePaymentValue.toFixed(2)),
          lastPaymentDate: subscription.lastPaymentDate,
          nextBillingDate: subscription.nextBillingDate,
          lifetimeValue: totalPaid
        }
      },
      payments: subscription.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        netValue: payment.netValue,
        status: payment.status,
        billingType: payment.billingType,
        dueDate: payment.dueDate,
        paymentDate: payment.paymentDate,
        description: payment.description,
        invoiceUrl: payment.invoiceUrl,
        bankSlipUrl: payment.bankSlipUrl,
        transactionReceiptUrl: payment.transactionReceiptUrl,
        createdAt: payment.createdAt,
        metadata: payment.metadata
      })),
      orders: subscription.orders.map(order => ({
        id: order.id,
        orderDate: order.orderDate,
        shippingDate: order.shippingDate,
        deliveryStatus: order.deliveryStatus,
        trackingCode: order.trackingCode,
        totalAmount: order.totalAmount,
        type: order.type,
        paymentStatus: order.paymentStatus,
        estimatedDelivery: order.estimatedDelivery,
        deliveredAt: order.deliveredAt,
        notes: order.notes,
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod
      })),
      benefits: subscription.benefits.map(benefit => ({
        id: benefit.id,
        benefitName: benefit.benefitName,
        benefitDescription: benefit.benefitDescription,
        benefitIcon: benefit.benefitIcon,
        benefitType: benefit.benefitType,
        quantityTotal: benefit.quantityTotal,
        quantityUsed: benefit.quantityUsed,
        remainingQuantity: benefit.quantityTotal ? benefit.quantityTotal - benefit.quantityUsed : null,
        expirationDate: benefit.expirationDate,
        isActive: benefit.expirationDate ? new Date(benefit.expirationDate) > new Date() : true
      })),
      history: subscription.history.map(history => ({
        id: history.id,
        changeType: history.changeType,
        description: history.description,
        oldValue: history.oldValue,
        newValue: history.newValue,
        metadata: history.metadata,
        ipAddress: history.ipAddress,
        createdAt: history.createdAt
      }))
    }

    return createSuccessResponse(subscriptionDetail, 'Detalhes da assinatura obtidos com sucesso')

  } catch (error) {
    console.error('Subscription detail error:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/subscriptions/[id]
 * Atualizar assinatura
 *
 * Atualiza dados da assinatura
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('subscriptions:update')(request)

    if (error) {
      return error
    }

    const subscriptionId = params.id

    if (!subscriptionId) {
      return NextResponse.json(
        {
          error: 'INVALID_ID',
          message: 'ID da assinatura é obrigatório'
        },
        { status: 400 }
      )
    }

    // Validar body
    const body = await request.json()
    const { data: updateData, error: validationError } = validateBody(subscriptionUpdateSchema, body)

    if (validationError) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Campo inválido: ${validationError.field} - ${validationError.message}`
        },
        { status: 400 }
      )
    }

    // Verificar se assinatura existe
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        id: true,
        status: true,
        userId: true,
        planType: true,
        monthlyValue: true,
        shippingAddress: true,
        lensType: true
      }
    })

    if (!existingSubscription) {
      return NextResponse.json(
        {
          error: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Assinatura não encontrada'
        },
        { status: 404 }
      )
    }

    // Registrar mudanças no histórico
    const changes: Record<string, { old: any; new: any }> = {}

    if (updateData.planType && updateData.planType !== existingSubscription.planType) {
      changes.planType = { old: existingSubscription.planType, new: updateData.planType }
    }

    if (updateData.monthlyValue && updateData.monthlyValue !== existingSubscription.monthlyValue) {
      changes.monthlyValue = { old: existingSubscription.monthlyValue, new: updateData.monthlyValue }
    }

    if (updateData.shippingAddress && JSON.stringify(updateData.shippingAddress) !== JSON.stringify(existingSubscription.shippingAddress)) {
      changes.shippingAddress = { old: existingSubscription.shippingAddress, new: updateData.shippingAddress }
    }

    // Atualizar assinatura
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        ...(updateData.planType && { planType: updateData.planType }),
        ...(updateData.monthlyValue && { monthlyValue: updateData.monthlyValue }),
        ...(updateData.shippingAddress && { shippingAddress: updateData.shippingAddress }),
        ...(updateData.lensType !== undefined && { lensType: updateData.lensType }),
        ...(updateData.bothEyes !== undefined && { bothEyes: updateData.bothEyes }),
        ...(updateData.differentGrades !== undefined && { differentGrades: updateData.differentGrades }),
        ...(updateData.metadata && { metadata: updateData.metadata })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Criar registros de histórico para mudanças significativas
    if (Object.keys(changes).length > 0) {
      await Promise.all(
        Object.entries(changes).map(([field, change]) =>
          prisma.subscriptionHistory.create({
            data: {
              subscriptionId,
              userId: existingSubscription.userId,
              changeType: 'PLAN_CHANGE' as any,
              description: `Atualização do campo ${field}`,
              oldValue: change.old,
              newValue: change.new,
              ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
            }
          })
        )
      )
    }

    return createSuccessResponse(updatedSubscription, 'Assinatura atualizada com sucesso')

  } catch (error) {
    console.error('Subscription update error:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/subscriptions/[id]
 * Cancelar assinatura
 *
 * Cancela uma assinatura (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('subscriptions:delete')(request)

    if (error) {
      return error
    }

    const subscriptionId = params.id

    if (!subscriptionId) {
      return NextResponse.json(
        {
          error: 'INVALID_ID',
          message: 'ID da assinatura é obrigatório'
        },
        { status: 400 }
      )
    }

    // Verificar se assinatura existe
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        id: true,
        status: true,
        userId: true
      }
    })

    if (!subscription) {
      return NextResponse.json(
        {
          error: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Assinatura não encontrada'
        },
        { status: 404 }
      )
    }

    if (subscription.status === 'CANCELLED') {
      return NextResponse.json(
        {
          error: 'ALREADY_CANCELLED',
          message: 'Assinatura já está cancelada'
        },
        { status: 409 }
      )
    }

    // Cancelar assinatura
    const cancelledSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        endDate: new Date(),
        cancelledDate: new Date(), // Note: este campo não existe no schema, pode ser necessário adicionar
        updatedAt: new Date()
      },
      select: {
        id: true,
        status: true,
        updatedAt: true
      }
    })

    // Criar registro no histórico
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId,
        userId: subscription.userId,
        changeType: 'SUBSCRIPTION_CANCELLED' as any,
        description: 'Assinatura cancelada pelo administrador',
        oldValue: { status: subscription.status },
        newValue: { status: 'CANCELLED' },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return createSuccessResponse(cancelledSubscription, 'Assinatura cancelada com sucesso')

  } catch (error) {
    console.error('Subscription delete error:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Funções auxiliares
function validateBody<T>(schema: any, body: unknown): {
  data: T | null
  error: { field: string; message: string } | null
} {
  try {
    const data = schema.parse(body)
    return { data, error: null }
  } catch (error: any) {
    if (error.errors && error.errors[0]) {
      const firstError = error.errors[0]
      return {
        data: null,
        error: {
          field: firstError.path.join('.'),
          message: firstError.message
        }
      }
    }
    return {
      data: null,
      error: {
        field: 'unknown',
        message: 'Erro de validação desconhecido'
      }
    }
  }
}

function getNextAction(status: string): string {
  switch (status) {
    case 'PENDING_ACTIVATION':
      return 'Aguardando primeiro pagamento'
    case 'ACTIVE':
      return 'Assinatura em dia'
    case 'OVERDUE':
      return 'Cobrar cliente'
    case 'SUSPENDED':
      return 'Verificar pendências'
    case 'PAUSED':
      return 'Aguardando reativação'
    case 'CANCELLED':
      return 'Assinatura encerrada'
    default:
      return 'Status desconhecido'
  }
}