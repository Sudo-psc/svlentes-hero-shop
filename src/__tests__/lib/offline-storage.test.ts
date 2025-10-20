/**
 * Tests para OfflineStorage
 * Testa IndexedDB, localStorage fallback, sincronização
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { OfflineStorage } from '@/lib/offline-storage'

// Mock do IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
}

const mockDB = {
  close: vi.fn(),
  transaction: vi.fn(() => mockTransaction),
  createObjectStore: vi.fn(),
  objectStore: vi.fn(() => mockObjectStore)
}

const mockTransaction = {
  objectStore: vi.fn(() => mockObjectStore),
  oncomplete: null as any,
  onerror: null as any
}

const mockObjectStore = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  getAll: vi.fn(),
  clear: vi.fn(),
  openCursor: vi.fn()
}

const mockRequest = {
  result: mockDB,
  onsuccess: null as any,
  onerror: null as any
}

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB
})

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('OfflineStorage', () => {
  let storage: OfflineStorage

  beforeEach(() => {
    vi.clearAllMocks()
    storage = new OfflineStorage()

    // Setup padrão para IndexedDB mock
    mockIndexedDB.open.mockReturnValue(mockRequest)
    mockObjectStore.get.mockReturnValue({ result: null, onsuccess: null, onerror: null })
    mockObjectStore.put.mockReturnValue({ result: null, onsuccess: null, onerror: null })
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(async () => {
    await storage.destroy()
  })

  describe('Initialization', () => {
    it('deve inicializar com IndexedDB quando disponível', async () => {
      const request = {
        result: mockDB,
        onsuccess: null as any,
        onerror: null as any
      }
      mockIndexedDB.open.mockReturnValue(request)

      const initPromise = storage.init()

      // Simular sucesso na abertura do banco
      request.onsuccess?.({ target: request } as any)

      await initPromise

      expect(mockIndexedDB.open).toHaveBeenCalledWith('svlentes_offline_storage', 1)
      expect(storage.isIndexedDBAvailable()).toBe(true)
    })

    it('deve fallback para localStorage quando IndexedDB falhar', async () => {
      const request = {
        result: null,
        onsuccess: null as any,
        onerror: null as any
      }
      mockIndexedDB.open.mockReturnValue(request)

      const initPromise = storage.init()

      // Simular falha na abertura do banco
      request.onerror?.({ target: request } as any)

      await initPromise

      expect(storage.isLocalStorageAvailable()).toBe(true)
      expect(storage.isIndexedDBAvailable()).toBe(false)
    })

    it('deve detectar quando nenhum storage está disponível', async () => {
      // Mock falha em ambos
      mockIndexedDB.open.mockImplementation(() => {
        throw new Error('IndexedDB not available')
      })

      Object.defineProperty(window, 'localStorage', {
        value: {
          setItem: () => { throw new Error('localStorage not available') }
        },
        configurable: true
      })

      const initPromise = storage.init()
      await initPromise

      expect(storage.isAnyStorageAvailable()).toBe(false)
    })
  })

  describe('Storage Operations - IndexedDB', () => {
    beforeEach(async () => {
      // Setup IndexedDB disponível
      const request = { result: mockDB, onsuccess: null, onerror: null }
      mockIndexedDB.open.mockReturnValue(request)
      mockObjectStore.get.mockReturnValue({ result: null, onsuccess: null, onerror: null })

      const initPromise = storage.init()
      request.onsuccess?.({ target: request } as any)
      await initPromise
    })

    it('deve armazenar e recuperar dados', async () => {
      const testData = { id: 'test', value: 'data', timestamp: Date.now() }

      // Mock armazenamento bem-sucedido
      const putRequest = { result: testData, onsuccess: null, onerror: null }
      mockObjectStore.put.mockReturnValue(putRequest)

      await storage.set('test', testData)

      // Mock recuperação bem-sucedida
      const getRequest = { result: testData, onsuccess: null, onerror: null }
      mockObjectStore.get.mockReturnValue(getRequest)

      const retrieved = await storage.get('test')

      expect(retrieved).toEqual(testData)
      expect(mockObjectStore.put).toHaveBeenCalledWith(testData, 'test')
      expect(mockObjectStore.get).toHaveBeenCalledWith('test')
    })

    it('deve validar dados com Zod schema', async () => {
      const testData = { id: 'test', value: 'data' }
      const schema = { parse: vi.fn().mockReturnValue(testData) }

      const putRequest = { result: testData, onsuccess: null, onerror: null }
      mockObjectStore.put.mockReturnValue(putRequest)

      await storage.set('test', testData, { schema })

      expect(schema.parse).toHaveBeenCalledWith(testData)
    })

    it('deve rejeitar dados inválidos', async () => {
      const testData = { invalid: 'data' }
      const schema = {
        parse: vi.fn().mockImplementation(() => {
          throw new Error('Validation failed')
        })
      }

      await expect(storage.set('test', testData, { schema })).rejects.toThrow('Validation failed')
    })

    it('deve lidar com expiração de dados', async () => {
      const testData = { id: 'test', value: 'data' }
      const expiredData = {
        data: testData,
        expiresAt: Date.now() - 1000 // Expirado
      }

      const getRequest = { result: expiredData, onsuccess: null, onerror: null }
      mockObjectStore.get.mockReturnValue(getRequest)

      const result = await storage.get('test')

      expect(result).toBeNull()
    })

    it('deve remover dados expirados automaticamente', async () => {
      const expiredData = {
        data: { id: 'test', value: 'data' },
        expiresAt: Date.now() - 1000
      }

      // Mock getAll retornando dados expirados
      const getAllRequest = {
        result: [expiredData],
        onsuccess: null,
        onerror: null
      }
      mockObjectStore.getAll.mockReturnValue(getAllRequest)

      const deleteRequest = { result: null, onsuccess: null, onerror: null }
      mockObjectStore.delete.mockReturnValue(deleteRequest)

      const cleaned = await storage.cleanup()

      expect(cleaned).toBe(1)
      expect(mockObjectStore.delete).toHaveBeenCalledWith('test')
    })

    it('deve listar todas as chaves', async () => {
      const keys = ['key1', 'key2', 'key3']
      const cursorRequest = {
        result: {
          key: 'test',
          continue: vi.fn()
        },
        onsuccess: null,
        onerror: null
      }
      mockObjectStore.openCursor.mockReturnValue(cursorRequest)

      const result = await storage.keys()

      expect(mockObjectStore.openCursor).toHaveBeenCalled()
    })
  })

  describe('Storage Operations - LocalStorage Fallback', () => {
    beforeEach(async () => {
      // Setup localStorage fallback
      mockIndexedDB.open.mockImplementation(() => {
        throw new Error('IndexedDB not available')
      })

      localStorageMock.setItem.mockImplementation((key, value) => {
        // Simular localStorage funcional
        return undefined
      })

      localStorageMock.getItem.mockImplementation((key) => {
        return JSON.stringify({ data: { id: key, value: 'test' }, expiresAt: Date.now() + 10000 })
      })

      await storage.init()
    })

    it('deve armazenar dados em localStorage', async () => {
      const testData = { id: 'test', value: 'data' }

      await storage.set('test', testData)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'svlentes_test',
        expect.stringContaining('"data"')
      )
    })

    it('deve recuperar dados do localStorage', async () => {
      const testData = { id: 'test', value: 'data' }
      const storedData = {
        data: testData,
        expiresAt: Date.now() + 10000,
        timestamp: Date.now()
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData))

      const result = await storage.get('test')

      expect(result).toEqual(testData)
    })

    it('deve lidar com JSON inválido no localStorage', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      const result = await storage.get('test')

      expect(result).toBeNull()
    })

    it('deve remover dados do localStorage', async () => {
      await storage.remove('test')

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('svlentes_test')
    })

    it('deve limpar todos os dados do localStorage', async () => {
      localStorageMock.length = 3
      localStorageMock.key = vi.fn((index) => {
        const keys = ['svlentes_test1', 'svlentes_test2', 'svlentes_other']
        return keys[index]
      })

      await storage.clear()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('svlentes_test1')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('svlentes_test2')
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('svlentes_other')
    })
  })

  describe('Synchronization', () => {
    beforeEach(async () => {
      // Setup inicial
      const request = { result: mockDB, onsuccess: null, onerror: null }
      mockIndexedDB.open.mockReturnValue(request)
      const initPromise = storage.init()
      request.onsuccess?.({ target: request } as any)
      await initPromise
    })

    it('deve sincronizar mudanças pendentes', async () => {
      const pendingChanges = [
        { key: 'test1', data: { value: 'data1' }, timestamp: Date.now() },
        { key: 'test2', data: { value: 'data2' }, timestamp: Date.now() }
      ]

      // Mock sincronização bem-sucedida
      const putRequest = { result: null, onsuccess: null, onerror: null }
      mockObjectStore.put.mockReturnValue(putRequest)

      const result = await storage.sync(pendingChanges)

      expect(result.successful).toBe(2)
      expect(result.failed).toBe(0)
      expect(mockObjectStore.put).toHaveBeenCalledTimes(2)
    })

    it('deve lidar com falhas parciais na sincronização', async () => {
      const pendingChanges = [
        { key: 'test1', data: { value: 'data1' }, timestamp: Date.now() },
        { key: 'test2', data: { value: 'data2' }, timestamp: Date.now() }
      ]

      // Mock falha na segunda mudança
      mockObjectStore.put
        .mockReturnValueOnce({ result: null, onsuccess: null, onerror: null })
        .mockReturnValueOnce({
          result: null,
          onsuccess: null,
          onerror: new Error('Sync failed')
        })

      const result = await storage.sync(pendingChanges)

      expect(result.successful).toBe(1)
      expect(result.failed).toBe(1)
      expect(result.errors).toHaveLength(1)
    })

    it('deve gerar ID único para cada item', async () => {
      const testData = { value: 'test' }

      const putRequest = { result: null, onsuccess: null, onerror: null }
      mockObjectStore.put.mockReturnValue(putRequest)

      await storage.set('test', testData)

      const data = await storage.get('test')
      expect(data).toHaveProperty('id')
      expect(typeof data.id).toBe('string')
      expect(data.id.length).toBeGreaterThan(0)
    })
  })

  describe('Performance Metrics', () => {
    beforeEach(async () => {
      const request = { result: mockDB, onsuccess: null, onerror: null }
      mockIndexedDB.open.mockReturnValue(request)
      const initPromise = storage.init()
      request.onsuccess?.({ target: request } as any)
      await initPromise
    })

    it('deve coletar métricas de operações', async () => {
      const testData = { value: 'test' }

      // Mock operações
      const putRequest = { result: null, onsuccess: null, onerror: null }
      const getRequest = { result: testData, onsuccess: null, onerror: null }
      mockObjectStore.put.mockReturnValue(putRequest)
      mockObjectStore.get.mockReturnValue(getRequest)

      await storage.set('test', testData)
      await storage.get('test')

      const metrics = storage.getMetrics()

      expect(metrics.totalOperations).toBe(2)
      expect(metrics.successfulOperations).toBe(2)
      expect(metrics.failedOperations).toBe(0)
      expect(metrics.averageOperationTime).toBeGreaterThan(0)
    })

    it('deve calcular espaço de armazenamento utilizado', async () => {
      const testData = { value: 'test' }
      const putRequest = { result: null, onsuccess: null, onerror: null }
      mockObjectStore.put.mockReturnValue(putRequest)

      await storage.set('test', testData)

      const usage = storage.getStorageUsage()

      expect(usage.totalSize).toBeGreaterThan(0)
      expect(usage.itemCount).toBe(1)
      expect(usage.availableSpace).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('deve lidar com quota exceeded error', async () => {
      const testData = { value: 'x'.repeat(1000000) } // Dados grandes

      // Mock quota exceeded
      const putRequest = {
        result: null,
        onsuccess: null,
        onerror: new DOMException('Quota exceeded', 'QuotaExceededError')
      }
      mockObjectStore.put.mockReturnValue(putRequest)

      await expect(storage.set('test', testData)).rejects.toThrow('Storage quota exceeded')
    })

    it('deve lidar com storage não disponível', async () => {
      // Desabilitar ambos os storages
      mockIndexedDB.open.mockImplementation(() => {
        throw new Error('IndexedDB disabled')
      })

      Object.defineProperty(window, 'localStorage', {
        value: {
          setItem: () => { throw new Error('localStorage disabled') }
        },
        configurable: true
      })

      await storage.init()

      await expect(storage.set('test', {})).rejects.toThrow('No storage available')
    })

    it('deve fornecer fallback gracefully degradant', async () => {
      // IndexedDB falha durante operação
      const request = { result: mockDB, onsuccess: null, onerror: null }
      mockIndexedDB.open.mockReturnValue(request)

      const initPromise = storage.init()
      request.onsuccess?.({ target: request } as any)
      await initPromise

      // Mock falha durante put
      mockObjectStore.put.mockImplementation(() => {
        throw new Error('Transaction failed')
      })

      // Forçar fallback para localStorage
      localStorageMock.setItem.mockReturnValue(undefined)

      const testData = { value: 'test' }

      // Não deve lançar erro, deve usar fallback
      await expect(storage.set('test', testData)).resolves.not.toThrow()
    })
  })

  describe('Integration Tests', () => {
    it('deve handle ciclo completo de dados offline/online', async () => {
      // Setup inicial online
      const request = { result: mockDB, onsuccess: null, onerror: null }
      mockIndexedDB.open.mockReturnValue(request)
      const initPromise = storage.init()
      request.onsuccess?.({ target: request } as any)
      await initPromise

      // Salvar dados online
      const onlineData = { id: 'user123', profile: 'test' }
      const putRequest = { result: null, onsuccess: null, onerror: null }
      mockObjectStore.put.mockReturnValue(putRequest)

      await storage.set('userProfile', onlineData)

      // Simular modo offline - IndexedDB indisponível
      mockIndexedDB.open.mockImplementation(() => {
        throw new Error('Offline mode')
      })

      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        data: onlineData,
        expiresAt: Date.now() + 10000,
        timestamp: Date.now()
      }))

      // Recriar storage em modo offline
      const offlineStorage = new OfflineStorage()
      await offlineStorage.init()

      // Recuperar dados em modo offline
      const retrievedData = await offlineStorage.get('userProfile')
      expect(retrievedData).toEqual(onlineData)

      // Simular retorno online
      await offlineStorage.destroy()
    })

    it('deve manter consistência entre múltiplas instâncias', async () => {
      // Setup storage 1
      const storage1 = new OfflineStorage()
      const request1 = { result: mockDB, onsuccess: null, onerror: null }
      mockIndexedDB.open.mockReturnValue(request1)
      const init1Promise = storage1.init()
      request1.onsuccess?.({ target: request1 } as any)
      await init1Promise

      // Setup storage 2
      const storage2 = new OfflineStorage()
      const request2 = { result: mockDB, onsuccess: null, onerror: null }
      mockIndexedDB.open.mockReturnValue(request2)
      const init2Promise = storage2.init()
      request2.onsuccess?.({ target: request2 } as any)
      await init2Promise

      // Salvar em storage1
      const testData = { shared: 'data', timestamp: Date.now() }
      const putRequest = { result: null, onsuccess: null, onerror: null }
      mockObjectStore.put.mockReturnValue(putRequest)

      await storage1.set('shared', testData)

      // Recuperar em storage2
      const getRequest = { result: testData, onsuccess: null, onerror: null }
      mockObjectStore.get.mockReturnValue(getRequest)

      const retrievedData = await storage2.get('shared')
      expect(retrievedData).toEqual(testData)

      await storage1.destroy()
      await storage2.destroy()
    })
  })
})