/**
 * SendPulse WhatsApp API Client (Refactored - Phase 3)
 * Bot-based API with contact management, rate limiting, retry logic, and template messages
 */

import { sendPulseAuth } from './sendpulse-auth'
import { botManager } from './sendpulse/bot-manager'
import { contactCache } from './sendpulse/contact-cache'
import { rateLimiter } from './sendpulse/rate-limiter'
import { retryManager } from './sendpulse/retry-manager'
import { templateManager } from './sendpulse/template-manager'
import { analyticsService } from './sendpulse/analytics-service'
import {
  chunkMessage,
  streamMessageChunks,
  addChunkIndicators,
  validateMessageLength,
  DEFAULT_STREAM_CONFIG
} from './message-streamer'
import type {
  SendPulseContact,
  SendPulseContactsResponse,
  CreateContactRequest,
  SendMessageRequest,
  SendMessageResponse,
  WhatsAppMessage,
  TextMessage,
  ImageMessage,
  DocumentMessage,
  InteractiveButtonsMessage,
  InteractiveListMessage,
  TemplateMessage,
  SendPulseWebhookData,
  LegacySendMessageParams,
  MessageType
} from './sendpulse/types'
import {
  SendPulseContactError,
  SendPulseMessageError,
  ConversationWindowExpiredError,
  createSendPulseError
} from './sendpulse/errors'

export class SendPulseClient {
  private webhookToken: string
  private baseUrl: string
  private botId: string | null = null

  constructor() {
    this.webhookToken = process.env.SENDPULSE_WEBHOOK_TOKEN || ''
    this.baseUrl = 'https://api.sendpulse.com/whatsapp'
    this.botId = process.env.SENDPULSE_BOT_ID || null
  }

  /**
   * Get API token from auth service
   */
  private async getApiToken(): Promise<string> {
    // Try static token first (if provided in env)
    const staticToken = process.env.SENDPULSE_API_TOKEN
    if (staticToken) {
      return staticToken
    }

    // Generate from OAuth using app_id and app_secret
    return await sendPulseAuth.getAccessToken()
  }

  /**
   * Get bot ID (from config or default bot)
   */
  private async getBotId(): Promise<string> {
    if (this.botId) {
      return this.botId
    }

    const defaultBot = await botManager.getDefaultBot()
    this.botId = defaultBot.id
    return this.botId
  }

  /**
   * Get or create contact from phone number
   * Uses cache to avoid repeated API calls
   */
  private async getOrCreateContact(phone: string, name?: string): Promise<SendPulseContact> {
    const botId = await this.getBotId()
    const cleanPhone = phone.replace(/\D/g, '')

    // Check cache first
    const cachedContactId = contactCache.getContactId(botId, cleanPhone)
    if (cachedContactId) {
      // Return cached contact (need to fetch full data)
      const contact = await this.getContactById(cachedContactId)
      if (contact) {
        return contact
      }
    }

    // Create or get contact from API
    try {
      const apiToken = await this.getApiToken()

      const payload: CreateContactRequest = {
        bot_id: botId,
        phone: cleanPhone,
        ...(name && { name })
      }

      const response = await fetch(`${this.baseUrl}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        // If contact exists, try to find it in the list
        if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}))
          if (errorData.errors?.phone?.[0]?.includes('already exists')) {
            return await this.findContactByPhone(botId, cleanPhone)
          }
        }
        const errorData = await response.json().catch(() => ({}))
        throw createSendPulseError(response.status, errorData)
      }

      const contact: SendPulseContact = await response.json()

      // Cache the contact
      contactCache.set(botId, cleanPhone, contact)

      return contact

    } catch (error) {
      if (error instanceof SendPulseContactError) {
        throw error
      }
      throw new SendPulseContactError(
        `Failed to get or create contact for phone ${phone}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      )
    }
  }

  /**
   * Find contact by phone number in contacts list
   */
  private async findContactByPhone(botId: string, phone: string): Promise<SendPulseContact> {
    const apiToken = await this.getApiToken()

    const response = await fetch(
      `${this.baseUrl}/contacts?bot_id=${botId}&limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw createSendPulseError(response.status, errorData)
    }

    const data: SendPulseContactsResponse = await response.json()

    // CRITICAL FIX: Use exact phone number match, not substring
    // channel_data.phone is stored as number (without country code prefix in some cases)
    const phoneNum = parseInt(phone)
    const contact = data.data.find(c =>
      c.channel_data.phone === phoneNum ||
      c.channel_data.phone.toString() === phone ||
      c.channel_data.phone.toString() === phone.replace(/^55/, '')
    )

    if (!contact) {
      console.error(`[SendPulse] Contact not found for phone ${phone}`)
      console.error(`[SendPulse] Available contacts:`, data.data.map(c => ({
        id: c.id,
        phone: c.channel_data.phone,
        name: c.channel_data.name
      })))
      throw new SendPulseContactError(`Contact with phone ${phone} not found`)
    }

    console.log(`[SendPulse] Found contact:`, {
      id: contact.id,
      phone: contact.channel_data.phone,
      name: contact.channel_data.name,
      is_chat_opened: contact.is_chat_opened
    })

    // Cache the found contact
    contactCache.set(botId, phone, contact)

    return contact
  }

  /**
   * Get contact by ID
   */
  private async getContactById(contactId: string): Promise<SendPulseContact | null> {
    try {
      const apiToken = await this.getApiToken()

      const response = await fetch(
        `${this.baseUrl}/contacts/${contactId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        const errorData = await response.json().catch(() => ({}))
        throw createSendPulseError(response.status, errorData)
      }

      return await response.json()

    } catch (error) {
      console.error('Error getting contact by ID:', error)
      return null
    }
  }

  /**
   * Check if contact is in 24-hour conversation window
   */
  private async isContactActive(contactId: string): Promise<boolean> {
    const contact = await this.getContactById(contactId)
    return contact?.is_chat_opened || false
  }

  /**
   * Send message to contact by ID with rate limiting, retry, and template fallback
   *
   * CRITICAL FIX: Use isChatOpenedOverride when available (from fresh findContactByPhone)
   * - The 24h window is ONLY open when user sends a message to US
   * - getContactById returns STALE data - DON'T use it!
   * - findContactByPhone has FRESH data from the list endpoint
   */
  private async sendMessageToContact(
    contactId: string,
    message: WhatsAppMessage | TemplateMessage,
    useTemplateFallback: boolean = true,
    isChatOpenedOverride?: boolean,
    contactPhone?: string
  ): Promise<SendMessageResponse> {
    try {
      // 1. Rate limiting
      await rateLimiter.acquire()

      // 2. Check if contact is in 24-hour window (skip ONLY for template messages)
      if (message.type !== 'template') {
        // CRITICAL: Use override from fresh contact data if available
        // Only fallback to API call if no override provided
        let isActive: boolean

        if (isChatOpenedOverride !== undefined) {
          isActive = isChatOpenedOverride
          console.log(`[SendPulse] Using fresh contact data: is_chat_opened=${isActive}`)
        } else {
          console.log(`[SendPulse] No override - checking via API (contactId: ${contactId})`)
          isActive = await this.isContactActive(contactId)
        }

        if (!isActive) {
          console.log(`[SendPulse] ❌ Contact window CLOSED - is_chat_opened=false`)
          console.log(`[SendPulse] ⚠️ Cannot send message - 24h window expired. User must send message first to reopen window.`)

          // TEMPORARY FIX: Skip template fallback until templates are approved
          // Template fallback requires approved templates in SendPulse account
          console.warn(`[SendPulse] Template fallback disabled - configure approved templates in SendPulse to enable`)

          // Return early without sending - avoids template errors
          throw new ConversationWindowExpiredError(contactId)
        }

        console.log(`[SendPulse] ✅ Contact window OPEN - is_chat_opened=true`)
      }

      // 3. Send with retry logic
      const result = await retryManager.execute(async () => {
        const apiToken = await this.getApiToken()

        // Use standard endpoint with contact_id
        const endpoint = '/contacts/send'
        const payload = {
          contact_id: contactId,
          message
        }

        console.log(`[SendPulse] Sending to API:`, {
          endpoint,
          contactId,
          messageType: message.type,
          payload: JSON.stringify(payload)
        })

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error(`[SendPulse] API Error ${response.status}:`, JSON.stringify(errorData, null, 2))
          throw createSendPulseError(response.status, errorData)
        }

        return await response.json()
      })

      // 4. Track analytics
      const botId = await this.getBotId()
      const messageType = message.type as MessageType | 'template'
      analyticsService.trackMessage(contactId, botId, messageType, 'outbound')

      return result

    } catch (error) {
      if (error instanceof ConversationWindowExpiredError || error instanceof SendPulseMessageError) {
        throw error
      }
      throw new SendPulseMessageError(
        `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        error
      )
    }
  }

  /**
   * Template message fallback when 24h window expires
   */
  private async sendTemplateMessageFallback(
    contactId: string,
    originalMessage: WhatsAppMessage
  ): Promise<SendMessageResponse> {
    try {
      const botId = await this.getBotId()

      // Get default reengagement template
      const template = await templateManager.getDefaultReengagementTemplate(botId)
      if (!template) {
        throw new SendPulseMessageError(
          'No approved template available for conversation reengagement',
          'TEMPLATE_NOT_FOUND'
        )
      }

      // Extract text from original message for template parameters
      let bodyText = ''
      if (originalMessage.type === 'text') {
        bodyText = originalMessage.text.body
      } else if ('caption' in originalMessage && typeof originalMessage.caption === 'string') {
        bodyText = originalMessage.caption
      }

      // Build template message (simplified - adjust based on your template structure)
      const templateMessage = templateManager.buildTemplateMessage(
        template.name,
        template.language,
        bodyText ? { body: [bodyText.substring(0, 60)] } : undefined
      )

      // Send template without fallback (avoid infinite loop)
      return await this.sendMessageToContact(contactId, templateMessage, false)

    } catch (error) {
      console.error('[SendPulse] Template fallback failed:', error)
      throw new SendPulseMessageError(
        'Failed to send template message fallback',
        'TEMPLATE_FALLBACK_FAILED',
        error
      )
    }
  }

  // ============================================================================
  // Public API Methods (Backward Compatible + New Features)
  // ============================================================================

  /**
   * Send text message (backward compatible with auto phone→contact conversion)
   */
  async sendMessage(params: LegacySendMessageParams): Promise<any> {
    try {
      // Get or create contact from phone
      const contact = await this.getOrCreateContact(params.phone)

      // CRITICAL: Use the is_chat_opened from the contact we just fetched
      // The getOrCreateContact uses findContactByPhone which has FRESH data
      // DON'T use getContactById again - it has stale data!
      const isChatOpened = params.isChatOpened !== undefined ? params.isChatOpened : contact.is_chat_opened

      console.log(`[SendPulse] Contact status from fresh data:`, {
        contactId: contact.id,
        is_chat_opened: contact.is_chat_opened,
        override: params.isChatOpened
      })

      // Build message based on params
      let message: WhatsAppMessage

      if (params.buttons && params.buttons.length > 0) {
        // Interactive buttons message
        message = {
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: params.message },
            action: {
              buttons: params.buttons.map(btn => ({
                type: 'reply',
                reply: btn.reply
              }))
            }
          }
        } as InteractiveButtonsMessage
      } else if (params.image) {
        // Image message
        message = {
          type: 'image',
          image: {
            link: params.image,
            ...(params.message && { caption: params.message })
          }
        } as ImageMessage
      } else if (params.document) {
        // Document message
        message = {
          type: 'document',
          document: {
            link: params.document,
            ...(params.message && { caption: params.message })
          }
        } as DocumentMessage
      } else {
        // Text message
        message = {
          type: 'text',
          text: {
            body: params.message,
            preview_url: false
          }
        } as TextMessage
      }

      return await this.sendMessageToContact(contact.id, message, true, isChatOpened, params.phone)

    } catch (error) {
      console.error('Error sending SendPulse message:', error)
      throw error
    }
  }

  /**
   * Send message with quick reply buttons
   */
  async sendMessageWithQuickReplies(
    phone: string,
    message: string,
    quickReplies: string[],
    options?: { isChatOpened?: boolean }
  ): Promise<any> {
    const buttons = quickReplies.map(reply => ({
      type: 'reply' as const,
      reply: {
        title: reply,
        id: `option_${reply.toLowerCase().replace(/\s+/g, '_').substring(0, 20)}`
      }
    }))

    return this.sendMessage({
      phone,
      message,
      buttons,
      isChatOpened: options?.isChatOpened
    })
  }

  /**
   * Send interactive list message
   */
  async sendListMessage(
    phone: string,
    message: string,
    buttonText: string,
    sections: Array<{
      title: string
      rows: Array<{
        id: string
        title: string
        description?: string
      }>
    }>
  ): Promise<any> {
    const contact = await this.getOrCreateContact(phone)

    const listMessage: InteractiveListMessage = {
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: message },
        action: {
          button: buttonText,
          sections: sections.map(section => ({
            title: section.title,
            rows: section.rows
          }))
        }
      }
    }

    return await this.sendMessageToContact(contact.id, listMessage)
  }

  /**
   * Send image message
   */
  async sendImageMessage(phone: string, imageUrl: string, caption?: string): Promise<any> {
    return this.sendMessage({
      phone,
      message: caption || '',
      image: imageUrl
    })
  }

  /**
   * Send document message
   */
  async sendDocumentMessage(phone: string, documentUrl: string, filename?: string): Promise<any> {
    return this.sendMessage({
      phone,
      message: '',
      document: documentUrl
    })
  }

  /**
   * Create or update contact
   */
  async createOrUpdateContact(contact: {
    phone: string
    name?: string
    email?: string
    variables?: Record<string, any>
    tags?: string[]
  }): Promise<any> {
    try {
      const botId = await this.getBotId()
      const apiToken = await this.getApiToken()
      const cleanPhone = contact.phone.replace(/\D/g, '')

      const payload: CreateContactRequest = {
        bot_id: botId,
        phone: cleanPhone,
        ...(contact.name && { name: contact.name }),
        ...(contact.variables && { variables: contact.variables }),
        ...(contact.tags && { tags: contact.tags })
      }

      const response = await fetch(`${this.baseUrl}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw createSendPulseError(response.status, errorData)
      }

      const contactData: SendPulseContact = await response.json()

      // Update cache
      contactCache.set(botId, cleanPhone, contactData)

      return contactData

    } catch (error) {
      console.error('Error creating/updating SendPulse contact:', error)
      throw error
    }
  }

  /**
   * Get contact information by phone
   */
  async getContact(phone: string): Promise<any> {
    try {
      const botId = await this.getBotId()
      const cleanPhone = phone.replace(/\D/g, '')

      // Check cache first
      const cachedContactId = contactCache.getContactId(botId, cleanPhone)
      if (cachedContactId) {
        const contact = await this.getContactById(cachedContactId)
        if (contact) return contact
      }

      // Find in contacts list
      return await this.findContactByPhone(botId, cleanPhone)

    } catch (error) {
      console.error('Error getting SendPulse contact:', error)
      if (error instanceof SendPulseContactError) {
        return null
      }
      throw error
    }
  }

  /**
   * Register webhook for receiving messages
   */
  async registerWebhook(webhookUrl: string): Promise<any> {
    try {
      const apiToken = await this.getApiToken()

      const payload = {
        url: webhookUrl,
        events: ['message.new', 'message.status'],
        token: this.webhookToken
      }

      const response = await fetch(`${this.baseUrl}/webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw createSendPulseError(response.status, errorData)
      }

      return await response.json()

    } catch (error) {
      console.error('Error registering SendPulse webhook:', error)
      throw error
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhook(payload: string, signature: string): boolean {
    // TODO: Implement webhook signature validation if SendPulse provides it
    // For now, just check if webhook token is configured
    return !!this.webhookToken
  }

  /**
   * Parse incoming webhook data
   */
  parseWebhookData(body: any): SendPulseWebhookData | null {
    try {
      if (!body.event) {
        return null
      }

      return {
        event: body.event,
        message: body.message,
        contact: body.contact,
        timestamp: body.timestamp
      }

    } catch (error) {
      console.error('Error parsing SendPulse webhook data:', error)
      return null
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const apiToken = await this.getApiToken()

      const response = await fetch(`${this.baseUrl}/account/info`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      })

      return response.ok

    } catch (error) {
      console.error('SendPulse API connection test failed:', error)
      return false
    }
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<any> {
    try {
      const apiToken = await this.getApiToken()

      const response = await fetch(`${this.baseUrl}/account/info`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw createSendPulseError(response.status, errorData)
      }

      return await response.json()

    } catch (error) {
      console.error('Error getting SendPulse account info:', error)
      throw error
    }
  }

  // ============================================================================
  // New Advanced Methods
  // ============================================================================

  /**
   * Get all contacts for current bot (with caching)
   */
  async getContacts(limit: number = 100): Promise<SendPulseContact[]> {
    try {
      const botId = await this.getBotId()
      const apiToken = await this.getApiToken()

      const response = await fetch(
        `${this.baseUrl}/contacts?bot_id=${botId}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw createSendPulseError(response.status, errorData)
      }

      const data: SendPulseContactsResponse = await response.json()

      // Prefetch contacts into cache
      contactCache.prefetch(botId, data.data)

      return data.data

    } catch (error) {
      console.error('Error getting contacts:', error)
      throw error
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return contactCache.getStats()
  }

  /**
   * Clear contact cache
   */
  clearCache(): void {
    contactCache.clear()
  }

  // ============================================================================
  // Phase 3 Advanced Methods
  // ============================================================================

  /**
   * Send template message (for expired 24h windows)
   */
  async sendTemplateMessage(
    phone: string,
    templateName: string,
    languageCode: string = 'pt_BR',
    parameters?: {
      header?: string[]
      body?: string[]
      buttons?: Array<{ index: number; text?: string }>
    }
  ): Promise<SendMessageResponse> {
    try {
      const contact = await this.getOrCreateContact(phone)
      const botId = await this.getBotId()

      // Validate template exists and is approved
      const template = await templateManager.getTemplate(botId, templateName)
      if (!template) {
        throw new SendPulseMessageError(
          `Template "${templateName}" not found`,
          'TEMPLATE_NOT_FOUND'
        )
      }

      if (template.status !== 'APPROVED') {
        throw new SendPulseMessageError(
          `Template "${templateName}" is not approved (status: ${template.status})`,
          'TEMPLATE_NOT_APPROVED'
        )
      }

      // Validate parameters
      const validation = templateManager.validateTemplateParameters(template, parameters)
      if (!validation.valid) {
        throw new SendPulseMessageError(
          `Template parameters invalid: ${validation.errors.join(', ')}`,
          'TEMPLATE_PARAMS_INVALID'
        )
      }

      // Build and send template message
      const templateMessage = templateManager.buildTemplateMessage(
        templateName,
        languageCode,
        parameters
      )

      return await this.sendMessageToContact(contact.id, templateMessage, false)

    } catch (error) {
      console.error('Error sending template message:', error)
      throw error
    }
  }

  /**
   * Get approved templates for current bot
   */
  async getTemplates(): Promise<any[]> {
    try {
      const botId = await this.getBotId()
      return await templateManager.getApprovedTemplates(botId)
    } catch (error) {
      console.error('Error getting templates:', error)
      throw error
    }
  }

  /**
   * Get conversation analytics for a contact
   */
  getConversationMetrics(contactPhone: string): any {
    // In real implementation, map phone to contact_id
    // For now, simplified
    return analyticsService.getConversationMetrics(contactPhone)
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(timeframe?: { start: string; end: string; granularity: 'hour' | 'day' | 'week' | 'month' }): any {
    return analyticsService.getSummary(timeframe)
  }

  /**
   * Get rate limiter statistics
   */
  getRateLimitStats(): any {
    return rateLimiter.getStats()
  }

  /**
   * Get retry manager statistics
   */
  getRetryStats(): any {
    return retryManager.getStats()
  }

  /**
   * Get template cache statistics
   */
  getTemplateStats(): any {
    return templateManager.getCacheStats()
  }

  /**
   * Get analytics statistics
   */
  getAnalyticsStats(): any {
    return analyticsService.getStats()
  }

  /**
   * Get comprehensive system statistics
   */
  getSystemStats(): any {
    return {
      cache: this.getCacheStats(),
      rateLimit: this.getRateLimitStats(),
      retry: this.getRetryStats(),
      templates: this.getTemplateStats(),
      analytics: this.getAnalyticsStats()
    }
  }

  /**
   * P5: Send long message with progressive streaming
   * Automatically chunks and streams long messages for better UX
   */
  async sendStreamedMessage(params: {
    phone: string
    message: string
    isChatOpened?: boolean
    enableIndicators?: boolean
  }): Promise<{
    success: boolean
    chunksCount: number
    totalLength: number
  }> {
    try {
      // Validate message length
      const validation = validateMessageLength(params.message)

      // If message doesn't need chunking, send normally
      if (!validation.needsChunking) {
        await this.sendMessage({
          phone: params.phone,
          message: params.message,
          isChatOpened: params.isChatOpened
        })

        return {
          success: true,
          chunksCount: 1,
          totalLength: params.message.length
        }
      }

      // Chunk the message
      let chunks = chunkMessage(params.message, DEFAULT_STREAM_CONFIG)

      // Add continuation indicators if enabled
      if (params.enableIndicators !== false) {
        chunks = addChunkIndicators(chunks)
      }

      // Stream chunks progressively
      await streamMessageChunks(
        chunks,
        async (chunk, isFirst, isLast) => {
          await this.sendMessage({
            phone: params.phone,
            message: chunk,
            isChatOpened: params.isChatOpened
          })
        },
        DEFAULT_STREAM_CONFIG
      )

      return {
        success: true,
        chunksCount: chunks.length,
        totalLength: params.message.length
      }

    } catch (error) {
      console.error('Error sending streamed message:', error)
      throw error
    }
  }

  /**
   * P5: Send streamed message with quick replies
   * Quick replies only appear on the last chunk
   */
  async sendStreamedMessageWithQuickReplies(params: {
    phone: string
    message: string
    quickReplies: string[]
    isChatOpened?: boolean
    enableIndicators?: boolean
  }): Promise<{
    success: boolean
    chunksCount: number
    totalLength: number
  }> {
    try {
      // Validate message length
      const validation = validateMessageLength(params.message)

      // If message doesn't need chunking, send with quick replies
      if (!validation.needsChunking) {
        await this.sendMessageWithQuickReplies(
          params.phone,
          params.message,
          params.quickReplies,
          { isChatOpened: params.isChatOpened }
        )

        return {
          success: true,
          chunksCount: 1,
          totalLength: params.message.length
        }
      }

      // Chunk the message
      let chunks = chunkMessage(params.message, DEFAULT_STREAM_CONFIG)

      // Add continuation indicators (but not on last chunk)
      if (params.enableIndicators !== false) {
        chunks = chunks.map((chunk, index) => {
          const isLast = index === chunks.length - 1
          if (index === 0 && !isLast) {
            return `${chunk}\n\n_(continua...)_`
          } else if (!isLast && index > 0) {
            return `_(continuação)_\n\n${chunk}\n\n_(continua...)_`
          } else if (isLast && index > 0) {
            return `_(continuação)_\n\n${chunk}`
          }
          return chunk
        })
      }

      // Stream chunks progressively
      await streamMessageChunks(
        chunks,
        async (chunk, isFirst, isLast) => {
          // Send quick replies only on the last chunk
          if (isLast) {
            await this.sendMessageWithQuickReplies(
              params.phone,
              chunk,
              params.quickReplies,
              { isChatOpened: params.isChatOpened }
            )
          } else {
            await this.sendMessage({
              phone: params.phone,
              message: chunk,
              isChatOpened: params.isChatOpened
            })
          }
        },
        DEFAULT_STREAM_CONFIG
      )

      return {
        success: true,
        chunksCount: chunks.length,
        totalLength: params.message.length
      }

    } catch (error) {
      console.error('Error sending streamed message with quick replies:', error)
      throw error
    }
  }
}

// Singleton instance
export const sendPulseClient = new SendPulseClient()
