'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  PiggyBank,
  Package,
  Calendar,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'

/**
 * Interface para dados de métricas individuais
 */
interface MetricData {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
  bgColor: string
  tooltip: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

/**
 * Props do componente DashboardMetricsCards
 */
interface DashboardMetricsCardsProps {
  /**
   * Total economizado pelo assinante
   */
  totalSavings?: number

  /**
   * Número de lentes recebidas
   */
  lensesReceived?: number

  /**
   * Data da próxima entrega
   */
  nextDeliveryDate?: string | Date

  /**
   * Taxa de pontualidade das entregas (0-100)
   */
  punctualityRate?: number

  /**
   * Estado de carregamento
   */
  isLoading?: boolean

  /**
   * Mensagem de erro
   */
  error?: string

  /**
   * Classe CSS adicional
   */
  className?: string
}

/**
 * Componente que exibe cards de métricas do dashboard do assinante
 * Mostra 4 cards principais: Total Economizado, Lentes Recebidas, Próxima Entrega e Taxa de Pontualidade
 */
export function DashboardMetricsCards({
  totalSavings = 0,
  lensesReceived = 0,
  nextDeliveryDate,
  punctualityRate = 0,
  isLoading = false,
  error,
  className
}: DashboardMetricsCardsProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Formata a data da próxima entrega
  const formattedNextDelivery = nextDeliveryDate
    ? formatDate(nextDeliveryDate)
    : 'Não agendada'

  // Calcula a tendência de economia (exemplo: 15% vs mês anterior)
  const savingsTrend = totalSavings > 0 ? {
    value: 15,
    isPositive: true
  } : undefined

  // Define as métricas
  const metrics: MetricData[] = [
    {
      label: 'Total Economizado',
      value: formatCurrency(totalSavings),
      icon: <PiggyBank className="h-6 w-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
      tooltip: 'Total economizado comparado à compra avulsa de lentes',
      trend: savingsTrend
    },
    {
      label: 'Lentes Recebidas',
      value: lensesReceived,
      icon: <Package className="h-6 w-6" />,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950',
      tooltip: 'Número total de pares de lentes recebidos na assinatura'
    },
    {
      label: 'Próxima Entrega',
      value: formattedNextDelivery,
      icon: <Calendar className="h-6 w-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      tooltip: 'Data prevista para a próxima entrega de lentes'
    },
    {
      label: 'Taxa de Pontualidade',
      value: `${punctualityRate}%`,
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
      tooltip: 'Percentual de entregas realizadas dentro do prazo'
    }
  ]

  // Variantes de animação
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-6 w-6 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted rounded mb-2" />
              <div className="h-3 w-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('border-red-200 bg-red-50 dark:bg-red-950', className)}>
        <CardContent className="flex items-center gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
        </CardContent>
      </Card>
    )
  }

  // Não renderiza até estar montado (previne hidratação mismatch)
  if (!mounted) {
    return null
  }

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}
      >
        {metrics.map((metric, index) => (
          <motion.div key={metric.label} variants={itemVariants}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="cursor-help hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </CardTitle>
                    <div className={cn('rounded-full p-2', metric.bgColor)}>
                      <div className={metric.color}>{metric.icon}</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl font-bold">{metric.value}</div>
                      {metric.trend && (
                        <div
                          className={cn(
                            'flex items-center gap-1 text-xs font-medium',
                            metric.trend.isPositive
                              ? 'text-green-600'
                              : 'text-red-600'
                          )}
                        >
                          <TrendingUp
                            className={cn(
                              'h-3 w-3',
                              !metric.trend.isPositive && 'rotate-180'
                            )}
                          />
                          {metric.trend.value}%
                        </div>
                      )}
                    </div>
                    {metric.label === 'Taxa de Pontualidade' && (
                      <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-green-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${punctualityRate}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{metric.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        ))}
      </motion.div>
    </TooltipProvider>
  )
}
