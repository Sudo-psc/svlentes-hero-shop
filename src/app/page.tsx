import { Metadata } from 'next'
import { VideoHeroSection } from '@/components/sections/VideoHeroSection'
import { TrustStrip } from '@/components/trust/TrustStrip'
import { HomeLazySections } from '@/components/sections/HomeLazySections'

export const metadata: Metadata = {
    title: 'SV Lentes Caratinga MG | Assinatura Lentes com Dr. Philipe Saraiva Cruz',
    description: 'Assinatura de lentes de contato em Caratinga, Minas Gerais, com acompanhamento médico do Dr. Philipe Saraiva Cruz - CRM 69.870. Lentes diárias, mensais, tóricas e multifocais. Economia de até 40% com entrega grátis.',
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
        <div className="relative flex min-h-[calc(100vh-6rem)] flex-col">
            <section id="hero" className="relative isolate">
                <VideoHeroSection />
            </section>
            <section className="page-shell page-shell--compact">
                <div className="page-shell-container">
                    <div className="rounded-3xl border border-white/60 bg-white/90 px-6 py-8 shadow-glass backdrop-blur-xl sm:px-8">
                        <TrustStrip />
                    </div>
                </div>
            </section>
            <HomeLazySections />
        </div>
    )
}
