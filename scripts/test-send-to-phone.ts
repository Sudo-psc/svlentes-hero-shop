#!/usr/bin/env ts-node
/**
 * Test SendPulse Message Sending
 *
 * Tests Direct API and hybrid fallback mechanism by sending a message to a specific phone number.
 *
 * Usage:
 *   ts-node scripts/test-send-to-phone.ts <phone_number>
 *   Example: ts-node scripts/test-send-to-phone.ts 32999929969
 */

import * as dotenv from 'dotenv'
import { sendPulseClient } from '../src/lib/sendpulse-client.js'
import { sendMessageWithFallback } from '../src/lib/mcp-sendpulse-client.js'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testSendMessage(phone: string) {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  SendPulse Message Test')
  console.log('═══════════════════════════════════════════════════════\n')

  const fullPhone = phone.startsWith('55') ? phone : `55${phone}`
  console.log(`📱 Target Phone: ${fullPhone}`)
  console.log(`🤖 Bot ID: ${process.env.SENDPULSE_BOT_ID}\n`)

  // Test 1: Direct API
  console.log('🧪 Test 1: Direct API Message')
  console.log('───────────────────────────────────────────────────────')

  try {
    const result = await sendPulseClient.sendMessage({
      phone: fullPhone,
      message: '🤖 Teste de mensagem via API Direta SendPulse\n\nSe você recebeu esta mensagem, a integração está funcionando corretamente! ✅',
      isChatOpened: false
    })

    console.log('✅ SUCCESS: Message sent via Direct API')
    console.log('Response:', JSON.stringify(result, null, 2))

  } catch (error) {
    console.error('❌ FAILED: Direct API error')
    console.error('Error:', error instanceof Error ? error.message : error)
  }

  // Test 2: Hybrid Fallback Mechanism
  console.log('\n🧪 Test 2: Hybrid Fallback Mechanism')
  console.log('───────────────────────────────────────────────────────')

  try {
    const botId = process.env.SENDPULSE_BOT_ID || ''
    const fallbackResult = await sendMessageWithFallback(
      sendPulseClient,
      {
        phone: fullPhone,
        message: '🔄 Teste do mecanismo de fallback híbrido\n\nEsta mensagem testa a capacidade do sistema de usar MCP como fallback quando a API direta falha.',
        botId
      }
    )

    if (fallbackResult.success) {
      console.log(`✅ SUCCESS: Message delivered via ${fallbackResult.method.toUpperCase()}`)
      console.log('Method used:', fallbackResult.method)
    } else {
      console.error('❌ FAILED: All delivery methods failed')
      console.error('Error:', fallbackResult.error)
    }

  } catch (error) {
    console.error('❌ FAILED: Fallback mechanism error')
    console.error('Error:', error instanceof Error ? error.message : error)
  }

  // Test 3: Message with Quick Replies
  console.log('\n🧪 Test 3: Message with Quick Replies')
  console.log('───────────────────────────────────────────────────────')

  try {
    const quickReplies = [
      '✅ Funcionou',
      '❌ Não recebi',
      'ℹ️ Mais informações'
    ]

    const result = await sendPulseClient.sendMessageWithQuickReplies(
      fullPhone,
      '🎯 Teste de mensagem com Quick Replies\n\nSelecione uma opção abaixo para responder:',
      quickReplies,
      { isChatOpened: false }
    )

    console.log('✅ SUCCESS: Message with quick replies sent')
    console.log('Response:', JSON.stringify(result, null, 2))

  } catch (error) {
    console.error('❌ FAILED: Quick replies error')
    console.error('Error:', error instanceof Error ? error.message : error)
  }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  Test Complete')
  console.log('═══════════════════════════════════════════════════════\n')
}

// Get phone number from command line or use default
const phone = process.argv[2] || '32999929969'

// Run tests
testSendMessage(phone).catch(error => {
  console.error('\n🚨 Test suite failed:', error)
  process.exit(1)
})
