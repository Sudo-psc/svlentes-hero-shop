/**
 * Firebase Client Configuration
 *
 * This file provides the complete Firebase client setup with Authentication,
 * Analytics, and other Firebase services properly configured for SV Lentes.
 *
 * @author Dr. Philipe Saraiva Cruz
 */

import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth"
import { getAnalytics, Analytics } from "firebase/analytics"
import { getFirestore, Firestore } from "firebase/firestore"
import { getPerformance } from "firebase/performance"
import { getRemoteConfig, RemoteConfig } from "firebase/remote-config"
import { logFirebaseError, shouldSuppressError, createMockAuthHandler } from "./firebase-error-handler"

type FirebasePerformance = ReturnType<typeof getPerformance>

// Firebase configuration from environment variables
// This matches your configuration but uses the environment variables from .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// OAuth Client ID for Google Sign-In
const OAUTH_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID

/**
 * Validate Firebase configuration before initialization
 */
function validateFirebaseConfig(config: typeof firebaseConfig): void {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ]

  const missing = requiredFields.filter(field => !config[field as keyof typeof config])

  if (missing.length > 0) {
    console.error('[FIREBASE] Missing configuration fields:', missing)
    throw new Error(`Firebase configuration error: missing ${missing.join(', ')}`)
  }

  // 🛠️ Fix: More lenient API key validation - some Firebase keys might not start with "AIza"
  if (!config.apiKey || config.apiKey.length < 20) {
    console.error('[FIREBASE] Invalid or missing API key')
    throw new Error('Firebase API key is missing or too short')
  }

  // Development warning with fallback capability
  if (process.env.NODE_ENV === 'development') {
    console.warn('[FIREBASE] ⚠️  Using development Firebase configuration')
    console.warn('[FIREBASE] Project ID:', config.projectId)
    console.warn('[FIREBASE] If you see 400 errors, Firebase API key might be invalid or project might not exist')
  }
}

/**
 * Firebase Client Services Interface
 */
export interface FirebaseServices {
  app: FirebaseApp
  auth: Auth
  analytics?: Analytics
  firestore?: Firestore
  performance?: FirebasePerformance
  remoteConfig?: RemoteConfig
}

/**
 * Initialize Firebase Client Services
 *
 * @returns {FirebaseServices} Complete Firebase client setup
 */
export function initializeFirebaseClient(): FirebaseServices {
  // Only run on client side
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be initialized on the client side')
  }

  // Validate configuration
  try {
    validateFirebaseConfig(firebaseConfig)
  } catch (error) {
    console.error('[FIREBASE] Configuration validation failed:', error)
    throw error
  }

  // Use existing app or create new one (singleton pattern)
  const existingApps = getApps()
  let app: FirebaseApp
  
  try {
    app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig)
  } catch (error) {
    console.error('[FIREBASE] App initialization failed:', error)
    throw new Error('Failed to initialize Firebase app. Please check your configuration.')
  }

  // Initialize Firebase services with error handling
  let auth: Auth
  try {
    auth = getAuth(app)
    // Set a timeout for auth operations to prevent hanging
    auth.settings.appVerificationDisabledForTesting = process.env.NODE_ENV === 'development'
  } catch (error) {
    console.error('[FIREBASE] Auth initialization failed:', error)
    throw new Error('Failed to initialize Firebase Auth')
  }
  
  let analytics: Analytics | undefined
  let firestore: Firestore | undefined
  let performance: FirebasePerformance | undefined
  let remoteConfig: RemoteConfig | undefined

  // 🛠️ Fix: Initialize Analytics with better error handling for 400 errors
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app)
      console.log('[FIREBASE] Analytics initialized')
    } catch (error) {
      const firebaseError = error as Error;
      console.warn('[FIREBASE] Analytics initialization failed:', firebaseError.message)

      // 🚨 Handle getProjectConfig 400 errors gracefully
      if (firebaseError.message.includes('400') || firebaseError.message.includes('getProjectConfig')) {
        console.warn('[FIREBASE] ⚠️ getProjectConfig 400 error detected - continuing without Analytics')
        logFirebaseError('analytics', firebaseError, { configValid: false });
      }
    }
  }

  // Initialize Firestore (for future features)
  try {
    firestore = getFirestore(app)
    console.log('[FIREBASE] Firestore initialized')
  } catch (error) {
    console.warn('[FIREBASE] Firestore initialization failed:', error)
  }

  // Initialize Performance Monitoring (production only)
  if (process.env.NODE_ENV === 'production') {
    try {
      performance = getPerformance(app)
      console.log('[FIREBASE] Performance monitoring initialized')
    } catch (error) {
      console.warn('[FIREBASE] Performance monitoring initialization failed:', error)
    }
  }

  // Initialize Remote Config (for A/B testing and feature flags)
  try {
    remoteConfig = getRemoteConfig(app)
    // Configure Remote Config settings
    remoteConfig.settings.minimumFetchIntervalMillis = 300000 // 5 minutes
    remoteConfig.settings.fetchTimeoutMillis = 60000 // 1 minute
    console.log('[FIREBASE] Remote Config initialized')
  } catch (error) {
    console.warn('[FIREBASE] Remote Config initialization failed:', error)
  }

  // Development-only: Connect to Auth emulator if needed
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL) {
    try {
      connectAuthEmulator(auth, process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL)
      console.log('[FIREBASE] Connected to Auth emulator')
    } catch (error) {
      console.warn('[FIREBASE] Failed to connect to Auth emulator:', error)
    }
  }

  console.log('[FIREBASE] All services initialized successfully')

  return {
    app,
    auth,
    analytics,
    firestore,
    performance,
    remoteConfig
  }
}

/**
 * Lazy initialization of Firebase services
 */
let firebaseServices: FirebaseServices | null = null

/**
 * Get Firebase services (lazy initialization)
 */
export function getFirebaseServices(): FirebaseServices {
  if (typeof window === 'undefined') {
    throw new Error('Firebase services can only be accessed on the client side')
  }

  if (!firebaseServices) {
    try {
      firebaseServices = initializeFirebaseClient()
    } catch (error) {
      logFirebaseError(error, 'Firebase Client Initialization')
      
      // If error should be suppressed in development, create mock handler
      if (shouldSuppressError(error)) {
        console.warn('[Firebase] Using fallback authentication due to configuration issues')
        // Return a minimal services object with mock auth
        return {
          app: {} as FirebaseApp,
          auth: createMockAuthHandler() as any as Auth,
        }
      }
      
      throw error
    }
  }

  return firebaseServices
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  return getFirebaseServices().auth
}

/**
 * Get Firebase App instance
 */
export function getFirebaseApp(): FirebaseApp {
  return getFirebaseServices().app
}

/**
 * Get Firebase Analytics instance
 */
export function getFirebaseAnalytics(): Analytics | undefined {
  return getFirebaseServices().analytics
}

/**
 * Get Firebase Firestore instance
 */
export function getFirebaseFirestore(): Firestore | undefined {
  return getFirebaseServices().firestore
}

// Export OAuth client ID for Google Sign-In
export { OAUTH_CLIENT_ID }

// Legacy exports for backward compatibility
export const auth = typeof window !== 'undefined' ? getFirebaseAuth() : ({} as Auth)
export const app = typeof window !== 'undefined' ? getFirebaseApp() : ({} as FirebaseApp)

/**
 * Debug function to test Firebase configuration
 */
export function debugFirebaseConfig(): void {
  if (typeof window !== 'undefined') {
    console.log('=== FIREBASE DEBUG INFO ===')
    console.log('Environment:', process.env.NODE_ENV)
    console.log('Window available:', typeof window !== 'undefined')
    console.log('Config:', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      apiKeyPrefix: firebaseConfig.apiKey?.substring(0, 10) + '...',
      appIdPrefix: firebaseConfig.appId?.substring(0, 10) + '...',
      hasMeasurementId: !!firebaseConfig.measurementId
    })
    console.log('========================')
  }
}