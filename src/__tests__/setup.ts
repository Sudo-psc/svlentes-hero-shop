/**
 * Configuração global para testes
 * Setup de mocks, polyfills, e ambiente de teste
 */

import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Limpar DOM após cada teste
afterEach(() => {
  cleanup()
})

// Setup de polyfills necessários
beforeAll(() => {
  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  })

  // Mock getComputedStyle
  Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
      getPropertyValue: () => '',
      zIndex: '0'
    })
  })

  // Mock scrollTo
  Object.defineProperty(window, 'scrollTo', {
    value: vi.fn()
  })

  // Mock fetch global
  global.fetch = vi.fn()

  // Mock localStorage
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

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  }
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
  })

  // Mock IndexedDB
  const mockIndexedDB = {
    open: vi.fn(),
    deleteDatabase: vi.fn(),
    cmp: vi.fn()
  }
  Object.defineProperty(window, 'indexedDB', {
    value: mockIndexedDB
  })

  // Mock WebSocket
  global.WebSocket = vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  }))

  // Mock Notification
  global.Notification = vi.fn().mockImplementation(() => ({
    requestPermission: vi.fn().mockResolvedValue('granted'),
    close: vi.fn()
  })) as any

  // Mock navigator online/offline
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true
  })

  // Mock performance API
  Object.defineProperty(window, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => []),
      getEntriesByName: vi.fn(() => []),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
      memory: {
        usedJSHeapSize: 1024 * 1024 * 10,
        totalJSHeapSize: 1024 * 1024 * 20,
        jsHeapSizeLimit: 1024 * 1024 * 100
      }
    }
  })

  // Mock crypto API
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36)),
      getRandomValues: vi.fn((arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256)
        }
        return arr
      })
    }
  })

  // Mock URL.createObjectURL
  Object.defineProperty(URL, 'createObjectURL', {
    value: vi.fn(() => 'mock-object-url')
  })

  Object.defineProperty(URL, 'revokeObjectURL', {
    value: vi.fn()
  })

  // Mock console methods para reduzir ruído nos testes
  const originalConsole = { ...console }
  global.console = {
    ...originalConsole,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }

  // Restaurar console após os testes
  afterAll(() => {
    global.console = originalConsole
  })
})

// Setup de ambiente específico para testes de resiliência
export const setupResilienceTestEnvironment = () => {
  beforeAll(() => {
    // Mock de eventos online/offline
    vi.stubGlobal('addEventListener', vi.fn())
    vi.stubGlobal('removeEventListener', vi.fn())

    // Mock de StorageEvent para sincronização entre abas
    vi.stubGlobal('StorageEvent', vi.fn().mockImplementation((type, eventInitDict) => ({
      type,
      key: eventInitDict?.key,
      oldValue: eventInitDict?.oldValue,
      newValue: eventInitDict?.newValue,
      storageArea: eventInitDict?.storageArea,
      url: eventInitDict?.url
    })))

    // Mock de BroadcastChannel para comunicação entre contextos
    global.BroadcastChannel = vi.fn().mockImplementation(() => ({
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn()
    })) as any

    // Mock de navigator.connection para informações de rede
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }
    })

    // Mock de navigator.serviceWorker para PWA capabilities
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: {
        register: vi.fn().mockResolvedValue({
          installing: null,
          waiting: null,
          active: null
        }),
        ready: Promise.resolve({
          addEventListener: vi.fn()
        })
      }
    })
  })
}

// Helper para simular diferentes condições de rede
export const mockNetworkConditions = {
  online: () => {
    Object.defineProperty(navigator, 'onLine', { value: true })
    window.dispatchEvent(new Event('online'))
  },

  offline: () => {
    Object.defineProperty(navigator, 'onLine', { value: false })
    window.dispatchEvent(new Event('offline'))
  },

  slowConnection: () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '2g',
        downlink: 0.1,
        rtt: 800,
        saveData: true
      }
    })
  },

  fastConnection: () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '4g',
        downlink: 50,
        rtt: 20,
        saveData: false
      }
    })
  }
}

// Helper para simular diferentes condições de storage
export const mockStorageConditions = {
  availableLocalStorage: () => {
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  },

  unavailableLocalStorage: () => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem: () => { throw new Error('localStorage disabled') },
        getItem: () => { throw new Error('localStorage disabled') },
        removeItem: () => { throw new Error('localStorage disabled') },
        clear: () => { throw new Error('localStorage disabled') }
      }
    })
  },

  quotaExceeded: () => {
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
  },

  availableIndexedDB: () => {
    const mockDB = {
      close: vi.fn(),
      transaction: vi.fn(),
      createObjectStore: vi.fn(),
      objectStore: vi.fn()
    }

    const mockRequest = {
      result: mockDB,
      onsuccess: null,
      onerror: null
    }

    Object.defineProperty(window, 'indexedDB', {
      value: {
        open: vi.fn(() => mockRequest),
        deleteDatabase: vi.fn()
      }
    })
  },

  unavailableIndexedDB: () => {
    Object.defineProperty(window, 'indexedDB', {
      value: {
        open: () => {
          throw new Error('IndexedDB disabled')
        }
      }
    })
  }
}

// Helper para simular diferentes condições de performance
export const mockPerformanceConditions = {
  highPerformance: () => {
    Object.defineProperty(window, 'performance', {
      value: {
        ...window.performance,
        now: () => Date.now(),
        memory: {
          usedJSHeapSize: 1024 * 1024 * 5, // 5MB
          totalJSHeapSize: 1024 * 1024 * 10, // 10MB
          jsHeapSizeLimit: 1024 * 1024 * 100 // 100MB
        }
      }
    })
  },

  lowMemory: () => {
    Object.defineProperty(window, 'performance', {
      value: {
        ...window.performance,
        memory: {
          usedJSHeapSize: 1024 * 1024 * 80, // 80MB
          totalJSHeapSize: 1024 * 1024 * 90, // 90MB
          jsHeapSizeLimit: 1024 * 1024 * 100 // 100MB
        }
      }
    })
  },

  slowDevice: () => {
    Object.defineProperty(window, 'performance', {
      value: {
        ...window.performance,
        now: () => {
          // Simular device lento
          return Date.now() + Math.random() * 100
        }
      }
    })
  }
}

// Configuração padrão para testes de resiliência
setupResilienceTestEnvironment()