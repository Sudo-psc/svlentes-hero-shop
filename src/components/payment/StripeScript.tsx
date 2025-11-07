'use client'
import Script from 'next/script'
import { useState, useEffect } from 'react'

interface StripeScriptProps {
  publishableKey?: string
  includePricingTable?: boolean
}

export const StripeScript: React.FC<StripeScriptProps> = ({
  publishableKey,
  includePricingTable = false
}) => {
  const [stripeLoaded, setStripeLoaded] = useState(false)
  const [pricingTableLoaded, setPricingTableLoaded] = useState(false)

  // Validate publishable key format
  const isValidKey = publishableKey && (publishableKey.startsWith('pk_live_') || publishableKey.startsWith('pk_test_'))

  if (!isValidKey) {
    console.warn('[STRIPE] Invalid or missing publishable key')
    return null
  }

  const handleStripeLoad = () => {
    setStripeLoaded(true)
    console.log('[STRIPE] Stripe.js loaded successfully')

    // Initialize Stripe if not already initialized
    if (typeof window !== 'undefined' && window.Stripe && publishableKey) {
      try {
        window.Stripe(publishableKey)
      } catch (error) {
        console.error('[STRIPE] Failed to initialize Stripe:', error)
      }
    }
  }

  const handleStripeError = (e: Error) => {
    console.error('[STRIPE] Failed to load Stripe.js:', e)
    // Retry mechanism for Stripe script
    setTimeout(() => {
      const script = document.createElement('script')
      script.src = 'https://js.stripe.com/v3/'
      script.async = true
      script.onload = handleStripeLoad
      script.onerror = () => console.error('[STRIPE] Retry failed for Stripe.js')
      document.head.appendChild(script)
    }, 2000)
  }

  const handlePricingTableLoad = () => {
    setPricingTableLoaded(true)
    console.log('[STRIPE] Stripe Pricing Table loaded successfully')
  }

  const handlePricingTableError = (e: Error) => {
    console.error('[STRIPE] Failed to load Stripe Pricing Table:', e)
    // Retry mechanism for Pricing Table script
    setTimeout(() => {
      const script = document.createElement('script')
      script.src = 'https://js.stripe.com/v3/pricing-table.js'
      script.async = true
      script.onload = handlePricingTableLoad
      script.onerror = () => console.error('[STRIPE] Retry failed for Pricing Table')
      document.head.appendChild(script)
    }, 2000)
  }

  return (
    <>
      <Script
        id="stripe-js"
        src="https://js.stripe.com/v3/"
        strategy="afterInteractive"
        onLoad={handleStripeLoad}
        onError={handleStripeError}
      />
      {includePricingTable && (
        <Script
          id="stripe-pricing-table"
          src="https://js.stripe.com/v3/pricing-table.js"
          strategy="afterInteractive"
          onLoad={handlePricingTableLoad}
          onError={handlePricingTableError}
        />
      )}
    </>
  )
}
export default StripeScript