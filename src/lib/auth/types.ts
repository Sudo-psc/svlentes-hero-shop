import type { User } from 'firebase/auth'

export type AuthHealthStatus = 'healthy' | 'degraded' | 'offline' | 'unavailable'

export type FallbackSessionType = 'offline-cache' | 'temporary-token' | 'guest'

export interface CachedUserSnapshot {
  uid: string
  email?: string | null
  displayName?: string | null
  photoURL?: string | null
  phoneNumber?: string | null
  providerId?: string | null
  metadata?: Record<string, unknown>
}

export interface FallbackSession {
  type: FallbackSessionType
  user: CachedUserSnapshot
  token?: string
  refreshToken?: string
  expiresAt?: number
  scope: 'full' | 'limited'
  source: 'cache' | 'backup' | 'generated'
  createdAt: number
}

export interface AuthStatus {
  health: AuthHealthStatus
  isOffline: boolean
  fallbackActive: boolean
  circuitOpen: boolean
  retryAttempts: number
  nextRetryIn: number | null
  lastErrorCode?: string
  lastErrorMessage?: string
}

export type AuthResolutionAction =
  | 'prompt-password-reset'
  | 'prompt-account-creation'
  | 'prompt-verification'
  | 'retry'
  | 'retry-with-backoff'
  | 'activate-offline-mode'
  | 'activate-backup-channel'
  | 'queue-request'
  | 'contact-support'
  | 'log-and-monitor'
  | 'enter-guest-mode'

export interface AuthErrorResolution {
  code: string
  label: string
  message: string
  category: 'credential' | 'network' | 'quota' | 'internal' | 'configuration' | 'unknown'
  severity: 'info' | 'warning' | 'error' | 'critical'
  suggestedActions: AuthResolutionAction[]
}

export interface AuthFallbackResult {
  success: boolean
  user?: User
  fallbackSession?: FallbackSession | null
  failureResolution?: AuthErrorResolution
  queued?: boolean
  nextRetryIn?: number | null
  error?: unknown
}

export type StatusListener = (status: AuthStatus) => void

