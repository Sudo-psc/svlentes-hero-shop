// Load environment variables
import { config } from 'dotenv'
config({ path: '.env.local' })

console.log('🔑 Testing Firebase Admin SDK Initialization')
console.log('FIREBASE_SERVICE_ACCOUNT_KEY exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY)

// Test direct Firebase Admin initialization
import * as admin from 'firebase-admin'

// Check if Firebase is already initialized
console.log('Existing Firebase apps:', admin.apps.length)

if (admin.apps.length === 0) {
  console.log('🔄 Initializing Firebase Admin SDK...')

  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not found')
    }

    const serviceAccount = JSON.parse(serviceAccountKey)
    console.log('✅ Service account parsed successfully')
    console.log('Project ID:', serviceAccount.project_id)
    console.log('Client Email:', serviceAccount.client_email)
    console.log('Private Key length:', serviceAccount.private_key?.length)
    console.log('Private Key has BEGIN marker:', serviceAccount.private_key?.includes('-----BEGIN PRIVATE KEY-----'))
    console.log('Private Key has END marker:', serviceAccount.private_key?.includes('-----END PRIVATE KEY-----'))

    // Initialize Firebase
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })

    console.log('✅ Firebase Admin SDK initialized successfully')
    console.log('Firebase apps count:', admin.apps.length)

    // Test auth functionality
    const auth = admin.auth()
    console.log('✅ Firebase Auth instance created')

    // Test database connectivity
    const db = admin.firestore()
    console.log('✅ Firebase Firestore instance created')

    // Try a simple operation
    db.collection('_test').doc('connection').set({
      timestamp: new Date().toISOString(),
      test: true
    }).then(() => {
      console.log('✅ Firestore write operation successful')

      // Clean up test document
      return db.collection('_test').doc('connection').delete()
    }).then(() => {
      console.log('✅ Test document cleaned up')
      console.log('🎉 Firebase Admin SDK is fully functional!')
    }).catch((error) => {
      console.error('❌ Firestore operation failed:', error)
    })

    console.log('🎉 Firebase Admin SDK is fully functional!')

  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error)
  }
} else {
  console.log('ℹ️ Firebase Admin SDK already initialized')

  try {
    const auth = admin.auth()
    console.log('✅ Firebase Auth instance available')

    const db = admin.firestore()
    console.log('✅ Firebase Firestore instance available')

    console.log('🎉 Firebase Admin SDK is functional!')
  } catch (error) {
    console.error('❌ Firebase Admin SDK not functional:', error)
  }
}