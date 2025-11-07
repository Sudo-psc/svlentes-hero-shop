/**
 * Authentication Middleware for Next.js API Routes
 *
 * SECURITY FEATURES:
 * - Automatic token verification with caching
 * - Rate limiting per authenticated user
 * - Request logging for audit trails
 * - CORS security headers
 * - IP-based suspicious activity detection
 *
 * @author Dr. Philipe Saraiva Cruz
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthToken, logAccess } from '@/lib/api-auth'
import { getTokenCacheStats } from '@/lib/token-cache'

// Rate limiting configuration (per authenticated user)
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100 // Per authenticated user
const RATE_LIMIT_ANONYMOUS_MAX = 10 // For unauthenticated requests

// Suspicious activity detection
const MAX_FAILED_ATTEMPTS = 5 // Lock out after 5 failed attempts
const SUSPICIOUS_ACTIVITY_WINDOW = 15 * 60 * 1000 // 15 minutes

interface RateLimitEntry {
  count: number
  resetTime: number
  lastRequest: number
}

interface SecurityContext {
  clientId: string
  ipAddress: string
  userAgent: string
  requestId: string
  timestamp: number
}

// In-memory rate limiting store (production should use Redis)
const rateLimitMap = new Map<string, RateLimitEntry>()
const failedAttemptsMap = new Map<string, { count: number; lastAttempt: number }>()

/**
 * Extract security context from request
 */
function extractSecurityContext(request: NextRequest): SecurityContext {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const userAgent = request.headers.get('user-agent') || 'unknown'

  const ipAddress = forwarded?.split(',')[0]?.trim() ||
                   realIp ||
                   request.ip ||
                   'unknown'

  return {
    clientId: generateClientId(request, ipAddress),
    ipAddress,
    userAgent,
    requestId: crypto.randomUUID(),
    timestamp: Date.now()
  }
}

/**
 * Generate client identifier for rate limiting
 */
function generateClientId(request: NextRequest, ipAddress: string): string {
  try {
    const url = new URL(request.url)
    return `${ipAddress}:${url.pathname}`
  } catch {
    return ipAddress
  }
}

/**
 * Check rate limiting for client
 */
function checkRateLimit(clientId: string, isAuth: boolean): {
  allowed: boolean
  resetTime?: number
  remaining?: number
} {
  const now = Date.now()
  const entry = rateLimitMap.get(clientId)
  const maxRequests = isAuth ? RATE_LIMIT_MAX_REQUESTS : RATE_LIMIT_ANONYMOUS_MAX

  if (!entry || now > entry.resetTime) {
    // Reset or create new entry
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
      lastRequest: now
    }
    rateLimitMap.set(clientId, newEntry)
    return {
      allowed: true,
      resetTime: newEntry.resetTime,
      remaining: maxRequests - 1
    }
  }

  // Check if within limits
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      resetTime: entry.resetTime,
      remaining: 0
    }
  }

  // Increment counter
  entry.count++
  entry.lastRequest = now

  return {
    allowed: true,
    resetTime: entry.resetTime,
    remaining: maxRequests - entry.count
  }
}

/**
 * Check for suspicious activity
 */
function checkSuspiciousActivity(securityContext: SecurityContext): {
  blocked: boolean
  reason?: string
} {
  const now = Date.now()
  const attempts = failedAttemptsMap.get(securityContext.clientId)

  if (!attempts || now - attempts.lastAttempt > SUSPICIOUS_ACTIVITY_WINDOW) {
    // Reset or clear old attempts
    if (attempts) {
      failedAttemptsMap.delete(securityContext.clientId)
    }
    return { blocked: false }
  }

  if (attempts.count >= MAX_FAILED_ATTEMPTS) {
    return {
      blocked: true,
      reason: 'Too many failed authentication attempts'
    }
  }

  return { blocked: false }
}

/**
 * Record failed authentication attempt
 */
function recordFailedAttempt(clientId: string): void {
  const now = Date.now()
  const attempts = failedAttemptsMap.get(clientId)

  if (!attempts || now - attempts.lastAttempt > SUSPICIOUS_ACTIVITY_WINDOW) {
    failedAttemptsMap.set(clientId, { count: 1, lastAttempt: now })
  } else {
    attempts.count++
    attempts.lastAttempt = now
  }
}

/**
 * Cleanup expired entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()

  // Cleanup rate limit entries
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key)
    }
  }

  // Cleanup failed attempt entries
  for (const [key, attempts] of failedAttemptsMap.entries()) {
    if (now - attempts.lastAttempt > SUSPICIOUS_ACTIVITY_WINDOW) {
      failedAttemptsMap.delete(key)
    }
  }
}

/**
 * Enhanced authentication middleware wrapper
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, context: { user: any; security: SecurityContext }, ...args: T) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean
    rateLimit?: {
      max?: number
      window?: number
    }
    cors?: {
      origins?: string[]
      methods?: string[]
    }
  } = {}
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const securityContext = extractSecurityContext(request)
    const { requireAuth = true } = options

    try {
      // Cleanup expired entries periodically
      if (Math.random() < 0.01) { // 1% chance to cleanup
        cleanupExpiredEntries()
      }

      // Check suspicious activity
      const suspiciousCheck = checkSuspiciousActivity(securityContext)
      if (suspiciousCheck.blocked) {
        logAccess('suspicious_ip', null, 'SUSPICIOUS_ACTIVITY_BLOCKED', {
          clientId: securityContext.clientId,
          ipAddress: securityContext.ipAddress,
          reason: suspiciousCheck.reason,
          requestId: securityContext.requestId
        })

        return NextResponse.json(
          { error: 'Access temporarily blocked' },
          { status: 429, headers: securityHeaders() }
        )
      }

      // Check rate limiting (anonymous check first)
      const anonymousRateLimit = checkRateLimit(securityContext.clientId, false)
      if (!anonymousRateLimit.allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          {
            status: 429,
            headers: {
              ...securityHeaders(),
              'X-RateLimit-Limit': RATE_LIMIT_ANONYMOUS_MAX.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil(anonymousRateLimit.resetTime! / 1000).toString(),
              'Retry-After': Math.ceil((anonymousRateLimit.resetTime! - Date.now()) / 1000).toString()
            }
          }
        )
      }

      // Authentication if required
      let authResult = null
      if (requireAuth) {
        authResult = await verifyAuthToken(request)

        if (!authResult.success || !authResult.user) {
          recordFailedAttempt(securityContext.clientId)

          // Log failed authentication attempt
          logAccess('auth_failed', null, 'AUTHENTICATION_FAILED', {
            clientId: securityContext.clientId,
            ipAddress: securityContext.ipAddress,
            requestId: securityContext.requestId,
            error: authResult.error?.error
          })

          return NextResponse.json(
            authResult.error || { error: 'Authentication required' },
            {
              status: authResult.error?.statusCode || 401,
              headers: securityHeaders()
            }
          )
        }

        // Check authenticated rate limiting
        const authRateLimit = checkRateLimit(securityContext.clientId, true)
        if (!authRateLimit.allowed) {
          return NextResponse.json(
            { error: 'Rate limit exceeded' },
            {
              status: 429,
              headers: {
                ...securityHeaders(),
                'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': Math.ceil(authRateLimit.resetTime! / 1000).toString(),
                'Retry-After': Math.ceil((authRateLimit.resetTime! - Date.now()) / 1000).toString()
              }
            }
          )
        }

        // Clear failed attempts on successful auth
        failedAttemptsMap.delete(securityContext.clientId)

        // Log successful authentication
        logAccess(authResult.user.uid, authResult.user.email, 'API_ACCESS_GRANTED', {
          clientId: securityContext.clientId,
          ipAddress: securityContext.ipAddress,
          requestId: securityContext.requestId,
          userAgent: securityContext.userAgent
        })
      }

      // Execute the handler with enhanced context
      const response = await handler(request, {
        user: authResult?.user,
        security: securityContext
      }, ...args)

      // Add security headers to response
      Object.entries(securityHeaders()).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      // Add rate limiting headers for authenticated requests
      if (authResult?.success) {
        const rateLimit = checkRateLimit(securityContext.clientId, true)
        response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString())
        response.headers.set('X-RateLimit-Remaining', rateLimit.remaining?.toString() || '0')
        response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimit.resetTime! / 1000).toString())
      }

      // Add request ID for tracing
      response.headers.set('X-Request-ID', securityContext.requestId)

      return response

    } catch (error) {
      console.error('[Auth Middleware] Unexpected error', {
        requestId: securityContext.requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        { error: 'Internal server error' },
        {
          status: 500,
          headers: {
            ...securityHeaders(),
            'X-Request-ID': securityContext.requestId
          }
        }
      )
    }
  }
}

/**
 * Standard security headers
 */
function securityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  }
}

/**
 * Get middleware statistics for monitoring
 */
export function getAuthMiddlewareStats(): {
  rateLimitMapSize: number
  failedAttemptsMapSize: number
  tokenCacheStats: ReturnType<typeof getTokenCacheStats>
} {
  return {
    rateLimitMapSize: rateLimitMap.size,
    failedAttemptsMapSize: failedAttemptsMap.size,
    tokenCacheStats: getTokenCacheStats()
  }
}

/**
 * Clear all middleware caches (security incident response)
 */
export function clearAuthMiddlewareCaches(): void {
  rateLimitMap.clear()
  failedAttemptsMap.clear()

  // Also clear token cache
  const { clearTokenCache } = require('./token-cache')
  clearTokenCache()
}

// Cleanup on process exit
process.on('SIGTERM', cleanupExpiredEntries)
process.on('SIGINT', cleanupExpiredEntries)