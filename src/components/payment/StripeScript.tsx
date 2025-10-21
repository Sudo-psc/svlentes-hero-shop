'use client'
import Script from 'next/script'
interface StripeScriptProps {
  publishableKey?: string
  includePricingTable?: boolean
}
export const StripeScript: React.FC<StripeScriptProps> = ({
  publishableKey,
  includePricingTable = false
}) => {
  if (!publishableKey) {
    return null
  }
  return (
    <>
      <Script
        id="stripe-js"
        src="https://js.stripe.com/v3/"
        strategy="afterInteractive"
        onLoad={() => {
          // Initialize Stripe
          if (typeof window !== 'undefined' && (window as any).Stripe) {
            (window as any).Stripe = (window as any).Stripe(publishableKey)
          }
        }}
        onError={(e) => {
          console.error('Failed to load Stripe.js:', e)
        }}
      />
      {includePricingTable && (
        <Script
          id="stripe-pricing-table"
          src="https://js.stripe.com/v3/pricing-table.js"
          strategy="afterInteractive"
          onLoad={() => {
          }}
          onError={(e) => {
            console.error('Failed to load Stripe Pricing Table:', e)
          }}
        />
      )}
    </>
  )
}
export default StripeScript