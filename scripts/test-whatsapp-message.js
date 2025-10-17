#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

const SENDPULSE_CLIENT_ID = process.env.SENDPULSE_CLIENT_ID
const SENDPULSE_CLIENT_SECRET = process.env.SENDPULSE_CLIENT_SECRET
const BASE_URL = 'https://api.sendpulse.com'

const TEST_PHONE = '+5533998980026'

let accessToken = ''
let botId = ''

async function getAccessToken() {
  console.log('\n🔐 Step 1: Getting OAuth2 Access Token...')
  
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
  
  if (!response.ok) {
    throw new Error(`OAuth2 failed: ${JSON.stringify(data)}`)
  }

  accessToken = data.access_token
  console.log('✅ Access token obtained')
  console.log(`   User ID: ${data.user_id}`)
  console.log(`   Expires in: ${data.expires_in}s`)
  
  return accessToken
}

async function getBotId() {
  console.log('\n🤖 Step 2: Getting Bot ID...')
  
  const response = await fetch(`${BASE_URL}/whatsapp/bots`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(`Get bots failed: ${JSON.stringify(data)}`)
  }

  if (!data.success || !data.data || data.data.length === 0) {
    throw new Error('No WhatsApp bots found')
  }

  botId = data.data[0].id
  const bot = data.data[0]
  
  console.log('✅ Bot found')
  console.log(`   Bot ID: ${bot.id}`)
  console.log(`   Name: ${bot.name}`)
  console.log(`   Phone: ${bot.phone}`)
  console.log(`   Status: ${bot.status}`)
  
  return botId
}

async function sendSimpleMessage() {
  console.log('\n📱 Step 3: Sending Simple WhatsApp Message...')
  console.log(`   To: ${TEST_PHONE}`)
  
  const response = await fetch(`${BASE_URL}/whatsapp/contacts/sendMessage`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      bot_id: botId,
      phone: TEST_PHONE.replace(/[^\d]/g, ''),
      data: {
        text: '🎉 Teste de integração SendPulse + SVlentes!\n\nSe você recebeu esta mensagem, a integração está funcionando perfeitamente! ✅'
      }
    })
  })

  const data = await response.json()
  
  console.log('\n📤 Response:')
  console.log(JSON.stringify(data, null, 2))
  
  if (!response.ok) {
    throw new Error(`Send message failed: ${JSON.stringify(data)}`)
  }

  console.log('\n✅ Message sent successfully!')
  return data
}

async function sendMessageWithButtons() {
  console.log('\n🔘 Step 4: Sending Message with Quick Reply Buttons...')
  console.log(`   To: ${TEST_PHONE}`)
  
  const response = await fetch(`${BASE_URL}/whatsapp/contacts/sendMessage`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      bot_id: botId,
      phone: TEST_PHONE.replace(/[^\d]/g, ''),
      data: {
        text: '💬 Menu de teste\n\nEscolha uma opção:',
        buttons: [
          {
            type: 'quick_reply',
            payload: 'btn_1',
            title: '✅ Opção 1'
          },
          {
            type: 'quick_reply',
            payload: 'btn_2',
            title: '🔍 Opção 2'
          },
          {
            type: 'quick_reply',
            payload: 'btn_3',
            title: '❌ Cancelar'
          }
        ]
      }
    })
  })

  const data = await response.json()
  
  console.log('\n📤 Response:')
  console.log(JSON.stringify(data, null, 2))
  
  if (!response.ok) {
    throw new Error(`Send message with buttons failed: ${JSON.stringify(data)}`)
  }

  console.log('\n✅ Message with buttons sent successfully!')
  return data
}

async function createContact() {
  console.log('\n👤 Step 5: Creating/Updating Contact...')
  console.log(`   Phone: ${TEST_PHONE}`)
  
  const response = await fetch(`${BASE_URL}/whatsapp/contacts/set`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      bot_id: botId,
      phone: TEST_PHONE.replace(/[^\d]/g, ''),
      name: 'Cliente Teste SVlentes',
      variables: {
        subscription_status: 'active',
        next_delivery: '2025-11-17',
        plan: 'mensal'
      },
      tags: ['teste', 'integracao']
    })
  })

  const data = await response.json()
  
  console.log('\n📤 Response:')
  console.log(JSON.stringify(data, null, 2))
  
  if (!response.ok) {
    throw new Error(`Create contact failed: ${JSON.stringify(data)}`)
  }

  console.log('\n✅ Contact created/updated successfully!')
  return data
}

async function main() {
  console.log('🚀 SendPulse WhatsApp Integration Test')
  console.log('=' .repeat(50))
  console.log(`📞 Test Phone: ${TEST_PHONE}`)
  console.log('=' .repeat(50))

  try {
    await getAccessToken()
    await getBotId()
    
    console.log('\n⏳ Waiting 2 seconds before sending messages...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    await sendSimpleMessage()
    
    console.log('\n⏳ Waiting 3 seconds before next message...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    await sendMessageWithButtons()
    
    console.log('\n⏳ Waiting 2 seconds before creating contact...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    await createContact()
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ ALL TESTS PASSED!')
    console.log('='.repeat(50))
    console.log('\n📱 Check your WhatsApp for the test messages!')
    
  } catch (error) {
    console.error('\n❌ TEST FAILED!')
    console.error(error.message)
    process.exit(1)
  }
}

main()
