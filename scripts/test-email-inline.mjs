#!/usr/bin/env node

import { config } from 'dotenv'
import { Resend } from 'resend'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '..', '.env.local') })

console.log('🔍 Checking environment variables...')
console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Found' : '❌ Missing'}`)

if (!process.env.RESEND_API_KEY) {
  console.error('\n❌ RESEND_API_KEY not found in .env.local')
  process.exit(1)
}

const resend = new Resend(process.env.RESEND_API_KEY)
const EMAIL_FROM = process.env.NEXT_PUBLIC_EMAIL_FROM || 'SV Lentes <noreply@svlentes.shop>'
const TEST_EMAIL = 'contato@svlentes.com.br'

function createReminderHTML(name, message, reminderType) {
  const iconMap = {
    subscription_renewal: '🔔',
    order_delivery: '📦',
    appointment: '👓',
    general: '💬'
  }
  
  const icon = iconMap[reminderType] || '💬'

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      
      <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">SV Lentes</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Lentes de Contato com Acompanhamento Médico</p>
      </div>

      <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <p style="font-size: 18px; margin-bottom: 20px; color: #0891b2;">
          Olá, ${name}!
        </p>

        <div style="background-color: #f0f9ff; border-left: 4px solid #06b6d4; padding: 20px; margin: 25px 0; border-radius: 4px;">
          <p style="font-size: 16px; margin: 0; color: #0c4a6e;">
            ${icon} ${message.replace(/\n/g, '<br>')}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://svlentes.com.br/area-usuario"
             style="background: #06b6d4; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
            Acessar Minha Conta
          </a>
        </div>

        <div style="margin-top: 35px; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
          <p style="font-size: 14px; color: #64748b; margin: 0 0 10px 0; font-weight: 600;">
            📞 Precisa de ajuda?
          </p>
          <p style="font-size: 14px; color: #64748b; margin: 5px 0;">
            WhatsApp: <a href="https://wa.me/5533998980026" style="color: #0891b2;">(33) 99898-0026</a>
          </p>
          <p style="font-size: 14px; color: #64748b; margin: 5px 0;">
            Email: <a href="mailto:contato@svlentes.com.br" style="color: #0891b2;">contato@svlentes.com.br</a>
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="font-size: 13px; color: #94a3b8;">
            © 2025 SV Lentes - Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
          </p>
        </div>
      </div>

    </body>
    </html>
  `
}

async function testReminder(name, subject, message, type) {
  console.log(`\n📧 Testing: ${name}`)
  
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: TEST_EMAIL,
      subject,
      html: createReminderHTML('Dr. Philipe Saraiva', message, type)
    })

    if (error) {
      console.log(`   ❌ Failed: ${error.message}`)
      return false
    }

    console.log(`   ✅ Success (ID: ${data.id})`)
    return true
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`)
    return false
  }
}

async function main() {
  console.log('🧪 Email Reminder System - Inline Tests')
  console.log('=' .repeat(60))
  console.log(`📧 Test Email: ${TEST_EMAIL}`)
  console.log('=' .repeat(60))

  const tests = [
    {
      name: 'Subscription Renewal (3 days)',
      subject: '🔔 Lembrete: Renovação da sua assinatura SV Lentes',
      message: 'Faltam apenas 3 dias para a renovação da sua assinatura! 📅\n\nData da renovação: 20/10/2025\n\nVocê receberá suas lentes no prazo previsto.',
      type: 'subscription_renewal'
    },
    {
      name: 'Order Delivery',
      subject: '📦 Seu pedido SV Lentes está a caminho!',
      message: 'Seu pedido está a caminho! 📦\n\nCódigo de rastreio: BR123456789BR\nPrevisão de entrega: 22/10/2025\n\nAcompanhe seu pedido em tempo real.',
      type: 'order_delivery'
    },
    {
      name: 'Appointment Reminder',
      subject: '👓 Lembrete: Consulta de acompanhamento SV Lentes',
      message: 'Lembrete de consulta de acompanhamento! 👓\n\nData: 25/10/2025\nHorário: 14:30\n\nSua saúde ocular é nossa prioridade.',
      type: 'appointment'
    },
    {
      name: 'General Reminder',
      subject: '🔔 Lembrete - SV Lentes',
      message: 'Este é um lembrete geral de teste do sistema de notificações por email da SV Lentes!',
      type: 'general'
    }
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    const result = await testReminder(test.name, test.subject, test.message, test.type)
    if (result) {
      passed++
    } else {
      failed++
    }
    await new Promise(r => setTimeout(r, 1500))
  }

  console.log('\n' + '=' .repeat(60))
  console.log('📊 TEST RESULTS')
  console.log('=' .repeat(60))
  console.log(`✅ Passed: ${passed}/${tests.length}`)
  console.log(`❌ Failed: ${failed}/${tests.length}`)

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!')
    console.log(`\n📬 Check your inbox at: ${TEST_EMAIL}`)
    console.log(`   You should have received ${tests.length} test emails.`)
  } else {
    console.log('\n⚠️  Some tests failed.')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
