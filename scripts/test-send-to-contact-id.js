#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

const SENDPULSE_CLIENT_ID = process.env.SENDPULSE_CLIENT_ID
const SENDPULSE_CLIENT_SECRET = process.env.SENDPULSE_CLIENT_SECRET
const BASE_URL = 'https://api.sendpulse.com'

const BOT_ID = '68f176502ca6f03a9705c489'
const CONTACT_ID = '68f176aef7323582c508f2d4'
const PHONE = '553299929969'

let accessToken = ''

async function getAccessToken() {
  console.log('🔐 Getting OAuth2 token...')
  
  const response = await fetch(`${BASE_URL}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: SENDPULSE_CLIENT_ID,
      client_secret: SENDPULSE_CLIENT_SECRET
    })
  })

  const data = await response.json()
  accessToken = data.access_token
  console.log('✅ Token obtained\n')
  return accessToken
}

async function tryEndpoint(name, method, endpoint, body) {
  console.log(`\n📡 ${name}`)
  console.log(`   ${method} ${endpoint}`)
  if (body) {
    console.log(`   Body:`, JSON.stringify(body, null, 2))
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })

    const data = await response.json()
    
    console.log(`   Status: ${response.status}`)
    console.log(`   Response:`, JSON.stringify(data, null, 2))
    
    return { success: response.ok, status: response.status, data }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('🔍 SendPulse WhatsApp - Contact ID Message Test\n')
  console.log('=' .repeat(60))
  console.log(`Bot ID: ${BOT_ID}`)
  console.log(`Contact ID: ${CONTACT_ID}`)
  console.log(`Phone: ${PHONE}`)
  console.log('=' .repeat(60))
  
  await getAccessToken()
  
  const tests = [
    {
      name: 'Send via Contact ID (v1)',
      method: 'POST',
      endpoint: `/whatsapp/contacts/${CONTACT_ID}/send`,
      body: {
        bot_id: BOT_ID,
        message: { text: 'Test via contact ID v1' }
      }
    },
    {
      name: 'Send via Contact ID (v2 - with type)',
      method: 'POST',
      endpoint: `/whatsapp/contacts/${CONTACT_ID}/send`,
      body: {
        bot_id: BOT_ID,
        message_type: 'text',
        message: { text: 'Test via contact ID v2' }
      }
    },
    {
      name: 'Send via Bot Contacts Endpoint',
      method: 'POST',
      endpoint: `/whatsapp/bots/${BOT_ID}/contacts/${CONTACT_ID}/send`,
      body: {
        message: { text: 'Test via bot contacts endpoint' }
      }
    },
    {
      name: 'Send Message (with contact_id param)',
      method: 'POST',
      endpoint: `/whatsapp/contacts/sendMessage`,
      body: {
        contact_id: CONTACT_ID,
        bot_id: BOT_ID,
        message: { text: 'Test with contact_id param' }
      }
    },
    {
      name: 'Send Message (with phone param)',
      method: 'POST',
      endpoint: `/whatsapp/contacts/sendMessage`,
      body: {
        bot_id: BOT_ID,
        phone: PHONE,
        message: { text: 'Test with phone param' }
      }
    },
    {
      name: 'Campaign Send to Single Contact',
      method: 'POST',
      endpoint: `/whatsapp/campaigns/send`,
      body: {
        bot_id: BOT_ID,
        contacts: [CONTACT_ID],
        message: { text: 'Campaign test' }
      }
    },
    {
      name: 'Bot Send Message',
      method: 'POST',
      endpoint: `/whatsapp/bots/${BOT_ID}/send`,
      body: {
        contact_id: CONTACT_ID,
        text: 'Bot send test'
      }
    },
    {
      name: 'Chatbot Messages Send',
      method: 'POST',
      endpoint: `/chatbots/messages/send`,
      body: {
        bot_id: BOT_ID,
        contact_id: CONTACT_ID,
        message_type: 'text',
        message: { text: 'Chatbot send test' }
      }
    },
    {
      name: 'Messenger Send',
      method: 'POST',
      endpoint: `/messenger/whatsapp/contacts/${CONTACT_ID}/send`,
      body: {
        bot_id: BOT_ID,
        message: { text: 'Messenger send test' }
      }
    },
    {
      name: 'Flow Trigger',
      method: 'POST',
      endpoint: `/whatsapp/flows/trigger`,
      body: {
        bot_id: BOT_ID,
        contact_id: CONTACT_ID,
        flow_id: 'default'
      }
    }
  ]

  let successCount = 0
  let notFoundCount = 0
  let otherErrorCount = 0

  for (const test of tests) {
    const result = await tryEndpoint(test.name, test.method, test.endpoint, test.body)
    
    if (result.success) {
      console.log(`   ✅ SUCCESS!`)
      successCount++
    } else if (result.status === 404) {
      notFoundCount++
    } else {
      otherErrorCount++
    }
    
    await new Promise(r => setTimeout(r, 500))
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 RESULTS SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Success: ${successCount}/${tests.length}`)
  console.log(`❌ 404 Not Found: ${notFoundCount}/${tests.length}`)
  console.log(`⚠️  Other Errors: ${otherErrorCount}/${tests.length}`)
  
  if (successCount > 0) {
    console.log('\n🎉 FOUND WORKING ENDPOINT(S)!')
  } else {
    console.log('\n❌ No working endpoints found for sending messages.')
    console.log('SendPulse WhatsApp API does not support programmatic sending.')
  }
}

main().catch(console.error)
