/**
 * useResilientSubscription Hook
 * Hook de assinatura com sistema robusto de fallbacks e redundância
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { resilientFetcher } from '@/lib/resilient-data-fetcher'
import { offlineStorage } from '@/lib/offline-storage'
import type { Subscription, SubscriptionUser, SubscriptionResponse, SubscriptionStatus } from '@/types/subscription'
// Schema para dados de assinatura offline
const SubscriptionDataSchema = {
  subscription: {
    id: 'string',
    plan: {
      id: 'string',
      name: 'string',
      price: 'number'
    },
    status: 'string',
    nextBillingDate: 'string',
    paymentMethod: 'string',
    paymentMethodLast4: 'string',
    shippingAddress: 'object',
    benefits: 'array'
  },
  user: {
    id: 'string',
    name: 'string',
    email: 'string',
    phone: 'string'
  }
}
interface UseResilientSubscriptionReturn {
  subscription: Subscription | null
  user: SubscriptionUser | null
  loading: boolean
  error: string | null
  status: SubscriptionStatus
  isOnline: boolean
  isUsingFallback: boolean
  isUsingCache: boolean
  refetch: () => Promise<void>
  updateShippingAddress: (address: any) => Promise<boolean>
  retryConnection: () => Promise<void>
  clearCache: () => void
  connectionStats: {
    lastSuccessfulFetch: Date | null
    totalAttempts: number
    successfulAttempts: number
    failedAttempts: number
    averageResponseTime: number
  }
}
export function useResilientSubscription(): UseResilientSubscriptionReturn {
  const { user: authUser, loading: authLoading } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [user, setUser] = useState<SubscriptionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<SubscriptionStatus>('loading')
  const [isOnline, setIsOnline] = useState(true)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [isUsingCache, setIsUsingCache] = useState(false)
  // Estatísticas de conexão
  const [connectionStats, setConnectionStats] = useState({
    lastSuccessfulFetch: null as Date | null,
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    averageResponseTime: 0
  })
  const cacheKey = useMemo(() => authUser?.uid ?? null, [authUser])
  /**
   * Tentar carregar dados offline primeiro
   */
  const loadOfflineData = useCallback(async (): Promise<{ subscription: Subscription | null; user: SubscriptionUser | null } | null> => {
    if (!cacheKey) return null
    try {
      // Tentar obter dados do cache offline
      const offlineData = await offlineStorage.get<{ subscription: Subscription; user: SubscriptionUser }>(`subscription_${cacheKey}`)
      if (offlineData) {
        return offlineData
      }
      // Tentar obter dados individualmente
      const offlineSubscription = await offlineStorage.get<Subscription>(`subscription_${cacheKey}`)
      const offlineUser = await offlineStorage.get<SubscriptionUser>(`user_${cacheKey}`)
      if (offlineSubscription || offlineUser) {
        return { subscription: offlineSubscription, user: offlineUser }
      }
      return null
    } catch (error) {
      console.error('[useResilientSubscription] Failed to load offline data:', error)
      return null
    }
  }, [cacheKey])
  /**
   * Salvar dados offline
   */
  const saveOfflineData = useCallback(async (subscriptionData: SubscriptionResponse) => {
    if (!cacheKey) return
    try {
      // Salvar dados combinados
      await offlineStorage.set(`subscription_${cacheKey}`, subscriptionData, {
        ttl: 24 * 60 * 60 * 1000, // 24 horas
        tags: ['subscription', 'user']
      })
      // Salvar dados individualmente para redundância
      await offlineStorage.set(`subscription_${cacheKey}`, subscriptionData.subscription, {
        ttl: 24 * 60 * 60 * 1000,
        tags: ['subscription']
      })
      await offlineStorage.set(`user_${cacheKey}`, subscriptionData.user, {
        ttl: 24 * 60 * 60 * 1000,
        tags: ['user']
      })
    } catch (error) {
      console.error('[useResilientSubscription] Failed to save offline data:', error)
    }
  }, [cacheKey])
  /**
   * Buscar assinatura com sistema resiliente
   */
  const fetchSubscription = useCallback(async () => {
    if (!authUser || !cacheKey) {
      setStatus('unauthenticated')
      setLoading(false)
      return
    }
    setLoading(true)
    setConnectionStats(prev => ({ ...prev, totalAttempts: prev.totalAttempts + 1 }))
    try {
      // 1. Tentar obter token
      const token = await authUser.getIdToken()
      // 2. Usar fetcher resiliente com múltiplos fallbacks
      const result = await resilientFetcher.fetch<SubscriptionResponse>({
        url: '/api/assinante/subscription',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
        retries: 3,
        cacheStrategy: 'memory',
        cacheTTL: 5 * 60 * 1000, // 5 minutos
        fallbackData: null // Não ter fallback default para saber quando falhar
      })
      if (result.status === 'success' && result.data) {
        // Sucesso - atualizar estado
        setSubscription(result.data.subscription)
        setUser(result.data.user)
        setStatus('authenticated')
        setError(null)
        setIsUsingFallback(false)
        setIsUsingCache(result.fromCache)
        // Salvar dados offline
        await saveOfflineData(result.data)
        // Atualizar estatísticas
        setConnectionStats(prev => ({
          ...prev,
          lastSuccessfulFetch: new Date(),
          successfulAttempts: prev.successfulAttempts + 1,
          averageResponseTime: (prev.averageResponseTime * prev.successfulAttempts + result.responseTime) / (prev.successfulAttempts + 1)
        }))
      } else if (result.status === 'fallback' && result.data) {
        // Usando dados fallback
        setSubscription(result.data.subscription)
        setUser(result.data.user)
        setStatus('authenticated')
        setError(null)
        setIsUsingFallback(true)
        setIsUsingCache(result.fromCache)
      } else {
        // Falha completa - tentar dados offline
        const offlineData = await loadOfflineData()
        if (offlineData) {
          setSubscription(offlineData.subscription)
          setUser(offlineData.user)
          setStatus('authenticated')
          setError('Modo offline - dados podem não estar atualizados')
          setIsUsingFallback(true)
          setIsUsingCache(true)
        } else {
          setError(result.error || 'Falha ao carregar dados')
          setStatus('error')
          setIsUsingFallback(false)
          setIsUsingCache(false)
          // Atualizar estatísticas de falha
          setConnectionStats(prev => ({ ...prev, failedAttempts: prev.failedAttempts + 1 }))
        }
      }
    } catch (err: any) {
      console.error('[useResilientSubscription] Fetch error:', err)
      // Último recurso - tentar dados offline
      const offlineData = await loadOfflineData()
      if (offlineData) {
        setSubscription(offlineData.subscription)
        setUser(offlineData.user)
        setStatus('authenticated')
        setError('Modo offline - dados podem não estar atualizados')
        setIsUsingFallback(true)
        setIsUsingCache(true)
      } else {
        setError(err.message || 'Erro ao carregar dados')
        setStatus('error')
        setIsUsingFallback(false)
        setIsUsingCache(false)
        setConnectionStats(prev => ({ ...prev, failedAttempts: prev.failedAttempts + 1 }))
      }
    } finally {
      setLoading(false)
    }
  }, [authUser, cacheKey, loadOfflineData, saveOfflineData])
  /**
   * Atualizar endereço de entrega
   */
  const updateShippingAddress = useCallback(async (address: any): Promise<boolean> => {
    if (!authUser || !cacheKey) {
      setError('Usuário não autenticado')
      return false
    }
    try {
      const token = await authUser.getIdToken()
      const result = await resilientFetcher.fetch({
        url: '/api/assinante/subscription',
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: { shippingAddress: address },
        timeout: 10000,
        retries: 2
      })
      if (result.status === 'success') {
        // Limpar cache para forçar refresh
        await fetchSubscription()
        return true
      } else {
        setError(result.error || 'Erro ao atualizar endereço')
        return false
      }
    } catch (err: any) {
      console.error('[useResilientSubscription] Update error:', err)
      setError(err.message || 'Erro ao atualizar endereço')
      return false
    }
  }, [authUser, cacheKey, fetchSubscription])
  /**
   * Tentar reconectar manualmente
   */
  const retryConnection = useCallback(async () => {
    setIsOnline(true)
    setIsUsingFallback(false)
    setIsUsingCache(false)
    await fetchSubscription()
  }, [fetchSubscription])
  /**
   * Limpar cache local
   */
  const clearCache = useCallback(async () => {
    try {
      if (cacheKey) {
        await offlineStorage.delete(`subscription_${cacheKey}`)
        await offlineStorage.delete(`user_${cacheKey}`)
      }
      resilientFetcher.clearCache()
      await fetchSubscription()
    } catch (error) {
      console.error('[useResilientSubscription] Failed to clear cache:', error)
    }
  }, [cacheKey, fetchSubscription])
  /**
   * Monitorar status de conexão
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
    }
    const handleOffline = () => {
      setIsOnline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  /**
   * Health check periódico
   */
  useEffect(() => {
    if (!isOnline) return
    const interval = setInterval(async () => {
      try {
        const healthCheck = await resilientFetcher.performHealthCheck('/api/health-check')
        if (!healthCheck.healthy) {
          console.warn('[useResilientSubscription] Health check failed, using cached data')
        }
      } catch (error) {
        console.warn('[useResilientSubscription] Health check error:', error)
      }
    }, 5 * 60 * 1000) // A cada 5 minutos
    return () => clearInterval(interval)
  }, [isOnline])
  /**
   * Initial fetch
   */
  useEffect(() => {
    if (!authLoading) {
      fetchSubscription()
    }
  }, [authLoading, fetchSubscription])
  return {
    subscription,
    user,
    loading: loading || authLoading,
    error,
    status,
    isOnline,
    isUsingFallback,
    isUsingCache,
    refetch: fetchSubscription,
    updateShippingAddress,
    retryConnection,
    clearCache,
    connectionStats
  }
}