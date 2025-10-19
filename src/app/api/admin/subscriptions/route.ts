/**
 * GET /api/admin/subscriptions
 * Listagem de assinaturas com paginação e filtros
 *
 * Retorna lista paginada de assinaturas do sistema
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createSuccessResponse, validatePagination } from '@/lib/admin-auth'
import { subscriptionFiltersSchema, subscriptionCreateSchema } from '@/lib/admin-validations'

/**
 * @swagger
 * /api/admin/subscriptions:
 *   get:
 *     summary: Listar assinaturas
 *     description: Retorna lista paginada de assinaturas com filtros avançados
 *     tags:
 *       - Assinaturas Admin
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
 *           enum: [PENDING_ACTIVATION, ACTIVE, OVERDUE, SUSPENDED, PAUSED, CANCELLED, EXPIRED, REFUNDED, PENDING]
 *         description: Filtro por status da assinatura
 *       - in: query
 *         name: planType
 *         schema:
 *           type: string
 *         description: Filtro por tipo de plano
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [CREDIT_CARD, DEBIT_CARD, PIX, BOLETO]
 *         description: Filtro por método de pagamento
 *       - in: query
 *         name: minMonthlyValue
 *         schema:
 *           type: number
 *         description: Valor mensal mínimo
 *       - in: query
 *         name: maxMonthlyValue
 *         schema:
 *           type: number
 *         description: Valor mensal máximo
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por cliente ou identificador
 *     responses:
 *       200:
 *         description: Assinaturas listadas com sucesso
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
 *                     subscriptions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Subscription'
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
 *                         mrr:
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
    const { user, error } = await requirePermission('subscriptions:view')(request)

    if (error) {
      return error
    }

    // Validar parâmetros
    const { searchParams } = new URL(request.url)
    const { data: params, error: validationError } = validateQuery(
      subscriptionFiltersSchema,
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
        { asaasSubscriptionId: { contains: searchTerm } },
        { planType: { contains: searchTerm, mode: 'insensitive' } },
        { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { user: { email: { contains: searchTerm, mode: 'insensitive' } } }
      ]
    }

    // Filtros específicos
    if (params.status) {
      where.status = params.status
    }

    if (params.planType) {
      where.planType = { contains: params.planType, mode: 'insensitive' }
    }

    if (params.paymentMethod) {
      where.paymentMethod = params.paymentMethod
    }

    // Filtros de valor
    if (params.minMonthlyValue || params.maxMonthlyValue) {
      where.monthlyValue = {}
      if (params.minMonthlyValue) {
        where.monthlyValue.gte = params.minMonthlyValue
      }
      if (params.maxMonthlyValue) {
        where.monthlyValue.lte = params.maxMonthlyValue
      }
    }

    // Filtros de data
    if (params.createdAfter || params.createdBefore) {
      where.createdAt = {}
      if (params.createdAfter) {
        where.createdAt.gte = new Date(params.createdAfter)
      }
      if (params.createdBefore) {
        where.createdAt.lte = new Date(params.createdBefore)
      }
    }

    // Filtros de data de cobrança
    if (params.nextBillingAfter || params.nextBillingBefore) {
      where.nextBillingDate = {}
      if (params.nextBillingAfter) {
        where.nextBillingDate.gte = new Date(params.nextBillingAfter)
      }
      if (params.nextBillingBefore) {
        where.nextBillingDate.lte = new Date(params.nextBillingBefore)
      }
    }

    // Filtro de dias em atraso
    if (params.overdueDays !== undefined) {
      where.daysOverdue = { gte: params.overdueDays }
    }

    // Buscar assinaturas e contagem total em paralelo
    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
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
            select: {
              id: true,
              amount: true,
              status: true,
              paymentDate: true,
              dueDate: true
            },
            orderBy: {
              paymentDate: 'desc'
            },
            take: 1
          },
          orders: {
            select: {
              id: true,
              deliveryStatus: true,
              orderDate: true,
              trackingCode: true
            },
            orderBy: {
              orderDate: 'desc'
            },
            take: 1
          },
          _count: {
            select: {
              payments: true,
              orders: true
            }
          }
        },
        orderBy: {
          [pagination.sortBy]: pagination.sortOrder
        },
        skip: pagination.offset,
        take: pagination.limit
      }),

      prisma.subscription.count({ where })
    ])

    // Processar dados adicionais
    const processedSubscriptions = subscriptions.map(subscription => {
      const lastPayment = subscription.payments[0]
      const lastOrder = subscription.orders[0]

      // Calcular métricas
      const totalPayments = subscription._count.payments
      const totalOrders = subscription._count.orders
      const overdueDays = subscription.daysOverdue || 0

      // Status para UI
      const statusInfo = {
        current: subscription.status,
        overdueDays,
        isOverdue: subscription.status === 'OVERDUE',
        isSuspended: subscription.status === 'SUSPENDED',
        isPaused: subscription.status === 'PAUSED',
        isCancelled: subscription.status === 'CANCELLED'
      }

      return {
        id: subscription.id,
        asaasSubscriptionId: subscription.asaasSubscriptionId,
        planType: subscription.planType,
        status: statusInfo,
        monthlyValue: subscription.monthlyValue,
        renewalDate: subscription.renewalDate,
        startDate: subscription.startDate,
        paymentMethod: subscription.paymentMethod,
        paymentMethodLast4: subscription.paymentMethodLast4,
        lastPaymentDate: subscription.lastPaymentDate,
        nextBillingDate: subscription.nextBillingDate,
        overdueDate: subscription.overdueDate,
        daysOverdue: overdueDays,
        suspendedDate: subscription.suspendedDate,
        refundedDate: subscription.refundedDate,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
        user: subscription.user,
        metrics: {
          totalPayments,
          totalOrders,
          averagePaymentValue: lastPayment ? Number(lastPayment.amount) : 0,
          lastPaymentStatus: lastPayment?.status || null,
          lastPaymentDate: lastPayment?.paymentDate || null,
          lastOrderStatus: lastOrder?.deliveryStatus || null,
          lastOrderDate: lastOrder?.orderDate || null
        }
      }
    })

    // Calcular estatísticas
    const stats = await calculateSubscriptionStats(where)

    // Montar resposta
    const response = {
      subscriptions: processedSubscriptions,
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

    return createSuccessResponse(response, 'Assinaturas listadas com sucesso')

  } catch (error) {
    console.error('Subscriptions list error:', error)
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
 * POST /api/admin/subscriptions
 * Criar nova assinatura
 *
 * Cria uma nova assinatura no sistema
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('subscriptions:create')(request)

    if (error) {
      return error
    }

    // Validar body
    const body = await request.json()
    const { data: subscriptionData, error: validationError } = validateBody(subscriptionCreateSchema, body)

    if (validationError) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Campo inválido: ${validationError.field} - ${validationError.message}`
        },
        { status: 400 }
      )
    }

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: subscriptionData.userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        {
          error: 'USER_NOT_FOUND',
          message: 'Usuário não encontrado'
        },
        { status: 404 }
      )
    }

    // Verificar se usuário já tem assinatura ativa
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: subscriptionData.userId,
        status: 'ACTIVE'
      }
    })

    if (activeSubscription) {
      return NextResponse.json(
        {
          error: 'ACTIVE_SUBSCRIPTION_EXISTS',
          message: 'Usuário já possui uma assinatura ativa'
        },
        { status: 409 }
      )
    }

    // Criar assinatura
    const subscription = await prisma.subscription.create({
      data: {
        userId: subscriptionData.userId,
        planType: subscriptionData.planType,
        monthlyValue: subscriptionData.monthlyValue,
        paymentMethod: subscriptionData.paymentMethod,
        shippingAddress: subscriptionData.shippingAddress,
        lensType: subscriptionData.lensType,
        bothEyes: subscriptionData.bothEyes,
        differentGrades: subscriptionData.differentGrades,
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias a partir de agora
        startDate: new Date(),
        status: 'PENDING_ACTIVATION',
        metadata: subscriptionData.metadata || {}
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

    return createSuccessResponse(subscription, 'Assinatura criada com sucesso', 201)

  } catch (error) {
    console.error('Subscription create error:', error)
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

async function calculateSubscriptionStats(where: any) {
  try {
    const [
      statusCounts,
      totalMRR,
      overdueCount,
      newThisMonth,
      cancelledThisMonth
    ] = await Promise.all([
      // Contagem por status
      prisma.subscription.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true
        }
      }),

      // MRR total
      prisma.subscription.aggregate({
        where: {
          ...where,
          status: 'ACTIVE'
        },
        _sum: {
          monthlyValue: true
        }
      }),

      // Contagem de atrasadas
      prisma.subscription.count({
        where: {
          ...where,
          status: 'OVERDUE'
        }
      }),

      // Novas este mês
      prisma.subscription.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),

      // Canceladas este mês
      prisma.subscription.count({
        where: {
          ...where,
          status: 'CANCELLED',
          updatedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ])

    const byStatus = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    return {
      byStatus,
      mrr: Number(totalMRR._sum.monthlyValue || 0),
      overdueCount,
      newThisMonth,
      cancelledThisMonth
    }
  } catch (error) {
    console.error('Error calculating subscription stats:', error)
    return {
      byStatus: {},
      mrr: 0,
      overdueCount: 0,
      newThisMonth: 0,
      cancelledThisMonth: 0
    }
  }
}