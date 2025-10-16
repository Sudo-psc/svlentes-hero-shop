'use client'

import { CalculatorResult, PlanCalculation } from '@/types'
import { Check, Star, Crown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/calculator'

interface SubscriptionPlanCardsProps {
  result: CalculatorResult
  onWhatsAppClick: (planName: string) => void
  onLearnMoreClick: (planId: string) => void
  onSelectPlan: (planId: string) => void
}

export function SubscriptionPlanCards({
  result,
  onWhatsAppClick,
  onLearnMoreClick,
  onSelectPlan
}: SubscriptionPlanCardsProps) {
  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'monthly':
        return <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-lg">🔄</span>
        </div>
      case 'quarterly':
        return <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <Star className="w-4 h-4 text-blue-600" />
        </div>
      case 'annual':
        return <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
          <Crown className="w-4 h-4 text-yellow-600" />
        </div>
      default:
        return null
    }
  }

  const getBadgeColor = (badge: string | null) => {
    if (!badge) return null
    if (badge.includes('Escolhido')) return 'bg-blue-100 text-blue-800'
    if (badge.includes('Economia')) return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {Object.entries(result.plans).map(([planId, plan]) => (
        <PlanCard
          key={planId}
          plan={plan}
          planId={planId}
          result={result}
          getPlanIcon={getPlanIcon}
          getBadgeColor={getBadgeColor}
          onWhatsAppClick={onWhatsAppClick}
          onLearnMoreClick={onLearnMoreClick}
          onSelectPlan={onSelectPlan}
        />
      ))}
    </div>
  )
}

interface PlanCardProps {
  plan: PlanCalculation
  planId: string
  result: CalculatorResult
  getPlanIcon: (planId: string) => React.ReactNode
  getBadgeColor: (badge: string | null) => string | null
  onWhatsAppClick: (planName: string) => void
  onLearnMoreClick: (planId: string) => void
  onSelectPlan: (planId: string) => void
}

function PlanCard({
  plan,
  planId,
  result,
  getPlanIcon,
  getBadgeColor,
  onWhatsAppClick,
  onLearnMoreClick,
  onSelectPlan
}: PlanCardProps) {
  const isRecommended = result.bestSavingsPlan === planId

  const getPlanDetails = (planId: string) => {
    switch (planId) {
      case 'monthly':
        return {
          name: 'Mensal Flexível',
          description: 'Flexibilidade máxima sem compromisso',
          discount: 5,
          payment: 'Mensal recorrente',
          cancellation: 'A qualquer momento',
          shipping: 'Grátis em Caratinga (acima R$ 150)',
          benefits: []
        }
      case 'quarterly':
        return {
          name: 'Trimestral',
          description: 'Equilíbrio perfeito entre economia e flexibilidade',
          discount: 10,
          payment: '3x sem juros',
          cancellation: 'Após 3 meses',
          shipping: 'Grátis em todo Brasil',
          benefits: ['Estojo + Solução de Limpeza (R$ 50)']
        }
      case 'annual':
        return {
          name: 'Anual Premium',
          description: 'Máxima economia com benefícios exclusivos',
          discount: 15,
          payment: '12x sem juros',
          cancellation: 'Multa 30% após cancelamento',
          shipping: 'Grátis em todo Brasil',
          benefits: ['Kit Completo (R$ 100)', '1 Consulta Reavaliação (R$ 200)']
        }
      default:
        return { name: '', description: '', discount: 0, payment: '', cancellation: '', shipping: '', benefits: [] }
    }
  }

  const details = getPlanDetails(planId)
  const isAnnual = planId === 'annual'

  return (
    <div
      className={cn(
        'relative bg-white rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-xl',
        isRecommended
          ? 'border-primary-600 shadow-lg scale-105'
          : 'border-gray-200 hover:border-primary-300'
      )}
    >
      {/* Badge */}
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Recomendado
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        {getPlanIcon(planId)}
        <h3 className="text-xl font-bold text-gray-900 mt-3">{details.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{details.description}</p>

        {/* Discount Badge */}
        <div className="mt-3 inline-flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
          <TrendingUp className="w-4 h-4" />
          <span>{details.discount}% OFF</span>
        </div>
      </div>

      {/* Pricing */}
      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-primary-600">
          {formatCurrency(plan.finalPrice)}
        </div>
        {!isAnnual && (
          <div className="text-sm text-gray-500 mt-1">
            {planId === 'monthly' ? 'por mês' : 'por trimestre'}
          </div>
        )}
        {isAnnual && (
          <div className="text-sm text-gray-500 mt-1">
            {formatCurrency(plan.installmentValue)} por mês
          </div>
        )}
      </div>

      {/* Original Price */}
      {plan.discountAmount > 0 && (
        <div className="text-center mb-4">
          <div className="text-sm text-gray-500 line-through">
            De: {formatCurrency(plan.originalPrice)}
          </div>
          <div className="text-sm font-medium text-green-600">
            Economia: {formatCurrency(plan.discountAmount)}
          </div>
        </div>
      )}

      {/* Features */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-2">
          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span className="text-sm text-gray-700">{details.payment}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span className="text-sm text-gray-700">{details.shipping}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span className="text-sm text-gray-700">Cancelamento: {details.cancellation}</span>
        </div>

        {/* Benefits */}
        {details.benefits.map((benefit, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-gray-700">{benefit}</span>
          </div>
        ))}

        {/* Annual Savings */}
        {isAnnual && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm font-medium text-green-900">
              Economia total anual
            </div>
            <div className="text-xl font-bold text-green-700">
              {formatCurrency(plan.savingsVsRetail)}
            </div>
          </div>
        )}
      </div>

      {/* CTA Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => onSelectPlan(planId)}
          className={cn(
            'w-full py-3 px-4 rounded-lg font-semibold transition-colors',
            isRecommended
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
          )}
        >
          Escolher este plano
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onLearnMoreClick(planId)}
            className="py-2 px-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Saber mais
          </button>
          <button
            onClick={() => onWhatsAppClick(details.name)}
            className="py-2 px-3 text-sm text-green-600 hover:text-green-700 transition-colors"
          >
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}