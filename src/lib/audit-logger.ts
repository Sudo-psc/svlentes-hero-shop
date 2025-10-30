/**
 * LGPD Audit Logger - Article 37 Compliance
 *
 * Logs all sensitive operations on personal data for LGPD compliance.
 * Records: WHO did WHAT, WHEN, and FROM WHERE.
 *
 * CRITICAL RULES:
 * 1. NEVER log passwords, tokens, or full credit card numbers
 * 2. Logs are APPEND-ONLY (never delete or modify)
 * 3. 7-year retention is MANDATORY by law
 * 4. IP and User-Agent are essential for traceability
 *
 * @author Dr. Philipe Saraiva Cruz
 * @module audit-logger
 */

import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

/**
 * Audit Action Types - All sensitive operations requiring logging
 */
export enum AuditAction {
  // Subscription Management
  UPDATE_SHIPPING_ADDRESS = 'UPDATE_SHIPPING_ADDRESS',
  CHANGE_SUBSCRIPTION_PLAN = 'CHANGE_SUBSCRIPTION_PLAN',
  UPDATE_DELIVERY_PREFERENCES = 'UPDATE_DELIVERY_PREFERENCES',
  PAUSE_SUBSCRIPTION = 'PAUSE_SUBSCRIPTION',
  RESUME_SUBSCRIPTION = 'RESUME_SUBSCRIPTION',
  CANCEL_SUBSCRIPTION = 'CANCEL_SUBSCRIPTION',

  // Payment Operations
  UPDATE_PAYMENT_METHOD = 'UPDATE_PAYMENT_METHOD',
  ACCESS_PAYMENT_HISTORY = 'ACCESS_PAYMENT_HISTORY',
  DOWNLOAD_INVOICE = 'DOWNLOAD_INVOICE',
  REQUEST_REFUND = 'REQUEST_REFUND',

  // Medical Data (MOST SENSITIVE)
  UPLOAD_PRESCRIPTION = 'UPLOAD_PRESCRIPTION',
  DELETE_PRESCRIPTION = 'DELETE_PRESCRIPTION',
  ACCESS_PRESCRIPTION = 'ACCESS_PRESCRIPTION',
  UPDATE_PRESCRIPTION = 'UPDATE_PRESCRIPTION',

  // Personal Data Access
  ACCESS_PERSONAL_DATA = 'ACCESS_PERSONAL_DATA',
  UPDATE_PERSONAL_INFO = 'UPDATE_PERSONAL_INFO',
  EXPORT_PERSONAL_DATA = 'EXPORT_PERSONAL_DATA',
  DELETE_PERSONAL_DATA = 'DELETE_PERSONAL_DATA',

  // Account Management
  UPDATE_EMAIL = 'UPDATE_EMAIL',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  UPDATE_PHONE = 'UPDATE_PHONE',

  // Admin Operations (if needed)
  ADMIN_ACCESS_USER_DATA = 'ADMIN_ACCESS_USER_DATA',
  ADMIN_UPDATE_SUBSCRIPTION = 'ADMIN_UPDATE_SUBSCRIPTION',
}

/**
 * Audit Log Parameters
 */
export interface AuditLogParams {
  userId: string
  action: AuditAction
  entityType: string
  entityId?: string
  oldValue?: any
  newValue?: any
  request?: NextRequest
}

/**
 * Sensitive field patterns to sanitize
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'creditCard',
  'cardNumber',
  'cvv',
  'securityCode',
  'pin',
]

/**
 * Sanitize sensitive data before logging
 * Removes passwords, tokens, and masks credit card numbers
 */
function sanitizeValue(value: any): any {
  if (value === null || value === undefined) {
    return value
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item))
  }

  // Handle objects
  if (typeof value === 'object') {
    const sanitized: any = {}

    for (const [key, val] of Object.entries(value)) {
      // Check if field name contains sensitive keywords
      const isSensitive = SENSITIVE_FIELDS.some((pattern) =>
        key.toLowerCase().includes(pattern.toLowerCase())
      )

      if (isSensitive) {
        sanitized[key] = '[REDACTED]'
      } else if (key === 'last4' && typeof val === 'string') {
        // Keep last 4 digits of credit cards
        sanitized[key] = val
      } else if (
        key.toLowerCase().includes('card') &&
        typeof val === 'string' &&
        val.length > 4
      ) {
        // Mask credit card numbers, keep last 4
        sanitized[key] = `****${val.slice(-4)}`
      } else {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeValue(val)
      }
    }

    return sanitized
  }

  return value
}

/**
 * Extract client IP address from request headers
 * Handles Nginx proxy (x-forwarded-for, x-real-ip)
 */
function extractIpAddress(request?: NextRequest): string | null {
  if (!request) return null

  // Try x-forwarded-for first (Nginx proxy)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2)
    // Use the first one (original client IP)
    return forwardedFor.split(',')[0].trim()
  }

  // Try x-real-ip (alternative Nginx header)
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  // Fallback to remote address (direct connection)
  return request.ip || null
}

/**
 * Extract user agent from request headers
 */
function extractUserAgent(request?: NextRequest): string | null {
  if (!request) return null
  return request.headers.get('user-agent') || null
}

/**
 * Log an audit entry for LGPD compliance
 *
 * @param params - Audit log parameters
 * @throws Error if logging fails (should be caught and logged separately)
 *
 * @example
 * ```typescript
 * await logAudit({
 *   userId: user.id,
 *   action: AuditAction.UPDATE_SHIPPING_ADDRESS,
 *   entityType: 'Subscription',
 *   entityId: subscriptionId,
 *   oldValue: oldSubscription.shippingAddress,
 *   newValue: updatedSubscription.shippingAddress,
 *   request,
 * })
 * ```
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  const {
    userId,
    action,
    entityType,
    entityId,
    oldValue,
    newValue,
    request,
  } = params

  try {
    // Sanitize values before logging
    const sanitizedOldValue = oldValue ? sanitizeValue(oldValue) : null
    const sanitizedNewValue = newValue ? sanitizeValue(newValue) : null

    // Extract request metadata
    const ipAddress = extractIpAddress(request)
    const userAgent = extractUserAgent(request)

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId: entityId || null,
        oldValue: sanitizedOldValue,
        newValue: sanitizedNewValue,
        ipAddress,
        userAgent,
      },
    })

    // Log successful audit (for debugging, remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] ${action} by user ${userId} on ${entityType}${entityId ? ` (${entityId})` : ''}`)
    }
  } catch (error) {
    // CRITICAL: Audit logging failures should be logged but NOT prevent operations
    console.error('[AUDIT ERROR] Failed to log audit entry:', error)
    console.error('[AUDIT ERROR] Action:', action, 'User:', userId, 'Entity:', entityType)

    // In production, send alert to monitoring system
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send alert to Sentry/monitoring service
      // This is a compliance risk and needs immediate attention
    }

    // DO NOT throw - audit failures should not break user operations
    // But they should be monitored closely
  }
}

/**
 * Batch log multiple audit entries
 * Useful for operations affecting multiple resources
 */
export async function logAuditBatch(entries: AuditLogParams[]): Promise<void> {
  for (const entry of entries) {
    await logAudit(entry)
  }
}

/**
 * Query audit logs for a specific user
 * Used by admin dashboard and user data export
 */
export async function getUserAuditLogs(
  userId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    action?: AuditAction
    entityType?: string
    limit?: number
    offset?: number
  }
) {
  const where: any = { userId }

  if (options?.startDate || options?.endDate) {
    where.timestamp = {}
    if (options.startDate) where.timestamp.gte = options.startDate
    if (options.endDate) where.timestamp.lte = options.endDate
  }

  if (options?.action) {
    where.action = options.action
  }

  if (options?.entityType) {
    where.entityType = options.entityType
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: options?.limit || 100,
    skip: options?.offset || 0,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Get audit log statistics for compliance reporting
 */
export async function getAuditStats(
  startDate: Date,
  endDate: Date
): Promise<{
  totalLogs: number
  byAction: Record<string, number>
  byEntityType: Record<string, number>
  topUsers: Array<{ userId: string; userName: string; count: number }>
}> {
  const logs = await prisma.auditLog.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      action: true,
      entityType: true,
      userId: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  })

  // Aggregate statistics
  const byAction: Record<string, number> = {}
  const byEntityType: Record<string, number> = {}
  const userCounts: Record<string, { name: string; count: number }> = {}

  for (const log of logs) {
    // Count by action
    byAction[log.action] = (byAction[log.action] || 0) + 1

    // Count by entity type
    byEntityType[log.entityType] = (byEntityType[log.entityType] || 0) + 1

    // Count by user
    if (!userCounts[log.userId]) {
      userCounts[log.userId] = {
        name: log.user.name || 'Unknown',
        count: 0,
      }
    }
    userCounts[log.userId].count++
  }

  // Top users by activity
  const topUsers = Object.entries(userCounts)
    .map(([userId, data]) => ({
      userId,
      userName: data.name,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    totalLogs: logs.length,
    byAction,
    byEntityType,
    topUsers,
  }
}
