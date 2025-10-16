/**
 * WhatsApp Support Integration API
 * Main endpoint for customer support via WhatsApp with LangChain integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { langchainSupportProcessor } from '@/lib/langchain-support-processor'
import { supportTicketManager } from '@/lib/support-ticket-manager'
import { supportEscalationSystem } from '@/lib/support-escalation-system'
import { supportKnowledgeBase } from '@/lib/support-knowledge-base'

// Webhook verification for WhatsApp Cloud API
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge)
  }

  return NextResponse.json({ error: 'Invalid verification' }, { status: 403 })
}

// Main message processing endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle WhatsApp Cloud API webhook
    if (body.object === 'whatsapp_business_account') {
      await processWhatsAppWebhook(body)
      return NextResponse.json({ status: 'processed' })
    }

    // Handle direct API calls for testing/manual intervention
    if (body.action === 'send_message') {
      return await handleDirectMessage(body)
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  } catch (error) {
    console.error('Error in WhatsApp support API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Process incoming WhatsApp webhook
 */
async function processWhatsAppWebhook(body: any) {
  try {
    const entry = body.entry?.[0]
    if (!entry?.changes) return

    for (const change of entry.changes) {
      const messages = change.value?.messages
      if (!messages) continue

      for (const message of messages) {
        await processIncomingMessage(message, change.value)
      }
    }
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error)
  }
}

/**
 * Process individual incoming message
 */
async function processIncomingMessage(message: any, metadata: any) {
  try {
    // Skip if message is from our own number
    if (message.from === metadata.metadata?.phone_number_id) {
      return
    }

    // Extract message content
    const messageContent = extractMessageContent(message)
    if (!messageContent) return

    const customerPhone = message.from
    const messageId = message.id

    // Get or create user profile
    const userProfile = await getOrCreateUserProfile(customerPhone, metadata)

    // Get conversation history
    const conversationHistory = await getConversationHistory(customerPhone, 10)
    const userHistory = await getUserSupportHistory(userProfile.id)

    // Get current context
    const context = {
      userHistory,
      previousTickets: userHistory.tickets || [],
      subscriptionInfo: userProfile.subscription,
      userProfile,
      conversationHistory: conversationHistory.map(msg => msg.content),
      lastIntent: userHistory.lastIntent
    }

    // Process message with LangChain
    const processingResult = await langchainSupportProcessor.processSupportMessage(
      messageContent,
      context
    )

    // Store interaction
    await storeInteraction({
      messageId,
      customerPhone,
      content: messageContent,
      intent: processingResult.intent,
      response: processingResult.response,
      escalationRequired: processingResult.escalationRequired,
      ticketCreated: processingResult.ticketCreated,
      userProfile
    })

    // Send response via WhatsApp
    await sendWhatsAppResponse(customerPhone, processingResult)

    // Handle escalation if required
    if (processingResult.escalationRequired && processingResult.ticketCreated) {
      await handleEscalationIfNeeded(customerPhone, processingResult, context)
    }

    console.log(`Processed WhatsApp message from ${customerPhone}: ${processingResult.intent.name}`)

  } catch (error) {
    console.error('Error processing incoming message:', error)

    // Send error response
    await sendErrorResponse(customerPhone, error.message)
  }
}

/**
 * Extract message content from WhatsApp message
 */
function extractMessageContent(message: any): string | null {
  if (message.text?.body) {
    return message.text.body.trim()
  }

  if (message.interactive?.type === 'list_reply') {
    return message.interactive.list_reply.title
  }

  if (message.interactive?.type === 'button_reply') {
    return message.interactive.button_reply.title
  }

  if (message.audio) {
    return '[Mensagem de áudio]'
  }

  if (message.image) {
    return '[Imagem enviada]'
  }

  return null
}

/**
 * Get or create user profile
 */
async function getOrCreateUserProfile(phone: string, metadata: any): Promise<any> {
  try {
    // Mock user profile for testing
    return {
      id: 'test_user_123',
      name: 'Cliente Teste',
      email: 'cliente@teste.com',
      phone,
      whatsapp: phone,
      subscription: null,
      subscriptionStatus: 'none'
    }
  } catch (error) {
    console.error('Error getting/creating user profile:', error)
    return {
      id: 'unknown',
      name: 'Cliente',
      phone,
      whatsapp: phone,
      subscription: null,
      subscriptionStatus: 'none'
    }
  }
}

/**
 * Get conversation history
 */
async function getConversationHistory(phone: string, limit: number = 10): Promise<any[]> {
  try {
    // Mock conversation history for testing
    return []
  } catch (error) {
    console.error('Error getting conversation history:', error)
    return []
  }
}

/**
 * Get user support history
 */
async function getUserSupportHistory(userId: string): Promise<any> {
  try {
    // Mock user history for testing
    return { tickets: [], lastIntent: null, lastInteraction: null }
  } catch (error) {
    console.error('Error getting user support history:', error)
    return { tickets: [], lastIntent: null, lastInteraction: null }
  }
}

/**
 * Store interaction in database
 */
async function storeInteraction(data: {
  messageId: string
  customerPhone: string
  content: string
  intent: any
  response: string
  escalationRequired: boolean
  ticketCreated: boolean
  userProfile: any
}) {
  try {
    // Mock interaction storage for testing
    console.log(`Storing interaction: ${data.content} -> ${data.response}`)
  } catch (error) {
    console.error('Error storing interaction:', error)
  }
}

/**
 * Send response via WhatsApp
 */
async function sendWhatsAppResponse(customerPhone: string, processingResult: any) {
  try {
    console.log(`Sending WhatsApp response to ${customerPhone}: ${processingResult.response}`)

    // Log quick replies if available
    if (processingResult.quickReplies && processingResult.quickReplies.length > 0) {
      console.log(`Quick replies: ${processingResult.quickReplies.join(', ')}`)
    }

  } catch (error) {
    console.error('Error sending WhatsApp response:', error)
  }
}

/**
 * Handle escalation if needed
 */
async function handleEscalationIfNeeded(
  customerPhone: string,
  processingResult: any,
  context: any
) {
  try {
    if (processingResult.escalationRequired) {
      console.log(`Escalation triggered for ${customerPhone} with intent: ${processingResult.intent.name}`)
    }
  } catch (error) {
    console.error('Error handling escalation:', error)
  }
}

/**
 * Send error response
 */
async function sendErrorResponse(customerPhone: string, errorMessage: string) {
  try {
    const errorResponse = `Desculpe, estou com dificuldades técnicas no momento. Um atendente humano já foi notificado para te ajudar. Por favor, tente novamente em alguns minutos.`

    console.log(`Sending error response to ${customerPhone}: ${errorResponse}`)

  } catch (error) {
    console.error('Error sending error response:', error)
  }
}

/**
 * Handle direct message sending (for testing/manual intervention)
 */
async function handleDirectMessage(body: any) {
  try {
    const { customerPhone, message, type = 'text' } = body

    if (!customerPhone || !message) {
      return NextResponse.json({ error: 'Missing customerPhone or message' }, { status: 400 })
    }

    // Mock WhatsApp message sending
    console.log(`Mock sending message to ${customerPhone}: ${message}`)

    return NextResponse.json({ status: 'sent' })

  } catch (error) {
    console.error('Error sending direct message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}