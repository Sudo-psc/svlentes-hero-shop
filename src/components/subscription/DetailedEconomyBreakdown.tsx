'use client'

import { CalculatorResult } from '@/types'
import { formatCurrency } from '@/lib/calculator'
import { cn } from '@/lib/utils'

interface DetailedEconomyBreakdownProps {
  result: CalculatorResult
  selectedPlan: 'monthly' | 'annual'
  onPlanChange: (plan: 'monthly' | 'annual') => void
}

export function DetailedEconomyBreakdown({
  result,
  selectedPlan,
  onPlanChange
}: DetailedEconomyBreakdownProps) {
  const plan = result.plans[selectedPlan]
  const otherPlan = result.plans[selectedPlan === 'monthly' ? 'annual' : 'monthly']

  // Cálculos detalhados
  const monthlyRetailCost = result.baseMonthlyCost
  const annualRetailCost = result.baseMonthlyCost * 12
  const planMonthlyCost = plan.finalPrice / (plan.planId === 'monthly' ? 1 : 12)
  const planAnnualCost = plan.effectiveAnnualCost

  // Benefícios do plano anual
  const isAnnual = selectedPlan === 'annual'
  const annualBenefits = [
    {
      name: 'Kit Completo de Lentes',
      value: 100,
      description: 'Lentes de teste e soluções de limpeza',
      icon: '🧴'
    },
    {
      name: 'Consulta de Reavaliação',
      value: 200,
      description: 'Avaliação oftalmológica completa',
      icon: '👨‍⚕️'
    },
    {
      name: 'Frete Grátis Todo Brasil',
      value: 120,
      description: 'Entregas automáticas sem custo',
      icon: '🚚'
    },
    {
      name: 'Suporte Prioritário',
      value: 150,
      description: 'Atendimento exclusivo para assinantes',
      icon: '⭐'
    }
  ]

  return (
    <div className="space-y-4">
      {/* Mobile-First Plan Selection Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 touch-manipulation">
        <button
          onClick={() => onPlanChange('monthly')}
          className={cn(
            'flex-1 py-3 px-4 rounded-md text-sm font-bold transition-all duration-200 min-h-[44px]',
            selectedPlan === 'monthly'
              ? 'bg-white text-blue-600 shadow-md transform scale-105 border-2 border-blue-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          <div>
            <div>💳 Mensal</div>
            <div className="text-xs font-normal opacity-75">Flexível</div>
          </div>
        </button>
        <button
          onClick={() => onPlanChange('annual')}
          className={cn(
            'flex-1 py-3 px-4 rounded-md text-sm font-bold transition-all duration-200 min-h-[44px]',
            selectedPlan === 'annual'
              ? 'bg-white text-green-600 shadow-md transform scale-105 border-2 border-green-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          <div>
            <div>💎 Anual</div>
            <div className="text-xs font-normal opacity-75">Economia+</div>
          </div>
        </button>
      </div>

      {/* Selected Plan Card - Mobile Optimized */}
      <div className={cn(
        'rounded-xl p-4 sm:p-5 border-2',
        selectedPlan === 'monthly'
          ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-600 shadow-lg'
          : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-600 shadow-lg'
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.planName}</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {selectedPlan === 'monthly'
                ? '✨ Flexibilidade sem compromisso • Cancele quando quiser'
                : '💎 12 meses de benefícios exclusivos • Economia máxima'
              }
            </p>
          </div>
          <div className="text-right bg-white/50 rounded-xl p-3 sm:p-4 border border-white/70">
            <div className={cn(
              'text-xl sm:text-2xl font-bold',
              selectedPlan === 'monthly' ? 'text-blue-600' : 'text-green-600'
            )}>
              {formatCurrency(planMonthlyCost)}
            </div>
            <div className="text-xs text-gray-600">por mês</div>
          </div>
        </div>

        {/* Plan Details - Mobile Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="bg-white/30 rounded-lg p-3 border border-white/50">
            <span className="text-gray-600 block text-xs mb-1">🎯 Desconto:</span>
            <div className="font-bold text-lg">
              {Math.round(plan.discount * 100)}%
            </div>
            <div className="text-xs text-gray-500">
              {formatCurrency(plan.discountAmount)} de economia
            </div>
          </div>
          <div className="bg-white/30 rounded-lg p-3 border border-white/50">
            <span className="text-gray-600 block text-xs mb-1">💳 Pagamento:</span>
            <div className="font-bold text-lg">
              {selectedPlan === 'monthly' ? 'Mensal' : '12x'}
            </div>
            <div className="text-xs text-gray-500">
              {selectedPlan === 'monthly' ? 'Sem juros' : 'Sem juros'}
            </div>
          </div>
        </div>

        {selectedPlan === 'annual' && (
          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="text-xs text-green-700 font-medium mb-2">
              ✨ Benefícios Exclusivos do Plano Anual:
            </div>
            <div className="space-y-1">
              {result.plans.annual.totalBenefitsValue > 0 ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Valor dos benefícios:</span>
                  <span className="font-semibold text-green-600">
                    +{formatCurrency(result.plans.annual.totalBenefitsValue)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Frete grátis:</span>
                <span className="font-semibold text-green-600">Incluso</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Cost Comparison */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-3">💰 Análise Completa de Economia</h3>

        <div className="space-y-3">
          {/* Monthly Cost Comparison */}
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Custo mensal sem assinatura:</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(monthlyRetailCost)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Seu custo com assinatura:</span>
            <span className={cn(
              'font-semibold text-lg',
              selectedPlan === 'monthly' ? 'text-blue-600' : 'text-green-600'
            )}>
              {formatCurrency(planMonthlyCost)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Economia mensal:</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(monthlyRetailCost - planMonthlyCost)}
            </span>
          </div>

          {/* Annual Projection */}
          <div className="bg-gray-50 rounded-lg p-3 mt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Custo anual sem assinatura:</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(annualRetailCost)}
              </span>
            </div>

            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Seu custo anual com assinatura:</span>
              <span className={cn(
                'font-semibold',
                selectedPlan === 'monthly' ? 'text-blue-600' : 'text-green-600'
              )}>
                {formatCurrency(planAnnualCost)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-700">Sua economia total anual:</span>
              <span className="font-bold text-green-600 text-lg">
                {formatCurrency(plan.savingsVsRetail)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Annual Benefits Breakdown (only for annual plan) */}
      {isAnnual && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <h3 className="font-bold text-gray-900 mb-3">🎁 Benefícios Inclusos no Plano Anual</h3>

          <div className="space-y-2">
            {annualBenefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="text-lg">{benefit.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-900">{benefit.name}</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(benefit.value)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm text-gray-700">Valor total dos benefícios:</span>
              <span className="font-bold text-green-600">
                {formatCurrency(annualBenefits.reduce((sum, b) => sum + b.value, 0))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Alternative Plan Suggestion */}
      <div className="text-center p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 mb-1">
          Ou experimente o plano{' '}
          <button
            onClick={() => onPlanChange(selectedPlan === 'monthly' ? 'annual' : 'monthly')}
            className={cn(
              'font-semibold underline hover:no-underline',
              selectedPlan === 'monthly' ? 'text-green-600' : 'text-blue-600'
            )}
          >
            {selectedPlan === 'monthly' ? 'Anual' : 'Mensal'}
          </button>
        </p>
        <p className="text-xs text-gray-500">
          {selectedPlan === 'monthly'
            ? `Economize adicional ${formatCurrency(result.plans.annual.savingsVsRetail - plan.savingsVsRetail)} por ano`
            : 'Maior flexibilidade, cancele quando quiser'
          }
        </p>
      </div>

      {/* Trust Indicators */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <div>💰 Pagamentos parcelados • 🚚 Entregas automáticas</div>
        <div>👨‍⚕️ Acompanhamento médico • 🛡️ Suporte especializado</div>
      </div>
    </div>
  )
}