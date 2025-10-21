/**
 * GET /api/admin/dashboard/analytics
 * Dados analíticos para gráficos do dashboard
 *
 * Retorna dados estruturados para visualizações e gráficos
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createSuccessResponse } from '@/lib/admin-auth'
import { analyticsParamsSchema } from '@/lib/admin-validations'
/**
 * @swagger
 * /api/admin/dashboard/analytics:
 *   get:
 *     summary: Obter dados analíticos
 *     description: Retorna dados estruturados para gráficos e visualizações
 *     tags:
 *       - Dashboard Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [revenue, subscriptions, customers, tickets, orders]
 *           required: true
 *         description: Métrica a ser analisada
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Período de análise
 *       - in: query
 *         name: granularity
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: Granularidade dos dados
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *         description: Campo adicional para agrupamento
 *     responses:
 *       200:
 *         description: Dados analíticos obtidos com sucesso
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
 *                     metric:
 *                       type: string
 *                       example: revenue
 *                     period:
 *                       type: string
 *                       example: 30d
 *                     granularity:
 *                       type: string
 *                       example: day
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                             example: 2024-01-15
 *                           value:
 *                             type: number
 *                             example: 1250.50
 *                           count:
 *                             type: integer
 *                             example: 15
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 45680.50
 *                         average:
 *                           type: number
 *                           example: 1522.68
 *                         trend:
 *                           type: string
 *                           enum: [up, down, stable]
 *                           example: up
 *                         growth:
 *                           type: number
 *                           example: 12.5
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
    const { user, error } = await requirePermission('dashboard:metrics')(request)
    if (error) {
      return error
    }
    // Validar parâmetros
    const { data: params, error: validationError } = validateQuery(
      analyticsParamsSchema,
      new URL(request.url).searchParams
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
    // Calcular período de datas
    const { startDate, endDate } = getDateRange(params.period)
    // Buscar dados baseado na métrica solicitada
    let analyticsData: any
    switch (params.metric) {
      case 'revenue':
        analyticsData = await getRevenueAnalytics(startDate, endDate, params.granularity)
        break
      case 'subscriptions':
        analyticsData = await getSubscriptionsAnalytics(startDate, endDate, params.granularity)
        break
      case 'customers':
        analyticsData = await getCustomersAnalytics(startDate, endDate, params.granularity)
        break
      case 'orders':
        analyticsData = await getOrdersAnalytics(startDate, endDate, params.granularity)
        break
      case 'tickets':
        analyticsData = await getTicketsAnalytics(startDate, endDate, params.granularity)
        break
      default:
        return NextResponse.json(
          {
            error: 'INVALID_METRIC',
            message: 'Métrica inválida. Opções: revenue, subscriptions, customers, orders, tickets'
          },
          { status: 400 }
        )
    }
    return createSuccessResponse(analyticsData, 'Dados analíticos obtidos com sucesso')
  } catch (error) {
    console.error('Analytics error:', error)
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
      params[key] = value
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
function getDateRange(period: string): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  const startDate = new Date()
  switch (period) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7)
      break
    case '30d':
      startDate.setDate(endDate.getDate() - 30)
      break
    case '90d':
      startDate.setDate(endDate.getDate() - 90)
      break
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1)
      break
    default:
      startDate.setDate(endDate.getDate() - 30)
  }
  return { startDate, endDate }
}
// Funções específicas por métrica
async function getRevenueAnalytics(startDate: Date, endDate: Date, granularity: string) {
  // Agrupar pagamentos por data/período
  const payments = await prisma.payment.findMany({
    where: {
      status: 'RECEIVED',
      paymentDate: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      amount: true,
      paymentDate: true,
      billingType: true
    },
    orderBy: {
      paymentDate: 'asc'
    }
  })
  // Agrupar dados por período
  const groupedData = groupByDate(payments, 'paymentDate', granularity, (items) => ({
    value: items.reduce((sum, item) => sum + Number(item.amount), 0),
    count: items.length,
    byType: items.reduce((acc, item) => {
      acc[item.billingType] = (acc[item.billingType] || 0) + Number(item.amount)
      return acc
    }, {} as Record<string, number>)
  }))
  // Calcular tendência e crescimento
  const values = groupedData.map(d => d.value)
  const total = values.reduce((sum, val) => sum + val, 0)
  const average = values.length > 0 ? total / values.length : 0
  const trend = calculateTrend(values)
  const growth = calculateGrowth(values)
  return {
    metric: 'revenue',
    period: getPeriodString(startDate, endDate),
    granularity,
    data: groupedData,
    summary: {
      total: parseFloat(total.toFixed(2)),
      average: parseFloat(average.toFixed(2)),
      trend,
      growth: parseFloat(growth.toFixed(2))
    }
  }
}
async function getSubscriptionsAnalytics(startDate: Date, endDate: Date, granularity: string) {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      id: true,
      createdAt: true,
      status: true,
      planType: true,
      monthlyValue: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })
  // Agrupar dados por período
  const groupedData = groupByDate(subscriptions, 'createdAt', granularity, (items) => ({
    value: items.length,
    count: items.length,
    revenue: items.reduce((sum, item) => sum + Number(item.monthlyValue), 0),
    byStatus: items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byPlan: items.reduce((acc, item) => {
      acc[item.planType] = (acc[item.planType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }))
  const values = groupedData.map(d => d.value)
  const total = values.reduce((sum, val) => sum + val, 0)
  const average = values.length > 0 ? total / values.length : 0
  const trend = calculateTrend(values)
  const growth = calculateGrowth(values)
  return {
    metric: 'subscriptions',
    period: getPeriodString(startDate, endDate),
    granularity,
    data: groupedData,
    summary: {
      total,
      average: parseFloat(average.toFixed(2)),
      trend,
      growth: parseFloat(growth.toFixed(2))
    }
  }
}
async function getCustomersAnalytics(startDate: Date, endDate: Date, granularity: string) {
  const customers = await prisma.user.findMany({
    where: {
      role: 'subscriber',
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      id: true,
      createdAt: true,
      email: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })
  const groupedData = groupByDate(customers, 'createdAt', granularity, (items) => ({
    value: items.length,
    count: items.length,
    customers: items.map(item => ({
      id: item.id,
      email: item.email
    }))
  }))
  const values = groupedData.map(d => d.value)
  const total = values.reduce((sum, val) => sum + val, 0)
  const average = values.length > 0 ? total / values.length : 0
  const trend = calculateTrend(values)
  const growth = calculateGrowth(values)
  return {
    metric: 'customers',
    period: getPeriodString(startDate, endDate),
    granularity,
    data: groupedData,
    summary: {
      total,
      average: parseFloat(average.toFixed(2)),
      trend,
      growth: parseFloat(growth.toFixed(2))
    }
  }
}
async function getOrdersAnalytics(startDate: Date, endDate: Date, granularity: string) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      id: true,
      createdAt: true,
      deliveryStatus: true,
      totalAmount: true,
      type: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })
  const groupedData = groupByDate(orders, 'createdAt', granularity, (items) => ({
    value: items.length,
    count: items.length,
    revenue: items.reduce((sum, item) => sum + Number(item.totalAmount), 0),
    byStatus: items.reduce((acc, item) => {
      acc[item.deliveryStatus] = (acc[item.deliveryStatus] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byType: items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }))
  const values = groupedData.map(d => d.value)
  const total = values.reduce((sum, val) => sum + val, 0)
  const average = values.length > 0 ? total / values.length : 0
  const trend = calculateTrend(values)
  const growth = calculateGrowth(values)
  return {
    metric: 'orders',
    period: getPeriodString(startDate, endDate),
    granularity,
    data: groupedData,
    summary: {
      total,
      average: parseFloat(average.toFixed(2)),
      trend,
      growth: parseFloat(growth.toFixed(2))
    }
  }
}
async function getTicketsAnalytics(startDate: Date, endDate: Date, granularity: string) {
  const tickets = await prisma.supportTicket.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      id: true,
      createdAt: true,
      status: true,
      category: true,
      priority: true,
      resolvedAt: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })
  const groupedData = groupByDate(tickets, 'createdAt', granularity, (items) => ({
    value: items.length,
    count: items.length,
    resolved: items.filter(item => item.resolvedAt).length,
    byStatus: items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byCategory: items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byPriority: items.reduce((acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }))
  const values = groupedData.map(d => d.value)
  const total = values.reduce((sum, val) => sum + val, 0)
  const average = values.length > 0 ? total / values.length : 0
  const trend = calculateTrend(values)
  const growth = calculateGrowth(values)
  return {
    metric: 'tickets',
    period: getPeriodString(startDate, endDate),
    granularity,
    data: groupedData,
    summary: {
      total,
      average: parseFloat(average.toFixed(2)),
      trend,
      growth: parseFloat(growth.toFixed(2))
    }
  }
}
// Funções utilitárias
function groupByDate<T>(
  items: T[],
  dateField: keyof T,
  granularity: string,
  aggregator: (items: T[]) => any
) {
  const grouped = new Map<string, T[]>()
  items.forEach(item => {
    const date = new Date(item[dateField] as Date)
    let key: string
    switch (granularity) {
      case 'day':
        key = date.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      default:
        key = date.toISOString().split('T')[0]
    }
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(item)
  })
  return Array.from(grouped.entries())
    .map(([date, items]) => ({
      date,
      ...aggregator(items)
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
function calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable'
  const firstHalf = values.slice(0, Math.floor(values.length / 2))
  const secondHalf = values.slice(Math.floor(values.length / 2))
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
  const change = ((secondAvg - firstAvg) / firstAvg) * 100
  if (change > 5) return 'up'
  if (change < -5) return 'down'
  return 'stable'
}
function calculateGrowth(values: number[]): number {
  if (values.length < 2) return 0
  const firstValue = values[0] || 0
  const lastValue = values[values.length - 1] || 0
  if (firstValue === 0) return 0
  return ((lastValue - firstValue) / firstValue) * 100
}
function getPeriodString(startDate: Date, endDate: Date): string {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 7) return '7d'
  if (days <= 30) return '30d'
  if (days <= 90) return '90d'
  return '1y'
}