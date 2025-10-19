'use client'

import { useState, useEffect } from 'react'
import { Calculator, TrendingDown, Save, ArrowRight, Activity, Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { calculateEconomy, formatCurrency } from '@/lib/calculator'
import { usagePatterns, lensTypes, planPrices } from '@/data/calculator-data'
import { CalculatorInput, CalculatorResult } from '@/types'

interface ImprovedCalculatorProps {
    onSaveResult?: (result: CalculatorResult) => void
}

export function ImprovedCalculator({ onSaveResult }: ImprovedCalculatorProps) {
    const [lensType, setLensType] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
    const [usagePattern, setUsagePattern] = useState<'occasional' | 'regular' | 'daily'>('regular')
    const [annualContactLensCost, setAnnualContactLensCost] = useState<number>(1200)
    const [annualConsultationCost, setAnnualConsultationCost] = useState<number>(400)
    const [result, setResult] = useState<CalculatorResult | null>(null)

    // Calcular automaticamente quando mudar qualquer valor
    useEffect(() => {
        calculateResults()
    }, [lensType, usagePattern, annualContactLensCost, annualConsultationCost])

    const calculateResults = () => {
        const input: CalculatorInput = {
            lensType,
            usagePattern,
            annualContactLensCost,
            annualConsultationCost
        }

        try {
            const calculationResult = calculateEconomy(input)
            setResult(calculationResult)
        } catch (error) {
            console.error('Erro ao calcular economia:', error)
        }
    }

    const handleSaveResult = () => {
        if (result && onSaveResult) {
            onSaveResult(result)
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
                <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <Calculator className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Calculadora de Economia</h3>
                        <p className="text-primary-100 text-sm">Veja quanto você economiza em tempo real</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Usage Pattern Selection */}
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Com que frequência você usa lentes de contato?
                    </label>
                    <div className="grid gap-3">
                        {usagePatterns.map((pattern) => (
                            <button
                                key={pattern.id}
                                onClick={() => setUsagePattern(pattern.id)}
                                className={`p-4 rounded-lg border-2 transition-all text-left ${
                                    usagePattern === pattern.id
                                        ? 'border-primary-600 bg-primary-50 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="font-semibold text-gray-900 mb-1">
                                    {pattern.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {pattern.description} ({pattern.daysPerMonth} dias/mês)
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Lens Type Selection */}
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Tipo de lente que você usa
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                        {lensTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setLensType(type.id)}
                                className={`p-4 rounded-lg border-2 transition-all text-left ${
                                    lensType === type.id
                                        ? 'border-primary-600 bg-primary-50 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-gray-900 mb-1">
                                            {type.name}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Preço avulso: {formatCurrency(type.avulsoPrice)} por lente
                                        </div>
                                        <div className="text-sm text-green-600">
                                            Com desconto: {formatCurrency(type.subscriptionPrice)} por lente
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">Economia</div>
                                        <div className="text-sm font-bold text-green-600">
                                            {Math.round((1 - type.subscriptionPrice / type.avulsoPrice) * 100)}%
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Annual Costs Input */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Contact Lens Annual Cost */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                            <div className="flex items-center space-x-2 mb-2">
                                <Eye className="w-4 h-4 text-primary-600" />
                                <span>Quanto você gasta com lentes por ano?</span>
                            </div>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">R$</span>
                            </div>
                            <input
                                type="number"
                                value={annualContactLensCost}
                                onChange={(e) => setAnnualContactLensCost(Number(e.target.value))}
                                className="block w-full pl-8 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-semibold"
                                placeholder="1200"
                                min="0"
                                step="100"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-sm">/ano</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Valor estimado: ~{formatCurrency(annualContactLensCost / 12)}/mês
                        </p>
                    </div>

                    {/* Consultation Annual Cost */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                            <div className="flex items-center space-x-2 mb-2">
                                <Activity className="w-4 h-4 text-primary-600" />
                                <span>Quanto gasta com consultas por ano?</span>
                            </div>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">R$</span>
                            </div>
                            <input
                                type="number"
                                value={annualConsultationCost}
                                onChange={(e) => setAnnualConsultationCost(Number(e.target.value))}
                                className="block w-full pl-8 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-semibold"
                                placeholder="400"
                                min="0"
                                step="50"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-sm">/ano</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Incluindo consultas, exames e retornos
                        </p>
                    </div>
                </div>

                {/* Results */}
                {result && result.totalAnnualSavings && result.totalAnnualSavings > 0 && (
                    <div className="space-y-6">
                        {/* Main Result - Total Annual Savings */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center">
                                        <TrendingDown className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-green-700 font-medium text-lg">Sua economia total anual</p>
                                        <p className="text-4xl font-bold text-green-900">
                                            {formatCurrency(result.totalAnnualSavings || 0)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="bg-white rounded-lg px-4 py-2">
                                        <p className="text-sm text-gray-600">Economia mensal</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatCurrency((result.totalAnnualSavings || 0) / 12)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Lens Only Savings */}
                            <div className="bg-white/60 rounded-lg p-4 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700">Economia nas lentes:</span>
                                    <span className="font-bold text-green-700">
                                        {formatCurrency(result.yearlySavings)} ({Math.round(result.savingsPercentage)}%)
                                    </span>
                                </div>
                            </div>

                            {/* Consultations Included */}
                            <div className="bg-white/60 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700">Consultas incluídas no plano:</span>
                                    <span className="font-bold text-primary-600">
                                        {result.includedConsultations} por ano
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Comparison */}
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                                Comparação Detalhada
                            </h3>

                            <div className="space-y-4">
                                {/* Current Costs */}
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <h4 className="font-medium text-gray-900 mb-3">Seus Custos Atuais</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Lentes por ano:</span>
                                            <span className="font-semibold">{formatCurrency(annualContactLensCost)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Consultas por ano:</span>
                                            <span className="font-semibold">{formatCurrency(annualConsultationCost)}</span>
                                        </div>
                                        <div className="border-t pt-2 mt-2">
                                            <div className="flex justify-between text-lg">
                                                <span className="font-bold">Total anual:</span>
                                                <span className="font-bold text-gray-900">
                                                    {formatCurrency(result.totalCurrentAnnualCost || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SV Lentes Costs */}
                                <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                                    <h4 className="font-medium text-primary-900 mb-3">
                                        Com SV Lentes - {planPrices[result.recommendedPlan as keyof typeof planPrices]?.name}
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Plano mensal:</span>
                                            <span className="font-semibold">
                                                {formatCurrency(planPrices[result.recommendedPlan as keyof typeof planPrices]?.monthlyPrice || 0)}/mês
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Lentes com desconto por ano:</span>
                                            <span className="font-semibold">{formatCurrency(result.yearlySubscription)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Consultas incluídas:</span>
                                            <span className="font-semibold text-green-600">
                                                {result.includedConsultations} (grátis)
                                            </span>
                                        </div>
                                        <div className="border-t pt-2 mt-2">
                                            <div className="flex justify-between text-lg">
                                                <span className="font-bold">Total anual:</span>
                                                <span className="font-bold text-primary-600">
                                                    {formatCurrency(result.totalSVLentesAnnualCost || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Benefits */}
                        <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
                            <h4 className="font-medium text-primary-900 mb-2">Benefícios Adicionais</h4>
                            <ul className="text-sm text-primary-800 space-y-1">
                                <li>✓ Acompanhamento médico com Dr. Philipe Saraiva Cruz</li>
                                <li>✓ Entrega em casa sem custo adicional</li>
                                <li>✓ Trocas garantidas e suporte prioritário</li>
                                <li>✓ Agendamento facilitado de consultas</li>
                            </ul>
                        </div>

                        {/* CTA */}
                        <div className="space-y-3">
                            <Button
                                onClick={handleSaveResult}
                                className="w-full flex items-center justify-center space-x-2 text-base py-6"
                                size="lg"
                            >
                                <Save className="w-5 h-5" />
                                <span>Salvar Resultado e Ver Planos</span>
                            </Button>
                            <p className="text-xs text-center text-gray-500">
                                Salve seu cálculo e escolha o melhor plano para você
                            </p>
                        </div>
                    </div>
                )}

                {result && result.totalAnnualSavings && result.totalAnnualSavings <= 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            Ajuste os valores para ver a economia com SV Lentes. Nossos planos incluem vantagens adicionais que podem beneficiar você.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
