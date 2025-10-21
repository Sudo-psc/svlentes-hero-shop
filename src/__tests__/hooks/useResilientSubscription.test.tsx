/**
 * Tests para useResilientSubscription hook
 * Testa resiliência, cache, offline mode, sincronização
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useResilientSubscription } from '@/hooks/useResilientSubscription'
import { resilientFetcher } from '@/lib/resilient-data-fetcher'
import { offlineStorage } from '@/lib/offline-storage'

// Mock dos módulos
vi.mock('@/lib/resilient-data-fetcher')
vi.mock('@/lib/offline-storage')

const mockResilientFetcher = vi.mocked(resilientFetcher)
const mockOfflineStorage = vi.mocked(offlineStorage)

// Mock dados
const mockSubscriptionData = {
  id: 'sub_123',
  status: 'active',
  plan: {
    name: 'Plano Premium',
    price: 199.90,
    lensesPerMonth: 6
  },
  nextDelivery: '2024-01-15',
  user: {
    id: 'user_123',
    name: 'João Silva',
    email: 'joao@example.com'
  }
}

describe('useResilientSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup padrão para mocks
    mockResilientFetcher.fetch = vi.fn()
    mockOfflineStorage.init = vi.fn().mockResolvedValue(true)
    mockOfflineStorage.get = vi.fn().mockResolvedValue(null)
    mockOfflineStorage.set = vi.fn().mockResolvedValue(true)
    mockOfflineStorage.delete = vi.fn().mockResolvedValue(true)

    // Mock de navegadores online/offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })

    // Mock de eventos online/offline
    vi.stubGlobal('addEventListener', vi.fn())
    vi.stubGlobal('removeEventListener', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('Initial Load', () => {
    it('deve carregar dados da assinatura inicialmente', async () => {
      mockResilientDataFetcher.fetch!.mockResolvedValue({
        success: true,
        data: mockSubscriptionData,
        source: 'api',
        timestamp: Date.now()
      })

      const { result } = renderHook(() => useResilientSubscription())

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.subscription).toEqual(mockSubscriptionData)
      expect(result.current.error).toBeNull()
      expect(result.current.isOnline).toBe(true)
      expect(result.current.lastSync).toBeDefined()
    })

    it('deve carregar dados do cache quando offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false })

      mockOfflineStorage.get!.mockResolvedValue(mockSubscriptionData)

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.subscription).toEqual(mockSubscriptionData)
      expect(result.current.isOnline).toBe(false)
      expect(result.current.usingOfflineData).toBe(true)
      expect(mockOfflineStorage.get).toHaveBeenCalledWith('subscription_data')
    })

    it('deve lidar com erro no carregamento inicial', async () => {
      mockResilientDataFetcher.fetch!.mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.subscription).toBeNull()
      expect(result.current.error).toBeTruthy()
      expect(result.current.error?.message).toContain('API Error')
    })
  })

  describe('Refresh Functionality', () => {
    it('deve atualizar dados manualmente', async () => {
      mockResilientDataFetcher.fetch!.mockResolvedValue({
        success: true,
        data: mockSubscriptionData,
        source: 'api'
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Mock novos dados
      const updatedData = {
        ...mockSubscriptionData,
        status: 'upgraded',
        plan: { ...mockSubscriptionData.plan, name: 'Plano Premium Plus' }
      }

      mockResilientDataFetcher.fetch!.mockResolvedValue({
        success: true,
        data: updatedData,
        source: 'api'
      })

      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.subscription).toEqual(updatedData)
      expect(mockOfflineStorage.set).toHaveBeenCalledWith(
        'subscription_data',
        updatedData,
        expect.objectContaining({ ttl: 300000 })
      )
    })

    it('deve forçar refresh ignorando cache', async () => {
      mockResilientDataFetcher.fetch!.mockResolvedValue({
        success: true,
        data: mockSubscriptionData,
        source: 'api'
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.refresh(true) // force = true
      })

      expect(mockResilientDataFetcher.fetch).toHaveBeenCalledWith(
        '/api/assinante/subscription',
        expect.objectContaining({
          useCache: false,
          forceRefresh: true
        })
      )
    })

    it('deve lidar com erro no refresh', async () => {
      mockResilientDataFetcher.fetch!.mockResolvedValue({
        success: true,
        data: mockSubscriptionData,
        source: 'api'
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      mockResilientDataFetcher.fetch!.mockRejectedValue(new Error('Refresh failed'))

      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.error?.message).toContain('Refresh failed')
      // Dados anteriores devem ser mantidos
      expect(result.current.subscription).toEqual(mockSubscriptionData)
    })
  })

  describe('Cache Strategy', () => {
    it('deve usar cache para requisições subsequentes', async () => {
      mockResilientDataFetcher.fetch!.mockResolvedValue({
        success: true,
        data: mockSubscriptionData,
        source: 'api'
      })

      const { result, rerender } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const initialCallCount = mockResilientDataFetcher.fetch!.mock.calls.length

      // Re-render não deve fazer nova chamada se cache estiver válido
      rerender()

      await waitFor(() => {
        expect(mockResilientDataFetcher.fetch!.mock.calls.length).toBe(initialCallCount)
      })
    })

    it('deve invalidar cache após TTL', async () => {
      mockResilientDataFetcher.fetch!.mockResolvedValue({
        success: true,
        data: mockSubscriptionData,
        source: 'api',
        timestamp: Date.now() - 400000 // 400ms atrás (TTL é 300ms por padrão)
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Cache expirado deve fazer nova requisição
      const newData = { ...mockSubscriptionData, status: 'updated' }
      mockResilientDataFetcher.fetch!.mockResolvedValue({
        success: true,
        data: newData,
        source: 'api'
      })

      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.subscription).toEqual(newData)
    })
  })

  describe('Offline Mode', () => {
    it('deve detectar mudança de online para offline', async () => {
      mockResilientDataFetcher.fetch!.mockResolvedValue({
        success: true,
        data: mockSubscriptionData,
        source: 'api'
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true)
      })

      // Simular offline
      Object.defineProperty(navigator, 'onLine', { value: false })

      // Disparar evento offline
      const offlineEvent = new Event('offline')
      window.dispatchEvent(offlineEvent)

      expect(result.current.isOnline).toBe(false)
    })

    it('deve armazenar dados para sincronização posterior', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false)
      })

      // Tentar refresh offline deve salvar na fila de sincronização
      await act(async () => {
        await result.current.refresh()
      })

      expect(mockOfflineStorage.set).toHaveBeenCalledWith(
        'pending_sync_subscription',
        expect.any(Object),
        expect.any(Object)
      )
    })

    it('deve sincronizar dados quando voltar online', async () => {
      // Começar offline
      Object.defineProperty(navigator, 'onLine', { value: false })

      mockOfflineStorage.get!.mockResolvedValue(mockSubscriptionData)
      mockOfflineStorage.get!.mockResolvedValueOnce([{ key: 'test', data: {}, timestamp: Date.now() }])

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false)
      })

      // Mock sincronização
      mockOfflineStorage.sync!.mockResolvedValue({
        successful: 1,
        failed: 0,
        errors: []
      })

      // Voltar online
      Object.defineProperty(navigator, 'onLine', { value: true })
      const onlineEvent = new Event('online')
      window.dispatchEvent(onlineEvent)

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true)
      })

      expect(mockOfflineStorage.sync).toHaveBeenCalled()
    })
  })

  describe('Error Recovery', () => {
    it('deve tentar fallback quando API falhar', async () => {
      mockResilientDataFetcher.fetch!.mockResolvedValue({
        success: false,
        error: 'API Error',
        fallbackData: mockSubscriptionData,
        isFallback: true
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.subscription).toEqual(mockSubscriptionData)
      expect(result.current.usingFallbackData).toBe(true)
    })

    it('deve implementar retry automático em falhas', async () => {
      let attemptCount = 0
      mockResilientDataFetcher.fetch!.mockImplementation(() => {
        attemptCount++
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary failure'))
        }
        return Promise.resolve({
          success: true,
          data: mockSubscriptionData,
          source: 'api'
        })
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 5000 })

      expect(attemptCount).toBe(3)
      expect(result.current.subscription).toEqual(mockSubscriptionData)
    })

    it('deve mostrar indicador de degradação graceful', async () => {
      mockResilientDataFetcher.fetch!.mockResolvedValue({
        success: true,
        data: mockSubscriptionData,
        source: 'cache', // Usando dados cache
        isFallback: false,
        performance: {
          responseTime: 2000,
          fromCache: true
        }
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.performanceDegraded).toBe(true)
      expect(result.current.connectionStatus).toBe('degraded')
    })
  })

  describe('Performance Metrics', () => {
    it('deve coletar métricas de performance', async () => {
      mockResilientDataFetcher.fetch!.mockResolvedValue({
        success: true,
        data: mockSubscriptionData,
        source: 'api',
        performance: {
          responseTime: 150,
          fromCache: false,
          retryCount: 0
        }
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.metrics).toBeDefined()
      expect(result.current.metrics.responseTime).toBe(150)
      expect(result.current.metrics.cacheHitRate).toBeDefined()
      expect(result.current.metrics.errorRate).toBeDefined()
    })

    it('deve atualizar métricas de storage', async () => {
      mockOfflineStorage.getMetrics!.mockReturnValue({
        totalOperations: 10,
        successfulOperations: 9,
        averageOperationTime: 25,
        storageSize: 1024
      })

      mockResilientDataFetcher.fetch!.mockResolvedValue({
        success: true,
        data: mockSubscriptionData,
        source: 'api'
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.storageMetrics).toBeDefined()
      expect(result.current.storageMetrics.totalOperations).toBe(10)
    })
  })

  describe('Real-time Updates', () => {
    it('deve configurar listener para atualizações WebSocket', async () => {
      const mockWebSocket = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        send: vi.fn(),
        close: vi.fn()
      }

      vi.stubGlobal('WebSocket', vi.fn(() => mockWebSocket))

      mockResilientDataFetcher.fetch!.mockResolvedValue({
        success: true,
        data: mockSubscriptionData,
        source: 'api'
      })

      renderHook(() => useResilientSubscription())

      // Verificar se WebSocket foi configurado
      expect(WebSocket).toHaveBeenCalledWith(
        expect.stringContaining('ws://'),
        expect.any(Object)
      )
    })

    it('deve processar atualizações em tempo real', async () => {
      mockResilientDataFetcher.fetch!.mockResolvedValue({
        success: true,
        data: mockSubscriptionData,
        source: 'api'
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simular atualização WebSocket
      const updatedData = {
        ...mockSubscriptionData,
        status: 'paused'
      }

      await act(async () => {
        // Simular recebimento de atualização
        if (result.current.onRealtimeUpdate) {
          result.current.onRealtimeUpdate(updatedData)
        }
      })

      expect(result.current.subscription?.status).toBe('paused')
    })
  })

  describe('Prefetching', () => {
    it('deve prefetch dados relacionados', async () => {
      mockResilientDataFetcher.fetch!.mockResolvedValue({
        success: true,
        data: mockSubscriptionData,
        source: 'api'
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Verificar se prefetch foi chamado para dados relacionados
      expect(mockResilientDataFetcher.fetch).toHaveBeenCalledWith(
        '/api/assinante/orders',
        expect.objectContaining({ priority: 'low' })
      )
    })

    it('deve cancelar prefetch quando offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false)
      })

      // Não deve fazer prefetch quando offline
      expect(mockResilientDataFetcher.fetch).not.toHaveBeenCalledWith(
        '/api/assinante/orders',
        expect.any(Object)
      )
    })
  })

  describe('Integration Tests', () => {
    it('deve handle ciclo completo online-offline-online', async () => {
      // Iniciar online
      mockResilientDataFetcher.fetch!.mockResolvedValue({
        success: true,
        data: mockSubscriptionData,
        source: 'api'
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true)
        expect(result.current.subscription).toEqual(mockSubscriptionData)
      })

      // Ficar offline
      Object.defineProperty(navigator, 'onLine', { value: false })
      const offlineEvent = new Event('offline')
      window.dispatchEvent(offlineEvent)

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false)
      })

      // Mock dados cache
      mockOfflineStorage.get!.mockResolvedValue(mockSubscriptionData)

      // Fazer refresh offline
      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.usingOfflineData).toBe(true)

      // Voltar online
      Object.defineProperty(navigator, 'onLine', { value: true })
      const onlineEvent = new Event('online')
      window.dispatchEvent(onlineEvent)

      // Mock sincronização bem-sucedida
      mockOfflineStorage.sync!.mockResolvedValue({
        successful: 1,
        failed: 0,
        errors: []
      })

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true)
      })

      expect(mockOfflineStorage.sync).toHaveBeenCalled()
    })

    it('deve manter performance sob alta frequência de atualizações', async () => {
      mockResilientDataFetcher.fetch!.mockResolvedValue({
        success: true,
        data: mockSubscriptionData,
        source: 'api'
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simular múltiplas atualizações rápidas
      const startTime = Date.now()

      for (let i = 0; i < 10; i++) {
        await act(async () => {
          if (result.current.onRealtimeUpdate) {
            result.current.onRealtimeUpdate({
              ...mockSubscriptionData,
              updateCount: i
            })
          }
        })
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Deve processar atualizações rapidamente
      expect(duration).toBeLessThan(1000)
      expect(result.current.subscription?.updateCount).toBe(9)
    })
  })
})