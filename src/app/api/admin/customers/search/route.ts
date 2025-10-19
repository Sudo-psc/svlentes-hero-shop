/**
 * GET /api/admin/customers/search
 * Busca avançada de clientes
 *
 * Realiza busca detalhada nos dados dos clientes com múltiplos critérios
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createSuccessResponse } from '@/lib/admin-auth'

/**
 * @swagger
 * /api/admin/customers/search:
 *   get:
 *     summary: Buscar clientes
 *     description: Realiza busca avançada nos dados dos clientes
 *     tags:
 *       - Clientes Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Termo de busca
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *           enum: [name,email,phone,whatsapp,all]
 *           default: all
 *         description: Campos para buscar
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Número máximo de resultados
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir clientes inativos
 *       - in: query
 *         name: subscriptionStatus
 *         schema:
 *           type: string
 *           enum: [ACTIVE,OVERDUE,SUSPENDED,PAUSED,CANCELLED]
 *         description: Filtrar por status da assinatura
 *     responses:
 *       200:
 *         description: Busca realizada com sucesso
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
 *                     total:
 *                       type: integer
 *                       example: 15
 *                     searchInfo:
 *                       type: object
 *                       properties:
 *                         query:
 *                           type: string
 *                           example: "joão"
 *                         fields:
 *                           type: array
 *                           items:
 *                             type: string
 *                         took:
 *                           type: integer
 *                           description: Tempo de busca em ms
 *       400:
 *         description: Parâmetros inválidos
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
    const { user, error } = await requirePermission('customers:search')(request)

    if (error) {
      return error
    }

    const startTime = Date.now()
    const { searchParams } = new URL(request.url)

    // Extrair e validar parâmetros
    const query = searchParams.get('q')
    const fields = searchParams.get('fields') || 'all'
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const subscriptionStatus = searchParams.get('subscriptionStatus')

    if (!query || query.length < 2) {
      return NextResponse.json(
        {
          error: 'INVALID_QUERY',
          message: 'Termo de busca deve ter pelo menos 2 caracteres'
        },
        { status: 400 }
      )
    }

    // Construir filtros where
    const where: any = {
      role: includeInactive ? 'subscriber' : 'subscriber'
    }

    // Se não for para incluir inativos, filtrar apenas subscribers ativos
    if (!includeInactive) {
      where.role = 'subscriber'
    }

    // Construir condição de busca baseado nos campos
    const searchConditions: any[] = []

    if (fields === 'all' || fields.includes('name')) {
      searchConditions.push({
        name: { contains: query, mode: 'insensitive' }
      })
    }

    if (fields === 'all' || fields.includes('email')) {
      searchConditions.push({
        email: { contains: query, mode: 'insensitive' }
      })
    }

    if (fields === 'all' || fields.includes('phone')) {
      searchConditions.push({
        phone: { contains: query }
      })
    }

    if (fields === 'all' || fields.includes('whatsapp')) {
      searchConditions.push({
        whatsapp: { contains: query }
      })
    }

    if (searchConditions.length > 0) {
      where.OR = searchConditions
    }

    // Buscar clientes
    const customers = await prisma.user.findMany({
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
        }
      },
      orderBy: [
        { lastLoginAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    })

    // Filtrar por status da assinatura se especificado
    let filteredCustomers = customers
    if (subscriptionStatus) {
      filteredCustomers = customers.filter(customer => {
        return customer.subscriptions.some(sub => sub.status === subscriptionStatus)
      })
    }

    // Processar e enriquecer dados
    const processedCustomers = filteredCustomers.map(customer => {
      const subscription = customer.subscriptions[0]

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

      // Destacar partes do texto que correspondem à busca
      const highlightMatch = (text: string | null) => {
        if (!text) return null
        const regex = new RegExp(`(${query})`, 'gi')
        return text.replace(regex, '<mark>$1</mark>')
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
          lastPaymentDate: subscription.lastPaymentDate
        } : null,
        highlights: {
          name: highlightMatch(customer.name),
          email: highlightMatch(customer.email),
          phone: highlightMatch(customer.phone),
          whatsapp: highlightMatch(customer.whatsapp)
        }
      }
    })

    const endTime = Date.now()
    const searchTime = endTime - startTime

    // Calcular scores de relevância
    const scoredCustomers = processedCustomers.map(customer => {
      let score = 0

      // Pontuar por matches exatos
      if (customer.name?.toLowerCase() === query.toLowerCase()) score += 100
      if (customer.email?.toLowerCase() === query.toLowerCase()) score += 90
      if (customer.phone === query) score += 80
      if (customer.whatsapp === query) score += 80

      // Pontuar por matches parciais
      if (customer.name?.toLowerCase().includes(query.toLowerCase())) score += 50
      if (customer.email?.toLowerCase().includes(query.toLowerCase())) score += 40

      // Bônus para clientes ativos
      if (customer.status === 'active') score += 10

      return { ...customer, score }
    })

    // Ordenar por relevância
    scoredCustomers.sort((a, b) => b.score - a.score)

    return createSuccessResponse({
      customers: scoredCustomers,
      total: scoredCustomers.length,
      searchInfo: {
        query,
        fields: fields === 'all' ? ['name', 'email', 'phone', 'whatsapp'] : [fields],
        limit,
        includeInactive,
        subscriptionStatus,
        took: searchTime,
        hasMore: filteredCustomers.length >= limit
      }
    }, 'Busca realizada com sucesso')

  } catch (error) {
    console.error('Customer search error:', error)
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
 * POST /api/admin/customers/search
 * Busca avançada com filtros complexos
 *
 * Permite busca com múltiplos critérios avançados
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('customers:search')(request)

    if (error) {
      return error
    }

    const startTime = Date.now()
    const body = await request.json()

    // Validar body da requisição
    const { error: validationError, data: searchData } = validateAdvancedSearchBody(body)

    if (validationError) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: validationError.message
        },
        { status: 400 }
      )
    }

    // Construir filtros complexos
    const where: any = {
      role: 'subscriber'
    }

    // Filtros de texto
    if (searchData.text?.query) {
      const textConditions: any[] = []
      const fields = searchData.text.fields || ['name', 'email']

      if (fields.includes('name')) {
        textConditions.push({
          name: { contains: searchData.text.query, mode: 'insensitive' }
        })
      }
      if (fields.includes('email')) {
        textConditions.push({
          email: { contains: searchData.text.query, mode: 'insensitive' }
        })
      }
      if (fields.includes('phone')) {
        textConditions.push({
          phone: { contains: searchData.text.query }
        })
      }
      if (fields.includes('whatsapp')) {
        textConditions.push({
          whatsapp: { contains: searchData.text.query }
        })
      }

      if (textConditions.length > 0) {
        where.OR = textConditions
      }
    }

    // Filtros de data
    if (searchData.dateRange) {
      const dateFilter: any = {}
      if (searchData.dateRange.start) {
        dateFilter.gte = new Date(searchData.dateRange.start)
      }
      if (searchData.dateRange.end) {
        dateFilter.lte = new Date(searchData.dateRange.end)
      }
      if (Object.keys(dateFilter).length > 0) {
        where.createdAt = dateFilter
      }
    }

    // Filtros de assinatura
    if (searchData.subscription) {
      // Adicionar lógica para filtrar por status da assinatura
      // Isso pode requerer uma query mais complexa com include
    }

    // Executar busca
    const customers = await prisma.user.findMany({
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
        }
      },
      orderBy: searchData.sortBy || [
        { lastLoginAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: Math.min(100, searchData.limit || 20)
    })

    // Processar resultados
    const processedCustomers = customers.map(customer => {
      const subscription = customer.subscriptions[0]
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
          lastPaymentDate: subscription.lastPaymentDate
        } : null
      }
    })

    const endTime = Date.now()

    return createSuccessResponse({
      customers: processedCustomers,
      total: processedCustomers.length,
      searchInfo: {
        filters: searchData,
        took: endTime - startTime
      }
    }, 'Busca avançada realizada com sucesso')

  } catch (error) {
    console.error('Advanced customer search error:', error)
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
function validateAdvancedSearchBody(body: any): {
  data?: any
  error?: { message: string }
} {
  try {
    // Schema básico para validação
    const schema = {
      text: {
        query: { type: 'string', minLength: 2 },
        fields: {
          type: 'array',
          items: { type: 'string', enum: ['name', 'email', 'phone', 'whatsapp'] }
        }
      },
      dateRange: {
        start: { type: 'string', format: 'date-time' },
        end: { type: 'string', format: 'date-time' }
      },
      subscription: {
        status: { type: 'string' },
        planType: { type: 'string' }
      },
      sortBy: { type: 'string' },
      limit: { type: 'number', minimum: 1, maximum: 100 }
    }

    // Validação básica
    if (!body || typeof body !== 'object') {
      return { error: { message: 'Corpo da requisição inválido' } }
    }

    if (body.text && !body.text.query) {
      return { error: { message: 'Query de texto é obrigatória quando filtro de texto é usado' } }
    }

    if (body.text && body.text.query && body.text.query.length < 2) {
      return { error: { message: 'Query de texto deve ter pelo menos 2 caracteres' } }
    }

    return { data: body }
  } catch (error) {
    return { error: { message: 'Erro na validação dos dados de busca' } }
  }
}