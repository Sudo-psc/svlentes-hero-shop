import CryptoJS from 'crypto-js'
import type { CachedUserSnapshot, FallbackSession } from '@/lib/auth/types'

const CACHE_KEY = 'svlentes.auth.session'
const OPERATIONS_KEY = 'svlentes.auth.pending-ops'
const DEFAULT_SECRET = 'svlentes-auth-fallback'

interface CachedPayload {
  user: CachedUserSnapshot
  token: string
  refreshToken?: string
  expiresAt: number
  cachedAt: number
}

interface PendingOperation {
  id: string
  createdAt: number
  type: 'sign-in' | 'refresh' | 'profile-sync'
  payload: Record<string, unknown>
}

export class AuthCacheManager {
  private storage: Storage | null
  private secret: string

  constructor(secretKey?: string) {
    this.storage = typeof window !== 'undefined' ? window.localStorage : null
    this.secret = secretKey || process.env.NEXT_PUBLIC_AUTH_CACHE_KEY || DEFAULT_SECRET
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

  saveSession(payload: CachedPayload): void {
    if (!this.storage) return
    try {
      const serialized = JSON.stringify(payload)
      const encrypted = this.encrypt(serialized)
      this.storage.setItem(CACHE_KEY, encrypted)
    } catch (error) {
      console.error('[AuthCacheManager] Failed to save session:', error)
    }
  }

  getSession(): FallbackSession | null {
    if (!this.storage) return null

    const encrypted = this.storage.getItem(CACHE_KEY)
    if (!encrypted) return null

    const decrypted = this.decrypt(encrypted)
    if (!decrypted) {
      this.storage.removeItem(CACHE_KEY)
      return null
    }

    try {
      const payload: CachedPayload = JSON.parse(decrypted)

      if (payload.expiresAt && payload.expiresAt < Date.now()) {
        this.storage.removeItem(CACHE_KEY)
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
      console.error('[AuthCacheManager] Failed to parse cached session:', error)
      this.storage.removeItem(CACHE_KEY)
      return null
    }
  }

  clearSession(): void {
    if (!this.storage) return
    this.storage.removeItem(CACHE_KEY)
  }

  queueOperation(operation: PendingOperation): void {
    if (!this.storage) return
    try {
      const existing = this.storage.getItem(OPERATIONS_KEY)
      const operations: PendingOperation[] = existing ? JSON.parse(existing) : []
      operations.push(operation)
      this.storage.setItem(OPERATIONS_KEY, this.encrypt(JSON.stringify(operations)))
    } catch (error) {
      console.error('[AuthCacheManager] Failed to queue operation:', error)
    }
  }

  consumeQueuedOperations(): PendingOperation[] {
    if (!this.storage) return []
    try {
      const encrypted = this.storage.getItem(OPERATIONS_KEY)
      if (!encrypted) return []

      const decrypted = this.decrypt(encrypted)
      this.storage.removeItem(OPERATIONS_KEY)

      if (!decrypted) return []
      const operations = JSON.parse(decrypted) as PendingOperation[]
      const validOps = operations.filter(op => op && op.id && op.createdAt)
      return validOps
    } catch (error) {
      console.error('[AuthCacheManager] Failed to consume operations:', error)
      this.storage.removeItem(OPERATIONS_KEY)
      return []
    }
  }
}

