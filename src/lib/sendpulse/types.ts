/**
 * SendPulse WhatsApp API Type Definitions
 * Comprehensive TypeScript interfaces for type-safe API interactions
 */

// ============================================================================
// Authentication Types
// ============================================================================

export interface SendPulseOAuthTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface SendPulseTokenInfo {
  hasToken: boolean
  isValid: boolean
  expiresIn: number
}

// ============================================================================
// Bot Types
// ============================================================================

export interface SendPulseBot {
  id: string
  name: string
  status: number // 3 = active
  channel: 'WHATSAPP'
  channel_data: {
    phone: number
    name: string
    about?: string
    photo?: string
    business_profile?: {
      about?: string
      address?: string
      description?: string
      email?: string
      vertical?: string
      websites?: string[]
    }
    compliance_info?: any
  }
  inbox: {
    total: number
    unread: number
  }
  variables: any[]
  settings: {
    two_step_verification_enabled: boolean
    service_links: boolean
    open_chat_notification: boolean
    disable_trigger_hints: boolean
    create_contacts_in_crm: boolean
    pause_automation_minutes: number
    standard_text_settings?: {
      trigger_autocorrection_request_indicator?: string
    }
  }
  version: string
  created_at: string
}

export interface SendPulseBotsResponse {
  success: boolean
  data: SendPulseBot[]
}

// ============================================================================
// Contact Types
// ============================================================================

export interface SendPulseContact {
  id: string
  status: number // 0 = new, 1 = active, 2 = inactive
  type: number // 1 = new, 2 = returning
  bot_id: string
  channel_data: {
    phone: number
    name?: string
    photo?: string | null
  }
  is_chat_opened: boolean // true if within 24h conversation window
  last_session: string | null
  last_referral_at: string | null
  last_referral: string | null
  tags: string[]
  variables: Record<string, any>
  operator: any | null
  referral_source: any | null
  last_activity_at: string | null
  automation_paused_until: string | null
  unsubscribed_at: string | null
  is_banned: boolean
  created_at: string
}

export interface SendPulseContactsResponse {
  success: boolean
  data: SendPulseContact[]
}

export interface CreateContactRequest {
  bot_id: string
  phone: string | number
  name?: string
  variables?: Record<string, any>
  tags?: string[]
}

// ============================================================================
// Message Types
// ============================================================================

export type MessageType = 'text' | 'image' | 'document' | 'interactive'

export interface TextMessage {
  type: 'text'
  text: {
    body: string
    preview_url?: boolean
  }
}

export interface ImageMessage {
  type: 'image'
  image: {
    link: string
    caption?: string
  }
}

export interface DocumentMessage {
  type: 'document'
  document: {
    link: string
    filename?: string
    caption?: string
  }
}

export interface InteractiveButtonsMessage {
  type: 'interactive'
  interactive: {
    type: 'button'
    body: {
      text: string
    }
    action: {
      buttons: Array<{
        type: 'reply'
        reply: {
          id: string
          title: string
        }
      }>
    }
  }
}

export interface InteractiveListMessage {
  type: 'interactive'
  interactive: {
    type: 'list'
    body: {
      text: string
    }
    action: {
      button: string
      sections: Array<{
        title: string
        rows: Array<{
          id: string
          title: string
          description?: string
        }>
      }>
    }
  }
}

export type WhatsAppMessage =
  | TextMessage
  | ImageMessage
  | DocumentMessage
  | InteractiveButtonsMessage
  | InteractiveListMessage

export interface SendMessageRequest {
  contact_id: string
  message: WhatsAppMessage
}

export interface SendMessageResponse {
  success: boolean
  data: {
    id: string
    contact_id: string
    bot_id: string
    sent_by: any | null
    campaign: any | null
    chain: any | null
    type: MessageType
    is_paid: boolean
    reject_reason: string | null
    direction: number // 2 = outbound
    status: number // 1 = sent
    channel: string // 'api'
    price_cbp: {
      price: number
      currency: string
      origin_type: string
      is_free_conversation: boolean
      country_code: string
      is_mm_lite: boolean
    }
    edited_by: any | null
    created_at: string
    data: {
      type: MessageType
      message_id?: string
      [key: string]: any
    }
  }
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface SendPulseWebhookData {
  event: string
  message?: {
    id: string
    text?: {
      body: string
    }
    interactive?: {
      type: string
      list_reply?: {
        title: string
        id: string
      }
      button_reply?: {
        title: string
        id: string
      }
    }
    audio?: any
    image?: any
    video?: any
    document?: any
    timestamp: string
    from: string
    to: string
  }
  contact?: {
    id: string
    name?: string
    email?: string
    phone?: string
    identifier?: string
    variables?: Record<string, any>
    tags?: string[]
  }
  timestamp?: string
}

// ============================================================================
// Account Types
// ============================================================================

export interface SendPulseAccountInfo {
  success: boolean
  data: {
    tariff: {
      branding: boolean
      max_bots: number
      max_contacts: number
      max_messages: number
      max_tags: number
      max_variables: number
      max_rss: number
      code: string
      is_exceeded: boolean
      is_expired: boolean
      expired_at: string
    }
    statistics: {
      messages: number
      bots: number
      contacts: number
      variables: number
      active_count_by_last_month: number
    }
  }
}

export interface SendPulseBalance {
  currency: string
  balance_currency: number
}

// ============================================================================
// Error Types
// ============================================================================

export interface SendPulseAPIError {
  message: string
  errors?: Record<string, string[]>
  error_code?: number
}

// ============================================================================
// Client Configuration Types
// ============================================================================

export interface SendPulseClientConfig {
  botId?: string // Optional default bot ID
  webhookToken?: string
  cacheContacts?: boolean // Enable contact caching (default: true)
  cacheTTL?: number // Cache TTL in milliseconds (default: 3600000 - 1 hour)
}

// ============================================================================
// Convenience Types for Backward Compatibility
// ============================================================================

export interface LegacySendMessageParams {
  phone: string
  message: string
  buttons?: Array<{
    type: 'reply'
    reply: {
      title: string
      id: string
    }
  }>
  image?: string
  document?: string
}

// ============================================================================
// Template Message Types (Phase 3)
// ============================================================================

export interface SendPulseTemplate {
  id: string
  name: string
  language: string
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DELETED'
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  components: TemplateComponent[]
  created_at?: string
  updated_at?: string
}

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  text?: string
  example?: {
    header_text?: string[]
    body_text?: string[][]
  }
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
    text: string
    url?: string
    phone_number?: string
  }>
}

export interface TemplateMessage {
  type: 'template'
  template: {
    name: string
    language: {
      code: string // e.g., 'pt_BR', 'en_US'
    }
    components?: Array<{
      type: 'header' | 'body' | 'button'
      parameters?: Array<{
        type: 'text' | 'image' | 'document' | 'video'
        text?: string
        image?: { link: string }
        document?: { link: string; filename?: string }
        video?: { link: string }
      }>
      sub_type?: 'quick_reply' | 'url'
      index?: number
    }>
  }
}

export interface SendPulseTemplatesResponse {
  success: boolean
  data: SendPulseTemplate[]
}

// ============================================================================
// Webhook Event Types (Phase 3)
// ============================================================================

export type WebhookEventType =
  | 'message.new'
  | 'message.status'
  | 'contact.created'
  | 'contact.updated'
  | 'conversation.opened'
  | 'conversation.closed'

export interface WebhookEvent {
  event: WebhookEventType
  bot_id: string
  contact_id: string
  timestamp: string
  data: MessageEvent | StatusEvent | ContactEvent | ConversationEvent
}

export interface MessageEvent {
  message_id: string
  type: MessageType | 'template'
  direction: 'inbound' | 'outbound'
  content: {
    text?: string
    image?: string
    document?: string
    buttons?: any[]
  }
  timestamp: string
  from: string
  to: string
}

export interface StatusEvent {
  message_id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  error?: {
    code: number
    message: string
  }
}

export interface ContactEvent {
  contact_id: string
  action: 'created' | 'updated'
  changes?: {
    field: string
    old_value: any
    new_value: any
  }[]
  timestamp: string
}

export interface ConversationEvent {
  contact_id: string
  action: 'opened' | 'closed'
  timestamp: string
  duration?: number // seconds, for closed events
}

// ============================================================================
// Rate Limiting Types (Phase 3)
// ============================================================================

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  strategy: 'token-bucket' | 'sliding-window' | 'fixed-window'
  burstSize?: number // For token bucket
}

export interface RateLimitState {
  tokens: number
  lastRefill: number
  requestCount: number
  windowStart: number
}

// ============================================================================
// Retry Types (Phase 3)
// ============================================================================

export interface RetryConfig {
  maxRetries: number
  initialDelay: number // milliseconds
  maxDelay: number // milliseconds
  backoffMultiplier: number
  retryableStatusCodes: number[]
  retryableErrors: string[]
}

export interface RetryAttempt {
  attempt: number
  delay: number
  error?: Error
  timestamp: number
}

// ============================================================================
// Analytics Types (Phase 3)
// ============================================================================

export interface ConversationMetrics {
  contact_id: string
  bot_id: string
  totalMessages: number
  sentByBot: number
  sentByUser: number
  averageResponseTime: number // milliseconds
  conversationDuration: number // milliseconds
  lastActivity: string
  messagesByType: Record<MessageType | 'template', number>
  deliveryRate: number // percentage
  readRate: number // percentage
  failureRate: number // percentage
}

export interface MessageMetrics {
  total: number
  sent: number
  delivered: number
  read: number
  failed: number
  byType: Record<MessageType | 'template', number>
  byHour: Record<string, number> // ISO hour -> count
  byDay: Record<string, number> // ISO date -> count
}

export interface AnalyticsTimeframe {
  start: string // ISO datetime
  end: string // ISO datetime
  granularity: 'hour' | 'day' | 'week' | 'month'
}

export interface AnalyticsSummary {
  timeframe: AnalyticsTimeframe
  conversations: {
    total: number
    active: number
    closed: number
    averageDuration: number
  }
  messages: MessageMetrics
  contacts: {
    total: number
    new: number
    active: number
    returning: number
  }
  performance: {
    averageResponseTime: number
    deliveryRate: number
    readRate: number
    failureRate: number
  }
}
