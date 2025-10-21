/**
 * GET /api/admin/subscriptions/analytics
 * Analytics de assinaturas
 *
 * Retorna dados analíticos detalhados sobre assinaturas
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createSuccessResponse } from '@/lib/admin-auth'
/**
 * @swagger
 * /api/admin/subscriptions/analytics:
 *   get:
 *     summary: Obter analytics de assinaturas
 *     description: Retorna dados analíticos detalhados sobre assinaturas
 *     tags:
 *       - Assinaturas Admin
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
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [overview, churn, revenue, ltv, retention, cohort]
 *           default: overview
 *         description: Métrica específica para análise
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [plan, status, paymentMethod, month]
 *         description: Campo para agrupamento
 *     responses:
 *       200:
 *         description: Analytics obtidos com sucesso
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
 *                       example: overview
 *                     period:
 *                       type: string
 *                       example: 30d
 *                     data:
 *                       type: object
 *                       description: Dados da métrica solicitada
 *                     summary:
 *                       type: object
 *                       description: Resumo estatístico
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
    const { user, error } = await requirePermission('subscriptions:analytics')(request)
    if (error) {
      return error
    }
    // Extrair parâmetros
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const metric = searchParams.get('metric') || 'overview'
    const groupBy = searchParams.get('groupBy')
    // Calcular período de datas
    const { startDate, endDate } = getDateRange(period)
    // Buscar dados baseado na métrica solicitada
    let analyticsData: any
    switch (metric) {
      case 'overview':
        analyticsData = await getOverviewAnalytics(startDate, endDate, groupBy)
        break
      case 'churn':
        analyticsData = await getChurnAnalytics(startDate, endDate)
        break
      case 'revenue':
        analyticsData = await getRevenueAnalytics(startDate, endDate, groupBy)
        break
      case 'ltv':
        analyticsData = await getLTVAnalytics(startDate, endDate)
        break
      case 'retention':
        analyticsData = await getRetentionAnalytics(startDate, endDate)
        break
      case 'cohort':
        analyticsData = await getCohortAnalytics(startDate, endDate)
        break
      default:
        return NextResponse.json(
          {
            error: 'INVALID_METRIC',
            message: 'Métrica inválida. Opções: overview, churn, revenue, ltv, retention, cohort'
          },
          { status: 400 }
        )
    }
    return createSuccessResponse(analyticsData, 'Analytics obtidos com sucesso')
  } catch (error) {
    console.error('Subscriptions analytics error:', error)
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
// Funções de analytics específicas
async function getOverviewAnalytics(startDate: Date, endDate: Date, groupBy?: string) {
  const [
    totalSubscriptions,
    newSubscriptions,
    cancelledSubscriptions,
    activeSubscriptions,
    overdueSubscriptions,
    mrrData,
    planDistribution,
    paymentMethodDistribution
  ] = await Promise.all([
    // Total de assinaturas no período
    prisma.subscription.count({
      where: {
        createdAt: { lte: endDate }
      }
    }),
    // Novas assinaturas no período
    prisma.subscription.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    // Canceladas no período
    prisma.subscription.count({
      where: {
        status: 'CANCELLED',
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    // Assinaturas ativas
    prisma.subscription.count({
      where: {
        status: 'ACTIVE'
      }
    }),
    // Assinaturas em atraso
    prisma.subscription.count({
      where: {
        status: 'OVERDUE'
      }
    }),
    // MRR (Monthly Recurring Revenue)
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
    // Distribuição por plano
    prisma.subscription.groupBy({
      by: ['planType'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        id: true
      },
      _sum: {
        monthlyValue: true
      }
    }),
    // Distribuição por método de pagamento
    prisma.subscription.groupBy({
      by: ['paymentMethod'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        id: true
      }
    })
  ])
  const mrr = Number(mrrData._sum.monthlyValue || 0)
  const averageMRR = Number(mrrData._avg.monthlyValue || 0)
  const arr = mrr * 12
  // Calcular churn rate
  const churnRate = totalSubscriptions > 0
    ? ((cancelledSubscriptions / (totalSubscriptions + cancelledSubscriptions)) * 100)
    : 0
  return {
    metric: 'overview',
    period: getPeriodString(startDate, endDate),
    summary: {
      totalSubscriptions,
      activeSubscriptions,
      newSubscriptions,
      cancelledSubscriptions,
      overdueSubscriptions,
      churnRate: parseFloat(churnRate.toFixed(2)),
      mrr: parseFloat(mrr.toFixed(2)),
      arr: parseFloat(arr.toFixed(2)),
      averageMRR: parseFloat(averageMRR.toFixed(2))
    },
    distributions: {
      byPlan: planDistribution.map(item => ({
        planType: item.planType,
        count: item._count.id,
        revenue: Number(item._sum.monthlyValue || 0)
      })),
      byPaymentMethod: paymentMethodDistribution.map(item => ({
        method: item.paymentMethod,
        count: item._count.id
      }))
    },
    health: {
      healthScore: calculateHealthScore(activeSubscriptions, overdueSubscriptions, churnRate),
      growthRate: calculateGrowthRate(newSubscriptions, cancelledSubscriptions),
      efficiencyRate: activeSubscriptions > 0 ? ((activeSubscriptions - overdueSubscriptions) / activeSubscriptions) * 100 : 0
    }
  }
}
async function getChurnAnalytics(startDate: Date, endDate: Date) {
  const [
    cancelledByMonth,
    cancelledByReason,
    cancelledByPlan,
    subscriptionDuration,
    revenueLoss
  ] = await Promise.all([
    // Cancelamentos por mês
    prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', "updatedAt") as month,
        COUNT(*) as cancelled_count
      FROM "subscriptions"
      WHERE "status" = 'CANCELLED'
        AND "updatedAt" >= ${startDate}
        AND "updatedAt" <= ${endDate}
      GROUP BY DATE_TRUNC('month', "updatedAt")
      ORDER BY month
    `,
    // Cancelamentos por motivo (se disponível)
    prisma.subscriptionHistory.findMany({
      where: {
        changeType: 'SUBSCRIPTION_CANCELLED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        description: true,
        createdAt: true
      }
    }),
    // Cancelamentos por plano
    prisma.subscription.groupBy({
      by: ['planType'],
      where: {
        status: 'CANCELLED',
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        id: true
      }
    }),
    // Duração média das assinaturas canceladas
    prisma.subscription.aggregate({
      where: {
        status: 'CANCELLED',
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _avg: {
        monthlyValue: true
      }
    }),
    // Perda de receita
    prisma.subscription.aggregate({
      where: {
        status: 'CANCELLED',
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        monthlyValue: true
      }
    })
  ])
  const totalRevenueLoss = Number(revenueLoss._sum.monthlyValue || 0)
  const averageCancelledValue = Number(subscriptionDuration._avg.monthlyValue || 0)

  // Calculate real monthly churn rate
  const monthlyChurnRate = await calculateMonthlyChurnRate(startDate, endDate)

  return {
    metric: 'churn',
    period: getPeriodString(startDate, endDate),
    summary: {
      totalCancelled: cancelledByPlan.reduce((sum, item) => sum + item._count.id, 0),
      revenueLoss: parseFloat(totalRevenueLoss.toFixed(2)),
      averageCancelledValue: parseFloat(averageCancelledValue.toFixed(2)),
      monthlyChurnRate: parseFloat(monthlyChurnRate.toFixed(2))
    },
    trends: {
      byMonth: cancelledByMonth,
      byPlan: cancelledByPlan.map(item => ({
        planType: item.planType,
        cancelledCount: item._count.id
      })),
      reasons: analyzeCancellationReasons(cancelledByReason)
    }
  }
}
async function getRevenueAnalytics(startDate: Date, endDate: Date, groupBy?: string) {
  const [
    mrrByPeriod,
    revenueByPlan,
    revenueByPaymentMethod,
    revenueGrowth
  ] = await Promise.all([
    // MRR por período
    prisma.subscription.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        monthlyValue: true,
        status: true,
        createdAt: true,
        paymentMethod: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    }),
    // Receita por plano
    prisma.subscription.groupBy({
      by: ['planType'],
      where: {
        status: 'ACTIVE'
      },
      _sum: {
        monthlyValue: true
      },
      _count: {
        id: true
      }
    }),
    // Receita por método de pagamento
    prisma.subscription.groupBy({
      by: ['paymentMethod'],
      where: {
        status: 'ACTIVE'
      },
      _sum: {
        monthlyValue: true
      },
      _count: {
        id: true
      }
    }),
    // Crescimento de receita
    prisma.payment.findMany({
      where: {
        status: 'RECEIVED',
        paymentDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        amount: true,
        paymentDate: true
      },
      orderBy: {
        paymentDate: 'asc'
      }
    })
  ])
  const currentMRR = revenueByPlan.reduce((sum, item) => sum + Number(item._sum.monthlyValue || 0), 0)
  const totalRevenue = revenueGrowth.reduce((sum, item) => sum + Number(item.amount), 0)
  return {
    metric: 'revenue',
    period: getPeriodString(startDate, endDate),
    summary: {
      currentMRR: parseFloat(currentMRR.toFixed(2)),
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      averageRevenuePerPlan: revenueByPlan.length > 0 ? currentMRR / revenueByPlan.length : 0,
      revenueGrowth: calculateRevenueGrowth(revenueGrowth)
    },
    breakdown: {
      byPlan: revenueByPlan.map(item => ({
        planType: item.planType,
        mrr: Number(item._sum.monthlyValue || 0),
        count: item._count.id,
        averagePerSubscription: item._count.id > 0 ? Number(item._sum.monthlyValue || 0) / item._count.id : 0
      })),
      byPaymentMethod: revenueByPaymentMethod.map(item => ({
        method: item.paymentMethod,
        mrr: Number(item._sum.monthlyValue || 0),
        count: item._count.id
      }))
    },
    projections: {
      arr: currentMRR * 12,
      quarterlyProjection: currentMRR * 3,
      annualGrowth: await calculateAnnualGrowthProjection(revenueGrowth)
    }
  }
}
async function getLTVAnalytics(startDate: Date, endDate: Date) {
  // LTV (Lifetime Value) analytics
  const [
    customerRevenue,
    averageSubscriptionDuration,
    customerMetrics
  ] = await Promise.all([
    // Receita total por cliente
    prisma.$queryRaw`
      SELECT
        u.id as user_id,
        u.name,
        u.email,
        COALESCE(SUM(p.amount), 0) as total_revenue,
        COUNT(p.id) as payment_count,
        AVG(p.amount) as average_payment
      FROM "users" u
      LEFT JOIN "payments" p ON u.id = p."userId"
      WHERE u.role = 'subscriber'
        AND p.status = 'RECEIVED'
        AND p."paymentDate" >= ${startDate}
        AND p."paymentDate" <= ${endDate}
      GROUP BY u.id, u.name, u.email
      HAVING COALESCE(SUM(p.amount), 0) > 0
      ORDER BY total_revenue DESC
      LIMIT 100
    `,
    // Duração média das assinaturas
    prisma.subscription.aggregate({
      where: {
        status: { in: ['ACTIVE', 'CANCELLED'] }
      },
      _avg: {
        monthlyValue: true
      }
    }),
    // Métricas adicionais
    prisma.subscription.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        monthlyValue: true,
        status: true,
        user: {
          select: {
            id: true,
            payments: {
              select: {
                amount: true,
                status: true,
                paymentDate: true
              }
            }
          }
        }
      }
    })
  ])
  const totalRevenue = Array.isArray(customerRevenue)
    ? customerRevenue.reduce((sum, customer: any) => sum + Number(customer.total_revenue || 0), 0)
    : 0
  const totalCustomers = Array.isArray(customerRevenue) ? customerRevenue.length : 0
  const averageLTV = totalCustomers > 0 ? totalRevenue / totalCustomers : 0
  const averageMonthlyValue = Number(customerMetrics._avg.monthlyValue || 0)
  return {
    metric: 'ltv',
    period: getPeriodString(startDate, endDate),
    summary: {
      totalCustomers,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      averageLTV: parseFloat(averageLTV.toFixed(2)),
      averageMonthlyValue: parseFloat(averageMonthlyValue.toFixed(2)),
      ltvToMonthlyRatio: averageMonthlyValue > 0 ? averageLTV / averageMonthlyValue : 0
    },
    segments: {
      topCustomers: Array.isArray(customerRevenue) ? customerRevenue.slice(0, 10).map((customer: any) => ({
        userId: customer.user_id,
        name: customer.name,
        email: customer.email,
        totalRevenue: Number(customer.total_revenue || 0),
        paymentCount: Number(customer.payment_count || 0),
        averagePayment: Number(customer.average_payment || 0)
      })) : [],
      distribution: calculateLTVDistribution(customerRevenue)
    },
    insights: {
      revenueConcentration: calculateRevenueConcentration(customerRevenue),
      customerRetentionRate: await calculateCustomerRetentionRate(startDate, endDate),
      projectedLTV: averageLTV * 1.2 // Projeção de crescimento
    }
  }
}
async function getRetentionAnalytics(startDate: Date, endDate: Date) {
  // Retention analytics
  const [
    totalSubscriptions,
    activeSubscriptions,
    subscriptionLifetimes,
    monthlyRetentionData,
    cohortData
  ] = await Promise.all([
    // Total de assinaturas no período
    prisma.subscription.count({
      where: {
        createdAt: { lte: endDate }
      }
    }),
    // Assinaturas ativas
    prisma.subscription.count({
      where: {
        status: 'ACTIVE'
      }
    }),
    // Tempo de vida das assinaturas
    prisma.subscription.findMany({
      where: {
        status: { in: ['ACTIVE', 'CANCELLED'] }
      },
      select: {
        createdAt: true,
        updatedAt: true,
        status: true
      }
    }),
    // Retenção mensal
    prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as total_subscriptions,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_subscriptions
      FROM "subscriptions"
      WHERE "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month
    `,
    // Análise de coorte
    prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', "createdAt") as cohort_month,
        COUNT(*) as cohort_size,
        AVG(
          CASE
            WHEN status = 'CANCELLED' THEN
              EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / (24 * 3600)
            ELSE
              EXTRACT(EPOCH FROM (${endDate} - "createdAt")) / (24 * 3600)
          END
        ) as avg_lifetime_days
      FROM "subscriptions"
      WHERE "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY cohort_month
    `
  ])

  // Calcular taxa de retenção geral
  const retentionRate = totalSubscriptions > 0 ? (activeSubscriptions / totalSubscriptions) * 100 : 0

  // Calcular tempo médio de vida das assinaturas
  const subscriptionLifetimesInDays = subscriptionLifetimes.map(sub => {
    const end = sub.status === 'CANCELLED' ? sub.updatedAt : new Date()
    return (end.getTime() - new Date(sub.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  })
  const averageSubscriptionLifetime = subscriptionLifetimesInDays.length > 0
    ? subscriptionLifetimesInDays.reduce((sum, lifetime) => sum + lifetime, 0) / subscriptionLifetimesInDays.length
    : 0

  return {
    metric: 'retention',
    period: getPeriodString(startDate, endDate),
    summary: {
      retentionRate: parseFloat(retentionRate.toFixed(2)),
      averageSubscriptionLifetime: parseFloat(averageSubscriptionLifetime.toFixed(1)),
      monthlyRetention: Array.isArray(monthlyRetentionData) ? monthlyRetentionData.map((month: any) => ({
        month: month.month,
        totalSubscriptions: Number(month.total_subscriptions),
        activeSubscriptions: Number(month.active_subscriptions),
        retentionRate: Number(month.total_subscriptions) > 0
          ? ((Number(month.active_subscriptions) / Number(month.total_subscriptions)) * 100).toFixed(2)
          : '0'
      })) : []
    },
    trends: {
      cohortRetention: Array.isArray(cohortData) ? cohortData.map((cohort: any) => ({
        cohortMonth: cohort.cohort_month,
        cohortSize: Number(cohort.cohort_size),
        averageLifetimeDays: parseFloat(Number(cohort.avg_lifetime_days || 0).toFixed(1))
      })) : [],
      churnPrediction: await predictChurnTrends(subscriptionLifetimes, retentionRate)
    }
  }
}
async function getCohortAnalytics(startDate: Date, endDate: Date) {
  // Cohort analysis
  return {
    metric: 'cohort',
    period: getPeriodString(startDate, endDate),
    summary: {
      totalCohorts: 0,
      averageRetentionByCohort: []
    },
    cohorts: []
  }
}
// Funções utilitárias
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
function getPeriodString(startDate: Date, endDate: Date): string {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 7) return '7d'
  if (days <= 30) return '30d'
  if (days <= 90) return '90d'
  return '1y'
}
function calculateHealthScore(active: number, overdue: number, churnRate: number): number {
  const total = active + overdue
  if (total === 0) return 0
  const activityScore = (active / total) * 50
  const churnScore = Math.max(0, (100 - churnRate)) * 0.5
  return Math.min(100, activityScore + churnScore)
}
function calculateGrowthRate(newSubscriptions: number, cancelledSubscriptions: number): number {
  if (newSubscriptions === 0) return 0
  return ((newSubscriptions - cancelledSubscriptions) / newSubscriptions) * 100
}
function calculateRevenueGrowth(payments: any[]): number {
  if (payments.length < 2) return 0
  const firstHalf = payments.slice(0, Math.floor(payments.length / 2))
  const secondHalf = payments.slice(Math.floor(payments.length / 2))
  const firstHalfTotal = firstHalf.reduce((sum, p) => sum + Number(p.amount), 0)
  const secondHalfTotal = secondHalf.reduce((sum, p) => sum + Number(p.amount), 0)
  if (firstHalfTotal === 0) return 0
  return ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100
}
function analyzeCancellationReasons(history: any[]): any[] {
  // Análise de motivos de cancelamento
  const reasons: Record<string, number> = {}
  history.forEach(record => {
    const reason = record.description || 'Não especificado'
    reasons[reason] = (reasons[reason] || 0) + 1
  })
  return Object.entries(reasons)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}
function calculateLTVDistribution(customers: any[]): any {
  if (!Array.isArray(customers) || customers.length === 0) {
    return { segments: [] }
  }
  const revenues = customers.map(c => Number(c.total_revenue || 0)).sort((a, b) => a - b)
  const total = revenues.length
  return {
    percentiles: {
      p25: revenues[Math.floor(total * 0.25)] || 0,
      p50: revenues[Math.floor(total * 0.5)] || 0,
      p75: revenues[Math.floor(total * 0.75)] || 0,
      p90: revenues[Math.floor(total * 0.9)] || 0,
      p95: revenues[Math.floor(total * 0.95)] || 0
    },
    segments: [
      { name: 'Baixo LTV', min: 0, max: revenues[Math.floor(total * 0.33)] || 0, count: Math.floor(total * 0.33) },
      { name: 'Médio LTV', min: revenues[Math.floor(total * 0.33)] || 0, max: revenues[Math.floor(total * 0.67)] || 0, count: Math.floor(total * 0.34) },
      { name: 'Alto LTV', min: revenues[Math.floor(total * 0.67)] || 0, max: revenues[total - 1] || 0, count: Math.ceil(total * 0.33) }
    ]
  }
}
function calculateRevenueConcentration(customers: any[]): any {
  if (!Array.isArray(customers) || customers.length === 0) {
    return { top10Percent: 0, top1Percent: 0, giniCoefficient: 0 }
  }
  const revenues = customers.map(c => Number(c.total_revenue || 0)).sort((a, b) => b - a)
  const totalRevenue = revenues.reduce((sum, rev) => sum + rev, 0)
  const top10Count = Math.max(1, Math.floor(customers.length * 0.1))
  const top1Count = Math.max(1, Math.floor(customers.length * 0.01))
  const top10PercentRevenue = revenues.slice(0, top10Count).reduce((sum, rev) => sum + rev, 0)
  const top1PercentRevenue = revenues.slice(0, top1Count).reduce((sum, rev) => sum + rev, 0)
  return {
    top10Percent: totalRevenue > 0 ? (top10PercentRevenue / totalRevenue) * 100 : 0,
    top1Percent: totalRevenue > 0 ? (top1PercentRevenue / totalRevenue) * 100 : 0,
    giniCoefficient: calculateGiniCoefficient(revenues)
  }
}
function calculateGiniCoefficient(values: number[]): number {
  if (values.length === 0) return 0
  const sortedValues = [...values].sort((a, b) => a - b)
  const n = sortedValues.length
  const total = sortedValues.reduce((sum, val) => sum + val, 0)
  if (total === 0) return 0
  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += (2 * (i + 1) - n - 1) * sortedValues[i]
  }
  return sum / (n * total)
}

// New analytics calculation functions
async function calculateMonthlyChurnRate(startDate: Date, endDate: Date): Promise<number> {
  try {
    // Get subscribers at the beginning of the period
    const subscribersAtStart = await prisma.subscription.count({
      where: {
        createdAt: { lt: startDate },
        status: { in: ['ACTIVE', 'OVERDUE'] }
      }
    })

    // Get cancellations during the period
    const cancellations = await prisma.subscription.count({
      where: {
        status: 'CANCELLED',
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calculate churn rate as percentage
    if (subscribersAtStart === 0) return 0
    return (cancellations / subscribersAtStart) * 100
  } catch (error) {
    console.error('Error calculating monthly churn rate:', error)
    return 0
  }
}

async function calculateAnnualGrowthProjection(payments: any[]): Promise<number> {
  try {
    if (payments.length < 3) return 0 // Not enough data for projection

    // Calculate month-over-month growth rates
    const monthlyGrowthRates: number[] = []
    for (let i = 1; i < Math.min(payments.length, 6); i++) {
      const currentMonth = Number(payments[payments.length - i].amount)
      const previousMonth = Number(payments[payments.length - i - 1].amount)
      if (previousMonth > 0) {
        monthlyGrowthRates.push(((currentMonth - previousMonth) / previousMonth) * 100)
      }
    }

    if (monthlyGrowthRates.length === 0) return 0

    // Calculate average monthly growth rate
    const avgMonthlyGrowth = monthlyGrowthRates.reduce((sum, rate) => sum + rate, 0) / monthlyGrowthRates.length

    // Project annual growth (compound)
    const annualGrowth = Math.pow(1 + (avgMonthlyGrowth / 100), 12) - 1
    return annualGrowth * 100
  } catch (error) {
    console.error('Error calculating annual growth projection:', error)
    return 0
  }
}

async function calculateCustomerRetentionRate(startDate: Date, endDate: Date): Promise<number> {
  try {
    // Get customers who had subscriptions at the beginning
    const customersAtStart = await prisma.subscription.groupBy({
      by: ['userId'],
      where: {
        createdAt: { lt: startDate }
      }
    })

    // Get customers who renewed or remained active during the period
    const retainedCustomers = await prisma.subscription.groupBy({
      by: ['userId'],
      where: {
        userId: { in: customersAtStart.map(c => c.userId) },
        status: { in: ['ACTIVE', 'OVERDUE'] },
        updatedAt: { gte: startDate }
      }
    })

    if (customersAtStart.length === 0) return 0
    return (retainedCustomers.length / customersAtStart.length) * 100
  } catch (error) {
    console.error('Error calculating customer retention rate:', error)
    return 0
  }
}

async function predictChurnTrends(subscriptionLifetimes: any[], currentRetentionRate: number): Promise<any[]> {
  try {
    // Simple churn prediction based on historical patterns
    const avgLifetime = subscriptionLifetimes.length > 0
      ? subscriptionLifetimes.reduce((sum, sub) => {
          const lifetime = sub.status === 'CANCELLED'
            ? (new Date(sub.updatedAt).getTime() - new Date(sub.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            : (new Date().getTime() - new Date(sub.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          return sum + lifetime
        }, 0) / subscriptionLifetimes.length
      : 180 // Default 180 days

    // Predict churn for next 3 months
    const predictions = []
    const monthlyChurnRate = (100 - currentRetentionRate) / 100

    for (let i = 1; i <= 3; i++) {
      const predictedChurn = monthlyChurnRate * (1 + (i * 0.1)) // Slight increase over time
      predictions.push({
        month: i,
        predictedChurnRate: parseFloat((predictedChurn * 100).toFixed(2)),
        confidence: parseFloat((90 - (i * 5)).toFixed(1)) // Decreasing confidence
      })
    }

    return predictions
  } catch (error) {
    console.error('Error predicting churn trends:', error)
    return []
  }
}