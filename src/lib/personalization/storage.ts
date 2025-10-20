import { UserProfile, BehaviorData, PersonalizationConfig } from '@/types/personalization'
import { DEFAULT_PERSONALIZATION_CONFIG, CACHE_KEYS, RETENTION_POLICIES } from './config'
import { PersonalizationError } from '@/types/personalization'
export interface StorageAdapter {
    get<T>(key: string): Promise<T | null>
    set<T>(key: string, value: T, ttl?: number): Promise<void>
    delete(key: string): Promise<void>
    clear(): Promise<void>
    exists(key: string): Promise<boolean>
}
export class LocalStorageAdapter implements StorageAdapter {
    async get<T>(key: string): Promise<T | null> {
        if (typeof window === 'undefined') return null
        try {
            const item = localStorage.getItem(key)
            if (!item) return null
            const parsed = JSON.parse(item)
            // Verificar se expirou
            if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
                await this.delete(key)
                return null
            }
            return parsed.value
        } catch (error) {
            console.error('[LocalStorage] Error getting item:', error)
            return null
        }
    }
    async set<T>(key: string, value: T, ttl: number = DEFAULT_PERSONALIZATION_CONFIG.cacheTTL): Promise<void> {
        if (typeof window === 'undefined') return
        try {
            const expiresAt = Date.now() + (ttl * 1000)
            const item = {
                value,
                expiresAt,
                timestamp: Date.now()
            }
            localStorage.setItem(key, JSON.stringify(item))
        } catch (error) {
            console.error('[LocalStorage] Error setting item:', error)
            throw new PersonalizationError('Failed to store data in localStorage', 'STORAGE_ERROR', error)
        }
    }
    async delete(key: string): Promise<void> {
        if (typeof window === 'undefined') return
        try {
            localStorage.removeItem(key)
        } catch (error) {
            console.error('[LocalStorage] Error deleting item:', error)
        }
    }
    async clear(): Promise<void> {
        if (typeof window === 'undefined') return
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('personalization_') || key.startsWith('profile_') || key.startsWith('behavior_')) {
                    localStorage.removeItem(key)
                }
            })
        } catch (error) {
            console.error('[LocalStorage] Error clearing items:', error)
        }
    }
    async exists(key: string): Promise<boolean> {
        if (typeof window === 'undefined') return false
        try {
            const item = localStorage.getItem(key)
            if (!item) return false
            const parsed = JSON.parse(item)
            // Verificar se expirou
            if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
                await this.delete(key)
                return false
            }
            return true
        } catch (error) {
            console.error('[LocalStorage] Error checking item existence:', error)
            return false
        }
    }
}
export class SessionStorageAdapter implements StorageAdapter {
    async get<T>(key: string): Promise<T | null> {
        if (typeof window === 'undefined') return null
        try {
            const item = sessionStorage.getItem(key)
            if (!item) return null
            const parsed = JSON.parse(item)
            // Verificar se expirou
            if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
                await this.delete(key)
                return null
            }
            return parsed.value
        } catch (error) {
            console.error('[SessionStorage] Error getting item:', error)
            return null
        }
    }
    async set<T>(key: string, value: T, ttl: number = DEFAULT_PERSONALIZATION_CONFIG.cacheTTL): Promise<void> {
        if (typeof window === 'undefined') return
        try {
            const expiresAt = Date.now() + (ttl * 1000)
            const item = {
                value,
                expiresAt,
                timestamp: Date.now()
            }
            sessionStorage.setItem(key, JSON.stringify(item))
        } catch (error) {
            console.error('[SessionStorage] Error setting item:', error)
            throw new PersonalizationError('Failed to store data in sessionStorage', 'STORAGE_ERROR', error)
        }
    }
    async delete(key: string): Promise<void> {
        if (typeof window === 'undefined') return
        try {
            sessionStorage.removeItem(key)
        } catch (error) {
            console.error('[SessionStorage] Error deleting item:', error)
        }
    }
    async clear(): Promise<void> {
        if (typeof window === 'undefined') return
        try {
            Object.keys(sessionStorage).forEach(key => {
                if (key.startsWith('personalization_') || key.startsWith('profile_') || key.startsWith('behavior_')) {
                    sessionStorage.removeItem(key)
                }
            })
        } catch (error) {
            console.error('[SessionStorage] Error clearing items:', error)
        }
    }
    async exists(key: string): Promise<boolean> {
        if (typeof window === 'undefined') return false
        try {
            const item = sessionStorage.getItem(key)
            if (!item) return false
            const parsed = JSON.parse(item)
            // Verificar se expirou
            if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
                await this.delete(key)
                return false
            }
            return true
        } catch (error) {
            console.error('[SessionStorage] Error checking item existence:', error)
            return false
        }
    }
}
export class MemoryAdapter implements StorageAdapter {
    private cache = new Map<string, { value: any; expiresAt?: number; timestamp: number }>()
    async get<T>(key: string): Promise<T | null> {
        const item = this.cache.get(key)
        if (!item) return null
        // Verificar se expirou
        if (item.expiresAt && Date.now() > item.expiresAt) {
            this.cache.delete(key)
            return null
        }
        return item.value
    }
    async set<T>(key: string, value: T, ttl: number = DEFAULT_PERSONALIZATION_CONFIG.cacheTTL): Promise<void> {
        const expiresAt = Date.now() + (ttl * 1000)
        this.cache.set(key, {
            value,
            expiresAt,
            timestamp: Date.now()
        })
    }
    async delete(key: string): Promise<void> {
        this.cache.delete(key)
    }
    async clear(): Promise<void> {
        this.cache.clear()
    }
    async exists(key: string): Promise<boolean> {
        const item = this.cache.get(key)
        if (!item) return false
        // Verificar se expirou
        if (item.expiresAt && Date.now() > item.expiresAt) {
            this.cache.delete(key)
            return false
        }
        return true
    }
}
export class PersonalizationStorage {
    private adapter: StorageAdapter
    private config: PersonalizationConfig
    constructor(adapter?: StorageAdapter, config?: PersonalizationConfig) {
        this.config = config || DEFAULT_PERSONALIZATION_CONFIG
        this.adapter = adapter || this.getDefaultAdapter()
    }
    private getDefaultAdapter(): StorageAdapter {
        if (typeof window !== 'undefined') {
            // Client-side: usar localStorage
            return new LocalStorageAdapter()
        } else {
            // Server-side: usar memória
            return new MemoryAdapter()
        }
    }
    // UserProfile operations
    async getUserProfile(sessionId: string): Promise<UserProfile | null> {
        const key = `${CACHE_KEYS.USER_PROFILE}_${sessionId}`
        return await this.adapter.get<UserProfile>(key)
    }
    async setUserProfile(sessionId: string, profile: UserProfile, ttl?: number): Promise<void> {
        const key = `${CACHE_KEYS.USER_PROFILE}_${sessionId}`
        await this.adapter.set(key, profile, ttl || this.config.cacheTTL)
    }
    async deleteUserProfile(sessionId: string): Promise<void> {
        const key = `${CACHE_KEYS.USER_PROFILE}_${sessionId}`
        await this.adapter.delete(key)
    }
    // Behavior data operations
    async getBehaviorData(sessionId: string): Promise<BehaviorData[]> {
        const key = `${CACHE_KEYS.BEHAVIOR_DATA}_${sessionId}`
        return await this.adapter.get<BehaviorData[]>(key) || []
    }
    async addBehaviorData(sessionId: string, behavior: BehaviorData): Promise<void> {
        const key = `${CACHE_KEYS.BEHAVIOR_DATA}_${sessionId}`
        const existingData = await this.getBehaviorData(sessionId)
        // Adicionar novo comportamento
        existingData.push(behavior)
        // Manter apenas últimos 100 comportamentos
        if (existingData.length > 100) {
            existingData.splice(0, existingData.length - 100)
        }
        await this.adapter.set(key, existingData, RETENTION_POLICIES.BEHAVIOR_DATA)
    }
    async clearBehaviorData(sessionId: string): Promise<void> {
        const key = `${CACHE_KEYS.BEHAVIOR_DATA}_${sessionId}`
        await this.adapter.delete(key)
    }
    // Persona scores operations
    async getPersonaScores(sessionId: string): Promise<Record<string, number> | null> {
        const key = `${CACHE_KEYS.PERSONA_SCORES}_${sessionId}`
        return await this.adapter.get<Record<string, number>>(key)
    }
    async setPersonaScores(sessionId: string, scores: Record<string, number>): Promise<void> {
        const key = `${CACHE_KEYS.PERSONA_SCORES}_${sessionId}`
        await this.adapter.set(key, scores, this.config.cacheTTL)
    }
    // Content variations operations
    async getContentVariations(persona: string, variant: string): Promise<any | null> {
        const key = `${CACHE_KEYS.CONTENT_VARIATIONS}_${persona}_${variant}`
        return await this.adapter.get(key)
    }
    async setContentVariations(persona: string, variant: string, data: any): Promise<void> {
        const key = `${CACHE_KEYS.CONTENT_VARIATIONS}_${persona}_${variant}`
        await this.adapter.set(key, data, this.config.cacheTTL)
    }
    // Experiment assignments operations
    async getExperimentAssignments(sessionId: string): Promise<Record<string, string> | null> {
        const key = `${CACHE_KEYS.EXPERIMENT_ASSIGNMENTS}_${sessionId}`
        return await this.adapter.get<Record<string, string>>(key)
    }
    async setExperimentAssignment(sessionId: string, experimentId: string, variantId: string): Promise<void> {
        const key = `${CACHE_KEYS.EXPERIMENT_ASSIGNMENTS}_${sessionId}`
        const assignments = await this.getExperimentAssignments(sessionId) || {}
        assignments[experimentId] = variantId
        await this.adapter.set(key, assignments, RETENTION_POLICIES.EXPERIMENT_DATA)
    }
    // Consent operations
    async getConsentStatus(): Promise<Record<string, boolean> | null> {
        return await this.adapter.get<Record<string, boolean>>(CACHE_KEYS.CONSENT_STATUS)
    }
    async setConsentStatus(consents: Record<string, boolean>): Promise<void> {
        await this.adapter.set(CACHE_KEYS.CONSENT_STATUS, consents, RETENTION_POLICIES.CONSENT_DATA)
    }
    // Cleanup operations
    async cleanupExpiredData(): Promise<void> {
        // Implementar limpeza de dados expirados
        if (this.config.debug) {
        }
        // A limpeza automática já acontece nos métodos get/set
        // Este método pode ser expandido para limpeza proativa
    }
    async clearAllPersonalizationData(): Promise<void> {
        await this.adapter.clear()
    }
    // Data retention operations
    async enforceDataRetention(): Promise<void> {
        const retentionDays = this.config.dataRetentionDays
        const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000)
        if (this.config.debug) {
        }
        // Implementar lógica específica para cada tipo de dado
        // Isso dependerá de como os dados são armazenados
    }
    // Analytics operations
    async getStorageStats(): Promise<{
        totalKeys: number
        expiredKeys: number
        adapterType: string
    }> {
        let totalKeys = 0
        let expiredKeys = 0
        // Implementar contagem de chaves (depende do adaptador)
        if (this.adapter instanceof LocalStorageAdapter && typeof window !== 'undefined') {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('personalization_') || key.startsWith('profile_') || key.startsWith('behavior_')) {
                    totalKeys++
                    try {
                        const item = JSON.parse(localStorage.getItem(key) || '{}')
                        if (item.expiresAt && Date.now() > item.expiresAt) {
                            expiredKeys++
                        }
                    } catch {
                        // Ignorar erros de parsing
                    }
                }
            })
        }
        return {
            totalKeys,
            expiredKeys,
            adapterType: this.adapter.constructor.name
        }
    }
    // Utility methods
    async exportData(): Promise<{
        userProfiles: Record<string, UserProfile>
        behaviorData: Record<string, BehaviorData[]>
        experimentAssignments: Record<string, Record<string, string>>
        consentStatus: Record<string, boolean>
    }> {
        // Implementar exportação de dados (para compliance)
        return {
            userProfiles: {},
            behaviorData: {},
            experimentAssignments: {},
            consentStatus: await this.getConsentStatus() || {}
        }
    }
    async importData(data: any): Promise<void> {
        // Implementar importação de dados (para migração)
        if (data.consentStatus) {
            await this.setConsentStatus(data.consentStatus)
        }
    }
    // Health check
    async healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy'
        adapter: string
        available: boolean
        latency?: number
        error?: string
    }> {
        try {
            const startTime = Date.now()
            const testKey = 'health_check_test'
            await this.adapter.set(testKey, 'test', 1)
            const result = await this.adapter.get<string>(testKey)
            await this.adapter.delete(testKey)
            const latency = Date.now() - startTime
            return {
                status: result === 'test' ? 'healthy' : 'degraded',
                adapter: this.adapter.constructor.name,
                available: true,
                latency
            }
        } catch (error) {
            return {
                status: 'unhealthy',
                adapter: this.adapter.constructor.name,
                available: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }
}
// Singleton instance
export const personalizationStorage = new PersonalizationStorage()
// Factory function para criar instâncias com adaptadores diferentes
export function createPersonalizationStorage(
    adapter: StorageAdapter,
    config?: PersonalizationConfig
): PersonalizationStorage {
    return new PersonalizationStorage(adapter, config)
}
// Convenience functions
export async function getUserProfile(sessionId: string): Promise<UserProfile | null> {
    return await personalizationStorage.getUserProfile(sessionId)
}
export async function saveUserProfile(sessionId: string, profile: UserProfile): Promise<void> {
    return await personalizationStorage.setUserProfile(sessionId, profile)
}
export async function trackBehavior(sessionId: string, behavior: BehaviorData): Promise<void> {
    return await personalizationStorage.addBehaviorData(sessionId, behavior)
}
export async function getBehaviorHistory(sessionId: string): Promise<BehaviorData[]> {
    return await personalizationStorage.getBehaviorData(sessionId)
}