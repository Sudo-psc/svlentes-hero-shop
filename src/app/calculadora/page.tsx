'use client'

import { ImprovedCalculator } from '@/components/subscription/ImprovedCalculator'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

export default function CalculadoraPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-cyan-50 py-16">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Quanto você pode economizar?
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Descubra em segundos a economia que você terá com a assinatura SV Lentes
                    </p>
                </div>

                {/* Calculator */}
                <div className="mb-8">
                    <ImprovedCalculator
                        onSaveResult={(result) => {
                            // Salvar no localStorage e redirecionar
                            localStorage.setItem('calculatorResult', JSON.stringify(result))
                            window.location.href = '/assinar'
                        }}
                    />
                </div>

                {/* Benefits */}
                <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        Por que escolher SV Lentes?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">💰</span>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Economia Real</h3>
                            <p className="text-sm text-gray-600">
                                Até 40% mais barato que comprar lentes avulsas
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">👨‍⚕️</span>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Acompanhamento Médico</h3>
                            <p className="text-sm text-gray-600">
                                Dr. Philipe Saraiva Cruz cuida da sua saúde ocular
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🚀</span>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Conveniência Total</h3>
                            <p className="text-sm text-gray-600">
                                Receba em casa, sem preocupação de ficar sem lentes
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Link
                        href="/assinar"
                        className="inline-flex items-center space-x-2 bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                    >
                        <span>Ver Planos Disponíveis</span>
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
