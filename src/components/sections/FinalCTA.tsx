'use client'

import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { LeadCaptureForm } from '@/components/forms/LeadCaptureForm'
import { openWhatsAppWithContext } from '@/lib/whatsapp'
import { trackEvent } from '@/lib/analytics'
import { serviceBenefits } from '@/data/pricing-plans'
import {
    Calendar,
    CheckCircle,
    Star,
    Shield,
    Clock,
    Phone,
    ArrowRight
} from 'lucide-react'

export function FinalCTA() {
    const [showMobileForm, setShowMobileForm] = useState(false)

    const handleScheduleConsultation = useCallback(() => {
        openWhatsAppWithContext('consultation', {
            page: 'landing-page',
            section: 'final-cta'
        })

        trackEvent('cta_agendar_clicked', {
            section: 'final_cta',
            position: 'primary',
            user_journey_stage: 'consideration',
        })
    }, [])

    const handleMobileFormSubmit = useCallback((data: any) => {
        openWhatsAppWithContext('hero', {
            page: 'landing-page',
            section: 'final-cta-mobile-form',
            userInfo: data
        })
    }, [])

    const highlightedBenefits = useMemo(
        () => serviceBenefits.filter((benefit) => benefit.highlight),
        []
    )

    return (
        <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 py-16 lg:py-24">
            <div className="container-custom">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge de urgência */}
                    <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                        <Star className="w-4 h-4 text-yellow-300 mr-2" />
                        <span className="text-white text-sm font-medium">
                            Pioneiro no Brasil • Vagas Limitadas
                        </span>
                    </div>

                    {/* Headline principal */}
                    <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                        Nunca Mais Fique
                        <br />
                        <span className="text-yellow-300">Sem Suas Lentes</span>
                    </h2>

                    {/* Subheadline */}
                    <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
                        Junte-se a centenas de pessoas que já descobriram a liberdade
                        de ter lentes sempre disponíveis com acompanhamento médico especializado.
                    </p>

                    {/* Benefícios em destaque */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {highlightedBenefits.map((benefit) => (
                            <div
                                key={benefit.id}
                                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center"
                            >
                                <div className="text-3xl mb-3">{benefit.icon}</div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    {benefit.title}
                                </h3>
                                <p className="text-primary-100 text-sm">
                                    {benefit.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Lista de benefícios adicionais */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 mb-12">
                        <h3 className="text-2xl font-bold text-white mb-6">
                            Por que escolher o SV Lentes?
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            {[
                                'Acompanhamento médico com Dr. Philipe Saraiva Cruz (CRM 69.870)',
                                'Entrega automática na sua casa, sem você se preocupar',
                                'Economia de até 40% comparado à compra avulsa',
                                'Flexibilidade total: pause, altere ou cancele quando quiser',
                                'Suporte especializado 24/7 via WhatsApp',
                                'Seguro contra perda ou dano das lentes',
                                'Primeira consulta médica incluída no plano',
                                'Sem fidelidade: cancele a qualquer momento'
                            ].map((benefit, index) => (
                                <div key={index} className="flex items-start space-x-3">
                                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-primary-100 text-sm">
                                        {benefit}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTAs principais - Desktop */}
                    <div className="hidden md:flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                        <Button
                            onClick={handleScheduleConsultation}
                            size="lg"
                            className="bg-white text-primary-700 hover:bg-gray-50 font-semibold px-8 py-4 text-lg flex items-center space-x-2 shadow-lg"
                        >
                            <Calendar className="w-5 h-5" />
                            <span>Agende Sua Consulta</span>
                            <ArrowRight className="w-4 h-4" />
                        </Button>

                      </div>

                    {/* Formulário mobile */}
                    <div className="md:hidden">
                        {!showMobileForm ? (
                            <div className="space-y-4">
                                <Button
                                    onClick={() => setShowMobileForm(true)}
                                    size="lg"
                                    className="w-full bg-white text-primary-700 hover:bg-gray-50 font-semibold py-4 text-lg flex items-center justify-center space-x-2 shadow-lg"
                                >
                                    <Calendar className="w-5 h-5" />
                                    <span>Agendar Consulta</span>
                                </Button>

                              </div>
                        ) : (
                            <div className="bg-white rounded-xl p-6">
                                <div className="text-center mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        Agende Sua Consulta
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        Preencha seus dados e entraremos em contato
                                    </p>
                                </div>

                                <LeadCaptureForm
                                    variant="inline"
                                    onSubmit={handleMobileFormSubmit}
                                    className="space-y-4"
                                />

                                <button
                                    onClick={() => setShowMobileForm(false)}
                                    className="text-gray-500 text-sm mt-4 hover:text-gray-700"
                                >
                                    ← Voltar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Indicadores de confiança */}
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-primary-100 text-sm">
                        <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4" />
                            <span>100% Seguro e Confiável</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>Resposta em até 2 horas</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4" />
                            <span>Suporte 24/7</span>
                        </div>
                    </div>

                    {/* Urgência e escassez */}
                    <div className="mt-8 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                        <p className="text-yellow-200 text-sm">
                            ⚡ <strong>Atenção:</strong> Devido à alta demanda, estamos limitando
                            o número de novos pacientes por mês. Agende sua consulta hoje mesmo
                            para garantir sua vaga.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}