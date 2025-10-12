import { Metadata } from 'next'
import { StructuredData } from '@/components/seo/StructuredData'
import { generateBreadcrumbStructuredData } from '@/lib/seo'

export const metadata: Metadata = {
    title: 'Agendamento Confirmado - SVlentes',
    description: 'Seu agendamento de consulta foi confirmado. Nossa equipe entrará em contato em breve.',
    alternates: {
        canonical: 'https://svlentes.com.br/agendamento-confirmado',
    },
    robots: {
        index: false,
        follow: false,
    },
}

export default function AgendamentoConfirmadoLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const breadcrumbData = generateBreadcrumbStructuredData([
        { name: 'Início', url: 'https://svlentes.com.br' },
        { name: 'Agendar Consulta', url: 'https://svlentes.com.br/agendar-consulta' },
        { name: 'Confirmado', url: 'https://svlentes.com.br/agendamento-confirmado' }
    ])

    return (
        <>
            <StructuredData data={breadcrumbData} />
            {children}
        </>
    )
}