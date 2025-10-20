'use client'
import { LensEducationSection } from '@/components/sections/LensEducationSection'
import { LeadCaptureSection } from '@/components/sections/LeadCaptureSection'
import FAQ from '@/components/sections/FAQ'
import { FinalCTA } from '@/components/sections/FinalCTA'
// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic'
export default function LentesDiariasPage() {
    return (
        <div className="min-h-screen">
            {/* Hero Section personalizado */}
            <section id="hero">
                <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16 lg:py-24">
                    <div className="container-custom">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                                <span className="block">Lentes de Contato</span>
                                <span className="block text-blue-600">Diárias Descartáveis</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mb-8">
                                Máxima higiene e praticidade para seu dia a dia. Entrega mensal em São Paulo
                                com acompanhamento especializado do Dr. Philipe Saraiva Cruz.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <div className="flex items-center space-x-2 text-green-700">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="font-medium">Em estoque</span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <span className="font-medium">CRM 69.870</span>
                                    <span className="text-sm">• Dr. Philipe Saraiva Cruz</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* Seção de Educação sobre Lentes */}
            <LensEducationSection />
            {/* Formulário de Captura */}
            <section id="formulario-contato">
                <LeadCaptureSection />
            </section>
            {/* FAQ Específico */}
            <section id="perguntas-frequentes">
                <div className="container-custom py-16 lg:py-24">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-12">
                            Dúvidas Frequentes sobre Lentes Diárias
                        </h2>
                        <FAQ />
                    </div>
                </div>
            </section>
            {/* CTA Final */}
            <section id="contato">
                <FinalCTA />
            </section>
        </div>
    )
}