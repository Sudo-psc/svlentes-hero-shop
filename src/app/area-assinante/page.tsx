'use client'

import { useEffect } from 'react'

export default function AreaAssinantePage() {
  const STRIPE_CUSTOMER_PORTAL_URL = 'https://billing.stripe.com/p/login/cNifZigA86ycek14ascQU00'

  useEffect(() => {
    // Multiple redirect methods to ensure it works
    const performRedirect = () => {
      try {
        // Method 1: Direct window.location.href
        window.location.href = STRIPE_CUSTOMER_PORTAL_URL
        return true
      } catch (error) {
        console.log('Redirect method 1 failed, trying method 2')
        try {
          // Method 2: window.location.replace
          window.location.replace(STRIPE_CUSTOMER_PORTAL_URL)
          return true
        } catch (error2) {
          console.log('Redirect method 2 failed, trying method 3')
          try {
            // Method 3: window.location.assign
            window.location.assign(STRIPE_CUSTOMER_PORTAL_URL)
            return true
          } catch (error3) {
            console.log('All redirect methods failed')
            return false
          }
        }
      }
    }

    // Try redirect immediately
    if (!performRedirect()) {
      // If all fails, try using a link click
      const timer = setTimeout(() => {
        const link = document.createElement('a')
        link.href = STRIPE_CUSTOMER_PORTAL_URL
        link.click()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-silver-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          Redirecionando para o portal de assinaturas...
        </h1>
        <p className="text-gray-600 mb-6">
          Você será redirecionado automaticamente para o gerenciamento de sua assinatura.
        </p>

        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Se não for redirecionado automaticamente, clique no link abaixo:
          </p>
          <a
            href={STRIPE_CUSTOMER_PORTAL_URL}
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
            target="_self"
            rel="noopener noreferrer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Acessar Portal de Assinaturas
          </a>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Atenção:</strong> Você será direcionado para o portal seguro da Stripe onde poderá gerenciar sua assinatura, pagamentos e dados de entrega.
          </p>
        </div>
      </div>
    </div>
  )
}