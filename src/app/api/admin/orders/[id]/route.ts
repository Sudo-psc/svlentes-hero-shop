/**
 * GET /api/admin/orders/[id]
 * Obter detalhes de um pedido específico
 *
 * Retorna informações completas de um pedido incluindo histórico
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createSuccessResponse } from '@/lib/admin-auth'
import { orderUpdateSchema } from '@/lib/admin-validations'
/**
 * @swagger
 * /api/admin/orders/{id}:
 *   get:
 *     summary: Obter detalhes do pedido
 *     description: Retorna informações completas de um pedido específico
 *     tags:
 *       - Pedidos Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Detalhes do pedido obtidos com sucesso
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
 *                     order:
 *                       $ref: '#/components/schemas/OrderDetail'
 *                     invoices:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Invoice'
 *                     timeline:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date-time
 *                           action:
 *                             type: string
 *                           description:
 *                             type: string
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       404:
 *         description: Pedido não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('orders:view')(request)
    if (error) {
      return error
    }
    const orderId = params.id
    if (!orderId) {
      return NextResponse.json(
        {
          error: 'INVALID_ID',
          message: 'ID do pedido é obrigatório'
        },
        { status: 400 }
      )
    }
    // Buscar pedido com dados relacionados
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        subscription: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                whatsapp: true
              }
            }
          }
        },
        paymentMethod: {
          select: {
            id: true,
            type: true,
            last4: true,
            brand: true,
            holderName: true,
            expiryMonth: true,
            expiryYear: true
          }
        },
        invoices: {
          include: {
            paymentMethod: {
              select: {
                type: true,
                last4: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })
    if (!order) {
      return NextResponse.json(
        {
          error: 'ORDER_NOT_FOUND',
          message: 'Pedido não encontrado'
        },
        { status: 404 }
      )
    }
    // Calcular métricas adicionais
    const deliveryTime = order.shippingDate && order.deliveredAt
      ? Math.ceil(
          (new Date(order.deliveredAt).getTime() - new Date(order.shippingDate).getTime()) /
          (1000 * 60 * 60 * 24)
        )
      : null
    const daysSinceCreation = Math.ceil(
      (new Date().getTime() - new Date(order.createdAt).getTime()) /
      (1000 * 60 * 60 * 24)
    )
    const isOverdue = order.estimatedDelivery &&
      new Date(order.estimatedDelivery) < new Date() &&
      order.deliveryStatus !== 'DELIVERED'
    // Status detalhado
    const statusInfo = {
      current: order.deliveryStatus,
      isPending: order.deliveryStatus === 'PENDING',
      isShipped: ['SHIPPED', 'IN_TRANSIT'].includes(order.deliveryStatus),
      isInTransit: order.deliveryStatus === 'IN_TRANSIT',
      isDelivered: order.deliveryStatus === 'DELIVERED',
      isCancelled: order.deliveryStatus === 'CANCELLED',
      hasTracking: !!order.trackingCode,
      deliveryTime,
      isOverdue,
      daysSinceCreation
    }
    // Criar timeline do pedido
    const timeline = createOrderTimeline(order)
    // Montar resposta completa
    const orderDetail = {
      order: {
        ...order,
        status: statusInfo,
        metrics: {
          deliveryTime,
          daysSinceCreation,
          isOverdue
        }
      },
      invoices: order.invoices.map(invoice => ({
        id: invoice.id,
        type: invoice.type,
        amount: invoice.amount,
        status: invoice.status,
        dueDate: invoice.dueDate,
        paidAt: invoice.paidAt,
        taxes: invoice.taxes,
        discounts: invoice.discounts,
        pdfUrl: invoice.pdfUrl,
        items: invoice.items,
        createdAt: invoice.createdAt,
        paymentMethod: invoice.paymentMethod
      })),
      timeline,
      tracking: {
        code: order.trackingCode,
        hasTracking: !!order.trackingCode,
        carrier: extractCarrierFromTrackingCode(order.trackingCode),
        estimatedDelivery: order.estimatedDelivery,
        actualDelivery: order.deliveredAt
      },
      shipping: {
        address: order.deliveryAddress,
        estimatedDelivery: order.estimatedDelivery,
        actualDelivery: order.deliveredAt,
        shippingDate: order.shippingDate
      }
    }
    return createSuccessResponse(orderDetail, 'Detalhes do pedido obtidos com sucesso')
  } catch (error) {
    console.error('Order detail error:', error)
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
 * PUT /api/admin/orders/[id]
 * Atualizar pedido
 *
 * Atualiza dados do pedido
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('orders:update')(request)
    if (error) {
      return error
    }
    const orderId = params.id
    if (!orderId) {
      return NextResponse.json(
        {
          error: 'INVALID_ID',
          message: 'ID do pedido é obrigatório'
        },
        { status: 400 }
      )
    }
    // Validar body
    const body = await request.json()
    const { data: updateData, error: validationError } = validateBody(orderUpdateSchema, body)
    if (validationError) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Campo inválido: ${validationError.field} - ${validationError.message}`
        },
        { status: 400 }
      )
    }
    // Verificar se pedido existe
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        deliveryStatus: true,
        shippingDate: true,
        deliveredAt: true
      }
    })
    if (!existingOrder) {
      return NextResponse.json(
        {
          error: 'ORDER_NOT_FOUND',
          message: 'Pedido não encontrado'
        },
        { status: 404 }
      )
    }
    // Preparar dados de atualização
    const updateDataWithTimestamps = {
      ...updateData,
      updatedAt: new Date()
    }
    // Atualizar pedido
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateDataWithTimestamps,
      include: {
        subscription: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        paymentMethod: {
          select: {
            id: true,
            type: true,
            last4: true,
            holderName: true
          }
        }
      }
    })
    return createSuccessResponse(updatedOrder, 'Pedido atualizado com sucesso')
  } catch (error) {
    console.error('Order update error:', error)
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
 * DELETE /api/admin/orders/[id]
 * Cancelar pedido
 *
 * Cancela um pedido
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('orders:delete')(request)
    if (error) {
      return error
    }
    const orderId = params.id
    if (!orderId) {
      return NextResponse.json(
        {
          error: 'INVALID_ID',
          message: 'ID do pedido é obrigatório'
        },
        { status: 400 }
      )
    }
    // Verificar se pedido existe
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        deliveryStatus: true,
        shippingDate: true
      }
    })
    if (!order) {
      return NextResponse.json(
        {
          error: 'ORDER_NOT_FOUND',
          message: 'Pedido não encontrado'
        },
        { status: 404 }
      )
    }
    // Verificar se pedido pode ser cancelado
    if (order.deliveryStatus === 'DELIVERED') {
      return NextResponse.json(
        {
          error: 'ORDER_ALREADY_DELIVERED',
          message: 'Pedidos entregues não podem ser cancelados'
        },
        { status: 409 }
      )
    }
    if (order.deliveryStatus === 'CANCELLED') {
      return NextResponse.json(
        {
          error: 'ORDER_ALREADY_CANCELLED',
          message: 'Pedido já está cancelado'
        },
        { status: 409 }
      )
    }
    // Cancelar pedido
    const cancelledOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryStatus: 'CANCELLED',
        updatedAt: new Date()
      },
      select: {
        id: true,
        deliveryStatus: true,
        updatedAt: true
      }
    })
    // Cancelar faturas associadas
    await prisma.invoice.updateMany({
      where: { orderId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    })
    return createSuccessResponse(cancelledOrder, 'Pedido cancelado com sucesso')
  } catch (error) {
    console.error('Order delete error:', error)
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
function createOrderTimeline(order: any): any[] {
  const timeline = []
  // Data de criação
  timeline.push({
    date: order.createdAt,
    action: 'order_created',
    description: 'Pedido criado',
    type: 'info'
  })
  // Data de envio
  if (order.shippingDate) {
    timeline.push({
      date: order.shippingDate,
      action: 'order_shipped',
      description: 'Pedido enviado',
      type: 'success'
    })
  }
  // Data de entrega estimada
  if (order.estimatedDelivery) {
    timeline.push({
      date: order.estimatedDelivery,
      action: 'estimated_delivery',
      description: 'Entrega estimada',
      type: 'warning'
    })
  }
  // Data de entrega real
  if (order.deliveredAt) {
    timeline.push({
      date: order.deliveredAt,
      action: 'order_delivered',
      description: 'Pedido entregue',
      type: 'success'
    })
  }
  // Última atualização
  if (order.updatedAt && order.updatedAt !== order.createdAt) {
    timeline.push({
      date: order.updatedAt,
      action: 'order_updated',
      description: 'Pedido atualizado',
      type: 'info'
    })
  }
  return timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
function extractCarrierFromTrackingCode(trackingCode: string | null): string | null {
  if (!trackingCode) return null
  // Lógica simples para extrair transportadora baseada no código
  if (trackingCode.startsWith('BR') || trackingCode.startsWith('PX')) {
    return 'Correios'
  }
  if (trackingCode.match(/^\d{12}$/)) {
    return 'Jadlog'
  }
  if (trackingCode.match(/^\d{10}$/)) {
    return 'Transportadora'
  }
  return 'Desconhecida'
}