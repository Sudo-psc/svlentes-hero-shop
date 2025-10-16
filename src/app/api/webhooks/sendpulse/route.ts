/**
 * SendPulse Webhook Integration
 * Receives WhatsApp messages via SendPulse API and processes them
 */

import { NextRequest, NextResponse } from 'next/server'
import { langchainSupportProcessor } from '@/lib/langchain-support-processor'
import { supportTicketManager } from '@/lib/support-ticket-manager'
import { supportEscalationSystem } from '@/lib/support-escalation-system'
import { sendPulseClient } from '@/lib/sendpulse-client'

// SendPulse webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const challenge = searchParams.get('challenge')

  // Verify SendPulse webhook token
  if (token === process.env.SENDPULSE_WEBHOOK_TOKEN) {
    return new NextResponse(challenge || 'verified')
  }

  return NextResponse.json({ error: 'Invalid verification' }, { status: 403 })
}

// Main webhook handler for SendPulse messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('SendPulse webhook received:', body)

    // Handle different SendPulse webhook events
    if (body.event === 'message.new') {
      await processSendPulseMessage(body)
      return NextResponse.json({ status: 'processed' })
    }

    // Handle message status updates
    if (body.event === 'message.status') {
      await updateMessageStatus(body)
      return NextResponse.json({ status: 'updated' })
    }

    // Handle webhook verification/test
    if (body.event === 'webhook.verify') {
      return NextResponse.json({ status: 'verified' })
    }

    return NextResponse.json({ status: 'received' })

  } catch (error) {
    console.error('Error processing SendPulse webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Process incoming SendPulse message
 */
async function processSendPulseMessage(webhookData: any) {
  try {
    const message = webhookData.message
    const contact = webhookData.contact

    if (!message || !contact) {
      console.warn('Invalid message structure from SendPulse')
      return
    }

    // Extract message content
    const messageContent = extractMessageContent(message)
    if (!messageContent) return

    const customerPhone = contact.phone || contact.identifier
    const messageId = message.id
    const customerName = contact.name || 'Cliente'

    // Get or create user profile
    const userProfile = await getOrCreateUserProfile(contact, customerPhone)

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

    // Send response via SendPulse
    await sendSendPulseResponse(customerPhone, processingResult, customerName)

    // Handle escalation if required
    if (processingResult.escalationRequired && processingResult.ticketCreated) {
      await handleEscalationIfNeeded(customerPhone, processingResult, context)
    }

    console.log(`Processed SendPulse message from ${customerPhone}: ${processingResult.intent.name}`)

  } catch (error) {
    console.error('Error processing SendPulse message:', error)
  }
}

/**
 * Extract message content from SendPulse message
 */
function extractMessageContent(message: any): string | null {
  // Handle text messages
  if (message.text?.body) {
    return message.text.body.trim()
  }

  // Handle interactive replies
  if (message.interactive?.type === 'list_reply') {
    return message.interactive.list_reply.title
  }

  if (message.interactive?.type === 'button_reply') {
    return message.interactive.button_reply.title
  }

  // Handle media messages
  if (message.audio) {
    return '[Mensagem de áudio]'
  }

  if (message.image) {
    return '[Imagem enviada]'
  }

  if (message.video) {
    return '[Vídeo enviado]'
  }

  if (message.document) {
    return '[Documento enviado]'
  }

  return null
}

/**
 * Get or create user profile from SendPulse contact data
 */
async function getOrCreateUserProfile(contact: any, phone: string): Promise<any> {
  try {
    // Extract contact information from SendPulse
    const userProfile = {
      id: contact.id || `sendpulse_${phone}`,
      name: contact.name || 'Cliente',
      email: contact.email || null,
      phone,
      whatsapp: phone,
      subscription: null,
      subscriptionStatus: 'none',
      source: 'sendpulse',
      metadata: {
        sendpulseId: contact.id,
        variables: contact.variables || {},
        tags: contact.tags || []
      }
    }

    // TODO: Integrate with database to persist user profile
    return userProfile

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
    // TODO: Integrate with database to fetch conversation history
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
    // TODO: Integrate with support ticket system
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
    // TODO: Integrate with database to store interactions
    console.log(`Storing SendPulse interaction: ${data.content} -> ${data.response}`)
  } catch (error) {
    console.error('Error storing interaction:', error)
  }
}

/**
 * Send response via SendPulse API
 */
async function sendSendPulseResponse(
  customerPhone: string,
  processingResult: any,
  customerName: string
) {
  try {
    // Send message via SendPulse client
    if (processingResult.quickReplies && processingResult.quickReplies.length > 0) {
      await sendPulseClient.sendMessageWithQuickReplies(
        customerPhone,
        processingResult.response,
        processingResult.quickReplies
      )
    } else {
      await sendPulseClient.sendMessage({
        phone: customerPhone,
        message: processingResult.response
      })
    }

    console.log(`SendPulse message sent to ${customerPhone}`)

    // Log quick replies if available
    if (processingResult.quickReplies && processingResult.quickReplies.length > 0) {
      console.log(`Quick replies: ${processingResult.quickReplies.join(', ')}`)
    }

  } catch (error) {
    console.error('Error sending SendPulse response:', error)
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

      // TODO: Integrate with escalation system
      // await supportEscalationSystem.createEscalation({
      //   customerPhone,
      //   intent: processingResult.intent,
      //   context,
      //   priority: processingResult.intent.priority
      // })
    }
  } catch (error) {
    console.error('Error handling escalation:', error)
  }
}

/**
 * Update message status
 */
async function updateMessageStatus(webhookData: any) {
  try {
    const { message_id, status } = webhookData
    console.log(`Message ${message_id} status updated to: ${status}`)

    // TODO: Update message status in database
  } catch (error) {
    console.error('Error updating message status:', error)
  }
}

/**
 * Test endpoint for SendPulse integration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { testMessage, customerPhone } = body

    if (!testMessage || !customerPhone) {
      return NextResponse.json(
        { error: 'testMessage and customerPhone are required' },
        { status: 400 }
      )
    }

    // Test message processing
    const context = {
      userHistory: [],
      previousTickets: [],
      subscriptionInfo: null,
      userProfile: { name: 'Test User', phone: customerPhone },
      conversationHistory: [],
      lastIntent: null
    }

    const result = await langchainSupportProcessor.processSupportMessage(
      testMessage,
      context
    )

    return NextResponse.json({
      success: true,
      processingResult: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in SendPulse test endpoint:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    )
  }
}