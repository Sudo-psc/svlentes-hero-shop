/**
 * Support Analytics API
 * Provides comprehensive analytics for WhatsApp customer support
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface SupportAnalyticsResponse {
  totalTickets: number
  activeTickets: number
  resolvedTickets: number
  averageResponseTime: number
  customerSatisfaction: number
  escalationRate: number
  firstContactResolution: number
  ticketsByPriority: TicketPriorityData[]
  ticketsByCategory: CategoryData[]
  responseTimeTrend: ResponseTimeData[]
  satisfactionTrend: SatisfactionData[]
  agentPerformance: AgentPerformanceData[]
  sentimentAnalysis: SentimentData[]
  escalationReasons: EscalationReasonData[]
}

interface TicketPriorityData {
  priority: string
  count: number
  avgResolutionTime: string
}

interface CategoryData {
  category: string
  count: number
  avgResolutionTime: string
  satisfaction: number
}

interface ResponseTimeData {
  date: string
  avgResponseTime: number
  targetTime: number
}

interface SatisfactionData {
  date: string
  satisfaction: number
  tickets: number
}

interface AgentPerformanceData {
  agentId: string
  agentName: string
  ticketsHandled: number
  avgResponseTime: number
  satisfaction: number
  escalationRate: number
  specializations: string[]
}

interface SentimentData {
  sentiment: string
  count: number
  percentage: number
  color: string
}

interface EscalationReasonData {
  reason: string
  count: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'

    // Calculate date range based on timeRange
    const endDate = new Date()
    const startDate = new Date()

    switch (timeRange) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1)
        break
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      default:
        startDate.setDate(endDate.getDate() - 7)
    }

    // Fetch tickets in date range
    const tickets = await prisma.supportTicket.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: true
      }
    })

    // Calculate basic metrics
    const totalTickets = tickets.length
    const activeTickets = tickets.filter(t =>
      ['OPEN', 'IN_PROGRESS', 'PENDING_CUSTOMER', 'PENDING_AGENT'].includes(t.status)
    ).length
    const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED').length

    // Calculate average response time
    const responseTimes = tickets
      .filter(t => t.assignedAt && t.createdAt)
      .map(t => {
        const responseTime = t.assignedAt!.getTime() - t.createdAt.getTime()
        return responseTime / (1000 * 60) // Convert to minutes
      })
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0

    // Calculate customer satisfaction
    const satisfactionScores = tickets
      .filter(t => t.customerSatisfaction)
      .map(t => t.customerSatisfaction!)
    const customerSatisfaction = satisfactionScores.length > 0
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      : 0

    // Calculate escalation rate
    const escalatedTickets = tickets.filter(t => t.escalationId).length
    const escalationRate = totalTickets > 0 ? escalatedTickets / totalTickets : 0

    // Calculate first contact resolution
    const resolvedWithoutEscalation = tickets.filter(t =>
      t.status === 'RESOLVED' && !t.escalationId
    ).length
    const firstContactResolution = totalTickets > 0 ? resolvedWithoutEscalation / totalTickets : 0

    // Group tickets by priority
    const ticketsByPriority = await prisma.supportTicket.groupBy({
      by: ['priority'],
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      _count: { priority: true },
      orderBy: { _count: { priority: 'desc' } }
    })

    const priorityData: TicketPriorityData[] = ticketsByPriority.map(item => ({
      priority: item.priority,
      count: item._count.priority,
      avgResolutionTime: '0h 0m' // Would calculate from resolved tickets
    }))

    // Group tickets by category
    const ticketsByCategory = await prisma.supportTicket.groupBy({
      by: ['category'],
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } }
    })

    const categoryData: CategoryData[] = ticketsByCategory.map(item => ({
      category: item.category,
      count: item._count.category,
      avgResolutionTime: '0h 0m', // Would calculate from resolved tickets
      satisfaction: 4.5 // Would calculate from satisfaction scores
    }))

    // Generate response time trend data
    const responseTimeTrend: ResponseTimeData[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('pt-BR')

      // Calculate average response time for this day
      const dayTickets = tickets.filter(t =>
        t.createdAt.toDateString() === date.toDateString()
      )

      const dayResponseTimes = dayTickets
        .filter(t => t.assignedAt && t.createdAt)
        .map(t => (t.assignedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60))

      const avgResponseTime = dayResponseTimes.length > 0
        ? dayResponseTimes.reduce((sum, time) => sum + time, 0) / dayResponseTimes.length
        : 15 // Target time

      responseTimeTrend.push({
        date: dateStr,
        avgResponseTime: Math.round(avgResponseTime),
        targetTime: 15
      })
    }

    // Generate satisfaction trend data
    const satisfactionTrend: SatisfactionData[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('pt-BR')

      const dayTickets = tickets.filter(t =>
        t.createdAt.toDateString() === date.toDateString()
      )

      const daySatisfactionScores = dayTickets
        .filter(t => t.customerSatisfaction)
        .map(t => t.customerSatisfaction!)

      const avgSatisfaction = daySatisfactionScores.length > 0
        ? daySatisfactionScores.reduce((sum, score) => sum + score, 0) / daySatisfactionScores.length
        : 4.0

      satisfactionTrend.push({
        date: dateStr,
        satisfaction: parseFloat(avgSatisfaction.toFixed(1)),
        tickets: dayTickets.length
      })
    }

    // Get agent performance data
    const agentPerformance = await prisma.agent.findMany({
      where: { isActive: true },
      include: {
        tickets: {
          where: {
            createdAt: { gte: startDate, lte: endDate }
          }
        },
        specializations: true
      }
    })

    const agentPerformanceData: AgentPerformanceData[] = agentPerformance.map(agent => {
      const agentTickets = tickets.filter(t => t.assignedAgentId === agent.id)
      const agentResponseTimes = agentTickets
        .filter(t => t.assignedAt && t.createdAt)
        .map(t => (t.assignedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60))
      const agentSatisfactionScores = agentTickets
        .filter(t => t.customerSatisfaction)
        .map(t => t.customerSatisfaction!)
      const agentEscalatedCount = agentTickets.filter(t => t.escalationId).length

      return {
        agentId: agent.id,
        agentName: agent.name,
        ticketsHandled: agentTickets.length,
        avgResponseTime: agentResponseTimes.length > 0
          ? Math.round(agentResponseTimes.reduce((sum, time) => sum + time, 0) / agentResponseTimes.length)
          : 0,
        satisfaction: agentSatisfactionScores.length > 0
          ? parseFloat((agentSatisfactionScores.reduce((sum, score) => sum + score, 0) / agentSatisfactionScores.length).toFixed(1))
          : 0,
        escalationRate: agentTickets.length > 0 ? agentEscalatedCount / agentTickets.length : 0,
        specializations: agent.specializations.map(s => s.type)
      }
    })

    // Generate sentiment analysis data
    const sentimentAnalysis = await prisma.whatsAppInteraction.groupBy({
      by: ['sentiment'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        sentiment: { not: null }
      },
      _count: { sentiment: true }
    })

    const totalSentimentInteractions = sentimentAnalysis.reduce((sum, item) => sum + item._count.sentiment, 0)

    const sentimentData: SentimentData[] = sentimentAnalysis.map(item => ({
      sentiment: item.sentiment || 'neutral',
      count: item._count.sentiment,
      percentage: totalSentimentInteractions > 0
        ? Math.round((item._count.sentiment / totalSentimentInteractions) * 100)
        : 0,
      color: item.sentiment === 'positive' ? '#22c55e' :
             item.sentiment === 'negative' ? '#ef4444' : '#6b7280'
    }))

    // Generate escalation reasons data
    const escalationReasons = await prisma.escalation.groupBy({
      by: ['reason'],
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      _count: { reason: true },
      orderBy: { _count: { reason: 'desc' } }
    })

    const totalEscalations = escalationReasons.reduce((sum, item) => sum + item._count.reason, 0)

    const escalationReasonsData: EscalationReasonData[] = escalationReasons.map(item => ({
      reason: item.reason,
      count: item._count.reason,
      percentage: totalEscalations > 0
        ? Math.round((item._count.reason / totalEscalations) * 100)
        : 0,
      trend: 'stable' // Would calculate trend based on previous period
    }))

    const analyticsData: SupportAnalyticsResponse = {
      totalTickets,
      activeTickets,
      resolvedTickets,
      averageResponseTime: Math.round(averageResponseTime),
      customerSatisfaction: parseFloat(customerSatisfaction.toFixed(1)),
      escalationRate: parseFloat((escalationRate * 100).toFixed(1)),
      firstContactResolution: parseFloat((firstContactResolution * 100).toFixed(1)),
      ticketsByPriority: priorityData,
      ticketsByCategory: categoryData,
      responseTimeTrend,
      satisfactionTrend,
      agentPerformance: agentPerformanceData,
      sentimentAnalysis: sentimentData,
      escalationReasons: escalationReasonsData
    }

    return NextResponse.json(analyticsData)

  } catch (error) {
    console.error('Error fetching support analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support analytics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'export':
        return await exportAnalyticsData(data)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing support analytics request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

async function exportAnalyticsData(data: any) {
  try {
    const { timeRange = '7d', format = 'csv' } = data

    // Get analytics data (similar to GET but with more detail for export)
    const analytics = await prisma.supportTicket.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        agent: true,
        customerInfo: true,
        escalation: true
      }
    })

    // Generate CSV content
    const headers = [
      'ID',
      'Número do Ticket',
      'Status',
      'Prioridade',
      'Categoria',
      'Assunto',
      'Nome do Cliente',
      'Email',
      'Telefone',
      'Agente',
      'Data de Criação',
      'Data de Resolução',
      'Satisfação',
      'Tempo de Resposta (min)'
    ]

    const rows = analytics.map(ticket => [
      ticket.id,
      ticket.ticketNumber,
      ticket.status,
      ticket.priority,
      ticket.category,
      ticket.subject,
      ticket.customerInfo?.name || '',
      ticket.customerInfo?.email || '',
      ticket.customerInfo?.phone || '',
      ticket.agent?.name || '',
      ticket.createdAt.toISOString(),
      ticket.resolvedAt?.toISOString() || '',
      ticket.customerSatisfaction?.toString() || '',
      ticket.assignedAt && ticket.createdAt
        ? Math.round((ticket.assignedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60)).toString()
        : ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="support-analytics-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Error exporting analytics data:', error)
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    )
  }
}