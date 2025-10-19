'use client'

import Script from 'next/script'

interface StripeScriptProps {
  publishableKey?: string
}

export const StripeScript: React.FC<StripeScriptProps> = ({
  publishableKey
}) => {
  if (!publishableKey) {
    return null
  }

  return (
    <Script
      id="stripe-js"
      src="https://js.stripe.com/v3/"
      strategy="afterInteractive"
      onLoad={() => {
        // Stripe is loaded and ready to use
        console.log('Stripe.js loaded successfully')
      }}
      onError={(e) => {
        console.error('Failed to load Stripe.js:', e)
      }}
    />
  )
}

export default StripeScript