/**
 * Pricing Plans Context
 *
 * Provides app-level caching for pricing plans data
 * Reduces redundant API/import calls across dashboard components
 *
 * @author Dr. Philipe Saraiva Cruz
 */

'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { PricingPlan } from '@/types'

interface PricingPlansContextValue {
  /**
   * Available pricing plans (cached)
   */
  plans: PricingPlan[]

  /**
   * Loading state
   */
  loading: boolean

  /**
   * Error state if loading fails
   */
  error: Error | null

  /**
   * Manually refresh pricing plans
   */
  refresh: () => Promise<void>
}

const PricingPlansContext = createContext<PricingPlansContextValue | undefined>(undefined)

interface PricingPlansProviderProps {
  children: ReactNode
}

/**
 * Provider for pricing plans data with app-level caching
 *
 * Features:
 * - Loads pricing plans once on mount
 * - Caches data for entire app session
 * - Provides refresh capability
 * - Handles loading and error states
 *
 * @example
 * // Wrap your app or dashboard
 * <PricingPlansProvider>
 *   <Dashboard />
 * </PricingPlansProvider>
 *
 * // Use in components
 * const { plans, loading } = usePricingPlans()
 */
export function PricingPlansProvider({ children }: PricingPlansProviderProps) {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Dynamic import to support both client and server
      const plansModule = await import('@/data/pricing-plans')
      const plansData = plansModule.pricingPlans || []

      setPlans(plansData)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load pricing plans')
      setError(error)
      console.error('[PricingPlansContext] Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load plans on mount
  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  const refresh = useCallback(async () => {
    await loadPlans()
  }, [loadPlans])

  const value: PricingPlansContextValue = {
    plans,
    loading,
    error,
    refresh,
  }

  return (
    <PricingPlansContext.Provider value={value}>
      {children}
    </PricingPlansContext.Provider>
  )
}

/**
 * Hook to access cached pricing plans
 *
 * @throws Error if used outside PricingPlansProvider
 *
 * @example
 * const { plans, loading, error, refresh } = usePricingPlans()
 *
 * if (loading) return <LoadingSpinner />
 * if (error) return <ErrorMessage error={error} />
 *
 * return <PlansList plans={plans} />
 */
export function usePricingPlans(): PricingPlansContextValue {
  const context = useContext(PricingPlansContext)

  if (context === undefined) {
    throw new Error('usePricingPlans must be used within a PricingPlansProvider')
  }

  return context
}
