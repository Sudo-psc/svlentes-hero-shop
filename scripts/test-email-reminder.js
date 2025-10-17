#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

const BASE_URL = 'http://localhost:3000'
const TEST_EMAIL = 'contato@svlentes.com.br'

async function testSingleReminder() {
  console.log('\n📧 Test 1: Sending Single Reminder Email\n')
  console.log('=' .repeat(60))

  const reminder = {
    userId: 'test-user-123',
    email: TEST_EMAIL,
    name: 'Cliente Teste',
    message: 'Este é um teste de lembrete por email da SV Lentes!\n\nSua assinatura será renovada em breve.',
    subject: '🔔 Teste de Lembrete - SV Lentes',
    reminderType: 'subscription_renewal'
  }

  try {
    const response = await fetch(`${BASE_URL}/api/reminders/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reminder })
    })

    const data = await response.json()
    
    console.log(`Status: ${response.status} ${response.statusText}`)
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (response.ok && data.success) {
      console.log('\n✅ Single reminder sent successfully!')
      return true
    } else {
      console.log('\n❌ Failed to send single reminder')
      return false
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    return false
  }
}

async function testSubscriptionRenewalReminder() {
  console.log('\n\n📧 Test 2: Subscription Renewal Reminder\n')
  console.log('=' .repeat(60))

  const reminder = {
    userId: 'test-user-456',
    email: TEST_EMAIL,
    name: 'Dr. Philipe Saraiva',
    message: 'Faltam apenas 3 dias para a renovação da sua assinatura! 📅\n\nData da renovação: 20/10/2025\n\nVocê receberá suas lentes no prazo previsto.',
    reminderType: 'subscription_renewal',
    metadata: {
      daysUntilRenewal: 3,
      renewalDate: '20/10/2025'
    }
  }

  try {
    const response = await fetch(`${BASE_URL}/api/reminders/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reminder })
    })

    const data = await response.json()
    
    console.log(`Status: ${response.status} ${response.statusText}`)
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (response.ok && data.success) {
      console.log('\n✅ Subscription renewal reminder sent successfully!')
      return true
    } else {
      console.log('\n❌ Failed to send subscription renewal reminder')
      return false
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    return false
  }
}

async function testOrderDeliveryReminder() {
  console.log('\n\n📧 Test 3: Order Delivery Reminder\n')
  console.log('=' .repeat(60))

  const reminder = {
    userId: 'test-user-789',
    email: TEST_EMAIL,
    name: 'Cliente Exemplo',
    message: 'Seu pedido está a caminho! 📦\n\nCódigo de rastreio: BR123456789BR\n\nPrevisão de entrega: 22/10/2025\n\nAcompanhe seu pedido em tempo real pela sua área de usuário.',
    reminderType: 'order_delivery',
    metadata: {
      trackingCode: 'BR123456789BR',
      estimatedDelivery: '22/10/2025'
    }
  }

  try {
    const response = await fetch(`${BASE_URL}/api/reminders/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reminder })
    })

    const data = await response.json()
    
    console.log(`Status: ${response.status} ${response.statusText}`)
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (response.ok && data.success) {
      console.log('\n✅ Order delivery reminder sent successfully!')
      return true
    } else {
      console.log('\n❌ Failed to send order delivery reminder')
      return false
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    return false
  }
}

async function testBulkReminders() {
  console.log('\n\n📧 Test 4: Bulk Reminders\n')
  console.log('=' .repeat(60))

  const reminders = [
    {
      userId: 'bulk-1',
      email: TEST_EMAIL,
      name: 'Cliente 1',
      message: 'Lembrete em massa - teste 1',
      reminderType: 'general'
    },
    {
      userId: 'bulk-2',
      email: TEST_EMAIL,
      name: 'Cliente 2',
      message: 'Lembrete em massa - teste 2',
      reminderType: 'general'
    }
  ]

  try {
    const response = await fetch(`${BASE_URL}/api/reminders/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reminders })
    })

    const data = await response.json()
    
    console.log(`Status: ${response.status} ${response.statusText}`)
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (response.ok && data.success) {
      console.log('\n✅ Bulk reminders sent successfully!')
      return true
    } else {
      console.log('\n❌ Some bulk reminders failed')
      return false
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    return false
  }
}

async function main() {
  console.log('🧪 Email Reminder System - End-to-End Tests')
  console.log('=' .repeat(60))
  console.log(`📧 Test Email: ${TEST_EMAIL}`)
  console.log(`🌐 API Base URL: ${BASE_URL}`)
  console.log('=' .repeat(60))

  const results = []

  results.push(await testSingleReminder())
  
  await new Promise(r => setTimeout(r, 2000))
  results.push(await testSubscriptionRenewalReminder())
  
  await new Promise(r => setTimeout(r, 2000))
  results.push(await testOrderDeliveryReminder())
  
  await new Promise(r => setTimeout(r, 2000))
  results.push(await testBulkReminders())

  console.log('\n\n' + '=' .repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('=' .repeat(60))
  
  const passed = results.filter(r => r).length
  const failed = results.filter(r => !r).length
  
  console.log(`✅ Passed: ${passed}/${results.length}`)
  console.log(`❌ Failed: ${failed}/${results.length}`)
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!')
    console.log('\n📬 Check your inbox at:', TEST_EMAIL)
    console.log('You should have received 5 test emails total.')
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.')
    process.exit(1)
  }
}

main().catch(console.error)
