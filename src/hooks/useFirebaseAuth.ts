/**
 * Custom hook for Firebase Authentication
 *
 * This hook provides a complete interface for Firebase Authentication
 * including sign in, sign up, sign out, and user state management.
 *
 * @author Dr. Philipe Saraiva Cruz
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth'

import { getFirebaseAuth, getFirebaseServices, OAUTH_CLIENT_ID } from '@/lib/firebase-client'
import { debugFirebaseConfig } from '@/lib/firebase-client'

export interface UseFirebaseAuthReturn {
  // User state
  user: User | null
  loading: boolean
  error: string | null

  // Authentication methods
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName?: string) => Promise<void>
  signOut: () => Promise<void>

  // OAuth methods
  signInWithGoogle: () => Promise<void>
  signInWithFacebook: () => Promise<void>
  signInWithGitHub: () => Promise<void>

  // Utility methods
  sendVerificationEmail: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>

  // Token management
  getIdToken: () => Promise<string | null>

  // Debug
  debug: () => void
}

/**
 * Custom hook for Firebase Authentication
 */
export function useFirebaseAuth(): UseFirebaseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [auth, setAuth] = useState(getFirebaseAuth())

  // Initialize auth listener
  useEffect(() => {
    try {
      const firebaseAuth = getFirebaseAuth()
      setAuth(firebaseAuth)

      const unsubscribe = onAuthStateChanged(
        firebaseAuth,
        (user) => {
          setUser(user)
          setLoading(false)
          setError(null)

          if (user) {
            console.log('[FIREBASE AUTH] User signed in:', {
              uid: user.uid,
              email: user.email,
              emailVerified: user.emailVerified,
              displayName: user.displayName,
              isAnonymous: user.isAnonymous
            })
          } else {
            console.log('[FIREBASE AUTH] User signed out')
          }
        },
        (error) => {
          console.error('[FIREBASE AUTH] Auth state change error:', error)
          setError(error.message)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (error) {
      console.error('[FIREBASE AUTH] Initialization error:', error)
      setError('Failed to initialize authentication')
      setLoading(false)
    }
  }, [])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    if (!auth) {
      setError('Authentication not initialized')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      if (!userCredential.user.emailVerified) {
        setError('Please verify your email before signing in. Check your inbox.')
        await sendEmailVerification(userCredential.user)
      }

      console.log('[FIREBASE AUTH] Sign in successful:', userCredential.user.uid)
    } catch (error: any) {
      console.error('[FIREBASE AUTH] Sign in error:', error)

      // Handle specific Firebase Auth errors
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address.')
          break
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.')
          break
        case 'auth/user-disabled':
          setError('This account has been disabled.')
          break
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later.')
          break
        case 'auth/invalid-email':
          setError('Invalid email address.')
          break
        default:
          setError(error.message || 'Failed to sign in.')
      }
    } finally {
      setLoading(false)
    }
  }, [auth])

  const signUp = useCallback(async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<void> => {
    if (!auth) {
      setError('Authentication not initialized')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Update display name if provided
      if (displayName) {
        await updateProfile(userCredential.user, { displayName })
      }

      // Send email verification
      await sendEmailVerification(userCredential.user)

      console.log('[FIREBASE AUTH] Sign up successful:', userCredential.user.uid)
    } catch (error: any) {
      console.error('[FIREBASE AUTH] Sign up error:', error)

      // Handle specific Firebase Auth errors
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('An account with this email already exists.')
          break
        case 'auth/weak-password':
          setError('Password is too weak. Please choose a stronger password.')
          break
        case 'auth/invalid-email':
          setError('Invalid email address.')
          break
        case 'auth/operation-not-allowed':
          setError('Email/password accounts are not enabled.')
          break
        default:
          setError(error.message || 'Failed to create account.')
      }
    } finally {
      setLoading(false)
    }
  }, [auth])

  const signOut = useCallback(async (): Promise<void> => {
    if (!auth) {
      setError('Authentication not initialized')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await firebaseSignOut(auth)
      console.log('[FIREBASE AUTH] Sign out successful')
    } catch (error: any) {
      console.error('[FIREBASE AUTH] Sign out error:', error)
      setError(error.message || 'Failed to sign out.')
    } finally {
      setLoading(false)
    }
  }, [auth])

  const signInWithGoogle = useCallback(async (): Promise<void> => {
    if (!auth || !OAUTH_CLIENT_ID) {
      setError('Google Sign-In not configured')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')

      await signInWithPopup(auth, provider)
      console.log('[FIREBASE AUTH] Google sign-in successful')
    } catch (error: any) {
      console.error('[FIREBASE AUTH] Google sign-in error:', error)
      setError(error.message || 'Failed to sign in with Google.')
    } finally {
      setLoading(false)
    }
  }, [auth])

  const signInWithFacebook = useCallback(async (): Promise<void> => {
    if (!auth) {
      setError('Facebook Sign-In not configured')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const provider = new FacebookAuthProvider()
      provider.addScope('email')

      await signInWithPopup(auth, provider)
      console.log('[FIREBASE AUTH] Facebook sign-in successful')
    } catch (error: any) {
      console.error('[FIREBASE AUTH] Facebook sign-in error:', error)
      setError(error.message || 'Failed to sign in with Facebook.')
    } finally {
      setLoading(false)
    }
  }, [auth])

  const signInWithGitHub = useCallback(async (): Promise<void> => {
    if (!auth) {
      setError('GitHub Sign-In not configured')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const provider = new GithubAuthProvider()
      provider.addScope('user:email')

      await signInWithPopup(auth, provider)
      console.log('[FIREBASE AUTH] GitHub sign-in successful')
    } catch (error: any) {
      console.error('[FIREBASE AUTH] GitHub sign-in error:', error)
      setError(error.message || 'Failed to sign in with GitHub.')
    } finally {
      setLoading(false)
    }
  }, [auth])

  const sendVerificationEmail = useCallback(async (): Promise<void> => {
    if (!user || !auth) {
      setError('No authenticated user')
      return
    }

    try {
      await sendEmailVerification(user)
      console.log('[FIREBASE AUTH] Verification email sent')
    } catch (error: any) {
      console.error('[FIREBASE AUTH] Send verification email error:', error)
      setError(error.message || 'Failed to send verification email.')
    }
  }, [user, auth])

  const sendPasswordReset = useCallback(async (email: string): Promise<void> => {
    if (!auth) {
      setError('Authentication not initialized')
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      console.log('[FIREBASE AUTH] Password reset email sent')
    } catch (error: any) {
      console.error('[FIREBASE AUTH] Send password reset error:', error)
      setError(error.message || 'Failed to send password reset email.')
    }
  }, [auth])

  const updateUserProfile = useCallback(async (data: { displayName?: string; photoURL?: string }): Promise<void> => {
    if (!user || !auth) {
      setError('No authenticated user')
      return
    }

    try {
      await updateProfile(user, data)
      console.log('[FIREBASE AUTH] Profile updated successfully')
    } catch (error: any) {
      console.error('[FIREBASE AUTH] Update profile error:', error)
      setError(error.message || 'Failed to update profile.')
    }
  }, [user, auth])

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!user) {
      return null
    }

    try {
      return await user.getIdToken()
    } catch (error) {
      console.error('[FIREBASE AUTH] Get ID token error:', error)
      return null
    }
  }, [user])

  const debug = useCallback((): void => {
    debugFirebaseConfig()
    console.log('[FIREBASE AUTH] Debug info:', {
      hasUser: !!user,
      loading,
      hasError: !!error,
      errorMessage: error,
      userId: user?.uid,
      userEmail: user?.email,
      emailVerified: user?.emailVerified,
      authInitialized: !!auth
    })
  }, [user, loading, error, auth])

  return {
    // User state
    user,
    loading,
    error,

    // Authentication methods
    signIn,
    signUp,
    signOut,

    // OAuth methods
    signInWithGoogle,
    signInWithFacebook,
    signInWithGitHub,

    // Utility methods
    sendVerificationEmail,
    sendPasswordReset,
    updateUserProfile,

    // Token management
    getIdToken,

    // Debug
    debug
  }
}

/**
 * Hook for accessing Firebase ID token for API calls
 */
export function useFirebaseToken(): () => Promise<string | null> {
  const { getIdToken, user } = useFirebaseAuth()

  return useCallback(async () => {
    if (!user) {
      console.warn('[FIREBASE AUTH] Cannot get token: no authenticated user')
      return null
    }

    return await getIdToken()
  }, [getIdToken, user])
}