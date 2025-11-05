'use client'

import { DoctorCard } from '@/components/trust/DoctorCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { doctorInfo } from '@/data/doctor-info'
import { openWhatsAppWithContext } from '@/lib/whatsapp'
import {
    Shield,
    Award,
    BookOpen,
    MessageCircle,
    Phone,
    ExternalLink,
    CheckCircle2,
    Stethoscope
} from 'lucide-react'

interface TechnicalResponsibleSectionProps {
    className?: string
}

export function TechnicalResponsibleSection({ className = '' }: TechnicalResponsibleSectionProps) {
    const handleConsultation = () => {
        openWhatsAppWithContext('consultation', {
            page: 'landing-page',
            section: 'technical-responsible',
            userInfo: {
                nome: 'Interessado via Seção Responsável Técnico'
            }
        })
    }

    const handleWhatsApp = () => {
        openWhatsAppWithContext('hero', {
            page: 'landing-page',
            section: 'technical-responsible-whatsapp'
        })
    }

    return (
        <section
            id="responsavel-tecnico"
            className={`relative py-16 lg:py-20 bg-gradient-to-br from-gray-50 via-white to-primary-50/20 overflow-hidden ${className}`}
        >
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-100/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
            </div>

            <div className="container-custom relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <Badge
                        variant="outline"
                        className="mb-4 bg-white/80 backdrop-blur-sm border-primary-200 text-primary-700 px-4 py-2 text-sm font-semibold shadow-sm"
                    >
                        <Shield className="w-4 h-4 mr-2" />
                        Responsabilidade Médica Certificada
                    </Badge>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
                        Responsável Técnico
                    </h2>

                    <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Todo o serviço de assinatura SV Lentes é supervisionado por um médico oftalmologista
                        especializado e registrado no CRM, garantindo a segurança e qualidade do seu tratamento.
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Doctor Card - Takes 2 columns */}
                    <div className="lg:col-span-2">
                        <div className="h-full">
                            <DoctorCard variant="full" showCTA={false} />
                        </div>
                    </div>

                    {/* Right Column - Highlights and Testimonial */}
                    <div className="space-y-6">
                        {/* Medical Credentials Highlight */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                                    <Stethoscope className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Credenciais Médicas
                                </h3>
                            </div>

                            <ul className="space-y-3">
                                <li className="flex items-start space-x-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-700">
                                        <strong>CRM-MG 69.870</strong> - Registro ativo e válido
                                    </span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-700">
                                        Membro da <strong>Sociedade Brasileira de Oftalmologia (SBO)</strong>
                                    </span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-700">
                                        Especialista em <strong>Lentes de Contato</strong>
                                    </span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-700">
                                        Mais de <strong>5000 pacientes atendidos</strong>
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Testimonial/Quote */}
                        <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-2xl shadow-lg border border-primary-200 p-6">
                            <div className="mb-4">
                                <svg className="w-10 h-10 text-primary-600/40" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                </svg>
                            </div>

                            <blockquote className="space-y-4">
                                <p className="text-gray-800 font-medium leading-relaxed">
                                    "Meu compromisso é garantir que cada assinante tenha acesso a lentes de
                                    qualidade com acompanhamento médico especializado. A saúde ocular não pode
                                    ser comprometida, e por isso supervisiono pessoalmente cada caso."
                                </p>

                                <footer className="border-t border-primary-200 pt-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                                            <span className="text-white font-bold text-sm">Dr.</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">
                                                {doctorInfo.name}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {doctorInfo.crm} | {doctorInfo.specialty}
                                            </p>
                                        </div>
                                    </div>
                                </footer>
                            </blockquote>
                        </div>

                        {/* Safety Note */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <div className="flex items-start space-x-3">
                                <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-semibold text-amber-900 mb-1">
                                        Sua Segurança em Primeiro Lugar
                                    </p>
                                    <p className="text-amber-800">
                                        Todas as lentes requerem receita médica válida.
                                        Nunca dispensamos produtos sem a devida prescrição oftalmológica.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <div className="text-center space-y-6">
                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                            Fale Diretamente com Nosso Time Médico
                        </h3>

                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Tem dúvidas sobre lentes de contato ou precisa de orientação médica?
                            Nossa equipe está pronta para te ajudar.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-xl mx-auto">
                            <Button
                                onClick={handleConsultation}
                                size="lg"
                                className="w-full sm:w-auto bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                            >
                                <Phone className="w-5 h-5 mr-2" />
                                Agendar Consulta
                            </Button>

                            <Button
                                onClick={handleWhatsApp}
                                size="lg"
                                variant="outline"
                                className="w-full sm:w-auto border-2 border-primary-600 text-primary-700 hover:bg-primary-50 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                            >
                                <MessageCircle className="w-5 h-5 mr-2" />
                                Tirar Dúvidas no WhatsApp
                            </Button>
                        </div>

                        {/* Additional links */}
                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-500 mb-3">
                                Quer saber mais sobre nossa equipe?
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <a
                                    href="/equipe-medica"
                                    className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium group"
                                >
                                    <BookOpen className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" />
                                    Conheça Nossa Equipe
                                    <ExternalLink className="w-3 h-3 ml-1 opacity-60" />
                                </a>

                                <a
                                    href="/sobre-dr-philipe"
                                    className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium group"
                                >
                                    <Award className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" />
                                    Currículo Completo
                                    <ExternalLink className="w-3 h-3 ml-1 opacity-60" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Trust Badges */}
                <div className="mt-8 flex flex-wrap justify-center items-center gap-6 opacity-60">
                    <div className="flex items-center space-x-2 text-gray-600">
                        <Shield className="w-5 h-5" />
                        <span className="text-sm font-medium">CRM Verificado</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                        <Award className="w-5 h-5" />
                        <span className="text-sm font-medium">SBO Credenciado</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-medium">LGPD Compliance</span>
                    </div>
                </div>
            </div>
        </section>
    )
}
