/**
 * SendPulse Integration Constants
 * Centralized configuration for magic numbers and limits
 */

// WhatsApp Business API Limits
export const WHATSAPP_LIMITS = {
  /**
   * Maximum number of quick reply buttons per message
   * WhatsApp Business API enforces a limit of 3 buttons
   */
  MAX_QUICK_REPLY_BUTTONS: 3,

  /**
   * Maximum button title length
   * WhatsApp truncates titles longer than 20 characters
   */
  MAX_BUTTON_TITLE_LENGTH: 20,

  /**
   * 24-hour conversation window (in milliseconds)
   * After this period, only template messages can be sent
   */
  CONVERSATION_WINDOW_MS: 24 * 60 * 60 * 1000,

  /**
   * Maximum message length for text messages
   */
  MAX_TEXT_LENGTH: 4096,

  /**
   * Maximum caption length for media messages
   */
  MAX_CAPTION_LENGTH: 1024,
} as const

// API Configuration
export const API_CONFIG = {
  /**
   * SendPulse API base URL
   */
  BASE_URL: 'https://api.sendpulse.com/whatsapp',

  /**
   * OAuth token URL
   */
  TOKEN_URL: 'https://api.sendpulse.com/oauth/access_token',

  /**
   * Token safety margin in seconds
   * Request new token 60 seconds before expiry
   */
  TOKEN_EXPIRY_MARGIN_SECONDS: 60,

  /**
   * Default token expiry time (in seconds) if not provided by API
   */
  DEFAULT_TOKEN_EXPIRY_SECONDS: 3600,

  /**
   * API request timeout in milliseconds
   */
  REQUEST_TIMEOUT_MS: 30000,
} as const

// Cache Configuration
export const CACHE_CONFIG = {
  /**
   * Contact cache TTL in milliseconds (5 minutes)
   */
  CONTACT_TTL_MS: 5 * 60 * 1000,

  /**
   * Template cache TTL in milliseconds (1 hour)
   */
  TEMPLATE_TTL_MS: 60 * 60 * 1000,

  /**
   * Default conversation history limit
   */
  DEFAULT_CONVERSATION_HISTORY_LIMIT: 10,

  /**
   * Maximum contacts to fetch per API request
   */
  MAX_CONTACTS_PER_REQUEST: 100,
} as const

// Rate Limiting
export const RATE_LIMIT_CONFIG = {
  /**
   * Maximum requests per second to SendPulse API
   * Conservative limit to avoid rate limiting (80 req/sec)
   */
  MAX_REQUESTS_PER_SECOND: 80,

  /**
   * Token bucket refill rate (tokens per second)
   */
  REFILL_RATE: 80,

  /**
   * Initial token bucket capacity
   */
  BUCKET_CAPACITY: 100,
} as const

// Retry Configuration
export const RETRY_CONFIG = {
  /**
   * Maximum retry attempts for failed API requests
   */
  MAX_RETRY_ATTEMPTS: 3,

  /**
   * Initial retry delay in milliseconds
   */
  INITIAL_RETRY_DELAY_MS: 1000,

  /**
   * Exponential backoff multiplier
   */
  BACKOFF_MULTIPLIER: 2,

  /**
   * Maximum retry delay in milliseconds (10 seconds)
   */
  MAX_RETRY_DELAY_MS: 10000,

  /**
   * HTTP status codes that should trigger retry
   */
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504],
} as const

// Template Configuration
export const TEMPLATE_CONFIG = {
  /**
   * Default template language code
   */
  DEFAULT_LANGUAGE: 'pt_BR',

  /**
   * Template status that allows sending
   */
  APPROVED_STATUS: 'APPROVED',

  /**
   * Maximum template parameter length
   */
  MAX_PARAM_LENGTH: 100,
} as const

// Analytics Configuration
export const ANALYTICS_CONFIG = {
  /**
   * Analytics data retention period in days
   */
  RETENTION_DAYS: 30,

  /**
   * Time granularity options
   */
  TIME_GRANULARITY: {
    HOUR: 'hour',
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
  } as const,
} as const

// Environment Variables (with fallbacks documented)
export const ENV_VARS = {
  // Required variables (no fallbacks)
  REQUIRED: [
    'SENDPULSE_APP_ID',
    'SENDPULSE_APP_SECRET',
    'SENDPULSE_BOT_ID',
    'SENDPULSE_WEBHOOK_TOKEN',
  ] as const,

  // Optional variables
  OPTIONAL: [
    'SENDPULSE_API_TOKEN', // Static token (bypasses OAuth)
    'SENDPULSE_CLIENT_ID', // Legacy OAuth field
    'SENDPULSE_CLIENT_SECRET', // Legacy OAuth field
  ] as const,
} as const

// Brazilian Phone Number Configuration
export const PHONE_CONFIG = {
  /**
   * Country code for Brazil
   */
  COUNTRY_CODE: '55',

  /**
   * Valid phone number lengths (with country code)
   */
  VALID_LENGTHS: [12, 13], // 55 + 10/11 digits

  /**
   * Minimum length for phone number masking
   */
  MIN_LENGTH_FOR_MASKING: 8,
} as const

// Error Messages
export const ERROR_MESSAGES = {
  AUTH_FAILED: 'Authentication failed. Check SENDPULSE_APP_ID and SENDPULSE_APP_SECRET.',
  BOT_NOT_CONFIGURED: 'No WhatsApp bot configured. Set SENDPULSE_BOT_ID environment variable.',
  CONTACT_NOT_FOUND: 'Contact not found in SendPulse.',
  CONVERSATION_WINDOW_EXPIRED: '24-hour conversation window expired. Use template messages.',
  TEMPLATE_NOT_FOUND: 'Template not found or not approved.',
  TEMPLATE_NOT_APPROVED: 'Template not approved for sending.',
  INVALID_PHONE_NUMBER: 'Invalid phone number format.',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please wait and try again.',
  MAX_RETRIES_EXCEEDED: 'Maximum retry attempts exceeded.',
} as const
