/**
 * Rate Limiting Configuration and Utilities
 *
 * This module provides rate limiting functionality for API routes
 * using Upstash Redis for distributed rate limiting or in-memory
 * store for development/single-instance deployments.
 *
 * Rate Limits:
 * - /api/assinante/* - 100 requests/hour per authenticated user
 * - /api/webhooks/* - 1000 requests/hour per webhook source
 * - /api/asaas/* - 50 requests/hour per IP address
 * - All other /api/* - 200 requests/hour per IP
 *
 * IMPORTANT: This module uses dynamic imports to avoid build-time initialization
 * of Upstash libraries which can cause edge runtime compatibility issues.
 */

// Type imports are safe (no runtime execution)
import type { Ratelimit } from '@upstash/ratelimit';
import type { Redis } from '@upstash/redis';

// Environment variables
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Check if Upstash Redis is configured
const isUpstashConfigured = !!(
  UPSTASH_REDIS_REST_URL &&
  UPSTASH_REDIS_REST_TOKEN &&
  UPSTASH_REDIS_REST_URL.length > 0 &&
  UPSTASH_REDIS_REST_TOKEN.length > 0
);

// Lazy Redis client initialization to avoid build-time issues
let redis: Redis | null = null;
let redisInitialized = false;

async function getRedisClient(): Promise<Redis | null> {
  if (redisInitialized) {
    return redis;
  }

  try {
    if (isUpstashConfigured) {
      const { Redis } = await import('@upstash/redis');
      redis = new Redis({
        url: UPSTASH_REDIS_REST_URL!,
        token: UPSTASH_REDIS_REST_TOKEN!,
      });
    }
  } catch (error) {
    console.warn('[RateLimit] Failed to initialize Upstash Redis, falling back to memory store:', error);
    redis = null;
  }

  redisInitialized = true;
  return redis;
}

/**
 * In-memory rate limiter for development/single-instance deployments
 * Uses a simple Map with TTL to track requests
 */
class MemoryRateLimiter {
  private storage = new Map<string, { count: number; resetAt: number }>();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;

    // Clean up expired entries every minute
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 60000);
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.storage.entries()) {
      if (value.resetAt < now) {
        this.storage.delete(key);
      }
    }
  }

  async limit(identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const entry = this.storage.get(identifier);

    // If no entry or expired, create new one
    if (!entry || entry.resetAt < now) {
      const resetAt = now + this.windowMs;
      this.storage.set(identifier, { count: 1, resetAt });
      return {
        success: true,
        limit: this.limit,
        remaining: this.limit - 1,
        reset: resetAt,
      };
    }

    // Check if limit exceeded
    if (entry.count >= this.limit) {
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        reset: entry.resetAt,
      };
    }

    // Increment count
    entry.count += 1;
    this.storage.set(identifier, entry);

    return {
      success: true,
      limit: this.limit,
      remaining: this.limit - entry.count,
      reset: entry.resetAt,
    };
  }
}

// Rate limiter configurations
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Rate limiter for subscriber area (/api/assinante/*)
 * Limit: 100 requests per hour per authenticated user
 */
let _subscriberRateLimiter: Ratelimit | MemoryRateLimiter | null = null;

async function getSubscriberRateLimiter() {
  if (_subscriberRateLimiter !== null) {
    return _subscriberRateLimiter;
  }

  const redis = await getRedisClient();
  if (redis !== null) {
    try {
      const { Ratelimit } = await import('@upstash/ratelimit');
      _subscriberRateLimiter = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(100, '1 h'),
        analytics: true,
        prefix: '@svlentes/subscriber',
      });
      return _subscriberRateLimiter;
    } catch (error) {
      console.warn('[RateLimit] Failed to create Upstash rate limiter, using memory store:', error);
    }
  }
  _subscriberRateLimiter = new MemoryRateLimiter(100, ONE_HOUR_MS);
  return _subscriberRateLimiter;
}

export const subscriberRateLimiter = { async get() { return await getSubscriberRateLimiter(); } };

/**
 * Rate limiter for webhooks (/api/webhooks/*)
 * Limit: 1000 requests per hour per webhook source
 */
let _webhookRateLimiter: Ratelimit | MemoryRateLimiter | null = null;

async function getWebhookRateLimiter() {
  if (_webhookRateLimiter !== null) {
    return _webhookRateLimiter;
  }

  const redis = await getRedisClient();
  if (redis !== null) {
    try {
      const { Ratelimit } = await import('@upstash/ratelimit');
      _webhookRateLimiter = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(1000, '1 h'),
        analytics: true,
        prefix: '@svlentes/webhook',
      });
      return _webhookRateLimiter;
    } catch (error) {
      console.warn('[RateLimit] Failed to create Upstash rate limiter, using memory store:', error);
    }
  }
  _webhookRateLimiter = new MemoryRateLimiter(1000, ONE_HOUR_MS);
  return _webhookRateLimiter;
}

export const webhookRateLimiter = { async get() { return await getWebhookRateLimiter(); } };

/**
 * Rate limiter for payment endpoints (/api/asaas/*)
 * Limit: 50 requests per hour per IP address
 */
let _paymentRateLimiter: Ratelimit | MemoryRateLimiter | null = null;

async function getPaymentRateLimiter() {
  if (_paymentRateLimiter !== null) {
    return _paymentRateLimiter;
  }

  const redis = await getRedisClient();
  if (redis !== null) {
    try {
      const { Ratelimit } = await import('@upstash/ratelimit');
      _paymentRateLimiter = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(50, '1 h'),
        analytics: true,
        prefix: '@svlentes/payment',
      });
      return _paymentRateLimiter;
    } catch (error) {
      console.warn('[RateLimit] Failed to create Upstash rate limiter, using memory store:', error);
    }
  }
  _paymentRateLimiter = new MemoryRateLimiter(50, ONE_HOUR_MS);
  return _paymentRateLimiter;
}

export const paymentRateLimiter = { async get() { return await getPaymentRateLimiter(); } };

/**
 * Default rate limiter for all other API routes
 * Limit: 200 requests per hour per IP
 */
let _defaultRateLimiter: Ratelimit | MemoryRateLimiter | null = null;

async function getDefaultRateLimiter() {
  if (_defaultRateLimiter !== null) {
    return _defaultRateLimiter;
  }

  const redis = await getRedisClient();
  if (redis !== null) {
    try {
      const { Ratelimit } = await import('@upstash/ratelimit');
      _defaultRateLimiter = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(200, '1 h'),
        analytics: true,
        prefix: '@svlentes/default',
      });
      return _defaultRateLimiter;
    } catch (error) {
      console.warn('[RateLimit] Failed to create Upstash rate limiter, using memory store:', error);
    }
  }
  _defaultRateLimiter = new MemoryRateLimiter(200, ONE_HOUR_MS);
  return _defaultRateLimiter;
}

export const defaultRateLimiter = { async get() { return await getDefaultRateLimiter(); } };

/**
 * Select appropriate rate limiter based on pathname
 */
export async function selectRateLimiter(pathname: string) {
  if (pathname.startsWith('/api/assinante/')) {
    return await subscriberRateLimiter.get();
  }
  if (pathname.startsWith('/api/webhooks/')) {
    return await webhookRateLimiter.get();
  }
  if (pathname.startsWith('/api/asaas/')) {
    return await paymentRateLimiter.get();
  }
  if (pathname.startsWith('/api/')) {
    return await defaultRateLimiter.get();
  }
  return null;
}

/**
 * Get identifier for rate limiting
 * - For subscriber routes: use user ID from token
 * - For webhooks: use IP or webhook token
 * - For other routes: use IP address
 */
export function getRateLimitIdentifier(
  pathname: string,
  ip: string,
  userId?: string,
  webhookToken?: string
): string {
  if (pathname.startsWith('/api/assinante/') && userId) {
    return `user:${userId}`;
  }
  if (pathname.startsWith('/api/webhooks/') && webhookToken) {
    return `webhook:${webhookToken}`;
  }
  return `ip:${ip}`;
}

/**
 * Check if rate limit is exceeded and return appropriate response
 */
export async function checkRateLimit(
  identifier: string,
  limiter: any
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  try {
    const result = await limiter.limit(identifier);
    return result;
  } catch (error) {
    console.error('[RateLimit] Error checking rate limit:', error);
    // On error, allow the request to proceed (fail open)
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
    };
  }
}

/**
 * Format reset timestamp for Retry-After header
 */
export function formatRetryAfter(resetTimestamp: number): string {
  const now = Date.now();
  const secondsUntilReset = Math.ceil((resetTimestamp - now) / 1000);
  return Math.max(0, secondsUntilReset).toString();
}

/**
 * Log rate limit violations
 */
export function logRateLimitViolation(
  identifier: string,
  pathname: string,
  limit: number
): void {
  console.warn('[RateLimit] Rate limit exceeded', {
    identifier,
    pathname,
    limit,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Legacy rate limit presets for backward compatibility
 * These are maintained for existing webhook implementations
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
} as const;