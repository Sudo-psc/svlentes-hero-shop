import { Metadata } from 'next'
import { StripeScript } from '@/components/payment/StripeScript'

export const metadata: Metadata = {
  title: 'Planos de Assinatura de Lentes de Contato | Entrega em Todo Brasil | SV Lentes',
  description: 'Assine lentes de contato online com entrega em todo o Brasil. Planos para lentes asféricas, diárias, tóricas e multifocais. Atendimento presencial em Caratinga/MG. Economia de até 40% com acompanhamento do Dr. Philipe Saraiva Cruz.',
  keywords: [
    'planos lentes de contato',
    'assinatura lentes',
    'lentes asféricas',
    'lentes tóricas',
    'lentes multifocais',
    'entrega lentes brasil',
    'planos mensais lentes',
    'lentes de contato online'
  ],
  openGraph: {
    title: 'Planos de Assinatura de Lentes de Contato | SV Lentes',
    description: 'Assine lentes de contato online com entrega em todo o Brasil. Atendimento presencial em Caratinga/MG.',
    url: 'https://svlentes.com.br/planos',
    siteName: 'SV Lentes',
    images: [
      {
        url: 'https://svlentes.com.br/images/og-planos.jpg',
        width: 1200,
        height: 630,
        alt: 'Planos de Assinatura - SV Lentes'
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  alternates: {
    canonical: 'https://svlentes.com.br/planos',
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