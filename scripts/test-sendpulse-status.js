#!/usr/bin/env node

/**
 * Test SendPulse Contact Status and MCP Fallback
 *
 * This script:
 * 1. Authenticates with SendPulse OAuth API
 * 2. Queries contact status to check is_chat_opened flag
 * 3. Tests direct API message sending
 * 4. Tests MCP fallback mechanism
 */

require('dotenv').config({ path: '.env.sendpulse' })
require('dotenv').config({ path: '.env.local' })

const https = require('https')

// Configuration from environment
const CONTACT_ID = process.env.TEST_CONTACT_ID || '68f44f595016183dcf031c27' // Most recent from logs
const PHONE = '553299929969' // Dr. Philipe Saraiva
const BOT_ID = process.env.SENDPULSE_BOT_ID
const USER_ID = process.env.SENDPULSE_CLIENT_ID
const SECRET = process.env.SENDPULSE_CLIENT_SECRET

console.log('\n🔍 SendPulse Status Investigation')
console.log('=' .repeat(50))
console.log(`Contact ID: ${CONTACT_ID}`)
console.log(`Phone: ${PHONE}`)
console.log(`Bot ID: ${BOT_ID || 'NOT SET'}`)
console.log(`User ID: ${USER_ID || 'NOT SET'}`)
console.log('=' .repeat(50))

if (!USER_ID || !SECRET) {
  console.error('\n❌ Missing credentials: SENDPULSE_USER_ID or SENDPULSE_SECRET')
  process.exit(1)
}

// Helper: Make HTTPS request
function httpsRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) })
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data })
        }
      })
    })

    req.on('error', reject)
    if (postData) req.write(JSON.stringify(postData))
    req.end()
  })
}

// Step 1: Get OAuth token
async function getAccessToken() {
  console.log('\n📡 Step 1: Getting OAuth access token...')

  const response = await httpsRequest({
    hostname: 'api.sendpulse.com',
    path: '/oauth/access_token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, {
    grant_type: 'client_credentials',
    client_id: USER_ID,
    client_secret: SECRET
  })

  if (response.statusCode === 200 && response.data.access_token) {
    console.log('✅ Access token obtained')
    return response.data.access_token
  } else {
    console.error('❌ Failed to get access token:', response)
    throw new Error('OAuth failed')
  }
}

// Step 2a: List all contacts to find the right one
async function listContacts(accessToken) {
  console.log('\n📋 Step 2a: Listing WhatsApp contacts...')

  const response = await httpsRequest({
    hostname: 'api.sendpulse.com',
    path: `/whatsapp/contacts?bot_id=${BOT_ID}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (response.statusCode === 200 && response.data.data) {
    console.log(`✅ Found ${response.data.data.length} contacts`)

    // Debug: show first contact structure
    if (response.data.data.length > 0) {
      console.log('\n🔍 Debug - First contact structure:')
      console.log(JSON.stringify(response.data.data[0], null, 2))
    }

    // Find contact by phone (channel_data.phone)
    const phoneNum = parseInt(PHONE)
    const contact = response.data.data.find(c => c.channel_data && c.channel_data.phone === phoneNum)

    if (contact) {
      console.log('\n📊 Contact found:')
      console.log('  ID:', contact.id)
      console.log('  Phone:', contact.channel_data.phone)
      console.log('  Name:', contact.channel_data.name || 'N/A')
      console.log('  Status:', contact.status)
      console.log('  📱 is_chat_opened:', contact.is_chat_opened)
      console.log('  🕐 Last activity:', contact.last_activity_at || 'N/A')

      if (contact.is_chat_opened) {
        console.log('\n✅ 24-hour window is OPEN - Can send text messages')
      } else {
        console.log('\n⚠️ 24-hour window is CLOSED - Only templates allowed')
        console.log('  User must send a message to reopen the window')
      }

      return contact
    } else {
      console.log(`\n⚠️ Contact ${PHONE} not found in list`)
      console.log('  Available contacts:')
      response.data.data.forEach((c, i) => {
        const phone = c.channel_data ? c.channel_data.phone : 'no-phone'
        const name = c.channel_data && c.channel_data.name ? c.channel_data.name : 'unnamed'
        console.log(`    ${i+1}. ${phone} (${name}) - ID: ${c.id} - is_chat_opened: ${c.is_chat_opened}`)
      })
      throw new Error('Contact not found')
    }
  } else {
    console.error('❌ Failed to list contacts:', response)
    throw new Error('Contact listing failed')
  }
}

// Step 2: Get contact status (deprecated - using list instead)
async function getContactStatus(accessToken) {
  console.log('\n📋 Step 2: Querying contact status...')

  const response = await httpsRequest({
    hostname: 'api.sendpulse.com',
    path: `/whatsapp/contacts/${CONTACT_ID}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (response.statusCode === 200) {
    console.log('✅ Contact status retrieved')
    console.log('\n📊 Contact Details:')
    console.log('  Phone:', response.data.phone)
    console.log('  Name:', response.data.name || 'N/A')
    console.log('  Status:', response.data.status)
    console.log('  📱 is_chat_opened:', response.data.is_chat_opened)
    console.log('  🕐 Last message:', response.data.last_message_at || 'N/A')

    if (response.data.is_chat_opened) {
      console.log('\n✅ 24-hour window is OPEN - Can send text messages')
    } else {
      console.log('\n⚠️ 24-hour window is CLOSED - Only templates allowed')
      console.log('  User must send a message to reopen the window')
    }

    return response.data
  } else {
    console.error('❌ Failed to get contact status:', response)
    throw new Error('Contact query failed')
  }
}

// Step 3: Test direct API message (only if window open)
async function testDirectMessage(accessToken, contactStatus) {
  if (!contactStatus.is_chat_opened) {
    console.log('\n⏭️ Step 3: Skipping direct message test (window closed)')
    return { skipped: true, reason: 'window_closed' }
  }

  console.log('\n📤 Step 3: Testing direct API message send...')

  const testMessage = `🤖 Test message - ${new Date().toISOString()}\n\nThis is a test from the status investigation script.`

  const response = await httpsRequest({
    hostname: 'api.sendpulse.com',
    path: '/whatsapp/messages/send',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    bot_id: BOT_ID,
    phone: PHONE,
    message: {
      type: 'text',
      text: {
        body: testMessage
      }
    }
  })

  if (response.statusCode === 200) {
    console.log('✅ Direct API message sent successfully')
    return { success: true, method: 'direct' }
  } else {
    console.error('❌ Direct API message failed:', response)
    return { success: false, method: 'direct', error: response.data }
  }
}

// Step 4: Test MCP fallback (if available)
async function testMCPFallback() {
  console.log('\n🔄 Step 4: Testing MCP fallback...')

  // Check if MCP SendPulse client is available
  try {
    const mcpClient = require('../src/lib/mcp-sendpulse-client')

    if (mcpClient.mcpSendPulseClient.isAvailable()) {
      console.log('✅ MCP SendPulse client is available')

      const testMessage = `🤖 MCP Test - ${new Date().toISOString()}\n\nTesting MCP fallback mechanism.`

      const result = await mcpClient.mcpSendPulseClient.sendMessageFallback({
        bot_id: BOT_ID,
        phone: PHONE,
        message: testMessage
      })

      if (result.success) {
        console.log('✅ MCP fallback successful')
        return result
      } else {
        console.error('❌ MCP fallback failed:', result.error)
        return result
      }
    } else {
      console.log('⚠️ MCP SendPulse client not available')
      return { success: false, method: 'mcp', error: 'MCP client not configured' }
    }
  } catch (error) {
    console.error('❌ Error testing MCP:', error.message)
    return { success: false, method: 'mcp', error: error.message }
  }
}

// Main execution
async function main() {
  try {
    // Step 1: Authenticate
    const accessToken = await getAccessToken()

    // Step 2: Get contact status (via list)
    const contactStatus = await listContacts(accessToken)

    // Step 3: Test direct message (only if window open)
    const directResult = await testDirectMessage(accessToken, contactStatus)

    // Step 4: Test MCP fallback
    const mcpResult = await testMCPFallback()

    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 INVESTIGATION SUMMARY')
    console.log('='.repeat(50))
    console.log(`Contact window status: ${contactStatus.is_chat_opened ? '✅ OPEN' : '❌ CLOSED'}`)

    if (directResult.skipped) {
      console.log(`Direct API test: ⏭️ Skipped (${directResult.reason})`)
    } else {
      console.log(`Direct API test: ${directResult.success ? '✅ SUCCESS' : '❌ FAILED'}`)
    }

    console.log(`MCP fallback test: ${mcpResult.success ? '✅ SUCCESS' : '❌ FAILED'}`)

    console.log('\n💡 RECOMMENDATIONS:')
    if (!contactStatus.is_chat_opened) {
      console.log('  • Window is CLOSED - user needs to send a message first')
      console.log('  • Configure approved templates for closed window scenarios')
      console.log('  • Use MCP fallback as last resort')
    } else {
      console.log('  • Window is OPEN - direct messages should work')
      if (!directResult.success) {
        console.log('  • Direct API failed even with open window - investigate further')
      }
    }

    if (!mcpResult.success) {
      console.log('  • MCP fallback not working - check MCP server configuration')
    }

    console.log('='.repeat(50) + '\n')

  } catch (error) {
    console.error('\n❌ Investigation failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()
