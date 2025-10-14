import { Metadata } from 'next'
import { VideoHeroSection } from '@/components/sections/VideoHeroSection'
import { LazySection } from '@/components/ui/LazySection'
import { QuickStartSection } from '@/components/sections/QuickStartSection'
import FAQ from '@/components/sections/FAQ'
import { FinalCTA } from '@/components/sections/FinalCTA'
import { TrustStrip } from '@/components/trust/TrustStrip'

export const metadata: Metadata = {
    title: 'SV Lentes Caratinga MG | Assinatura Lentes com Dr. Philipe Saraiva Cruz',
    description: 'Assinatura de lentes de contato em Caratinga, Minas Gerais, com acompanhamento médico do Dr. Philipe Saraiva Cruz - CRM 69.870. Lentes diárias, mensais, tóricas e multifocais. Economia de até 40% e entrega grátis.',
    keywords: [
        'lentes de contato Caratinga',
        'lentes de contato Minas Gerais',
        'lentes diárias Caratinga',
        'lentes mensais assinatura',
        'lentes tóricas astigmatismo',
        'lentes multifocais presbiopia',
        'oftalmologista lentes de contato',
        'Dr. Philipe Saraiva Cruz CRM 69.870',
        'entrega lentes de contato Caratinga',
        'assinatura lentes de contato mensal',
        'lentes de contato descartáveis',
        'clínica oftalmológica Caratinga MG'
    ],
    alternates: {
        canonical: 'https://svlentes.com.br',
    },
}

export default function HomePage() {
    return (
        <div className="min-h-screen">
            {/* Hero Section - Vídeo em largura total */}
            <section id="hero">
                <VideoHeroSection />
            </section>

            {/* Trust Strip - Logo após o Hero */}
            <section className="bg-white py-6 border-y border-gray-100">
                <div className="container-custom">
                    <TrustStrip />
                </div>
            </section>

            {/* Seção com opções de calculadora e assinatura direta */}
            <section id="planos-precos" className="bg-gradient-to-br from-primary-600 to-primary-700">
                <QuickStartSection />
            </section>

            {/* Nunca Mais Fique Sem Suas Lentes - CTA Final */}
            <LazySection id="contato">
                <FinalCTA />
            </LazySection>

            {/* Perguntas Frequentes */}
            <LazySection id="perguntas-frequentes">
                <FAQ />
            </LazySection>
        </div>
    )
}
