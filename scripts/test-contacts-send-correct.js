#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

const SENDPULSE_CLIENT_ID = process.env.SENDPULSE_CLIENT_ID
const SENDPULSE_CLIENT_SECRET = process.env.SENDPULSE_CLIENT_SECRET
const BASE_URL = 'https://api.sendpulse.com/whatsapp'

const BOT_ID = '68f176502ca6f03a9705c489'
const CONTACT_ID = '68f176aef7323582c508f2d4'
const PHONE = '553299929969'

let accessToken = ''

async function getAccessToken() {
  console.log('🔐 Getting OAuth2 token...')
  
  const response = await fetch('https://api.sendpulse.com/oauth/access_token', {
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

async function sendMessageToContact() {
  console.log('📱 Test 1: POST /contacts/send with message.type')
  
  const payload = {
    contact_id: CONTACT_ID,
    message: {
      type: 'text',
      text: {
        body: '🎉 Teste SendPulse API - Endpoint correto!\n\nMensagem enviada via /contacts/send'
      }
    }
  }
  
  console.log('   Payload:', JSON.stringify(payload, null, 2))
  
  const response = await fetch(`${BASE_URL}/contacts/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json()
  
  console.log(`   Status: ${response.status}`)
  console.log(`   Response:`, JSON.stringify(data, null, 2))
  
  return { success: response.ok, status: response.status, data }
}

async function sendMessageByPhone() {
  console.log('\n📱 Test 2: POST /contacts/sendByPhone')
  
  const payload = {
    bot_id: BOT_ID,
    phone: PHONE,
    message: {
      type: 'text',
      text: {
        body: '🎉 Teste via sendByPhone com bot_id!'
      }
    }
  }
  
  console.log('   Payload:', JSON.stringify(payload, null, 2))
  
  const response = await fetch(`${BASE_URL}/contacts/sendByPhone`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json()
  
  console.log(`   Status: ${response.status}`)
  console.log(`   Response:`, JSON.stringify(data, null, 2))
  
  return { success: response.ok, status: response.status, data }
}

async function sendSimpleTextFormat() {
  console.log('\n📱 Test 3: Simplified text format')
  
  const payload = {
    contact_id: CONTACT_ID,
    message: {
      type: 'text',
      text: '🎉 Mensagem simplificada!'
    }
  }
  
  console.log('   Payload:', JSON.stringify(payload, null, 2))
  
  const response = await fetch(`${BASE_URL}/contacts/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json()
  
  console.log(`   Status: ${response.status}`)
  console.log(`   Response:`, JSON.stringify(data, null, 2))
  
  return { success: response.ok, status: response.status, data }
}

async function main() {
  console.log('🚀 SendPulse WhatsApp API - Correct Payload Test')
  console.log('=' .repeat(60))
  
  try {
    await getAccessToken()
    
    const result1 = await sendMessageToContact()
    await new Promise(r => setTimeout(r, 2000))
    
    const result2 = await sendMessageByPhone()
    await new Promise(r => setTimeout(r, 2000))
    
    const result3 = await sendSimpleTextFormat()
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 FINAL RESULTS')
    console.log('='.repeat(60))
    
    const results = [result1, result2, result3]
    const successCount = results.filter(r => r.success).length
    
    console.log(`✅ Success: ${successCount}/3`)
    console.log(`❌ Failed: ${3 - successCount}/3`)
    
    if (successCount > 0) {
      console.log('\n🎉 SUCCESS! WhatsApp API is working!')
      console.log('📬 Check WhatsApp for test messages')
    } else {
      console.log('\n⚠️  All attempts failed')
      console.log('\nLikely reasons:')
      console.log('  - WhatsApp 24-hour messaging window restriction')
      console.log('  - Contact needs to initiate conversation first')
      console.log('  - Need to use template messages outside 24h window')
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

main().catch(console.error)
