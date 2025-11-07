import * as admin from 'firebase-admin'
// Initialize Firebase Admin SDK (singleton pattern)
// Only initialize if we have valid credentials (skip during build)
const hasCredentials =
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
  (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL)

/**
 * Secure Firebase Admin initialization
 *
 * SECURITY NOTE: Never log or expose private key patterns.
 * Let Firebase Admin SDK handle key validation internally.
 */
function validateFirebaseCredentials(): any | null {
  try {
    // Validate credentials without exposing key patterns
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)

      // Validate structure without key pattern matching
      if (!parsed.private_key || !parsed.client_email || !parsed.project_id) {
        console.error('[Firebase Admin] Invalid service account structure')
        return null
      }

      // Basic security checks without exposing patterns
      if (typeof parsed.private_key !== 'string' || parsed.private_key.length < 100) {
        console.error('[Firebase Admin] Invalid private key format')
        return null
      }

      return parsed
    }

    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')

      // Security validation without pattern exposure
      if (typeof privateKey !== 'string' || privateKey.length < 100) {
        console.error('[Firebase Admin] Invalid private key format')
        return null
      }

      return {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }
    }

    return null
  } catch (error) {
    // Secure error logging - never expose credential data
    console.error('[Firebase Admin] Credential validation failed', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return null
  }
}

if (!admin.apps.length && hasCredentials) {
  try {
    const serviceAccount = validateFirebaseCredentials()

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })
      console.log('[Firebase Admin] Initialized successfully')
    } else {
      console.error('[Firebase Admin] No valid credentials provided')
    }
  } catch (error) {
    console.error('[Firebase Admin] Failed to initialize', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown initialization error'
    })
  }
}
// Export functions that check initialization before use
export const adminAuth = admin.apps.length > 0 ? admin.auth() : null
export const adminDb = admin.apps.length > 0 ? admin.firestore() : null
export const adminMessaging = admin.apps.length > 0 ? admin.messaging() : null
export default admin