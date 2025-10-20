/**
 * P4: Rate Limiting Implementation
 * Protects webhook endpoints from abuse and DoS attacks
 */
interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  identifier: string // Unique identifier (IP, phone, etc.)
}
interface RateLimitStore {
  count: number
  resetAt: number
}
// In-memory store for rate limiting (production should use Redis)
const rateLimitStore = new Map<string, RateLimitStore>()
/**
 * P4: Rate limiter with sliding window algorithm
 * @param config - Rate limit configuration
 * @returns true if rate limit exceeded, false otherwise
 */
export function checkRateLimit(config: RateLimitConfig): {
  limited: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const key = `ratelimit:${config.identifier}`
  // Get current rate limit data
  const current = rateLimitStore.get(key)
  // If no data or window expired, reset
  if (!current || now >= current.resetAt) {
    const newResetAt = now + config.windowMs
    rateLimitStore.set(key, {
      count: 1,
      resetAt: newResetAt
    })
    return {
      limited: false,
      remaining: config.maxRequests - 1,
      resetAt: newResetAt
    }
  }
  // Increment counter
  current.count++
  // Check if limit exceeded
  if (current.count > config.maxRequests) {
    return {
      limited: true,
      remaining: 0,
      resetAt: current.resetAt
    }
  }
  return {
    limited: false,
    remaining: config.maxRequests - current.count,
    resetAt: current.resetAt
  }
}
/**
 * P4: Clean up expired rate limit entries
 * Should be called periodically to prevent memory leaks
 */
export function cleanupExpiredRateLimits(): number {
  const now = Date.now()
  let cleaned = 0
  for (const [key, data] of rateLimitStore.entries()) {
    if (now >= data.resetAt) {
      rateLimitStore.delete(key)
      cleaned++
    }
  }
  return cleaned
}
/**
 * P4: Get rate limit status without incrementing
 */
export function getRateLimitStatus(identifier: string): {
  count: number
  resetAt: number
} | null {
  const key = `ratelimit:${identifier}`
  const current = rateLimitStore.get(key)
  if (!current || Date.now() >= current.resetAt) {
    return null
  }
  return {
    count: current.count,
    resetAt: current.resetAt
  }
}
/**
 * P4: Rate limit presets for different use cases
 */
export const RateLimitPresets = {
  // Webhook endpoints - per phone number
  WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30 // 30 messages per minute per phone
  },
  // Webhook endpoints - global per IP
  WEBHOOK_IP: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100 // 100 requests per minute per IP
  },
  // API endpoints - general
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100 // 100 requests per 15 minutes
  },
  // Authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // 5 attempts per 15 minutes
  }
} as const
// P4: Automatic cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = cleanupExpiredRateLimits()
    if (cleaned > 0) {
    }
  }, 5 * 60 * 1000) // 5 minutes
}