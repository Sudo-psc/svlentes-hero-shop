'use client'

import { useState } from 'react'
import { AddOn, AddOnsProps } from '@/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { trackEvent } from '@/lib/analytics'

interface AddOnCardProps {
    addOn: AddOn
    isSelected: boolean
    onToggle: (id: string) => void
    layout: 'chips' | 'cards'
    disabled?: boolean
}

function AddOnCard({ addOn, isSelected, onToggle, layout, disabled = false }: AddOnCardProps) {
    const formatPrice = (price?: number) => {
        if (!price) return 'Consulte'
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    const getTypeIcon = (type: AddOn['type']) => {
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

    const getTypeBadgeColor = (type: AddOn['type']) => {
        switch (type) {
            case 'consulta':
                return 'bg-primary-100 text-primary-800'
            case 'teleorientacao':
                return 'bg-green-100 text-green-800'
            case 'seguro':
                return 'bg-purple-100 text-purple-800'
            case 'vip':
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    if (layout === 'chips') {
        return (
            <div
                className={`
          relative flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
          ${isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
        `}
                onClick={() => onToggle(addOn.id)}
            >
                <Checkbox
                    checked={isSelected}
                    onChange={() => onToggle(addOn.id)}
                    className="pointer-events-none"
                />

                <div className="flex items-center gap-2 flex-1">
                    <span className="text-lg">{getTypeIcon(addOn.type)}</span>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{addOn.name}</h4>
                            <Badge className={`text-xs ${getTypeBadgeColor(addOn.type)}`}>
                                {addOn.type}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{addOn.description}</p>
                    </div>
                    <div className="text-right">
                        <span className="font-semibold text-gray-900">
                            {formatPrice(addOn.price)}
                        </span>
                        {addOn.price && (
                            <p className="text-xs text-gray-500">/mês</p>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // Cards layout
    return (
        <div
            className={`
        relative p-4 rounded-xl border-2 cursor-pointer transition-all
        ${isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                }
      `}
            onClick={() => onToggle(addOn.id)}
        >
            <div className="absolute top-3 right-3">
                <Checkbox
                    checked={isSelected}
                    onChange={() => onToggle(addOn.id)}
                    className="pointer-events-none"
                />
            </div>

            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl">
                        {getTypeIcon(addOn.type)}
                    </div>
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{addOn.name}</h3>
                        <Badge className={`text-xs ${getTypeBadgeColor(addOn.type)}`}>
                            {addOn.type}
                        </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{addOn.description}</p>

                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-lg font-bold text-gray-900">
                                {formatPrice(addOn.price)}
                            </span>
                            {addOn.price && (
                                <span className="text-sm text-gray-500 ml-1">/mês</span>
                            )}
                        </div>

                        {isSelected && (
                            <Badge className="bg-primary-100 text-primary-800">
                                Selecionado
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function AddOns({ services, layout = 'cards' }: AddOnsProps) {
    const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])

    const handleToggleAddOn = (id: string) => {
        const addOn = services.find(service => service.id === id)
        const isCurrentlySelected = selectedAddOns.includes(id)

        setSelectedAddOns(prev =>
            prev.includes(id)
                ? prev.filter(addOnId => addOnId !== id)
                : [...prev, id]
        )

        // Track add-on selection/deselection
        if (addOn && !isCurrentlySelected) {
            trackEvent('addon_selected', {
                addon_type: addOn.type,
                addon_name: addOn.name,
                addon_price: addOn.price,
            })
        }
    }

    const calculateTotal = () => {
        return services
            .filter(service => selectedAddOns.includes(service.id))
            .reduce((total, service) => total + (service.price || 0), 0)
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    return (
        <section className="py-16 lg:py-24 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Serviços Adicionais
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Personalize sua experiência com serviços extras que complementam
                        seu cuidado com a saúde ocular
                    </p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className={`
            grid gap-4 mb-8
            ${layout === 'chips'
                            ? 'grid-cols-1'
                            : 'grid-cols-1 md:grid-cols-2'
                        }
          `}>
                        {services.map((addOn) => (
                            <AddOnCard
                                key={addOn.id}
                                addOn={addOn}
                                isSelected={selectedAddOns.includes(addOn.id)}
                                onToggle={handleToggleAddOn}
                                layout={layout}
                            />
                        ))}
                    </div>

                    {selectedAddOns.length > 0 && (
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Serviços Selecionados ({selectedAddOns.length})
                                </h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedAddOns([])}
                                    className="text-gray-600 hover:text-gray-800"
                                >
                                    Limpar seleção
                                </Button>
                            </div>

                            <div className="space-y-2 mb-4">
                                {services
                                    .filter(service => selectedAddOns.includes(service.id))
                                    .map((service) => (
                                        <div key={service.id} className="flex justify-between items-center py-2">
                                            <span className="text-gray-700">{service.name}</span>
                                            <span className="font-medium text-gray-900">
                                                {formatPrice(service.price || 0)}
                                            </span>
                                        </div>
                                    ))
                                }
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-lg font-semibold text-gray-900">
                                        Total Mensal
                                    </span>
                                    <span className="text-2xl font-bold text-primary-600">
                                        {formatPrice(calculateTotal())}
                                    </span>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        className="flex-1"
                                        onClick={() => {
                                            // Redirect to subscription page with selected AddOns
                                            const addOnsParam = encodeURIComponent(selectedAddOns.join(','))
                                            window.location.href = `/assinar?addons=${addOnsParam}`
                                        }}
                                    >
                                        Adicionar aos Planos
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            // WhatsApp integration for AddOns inquiries
                                            const selectedServices = services
                                                .filter(s => selectedAddOns.includes(s.id))
                                                .map(s => s.name)
                                            const message = `Olá! Tenho interesse nos seguintes serviços adicionais: ${selectedServices.join(', ')}`
                                            window.open(`https://wa.me/+5533999898026?text=${encodeURIComponent(message)}`)
                                        }}
                                    >
                                        Falar no WhatsApp
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedAddOns.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-4">
                                Selecione os serviços adicionais que deseja incluir
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    // WhatsApp integration for general AddOns questions
                                    const message = 'Olá! Gostaria de saber mais sobre os serviços adicionais disponíveis.'
                                    window.open(`https://wa.me/+5533999898026?text=${encodeURIComponent(message)}`)
                                }}
                            >
                                Tenho dúvidas - Falar no WhatsApp
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}