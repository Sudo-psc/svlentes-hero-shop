import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Calculadora de Economia | Compare Preços de Lentes de Contato | SV Lentes',
    description: 'Calcule quanto você pode economizar com a assinatura de lentes de contato da SV Lentes. Compare com farmácias e ópticas. Economia de até 40% em lentes mensais, diárias, tóricas e multifocais com entrega automática.',
    keywords: [
        'calculadora lentes',
        'preço lentes de contato',
        'economia lentes',
        'comparar preços lentes',
        'quanto custa lentes',
        'valor assinatura lentes',
        'calcular economia lentes'
    ],
    openGraph: {
        title: 'Calculadora de Economia | SV Lentes',
        description: 'Calcule quanto você pode economizar com a assinatura de lentes de contato. Economia de até 40%.',
        url: 'https://svlentes.com.br/calculadora',
        siteName: 'SV Lentes',
        images: [
            {
                url: 'https://svlentes.com.br/images/og-calculadora.jpg',
                width: 1200,
                height: 630,
                alt: 'Calculadora de Economia - SV Lentes'
            }
        ],
        locale: 'pt_BR',
        type: 'website',
    },
    alternates: {
        canonical: 'https://svlentes.com.br/calculadora',
    },
}

export default function CalculadoraLayout({
    children
}: {
    children: React.ReactNode
}) {
    return children
}
