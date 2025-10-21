'use client'
import React, { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  ShoppingCart,
  Package,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Activity,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  FileText,
  RefreshCw,
  Download,
  Filter,
  Search,
  Eye,
  Truck,
  MessageCircle,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAdminAuth } from '@/components/admin/providers/AdminAuthProvider'
import { cn } from '@/lib/utils'
// Interfaces de dados
interface SubscriptionMetrics {
  total: number
  active: number
  paused: number
  cancelled: number
  expired: number
  newThisMonth: number
  churnRate: number
  revenue: number
  averageRevenuePerUser: number
  plans: {
    basic: { count: number; revenue: number }
    premium: { count: number; revenue: number }
    professional: { count: number; revenue: number }
  }
}
interface OrderMetrics {
  total: number
  pending: number
  processing: number
  shipped: number
  delivered: number
  cancelled: number
  returned: number
  revenue: number
  averageOrderValue: number
  todayOrders: number
  thisMonthOrders: number
}
interface CustomerMetrics {
  total: number
  active: number
  newThisMonth: number
  churnedThisMonth: number
  averageLifetimeValue: number
  acquisitionCost: number
  conversionRate: number
  retentionRate: number
}
interface AnalyticsMetrics {
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>
  subscriptionGrowth: Array<{ date: string; active: number; new: number; churned: number }>
  planDistribution: Array<{ plan: string; count: number; percentage: number }>
  topProducts: Array<{ name: string; sales: number; revenue: number }>
  conversionFunnel: Array<{ stage: string; count: number; rate: number }>
}
interface SystemLogs {
  total: number
  errors: number
  warnings: number
  info: number
  lastHour: number
  performance: {
    apiResponseTime: number
    uptime: number
    errorRate: number
  }
}
export default function AdminDashboard() {
  const { hasPermission } = useAdminAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  // Dados mockados para substituir hooks não implementados
  const subscriptionMetrics: SubscriptionMetrics = {
    total: 1247,
    active: 982,
    paused: 45,
    cancelled: 168,
    expired: 52,
    newThisMonth: 89,
    churnRate: 3.2,
    revenue: 87456.78,
    averageRevenuePerUser: 89.90,
    plans: {
      basic: { count: 456, revenue: 22890.40 },
      premium: { count: 389, revenue: 34911.90 },
      professional: { count: 137, revenue: 29654.48 }
    }
  }
  const orderMetrics: OrderMetrics = {
    total: 3456,
    pending: 23,
    processing: 45,
    shipped: 89,
    delivered: 3278,
    cancelled: 12,
    returned: 9,
    revenue: 234567.89,
    averageOrderValue: 67.89,
    todayOrders: 34,
    thisMonthOrders: 423
  }
  const customerMetrics: CustomerMetrics = {
    total: 1567,
    active: 1247,
    newThisMonth: 89,
    churnedThisMonth: 41,
    averageLifetimeValue: 1250.00,
    acquisitionCost: 145.67,
    conversionRate: 23.4,
    retentionRate: 94.1
  }
  const analyticsMetrics: AnalyticsMetrics = {
    dailyRevenue: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 5000) + 2000,
      orders: Math.floor(Math.random() * 50) + 20
    })),
    subscriptionGrowth: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      active: Math.floor(Math.random() * 100) + 900,
      new: Math.floor(Math.random() * 20) + 10,
      churned: Math.floor(Math.random() * 10) + 5
    })),
    planDistribution: [
      { plan: 'Básico', count: 456, percentage: 36.6 },
      { plan: 'Premium', count: 389, percentage: 31.2 },
      { plan: 'Profissional', count: 137, percentage: 11.0 },
      { plan: 'Trial', count: 265, percentage: 21.2 }
    ],
    topProducts: [
      { name: 'Lentes Diárias Premium', sales: 892, revenue: 53472.00 },
      { name: 'Lentes Mensais Standard', sales: 756, revenue: 45360.00 },
      { name: 'Solução Multipurpose', sales: 1234, revenue: 24680.00 },
      { name: 'Estojos de Lentes', sales: 345, revenue: 8625.00 },
      { name: 'Gotas para Olhos Secos', sales: 567, revenue: 11340.00 }
    ],
    conversionFunnel: [
      { stage: 'Visitantes', count: 10000, rate: 100 },
      { stage: 'Leads Capturados', count: 3500, rate: 35 },
      { stage: 'Cadastrados', count: 2340, rate: 23.4 },
      { stage: 'Trial Iniciados', count: 1456, rate: 14.6 },
      { stage: 'Assinantes Ativos', count: 982, rate: 9.8 }
    ]
  }
  const systemLogs: SystemLogs = {
    total: 15234,
    errors: 23,
    warnings: 156,
    info: 15055,
    lastHour: 45,
    performance: {
      apiResponseTime: 145,
      uptime: 99.97,
      errorRate: 0.15
    }
  }
  const refreshData = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => {
      setLastRefresh(new Date())
      setIsLoading(false)
    }, 1000)
  }, [])
  useEffect(() => {
    const interval = setInterval(refreshData, 30000) // 30 segundos
    return () => clearInterval(interval)
  }, [refreshData])
  // Verificação de permissão
  if (!hasPermission('VIEW_DASHBOARD')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para visualizar o dashboard.
          </p>
        </div>
      </div>
    )
  }
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR')
  }
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Operacional</h1>
          <p className="text-muted-foreground">
            Gestão de assinaturas, pedidos e analytics em tempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="365d">Último ano</option>
          </select>
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      {/* Indicador de última atualização */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center">
          <Activity className="h-3 w-3 mr-1" />
          Última atualização: {lastRefresh.toLocaleString('pt-BR')}
          <span className="mx-2">•</span>
          Auto-refresh: 30 segundos
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Sistema: Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>API: {systemLogs.performance.apiResponseTime}ms</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            <span>Uptime: {systemLogs.performance.uptime}%</span>
          </div>
        </div>
      </div>
      {/* Métricas Principais - Assinaturas */}
      <div className="grid gap-4 md:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">Assinaturas</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-blue-900">{formatNumber(subscriptionMetrics.total)}</div>
            <div className="text-xs text-blue-700">Total</div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <div>
                <span className="text-green-600 font-medium">{formatNumber(subscriptionMetrics.active)}</span>
                <span className="text-gray-600"> Ativas</span>
              </div>
              <div>
                <span className="text-yellow-600 font-medium">{formatNumber(subscriptionMetrics.paused)}</span>
                <span className="text-gray-600"> Pausadas</span>
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            <span className="text-xs font-medium text-green-600">Receita MRR</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-900">{formatCurrency(subscriptionMetrics.revenue)}</div>
            <div className="text-xs text-green-700">Mensal Recorrente</div>
            <div className="flex items-center gap-1 text-xs">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+12.5% vs mês anterior</span>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="h-6 w-6 text-purple-600" />
            <span className="text-xs font-medium text-purple-600">ARPU</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-purple-900">{formatCurrency(subscriptionMetrics.averageRevenuePerUser)}</div>
            <div className="text-xs text-purple-700">Receita Média por Usuário</div>
            <div className="flex items-center gap-1 text-xs">
              <ArrowUpRight className="h-3 w-3 text-purple-600" />
              <span className="text-purple-600">+5.2% vs mês anterior</span>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="h-6 w-6 text-orange-600" />
            <span className="text-xs font-medium text-orange-600">Novos Assinantes</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-orange-900">{formatNumber(subscriptionMetrics.newThisMonth)}</div>
            <div className="text-xs text-orange-700">Este mês</div>
            <div className="flex items-center gap-1 text-xs">
              <ArrowUpRight className="h-3 w-3 text-orange-600" />
              <span className="text-orange-600">+18.3% vs mês anterior</span>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <span className="text-xs font-medium text-red-600">Churn Rate</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-red-900">{formatPercentage(subscriptionMetrics.churnRate)}</div>
            <div className="text-xs text-red-700">Taxa de Cancelamento</div>
            <div className="flex items-center gap-1 text-xs">
              <ArrowDownRight className="h-3 w-3 text-green-600" />
              <span className="text-green-600">-0.8% vs mês anterior</span>
            </div>
          </div>
        </motion.div>
      </div>
      {/* Métricas de Pedidos */}
      <div className="grid gap-6 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Pedidos</h3>
            <Package className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total</span>
              <span className="font-semibold">{formatNumber(orderMetrics.total)}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Pendentes</span>
                <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                  {orderMetrics.pending}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Processando</span>
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  {orderMetrics.processing}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Enviados</span>
                <Badge variant="outline" className="text-purple-600 border-purple-300">
                  {orderMetrics.shipped}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Entregues</span>
                <Badge variant="outline" className="text-green-600 border-green-300">
                  {orderMetrics.delivered}
                </Badge>
              </div>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Hoje</span>
                <span className="font-medium text-blue-600">{orderMetrics.todayOrders}</span>
              </div>
            </div>
          </div>
        </motion.div>
        {/* Distribuição de Planos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card border rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Distribuição de Planos</h3>
            <PieChart className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            {analyticsMetrics.planDistribution.map((plan, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{plan.plan}</span>
                  <span className="text-gray-600">{plan.count} ({plan.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${plan.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        {/* Top Produtos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-card border rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Top Produtos</h3>
            <TrendingUp className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            {analyticsMetrics.topProducts.slice(0, 4).map((product, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-xs text-gray-600">{product.sales} vendas</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        {/* System Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-card border rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">System Logs</h3>
            <FileText className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total Logs</span>
              <span className="font-medium">{formatNumber(systemLogs.total)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-red-50 rounded">
                <div className="font-medium text-red-600">{systemLogs.errors}</div>
                <div className="text-red-700">Erros</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded">
                <div className="font-medium text-yellow-600">{systemLogs.warnings}</div>
                <div className="text-yellow-700">Alertas</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="font-medium text-blue-600">{systemLogs.lastHour}</div>
                <div className="text-blue-700">Última hora</div>
              </div>
            </div>
            <div className="pt-3 border-t space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">API Response</span>
                <span className="font-medium">{systemLogs.performance.apiResponseTime}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Error Rate</span>
                <span className="font-medium">{formatPercentage(systemLogs.performance.errorRate)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      {/* Analytics Detalhados */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Receita Diária */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Receita Diária</h3>
            <BarChart3 className="h-5 w-5 text-gray-500" />
          </div>
          <div className="h-64">
            <div className="grid grid-cols-7 gap-1 h-full">
              {analyticsMetrics.dailyRevenue.slice(-7).map((day, index) => (
                <div key={index} className="flex flex-col items-center justify-end">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-cyan-500"
                    style={{ height: `${(day.revenue / 7000) * 100}%` }}
                    title={`R$ ${formatCurrency(day.revenue)}`}
                  ></div>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        {/* Funil de Conversão */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card border rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Funil de Conversão</h3>
            <Target className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            {analyticsMetrics.conversionFunnel.map((stage, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{stage.stage}</span>
                  <span className="text-gray-600">{formatNumber(stage.count)} ({formatPercentage(stage.rate)})</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${stage.rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      {/* Quick Actions */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Ações Rápidas</h3>
        <div className="grid gap-3 md:grid-cols-4">
          <Button variant="outline" className="justify-start">
            <Users className="h-4 w-4 mr-2" />
            Gerenciar Clientes
          </Button>
          <Button variant="outline" className="justify-start">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Ver Assinaturas
          </Button>
          <Button variant="outline" className="justify-start">
            <Package className="h-4 w-4 mr-2" />
            Processar Pedidos
          </Button>
          <Button variant="outline" className="justify-start">
            <MessageCircle className="h-4 w-4 mr-2" />
            Suporte ao Cliente
          </Button>
        </div>
      </div>
    </motion.div>
  )
}