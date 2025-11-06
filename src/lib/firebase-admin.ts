import * as admin from 'firebase-admin'

// Initialize Firebase Admin SDK with fallback for development
const hasCredentials =
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
  (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL)

if (!admin.apps.length && hasCredentials) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }

    // Validate if we have real credentials (not placeholders)
    if (serviceAccount.private_key.includes('REPLACE_WITH_NEW') ||
        serviceAccount.private_key_id.includes('REPLACE_WITH_NEW')) {
      console.warn('[Firebase Admin] Placeholder credentials detected - using development mode')
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })
      console.log('[Firebase Admin] Successfully initialized')
    }
  } catch (error) {
    console.warn('[Firebase Admin] Failed to initialize:', error)
  }
}

// Development mode fallback - create mock admin functions
const createMockAdmin = () => {
  console.warn('[Firebase Admin] Using development mode - some features will be limited')
  return {
    auth: () => ({
      verifyIdToken: async (token: string) => {
        // Mock user for development - extract from JWT or use default
        if (token.startsWith('mock_')) {
          return {
            uid: token.replace('mock_', ''),
            email: 'user@svlentes.com.br',
            displayName: 'Development User'
          }
        }
        throw new Error('Invalid token in development mode')
      }
    }),
    firestore: () => null,
    messaging: () => null
  }
}

// Export functions with fallback
export const adminAuth = admin.apps.length > 0 ? admin.auth() : createMockAdmin().auth()
export const adminDb = admin.apps.length > 0 ? admin.firestore() : null
export const adminMessaging = admin.apps.length > 0 ? admin.messaging() : null

// Export initialization status
export const isFirebaseAdminInitialized = admin.apps.length > 0

export default admin