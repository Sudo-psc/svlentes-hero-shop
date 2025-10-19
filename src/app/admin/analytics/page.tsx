'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  CreditCard,
  Package,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Calendar,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

// Interfaces
interface AsaasAnalytics {
  overview: {
    totalRevenue: number
    revenueGrowth: number
    totalOrders: number
    ordersGrowth: number
    activeSubscriptions: number
    subscriptionsGrowth: number
    averageTicket: number
    ticketGrowth: number
    conversionRate: number
  }
  paymentAnalytics: {
    byMethod: {
      method: 'credit_card' | 'pix' | 'boleto'
      count: number
      value: number
      percentage: number
    }[]
    successRate: number
    failureRate: number
    refundRate: number
    chargebackRate: number
  }
  subscriptionAnalytics: {
    byPlan: {
      planName: string
      activeCount: number
      cancelledCount: number
      revenue: number
      churnRate: number
    }[]
    monthlyRevenue: {
      month: string
      revenue: number
      subscriptions: number
    }[]
    cohort: {
      period: string
      newSubscriptions: number
      retainedMonth1: number
      retainedMonth3: number
      retainedMonth6: number
    }[]
  }
  operationalMetrics: {
    averageProcessingTime: number
    deliverySuccessRate: number
    customerSupportTickets: number
    averageResponseTime: number
    systemUptime: number
    errorRate: number
  }
  customerMetrics: {
    newCustomers: number
    returningCustomers: number
    customerLifetimeValue: number
    averageOrderFrequency: number
    topCustomers: {
      name: string
      email: string
      totalSpent: number
      orderCount: number
    }[]
  }
  logs: {
    critical: LogEntry[]
    warnings: LogEntry[]
    info: LogEntry[]
    recent: LogEntry[]
  }
}

interface LogEntry {
  id: string
  timestamp: string
  level: 'critical' | 'warning' | 'info'
  category: 'payment' | 'subscription' | 'system' | 'api' | 'security'
  message: string
  details?: any
  userId?: string
  orderId?: string
  subscriptionId?: string
  resolved?: boolean
  resolutionNotes?: string
}

const methodConfig = {
  credit_card: { label: 'Cartão de Crédito', icon: '💳', color: 'blue' },
  pix: { label: 'PIX', icon: '⚡', color: 'green' },
  boleto: { label: 'Boleto', icon: '📄', color: 'orange' }
}

const levelConfig = {
  critical: { label: 'Crítico', color: 'red', icon: AlertCircle },
  warning: { label: 'Aviso', color: 'yellow', icon: AlertCircle },
  info: { label: 'Informação', color: 'blue', icon: CheckCircle }
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AsaasAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Load analytics from ASAAS API
  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/asaas/analytics?timeRange=${timeRange}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')

      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
      // Mock data for development
      const mockAnalytics: AsaasAnalytics = {
        overview: {
          totalRevenue: 45890.50,
          revenueGrowth: 12.5,
          totalOrders: 186,
          ordersGrowth: 8.3,
          activeSubscriptions: 47,
          subscriptionsGrowth: 15.2,
          averageTicket: 246.70,
          ticketGrowth: 3.8,
          conversionRate: 68.5
        },
        paymentAnalytics: {
          byMethod: [
            { method: 'credit_card', count: 98, value: 28420.00, percentage: 62.0 },
            { method: 'pix', count: 72, value: 15470.50, percentage: 33.7 },
            { method: 'boleto', count: 16, value: 2000.00, percentage: 4.3 }
          ],
          successRate: 94.2,
          failureRate: 4.8,
          refundRate: 0.8,
          chargebackRate: 0.2
        },
        subscriptionAnalytics: {
          byPlan: [
            {
              planName: 'Lentes Diárias - 30 dias',
              activeCount: 28,
              cancelledCount: 5,
              revenue: 22680.00,
              churnRate: 15.2
            },
            {
              planName: 'Lentes Mensais - 1 par',
              activeCount: 15,
              cancelledCount: 2,
              revenue: 16785.00,
              churnRate: 11.8
            },
            {
              planName: 'Lentes Tóricas - 30 dias',
              activeCount: 4,
              cancelledCount: 1,
              revenue: 6425.50,
              churnRate: 20.0
            }
          ],
          monthlyRevenue: [
            { month: 'Jan', revenue: 12500, subscriptions: 35 },
            { month: 'Fev', revenue: 15200, subscriptions: 39 },
            { month: 'Mar', revenue: 18190.50, subscriptions: 47 }
          ],
          cohort: [
            {
              period: 'Jan-2024',
              newSubscriptions: 12,
              retainedMonth1: 11,
              retainedMonth3: 9,
              retainedMonth6: 7
            },
            {
              period: 'Fev-2024',
              newSubscriptions: 15,
              retainedMonth1: 14,
              retainedMonth3: 12,
              retainedMonth6: null
            },
            {
              period: 'Mar-2024',
              newSubscriptions: 18,
              retainedMonth1: 17,
              retainedMonth3: null,
              retainedMonth6: null
            }
          ]
        },
        operationalMetrics: {
          averageProcessingTime: 1.8,
          deliverySuccessRate: 96.5,
          customerSupportTickets: 23,
          averageResponseTime: 2.3,
          systemUptime: 99.8,
          errorRate: 0.2
        },
        customerMetrics: {
          newCustomers: 47,
          returningCustomers: 139,
          customerLifetimeValue: 1245.60,
          averageOrderFrequency: 3.2,
          topCustomers: [
            {
              name: 'João Silva',
              email: 'joao@email.com',
              totalSpent: 2450.00,
              orderCount: 8
            },
            {
              name: 'Maria Santos',
              email: 'maria@email.com',
              totalSpent: 1890.00,
              orderCount: 6
            },
            {
              name: 'Pedro Costa',
              email: 'pedro@email.com',
              totalSpent: 1670.00,
              orderCount: 5
            }
          ]
        },
        logs: {
          critical: [
            {
              id: 'log_001',
              timestamp: '2024-03-15T14:30:00Z',
              level: 'critical',
              category: 'payment',
              message: 'Falha no processamento de pagamento - Cartão recusado',
              details: { errorCode: 'card_declined', orderId: 'ord_123' },
              orderId: 'ord_123',
              resolved: false
            },
            {
              id: 'log_002',
              timestamp: '2024-03-15T10:15:00Z',
              level: 'critical',
              category: 'api',
              message: 'Timeout na API do ASAAS',
              details: { endpoint: '/payments', timeout: 30000 },
              resolved: true,
              resolutionNotes: 'Serviço ASAAS reiniciado e funcionando normalmente'
            }
          ],
          warnings: [
            {
              id: 'log_003',
              timestamp: '2024-03-15T09:45:00Z',
              level: 'warning',
              category: 'subscription',
              message: 'Assinatura próxima ao vencimento da receita médica',
              details: { subscriptionId: 'sub_456', expiryDate: '2024-03-20' },
              subscriptionId: 'sub_456'
            }
          ],
          info: [
            {
              id: 'log_004',
              timestamp: '2024-03-15T08:30:00Z',
              level: 'info',
              category: 'system',
              message: 'Backup automático executado com sucesso',
              details: { fileSize: '2.3GB', duration: '45s' }
            }
          ],
          recent: [
            {
              id: 'log_005',
              timestamp: '2024-03-15T15:45:00Z',
              level: 'info',
              category: 'payment',
              message: 'Novo pagamento recebido via PIX',
              details: { amount: 179.90, orderId: 'ord_456' },
              orderId: 'ord_456'
            }
          ]
        }
      }
      setAnalytics(mockAnalytics)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const MetricCard = ({ title, value, change, icon: Icon, color = 'blue' }: any) => {
    const isPositive = change >= 0
    const TrendIcon = isPositive ? TrendingUp : TrendingDown

    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {change !== undefined && (
                <div className="flex items-center gap-1 mt-2">
                  <TrendIcon className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{formatPercentage(change)}
                  </span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-full bg-${color}-50`}>
              <Icon className={`w-6 h-6 text-${color}-600`} />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const LogEntryComponent = ({ entry }: { entry: LogEntry }) => {
    const LevelIcon = levelConfig[entry.level].icon

    return (
      <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
        <div className={`p-1 rounded-full bg-${levelConfig[entry.level].color}-100`}>
          <LevelIcon className={`w-4 h-4 text-${levelConfig[entry.level].color}-600`} />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-sm">{entry.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(entry.timestamp).toLocaleString('pt-BR')} • {entry.category}
              </p>
              {entry.details && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-600 cursor-pointer">Detalhes</summary>
                  <pre className="text-xs text-gray-700 mt-1 bg-white p-2 rounded border">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex gap-2">
              {entry.orderId && (
                <Badge variant="outline" className="text-xs">
                  Pedido: {entry.orderId}
                </Badge>
              )}
              {entry.subscriptionId && (
                <Badge variant="outline" className="text-xs">
                  Assinatura: {entry.subscriptionId}
                </Badge>
              )}
              {entry.resolved !== undefined && (
                <Badge className={entry.resolved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                  {entry.resolved ? 'Resolvido' : 'Pendente'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-silver-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Analytics e Logs
              </h1>
              <p className="text-gray-600">
                Monitoramento completo do sistema ASAAS e métricas de negócio
              </p>
            </div>

            <div className="flex gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 dias</SelectItem>
                  <SelectItem value="30d">30 dias</SelectItem>
                  <SelectItem value="90d">90 dias</SelectItem>
                  <SelectItem value="1y">1 ano</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={loadAnalytics}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </motion.div>

        {analytics ? (
          <>
            {/* Overview Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <MetricCard
                title="Receita Total"
                value={formatCurrency(analytics.overview.totalRevenue)}
                change={analytics.overview.revenueGrowth}
                icon={DollarSign}
                color="green"
              />
              <MetricCard
                title="Total de Pedidos"
                value={analytics.overview.totalOrders}
                change={analytics.overview.ordersGrowth}
                icon={Package}
                color="blue"
              />
              <MetricCard
                title="Assinaturas Ativas"
                value={analytics.overview.activeSubscriptions}
                change={analytics.overview.subscriptionsGrowth}
                icon={Users}
                color="purple"
              />
              <MetricCard
                title="Ticket Médio"
                value={formatCurrency(analytics.overview.averageTicket)}
                change={analytics.overview.ticketGrowth}
                icon={CreditCard}
                color="orange"
              />
            </motion.div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="payments">Pagamentos</TabsTrigger>
                <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
                <TabsTrigger value="customers">Clientes</TabsTrigger>
                <TabsTrigger value="logs">Logs do Sistema</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Payment Methods Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="w-5 h-5" />
                        Distribuição de Pagamentos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.paymentAnalytics.byMethod.map((method) => (
                          <div key={method.method} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{methodConfig[method.method].icon}</span>
                                <span className="text-sm font-medium">{methodConfig[method.method].label}</span>
                              </div>
                              <span className="text-sm font-bold">{formatPercentage(method.percentage)}</span>
                            </div>
                            <Progress value={method.percentage} className="h-2" />
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>{method.count} transações</span>
                              <span>{formatCurrency(method.value)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Operational Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Métricas Operacionais
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Taxa de Sucesso de Pagamento</span>
                          <span className="font-medium">{formatPercentage(analytics.paymentAnalytics.successRate)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Taxa de Entrega</span>
                          <span className="font-medium">{formatPercentage(analytics.operationalMetrics.deliverySuccessRate)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Tempo Médio de Processamento</span>
                          <span className="font-medium">{analytics.operationalMetrics.averageProcessingTime}h</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Uptime do Sistema</span>
                          <span className="font-medium">{formatPercentage(analytics.operationalMetrics.systemUptime)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Taxa de Erro</span>
                          <span className="font-medium">{formatPercentage(analytics.operationalMetrics.errorRate)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Revenue Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="w-5 h-5" />
                      Receita Mensal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.subscriptionAnalytics.monthlyRevenue.map((month) => (
                        <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{month.month}</p>
                            <p className="text-sm text-gray-600">{month.subscriptions} assinaturas</p>
                          </div>
                          <p className="font-bold text-lg">{formatCurrency(month.revenue)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Taxa de Sucesso</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {formatPercentage(analytics.paymentAnalytics.successRate)}
                        </div>
                        <Progress value={analytics.paymentAnalytics.successRate} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Taxa de Falha</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600 mb-2">
                          {formatPercentage(analytics.paymentAnalytics.failureRate)}
                        </div>
                        <Progress value={analytics.paymentAnalytics.failureRate} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Taxa de Reembolso</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-600 mb-2">
                          {formatPercentage(analytics.paymentAnalytics.refundRate)}
                        </div>
                        <Progress value={analytics.paymentAnalytics.refundRate} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Análise por Método de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {analytics.paymentAnalytics.byMethod.map((method) => (
                        <div key={method.method} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{methodConfig[method.method].icon}</span>
                              <div>
                                <h3 className="font-semibold">{methodConfig[method.method].label}</h3>
                                <p className="text-sm text-gray-600">{method.count} transações</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">{formatCurrency(method.value)}</p>
                              <p className="text-sm text-gray-600">{formatPercentage(method.percentage)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Subscriptions Tab */}
              <TabsContent value="subscriptions" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance por Plano</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.subscriptionAnalytics.byPlan.map((plan) => (
                          <div key={plan.planName} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium">{plan.planName}</h3>
                              <Badge className={plan.churnRate > 15 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                                Churn: {formatPercentage(plan.churnRate)}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Ativas:</span>
                                <span className="ml-2 font-medium">{plan.activeCount}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Canceladas:</span>
                                <span className="ml-2 font-medium">{plan.cancelledCount}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-600">Receita:</span>
                                <span className="ml-2 font-bold">{formatCurrency(plan.revenue)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Análise de Cohort</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-600 border-b pb-2">
                          <div>Período</div>
                          <div>Novas</div>
                          <div>Mês 1</div>
                          <div>Mês 3</div>
                          <div>Mês 6</div>
                        </div>
                        {analytics.subscriptionAnalytics.cohort.map((cohort) => (
                          <div key={cohort.period} className="grid grid-cols-5 gap-2 text-sm border-b pb-2">
                            <div className="font-medium">{cohort.period}</div>
                            <div>{cohort.newSubscriptions}</div>
                            <div>{cohort.retainedMonth1 ?? '-'}</div>
                            <div>{cohort.retainedMonth3 ?? '-'}</div>
                            <div>{cohort.retainedMonth6 ?? '-'}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Customers Tab */}
              <TabsContent value="customers" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Novos Clientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {analytics.customerMetrics.newCustomers}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Clientes Recorrentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">
                        {analytics.customerMetrics.returningCustomers}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Lifetime Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600">
                        {formatCurrency(analytics.customerMetrics.customerLifetimeValue)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Clientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.customerMetrics.topCustomers.map((customer, index) => (
                        <div key={customer.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-cyan-700">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-gray-600">{customer.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(customer.totalSpent)}</p>
                            <p className="text-sm text-gray-600">{customer.orderCount} pedidos</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Logs Tab */}
              <TabsContent value="logs" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-5 h-5" />
                        Críticos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analytics.logs.critical.slice(0, 3).map((log) => (
                          <LogEntryComponent key={log.id} entry={log} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-600">
                        <AlertCircle className="w-5 h-5" />
                        Avisos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analytics.logs.warnings.map((log) => (
                          <LogEntryComponent key={log.id} entry={log} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-600">
                        <CheckCircle className="w-5 h-5" />
                        Informações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analytics.logs.info.map((log) => (
                          <LogEntryComponent key={log.id} entry={log} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-5 h-5" />
                        Recentes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analytics.logs.recent.map((log) => (
                          <LogEntryComponent key={log.id} entry={log} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* System Health */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Saúde do Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {formatPercentage(analytics.operationalMetrics.systemUptime)}
                        </div>
                        <p className="text-sm text-gray-600">Uptime</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {analytics.operationalMetrics.averageResponseTime}h
                        </div>
                        <p className="text-sm text-gray-600">Tempo Resposta</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          {analytics.operationalMetrics.customerSupportTickets}
                        </div>
                        <p className="text-sm text-gray-600">Tickets Suporte</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600 mb-1">
                          {formatPercentage(analytics.operationalMetrics.errorRate)}
                        </div>
                        <p className="text-sm text-gray-600">Taxa de Erro</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-600" />
          </div>
        )}
      </div>
    </div>
  )
}