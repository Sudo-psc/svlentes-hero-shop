'use client'

import Link from 'next/link'
import { ShoppingCart, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function QuickStartSection() {
    return (
        <div className="py-20 sm:py-24">
            <div className="container-custom">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-6 shadow-lg">
                        <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                        <span className="text-white text-base font-bold">Comece agora</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
                        Como funciona nossa assinatura
                    </h2>
                    <p className="text-xl md:text-2xl text-primary-50 max-w-3xl mx-auto leading-relaxed">
                        4 passos simples para nunca mais ficar sem lentes
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
                    {[
                        { step: 1, title: 'Escolha seu plano', desc: 'Básico, Premium ou VIP' },
                        { step: 2, title: 'Informe seu grau', desc: 'Com receita médica' },
                        { step: 3, title: 'Serviços extras', desc: 'Opcional, conforme sua necessidade' },
                        { step: 4, title: 'Receba em casa', desc: 'Entrega automática mensal' }
                    ].map((item, index) => (
                        <div key={index} className="text-center">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-white/30">
                                <span className="text-white font-bold text-lg">{item.step}</span>
                            </div>
                            <h3 className="text-white font-semibold text-sm mb-1">{item.title}</h3>
                            <p className="text-primary-100 text-xs">{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Primary CTA */}
                <div className="text-center mb-12">
                    <Link href="/assinar">
                        <Button size="lg" className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold text-xl py-4 px-12 shadow-xl hover:shadow-primary-500/40 transform hover:scale-[1.05] transition-all duration-300 ring-2 ring-white/20 hover:ring-white/30">
                            <ShoppingCart className="w-6 h-6 mr-3" />
                            Começar Assinatura
                            <ArrowRight className="w-6 h-6 ml-3" />
                        </Button>
                    </Link>
                    <p className="text-primary-100 text-sm mt-4">
                        Ou <Link href="/calculadora" className="text-white underline hover:text-primary-200 transition-colors group inline-flex items-center gap-1">
                            calcule sua economia primeiro
                            <span className="opacity-75 group-hover:opacity-100 text-xs">
                                (economia média de R$ 480/ano)
                            </span>
                        </Link>
                    </p>
                </div>

              </div>
        </div>
    )
}
