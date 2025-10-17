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
import { logger, LogCategory } from '@/lib/logger'
import { messageStatusTracker, MessageStatus } from '@/lib/message-status-tracker'
import { debugUtilities, DebugLevel } from '@/lib/debug-utilities'

// Set debug level from environment or default to standard
if (process.env.DEBUG_LEVEL) {
  debugUtilities.setDebugLevel(process.env.DEBUG_LEVEL as DebugLevel)
}

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
  const timer = logger.startTimer()
  const requestId = `wh_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

  try {
    const body = await request.json()

    // Log webhook received with tracing
    await debugUtilities.traceWebhookProcessing(body, 'sendpulse')
    logger.logSendPulseWebhook('received', {
      requestId,
      bodySize: JSON.stringify(body).length,
      eventType: body.event || body[0]?.title || 'unknown'
    })

    // Handle SendPulse native format (array of events)
    if (Array.isArray(body) && body.length > 0) {
      logger.info(LogCategory.SENDPULSE, `Processing ${body.length} events`)

      for (const event of body) {
        if (event.title === 'incoming_message' && event.service === 'whatsapp') {
          await processSendPulseNativeMessage(event, requestId)
        }
      }

      const duration = timer()
      logger.logPerformance('webhook_processed', { requestId, duration, eventCount: body.length })

      return NextResponse.json({ status: 'processed', requestId })
    }

    // Handle SendPulse Brazilian API format
    if (body.entry && body.entry[0]?.changes) {
      await processSendPulseWhatsAppMessage(body, requestId)

      const duration = timer()
      logger.logPerformance('webhook_processed', { requestId, duration })

      return NextResponse.json({ status: 'processed', requestId })
    }

    // Handle legacy events for backward compatibility
    if (body.event === 'message.new') {
      await processSendPulseMessage(body, requestId)

      const duration = timer()
      logger.logPerformance('webhook_processed', { requestId, duration })

      return NextResponse.json({ status: 'processed', requestId })
    }

    // Handle message status updates
    if (body.event === 'message.status') {
      await updateMessageStatus(body, requestId)

      const duration = timer()
      logger.logPerformance('status_updated', { requestId, duration })

      return NextResponse.json({ status: 'updated', requestId })
    }

    // Handle webhook verification/test
    if (body.event === 'webhook.verify') {
      logger.info(LogCategory.WEBHOOK, 'Webhook verification request')
      return NextResponse.json({ status: 'verified', requestId })
    }

    // Unknown event type
    logger.warn(LogCategory.WEBHOOK, 'Unknown webhook event type', {
      requestId,
      bodyKeys: Object.keys(body),
      event: body.event
    })

    return NextResponse.json({ status: 'received', requestId })

  } catch (error) {
    const duration = timer()
    logger.logSendPulseError('webhook_processing', error as Error, {
      requestId,
      duration
    })

    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    )
  }
}

/**
 * Process SendPulse native format message (array format)
 */
async function processSendPulseNativeMessage(event: any, requestId?: string) {
  const timer = logger.startTimer()
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

    // Log message received
    logger.logWhatsAppMessageReceived(customerPhone, messageId, messageContent.length, {
      requestId,
      customerName,
      format: 'native'
    })

    await debugUtilities.traceMessageProcessing('message_received', {
      messageId,
      phone: customerPhone,
      contentLength: messageContent.length
    })

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
    const langchainTimer = logger.startTimer()
    const processingResult = await langchainSupportProcessor.processSupportMessage(
      messageContent,
      context
    )
    const langchainDuration = langchainTimer()

    // Log intent detection
    logger.logWhatsAppIntentDetected(
      processingResult.intent.name,
      processingResult.intent.confidence || 0.8,
      customerPhone,
      { requestId, duration: langchainDuration }
    )

    logger.logLangChainProcessing(
      messageId,
      processingResult.intent.name,
      processingResult.intent.confidence || 0.8,
      langchainDuration,
      { requestId }
    )

    await debugUtilities.traceMessageProcessing('langchain_processed', {
      messageId,
      intent: processingResult.intent.name,
      confidence: processingResult.intent.confidence
    }, langchainDuration)

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

    await debugUtilities.traceMessageProcessing('interaction_stored', {
      messageId,
      escalationRequired: processingResult.escalationRequired
    })

    // Send response via SendPulse (pass contact window status from webhook)
    const sendTimer = logger.startTimer()
    await sendSendPulseResponse(customerPhone, processingResult, customerName, contact, requestId)
    const sendDuration = sendTimer()

    logger.logSendPulseMessageSent(customerPhone, messageId, processingResult.response.length, {
      requestId,
      duration: sendDuration,
      hasQuickReplies: processingResult.quickReplies && processingResult.quickReplies.length > 0
    })

    // Handle escalation if required
    if (processingResult.escalationRequired && processingResult.ticketCreated) {
      logger.logWhatsAppEscalation(customerPhone, processingResult.intent.name, 'MEDIUM', {
        requestId,
        messageId,
        ticketId: processingResult.ticketId
      })

      await handleEscalationIfNeeded(customerPhone, processingResult, context)
    }

    const totalDuration = timer()
    logger.info(LogCategory.WHATSAPP, `✅ Message processing completed`, {
      requestId,
      messageId,
      customerPhone,
      intent: processingResult.intent.name,
      totalDuration,
      stages: {
        langchain: langchainDuration,
        send: sendDuration
      }
    })

  } catch (error) {
    const duration = timer()
    logger.logSendPulseError('process_native_message', error as Error, {
      requestId,
      duration,
      customerPhone: event.contact?.phone
    })
  }
}

/**
 * Process SendPulse WhatsApp message (Brazilian API format)
 */
async function processSendPulseWhatsAppMessage(webhookData: any, requestId?: string) {
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
async function processSendPulseMessage(webhookData: any, requestId?: string) {
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
  contact?: any,
  requestId?: string
) {
  try {
    // IMPORTANT: If we're responding to a webhook message, the user just sent us a message,
    // so the 24h conversation window is DEFINITELY open. We must pass isChatOpened=true.
    const isChatOpened = true

    console.log(`[Webhook] Responding to incoming message - window is open: isChatOpened=${isChatOpened}`)

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
    logger.logSendPulseError('send_response', error as Error, {
      requestId,
      customerPhone,
      responseLength: processingResult.response?.length
    })
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
async function updateMessageStatus(webhookData: any, requestId?: string) {
  const timer = logger.startTimer()

  try {
    const { message_id, status, error_code, error_message, timestamp, metadata } = webhookData

    logger.info(LogCategory.SENDPULSE, `Message status update received`, {
      requestId,
      messageId: message_id,
      status,
      errorCode: error_code
    })

    // Map SendPulse status to our MessageStatus enum
    const mappedStatus = mapSendPulseStatus(status)

    // Update status in database
    const statusRecord = await messageStatusTracker.updateStatus({
      messageId: message_id,
      status: mappedStatus,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      errorCode: error_code,
      errorMessage: error_message,
      metadata
    })

    if (statusRecord) {
      const duration = timer()

      logger.logSendPulseMessageStatus(
        message_id,
        statusRecord.previousStatus || 'unknown',
        mappedStatus,
        duration,
        {
          requestId,
          deliveryTime: statusRecord.deliveryTime,
          readTime: statusRecord.readTime
        }
      )

      // Trace the status update
      await debugUtilities.traceMessageProcessing('status_update', {
        messageId: message_id,
        status: mappedStatus,
        duration
      }, duration)
    } else {
      logger.warn(LogCategory.SENDPULSE, `Message not found for status update`, {
        requestId,
        messageId: message_id,
        status
      })
    }
  } catch (error) {
    const duration = timer()
    logger.logSendPulseError('update_message_status', error as Error, {
      requestId,
      messageId: webhookData.message_id,
      duration
    })
  }
}

/**
 * Map SendPulse status to MessageStatus enum
 */
function mapSendPulseStatus(sendpulseStatus: string): MessageStatus {
  const statusMap: Record<string, MessageStatus> = {
    'queued': MessageStatus.QUEUED,
    'sending': MessageStatus.SENDING,
    'sent': MessageStatus.SENT,
    'delivered': MessageStatus.DELIVERED,
    'read': MessageStatus.READ,
    'failed': MessageStatus.FAILED,
    'rejected': MessageStatus.REJECTED,
    'expired': MessageStatus.EXPIRED
  }

  return statusMap[sendpulseStatus.toLowerCase()] || MessageStatus.SENT
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