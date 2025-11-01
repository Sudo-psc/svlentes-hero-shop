import { Metadata } from 'next'
import { HowItWorksSection } from '@/components/sections/HowItWorksSection'
import { TrustStrip } from '@/components/trust/TrustStrip'
import { FinalCTA } from '@/components/sections/FinalCTA'
import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
export const metadata: Metadata = {
    title: 'Como Funciona - SV Lentes | Processo de Assinatura Passo a Passo',
    description: 'Entenda como funciona o serviço de assinatura de lentes de contato da SV Lentes. Processo simples em 4 passos: consulta médica, prescrição, entrega automática e acompanhamento contínuo.',
    keywords: [
        'como funciona assinatura lentes',
        'processo assinatura lentes contato',
        'passo a passo lentes contato',
        'serviço assinatura lentes',
        'entrega automática lentes',
        'acompanhamento médico lentes'
    ],
    alternates: {
        canonical: 'https://svlentes.com.br/como-funciona',
    },
}
export default function ComoFuncionaPage() {
    return (
        <div className="min-h-screen">
            {/* Breadcrumb/Back Navigation - Material Design 3 */}
            <section className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
                <div className="container-custom py-5">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg px-3 py-2 transition-all duration-200"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-semibold">Voltar para página inicial</span>
                        </Link>
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg p-2.5 transition-all duration-200"
                        >
                            <Home className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>
            {/* Page Header - Material Design 3 Hero */}
            <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50/30 py-20 overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse-slow" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-success-100/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse-slow" style={{ animationDelay: '1s' }} />
                
                <div className="container-custom text-center relative z-10">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
                        Como Funciona a
                        <span className="text-gradient block mt-3 bg-gradient-to-r from-primary-600 via-primary-500 to-success-600 bg-clip-text text-transparent animate-slide-up">
                            Assinatura de Lentes
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        Um processo simples e transparente para você nunca mais ficar sem suas lentes de contato
                    </p>
                    {/* Trust Strip */}
                    <div className="mt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                        <TrustStrip />
                    </div>
                </div>
            </section>
            {/* Main Content - How It Works */}
            <section>
                <HowItWorksSection />
            </section>
            {/* Quick CTA - Material Design 3 */}
            <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-100/50 py-20 overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 animate-pulse-slow" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-success-200/20 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
                
                <div className="container-custom text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5">
                        Pronto para{' '}
                        <span className="text-gradient">começar</span>?
                    </h2>
                    <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Escolha seu plano e comece a receber suas lentes automaticamente todos os meses
                    </p>
                    <div className="flex flex-col sm:flex-row gap-5 justify-center">
                        <Link href="/assinar">
                            <Button 
                                size="lg" 
                                className="min-w-[220px] shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 transition-all duration-300 text-base px-8 py-6"
                            >
                                Começar Assinatura
                            </Button>
                        </Link>
                        <Link href="/calculadora">
                            <Button 
                                size="lg" 
                                variant="outline" 
                                className="min-w-[220px] hover:bg-primary-50 hover:border-primary-300 hover:scale-105 transition-all duration-300 text-base px-8 py-6 border-2"
                            >
                                Calcular Economia
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
            {/* Final CTA */}
            <FinalCTA />
        </div>
    )
}
// Force dynamic rendering for pages using useSession
export const dynamic = 'force-dynamic'