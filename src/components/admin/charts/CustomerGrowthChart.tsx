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
  AreaChart,
  BarChart,
  Bar
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomerGrowthData } from '@/types/admin'
import { Users, UserPlus, UserMinus, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CustomerGrowthChartProps {
  data: CustomerGrowthData[]
  title?: string
  description?: string
  height?: number
  chartType?: 'line' | 'area' | 'bar'
  showChurn?: boolean
  className?: string
}

export function CustomerGrowthChart({
  data,
  title = "Crescimento de Clientes",
  description = "Evolução da base de clientes ao longo do tempo",
  height = 300,
  chartType = 'area',
  showChurn = true,
  className
}: CustomerGrowthChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-admin-metrics-customers" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Sem dados de clientes disponíveis</p>
              <p className="text-sm">Selecione um período diferente</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calcular estatísticas
  const totalNewCustomers = data.reduce((sum, item) => sum + item.newCustomers, 0)
  const totalChurnedCustomers = data.reduce((sum, item) => sum + item.churnedCustomers, 0)
  const netGrowth = totalNewCustomers - totalChurnedCustomers
  const currentTotal = data[data.length - 1]?.totalCustomers || 0
  const initialTotal = data[0]?.totalCustomers || 0
  const growthRate = initialTotal > 0 ? ((currentTotal - initialTotal) / initialTotal) * 100 : 0

  // Calcular taxa de churn média
  const avgChurnRate = data.length > 0
    ? (totalChurnedCustomers / (data.reduce((sum, item) => sum + item.totalCustomers, 0) / data.length)) * 100
    : 0

  // Formatar dados para exibição
  const formatData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('pt-BR', {
      month: 'short',
      day: 'numeric'
    }),
    newCustomers: Number(item.newCustomers),
    churnedCustomers: Number(item.churnedCustomers),
    totalCustomers: Number(item.totalCustomers),
    netGrowth: Number(item.newCustomers - item.churnedCustomers)
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
              <linearGradient id="newCustomersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3}/>
              </linearGradient>
              {showChurn && (
                <linearGradient id="churnedCustomersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3}/>
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
            />
            <Tooltip content={<CustomTooltip showChurn={showChurn} />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar
              dataKey="newCustomers"
              fill="url(#newCustomersGradient)"
              name="Novos Clientes"
              radius={[4, 4, 0, 0]}
            />
            {showChurn && (
              <Bar
                dataKey="churnedCustomers"
                fill="url(#churnedCustomersGradient)"
                name="Clientes Cancelados"
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        )

      case 'line':
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
            />
            <Tooltip content={<CustomTooltip showChurn={showChurn} />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line
              type="monotone"
              dataKey="totalCustomers"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Total de Clientes"
            />
            <Line
              type="monotone"
              dataKey="newCustomers"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Novos Clientes"
            />
            {showChurn && (
              <Line
                type="monotone"
                dataKey="churnedCustomers"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Clientes Cancelados"
              />
            )}
          </LineChart>
        )

      case 'area':
      default:
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="totalCustomersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="newCustomersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
              </linearGradient>
              {showChurn && (
                <linearGradient id="churnedCustomersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
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
            />
            <Tooltip content={<CustomTooltip showChurn={showChurn} />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Area
              type="monotone"
              dataKey="totalCustomers"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#totalCustomersGradient)"
              name="Total de Clientes"
            />
            {showChurn ? (
              <>
                <Area
                  type="monotone"
                  dataKey="newCustomers"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={0.6}
                  fill="url(#newCustomersGradient)"
                  name="Novos Clientes"
                />
                <Area
                  type="monotone"
                  dataKey="churnedCustomers"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={0.6}
                  fill="url(#churnedCustomersGradient)"
                  name="Clientes Cancelados"
                />
              </>
            ) : (
              <Area
                type="monotone"
                dataKey="netGrowth"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={0.6}
                fill="url(#newCustomersGradient)"
                name="Crescimento Líquido"
              />
            )}
          </AreaChart>
        )
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-admin-metrics-customers" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full",
              growthRate >= 0
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
            )}>
              <TrendingUp className="h-3 w-3" />
              {growthRate >= 0 ? "+" : ""}{growthRate.toFixed(1)}%
            </div>
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
            <div className="flex items-center justify-center gap-1 mb-1">
              <UserPlus className="h-3 w-3 text-green-600" />
              <p className="text-xs text-muted-foreground">Novos</p>
            </div>
            <p className="text-sm font-semibold">{totalNewCustomers}</p>
          </div>
          {showChurn && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <UserMinus className="h-3 w-3 text-red-600" />
                <p className="text-xs text-muted-foreground">Cancelados</p>
              </div>
              <p className="text-sm font-semibold">{totalChurnedCustomers}</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Crescimento Líquido</p>
            <p className={cn(
              "text-sm font-semibold",
              netGrowth >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {netGrowth >= 0 ? "+" : ""}{netGrowth}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Atual</p>
            <p className="text-sm font-semibold">{currentTotal.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Tooltip personalizado
function CustomTooltip({ active, payload, label, showChurn }: any) {
  if (!active || !payload?.length) return null

  const data = payload[0]?.payload

  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">Total:</span>
          <span className="text-sm font-medium">{data?.totalCustomers}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <UserPlus className="h-3 w-3 text-green-600" />
            Novos:
          </span>
          <span className="text-sm font-medium text-green-600">
            +{data?.newCustomers}
          </span>
        </div>
        {showChurn && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <UserMinus className="h-3 w-3 text-red-600" />
              Cancelados:
            </span>
            <span className="text-sm font-medium text-red-600">
              -{data?.churnedCustomers}
            </span>
          </div>
        )}
        <div className="pt-1 border-t">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Crescimento:</span>
            <span className={cn(
              "text-sm font-bold",
              data?.netGrowth >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {data?.netGrowth >= 0 ? "+" : ""}{data?.netGrowth}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Versão compacta
export function CustomerGrowthChartCompact({
  data,
  height = 200,
  className
}: Pick<CustomerGrowthChartProps, 'data' | 'height' | 'className'>) {
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
    totalCustomers: Number(item.totalCustomers)
  }))

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatData}>
              <defs>
                <linearGradient id="customersGradientCompact" x1="0" y1="0" x2="0" y2="1">
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
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--background))'
                }}
              />
              <Area
                type="monotone"
                dataKey="totalCustomers"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#customersGradientCompact)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}