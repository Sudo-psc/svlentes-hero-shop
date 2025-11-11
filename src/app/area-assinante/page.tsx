'use client'

import { useEffect } from 'react'

export default function AreaAssinantePage() {
  const STRIPE_CUSTOMER_PORTAL_URL = 'https://billing.stripe.com/p/login/cNifZigA86ycek14ascQU00'

  useEffect(() => {
    // Redirect all users directly to Stripe Customer Portal
    window.location.href = STRIPE_CUSTOMER_PORTAL_URL
  }, [])

  // Show loading spinner while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-silver-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando para o portal de assinaturas...</p>
        <p className="text-sm text-gray-500 mt-2">
          Você será redirecionado automaticamente para o gerenciamento de sua assinatura.
        </p>
      </div>
    </div>
  )
}