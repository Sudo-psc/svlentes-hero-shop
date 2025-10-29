import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { SubscriberAPIClient } from '@/lib/api/subscriber-client'

export type SubscriberOrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface SubscriberOrder {
  id: string
  subscriptionId: string
  status: SubscriberOrderStatus
  planName: string
  amount: number
  trackingCode: string | null
  shippingDate: string | null
  deliveryDate: string | null
  createdAt: string
  updatedAt: string
}

export interface SubscriberOrdersPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface UseSubscriberOrdersOptions {
  page?: number
  limit?: number
}

interface UseSubscriberOrdersReturn {
  orders: SubscriberOrder[]
  loading: boolean
  error: string | null
  pagination: SubscriberOrdersPagination | null
  refetch: () => void
  hasOrders: boolean
}

export function useSubscriberOrders(options: UseSubscriberOrdersOptions = {}): UseSubscriberOrdersReturn {
  const { user } = useAuth()
  const [orders, setOrders] = useState<SubscriberOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<SubscriberOrdersPagination | null>(null)
  const [refreshIndex, setRefreshIndex] = useState(0)

  const page = options.page ?? 1
  const limit = options.limit ?? 6

  useEffect(() => {
    let isActive = true

    const loadOrders = async () => {
      if (!user) {
        setOrders([])
        setPagination(null)
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const client = new SubscriberAPIClient(user)
        const response = await client.getOrders({ page, limit })

        if (!isActive) {
          return
        }

        setOrders(response.orders ?? [])
        setPagination(response.pagination ?? null)
        setError(null)
      } catch (err: unknown) {
        if (!isActive) {
          return
        }

        const message = err instanceof Error ? err.message : 'Erro ao carregar pedidos'
        setError(message)
      } finally {
        if (!isActive) {
          return
        }

        setLoading(false)
      }
    }

    void loadOrders()

    return () => {
      isActive = false
    }
  }, [user, page, limit, refreshIndex])

  const refetch = useCallback(() => {
    setRefreshIndex((prev) => prev + 1)
  }, [])

  const hasOrders = useMemo(() => orders.length > 0, [orders])

  return {
    orders,
    loading,
    error,
    pagination,
    refetch,
    hasOrders,
  }
}
