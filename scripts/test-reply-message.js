#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

const SENDPULSE_CLIENT_ID = process.env.SENDPULSE_CLIENT_ID
const SENDPULSE_CLIENT_SECRET = process.env.SENDPULSE_CLIENT_SECRET
const BASE_URL = 'https://api.sendpulse.com'

const BOT_ID = '68f176502ca6f03a9705c489'

let accessToken = ''

async function getAccessToken() {
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
  return accessToken
}

async function getContacts() {
  console.log('📋 Getting contacts...')
  const response = await fetch(`${BASE_URL}/whatsapp/contacts?bot_id=${BOT_ID}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
  const data = await response.json()
  
  if (data.success && data.data.length > 0) {
    console.log(`✅ Found ${data.data.length} contacts`)
    return data.data[0]
  }
  throw new Error('No contacts found')
}

async function trySendToContact(contactId, phone) {
  console.log(`\n📱 Attempting to send message to contact...`)
  console.log(`   Contact ID: ${contactId}`)
  console.log(`   Phone: ${phone}`)
  
  const variants = [
    {
      name: 'Reply to contact (v1)',
      endpoint: `/whatsapp/contacts/${contactId}/reply`,
      body: {
        bot_id: BOT_ID,
        message: { text: 'Test reply v1' }
      }
    },
    {
      name: 'Send to contact (v2)',
      endpoint: `/whatsapp/contacts/${contactId}/send`,
      body: {
        bot_id: BOT_ID,
        text: 'Test message v2'
      }
    },
    {
      name: 'Send message (v3)',
      endpoint: `/whatsapp/messages/send`,
      body: {
        bot_id: BOT_ID,
        contact_id: contactId,
        message: { text: 'Test message v3' }
      }
    },
    {
      name: 'Chatbot reply (v4)',
      endpoint: `/chatbots/messages/send`,
      body: {
        bot_id: BOT_ID,
        contact_id: contactId,
        message_type: 'text',
        message: { text: 'Test v4' }
      }
    },
    {
      name: 'Direct phone send (v5)',
      endpoint: `/whatsapp/send`,
      body: {
        phone: phone,
        text: 'Test v5'
      }
    }
  ]
  
  for (const variant of variants) {
    console.log(`\n  Trying: ${variant.name}`)
    console.log(`  POST ${variant.endpoint}`)
    
    try {
      const response = await fetch(`${BASE_URL}${variant.endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(variant.body)
      })
      
      const data = await response.json()
      console.log(`  Status: ${response.status}`)
      
      if (response.ok || response.status === 400) {
        console.log(`  Response:`, JSON.stringify(data, null, 2))
      } else {
        console.log(`  Error: ${data.error_code || response.status}`)
      }
      
      if (response.ok) {
        console.log(`\n  ✅ SUCCESS! This endpoint works!`)
        return { success: true, variant, data }
      }
    } catch (error) {
      console.log(`  Exception: ${error.message}`)
    }
    
    await new Promise(r => setTimeout(r, 500))
  }
  
  return { success: false }
}

async function main() {
  console.log('🔍 SendPulse Reply Message Test\n')
  console.log('=' .repeat(60))
  
  try {
    await getAccessToken()
    console.log('✅ Authenticated\n')
    
    const contact = await getContacts()
    const contactId = contact.id
    const phone = contact.channel_data.phone
    
    await trySendToContact(contactId, phone)
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
  
  console.log('\n' + '='.repeat(60))
}

main()
