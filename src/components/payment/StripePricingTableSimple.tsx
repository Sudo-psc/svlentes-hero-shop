/**
 * Simple Stripe Pricing Table Component
 * 
 * A straightforward implementation of Stripe's Pricing Table
 * with automatic script loading and error handling.
 * 
 * Usage:
 * <StripePricingTableSimple />
 * 
 * @author Dr. Philipe Saraiva Cruz
 */

'use client'

import { useEffect, useState } from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'pricing-table-id'?: string
          'publishable-key'?: string
          'client-reference-id'?: string
          'customer-email'?: string
        },
        HTMLElement
      >
    }
  }
}

interface StripePricingTableSimpleProps {
  pricingTableId?: string
  publishableKey?: string
  clientReferenceId?: string
  customerEmail?: string
  className?: string
}

export function StripePricingTableSimple({
  pricingTableId = 'prctbl_1SK1U5Ls8MC0aCdjGBBODqjW',
  publishableKey = 'pk_live_51OJdAcLs8MC0aCdjM8vdJBIjUzcRGXWLTlDFu4MyodwPfZOb34EgFjRSyq03XVdZlrvKeGps5Q3RgtR45sJ7kGsT00aOBbU6Jc',
  clientReferenceId,
  customerEmail,
  className = ''
}: StripePricingTableSimpleProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="stripe.com/v3/pricing-table.js"]')
    
    if (existingScript) {
      setIsLoaded(true)
      return
    }

    // Load Stripe Pricing Table script
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/pricing-table.js'
    script.async = true

    script.onload = () => {
      console.log('[Stripe Pricing Table] Script loaded successfully')
      setIsLoaded(true)
    }

    script.onerror = () => {
      console.error('[Stripe Pricing Table] Failed to load script')
      setError('Falha ao carregar tabela de preços. Por favor, tente novamente.')
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup is not recommended for Stripe script as it may be used by multiple components
    }
  }, [])

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 text-center ${className}`}>
        <p className="text-red-600 font-semibold mb-2">Erro ao carregar tabela de preços</p>
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando tabela de preços...</p>
      </div>
    )
  }

  return (
    <div className={`stripe-pricing-table-wrapper ${className}`}>
      <style jsx>{`
        .stripe-pricing-table-wrapper {
          width: 100%;
          max-width: 100%;
          position: relative;
        }

        stripe-pricing-table {
          width: 100%;
          display: block;
        }

        /* Mobile optimization */
        @media (max-width: 768px) {
          .stripe-pricing-table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          
          stripe-pricing-table {
            min-width: 320px;
          }
        }
      `}</style>
      
      <stripe-pricing-table
        pricing-table-id={pricingTableId}
        publishable-key={publishableKey}
        client-reference-id={clientReferenceId}
        customer-email={customerEmail}
      />
    </div>
  )
}

export default StripePricingTableSimple
