/**
 * Tests para ResilientDataFetcher - Versão Simplificada
 * Foco: Funcionalidade core crítica para resiliência em produção
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ResilientDataFetcher } from '@/lib/resilient-data-fetcher'

// Mock do fetch global usando vi.stubGlobal
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('ResilientDataFetcher - Core Functionality', () => {
  let fetcher: ResilientDataFetcher

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    fetcher = new ResilientDataFetcher()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    fetcher.destroy()
    vi.useRealTimers()
  })

  describe('✅ Requisições Básicas', () => {
    it('deve fazer requisição bem-sucedida', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'success' })
      } as Response)

      const result = await fetcher.fetch({ url: '/api/test' })

      expect(result.status).toBe('success')
      expect(result.data.data).toBe('success')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('deve retornar erro quando requisição falha', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await fetcher.fetch({ url: '/api/test', retries: 0 })

      expect(result.status).toBe('error')
      expect(result.error).toBeDefined()
    })
  })

  describe('✅ Circuit Breaker', () => {
    it('deve abrir circuito após falhas consecutivas', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      // Disparar falhas suficientes para abrir circuito
      for (let i = 0; i < 5; i++) {
        await fetcher.fetch({ url: '/api/test', retries: 0 })
      }

      // Tentativa adicional deve falhar com circuit breaker
      const result = await fetcher.fetch({ url: '/api/test', retries: 0 })
      expect(result.status).toBe('error')
      expect(result.error).toContain('Circuit breaker')
    })
  })

  describe('✅ Retry Logic', () => {
    it('deve tentar novamente em caso de falha', async () => {
      let attemptCount = 0
      mockFetch.mockImplementation(() => {
        attemptCount++
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary failure'))
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        } as Response)
      })

      const result = await fetcher.fetch({ url: '/api/test' })

      expect(attemptCount).toBe(3)
      expect(result.data?.success).toBe(true)
      expect(result.status).toBe('success')
    })

    it('deve aplicar exponential backoff', async () => {
      let attemptCount = 0

      mockFetch.mockImplementation(() => {
        attemptCount++
        return Promise.reject(new Error('Always fails'))
      })

      // Executar fetch em background
      const fetchPromise = fetcher.fetch({ url: '/api/test', retries: 2 })

      // Avançar timers para simular backoff (1s + 2s = 3s)
      await vi.advanceTimersByTimeAsync(3000)

      await fetchPromise

      expect(attemptCount).toBeGreaterThanOrEqual(3)
    })
  })

  describe('✅ Cache System', () => {
    it('deve armazenar respostas bem-sucedidas em cache', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test', timestamp: Date.now() })
      } as Response)

      // Primeira chamada
      const result1 = await fetcher.fetch({ url: '/api/test', cacheStrategy: 'memory' })

      // Segunda chamada deve usar cache
      const result2 = await fetcher.fetch({ url: '/api/test', cacheStrategy: 'memory' })

      expect(result1.data).toEqual(result2.data)
      expect(result2.status).toBe('cached')
      expect(mockFetch).toHaveBeenCalledTimes(1) // Apenas uma chamada real
    })

    it('deve respeitar TTL do cache', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test', timestamp: Date.now() })
      } as Response)

      // Primeira chamada
      await fetcher.fetch({ url: '/api/test', cacheStrategy: 'memory', cacheTTL: 100 })

      // Avançar tempo para expiração do cache
      await vi.advanceTimersByTimeAsync(150)

      // Segunda chamada deve buscar novamente
      await fetcher.fetch({ url: '/api/test', cacheStrategy: 'memory', cacheTTL: 100 })

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('✅ Fallback Strategies', () => {
    it('deve usar fallback quando API falha', async () => {
      mockFetch.mockRejectedValue(new Error('API failed'))

      const fallbackData = { data: 'fallback data', source: 'fallback' }
      const result = await fetcher.fetch({
        url: '/api/primary',
        fallbackData,
        retries: 0
      })

      expect(result.status).toBe('fallback')
      expect(result.data).toEqual(fallbackData)
    })

    it('deve usar cache expirado como fallback quando API falha', async () => {
      // Primeira chamada bem-sucedida
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'cached data' })
      } as Response)

      await fetcher.fetch({ url: '/api/test', cacheTTL: 100 })

      // Avançar tempo para cache expirar
      await vi.advanceTimersByTimeAsync(150)

      // Segunda chamada falha, mas deve retornar cache expirado
      mockFetch.mockRejectedValueOnce(new Error('API down'))

      const result = await fetcher.fetch({ url: '/api/test', retries: 0 })

      expect(result.status).toBe('fallback')
      expect(result.fromCache).toBe(true)
      expect(result.data.data).toBe('cached data')
    })
  })

  describe('✅ Cleanup', () => {
    it('deve limpar recursos ao chamar destroy()', () => {
      expect(() => {
        fetcher.destroy()
      }).not.toThrow()
    })

    it('deve ter método getMetrics() disponível', () => {
      const metrics = fetcher.getMetrics()

      expect(metrics).toBeDefined()
      expect(metrics.totalRequests).toBeDefined()
      expect(metrics.successfulRequests).toBeDefined()
      expect(metrics.failedRequests).toBeDefined()
    })
  })
})
