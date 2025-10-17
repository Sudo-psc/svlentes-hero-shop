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
