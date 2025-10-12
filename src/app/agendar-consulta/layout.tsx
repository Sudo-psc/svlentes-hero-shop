import { Metadata } from 'next'
import { StructuredData } from '@/components/seo/StructuredData'
import { generateBreadcrumbStructuredData } from '@/lib/seo'

// Force dynamic rendering for this route segment
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Agendar Consulta com Dr. Philipe Saraiva Cruz - SVlentes',
    description: 'Agende sua consulta oftalmológica com o Dr. Philipe Saraiva Cruz (CRM 65.870) para iniciar sua assinatura de lentes de contato com acompanhamento médico especializado.',
    alternates: {
        canonical: 'https://svlentes.com.br/agendar-consulta',
    },
    openGraph: {
        title: 'Agendar Consulta - SVlentes',
        description: 'Consulta oftalmológica com Dr. Philipe Saraiva Cruz para assinatura de lentes',
        url: 'https://svlentes.com.br/agendar-consulta',
    },
    robots: {
        index: true,
        follow: true,
    },
}

export default function ConsultationLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const breadcrumbData = generateBreadcrumbStructuredData([
        { name: 'Início', url: 'https://svlentes.com.br' },
        { name: 'Agendar Consulta', url: 'https://svlentes.com.br/agendar-consulta' }
    ])

    return (
        <>
            <StructuredData data={breadcrumbData} />
            {children}
        </>
    )
}