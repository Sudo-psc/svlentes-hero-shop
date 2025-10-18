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
import {
  getConversationHistory,
  getUserSupportHistory,
  getOrCreateUserProfile,
  storeInteraction
} from '@/lib/whatsapp-conversation-service'
import { logger, LogCategory } from '@/lib/logger'
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter'
// TODO: Re-enable when message-status-tracker and debug-utilities are implemented
// import { messageStatusTracker, MessageStatus } from '@/lib/message-status-tracker'
// import { debugUtilities, DebugLevel } from '@/lib/debug-utilities'

// C6: Zod validation schemas for webhook payloads (500KB limit)
const MAX_PAYLOAD_SIZE = 500 * 1024 // 500KB

const SendPulseNativeEventSchema = z.object({
  title: z.string(),
  service: z.string().optional(),
  info: z.object({
    message: z.object({
      id: z.string().optional(),
      channel_data: z.any().optional(),
      text: z.string().optional(),
      body: z.string().optional()
    }).optional()
  }).optional(),
  contact: z.object({
    phone: z.string(),
    name: z.string().optional(),
    username: z.string().optional()
  }),
  bot: z.any().optional()
})

const SendPulseBrazilianAPISchema = z.object({
  entry: z.array(z.object({
    changes: z.array(z.object({
      value: z.object({
        messages: z.array(z.any()).optional(),
        metadata: z.any().optional(),
        contacts: z.array(z.any()).optional()
      })
    }))
  }))
})

const SendPulseLegacyEventSchema = z.object({
  event: z.string(),
  message: z.any().optional(),
  contact: z.object({
    phone: z.string().optional(),
    identifier: z.string().optional(),
    name: z.string().optional()
  }).optional(),
  message_id: z.string().optional(),
  status: z.string().optional(),
  error_code: z.string().optional(),
  error_message: z.string().optional(),
  timestamp: z.string().optional(),
  metadata: z.any().optional()
})

// Set debug level from environment or default to standard
// if (process.env.DEBUG_LEVEL) {
//   debugUtilities.setDebugLevel(process.env.DEBUG_LEVEL as DebugLevel)
// }

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
    // P4: Rate limiting - IP-based protection
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const ipRateLimit = checkRateLimit({
      ...RateLimitPresets.WEBHOOK_IP,
      identifier: ip
    })

    if (ipRateLimit.limited) {
      logger.warn(LogCategory.WEBHOOK, 'Rate limit exceeded for IP', {
        requestId,
        ip,
        resetAt: new Date(ipRateLimit.resetAt).toISOString()
      })

      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil((ipRateLimit.resetAt - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((ipRateLimit.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(RateLimitPresets.WEBHOOK_IP.maxRequests),
            'X-RateLimit-Remaining': String(ipRateLimit.remaining),
            'X-RateLimit-Reset': new Date(ipRateLimit.resetAt).toISOString()
          }
        }
      )
    }

    const bodyText = await request.text()

    // C6: Validate payload size (500KB limit)
    if (bodyText.length > MAX_PAYLOAD_SIZE) {
      logger.error(LogCategory.WEBHOOK, 'Payload too large', {
        requestId,
        size: bodyText.length,
        maxSize: MAX_PAYLOAD_SIZE
      })
      return NextResponse.json(
        { error: 'Payload too large', maxSize: MAX_PAYLOAD_SIZE },
        { status: 413 }
      )
    }

    // C6: Parse and validate JSON
    let body: any
    try {
      body = JSON.parse(bodyText)
    } catch (parseError) {
      logger.error(LogCategory.WEBHOOK, 'Invalid JSON payload', {
        requestId,
        error: parseError instanceof Error ? parseError.message : 'Unknown error'
      })
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Log webhook received with tracing
    // TODO: Re-enable when debug-utilities is implemented
    // await debugUtilities.traceWebhookProcessing(body, 'sendpulse')
    logger.logSendPulseWebhook('received', {
      requestId,
      bodySize: bodyText.length,
      eventType: body.event || body[0]?.title || 'unknown'
    })

    // Handle SendPulse native format (array of events)
    if (Array.isArray(body) && body.length > 0) {
      logger.info(LogCategory.SENDPULSE, `Processing ${body.length} events`)

      // P2: Bulk message processing - validate and prepare all events first
      const validEvents = body
        .map(event => {
          const validation = SendPulseNativeEventSchema.safeParse(event)
          if (!validation.success) {
            logger.warn(LogCategory.WEBHOOK, 'Invalid native event format', {
              requestId,
              errors: validation.error.errors
            })
            return null
          }
          return event
        })
        .filter(event => event !== null && event.title === 'incoming_message' && event.service === 'whatsapp')

      // P2: Process all valid messages in parallel for better performance
      const processingPromises = validEvents.map(event =>
        processSendPulseNativeMessage(event, requestId).catch(error => {
          logger.error(LogCategory.SENDPULSE, 'Error processing event in batch', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            eventPhone: event.contact?.phone
          })
        })
      )

      await Promise.all(processingPromises)

      const duration = timer()
      logger.logPerformance('webhook_processed', {
        requestId,
        duration,
        eventCount: body.length,
        processedCount: validEvents.length
      })

      // P4: Add rate limit headers to response
      return NextResponse.json(
        {
          status: 'processed',
          requestId,
          total: body.length,
          processed: validEvents.length
        },
        {
          headers: {
            'X-RateLimit-Limit': String(RateLimitPresets.WEBHOOK_IP.maxRequests),
            'X-RateLimit-Remaining': String(ipRateLimit.remaining),
            'X-RateLimit-Reset': new Date(ipRateLimit.resetAt).toISOString()
          }
        }
      )
    }

    // Handle SendPulse Brazilian API format
    if (body.entry && body.entry[0]?.changes) {
      // C6: Validate Brazilian API format
      const validation = SendPulseBrazilianAPISchema.safeParse(body)
      if (!validation.success) {
        logger.warn(LogCategory.WEBHOOK, 'Invalid Brazilian API format', {
          requestId,
          errors: validation.error.errors
        })
        return NextResponse.json(
          { error: 'Invalid webhook format', details: validation.error.errors },
          { status: 400 }
        )
      }

      await processSendPulseWhatsAppMessage(body, requestId)

      const duration = timer()
      logger.logPerformance('webhook_processed', { requestId, duration })

      return NextResponse.json({ status: 'processed', requestId })
    }

    // Handle legacy events for backward compatibility
    if (body.event === 'message.new') {
      // C6: Validate legacy event format
      const validation = SendPulseLegacyEventSchema.safeParse(body)
      if (!validation.success) {
        logger.warn(LogCategory.WEBHOOK, 'Invalid legacy event format', {
          requestId,
          errors: validation.error.errors
        })
        return NextResponse.json(
          { error: 'Invalid webhook format', details: validation.error.errors },
          { status: 400 }
        )
      }

      await processSendPulseMessage(body, requestId)

      const duration = timer()
      logger.logPerformance('webhook_processed', { requestId, duration })

      return NextResponse.json({ status: 'processed', requestId })
    }

    // Handle message status updates
    if (body.event === 'message.status') {
      // C6: Validate status update format
      const validation = SendPulseLegacyEventSchema.safeParse(body)
      if (!validation.success) {
        logger.warn(LogCategory.WEBHOOK, 'Invalid status update format', {
          requestId,
          errors: validation.error.errors
        })
        return NextResponse.json(
          { error: 'Invalid webhook format', details: validation.error.errors },
          { status: 400 }
        )
      }

      await updateMessageStatus(body, requestId)

      const duration = timer()
      logger.logPerformance('status_updated', { requestId, duration })

      return NextResponse.json({ status: 'updated', requestId })
    }

    // Handle webhook verification/test
    if (body.event === 'webhook.verify') {
      // C6: Validate verification event format
      const validation = SendPulseLegacyEventSchema.safeParse(body)
      if (!validation.success) {
        logger.warn(LogCategory.WEBHOOK, 'Invalid verification event format', {
          requestId,
          errors: validation.error.errors
        })
        return NextResponse.json(
          { error: 'Invalid webhook format', details: validation.error.errors },
          { status: 400 }
        )
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

    // P4: Rate limiting - per phone number protection
    const customerPhone = contact.phone
    const phoneRateLimit = checkRateLimit({
      ...RateLimitPresets.WEBHOOK,
      identifier: customerPhone
    })

    if (phoneRateLimit.limited) {
      logger.warn(LogCategory.WHATSAPP, 'Rate limit exceeded for phone', {
        requestId,
        phone: customerPhone,
        resetAt: new Date(phoneRateLimit.resetAt).toISOString()
      })

      // Send rate limit warning to user
      await sendPulseClient.sendMessage({
        phone: customerPhone,
        message: '⏱️ Você está enviando mensagens muito rapidamente. Por favor, aguarde um momento antes de enviar novamente.',
        isChatOpened: true
      })

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

    const messageId = message.id || `msg_${Date.now()}`
    const customerName = contact.name || contact.username || 'Cliente'

    // Log message received
    logger.logWhatsAppMessageReceived(customerPhone, messageId, messageContent.length, {
      requestId,
      customerName,
      format: 'native'
    })

    // TODO: Re-enable when debug-utilities is implemented
    // await debugUtilities.traceMessageProcessing('message_received', {
    //   messageId,
    //   phone: customerPhone,
    //   contentLength: messageContent.length
    // })

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

    // TODO: Re-enable when debug-utilities is implemented
    // await debugUtilities.traceMessageProcessing('langchain_processed', {
    //   messageId,
    //   intent: processingResult.intent.name,
    //   confidence: processingResult.intent.confidence
    // }, langchainDuration)

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

    // TODO: Re-enable when debug-utilities is implemented
    // await debugUtilities.traceMessageProcessing('interaction_stored', {
    //   messageId,
    //   escalationRequired: processingResult.escalationRequired
    // })

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

    // TODO: Re-enable when message-status-tracker is implemented
    // Update status in database
    // const statusRecord = await messageStatusTracker.updateStatus({
    //   messageId: message_id,
    //   status: mappedStatus,
    //   timestamp: timestamp ? new Date(timestamp) : new Date(),
    //   errorCode: error_code,
    //   errorMessage: error_message,
    //   metadata
    // })

    // Log status update (simplified without status tracker)
    const duration = timer()
    logger.logSendPulseMessageStatus(
      message_id,
      'unknown',
      mappedStatus,
      duration,
      {
        requestId,
        deliveryTime: null,
        readTime: null
      }
    )

    // TODO: Re-enable when debug-utilities is implemented
    // await debugUtilities.traceMessageProcessing('status_update', {
    //   messageId: message_id,
    //   status: mappedStatus,
    //   duration
    // }, duration)

    if (false) {  // Temporarily disabled status record handling
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