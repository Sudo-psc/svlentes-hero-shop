/**
 * SendPulse WhatsApp Integration
 * Complete module exports
 */

// Main client
export { SendPulseClient, sendPulseClient } from '../sendpulse-client'

// Authentication
export { SendPulseAuth, sendPulseAuth } from '../sendpulse-auth'

// Bot management
export { BotManager, botManager } from './bot-manager'

// Contact caching
export { ContactCache, contactCache } from './contact-cache'

// Type definitions
export type {
  SendPulseBot,
  SendPulseBotsResponse,
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
  SendPulseWebhookData,
  SendPulseAccountInfo,
  SendPulseBalance,
  SendPulseOAuthTokenResponse,
  SendPulseTokenInfo,
  LegacySendMessageParams
} from './types'

// Error classes
export {
  SendPulseError,
  SendPulseAuthError,
  SendPulseBotError,
  SendPulseContactError,
  SendPulseMessageError,
  ConversationWindowExpiredError,
  SendPulseRateLimitError,
  SendPulseNetworkError,
  createSendPulseError
} from './errors'
