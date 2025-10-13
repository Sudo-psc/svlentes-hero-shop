import { Metadata } from 'next'
import { VideoHeroSection } from '@/components/sections/VideoHeroSection'
import { LazySection } from '@/components/ui/LazySection'
import { QuickStartSection } from '@/components/sections/QuickStartSection'
import ReferralProgram from '@/components/sections/ReferralProgram'
import { FinalCTA } from '@/components/sections/FinalCTA'

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

            {/* Seção com opções de calculadora e assinatura direta */}
            <section className="bg-gradient-to-br from-primary-600 to-primary-700">
                <QuickStartSection />
            </section>

            {/* Programa de Indicação */}
            <LazySection>
                <ReferralProgram />
            </LazySection>

            {/* Nunca Mais Fique Sem Suas Lentes - CTA Final */}
            <LazySection>
                <FinalCTA />
            </LazySection>
        </div>
    )
}
