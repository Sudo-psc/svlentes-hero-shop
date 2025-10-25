/**
 * Ticket History Tracking
 * LGPD-compliant audit trail for support ticket operations
 *
 * Features:
 * - Field-level change tracking with old/new values
 * - Action categorization (assigned, updated, closed, etc.)
 * - User attribution and IP/User-Agent logging
 * - JSON metadata for flexible context storage
 */

import { prisma } from './prisma'

export type TicketAction =
  | 'created'
  | 'assigned'
  | 'unassigned'
  | 'updated'
  | 'closed'
  | 'reopened'
  | 'escalated'
  | 'priority_changed'
  | 'status_changed'
  | 'category_changed'
  | 'deleted'

export interface TicketHistoryEntry {
  ticketId: string
  userId?: string
  action: TicketAction
  field?: string
  oldValue?: any
  newValue?: any
  description?: string
  notes?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Create a ticket history entry
 * Logs all changes to the ticket_history table for audit trail
 */
export async function createTicketHistory(entry: TicketHistoryEntry): Promise<void> {
  try {
    await prisma.ticketHistory.create({
      data: {
        ticketId: entry.ticketId,
        userId: entry.userId,
        action: entry.action,
        field: entry.field,
        oldValue: entry.oldValue !== undefined ? entry.oldValue : undefined,
        newValue: entry.newValue !== undefined ? entry.newValue : undefined,
        description: entry.description,
        notes: entry.notes,
        metadata: entry.metadata ? entry.metadata : undefined,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    })
  } catch (error) {
    console.error('[Ticket History] Failed to create history entry:', {
      ticketId: entry.ticketId,
      action: entry.action,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    // Don't throw - history logging should not block operations
  }
}

/**
 * Create multiple ticket history entries in a transaction
 * Used when multiple fields are updated simultaneously
 */
export async function createTicketHistoryBatch(
  entries: TicketHistoryEntry[]
): Promise<void> {
  try {
    await prisma.$transaction(
      entries.map((entry) =>
        prisma.ticketHistory.create({
          data: {
            ticketId: entry.ticketId,
            userId: entry.userId,
            action: entry.action,
            field: entry.field,
            oldValue: entry.oldValue !== undefined ? entry.oldValue : undefined,
            newValue: entry.newValue !== undefined ? entry.newValue : undefined,
            description: entry.description,
            notes: entry.notes,
            metadata: entry.metadata ? entry.metadata : undefined,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
          },
        })
      )
    )
  } catch (error) {
    console.error('[Ticket History] Failed to create history batch:', {
      count: entries.length,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    // Don't throw - history logging should not block operations
  }
}

/**
 * Track ticket assignment
 */
export async function trackTicketAssignment(params: {
  ticketId: string
  ticketNumber: string
  userId: string
  agentId: string
  agentName: string
  notes?: string
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  await createTicketHistory({
    ticketId: params.ticketId,
    userId: params.userId,
    action: 'assigned',
    field: 'assignedAgentId',
    oldValue: null,
    newValue: params.agentId,
    description: `Ticket ${params.ticketNumber} atribuído para ${params.agentName}`,
    notes: params.notes,
    metadata: {
      agentId: params.agentId,
      agentName: params.agentName,
      ticketNumber: params.ticketNumber,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

/**
 * Track ticket unassignment
 */
export async function trackTicketUnassignment(params: {
  ticketId: string
  ticketNumber: string
  userId: string
  previousAgentId: string
  previousAgentName: string
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  await createTicketHistory({
    ticketId: params.ticketId,
    userId: params.userId,
    action: 'unassigned',
    field: 'assignedAgentId',
    oldValue: params.previousAgentId,
    newValue: null,
    description: `Ticket ${params.ticketNumber} desatribuído de ${params.previousAgentName}`,
    metadata: {
      previousAgentId: params.previousAgentId,
      previousAgentName: params.previousAgentName,
      ticketNumber: params.ticketNumber,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

/**
 * Track ticket field updates
 * Automatically detects changed fields and creates history entries
 */
export async function trackTicketUpdate(params: {
  ticketId: string
  ticketNumber: string
  userId: string
  oldValues: Record<string, any>
  newValues: Record<string, any>
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  const entries: TicketHistoryEntry[] = []

  // Compare old and new values
  for (const field of Object.keys(params.newValues)) {
    const oldValue = params.oldValues[field]
    const newValue = params.newValues[field]

    // Skip if values are the same
    if (oldValue === newValue) continue

    // Determine action based on field
    let action: TicketAction = 'updated'
    if (field === 'status') action = 'status_changed'
    else if (field === 'priority') action = 'priority_changed'
    else if (field === 'category') action = 'category_changed'

    entries.push({
      ticketId: params.ticketId,
      userId: params.userId,
      action,
      field,
      oldValue,
      newValue,
      description: `Campo '${field}' alterado de '${oldValue}' para '${newValue}'`,
      metadata: {
        ticketNumber: params.ticketNumber,
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    })
  }

  if (entries.length > 0) {
    await createTicketHistoryBatch(entries)
  }
}

/**
 * Track ticket status change
 */
export async function trackTicketStatusChange(params: {
  ticketId: string
  ticketNumber: string
  userId: string
  oldStatus: string
  newStatus: string
  notes?: string
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  let action: TicketAction = 'status_changed'
  if (params.newStatus === 'CLOSED') action = 'closed'
  else if (params.newStatus === 'OPEN' && params.oldStatus === 'CLOSED') action = 'reopened'

  await createTicketHistory({
    ticketId: params.ticketId,
    userId: params.userId,
    action,
    field: 'status',
    oldValue: params.oldStatus,
    newValue: params.newStatus,
    description: `Status alterado de '${params.oldStatus}' para '${params.newStatus}'`,
    notes: params.notes,
    metadata: {
      ticketNumber: params.ticketNumber,
      statusTransition: `${params.oldStatus} → ${params.newStatus}`,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

/**
 * Track ticket deletion
 */
export async function trackTicketDeletion(params: {
  ticketId: string
  ticketNumber: string
  userId: string
  reason?: string
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  await createTicketHistory({
    ticketId: params.ticketId,
    userId: params.userId,
    action: 'deleted',
    description: `Ticket ${params.ticketNumber} deletado`,
    notes: params.reason,
    metadata: {
      ticketNumber: params.ticketNumber,
      deletionReason: params.reason,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

/**
 * Extract IP address from NextRequest
 */
export function getIpAddress(request: Request): string | undefined {
  // Try to get real IP from various headers (reverse proxy aware)
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare

  if (xForwardedFor) {
    // x-forwarded-for can be a comma-separated list
    return xForwardedFor.split(',')[0].trim()
  }

  if (xRealIp) {
    return xRealIp
  }

  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return undefined
}

/**
 * Extract User-Agent from NextRequest
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined
}
