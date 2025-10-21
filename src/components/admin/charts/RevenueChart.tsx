'use client'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RevenueData } from '@/types/admin'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
interface RevenueChartProps {
  data: RevenueData[]
  title?: string
  description?: string
  height?: number
  showArea?: boolean
  showComparison?: boolean
  previousPeriodData?: RevenueData[]
  className?: string
}
export function RevenueChart({
  data,
  title = "Receita Mensal",
  description = "Evolução da receita ao longo do tempo",
  height = 300,
  showArea = false,
  showComparison = false,
  previousPeriodData,
  className
}: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-admin-metrics-revenue" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Sem dados de receita disponíveis</p>
              <p className="text-sm">Selecione um período diferente</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  // Calcular estatísticas
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
  const averageRevenue = totalRevenue / data.length
  const maxRevenue = Math.max(...data.map(item => item.revenue))
  const minRevenue = Math.min(...data.map(item => item.revenue))
  // Calcular crescimento
  const firstMonth = data[0]?.revenue || 0
  const lastMonth = data[data.length - 1]?.revenue || 0
  const growth = firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0
  const isPositiveGrowth = growth >= 0
  // Formatar dados para exibição
  const formatData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('pt-BR', {
      month: 'short',
      day: 'numeric'
    }),
    revenue: Number(item.revenue.toFixed(2)),
    subscriptions: Number(item.subscriptions),
    orders: Number(item.orders)
  }))
  // Formatar dados do período anterior para comparação
  const formatPreviousData = previousPeriodData?.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('pt-BR', {
      month: 'short',
      day: 'numeric'
    }),
    revenue: Number(item.revenue.toFixed(2)),
    isPrevious: true
  }))
  // Combinar dados para comparação
  const comparisonData = showComparison && formatPreviousData
    ? [...formatPreviousData, ...formatData]
    : formatData
  const ChartComponent = showArea ? AreaChart : LineChart
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-admin-metrics-revenue" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full",
              isPositiveGrowth
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
            )}>
              {isPositiveGrowth ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(growth).toFixed(1)}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={comparisonData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                </linearGradient>
                {showComparison && (
                  <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.1}/>
                  </linearGradient>
                )}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted/30"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0]?.payload
                  const isPrevious = data?.isPrevious
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <div className="mb-2">
                        <p className="text-sm font-medium">{label}</p>
                        {isPrevious && (
                          <p className="text-xs text-muted-foreground">Período anterior</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-muted-foreground">Receita:</span>
                          <span className="text-sm font-medium">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(data?.revenue || 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-muted-foreground">Assinaturas:</span>
                          <span className="text-sm font-medium">
                            {data?.subscriptions || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-muted-foreground">Pedidos:</span>
                          <span className="text-sm font-medium">
                            {data?.orders || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              {showComparison && formatPreviousData && (
                <Line
                  type="monotone"
                  dataKey="revenue"
                  data={formatPreviousData}
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Período anterior"
                  opacity={0.7}
                />
              )}
              {showArea ? (
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                  name="Receita"
                />
              ) : (
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#06b6d4' }}
                  activeDot={{ r: 6 }}
                  name="Receita"
                />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-semibold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(totalRevenue)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Média</p>
            <p className="text-sm font-semibold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(averageRevenue)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Máximo</p>
            <p className="text-sm font-semibold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(maxRevenue)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Crescimento</p>
            <p className={cn(
              "text-sm font-semibold",
              isPositiveGrowth ? "text-green-600" : "text-red-600"
            )}>
              {isPositiveGrowth ? "+" : ""}{growth.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
// Versão compacta para espaços menores
export function RevenueChartCompact({
  data,
  height = 200,
  className
}: Pick<RevenueChartProps, 'data' | 'height' | 'className'>) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p className="text-sm">Sem dados disponíveis</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  const formatData = data.slice(-7).map(item => ({ // Últimos 7 pontos
    ...item,
    date: new Date(item.date).toLocaleDateString('pt-BR', {
      day: 'numeric'
    }),
    revenue: Number(item.revenue.toFixed(2))
  }))
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatData}>
              <defs>
                <linearGradient id="revenueGradientCompact" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted/20"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--background))'
                }}
                formatter={(value: number) => [
                  new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(value),
                  'Receita'
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#revenueGradientCompact)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}