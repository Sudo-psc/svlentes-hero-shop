import { Metadata } from 'next'
import { StructuredData } from '@/components/seo/StructuredData'
import { generateBreadcrumbStructuredData } from '@/lib/seo'

// Force dynamic rendering for this route segment
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Pagamento Realizado com Sucesso - SVlentes',
    description: 'Seu pagamento foi processado com sucesso. Bem-vindo à SVlentes! Suas lentes de contato serão enviadas conforme seu plano.',
    alternates: {
        canonical: 'https://svlentes.com.br/success',
    },
    robots: {
        index: false,
        follow: false,
    },
}

export default function SuccessLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const breadcrumbData = generateBreadcrumbStructuredData([
        { name: 'Início', url: 'https://svlentes.com.br' },
        { name: 'Sucesso', url: 'https://svlentes.com.br/success' }
    ])

    return (
        <>
            <StructuredData data={breadcrumbData} />
            {children}
        </>
    )
}