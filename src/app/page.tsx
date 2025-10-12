import { Metadata } from 'next'
import { VideoHeroSection } from '@/components/sections/VideoHeroSection'
import { QuickStartSection } from '@/components/sections/QuickStartSection'

export const metadata: Metadata = {
    title: 'SV Lentes Itaim Bibi São Paulo | Assinatura Lentes com Dr. Philipe Saraiva Cruz',
    description: 'Assinatura de lentes de contato em Itaim Bibi, São Paulo, com acompanhamento médico do Dr. Philipe Saraiva Cruz - CRM 69.870. Lentes diárias, mensais, tóricas e multifocais. Economia de até 40% e entrega grátis.',
    keywords: [
        'lentes de contato São Paulo',
        'lentes diárias Itaim Bibi',
        'lentes mensais assinatura',
        'lentes tóricas astigmatismo',
        'lentes multifocais presbiopia',
        'oftalmologista lentes de contato',
        'Dr. Philipe Saraiva Cruz CRM 69.870',
        'entrega lentes de contato São Paulo',
        'assinatura lentes de contato mensal',
        'lentes de contato descartáveis',
        'clínica oftalmológica Itaim Bibi'
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
