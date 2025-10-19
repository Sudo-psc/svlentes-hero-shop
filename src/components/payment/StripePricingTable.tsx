'use client'

import React from 'react'

interface StripePricingTableProps {
  pricingTableId: string
  publishableKey: string
  clientReferenceId?: string
  customerEmail?: string
  customerSessionClientSecret?: string
  className?: string
}

export const StripePricingTable: React.FC<StripePricingTableProps> = ({
  pricingTableId,
  publishableKey,
  clientReferenceId,
  customerEmail,
  customerSessionClientSecret,
  className = ""
}) => {
  React.useEffect(() => {
    // Load Stripe pricing table script if not already loaded
    if (!document.querySelector('script[src="https://js.stripe.com/v3/pricing-table.js"]')) {
      const script = document.createElement('script')
      script.src = 'https://js.stripe.com/v3/pricing-table.js'
      script.async = true
      script.onload = () => {
        console.log('Stripe Pricing Table script loaded')
      }
      script.onerror = () => {
        console.error('Failed to load Stripe Pricing Table script')
      }
      document.head.appendChild(script)
    }
  }, [])

  return (
    <div className={`stripe-pricing-table-container ${className}`}>
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