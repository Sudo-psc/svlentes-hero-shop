/**
 * GET /api/admin/customers
 * Listagem de clientes com paginação e filtros
 *
 * Retorna lista paginada de clientes do sistema
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createSuccessResponse, validatePagination } from '@/lib/admin-auth'
import { customerFiltersSchema, customerCreateSchema } from '@/lib/admin-validations'

/**
 * @swagger
 * /api/admin/customers:
 *   get:
 *     summary: Listar clientes
 *     description: Retorna lista paginada de clientes com filtros avançados
 *     tags:
 *       - Clientes Admin
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
 *           enum: [active, inactive, all]
 *           default: all
 *         description: Filtro por status
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filtro por role
 *       - in: query
 *         name: hasSubscription
 *         schema:
 *           type: string
 *           enum: [yes, no, all]
 *           default: all
 *         description: Filtro por ter assinatura ativa
 *       - in: query
 *         name: subscriptionStatus
 *         schema:
 *           type: string
 *           enum: [PENDING_ACTIVATION, ACTIVE, OVERDUE, SUSPENDED, PAUSED, CANCELLED, EXPIRED, REFUNDED, PENDING]
 *         description: Filtro por status da assinatura
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
 *         description: Busca por nome ou email
 *     responses:
 *       200:
 *         description: Clientes listados com sucesso
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
 *                     customers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Customer'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                     filters:
 *                       type: object
 *                       description: Filtros aplicados
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
    const { user, error } = await requirePermission('customers:view')(request)

    if (error) {
      return error
    }

    // Validar parâmetros
    const { searchParams } = new URL(request.url)
    const { data: params, error: validationError } = validateQuery(
      customerFiltersSchema,
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
    const where: any = {
      role: 'subscriber'
    }

    // Filtro de busca
    if (searchParams.get('search')) {
      const searchTerm = searchParams.get('search')!
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm } },
        { whatsapp: { contains: searchTerm } }
      ]
    }

    // Filtro de role
    if (params.role) {
      where.role = params.role
    }

    // Filtros de data
    if (params.createdAfter) {
      where.createdAt = { gte: new Date(params.createdAfter) }
    }
    if (params.createdBefore) {
      where.createdAt = { ...where.createdAt, lte: new Date(params.createdBefore) }
    }

    // Buscar clientes e contagem total em paralelo
    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          whatsapp: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          subscriptions: {
            select: {
              id: true,
              status: true,
              planType: true,
              monthlyValue: true,
              createdAt: true,
              lastPaymentDate: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          },
          supportTickets: {
            select: {
              id: true,
              status: true,
              priority: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentDate: true
            },
            orderBy: {
              paymentDate: 'desc'
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

      prisma.user.count({ where })
    ])

    // Processar dados adicionais
    const processedCustomers = customers.map(customer => {
      const subscription = customer.subscriptions[0]
      const lastTicket = customer.supportTickets[0]
      const lastPayment = customer.payments[0]

      // Determinar status do cliente
      let customerStatus = 'inactive'
      if (subscription) {
        if (subscription.status === 'ACTIVE') {
          customerStatus = 'active'
        } else if (['OVERDUE', 'SUSPENDED'].includes(subscription.status)) {
          customerStatus = 'overdue'
        } else if (subscription.status === 'PAUSED') {
          customerStatus = 'paused'
        }
      }

      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        whatsapp: customer.whatsapp,
        role: customer.role,
        status: customerStatus,
        createdAt: customer.createdAt,
        lastLoginAt: customer.lastLoginAt,
        subscription: subscription ? {
          id: subscription.id,
          status: subscription.status,
          planType: subscription.planType,
          monthlyValue: subscription.monthlyValue,
          createdAt: subscription.createdAt,
          lastPaymentDate: subscription.lastPaymentDate
        } : null,
        lastActivity: {
          ticket: lastTicket ? {
            id: lastTicket.id,
            status: lastTicket.status,
            priority: lastTicket.priority,
            createdAt: lastTicket.createdAt
          } : null,
          payment: lastPayment ? {
            id: lastPayment.id,
            amount: lastPayment.amount,
            status: lastPayment.status,
            paymentDate: lastPayment.paymentDate
          } : null
        }
      }
    })

    // Aplicar filtros adicionais no cliente (que precisam dos dados processados)
    let filteredCustomers = processedCustomers

    // Filtro por status do cliente
    if (params.status !== 'all') {
      filteredCustomers = filteredCustomers.filter(customer => {
        switch (params.status) {
          case 'active':
            return customer.status === 'active'
          case 'inactive':
            return customer.status !== 'active'
          default:
            return true
        }
      })
    }

    // Filtro por ter assinatura
    if (params.hasSubscription !== 'all') {
      filteredCustomers = filteredCustomers.filter(customer => {
        return params.hasSubscription === 'yes' ? !!customer.subscription : !customer.subscription
      })
    }

    // Filtro por status da assinatura
    if (params.subscriptionStatus) {
      filteredCustomers = filteredCustomers.filter(customer => {
        return customer.subscription?.status === params.subscriptionStatus
      })
    }

    // Recalcular paginação após filtros
    const filteredTotal = filteredCustomers.length
    const finalCustomers = filteredCustomers.slice(pagination.offset, pagination.offset + pagination.limit)

    // Montar resposta
    const response = {
      customers: finalCustomers,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / pagination.limit),
        hasNext: pagination.page * pagination.limit < filteredTotal,
        hasPrev: pagination.page > 1
      },
      filters: {
        ...params,
        search: searchParams.get('search') || null
      },
      summary: {
        totalCustomers: filteredTotal,
        activeCustomers: filteredCustomers.filter(c => c.status === 'active').length,
        customersWithSubscription: filteredCustomers.filter(c => c.subscription).length
      }
    }

    return createSuccessResponse(response, 'Clientes listados com sucesso')

  } catch (error) {
    console.error('Customers list error:', error)
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
 * POST /api/admin/customers
 * Criar novo cliente
 *
 * Cria um novo cliente no sistema
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('customers:create')(request)

    if (error) {
      return error
    }

    // Validar body
    const body = await request.json()
    const { data: customerData, error: validationError } = validateBody(customerCreateSchema, body)

    if (validationError) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Campo inválido: ${validationError.field} - ${validationError.message}`
        },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: customerData.email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'EMAIL_ALREADY_EXISTS',
          message: 'Email já está em uso'
        },
        { status: 409 }
      )
    }

    // Criar cliente
    const customer = await prisma.user.create({
      data: {
        email: customerData.email.toLowerCase(),
        name: customerData.name,
        phone: customerData.phone,
        whatsapp: customerData.whatsapp,
        role: customerData.role || 'subscriber',
        metadata: customerData.metadata || {}
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        whatsapp: true,
        role: true,
        createdAt: true,
        lastLoginAt: true
      }
    })

    return createSuccessResponse(customer, 'Cliente criado com sucesso', 201)

  } catch (error) {
    console.error('Customer create error:', error)
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