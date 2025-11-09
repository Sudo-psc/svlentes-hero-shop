/**
 * IndexedDB Manager com fallback para localStorage
 * Implementa resiliência para falhas de armazenamento local
 */

export interface StorageError extends Error {
  isStorageError: boolean;
  fallbackUsed: boolean;
}

export class IndexedDBManager {
  private dbName: string;
  private version: number;
  private storeName: string;
  private db: IDBDatabase | null = null;
  private fallbackToLocalStorage = false;
  private isInitialized = false;
  private initPromise: Promise<boolean> | null = null;

  constructor(dbName: string, version: number, storeName: string) {
    this.dbName = `svlentes_${dbName}`;
    this.version = version;
    this.storeName = storeName;
  }

  /**
   * Inicializa o banco de dados com fallback automático
   */
  async init(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initializeStorage();
    return this.initPromise;
  }

  private async _initializeStorage(): Promise<boolean> {
    try {
      // Verificar suporte a IndexedDB
      if (!this._isIndexedDBSupported()) {
        throw new Error('IndexedDB não suportado');
      }

      // Tentar abrir IndexedDB
      this.db = await this._openDB();
      this.isInitialized = true;
      console.log(`[IndexedDB] Banco "${this.dbName}" inicializado com sucesso`);
      return true;
    } catch (error) {
      console.warn(`[IndexedDB] Falha ao inicializar "${this.dbName}":`, error);

      // Fallback para localStorage
      this.fallbackToLocalStorage = true;
      this.isInitialized = true;
      console.log(`[IndexedDB] Usando localStorage fallback para "${this.dbName}"`);
      return false;
    }
  }

  private _isIndexedDBSupported(): boolean {
    return typeof indexedDB !== 'undefined' &&
           indexedDB !== null &&
           'open' in indexedDB;
  }

  private _openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        const error = request.error;
        reject(new Error(`Falha ao abrir IndexedDB: ${error?.message || 'Erro desconhecido'}`));
      };

      request.onsuccess = () => {
        const db = request.result;

        // Adicionar listener para erros de conexão
        db.onerror = (event) => {
          console.error(`[IndexedDB] Erro no banco "${this.dbName}":`, event);
        };

        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Criar object store se não existir
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });

          // Criar índices para buscas comuns
          if (this.storeName === 'subscriptions') {
            store.createIndex('userId', 'userId', { unique: false });
            store.createIndex('status', 'status', { unique: false });
            store.createIndex('createdAt', 'createdAt', { unique: false });
          }

          if (this.storeName === 'userPreferences') {
            store.createIndex('userId', 'userId', { unique: true });
          }

          console.log(`[IndexedDB] Object store "${this.storeName}" criado`);
        }
      };

      // Timeout para evitar travamento
      setTimeout(() => {
        if (request.readyState !== 'done') {
          request.abort();
          reject(new Error('Timeout ao abrir IndexedDB'));
        }
      }, 5000);
    });
  }

  /**
   * Salva um item no storage
   */
  async set(key: string, value: any): Promise<void> {
    await this.init();

    if (this.fallbackToLocalStorage) {
      this._setLocalStorage(key, value);
      return;
    }

    try {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const data = {
        id: key,
        value: value,
        timestamp: Date.now()
      };

      await this._storeRequest(store.put(data));
    } catch (error) {
      console.warn(`[IndexedDB] Falha ao salvar "${key}":`, error);

      // Tentar fallback em tempo real
      if (!this.fallbackToLocalStorage) {
        this.fallbackToLocalStorage = true;
        console.log(`[IndexedDB] Mudando para localStorage fallback`);
        this._setLocalStorage(key, value);
      } else {
        const storageError: StorageError = new Error(
          `Falha ao salvar "${key}" em localStorage: ${error}`
        ) as StorageError;
        storageError.isStorageError = true;
        storageError.fallbackUsed = true;
        throw storageError;
      }
    }
  }

  /**
   * Recupera um item do storage
   */
  async get<T = any>(key: string): Promise<T | null> {
    await this.init();

    if (this.fallbackToLocalStorage) {
      return this._getLocalStorage<T>(key);
    }

    try {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const result = await this._storeRequest(store.get(key));
      return result ? result.value : null;
    } catch (error) {
      console.warn(`[IndexedDB] Falha ao recuperar "${key}":`, error);

      // Tentar fallback em tempo real
      if (!this.fallbackToLocalStorage) {
        this.fallbackToLocalStorage = true;
        console.log(`[IndexedDB] Mudando para localStorage fallback`);
        return this._getLocalStorage<T>(key);
      }

      return null;
    }
  }

  /**
   * Remove um item do storage
   */
  async remove(key: string): Promise<void> {
    await this.init();

    if (this.fallbackToLocalStorage) {
      localStorage.removeItem(this._getLocalStorageKey(key));
      return;
    }

    try {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      await this._storeRequest(store.delete(key));
    } catch (error) {
      console.warn(`[IndexedDB] Falha ao remover "${key}":`, error);

      // Tentar fallback
      if (!this.fallbackToLocalStorage) {
        this.fallbackToLocalStorage = true;
        localStorage.removeItem(this._getLocalStorageKey(key));
      }
    }
  }

  /**
   * Lista todas as chaves do storage
   */
  async listKeys(): Promise<string[]> {
    await this.init();

    if (this.fallbackToLocalStorage) {
      return this._listLocalStorageKeys();
    }

    try {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.getAllKeys();
        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn(`[IndexedDB] Falha ao listar chaves:`, error);

      if (!this.fallbackToLocalStorage) {
        this.fallbackToLocalStorage = true;
        return this._listLocalStorageKeys();
      }

      return [];
    }
  }

  /**
   * Limpa todos os dados do storage
   */
  async clear(): Promise<void> {
    await this.init();

    if (this.fallbackToLocalStorage) {
      this._clearLocalStorage();
      return;
    }

    try {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      await this._storeRequest(store.clear());
    } catch (error) {
      console.warn(`[IndexedDB] Falha ao limpar storage:`, error);

      if (!this.fallbackToLocalStorage) {
        this.fallbackToLocalStorage = true;
        this._clearLocalStorage();
      }
    }
  }

  /**
   * Verifica o uso de espaço e quota
   */
  async getStorageInfo(): Promise<{
    used: number;
    quota?: number;
    usage: number;
    fallback: boolean;
  }> {
    await this.init();

    if (this.fallbackToLocalStorage) {
      const used = this._getLocalStorageSize();
      return {
        used,
        usage: 1, // localStorage não tem quota bem definida
        fallback: true
      };
    }

    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          quota: estimate.quota || undefined,
          usage: estimate.quota ? (estimate.usage || 0) / estimate.quota : 0,
          fallback: false
        };
      }
    } catch (error) {
      console.warn('[IndexedDB] Falha ao obter informações de storage:', error);
    }

    return { used: 0, usage: 0, fallback: false };
  }

  /**
   * Fecha a conexão com o banco de dados
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      this.initPromise = null;
    }
  }

  // Métodos privados para localStorage fallback

  private _getLocalStorageKey(key: string): string {
    return `${this.dbName}_${this.storeName}_${key}`;
  }

  private _setLocalStorage(key: string, value: any): void {
    try {
      const storageKey = this._getLocalStorageKey(key);
      const data = {
        value: value,
        timestamp: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error(`[LocalStorage] Falha ao salvar "${key}":`, error);
      throw new Error(`Falha no localStorage: ${error}`);
    }
  }

  private _getLocalStorage<T>(key: string): T | null {
    try {
      const storageKey = this._getLocalStorageKey(key);
      const item = localStorage.getItem(storageKey);

      if (!item) return null;

      const data = JSON.parse(item);
      return data.value;
    } catch (error) {
      console.error(`[LocalStorage] Falha ao recuperar "${key}":`, error);
      return null;
    }
  }

  private _listLocalStorageKeys(): string[] {
    const prefix = `${this.dbName}_${this.storeName}_`;
    const keys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key.replace(prefix, ''));
      }
    }

    return keys;
  }

  private _clearLocalStorage(): void {
    const keys = this._listLocalStorageKeys();
    keys.forEach(key => {
      localStorage.removeItem(this._getLocalStorageKey(key));
    });
  }

  private _getLocalStorageSize(): number {
    let total = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.dbName)) {
        const value = localStorage.getItem(key);
        if (value) {
          total += key.length + value.length;
        }
      }
    }

    return total;
  }

  private _storeRequest(request: IDBRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Método estático para detectar problemas de IndexedDB
   */
  static async diagnoseStorageIssues(): Promise<{
    indexedDBSupported: boolean;
    localStorageAvailable: boolean;
    quotaExceeded: boolean;
    privateMode: boolean;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];

    // Verificar IndexedDB
    const indexedDBSupported = typeof indexedDB !== 'undefined' && indexedDB !== null;

    if (!indexedDBSupported) {
      recommendations.push('Seu navegador não suporta IndexedDB. Usaremos localStorage.');
    }

    // Verificar localStorage
    let localStorageAvailable = false;
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      localStorageAvailable = true;
    } catch (error) {
      recommendations.push('localStorage não está disponível. Verifique as configurações do navegador.');
    }

    // Verificar modo privado
    const privateMode = !localStorageAvailable && !indexedDBSupported;
    if (privateMode) {
      recommendations.push('Modo de navegação privativa detectado. Algumas funcionalidades podem não funcionar.');
    }

    // Verificar quota
    let quotaExceeded = false;
    try {
      if (localStorageAvailable) {
        const testData = 'x'.repeat(1024 * 1024); // 1MB
        localStorage.setItem('quota-test', testData);
        localStorage.removeItem('quota-test');
      }
    } catch (error) {
      quotaExceeded = true;
      recommendations.push('Espaço de armazenamento esgotado. Limpe o cache ou dados do navegador.');
    }

    return {
      indexedDBSupported,
      localStorageAvailable,
      quotaExceeded,
      privateMode,
      recommendations
    };
  }
}

// Instâncias singleton para stores comuns
export const subscriptionStorage = new IndexedDBManager('main', 1, 'subscriptions');
export const preferencesStorage = new IndexedDBManager('main', 1, 'userPreferences');
export const cacheStorage = new IndexedDBManager('main', 1, 'cache');

// Inicialização automática
export async function initializeStorage(): Promise<void> {
  await Promise.all([
    subscriptionStorage.init(),
    preferencesStorage.init(),
    cacheStorage.init()
  ]);
}