import { Metadata } from 'next'
import { VideoHeroSection } from '@/components/sections/VideoHeroSection'
import { QuickStartSection } from '@/components/sections/QuickStartSection'

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

            {/* Quick Start Section - Novo fluxo */}
            <section className="bg-gradient-to-br from-primary-600 to-primary-700">
                <QuickStartSection />
            </section>

            {/* Temporariamente comentado para debug */}
            {/* <section id="planos-precos" className="bg-gray-50">
                <LeadCaptureSection />
            </section> */}
            {/* <LazySection>
                <ProblemSolutionSection />
            </LazySection>

            <LazySection>
                <EconomySection />
            </LazySection>

            <LazySection>
                <HowItWorksSection />
            </LazySection>

            <LazySection>
                <ReferralProgram />
            </LazySection>

            <AddOns services={addOnsData} layout="cards" />

            <FAQ />

            <LazySection>
                <FinalCTA />
            </LazySection> */}
        </div>
    )
}
