import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import {
  NotificationChannel,
  NotificationEventType,
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES
} from '@/types/notification-preferences'
import * as fs from 'fs/promises'
import * as path from 'path'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface NotificationData {
  userId: string
  eventType: NotificationEventType
  subject: string
  message: string
  metadata?: any
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

interface NotificationResult {
  success: boolean
  channel: NotificationChannel
  notificationId?: string
  error?: string
  fallbackTriggered?: boolean
  retryCount?: number
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2
}

// Local backup directory for critical notifications
const BACKUP_DIR = '/tmp/svlentes-notifications-backup'

/**
 * Advanced notification system with fallback and redundancy
 */
export class NotificationService {
  /**
   * Send notification with intelligent routing and fallback
   */
  static async send(data: NotificationData): Promise<NotificationResult[]> {
    const results: NotificationResult[] = []

    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(data.userId)

      // Check if event is allowed
      if (!this.isEventAllowed(preferences, data.eventType)) {
        console.log(`Event ${data.eventType} is disabled for user ${data.userId}`)
        return results
      }

      // Check quiet hours
      if (this.isQuietHours(preferences)) {
        console.log(`Quiet hours active for user ${data.userId}, scheduling for later`)
        await this.scheduleForLater(data, preferences)
        return results
      }

      // Check frequency limits
      if (!(await this.checkFrequencyLimits(data.userId, preferences))) {
        console.log(`Frequency limit reached for user ${data.userId}`)
        return results
      }

      // Determine channels to use
      const channels = this.getEnabledChannels(preferences, data.eventType, data.priority)

      // Backup notification data locally (redundancy)
      await this.backupNotificationData(data)

      // Send to all enabled channels
      for (const channel of channels) {
        const result = await this.sendToChannel(channel, data, preferences)
        results.push(result)

        // If primary channel fails and fallback is enabled, trigger fallback
        if (!result.success && preferences.fallback.enabled && channel === preferences.fallback.primaryChannel) {
          console.log(`Primary channel ${channel} failed, triggering fallback`)

          // Schedule fallback notification
          await this.scheduleFallback(data, preferences)
        }
      }

      return results
    } catch (error) {
      console.error('Error in notification service:', error)

      // Emergency fallback - save to file system
      await this.emergencyBackup(data, error)

      return [{
        success: false,
        channel: 'email',
        error: error instanceof Error ? error.message : 'Unknown error'
      }]
    }
  }

  /**
   * Get user notification preferences with fallback to defaults
   */
  private static async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true }
      })

      if (!user?.preferences) {
        return DEFAULT_NOTIFICATION_PREFERENCES
      }

      const userPrefs = user.preferences as any
      const notificationPrefs = userPrefs.notifications as NotificationPreferences

      // Merge with defaults to ensure all fields exist
      return {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...notificationPrefs,
        channels: {
          email: { ...DEFAULT_NOTIFICATION_PREFERENCES.channels.email, ...notificationPrefs?.channels?.email },
          whatsapp: { ...DEFAULT_NOTIFICATION_PREFERENCES.channels.whatsapp, ...notificationPrefs?.channels?.whatsapp },
          sms: { ...DEFAULT_NOTIFICATION_PREFERENCES.channels.sms, ...notificationPrefs?.channels?.sms },
          push: { ...DEFAULT_NOTIFICATION_PREFERENCES.channels.push, ...notificationPrefs?.channels?.push }
        }
      }
    } catch (error) {
      console.error('Error fetching user preferences, using defaults:', error)
      return DEFAULT_NOTIFICATION_PREFERENCES
    }
  }

  /**
   * Check if event is allowed in user preferences
   */
  private static isEventAllowed(preferences: NotificationPreferences, eventType: NotificationEventType): boolean {
    // Critical events always allowed
    const criticalEvents: NotificationEventType[] = ['payment_overdue', 'subscription_cancelled']
    if (criticalEvents.includes(eventType)) {
      return true
    }

    // Check if at least one channel has this event enabled
    for (const channel of Object.values(preferences.channels)) {
      if (channel.enabled && channel.events[eventType]) {
        return true
      }
    }

    return false
  }

  /**
   * Check if current time is within quiet hours
   */
  private static isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) {
      return false
    }

    try {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTime = currentHour * 60 + currentMinute

      const [startHour, startMinute] = preferences.quietHours.start.split(':').map(Number)
      const [endHour, endMinute] = preferences.quietHours.end.split(':').map(Number)

      const startTime = startHour * 60 + startMinute
      const endTime = endHour * 60 + endMinute

      // Handle overnight quiet hours (e.g., 22:00 to 08:00)
      if (startTime > endTime) {
        return currentTime >= startTime || currentTime <= endTime
      } else {
        return currentTime >= startTime && currentTime <= endTime
      }
    } catch (error) {
      console.error('Error checking quiet hours:', error)
      return false
    }
  }

  /**
   * Check frequency limits
   */
  private static async checkFrequencyLimits(userId: string, preferences: NotificationPreferences): Promise<boolean> {
    try {
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Count notifications sent in last 24 hours
      const dailyCount = await prisma.notification.count({
        where: {
          userId,
          sentAt: { gte: oneDayAgo },
          status: { in: ['SENT', 'DELIVERED'] }
        }
      })

      if (dailyCount >= preferences.frequency.maxPerDay) {
        return false
      }

      // Count notifications sent in last 7 days
      const weeklyCount = await prisma.notification.count({
        where: {
          userId,
          sentAt: { gte: oneWeekAgo },
          status: { in: ['SENT', 'DELIVERED'] }
        }
      })

      if (weeklyCount >= preferences.frequency.maxPerWeek) {
        return false
      }

      return true
    } catch (error) {
      console.error('Error checking frequency limits:', error)
      return true // Fail open to avoid blocking critical notifications
    }
  }

  /**
   * Get enabled channels for event type
   */
  private static getEnabledChannels(
    preferences: NotificationPreferences,
    eventType: NotificationEventType,
    priority?: string
  ): NotificationChannel[] {
    const channels: NotificationChannel[] = []

    // For critical priority, use all available channels
    if (priority === 'critical') {
      return ['email', 'whatsapp', 'sms', 'push']
    }

    for (const [channelName, channelPrefs] of Object.entries(preferences.channels)) {
      if (channelPrefs.enabled && channelPrefs.events[eventType]) {
        channels.push(channelName as NotificationChannel)
      }
    }

    return channels
  }

  /**
   * Send to specific channel with retry logic
   */
  private static async sendToChannel(
    channel: NotificationChannel,
    data: NotificationData,
    preferences: NotificationPreferences,
    retryCount = 0
  ): Promise<NotificationResult> {
    try {
      let result: NotificationResult

      switch (channel) {
        case 'email':
          result = await this.sendEmail(data, preferences)
          break
        case 'whatsapp':
          result = await this.sendWhatsApp(data, preferences)
          break
        case 'sms':
          result = await this.sendSMS(data, preferences)
          break
        case 'push':
          result = await this.sendPush(data, preferences)
          break
        default:
          result = { success: false, channel, error: 'Unknown channel' }
      }

      // Retry on failure with exponential backoff
      if (!result.success && retryCount < RETRY_CONFIG.maxRetries) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount),
          RETRY_CONFIG.maxDelayMs
        )

        console.log(`Retrying ${channel} notification after ${delay}ms (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`)

        await this.sleep(delay)
        return this.sendToChannel(channel, data, preferences, retryCount + 1)
      }

      result.retryCount = retryCount
      return result
    } catch (error) {
      console.error(`Error sending to ${channel}:`, error)
      return {
        success: false,
        channel,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount
      }
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmail(data: NotificationData, preferences: NotificationPreferences): Promise<NotificationResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true, name: true }
      })

      if (!user?.email) {
        throw new Error('User email not found')
      }

      if (!resend) {
        throw new Error('Resend not configured')
      }

      const emailResponse = await resend.emails.send({
        from: 'SVLentes <noreply@svlentes.shop>',
        to: user.email,
        subject: data.subject,
        html: this.generateEmailTemplate({
          userName: user.name || 'Cliente',
          subject: data.subject,
          message: data.message,
          metadata: data.metadata
        })
      })

      // Log to database
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          channel: 'EMAIL',
          type: this.mapEventTypeToNotificationType(data.eventType),
          subject: data.subject,
          content: data.message,
          metadata: data.metadata,
          scheduledAt: new Date(),
          sentAt: new Date(),
          status: 'SENT'
        }
      })

      return {
        success: true,
        channel: 'email',
        notificationId: notification.id
      }
    } catch (error) {
      console.error('Email send error:', error)

      // Log failed attempt
      await this.logFailedNotification(data.userId, 'email', data, error)

      return {
        success: false,
        channel: 'email',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send WhatsApp notification
   */
  private static async sendWhatsApp(data: NotificationData, preferences: NotificationPreferences): Promise<NotificationResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { whatsapp: true, phone: true, name: true }
      })

      const phoneNumber = user?.whatsapp || user?.phone
      if (!phoneNumber) {
        throw new Error('User phone number not found')
      }

      const { sendPulseClient } = await import('@/lib/sendpulse-client')
      const message = `*${data.subject}*\n\n${data.message}\n\n_Mensagem automática da SVLentes_`

      await sendPulseClient.sendMessage(phoneNumber, message)

      // Log to database
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          channel: 'WHATSAPP',
          type: this.mapEventTypeToNotificationType(data.eventType),
          subject: data.subject,
          content: data.message,
          metadata: { ...data.metadata, phone: phoneNumber },
          scheduledAt: new Date(),
          sentAt: new Date(),
          status: 'SENT'
        }
      })

      return {
        success: true,
        channel: 'whatsapp',
        notificationId: notification.id
      }
    } catch (error) {
      console.error('WhatsApp send error:', error)

      await this.logFailedNotification(data.userId, 'whatsapp', data, error)

      return {
        success: false,
        channel: 'whatsapp',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send SMS notification (placeholder)
   */
  private static async sendSMS(data: NotificationData, preferences: NotificationPreferences): Promise<NotificationResult> {
    // SMS integration would go here (e.g., Twilio, AWS SNS)
    console.log('SMS not implemented yet')
    return { success: false, channel: 'sms', error: 'Not implemented' }
  }

  /**
   * Send push notification (placeholder)
   */
  private static async sendPush(data: NotificationData, preferences: NotificationPreferences): Promise<NotificationResult> {
    // Push notification integration would go here (e.g., Firebase Cloud Messaging)
    console.log('Push not implemented yet')
    return { success: false, channel: 'push', error: 'Not implemented' }
  }

  /**
   * Schedule notification for later (after quiet hours)
   */
  private static async scheduleForLater(data: NotificationData, preferences: NotificationPreferences): Promise<void> {
    try {
      // Calculate when quiet hours end
      const [endHour, endMinute] = preferences.quietHours.end.split(':').map(Number)
      const scheduledTime = new Date()
      scheduledTime.setHours(endHour, endMinute, 0, 0)

      // If scheduled time is in the past, add a day
      if (scheduledTime <= new Date()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1)
      }

      await prisma.notification.create({
        data: {
          userId: data.userId,
          channel: 'EMAIL', // Default to email for scheduled
          type: this.mapEventTypeToNotificationType(data.eventType),
          subject: data.subject,
          content: data.message,
          metadata: data.metadata,
          scheduledAt: scheduledTime,
          status: 'SCHEDULED'
        }
      })

      console.log(`Notification scheduled for ${scheduledTime.toISOString()}`)
    } catch (error) {
      console.error('Error scheduling notification:', error)
    }
  }

  /**
   * Schedule fallback notification
   */
  private static async scheduleFallback(data: NotificationData, preferences: NotificationPreferences): Promise<void> {
    try {
      const scheduledTime = new Date()
      scheduledTime.setMinutes(scheduledTime.getMinutes() + preferences.fallback.fallbackDelayMinutes)

      await prisma.notification.create({
        data: {
          userId: data.userId,
          channel: preferences.fallback.fallbackChannel.toUpperCase() as any,
          type: this.mapEventTypeToNotificationType(data.eventType),
          subject: `[FALLBACK] ${data.subject}`,
          content: data.message,
          metadata: { ...data.metadata, isFallback: true },
          scheduledAt: scheduledTime,
          status: 'SCHEDULED'
        }
      })

      console.log(`Fallback notification scheduled for ${scheduledTime.toISOString()}`)
    } catch (error) {
      console.error('Error scheduling fallback:', error)
    }
  }

  /**
   * Backup notification data to file system
   */
  private static async backupNotificationData(data: NotificationData): Promise<void> {
    try {
      // Ensure backup directory exists
      await fs.mkdir(BACKUP_DIR, { recursive: true })

      const filename = `${Date.now()}_${data.userId}_${data.eventType}.json`
      const filepath = path.join(BACKUP_DIR, filename)

      await fs.writeFile(filepath, JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      }, null, 2))

      console.log(`Notification backed up to ${filepath}`)
    } catch (error) {
      console.error('Error backing up notification:', error)
    }
  }

  /**
   * Emergency backup when all else fails
   */
  private static async emergencyBackup(data: NotificationData, error: any): Promise<void> {
    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true })

      const filename = `EMERGENCY_${Date.now()}_${data.userId}.json`
      const filepath = path.join(BACKUP_DIR, filename)

      await fs.writeFile(filepath, JSON.stringify({
        ...data,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }, null, 2))

      console.error(`Emergency backup saved to ${filepath}`)
    } catch (backupError) {
      console.error('Emergency backup failed:', backupError)
    }
  }

  /**
   * Log failed notification attempt
   */
  private static async logFailedNotification(
    userId: string,
    channel: string,
    data: NotificationData,
    error: any
  ): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId,
          channel: channel.toUpperCase() as any,
          type: this.mapEventTypeToNotificationType(data.eventType),
          subject: data.subject,
          content: data.message,
          metadata: data.metadata,
          scheduledAt: new Date(),
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      })
    } catch (logError) {
      console.error('Error logging failed notification:', logError)
    }
  }

  /**
   * Map event type to notification type enum
   */
  private static mapEventTypeToNotificationType(eventType: NotificationEventType): 'REMINDER' | 'PROMOTION' | 'UPDATE' | 'ALERT' {
    const mapping: Record<NotificationEventType, 'REMINDER' | 'PROMOTION' | 'UPDATE' | 'ALERT'> = {
      plan_change: 'UPDATE',
      address_update: 'UPDATE',
      payment_method_update: 'UPDATE',
      subscription_created: 'UPDATE',
      subscription_cancelled: 'ALERT',
      subscription_paused: 'UPDATE',
      subscription_resumed: 'UPDATE',
      payment_received: 'UPDATE',
      payment_overdue: 'ALERT',
      delivery_shipped: 'UPDATE',
      delivery_delivered: 'UPDATE',
      reminder_renewal: 'REMINDER',
      marketing: 'PROMOTION',
      system_updates: 'UPDATE'
    }

    return mapping[eventType] || 'UPDATE'
  }

  /**
   * Generate HTML email template
   */
  private static generateEmailTemplate(data: {
    userName: string
    subject: string
    message: string
    metadata?: any
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.subject}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #06b6d4;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #06b6d4;
            margin-bottom: 10px;
          }
          .content {
            margin-bottom: 30px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #333;
          }
          .message {
            font-size: 16px;
            line-height: 1.8;
            color: #555;
            margin-bottom: 20px;
            white-space: pre-line;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            font-size: 14px;
            color: #777;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #06b6d4;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .contact-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SVLentes</div>
            <p style="color: #666; margin: 0;">Lentes de Contato por Assinatura</p>
          </div>

          <div class="content">
            <p class="greeting">Olá, ${data.userName}!</p>
            <div class="message">${data.message}</div>

            <div style="text-align: center;">
              <a href="https://svlentes.shop/area-assinante/dashboard" class="button">
                Acessar Meu Painel
              </a>
            </div>

            <div class="contact-info">
              <strong>Precisa de ajuda?</strong><br>
              WhatsApp: (33) 99989-8026<br>
              Email: contato@svlentes.com.br<br>
              <br>
              <strong>Responsável Técnico:</strong><br>
              Dr. Philipe Saraiva Cruz - CRM-MG 69.870
            </div>
          </div>

          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p>&copy; 2025 SVLentes - Saraiva Vision. Todos os direitos reservados.</p>
            <p style="font-size: 12px; margin-top: 10px;">
              <a href="https://svlentes.shop/area-assinante/configuracoes" style="color: #06b6d4; text-decoration: none;">Gerenciar Preferências de Notificação</a> |
              <a href="https://svlentes.shop/politica-privacidade" style="color: #06b6d4; text-decoration: none;">Política de Privacidade</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Utility function to sleep
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
