#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

const { Resend } = require('resend')

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.NEXT_PUBLIC_EMAIL_FROM || 'SV Lentes <noreply@svlentes.shop>'
const TEST_EMAIL = 'contato@svlentes.com.br'

async function testResendDirect() {
  console.log('🧪 Testing Resend API Directly\n')
  console.log('=' .repeat(60))
  console.log(`API Key: ${RESEND_API_KEY ? '✅ Found' : '❌ Missing'}`)
  console.log(`From: ${EMAIL_FROM}`)
  console.log(`To: ${TEST_EMAIL}`)
  console.log('=' .repeat(60))

  if (!RESEND_API_KEY) {
    console.error('\n❌ RESEND_API_KEY not found in environment')
    process.exit(1)
  }

  try {
    const resend = new Resend(RESEND_API_KEY)

    console.log('\n📧 Sending test email...')

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: TEST_EMAIL,
      subject: '🧪 Resend API Test - SV Lentes',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">SV Lentes</h1>
            <p style="color: white; margin: 10px 0 0 0;">Direct Resend API Test</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 10px 10px;">
            <h2 style="color: #0891b2;">✅ Resend API is Working!</h2>
            
            <p>This email confirms that:</p>
            <ul>
              <li>✅ Resend API key is valid</li>
              <li>✅ Email sending is functional</li>
              <li>✅ Email templates render correctly</li>
            </ul>
            
            <p style="margin-top: 30px; padding: 15px; background: #f0f9ff; border-left: 4px solid #06b6d4;">
              <strong>Next Step:</strong> Test the full reminder system through the API routes.
            </p>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('\n❌ Resend API Error:')
      console.error(JSON.stringify(error, null, 2))
      process.exit(1)
    }

    console.log('\n✅ Email sent successfully!')
    console.log('\nResponse:')
    console.log(JSON.stringify(data, null, 2))
    console.log(`\n📬 Check your inbox at: ${TEST_EMAIL}`)
    console.log(`   Email ID: ${data.id}`)

  } catch (error) {
    console.error('\n❌ Exception:', error.message)
    console.error(error)
    process.exit(1)
  }
}

testResendDirect()
