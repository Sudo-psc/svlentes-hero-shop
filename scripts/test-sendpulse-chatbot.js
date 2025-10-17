#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

const SENDPULSE_CLIENT_ID = process.env.SENDPULSE_CLIENT_ID
const SENDPULSE_CLIENT_SECRET = process.env.SENDPULSE_CLIENT_SECRET
const BASE_URL = 'https://api.sendpulse.com'

const TEST_PHONE = '5533998980026'
const BOT_ID = '68f176502ca6f03a9705c489'

let accessToken = ''

async function getAccessToken() {
  console.log('🔐 Getting OAuth2 token...')
  
  const response = await fetch(`${BASE_URL}/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
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

async function tryEndpoint(name, endpoint, method, body) {
  console.log(`\n📡 Testing: ${name}`)
  console.log(`   Endpoint: ${method} ${endpoint}`)
  
  try {
    const response = await fetch(endpoint, {
      method: method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })

    const data = await response.json()
    
    console.log(`   Status: ${response.status} ${response.statusText}`)
    console.log(`   Response:`, JSON.stringify(data, null, 2))
    
    return { success: response.ok, data }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('🧪 SendPulse ChatBot API Endpoint Discovery\n')
  console.log('=' .repeat(60))
  
  await getAccessToken()
  
  const endpoints = [
    {
      name: 'ChatBot Send (v1)',
      endpoint: `${BASE_URL}/whatsapp/contacts/sendMessage`,
      method: 'POST',
      body: {
        bot_id: BOT_ID,
        phone: TEST_PHONE,
        data: { text: 'Test message v1' }
      }
    },
    {
      name: 'ChatBot Send (v2 - with contact_id)',
      endpoint: `${BASE_URL}/whatsapp/contacts/sendMessage`,
      method: 'POST',
      body: {
        contact_id: TEST_PHONE,
        bot_id: BOT_ID,
        message: { text: 'Test message v2' }
      }
    },
    {
      name: 'ChatBot Send (v3 - direct)',
      endpoint: `${BASE_URL}/whatsapp/send`,
      method: 'POST',
      body: {
        bot_id: BOT_ID,
        phone: TEST_PHONE,
        text: 'Test message v3'
      }
    },
    {
      name: 'ChatBot Message (v4)',
      endpoint: `${BASE_URL}/whatsapp/bots/${BOT_ID}/message`,
      method: 'POST',
      body: {
        phone: TEST_PHONE,
        text: 'Test message v4'
      }
    },
    {
      name: 'Messenger Send (v5)',
      endpoint: `${BASE_URL}/messenger/whatsapp/send`,
      method: 'POST',
      body: {
        bot_id: BOT_ID,
        phone: TEST_PHONE,
        message: 'Test message v5'
      }
    },
    {
      name: 'Get Contacts List',
      endpoint: `${BASE_URL}/whatsapp/contacts?bot_id=${BOT_ID}`,
      method: 'GET',
      body: null
    },
    {
      name: 'Get Chats',
      endpoint: `${BASE_URL}/whatsapp/chats?bot_id=${BOT_ID}`,
      method: 'GET',
      body: null
    }
  ]
  
  for (const test of endpoints) {
    await tryEndpoint(test.name, test.endpoint, test.method, test.body)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Endpoint discovery complete')
  console.log('\nCheck the responses above to find which endpoint works!')
}

main().catch(console.error)
