/**
 * SendPulse Webhook Integration
 * Receives WhatsApp messages via SendPulse API and processes them
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { langchainSupportProcessor } from '@/lib/langchain-support-processor'
import { supportTicketManager } from '@/lib/support-ticket-manager'
import { supportEscalationSystem } from '@/lib/support-escalation-system'
import { sendPulseClient } from '@/lib/sendpulse-client'
import { sendMessageWithFallback } from '@/lib/mcp-sendpulse-client'
import {
  getConversationHistory,
  getUserSupportHistory,
  getOrCreateUserProfile,
  storeInteraction
} from '@/lib/whatsapp-conversation-service'
import { logger, LogCategory } from '@/lib/logger'
import { messageStatusTracker, MessageStatus } from '@/lib/message-status-tracker'
import { debugUtilities, DebugLevel } from '@/lib/debug-utilities'

// C6: Zod schemas for webhook payload validation
const MessageTextSchema = z.object({
  body: z.string().max(5000).optional()
})

const InteractiveButtonReplySchema = z.object({
  type: z.literal('button_reply'),
  button_reply: z.object({
    title: z.string().max(200)
  })
})

const InteractiveListReplySchema = z.object({
  type: z.literal('list_reply'),
  list_reply: z.object({
    title: z.string().max(200)
  })
})

const InteractiveSchema = z.union([
  InteractiveButtonReplySchema,
  InteractiveListReplySchema
])

const MessageChannelDataSchema = z.object({
  message: z.object({
    type: z.string().optional(),
    text: MessageTextSchema.optional(),
    interactive: InteractiveSchema.optional()
  }).optional()
}).optional()

const MessageSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  text: z.union([z.string(), MessageTextSchema]).optional(),
  body: z.string().optional(),
  channel_data: MessageChannelDataSchema
})

const ContactSchema = z.object({
  id: z.string().optional(),
  phone: z.string().regex(/^\d{10,15}$/, 'Invalid phone number format'),
  name: z.string().max(200).optional(),
  username: z.string().max(200).optional(),
  is_chat_opened: z.boolean().optional()
})

const SendPulseNativeEventSchema = z.object({
  title: z.literal('incoming_message'),
  service: z.literal('whatsapp'),
  info: z.object({
    message: MessageSchema
  }),
  contact: ContactSchema,
  bot: z.object({
    id: z.string()
  }).optional()
})

const SendPulseArraySchema = z.array(SendPulseNativeEventSchema)

const SendPulseWebhookVerifySchema = z.object({
  event: z.literal('webhook.verify')
})

const SendPulseMessageStatusSchema = z.object({
  event: z.literal('message.status'),
  message_id: z.string(),
  status: z.string(),
  error_code: z.string().optional(),
  error_message: z.string().optional(),
  timestamp: z.string().optional(),
  metadata: z.any().optional()
})

const SendPulseLegacyMessageSchema = z.object({
  event: z.literal('message.new'),
  message: MessageSchema,
  contact: ContactSchema
})

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
    // C6: Parse and validate JSON payload
    let body: any
    try {
      const rawBody = await request.text()

      // Limit body size to prevent DoS
      if (rawBody.length > 500000) { // 500KB limit
        logger.warn(LogCategory.WEBHOOK, 'Webhook payload too large', {
          requestId,
          size: rawBody.length
        })
        return NextResponse.json(
          { error: 'Payload too large', requestId },
          { status: 413 }
        )
      }

      body = JSON.parse(rawBody)
    } catch (parseError) {
      logger.error(LogCategory.WEBHOOK, 'Invalid JSON payload', {
        requestId,
        error: parseError instanceof Error ? parseError.message : 'Unknown'
      })
      return NextResponse.json(
        { error: 'Invalid JSON payload', requestId },
        { status: 400 }
      )
    }

    // Log webhook received with tracing
    await debugUtilities.traceWebhookProcessing(body, 'sendpulse')
    logger.logSendPulseWebhook('received', {
      requestId,
      bodySize: JSON.stringify(body).length,
      eventType: body.event || body[0]?.title || 'unknown'
    })

    // C6: Handle SendPulse native format (array of events) with validation
    if (Array.isArray(body) && body.length > 0) {
      // Validate array format
      const validationResult = SendPulseArraySchema.safeParse(body)
      if (!validationResult.success) {
        logger.warn(LogCategory.WEBHOOK, 'Invalid SendPulse array format', {
          requestId,
          errors: validationResult.error.errors
        })
        // Return 200 to prevent SendPulse retries on malformed data
        return NextResponse.json({ status: 'invalid_format', requestId })
      }

      logger.info(LogCategory.SENDPULSE, `Processing ${body.length} events`)

      for (const event of validationResult.data) {
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

    // C6: Handle legacy events for backward compatibility with validation
    if (body.event === 'message.new') {
      const validationResult = SendPulseLegacyMessageSchema.safeParse(body)
      if (!validationResult.success) {
        logger.warn(LogCategory.WEBHOOK, 'Invalid legacy message format', {
          requestId,
          errors: validationResult.error.errors
        })
        return NextResponse.json({ status: 'invalid_format', requestId })
      }

      await processSendPulseMessage(validationResult.data, requestId)

      const duration = timer()
      logger.logPerformance('webhook_processed', { requestId, duration })

      return NextResponse.json({ status: 'processed', requestId })
    }

    // C6: Handle message status updates with validation
    if (body.event === 'message.status') {
      const validationResult = SendPulseMessageStatusSchema.safeParse(body)
      if (!validationResult.success) {
        logger.warn(LogCategory.WEBHOOK, 'Invalid message status format', {
          requestId,
          errors: validationResult.error.errors
        })
        return NextResponse.json({ status: 'invalid_format', requestId })
      }

      await updateMessageStatus(validationResult.data, requestId)

      const duration = timer()
      logger.logPerformance('status_updated', { requestId, duration })

      return NextResponse.json({ status: 'updated', requestId })
    }

    // C6: Handle webhook verification/test with validation
    if (body.event === 'webhook.verify') {
      const validationResult = SendPulseWebhookVerifySchema.safeParse(body)
      if (!validationResult.success) {
        logger.warn(LogCategory.WEBHOOK, 'Invalid webhook verify format', {
          requestId
        })
        return NextResponse.json({ status: 'invalid_format', requestId })
      }

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
    let messageContent: string | null = null

    // Check for interactive messages (button replies, list replies)
    if (message.channel_data?.message?.type === 'interactive') {
      console.log('[DEBUG] Interactive message detected!')
      console.log('[DEBUG] Interactive type:', message.channel_data.message.interactive?.type)
      console.log('[DEBUG] Interactive data:', JSON.stringify(message.channel_data.message.interactive, null, 2))

      const interactive = message.channel_data.message.interactive
      if (interactive?.type === 'button_reply') {
        messageContent = interactive.button_reply.title
        console.log('[DEBUG] Button reply extracted:', messageContent)
      } else if (interactive?.type === 'list_reply') {
        messageContent = interactive.list_reply.title
        console.log('[DEBUG] List reply extracted:', messageContent)
      }
    }

    // Fallback to text messages
    if (!messageContent) {
      messageContent =
        message.channel_data?.message?.text?.body || // SendPulse real format
        message.text || // Fallback
        message.body || // Fallback
        null
    }

    console.log('[DEBUG] Final messageContent:', messageContent)

    if (!messageContent || typeof messageContent !== 'string') {
      console.warn('No text content in SendPulse message')
      console.warn('[DEBUG] Message structure keys:', Object.keys(message))
      console.warn('[DEBUG] Message.text:', message.text)
      console.warn('[DEBUG] Message.body:', message.body)
      console.warn('[DEBUG] Message.channel_data:', message.channel_data)
      console.warn('[DEBUG] Message.type:', message.channel_data?.message?.type)
      console.warn('[DEBUG] Message.interactive:', message.channel_data?.message?.interactive)
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
 * Send response via SendPulse API with template fallback
 *
 * CRITICAL FIX: Do NOT assume window is open just because we're in a webhook
 * - Webhook flag is_chat_opened can be unreliable (test data, old data)
 * - SendPulseClient will verify window status via API before sending
 * - If window is closed, it will automatically use template message fallback
 */
async function sendSendPulseResponse(
  customerPhone: string,
  processingResult: any,
  customerName: string,
  contact?: any,
  requestId?: string
) {
  try {
    console.log(`[Webhook] Responding to incoming message from ${customerPhone}`)
    console.log(`[Webhook] SendPulseClient will verify 24h window status via API`)

    // Try direct API first (will auto-fallback to template if window closed)
    try {
      // Send message via SendPulse client
      // DO NOT pass isChatOpened - let the client verify via API
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

      logger.info(LogCategory.SENDPULSE, `✅ Message sent successfully`, {
        requestId,
        phone: customerPhone,
        method: 'sendpulse_client'
      })

      // Log quick replies if available
      if (processingResult.quickReplies && processingResult.quickReplies.length > 0) {
        console.log(`Quick replies: ${processingResult.quickReplies.join(', ')}`)
      }

    } catch (directApiError) {
      // Direct API failed (including template fallback) - try MCP as last resort
      logger.warn(LogCategory.SENDPULSE, '⚠️ SendPulse client failed (including template fallback), trying MCP', {
        requestId,
        phone: customerPhone,
        error: directApiError instanceof Error ? directApiError.message : 'Unknown'
      })

      const botId = process.env.SENDPULSE_BOT_ID
      if (!botId) {
        throw new Error('SENDPULSE_BOT_ID not configured for MCP fallback')
      }

      // Use MCP as absolute last resort
      const fallbackResult = await sendMessageWithFallback(
        sendPulseClient,
        {
          phone: customerPhone,
          message: processingResult.response,
          botId
        }
      )

      if (fallbackResult.success) {
        logger.info(LogCategory.SENDPULSE, `✅ Message sent via ${fallbackResult.method.toUpperCase()} fallback`, {
          requestId,
          phone: customerPhone,
          method: fallbackResult.method
        })
      } else {
        throw new Error(`All delivery methods failed: ${fallbackResult.error}`)
      }
    }

  } catch (error) {
    logger.logSendPulseError('send_response_all_methods_failed', error as Error, {
      requestId,
      customerPhone,
      responseLength: processingResult.response?.length
    })

    // Log critical failure
    logger.error(LogCategory.SENDPULSE, '🚨 CRITICAL: All message delivery methods failed', {
      requestId,
      phone: customerPhone,
      error: error instanceof Error ? error.message : 'Unknown',
      recommendation: 'Configure approved template message in SendPulse dashboard'
    })

    // Don't throw - webhook should return 200 OK even if delivery fails
    // to prevent SendPulse from retrying indefinitely
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