/**
 * SendPulse WhatsApp Integration
 * Complete module exports (Phase 3 - Advanced Features)
 */
// Main client
export { SendPulseClient, sendPulseClient } from '../sendpulse-client'
// Authentication
export { SendPulseAuth, sendPulseAuth } from '../sendpulse-auth'
// Bot management
export { BotManager, botManager } from './bot-manager'
// Contact caching
export { ContactCache, contactCache } from './contact-cache'
// Phase 3 - Advanced Features
export { RateLimiter, rateLimiter } from './rate-limiter'
export { RetryManager, retryManager } from './retry-manager'
export { TemplateManager, templateManager } from './template-manager'
export { WebhookHandler, webhookHandler } from './webhook-handler'
export { AnalyticsService, analyticsService } from './analytics-service'
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
  LegacySendMessageParams,
  // Phase 3 types
  SendPulseTemplate,
  TemplateMessage,
  WebhookEvent,
  WebhookEventType,
  MessageEvent,
  StatusEvent,
  ContactEvent,
  ConversationEvent,
  RateLimitConfig,
  RetryConfig,
  ConversationMetrics,
  MessageMetrics,
  AnalyticsSummary
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