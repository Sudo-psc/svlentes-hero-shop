/**
 * GET /api/admin/customers/[id]
 * Obter detalhes de um cliente específico
 *
 * Retorna informações completas de um cliente incluindo assinaturas, pedidos e histórico
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createSuccessResponse } from '@/lib/admin-auth'
import { customerUpdateSchema } from '@/lib/admin-validations'
/**
 * @swagger
 * /api/admin/customers/{id}:
 *   get:
 *     summary: Obter detalhes do cliente
 *     description: Retorna informações completas de um cliente específico
 *     tags:
 *       - Clientes Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Detalhes do cliente obtidos com sucesso
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
 *                     customer:
 *                       $ref: '#/components/schemas/CustomerDetail'
 *                     subscriptions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Subscription'
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     payments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payment'
 *                     supportTickets:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SupportTicket'
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       404:
 *         description: Cliente não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('customers:view')(request)
    if (error) {
      return error
    }
    const customerId = params.id
    if (!customerId) {
      return NextResponse.json(
        {
          error: 'INVALID_ID',
          message: 'ID do cliente é obrigatório'
        },
        { status: 400 }
      )
    }
    // Buscar cliente com dados relacionados
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        whatsapp: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        lastLoginAt: true,
        updatedAt: true,
        asaasCustomerId: true,
        metadata: true
      }
    })
    if (!customer) {
      return NextResponse.json(
        {
          error: 'CUSTOMER_NOT_FOUND',
          message: 'Cliente não encontrado'
        },
        { status: 404 }
      )
    }
    // Buscar dados relacionados em paralelo
    const [
      subscriptions,
      orders,
      payments,
      supportTickets,
      consentLogs
    ] = await Promise.all([
      // Assinaturas do cliente
      prisma.subscription.findMany({
        where: { userId: customerId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      // Pedidos do cliente
      prisma.order.findMany({
        where: {
          subscription: {
            userId: customerId
          }
        },
        include: {
          subscription: {
            select: {
              id: true,
              planType: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      // Pagamentos do cliente
      prisma.payment.findMany({
        where: { userId: customerId },
        include: {
          subscription: {
            select: {
              id: true,
              planType: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50 // Limitar para performance
      }),
      // Tickets de suporte
      prisma.supportTicket.findMany({
        where: { userId: customerId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      // Logs de consentimento LGPD
      prisma.consentLog.findMany({
        where: { userId: customerId },
        orderBy: {
          timestamp: 'desc'
        }
      })
    ])
    // Processar dados e calcular métricas
    const activeSubscription = subscriptions.find(s => s.status === 'ACTIVE')
    const customerStatus = activeSubscription ? 'active' :
                         subscriptions.some(s => ['OVERDUE', 'SUSPENDED'].includes(s.status)) ? 'overdue' :
                         'inactive'
    // Calcular métricas financeiras
    const totalPayments = payments
      .filter(p => p.status === 'RECEIVED')
      .reduce((sum, p) => sum + Number(p.amount), 0)
    const lastPayment = payments.find(p => p.status === 'RECEIVED')
    const averagePaymentValue = payments.length > 0
      ? payments.reduce((sum, p) => sum + Number(p.amount), 0) / payments.length
      : 0
    // Montar resposta completa
    const customerDetail = {
      customer: {
        ...customer,
        status: customerStatus,
        metrics: {
          totalSubscriptions: subscriptions.length,
          activeSubscription: !!activeSubscription,
          totalOrders: orders.length,
          totalPayments: payments.filter(p => p.status === 'RECEIVED').length,
          totalRevenue: totalPayments,
          averagePaymentValue: parseFloat(averagePaymentValue.toFixed(2)),
          lastPaymentDate: lastPayment?.paymentDate || null,
          openTickets: supportTickets.filter(t => ['OPEN', 'IN_PROGRESS'].includes(t.status)).length
        }
      },
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        status: sub.status,
        planType: sub.planType,
        monthlyValue: sub.monthlyValue,
        startDate: sub.startDate,
        renewalDate: sub.renewalDate,
        paymentMethod: sub.paymentMethod,
        paymentMethodLast4: sub.paymentMethodLast4,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
        lastPaymentDate: sub.lastPaymentDate,
        nextBillingDate: sub.nextBillingDate
      })),
      orders: orders.map(order => ({
        id: order.id,
        orderDate: order.orderDate,
        shippingDate: order.shippingDate,
        deliveryStatus: order.deliveryStatus,
        trackingCode: order.trackingCode,
        totalAmount: order.totalAmount,
        type: order.type,
        estimatedDelivery: order.estimatedDelivery,
        deliveredAt: order.deliveredAt,
        createdAt: order.createdAt
      })),
      payments: payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        billingType: payment.billingType,
        dueDate: payment.dueDate,
        paymentDate: payment.paymentDate,
        description: payment.description,
        invoiceUrl: payment.invoiceUrl,
        createdAt: payment.createdAt
      })),
      supportTickets: supportTickets.map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        assignedAgentId: ticket.assignedAgentId,
        createdAt: ticket.createdAt,
        resolvedAt: ticket.resolvedAt
      })),
      consentLogs: consentLogs.map(log => ({
        id: log.id,
        consentType: log.consentType,
        status: log.status,
        timestamp: log.timestamp,
        ipAddress: log.ipAddress,
        expiresAt: log.expiresAt
      }))
    }
    return createSuccessResponse(customerDetail, 'Detalhes do cliente obtidos com sucesso')
  } catch (error) {
    console.error('Customer detail error:', error)
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
 * PUT /api/admin/customers/[id]
 * Atualizar dados do cliente
 *
 * Atualiza informações básicas do cliente
 */
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('customers:update')(request)
    if (error) {
      return error
    }
    const customerId = params.id
    if (!customerId) {
      return NextResponse.json(
        {
          error: 'INVALID_ID',
          message: 'ID do cliente é obrigatório'
        },
        { status: 400 }
      )
    }
    // Validar body
    const body = await request.json()
    const { data: updateData, error: validationError } = validateBody(customerUpdateSchema, body)
    if (validationError) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Campo inválido: ${validationError.field} - ${validationError.message}`
        },
        { status: 400 }
      )
    }
    // Verificar se cliente existe
    const existingCustomer = await prisma.user.findUnique({
      where: { id: customerId }
    })
    if (!existingCustomer) {
      return NextResponse.json(
        {
          error: 'CUSTOMER_NOT_FOUND',
          message: 'Cliente não encontrado'
        },
        { status: 404 }
      )
    }
    // Verificar se email já existe (se estiver sendo atualizado)
    if (updateData.email && updateData.email !== existingCustomer.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updateData.email.toLowerCase() }
      })
      if (emailExists) {
        return NextResponse.json(
          {
            error: 'EMAIL_ALREADY_EXISTS',
            message: 'Email já está em uso'
          },
          { status: 409 }
        )
      }
    }
    // Atualizar cliente
    const updatedCustomer = await prisma.user.update({
      where: { id: customerId },
      data: {
        ...(updateData.email && { email: updateData.email.toLowerCase() }),
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.phone !== undefined && { phone: updateData.phone }),
        ...(updateData.whatsapp !== undefined && { whatsapp: updateData.whatsapp }),
        ...(updateData.role && { role: updateData.role }),
        ...(updateData.metadata && { metadata: updateData.metadata })
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        whatsapp: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      }
    })
    return createSuccessResponse(updatedCustomer, 'Cliente atualizado com sucesso')
  } catch (error) {
    console.error('Customer update error:', error)
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
 * DELETE /api/admin/customers/[id]
 * Excluir cliente (soft delete)
 *
 * Marca cliente como inativo em vez de excluir permanentemente
 */
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('customers:delete')(request)
    if (error) {
      return error
    }
    const customerId = params.id
    if (!customerId) {
      return NextResponse.json(
        {
          error: 'INVALID_ID',
          message: 'ID do cliente é obrigatório'
        },
        { status: 400 }
      )
    }
    // Verificar se cliente existe
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' }
        }
      }
    })
    if (!customer) {
      return NextResponse.json(
        {
          error: 'CUSTOMER_NOT_FOUND',
          message: 'Cliente não encontrado'
        },
        { status: 404 }
      )
    }
    // Verificar se cliente tem assinaturas ativas
    if (customer.subscriptions.length > 0) {
      return NextResponse.json(
        {
          error: 'HAS_ACTIVE_SUBSCRIPTIONS',
          message: 'Cliente possui assinaturas ativas e não pode ser excluído'
        },
        { status: 409 }
      )
    }
    // Soft delete - mudar role para 'inactive'
    const deletedCustomer = await prisma.user.update({
      where: { id: customerId },
      data: {
        role: 'inactive',
        email: `deleted_${Date.now()}_${customer.email}` // Prevenir conflito de email
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true
      }
    })
    return createSuccessResponse(deletedCustomer, 'Cliente excluído com sucesso')
  } catch (error) {
    console.error('Customer delete error:', error)
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
// Função auxiliar de validação
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