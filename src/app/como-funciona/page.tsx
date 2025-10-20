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
            {/* Breadcrumb/Back Navigation */}
            <section className="bg-gray-50 border-b border-gray-200">
                <div className="container-custom py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">Voltar para página inicial</span>
                        </Link>
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                        >
                            <Home className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>
            {/* Page Header */}
            <section className="bg-gradient-to-br from-primary-50 to-white py-16">
                <div className="container-custom text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                        Como Funciona a
                        <span className="text-gradient block mt-2">Assinatura de Lentes</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                        Um processo simples e transparente para você nunca mais ficar sem suas lentes de contato
                    </p>
                    {/* Trust Strip */}
                    <div className="mt-12">
                        <TrustStrip />
                    </div>
                </div>
            </section>
            {/* Main Content - How It Works */}
            <section>
                <HowItWorksSection />
            </section>
            {/* Quick CTA */}
            <section className="bg-primary-50 py-16">
                <div className="container-custom text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Pronto para começar?
                    </h2>
                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                        Escolha seu plano e comece a receber suas lentes automaticamente todos os meses
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/assinar">
                            <Button size="lg" className="min-w-[200px]">
                                Começar Assinatura
                            </Button>
                        </Link>
                        <Link href="/calculadora">
                            <Button size="lg" variant="outline" className="min-w-[200px]">
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