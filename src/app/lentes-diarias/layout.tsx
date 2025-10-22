import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Lentes de Contato Diárias Descartáveis | Assinatura com Entrega | SV Lentes',
    description: 'Assinatura de lentes de contato diárias descartáveis em Caratinga/MG. Máxima higiene e praticidade com entrega mensal automática e acompanhamento do Dr. Philipe Saraiva Cruz - CRM 69.870. Economia garantida.',
    keywords: [
        'lentes diárias',
        'lentes descartáveis',
        'lentes de contato diárias',
        'assinatura lentes diárias',
        'lentes 1 day',
        'lentes uso único',
        'entrega lentes diárias',
        'lentes diárias Caratinga'
    ],
    openGraph: {
        title: 'Lentes de Contato Diárias Descartáveis | SV Lentes',
        description: 'Assinatura de lentes de contato diárias com entrega mensal automática e acompanhamento médico especializado.',
        url: 'https://svlentes.com.br/lentes-diarias',
        siteName: 'SV Lentes',
        images: [
            {
                url: 'https://svlentes.com.br/images/og-lentes-diarias.jpg',
                width: 1200,
                height: 630,
                alt: 'Lentes de Contato Diárias - SV Lentes'
            }
        ],
        locale: 'pt_BR',
        type: 'website',
    },
    alternates: {
        canonical: 'https://svlentes.com.br/lentes-diarias',
    },
}

// Force dynamic rendering for this route segment
export const dynamic = 'force-dynamic'

export default function LentesDiariasLayout({
    children
}: {
    children: React.ReactNode
}) {
    return children
}