'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Calculator, Plus, Minus, CheckCircle, ArrowRight } from 'lucide-react'
import { BUSINESS_CONSTANTS } from '@/lib/constants'

interface CalculatorData {
    currentSpending: string
    lensType: 'mensal' | 'trimestral' | 'semestral'
    addOns: {
        solution: boolean
        drops: boolean
        case: boolean
        consultation: boolean
    }
}

interface EconomyResult {
    monthlyEconomy: number
    annualEconomy: number
    percentage: number
    planPrice: number
}

const addOnPrices = BUSINESS_CONSTANTS.addOnPrices

const addOnDescriptions = {
    solution: 'Solução de limpeza mensal',
    drops: 'Lágrimas artificiais',
    case: 'Estojos de reposição',
    consultation: 'Consultas de acompanhamento'
}

export function EconomyCalculator({ onContinue }: { onContinue: (data: CalculatorData, result: EconomyResult) => void }) {
    const [calculatorData, setCalculatorData] = useState<CalculatorData>({
        currentSpending: '',
        lensType: 'mensal',
        addOns: {
            solution: false,
            drops: false,
            case: false,
            consultation: false
        }
    })

    const [showResult, setShowResult] = useState(false)
    const [result, setResult] = useState<EconomyResult | null>(null)

    const calculateEconomy = (): EconomyResult => {
        const currentSpending = parseFloat(calculatorData.currentSpending) || 0

        const basePlanPrice = BUSINESS_CONSTANTS.planBasePrices[calculatorData.lensType]

        // Calcular preço dos add-ons
        const addOnsTotal = Object.entries(calculatorData.addOns)
            .filter(([_, selected]) => selected)
            .reduce((total, [addOn]) => total + addOnPrices[addOn as keyof typeof addOnPrices], 0)

        const planPrice = basePlanPrice + addOnsTotal
        const monthlyEconomy = currentSpending - planPrice
        const annualEconomy = monthlyEconomy * 12
        const percentage = currentSpending > 0 ? (monthlyEconomy / currentSpending) * 100 : 0

        return {
            monthlyEconomy,
            annualEconomy,
            percentage,
            planPrice
        }
    }

    const handleCalculate = () => {
        if (!calculatorData.currentSpending) return

        const calculationResult = calculateEconomy()
        setResult(calculationResult)
        setShowResult(true)
    }

    const handleAddOnToggle = (addOn: keyof typeof calculatorData.addOns) => {
        setCalculatorData(prev => ({
            ...prev,
            addOns: {
                ...prev.addOns,
                [addOn]: !prev.addOns[addOn]
            }
        }))
    }

    const handleContinue = () => {
        if (result) {
            onContinue(calculatorData, result)
        }
    }

    const selectedAddOnsTotal = Object.entries(calculatorData.addOns)
        .filter(([_, selected]) => selected)
        .reduce((total, [addOn]) => total + addOnPrices[addOn as keyof typeof addOnPrices], 0)

    const basePlanPrice = BUSINESS_CONSTANTS.planBasePrices[calculatorData.lensType]

    const totalPlanPrice = basePlanPrice + selectedAddOnsTotal

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calculator className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Calcule sua Economia
                </h3>
                <p className="text-sm text-gray-600">
                    Descubra quanto você pode economizar sem compromisso
                </p>
            </div>

            {!showResult ? (
                <div className="space-y-4">
                    <Input
                        label="Quanto você gasta por mês com lentes?"
                        placeholder="R$ 0,00"
                        value={calculatorData.currentSpending}
                        onChange={(e) => setCalculatorData(prev => ({ ...prev, currentSpending: e.target.value }))}
                        type="number"
                        min="0"
                        step="0.01"
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de lente que usa atualmente
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 'mensal', label: 'Mensal' },
                                { value: 'trimestral', label: 'Trimestral' },
                                { value: 'semestral', label: 'Semestral' }
                            ].map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => setCalculatorData(prev => ({ ...prev, lensType: type.value as any }))}
                                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${calculatorData.lensType === type.value
                                            ? 'bg-primary-600 text-white border-primary-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Serviços adicionais que utiliza
                        </label>
                        <div className="space-y-2">
                            {Object.entries(addOnDescriptions).map(([key, description]) => (
                                <div
                                    key={key}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => handleAddOnToggle(key as keyof typeof calculatorData.addOns)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            checked={calculatorData.addOns[key as keyof typeof calculatorData.addOns]}
                                            onChange={() => { }}
                                        />
                                        <span className="text-sm text-gray-700">{description}</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        +R$ {addOnPrices[key as keyof typeof addOnPrices]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resumo do Carrinho */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3">Resumo do Plano</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Plano {calculatorData.lensType}</span>
                                <span className="font-medium">R$ {basePlanPrice}</span>
                            </div>
                            {Object.entries(calculatorData.addOns)
                                .filter(([_, selected]) => selected)
                                .map(([addOn]) => (
                                    <div key={addOn} className="flex justify-between">
                                        <span className="text-gray-600">{addOnDescriptions[addOn as keyof typeof addOnDescriptions]}</span>
                                        <span className="font-medium">+R$ {addOnPrices[addOn as keyof typeof addOnPrices]}</span>
                                    </div>
                                ))}
                            <div className="pt-2 mt-2 border-t border-gray-300">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-900">Total mensal</span>
                                    <span className="font-bold text-primary-600">R$ {totalPlanPrice}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleCalculate}
                        className="w-full flex items-center justify-center space-x-2 font-semibold text-base"
                        disabled={!calculatorData.currentSpending}
                    >
                        <Calculator className="w-5 h-5" />
                        <span>Calcular Economia</span>
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Resultado */}
                    <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">
                            Você economizaria R$ {result?.monthlyEconomy.toFixed(2)} por mês!
                        </h4>
                        <p className="text-gray-600 mb-4">
                            Economia total de R$ {result?.annualEconomy.toFixed(2)} ao ano ({result?.percentage.toFixed(0)}% de desconto)
                        </p>
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Seu gasto atual:</span>
                                    <div className="font-bold text-gray-900">R$ {calculatorData.currentSpending}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Plano SV Lentes:</span>
                                    <div className="font-bold text-primary-600">R$ {result?.planPrice.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Opt-in */}
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 text-center">
                            Quer receber esta economia? Deixe seu contato para falarmos com você:
                        </p>

                        <div className="space-y-3">
                            <Input
                                placeholder="Seu nome completo"
                                className="w-full"
                            />
                            <Input
                                placeholder="Seu WhatsApp"
                                className="w-full"
                            />
                            <Input
                                type="email"
                                placeholder="Seu email"
                                className="w-full"
                            />
                        </div>

                        <Checkbox>
                            <span className="text-sm text-gray-700">
                                Aceito receber contato sobre o serviço e concordo com a{' '}
                                <a href="/politica-privacidade" className="text-primary-600 hover:underline">
                                    política de privacidade
                                </a>
                            </span>
                        </Checkbox>

                        <Button
                            onClick={handleContinue}
                            className="w-full flex items-center justify-center space-x-2 font-semibold text-base"
                        >
                            <ArrowRight className="w-5 h-5" />
                            <span>Continuar e Agendar Consulta</span>
                        </Button>
                    </div>

                    <button
                        onClick={() => setShowResult(false)}
                        className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        ← Refazer cálculo
                    </button>
                </div>
            )}
        </div>
    )
}
