#!/usr/bin/env ts-node
/**
 * Test MCP SendPulse Integration
 *
 * Tests the hybrid SendPulse integration (Direct API + MCP fallback)
 *
 * Usage:
 *   npm run test:mcp
 *   OR
 *   ts-node scripts/test-mcp-integration.ts
 */

import * as dotenv from 'dotenv'
import { mcpSendPulseClient } from '../src/lib/mcp-sendpulse-client'
import { sendPulseAdminTools } from '../src/lib/sendpulse-admin-tools'

// Load environment variables
dotenv.config({ path: '.env.local' })

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  duration: number
  error?: string
  details?: any
}

const results: TestResult[] = []

async function runTest(
  name: string,
  testFn: () => Promise<any>
): Promise<void> {
  const start = Date.now()

  try {
    console.log(`\n🧪 Testing: ${name}`)

    const result = await testFn()
    const duration = Date.now() - start

    results.push({
      name,
      status: 'PASS',
      duration,
      details: result
    })

    console.log(`✅ PASS (${duration}ms)`)
    if (result) {
      console.log(JSON.stringify(result, null, 2))
    }

  } catch (error) {
    const duration = Date.now() - start

    results.push({
      name,
      status: 'FAIL',
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    console.log(`❌ FAIL (${duration}ms)`)
    console.error(error instanceof Error ? error.message : error)
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  SendPulse MCP Integration Test Suite')
  console.log('═══════════════════════════════════════════════════════\n')

  const botId = process.env.SENDPULSE_BOT_ID

  if (!botId) {
    console.error('❌ SENDPULSE_BOT_ID not configured in .env.local')
    process.exit(1)
  }

  console.log(`Bot ID: ${botId}`)
  console.log(`MCP URL: ${process.env.MCP_SENDPULSE_URL || 'https://mcp.sendpulse.com/mcp'}`)

  // Test 1: MCP Availability
  await runTest('MCP Availability Check', async () => {
    const available = mcpSendPulseClient.isAvailable()
    if (!available) {
      throw new Error('MCP not configured - check SENDPULSE_APP_ID and SENDPULSE_APP_SECRET')
    }
    return { available: true }
  })

  // Test 2: List MCP Tools
  await runTest('List Available MCP Tools', async () => {
    const tools = await mcpSendPulseClient.listTools()
    return {
      toolCount: tools.length,
      tools: tools.map(t => t.name)
    }
  })

  // Test 3: Get Bots List
  await runTest('Get Bots List', async () => {
    const bots = await mcpSendPulseClient.getBots()
    return {
      botCount: bots.length,
      bots: bots.map((b: any) => ({
        id: b.id,
        name: b.name,
        channel: b.channel
      }))
    }
  })

  // Test 4: Get Bot Statistics
  await runTest('Get Bot Statistics', async () => {
    const stats = await mcpSendPulseClient.getBotStats(botId)
    return stats
  })

  // Test 5: Admin Tools - MCP Availability
  await runTest('Admin Tools - Check MCP Availability', async () => {
    const available = await sendPulseAdminTools.checkMCPAvailability()
    return { mcpAvailable: available }
  })

  // Test 6: Admin Tools - Bot Health Report
  await runTest('Admin Tools - Bot Health Report', async () => {
    const health = await sendPulseAdminTools.getBotHealthReport(botId)
    return {
      status: health.status,
      metrics: health.metrics,
      issuesCount: health.issues.length,
      recommendationsCount: health.recommendations.length
    }
  })

  // Test 7: Admin Tools - Get Analytics
  await runTest('Admin Tools - Get Analytics Report', async () => {
    const analytics = await sendPulseAdminTools.getAnalyticsReport(botId)
    return analytics
  })

  // Test 8: Search Subscribers (if any exist)
  await runTest('Search Subscribers', async () => {
    const subscribers = await mcpSendPulseClient.searchSubscribers({
      bot_id: botId,
      limit: 5
    })
    return {
      count: subscribers.length,
      subscribers: subscribers.slice(0, 3).map((s: any) => ({
        id: s.id,
        phone: s.phone ? `${s.phone.substring(0, 8)}****` : 'N/A',
        status: s.is_active ? 'active' : 'inactive'
      }))
    }
  })

  // Test 9: Troubleshoot Delivery (example phone)
  await runTest('Troubleshoot Delivery (Test Phone)', async () => {
    const testPhone = '5533999898026' // SVLentes WhatsApp
    const troubleshooting = await mcpSendPulseClient.troubleshootDelivery({
      bot_id: botId,
      phone: testPhone
    })
    return {
      phone: testPhone,
      botAccessible: !!troubleshooting.botStatus,
      subscriberExists: troubleshooting.subscriberExists,
      recommendationsCount: troubleshooting.recommendations.length,
      recommendations: troubleshooting.recommendations
    }
  })

  // Print Summary
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  Test Results Summary')
  console.log('═══════════════════════════════════════════════════════\n')

  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const skipped = results.filter(r => r.status === 'SKIP').length
  const total = results.length

  console.log(`Total Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏭️  Skipped: ${skipped}`)

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`)
    })
  }

  console.log('\n═══════════════════════════════════════════════════════\n')

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
main().catch(error => {
  console.error('\n🚨 Test suite failed:', error)
  process.exit(1)
})
