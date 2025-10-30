import type { Auth, User, UserCredential } from 'firebase/auth'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { resolveAuthError } from '@/lib/auth/error-map'
import { AuthCacheManager } from '@/lib/auth/cache-manager'
import { AuthRetryManager } from '@/lib/auth/retry-manager'
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
}

export class FallbackAuthManager {
  private status: AuthStatus = createDefaultStatus()
  private listeners: Set<StatusListener> = new Set()
  private fallbackSession: FallbackSession | null = null
  private cacheManager = new AuthCacheManager()
  private retryManager = new AuthRetryManager()
  private healthMonitor: AuthHealthMonitor

  constructor(private auth: Auth | null) {
    this.healthMonitor = new AuthHealthMonitor(auth)
    this.healthMonitor.subscribe((healthStatus) => {
      this.updateStatus({
        health: healthStatus,
        isOffline: healthStatus === 'offline'
      })
    })
  }

  start(): void {
    this.healthMonitor.start()
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
      this.updateStatus({ isOffline: !navigator.onLine })
    }
  }

  stop(): void {
    this.healthMonitor.stop()
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }
  }

  private handleOnline = () => {
    this.updateStatus({ isOffline: false })
  }

  private handleOffline = () => {
    this.updateStatus({ isOffline: true })
  }

  subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener)
    listener(this.status)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getStatus(): AuthStatus {
    return this.status
  }

  getFallbackSession(): FallbackSession | null {
    if (this.fallbackSession && this.fallbackSession.expiresAt && this.fallbackSession.expiresAt < Date.now()) {
      this.fallbackSession = null
      this.updateStatus({ fallbackActive: false })
    }
    return this.fallbackSession
  }

  async signInWithEmailPassword(email: string, password: string): Promise<AuthFallbackResult> {
    if (!this.auth) {
      return this.activateGuestFallback('Firebase Auth não disponível', 'auth/unavailable')
    }

    if (this.status.isOffline) {
      const fallback = this.cacheManager.getSession()
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
          failureResolution: resolveAuthError({ code: 'auth/network-request-failed', message: 'offline' } as any)
        }
      }
    }

    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password)
      await this.cacheUserSession(credential)
      this.retryManager.reset()
      this.clearFallbackSession()
      this.updateStatus({
        fallbackActive: false,
        lastErrorCode: undefined,
        lastErrorMessage: undefined
      })
      return {
        success: true,
        user: credential.user
      }
    } catch (error) {
      return this.handleAuthFailure(error, { email, password })
    }
  }

  async cacheUserSession(credential: UserCredential | User): Promise<void> {
    const user = 'user' in credential ? credential.user : credential
    try {
      const token = await user.getIdToken()
      const refreshToken = user.refreshToken
      const expiresAt = Date.now() + 55 * 60 * 1000

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

      this.cacheManager.saveSession({
        user: snapshot,
        token,
        refreshToken,
        expiresAt,
        cachedAt: Date.now()
      })
    } catch (error) {
      console.error('[FallbackAuthManager] Failed to cache session:', error)
    }
  }

  restoreFromCache(): FallbackSession | null {
    const fallback = this.cacheManager.getSession()
    if (fallback) {
      this.fallbackSession = fallback
      this.updateStatus({ fallbackActive: true })
    }
    return fallback
  }

  async handleAuthStateChange(user: User | null): Promise<void> {
    if (user) {
      await this.cacheUserSession(user)
      this.clearFallbackSession()
    } else {
      this.cacheManager.clearSession()
      this.clearFallbackSession()
    }
  }

  async signOut(): Promise<void> {
    this.cacheManager.clearSession()
    this.clearFallbackSession()
    if (this.auth) {
      await this.auth.signOut()
    }
  }

  activateGuestFallback(message: string, code?: string): AuthFallbackResult {
    const guestSession: FallbackSession = {
      type: 'guest',
      user: {
        uid: `guest-${Date.now()}`,
        displayName: 'Convidado',
        email: null,
        providerId: 'guest'
      },
      scope: 'limited',
      source: 'generated',
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000
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
      failureResolution: resolveAuthError({ code: code ?? 'auth/internal-error', message } as any)
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

  private async handleAuthFailure(error: unknown, payload: PendingSignInPayload): Promise<AuthFallbackResult> {
    const resolution = resolveAuthError(error)
    const statusUpdate: Partial<AuthStatus> = {
      lastErrorCode: resolution.code,
      lastErrorMessage: resolution.message
    }

    let fallbackSession: FallbackSession | null = null
    let queued = false
    let nextRetryIn: number | null = null

    if (resolution.suggestedActions.includes('activate-offline-mode')) {
      fallbackSession = this.cacheManager.getSession()
      if (fallbackSession) {
        this.fallbackSession = fallbackSession
        statusUpdate.fallbackActive = true
      }
    }

    if (!fallbackSession && resolution.suggestedActions.includes('activate-backup-channel')) {
      // Nesta fase delegamos à UI para abrir fluxos de backup (WhatsApp/email/token)
      statusUpdate.fallbackActive = false
    }

    if (resolution.suggestedActions.includes('retry-with-backoff')) {
      nextRetryIn = this.retryManager.recordFailure()
      const state = this.retryManager.getState()
      statusUpdate.retryAttempts = state.retryAttempts
      statusUpdate.nextRetryIn = nextRetryIn
      statusUpdate.circuitOpen = state.circuitOpen
    } else if (resolution.suggestedActions.includes('retry')) {
      this.retryManager.reset()
      statusUpdate.retryAttempts = 0
      statusUpdate.nextRetryIn = null
    }

    if (resolution.suggestedActions.includes('queue-request')) {
      this.cacheManager.queueOperation({
        id: generateId(),
        createdAt: Date.now(),
        type: 'sign-in',
        payload
      })
      queued = true
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

  private updateStatus(patch: Partial<AuthStatus>): void {
    this.status = {
      ...this.status,
      ...patch
    }
    this.listeners.forEach(listener => {
      try {
        listener(this.status)
      } catch (listenerError) {
        console.error('[FallbackAuthManager] Status listener failed:', listenerError)
      }
    })
  }
}
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `auth-op-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
