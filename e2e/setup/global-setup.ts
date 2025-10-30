/**
 * Playwright Global Setup
 * Runs before all tests to prepare test environment
 */

import { FullConfig } from '@playwright/test'
import { seedTestDatabase } from '../seed-test-database-simple.js'
import dotenv from 'dotenv'
import path from 'path'

async function globalSetup(config: FullConfig) {
  console.log('\n🔧 Running Playwright Global Setup...\n')

  // Load test environment variables
  dotenv.config({ path: path.resolve(__dirname, '../../.env.test') })
  console.log('✅ Loaded test environment variables')

  // Seed test database
  try {
    console.log('\n🌱 Seeding test database...')
    await seedTestDatabase()
    console.log('✅ Test database seeded successfully\n')
  } catch (error) {
    console.error('❌ Failed to seed test database:', error)
    throw error
  }

  console.log('🎉 Global setup completed\n')
}

export default globalSetup
