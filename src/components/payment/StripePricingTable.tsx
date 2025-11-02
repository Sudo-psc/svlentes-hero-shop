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
        console.log('Stripe Pricing Table script loaded successfully')
      }
      script.onerror = () => {
        console.error('Failed to load Stripe Pricing Table script')
      }
      document.head.appendChild(script)
    }
  }, [])

  return (
    <div className={`stripe-pricing-table-container w-full ${className}`}>
      <style jsx>{`
        .stripe-pricing-table-container {
          width: 100%;
          max-width: 100%;
          position: relative;
          overflow: visible;
          min-height: 400px;
        }

        stripe-pricing-table {
          width: 100%;
          max-width: 100%;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: relative;
          z-index: 1;
        }

        /* Mobile-specific styles */
        @media (max-width: 768px) {
          .stripe-pricing-table-container {
            padding: 0;
            margin: 0 auto;
            overflow-x: auto;
            overflow-y: visible;
            -webkit-overflow-scrolling: touch;
          }

          stripe-pricing-table {
            min-width: 320px;
            width: 100% !important;
            font-size: 14px;
            display: block !important;
          }
        }

        /* Extra small devices */
        @media (max-width: 480px) {
          .stripe-pricing-table-container {
            min-height: 500px;
          }

          stripe-pricing-table {
            font-size: 13px;
            min-width: 300px;
          }
        }

        /* Ensure Stripe's internal elements are visible */
        stripe-pricing-table * {
          visibility: visible !important;
        }
      `}</style>
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