import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// OAuth Client ID for Google Sign-In (from environment variable)
const OAUTH_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID || "541878793409-a4v5619865slilel2ssi4r7qhfd4255q.apps.googleusercontent.com"

// Validate Firebase configuration
function validateFirebaseConfig() {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ]

  const missing = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig])

  if (missing.length > 0) {
    console.error('[FIREBASE] Missing configuration fields:', missing)
    throw new Error(`Firebase configuration error: missing ${missing.join(', ')}`)
  }
}

// Initialize Firebase (singleton pattern) - Client-side only
function initializeFirebase(): { app: FirebaseApp; auth: Auth } {
  // Only run on client side
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be initialized on the client side')
  }

  // Validate configuration before initializing
  validateFirebaseConfig()

  // Use existing app or create new one
  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
  const auth = getAuth(app)

  return { app, auth }
}

// Export initialized Firebase instances (lazy initialization)
let firebaseInstances: { app: FirebaseApp; auth: Auth } | null = null

export function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth can only be accessed on the client side')
  }

  if (!firebaseInstances) {
    firebaseInstances = initializeFirebase()
  }

  return firebaseInstances.auth
}

export function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    throw new Error('Firebase App can only be accessed on the client side')
  }

  if (!firebaseInstances) {
    firebaseInstances = initializeFirebase()
  }

  return firebaseInstances.app
}

// Legacy exports for backward compatibility
export const auth = typeof window !== 'undefined' ? getFirebaseAuth() : ({} as Auth)
export const app = typeof window !== 'undefined' ? getFirebaseApp() : ({} as FirebaseApp)
export { OAUTH_CLIENT_ID }