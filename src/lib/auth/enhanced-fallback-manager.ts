import type { Auth, User, UserCredential } from 'firebase/auth'
import { signInWithEmailAndPassword, getIdToken } from 'firebase/auth'
import { resolveAuthError } from '@/lib/auth/error-map'
import { EnhancedAuthCacheManager } from '@/lib/auth/enhanced-cache-manager'
import { EnhancedAuthRetryManager } from '@/lib/auth/enhanced-retry-manager'
import { AuthHealthMonitor } from '@/lib/auth/health-monitor'
import type {
    AuthFallbackResult,
    AuthStatus,
    CachedUserSnapshot,
    FallbackSession,
    StatusListener
} from '@/lib/auth/types'

const createDefaultStatus = (): AuthStatus => ({
    health: 'unavailable',
    isOffline: false,
    fallbackActive: false,
    circuitOpen: false,
    retryAttempts: 0,
    nextRetryIn: null
})

interface PendingSignInPayload {
    email: string
    password: string
    priority?: 'low' | 'medium' | 'high' | 'critical'
}

interface EnhancedAuthManagerOptions {
    enableAdaptiveRetry?: boolean
    enableDeviceBinding?: boolean
    enableIntegrityChecks?: boolean
    cacheSecret?: string
    healthCheckInterval?: number
    maxRetryAttempts?: number
    circuitBreakerThreshold?: number
}

export class EnhancedFallbackAuthManager {
    private status: AuthStatus = createDefaultStatus()
    private listeners: Set<StatusListener> = new Set()
    private fallbackSession: FallbackSession | null = null
    private cacheManager: EnhancedAuthCacheManager
    private retryManager: EnhancedAuthRetryManager
    private healthMonitor: AuthHealthMonitor
    private isDestroyed = false
    private operationQueue: Map<string, PendingSignInPayload> = new Map()
    private syncTimer: ReturnType<typeof setInterval> | null = null

    constructor(
        private auth: Auth | null,
        private options: EnhancedAuthManagerOptions = {}
    ) {
        this.cacheManager = new EnhancedAuthCacheManager(options.cacheSecret)
        this.retryManager = new EnhancedAuthRetryManager({
            maxAttempts: options.maxRetryAttempts ?? 5,
            adaptiveDelay: options.enableAdaptiveRetry ?? true,
            healthCheckInterval: options.healthCheckInterval ?? 30000
        })

        this.healthMonitor = new AuthHealthMonitor(auth)
        this.healthMonitor.subscribe((healthStatus) => {
            if (this.isDestroyed) return
            this.updateStatus({
                health: healthStatus,
                isOffline: healthStatus === 'offline'
            })
        })
    }

    start(): void {
        if (this.isDestroyed) return

        this.healthMonitor.start()

        // Iniciar monitoramento de conectividade
        if (typeof window !== 'undefined') {
            window.addEventListener('online', this.handleOnline)
            window.addEventListener('offline', this.handleOffline)
            this.updateStatus({ isOffline: !navigator.onLine })
        }

        // Iniciar sincronização periódica
        this.startPeriodicSync()

        // Tentar restaurar sessão do cache
        this.restoreFromCache()
    }

    stop(): void {
        this.isDestroyed = true
        this.healthMonitor.stop()
        this.retryManager.destroy()

        if (typeof window !== 'undefined') {
            window.removeEventListener('online', this.handleOnline)
            window.removeEventListener('offline', this.handleOffline)
        }

        if (this.syncTimer) {
            clearInterval(this.syncTimer)
            this.syncTimer = null
        }

        this.listeners.clear()
    }

    subscribe(listener: StatusListener): () => void {
        this.listeners.add(listener)
        listener(this.status)
        return () => {
            this.listeners.delete(listener)
        }
    }

    getStatus(): AuthStatus {
        return { ...this.status }
    }

    getFallbackSession(): FallbackSession | null {
        if (this.fallbackSession && this.fallbackSession.expiresAt && this.fallbackSession.expiresAt < Date.now()) {
            this.fallbackSession = null
            this.updateStatus({ fallbackActive: false })
        }
        return this.fallbackSession
    }

    async signInWithEmailPassword(
        email: string,
        password: string,
        options?: {
            priority?: 'low' | 'medium' | 'high' | 'critical'
            skipCache?: boolean
        }
    ): Promise<AuthFallbackResult> {
        if (!this.auth) {
            return this.activateGuestFallback(
                'Firebase Auth não está disponível. Usando modo convidado.',
                'auth/unavailable'
            )
        }

        const priority = options?.priority ?? 'medium'
        const operationId = `signin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Verificar modo offline primeiro
        if (this.status.isOffline && !options?.skipCache) {
            const fallback = await this.cacheManager.getSession()
            if (fallback) {
                this.fallbackSession = fallback
                this.updateStatus({
                    fallbackActive: true,
                    lastErrorCode: 'auth/network-request-failed',
                    lastErrorMessage: 'Conexão indisponível. Usando sessão salva.'
                })
                return {
                    success: true,
                    fallbackSession: fallback,
                    failureResolution: resolveAuthError({
                        code: 'auth/network-request-failed',
                        message: 'offline'
                    } as any)
                }
            }
        }

        // Executar com retry inteligente
        const retryResult = await this.retryManager.executeWithRetry(
            async () => {
                if (!this.auth) throw new Error('Auth not available')
                return await signInWithEmailAndPassword(this.auth, email, password)
            },
            {
                maxAttempts: this.options.maxRetryAttempts ?? 5,
                priority,
                useCache: () => this.cacheManager.getSession() as Promise<any>
            }
        )

        if (retryResult.success && retryResult.data) {
            // Sucesso - cache da sessão
            await this.cacheUserSession(retryResult.data)
            this.retryManager.recordSuccess()
            this.clearFallbackSession()
            this.updateStatus({
                fallbackActive: false,
                lastErrorCode: undefined,
                lastErrorMessage: undefined
            })
            return {
                success: true,
                user: retryResult.data.user
            }
        }

        // Falha - tentar fallbacks
        return this.handleAuthFailure(retryResult.error!, { email, password }, priority)
    }

    async cacheUserSession(credential: UserCredential | User): Promise<void> {
        if (this.isDestroyed) return

        const user = 'user' in credential ? credential.user : credential
        try {
            const token = await user.getIdToken()
            const refreshToken = user.refreshToken
            const expiresAt = Date.now() + 55 * 60 * 1000 // 55 minutos

            const snapshot: CachedUserSnapshot = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                phoneNumber: user.phoneNumber,
                providerId: user.providerData?.[0]?.providerId ?? null,
                metadata: {
                    creationTime: user.metadata?.creationTime,
                    lastSignInTime: user.metadata?.lastSignInTime
                }
            }

            await this.cacheManager.saveSession({
                user: snapshot,
                token,
                refreshToken,
                expiresAt,
                cachedAt: Date.now()
            })
        } catch (error) {
            console.error('[EnhancedFallbackAuthManager] Failed to cache session:', error)
        }
    }

    async restoreFromCache(): Promise<FallbackSession | null> {
        try {
            const fallback = await this.cacheManager.getSession()
            if (fallback) {
                this.fallbackSession = fallback
                this.updateStatus({
                    fallbackActive: true,
                    health: 'degraded'
                })

                // Agendar refresh do token
                this.scheduleTokenRefresh(fallback)

                return fallback
            }
        } catch (error) {
            console.error('[EnhancedFallbackAuthManager] Failed to restore from cache:', error)
        }
        return null
    }

    async handleAuthStateChange(user: User | null): Promise<void> {
        if (this.isDestroyed) return

        if (user) {
            await this.cacheUserSession(user)
            this.clearFallbackSession()

            // Agendar refresh automático
            this.scheduleTokenRefresh({ user } as any)
        } else {
            await this.cacheManager.clearSession()
            this.clearFallbackSession()
        }
    }

    async signOut(): Promise<void> {
        if (this.isDestroyed) return

        await this.cacheManager.clearSession()
        this.clearFallbackSession()

        if (this.auth) {
            await this.auth.signOut()
        }

        this.retryManager.reset()
        this.updateStatus({
            fallbackActive: false,
            lastErrorCode: undefined,
            lastErrorMessage: undefined
        })
    }

    activateGuestFallback(message: string, code?: string): AuthFallbackResult {
        const guestSession: FallbackSession = {
            type: 'guest',
            user: {
                uid: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                displayName: 'Convidado',
                email: null,
                providerId: 'guest'
            },
            scope: 'limited',
            source: 'generated',
            createdAt: Date.now(),
            expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutos
        }

        this.fallbackSession = guestSession
        this.updateStatus({
            fallbackActive: true,
            lastErrorCode: code,
            lastErrorMessage: message
        })

        return {
            success: true,
            fallbackSession: guestSession,
            failureResolution: resolveAuthError({
                code: code ?? 'auth/internal-error',
                message
            } as any)
        }
    }

    clearFallbackSession(): void {
        this.fallbackSession = null
        this.updateStatus({
            fallbackActive: false,
            lastErrorCode: undefined,
            lastErrorMessage: undefined
        })
    }

    private async handleAuthFailure(
        error: Error,
        payload: PendingSignInPayload,
        priority: 'low' | 'medium' | 'high' | 'critical'
    ): Promise<AuthFallbackResult> {
        const resolution = resolveAuthError(error)
        const statusUpdate: Partial<AuthStatus> = {
            lastErrorCode: resolution.code,
            lastErrorMessage: resolution.message
        }

        let fallbackSession: FallbackSession | null = null
        let queued = false
        let nextRetryIn: number | null = null

        // Tentar cache se offline ou network error
        if (resolution.suggestedActions.includes('activate-offline-mode')) {
            fallbackSession = await this.cacheManager.getSession()
            if (fallbackSession) {
                this.fallbackSession = fallbackSession
                statusUpdate.fallbackActive = true
            }
        }

        // Se não tem fallback e não é erro crítico, adicionar à fila
        if (!fallbackSession && !this.isCriticalError(resolution)) {
            await this.cacheManager.queueOperation({
                id: `signin-${Date.now()}`,
                createdAt: Date.now(),
                type: 'sign-in',
                payload,
                priority,
                retryCount: 0,
                maxRetries: this.options.maxRetryAttempts ?? 5,
                nextRetryAt: Date.now() + this.calculateRetryDelay(resolution, 1)
            })
            queued = true
        }

        // Calcular próximo retry
        if (resolution.suggestedActions.includes('retry-with-backoff')) {
            nextRetryIn = this.calculateRetryDelay(resolution, this.status.retryAttempts + 1)
            statusUpdate.nextRetryIn = nextRetryIn
        }

        this.updateStatus(statusUpdate)

        if (fallbackSession) {
            return {
                success: true,
                fallbackSession,
                failureResolution: resolution,
                queued,
                nextRetryIn
            }
        }

        return {
            success: false,
            failureResolution: resolution,
            queued,
            nextRetryIn,
            error
        }
    }

    private isCriticalError(resolution: any): boolean {
        const criticalCodes = [
            'auth/user-disabled',
            'auth/operation-not-allowed',
            'auth/invalid-email',
            'auth/weak-password'
        ]
        return criticalCodes.includes(resolution.code)
    }

    private calculateRetryDelay(resolution: any, attempt: number): number {
        let baseDelay = 1000 // 1 segundo base

        // Ajustar baseado no tipo de erro
        if (resolution.category === 'network') {
            baseDelay = 2000 // 2 segundos para erros de rede
        } else if (resolution.category === 'quota') {
            baseDelay = 5000 // 5 segundos para rate limiting
        } else if (resolution.category === 'internal') {
            baseDelay = 3000 // 3 segundos para erros internos
        }

        // Exponential backoff com jitter
        const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
        const jitter = Math.random() * 1000 // até 1 segundo de jitter
        const maxDelay = 30000 // máximo de 30 segundos

        return Math.min(exponentialDelay + jitter, maxDelay)
    }

    private scheduleTokenRefresh(session: FallbackSession): void {
        if (!session.refreshToken) return

        // Agendar refresh 5 minutos antes da expiração
        const refreshAt = (session.expiresAt || Date.now()) - 5 * 60 * 1000
        const delay = Math.max(0, refreshAt - Date.now())

        setTimeout(async () => {
            if (this.isDestroyed) return
            await this.refreshToken(session)
        }, delay)
    }

    private async refreshToken(session: FallbackSession): Promise<void> {
        if (!session.refreshToken || !this.auth) return

        try {
            // Tentar refresh silencioso
            const result = await this.retryManager.executeWithRetry(
                async () => {
                    // Em produção, isso seria uma chamada para refresh token
                    // Por ora, simulamos com getIdToken(true)
                    const user = this.auth.currentUser
                    if (!user) throw new Error('No current user')
                    return await getIdToken(user, true)
                },
                {
                    priority: 'high',
                    maxAttempts: 2
                }
            )

            if (result.success && result.data) {
                // Token atualizado - atualizar cache
                const expiresAt = Date.now() + 55 * 60 * 1000
                await this.cacheManager.saveSession({
                    user: session.user,
                    token: result.data,
                    refreshToken: session.refreshToken,
                    expiresAt,
                    cachedAt: Date.now()
                })

                // Agendar próximo refresh
                this.scheduleTokenRefresh({
                    ...session,
                    token: result.data,
                    expiresAt
                })
            }
        } catch (error) {
            console.warn('[EnhancedFallbackAuthManager] Token refresh failed:', error)
            // Se falhar, tentar no próximo ciclo
            setTimeout(() => this.refreshToken(session), 60000) // 1 minuto
        }
    }

    private startPeriodicSync(): void {
        if (this.syncTimer) {
            clearInterval(this.syncTimer)
        }

        this.syncTimer = setInterval(async () => {
            if (this.isDestroyed) return
            await this.performPeriodicSync()
        }, 60000) // A cada minuto
    }

    private async performPeriodicSync(): Promise<void> {
        try {
            // Processar operações pendentes
            const operations = await this.cacheManager.consumeQueuedOperations()

            for (const operation of operations) {
                if (operation.type === 'sign-in') {
                    const payload = operation.payload as PendingSignInPayload
                    await this.signInWithEmailPassword(
                        payload.email,
                        payload.password,
                        { priority: operation.priority as any, skipCache: true }
                    )
                }
            }

            // Limpar dados expirados
            await this.cacheManager.cleanupExpiredData()
        } catch (error) {
            console.error('[EnhancedFallbackAuthManager] Periodic sync failed:', error)
        }
    }

    private handleOnline = (): void => {
        this.updateStatus({ isOffline: false })
        // Quando voltar online, tentar sincronizar
        setTimeout(() => this.performPeriodicSync(), 1000)
    }

    private handleOffline = (): void => {
        this.updateStatus({ isOffline: true })
    }

    private updateStatus(patch: Partial<AuthStatus>): void {
        this.status = {
            ...this.status,
            ...patch
        }

        this.listeners.forEach(listener => {
            try {
                listener(this.status)
            } catch (listenerError) {
                console.error('[EnhancedFallbackAuthManager] Status listener failed:', listenerError)
            }
        })
    }

    async getManagerStats(): Promise<{
        cache: any
        retry: any
        status: AuthStatus
        fallbackSession: FallbackSession | null
    }> {
        const cacheStats = await this.cacheManager.getCacheStats()
        const retryStats = this.retryManager.getStats()

        return {
            cache: cacheStats,
            retry: retryStats,
            status: this.getStatus(),
            fallbackSession: this.getFallbackSession()
        }
    }
}
