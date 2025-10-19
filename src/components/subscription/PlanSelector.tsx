'use client'

import { useState } from 'react'
import { Check, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { pricingPlans } from '@/data/pricing-plans'
import { trackPlanSelection } from '@/lib/conversion-tracking'

interface PlanSelectorProps {
    onSelectPlan: (planId: string, billingCycle: 'monthly' | 'annual') => void
    initialPlanId?: string
}

export function PlanSelector({ onSelectPlan, initialPlanId }: PlanSelectorProps) {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
    const [selectedPlan, setSelectedPlan] = useState<string | null>(initialPlanId || null)

    const handleSelectPlan = (planId: string) => {
        setSelectedPlan(planId)
        onSelectPlan(planId, billingCycle)

        const plan = pricingPlans.find(item => item.id === planId)
        if (plan) {
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual
            trackPlanSelection({
                planId,
                planName: plan.name,
                billingInterval: billingCycle,
                price,
                planTier: plan.id,
                quantity: 1,
            })
        }
    }

    return (
        <div className="space-y-6">
            {/* Billing Cycle Toggle */}
            <div className="flex justify-center">
                <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'monthly'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Mensal
                    </button>
                    <button
                        onClick={() => setBillingCycle('annual')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'annual'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Anual
                        <span className="ml-2 text-xs text-green-600 font-semibold">
                            Economize 1 mês
                        </span>
                    </button>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                {pricingPlans.map((plan) => {
                    const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual / 12
                    const isSelected = selectedPlan === plan.id

                    return (
                        <div
                            key={plan.id}
                            className={`relative bg-white rounded-xl border-2 transition-all ${isSelected
                                    ? 'border-primary-600 shadow-lg scale-105'
                                    : plan.recommended
                                        ? 'border-primary-300 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {/* Recommended Badge */}
                            {plan.recommended && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <div className="bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                                        <Star className="w-3 h-3 fill-current" />
                                        <span>Mais Popular</span>
                                    </div>
                                </div>
                            )}

                            <div className="p-6">
                                {/* Plan Header */}
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-baseline justify-center">
                                        <span className="text-4xl font-bold text-gray-900">
                                            R$ {price.toFixed(2)}
                                        </span>
                                        <span className="text-gray-600 ml-2">/mês</span>
                                    </div>
                                    {billingCycle === 'annual' && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            R$ {plan.priceAnnual.toFixed(2)} cobrado anualmente
                                        </p>
                                    )}
                                </div>

                                {/* Features List */}
                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start space-x-3">
                                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA Button */}
                                <Button
                                    onClick={() => handleSelectPlan(plan.id)}
                                    variant={isSelected ? 'default' : plan.recommended ? 'default' : 'outline'}
                                    className="w-full"
                                >
                                    {isSelected ? 'Selecionado' : plan.ctaText}
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
