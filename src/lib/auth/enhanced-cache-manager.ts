import CryptoJS from 'crypto-js'
import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { CachedUserSnapshot, FallbackSession } from '@/lib/auth/types'

const DEFAULT_SECRET = 'svlentes-auth-fallback-enhanced'
const CACHE_DB_NAME = 'svlentes-auth-cache'
const CACHE_DB_VERSION = 1
const CACHE_STORE_NAME = 'sessions'
const OPERATIONS_STORE_NAME = 'operations'

interface EnhancedCachedPayload {
    user: CachedUserSnapshot
    token: string
    refreshToken?: string
    expiresAt: number
    cachedAt: number
    deviceId: string
    ipAddress?: string
    userAgent: string
    integrityHash: string
}

interface PendingOperation {
    id: string
    createdAt: number
    type: 'sign-in' | 'refresh' | 'profile-sync' | 'token-refresh'
    payload: Record<string, unknown>
    priority: 'low' | 'medium' | 'high' | 'critical'
    retryCount: number
    maxRetries: number
    nextRetryAt: number
}

interface AuthCacheDB extends DBSchema {
    [CACHE_STORE_NAME]: {
        key: string
        value: EnhancedCachedPayload
    }
    [OPERATIONS_STORE_NAME]: {
        key: string
        value: PendingOperation
    }
}

export class EnhancedAuthCacheManager {
    private db: IDBPDatabase<AuthCacheDB> | null = null
    private storage: Storage | null
    private secret: string
    private deviceId: string
    private initPromise: Promise<void> | null = null

    constructor(secretKey?: string) {
        this.storage = typeof window !== 'undefined' ? window.localStorage : null
        this.secret = secretKey || process.env.NEXT_PUBLIC_AUTH_CACHE_KEY || DEFAULT_SECRET
        this.deviceId = this.getOrCreateDeviceId()
        this.initPromise = this.initDB()
    }

    private async initDB(): Promise<void> {
        if (typeof window === 'undefined') return

        try {
            this.db = await openDB<AuthCacheDB>(CACHE_DB_NAME, CACHE_DB_VERSION, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
                        db.createObjectStore(CACHE_STORE_NAME)
                    }
                    if (!db.objectStoreNames.contains(OPERATIONS_STORE_NAME)) {
                        db.createObjectStore(OPERATIONS_STORE_NAME)
                    }
                }
            })
        } catch (error) {
            console.error('[EnhancedAuthCacheManager] Failed to initialize IndexedDB:', error)
            // Fallback para localStorage apenas
        }
    }

    private getOrCreateDeviceId(): string {
        if (typeof window === 'undefined') return 'server'

        const storageKey = 'svlentes.device.id'
        let deviceId = this.storage?.getItem(storageKey)

        if (!deviceId) {
            deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            this.storage?.setItem(storageKey, deviceId)
        }

        return deviceId
    }

    private encrypt(data: string): string {
        return CryptoJS.AES.encrypt(data, this.secret).toString()
    }

    private decrypt(cipherText: string): string | null {
        try {
            const bytes = CryptoJS.AES.decrypt(cipherText, this.secret)
            return bytes.toString(CryptoJS.enc.Utf8) || null
        } catch {
            return null
        }
    }

    private generateIntegrityHash(payload: EnhancedCachedPayload): string {
        const data = `${payload.user.uid}-${payload.token}-${payload.deviceId}-${payload.expiresAt}`
        return CryptoJS.SHA256(data + this.secret).toString()
    }

    private async waitForDB(): Promise<IDBPDatabase<AuthCacheDB> | null> {
        if (this.initPromise) {
            await this.initPromise
        }
        return this.db
    }

    private getClientInfo(): { userAgent: string; ipAddress?: string } {
        if (typeof window === 'undefined') {
            return { userAgent: 'server' }
        }

        return {
            userAgent: navigator.userAgent,
            // IP address seria obtido via API server-side em produção
            ipAddress: this.storage?.getItem('svlentes.client.ip') || undefined
        }
    }

    async saveSession(payload: Omit<EnhancedCachedPayload, 'deviceId' | 'userAgent' | 'integrityHash'>): Promise<void> {
        try {
            const clientInfo = this.getClientInfo()
            const enhancedPayload: EnhancedCachedPayload = {
                ...payload,
                deviceId: this.deviceId,
                userAgent: clientInfo.userAgent,
                ipAddress: clientInfo.ipAddress,
                integrityHash: '' // Será gerado abaixo
            }

            enhancedPayload.integrityHash = this.generateIntegrityHash(enhancedPayload)

            // Tentar salvar no IndexedDB primeiro
            const db = await this.waitForDB()
            if (db) {
                await db.put(CACHE_STORE_NAME, enhancedPayload, 'current-session')
            }

            // Fallback para localStorage
            if (this.storage) {
                const serialized = JSON.stringify(enhancedPayload)
                const encrypted = this.encrypt(serialized)
                this.storage.setItem('svlentes.auth.session.enhanced', encrypted)
            }
        } catch (error) {
            console.error('[EnhancedAuthCacheManager] Failed to save session:', error)
            throw error
        }
    }

    async getSession(): Promise<FallbackSession | null> {
        try {
            let payload: EnhancedCachedPayload | null = null

            // Tentar recuperar do IndexedDB primeiro
            const db = await this.waitForDB()
            if (db) {
                payload = (await db.get(CACHE_STORE_NAME, 'current-session')) ?? null
            }

            // Fallback para localStorage
            if (!payload && this.storage) {
                const encrypted = this.storage.getItem('svlentes.auth.session.enhanced')
                if (encrypted) {
                    const decrypted = this.decrypt(encrypted)
                    if (decrypted) {
                        payload = JSON.parse(decrypted) as EnhancedCachedPayload
                    }
                }
            }

            if (!payload) {
                return null
            }

            // Verificar integridade
            const expectedHash = this.generateIntegrityHash(payload)
            if (payload.integrityHash !== expectedHash) {
                console.warn('[EnhancedAuthCacheManager] Session integrity check failed')
                await this.clearSession()
                return null
            }

            // Verificar expiração
            if (payload.expiresAt && payload.expiresAt < Date.now()) {
                console.warn('[EnhancedAuthCacheManager] Session expired')
                await this.clearSession()
                return null
            }

            // Verificar device binding
            if (payload.deviceId !== this.deviceId) {
                console.warn('[EnhancedAuthCacheManager] Device mismatch - possible session hijacking')
                await this.clearSession()
                return null
            }

            return {
                type: 'offline-cache',
                user: payload.user,
                token: payload.token,
                refreshToken: payload.refreshToken,
                expiresAt: payload.expiresAt,
                scope: 'full',
                source: 'cache',
                createdAt: payload.cachedAt
            }
        } catch (error) {
            console.error('[EnhancedAuthCacheManager] Failed to get session:', error)
            return null
        }
    }

    async clearSession(): Promise<void> {
        try {
            // Limpar IndexedDB
            const db = await this.waitForDB()
            if (db) {
                await db.delete(CACHE_STORE_NAME, 'current-session')
            }

            // Limpar localStorage
            if (this.storage) {
                this.storage.removeItem('svlentes.auth.session.enhanced')
            }
        } catch (error) {
            console.error('[EnhancedAuthCacheManager] Failed to clear session:', error)
        }
    }

    async queueOperation(operation: Omit<PendingOperation, 'id' | 'createdAt' | 'retryCount' | 'nextRetryAt'>): Promise<void> {
        const pendingOp: PendingOperation = {
            ...operation,
            id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now(),
            retryCount: 0,
            nextRetryAt: Date.now()
        }

        try {
            // Tentar salvar no IndexedDB primeiro
            const db = await this.waitForDB()
            if (db) {
                await db.add(OPERATIONS_STORE_NAME, pendingOp, pendingOp.id)
            }

            // Fallback para localStorage (apenas operações críticas)
            if (this.storage && operation.priority === 'critical') {
                const existing = this.storage.getItem('svlentes.auth.operations.critical')
                const operations: PendingOperation[] = existing ? JSON.parse(existing) : []
                operations.push(pendingOp)

                // Manter apenas as 10 operações críticas mais recentes
                operations.sort((a, b) => b.createdAt - a.createdAt)
                operations.splice(10)

                this.storage.setItem('svlentes.auth.operations.critical', JSON.stringify(operations))
            }
        } catch (error) {
            console.error('[EnhancedAuthCacheManager] Failed to queue operation:', error)
        }
    }

    async consumeQueuedOperations(): Promise<PendingOperation[]> {
        try {
            const operations: PendingOperation[] = []

            // Recuperar do IndexedDB
            const db = await this.waitForDB()
            if (db) {
                const tx = db.transaction(OPERATIONS_STORE_NAME, 'readwrite')
                const store = tx.objectStore(OPERATIONS_STORE_NAME)
                const allOps = await store.getAll()

                // Filtrar operações que podem ser executadas agora
                const readyOps = allOps.filter(op => op.nextRetryAt <= Date.now())

                // Remover operações consumidas
                for (const op of readyOps) {
                    await store.delete(op.id)
                }

                operations.push(...readyOps)
            }

            // Recuperar do localStorage fallback
            if (this.storage) {
                const criticalOps = this.storage.getItem('svlentes.auth.operations.critical')
                if (criticalOps) {
                    const localStorageOps = JSON.parse(criticalOps) as PendingOperation[]
                    const readyOps = localStorageOps.filter(op => op.nextRetryAt <= Date.now())
                    operations.push(...readyOps)

                    // Limpar operações consumidas
                    const remainingOps = localStorageOps.filter(op => op.nextRetryAt > Date.now())
                    if (remainingOps.length > 0) {
                        this.storage.setItem('svlentes.auth.operations.critical', JSON.stringify(remainingOps))
                    } else {
                        this.storage.removeItem('svlentes.auth.operations.critical')
                    }
                }
            }

            // Ordenar por prioridade e data
            operations.sort((a, b) => {
                const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
                const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
                if (priorityDiff !== 0) return priorityDiff
                return a.createdAt - b.createdAt
            })

            return operations
        } catch (error) {
            console.error('[EnhancedAuthCacheManager] Failed to consume operations:', error)
            return []
        }
    }

    async updateOperationRetry(operationId: string, retryCount: number, nextRetryAt: number): Promise<void> {
        try {
            const db = await this.waitForDB()
            if (db) {
                const op = await db.get(OPERATIONS_STORE_NAME, operationId)
                if (op) {
                    const updatedOp = { ...op, retryCount, nextRetryAt }
                    await db.put(OPERATIONS_STORE_NAME, updatedOp, operationId)
                }
            }
        } catch (error) {
            console.error('[EnhancedAuthCacheManager] Failed to update operation retry:', error)
        }
    }

    async removeOperation(operationId: string): Promise<void> {
        try {
            const db = await this.waitForDB()
            if (db) {
                await db.delete(OPERATIONS_STORE_NAME, operationId)
            }
        } catch (error) {
            console.error('[EnhancedAuthCacheManager] Failed to remove operation:', error)
        }
    }

    async getCacheStats(): Promise<{
        sessionExists: boolean
        sessionExpiresAt?: number
        pendingOperations: number
        operationsByPriority: Record<string, number>
        deviceInfo: { deviceId: string; userAgent: string }
    }> {
        try {
            const session = await this.getSession()
            const operations = await this.consumeQueuedOperations()

            // Re-adicionar operações consumidas (era apenas para leitura)
            for (const op of operations) {
                await this.queueOperation(op)
            }

            const operationsByPriority = operations.reduce((acc, op) => {
                acc[op.priority] = (acc[op.priority] || 0) + 1
                return acc
            }, {} as Record<string, number>)

            return {
                sessionExists: !!session,
                sessionExpiresAt: session?.expiresAt,
                pendingOperations: operations.length,
                operationsByPriority,
                deviceInfo: {
                    deviceId: this.deviceId,
                    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
                }
            }
        } catch (error) {
            console.error('[EnhancedAuthCacheManager] Failed to get cache stats:', error)
            return {
                sessionExists: false,
                pendingOperations: 0,
                operationsByPriority: {},
                deviceInfo: { deviceId: this.deviceId, userAgent: 'unknown' }
            }
        }
    }

    async cleanupExpiredData(): Promise<void> {
        try {
            const db = await this.waitForDB()
            if (!db) return

            const tx = db.transaction(OPERATIONS_STORE_NAME, 'readwrite')
            const store = tx.objectStore(OPERATIONS_STORE_NAME)
            const allOps = await store.getAll()

            // Remover operações expiradas ou com muitas tentativas
            const now = Date.now()
            for (const op of allOps) {
                if (op.retryCount >= op.maxRetries || op.createdAt < now - 24 * 60 * 60 * 1000) {
                    await store.delete(op.id)
                }
            }
        } catch (error) {
            console.error('[EnhancedAuthCacheManager] Failed to cleanup expired data:', error)
        }
    }
}
