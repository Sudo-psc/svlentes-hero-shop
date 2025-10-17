import { sendEmail } from '@/lib/email'

export interface ReminderMessage {
  userId: string
  email: string
  name?: string
  message: string
  subject?: string
  reminderType?: 'subscription_renewal' | 'order_delivery' | 'appointment' | 'general'
  metadata?: Record<string, any>
}

export class EmailReminderService {
  async sendReminder(reminder: ReminderMessage): Promise<boolean> {
    try {
      if (!reminder.email) {
        throw new Error('Email is required for email reminders')
      }

      const html = this.formatReminderEmail(reminder)
      const subject = reminder.subject || this.getDefaultSubject(reminder.reminderType)

      const result = await sendEmail({
        to: reminder.email,
        subject,
        html
      })

      return result && 'id' in result
    } catch (error) {
      console.error('Email reminder send failed:', error)
      return false
    }
  }

  private getDefaultSubject(reminderType?: string): string {
    switch (reminderType) {
      case 'subscription_renewal':
        return '🔔 Lembrete: Renovação da sua assinatura SV Lentes'
      case 'order_delivery':
        return '📦 Seu pedido SV Lentes está a caminho!'
      case 'appointment':
        return '👓 Lembrete: Consulta de acompanhamento SV Lentes'
      default:
        return '🔔 Lembrete - SV Lentes'
    }
  }

  private formatReminderEmail(reminder: ReminderMessage): string {
    const greetingName = reminder.name || 'Cliente'
    const iconMap = {
      subscription_renewal: '🔔',
      order_delivery: '📦',
      appointment: '👓',
      general: '💬'
    }
    
    const icon = iconMap[reminder.reminderType as keyof typeof iconMap] || '💬'

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lembrete - SV Lentes</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        
        <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">SV Lentes</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Lentes de Contato com Acompanhamento Médico</p>
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

          ${this.renderActionButtons(reminder)}

          <div style="margin-top: 35px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="font-size: 14px; color: #64748b; margin: 0 0 10px 0; font-weight: 600;">
              📞 Precisa de ajuda?
            </p>
            <p style="font-size: 14px; color: #64748b; margin: 5px 0;">
              WhatsApp: <a href="https://wa.me/5533999898026" style="color: #0891b2; text-decoration: none;">(33) 99989-8026</a>
            </p>
            <p style="font-size: 14px; color: #64748b; margin: 5px 0;">
              Email: <a href="mailto:contato@svlentes.com.br" style="color: #0891b2; text-decoration: none;">contato@svlentes.com.br</a>
            </p>
            <p style="font-size: 14px; color: #64748b; margin: 5px 0;">
              Site: <a href="https://svlentes.com.br" style="color: #0891b2; text-decoration: none;">svlentes.com.br</a>
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

          <div style="text-align: center;">
            <p style="font-size: 13px; color: #94a3b8; margin: 10px 0;">
              © 2025 SV Lentes - Lentes de Contato com Acompanhamento Médico
            </p>
            <p style="font-size: 13px; color: #94a3b8; margin: 10px 0;">
              Caratinga/MG - Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
            </p>
            <p style="font-size: 12px; color: #cbd5e1; margin: 15px 0 5px 0;">
              Você está recebendo este email porque é assinante da SV Lentes.
            </p>
          </div>
        </div>

      </body>
      </html>
    `
  }

  private renderActionButtons(reminder: ReminderMessage): string {
    if (reminder.reminderType === 'subscription_renewal') {
      return `
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://svlentes.com.br/area-usuario?tab=assinatura"
             style="background: #06b6d4; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(6, 182, 212, 0.3);">
            Ver Minha Assinatura
          </a>
        </div>
      `
    }

    if (reminder.reminderType === 'order_delivery') {
      return `
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://svlentes.com.br/area-usuario?tab=pedidos"
             style="background: #06b6d4; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(6, 182, 212, 0.3);">
            Rastrear Pedido
          </a>
        </div>
      `
    }

    if (reminder.reminderType === 'appointment') {
      return `
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://svlentes.com.br/area-usuario?tab=consultas"
             style="background: #06b6d4; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(6, 182, 212, 0.3);">
            Ver Minhas Consultas
          </a>
        </div>
      `
    }

    return `
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://svlentes.com.br/area-usuario"
           style="background: #06b6d4; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(6, 182, 212, 0.3);">
          Acessar Minha Conta
        </a>
      </div>
    `
  }

  async sendBulkReminders(reminders: ReminderMessage[]): Promise<{
    sent: number
    failed: number
    total: number
  }> {
    let sent = 0
    let failed = 0

    for (const reminder of reminders) {
      const success = await this.sendReminder(reminder)
      if (success) {
        sent++
      } else {
        failed++
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    return {
      sent,
      failed,
      total: reminders.length
    }
  }

  async sendSubscriptionRenewalReminder(
    email: string, 
    name: string, 
    daysUntilRenewal: number,
    renewalDate: string
  ): Promise<boolean> {
    const message = daysUntilRenewal === 0 
      ? `Hoje é o dia da renovação da sua assinatura! 🎉\n\nSua próxima entrega será processada automaticamente.`
      : daysUntilRenewal === 1
      ? `Amanhã sua assinatura será renovada! 📅\n\nData da renovação: ${renewalDate}\n\nSuas lentes serão enviadas em breve.`
      : `Faltam apenas ${daysUntilRenewal} dias para a renovação da sua assinatura! 📅\n\nData da renovação: ${renewalDate}\n\nVocê receberá suas lentes no prazo previsto.`

    return this.sendReminder({
      userId: email,
      email,
      name,
      message,
      reminderType: 'subscription_renewal',
      metadata: {
        daysUntilRenewal,
        renewalDate
      }
    })
  }

  async sendOrderDeliveryReminder(
    email: string,
    name: string,
    trackingCode?: string,
    estimatedDelivery?: string
  ): Promise<boolean> {
    let message = `Seu pedido está a caminho! 📦\n\n`
    
    if (trackingCode) {
      message += `Código de rastreio: ${trackingCode}\n\n`
    }
    
    if (estimatedDelivery) {
      message += `Previsão de entrega: ${estimatedDelivery}\n\n`
    }
    
    message += `Acompanhe seu pedido em tempo real pela sua área de usuário.`

    return this.sendReminder({
      userId: email,
      email,
      name,
      message,
      reminderType: 'order_delivery',
      metadata: {
        trackingCode,
        estimatedDelivery
      }
    })
  }

  async sendAppointmentReminder(
    email: string,
    name: string,
    appointmentDate: string,
    appointmentTime: string
  ): Promise<boolean> {
    const message = `Lembrete de consulta de acompanhamento! 👓\n\nData: ${appointmentDate}\nHorário: ${appointmentTime}\n\nSua saúde ocular é nossa prioridade. Não esqueça de comparecer!`

    return this.sendReminder({
      userId: email,
      email,
      name,
      message,
      reminderType: 'appointment',
      metadata: {
        appointmentDate,
        appointmentTime
      }
    })
  }
}

export const emailReminderService = new EmailReminderService()
