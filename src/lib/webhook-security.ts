/**
 * Webhook Security Utilities
 * Enhanced security for SendPulse webhook handling
 */
import crypto from 'crypto'
import { logger, LogCategory } from '@/lib/logger'
export interface WebhookSecurityConfig {
  allowedIPs?: string[]
  maxPayloadSize: number
  requestTimeout: number
  requireUserAgent: boolean
  suspiciousPatterns: RegExp[]
}
export class WebhookSecurity {
  private static readonly DEFAULT_CONFIG: WebhookSecurityConfig = {
    maxPayloadSize: 500 * 1024, // 500KB
    requestTimeout: 30000, // 30 seconds
    requireUserAgent: true,
    suspiciousPatterns: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS attempts
      /javascript:/gi, // JavaScript URLs
      /on\w+\s*=/gi, // Event handlers
      /union\s+select/gi, // SQL injection patterns
      /drop\s+table/gi, // SQL injection patterns
    ]
  }
  /**
   * Validate webhook request security
   */
  static validateRequest(
    request: Request,
    rawBody: string,
    config: Partial<WebhookSecurityConfig> = {}
  ): { valid: boolean; reason?: string; riskScore: number } {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }
    let riskScore = 0
    // 1. Check payload size
    if (rawBody.length > finalConfig.maxPayloadSize) {
      return {
        valid: false,
        reason: `Payload too large: ${rawBody.length} bytes (max: ${finalConfig.maxPayloadSize})`,
        riskScore: 100
      }
    }
    // 2. Check User-Agent
    if (finalConfig.requireUserAgent) {
      const userAgent = request.headers.get('user-agent') || ''
      if (!userAgent || userAgent.length < 10) {
        riskScore += 20
        logger.warn(LogCategory.SECURITY, 'Suspicious User-Agent', {
          userAgent,
          length: userAgent.length
        })
      }
    }
    // 3. Check for suspicious patterns in payload
    for (const pattern of finalConfig.suspiciousPatterns) {
      if (pattern.test(rawBody)) {
        return {
          valid: false,
          reason: `Suspicious pattern detected in payload`,
          riskScore: 90
        }
      }
    }
    // 4. Check Content-Type
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      riskScore += 15
    }
    // 5. Check for JSON structure attempts
    try {
      JSON.parse(rawBody)
    } catch {
      return {
        valid: false,
        reason: 'Invalid JSON payload',
        riskScore: 80
      }
    }
    // 6. Rate limiting by IP (additional check)
    const clientIP = this.getClientIP(request)
    if (this.isIPBlocked(clientIP)) {
      return {
        valid: false,
        reason: `IP address blocked: ${clientIP}`,
        riskScore: 100
      }
    }
    return {
      valid: true,
      riskScore
    }
  }
  /**
   * Generate webhook signature verification (for future use)
   */
  static generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')
  }
  /**
   * Verify webhook signature (for future implementation)
   */
  static verifySignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = this.generateSignature(payload, secret)
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  }
  /**
   * Extract client IP from request
   */
  private static getClientIP(request: Request): string {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    )
  }
  /**
   * Check if IP is blocked
   */
  private static isIPBlocked(ip: string): boolean {
    // This could be enhanced with a persistent blocklist
    const blockedIPs = process.env.BLOCKED_IPS?.split(',') || []
    return blockedIPs.includes(ip)
  }
  /**
   * Analyze request patterns for anomalies
   */
  static analyzeRequestPattern(
    requestId: string,
    clientIP: string,
    userAgent: string,
    timestamp: number = Date.now()
  ): { suspicious: boolean; reasons: string[] } {
    const reasons: string[] = []
    let suspicious = false
    // Store request patterns in memory (could be enhanced with Redis)
    const requestKey = `${clientIP}:${Math.floor(timestamp / 60000)}` // per minute
    // This is a simplified version - in production, you'd want persistent storage
    const recentRequests = this.getRecentRequests(clientIP)
    if (recentRequests > 100) { // More than 100 requests per minute
      reasons.push('High frequency requests from IP')
      suspicious = true
    }
    // Check for headless browsers/bots
    if (userAgent.includes('bot') ||
        userAgent.includes('crawler') ||
        userAgent.includes('spider')) {
      reasons.push('Bot-like User-Agent detected')
      suspicious = true
    }
    return { suspicious, reasons }
  }
  /**
   * Get recent request count for IP (simplified implementation)
   */
  private static getRecentRequests(ip: string): number {
    // In production, this would use a proper rate limiting store
    return Math.floor(Math.random() * 10) // Placeholder
  }
  /**
   * Log security events
   */
  static logSecurityEvent(
    event: 'BLOCKED_REQUEST' | 'SUSPICIOUS_PATTERN' | 'RATE_LIMIT_EXCEEDED',
    details: any
  ): void {
    logger.warn(LogCategory.SECURITY, `Webhook security event: ${event}`, {
      timestamp: new Date().toISOString(),
      ...details
    })
  }
}