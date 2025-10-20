/**
 * GET /api/admin/dashboard/metrics
 * Métricas principais do dashboard administrativo
 *
 * Retorna indicadores chave de performance (KPIs) do negócio
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createSuccessResponse } from '@/lib/admin-auth'
import { dashboardMetricsSchema } from '@/lib/admin-validations'
/**
 * @swagger
 * /api/admin/dashboard/metrics:
 *   get:
 *     summary: Obter métricas do dashboard
 *     description: Retorna indicadores chave de performance do negócio
 *     tags:
 *       - Dashboard Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Período de análise
 *       - in: query
 *         name: compareWith
 *         schema:
 *           type: string
 *           enum: [previous, same_last_month, same_last_year]
 *         description: Período de comparação para crescimento
 *     responses:
 *       200:
 *         description: Métricas obtidas com sucesso
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
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalCustomers:
 *                           type: integer
 *                           example: 1247
 *                         activeSubscriptions:
 *                           type: integer
 *                           example: 892
 *                         monthlyRevenue:
 *                           type: number
 *                           example: 45680.50
 *                         monthlyGrowth:
 *                           type: number
 *                           example: 12.5
 *                     subscriptions:
 *                       type: object
 *                       properties:
 *                         newThisMonth:
 *                           type: integer
 *                           example: 45
 *                         cancelledThisMonth:
 *                           type: integer
 *                           example: 8
 *                         churnRate:
 *                           type: number
 *                           example: 2.3
 *                         averagePlanValue:
 *                           type: number
 *                           example: 89.90
 *                     orders:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: integer
 *                           example: 23
 *                         shippedThisMonth:
 *                           type: integer
 *                           example: 156
 *                         deliveredThisMonth:
 *                           type: integer
 *                           example: 134
 *                         averageOrderValue:
 *                           type: number
 *                           example: 125.50
 *                     support:
 *                       type: object
 *                       properties:
 *                         openTickets:
 *                           type: integer
 *                           example: 8
 *                         resolvedThisMonth:
 *                           type: integer
 *                           example: 67
 *                         averageResponseTime:
 *                           type: number
 *                           example: 2.4
 *                         satisfactionRate:
 *                           type: number
 *                           example: 4.6
 *                     financial:
 *                       type: object
 *                       properties:
 *                         mrr:
 *                           type: number
 *                           example: 45680.50
 *                         arr:
 *                           type: number
 *                           example: 548166.00
 *                         ltv:
 *                           type: number
 *                           example: 1250.00
 *                         revenueGrowth:
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
    const { user, error } = await requirePermission('dashboard:view')(request)
    if (error) {
      return error
    }
    // Validar parâmetros
    const { data: params, error: validationError } = validateQuery(
      dashboardMetricsSchema,
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
    // Calcular datas baseado no período
    const { startDate, endDate } = getDateRange(params.period)
    // Buscar métricas em paralelo
    const [
      totalCustomers,
      activeSubscriptions,
      newCustomers,
      cancelledSubscriptions,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      openTickets,
      resolvedTickets,
      revenueData,
      paymentsData
    ] = await Promise.all([
      // Total de clientes
      prisma.user.count({
        where: {
          role: 'subscriber',
          createdAt: { lte: endDate }
        }
      }),
      // Assinaturas ativas
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          createdAt: { lte: endDate }
        }
      }),
      // Novos clientes no período
      prisma.user.count({
        where: {
          role: 'subscriber',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      // Assinaturas canceladas no período
      prisma.subscription.count({
        where: {
          status: 'CANCELLED',
          updatedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      // Pedidos pendentes
      prisma.order.count({
        where: {
          deliveryStatus: 'PENDING',
          createdAt: { lte: endDate }
        }
      }),
      // Pedidos enviados no período
      prisma.order.count({
        where: {
          deliveryStatus: { in: ['SHIPPED', 'IN_TRANSIT', 'DELIVERED'] },
          shippingDate: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      // Pedidos entregues no período
      prisma.order.count({
        where: {
          deliveryStatus: 'DELIVERED',
          deliveredAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      // Tickets abertos
      prisma.supportTicket.count({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING_CUSTOMER', 'PENDING_AGENT'] }
        }
      }),
      // Tickets resolvidos no período
      prisma.supportTicket.count({
        where: {
          status: 'RESOLVED',
          resolvedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      // Dados de receita (MRR)
      prisma.subscription.aggregate({
        where: {
          status: 'ACTIVE'
        },
        _sum: {
          monthlyValue: true
        },
        _avg: {
          monthlyValue: true
        }
      }),
      // Dados de pagamentos do período
      prisma.payment.aggregate({
        where: {
          status: 'RECEIVED',
          paymentDate: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      })
    ])
    // Calcular métricas derivadas
    const mrr = revenueData._sum.monthlyValue || 0
    const arr = mrr * 12
    const averagePlanValue = revenueData._avg.monthlyValue || 0
    const monthlyRevenue = paymentsData._sum.amount || 0
    const activeSubscriptionsCount = activeSubscriptions || 0
    const churnRate = activeSubscriptionsCount > 0
      ? ((cancelledSubscriptions || 0) / (activeSubscriptionsCount + cancelledSubscriptions)) * 100
      : 0
    // Calcular crescimento (comparação com período anterior)
    const growthData = await calculateGrowth(startDate, endDate, params.compareWith)
    // Montar resposta
    const metrics = {
      overview: {
        totalCustomers,
        activeSubscriptions: activeSubscriptionsCount,
        monthlyRevenue,
        monthlyGrowth: growthData.revenueGrowth,
        newCustomers,
        churnRate: parseFloat(churnRate.toFixed(2))
      },
      subscriptions: {
        newThisMonth: newCustomers,
        cancelledThisMonth: cancelledSubscriptions,
        churnRate: parseFloat(churnRate.toFixed(2)),
        averagePlanValue: parseFloat((averagePlanValue || 0).toFixed(2)),
        activeCount: activeSubscriptionsCount
      },
      orders: {
        pending: pendingOrders,
        shippedThisMonth: shippedOrders,
        deliveredThisMonth: deliveredOrders,
        totalThisMonth: shippedOrders + deliveredOrders,
        deliveryRate: shippedOrders > 0
          ? parseFloat(((deliveredOrders / shippedOrders) * 100).toFixed(1))
          : 0
      },
      support: {
        openTickets,
        resolvedThisMonth: resolvedTickets,
        averageResponseTime: 2.4, // TODO: Implementar cálculo real
        satisfactionRate: 4.6 // TODO: Implementar cálculo real
      },
      financial: {
        mrr: parseFloat(mrr.toFixed(2)),
        arr: parseFloat(arr.toFixed(2)),
        ltv: 1250.00, // TODO: Implementar cálculo real
        revenueGrowth: growthData.revenueGrowth,
        paymentsCount: paymentsData._count.id || 0
      },
      period: {
        current: params.period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        comparison: params.compareWith || null
      }
    }
    return createSuccessResponse(metrics, 'Métricas obtidas com sucesso')
  } catch (error) {
    console.error('Dashboard metrics error:', error)
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
async function calculateGrowth(
  currentStart: Date,
  currentEnd: Date,
  compareWith?: string
): Promise<{ revenueGrowth: number }> {
  if (!compareWith) {
    return { revenueGrowth: 0 }
  }
  // Calcular período anterior para comparação
  const daysDiff = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24))
  const previousEnd = new Date(currentStart)
  const previousStart = new Date(previousEnd)
  previousStart.setDate(previousStart.getDate() - daysDiff)
  try {
    // Receita do período anterior
    const previousRevenue = await prisma.payment.aggregate({
      where: {
        status: 'RECEIVED',
        paymentDate: {
          gte: previousStart,
          lte: previousEnd
        }
      },
      _sum: {
        amount: true
      }
    })
    // Receita do período atual
    const currentRevenue = await prisma.payment.aggregate({
      where: {
        status: 'RECEIVED',
        paymentDate: {
          gte: currentStart,
          lte: currentEnd
        }
      },
      _sum: {
        amount: true
      }
    })
    const prevAmount = previousRevenue._sum.amount || 0
    const currAmount = currentRevenue._sum.amount || 0
    const growth = prevAmount > 0
      ? ((currAmount - prevAmount) / prevAmount) * 100
      : 0
    return { revenueGrowth: parseFloat(growth.toFixed(2)) }
  } catch (error) {
    console.error('Error calculating growth:', error)
    return { revenueGrowth: 0 }
  }
}