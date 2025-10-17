#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

const SENDPULSE_CLIENT_ID = process.env.SENDPULSE_CLIENT_ID
const SENDPULSE_CLIENT_SECRET = process.env.SENDPULSE_CLIENT_SECRET
const BASE_URL = 'https://api.sendpulse.com'

const TEST_PHONE = '5533998980026'
const BOT_ID = '68f176502ca6f03a9705c489'

let accessToken = ''

async function getAccessToken() {
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
  return accessToken
}

async function tryEndpoint(name, method, path, body) {
  console.log(`\n📡 ${name}`)
  console.log(`   ${method} ${path}`)
  
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })

    const data = await response.json()
    
    console.log(`   Status: ${response.status}`)
    if (response.ok) {
      console.log(`   ✅ Success:`, JSON.stringify(data, null, 2).substring(0, 500))
    } else {
      console.log(`   ❌ Error:`, JSON.stringify(data, null, 2))
    }
    
    return { success: response.ok, data, status: response.status }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('🔍 SendPulse ChatBot API - Flow & Triggers Discovery\n')
  console.log('=' .repeat(60))
  
  await getAccessToken()
  console.log('✅ Authenticated\n')
  
  await tryEndpoint(
    'Get Bot Flows',
    'GET',
    `/whatsapp/bots/${BOT_ID}/flows`,
    null
  )
  
  await new Promise(r => setTimeout(r, 500))
  
  await tryEndpoint(
    'Get Bot Triggers',
    'GET',
    `/whatsapp/bots/${BOT_ID}/triggers`,
    null
  )
  
  await new Promise(r => setTimeout(r, 500))
  
  await tryEndpoint(
    'Get Bot Templates',
    'GET',
    `/whatsapp/templates?bot_id=${BOT_ID}`,
    null
  )
  
  await new Promise(r => setTimeout(r, 500))
  
  await tryEndpoint(
    'Get Bot Info',
    'GET',
    `/whatsapp/bots/${BOT_ID}`,
    null
  )
  
  await new Promise(r => setTimeout(r, 500))
  
  await tryEndpoint(
    'List Campaigns',
    'GET',
    `/whatsapp/campaigns?bot_id=${BOT_ID}`,
    null
  )
  
  await new Promise(r => setTimeout(r, 500))
  
  await tryEndpoint(
    'Trigger Flow (attempt 1)',
    'POST',
    `/whatsapp/flows/trigger`,
    {
      bot_id: BOT_ID,
      contact_phone: TEST_PHONE,
      flow_id: 'test'
    }
  )
  
  await new Promise(r => setTimeout(r, 500))
  
  await tryEndpoint(
    'Send via Campaign',
    'POST',
    `/whatsapp/campaigns/send`,
    {
      bot_id: BOT_ID,
      phones: [TEST_PHONE],
      message: 'Test'
    }
  )
  
  console.log('\n' + '='.repeat(60))
}

main().catch(console.error)
