#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

async function testEmailReminderService() {
  console.log('🧪 Testing Email Reminder Service\n')
  console.log('=' .repeat(60))

  const { emailReminderService } = require('../src/lib/reminders/email-reminder-service.ts')

  const testCases = [
    {
      name: 'Subscription Renewal (3 days)',
      test: async () => {
        return await emailReminderService.sendSubscriptionRenewalReminder(
          'contato@svlentes.com.br',
          'Dr. Philipe Saraiva',
          3,
          '20/10/2025'
        )
      }
    },
    {
      name: 'Order Delivery',
      test: async () => {
        return await emailReminderService.sendOrderDeliveryReminder(
          'contato@svlentes.com.br',
          'Cliente Teste',
          'BR123456789BR',
          '22/10/2025'
        )
      }
    },
    {
      name: 'Appointment Reminder',
      test: async () => {
        return await emailReminderService.sendAppointmentReminder(
          'contato@svlentes.com.br',
          'João Silva',
          '25/10/2025',
          '14:30'
        )
      }
    },
    {
      name: 'Generic Reminder',
      test: async () => {
        return await emailReminderService.sendReminder({
          userId: 'test-123',
          email: 'contato@svlentes.com.br',
          name: 'Cliente Genérico',
          message: 'Este é um lembrete genérico de teste!',
          reminderType: 'general'
        })
      }
    }
  ]

  let passed = 0
  let failed = 0

  for (const testCase of testCases) {
    console.log(`\n📧 Testing: ${testCase.name}`)
    try {
      const result = await testCase.test()
      if (result) {
        console.log(`   ✅ Success`)
        passed++
      } else {
        console.log(`   ❌ Failed`)
        failed++
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
      failed++
    }

    await new Promise(r => setTimeout(r, 1000))
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST RESULTS')
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${passed}/${testCases.length}`)
  console.log(`❌ Failed: ${failed}/${testCases.length}`)

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!')
    console.log('\n📬 Check your inbox at: contato@svlentes.com.br')
    console.log(`   You should have received ${testCases.length} emails.`)
    process.exit(0)
  } else {
    console.log('\n⚠️  Some tests failed.')
    process.exit(1)
  }
}

testEmailReminderService().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
