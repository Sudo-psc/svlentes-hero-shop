'use client'

import { useState } from 'react'
import { PlanSelector } from './PlanSelector'
import { LensSelector } from './LensSelector'
import { AddOnsSelector } from './AddOnsSelector'
import { OrderSummary } from './OrderSummary'
import { Check, Loader2 } from 'lucide-react'
import { FlowData, LensData, ContactData, PaymentRequest } from '@/types/subscription'

type FlowStep = 'plan' | 'lens' | 'addons' | 'summary'

export function SubscriptionFlow() {
    const [currentStep, setCurrentStep] = useState<FlowStep>('plan')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [flowData, setFlowData] = useState<FlowData>({
        planId: null,
        billingCycle: 'monthly',
        lensData: null,
        addOns: []
    })

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
        setLoading(true)
        setError(null)

        try {
            const paymentRequest: PaymentRequest = {
                planId: flowData.planId!,
                billingInterval: flowData.billingCycle,
                billingType: contactData.billingType,
                customerData: {
                    name: contactData.name,
                    email: contactData.email,
                    phone: contactData.phone,
                    cpfCnpj: contactData.cpfCnpj,
                },
                metadata: {
                    lensData: JSON.stringify(flowData.lensData),
                    addOns: JSON.stringify(flowData.addOns),
                    source: 'subscription_flow',
                    consentTimestamp: new Date().toISOString(),
                },
            }

            const response = await fetch('/api/asaas/create-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentRequest),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Erro ao processar pagamento')
            }

            const data = await response.json()

            if (data.invoiceUrl) {
                window.location.href = data.invoiceUrl
            } else {
                window.location.href = '/agendar-consulta'
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
            setError(`Erro ao processar pagamento: ${errorMessage}`)
            console.error('Erro ao confirmar pedido:', error)
        } finally {
            setLoading(false)
        }
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

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
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
                            onClick={() => setError(null)}
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
                        <PlanSelector onSelectPlan={handlePlanSelect} />
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
