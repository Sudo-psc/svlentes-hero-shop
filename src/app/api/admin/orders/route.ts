/**
 * GET /api/admin/orders
 * Listagem de pedidos com paginação e filtros
 *
 * Retorna lista paginada de pedidos do sistema
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createSuccessResponse, validatePagination } from '@/lib/admin-auth'
import { orderFiltersSchema, orderCreateSchema } from '@/lib/admin-validations'

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Listar pedidos
 *     description: Retorna lista paginada de pedidos com filtros avançados
 *     tags:
 *       - Pedidos Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Itens por página
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Campo de ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Direção da ordenação
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SHIPPED, IN_TRANSIT, DELIVERED, CANCELLED]
 *         description: Filtro por status do pedido
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [subscription, one_time]
 *         description: Filtro por tipo de pedido
 *       - in: query
 *         name: subscriptionId
 *         schema:
 *           type: string
 *         description: Filtro por ID da assinatura
 *       - in: query
 *         name: createdAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filtro por data de criação posterior
 *       - in: query
 *         name: createdBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filtro por data de criação anterior
 *       - in: query
 *         name: deliveredAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filtro por data de entrega posterior
 *       - in: query
 *         name: deliveredBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filtro por data de entrega anterior
 *       - in: query
 *         name: hasTrackingCode
 *         schema:
 *           type: string
 *           enum: [yes, no, all]
 *           default: all
 *         description: Filtro por presença de código de rastreio
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por cliente ou identificador
 *     responses:
 *       200:
 *         description: Pedidos listados com sucesso
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
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         byStatus:
 *                           type: object
 *                           additionalProperties:
 *                             type: integer
 *                         totalValue:
 *                           type: number
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('orders:view')(request)

    if (error) {
      return error
    }

    // Validar parâmetros
    const { searchParams } = new URL(request.url)
    const { data: params, error: validationError } = validateQuery(
      orderFiltersSchema,
      searchParams
    )

    if (validationError) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Parâmetro inválido: ${validationError.field} - ${validationError.message}`
        },
        { status: 400 }
      )
    }

    // Validação de paginação
    const pagination = validatePagination(params)

    // Construir filtros where
    const where: any = {}

    // Filtro de busca
    if (searchParams.get('search')) {
      const searchTerm = searchParams.get('search')!
      where.OR = [
        { trackingCode: { contains: searchTerm } },
        { id: { contains: searchTerm } },
        { subscription: { user: { name: { contains: searchTerm, mode: 'insensitive' } } } },
        { subscription: { user: { email: { contains: searchTerm, mode: 'insensitive' } } } }
      ]
    }

    // Filtros específicos
    if (params.status) {
      where.deliveryStatus = params.status
    }

    if (params.type) {
      where.type = params.type
    }

    if (params.subscriptionId) {
      where.subscriptionId = params.subscriptionId
    }

    // Filtro por código de rastreio
    if (params.hasTrackingCode !== 'all') {
      if (params.hasTrackingCode === 'yes') {
        where.trackingCode = { not: null }
      } else {
        where.trackingCode = null
      }
    }

    // Filtros de data de criação
    if (params.createdAfter || params.createdBefore) {
      where.createdAt = {}
      if (params.createdAfter) {
        where.createdAt.gte = new Date(params.createdAfter)
      }
      if (params.createdBefore) {
        where.createdAt.lte = new Date(params.createdBefore)
      }
    }

    // Filtros de data de entrega
    if (params.deliveredAfter || params.deliveredBefore) {
      where.deliveredAt = {}
      if (params.deliveredAfter) {
        where.deliveredAt.gte = new Date(params.deliveredAfter)
      }
      if (params.deliveredBefore) {
        where.deliveredAt.lte = new Date(params.deliveredBefore)
      }
    }

    // Buscar pedidos e contagem total em paralelo
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
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
              holderName: true
            }
          },
          invoices: {
            select: {
              id: true,
              status: true,
              amount: true,
              dueDate: true,
              paidAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: {
          [pagination.sortBy]: pagination.sortOrder
        },
        skip: pagination.offset,
        take: pagination.limit
      }),

      prisma.order.count({ where })
    ])

    // Processar dados adicionais
    const processedOrders = orders.map(order => {
      const lastInvoice = order.invoices[0]

      // Calcular tempo de entrega
      let deliveryTime = null
      if (order.shippingDate && order.deliveredAt) {
        deliveryTime = Math.ceil(
          (new Date(order.deliveredAt).getTime() - new Date(order.shippingDate).getTime()) /
          (1000 * 60 * 60 * 24)
        )
      }

      // Status para UI
      const statusInfo = {
        current: order.deliveryStatus,
        isPending: order.deliveryStatus === 'PENDING',
        isShipped: ['SHIPPED', 'IN_TRANSIT'].includes(order.deliveryStatus),
        isDelivered: order.deliveryStatus === 'DELIVERED',
        isCancelled: order.deliveryStatus === 'CANCELLED',
        hasTracking: !!order.trackingCode,
        deliveryTime
      }

      return {
        id: order.id,
        orderDate: order.orderDate,
        shippingDate: order.shippingDate,
        deliveryStatus: statusInfo,
        trackingCode: order.trackingCode,
        totalAmount: order.totalAmount,
        type: order.type,
        paymentStatus: order.paymentStatus,
        estimatedDelivery: order.estimatedDelivery,
        deliveredAt: order.deliveredAt,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        subscription: {
          id: order.subscription.id,
          planType: order.subscription.planType,
          status: order.subscription.status,
          user: order.subscription.user
        },
        paymentMethod: order.paymentMethod,
        lastInvoice: lastInvoice ? {
          id: lastInvoice.id,
          status: lastInvoice.status,
          amount: lastInvoice.amount,
          dueDate: lastInvoice.dueDate,
          paidAt: lastInvoice.paidAt
        } : null,
        metrics: {
          daysSinceCreation: Math.ceil(
            (new Date().getTime() - new Date(order.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
          ),
          deliveryTime,
          isOverdue: order.estimatedDelivery && new Date(order.estimatedDelivery) < new Date() && order.deliveryStatus !== 'DELIVERED'
        }
      }
    })

    // Calcular estatísticas
    const stats = await calculateOrderStats(where)

    // Montar resposta
    const response = {
      orders: processedOrders,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNext: pagination.page * pagination.limit < total,
        hasPrev: pagination.page > 1
      },
      filters: {
        ...params,
        search: searchParams.get('search') || null
      },
      summary: {
        total,
        ...stats
      }
    }

    return createSuccessResponse(response, 'Pedidos listados com sucesso')

  } catch (error) {
    console.error('Orders list error:', error)
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
 * POST /api/admin/orders
 * Criar novo pedido
 *
 * Cria um novo pedido no sistema
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('orders:create')(request)

    if (error) {
      return error
    }

    // Validar body
    const body = await request.json()
    const { data: orderData, error: validationError } = validateBody(orderCreateSchema, body)

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
      where: { id: orderData.subscriptionId },
      select: {
        id: true,
        status: true,
        userId: true
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

    // Verificar se assinatura está ativa
    if (existingSubscription.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          error: 'SUBSCRIPTION_NOT_ACTIVE',
          message: 'Apenas assinaturas ativas podem gerar pedidos'
        },
        { status: 409 }
      )
    }

    // Criar pedido
    const order = await prisma.order.create({
      data: {
        subscriptionId: orderData.subscriptionId,
        orderDate: new Date(),
        products: orderData.products,
        deliveryAddress: orderData.deliveryAddress,
        totalAmount: orderData.totalAmount,
        type: orderData.type || 'subscription',
        paymentStatus: 'pending',
        deliveryStatus: 'PENDING',
        estimatedDelivery: orderData.estimatedDelivery,
        notes: orderData.notes,
        paymentMethodId: orderData.paymentMethodId
      },
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

    // Criar fatura associada
    if (orderData.paymentMethodId) {
      await prisma.invoice.create({
        data: {
          subscriptionId: orderData.subscriptionId,
          orderId: order.id,
          type: orderData.type === 'subscription' ? 'SUBSCRIPTION' : 'ONE_TIME',
          amount: orderData.totalAmount,
          status: 'SENT',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
          items: orderData.products,
          paymentMethodId: orderData.paymentMethodId
        }
      })
    }

    return createSuccessResponse(order, 'Pedido criado com sucesso', 201)

  } catch (error) {
    console.error('Order create error:', error)
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
function validateQuery<T>(schema: any, searchParams: URLSearchParams): {
  data: T | null
  error: { field: string; message: string } | null
} {
  try {
    const params: Record<string, any> = {}
    searchParams.forEach((value, key) => {
      if (key !== 'search') { // Tratar search separadamente
        params[key] = value
      }
    })

    const data = schema.parse(params)
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

async function calculateOrderStats(where: any) {
  try {
    const [
      statusCounts,
      totalValue,
      typeDistribution,
      averageDeliveryTime
    ] = await Promise.all([
      // Contagem por status
      prisma.order.groupBy({
        by: ['deliveryStatus'],
        where,
        _count: {
          id: true
        }
      }),

      // Valor total
      prisma.order.aggregate({
        where,
        _sum: {
          totalAmount: true
        }
      }),

      // Distribuição por tipo
      prisma.order.groupBy({
        by: ['type'],
        where,
        _count: {
          id: true
        },
        _sum: {
          totalAmount: true
        }
      }),

      // Tempo médio de entrega (pedidos entregues)
      prisma.order.findMany({
        where: {
          ...where,
          deliveryStatus: 'DELIVERED',
          shippingDate: { not: null },
          deliveredAt: { not: null }
        },
        select: {
          shippingDate: true,
          deliveredAt: true
        }
      })
    ])

    const byStatus = statusCounts.reduce((acc, item) => {
      acc[item.deliveryStatus] = item._count.id
      return acc
    }, {} as Record<string, number>)

    const deliveryTimes = averageDeliveryTime.map(order => {
      const shippingDate = new Date(order.shippingDate!)
      const deliveredAt = new Date(order.deliveredAt!)
      return Math.ceil((deliveredAt.getTime() - shippingDate.getTime()) / (1000 * 60 * 60 * 24))
    })

    const avgDeliveryTime = deliveryTimes.length > 0
      ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
      : 0

    return {
      byStatus,
      totalValue: Number(totalValue._sum.totalAmount || 0),
      byType: typeDistribution.reduce((acc, item) => {
        acc[item.type] = {
          count: item._count.id,
          value: Number(item._sum.totalAmount || 0)
        }
        return acc
      }, {} as Record<string, { count: number; value: number }>),
      averageDeliveryTime: parseFloat(avgDeliveryTime.toFixed(1)),
      deliveryRate: statusCounts.length > 0
        ? (statusCounts.find(s => s.deliveryStatus === 'DELIVERED')?._count.id || 0) / statusCounts.reduce((sum, s) => sum + s._count.id, 0) * 100
        : 0
    }
  } catch (error) {
    console.error('Error calculating order stats:', error)
    return {
      byStatus: {},
      totalValue: 0,
      byType: {},
      averageDeliveryTime: 0,
      deliveryRate: 0
    }
  }
}