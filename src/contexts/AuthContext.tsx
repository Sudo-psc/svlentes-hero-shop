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
import { getFirebaseAuth, OAUTH_CLIENT_ID } from '@/lib/firebase'
import { devLog } from '@/lib/devLogger'
import { FallbackAuthManager } from '@/lib/auth/fallback-auth-manager'
import type { AuthStatus, FallbackSession, AuthErrorResolution } from '@/lib/auth/types'
import { resolveAuthError } from '@/lib/auth/error-map'

// Get auth instance
const auth = typeof window !== 'undefined' ? getFirebaseAuth() : null
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
  const fallbackManagerRef = useRef<FallbackAuthManager | null>(null)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    if (!fallbackManagerRef.current) {
      fallbackManagerRef.current = new FallbackAuthManager(auth)
      fallbackManagerRef.current.start()
    }

    const manager = fallbackManagerRef.current
    const unsubscribe = manager.subscribe((newStatus) => {
      setStatus(newStatus)
      if (newStatus.fallbackActive) {
        setFallbackSession(manager.getFallbackSession())
      } else {
        setFallbackSession(null)
      }
    })

    const cachedSession = manager.restoreFromCache()
    if (cachedSession) {
      setFallbackSession(cachedSession)
    }

    return () => {
      unsubscribe()
      manager.stop()
      fallbackManagerRef.current = null
    }
  }, [])
  useEffect(() => {
    // Only set up auth listener on client side
    if (!auth) {
      setLoading(false)
      return
    }
    if (!fallbackManagerRef.current) {
      fallbackManagerRef.current = new FallbackAuthManager(auth)
      fallbackManagerRef.current.start()
    }
    const fallbackManager = fallbackManagerRef.current

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      await fallbackManager?.handleAuthStateChange(user)

      // Store Firebase token securely via server-side API
      if (user) {
        devLog.auth('user-signed-in', { uid: user.uid, email: user.email })
        try {
          const token = await user.getIdToken()
          // Send token to secure server-side endpoint for HttpOnly cookie storage
          const response = await fetch('/api/auth/set-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          })

          if (!response.ok) {
            console.error('[AUTH] Failed to store token securely')
          } else {
            devLog.auth('token-stored')
          }
        } catch (error) {
          console.error('[AUTH] Failed to get ID token:', error)
        }
      } else {
        devLog.auth('user-signed-out')
        // Clear cookie when user signs out via server-side API
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
      }

      setLoading(false)
    }, (error) => {
      console.error('[AUTH] Auth state change error:', error)
      setLoading(false)
    })

    return unsubscribe
  }, [])
  const signIn = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase Auth não está disponível. Por favor, recarregue a página.')
    }

    try {
      const fallbackManager = fallbackManagerRef.current
      if (!fallbackManager) {
        throw new Error('Sistema de fallback não inicializado. Atualize a página e tente novamente.')
      }
      const result = await fallbackManager.signInWithEmailPassword(email, password)
      setLastResolution(result.failureResolution ?? null)

      if (result.success) {
        if (result.user) {
          // Check if email is verified
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
      setLastResolution(resolveAuthError(error))
      throw error
    }
  }
  const signUp = async (email: string, password: string, displayName: string) => {
    if (!auth) {
      throw new Error('Firebase Auth não está disponível. Por favor, recarregue a página.')
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      // Update profile with display name
      if (result.user) {
        await updateProfile(result.user, { displayName })
        // Send verification email
        await sendEmailVerification(result.user, {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/area-assinante/login?verified=true`,
          handleCodeInApp: false,
        })
        await fallbackManagerRef.current?.cacheUserSession(result.user)
      }
    } catch (error: any) {
      console.error('[AUTH] Sign up error:', error)
      setLastResolution(resolveAuthError(error))
      throw error
    }
  }
  const signOut = async () => {
    if (!auth) {
      throw new Error('Firebase Auth não está disponível.')
    }
    devLog.auth('sign-out-initiated')
    // Clear the Firebase token cookie securely via server-side API
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
      setLastResolution(null)
      setStatus(prev => ({
        ...prev,
        fallbackActive: false,
        lastErrorCode: undefined,
        lastErrorMessage: undefined
      }))
    } else {
      await firebaseSignOut(auth)
    }
  }
  const sendVerificationEmail = async () => {
    if (!user) throw new Error('No user logged in')
    await sendEmailVerification(user, {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/area-assinante/login?verified=true`,
      handleCodeInApp: false,
    })
  }
  const sendPasswordReset = async (email: string) => {
    if (!auth) {
      throw new Error('Firebase Auth não está disponível.')
    }
    await sendPasswordResetEmail(auth, email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/area-assinante/login`,
      handleCodeInApp: false,
    })
  }
  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error('Firebase Auth não está disponível. Por favor, recarregue a página.')
    }

    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({
      prompt: 'select_account',
      // Explicitly use the correct OAuth Client ID
      client_id: OAUTH_CLIENT_ID,
    })
    try {
      const result = await signInWithPopup(auth, provider)
      devLog.auth('google-signin-success', { uid: result.user?.uid })
      // Google accounts are automatically verified
      // No need to check emailVerified for social logins
      if (result.user) {
        await fallbackManagerRef.current?.cacheUserSession(result.user)
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
        // Enhanced error message for network issues
        throw new Error('Erro de conexão com Google. Verifique se o OAuth Client ID está configurado corretamente no Google Cloud Console.')
      }
      // For any other error, throw with detailed message
      throw new Error(`Erro de autenticação: ${error.code || error.message}`)
    }
  }
  const signInWithFacebook = async () => {
    if (!auth) {
      throw new Error('Firebase Auth não está disponível. Por favor, recarregue a página.')
    }

    const provider = new FacebookAuthProvider()
    provider.setCustomParameters({
      display: 'popup',
    })
    try {
      const result = await signInWithPopup(auth, provider)
      // Facebook accounts are automatically verified
      // No need to check emailVerified for social logins
      if (result.user) {
        await fallbackManagerRef.current?.cacheUserSession(result.user)
        setLastResolution(null)
      }
      return
    } catch (error: any) {
      setLastResolution(resolveAuthError(error))
      // Handle specific errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Login cancelado pelo usuário')
      }
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup bloqueado. Permita popups para este site.')
      }
      if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('Já existe uma conta com este email usando outro método de login')
      }
      throw error
    }
  }
  // GitHub Authentication (Feature Flag controlled)
  const signInWithGitHub = async () => {
    if (!auth) {
      throw new Error('Firebase Auth não está disponível. Por favor, recarregue a página.')
    }

    // Check if GitHub authentication is enabled via feature flag
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
      // GitHub accounts are automatically verified
      // No need to check emailVerified for social logins
      if (result.user) {
        await fallbackManagerRef.current?.cacheUserSession(result.user)
        setLastResolution(null)
      }
      return
    } catch (error: any) {
      setLastResolution(resolveAuthError(error))
      console.error('[GITHUB_AUTH] Error during GitHub login:', {
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
      // For any other error, throw with detailed message
      throw new Error(`Erro de autenticação GitHub: ${error.code || error.message}`)
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
  const value = {
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
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
