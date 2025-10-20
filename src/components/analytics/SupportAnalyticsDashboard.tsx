'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  MessageCircle,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Activity,
  Phone,
  Zap,
  Shield,
  BarChart3,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
// Types for analytics data
interface SupportMetrics {
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
const COLORS = {
  primary: '#06b6d4',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  secondary: '#64748b',
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#6b7280'
}
const SENTIMENT_COLORS = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#6b7280'
}
export function SupportAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')
  const [refreshing, setRefreshing] = useState(false)
  useEffect(() => {
    fetchMetrics()
  }, [selectedTimeRange])
  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/support?timeRange=${selectedTimeRange}`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Error fetching support metrics:', error)
    } finally {
      setLoading(false)
    }
  }
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchMetrics()
    setRefreshing(false)
  }
  const exportData = async () => {
    try {
      const response = await fetch('/api/analytics/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'export',
          data: { timeRange: selectedTimeRange }
        })
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `support-analytics-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }
  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Não foi possível carregar os dados de análise</p>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics de Suporte</h2>
          <p className="text-muted-foreground">
            Monitoramento em tempo real do atendimento ao cliente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="1d">Últimas 24 horas</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets Totais</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalTickets.toLocaleString('pt-BR')}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.activeTickets} ativos
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.totalTickets > 0
                  ? ((metrics.resolvedTickets / metrics.totalTickets) * 100).toFixed(1)
                  : '0.0'}%
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.resolvedTickets} resolvidos
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(metrics.averageResponseTime)}min</div>
              <p className="text-xs text-muted-foreground">
                Meta: 15min
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfação do Cliente</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.customerSatisfaction.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Avaliação média
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="sentiment">Sentimento</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tickets by Priority */}
            <Card>
              <CardHeader>
                <CardTitle>Tickets por Prioridade</CardTitle>
                <CardDescription>Distribuição de tickets por nível de prioridade</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.ticketsByPriority}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ priority, count }) => `${priority}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {metrics.ticketsByPriority.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          entry.priority === 'CRITICAL' ? COLORS.danger :
                          entry.priority === 'URGENT' ? COLORS.warning :
                          entry.priority === 'HIGH' ? COLORS.info :
                          entry.priority === 'MEDIUM' ? COLORS.primary :
                          COLORS.secondary
                        } />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Tickets by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Tickets por Categoria</CardTitle>
                <CardDescription>Volume de tickets por tipo de problema</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.ticketsByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          {/* Response Time Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Tempo de Resposta</CardTitle>
              <CardDescription>Evolução do tempo médio de resposta</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.responseTimeTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgResponseTime"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    name="Tempo Médio (min)"
                  />
                  <Line
                    type="monotone"
                    dataKey="targetTime"
                    stroke={COLORS.success}
                    strokeDasharray="5 5"
                    name="Meta (min)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Satisfaction Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Tendência de Satisfação</CardTitle>
                <CardDescription>Evolução da satisfação dos clientes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.satisfactionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="satisfaction"
                      stroke={COLORS.success}
                      fill={COLORS.success}
                      fillOpacity={0.3}
                      name="Satisfação Média"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* First Contact Resolution */}
            <Card>
              <CardHeader>
                <CardTitle>Resolução no Primeiro Contato</CardTitle>
                <CardDescription>Taxa de resolução sem necessidade de escalonamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-cyan-600">
                    {metrics.firstContactResolution.toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {metrics.firstContactResolution >= 70 ? 'Excelente' :
                     metrics.firstContactResolution >= 50 ? 'Bom' :
                     metrics.firstContactResolution >= 30 ? 'Regular' : 'Precisa Melhorar'}
                  </p>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-cyan-600 h-2 rounded-full"
                        style={{ width: `${metrics.firstContactResolution}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Escalation Reasons */}
          <Card>
            <CardHeader>
              <CardTitle>Motivos de Escalonamento</CardTitle>
              <CardDescription>Principais razões para escalonamento de tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.escalationReasons.map((reason, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {reason.trend === 'up' && <TrendingUp className="h-4 w-4 text-red-500" />}
                        {reason.trend === 'down' && <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />}
                        {reason.trend === 'stable' && <Activity className="h-4 w-4 text-gray-500" />}
                      </div>
                      <span className="font-medium">{reason.reason}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{reason.count} tickets</Badge>
                      <span className="text-sm text-muted-foreground">{reason.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance dos Agentes</CardTitle>
              <CardDescription>Métricas individuais de desempenho</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {metrics.agentPerformance.map((agent, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{agent.agentName}</h3>
                        <div className="flex gap-2 mt-1">
                          {agent.specializations.map((spec, specIndex) => (
                            <Badge key={specIndex} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Tickets</div>
                        <div className="font-semibold">{agent.ticketsHandled}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Tempo Médio de Resposta</div>
                        <div className="font-semibold">{agent.avgResponseTime}min</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Satisfação</div>
                        <div className="font-semibold flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          {agent.satisfaction.toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Taxa de Escalonamento</div>
                        <div className="font-semibold">{(agent.escalationRate * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sentiment" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Análise de Sentimento</CardTitle>
                <CardDescription>Distribuição de sentimentos nas conversas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.sentimentAnalysis}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ sentiment, percentage }) => `${sentiment}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {metrics.sentimentAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.sentiment as keyof typeof SENTIMENT_COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Sentiment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Sentimento</CardTitle>
                <CardDescription>Análise detalhada por categoria de sentimento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.sentimentAnalysis.map((sentiment, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: SENTIMENT_COLORS[sentiment.sentiment as keyof typeof SENTIMENT_COLORS] }}
                          ></div>
                          <span className="font-medium capitalize">{sentiment.sentiment}</span>
                        </div>
                        <span className="text-sm font-semibold">{sentiment.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${sentiment.percentage}%`,
                            backgroundColor: SENTIMENT_COLORS[sentiment.sentiment as keyof typeof SENTIMENT_COLORS]
                          }}
                        ></div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {sentiment.count} conversas
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}