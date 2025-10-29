/**
 * Development-only logging utility for debugging
 * Prevents sensitive information from being logged in production
 */

const isDev = process.env.NODE_ENV === 'development'

/**
 * List of sensitive field name substrings to redact (case-insensitive)
 */
const SENSITIVE_FIELDS = [
  'token',
  'password',
  'credential',
  'apikey',
  'api_key',
  'secret',
  'key',
  'authorization',
  'auth'
]

/**
 * Check if a key contains sensitive information
 */
const isSensitiveKey = (key: string): boolean => {
  const lowerKey = key.toLowerCase()
  return SENSITIVE_FIELDS.some(sensitive => lowerKey.includes(sensitive))
}

/**
 * Deep sanitize an object by recursively redacting sensitive fields
 * Non-mutating - creates a new object without modifying the original
 */
const deepSanitize = (value: any): any => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return value
  }

  // Handle arrays - recursively sanitize each element
  if (Array.isArray(value)) {
    return value.map(item => deepSanitize(item))
  }

  // Handle objects - recursively sanitize properties
  if (typeof value === 'object') {
    const sanitized: Record<string, any> = {}

    for (const [key, val] of Object.entries(value)) {
      if (isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = deepSanitize(val)
      }
    }

    return sanitized
  }

  // Primitive values are returned as-is
  return value
}

export const devLog = {
  /**
   * Log informational messages (development only)
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.log(...args)
    }
  },

  /**
   * Log warning messages (development only)
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args)
    }
  },

  /**
   * Log error messages (always logged for debugging)
   * Use console.error directly for production-critical errors
   */
  error: (...args: any[]) => {
    console.error(...args)
  },

  /**
   * Log debug messages with additional context (development only)
   */
  debug: (context: string, data: any) => {
    if (isDev) {
      console.log(`[DEBUG:${context}]`, data)
    }
  },

  /**
   * Log authentication flow events (development only)
   * Never logs tokens or sensitive credentials - uses deep sanitization
   */
  auth: (event: string, metadata?: Record<string, any>) => {
    if (isDev) {
      const safeMetadata = metadata ? deepSanitize(metadata) : {}

      console.log(`[AUTH:${event}]`, Object.keys(safeMetadata).length > 0 ? safeMetadata : '')
    }
  }
}
