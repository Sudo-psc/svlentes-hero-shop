'use client'

import { useEffect, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface StripePricingTableProps {
  pricingTableId: string
  publishableKey: string
  clientReferenceId?: string
  customerEmail?: string
  customerSessionClientSecret?: string
  className?: string
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': HTMLAttributes<HTMLElement>
    }
  }
}

export function StripePricingTable({
  pricingTableId,
  publishableKey,
  clientReferenceId,
  customerEmail,
  customerSessionClientSecret,
  className = ''
}: StripePricingTableProps) {
  const isConfigured = Boolean(pricingTableId && publishableKey)

  useEffect(() => {
    if (!isConfigured) {
      return
    }

    const selector = 'script[src="https://js.stripe.com/v3/pricing-table.js"]'
    if (!document.querySelector(selector)) {
      const script = document.createElement('script')
      script.src = 'https://js.stripe.com/v3/pricing-table.js'
      script.async = true
      script.onerror = () => {
        console.error('Failed to load Stripe Pricing Table script')
      }
      document.head.appendChild(script)
    }
  }, [isConfigured])

  if (!isConfigured) {
    return (
      <div className={cn('rounded-2xl border border-dashed border-cyan-200 bg-white p-6 text-center shadow-sm', className)}>
        <h3 className="text-lg font-semibold text-gray-900">Planos online indisponíveis no momento</h3>
        <p className="mt-2 text-sm text-gray-600">
          Fale com nossa equipe pelo WhatsApp ou visite a clínica para concluir sua assinatura.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('stripe-pricing-table-container w-full', className)}>
      <stripe-pricing-table
        pricing-table-id={pricingTableId}
        publishable-key={publishableKey}
        client-reference-id={clientReferenceId}
        customer-email={customerEmail}
        customer-session-client-secret={customerSessionClientSecret}
      />
    </div>
  )
}

export default StripePricingTable
