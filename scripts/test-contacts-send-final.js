#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

const SENDPULSE_CLIENT_ID = process.env.SENDPULSE_CLIENT_ID
const SENDPULSE_CLIENT_SECRET = process.env.SENDPULSE_CLIENT_SECRET
const BASE_URL = 'https://api.sendpulse.com/whatsapp'

const BOT_ID = '68f176502ca6f03a9705c489'
const CONTACT_ID = '68f176aef7323582c508f2d4'

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

async function getContactInfo() {
  console.log('📋 Getting contact info...')
  console.log(`   Contact ID: ${CONTACT_ID}`)
  
  const response = await fetch(`${BASE_URL}/contacts/get?id=${CONTACT_ID}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  const data = await response.json()
  console.log(`   Status: ${response.status}`)
  console.log(`   Response:`, JSON.stringify(data, null, 2))
  
  return data
}

async function sendMessageToContact() {
  console.log('\n📱 Sending message via POST /contacts/send...')
  console.log(`   Bot ID: ${BOT_ID}`)
  console.log(`   Contact ID: ${CONTACT_ID}`)
  
  const payload = {
    contact_id: CONTACT_ID,
    message: {
      text: '🎉 Teste via API oficial SendPulse!\n\nSe você recebeu esta mensagem, o endpoint /contacts/send funciona! ✅'
    }
  }
  
  console.log(`   Payload:`, JSON.stringify(payload, null, 2))
  
  const response = await fetch(`${BASE_URL}/contacts/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json()
  
  console.log(`\n   Status: ${response.status}`)
  console.log(`   Response:`, JSON.stringify(data, null, 2))
  
  return { success: response.ok, status: response.status, data }
}

async function sendMessageByPhone() {
  console.log('\n📱 Sending message via POST /contacts/sendByPhone...')
  
  const payload = {
    phone: '553299929969',
    message: {
      text: '🎉 Teste via sendByPhone endpoint!'
    }
  }
  
  console.log(`   Payload:`, JSON.stringify(payload, null, 2))
  
  const response = await fetch(`${BASE_URL}/contacts/sendByPhone`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json()
  
  console.log(`\n   Status: ${response.status}`)
  console.log(`   Response:`, JSON.stringify(data, null, 2))
  
  return { success: response.ok, status: response.status, data }
}

async function main() {
  console.log('🚀 SendPulse WhatsApp API - Official Endpoints Test')
  console.log('=' .repeat(60))
  console.log('Testing endpoints from: https://api.sendpulse.com/whatsapp')
  console.log('=' .repeat(60))
  
  try {
    await getAccessToken()
    
    await getContactInfo()
    
    await new Promise(r => setTimeout(r, 1000))
    
    const result1 = await sendMessageToContact()
    
    await new Promise(r => setTimeout(r, 2000))
    
    const result2 = await sendMessageByPhone()
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 RESULTS')
    console.log('='.repeat(60))
    
    if (result1.success || result2.success) {
      console.log('✅ SUCCESS! At least one endpoint works!')
      console.log('\n📬 Check WhatsApp for test messages')
    } else {
      console.log('❌ Both endpoints failed')
      console.log('\nPossible reasons:')
      console.log('  - Contact ID might need to be active/recent')
      console.log('  - Bot might not be properly configured')
      console.log('  - Account permissions issue')
      console.log('  - WhatsApp 24-hour window restriction')
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

main().catch(console.error)
