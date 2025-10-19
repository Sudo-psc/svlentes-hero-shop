#!/usr/bin/env ts-node

/**
 * Test MCP SendPulse Fallback
 *
 * This script tests the MCP SendPulse client fallback mechanism
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.sendpulse' })
dotenv.config({ path: '.env.local' })

import { mcpSendPulseClient } from '../src/lib/mcp-sendpulse-client.js'

const PHONE = '553299929969' // Dr. Philipe Saraiva
const BOT_ID = process.env.SENDPULSE_BOT_ID!

console.log('\n🔄 MCP SendPulse Fallback Test')
console.log('=' .repeat(50))
console.log(`Phone: ${PHONE}`)
console.log(`Bot ID: ${BOT_ID}`)
console.log('=' .repeat(50))

async function testMCPFallback() {
  try {
    if (!BOT_ID) {
      throw new Error('SENDPULSE_BOT_ID not configured')
    }

    console.log('\n📡 Testing MCP availability...')

    if (!mcpSendPulseClient.isAvailable()) {
      console.log('❌ MCP SendPulse client is NOT available')
      console.log('   Check if MCP server is configured in Claude Code settings')
      return
    }

    console.log('✅ MCP SendPulse client is available')

    console.log('\n📤 Sending test message via MCP...')

    const testMessage = `🔄 MCP Test - ${new Date().toISOString()}\n\nTesting MCP fallback mechanism from automated script.`

    const result = await mcpSendPulseClient.sendMessageFallback({
      bot_id: BOT_ID,
      phone: PHONE,
      message: testMessage
    })

    console.log('\n📊 Result:')
    console.log('  Success:', result.success)
    console.log('  Method:', result.method)
    if (result.error) {
      console.log('  Error:', result.error)
    }

    if (result.success) {
      console.log('\n✅ MCP fallback test PASSED')
      console.log('   Message should appear in WhatsApp conversation')
    } else {
      console.log('\n❌ MCP fallback test FAILED')
      console.log('   Error:', result.error)
    }

  } catch (error) {
    console.error('\n❌ Test failed with exception:', error instanceof Error ? error.message : error)
    throw error
  }
}

// Execute
testMCPFallback()
  .then(() => {
    console.log('\n' + '='.repeat(50))
    console.log('Test completed')
    console.log('='.repeat(50) + '\n')
    process.exit(0)
  })
  .catch(error => {
    console.error('\nTest failed:', error)
    process.exit(1)
  })
