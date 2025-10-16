'use client'

import { CalculatorResult } from '@/types'
import { formatCurrency } from '@/lib/calculator'
import { cn } from '@/lib/utils'

interface SubscriptionAdvantagesProps {
  result: CalculatorResult
  selectedPlan: 'monthly' | 'annual'
}

export function SubscriptionAdvantages({ result, selectedPlan }: SubscriptionAdvantagesProps) {
  const plan = result.plans[selectedPlan]

  const advantages = [
    {
      icon: '💰',
      title: 'Economia Garantida',
      description: 'Economize até 40% comparado com compras avulsas',
      value: `${Math.round((plan.savingsVsRetail / result.retailAnnualCost) * 100)}% de economia`,
      highlighted: true
    },
    {
      icon: '🚚',
      title: 'Entregas Automáticas',
      description: 'Receba suas lentes em casa sem preocupações',
      value: plan.shippingIncluded ? 'Frete grátis' : 'Frete conveniente',
      highlighted: false
    },
    {
      icon: '👨‍⚕️',
      title: 'Acompanhamento Médico',
      description: 'Suporte oftalmológico contínuo incluído',
      value: selectedPlan === 'annual' ? '1 consulta gratuita' : 'Suporte contínuo',
      highlighted: false
    },
    {
      icon: '🔄',
      title: 'Substituição Garantida',
      description: 'Trocamos suas lentes se houver qualquer problema',
      value: 'Garantia total',
      highlighted: false
    },
    {
      icon: '💳',
      title: 'Pagamento Facilitado',
      description: 'Parcelamento em até 12x sem juros',
      value: selectedPlan === 'annual' ? '12x sem juros' : 'Mensal recorrente',
      highlighted: false
    },
    {
      icon: '📱',
      title: 'Suporte Prioritário',
      description: 'Atendimento exclusivo para assinantes via WhatsApp',
      value: 'WhatsApp direto',
      highlighted: false
    }
  ]

  const comparisonPoints = [
    {
      label: 'Compras Avulsas (Farmácia)',
      monthly: result.baseMonthlyCost,
      annual: result.retailAnnualCost,
      drawbacks: ['Sem suporte médico', 'Variação de preço', 'Risco de falta', 'Sem entregas']
    },
    {
      label: `Plano ${selectedPlan === 'monthly' ? 'Mensal' : 'Anual'} SV Lentes`,
      monthly: plan.finalPrice / (selectedPlan === 'monthly' ? 1 : 12),
      annual: plan.effectiveAnnualCost,
      benefits: selectedPlan === 'annual' ? [
        `${Math.round(plan.discount * 100)}% de desconto`,
        'Kit completo (+R$ 100)',
        'Consulta gratuita (+R$ 200)',
        'Frete grátis (+R$ 120/ano)',
        'Suporte exclusivo'
      ] : [
        '5% de desconto',
        'Flexibilidade mensal',
        'Suporte contínuo',
        'Cancelamento fácil'
      ]
    }
  ]

  return (
    <div className="space-y-6">
      {/* Main Advantages */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-4 text-center">✨ Vantagens Exclusivas da Assinatura</h3>

        <div className="grid grid-cols-1 gap-3">
          {advantages.map((advantage, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center space-x-3 p-3 rounded-lg border',
                advantage.highlighted
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-100'
              )}
            >
              <div className="text-2xl">{advantage.icon}</div>
              <div className="flex-1">
                <h4 className={cn(
                  'font-semibold text-sm',
                  advantage.highlighted ? 'text-green-800' : 'text-gray-900'
                )}>
                  {advantage.title}
                </h4>
                <p className="text-xs text-gray-600">{advantage.description}</p>
              </div>
              <div className={cn(
                'text-xs font-semibold px-2 py-1 rounded',
                advantage.highlighted
                  ? 'bg-green-200 text-green-800'
                  : 'bg-gray-200 text-gray-700'
              )}>
                {advantage.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Comparison */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
        <h3 className="font-bold text-gray-900 mb-4 text-center">📊 Comparação Detalhada</h3>

        <div className="space-y-4">
          {comparisonPoints.map((comparison, index) => (
            <div key={index} className={cn(
              'p-4 rounded-lg border',
              index === 0 ? 'bg-white border-red-200' : 'bg-white border-green-200'
            )}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={cn(
                  'font-semibold text-sm',
                  index === 0 ? 'text-red-700' : 'text-green-700'
                )}>
                  {comparison.label}
                </h4>
                <div className="text-right">
                  <div className={cn(
                    'font-bold text-sm',
                    index === 0 ? 'text-red-600' : 'text-green-600'
                  )}>
                    {formatCurrency(comparison.monthly)}/mês
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(comparison.annual)}/ano
                  </div>
                </div>
              </div>

              {index === 0 ? (
                <div className="space-y-1">
                  {comparison.drawbacks.map((drawback, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs text-red-600">
                      <span className="text-red-500">✗</span>
                      <span>{drawback}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {comparison.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs text-green-600">
                      <span className="text-green-500">✓</span>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Total Savings Summary */}
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 border border-green-300">
            <div className="text-center">
              <div className="text-sm font-semibold text-green-800 mb-2">
                Sua economia total com o plano {selectedPlan === 'monthly' ? 'mensal' : 'anual'}:
              </div>
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatCurrency(plan.savingsVsRetail)}
              </div>
              <div className="text-xs text-green-700">
                {Math.round((plan.savingsVsRetail / result.retailAnnualCost) * 100)}% mais barato que compras avulsas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Benefits */}
      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center">
          <span className="text-lg mr-2">⭐</span>
          Benefícios Adicionais
        </h3>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">🎯</span>
            <span className="text-gray-700">Lentes sempre em estoque</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">📅</span>
            <span className="text-gray-700">Lembretes automáticos</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">🧪</span>
            <span className="text-gray-700">Soluções de limpeza</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">🏥</span>
            <span className="text-gray-700">Emergências 24h</span>
          </div>
        </div>
      </div>
    </div>
  )
}