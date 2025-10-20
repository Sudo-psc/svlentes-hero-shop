/**
 * Admin Notification Service
 *
 * Handles sending notifications to users when admins perform actions
 * on their subscriptions, orders, or support tickets.
 */
import { prisma } from '@/lib/prisma'
import { sendEmailNotification } from '@/lib/notifications'
import { sendPushNotification } from '@/lib/firebase-push'
export interface AdminNotificationData {
  userId: string
  type: 'SUBSCRIPTION' | 'ORDER' | 'SUPPORT_TICKET'
  action: 'CREATED' | 'UPDATED' | 'ASSIGNED' | 'RESOLVED' | 'CANCELLED' | 'PAUSED' | 'RESUMED'
  data: {
    id: string
    title?: string
    message?: string
    details?: Record<string, any>
    adminName?: string
    timestamp?: Date
  }
}
/**
 * Send notification when admin updates subscription status
 */
export async function sendSubscriptionStatusNotification(
  userId: string,
  subscriptionId: string,
  oldStatus: string,
  newStatus: string,
  adminName: string
): Promise<void> {
  try {
    const statusMessages: Record<string, string> = {
      'ACTIVE': 'Sua assinatura foi reativada com sucesso!',
      'OVERDUE': 'Sua assinatura está em atraso. Por favor, regularize o pagamento.',
      'SUSPENDED': `Sua assinatura foi suspensa.`,
      'CANCELLED': 'Sua assinatura foi cancelada.',
      'PAUSED': 'Sua assinatura foi pausada temporariamente.',
      'RESUMED': 'Sua assinatura foi reativada.'
    }
    const message = statusMessages[newStatus] || `O status da sua assinatura foi atualizado para ${newStatus}.`
    // Send email notification
    await sendEmailNotification({
      userId,
      subject: `Atualização da Assinatura - SV Lentes`,
      message,
      type: 'STATUS_CHANGE',
      metadata: {
        subscriptionId,
        oldStatus,
        newStatus,
        adminName,
        actionDate: new Date().toISOString()
      }
    })
    // Send push notification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationTokens: true }
    })
    const tokens = (user?.notificationTokens as string[]) || []
    if (tokens.length > 0) {
      for (const token of tokens) {
        await sendPushNotification({
          token,
          title: 'Assinatura Atualizada',
          body: message,
          data: {
            type: 'transactional',
            action: 'subscription_update',
            subscriptionId,
            newStatus
          },
          userId,
          clickAction: '/area-assinante/dashboard',
          priority: newStatus === 'CANCELLED' ? 'high' : 'normal'
        })
      }
    }
  } catch (error) {
    console.error('[Admin Notifications] Failed to send subscription notification:', error)
  }
}
/**
 * Send notification when admin assigns support ticket
 */
export async function sendSupportTicketAssignmentNotification(
  userId: string,
  ticketId: string,
  ticketNumber: string,
  agentName: string
): Promise<void> {
  try {
    // Send email notification
    await sendEmailNotification({
      userId,
      subject: `Ticket de Suporte ${ticketNumber} Foi Atribuído`,
      message: `Seu ticket de suporte foi atribuído a ${agentName}. Nossa equipe entrará em contato em breve.`,
      type: 'STATUS_CHANGE',
      metadata: {
        ticketId,
        ticketNumber,
        agentName,
        assignedAt: new Date().toISOString()
      }
    })
    // Send push notification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationTokens: true }
    })
    const tokens = (user?.notificationTokens as string[]) || []
    if (tokens.length > 0) {
      for (const token of tokens) {
        await sendPushNotification({
          token,
          title: 'Ticket de Suporte Atribuído',
          body: `Seu ticket ${ticketNumber} foi atribuído a ${agentName}`,
          data: {
            type: 'transactional',
            action: 'support_ticket_assigned',
            ticketId,
            ticketNumber
          },
          userId,
          clickAction: '/area-assinante/dashboard',
          priority: 'normal'
        })
      }
    }
  } catch (error) {
    console.error('[Admin Notifications] Failed to send support ticket notification:', error)
  }
}
/**
 * Send notification when admin resolves support ticket
 */
export async function sendSupportTicketResolutionNotification(
  userId: string,
  ticketId: string,
  ticketNumber: string,
  resolutionSummary?: string
): Promise<void> {
  try {
    // Send email notification
    await sendEmailNotification({
      userId,
      subject: `Ticket de Suporte ${ticketNumber} Foi Resolvido`,
      message: `Seu ticket de suporte foi resolvido com sucesso${resolutionSummary ? ': ' + resolutionSummary : '.'}`,
      type: 'STATUS_CHANGE',
      metadata: {
        ticketId,
        ticketNumber,
        resolutionSummary,
        resolvedAt: new Date().toISOString()
      }
    })
    // Send push notification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationTokens: true }
    })
    const tokens = (user?.notificationTokens as string[]) || []
    if (tokens.length > 0) {
      for (const token of tokens) {
        await sendPushNotification({
          token,
          title: 'Ticket de Suporte Resolvido',
          body: `Seu ticket ${ticketNumber} foi resolvido com sucesso.`,
          data: {
            type: 'transactional',
            action: 'support_ticket_resolved',
            ticketId,
            ticketNumber
          },
          userId,
          clickAction: '/area-assinante/dashboard',
          priority: 'normal'
        })
      }
    }
  } catch (error) {
    console.error('[Admin Notifications] Failed to send support ticket resolution notification:', error)
  }
}
/**
 * Send notification when admin creates or updates order
 */
export async function sendOrderNotification(
  userId: string,
  orderId: string,
  orderNumber: string,
  action: 'CREATED' | 'UPDATED' | 'SHIPPED' | 'DELIVERED',
  adminName: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    const actionMessages: Record<string, string> = {
      'CREATED': 'Seu pedido foi criado com sucesso!',
      'UPDATED': 'Seu pedido foi atualizado.',
      'SHIPPED': 'Seu pedido foi enviado! Acompanhe a entrega.',
      'DELIVERED': 'Seu pedido foi entregue com sucesso!'
    }
    const message = actionMessages[action] || `Seu pedido ${orderNumber} foi atualizado.`
    // Send email notification
    await sendEmailNotification({
      userId,
      subject: `Pedido ${orderNumber} - ${action}`,
      message,
      type: 'STATUS_CHANGE',
      metadata: {
        orderId,
        orderNumber,
        action,
        adminName,
        details,
        actionDate: new Date().toISOString()
      }
    })
    // Send push notification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationTokens: true }
    })
    const tokens = (user?.notificationTokens as string[]) || []
    if (tokens.length > 0) {
      for (const token of tokens) {
        await sendPushNotification({
          token,
          title: `Pedido ${orderNumber} - ${action}`,
          body: message,
          data: {
            type: 'transactional',
            action: 'order_update',
            orderId,
            orderNumber,
            orderAction: action
          },
          userId,
          clickAction: '/area-assinante/dashboard',
          priority: action === 'DELIVERED' ? 'high' : 'normal'
        })
      }
    }
  } catch (error) {
    console.error('[Admin Notifications] Failed to send order notification:', error)
  }
}
/**
 * Send bulk notification to multiple users (for system-wide updates)
 */
export async function sendBulkNotification(
  userIds: string[],
  subject: string,
  message: string,
  type: 'SYSTEM' | 'MARKETING' | 'URGENT',
  clickAction?: string
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0
  for (const userId of userIds) {
    try {
      await sendEmailNotification({
        userId,
        subject,
        message,
        type: 'STATUS_CHANGE' as any,
        metadata: {
          bulkNotification: true,
          type,
          sentAt: new Date().toISOString()
        }
      })
      success++
    } catch (error) {
      console.error(`[Admin Notifications] Failed to send bulk notification to ${userId}:`, error)
      failed++
    }
  }
  return { success, failed }
}