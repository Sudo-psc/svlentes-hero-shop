import { type Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Recomendação Inteligente de Visão | SV Lentes',
    description: 'Descubra se lentes de contato ou óculos são ideais para você com nosso questionário inteligente baseado em ciência.',
    keywords: ['lentes de contato', 'óculos', 'recomendação', 'saúde ocular', 'questionário visão'],
    openGraph: {
        title: 'Recomendação Inteligente de Visão | SV Lentes',
        description: 'Descubra a melhor solução para sua visão com análise científica personalizada',
        type: 'website',
        locale: 'pt_BR',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Recomendação Inteligente de Visão | SV Lentes',
        description: 'Descubra a melhor solução para sua visão com análise científica personalizada',
    },
}

export default function RecommendationLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
