/**
 * SendPulse WhatsApp Bots Test
 * List bots and send messages via bot-based API
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables FIRST
const envPath = resolve(__dirname, '.env.local')
dotenv.config({ path: envPath })

async function testWhatsAppBots() {
  console.log('🤖 Testing SendPulse WhatsApp Bots API\n')

  // Get OAuth token
  const tokenUrl = 'https://api.sendpulse.com/oauth/access_token'
  const appId = process.env.SENDPULSE_APP_ID
  const appSecret = process.env.SENDPULSE_APP_SECRET

  console.log('1️⃣ Getting OAuth token...')
  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: appId,
      client_secret: appSecret
    })
  })

  const tokenData = await tokenResponse.json()
  const accessToken = tokenData.access_token
  console.log(`✅ Token obtained\n`)

  // Get bots list
  console.log('2️⃣ Getting WhatsApp bots list...')
  const botsResponse = await fetch('https://api.sendpulse.com/whatsapp/bots', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!botsResponse.ok) {
    console.error('❌ Failed to get bots:', await botsResponse.text())
    return
  }

  const botsData = await botsResponse.json()
  console.log('✅ Bots retrieved:')
  console.log(JSON.stringify(botsData, null, 2))
  console.log()

  if (!botsData.data || botsData.data.length === 0) {
    console.log('⚠️  No bots found. You need to create a WhatsApp bot in SendPulse dashboard first.')
    console.log('   Visit: https://login.sendpulse.com/whatsapp/bots')
    return
  }

  // Use the first bot
  const bot = botsData.data[0]
  const botId = bot.id
  console.log(`3️⃣ Using bot: ${bot.name} (ID: ${botId})`)
  console.log(`   Channel: ${bot.channel.name}`)
  console.log(`   Phone: ${bot.channel.phone}\n`)

  // Get contacts for this bot
  console.log('4️⃣ Getting contacts for this bot...')
  const contactsResponse = await fetch(`https://api.sendpulse.com/whatsapp/contacts?bot_id=${botId}&limit=10`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  let existingContactsData
  if (contactsResponse.ok) {
    existingContactsData = await contactsResponse.json()
    console.log('✅ Contacts:')
    console.log(JSON.stringify(existingContactsData, null, 2).substring(0, 500))
    console.log()
  } else {
    console.log('⚠️  No contacts found or error:', await contactsResponse.text())
    console.log()
  }

  // Step 5: Find active contact (with open chat window)
  console.log('5️⃣ Looking for active contact (24h conversation window)...')

  // Find a contact with an open chat (within 24h window)
  let contactId
  let contactName
  if (existingContactsData?.data) {
    const activeContact = existingContactsData.data.find((c: any) => c.is_chat_opened === true)
    if (activeContact) {
      contactId = activeContact.id || activeContact._id
      contactName = activeContact.channel_data?.name || activeContact.channel_data?.phone
      console.log(`✅ Found active contact: ${contactName} (ID: ${contactId})`)
      console.log(`   Phone: +${activeContact.channel_data?.phone}`)
      console.log(`   Chat opened: ${activeContact.is_chat_opened}`)
    } else {
      console.log('⚠️  No active contacts found (24h window)')
      console.log('   To test messaging, send a WhatsApp message to the bot first')
      console.log(`   Bot number: ${bot.channel_data?.phone}`)
      console.log('\n   Alternatively, you can:')
      console.log('   1. Send a message from your phone to the bot')
      console.log('   2. Use template messages (requires approval)')
      console.log('   3. Use the SendPulse dashboard to send messages')
      return
    }
  } else {
    console.log('❌ Could not get contacts list')
    return
  }

  console.log()

  // Step 6: Send message with contact_id
  console.log('6️⃣ Sending test message...')

  const messagePayload = {
    contact_id: contactId,
    message: {
      type: 'text',
      text: {
        body: '🤖 Teste de integração SendPulse\n\nMensagem enviada via API\n\n' + new Date().toLocaleString('pt-BR')
      }
    }
  }

  console.log('   Payload:', JSON.stringify(messagePayload, null, 2))

  const sendResponse = await fetch('https://api.sendpulse.com/whatsapp/contacts/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(messagePayload)
  })

  console.log(`   Status: ${sendResponse.status} ${sendResponse.statusText}`)

  if (sendResponse.ok) {
    const sendData = await sendResponse.json()
    console.log('✅ Message sent successfully!')
    console.log(JSON.stringify(sendData, null, 2))
    console.log('\n🎉 WhatsApp message sending is working!')
  } else {
    const errorText = await sendResponse.text()
    console.log('❌ Failed to send message:')
    console.log(errorText)
  }
}

testWhatsAppBots().catch(console.error)
