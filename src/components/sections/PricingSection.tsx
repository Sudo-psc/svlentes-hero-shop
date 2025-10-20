'use client'
import { useState } from 'react'
import { PricingPlan, PricingSectionProps } from '@/types'
import { Tabs, TabItem } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
    handleSubscription,
    handleScheduleConsultation,
    trackTabChange
} from '@/lib/pricing-actions'
import { trackEvent } from '@/lib/analytics'
interface PricingCardProps {
    plan: PricingPlan
    isAnnual: boolean
}
function PricingCard({ plan, isAnnual }: PricingCardProps) {
    const price = isAnnual ? plan.priceAnnual : plan.priceMonthly
    const monthlyPrice = isAnnual ? plan.priceAnnual / 12 : plan.priceMonthly
    const savings = isAnnual ? (plan.priceMonthly * 12 - plan.priceAnnual) : 0
    return (
        <div className={cn(
            'relative bg-white rounded-2xl border-2 p-8 shadow-lg transition-all duration-300 hover:shadow-xl',
            plan.recommended
                ? 'border-primary-500 ring-2 ring-primary-100 scale-105'
                : 'border-gray-200 hover:border-primary-300'
        )}>
            {plan.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge variant="default" className="px-4 py-2 text-sm font-semibold">
                        Mais Popular
                    </Badge>
                </div>
            )}
            <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                    <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold text-gray-900">
                            R$ {monthlyPrice.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-gray-600 ml-2">/mês</span>
                    </div>
                    {isAnnual && (
                        <div className="mt-2">
                            <p className="text-sm text-gray-600">
                                R$ {price.toFixed(2).replace('.', ',')} cobrado anualmente
                            </p>
                            {savings > 0 && (
                                <p className="text-sm font-medium text-green-600">
                                    Economize R$ {savings.toFixed(2).replace('.', ',')} por ano
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <svg
                            className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                    </li>
                ))}
            </ul>
            <div className="space-y-3">
                <Button
                    onClick={async () => {
                        try {
                            await handleSubscription({
                                planId: plan.id,
                                billingInterval: isAnnual ? 'annual' : 'monthly',
                            })
                        } catch (error) {
                            console.error('Erro ao processar assinatura:', error)
                            alert('Erro ao processar assinatura. Tente novamente.')
                        }
                    }}
                    className={cn(
                        'w-full py-3 text-lg font-semibold',
                        plan.recommended
                            ? 'bg-primary-600 hover:bg-primary-700 text-white'
                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                    )}
                >
                    {plan.ctaText}
                </Button>
                <Button
                    variant="outline"
                    onClick={async () => {
                        try {
                            await handleScheduleConsultation({
                                planId: plan.id,
                            })
                        } catch (error) {
                            console.error('Erro ao agendar consulta:', error)
                            alert('Erro ao agendar consulta. Tente novamente.')
                        }
                    }}
                    className="w-full py-3 text-lg font-medium border-2"
                >
                    Agendar Consulta
                </Button>
            </div>
        </div>
    )
}
interface ComparisonTableProps {
    plans: PricingPlan[]
    features: string[]
    planComparison: Record<string, boolean | string>[]
    isAnnual: boolean
}
function ComparisonTable({ plans, features, planComparison, isAnnual }: ComparisonTableProps) {
    return (
        <div className="mt-16">
            {/* Mobile View - Stacked Cards */}
            <div className="block lg:hidden space-y-8">
                {plans.map((plan) => (
                    <div key={plan.id} className={cn(
                        'bg-white rounded-xl border-2 p-6 shadow-lg',
                        plan.recommended
                            ? 'border-primary-500 ring-2 ring-primary-100'
                            : 'border-gray-200'
                    )}>
                        {/* Plan Header */}
                        <div className="text-center mb-6">
                            {plan.recommended && (
                                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 mb-3">
                                    Mais Popular
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                            <div className="text-2xl font-bold text-primary-600">
                                R$ {(isAnnual ? plan.priceAnnual / 12 : plan.priceMonthly).toFixed(2).replace('.', ',')}/mês
                            </div>
                            {isAnnual && (
                                <div className="text-sm text-gray-600 mt-1">
                                    R$ {plan.priceAnnual.toFixed(2).replace('.', ',')} cobrado anualmente
                                </div>
                            )}
                        </div>
                        {/* Features List */}
                        <div className="space-y-3">
                            {planComparison.map((comparison, index) => {
                                const value = comparison[plan.id]
                                return (
                                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                                        <span className="text-sm font-medium text-gray-700">
                                            {comparison.feature}
                                        </span>
                                        <div className="flex-shrink-0">
                                            {typeof value === 'boolean' ? (
                                                value ? (
                                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                )
                                            ) : (
                                                <span className="text-sm font-medium text-gray-900">{value}</span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        {/* CTA Button */}
                        <div className="mt-6">
                            <Button
                                onClick={async () => {
                                    try {
                                        await handleSubscription({
                                            planId: plan.id,
                                            billingInterval: isAnnual ? 'annual' : 'monthly',
                                        })
                                        // Track plan selection for analytics
                                    } catch (error) {
                                        console.error('Erro ao processar assinatura:', error)
                                        alert('Erro ao processar assinatura. Tente novamente.')
                                    }
                                }}
                                className={cn(
                                    'w-full py-3 text-base font-semibold',
                                    plan.recommended
                                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                                )}
                            >
                                {plan.ctaText}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
            {/* Desktop View - Comparison Table */}
            <div className="hidden lg:block overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden shadow-xl ring-1 ring-black ring-opacity-5 rounded-2xl">
                        <table className="min-w-full divide-y divide-gray-300">
                            {/* Table Header */}
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 w-1/4">
                                        <div className="flex items-center">
                                            <svg className="w-5 h-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                            </svg>
                                            Recursos Incluídos
                                        </div>
                                    </th>
                                    {plans.map((plan) => (
                                        <th key={plan.id} className={cn(
                                            'px-6 py-6 text-center text-sm font-semibold relative',
                                            plan.recommended
                                                ? 'bg-primary-50 text-primary-900 border-l-2 border-r-2 border-primary-200'
                                                : 'text-gray-900'
                                        )}>
                                            {plan.recommended && (
                                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                                    <div className="inline-flex items-center px-4 py-1 rounded-full text-xs font-bold bg-primary-600 text-white shadow-lg">
                                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18l-8-4.5L2 9l8-4.5L18 9v4.5L10 18z" clipRule="evenodd" />
                                                        </svg>
                                                        Mais Popular
                                                    </div>
                                                </div>
                                            )}
                                            <div className="mt-2">
                                                <div className="text-lg font-bold">{plan.name}</div>
                                                <div className="text-2xl font-bold text-primary-600 mt-2">
                                                    R$ {(isAnnual ? plan.priceAnnual / 12 : plan.priceMonthly).toFixed(2).replace('.', ',')}
                                                    <span className="text-sm font-normal text-gray-600">/mês</span>
                                                </div>
                                                {isAnnual && (
                                                    <div className="text-xs text-gray-600 mt-1">
                                                        R$ {plan.priceAnnual.toFixed(2).replace('.', ',')} anual
                                                    </div>
                                                )}
                                                {isAnnual && (
                                                    <div className="text-xs font-medium text-green-600 mt-1">
                                                        Economize R$ {(plan.priceMonthly * 12 - plan.priceAnnual).toFixed(2).replace('.', ',')}
                                                    </div>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            {/* Table Body */}
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {planComparison.map((comparison, index) => (
                                    <tr key={index} className={cn(
                                        'transition-colors hover:bg-gray-50',
                                        index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                                    )}>
                                        <td className="px-8 py-4 text-sm font-medium text-gray-900 bg-gray-50">
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 bg-primary-400 rounded-full mr-3"></div>
                                                {comparison.feature}
                                            </div>
                                        </td>
                                        {plans.map((plan) => {
                                            const value = comparison[plan.id]
                                            return (
                                                <td key={plan.id} className={cn(
                                                    'px-6 py-4 text-center text-sm',
                                                    plan.recommended
                                                        ? 'bg-primary-25 border-l border-r border-primary-100'
                                                        : ''
                                                )}>
                                                    {typeof value === 'boolean' ? (
                                                        <div className="flex justify-center">
                                                            {value ? (
                                                                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                                                                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                                                                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className={cn(
                                                            'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                                                            plan.recommended
                                                                ? 'bg-primary-100 text-primary-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        )}>
                                                            {value}
                                                        </span>
                                                    )}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                                {/* CTA Row */}
                                <tr className="bg-gray-50">
                                    <td className="px-8 py-6 text-sm font-semibold text-gray-900">
                                        <div className="flex items-center">
                                            <svg className="w-5 h-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                                            </svg>
                                            Começar Agora
                                        </div>
                                    </td>
                                    {plans.map((plan) => (
                                        <td key={plan.id} className={cn(
                                            'px-6 py-6 text-center',
                                            plan.recommended
                                                ? 'bg-primary-50 border-l border-r border-primary-100'
                                                : ''
                                        )}>
                                            <Button
                                                onClick={async () => {
                                                    try {
                                                        await handleSubscription({
                                                            planId: plan.id,
                                                            billingInterval: isAnnual ? 'annual' : 'monthly',
                                                        })
                                                        // Track plan selection for analytics
                                                    } catch (error) {
                                                        console.error('Erro ao processar assinatura:', error)
                                                        alert('Erro ao processar assinatura. Tente novamente.')
                                                    }
                                                }}
                                                className={cn(
                                                    'w-full py-3 text-sm font-semibold transition-all duration-200',
                                                    plan.recommended
                                                        ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                                                )}
                                            >
                                                {plan.ctaText}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={async () => {
                                                    try {
                                                        await handleScheduleConsultation({
                                                            planId: plan.id,
                                                        })
                                                    } catch (error) {
                                                        console.error('Erro ao agendar consulta:', error)
                                                        alert('Erro ao agendar consulta. Tente novamente.')
                                                    }
                                                }}
                                                className="w-full mt-2 py-2 text-sm font-medium border-2"
                                            >
                                                Agendar Consulta
                                            </Button>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default function PricingSection({
    tabs,
    plans,
    comparisonTable
}: PricingSectionProps) {
    const [isAnnual, setIsAnnual] = useState(false)
    const tabItems: TabItem[] = [
        {
            id: 'monthly',
            label: tabs[0],
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                    {plans.map((plan) => (
                        <PricingCard
                            key={plan.id}
                            plan={plan}
                            isAnnual={false}
                        />
                    ))}
                </div>
            )
        },
        {
            id: 'annual',
            label: tabs[1],
            badge: '2 meses grátis',
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                    {plans.map((plan) => (
                        <PricingCard
                            key={plan.id}
                            plan={plan}
                            isAnnual={true}
                        />
                    ))}
                </div>
            )
        }
    ]
    return (
        <section id="planos-precos" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-800 text-sm font-semibold mb-6">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                        </svg>
                        Planos de Assinatura
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Escolha o Plano Ideal para Você
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                        Todos os planos incluem acompanhamento médico com Dr. Philipe Saraiva Cruz
                        e entrega gratuita em todo o Brasil
                    </p>
                    {/* Enhanced Pricing Toggle */}
                    <div className="flex items-center justify-center mb-8">
                        <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => {
                                        const previousTab = isAnnual ? 'anual' : 'mensal'
                                        setIsAnnual(false)
                                        trackTabChange('monthly')
                                        trackEvent('pricing_tab_switched', {
                                            tab: 'mensal',
                                            previous_tab: previousTab,
                                        })
                                    }}
                                    className={cn(
                                        'px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                                        !isAnnual
                                            ? 'bg-primary-600 text-white shadow-md'
                                            : 'text-gray-600 hover:text-gray-900'
                                    )}
                                >
                                    Mensal
                                </button>
                                <button
                                    onClick={() => {
                                        const previousTab = isAnnual ? 'anual' : 'mensal'
                                        setIsAnnual(true)
                                        trackTabChange('annual')
                                        trackEvent('pricing_tab_switched', {
                                            tab: 'anual',
                                            previous_tab: previousTab,
                                        })
                                    }}
                                    className={cn(
                                        'px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 relative',
                                        isAnnual
                                            ? 'bg-primary-600 text-white shadow-md'
                                            : 'text-gray-600 hover:text-gray-900'
                                    )}
                                >
                                    Anual
                                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                        2 meses grátis
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Comparison Table */}
                <ComparisonTable
                    plans={plans}
                    features={comparisonTable.features}
                    planComparison={comparisonTable.planComparison}
                    isAnnual={isAnnual}
                />
                {/* Trust Indicators */}
                <div className="mt-16 text-center">
                    <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Cancele quando quiser
                        </div>
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Primeira entrega em 48h
                        </div>
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Acompanhamento médico incluído
                        </div>
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Pagamento 100% seguro
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}