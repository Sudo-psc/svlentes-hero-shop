/**
 * Dashboard Resilience Hook
 * Fornece fetching resiliente para todos os endpoints do dashboard
 *
 * Features:
 * - Integração com ResilientDataFetcher
 * - Cache em localStorage com TTL de 5 minutos
 * - Retry automático com exponential backoff
 * - Fallback para dados cacheados em caso de erro
 * - Offline detection
 * - Loading e error states
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { resilientFetcher } from '@/lib/resilient-data-fetcher'
import { useApiMonitoring } from '@/hooks/useApiMonitoring'

export interface DashboardMetrics {
  totalSaved: number
  lensesReceived: number
  daysUntilNextDelivery: number
  deliveryOnTimeRate: number
}

export interface DeliveryTimeline {
  pastDeliveries: Array<{
    id: string
    orderDate: string
    deliveredAt: string | null
    status: string
    trackingCode: string | null
    onTime: boolean | null
  }>
  nextDelivery: {
    estimatedDate: string
    daysRemaining: number
    status: string
    trackingCode: string | null
    orderId: string | null
  }
}

export interface SavingsWidget {
  totalSavings: number
  savingsThisMonth: number
  savingsTrend: Array<{
    month: string
    amount: number
  }>
  metadata: {
    monthsActive: number
    averageMonthlySavings: number
    subscriptionStartDate: string
  }
}

interface UseResilientDataOptions {
  enabled?: boolean
  refetchInterval?: number
  cacheTime?: number
  retryCount?: number
  fallbackData?: any
}

/**
 * Hook genérico para fetching resiliente
 */
function useResilientData<T>(
  endpoint: string,
  token: string | null,
  options: UseResilientDataOptions = {}
) {
  const {
    enabled = true,
    refetchInterval,
    cacheTime = 5 * 60 * 1000, // 5 minutos
    retryCount = 3,
    fallbackData,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const retryTimeoutRef = useRef<NodeJS.Timeout>()
  const { monitoredFetch } = useApiMonitoring()

  /**
   * Detectar se está offline
   */
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  /**
   * Buscar dados com resiliência
   */
  const fetchData = useCallback(async () => {
    if (!enabled || !token) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await resilientFetcher.fetch<T>({
        url: endpoint,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
        retries: retryCount,
        cacheTTL: cacheTime,
        fallbackData,
      })

      if (result.status === 'success' || result.status === 'cached') {
        setData(result.data!)
        setIsFromCache(result.fromCache)
        setError(null)
      } else if (result.status === 'fallback') {
        setData(result.data!)
        setIsFromCache(true)
        setError('Usando dados em cache devido a erro temporário')
      } else {
        setError(result.error || 'Erro ao carregar dados')

        // Se tem fallbackData, usar
        if (fallbackData) {
          setData(fallbackData)
          setIsFromCache(true)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error(`[useDashboardResilience] Error fetching ${endpoint}:`, errorMessage)
      setError(errorMessage)

      // Usar fallbackData se disponível
      if (fallbackData) {
        setData(fallbackData)
        setIsFromCache(true)
      }
    } finally {
      setLoading(false)
    }
  }, [endpoint, token, enabled, retryCount, cacheTime, fallbackData])

  /**
   * Retry manual
   */
  const retry = useCallback(() => {
    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }

    fetchData()
  }, [fetchData])

  /**
   * Initial fetch e refetch automático
   */
  useEffect(() => {
    if (enabled && token) {
      fetchData()

      // Setup refetch interval se configurado
      if (refetchInterval && refetchInterval > 0) {
        const interval = setInterval(fetchData, refetchInterval)
        return () => clearInterval(interval)
      }
    }
  }, [enabled, token, fetchData, refetchInterval])

  /**
   * Auto-retry quando volta online
   */
  useEffect(() => {
    if (!isOffline && error) {
      // Esperar 2s antes de tentar novamente
      retryTimeoutRef.current = setTimeout(() => {
        console.log(`[useDashboardResilience] Network restored, retrying ${endpoint}`)
        retry()
      }, 2000)

      return () => {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current)
        }
      }
    }
  }, [isOffline, error, endpoint, retry])

  return {
    data,
    loading,
    error,
    isFromCache,
    isOffline,
    retry,
    refetch: fetchData,
  }
}

/**
 * Hook específico para Dashboard Metrics
 */
export function useDashboardMetrics(
  token: string | null,
  options?: UseResilientDataOptions
) {
  const fallbackData: DashboardMetrics = {
    totalSaved: 0,
    lensesReceived: 0,
    daysUntilNextDelivery: 30,
    deliveryOnTimeRate: 100,
  }

  return useResilientData<DashboardMetrics>(
    '/api/assinante/dashboard-metrics',
    token,
    {
      fallbackData,
      cacheTime: 5 * 60 * 1000, // 5 minutos
      ...options,
    }
  )
}

/**
 * Hook específico para Delivery Timeline
 */
export function useDeliveryTimeline(
  token: string | null,
  options?: UseResilientDataOptions
) {
  const fallbackData: DeliveryTimeline = {
    pastDeliveries: [],
    nextDelivery: {
      estimatedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      daysRemaining: 30,
      status: 'scheduled',
      trackingCode: null,
      orderId: null,
    },
  }

  return useResilientData<DeliveryTimeline>(
    '/api/assinante/delivery-timeline',
    token,
    {
      fallbackData,
      cacheTime: 10 * 60 * 1000, // 10 minutos (dados mudam menos)
      ...options,
    }
  )
}

/**
 * Hook específico para Savings Widget
 */
export function useSavingsWidget(
  token: string | null,
  options?: UseResilientDataOptions
) {
  const fallbackData: SavingsWidget = {
    totalSavings: 0,
    savingsThisMonth: 0,
    savingsTrend: [],
    metadata: {
      monthsActive: 0,
      averageMonthlySavings: 0,
      subscriptionStartDate: new Date().toISOString(),
    },
  }

  return useResilientData<SavingsWidget>(
    '/api/assinante/savings-widget',
    token,
    {
      fallbackData,
      cacheTime: 15 * 60 * 1000, // 15 minutos (dados históricos)
      ...options,
    }
  )
}

/**
 * Hook para carregar todos os dados do dashboard
 */
export function useFullDashboard(token: string | null) {
  const metrics = useDashboardMetrics(token)
  const timeline = useDeliveryTimeline(token)
  const savings = useSavingsWidget(token)

  const isLoading = metrics.loading || timeline.loading || savings.loading
  const hasError = !!metrics.error || !!timeline.error || !!savings.error
  const isFromCache = metrics.isFromCache || timeline.isFromCache || savings.isFromCache
  const isOffline = metrics.isOffline || timeline.isOffline || savings.isOffline

  const retry = useCallback(() => {
    metrics.retry()
    timeline.retry()
    savings.retry()
  }, [metrics, timeline, savings])

  return {
    metrics: metrics.data,
    timeline: timeline.data,
    savings: savings.data,
    isLoading,
    hasError,
    isFromCache,
    isOffline,
    errors: {
      metrics: metrics.error,
      timeline: timeline.error,
      savings: savings.error,
    },
    retry,
  }
}
