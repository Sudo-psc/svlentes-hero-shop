/**
 * GET /api/admin/support/tickets
 * Listagem de tickets de suporte
 *
 * Retorna lista paginada de tickets de suporte com filtros avançados
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createSuccessResponse, validatePagination } from '@/lib/admin-auth'
import { supportTicketFiltersSchema, supportTicketCreateSchema } from '@/lib/admin-validations'

/**
 * @swagger
 * /api/admin/support/tickets:
 *   get:
 *     summary: Listar tickets de suporte
 *     description: Retorna lista paginada de tickets de suporte com filtros avançados
 *     tags:
 *       - Suporte Admin
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
 *           enum: [OPEN, IN_PROGRESS, PENDING_CUSTOMER, PENDING_AGENT, RESOLVED, CLOSED, ESCALATED]
 *         description: Filtro por status do ticket
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [BILLING, TECHNICAL, PRODUCT, DELIVERY, ACCOUNT, COMPLAINT, COMPLIMENT, EMERGENCY, GENERAL]
 *         description: Filtro por categoria
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT, CRITICAL]
 *         description: Filtro por prioridade
 *       - in: query
 *         name: assignedAgentId
 *         schema:
 *           type: string
 *         description: Filtro por agente atribuído
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filtro por ID do usuário
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
 *         name: resolvedAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filtro por data de resolução posterior
 *       - in: query
 *         name: resolvedBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filtro por data de resolução anterior
 *       - in: query
 *         name: hasSlaBreach
 *         schema:
 *           type: string
 *           enum: [yes, no, all]
 *           default: all
 *         description: Filtro por violação de SLA
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por assunto, ticket number ou cliente
 *     responses:
 *       200:
 *         description: Tickets listados com sucesso
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
 *                     tickets:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SupportTicket'
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
 *                         byPriority:
 *                           type: object
 *                           additionalProperties:
 *                             type: integer
 *                         byCategory:
 *                           type: object
 *                           additionalProperties:
 *                             type: integer
 *                         averageResolutionTime:
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
    const { user, error } = await requirePermission('support:view')(request)

    if (error) {
      return error
    }

    // Validar parâmetros
    const { searchParams } = new URL(request.url)
    const { data: params, error: validationError } = validateQuery(
      supportTicketFiltersSchema,
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
        { ticketNumber: { contains: searchTerm, mode: 'insensitive' } },
        { subject: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { user: { email: { contains: searchTerm, mode: 'insensitive' } } }
      ]
    }

    // Filtros específicos
    if (params.status) {
      where.status = params.status
    }

    if (params.category) {
      where.category = params.category
    }

    if (params.priority) {
      where.priority = params.priority
    }

    if (params.assignedAgentId) {
      where.assignedAgentId = params.assignedAgentId
    }

    if (params.userId) {
      where.userId = params.userId
    }

    // Filtro por violação de SLA
    if (params.hasSlaBreach !== 'all') {
      where.slaBreach = params.hasSlaBreach === 'yes'
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

    // Filtros de data de resolução
    if (params.resolvedAfter || params.resolvedBefore) {
      where.resolvedAt = {}
      if (params.resolvedAfter) {
        where.resolvedAt.gte = new Date(params.resolvedAfter)
      }
      if (params.resolvedBefore) {
        where.resolvedAt.lte = new Date(params.resolvedBefore)
      }
    }

    // Buscar tickets e contagem total em paralelo
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
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
          escalation: {
            select: {
              id: true,
              reason: true,
              priority: true,
              assignedAgentId: true,
              status: true
            }
          },
          _count: {
            select: {
              // TODO: Adicionar contagem de interações quando implementado
            }
          }
        },
        orderBy: {
          [pagination.sortBy]: pagination.sortOrder
        },
        skip: pagination.offset,
        take: pagination.limit
      }),

      prisma.supportTicket.count({ where })
    ])

    // Processar dados adicionais
    const processedTickets = tickets.map(ticket => {
      // Calcular tempo de resolução
      let resolutionTime = null
      if (ticket.resolvedAt) {
        resolutionTime = Math.ceil(
          (new Date(ticket.resolvedAt).getTime() - new Date(ticket.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
        )
      }

      // Calcular tempo desde a criação
      const daysSinceCreation = Math.ceil(
        (new Date().getTime() - new Date(ticket.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
      )

      // Verificar se está atrasado baseado no SLA
      const isOverdue = !ticket.resolvedAt && daysSinceCreation > getSLADays(ticket.priority)

      return {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        assignedAgentId: ticket.assignedAgentId,
        source: ticket.source,
        messageId: ticket.messageId,
        intent: ticket.intent,
        tags: ticket.tags,
        slaBreach: ticket.slaBreach || isOverdue,
        estimatedResolution: ticket.estimatedResolution,
        assignedAt: ticket.assignedAt,
        resolvedAt: ticket.resolvedAt,
        customerSatisfaction: ticket.customerSatisfaction,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        user: ticket.user,
        escalation: ticket.escalation,
        metrics: {
          resolutionTime,
          daysSinceCreation,
          isOverdue,
          hasEscalation: !!ticket.escalation
        }
      }
    })

    // Calcular estatísticas
    const stats = await calculateTicketStats(where)

    // Montar resposta
    const response = {
      tickets: processedTickets,
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

    return createSuccessResponse(response, 'Tickets listados com sucesso')

  } catch (error) {
    console.error('Support tickets list error:', error)
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
 * POST /api/admin/support/tickets
 * Criar novo ticket de suporte
 *
 * Cria um novo ticket de suporte no sistema
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('support:create')(request)

    if (error) {
      return error
    }

    // Validar body
    const body = await request.json()
    const { data: ticketData, error: validationError } = validateBody(supportTicketCreateSchema, body)

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
      where: { id: ticketData.userId },
      select: {
        id: true,
        name: true,
        email: true
      }
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

    // Gerar número do ticket
    const ticketNumber = await generateTicketNumber()

    // Criar ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: ticketData.userId,
        subject: ticketData.subject,
        description: ticketData.description,
        category: ticketData.category,
        priority: ticketData.priority || 'MEDIUM',
        customerInfo: ticketData.customerInfo || {},
        tags: ticketData.tags || [],
        context: ticketData.context || {},
        status: 'OPEN',
        source: 'admin_panel'
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

    return createSuccessResponse(ticket, 'Ticket criado com sucesso', 201)

  } catch (error) {
    console.error('Support ticket create error:', error)
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

async function generateTicketNumber(): Promise<string> {
  const prefix = 'SUP'
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')

  return `${prefix}${date}${random}`
}

function getSLADays(priority: string): number {
  const slaDays: Record<string, number> = {
    'LOW': 7,
    'MEDIUM': 3,
    'HIGH': 1,
    'URGENT': 0.5, // 12 horas
    'CRITICAL': 0.25 // 6 horas
  }

  return slaDays[priority] || 3
}

async function calculateTicketStats(where: any) {
  try {
    const [
      statusCounts,
      priorityCounts,
      categoryCounts,
      resolutionTimes,
      escalatedTickets
    ] = await Promise.all([
      // Contagem por status
      prisma.supportTicket.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true
        }
      }),

      // Contagem por prioridade
      prisma.supportTicket.groupBy({
        by: ['priority'],
        where,
        _count: {
          id: true
        }
      }),

      // Contagem por categoria
      prisma.supportTicket.groupBy({
        by: ['category'],
        where,
        _count: {
          id: true
        }
      }),

      // Tempos de resolução
      prisma.supportTicket.findMany({
        where: {
          ...where,
          resolvedAt: { not: null }
        },
        select: {
          createdAt: true,
          resolvedAt: true
        }
      }),

      // Tickets escalados
      prisma.supportTicket.count({
        where: {
          ...where,
          escalationId: { not: null }
        }
      })
    ])

    const byStatus = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    const byPriority = priorityCounts.reduce((acc, item) => {
      acc[item.priority] = item._count.id
      return acc
    }, {} as Record<string, number>)

    const byCategory = categoryCounts.reduce((acc, item) => {
      acc[item.category] = item._count.id
      return acc
    }, {} as Record<string, number>)

    // Calcular tempo médio de resolução
    const resolutionTimesInDays = resolutionTimes.map(ticket => {
      const created = new Date(ticket.createdAt)
      const resolved = new Date(ticket.resolvedAt!)
      return (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    })

    const averageResolutionTime = resolutionTimesInDays.length > 0
      ? resolutionTimesInDays.reduce((sum, time) => sum + time, 0) / resolutionTimesInDays.length
      : 0

    return {
      byStatus,
      byPriority,
      byCategory,
      escalatedTickets,
      averageResolutionTime: parseFloat(averageResolutionTime.toFixed(1)),
      openTickets: byStatus.OPEN || 0,
      resolutionRate: statusCounts.length > 0
        ? ((byStatus.RESOLVED || 0) + (byStatus.CLOSED || 0)) / statusCounts.reduce((sum, s) => sum + s._count.id, 0) * 100
        : 0
    }
  } catch (error) {
    console.error('Error calculating ticket stats:', error)
    return {
      byStatus: {},
      byPriority: {},
      byCategory: {},
      escalatedTickets: 0,
      averageResolutionTime: 0,
      openTickets: 0,
      resolutionRate: 0
    }
  }
}