/**
 * Helpers e utilitários para testes
 * Funções para simular cenários, renderizar componentes, etc.
 */

import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { ThemeProvider } from 'next-themes'
import { vi } from 'vitest'

// Mock providers
const AllTheProviders = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider attribute="class" defaultTheme="light">
          <ConfigProvider>
            {children}
          </ConfigProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Re-export everything from Testing Library
export * from '@testing-library/react'
export { customRender as render }

// Helper para simular diferentes cenários de rede
export const mockNetworkScenario = async (scenario: 'online' | 'offline' | 'slow' | 'unstable') => {
  switch (scenario) {
    case 'online':
      Object.defineProperty(navigator, 'onLine', { value: true })
      window.dispatchEvent(new Event('online'))
      break

    case 'offline':
      Object.defineProperty(navigator, 'onLine', { value: false })
      window.dispatchEvent(new Event('offline'))
      break

    case 'slow':
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '2g',
          downlink: 0.1,
          rtt: 800,
          saveData: true
        }
      })
      break

    case 'unstable':
      let isOnline = true
      const interval = setInterval(() => {
        isOnline = !isOnline
        Object.defineProperty(navigator, 'onLine', { value: isOnline })
        window.dispatchEvent(new Event(isOnline ? 'online' : 'offline'))
      }, 1000)

      // Retornar função para limpar
      return () => clearInterval(interval)
  }
}

// Helper para simular diferentes cenários de storage
export const mockStorageScenario = (scenario: 'available' | 'full' | 'unavailable' | 'corrupted') => {
  switch (scenario) {
    case 'available':
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(),
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
          length: 0,
          key: vi.fn()
        }
      })
      break

    case 'full':
      Object.defineProperty(window, 'localStorage', {
        value: {
          setItem: () => {
            const error = new Error('Quota exceeded')
            error.name = 'QuotaExceededError'
            throw error
          },
          getItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn()
        }
      })
      break

    case 'unavailable':
      Object.defineProperty(window, 'localStorage', {
        value: {
          setItem: () => { throw new Error('localStorage disabled') },
          getItem: () => { throw new Error('localStorage disabled') },
          removeItem: () => { throw new Error('localStorage disabled') }
        }
      })
      break

    case 'corrupted':
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => 'invalid json {',
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn()
        }
      })
      break
  }
}

// Helper para simular diferentes cenários de API
export const mockAPIScenario = (scenario: 'success' | 'error' | 'timeout' | 'intermittent') => {
  const mockFetch = vi.fn()

  switch (scenario) {
    case 'success':
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: 'test data' })
      })
      break

    case 'error':
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' })
      })
      break

    case 'timeout':
      mockFetch.mockImplementation(() => new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      }))
      break

    case 'intermittent':
      let callCount = 0
      mockFetch.mockImplementation(() => {
        callCount++
        if (callCount % 2 === 0) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: 'test data' })
          })
        } else {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Intermittent failure' })
          })
        }
      })
      break
  }

  global.fetch = mockFetch
  return mockFetch
}

// Helper para esperar por condições específicas
export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  options?: { timeout?: number; interval?: number }
): Promise<void> => {
  const { timeout = 5000, interval = 100 } = options || {}
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  throw new Error(`Condition not met within ${timeout}ms`)
}

// Helper para simular passagem de tempo
export const mockTime = (milliseconds: number) => {
  vi.useFakeTimers()
  vi.advanceTimersByTime(milliseconds)
}

// Helper para resetar mocks de tempo
export const resetTime = () => {
  vi.useRealTimers()
}

// Helper para criar mock de IndexedDB
export const createMockIndexedDB = () => {
  const mockDB = {
    close: vi.fn(),
    transaction: vi.fn(() => ({
      objectStore: vi.fn(() => ({
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        getAll: vi.fn(),
        clear: vi.fn(),
        openCursor: vi.fn()
      }))
    })),
    createObjectStore: vi.fn(),
    objectStore: vi.fn()
  }

  const mockRequest = {
    result: mockDB,
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null
  }

  const mockIndexedDB = {
    open: vi.fn(() => mockRequest),
    deleteDatabase: vi.fn()
  }

  Object.defineProperty(window, 'indexedDB', { value: mockIndexedDB })

  return { mockDB, mockRequest, mockIndexedDB }
}

// Helper para criar mock de WebSocket
export const createMockWebSocket = () => {
  const mockWebSocket = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  }

  global.WebSocket = vi.fn(() => mockWebSocket) as any

  return mockWebSocket
}

// Helper para simular eventos do navegador
export const dispatchBrowserEvent = (eventType: string, detail?: any) => {
  const event = new CustomEvent(eventType, { detail })
  window.dispatchEvent(event)
}

// Helper para simular eventos de storage
export const dispatchStorageEvent = (key: string, newValue: string, oldValue?: string) => {
  const event = new StorageEvent('storage', {
    key,
    newValue,
    oldValue,
    storageArea: localStorage,
    url: window.location.href
  })
  window.dispatchEvent(event)
}

// Helper para criar dados de teste consistentes
export const createTestSubscriptionData = (overrides = {}) => ({
  id: 'sub_123',
  status: 'active',
  plan: {
    id: 'plan_premium',
    name: 'Plano Premium',
    price: 199.90,
    lensesPerMonth: 6,
    features: [
      'Lentes de qualidade premium',
      'Consulta mensal inclusa',
      'Delivery grátis',
      'Suporte prioritário'
    ]
  },
  user: {
    id: 'user_123',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '+5533999898026'
  },
  nextDelivery: {
    date: '2024-01-15',
    status: 'scheduled',
    tracking: null
  },
  payments: {
    nextPayment: '2024-02-01',
    amount: 199.90,
    method: 'credit_card',
    status: 'pending'
  },
  usage: {
    lensesDelivered: 24,
    lensesUsed: 18,
    averageUsage: 4.5
  },
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
})

// Helper para criar dados de saúde do sistema
export const createTestHealthData = (status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy') => {
  const baseData = {
    timestamp: Date.now(),
    checks: [],
    metrics: {
      memoryUsage: 0.5,
      storageQuota: 1073741824,
      storageUsage: 52428800,
      activeConnections: 2,
      cacheHitRate: 0.8,
      errorRate: 0.02,
      averageResponseTime: 120,
      uptime: 86400000
    }
  }

  switch (status) {
    case 'healthy':
      return {
        status: 'healthy' as const,
        ...baseData,
        checks: [
          {
            name: '/api/health-check',
            status: 'pass' as const,
            message: 'API responding normally',
            responseTime: 45,
            lastChecked: new Date()
          }
        ]
      }

    case 'degraded':
      return {
        status: 'degraded' as const,
        ...baseData,
        checks: [
          {
            name: '/api/health-check',
            status: 'warn' as const,
            message: 'Slow response time',
            responseTime: 2000,
            lastChecked: new Date()
          }
        ]
      }

    case 'unhealthy':
      return {
        status: 'unhealthy' as const,
        ...baseData,
        checks: [
          {
            name: '/api/health-check',
            status: 'fail' as const,
            message: 'Connection timeout',
            responseTime: 5000,
            lastChecked: new Date()
          }
        ]
      }
  }
}

// Helper para testar componentes assíncronos
export const renderAsync = async (
  ui: ReactElement,
  options?: RenderOptions
): Promise<RenderResult> => {
  const result = customRender(ui, options)

  // Esperar por qualquer atualização assíncrona inicial
  await new Promise(resolve => setTimeout(resolve, 0))

  return result
}

// Helper para testar componentes com error boundaries
export const expectErrorBoundary = (component: ReactElement) => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  const result = customRender(component)

  return {
    ...result,
    cleanup: () => {
      result.unmount()
      consoleSpy.mockRestore()
    }
  }
}

// Exportar todos os helpers
export {
  AllTheProviders,
  customRender as render
}