import { sendEmail } from '@/lib/email'
import { sendPulseWhatsAppClient } from '@/lib/sendpulse-whatsapp'

export type NotificationChannel = 'EMAIL' | 'WHATSAPP' | 'BOTH'
export type ReminderType = 'subscription_renewal' | 'order_delivery' | 'appointment' | 'general'

export interface ReminderRecipient {
  userId: string
  email: string
  phone?: string
  name?: string
  preferredChannel?: NotificationChannel
}

export interface ReminderMessage {
  type: ReminderType
  subject?: string
  message: string
  metadata?: Record<string, any>
}

export class MultiChannelReminderService {
  async sendReminder(
    recipient: ReminderRecipient,
    reminder: ReminderMessage
  ): Promise<{ email: boolean; whatsapp: boolean }> {
    const channel = recipient.preferredChannel || 'EMAIL'
    const results = { email: false, whatsapp: false }

    if (channel === 'EMAIL' || channel === 'BOTH') {
      results.email = await this.sendEmailReminder(recipient, reminder)
    }

    if (channel === 'WHATSAPP' || channel === 'BOTH') {
      if (recipient.phone) {
        results.whatsapp = await this.sendWhatsAppReminder(recipient, reminder)
      }
    }

    return results
  }

  private async sendEmailReminder(
    recipient: ReminderRecipient,
    reminder: ReminderMessage
  ): Promise<boolean> {
    try {
      const html = this.formatEmailContent(recipient, reminder)
      const subject = reminder.subject || this.getDefaultSubject(reminder.type)

      const result = await sendEmail({
        to: recipient.email,
        subject,
        html
      })

      return result && 'id' in result
    } catch (error) {
      console.error('Email reminder send failed:', error)
      return false
    }
  }

  private async sendWhatsAppReminder(
    recipient: ReminderRecipient,
    reminder: ReminderMessage
  ): Promise<boolean> {
    try {
      if (!recipient.phone) {
        throw new Error('Phone number required for WhatsApp reminders')
      }

      const whatsappMessage = this.formatWhatsAppMessage(recipient, reminder)

      const result = await sendPulseWhatsAppClient.sendMessage({
        phone: recipient.phone,
        text: whatsappMessage
      })

      return result?.success === true
    } catch (error) {
      console.error('WhatsApp reminder send failed:', error)
      return false
    }
  }

  private formatWhatsAppMessage(
    recipient: ReminderRecipient,
    reminder: ReminderMessage
  ): string {
    const greeting = recipient.name ? `Olá, ${recipient.name}!` : 'Olá!'
    const icon = this.getReminderIcon(reminder.type)

    let message = `${icon} *SV Lentes - Lembrete*\n\n`
    message += `${greeting}\n\n`
    message += `${reminder.message}\n\n`
    
    if (reminder.type === 'subscription_renewal') {
      message += `📱 *Precisa de ajuda?*\n`
      message += `Responda esta mensagem ou acesse:\n`
      message += `https://svlentes.com.br/area-usuario\n\n`
    } else if (reminder.type === 'order_delivery') {
      message += `📦 *Rastreie seu pedido:*\n`
      message += `https://svlentes.com.br/area-usuario?tab=pedidos\n\n`
    }

    message += `_SV Lentes - Lentes de Contato com Acompanhamento Médico_`

    return message
  }

  private formatEmailContent(
    recipient: ReminderRecipient,
    reminder: ReminderMessage
  ): string {
    const greetingName = recipient.name || 'Cliente'
    const icon = this.getReminderIcon(reminder.type)

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lembrete - SV Lentes</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        
        <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">SV Lentes</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Lentes de Contato com Acompanhamento Médico</p>
        </div>

        <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <p style="font-size: 18px; margin-bottom: 20px; color: #0891b2;">
            Olá, ${greetingName}!
          </p>

          <div style="background-color: #f0f9ff; border-left: 4px solid #06b6d4; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <p style="font-size: 16px; margin: 0; color: #0c4a6e; line-height: 1.6;">
              ${icon} ${reminder.message.replace(/\n/g, '<br>')}
            </p>
          </div>

          ${this.renderEmailActionButton(reminder.type)}

          <div style="margin-top: 35px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="font-size: 14px; color: #64748b; margin: 0 0 10px 0; font-weight: 600;">
              📞 Precisa de ajuda?
            </p>
            <p style="font-size: 14px; color: #64748b; margin: 5px 0;">
              WhatsApp: <a href="https://wa.me/5533998980026" style="color: #0891b2; text-decoration: none;">(33) 99898-0026</a>
            </p>
            <p style="font-size: 14px; color: #64748b; margin: 5px 0;">
              Email: <a href="mailto:contato@svlentes.com.br" style="color: #0891b2; text-decoration: none;">contato@svlentes.com.br</a>
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

          <div style="text-align: center;">
            <p style="font-size: 13px; color: #94a3b8; margin: 10px 0;">
              © 2025 SV Lentes - Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
            </p>
            <p style="font-size: 12px; color: #cbd5e1; margin: 15px 0 5px 0;">
              Você está recebendo este email porque é assinante da SV Lentes.
              <br><a href="https://svlentes.com.br/area-usuario?tab=preferencias" style="color: #0891b2;">Alterar preferências de notificação</a>
            </p>
          </div>
        </div>

      </body>
      </html>
    `
  }

  private renderEmailActionButton(type: ReminderType): string {
    const buttons = {
      subscription_renewal: {
        text: 'Ver Minha Assinatura',
        url: 'https://svlentes.com.br/area-usuario?tab=assinatura'
      },
      order_delivery: {
        text: 'Rastrear Pedido',
        url: 'https://svlentes.com.br/area-usuario?tab=pedidos'
      },
      appointment: {
        text: 'Ver Minhas Consultas',
        url: 'https://svlentes.com.br/area-usuario?tab=consultas'
      },
      general: {
        text: 'Acessar Minha Conta',
        url: 'https://svlentes.com.br/area-usuario'
      }
    }

    const button = buttons[type] || buttons.general

    return `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${button.url}"
           style="background: #06b6d4; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(6, 182, 212, 0.3);">
          ${button.text}
        </a>
      </div>
    `
  }

  private getReminderIcon(type: ReminderType): string {
    const icons = {
      subscription_renewal: '🔔',
      order_delivery: '📦',
      appointment: '👓',
      general: '💬'
    }
    return icons[type] || icons.general
  }

  private getDefaultSubject(type: ReminderType): string {
    const subjects = {
      subscription_renewal: '🔔 Lembrete: Renovação da sua assinatura SV Lentes',
      order_delivery: '📦 Seu pedido SV Lentes está a caminho!',
      appointment: '👓 Lembrete: Consulta de acompanhamento SV Lentes',
      general: '🔔 Lembrete - SV Lentes'
    }
    return subjects[type] || subjects.general
  }

  async sendSubscriptionRenewalReminder(
    recipient: ReminderRecipient,
    daysUntilRenewal: number,
    renewalDate: string
  ): Promise<{ email: boolean; whatsapp: boolean }> {
    const message = daysUntilRenewal === 0 
      ? `Hoje é o dia da renovação da sua assinatura! 🎉\n\nSua próxima entrega será processada automaticamente.`
      : daysUntilRenewal === 1
      ? `Amanhã sua assinatura será renovada! 📅\n\nData da renovação: ${renewalDate}\n\nSuas lentes serão enviadas em breve.`
      : `Faltam apenas ${daysUntilRenewal} dias para a renovação da sua assinatura! 📅\n\nData da renovação: ${renewalDate}\n\nVocê receberá suas lentes no prazo previsto.`

    return this.sendReminder(recipient, {
      type: 'subscription_renewal',
      message,
      metadata: {
        daysUntilRenewal,
        renewalDate
      }
    })
  }

  async sendOrderDeliveryReminder(
    recipient: ReminderRecipient,
    trackingCode?: string,
    estimatedDelivery?: string
  ): Promise<{ email: boolean; whatsapp: boolean }> {
    let message = `Seu pedido está a caminho! 📦\n\n`
    
    if (trackingCode) {
      message += `Código de rastreio: ${trackingCode}\n\n`
    }
    
    if (estimatedDelivery) {
      message += `Previsão de entrega: ${estimatedDelivery}\n\n`
    }
    
    message += `Acompanhe seu pedido em tempo real pela sua área de usuário.`

    return this.sendReminder(recipient, {
      type: 'order_delivery',
      message,
      metadata: {
        trackingCode,
        estimatedDelivery
      }
    })
  }

  async sendAppointmentReminder(
    recipient: ReminderRecipient,
    appointmentDate: string,
    appointmentTime: string
  ): Promise<{ email: boolean; whatsapp: boolean }> {
    const message = `Lembrete de consulta de acompanhamento! 👓\n\nData: ${appointmentDate}\nHorário: ${appointmentTime}\n\nSua saúde ocular é nossa prioridade. Não esqueça de comparecer!`

    return this.sendReminder(recipient, {
      type: 'appointment',
      message,
      metadata: {
        appointmentDate,
        appointmentTime
      }
    })
  }
}

export const multiChannelReminderService = new MultiChannelReminderService()
