import * as admin from 'firebase-admin'

// Initialize Firebase Admin SDK (singleton pattern)
// Only initialize if we have credentials (skip during build)
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

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  } catch (error) {
    console.warn('[Firebase Admin] Failed to initialize:', error)
  }
}

// Export functions that check initialization before use
export const adminAuth = admin.apps.length > 0 ? admin.auth() : null
export const adminDb = admin.apps.length > 0 ? admin.firestore() : null
export const adminMessaging = admin.apps.length > 0 ? admin.messaging() : null

export default admin
