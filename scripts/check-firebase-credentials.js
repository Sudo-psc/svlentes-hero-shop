#!/usr/bin/env node
/**
 * Firebase Admin Credentials Check
 *
 * Verifies if Firebase Admin SDK can be initialized with current credentials
 * Run: node scripts/check-firebase-credentials.js
 */

require('dotenv').config({ path: '.env.local' })

console.log('🔍 Checking Firebase Admin credentials...\n')

// Check environment variables
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
const privateKey = process.env.FIREBASE_PRIVATE_KEY
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

console.log('📋 Environment Variables:')
console.log('  NEXT_PUBLIC_FIREBASE_PROJECT_ID:', projectId ? '✅' : '❌')
console.log('  FIREBASE_SERVICE_ACCOUNT_KEY:', serviceAccountKey ? '✅' : '❌')
console.log('  FIREBASE_CLIENT_EMAIL:', clientEmail ? '✅' : '❌')
console.log('  FIREBASE_PRIVATE_KEY:', privateKey ? '✅ (truncated)' : '❌')
console.log()

// Determine credential source
const hasServiceAccountKey = !!serviceAccountKey
const hasIndividualKeys = !!(privateKey && clientEmail)

if (!hasServiceAccountKey && !hasIndividualKeys) {
  console.error('❌ ERROR: No Firebase Admin credentials found!\n')
  console.log('You need to add ONE of the following to .env.local:\n')
  console.log('Option 1: FIREBASE_SERVICE_ACCOUNT_KEY (JSON format)')
  console.log('Option 2: FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY\n')
  console.log('See FIREBASE_SETUP.md for detailed instructions.')
  process.exit(1)
}

console.log('✅ Credential source detected:', hasServiceAccountKey ? 'FIREBASE_SERVICE_ACCOUNT_KEY' : 'Individual keys')
console.log()

// Try to parse and validate
try {
  if (hasServiceAccountKey) {
    console.log('🔍 Validating FIREBASE_SERVICE_ACCOUNT_KEY...')
    const serviceAccount = JSON.parse(serviceAccountKey)

    const requiredFields = ['project_id', 'private_key', 'client_email']
    const missingFields = requiredFields.filter(field => !serviceAccount[field])

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields.join(', '))
      process.exit(1)
    }

    console.log('  project_id:', serviceAccount.project_id)
    console.log('  client_email:', serviceAccount.client_email)
    console.log('  private_key:', serviceAccount.private_key ? '✅ Present' : '❌ Missing')
  } else {
    console.log('🔍 Validating individual keys...')
    console.log('  client_email:', clientEmail)
    console.log('  private_key format:', privateKey?.includes('BEGIN PRIVATE KEY') ? '✅ Valid' : '❌ Invalid')

    if (!privateKey?.includes('BEGIN PRIVATE KEY')) {
      console.error('\n❌ ERROR: FIREBASE_PRIVATE_KEY does not appear to be a valid private key')
      console.log('It should start with: -----BEGIN PRIVATE KEY-----\\n')
      process.exit(1)
    }
  }

  console.log('\n✅ All credentials look valid!')
  console.log('\n📝 Next steps:')
  console.log('  1. Restart the application: systemctl restart svlentes-nextjs')
  console.log('  2. Check logs: journalctl -u svlentes-nextjs -n 50')
  console.log('  3. Test endpoint: curl -I http://localhost:5000/api/assinante/subscription')
  console.log('     Expected: 401 (Unauthorized) instead of 503 (Service Unavailable)')

} catch (error) {
  console.error('\n❌ ERROR parsing credentials:', error.message)

  if (hasServiceAccountKey) {
    console.log('\nFIREBASE_SERVICE_ACCOUNT_KEY must be valid JSON.')
    console.log('Make sure it\'s wrapped in single quotes and properly escaped.')
  }

  process.exit(1)
}
