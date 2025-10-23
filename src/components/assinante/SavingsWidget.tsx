'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  PiggyBank,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Info,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

/**
 * Interface para dados de economia
 */
interface SavingsData {
  /**
   * Total economizado desde o início da assinatura
   */
  totalSavings: number

  /**
   * Economia do mês atual
   */
  monthlySavings: number

  /**
   * Comparação com o mês anterior (percentual)
   */
  monthlyChange?: number

  /**
   * Custo total se comprasse avulso
   */
  retailCost: number

  /**
   * Custo total da assinatura
   */
  subscriptionCost: number

  /**
   * Número de meses como assinante
   */
  monthsSubscribed?: number
}

/**
 * Props do componente SavingsWidget
 */
interface SavingsWidgetProps {
  /**
   * Dados de economia
   */
  savings?: SavingsData

  /**
   * Estado de carregamento
   */
  isLoading?: boolean

  /**
   * Mensagem de erro
   */
  error?: string

  /**
   * Exibir mini sparkline chart
   */
  showSparkline?: boolean

  /**
   * Classe CSS adicional
   */
  className?: string
}

/**
 * Componente SavingsWidget
 * Exibe economia total, economia mensal e comparação com compra avulsa
 */
export function SavingsWidget({
  savings = {
    totalSavings: 0,
    monthlySavings: 0,
    retailCost: 0,
    subscriptionCost: 0,
    monthsSubscribed: 0
  },
  isLoading = false,
  error,
  showSparkline = false,
  className
}: SavingsWidgetProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calcula percentual de economia
  const savingsPercentage =
    savings.retailCost > 0
      ? Math.round((savings.totalSavings / savings.retailCost) * 100)
      : 0

  // Determina se economia mensal aumentou ou diminuiu
  const monthlyTrend = savings.monthlyChange
    ? savings.monthlyChange > 0
      ? 'increase'
      : 'decrease'
    : null

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-12 w-48 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-muted rounded animate-pulse" />
            <div className="h-16 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('border-red-200 bg-red-50 dark:bg-red-950', className)}>
        <CardContent className="flex items-center gap-3 pt-6">
          <Info className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
        </CardContent>
      </Card>
    )
  }

  // Não renderiza até estar montado
  if (!mounted) {
    return null
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Card className={cn('overflow-hidden', className)}>
        {/* Header com gradiente */}
        <CardHeader className="bg-gradient-to-br from-green-50 to-cyan-50 dark:from-green-950 dark:to-cyan-950 pb-4">
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <PiggyBank className="h-5 w-5" />
            Suas Economias
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Valores baseados na comparação entre o custo da assinatura e compras avulsas
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Total Economizado - Destaque Principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-sm text-muted-foreground mb-2">Total Economizado</p>
            <motion.div
              className="text-4xl font-bold text-green-600 dark:text-green-400 flex items-center justify-center gap-2"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Sparkles className="h-8 w-8 text-amber-500" />
              {formatCurrency(savings.totalSavings)}
            </motion.div>
            {savingsPercentage > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {savingsPercentage}% de economia vs compra avulsa
              </p>
            )}
          </motion.div>

          {/* Economia Mensal e Comparação */}
          <div className="grid grid-cols-2 gap-4">
            {/* Economia do Mês */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 border border-cyan-200 dark:border-cyan-800"
            >
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-4 w-4 text-cyan-600" />
                {monthlyTrend && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div
                        className={cn(
                          'flex items-center gap-1 text-xs font-medium',
                          monthlyTrend === 'increase'
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {monthlyTrend === 'increase' ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(savings.monthlyChange || 0)}%
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {monthlyTrend === 'increase' ? 'Aumento' : 'Redução'} em
                        relação ao mês anterior
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-1">Este mês</p>
              <p className="text-xl font-bold text-cyan-700 dark:text-cyan-300">
                {formatCurrency(savings.monthlySavings)}
              </p>
            </motion.div>

            {/* Comparação Compra Avulsa */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-lg bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950 dark:to-slate-950 border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-4 w-4 text-gray-600" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Custo avulso</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xl font-bold text-gray-700 dark:text-gray-300 cursor-help">
                    {formatCurrency(savings.retailCost)}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p>Se você comprasse lentes avulsas:</p>
                    <p className="font-medium">
                      {formatCurrency(savings.retailCost)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Você pagou: {formatCurrency(savings.subscriptionCost)}
                    </p>
                    <p className="text-xs font-medium text-green-600">
                      Economia: {formatCurrency(savings.totalSavings)}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          </div>

          {/* Informações Adicionais */}
          {savings.monthsSubscribed !== undefined && savings.monthsSubscribed > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="pt-4 border-t"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Média mensal de economia</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(savings.totalSavings / savings.monthsSubscribed)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                <span>Tempo como assinante</span>
                <span className="font-medium text-foreground">
                  {savings.monthsSubscribed} {savings.monthsSubscribed === 1 ? 'mês' : 'meses'}
                </span>
              </div>
            </motion.div>
          )}

          {/* Mini Sparkline Chart (opcional) */}
          {showSparkline && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="pt-4 border-t"
            >
              <p className="text-xs text-muted-foreground mb-2">
                Tendência de economia
              </p>
              <div className="h-16 flex items-end gap-1">
                {/* Exemplo de sparkline com divs - em produção usar biblioteca como recharts */}
                {[60, 75, 70, 85, 80, 90, 100].map((height, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-green-500 to-green-400 rounded-t"
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
