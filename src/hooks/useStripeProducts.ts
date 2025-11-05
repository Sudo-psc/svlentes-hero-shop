'use client'

import { useState, useEffect } from 'react'

export interface StripePrice {
  id: string
  currency: string
  unit_amount: number | null
  recurring: {
    interval: string
    interval_count: number
  } | null
  type: string
  active: boolean
}

export interface StripeProduct {
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
    } | null
  } | null
}

interface UseStripeProductsReturn {
  products: StripeProduct[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook para buscar produtos e preços do catálogo Stripe
 *
 * @returns {UseStripeProductsReturn} Lista de produtos, estado de loading e erro
 *
 * @example
 * ```tsx
 * function PricingPlans() {
 *   const { products, isLoading, error } = useStripeProducts()
 *
 *   if (isLoading) return <Loading />
 *   if (error) return <Error message={error} />
 *
 *   return (
 *     <div className="grid grid-cols-3 gap-4">
 *       {products.map(product => (
 *         <PlanCard key={product.id} product={product} />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 *
 * @author Dr. Philipe Saraiva Cruz
 */
export function useStripeProducts(): UseStripeProductsReturn {
  const [products, setProducts] = useState<StripeProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Buscar produtos do Stripe
      const response = await fetch('/api/stripe/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erro ao buscar produtos')
      }

      const data = await response.json()
      setProducts(data.products || [])

    } catch (err) {
      console.error('[useStripeProducts] Error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, []) // Carregar uma vez ao montar

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts
  }
}
