'use client'

import { useState, useEffect } from 'react'
import { PlanSelector } from './PlanSelector'
import { LensSelector } from './LensSelector'
import { AddOnsSelector } from './AddOnsSelector'
import { OrderSummary } from './OrderSummary'
import { Check, Loader2, TrendingDown, X } from 'lucide-react'
import { FlowData, LensData, ContactData } from '@/types/subscription'
import { CalculatorResult } from '@/types/calculator'
import { formatCurrency } from '@/lib/calculator'
import { useAsaasPayment } from '@/hooks/useAsaasPayment'
import { useSearchParams } from 'next/navigation'

type FlowStep = 'plan' | 'lens' | 'addons' | 'summary'

export function SubscriptionFlow() {
    const searchParams = useSearchParams()
    const [currentStep, setCurrentStep] = useState<FlowStep>('plan')
    const [flowData, setFlowData] = useState<FlowData>({
        planId: null,
        billingCycle: 'monthly',
        lensData: null,
        addOns: []
    })
    const [calculatorData, setCalculatorData] = useState<CalculatorResult | null>(null)
    const [showCalculatorBanner, setShowCalculatorBanner] = useState(false)
    const { processPayment, loading, error, clearError } = useAsaasPayment()

    // Carregar dados da calculadora e AddOns da URL ao montar
    useEffect(() => {
        try {
            // Carregar dados da calculadora do localStorage
            const savedResult = localStorage.getItem('calculatorResult')
            if (savedResult) {
                const result: CalculatorResult = JSON.parse(savedResult)
                setCalculatorData(result)
                setShowCalculatorBanner(true)
            }

            // Carregar AddOns pré-selecionados da URL
            const addonsParam = searchParams.get('addons')
            if (addonsParam) {
                const preSelectedAddOns = addonsParam.split(',').filter(Boolean)
                setFlowData(prev => ({ ...prev, addOns: preSelectedAddOns }))

                // Se já tem AddOns selecionados, começar pelo step de planos ainda
                // mas com a indicação de que AddOns já foram escolhidos
                console.log('AddOns pré-selecionados da URL:', preSelectedAddOns)
            }
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error)
        }
    }, [searchParams])

    const steps = [
        { id: 'plan', label: 'Plano', number: 1 },
        { id: 'lens', label: 'Lentes', number: 2 },
        { id: 'addons', label: 'Add-ons', number: 3 },
        { id: 'summary', label: 'Resumo', number: 4 }
    ]

    const currentStepIndex = steps.findIndex(s => s.id === currentStep)

    const handlePlanSelect = (planId: string, billingCycle: 'monthly' | 'annual') => {
        setFlowData(prev => ({ ...prev, planId, billingCycle }))
        setCurrentStep('lens')
    }

    const handleLensSelect = (lensData: LensData) => {
        setFlowData(prev => ({ ...prev, lensData }))
        setCurrentStep('addons')
    }

    const handleAddOnsSelect = (addOns: string[]) => {
        setFlowData(prev => ({ ...prev, addOns }))
        setCurrentStep('summary')
    }

    const handleConfirm = async (contactData: ContactData) => {
        try {
            const response = await processPayment({ flowData, contactData })

            localStorage.removeItem('calculatorResult')

            if (response.invoiceUrl) {
                window.location.href = response.invoiceUrl
            } else {
                window.location.href = '/agendar-consulta'
            }
        } catch (processingError) {
            console.error('Erro ao confirmar pedido:', processingError)
        }
    }

    const dismissCalculatorBanner = () => {
        setShowCalculatorBanner(false)
        localStorage.removeItem('calculatorResult')
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-6xl mx-auto px-4">
                {/* Progress Steps */}
                <div className="mb-12">
                    <div className="flex items-center justify-between max-w-3xl mx-auto">
                        {steps.map((step, index) => {
                            const isCompleted = index < currentStepIndex
                            const isCurrent = step.id === currentStep
                            const isLast = index === steps.length - 1

                            return (
                                <div key={step.id} className="flex items-center flex-1">
                                    {/* Step Circle */}
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${isCompleted
                                                    ? 'bg-green-600 text-white'
                                                    : isCurrent
                                                        ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                                                        : 'bg-gray-200 text-gray-500'
                                                }`}
                                        >
                                            {isCompleted ? (
                                                <Check className="w-6 h-6" />
                                            ) : (
                                                step.number
                                            )}
                                        </div>
                                        <span
                                            className={`mt-2 text-sm font-medium ${isCurrent ? 'text-primary-600' : 'text-gray-600'
                                                }`}
                                        >
                                            {step.label}
                                        </span>
                                    </div>

                                    {/* Connector Line */}
                                    {!isLast && (
                                        <div
                                            className={`flex-1 h-1 mx-4 transition-all ${isCompleted ? 'bg-green-600' : 'bg-gray-200'
                                                }`}
                                        />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Calculator Result Banner */}
                {showCalculatorBanner && calculatorData && calculatorData.totalAnnualSavings && calculatorData.totalAnnualSavings > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-8">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <TrendingDown className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-green-900 mb-2">
                                        Seu Cálculo de Economia
                                    </h3>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-green-700">Economia Anual Total</p>
                                            <p className="text-2xl font-bold text-green-900">
                                                {formatCurrency(calculatorData.totalAnnualSavings)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-green-700">Economia Mensal</p>
                                            <p className="text-2xl font-bold text-green-900">
                                                {formatCurrency(calculatorData.totalAnnualSavings / 12)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-green-700">Plano Recomendado</p>
                                            <p className="text-lg font-semibold text-primary-600 capitalize">
                                                {calculatorData.recommendedPlan}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-green-700 mt-3">
                                        💡 Continue com o fluxo de assinatura para garantir sua economia!
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={dismissCalculatorBanner}
                                className="flex-shrink-0 ml-4 text-green-600 hover:text-green-800 transition-colors"
                                aria-label="Fechar banner"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 mb-8">
                        <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-red-900">Erro ao processar</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                        <button
                            onClick={clearError}
                            className="flex-shrink-0 text-red-600 hover:text-red-800"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Step Content */}
                <div className="bg-white rounded-2xl shadow-lg p-8 relative">
                    {/* Loading Overlay */}
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                            <div className="text-center">
                                <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
                                <p className="text-lg font-semibold text-gray-900">Processando pagamento...</p>
                                <p className="text-sm text-gray-600 mt-1">Por favor, aguarde</p>
                            </div>
                        </div>
                    )}

                    {currentStep === 'plan' && (
                        <PlanSelector
                            onSelectPlan={handlePlanSelect}
                            initialPlanId={calculatorData?.recommendedPlan}
                        />
                    )}

                    {currentStep === 'lens' && (
                        <LensSelector
                            onContinue={handleLensSelect}
                            onBack={() => setCurrentStep('plan')}
                        />
                    )}

                    {currentStep === 'addons' && (
                        <AddOnsSelector
                            onContinue={handleAddOnsSelect}
                            onBack={() => setCurrentStep('lens')}
                            preSelectedAddOns={flowData.addOns}
                        />
                    )}

                    {currentStep === 'summary' && flowData.planId && flowData.lensData && (
                        <OrderSummary
                            planId={flowData.planId}
                            billingCycle={flowData.billingCycle}
                            lensData={flowData.lensData}
                            addOns={flowData.addOns}
                            onBack={() => setCurrentStep('addons')}
                            onConfirm={handleConfirm}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
