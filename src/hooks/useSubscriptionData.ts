/**
 * useSubscriptionData Hook
 * Alias/wrapper for useSubscription hook with same interface
 * Created for test compatibility and consistent naming
 */
import { useSubscription } from './useSubscription'
import type { Subscription, SubscriptionUser, SubscriptionStatus } from '@/types/subscription'

export interface UseSubscriptionDataReturn {
  subscription: Subscription | null
  user: SubscriptionUser | null
  loading: boolean
  error: string | null
  status: SubscriptionStatus
  refetch: () => Promise<void>
  updateShippingAddress: (address: any) => Promise<boolean>
}

/**
 * Hook to fetch and manage subscription data for authenticated users
 * This is an alias for useSubscription to maintain backward compatibility
 *
 * @returns Subscription data, user info, loading state, and utility functions
 */
export function useSubscriptionData(): UseSubscriptionDataReturn {
  return useSubscription()
}
