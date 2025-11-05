import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Calculadora de Economia | Economize até 40% em Lentes de Contato',
    description: 'Calcule quanto você economizará com a assinatura SV Lentes! Compare preços de lentes diárias, mensais, tóricas e multifocais. Resultado em tempo real. Dr. Philipe Saraiva Cruz - CRM 69.870.',
    keywords: [
        'calculadora lentes de contato',
        'economia lentes de contato',
        'preço lentes assinatura',
        'comparar preços lentes',
        'quanto custa lentes de contato',
        'lentes diárias preço',
        'lentes mensais preço',
        'economia assinatura lentes'
    ],
    openGraph: {
        title: 'Economize até 40% em Lentes de Contato | SV Lentes',
        description: 'Descubra em tempo real quanto você economizará com nossa assinatura de lentes. Calculadora gratuita e sem compromisso.',
        url: 'https://svlentes.com.br/calculadora',
    },
    alternates: {
        canonical: 'https://svlentes.com.br/calculadora',
    },
}

export default function CalculadoraLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
