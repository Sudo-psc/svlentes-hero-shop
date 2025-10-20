import { SubscriptionFlow } from '@/components/subscription/SubscriptionFlow'
import { Suspense } from 'react'
export const metadata = {
    title: 'Assinar SV Lentes - Escolha seu Plano',
    description: 'Configure sua assinatura de lentes de contato com acompanhamento médico. Escolha o plano ideal e personalize com add-ons.',
}
export default function AssinarPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <SubscriptionFlow />
        </Suspense>
    )
}