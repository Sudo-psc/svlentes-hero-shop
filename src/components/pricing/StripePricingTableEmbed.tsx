'use client'

import React, { useEffect, useState } from 'react'

interface StripePricingTableEmbedProps {
  className?: string
  customerEmail?: string
  clientReferenceId?: string
}

export const StripePricingTableEmbed: React.FC<StripePricingTableEmbedProps> = ({ 
  className = '', 
  customerEmail,
  clientReferenceId 
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Load Stripe Pricing Table script
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://js.stripe.com/v3/pricing-table.js'

    script.onload = () => {
      setIsLoaded(true)
      console.log('[STRIPE_PRICING_TABLE] Stripe Pricing Table script loaded successfully')
    }

    script.onerror = () => {
      setHasError(true)
      console.error('[STRIPE_PRICING_TABLE] Failed to load Stripe Pricing Table script')
    }

    document.head.appendChild(script)

    // Cleanup
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  const pricingTableId = 'prctbl_1SK1U5Ls8MC0aCdjGBBODqjW'
  const publishableKey = 'pk_live_51OJdAcLs8MC0aCdjM8vdJBIjUzcRGXWLTlDFu4MyodwPfZOb34EgFjRSyq03XVdZlrvKeGps5Q3RgtR45sJ7kGsT00aOBbU6Jc'

  if (hasError) {
    return (
      <div className={`w-full p-8 bg-red-50 border border-red-200 rounded-lg text-center ${className}`}>
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="font-semibold">Erro ao carregar tabela de preços</p>
        </div>
        <p className="text-sm text-red-500 mb-4">Não foi possível carregar o sistema de pagamento</p>
        <button
          onClick={() => {
            window.open('https://wa.me/5533999898026?text=Olá!%20Gostaria%20de%20conhecer%20os%20planos%20de%20assinatura.', '_blank')
          }}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Falar com WhatsApp
        </button>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={`w-full p-8 bg-gray-50 border border-gray-200 rounded-lg text-center ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Carregando tabela de preços...</p>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
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

      <div className="stripe-pricing-table-container">
        <stripe-pricing-table
          pricing-table-id={pricingTableId}
          publishable-key={publishableKey}
          customer-email={customerEmail}
          client-reference-id={clientReferenceId}
        />
      </div>
    </div>
  )
}

export default StripePricingTableEmbed