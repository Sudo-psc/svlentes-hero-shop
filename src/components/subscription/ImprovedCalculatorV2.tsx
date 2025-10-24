'use client'
import { useState, useEffect } from 'react'
import { Calculator, TrendingDown, Save, ArrowRight, Activity, Eye, Sparkles, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { calculateEconomy, formatCurrency } from '@/lib/calculator'
import { usagePatterns, lensTypes, planPrices } from '@/data/calculator-data'
import { CalculatorInput, CalculatorResult } from '@/types'
import CountUp from 'react-countup'

interface ImprovedCalculatorProps {
    onSaveResult?: (result: CalculatorResult) => void
}

export function ImprovedCalculatorV2({ onSaveResult }: ImprovedCalculatorProps) {
    const [lensType, setLensType] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
    const [usagePattern, setUsagePattern] = useState<'occasional' | 'regular' | 'daily'>('regular')
    const [annualContactLensCost, setAnnualContactLensCost] = useState<number>(1200)
    const [annualConsultationCost, setAnnualConsultationCost] = useState<number>(400)
    const [result, setResult] = useState<CalculatorResult | null>(null)
    const [prevSavings, setPrevSavings] = useState<number>(0)

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
            setPrevSavings(result?.totalAnnualSavings || 0)
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
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <Calculator className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Calculadora de Economia</h3>
                        <p className="text-primary-100 text-sm">Acompanhe sua economia em tempo real</p>
                    </div>
                </div>
            </div>

            {/* Two-Column Layout: Inputs + Results */}
            <div className="grid lg:grid-cols-[1fr,400px] gap-0">
                {/* Left Column: Inputs */}
                <div className="p-6 space-y-6 lg:border-r lg:border-gray-200">
                    {/* Usage Pattern Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                            <span className="flex items-center space-x-2">
                                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">1</span>
                                <span>Com que frequência você usa lentes?</span>
                            </span>
                        </label>
                        <div className="grid gap-3">
                            {usagePatterns.map((pattern) => (
                                <button
                                    key={pattern.id}
                                    onClick={() => setUsagePattern(pattern.id)}
                                    className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${
                                        usagePattern === pattern.id
                                            ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-cyan-50 shadow-lg scale-[1.02]'
                                            : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                                    }`}
                                >
                                    {usagePattern === pattern.id && (
                                        <div className="absolute top-3 right-3">
                                            <CheckCircle className="w-5 h-5 text-primary-600" />
                                        </div>
                                    )}
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
                            <span className="flex items-center space-x-2">
                                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">2</span>
                                <span>Tipo de lente que você usa</span>
                            </span>
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                            {lensTypes.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setLensType(type.id)}
                                    className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${
                                        lensType === type.id
                                            ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-cyan-50 shadow-lg scale-[1.02]'
                                            : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                                    }`}
                                >
                                    {lensType === type.id && (
                                        <div className="absolute top-3 right-3">
                                            <CheckCircle className="w-5 h-5 text-primary-600" />
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start pr-8">
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-900 mb-2">
                                                {type.name}
                                            </div>
                                            <div className="text-sm text-gray-600 mb-1">
                                                Preço avulso: {formatCurrency(type.avulsoPrice)}/lente
                                            </div>
                                            <div className="text-sm font-medium text-green-600">
                                                Com SV Lentes: {formatCurrency(type.subscriptionPrice)}/lente
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                -{Math.round((1 - type.subscriptionPrice / type.avulsoPrice) * 100)}%
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Annual Costs Input - Optional */}
                    <div className="pt-4 border-t border-gray-200">
                        <details className="group">
                            <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-primary-600 transition-colors">
                                <span className="flex items-center space-x-2">
                                    <Sparkles className="w-4 h-4" />
                                    <span>Ajustar custos atuais (opcional)</span>
                                </span>
                                <ArrowRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                            </summary>
                            <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
                                {/* Contact Lens Annual Cost */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <div className="flex items-center space-x-2">
                                            <Eye className="w-4 h-4 text-primary-600" />
                                            <span>Gasto anual com lentes</span>
                                        </div>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 text-sm">R$</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={annualContactLensCost}
                                            onChange={(e) => setAnnualContactLensCost(Number(e.target.value))}
                                            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-semibold transition-all"
                                            placeholder="1200"
                                            min="0"
                                            step="100"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 text-sm">/ano</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Aproximadamente {formatCurrency(annualContactLensCost / 12)}/mês
                                    </p>
                                </div>

                                {/* Consultation Annual Cost */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <div className="flex items-center space-x-2">
                                            <Activity className="w-4 h-4 text-primary-600" />
                                            <span>Gasto anual com consultas</span>
                                        </div>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 text-sm">R$</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={annualConsultationCost}
                                            onChange={(e) => setAnnualConsultationCost(Number(e.target.value))}
                                            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-semibold transition-all"
                                            placeholder="400"
                                            min="0"
                                            step="50"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 text-sm">/ano</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Consultas, exames e retornos
                                    </p>
                                </div>
                            </div>
                        </details>
                    </div>
                </div>

                {/* Right Column: Sticky Results Panel */}
                <div className="lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto bg-gradient-to-br from-gray-50 to-cyan-50 p-6">
                    {result && result.totalAnnualSavings && result.totalAnnualSavings > 0 ? (
                        <div className="space-y-4">
                            {/* Main Savings Card */}
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-2xl">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <TrendingDown className="w-6 h-6" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-green-100 uppercase tracking-wide font-medium">Por ano</div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-green-100 text-sm mb-1">Você economiza</p>
                                    <p className="text-5xl font-bold tracking-tight">
                                        <CountUp
                                            start={prevSavings}
                                            end={result.totalAnnualSavings}
                                            duration={1.5}
                                            decimals={2}
                                            decimal=","
                                            prefix="R$ "
                                            separator="."
                                        />
                                    </p>
                                </div>
                            </div>

                            {/* Monthly Savings */}
                            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Economia mensal:</span>
                                    <span className="text-2xl font-bold text-green-600">
                                        <CountUp
                                            start={prevSavings / 12}
                                            end={(result.totalAnnualSavings || 0) / 12}
                                            duration={1.5}
                                            decimals={2}
                                            decimal=","
                                            prefix="R$ "
                                            separator="."
                                        />
                                    </span>
                                </div>
                            </div>

                            {/* Breakdown */}
                            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Economia nas lentes:</span>
                                    <span className="font-semibold text-primary-700">
                                        {formatCurrency(result.yearlySavings)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Consultas inclusas:</span>
                                    <span className="font-semibold text-primary-700">
                                        {result.includedConsultations}/ano
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                    <span className="text-sm font-medium text-gray-900">Plano recomendado:</span>
                                    <span className="font-bold text-primary-600">
                                        {planPrices[result.recommendedPlan as keyof typeof planPrices]?.name}
                                    </span>
                                </div>
                            </div>

                            {/* Benefits */}
                            <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
                                <h4 className="font-medium text-primary-900 mb-3 text-sm">Benefícios Inclusos</h4>
                                <ul className="text-xs text-primary-800 space-y-2">
                                    <li className="flex items-start space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                        <span>Acompanhamento com Dr. Philipe</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                        <span>Entrega em casa sem custo</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                        <span>Suporte prioritário</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <CheckCircle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                        <span>Agendamento facilitado</span>
                                    </li>
                                </ul>
                            </div>

                            {/* CTA */}
                            <Button
                                onClick={handleSaveResult}
                                className="w-full flex items-center justify-center space-x-2 text-base py-6 shadow-lg hover:shadow-xl transition-all"
                                size="lg"
                            >
                                <Save className="w-5 h-5" />
                                <span>Ver Planos e Assinar</span>
                            </Button>
                        </div>
                    ) : result && result.totalAnnualSavings !== undefined && result.totalAnnualSavings <= 0 ? (
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-amber-600" />
                            </div>
                            <h3 className="font-semibold text-amber-900 mb-2">Ajuste os valores</h3>
                            <p className="text-sm text-amber-700">
                                Modifique suas seleções para ver a economia com SV Lentes
                            </p>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-center">
                            <div>
                                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Calculator className="w-10 h-10 text-primary-600" />
                                </div>
                                <p className="text-gray-600 text-sm">
                                    Selecione suas opções para ver a economia
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
