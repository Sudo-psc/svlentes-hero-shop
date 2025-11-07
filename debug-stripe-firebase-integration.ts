/**
 * Debug Script: Stripe + Firebase Auth Integration
 *
 * This script systematically tests the integration between Stripe and Firebase Auth
 * to identify configuration issues, API problems, and data flow issues.
 *
 * Run with: npx tsx debug-stripe-firebase-integration.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

// Debug environment loading
console.log('🔑 Environment loading debug:')
console.log('FIREBASE_SERVICE_ACCOUNT_KEY exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY)

import { createStripeClient } from './src/lib/stripe-client'

// Clear require cache for firebase-admin to force reload
delete require.cache[require.resolve('./src/lib/firebase-admin')]
import { adminAuth } from './src/lib/firebase-admin'

interface TestResult {
  success: boolean
  message: string
  details?: any
  error?: any
}

class IntegrationDebugger {
  private results: TestResult[] = []

  async runTest(name: string, testFn: () => Promise<TestResult>): Promise<void> {
    console.log(`\n🧪 Testing: ${name}`)
    console.log('─'.repeat(50))

    try {
      const result = await testFn()
      this.results.push({ ...result, message: `${name}: ${result.message}` })

      if (result.success) {
        console.log(`✅ ${result.message}`)
        if (result.details) {
          console.log('📊 Details:', JSON.stringify(result.details, null, 2))
        }
      } else {
        console.log(`❌ ${result.message}`)
        if (result.error) {
          console.log('🔥 Error:', result.error)
        }
      }
    } catch (error) {
      const errorMsg = `${name}: Test failed with exception`
      console.log(`💥 ${errorMsg}`)
      console.log('🔥 Error:', error)
      this.results.push({
        success: false,
        message: errorMsg,
        error
      })
    }
  }

  printSummary(): void {
    console.log('\n' + '='.repeat(60))
    console.log('📋 INTEGRATION DEBUG SUMMARY')
    console.log('='.repeat(60))

    const passed = this.results.filter(r => r.success).length
    const failed = this.results.filter(r => !r.success).length

    console.log(`\n✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📊 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`)

    if (failed > 0) {
      console.log('\n🔥 FAILED TESTS:')
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`  ❌ ${result.message}`)
        if (result.error) {
          console.log(`     Error: ${result.error}`)
        }
      })
    }
  }
}

async function main() {
  const integrationDebugger = new IntegrationDebugger()

  // Environment Variables Check
  await integrationDebugger.runTest('Environment Variables', async (): Promise<TestResult> => {
    const requiredEnvVars = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_API_KEY'
    ]

    const missing = requiredEnvVars.filter(varName => !process.env[varName])
    const present = requiredEnvVars.filter(varName => process.env[varName])

    if (missing.length > 0) {
      return {
        success: false,
        message: 'Missing required environment variables',
        details: { missing, present }
      }
    }

    return {
      success: true,
      message: 'All required environment variables are present',
      details: { present }
    }
  })

  // Firebase Admin SDK Initialization
  await integrationDebugger.runTest('Firebase Admin SDK', async (): Promise<TestResult> => {
    if (!adminAuth) {
      return {
        success: false,
        message: 'Firebase Admin SDK not initialized',
        details: {
          hasApps: require('firebase-admin').apps.length,
          envVars: {
            FIREBASE_SERVICE_ACCOUNT_KEY: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
            FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
            FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL
          }
        }
      }
    }

    return {
      success: true,
      message: 'Firebase Admin SDK initialized successfully',
      details: { appCount: require('firebase-admin').apps.length }
    }
  })

  // Stripe Client Initialization
  await integrationDebugger.runTest('Stripe Client', async (): Promise<TestResult> => {
    const stripeClient = createStripeClient()

    if (!stripeClient) {
      return {
        success: false,
        message: 'Stripe client not initialized',
        details: {
          hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
          keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) + '...'
        }
      }
    }

    // Test Stripe API connectivity
    try {
      const account = await stripeClient.accounts.retrieve()
      return {
        success: true,
        message: 'Stripe client initialized and API reachable',
        details: {
          accountId: account.id,
          country: account.country,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Stripe client initialized but API test failed',
        error
      }
    }
  })

  // API Version Consistency Check
  await integrationDebugger.runTest('API Version Consistency', async (): Promise<TestResult> => {
    const stripeClient = createStripeClient()
    if (!stripeClient) {
      return {
        success: false,
        message: 'Cannot check API versions - Stripe not initialized'
      }
    }

    // Check different API versions used across the codebase
    const apiVersions = [
      '2024-11-20.acacia', // stripe-client.ts
      '2025-09-30.clover'  // webhooks/stripe/route.ts
    ]

    const webhookVersion = '2025-09-30.clover'
    const clientVersion = (stripeClient as any)._apiVersion
    const clientApiDate = clientVersion?.split('.')[0]

    if (clientApiDate !== '2025') {
      return {
        success: false,
        message: 'API version mismatch - client using older version',
        details: {
          clientVersion,
          webhookVersion,
          recommendation: 'Update stripe-client.ts to use 2025 API version'
        }
      }
    }

    return {
      success: true,
      message: 'API versions are consistent',
      details: { clientVersion, webhookVersion }
    }
  })

  // Test Firebase Token Verification (Mock)
  await integrationDebugger.runTest('Firebase Auth Token Structure', async (): Promise<TestResult> => {
    // This tests the token verification logic structure
    const { verifyAuthToken } = await import('./src/lib/api-auth')

    if (!verifyAuthToken) {
      return {
        success: false,
        message: 'verifyAuthToken function not found'
      }
    }

    return {
      success: true,
      message: 'Firebase token verification function is available',
      details: { functionType: typeof verifyAuthToken }
    }
  })

  // Test Stripe Subscription API Structure
  await integrationDebugger.runTest('Stripe Subscription API Structure', async (): Promise<TestResult> => {
    const stripeClient = createStripeClient()
    if (!stripeClient) {
      return {
        success: false,
        message: 'Cannot test API structure - Stripe not initialized'
      }
    }

    // Test if we can list prices (basic API connectivity)
    try {
      const prices = await stripeClient.prices.list({ limit: 1 })
      return {
        success: true,
        message: 'Stripe API structure is functional',
        details: {
          priceCount: prices.data.length,
          hasMore: prices.has_more,
          apiType: 'prices.list'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Stripe API structure test failed',
        error
      }
    }
  })

  // Webhook Configuration Check
  await integrationDebugger.runTest('Webhook Configuration', async (): Promise<TestResult> => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL + '/api/webhooks/stripe'

    if (!webhookSecret) {
      return {
        success: false,
        message: 'Stripe webhook secret not configured',
        details: { webhookUrl }
      }
    }

    if (!webhookSecret.startsWith('whsec_')) {
      return {
        success: false,
        message: 'Invalid webhook secret format',
        details: { prefix: webhookSecret.substring(0, 5) + '...' }
      }
    }

    return {
      success: true,
      message: 'Webhook configuration appears valid',
      details: { webhookUrl, secretPrefix: webhookSecret.substring(0, 10) + '...' }
    }
  })

  // Database Connection Check (Prisma)
  await integrationDebugger.runTest('Database Connection', async (): Promise<TestResult> => {
    try {
      const { prisma } = await import('./src/lib/prisma')

      // Test basic database connectivity
      await prisma.$queryRaw`SELECT 1`

      return {
        success: true,
        message: 'Database connection successful',
        details: { connectionType: 'PostgreSQL via Prisma' }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Database connection failed',
        error
      }
    }
  })

  integrationDebugger.printSummary()

  // Generate recommendations
  console.log('\n📝 RECOMMENDATIONS:')
  console.log('─'.repeat(30))

  const failedTests = integrationDebugger.results.filter(r => !r.success)

  if (failedTests.length === 0) {
    console.log('🎉 All tests passed! The integration appears to be working correctly.')
    console.log('\nNext steps:')
    console.log('1. Test the full user flow: Firebase Auth → Stripe Checkout → Webhook Processing')
    console.log('2. Run E2E tests: npm run test:e2e')
    console.log('3. Test webhook delivery in Stripe Dashboard')
  } else {
    console.log('🔧 Address the following issues:')
    failedTests.forEach(test => {
      console.log(`• ${test.message}`)
    })

    console.log('\n📚 Useful commands:')
    console.log('• Set environment variables: cp .env.local.example .env.local')
    console.log('• Test Stripe integration: npm run test:stripe')
    console.log('• Run E2E tests: npm run test:e2e')
    console.log('• Check logs: journalctl -u svlentes-nextjs -f')
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(console.error)
}

export { IntegrationDebugger }