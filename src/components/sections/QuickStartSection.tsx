'use client'

import Link from 'next/link'
import { Calculator, ShoppingCart, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

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
                        Dois caminhos para começar
                    </h2>
                    <p className="text-xl md:text-2xl text-primary-50 max-w-3xl mx-auto leading-relaxed">
                        Escolha a melhor forma de iniciar sua jornada com SV Lentes
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-10 max-w-6xl mx-auto">
                    {/* Calculator Path */}
                    <Card className="hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 hover:border-green-200">
                        <CardHeader>
                            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                                <Calculator className="w-8 h-8 text-green-600" />
                            </div>
                            <CardTitle className="text-2xl">Calcule sua Economia</CardTitle>
                            <CardDescription className="text-base">
                                Descubra em segundos quanto você pode economizar com nossa assinatura.
                                Use o slider interativo e veja o resultado em tempo real.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                <li className="flex items-center text-sm text-gray-700">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                                    Cálculo instantâneo e personalizado
                                </li>
                                <li className="flex items-center text-sm text-gray-700">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                                    Compare com seu gasto atual
                                </li>
                                <li className="flex items-center text-sm text-gray-700">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                                    Salve o resultado e continue
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Link href="/calculadora" className="w-full">
                                <Button size="lg" className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg h-14">
                                    <Calculator className="w-5 h-5 mr-2" />
                                    Calcular Economia
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* Direct Subscription Path */}
                    <Card className="relative hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-primary-200 hover:border-primary-300">
                        <div className="absolute -top-3 right-8 z-10">
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 shadow-lg hover:from-yellow-500 hover:to-orange-500">
                                ⚡ MAIS RÁPIDO
                            </Badge>
                        </div>

                        <CardHeader>
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-blue-100 rounded-2xl flex items-center justify-center mb-4">
                                <ShoppingCart className="w-8 h-8 text-primary-600" />
                            </div>
                            <CardTitle className="text-2xl">Assinar Direto</CardTitle>
                            <CardDescription className="text-base">
                                Já conhece nossos planos? Vá direto ao ponto! Configure sua assinatura
                                em 4 passos simples e comece a economizar hoje.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {[
                                    'Escolha seu plano ideal',
                                    'Informe o grau das lentes',
                                    'Adicione serviços extras (opcional)',
                                    'Finalize e agende sua consulta'
                                ].map((item, index) => (
                                    <li key={index} className="flex items-center text-sm text-gray-700">
                                        <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                            <span className="text-primary-600 text-xs font-bold">{index + 1}</span>
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Link href="/assinar" className="w-full">
                                <Button size="lg" className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-lg h-14 ring-2 ring-primary-400/30 hover:ring-primary-400/50">
                                    <ShoppingCart className="w-5 h-5 mr-2" />
                                    Começar Assinatura
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </div>

                {/* Trust Indicator */}
                <div className="text-center mt-12">
                    <p className="text-primary-100 text-sm">
                        ✨ Mais de 1.000 pessoas já economizam com SV Lentes
                    </p>
                </div>
            </div>
        </div>
    )
}
