#!/usr/bin/env node

/**
 * WhatsApp Chatbot & Webhook Integration Test
 * Tests SendPulse WhatsApp API and webhook functionality
 */

const https = require('https')

// Configuration from environment
const SENDPULSE_CLIENT_ID = process.env.SENDPULSE_CLIENT_ID
const SENDPULSE_CLIENT_SECRET = process.env.SENDPULSE_CLIENT_SECRET
const SENDPULSE_BOT_ID = process.env.SENDPULSE_BOT_ID
const SENDPULSE_WEBHOOK_TOKEN = process.env.SENDPULSE_WEBHOOK_TOKEN
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://svlentes.shop'
const TEST_PHONE = process.env.TEST_PHONE || '5533998601427' // Default test number

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
}

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  debug: (msg) => console.log(`${colors.gray}→${colors.reset} ${msg}`)
}

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
}

function recordTest(name, passed, details = '') {
  results.tests.push({ name, passed, details })
  if (passed) {
    results.passed++
    log.success(`${name}`)
    if (details) log.debug(details)
  } else {
    results.failed++
    log.error(`${name}`)
    if (details) log.error(details)
  }
}

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => body += chunk)
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          }
          resolve(response)
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          })
        }
      })
    })

    req.on('error', reject)

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

// Test 1: Environment Variables
async function testEnvironmentVariables() {
  log.info('\n🔧 Test 1: Environment Variables')

  const envVars = {
    'SENDPULSE_CLIENT_ID': SENDPULSE_CLIENT_ID,
    'SENDPULSE_CLIENT_SECRET': SENDPULSE_CLIENT_SECRET,
    'SENDPULSE_BOT_ID': SENDPULSE_BOT_ID,
    'SENDPULSE_WEBHOOK_TOKEN': SENDPULSE_WEBHOOK_TOKEN
  }

  let allPresent = true
  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      recordTest(`${key} is set`, true, `Value: ${value.substring(0, 10)}...`)
    } else {
      recordTest(`${key} is set`, false, 'Missing in environment')
      allPresent = false
    }
  }

  return allPresent
}

// Test 2: SendPulse OAuth Authentication
async function testSendPulseAuth() {
  log.info('\n🔐 Test 2: SendPulse OAuth Authentication')

  try {
    const authData = {
      grant_type: 'client_credentials',
      client_id: SENDPULSE_CLIENT_ID,
      client_secret: SENDPULSE_CLIENT_SECRET
    }

    const response = await makeRequest({
      hostname: 'api.sendpulse.com',
      path: '/whatsapp/oauth/access_token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, authData)

    if (response.statusCode === 200 && response.body?.access_token) {
      recordTest('SendPulse OAuth authentication', true, 'Access token obtained successfully')
      return response.body.access_token
    } else {
      recordTest('SendPulse OAuth authentication', false,
        `Status: ${response.statusCode}, Response: ${JSON.stringify(response.body)}`)
      return null
    }
  } catch (error) {
    recordTest('SendPulse OAuth authentication', false, error.message)
    return null
  }
}

// Test 3: SendPulse Bot Configuration
async function testBotConfiguration(accessToken) {
  log.info('\n🤖 Test 3: SendPulse Bot Configuration')

  if (!accessToken) {
    recordTest('Bot configuration check', false, 'No access token available')
    return false
  }

  try {
    const response = await makeRequest({
      hostname: 'api.sendpulse.com',
      path: '/whatsapp/bots',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (response.statusCode === 200 && response.body?.data?.length > 0) {
      const bot = response.body.data[0]
      recordTest('Bot configuration check', true,
        `Bot ID: ${bot.id}, Name: ${bot.name || 'N/A'}, Status: ${bot.status || 'active'}`)
      return bot.id
    } else {
      recordTest('Bot configuration check', false,
        `No bots found. Status: ${response.statusCode}`)
      return null
    }
  } catch (error) {
    recordTest('Bot configuration check', false, error.message)
    return null
  }
}

// Test 4: Webhook Endpoint Availability
async function testWebhookEndpoint() {
  log.info('\n🌐 Test 4: Webhook Endpoint Availability')

  const webhookPath = '/api/webhooks/sendpulse'
  const testUrl = new URL(webhookPath, WEBHOOK_URL)

  try {
    // Test GET endpoint (verification)
    const getResponse = await makeRequest({
      hostname: testUrl.hostname,
      path: `${testUrl.pathname}?token=${SENDPULSE_WEBHOOK_TOKEN}&challenge=test123`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (getResponse.statusCode === 200) {
      recordTest('Webhook GET endpoint (verification)', true,
        `Response: ${getResponse.body || 'verified'}`)
    } else {
      recordTest('Webhook GET endpoint (verification)', false,
        `Status: ${getResponse.statusCode}`)
    }

    // Test POST endpoint (message handling)
    const testPayload = {
      event: 'webhook.verify',
      bot_id: SENDPULSE_BOT_ID,
      timestamp: Date.now()
    }

    const postResponse = await makeRequest({
      hostname: testUrl.hostname,
      path: testUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, testPayload)

    if (postResponse.statusCode === 200) {
      recordTest('Webhook POST endpoint (message handling)', true,
        `Response: ${JSON.stringify(postResponse.body)}`)
      return true
    } else {
      recordTest('Webhook POST endpoint (message handling)', false,
        `Status: ${postResponse.statusCode}`)
      return false
    }
  } catch (error) {
    recordTest('Webhook endpoint test', false, error.message)
    return false
  }
}

// Test 5: Send Test Message via SendPulse
async function testSendMessage(accessToken, botId) {
  log.info('\n📤 Test 5: Send Test Message via SendPulse')

  if (!accessToken || !botId) {
    recordTest('Send test message', false, 'Missing access token or bot ID')
    return false
  }

  try {
    const messageData = {
      bot_id: botId,
      phone: TEST_PHONE,
      message: {
        type: 'text',
        text: {
          body: '🧪 Test message from SVLentes WhatsApp integration test\n\nThis is an automated test to verify the chatbot is working correctly.'
        }
      }
    }

    const response = await makeRequest({
      hostname: 'api.sendpulse.com',
      path: '/whatsapp/contacts/sendByPhone',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }, messageData)

    if (response.statusCode === 200 || response.statusCode === 201) {
      recordTest('Send test message', true,
        `Message sent to ${TEST_PHONE}. Response: ${JSON.stringify(response.body)}`)
      return true
    } else {
      recordTest('Send test message', false,
        `Status: ${response.statusCode}, Response: ${JSON.stringify(response.body)}`)
      return false
    }
  } catch (error) {
    recordTest('Send test message', false, error.message)
    return false
  }
}

// Test 6: Webhook Processing Test
async function testWebhookProcessing() {
  log.info('\n🔄 Test 6: Webhook Message Processing')

  const webhookPath = '/api/webhooks/sendpulse'
  const testUrl = new URL(webhookPath, WEBHOOK_URL)

  try {
    // Simulate incoming WhatsApp message
    const mockWebhookPayload = {
      entry: [{
        id: 'test_entry',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '5533998601427',
              phone_number_id: 'test_phone_id'
            },
            contacts: [{
              profile: {
                name: 'Test User'
              },
              wa_id: TEST_PHONE
            }],
            messages: [{
              from: TEST_PHONE,
              id: `test_msg_${Date.now()}`,
              timestamp: Math.floor(Date.now() / 1000),
              text: {
                body: 'Olá, gostaria de agendar uma consulta'
              },
              type: 'text'
            }]
          },
          field: 'messages'
        }]
      }]
    }

    const response = await makeRequest({
      hostname: testUrl.hostname,
      path: testUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, mockWebhookPayload)

    if (response.statusCode === 200) {
      recordTest('Webhook message processing', true,
        `Response: ${JSON.stringify(response.body)}`)
      return true
    } else {
      recordTest('Webhook message processing', false,
        `Status: ${response.statusCode}, Response: ${JSON.stringify(response.body)}`)
      return false
    }
  } catch (error) {
    recordTest('Webhook message processing', false, error.message)
    return false
  }
}

// Test 7: Health Check
async function testHealthCheck() {
  log.info('\n❤️ Test 7: Application Health Check')

  const healthUrl = new URL('/api/health-check', WEBHOOK_URL)

  try {
    const response = await makeRequest({
      hostname: healthUrl.hostname,
      path: healthUrl.pathname,
      method: 'GET'
    })

    if (response.statusCode === 200) {
      recordTest('Application health check', true,
        `Status: healthy, Response: ${JSON.stringify(response.body)}`)
      return true
    } else {
      recordTest('Application health check', false,
        `Status: ${response.statusCode}`)
      return false
    }
  } catch (error) {
    recordTest('Application health check', false, error.message)
    return false
  }
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(60))
  console.log('  WhatsApp Chatbot & Webhook Integration Test')
  console.log('  SVLentes - SendPulse Integration')
  console.log('='.repeat(60))

  log.info(`\n📋 Test Configuration:`)
  log.debug(`Webhook URL: ${WEBHOOK_URL}`)
  log.debug(`Test Phone: ${TEST_PHONE}`)
  log.debug(`Timestamp: ${new Date().toISOString()}`)

  // Run all tests
  const envOk = await testEnvironmentVariables()

  let accessToken = null
  let botId = null

  if (envOk) {
    accessToken = await testSendPulseAuth()
    if (accessToken) {
      botId = await testBotConfiguration(accessToken)
    }
  }

  await testWebhookEndpoint()

  if (accessToken && botId) {
    await testSendMessage(accessToken, botId)
  }

  await testWebhookProcessing()
  await testHealthCheck()

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('  Test Summary')
  console.log('='.repeat(60))

  const total = results.passed + results.failed
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0

  console.log(`\nTotal Tests: ${total}`)
  log.success(`Passed: ${results.passed}`)
  log.error(`Failed: ${results.failed}`)
  console.log(`Pass Rate: ${passRate}%\n`)

  if (results.failed > 0) {
    console.log('❌ Failed Tests:')
    results.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`   - ${t.name}`)
        if (t.details) console.log(`     ${t.details}`)
      })
    console.log('')
  }

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0)
}

// Run tests
runTests().catch(error => {
  log.error(`Fatal error: ${error.message}`)
  console.error(error)
  process.exit(1)
})
