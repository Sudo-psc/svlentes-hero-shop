'use client'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
} from 'firebase/auth'
import { getFirebaseAuth, OAUTH_CLIENT_ID, debugFirebaseConfig } from '@/lib/firebase-enhanced'
import { EnhancedFallbackAuthManager } from '@/lib/auth/enhanced-fallback-manager'
import { resolveAuthError } from '@/lib/auth/error-map'
import type { AuthStatus, FallbackSession, AuthErrorResolution } from '@/lib/auth/types'
import { devLog } from '@/lib/devLogger'

// Enhanced debug logging
const DEBUG_AUTH = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true'

interface AuthContextType {
  user: User | null
  loading: boolean
  status: AuthStatus
  fallbackSession: FallbackSession | null
  lastResolution: AuthErrorResolution | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithFacebook: () => Promise<void>
  signInWithGitHub: () => Promise<void>
  signOut: () => Promise<void>
  sendVerificationEmail: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  activateGuestAccess: () => void
  clearFallback: () => void
  // Enhanced methods for debugging
  debugInfo: () => any
  retryInitialization: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializationError, setInitializationError] = useState<Error | null>(null)

  const defaultStatus: AuthStatus = {
    health: 'unavailable',
    isOffline: typeof window !== 'undefined' ? !navigator.onLine : false,
    fallbackActive: false,
    circuitOpen: false,
    retryAttempts: 0,
    nextRetryIn: null
  }
  const [status, setStatus] = useState<AuthStatus>(defaultStatus)
  const [fallbackSession, setFallbackSession] = useState<FallbackSession | null>(null)
  const [lastResolution, setLastResolution] = useState<AuthErrorResolution | null>(null)

  const fallbackManagerRef = useRef<EnhancedFallbackAuthManager | null>(null)
  const authRef = useRef<ReturnType<typeof getFirebaseAuth> | null>(null)
  const initializationAttempts = useRef(0)
  const maxInitializationAttempts = 3

  // Enhanced Firebase initialization with retry logic
  const initializeAuth = async (): Promise<ReturnType<typeof getFirebaseAuth> | null> => {
    if (typeof window === 'undefined') {
      DEBUG_AUTH && console.log('[AUTH] Skipping initialization on server side')
      return null
    }

    if (initializationAttempts.current >= maxInitializationAttempts) {
      DEBUG_AUTH && console.log('[AUTH] Max initialization attempts reached')
      return null
    }

    initializationAttempts.current++

    try {
      // Debug Firebase configuration first
      const configValidation = debugFirebaseConfig()
      if (!configValidation.isValid) {
        throw new Error(`Firebase configuration invalid: ${configValidation.errors.join(', ')}`)
      }

      const auth = getFirebaseAuth()
      authRef.current = auth
      setInitializationError(null)
      DEBUG_AUTH && console.log('[AUTH] Firebase Auth initialized successfully')
      return auth
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown initialization error')
      console.error('[AUTH] Firebase initialization failed:', {
        attempt: initializationAttempts.current,
        error: err.message,
        stack: err.stack
      })
      setInitializationError(err)

      if (initializationAttempts.current < maxInitializationAttempts) {
        // Retry after delay
        setTimeout(() => {
          DEBUG_AUTH && console.log('[AUTH] Retrying Firebase initialization...')
          initializeAuth()
        }, 2000 * initializationAttempts.current) // Exponential backoff
      }

      return null
    }
  }

  // Retry initialization method
  const retryInitialization = async (): Promise<boolean> => {
    initializationAttempts.current = 0
    setInitializationError(null)
    const auth = await initializeAuth()
    return auth !== null
  }

  // Enhanced debug info method
  const debugInfo = () => ({
    user: user ? {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      providerId: user.providerData[0]?.providerId
    } : null,
    status,
    fallbackSession: fallbackSession ? {
      type: fallbackSession.type,
      source: fallbackSession.source,
      expiresAt: new Date(fallbackSession.expiresAt).toISOString()
    } : null,
    lastResolution,
    initializationError: initializationError?.message,
    initializationAttempts: initializationAttempts.current,
    firebaseAuth: authRef.current ? 'initialized' : 'not initialized',
    fallbackManager: fallbackManagerRef.current ? 'initialized' : 'not initialized'
  })

  useEffect(() => {
    let mounted = true
    let unsubscribe: (() => void) | null = null

    const setupAuth = async () => {
      const auth = await initializeAuth()

      if (!mounted || !auth) {
        setLoading(false)
        return
      }

      try {
        if (!fallbackManagerRef.current) {
          fallbackManagerRef.current = new EnhancedFallbackAuthManager(auth, {
            enableAdaptiveRetry: true,
            enableDeviceBinding: true,
            enableIntegrityChecks: true,
            maxRetryAttempts: 5
          })
          fallbackManagerRef.current.start()
          DEBUG_AUTH && console.log('[AUTH] Fallback manager initialized')
        }

        const manager = fallbackManagerRef.current

        // Subscribe to status changes
        const statusUnsubscribe = manager?.subscribe((newStatus) => {
          if (mounted) {
            setStatus(newStatus)
            setFallbackSession(newStatus.fallbackActive ? manager.getFallbackSession() : null)
          }
        })

        // Restore from cache
        const cachedSession = manager?.restoreFromCache()
        if (cachedSession && mounted) {
          setFallbackSession(cachedSession)
        }

        // Set up auth state listener
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!mounted) return

          DEBUG_AUTH && console.log('[AUTH] Auth state changed:', {
            userId: user?.uid,
            email: user?.email,
            emailVerified: user?.emailVerified
          })

          setUser(user)
          await manager?.handleAuthStateChange(user)

          // Store Firebase token securely via server-side API
          if (user) {
            devLog.auth('user-signed-in', { uid: user.uid, email: user.email })
            try {
              const token = await user.getIdToken()
              const response = await fetch('/api/auth/set-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
              })

              if (!response.ok) {
                console.error('[AUTH] Failed to store token securely', {
                  status: response.status,
                  statusText: response.statusText
                })
              } else {
                devLog.auth('token-stored')
              }

              setLoading(false)
            } catch (error) {
              console.error('[AUTH] Failed to get ID token:', error)
              setLoading(false)
            }
          } else {
            devLog.auth('user-signed-out')
            try {
              await fetch('/api/auth/set-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clear' }),
              })
              devLog.auth('token-cleared')
            } catch (error) {
              console.error('[AUTH] Failed to clear token:', error)
            }
            setLoading(false)
          }
        }, (error) => {
          console.error('[AUTH] Auth state change error:', error)
          if (mounted) {
            setLoading(false)
          }
        })

        // Cleanup function
        return () => {
          statusUnsubscribe?.()
          unsubscribe?.()
        }
      } catch (error) {
        console.error('[AUTH] Setup failed:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    setupAuth()

    return () => {
      mounted = false
      unsubscribe?.()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const auth = authRef.current
    if (!auth) {
      throw new Error('Firebase Auth não está disponível. Tente recarregar a página.')
    }

    const manager = fallbackManagerRef.current
    if (!manager) {
      throw new Error('Sistema de fallback não inicializado. Atualize a página e tente novamente.')
    }

    try {
      const result = await manager.signInWithEmailPassword(email, password)
      setLastResolution(result.failureResolution ?? null)

      if (result.success && result.user) {
        if (!result.user.emailVerified) {
          throw new Error('EMAIL_NOT_VERIFIED')
        }
        setUser(result.user)
        setFallbackSession(null)
        setLastResolution(null)
        return
      }

      if (result.fallbackSession) {
        setFallbackSession(result.fallbackSession)
        return
      }

      const resolution = result.failureResolution
      const baseMessage = resolution?.message || 'Erro ao fazer login. Tente novamente.'
      const authError: any = new Error(baseMessage)
      if (resolution?.code) {
        authError.code = resolution.code
      }
      throw authError
    } catch (error: any) {
      console.error('[AUTH] Sign in error:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    const auth = authRef.current
    if (!auth) {
      throw new Error('Firebase Auth não está disponível. Por favor, recarregue a página.')
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      if (result.user) {
        await updateProfile(result.user, { displayName })
        await sendEmailVerification(result.user, {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/area-assinante/login?verified=true`,
          handleCodeInApp: false,
        })
        await fallbackManagerRef.current?.cacheUserSession(result.user)
        setUser(result.user)
        setFallbackSession(null)
        setLastResolution(null)
        return
      }
    } catch (error: any) {
      console.error('[AUTH] Sign up error:', error)
      setLastResolution(resolveAuthError(error))
      throw error
    }
  }

  const signOut = async () => {
    const auth = authRef.current
    if (!auth) {
      throw new Error('Firebase Auth não está disponível.')
    }

    devLog.auth('sign-out-initiated')

    try {
      await fetch('/api/auth/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      })
      devLog.auth('sign-out-token-cleared')
    } catch (error) {
      console.error('[AUTH] Failed to clear token on sign out:', error)
    }

    if (fallbackManagerRef.current) {
      await fallbackManagerRef.current.signOut()
      setFallbackSession(null)
      setUser(null)
      setLastResolution(null)
      setStatus(prev => ({
        ...prev,
        fallbackActive: false,
        lastErrorCode: undefined,
        lastErrorMessage: undefined
      }))
    } else {
      await firebaseSignOut(auth)
      setUser(null)
    }
  }

  const sendVerificationEmail = async () => {
    const user = authRef.current?.currentUser
    if (!user) {
      throw new Error('No user logged in')
    }

    try {
      await sendEmailVerification(user, {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/area-assinante/login?verified=true`,
        handleCodeInApp: false,
      })
    } catch (error) {
      console.error('[AUTH] Failed to send verification email:', error)
      throw error
    }
  }

  const sendPasswordReset = async (email: string) => {
    const auth = authRef.current
    if (!auth) {
      throw new Error('Firebase Auth não está disponível.')
    }

    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/area-assinante/login`,
        handleCodeInApp: false,
      })
    } catch (error) {
      console.error('[AUTH] Failed to send password reset email:', error)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    const auth = authRef.current
    if (!auth) {
      throw new Error('Firebase Auth não está disponível. Por favor, recarregue a página.')
    }

    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({
      prompt: 'select_account',
      client_id: OAUTH_CLIENT_ID,
    })

    try {
      const result = await signInWithPopup(auth, provider)
      devLog.auth('google-signin-success', { uid: result.user?.uid })

      if (result.user) {
        await fallbackManagerRef.current?.cacheUserSession(result.user)
        setUser(result.user)
        setFallbackSession(null)
        setLastResolution(null)
      }
      return
    } catch (error: any) {
      setLastResolution(resolveAuthError(error))
      console.error('[GOOGLE_AUTH] Error during login:', {
        code: error.code,
        message: error.message,
      })

      // Handle specific errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Login cancelado pelo usuário')
      }
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup bloqueado. Permita popups para este site.')
      }
      if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Solicitação de popup cancelada. Tente novamente.')
      }
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error('Domínio não autorizado. Entre em contato com o suporte.')
      }
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Erro de conexão com Google. Verifique sua conexão com a internet.')
      }

      throw new Error(`Erro de autenticação: ${error.code || error.message}`)
    }
  }

  const signInWithFacebook = async () => {
    const auth = authRef.current
    if (!auth) {
      throw new Error('Firebase Auth não está disponível. Por favor, recarregue a página.')
    }

    const provider = new FacebookAuthProvider()
    provider.setCustomParameters({
      display: 'popup',
    })

    try {
      const result = await signInWithPopup(auth, provider)
      if (result.user) {
        await fallbackManagerRef.current?.cacheUserSession(result.user)
        setUser(result.user)
        setFallbackSession(null)
        setLastResolution(null)
      }
      return
    } catch (error: any) {
      setLastResolution(resolveAuthError(error))
      throw error
    }
  }

  const signInWithGitHub = async () => {
    const auth = authRef.current
    if (!auth) {
      throw new Error('Firebase Auth não está disponível. Por favor, recarregue a página.')
    }

    const githubAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_GITHUB_AUTH === 'true'
    if (!githubAuthEnabled) {
      throw new Error('Autenticação via GitHub não está disponível no momento')
    }

    const provider = new GithubAuthProvider()
    provider.setCustomParameters({
      allow_signup: 'false',
    })

    try {
      const result = await signInWithPopup(auth, provider)
      devLog.auth('github-signin-success', { uid: result.user?.uid })

      if (result.user) {
        await fallbackManagerRef.current?.cacheUserSession(result.user)
        setUser(result.user)
        setFallbackSession(null)
        setLastResolution(null)
      }
      return
    } catch (error: any) {
      setLastResolution(resolveAuthError(error))
      throw error
    }
  }

  const activateGuestAccess = () => {
    const manager = fallbackManagerRef.current
    if (!manager) return

    const result = manager.activateGuestFallback('Modo convidado ativado')
    if (result.fallbackSession) {
      setFallbackSession(result.fallbackSession)
    }
    setLastResolution(result.failureResolution ?? null)
  }

  const clearFallback = () => {
    fallbackManagerRef.current?.clearFallbackSession()
    setFallbackSession(null)
    setLastResolution(null)
  }

  const value: AuthContextType = {
    user,
    loading,
    status,
    fallbackSession,
    lastResolution,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithFacebook,
    signInWithGitHub,
    signOut,
    sendVerificationEmail,
    sendPasswordReset,
    activateGuestAccess,
    clearFallback,
    debugInfo,
    retryInitialization
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}