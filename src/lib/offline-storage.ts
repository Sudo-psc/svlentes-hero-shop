/**
 * Offline Storage Manager
 * Sistema de armazenamento offline com IndexedDB e localStorage fallback
 */
import { z } from 'zod'
// Schema para validação de dados offline
const OfflineDataSchema = z.object({
  id: z.string(),
  data: z.any(),
  timestamp: z.number(),
  expiresAt: z.number().optional(),
  version: z.string().default('1.0'),
  tags: z.array(z.string()).optional()
})
export type OfflineData = z.infer<typeof OfflineDataSchema>
export interface StorageConfig {
  dbName?: string
  storeName?: string
  version?: number
  enableLocalStorageFallback?: boolean
  defaultTTL?: number // em milissegundos
}
class OfflineStorage {
  private db: IDBDatabase | null = null
  private isInitialized = false
  private config: Required<StorageConfig>
  constructor(config: StorageConfig = {}) {
    this.config = {
      dbName: config.dbName || 'svlentes-offline',
      storeName: config.storeName || 'data',
      version: config.version || 1,
      enableLocalStorageFallback: config.enableLocalStorageFallback !== false,
      defaultTTL: config.defaultTTL || 24 * 60 * 60 * 1000 // 24 horas
    }
  }
  /**
   * Inicializar IndexedDB
   */
  async init(): Promise<void> {
    if (this.isInitialized) return
    try {
      this.db = await this.openDB()
      this.isInitialized = true
    } catch (error) {
      console.warn('[OfflineStorage] IndexedDB failed to initialize:', error)
      if (this.config.enableLocalStorageFallback) {
        this.isInitialized = true
      } else {
        throw new Error('Failed to initialize offline storage')
      }
    }
  }
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          const store = db.createObjectStore(this.config.storeName, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp')
          store.createIndex('expiresAt', 'expiresAt')
          store.createIndex('tags', 'tags', { multiEntry: true })
        }
      }
    })
  }
  /**
   * Salvar dados offline
   */
  async set(key: string, data: any, options: { ttl?: number; tags?: string[] } = {}): Promise<void> {
    await this.init()
    const offlineData: OfflineData = {
      id: key,
      data,
      timestamp: Date.now(),
      expiresAt: options.ttl ? Date.now() + options.ttl : Date.now() + this.config.defaultTTL,
      tags: options.tags
    }
    try {
      // Validar dados antes de salvar
      OfflineDataSchema.parse(offlineData)
      if (this.db) {
        await this.saveToIndexedDB(offlineData)
      } else {
        await this.saveToLocalStorage(offlineData)
      }
    } catch (error) {
      console.error(`[OfflineStorage] Failed to save data for key ${key}:`, error)
      throw error
    }
  }
  /**
   * Recuperar dados offline
   */
  async get<T = any>(key: string): Promise<T | null> {
    await this.init()
    try {
      let data: OfflineData | null = null
      if (this.db) {
        data = await this.getFromIndexedDB(key)
      } else {
        data = await this.getFromLocalStorage(key)
      }
      if (!data) return null
      // Verificar expiração
      if (data.expiresAt && Date.now() > data.expiresAt) {
        await this.delete(key)
        return null
      }
      // Validar dados recuperados
      const validatedData = OfflineDataSchema.parse(data)
      return validatedData.data as T
    } catch (error) {
      console.error(`[OfflineStorage] Failed to get data for key ${key}:`, error)
      return null
    }
  }
  /**
   * Verificar se dados existem
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key)
    return data !== null
  }
  /**
   * Deletar dados
   */
  async delete(key: string): Promise<void> {
    await this.init()
    try {
      if (this.db) {
        await this.deleteFromIndexedDB(key)
      } else {
        await this.deleteFromLocalStorage(key)
      }
    } catch (error) {
      console.error(`[OfflineStorage] Failed to delete data for key ${key}:`, error)
    }
  }
  /**
   * Limpar dados expirados
   */
  async cleanExpired(): Promise<void> {
    await this.init()
    try {
      if (this.db) {
        await this.cleanExpiredFromIndexedDB()
      } else {
        await this.cleanExpiredFromLocalStorage()
      }
    } catch (error) {
      console.error('[OfflineStorage] Failed to clean expired data:', error)
    }
  }
  /**
   * Listar todas as chaves
   */
  async keys(): Promise<string[]> {
    await this.init()
    try {
      if (this.db) {
        return await this.getKeysFromIndexedDB()
      } else {
        return await this.getKeysFromLocalStorage()
      }
    } catch (error) {
      console.error('[OfflineStorage] Failed to get keys:', error)
      return []
    }
  }
  /**
   * Buscar por tags
   */
  async getByTag(tag: string): Promise<Array<{ key: string; data: any }>> {
    await this.init()
    try {
      if (this.db) {
        return await this.getByTagFromIndexedDB(tag)
      } else {
        return await this.getByTagFromLocalStorage(tag)
      }
    } catch (error) {
      console.error(`[OfflineStorage] Failed to get data by tag ${tag}:`, error)
      return []
    }
  }
  /**
   * Obter estatísticas de armazenamento
   */
  async getStats(): Promise<{
    totalItems: number
    totalSize: number
    expiredItems: number
    storageType: 'indexedDB' | 'localStorage'
  }> {
    await this.init()
    try {
      if (this.db) {
        return await this.getIndexedDBStats()
      } else {
        return await this.getLocalStorageStats()
      }
    } catch (error) {
      console.error('[OfflineStorage] Failed to get stats:', error)
      return {
        totalItems: 0,
        totalSize: 0,
        expiredItems: 0,
        storageType: this.db ? 'indexedDB' : 'localStorage'
      }
    }
  }
  /**
   * IndexedDB methods
   */
  private async saveToIndexedDB(data: OfflineData): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite')
      const store = transaction.objectStore(this.config.storeName)
      const request = store.put(data)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
  private async getFromIndexedDB(key: string): Promise<OfflineData | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly')
      const store = transaction.objectStore(this.config.storeName)
      const request = store.get(key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }
  private async deleteFromIndexedDB(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite')
      const store = transaction.objectStore(this.config.storeName)
      const request = store.delete(key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
  private async cleanExpiredFromIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite')
      const store = transaction.objectStore(this.config.storeName)
      const index = store.index('expiresAt')
      const request = index.openCursor(IDBKeyRange.upperBound(Date.now()))
      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
    })
  }
  private async getKeysFromIndexedDB(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly')
      const store = transaction.objectStore(this.config.storeName)
      const request = store.getAllKeys()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result as string[])
    })
  }
  private async getByTagFromIndexedDB(tag: string): Promise<Array<{ key: string; data: any }>> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly')
      const store = transaction.objectStore(this.config.storeName)
      const index = store.index('tags')
      const request = index.getAll(tag)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const results = request.result
        resolve(results.map((item: OfflineData) => ({
          key: item.id,
          data: item.data
        })))
      }
    })
  }
  private async getIndexedDBStats(): Promise<{
    totalItems: number
    totalSize: number
    expiredItems: number
    storageType: 'indexedDB'
  }> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly')
      const store = transaction.objectStore(this.config.storeName)
      const request = store.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const items = request.result
        const now = Date.now()
        const expiredItems = items.filter((item: OfflineData) =>
          item.expiresAt && now > item.expiresAt
        ).length
        const totalSize = JSON.stringify(items).length
        resolve({
          totalItems: items.length,
          totalSize,
          expiredItems,
          storageType: 'indexedDB'
        })
      }
    })
  }
  /**
   * LocalStorage methods (fallback)
   */
  private async saveToLocalStorage(data: OfflineData): Promise<void> {
    const key = `${this.config.storeName}_${data.id}`
    localStorage.setItem(key, JSON.stringify(data))
  }
  private async getFromLocalStorage(key: string): Promise<OfflineData | null> {
    const storageKey = `${this.config.storeName}_${key}`
    const item = localStorage.getItem(storageKey)
    if (!item) return null
    try {
      return JSON.parse(item)
    } catch {
      localStorage.removeItem(storageKey)
      return null
    }
  }
  private async deleteFromLocalStorage(key: string): Promise<void> {
    const storageKey = `${this.config.storeName}_${key}`
    localStorage.removeItem(storageKey)
  }
  private async cleanExpiredFromLocalStorage(): Promise<void> {
    const now = Date.now()
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith(this.config.storeName + '_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key)!)
          if (item.expiresAt && now > item.expiresAt) {
            localStorage.removeItem(key)
          }
        } catch {
          localStorage.removeItem(key)
        }
      }
    }
  }
  private async getKeysFromLocalStorage(): Promise<string[]> {
    const keys: string[] = []
    const prefix = this.config.storeName + '_'
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        keys.push(key.substring(prefix.length))
      }
    }
    return keys
  }
  private async getByTagFromLocalStorage(tag: string): Promise<Array<{ key: string; data: any }>> {
    const results: Array<{ key: string; data: any }> = []
    const prefix = this.config.storeName + '_'
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        try {
          const item = JSON.parse(localStorage.getItem(key)!)
          if (item.tags && item.tags.includes(tag)) {
            results.push({
              key: item.id,
              data: item.data
            })
          }
        } catch {
          localStorage.removeItem(key)
        }
      }
    }
    return results
  }
  private async getLocalStorageStats(): Promise<{
    totalItems: number
    totalSize: number
    expiredItems: number
    storageType: 'localStorage'
  }> {
    let totalItems = 0
    let expiredItems = 0
    let totalSize = 0
    const now = Date.now()
    const prefix = this.config.storeName + '_'
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        try {
          const item = JSON.parse(localStorage.getItem(key)!)
          totalItems++
          totalSize += key.length + localStorage.getItem(key)!.length
          if (item.expiresAt && now > item.expiresAt) {
            expiredItems++
          }
        } catch {
          localStorage.removeItem(key)
        }
      }
    }
    return {
      totalItems,
      totalSize,
      expiredItems,
      storageType: 'localStorage'
    }
  }
}
// Instância global
export const offlineStorage = new OfflineStorage()
// Exportar classe para testing
export { OfflineStorage }