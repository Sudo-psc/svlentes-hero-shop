import { Metadata } from 'next'
import { StripeScript } from '@/components/payment/StripeScript'

export const metadata: Metadata = {
  title: 'Planos Online de Lentes de Contato | SV Lentes',
  description: 'Assine lentes de contato online com entrega em todo o Brasil. Planos para lentes asféricas, diárias, tóricas e multifocais com entrega regular e economia garantida.',
  openGraph: {
    title: 'Planos Online de Lentes de Contato | SV Lentes',
    description: 'Assine lentes de contato online com entrega em todo o Brasil.',
    url: 'https://svlentes.shop/planos',
    siteName: 'SV Lentes',
    images: [
      {
        url: 'https://svlentes.shop/images/og-planos.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function PlanosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <StripeScript
        publishableKey="pk_live_51OJdAcLs8MC0aCdjQwfyXkqJQRyRw0Au8D5C2BzxN90ekVz0AFEI6PpG0ELGQzJiRZZkWTu4Rj4BcjNZpiyH3LI800SkEiSITH"
        includePricingTable={true}
      />
    </>
  )
}