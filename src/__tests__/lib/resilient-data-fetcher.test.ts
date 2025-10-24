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
        await fetcher.fetch({ url: '/api/test' })
      }

      // Tentativa adicional deve falhar com circuit breaker
      const result = await fetcher.fetch({ url: '/api/test' })
      expect(result.status).toBe('error')
      expect(result.error).toContain('Circuit breaker')
    })

    it('deve fechar circuito após recovery timeout', async () => {
      // Mock falha para abrir circuito
      mockFetch.mockRejectedValue(new Error('Network error'))

      // Abrir circuito
      for (let i = 0; i < 5; i++) {
        await fetcher.fetch({ url: '/api/test' })
      }

      // Verificar que está aberto
      const failResult = await fetcher.fetch({ url: '/api/test' })
      expect(failResult.status).toBe('error')

      // Mock sucesso
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      // Esperar recovery timeout (reduzido para teste)
      await new Promise(resolve => setTimeout(resolve, 100))

      // Tentar novamente - deve permitir uma chamada de teste
      const result = await fetcher.fetch({ url: '/api/test' })
      expect(result.data?.success).toBe(true)
    })

    it('deve resetar circuito após chamada bem-sucedida', async () => {
      // Mock falha para abrir circuito
      mockFetch.mockRejectedValue(new Error('Network error'))

      // Abrir circuito
      for (let i = 0; i < 5; i++) {
        await fetcher.fetch({ url: '/api/test' })
      }

      // Mock sucesso
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      // Esperar recovery e tentar
      await new Promise(resolve => setTimeout(resolve, 100))
      await fetcher.fetch({ url: '/api/test' })

      // Circuit breaker deve estar fechado agora
      const result = await fetcher.fetch({ url: '/api/test' })
      expect(result.data?.success).toBe(true)
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

      const result = await fetcher.fetch({ url: '/api/test' })

      expect(attemptCount).toBe(3)
      expect(result.data?.success).toBe(true)
    })

    it('deve aplicar exponential backoff', async () => {
      const startTime = Date.now()
      let attemptCount = 0

      mockFetch.mockImplementation(() => {
        attemptCount++
        return Promise.reject(new Error('Always fails'))
      })

      await fetcher.fetch({ url: '/api/test' })

      const endTime = Date.now()
      const duration = endTime - startTime

      // Deve ter demorado pelo menos o tempo de backoff acumulado
      expect(duration).toBeGreaterThan(1000) // 100ms + 200ms + 400ms + 800ms
      expect(attemptCount).toBe(4) // Tentativa inicial + 3 retentativas
    })

    it('não deve tentar novamente em erros 4xx', async () => {
      let attemptCount = 0
      mockFetch.mockImplementation(() => {
        attemptCount++
        return Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({ error: 'Not found' })
        } as Response)
      })

      await fetcher.fetch({ url: '/api/test' })

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
      const result1 = await fetcher.fetch({ url: '/api/test', cacheStrategy: 'memory' })

      // Segunda chamada deve usar cache
      const result2 = await fetcher.fetch({ url: '/api/test', cacheStrategy: 'memory' })

      expect(result1.data).toEqual(result2.data)
      expect(mockFetch).toHaveBeenCalledTimes(1) // Apenas uma chamada real
    })

    it('deve respeitar TTL do cache', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test', timestamp: Date.now() })
      } as Response)

      // Primeira chamada
      await fetcher.fetch({ url: '/api/test', cacheStrategy: 'memory', cacheTTL: 100 })

      // Esperar expiração
      await new Promise(resolve => setTimeout(resolve, 150))

      // Segunda chamada deve buscar novamente
      await fetcher.fetch({ url: '/api/test', cacheStrategy: 'memory', cacheTTL: 100 })

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('deve invalidar cache para requisições diferentes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      } as Response)

      await fetcher.fetch({ url: '/api/test1', cacheStrategy: 'memory' })
      await fetcher.fetch({ url: '/api/test2', cacheStrategy: 'memory' })

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
        fetcher.fetch({ url: '/api/test' })
      )

      const results = await Promise.all(promises)

      // Devido à deduplicação, apenas uma chamada real deve ter sido feita
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
        fetcher.fetch({ url: '/api/test1' }),
        fetcher.fetch({ url: '/api/test2' }),
        fetcher.fetch({ url: '/api/test3' })
      ])

      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
  })

  describe('Fallback Strategies', () => {
    it('deve usar fallback quando primário falha', async () => {
      // Mock falha primária, mas fallbackData disponível
      mockFetch.mockRejectedValue(new Error('Primary failed'))

      const fallbackData = { data: 'fallback data', source: 'fallback' }
      const result = await fetcher.fetch({
        url: '/api/primary',
        fallbackData
      })

      expect(result.status).toBe('fallback')
      expect(result.data).toEqual(fallbackData)
    })

    it('deve usar fallback de dados mockados quando tudo falha', async () => {
      mockFetch.mockRejectedValue(new Error('All failed'))

      const mockData = { data: 'mock response', source: 'mock' }
      const result = await fetcher.fetch({
        url: '/api/primary',
        fallbackData: mockData
      })

      expect(result.data).toEqual(mockData)
      expect(result.status).toBe('fallback')
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

      const health = await fetcher.performHealthCheck('/api/health-check')

      expect(health.healthy).toBe(true)
      expect(health.endpoint).toBe('/api/health-check')
      expect(health.responseTime).toBeDefined()
    })

    it('deve detectar API não saudável', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      } as Response)

      const health = await fetcher.performHealthCheck('/api/health-check')

      expect(health.healthy).toBe(false)
      expect(health.endpoint).toBe('/api/health-check')
    })
  })

  describe('Performance Metrics', () => {
    it('deve coletar métricas de performance', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      } as Response)

      await fetcher.fetch({ url: '/api/test' })

      const metrics = fetcher.getMetrics()

      expect(metrics.totalRequests).toBe(1)
      expect(metrics.successfulRequests).toBe(1)
      expect(metrics.failedRequests).toBe(0)
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0)
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

      await fetcher.fetch({ url: '/api/success' })
      await fetcher.fetch({ url: '/api/fail' })

      const metrics = fetcher.getMetrics()

      expect(metrics.totalRequests).toBeGreaterThanOrEqual(2)
      expect(metrics.successfulRequests).toBeGreaterThanOrEqual(1)
      expect(metrics.failedRequests).toBeGreaterThanOrEqual(1)
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
      await fetcher.fetch({ url: '/api/test', retries: 2 })

      expect(attemptCount).toBeGreaterThan(1) // Deve ter tentado novamente

      // Recuperar
      shouldFail = false
      attemptCount = 0

      const result = await fetcher.fetch({ url: '/api/test', retries: 2 })

      expect(result.data.recovered).toBeDefined()
      expect(result.status).toBe('success')
    })

    it('deve manter performance sob alta carga', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      } as Response)

      const startTime = Date.now()
      const promises = Array(100).fill(null).map((_, i) =>
        fetcher.fetch({ url: `/api/test/${i}`, cacheStrategy: 'memory' })
      )

      await Promise.all(promises)
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(5000) // Deve completar em < 5s

      const metrics = fetcher.getMetrics()
      expect(metrics.totalRequests).toBe(100)
    })
  })
})
