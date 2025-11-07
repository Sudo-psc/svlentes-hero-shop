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
import { getPerformance, Performance } from "firebase/performance"
import { getRemoteConfig, RemoteConfig } from "firebase/remote-config"

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

  // Validate API key format
  if (!config.apiKey?.startsWith('AIza')) {
    console.error('[FIREBASE] Invalid API key format:', config.apiKey?.substring(0, 10) + '...')
    throw new Error('Firebase API key appears to be invalid')
  }

  // Log configuration (without sensitive data)
  console.log('[FIREBASE] Configuration validated:', {
    projectId: config.projectId,
    authDomain: config.authDomain,
    hasApiKey: !!config.apiKey,
    hasAppId: !!config.appId,
    hasMeasurementId: !!config.measurementId
  })
}

/**
 * Firebase Client Services Interface
 */
export interface FirebaseServices {
  app: FirebaseApp
  auth: Auth
  analytics?: Analytics
  firestore?: Firestore
  performance?: Performance
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
  validateFirebaseConfig(firebaseConfig)

  // Use existing app or create new one (singleton pattern)
  const existingApps = getApps()
  const app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig)

  // Initialize Firebase services
  const auth = getAuth(app)
  let analytics: Analytics | undefined
  let firestore: Firestore | undefined
  let performance: Performance | undefined
  let remoteConfig: RemoteConfig | undefined

  // Initialize Analytics (only in production)
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app)
      console.log('[FIREBASE] Analytics initialized')
    } catch (error) {
      console.warn('[FIREBASE] Analytics initialization failed:', error)
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
    remoteConfig.settings = {
      fetchTimeMillis: 60000, // 1 minute
      minimumFetchIntervalMillis: 300000, // 5 minutes
    }
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
    firebaseServices = initializeFirebaseClient()
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