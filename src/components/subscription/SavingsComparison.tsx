'use client'

import { CalculatorResult } from '@/types'
import { TrendingDown, PiggyBank, Gift, Shield } from 'lucide-react'
import { formatCurrency } from '@/lib/calculator'

interface SavingsComparisonProps {
  result: CalculatorResult
}

export function SavingsComparison({ result }: SavingsComparisonProps) {
  const retailCost = result.retailAnnualCost
  const monthlyPlan = result.plans.monthly
  const quarterlyPlan = result.plans.quarterly
  const annualPlan = result.plans.annual

  const savingsData = [
    {
      name: 'Comprando online avulso',
      cost: retailCost,
      icon: <TrendingDown className="w-5 h-5 text-red-500" />,
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-700'
    },
    {
      name: 'Plano Mensal Saraiva Vision',
      cost: monthlyPlan.effectiveAnnualCost,
      icon: <PiggyBank className="w-5 h-5 text-blue-500" />,
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700'
    },
    {
      name: 'Plano Trimestral',
      cost: quarterlyPlan.effectiveAnnualCost,
      icon: <Gift className="w-5 h-5 text-purple-500" />,
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-700'
    },
    {
      name: 'Plano Anual + Benefícios',
      cost: annualPlan.effectiveAnnualCost - annualPlan.totalBenefitsValue,
      icon: <Shield className="w-5 h-5 text-green-500" />,
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-700'
    }
  ]

  const maxSavings = Math.max(
    monthlyPlan.savingsVsRetail,
    quarterlyPlan.savingsVsRetail,
    annualPlan.savingsVsRetail
  )

  const bestPlan = monthlyPlan.savingsVsRetail === maxSavings ? 'Mensal' :
                  quarterlyPlan.savingsVsRetail === maxSavings ? 'Trimestral' : 'Anual'

  const totalBenefitValue = annualPlan.totalBenefitsValue

  return (
    <div className="bg-gradient-to-br from-primary-50 to-cyan-50 rounded-2xl p-8 border border-primary-200">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Comparação de Economia Anual
        </h2>
        <p className="text-gray-600">
          Economia real comparada com compras avulsas online
        </p>
      </div>

      {/* Savings Cards */}
      <div className="grid gap-4 mb-8">
        {savingsData.map((item, index) => {
          const savings = retailCost - item.cost
          const savingsPercentage = ((savings / retailCost) * 100).toFixed(1)
          const isBest = index === 3 // Annual plan is always positioned as best

          return (
            <div
              key={index}
              className={cn(
                'relative p-6 rounded-xl border-2 transition-all duration-300',
                item.color,
                isBest && 'ring-2 ring-green-400 shadow-lg'
              )}
            >
              {isBest && (
                <div className="absolute -top-3 left-4">
                  <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Melhor Economia
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={cn('p-3 rounded-full bg-white', isBest && 'ring-2 ring-green-400')}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className={cn('font-semibold text-lg', item.textColor)}>
                      {item.name}
                    </h3>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(item.cost)}
                      <span className="text-sm font-normal text-gray-500">/ano</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {savings > 0 && (
                    <div className="text-sm font-medium text-green-600 mb-1">
                      Economia: {formatCurrency(savings)}
                    </div>
                  )}
                  <div className="text-xs text-gray-600">
                    {savingsPercentage}% de desconto
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-700 ease-out',
                    index === 0 ? 'bg-red-400' :
                    index === 1 ? 'bg-blue-400' :
                    index === 2 ? 'bg-purple-400' :
                    'bg-green-400'
                  )}
                  style={{
                    width: `${((retailCost - savings) / retailCost) * 100}%`,
                    transitionDelay: `${index * 100}ms`
                  }}
                ></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {formatCurrency(maxSavings)}
          </div>
          <div className="text-sm text-gray-600">
            Economia máxima com <span className="font-semibold">Plano {bestPlan}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {totalBenefitValue > 0 ? formatCurrency(totalBenefitValue) : formatCurrency(50)}
          </div>
          <div className="text-sm text-gray-600">
            Valor em benefícios inclusos
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {((maxSavings / retailCost) * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600">
            Percentual máximo de economia
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center space-x-2 bg-white rounded-lg px-6 py-3 border border-gray-200">
          <Shield className="w-5 h-5 text-green-600" />
          <span className="text-sm text-gray-700">
            <strong>Garantia Saraiva Vision:</strong> Suporte médico, entregas automáticas e cancelamento flexível
          </span>
        </div>
      </div>
    </div>
  )
}