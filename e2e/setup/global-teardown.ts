/**
 * Playwright Global Teardown
 * Runs after all tests to clean up test environment
 */

import { FullConfig } from '@playwright/test'
import { clearTestDatabase } from '../seed-test-database-simple.js'

async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Running Playwright Global Teardown...\n')

  // Option: Keep test data for inspection (comment out to preserve)
  // Uncomment the following to clear test data after tests:
  /*
  try {
    await clearTestDatabase()
    console.log('✅ Test database cleared\n')
  } catch (error) {
    console.error('❌ Failed to clear test database:', error)
  }
  */

  console.log('🏁 Global teardown completed\n')
}

export default globalTeardown
