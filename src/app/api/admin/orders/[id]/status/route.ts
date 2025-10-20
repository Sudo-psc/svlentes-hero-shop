/**
 * PUT /api/admin/orders/[id]/status
 * Atualizar status do pedido
 *
 * Atualiza o status de entrega de um pedido com informações de rastreio
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createSuccessResponse } from '@/lib/admin-auth'
import { orderStatusUpdateSchema } from '@/lib/admin-validations'
/**
 * @swagger
 * /api/admin/orders/{id}/status:
 *   put:
 *     summary: Atualizar status do pedido
 *     description: Atualiza o status de entrega de um pedido com informações de rastreio
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, SHIPPED, IN_TRANSIT, DELIVERED, CANCELLED]
 *                 description: Novo status do pedido
 *               trackingCode:
 *                 type: string
 *                 description: Código de rastreio
 *               notes:
 *                 type: string
 *                 description: Notas sobre a atualização
 *               deliveredAt:
 *                 type: string
 *                 format: date-time
 *                 description: Data de entrega (se status = DELIVERED)
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
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
 *                       $ref: '#/components/schemas/Order'
 *                     statusChange:
 *                       type: object
 *                       properties:
 *                         from:
 *                           type: string
 *                         to:
 *                           type: string
 *                         changedBy:
 *                           type: string
 *                         changedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       404:
 *         description: Pedido não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('orders:status_update')(request)
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
    const { data: statusData, error: validationError } = validateBody(orderStatusUpdateSchema, body)
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
        deliveredAt: true,
        trackingCode: true
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
    const oldStatus = existingOrder.deliveryStatus
    const newStatus = statusData.status
    // Verificar se mudança é válida
    if (!isValidOrderStatusTransition(oldStatus, newStatus)) {
      return NextResponse.json(
        {
          error: 'INVALID_STATUS_TRANSITION',
          message: `Transição de status inválida: ${oldStatus} → ${newStatus}`,
          validTransitions: getValidOrderTransitions(oldStatus)
        },
        { status: 400 }
      )
    }
    // Preparar dados de atualização
    const updateData: any = {
      deliveryStatus: newStatus,
      updatedAt: new Date(),
      notes: statusData.notes
    }
    // Adicionar campos específicos baseado no status
    switch (newStatus) {
      case 'SHIPPED':
        updateData.shippingDate = new Date()
        updateData.trackingCode = statusData.trackingCode || existingOrder.trackingCode
        break
      case 'IN_TRANSIT':
        if (statusData.trackingCode) {
          updateData.trackingCode = statusData.trackingCode
        }
        break
      case 'DELIVERED':
        updateData.deliveredAt = statusData.deliveredAt ? new Date(statusData.deliveredAt) : new Date()
        if (statusData.trackingCode) {
          updateData.trackingCode = statusData.trackingCode
        }
        break
      case 'CANCELLED':
        // Cancelar faturas associadas
        await prisma.invoice.updateMany({
          where: { orderId },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        })
        break
    }
    // Atualizar pedido
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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
    // Disparar ações baseadas no novo status
    await triggerOrderStatusActions(newStatus, updatedOrder, user)
    return createSuccessResponse(
      {
        order: updatedOrder,
        statusChange: {
          from: oldStatus,
          to: newStatus,
          trackingCode: statusData.trackingCode || updatedOrder.trackingCode,
          notes: statusData.notes,
          changedBy: user.email,
          changedAt: new Date()
        }
      },
      'Status do pedido atualizado com sucesso'
    )
  } catch (error) {
    console.error('Order status update error:', error)
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
function isValidOrderStatusTransition(from: string, to: string): boolean {
  const validTransitions: Record<string, string[]> = {
    'PENDING': ['SHIPPED', 'CANCELLED'],
    'SHIPPED': ['IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
    'IN_TRANSIT': ['DELIVERED', 'CANCELLED'],
    'DELIVERED': [], // Status final
    'CANCELLED': [] // Status final
  }
  return validTransitions[from]?.includes(to) || false
}
function getValidOrderTransitions(from: string): string[] {
  const validTransitions: Record<string, string[]> = {
    'PENDING': ['SHIPPED', 'CANCELLED'],
    'SHIPPED': ['IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
    'IN_TRANSIT': ['DELIVERED', 'CANCELLED'],
    'DELIVERED': [],
    'CANCELLED': []
  }
  return validTransitions[from] || []
}
async function triggerOrderStatusActions(
  status: string,
  order: any,
  user: any
): Promise<void> {
  try {
    switch (status) {
      case 'SHIPPED':
        // Enviar notificação de envio
        // TODO: Integrar com sistema de notificações para enviar email/SMS
        break
      case 'IN_TRANSIT':
        // Atualizar cliente sobre trânsito
        // TODO: Enviar atualização de rastreio
        break
      case 'DELIVERED':
        // Confirmar entrega
        // TODO: Enviar email de confirmação de entrega
        break
      case 'CANCELLED':
        // Notificar sobre cancelamento
        // TODO: Enviar notificação de cancelamento e reembolso se aplicável
        break
      default:
        // Outros status
        break
    }
  } catch (error) {
    console.error('Error triggering order status actions:', error)
    // Não falhar a atualização se as ações falharem
  }
}