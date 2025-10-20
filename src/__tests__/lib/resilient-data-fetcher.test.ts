/**
 * Tests para ResilientDataFetcher
 * Testa circuit breaker, retry logic, fallback strategies
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ResilientDataFetcher } from '@/lib/resilient-data-fetcher'

// Mock do fetch global
const mockFetch = vi.fn()
global.fetch = mockFetch

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

describe('ResilientDataFetcher', () => {
  let fetcher: ResilientDataFetcher

  beforeEach(() => {
    vi.clearAllMocks()
    fetcher = new ResilientDataFetcher()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    fetcher.destroy()
  })

  describe('Circuit Breaker', () => {
    it('deve abrir circuito após falhas consecutivas', async () => {
      // Mock falha consecutiva
      mockFetch.mockRejectedValue(new Error('Network error'))

      // Disparar falhas suficientes para abrir circuito
      for (let i = 0; i < 5; i++) {
        try {
          await fetcher.fetch('/api/test')
        } catch (error) {
          // Ignorar erros esperados
        }
      }

      // Tentativa adicional deve falhar com circuit breaker
      await expect(fetcher.fetch('/api/test')).rejects.toThrow('Circuit breaker is open')
    })

    it('deve fechar circuito após recovery timeout', async () => {
      // Mock falha para abrir circuito
      mockFetch.mockRejectedValue(new Error('Network error'))

      // Abrir circuito
      for (let i = 0; i < 5; i++) {
        try {
          await fetcher.fetch('/api/test')
        } catch (error) {
          // Ignorar
        }
      }

      // Verificar que está aberto
      await expect(fetcher.fetch('/api/test')).rejects.toThrow('Circuit breaker is open')

      // Mock sucesso
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      // Esperar recovery timeout (reduzido para teste)
      await new Promise(resolve => setTimeout(resolve, 100))

      // Tentar novamente - deve permitir uma chamada de teste
      const result = await fetcher.fetch('/api/test')
      expect(result.success).toBe(true)
    })

    it('deve resetar circuito após chamada bem-sucedida', async () => {
      // Mock falha para abrir circuito
      mockFetch.mockRejectedValue(new Error('Network error'))

      // Abrir circuito
      for (let i = 0; i < 5; i++) {
        try {
          await fetcher.fetch('/api/test')
        } catch (error) {
          // Ignorar
        }
      }

      // Mock sucesso
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      // Esperar recovery e tentar
      await new Promise(resolve => setTimeout(resolve, 100))
      await fetcher.fetch('/api/test')

      // Circuit breaker deve estar fechado agora
      const result = await fetcher.fetch('/api/test')
      expect(result.success).toBe(true)
    })
  })

  describe('Retry Logic', () => {
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

      const result = await fetcher.fetch('/api/test')

      expect(attemptCount).toBe(3)
      expect(result.success).toBe(true)
    })

    it('deve aplicar exponential backoff', async () => {
      const startTime = Date.now()
      let attemptCount = 0

      mockFetch.mockImplementation(() => {
        attemptCount++
        return Promise.reject(new Error('Always fails'))
      })

      try {
        await fetcher.fetch('/api/test')
      } catch (error) {
        // Esperar falha
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Deve ter demorado pelo menos o tempo de backoff acumulado
      expect(duration).toBeGreaterThan(1000) // 100ms + 200ms + 400ms + 800ms
      expect(attemptCount).toBe(4) // Tentativa inicial + 3 retentativas
    })

    it('não deve tentar novamente em erros 4xx', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      } as Response)

      let attemptCount = 0
      mockFetch.mockImplementation(() => {
        attemptCount++
        return Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({ error: 'Not found' })
        } as Response)
      })

      try {
        await fetcher.fetch('/api/test')
      } catch (error) {
        // Esperar falha
      }

      expect(attemptCount).toBe(1) // Apenas uma tentativa para erros 4xx
    })
  })

  describe('Cache System', () => {
    it('deve armazenar respostas bem-sucedidas em cache', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test', timestamp: Date.now() })
      } as Response)

      // Primeira chamada
      const result1 = await fetcher.fetch('/api/test', { useCache: true })

      // Segunda chamada deve usar cache
      const result2 = await fetcher.fetch('/api/test', { useCache: true })

      expect(result1.data).toEqual(result2.data)
      expect(mockFetch).toHaveBeenCalledTimes(1) // Apenas uma chamada real
    })

    it('deve respeitar TTL do cache', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test', timestamp: Date.now() })
      } as Response)

      // Primeira chamada
      await fetcher.fetch('/api/test', { useCache: true, cacheTTL: 100 })

      // Esperar expiração
      await new Promise(resolve => setTimeout(resolve, 150))

      // Segunda chamada deve buscar novamente
      await fetcher.fetch('/api/test', { useCache: true, cacheTTL: 100 })

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('deve invalidar cache para requisições diferentes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      } as Response)

      await fetcher.fetch('/api/test1', { useCache: true })
      await fetcher.fetch('/api/test2', { useCache: true })

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Request Deduplication', () => {
    it('deve deduplicar requisições idênticas simultâneas', async () => {
      let resolveCount = 0
      mockFetch.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolveCount++
            resolve({
              ok: true,
              json: async () => ({ data: 'test', attempt: resolveCount })
            } as Response)
          }, 100)
        })
      })

      // Disparar múltiplas requisições idênticas
      const promises = Array(5).fill(null).map(() =>
        fetcher.fetch('/api/test', { deduplicate: true })
      )

      const results = await Promise.all(promises)

      // Apenas uma chamada real deve ter sido feita
      expect(resolveCount).toBe(1)
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Todos os resultados devem ser idênticos
      results.forEach(result => {
        expect(result.data.attempt).toBe(1)
      })
    })

    it('não deve deduplicar requisições diferentes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      } as Response)

      await Promise.all([
        fetcher.fetch('/api/test1'),
        fetcher.fetch('/api/test2'),
        fetcher.fetch('/api/test3')
      ])

      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
  })

  describe('Fallback Strategies', () => {
    it('deve usar fallback quando primário falha', async () => {
      // Mock falha primária
      mockFetch.mockImplementation((url) => {
        if (url === '/api/primary') {
          return Promise.reject(new Error('Primary failed'))
        }
        if (url === '/api/fallback') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: 'fallback data', source: 'fallback' })
          } as Response)
        }
      })

      const result = await fetcher.fetch('/api/primary', {
        fallbackUrls: ['/api/fallback']
      })

      expect(result.data.source).toBe('fallback')
    })

    it('deve tentar múltiplos fallbacks em ordem', async () => {
      let callOrder = []
      mockFetch.mockImplementation((url) => {
        callOrder.push(url)
        if (url === '/api/fallback1') {
          return Promise.reject(new Error('Fallback 1 failed'))
        }
        if (url === '/api/fallback2') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: 'fallback 2 data' })
          } as Response)
        }
      })

      await fetcher.fetch('/api/primary', {
        fallbackUrls: ['/api/fallback1', '/api/fallback2']
      })

      expect(callOrder).toEqual(['/api/primary', '/api/fallback1', '/api/fallback2'])
    })

    it('deve usar fallback de dados mockados quando tudo falha', async () => {
      mockFetch.mockRejectedValue(new Error('All failed'))

      const mockData = { data: 'mock response', source: 'mock' }
      const result = await fetcher.fetch('/api/primary', {
        fallbackData: mockData
      })

      expect(result.data).toEqual(mockData)
      expect(result.isFallback).toBe(true)
    })
  })

  describe('Health Monitoring', () => {
    it('deve executar health check periodicamente', async () => {
      const healthCheckSpy = vi.spyOn(fetcher, 'performHealthCheck')

      fetcher.startHealthMonitoring(50) // 50ms interval para teste
      await new Promise(resolve => setTimeout(resolve, 200))

      expect(healthCheckSpy).toHaveBeenCalled()
      fetcher.stopHealthMonitoring()
    })

    it('deve atualizar métricas de saúde', async () => {
      // Mock resposta de saúde
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'healthy', timestamp: Date.now() })
      } as Response)

      const health = await fetcher.performHealthCheck()

      expect(health.isHealthy).toBe(true)
      expect(health.checks).toBeDefined()
      expect(health.metrics).toBeDefined()
    })

    it('deve detectar API não saudável', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      } as Response)

      const health = await fetcher.performHealthCheck()

      expect(health.isHealthy).toBe(false)
      expect(health.checks['/api/health-check'].status).toBe('fail')
    })
  })

  describe('Performance Metrics', () => {
    it('deve coletar métricas de performance', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      } as Response)

      await fetcher.fetch('/api/test')

      const metrics = fetcher.getMetrics()

      expect(metrics.totalRequests).toBe(1)
      expect(metrics.successfulRequests).toBe(1)
      expect(metrics.failedRequests).toBe(0)
      expect(metrics.averageResponseTime).toBeGreaterThan(0)
      expect(metrics.cacheHitRate).toBeDefined()
    })

    it('deve calcular corretas taxas de sucesso', async () => {
      // Mock sucesso
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'success' })
      } as Response)

      // Mock falha
      mockFetch.mockRejectedValueOnce(new Error('Failed'))

      await fetcher.fetch('/api/success')
      try {
        await fetcher.fetch('/api/fail')
      } catch (error) {
        // Ignorar
      }

      const metrics = fetcher.getMetrics()

      expect(metrics.totalRequests).toBe(2)
      expect(metrics.successfulRequests).toBe(1)
      expect(metrics.failedRequests).toBe(1)
      expect(metrics.successRate).toBe(0.5)
    })
  })

  describe('Integration Tests', () => {
    it('deve handle cenário completo de falha e recuperação', async () => {
      let shouldFail = true
      let attemptCount = 0

      mockFetch.mockImplementation(() => {
        attemptCount++
        if (shouldFail) {
          return Promise.reject(new Error('Network failure'))
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: 'recovered', attempt: attemptCount })
        } as Response)
      })

      // Primeira tentativa deve falhar
      try {
        await fetcher.fetch('/api/test', { maxRetries: 2 })
      } catch (error) {
        // Esperar falha
      }

      expect(attemptCount).toBeGreaterThan(1) // Deve ter tentado novamente

      // Recuperar
      shouldFail = false
      attemptCount = 0

      const result = await fetcher.fetch('/api/test', { maxRetries: 2 })

      expect(result.data.recovered).toBe(true)
      expect(result.success).toBe(true)
    })

    it('deve manter performance sob alta carga', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      } as Response)

      const startTime = Date.now()
      const promises = Array(100).fill(null).map((_, i) =>
        fetcher.fetch(`/api/test/${i}`, { useCache: true })
      )

      await Promise.all(promises)
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(5000) // Deve completar em < 5s

      const metrics = fetcher.getMetrics()
      expect(metrics.totalRequests).toBe(100)
      expect(metrics.successRate).toBe(1)
    })
  })
})