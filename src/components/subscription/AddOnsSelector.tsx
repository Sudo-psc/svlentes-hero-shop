'use client'
import { useState } from 'react'
import { Check, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addOnsData, addOnCategories } from '@/data/add-ons'
import { AddOn } from '@/types'
import { formatCurrency } from '@/lib/calculator'
interface AddOnsSelectorProps {
    onContinue: (selectedAddOns: string[]) => void
    onBack: () => void
    preSelectedAddOns?: string[]
}
// Enhanced AddOn data with additional properties for the selector
const availableAddOns: (AddOn & { icon: string; recommended?: boolean })[] = addOnsData.map(addOn => ({
    ...addOn,
    icon: getIconForType(addOn.type),
    recommended: ['consulta-extra', 'teleorientacao'].includes(addOn.id) // Mark medical services as recommended
}))
function getIconForType(type: AddOn['type']): string {
    switch (type) {
        case 'consulta':
            return '👨‍⚕️'
        case 'teleorientacao':
            return '📱'
        case 'seguro':
            return '🛡️'
        case 'vip':
            return '⭐'
        default:
            return '📋'
    }
}
export function AddOnsSelector({ onContinue, onBack, preSelectedAddOns = [] }: AddOnsSelectorProps) {
    const [selectedAddOns, setSelectedAddOns] = useState<string[]>(preSelectedAddOns)
    const toggleAddOn = (addOnId: string) => {
        setSelectedAddOns(prev =>
            prev.includes(addOnId)
                ? prev.filter(id => id !== addOnId)
                : [...prev, addOnId]
        )
    }
    const calculateTotal = () => {
        return availableAddOns
            .filter(addOn => selectedAddOns.includes(addOn.id))
            .reduce((sum, addOn) => sum + addOn.price, 0)
    }
    const total = calculateTotal()
    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Personalize sua Assinatura
                </h3>
                <p className="text-gray-600">
                    Adicione serviços extras para uma experiência completa
                </p>
            </div>
            {/* Add-ons Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                {availableAddOns.map((addOn) => {
                    const isSelected = selectedAddOns.includes(addOn.id)
                    return (
                        <button
                            key={addOn.id}
                            onClick={() => toggleAddOn(addOn.id)}
                            className={`relative p-5 rounded-xl border-2 text-left transition-all ${isSelected
                                    ? 'border-primary-600 bg-primary-50 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                        >
                            {/* Recommended Badge */}
                            {addOn.recommended && !isSelected && (
                                <div className="absolute top-3 right-3">
                                    <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
                                        Recomendado
                                    </span>
                                </div>
                            )}
                            {/* Selected Indicator */}
                            {isSelected && (
                                <div className="absolute top-3 right-3">
                                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start space-x-4">
                                {/* Icon */}
                                <div className="text-3xl flex-shrink-0">
                                    {addOn.icon}
                                </div>
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-1">
                                        <h4 className="font-semibold text-gray-900">
                                            {addOn.name}
                                        </h4>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">
                                        {addOn.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold text-primary-600">
                                            +{formatCurrency(addOn.price)}/mês
                                        </span>
                                        <div className={`flex items-center space-x-1 text-sm font-medium ${isSelected ? 'text-primary-600' : 'text-gray-500'
                                            }`}>
                                            {isSelected ? (
                                                <>
                                                    <Minus className="w-4 h-4" />
                                                    <span>Remover</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-4 h-4" />
                                                    <span>Adicionar</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>
            {/* Total Summary */}
            <div className="bg-gradient-to-r from-primary-50 to-cyan-50 rounded-xl p-6 border border-primary-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">
                            {selectedAddOns.length} {selectedAddOns.length === 1 ? 'serviço selecionado' : 'serviços selecionados'}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                            {total > 0 ? `+${formatCurrency(total)}/mês` : 'Nenhum add-on selecionado'}
                        </p>
                    </div>
                    {selectedAddOns.length > 0 && (
                        <div className="text-right">
                            <p className="text-sm text-green-600 font-semibold">
                                Economia vs avulso
                            </p>
                            <p className="text-lg font-bold text-green-600">
                                ~{formatCurrency(total * 0.3)}/mês
                            </p>
                        </div>
                    )}
                </div>
            </div>
            {/* Actions */}
            <div className="flex space-x-4">
                <Button
                    variant="outline"
                    onClick={onBack}
                    className="flex-1"
                >
                    Voltar
                </Button>
                <Button
                    onClick={() => onContinue(selectedAddOns)}
                    className="flex-1"
                >
                    Continuar para Resumo
                </Button>
            </div>
        </div>
    )
}