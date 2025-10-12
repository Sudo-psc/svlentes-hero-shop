import { Metadata } from 'next'
import { StructuredData } from '@/components/seo/StructuredData'
import { generateBreadcrumbStructuredData } from '@/lib/seo'

export const metadata: Metadata = {
    title: 'Pagamento Cancelado - SVlentes',
    description: 'Seu pagamento foi cancelado. Você pode tentar novamente a qualquer momento.',
    alternates: {
        canonical: 'https://svlentes.shop/cancel',
    },
    robots: {
        index: false,
        follow: false,
    },
}

export default function CancelLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const breadcrumbData = generateBreadcrumbStructuredData([
        { name: 'Início', url: 'https://svlentes.shop' },
        { name: 'Cancelado', url: 'https://svlentes.shop/cancel' }
    ])

    return (
        <>
            <StructuredData data={breadcrumbData} />
            {children}
        </>
    )
}