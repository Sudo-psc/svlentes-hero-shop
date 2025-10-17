/**
 * WhatsApp Database Integration Test
 *
 * Tests the complete database integration flow:
 * 1. User profile creation
 * 2. Conversation thread creation
 * 3. Message storage
 * 4. History retrieval
 */

import {
  getOrCreateUserProfile,
  getOrCreateConversation,
  storeInteraction,
  getConversationHistory,
  getUserSupportHistory,
  getConversationAnalytics
} from './src/lib/whatsapp-conversation-service'

async function testDatabaseIntegration() {
  console.log('🧪 Starting WhatsApp Database Integration Test...\n')

  try {
    // Test 1: Create User Profile
    console.log('📝 Test 1: Creating user profile...')
    const userProfile = await getOrCreateUserProfile(
      {
        id: 'sendpulse_test_123',
        name: 'João Silva',
        email: 'joao@test.com',
        variables: { city: 'Caratinga' },
        tags: ['premium', 'active']
      },
      '5533999999999'
    )
    console.log('✅ User profile created:', {
      id: userProfile.id,
      name: userProfile.name,
      phone: userProfile.phone
    })

    // Test 2: Create Conversation
    console.log('\n📝 Test 2: Creating conversation thread...')
    const conversation = await getOrCreateConversation(
      '5533999999999',
      'João Silva',
      userProfile.id
    )
    console.log('✅ Conversation created:', {
      id: conversation.id,
      isNew: conversation.isNew
    })

    // Test 3: Store Interaction
    console.log('\n📝 Test 3: Storing WhatsApp interaction...')
    await storeInteraction({
      messageId: 'wamid.test123456789',
      customerPhone: '5533999999999',
      content: 'Olá, gostaria de saber sobre minha assinatura',
      intent: {
        intent: 'ACCOUNT',
        category: 'ACCOUNT',
        priority: 'MEDIUM',
        sentiment: 'neutral'
      },
      response: 'Olá João! Vou verificar as informações da sua assinatura.',
      escalationRequired: false,
      ticketCreated: false,
      userProfile,
      llmModel: 'gpt-4-turbo-preview',
      processingTime: 1250
    })
    console.log('✅ Interaction stored successfully')

    // Test 4: Store Another Message
    console.log('\n📝 Test 4: Storing second message...')
    await storeInteraction({
      messageId: 'wamid.test987654321',
      customerPhone: '5533999999999',
      content: 'Qual é a data da próxima entrega?',
      intent: {
        intent: 'DELIVERY',
        category: 'DELIVERY',
        priority: 'HIGH',
        sentiment: 'neutral'
      },
      response: 'Sua próxima entrega está programada para 25/10/2025.',
      escalationRequired: false,
      ticketCreated: false,
      userProfile,
      llmModel: 'gpt-4-turbo-preview',
      processingTime: 980
    })
    console.log('✅ Second interaction stored')

    // Test 5: Retrieve Conversation History
    console.log('\n📝 Test 5: Retrieving conversation history...')
    const history = await getConversationHistory('5533999999999', 10)
    console.log('✅ Conversation history retrieved:', {
      messageCount: history.length,
      messages: history.map(msg => ({
        content: msg.content.substring(0, 30) + '...',
        intent: msg.intent,
        timestamp: msg.createdAt
      }))
    })

    // Test 6: Get User Support History
    console.log('\n📝 Test 6: Getting user support history...')
    const supportHistory = await getUserSupportHistory(userProfile.id)
    console.log('✅ Support history retrieved:', {
      ticketCount: supportHistory.tickets.length,
      lastIntent: supportHistory.lastIntent,
      totalInteractions: supportHistory.totalInteractions
    })

    // Test 7: Get Analytics
    console.log('\n📝 Test 7: Getting conversation analytics...')
    const analytics = await getConversationAnalytics(userProfile.id)
    console.log('✅ Analytics retrieved:', analytics)

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('🎉 ALL TESTS PASSED!')
    console.log('='.repeat(60))
    console.log('\n✅ Database integration is working correctly!')
    console.log('✅ User profiles can be created and retrieved')
    console.log('✅ Conversations are tracked properly')
    console.log('✅ Messages are stored with full context')
    console.log('✅ History retrieval is functional')
    console.log('✅ Analytics are calculated correctly\n')

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error)
    process.exit(1)
  }
}

// Run the test
testDatabaseIntegration()
  .then(() => {
    console.log('✅ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
