import { sendPulseWhatsAppClient } from '@/lib/sendpulse-whatsapp'
import { NotificationChannel } from '@/types/reminders'
export interface ReminderMessage {
  userId: string
  phone: string
  email?: string
  name?: string
  message: string
  subject?: string
  quickReplies?: string[]
  scheduledAt?: Date
  metadata?: Record<string, any>
}
export class SendPulseReminderService {
  async sendReminder(reminder: ReminderMessage, channel: NotificationChannel): Promise<boolean> {
    try {
      switch (channel) {
        case NotificationChannel.WHATSAPP:
          return await this.sendWhatsAppReminder(reminder)
        case NotificationChannel.EMAIL:
          return await this.sendEmailReminder(reminder)
        case NotificationChannel.SMS:
          return await this.sendSMSReminder(reminder)
        default:
          console.warn(`Unsupported channel: ${channel}`)
          return false
      }
    } catch (error) {
      console.error(`Error sending reminder via ${channel}:`, error)
      return false
    }
  }
  private async sendWhatsAppReminder(reminder: ReminderMessage): Promise<boolean> {
    try {
      if (!reminder.phone) {
        throw new Error('Phone number required for WhatsApp reminders')
      }
      if (reminder.quickReplies && reminder.quickReplies.length > 0) {
        const result = await sendPulseWhatsAppClient.sendMessageWithQuickReplies(
          reminder.phone,
          reminder.message,
          reminder.quickReplies
        )
        return result && !result.error
      } else {
        const result = await sendPulseWhatsAppClient.sendMessage({
          phone: reminder.phone,
          text: reminder.message
        })
        return result && !result.error
      }
    } catch (error) {
      console.error('WhatsApp reminder send failed:', error)
      return false
    }
  }
  private async sendEmailReminder(reminder: ReminderMessage): Promise<boolean> {
    try {
      if (!reminder.email) {
        throw new Error('Email required for email reminders')
      }
      const { sendEmail } = await import('@/lib/email')
      const result = await sendEmail({
        to: reminder.email,
        subject: reminder.subject || 'Lembrete - SV Lentes',
        html: this.formatEmailContent(reminder)
      })
      return result && 'id' in result
    } catch (error) {
      console.error('Email reminder send failed:', error)
      return false
    }
  }
  private async sendSMSReminder(reminder: ReminderMessage): Promise<boolean> {
    try {
      if (!reminder.phone) {
        throw new Error('Phone number required for SMS reminders')
      }
      const result = await sendPulseWhatsAppClient.sendMessage({
        phone,
        text: notification.content
      })
      return result && !result.error
    } catch (error) {
      console.error('SMS reminder send failed:', error)
      return false
    }
  }
  private formatEmailContent(reminder: ReminderMessage): string {
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0891b2;">SV Lentes - Lembrete</h2>
        <div style="background-color: #f0f9ff; border-left: 4px solid #0891b2; padding: 15px; margin: 20px 0;">
          ${reminder.message.replace(/\n/g, '<br>')}
        </div>
    `
    if (reminder.quickReplies && reminder.quickReplies.length > 0) {
      html += `
        <div style="margin: 20px 0;">
          <p style="font-weight: bold; margin-bottom: 10px;">Ações rápidas:</p>
          <div style="display: flex; flex-direction: column; gap: 10px;">
      `
      reminder.quickReplies.forEach((reply) => {
        html += `
          <a href="https://wa.me/5533999898026?text=${encodeURIComponent(reply)}"
             style="background-color: #0891b2; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block; text-align: center;">
            ${reply}
          </a>
        `
      })
      html += `
          </div>
        </div>
      `
    }
    html += `
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>SV Lentes - Seu clube de assinatura de lentes de contato</p>
          <p>WhatsApp: (33) 99989-8026 | Email: contato@svlentes.com.br</p>
        </div>
      </div>
    `
    return html
  }
  async createContact(reminder: ReminderMessage): Promise<void> {
    try {
      if (!reminder.phone) {
        return
      }
      await sendPulseWhatsAppClient.createOrUpdateContact({
        phone: reminder.phone,
        name: reminder.name,
        email: reminder.email,
        variables: {
          last_reminder: new Date().toISOString(),
          ...reminder.metadata
        },
        tags: ['reminder-system']
      })
    } catch (error) {
      console.error('Error creating/updating SendPulse contact:', error)
    }
  }
  async scheduleReminder(reminder: ReminderMessage, channel: NotificationChannel): Promise<string> {
    try {
      await this.createContact(reminder)
      const shouldSendNow = !reminder.scheduledAt || reminder.scheduledAt <= new Date()
      if (shouldSendNow) {
        const success = await this.sendReminder(reminder, channel)
        return success ? 'sent' : 'failed'
      } else {
        return 'scheduled'
      }
    } catch (error) {
      console.error('Error scheduling reminder:', error)
      return 'failed'
    }
  }
  async sendBulkReminders(reminders: ReminderMessage[], channel: NotificationChannel): Promise<{
    sent: number
    failed: number
    total: number
  }> {
    let sent = 0
    let failed = 0
    for (const reminder of reminders) {
      const success = await this.sendReminder(reminder, channel)
      if (success) {
        sent++
      } else {
        failed++
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return {
      sent,
      failed,
      total: reminders.length
    }
  }
}
export const sendPulseReminderService = new SendPulseReminderService()