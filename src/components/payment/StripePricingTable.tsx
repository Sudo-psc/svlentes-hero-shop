/**
 * Enhanced Stripe Pricing Table Component
 *
 * Improvements:
 * - Better error handling and loading states
 * - Environment variable validation
 * - Fallback mechanism for API failures
 * - Proper TypeScript types
 * - Enhanced retry logic
 * - Mobile optimization
 *
 * @author Dr. Philipe Saraiva Cruz
 */

'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useStripeScriptLoader } from './StripeScriptLoader'

interface StripePrice {
  id: string
  currency: string
  unit_amount: number | null
  recurring: {
    interval: string
    interval_count: number
    aggregate_usage?: string | null
    meter?: string | null
    trial_period_days?: number | null
    usage_type: string
  } | null
  type: string
  active: boolean
}

interface StripeProduct {
  id: string
  name: string
  description: string | null
  images: string[]
  metadata: Record<string, string>
  active: boolean
  prices: StripePrice[]
  defaultPrice: {
    id: string
    amount: number
    currency: string
    recurring: {
      interval: string
      interval_count: number
      aggregate_usage?: string | null
      meter?: string | null
      trial_period_days?: number | null
      usage_type: string
    } | null
  } | null
}

interface ProductsResponse {
  products: StripeProduct[]
  count: number
}

interface StripePricingTableProps {
  pricingTableId?: string
  publishableKey?: string
  clientReferenceId?: string
  customerEmail?: string
  customerSessionClientSecret?: string
  className?: string
  onFallbackActivate?: () => void
  onReady?: () => void
}

export const StripePricingTable: React.FC<StripePricingTableProps> = ({
  pricingTableId,
  publishableKey,
  clientReferenceId,
  customerEmail,
  customerSessionClientSecret,
  className = "",
  onFallbackActivate,
  onReady
}) => {
  const [products, setProducts] = useState<StripeProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Environment variable validation
  const effectivePricingTableId = pricingTableId || process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID || 'prctbl_1SK1U5Ls8MC0aCdjGBBODqjW'
  const effectivePublishableKey = publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  const isValidPricingTableId = effectivePricingTableId && effectivePricingTableId.length > 0 && effectivePricingTableId.startsWith('prctbl_')
  const isValidPublishableKey = effectivePublishableKey &&
    (effectivePublishableKey.startsWith('pk_live_') || effectivePublishableKey.startsWith('pk_test_'))

  // Enhanced Stripe script loader - balanced timeout for better reliability
  const { StripeScriptLoaderComponent, scriptStatus, error: scriptError, isLoaded, isLoading, hasError } = useStripeScriptLoader({
    maxRetries: 3, // Increased retries for better success rate
    timeout: 12000, // 12 seconds timeout for slower connections
    onFallbackActivated: () => {
      console.log('[STRIPE_PRICING_TABLE] Fallback activated due to network issues')
      fetchProducts()
      onFallbackActivate?.()
    }
  })

  const hasNotifiedReadyRef = useRef(false)

  useEffect(() => {
    if (scriptStatus === 'loading') {
      hasNotifiedReadyRef.current = false
    }
  }, [scriptStatus])

  useEffect(() => {
    if (isLoaded && !hasError && !hasNotifiedReadyRef.current) {
      hasNotifiedReadyRef.current = true
      onReady?.()
    }
  }, [isLoaded, hasError, onReady])

  // Fetch products as fallback
  const fetchProducts = useCallback(async () => {
    if (loadingProducts) return

    setLoadingProducts(true)
    try {
      const response = await fetch('/api/stripe/products')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data: ProductsResponse = await response.json()
      setProducts(data.products || [])
    } catch (err) {
      console.error('[STRIPE_PRICING_TABLE] Failed to fetch products:', err)
    } finally {
      setLoadingProducts(false)
    }
  }, [loadingProducts])

  // Enhanced error monitoring
  useEffect(() => {
    const handleGlobalError = (event: CustomEvent) => {
      if (event.detail?.type === 'stripe' || event.detail?.type === 'chunk') {
        console.log('[STRIPE_PRICING_TABLE] Global error detected, activating fallback')
        fetchProducts()
      }
    }

    window.addEventListener('app:error', handleGlobalError as EventListener)
    return () => {
      window.removeEventListener('app:error', handleGlobalError as EventListener)
    }
  }, [fetchProducts])

  // Manual retry function
  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    window.location.reload()
  }

  // Show fallback pricing cards if we have products but script failed
  if (products.length > 0 && (hasError || scriptStatus === 'fallback')) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center mb-6">
          <div className="text-yellow-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="font-semibold">Carregando planos disponíveis</p>
          </div>
          <p className="text-sm text-yellow-700 mb-4">
            Usando catálogo de planos alternativo enquanto carregamos o sistema de pagamento seguro.
          </p>
        </div>

        {/* Product Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              {product.images[0] && (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}

              <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
              {product.description && (
                <p className="text-gray-600 mb-4 text-sm">{product.description}</p>
              )}

              {product.defaultPrice && (
                <div className="mb-6">
                  <p className="text-3xl font-bold text-cyan-600">
                    R$ {(product.defaultPrice.amount / 100).toFixed(2)}
                  </p>
                  {product.defaultPrice.recurring && (
                    <p className="text-sm text-gray-500">
                      /{product.defaultPrice.recurring.interval === 'month' ? 'mês' : 'ano'}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={async () => {
                  const priceId = product.defaultPrice?.id
                  if (priceId && effectivePublishableKey) {
                    try {
                      // Show loading state
                      const button = event.target as HTMLButtonElement
                      const originalText = button.textContent
                      button.textContent = 'Processando...'
                      button.disabled = true

                      // Create checkout session via API
                      const response = await fetch('/api/stripe/create-checkout', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          priceId: product.defaultPrice?.id,
                          customerEmail: customerEmail,
                        }),
                      })

                      if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`)
                      }

                      const data = await response.json()
                      if (data.checkoutUrl) {
                        window.location.href = data.checkoutUrl
                      } else {
                        throw new Error('URL de checkout não retornada')
                      }
                    } catch (error) {
                      console.error('[STRIPE_PRICING_TABLE] Checkout error:', error)
                      // Fallback to WhatsApp
                      window.open('https://wa.me/5533999898026?text=Olá!%20Gostaria%20de%20assinar%20o%20plano%20' + encodeURIComponent(product.name), '_blank')
                    } finally {
                      // Reset button
                      const button = event.target as HTMLButtonElement
                      button.textContent = 'Assinar Agora'
                      button.disabled = false
                    }
                  } else {
                    window.open('https://wa.me/5533999898026?text=Olá!%20Gostaria%20de%20assinar%20um%20plano%20de%20lentes.', '_blank')
                  }
                }}
                className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 text-white py-3 px-6 rounded-lg hover:from-cyan-700 hover:to-cyan-800 transition-colors font-semibold"
              >
                Assinar Agora
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Tentar carregar tabela de preços
          </button>
        </div>
      </div>
    )
  }

  // Error state
  if (hasError && scriptStatus === 'error') {
    return (
      <div className={`w-full p-8 bg-red-50 border border-red-200 rounded-lg text-center ${className}`}>
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="font-semibold">Erro ao carregar tabela de preços</p>
        </div>
        <p className="text-sm text-red-500 mb-4">{scriptError?.message || 'Erro ao carregar tabela de preços'}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => {
              window.open('https://wa.me/5533999898026?text=Olá!%20Gostaria%20de%20conhecer%20os%20planos%20de%20assinatura.', '_blank')
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Falar com WhatsApp
          </button>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`w-full p-8 bg-gray-50 border border-gray-200 rounded-lg text-center ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Carregando tabela de preços...</p>
        {retryCount > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            Tentativa {retryCount + 1} de 3
          </p>
        )}
      </div>
    )
  }

  // Early validation for missing credentials - activate fallback immediately
  if (!isValidPricingTableId || !isValidPublishableKey) {
    console.log('[STRIPE_PRICING_TABLE] Invalid configuration, using fallback immediately')
    fetchProducts()
    return <div className="w-full p-4 text-center">Carregando planos...</div>
  }

  // Activate fallback if loading takes too long
  useEffect(() => {
    // Monitor script status changes - only fetch products on error/fallback
    if (hasError || scriptStatus === 'fallback') {
      console.log('[STRIPE_PRICING_TABLE] Script error detected, activating fallback')
      fetchProducts()
      return
    }

    // Set timeout for loading state - fetch products if taking too long
    if (isLoading) {
      const loadingTimer = setTimeout(() => {
        console.log('[STRIPE_PRICING_TABLE] Loading timeout (12s), activating fallback with products')
        fetchProducts()
        onFallbackActivate?.()
      }, 12000)

      return () => clearTimeout(loadingTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, hasError, scriptStatus])

  // Success - Render Stripe Pricing Table
  return (
    <>
      {/* Script Loader Component */}
      <StripeScriptLoaderComponent />

      <div className={`stripe-pricing-table-container w-full ${className}`}>
        {isLoaded ? (
          <>
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
              pricing-table-id={effectivePricingTableId}
              publishable-key={effectivePublishableKey!}
              client-reference-id={clientReferenceId}
              customer-email={customerEmail}
              customer-session-client-secret={customerSessionClientSecret}
            />
          </>
        ) : (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm">Inicializando sistema de pagamento...</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default StripePricingTable