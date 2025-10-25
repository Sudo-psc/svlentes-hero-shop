/**
 * SendPulse SMS Client
 * Notification system for order and delivery updates
 *
 * Features:
 * - Order status notifications
 * - Tracking updates
 * - Delivery confirmations
 * - Cancellation alerts
 * - Support ticket assignments
 *
 * LGPD Compliance:
 * - User consent required
 * - Opt-out mechanism available
 * - All sends logged for audit
 */

import { sendPulseAuth } from './sendpulse-auth'
import { logger, LogCategory } from './logger'

// ============================================================================
// TYPES
// ============================================================================

export type SMSNotificationType =
  | 'order_status'
  | 'tracking'
  | 'delivery'
  | 'cancellation'
  | 'support'

export interface SMSNotification {
  phone: string // Format: +5533999898026
  message: string
  metadata?: {
    orderId?: string
    ticketId?: string
    type: SMSNotificationType
  }
}

export interface SMSSendResult {
  success: boolean
  messageId?: string
  error?: string
  timestamp: Date
}

// ============================================================================
// SENDPULSE SMS CLIENT
// ============================================================================

export class SendPulseSMSClient {
  private readonly apiBaseUrl = 'https://api.sendpulse.com'
  private readonly senderName: string
  private readonly defaultCountryCode = '+55' // Brazil

  constructor() {
    // Get sender name from environment or use default
    this.senderName = process.env.SENDPULSE_SMS_SENDER_NAME || 'SVLentes'

    // Validate sender name length (max 11 characters for SMS)
    if (this.senderName.length > 11) {
      logger.warn(LogCategory.SENDPULSE, 'SMS sender name exceeds 11 characters', {
        senderName: this.senderName,
        length: this.senderName.length
      })
    }
  }

  /**
   * Format phone number for SendPulse API
   * Ensures +55 country code for Brazilian numbers
   */
  private formatPhoneNumber(phone: string): string {
    // Remove non-digit characters
    let cleaned = phone.replace(/\D/g, '')

    // Add +55 if not present
    if (!cleaned.startsWith('55') && cleaned.length === 11) {
      cleaned = '55' + cleaned
    }

    // Add + prefix
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned
    }

    return cleaned
  }

  /**
   * Send SMS via SendPulse API
   */
  async sendSMS(notification: SMSNotification): Promise<SMSSendResult> {
    const startTime = Date.now()

    try {
      // Format phone number
      const formattedPhone = this.formatPhoneNumber(notification.phone)

      // Get access token
      const accessToken = await sendPulseAuth.getAccessToken()

      // Prepare request
      const requestBody = {
        phones: [formattedPhone],
        message: notification.message,
        sender: this.senderName
      }

      // Send SMS
      const response = await fetch(`${this.apiBaseUrl}/sms/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const responseData = await response.json()

      if (!response.ok) {
        logger.error(LogCategory.SENDPULSE, 'SMS send failed', {
          status: response.status,
          phone: formattedPhone,
          type: notification.metadata?.type,
          error: responseData
        })

        return {
          success: false,
          error: responseData.error?.message || responseData.message || 'SMS send failed',
          timestamp: new Date()
        }
      }

      // Log success
      const duration = Date.now() - startTime
      logger.info(LogCategory.SENDPULSE, 'SMS sent successfully', {
        phone: formattedPhone,
        type: notification.metadata?.type,
        messageId: responseData.id,
        duration,
        orderId: notification.metadata?.orderId,
        ticketId: notification.metadata?.ticketId
      })

      return {
        success: true,
        messageId: responseData.id,
        timestamp: new Date()
      }

    } catch (error) {
      logger.error(LogCategory.SENDPULSE, 'SMS send exception', {
        phone: notification.phone,
        type: notification.metadata?.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    }
  }

  /**
   * Send order status notification
   * Called when order status changes (processing, shipped, delivered, etc.)
   */
  async sendOrderStatus(
    phone: string,
    orderNumber: string,
    status: string
  ): Promise<SMSSendResult> {
    // Map status to user-friendly Portuguese messages
    const statusMessages: Record<string, string> = {
      'PROCESSING': 'em processamento',
      'PENDING_PAYMENT': 'aguardando pagamento',
      'CONFIRMED': 'confirmado',
      'PREPARING': 'em preparação',
      'SHIPPED': 'enviado',
      'IN_TRANSIT': 'em trânsito',
      'OUT_FOR_DELIVERY': 'saiu para entrega',
      'DELIVERED': 'entregue',
      'CANCELLED': 'cancelado',
      'FAILED': 'com problema'
    }

    const statusText = statusMessages[status] || status.toLowerCase()
    const message = `SVLentes: Seu pedido ${orderNumber} está ${statusText}. Acompanhe em svlentes.shop/area-assinante`

    return this.sendSMS({
      phone,
      message,
      metadata: {
        orderId: orderNumber,
        type: 'order_status'
      }
    })
  }

  /**
   * Send tracking update notification
   * Called when tracking code is added to order
   */
  async sendTrackingUpdate(
    phone: string,
    trackingCode: string,
    orderNumber?: string
  ): Promise<SMSSendResult> {
    const message = `SVLentes: Seu pedido foi postado! Código de rastreio: ${trackingCode}. Acompanhe nos Correios.`

    return this.sendSMS({
      phone,
      message,
      metadata: {
        orderId: orderNumber,
        type: 'tracking'
      }
    })
  }

  /**
   * Send delivery confirmation notification
   * Called when order is marked as delivered
   */
  async sendDeliveryConfirmation(
    phone: string,
    orderNumber: string
  ): Promise<SMSSendResult> {
    const message = `SVLentes: Seu pedido ${orderNumber} foi entregue! Como foi sua experiência? Avalie em svlentes.shop`

    return this.sendSMS({
      phone,
      message,
      metadata: {
        orderId: orderNumber,
        type: 'delivery'
      }
    })
  }

  /**
   * Send cancellation notification
   * Called when order is cancelled
   */
  async sendCancellationNotification(
    phone: string,
    orderNumber: string,
    reason?: string
  ): Promise<SMSSendResult> {
    let message = `SVLentes: Seu pedido ${orderNumber} foi cancelado.`

    if (reason) {
      message += ` Motivo: ${reason}.`
    }

    message += ` Dúvidas? WhatsApp: (33) 98606-1427`

    return this.sendSMS({
      phone,
      message,
      metadata: {
        orderId: orderNumber,
        type: 'cancellation'
      }
    })
  }

  /**
   * Send support ticket assignment notification
   * Called when support ticket is assigned to agent
   */
  async sendTicketAssignment(
    phone: string,
    ticketNumber: string,
    agentName: string
  ): Promise<SMSSendResult> {
    const message = `SVLentes: Seu ticket ${ticketNumber} foi atribuído para ${agentName}. Aguarde retorno em breve.`

    return this.sendSMS({
      phone,
      message,
      metadata: {
        ticketId: ticketNumber,
        type: 'support'
      }
    })
  }

  /**
   * Check if SMS notifications are enabled
   */
  isEnabled(): boolean {
    return process.env.SENDPULSE_SMS_ENABLED === 'true'
  }

  /**
   * Get sender name
   */
  getSenderName(): string {
    return this.senderName
  }
}

// Singleton instance
export const sendPulseSMS = new SendPulseSMSClient()
