/**
 * SendPulse Webhook Integration
 * Receives WhatsApp messages via SendPulse API and processes them
 */

import { NextRequest, NextResponse } from 'next/server'
import { langchainSupportProcessor } from '@/lib/langchain-support-processor'
import { supportTicketManager } from '@/lib/support-ticket-manager'
import { supportEscalationSystem } from '@/lib/support-escalation-system'
import { sendPulseClient } from '@/lib/sendpulse-client'
import {
  getConversationHistory,
  getUserSupportHistory,
  getOrCreateUserProfile,
  storeInteraction
} from '@/lib/whatsapp-conversation-service'

// SendPulse webhook verification (SendPulse doesn't use token verification)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const challenge = searchParams.get('challenge')

  // SendPulse webhook verification - respond with challenge if present
  if (challenge) {
    return new NextResponse(challenge, { status: 200 })
  }

  // Return OK for health checks
  return NextResponse.json({ status: 'webhook_active', timestamp: new Date().toISOString() })
}

// Main webhook handler for SendPulse messages (Brazilian API)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('SendPulse webhook received:', body)

    // Handle SendPulse native format (array of events)
    if (Array.isArray(body) && body.length > 0) {
      for (const event of body) {
        if (event.title === 'incoming_message' && event.service === 'whatsapp') {
          await processSendPulseNativeMessage(event)
        }
      }
      return NextResponse.json({ status: 'processed' })
    }

    // Handle SendPulse Brazilian API format
    if (body.entry && body.entry[0]?.changes) {
      await processSendPulseWhatsAppMessage(body)
      return NextResponse.json({ status: 'processed' })
    }

    // Handle legacy events for backward compatibility
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
 * Process SendPulse native format message (array format)
 */
async function processSendPulseNativeMessage(event: any) {
  try {
    // Extract message from info object
    const message = event.info?.message
    const contact = event.contact
    const bot = event.bot

    if (!message || !contact) {
      console.warn('Invalid SendPulse native message structure')
      return
    }

    // Debug: Log full message structure to understand format
    console.log('[DEBUG] Full message object:', JSON.stringify(message, null, 2))
    console.log('[DEBUG] Contact phone:', contact.phone)

    // Extract message text from the message object
    // SendPulse sends text in: message.channel_data.message.text.body
    const messageContent =
      message.channel_data?.message?.text?.body || // SendPulse real format
      message.text || // Fallback
      message.body || // Fallback
      null

    if (!messageContent || typeof messageContent !== 'string') {
      console.warn('No text content in SendPulse message')
      console.warn('[DEBUG] Message structure keys:', Object.keys(message))
      console.warn('[DEBUG] Message.text:', message.text)
      console.warn('[DEBUG] Message.body:', message.body)
      console.warn('[DEBUG] Message.channel_data:', message.channel_data)
      return
    }

    const customerPhone = contact.phone
    const messageId = message.id || `msg_${Date.now()}`
    const customerName = contact.name || contact.username || 'Cliente'

    console.log(`Processing SendPulse native message from ${customerPhone}: "${messageContent}"`)

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

    // Send response via SendPulse (pass contact window status from webhook)
    await sendSendPulseResponse(customerPhone, processingResult, customerName, contact)

    // Handle escalation if required
    if (processingResult.escalationRequired && processingResult.ticketCreated) {
      await handleEscalationIfNeeded(customerPhone, processingResult, context)
    }

    console.log(`✅ SendPulse native message processed: ${customerPhone} - ${processingResult.intent.name}`)

  } catch (error) {
    console.error('Error processing SendPulse native message:', error)
  }
}

/**
 * Process SendPulse WhatsApp message (Brazilian API format)
 */
async function processSendPulseWhatsAppMessage(webhookData: any) {
  try {
    const entry = webhookData.entry?.[0]
    if (!entry?.changes) return

    for (const change of entry.changes) {
      const messages = change.value?.messages
      if (!messages) continue

      for (const message of messages) {
        await processWhatsAppMessage(message, change.value)
      }
    }
  } catch (error) {
    console.error('Error processing SendPulse WhatsApp message:', error)
  }
}

/**
 * Process individual WhatsApp message from SendPulse
 */
async function processWhatsAppMessage(message: any, metadata: any) {
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
    const customerName = metadata.contacts?.[0]?.profile?.name || 'Cliente'
    const contact = metadata.contacts?.[0] || {}

    // Get or create user profile
    const userProfile = await getOrCreateUserProfile(metadata.contacts?.[0] || {}, customerPhone)

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

    // Send response via SendPulse (pass contact window status from webhook)
    await sendSendPulseResponse(customerPhone, processingResult, customerName, contact)

    // Handle escalation if required
    if (processingResult.escalationRequired && processingResult.ticketCreated) {
      await handleEscalationIfNeeded(customerPhone, processingResult, context)
    }

    console.log(`Processed SendPulse WhatsApp message from ${customerPhone}: ${processingResult.intent.name}`)

  } catch (error) {
    console.error('Error processing WhatsApp message:', error)
  }
}

/**
 * Process incoming SendPulse message (legacy format)
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

    // Send response via SendPulse (pass contact window status from webhook)
    await sendSendPulseResponse(customerPhone, processingResult, customerName, contact)

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
 * Send response via SendPulse API
 */
async function sendSendPulseResponse(
  customerPhone: string,
  processingResult: any,
  customerName: string,
  contact?: any
) {
  try {
    // Extract conversation window status from webhook contact data
    const isChatOpened = contact?.is_chat_opened ?? undefined

    console.log(`[Webhook] Contact window status from webhook: is_chat_opened=${isChatOpened}`)

    // Send message via SendPulse client
    if (processingResult.quickReplies && processingResult.quickReplies.length > 0) {
      await sendPulseClient.sendMessageWithQuickReplies(
        customerPhone,
        processingResult.response,
        processingResult.quickReplies,
        { isChatOpened }
      )
    } else {
      await sendPulseClient.sendMessage({
        phone: customerPhone,
        message: processingResult.response,
        isChatOpened
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