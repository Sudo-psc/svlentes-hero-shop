'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import { CalculatorInput, CalculatorResult } from '@/types'
import { calculateSubscription } from '@/lib/calculator'
import { lensTypes } from '@/data/calculator-data'
import { formatCurrency } from '@/lib/calculator'
import { cn } from '@/lib/utils'
import { DetailedEconomyBreakdown } from './DetailedEconomyBreakdown'
import { SubscriptionAdvantages } from './SubscriptionAdvantages'

const CheckIcon = () => (
  <svg className="w-2.5 h-2.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

export function UltraSimpleCalculator() {
  const [input, setInput] = useState<CalculatorInput>({
    lensType: 'monthly-premium',
    selectedPlan: 'annual',
    bothEyes: true,
    differentGrades: false
  })

  // Memoize calculation result
  const result = useMemo(() => {
    try {
      return calculateSubscription(input)
    } catch (error) {
      console.error('Calculation error:', error)
      return null
    }
  }, [input])

  const handleLensTypeChange = (lensTypeId: string) => {
    setInput(prev => ({ ...prev, lensType: lensTypeId }))
  }

  const handleInputChange = (field: keyof CalculatorInput, value: any) => {
    setInput(prev => ({ ...prev, [field]: value }))
  }

  const handleWhatsAppClick = () => {
    if (!result) return;
    
    const selectedLens = result.selectedLens
    const monthlyPlan = result.plans.monthly
    const annualPlan = result.plans.annual

    const selectedPlanName = input.selectedPlan === 'monthly' ? 'Mensal sem Fidelidade' : 'Anual com Fidelidade';
    const selectedPlanValue = input.selectedPlan === 'monthly' 
      ? formatCurrency(monthlyPlan.finalPrice) 
      : formatCurrency(annualPlan.installmentValue);
    
    const message = `Olá! Quero assinar lentes de contato.

💡 Meu perfil:
• Lentes: ${selectedLens.name}
• Uso: ${input.bothEyes ? 'Ambos os olhos' : '1 olho apenas'}
• Graus diferentes: ${input.differentGrades ? 'Sim' : 'Não'}

📋 Plano escolhido:
• ${selectedPlanName}: ${selectedPlanValue}/mês

💰 Opções disponíveis:
• Mensal: ${formatCurrency(monthlyPlan.finalPrice)}/mês
• Anual: ${formatCurrency(annualPlan.installmentValue)}/mês (12x)

💸 Economia anual: ${formatCurrency(result.plans.annual.savingsVsRetail)}

Podem me ajudar com mais detalhes?`

    window.open(`https://wa.me/5533998601427?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-600 to-cyan-600">
      {/* Header */}
      <div className="text-white px-4 py-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">
          💰 Calcule sua economia
        </h1>
        <p className="text-sm sm:text-base text-primary-100 max-w-md mx-auto">
          4 escolhas rápidas • Cálculo automático • WhatsApp instantâneo
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-8 space-y-4">
        {/* Step 1: Choose Lens Type */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center">
            <span className="bg-primary-100 text-primary-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2">1</span>
            Tipo de lente
          </h3>

          <div className="space-y-2">
            {lensTypes.map((lens) => (
              <button
                key={lens.id}
                onClick={() => handleLensTypeChange(lens.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border-2 transition-all',
                  input.lensType === lens.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                      input.lensType === lens.id ? 'border-primary-600' : 'border-gray-300'
                    )}>
                      {input.lensType === lens.id && <CheckIcon />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{lens.name} {lens.icon}</div>
                      <div className="text-xs text-gray-500">{lens.brand}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary-600">
                      {lens.period === 'month' 
                        ? `R$ ${(lens.basePrice * 2).toFixed(0)}/mês`
                        : `R$ ${(lens.basePrice * 60).toFixed(0)}/mês`
                      }
                    </div>
                    <div className="text-xs text-gray-500">2 olhos</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Plan Selection */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center">
            <span className="bg-primary-100 text-primary-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2">2</span>
            Escolha seu plano
          </h3>

          <div className="space-y-2">
            <button
              onClick={() => handleInputChange('selectedPlan', 'monthly')}
              className={cn(
                'w-full text-left p-3 rounded-lg border-2 transition-all',
                input.selectedPlan === 'monthly'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                    input.selectedPlan === 'monthly' ? 'border-primary-600' : 'border-gray-300'
                  )}>
                    {input.selectedPlan === 'monthly' && <CheckIcon />}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Mensal sem Fidelidade</div>
                    <div className="text-xs text-gray-500">Cancele quando quiser</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">5% OFF</div>
                  <div className="text-xs text-gray-500">desconto</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleInputChange('selectedPlan', 'annual')}
              className={cn(
                'w-full text-left p-3 rounded-lg border-2 transition-all',
                input.selectedPlan === 'annual'
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                    input.selectedPlan === 'annual' ? 'border-green-600' : 'border-gray-300'
                  )}>
                    {input.selectedPlan === 'annual' && (
                      <svg className="w-2.5 h-2.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Anual com Fidelidade</div>
                    <div className="text-xs text-gray-500">12 meses • 12x sem juros</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">20% OFF</div>
                  <div className="text-xs text-gray-500">+ benefícios</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Step 3: Usage Details */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center">
            <span className="bg-primary-100 text-primary-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2">3</span>
            Detalhes do uso
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Usa nos dois olhos?</span>
              <button
                onClick={() => handleInputChange('bothEyes', !input.bothEyes)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  input.bothEyes ? 'bg-primary-600' : 'bg-gray-200'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    input.bothEyes ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Graus diferentes?</span>
              <button
                onClick={() => handleInputChange('differentGrades', !input.differentGrades)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  input.differentGrades ? 'bg-primary-600' : 'bg-gray-200'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    input.differentGrades ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {input.differentGrades && input.bothEyes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  ℹ️ <strong>Caixa extra incluída automaticamente</strong> no cálculo para acomodar graus diferentes.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Results - Real-time with Detailed Breakdown */}
        {result && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2">✓</span>
                Sua economia detalhada
              </h3>

              <DetailedEconomyBreakdown
                result={result}
                selectedPlan={input.selectedPlan}
                onPlanChange={(plan) => handleInputChange('selectedPlan', plan)}
              />
            </div>

            <div className="bg-white rounded-xl p-4">
              <SubscriptionAdvantages
                result={result}
                selectedPlan={input.selectedPlan}
              />
            </div>

            {/* WhatsApp CTA */}
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <button
                onClick={handleWhatsAppClick}
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold py-3 px-4 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>Enviar WhatsApp com proposta detalhada</span>
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Receba sua análise completa por WhatsApp em 2 minutos
              </p>
            </div>
          </div>
        )}

        {/* Trust */}
        <div className="text-center text-white text-xs space-y-1">
          <div>👨‍⚕️ Dr. Philipe Saraiva Cruz (CRM-MG 69.870)</div>
          <div>📍 Atendimento em Caratinga/MG</div>
          <div>🚚 Entregas automáticas • 💰 Pagamento parcelado</div>
        </div>
      </div>
    </div>
  )
}