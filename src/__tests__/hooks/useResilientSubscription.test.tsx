/**
 * Tests para useResilientSubscription hook
 * Testa resiliência, cache, offline mode, sincronização
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock dos módulos ANTES de importar
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'user_123',
      getIdToken: vi.fn().mockResolvedValue('mock-token')
    },
    loading: false
  })
}))

vi.mock('@/lib/resilient-data-fetcher', () => ({
  resilientFetcher: {
    fetch: vi.fn(),
    performHealthCheck: vi.fn(),
    clearCache: vi.fn()
  }
}))

vi.mock('@/lib/offline-storage', () => ({
  offlineStorage: {
    init: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getMetrics: vi.fn()
  }
}))

// Agora importar após os mocks
import { useResilientSubscription } from '@/hooks/useResilientSubscription'
import { resilientFetcher } from '@/lib/resilient-data-fetcher'
import { offlineStorage } from '@/lib/offline-storage'

const mockResilientFetcher = resilientFetcher as any
const mockOfflineStorage = offlineStorage as any

// Mock dados
const mockSubscriptionData = {
  subscription: {
    id: 'sub_123',
    status: 'active',
    plan: {
      id: 'plan_premium',
      name: 'Plano Premium',
      price: 199.90
    },
    nextBillingDate: '2024-01-15',
    paymentMethod: 'credit_card',
    paymentMethodLast4: '1234',
    shippingAddress: {
      street: 'Rua Test',
      number: '123',
      city: 'Caratinga',
      state: 'MG',
      zipCode: '35300-000'
    },
    benefits: ['Entrega grátis', 'Desconto de 20%']
  },
  user: {
    id: 'user_123',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '+5533999898026'
  }
}

describe('useResilientSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mock implementations
    mockResilientFetcher.fetch.mockReset()
    mockResilientFetcher.performHealthCheck.mockResolvedValue({ healthy: true })
    mockResilientFetcher.clearCache.mockImplementation(() => {})

    mockOfflineStorage.init.mockResolvedValue(true)
    mockOfflineStorage.get.mockResolvedValue(null)
    mockOfflineStorage.set.mockResolvedValue(true)
    mockOfflineStorage.delete.mockResolvedValue()
    mockOfflineStorage.getMetrics.mockReturnValue({
      totalOperations: 0,
      successfulOperations: 0,
      averageOperationTime: 0
    })

    // Mock de navegadores online/offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
      configurable: true
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Initial Load', () => {
    it('deve carregar dados da assinatura inicialmente', async () => {
      mockResilientFetcher.fetch.mockResolvedValue({
        status: 'success',
        data: mockSubscriptionData,
        fromCache: false,
        attempts: 1,
        responseTime: 100
      })

      const { result } = renderHook(() => useResilientSubscription())

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.subscription).toEqual(mockSubscriptionData.subscription)
      expect(result.current.user).toEqual(mockSubscriptionData.user)
      expect(result.current.error).toBeNull()
      expect(result.current.isOnline).toBe(true)
    })

    it('deve carregar dados do cache quando offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      })

      mockOfflineStorage.get.mockResolvedValue(mockSubscriptionData)
      mockResilientFetcher.fetch.mockResolvedValue({
        status: 'error',
        error: 'Network error',
        fromCache: false,
        attempts: 1,
        responseTime: 100
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.subscription).toEqual(mockSubscriptionData.subscription)
      expect(result.current.isOnline).toBe(false)
      expect(result.current.isUsingFallback).toBe(true)
    })

    it('deve lidar com erro no carregamento inicial', async () => {
      mockResilientFetcher.fetch.mockResolvedValue({
        status: 'error',
        error: 'API Error',
        fromCache: false,
        attempts: 3,
        responseTime: 1000
      })

      mockOfflineStorage.get.mockResolvedValue(null)

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.subscription).toBeNull()
      expect(result.current.error).toBeTruthy()
    })
  })

  describe('Refresh Functionality', () => {
    it('deve atualizar dados manualmente', async () => {
      mockResilientFetcher.fetch.mockResolvedValue({
        status: 'success',
        data: mockSubscriptionData,
        fromCache: false,
        attempts: 1,
        responseTime: 100
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Mock novos dados
      const updatedData = {
        ...mockSubscriptionData,
        subscription: {
          ...mockSubscriptionData.subscription,
          status: 'upgraded'
        }
      }

      mockResilientFetcher.fetch.mockResolvedValue({
        status: 'success',
        data: updatedData,
        fromCache: false,
        attempts: 1,
        responseTime: 100
      })

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.subscription?.status).toBe('upgraded')
    })
  })

  describe('Cache Strategy', () => {
    it('deve usar cache para requisições subsequentes', async () => {
      mockResilientFetcher.fetch.mockResolvedValue({
        status: 'cached',
        data: mockSubscriptionData,
        fromCache: true,
        attempts: 0,
        responseTime: 5
      })

      const { result, rerender } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const initialCallCount = mockResilientFetcher.fetch.mock.calls.length

      // Re-render não deve fazer nova chamada se cache estiver válido
      rerender()

      await waitFor(() => {
        expect(mockResilientFetcher.fetch.mock.calls.length).toBe(initialCallCount)
      })
    })
  })

  describe('Offline Mode', () => {
    it('deve detectar mudança de online para offline', async () => {
      mockResilientFetcher.fetch.mockResolvedValue({
        status: 'success',
        data: mockSubscriptionData,
        fromCache: false,
        attempts: 1,
        responseTime: 100
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true)
      })

      // Simular offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      })

      // Disparar evento offline
      const offlineEvent = new Event('offline')
      window.dispatchEvent(offlineEvent)

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false)
      })
    })
  })

  describe('Error Recovery', () => {
    it('deve tentar fallback quando API falhar', async () => {
      mockResilientFetcher.fetch.mockResolvedValue({
        status: 'fallback',
        data: mockSubscriptionData,
        fromCache: true,
        attempts: 3,
        responseTime: 1500
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.subscription).toEqual(mockSubscriptionData.subscription)
      expect(result.current.isUsingFallback).toBe(true)
    })
  })

  describe('Integration Tests', () => {
    it('deve handle ciclo completo online-offline-online', async () => {
      // Iniciar online
      mockResilientFetcher.fetch.mockResolvedValue({
        status: 'success',
        data: mockSubscriptionData,
        fromCache: false,
        attempts: 1,
        responseTime: 100
      })

      const { result } = renderHook(() => useResilientSubscription())

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true)
        expect(result.current.subscription).toEqual(mockSubscriptionData.subscription)
      })

      // Ficar offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      })
      const offlineEvent = new Event('offline')
      window.dispatchEvent(offlineEvent)

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false)
      })

      // Mock dados cache
      mockOfflineStorage.get.mockResolvedValue(mockSubscriptionData)
      mockResilientFetcher.fetch.mockResolvedValue({
        status: 'fallback',
        data: mockSubscriptionData,
        fromCache: true,
        attempts: 1,
        responseTime: 50
      })

      // Fazer refresh offline
      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.isUsingFallback).toBe(true)

      // Voltar online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true
      })
      const onlineEvent = new Event('online')
      window.dispatchEvent(onlineEvent)

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true)
      })
    })
  })
})
