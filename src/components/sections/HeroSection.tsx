'use client'

import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { HeroImage } from '@/components/sections/HeroImage'
import { openWhatsAppWithContext } from '@/lib/whatsapp'
import { Phone, MessageCircle, Award } from 'lucide-react'

interface HeroSectionProps {
    className?: string
}

export function HeroSection({ className = '' }: HeroSectionProps) {
    const handleAgendarConsulta = () => {
        openWhatsAppWithContext('consultation', {
            page: 'landing-page',
            section: 'hero-primary-cta'
        })
    }

    const handleFalarWhatsApp = () => {
        openWhatsAppWithContext('hero', {
            page: 'landing-page',
            section: 'hero-secondary-cta'
        })
    }

    return (
        <section className={`relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 overflow-hidden ${className}`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
            </div>

            <div className="container-custom relative">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[80vh] py-16 lg:py-24">

                    {/* Left Column - Hero Content */}
                    <div className="space-y-8 animate-fade-in">

                        {/* Mobile-first Medical Credibility */}
                        <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3">
                            {/* CRM Badge - Primary Mobile */}
                            <div className="lg:hidden flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-300 rounded-xl px-4 py-2.5 shadow-lg">
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                                <div className="flex flex-col text-center">
                                    <span className="text-xs text-cyan-600 font-semibold">Dr. Philipe Saraiva Cruz</span>
                                    <span className="text-sm font-bold text-cyan-800">CRM-MG 69.870</span>
                                </div>
                            </div>

                            {/* Desktop Pioneer Badge */}
                            <Badge
                                variant="default"
                                className="hidden lg:flex bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 shadow-sm px-4 py-2 text-base"
                            >
                                <Award className="w-4 h-4 mr-2" />
                                🏆 Pioneiro no Brasil
                            </Badge>

                            {/* Mobile Trust Indicators */}
                            <div className="lg:hidden flex items-center space-x-4 text-xs text-gray-600">
                                <div className="flex items-center space-x-1">
                                    <span className="text-green-500">✓</span>
                                    <span>Seguro</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <span className="text-blue-500">🏥</span>
                                    <span>Médico</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <span className="text-purple-500">🚚</span>
                                    <span>Entrega</span>
                                </div>
                            </div>
                        </div>

                        {/* Main Headline - Mobile Optimized */}
                        <div className="text-center lg:text-left">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                                <span className="block">Nunca mais</span>
                                <span className="block text-gradient">fique sem lentes</span>
                            </h1>

                            {/* Mobile Value Proposition */}
                            <div className="lg:hidden space-y-3 mb-6">
                                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200">
                                    <div className="flex items-center justify-center space-x-2 mb-2">
                                        <span className="text-2xl">🏥</span>
                                        <span className="font-bold text-cyan-800">Acompanhamento Médico Incluído</span>
                                    </div>
                                    <p className="text-sm text-gray-700">
                                        Dr. Philipe Saraiva Cruz (CRM-MG 69.870) acompanha seu caso pessoal
                                    </p>
                                </div>

                                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                                    <div className="flex items-center space-x-1">
                                        <span className="text-green-500 font-bold">✓</span>
                                        <span>Entrega mensal</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <span className="text-blue-500 font-bold">✓</span>
                                        <span>Economia 67%</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <span className="text-purple-500 font-bold">✓</span>
                                        <span>Pagamento parcelado</span>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Value Proposition */}
                            <div className="hidden lg:block">
                                <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl mb-4">
                                    Assinatura com acompanhamento médico especializado.
                                </p>

                                <p className="text-lg text-gray-700 max-w-2xl">
                                    Receba suas lentes em casa com logística integrada e consultas regulares.
                                </p>
                            </div>
                        </div>

                        {/* CTAs - Mobile Optimized */}
                        <div className="flex flex-col gap-4 justify-center lg:justify-start">
                            {/* Mobile: CTA primária com destaque médico */}
                            <div className="lg:hidden">
                                <Button
                                    onClick={handleAgendarConsulta}
                                    size="lg"
                                    className="w-full flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 text-lg font-bold bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-700 hover:to-cyan-700 py-4 border-2 border-primary-400"
                                    aria-label="Agendar consulta médica - CTA principal mobile"
                                >
                                    <div className="bg-white/20 rounded-full p-1.5">
                                        <Phone className="w-5 h-5" aria-hidden="true" />
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span>Agendar Consulta Médica</span>
                                        <span className="text-xs font-normal opacity-90">Dr. Philipe Saraiva Cruz</span>
                                    </div>
                                </Button>
                            </div>

                            {/* Desktop: CTA primária */}
                            <div className="hidden lg:block">
                                <Button
                                    onClick={handleAgendarConsulta}
                                    size="lg"
                                    className="w-full sm:w-auto sm:min-w-[200px] flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 py-4"
                                    aria-label="Agendar consulta com oftalmologista - CTA principal"
                                >
                                    <Phone className="w-5 h-5" aria-hidden="true" />
                                    <span>Agendar consulta com oftalmologista</span>
                                </Button>
                            </div>

                            {/* Mobile: Calculadora CTA (secundária) */}
                            <div className="lg:hidden">
                                <a
                                    href="/calculadora"
                                    className="block w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold py-3 px-4 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-green-400"
                                >
                                    <span className="text-xl">💰</span>
                                    <div className="flex flex-col items-center">
                                        <span>Calcular Economia</span>
                                        <span className="text-xs font-normal opacity-90">Grátis e instantâneo</span>
                                    </div>
                                </a>
                            </div>

                            {/* Mobile: WhatsApp CTA (terciária) */}
                            <div className="lg:hidden">
                                <Button
                                    onClick={handleFalarWhatsApp}
                                    variant="outline"
                                    size="lg"
                                    className="w-full flex items-center justify-center space-x-2 border-2 border-green-300 hover:bg-green-50 hover:border-green-400 text-green-700 hover:text-green-800 py-3"
                                    aria-label="Tirar dúvidas no WhatsApp - CTA terciária mobile"
                                >
                                    <MessageCircle className="w-5 h-5" aria-hidden="true" />
                                    <span>Tirar dúvidas rápidas</span>
                                </Button>
                            </div>

                            {/* Desktop CTAs */}
                            <div className="hidden lg:flex flex-col sm:flex-row gap-4">
                                <Button
                                    onClick={handleFalarWhatsApp}
                                    variant="outline"
                                    size="lg"
                                    className="w-full sm:w-auto sm:min-w-[200px] flex items-center justify-center space-x-2 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 hover:text-gray-800 py-4"
                                    aria-label="Tirar dúvidas no WhatsApp - CTA secundário"
                                >
                                    <MessageCircle className="w-5 h-5" aria-hidden="true" />
                                    <span>Tirar dúvidas no WhatsApp</span>
                                </Button>

                                <a
                                    href="/calculadora"
                                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold py-3 px-4 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    <span>💰</span>
                                    <span>Calculadora</span>
                                </a>
                            </div>
                        </div>

                        {/* Mobile Sticky CTA */}
                        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
                            <Button
                                onClick={handleAgendarConsulta}
                                size="lg"
                                className="w-full flex items-center justify-center space-x-2 shadow-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold py-4"
                                aria-label="Agendar consulta - Sticky CTA mobile"
                            >
                                <Phone className="w-5 h-5" aria-hidden="true" />
                                <span>Agendar consulta com oftalmologista</span>
                            </Button>
                        </div>

                    </div>

                    {/* Right Column - Hero Image */}
                    <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        {/* Hero Image */}
                        <HeroImage
                            className="lg:scale-105 transform hover:scale-110 transition-transform duration-500"
                            imageVariant="hero1"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Wave */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg
                    className="w-full h-12 text-white"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
                        opacity=".25"
                        fill="currentColor"
                    />
                    <path
                        d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
                        opacity=".5"
                        fill="currentColor"
                    />
                    <path
                        d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
                        fill="currentColor"
                    />
                </svg>
            </div>
        </section>
    )
}
