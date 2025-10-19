'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, TrendingDown, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChurnData {
  date: string
  churnRate: number
  cancelledCount: number
  activeCount: number
  reason?: string
}

interface ChurnRateChartProps {
  data: ChurnData[]
  title?: string
  description?: string
  height?: number
  chartType?: 'line' | 'area' | 'bar'
  showBenchmark?: boolean
  benchmarkRate?: number
  className?: string
}

export function ChurnRateChart({
  data,
  title = "Taxa de Churn",
  description = "Taxa de cancelamento de assinaturas ao longo do tempo",
  height = 300,
  chartType = 'line',
  showBenchmark = true,
  benchmarkRate = 5.0, // 5% como benchmark padrão
  className
}: ChurnRateChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-admin-metrics-warning" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Sem dados de churn disponíveis</p>
              <p className="text-sm">Selecione um período diferente</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calcular estatísticas
  const avgChurnRate = data.reduce((sum, item) => sum + item.churnRate, 0) / data.length
  const maxChurnRate = Math.max(...data.map(item => item.churnRate))
  const minChurnRate = Math.min(...data.map(item => item.churnRate))
  const totalCancelled = data.reduce((sum, item) => sum + item.cancelledCount, 0)
  const currentRate = data[data.length - 1]?.churnRate || 0

  // Classificar taxa de churn
  const getChurnLevel = (rate: number) => {
    if (rate < 2) return { level: 'Excelente', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (rate < 4) return { level: 'Bom', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    if (rate < 6) return { level: 'Atenção', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    if (rate < 8) return { level: 'Ruim', color: 'text-orange-600', bgColor: 'bg-orange-100' }
    return { level: 'Crítico', color: 'text-red-600', bgColor: 'bg-red-100' }
  }

  const churnLevel = getChurnLevel(currentRate)
  const isImproving = data.length >= 2 && currentRate < data[data.length - 2].churnRate

  // Formatar dados para exibição
  const formatData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('pt-BR', {
      month: 'short',
      day: 'numeric'
    }),
    churnRate: Number(item.churnRate.toFixed(2)),
    cancelledCount: Number(item.cancelledCount),
    activeCount: Number(item.activeCount),
    benchmark: benchmarkRate
  }))

  // Componente do gráfico baseado no tipo
  const renderChart = () => {
    const commonProps = {
      data: formatData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <defs>
              <linearGradient id="churnGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={currentRate > benchmarkRate ? "#ef4444" : "#f59e0b"}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={currentRate > benchmarkRate ? "#ef4444" : "#f59e0b"}
                  stopOpacity={0.3}
                />
              </linearGradient>
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
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="churnRate"
              fill="url(#churnGradient)"
              name="Taxa de Churn (%)"
              radius={[4, 4, 0, 0]}
            />
            {showBenchmark && (
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Benchmark"
              />
            )}
          </BarChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="churnAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={currentRate > benchmarkRate ? "#ef4444" : "#f59e0b"}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={currentRate > benchmarkRate ? "#ef4444" : "#f59e0b"}
                  stopOpacity={0.1}
                />
              </linearGradient>
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
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="churnRate"
              stroke={currentRate > benchmarkRate ? "#ef4444" : "#f59e0b"}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#churnAreaGradient)"
              name="Taxa de Churn (%)"
            />
            {showBenchmark && (
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Benchmark"
              />
            )}
          </AreaChart>
        )

      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
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
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="churnRate"
              stroke={currentRate > benchmarkRate ? "#ef4444" : "#f59e0b"}
              strokeWidth={2}
              dot={{ r: 4, fill: currentRate > benchmarkRate ? "#ef4444" : "#f59e0b" }}
              activeDot={{ r: 6 }}
              name="Taxa de Churn (%)"
            />
            {showBenchmark && (
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Benchmark"
              />
            )}
          </LineChart>
        )
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-admin-metrics-warning" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
              churnLevel.bgColor,
              churnLevel.color
            )}>
              {churnLevel.level}
            </div>
            {isImproving && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                <TrendingDown className="h-3 w-3" />
                Melhorando
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Taxa Atual</p>
            <p className={cn(
              "text-lg font-semibold",
              currentRate > benchmarkRate ? "text-red-600" : "text-yellow-600"
            )}>
              {currentRate.toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Média</p>
            <p className="text-sm font-semibold">{avgChurnRate.toFixed(1)}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Cancelamentos</p>
            <p className="text-sm font-semibold">{totalCancelled}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Benchmark</p>
            <p className="text-sm font-semibold text-muted-foreground">{benchmarkRate}%</p>
          </div>
        </div>

        {/* Alertas */}
        {currentRate > benchmarkRate && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-400">
                  Taxa de churn acima do benchmark
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  A taxa atual de {currentRate.toFixed(1)}% está acima dos {benchmarkRate}% recomendados.
                  Considere estratégias de retenção para reduzir o churn.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Tooltip personalizado
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  const data = payload[0]?.payload

  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">Taxa de Churn:</span>
          <span className={cn(
            "text-sm font-bold",
            data?.churnRate > 5 ? "text-red-600" : "text-yellow-600"
          )}>
            {data?.churnRate.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">Cancelamentos:</span>
          <span className="text-sm font-medium">{data?.cancelledCount}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">Clientes Ativos:</span>
          <span className="text-sm font-medium">{data?.activeCount}</span>
        </div>
      </div>
    </div>
  )
}

// Versão compacta
export function ChurnRateChartCompact({
  data,
  height = 200,
  className
}: Pick<ChurnRateChartProps, 'data' | 'height' | 'className'>) {
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

  const formatData = data.slice(-6).map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('pt-BR', {
      day: 'numeric'
    }),
    churnRate: Number(item.churnRate.toFixed(2))
  }))

  const currentRate = formatData[formatData.length - 1]?.churnRate || 0

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatData}>
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
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--background))'
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taxa de Churn']}
              />
              <Line
                type="monotone"
                dataKey="churnRate"
                stroke={currentRate > 5 ? "#ef4444" : "#f59e0b"}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}