/**
 * SendPulse Webhook Integration
 * Receives WhatsApp messages via SendPulse API and processes them
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { simpleLangChainProcessor } from '@/lib/simple-langchain-processor'
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
import { authenticateByPhone, isUserAuthenticated } from '@/lib/chatbot-auth-handler'
import { WebhookSecurity } from '@/lib/webhook-security'
import {
  validateAuthenticatedSession,
  viewSubscriptionCommand,
  pauseSubscriptionCommand,
  reactivateSubscriptionCommand,
  nextDeliveryCommand
} from '@/lib/subscription-management-commands'
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
// SendPulse Brazilian API format (similar to WhatsApp Business API)
const SendPulseBrazilianAPISchema = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(z.object({
    id: z.string(),
    changes: z.array(z.object({
      value: z.object({
        messaging_product: z.literal('whatsapp'),
        metadata: z.object({
          display_phone_number: z.string(),
          phone_number_id: z.string()
        }),
        contacts: z.array(z.object({
          profile: z.object({
            name: z.string()
          }),
          wa_id: z.string()
        })).optional(),
        messages: z.array(z.object({
          from: z.string(),
          id: z.string(),
          timestamp: z.string(),
          text: z.object({
            body: z.string()
          }).optional(),
          type: z.string()
        })).optional()
      }),
      field: z.literal('messages')
    }))
  }))
})
// Rate limiting interfaces and functions
interface RateLimitResult {
  limited: boolean
  remaining: number
  resetAt: number
}
interface RateLimitPreset {
  maxRequests: number
  windowMs: number
}
const RateLimitPresets = {
  WEBHOOK_IP: {
    maxRequests: 100,
    windowMs: 60 * 1000 // 1 minute
  },
  WEBHOOK: {
    maxRequests: 50,
    windowMs: 60 * 1000 // 1 minute
  }
}
// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(config: RateLimitPreset & { identifier: string }): RateLimitResult {
  const key = config.identifier
  const now = Date.now()
  let entry = rateLimitStore.get(key)
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + config.windowMs }
    rateLimitStore.set(key, entry)
  }
  entry.count += 1
  return {
    limited: entry.count > config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt
  }
}
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
    // P4: Rate limiting - IP based protection
    const ipRateLimit = checkRateLimit({
      ...RateLimitPresets.WEBHOOK_IP,
      identifier: request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown'
    })
    if (ipRateLimit.limited) {
      logger.warn(LogCategory.WEBHOOK, 'Rate limit exceeded for IP', {
        requestId,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        resetAt: new Date(ipRateLimit.resetAt).toISOString()
      })
      return NextResponse.json(
        { error: 'RATE_LIMIT_EXCEEDED', requestId },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((ipRateLimit.resetAt - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': String(RateLimitPresets.WEBHOOK_IP.maxRequests),
            'X-RateLimit-Remaining': String(ipRateLimit.remaining),
            'X-RateLimit-Reset': new Date(ipRateLimit.resetAt).toISOString()
          }
        }
      )
    }
    // C6: Enhanced security validation
    let body: any
    let rawBody: string
    try {
      rawBody = await request.text()
      // Enhanced security validation
      const securityValidation = WebhookSecurity.validateRequest(request, rawBody, {
        maxPayloadSize: 500 * 1024, // 500KB
        requireUserAgent: true,
        suspiciousPatterns: [
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
          /union\s+select/gi,
          /drop\s+table/gi,
        ]
      })
      if (!securityValidation.valid) {
        WebhookSecurity.logSecurityEvent('BLOCKED_REQUEST', {
          requestId,
          reason: securityValidation.reason,
          riskScore: securityValidation.riskScore,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        })
        return NextResponse.json(
          {
            error: 'Security validation failed',
            requestId,
            reason: securityValidation.reason
          },
          { status: 400 }
        )
      }
      // Additional signature validation for SendPulse webhooks
      const signature = request.headers.get('x-sendpulse-signature') ||
                        request.headers.get('x-signature') ||
                        request.headers.get('signature')
      if (signature) {
        const { SendPulseClient } = await import('@/lib/sendpulse-client')
        const sendpulseClient = new SendPulseClient()
        if (!sendpulseClient.validateWebhook(rawBody, signature)) {
          WebhookSecurity.logSecurityEvent('BLOCKED_REQUEST', {
            requestId,
            reason: 'Invalid webhook signature',
            signature: signature.substring(0, 20) + '...',
            ip: request.headers.get('x-forwarded-for') || 'unknown'
          })
          return NextResponse.json(
            {
              error: 'Invalid webhook signature',
              requestId
            },
            { status: 401 }
          )
        }
        logger.info(LogCategory.SECURITY, 'Webhook signature validated', {
          requestId,
          hasSignature: true
        })
      } else {
        logger.warn(LogCategory.SECURITY, 'Webhook received without signature', {
          requestId
        })
      }
      // Log high-risk requests
      if (securityValidation.riskScore > 50) {
        logger.warn(LogCategory.SECURITY, 'High-risk webhook request', {
          requestId,
          riskScore: securityValidation.riskScore,
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        })
      }
      body = JSON.parse(rawBody)
    } catch (parseError) {
      WebhookSecurity.logSecurityEvent('SUSPICIOUS_PATTERN', {
        requestId,
        error: parseError instanceof Error ? parseError.message : 'Unknown',
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })
      logger.error(LogCategory.WEBHOOK, 'Invalid JSON payload', {
        requestId,
        error: parseError instanceof Error ? parseError.message : 'Unknown'
      })
      return NextResponse.json(
        { error: 'Invalid JSON payload', requestId },
        { status: 400 }
      )
    }
    // C7: Analyze request patterns for anomalies
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const patternAnalysis = WebhookSecurity.analyzeRequestPattern(
      requestId,
      clientIP,
      userAgent
    )
    if (patternAnalysis.suspicious) {
      logger.warn(LogCategory.SECURITY, 'Suspicious request pattern detected', {
        requestId,
        clientIP,
        userAgent,
        reasons: patternAnalysis.reasons
      })
    }
    // Log webhook received with tracing
    try {
      await debugUtilities.traceWebhookProcessing(body, 'sendpulse')
    } catch (debugError) {
      logger.warn(LogCategory.SENDPULSE, 'Debug tracing failed, continuing processing', {
        error: debugError instanceof Error ? debugError.message : 'Unknown debug error'
      })
    }
    logger.logSendPulseWebhook('received', {
      requestId,
      bodySize: rawBody.length,
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
      const validEvents = []
      for (const event of validationResult.data) {
        if (event.title === 'incoming_message' && event.service === 'whatsapp') {
          await processSendPulseNativeMessage(event, requestId)
          validEvents.push(event)
        }
      }
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
    console.log('Full message structure:', JSON.stringify(message, null, 2))
    // Extract message text from the message object
    // SendPulse sends text in: message.channel_data.message.text.body
    let messageContent: string | null = null
    // Check for interactive messages (button replies, list replies)
    if (message.channel_data?.message?.type === 'interactive') {
      console.log(`Interactive message detected`)
      const interactive = message.channel_data.message.interactive
      if (interactive?.type === 'button_reply') {
        messageContent = interactive.button_reply.title
      } else if (interactive?.type === 'list_reply') {
        messageContent = interactive.list_reply.title
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
    const messageId = message.id || `msg_${Date.now()}`
    const customerName = contact.name || contact.username || 'Cliente'
    // Log message received
    logger.logWhatsAppMessageReceived(customerPhone, messageId, messageContent.length, {
      requestId,
      customerName,
      format: 'native'
    })
    // Trace message processing
    try {
      await debugUtilities.traceMessageProcessing('message_received', {
        messageId,
        phone: customerPhone,
        contentLength: messageContent.length
      })
    } catch (debugError) {
      logger.warn(LogCategory.SENDPULSE, 'Message processing tracing failed, continuing processing', {
        error: debugError instanceof Error ? debugError.message : 'Unknown debug error',
        messageId
      })
    }
    // TODO: Re-enable authentication and menu handling when chatbot-auth-handler is implemented
    // Currently going straight to LangChain for all messages
    // Autenticação automática robusta pelo número de WhatsApp
    logger.info(LogCategory.WHATSAPP, 'Iniciando processo de autenticação', {
      requestId,
      customerPhone: customerPhone,
      messageLength: messageContent?.length || 0
    })
    let authStatus = await isUserAuthenticated(customerPhone)
    if (!authStatus.authenticated) {
      // Tentar autenticar automaticamente com validação robusta
      logger.info(LogCategory.WHATSAPP, 'Usuário não autenticado, tentando autenticação automática', {
        requestId,
        phone: customerPhone,
        contactName: contact.name
      })
      const authResult = await authenticateByPhone(customerPhone)
      logger.info(LogCategory.WHATSAPP, 'Resultado da autenticação automática', {
        requestId,
        phone: customerPhone,
        success: authResult.success,
        error: authResult.error,
        userId: authResult.userId
      })
      if (authResult.success) {
        logger.info(LogCategory.WHATSAPP, 'SUCCESS: Autenticação automática bem-sucedida', {
          requestId,
          phone: customerPhone,
          userId: authResult.userId,
          userName: authResult.userName
        })
        // Enviar mensagem de boas-vindas personalizada
        if (authResult.requiresResponse && authResult.message) {
          try {
            await sendPulseClient.sendMessage({
              phone: customerPhone,
              message: authResult.message
            })
            logger.info(LogCategory.WHATSAPP, 'SUCCESS: Mensagem de boas-vindas enviada com sucesso', {
              requestId,
              phone: customerPhone,
              userId: authResult.userId,
              messageLength: authResult.message.length
            })
            // Log welcome message interaction
            const userProfile = await getOrCreateUserProfile(contact, customerPhone)
          await storeInteraction({
            messageId,
            customerPhone,
            content: messageContent,
            intent: { name: 'authenticated_welcome', confidence: 1.0 },
            response: authResult.message,
            escalationRequired: false,
            ticketCreated: false,
            userProfile
          })
          return // Parar processamento após enviar boas-vindas
          } catch (messageError) {
            console.error('Failed to send welcome message:', messageError)
            logger.error(LogCategory.WHATSAPP, 'Erro ao enviar mensagem de boas-vindas', {
              phone: customerPhone,
              userId: authResult.userId,
              error: messageError instanceof Error ? messageError.message : 'Unknown'
            })
            // Continue processing even if welcome message fails
          }
        }
        authStatus = {
          authenticated: true,
          sessionToken: authResult.sessionToken,
          userId: authResult.userId,
          userName: authResult.userName
        }
      } else if (authResult.requiresResponse) {
        // Enviar mensagem de erro de autenticação
        await sendPulseClient.sendMessage({
          phone: customerPhone,
          message: authResult.message
        })
        logger.info(LogCategory.WHATSAPP, 'Mensagem de falha na autenticação enviada', {
          requestId,
          phone: customerPhone,
          error: authResult.error
        })
        // Log auth failure interaction
        const userProfile = await getOrCreateUserProfile(contact, customerPhone)
        await storeInteraction({
          messageId,
          customerPhone,
          content: messageContent,
          intent: { name: 'auth_failed', confidence: 1.0 },
          response: authResult.message,
          escalationRequired: false,
          ticketCreated: false,
          userProfile
        })
        return // Parar processamento para usuários não autenticados
      }
    }
    // Verificar se a mensagem é uma opção do menu (1-8)
    const menuOption = await handleMenuOption(messageContent, customerPhone)
    if (menuOption) {
      if (menuOption.requiresResponse) {
        await sendPulseClient.sendMessage({
          phone: customerPhone,
          message: menuOption.message
        })
        logger.info(LogCategory.WHATSAPP, 'Resposta de opção do menu enviada', {
          requestId,
          phone: customerPhone,
          option: messageContent
        })
      }
      // Log menu option interaction
      const userProfile = await getOrCreateUserProfile(contact, customerPhone)
      await storeInteraction({
        messageId,
        customerPhone,
        content: messageContent,
        intent: { name: 'menu_option', confidence: 1.0 },
        response: menuOption.message,
        escalationRequired: false,
        ticketCreated: false,
        userProfile
      })
      return // Pular processamento LangChain para opções do menu
    }
    // Verificar se a mensagem é um comando de gestão de assinatura
    const subscriptionCommandResult = await handleSubscriptionCommand(messageContent, customerPhone)
    if (subscriptionCommandResult) {
      if (subscriptionCommandResult.requiresResponse) {
        await sendPulseClient.sendMessage({
          phone: customerPhone,
          message: subscriptionCommandResult.message
        })
        logger.info(LogCategory.WHATSAPP, 'Resposta de comando de assinatura enviada', {
          requestId,
          phone: customerPhone,
          success: subscriptionCommandResult.success
        })
      }
      // Log subscription command interaction
      const userProfile = await getOrCreateUserProfile(contact, customerPhone)
      await storeInteraction({
        messageId,
        customerPhone,
        content: messageContent,
        intent: { name: 'subscription_command', confidence: 1.0 },
        response: subscriptionCommandResult.message,
        escalationRequired: false,
        ticketCreated: false,
        userProfile
      })
      return // Pular processamento LangChain para comandos de assinatura
    }
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
    // Helper function to check business hours
  const isBusinessHours = () => {
    const now = new Date()
    const hours = now.getHours()
    const day = now.getDay()
    // Monday-Friday, 8am-6pm
    return day >= 1 && day <= 5 && hours >= 8 && hours < 18
  }
  // Process message with Enhanced LangChain
  const langchainTimer = logger.startTimer()
  const processingResult = await simpleLangChainProcessor.processMessage(
    messageContent,
    {
      sessionId: authStatus.sessionToken || `temp_${Date.now()}_${customerPhone.slice(-4)}`,
      userId: authStatus.userId,
      userProfile: userProfile,
      conversationHistory: conversationHistory.map(msg => msg.content),
      previousTickets: userHistory.tickets,
      systemState: {
        currentTime: new Date(),
        businessHours: isBusinessHours(),
        emergencyContacts: true,
        maintenanceMode: false
      }
    }
  )
  const langchainDuration = langchainTimer()
    // Enhanced logging for the new simple processor
    logger.logWhatsAppIntentDetected(
      processingResult.intent.name,
      processingResult.confidence,
      customerPhone,
      {
        requestId,
        duration: langchainDuration,
        category: processingResult.intent.category,
        priority: processingResult.intent.priority,
        escalationRequired: processingResult.escalationRequired,
        tokensUsed: processingResult.tokensUsed,
        estimatedCost: processingResult.estimatedCost
      }
    )
    logger.logLangChainProcessing(
      messageId,
      processingResult.intent.name,
      processingResult.confidence,
      langchainDuration,
      {
        requestId,
        enhancedProcessor: true,
        sessionId: authStatus.sessionToken
      }
    )
    // Additional detailed logging for the simple processor
    console.log(`Simple processor completed - Message: ${messageId || 'N/A'}`)
    console.log(`Processing time: ${langchainDuration}ms`)
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
    logger.info(LogCategory.WHATSAPP, `SUCCESS: Message processing completed`, {
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
    const processingResult = await simpleLangChainProcessor.processMessage(
      messageContent,
      {
        sessionId: `temp_${Date.now()}_${customerPhone.slice(-4)}`,
        userProfile: userProfile,
        conversationHistory: conversationHistory?.map(msg => msg.content) || [],
        previousTickets: [],
        systemState: {
          currentTime: new Date(),
          businessHours: isBusinessHours(),
          emergencyContacts: true,
          maintenanceMode: false
        }
      }
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
    const processingResult = await simpleLangChainProcessor.processMessage(
      messageContent,
      {
        sessionId: `temp_${Date.now()}_${customerPhone.slice(-4)}`,
        userProfile: userProfile,
        conversationHistory: conversationHistory?.map(msg => msg.content) || [],
        previousTickets: [],
        systemState: {
          currentTime: new Date(),
          businessHours: isBusinessHours(),
          emergencyContacts: true,
          maintenanceMode: false
        }
      }
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
      logger.info(LogCategory.SENDPULSE, `SUCCESS: Message sent successfully`, {
        requestId,
        phone: customerPhone,
        method: 'sendpulse_client'
      })
      // Log quick replies if available
      if (processingResult.quickReplies && processingResult.quickReplies.length > 0) {
        logger.info(LogCategory.SENDPULSE, 'Quick replies available', {
          requestId,
          phone: customerPhone,
          quickReplyCount: processingResult.quickReplies.length
        })
      }
    } catch (directApiError) {
      // Direct API failed (including template fallback) - try MCP as last resort
      logger.warn(LogCategory.SENDPULSE, 'WARNING: SendPulse client failed (including template fallback), trying MCP', {
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
        logger.info(LogCategory.SENDPULSE, `SUCCESS: Message sent via ${fallbackResult.method.toUpperCase()} fallback`, {
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
    logger.error(LogCategory.SENDPULSE, 'CRITICAL: All message delivery methods failed', {
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
 * Handle menu options (1-8 from welcome message)
 */
async function handleMenuOption(
  message: string,
  phone: string
): Promise<any | null> {
  const cleanMessage = message.trim()
  // Match only single digits or with emoji prefix
  const menuMatch = cleanMessage.match(/^[1-8]$|^[1-8]️⃣/)
  if (!menuMatch) {
    return null
  }
  const option = parseInt(cleanMessage.replace(/[^\d]/g, ''))
  switch (option) {
    case 1:
      // Ver detalhes da assinatura
      return await viewSubscriptionCommand(phone)
    case 2:
      // Rastrear pedido
      return await nextDeliveryCommand(phone)
    case 3:
      // Baixar nota fiscal
      return {
        success: true,
        requiresResponse: true,
        message: '📄 *Notas Fiscais*\n\nPara acessar suas notas fiscais:\n\n1. Acesse a área do assinante: https://svlentes.shop/area-assinante\n2. Faça login com seu e-mail\n3. Clique em "Minhas Faturas"\n\nSe precisar de ajuda, estou aqui! 😊'
      }
    case 4:
      // Atualizar endereço
      return {
        success: true,
        requiresResponse: true,
        message: '📍 *Atualizar Endereço*\n\nPara atualizar seu endereço de entrega:\n\n1. Acesse: https://svlentes.shop/area-assinante/configuracoes\n2. Faça login com seu e-mail\n3. Atualize seu endereço\n\nOu me envie o novo endereço completo que atualizo para você! 📬'
      }
    case 5:
      // Atualizar forma de pagamento
      return {
        success: true,
        requiresResponse: true,
        message: '💳 *Atualizar Forma de Pagamento*\n\nPara atualizar seus dados de pagamento:\n\n1. Acesse: https://svlentes.shop/area-assinante/configuracoes\n2. Faça login\n3. Clique em "Forma de Pagamento"\n\nPrecisa de ajuda? Entre em contato:\n📞 (33) 98606-1427'
      }
    case 6:
      // Alterar plano
      return {
        success: true,
        requiresResponse: true,
        message: '🔄 *Alterar Plano*\n\nQuer mudar seu plano de assinatura?\n\nNossos planos disponíveis:\n📦 Mensal - Entrega todo mês\n📦 Trimestral - Economia de 10%\n📦 Semestral - Economia de 15%\n📦 Anual - Economia de 20%\n\nMe diga qual plano te interessa ou entre em contato:\n📞 (33) 98606-1427'
      }
    case 7:
      // Pausar/Cancelar assinatura
      return {
        success: true,
        requiresResponse: true,
        message: '⏸️ *Pausar ou Cancelar Assinatura*\n\n*Pausar assinatura:*\nVocê pode pausar por 30, 60 ou 90 dias.\nEnvie: "pausar assinatura 30 dias"\n\n*Cancelar assinatura:*\nSentiremos sua falta! 😢\nPara cancelar, entre em contato:\n📞 (33) 98606-1427\n\nPosso ajudar com mais alguma coisa?'
      }
    case 8:
      // Falar com atendente
      return {
        success: true,
        requiresResponse: true,
        message: '💬 *Atendimento Humano*\n\nVou transferir você para nossa equipe!\n\nEntre em contato diretamente:\n📞 WhatsApp: (33) 98606-1427\n📧 Email: saraivavision@gmail.com\n\n*Horário de atendimento:*\nSegunda a Sexta: 8h às 18h\nSábado: 8h às 12h\n\nEm que mais posso ajudar? 😊'
      }
    default:
      return null
  }
}
/**
 * Handle subscription management commands
 */
async function handleSubscriptionCommand(
  message: string,
  phone: string
): Promise<any | null> {
  const cleanMessage = message.trim().toLowerCase()
  // Comandos de visualização de assinatura
  if (/\b(minha\s+assinatura|ver\s+assinatura|detalhes\s+assinatura|status\s+assinatura)\b/i.test(cleanMessage)) {
    return await viewSubscriptionCommand(phone)
  }
  // Comandos de pausa
  if (/\b(pausar\s+assinatura|pausar)\b/i.test(cleanMessage)) {
    // Detectar duração da pausa (30, 60, 90 dias)
    const daysMatch = cleanMessage.match(/(\d+)\s*dias?/)
    const days = daysMatch ? parseInt(daysMatch[1]) : 30
    return await pauseSubscriptionCommand(phone, days)
  }
  // Comandos de reativação
  if (/\b(reativar\s+assinatura|ativar\s+assinatura|voltar\s+assinatura|retomar)\b/i.test(cleanMessage)) {
    return await reactivateSubscriptionCommand(phone)
  }
  // Comandos de consulta de entrega
  if (/\b(pr[óo]xima\s+entrega|pr[óo]ximo\s+pedido|quando\s+chega|rastreamento)\b/i.test(cleanMessage)) {
    return await nextDeliveryCommand(phone)
  }
  // Não é um comando de assinatura
  return null
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