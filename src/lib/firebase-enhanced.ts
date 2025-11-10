import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth'

// Enhanced Firebase configuration with better error handling
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
const OAUTH_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID || ""

// Enhanced validation
function validateFirebaseConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required fields for Firebase
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId']

  requiredFields.forEach(field => {
    const value = firebaseConfig[field as keyof typeof firebaseConfig]
    if (!value || value.trim() === '') {
      errors.push(`Missing required field: ${field}`)
    } else if (field === 'apiKey' && (value.length < 20 || !value.startsWith('AIza'))) {
      errors.push(`Invalid API key format: ${field}`)
    } else if (field === 'authDomain' && !value.includes('.firebaseapp.com')) {
      errors.push(`Invalid authDomain format: ${field} (should be *.firebaseapp.com)`)
    } else if (field === 'appId' && !value.match(/^\d+:\w+:\w+$/)) {
      errors.push(`Invalid appId format: ${field}`)
    }
  })

  // Validate OAuth client ID
  if (!OAUTH_CLIENT_ID || OAUTH_CLIENT_ID.length < 20) {
    errors.push('Missing or invalid Google OAuth Client ID')
  } else if (!OAUTH_CLIENT_ID.includes('.apps.googleusercontent.com')) {
    errors.push('Invalid Google OAuth Client ID format')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Enhanced initialization with comprehensive error handling
function initializeFirebase(): { app: FirebaseApp; auth: Auth } {
  // Only run on client side
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be initialized on the client side')
  }

  // Validate configuration first
  const validation = validateFirebaseConfig()
  if (!validation.isValid) {
    console.error('[FIREBASE] Configuration validation failed:', validation.errors)
    throw new Error(`Firebase configuration error: ${validation.errors.join(', ')}`)
  }

  console.log('[FIREBASE] Configuration validated successfully')

  try {
    // Use existing app or create new one
    let app: FirebaseApp
    if (getApps().length > 0) {
      app = getApps()[0]
      console.log('[FIREBASE] Using existing Firebase app instance')
    } else {
      app = initializeApp(firebaseConfig)
      console.log('[FIREBASE] Initialized new Firebase app')

      // Log project info (without sensitive data)
      console.log('[FIREBASE] Project:', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        appId: firebaseConfig.appId?.substring(0, 20) + '...'
      })
    }

    const auth = getAuth(app)

    // Configure auth settings
    auth.settings = {
      ...auth.settings,
      appVerificationDisabledForTesting: process.env.NODE_ENV === 'development'
    }

    // Enable debug mode in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[FIREBASE] Development mode enabled')
      // Connect to emulator if configured
      if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL) {
        try {
          connectAuthEmulator(auth, process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL)
          console.log('[FIREBASE] Connected to auth emulator')
        } catch (emulatorError) {
          console.warn('[FIREBASE] Failed to connect to auth emulator:', emulatorError)
        }
      }
    }

    return { app, auth }
  } catch (error) {
    console.error('[FIREBASE] Firebase initialization failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      config: {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        hasApiKey: !!firebaseConfig.apiKey,
        hasAppId: !!firebaseConfig.appId
      }
    })
    throw new Error(`Firebase initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Singleton instance with lazy loading
let firebaseInstances: { app: FirebaseApp; auth: Auth } | null = null
let initializationError: Error | null = null

export function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth can only be accessed on the client side')
  }

  if (initializationError) {
    // Clear the error and retry once
    initializationError = null
    firebaseInstances = null
  }

  if (!firebaseInstances) {
    try {
      firebaseInstances = initializeFirebase()
      console.log('[FIREBASE] Firebase Auth instance created successfully')
    } catch (error) {
      initializationError = error instanceof Error ? error : new Error('Unknown Firebase initialization error')
      console.error('[FIREBASE] Failed to create Firebase Auth instance:', initializationError)
      throw initializationError
    }
  }

  return firebaseInstances.auth
}

export function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    throw new Error('Firebase App can only be accessed on the client side')
  }

  if (initializationError) {
    // Clear the error and retry once
    initializationError = null
    firebaseInstances = null
  }

  if (!firebaseInstances) {
    try {
      firebaseInstances = initializeFirebase()
      console.log('[FIREBASE] Firebase App instance created successfully')
    } catch (error) {
      initializationError = error instanceof Error ? error : new Error('Unknown Firebase initialization error')
      console.error('[FIREBASE] Failed to create Firebase App instance:', initializationError)
      throw initializationError
    }
  }

  return firebaseInstances.app
}

// Export configuration for debugging
export function getFirebaseConfig() {
  return {
    ...firebaseConfig,
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId: !!firebaseConfig.projectId,
    hasAppId: !!firebaseConfig.appId,
    hasOAuthClientId: !!OAUTH_CLIENT_ID
  }
}

// Export validation function for debugging
export function debugFirebaseConfig() {
  const validation = validateFirebaseConfig()
  console.log('[FIREBASE_DEBUG] Configuration validation:', validation)
  return validation
}

// Legacy exports for backward compatibility
export const auth = typeof window !== 'undefined' ? getFirebaseAuth() : ({} as Auth)
export const app = typeof window !== 'undefined' ? getFirebaseApp() : ({} as FirebaseApp)
export { OAUTH_CLIENT_ID }

// Export utilities for error handling
export { initializeFirebase, validateFirebaseConfig }