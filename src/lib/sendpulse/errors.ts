/**
 * SendPulse Error Classes
 * Specific error types for better error handling and debugging
 */
export class SendPulseError extends Error {
  constructor(
    message: string,
    public code?: string | number,
    public details?: any
  ) {
    super(message)
    this.name = 'SendPulseError'
    Object.setPrototypeOf(this, SendPulseError.prototype)
  }
}
export class SendPulseAuthError extends SendPulseError {
  constructor(message: string, details?: any) {
    super(message, 'AUTH_ERROR', details)
    this.name = 'SendPulseAuthError'
    Object.setPrototypeOf(this, SendPulseAuthError.prototype)
  }
}
export class SendPulseBotError extends SendPulseError {
  constructor(message: string, details?: any) {
    super(message, 'BOT_ERROR', details)
    this.name = 'SendPulseBotError'
    Object.setPrototypeOf(this, SendPulseBotError.prototype)
  }
}
export class SendPulseContactError extends SendPulseError {
  constructor(message: string, details?: any) {
    super(message, 'CONTACT_ERROR', details)
    this.name = 'SendPulseContactError'
    Object.setPrototypeOf(this, SendPulseContactError.prototype)
  }
}
export class SendPulseMessageError extends SendPulseError {
  constructor(message: string, code?: string | number, details?: any) {
    super(message, code, details)
    this.name = 'SendPulseMessageError'
    Object.setPrototypeOf(this, SendPulseMessageError.prototype)
  }
}
/**
 * Specific error for 24-hour conversation window violations
 */
export class ConversationWindowExpiredError extends SendPulseMessageError {
  constructor(contactId: string, phone?: string) {
    super(
      `Cannot send message to contact ${contactId}: 24-hour conversation window has expired. ` +
      `Contact must initiate conversation or use template messages.`,
      'CONVERSATION_WINDOW_EXPIRED',
      { contactId, phone }
    )
    this.name = 'ConversationWindowExpiredError'
    Object.setPrototypeOf(this, ConversationWindowExpiredError.prototype)
  }
}
/**
 * Error for API rate limiting
 */
export class SendPulseRateLimitError extends SendPulseError {
  constructor(
    message: string,
    public retryAfter?: number,
    details?: any
  ) {
    super(message, 'RATE_LIMIT', details)
    this.name = 'SendPulseRateLimitError'
    Object.setPrototypeOf(this, SendPulseRateLimitError.prototype)
  }
}
/**
 * Error for network/API communication issues
 */
export class SendPulseNetworkError extends SendPulseError {
  constructor(message: string, public statusCode?: number, details?: any) {
    super(message, statusCode, details)
    this.name = 'SendPulseNetworkError'
    Object.setPrototypeOf(this, SendPulseNetworkError.prototype)
  }
}
/**
 * Error factory for parsing API error responses
 */
export function createSendPulseError(
  statusCode: number,
  errorData: any
): SendPulseError {
  const message = errorData.message || errorData.error || 'Unknown error'
  const errors = errorData.errors || {}
  const errorCode = errorData.error_code || statusCode
  // Check for specific error patterns
  if (errors.contact_id && errors.contact_id.some((msg: string) => msg.includes('not active in 24hours'))) {
    const contactId = errorData.contact_id || 'unknown'
    return new ConversationWindowExpiredError(contactId)
  }
  if (statusCode === 401 || statusCode === 403) {
    return new SendPulseAuthError(message, { statusCode, errors })
  }
  if (statusCode === 429) {
    const retryAfter = errorData.retry_after
    return new SendPulseRateLimitError(message, retryAfter, { errors })
  }
  if (statusCode === 404) {
    return new SendPulseError(`Resource not found: ${message}`, 404, { errors })
  }
  if (statusCode >= 500) {
    return new SendPulseNetworkError(
      `SendPulse server error: ${message}`,
      statusCode,
      { errors }
    )
  }
  return new SendPulseError(message, errorCode, { statusCode, errors })
}