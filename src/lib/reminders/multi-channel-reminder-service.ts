import { sendEmail } from '@/lib/email'
import { sendPulseWhatsAppClient } from '@/lib/sendpulse-whatsapp'
import {
  buildEmailReminderContent,
  buildWhatsAppReminderContent
} from '@/lib/reminders/reminder-templates'
import {
  type NotificationChannel,
  type ReminderMessage,
  type ReminderRecipient
} from '@/lib/reminders/reminder-types'
type DeliveryChannel = Exclude<NotificationChannel, 'BOTH'>
const MAX_DELIVERY_ATTEMPTS = 2
export class ReminderDeliveryError extends Error {
  constructor(
    public readonly channel: DeliveryChannel,
    public readonly provider: string,
    public readonly cause: unknown
  ) {
    super(`Failed to deliver reminder via ${channel}`)
  }
}
export interface ChannelDeliveryResult {
  success: boolean
  attempts: number
  error?: ReminderDeliveryError
}
export interface ReminderDeliverySummary {
  email: boolean
  whatsapp: boolean
  details: Record<DeliveryChannel, ChannelDeliveryResult>
  errors: ReminderDeliveryError[]
}
export class MultiChannelReminderService {
  async sendReminder(
    recipient: ReminderRecipient,
    reminder: ReminderMessage
  ): Promise<ReminderDeliverySummary> {
    const { channels, errors: resolutionErrors } = this.resolveChannels(recipient)
    const details: Record<DeliveryChannel, ChannelDeliveryResult> = {
      EMAIL: { success: false, attempts: 0 },
      WHATSAPP: { success: false, attempts: 0 }
    }
    const errors = [...resolutionErrors]
    for (const channel of channels) {
      const result = await this.dispatchChannel(channel, recipient, reminder)
      details[channel] = result
      if (result.error) {
        errors.push(result.error)
      }
    }
    return {
      email: details.EMAIL.success,
      whatsapp: details.WHATSAPP.success,
      details,
      errors
    }
  }
  private async dispatchChannel(
    channel: DeliveryChannel,
    recipient: ReminderRecipient,
    reminder: ReminderMessage
  ): Promise<ChannelDeliveryResult> {
    if (channel === 'EMAIL') {
      return this.attemptDelivery(channel, () => this.deliverEmail(recipient, reminder))
    }
    return this.attemptDelivery(channel, () => this.deliverWhatsApp(recipient, reminder))
  }
  private async attemptDelivery(
    channel: DeliveryChannel,
    operation: () => Promise<void>
  ): Promise<ChannelDeliveryResult> {
    let attempts = 0
    let lastError: ReminderDeliveryError | undefined
    while (attempts < MAX_DELIVERY_ATTEMPTS) {
      attempts += 1
      try {
        await operation()
        return { success: true, attempts }
      } catch (error) {
        lastError =
          error instanceof ReminderDeliveryError
            ? error
            : new ReminderDeliveryError(channel, 'unknown', error)
        if (attempts < MAX_DELIVERY_ATTEMPTS) {
          const backoffDelay = attempts * 250
          await new Promise((resolve) => setTimeout(resolve, backoffDelay))
        }
      }
    }
    if (lastError) {
      console.error(`[ReminderDelivery:${channel}]`, lastError)
    }
    return {
      success: false,
      attempts,
      error: lastError
    }
  }
  private async deliverEmail(recipient: ReminderRecipient, reminder: ReminderMessage): Promise<void> {
    try {
      const { subject, html } = buildEmailReminderContent({ recipient, reminder })
      const response = await sendEmail({
        to: recipient.email,
        subject,
        html
      })
      if (!response || typeof response !== 'object' || !('id' in response)) {
        throw new ReminderDeliveryError(
          'EMAIL',
          'Transactional Email',
          new Error('Email provider returned an unexpected response')
        )
      }
    } catch (error) {
      throw error instanceof ReminderDeliveryError
        ? error
        : new ReminderDeliveryError('EMAIL', 'Transactional Email', error)
    }
  }
  private async deliverWhatsApp(
    recipient: ReminderRecipient,
    reminder: ReminderMessage
  ): Promise<void> {
    if (!recipient.phone) {
      throw new ReminderDeliveryError(
        'WHATSAPP',
        'SendPulse WhatsApp',
        new Error('Recipient phone number is required for WhatsApp reminders')
      )
    }
    try {
      const text = buildWhatsAppReminderContent({ recipient, reminder })
      const response = await sendPulseWhatsAppClient.sendMessage({
        phone: recipient.phone,
        text
      })
      if (!response || response.success !== true) {
        throw new ReminderDeliveryError(
          'WHATSAPP',
          'SendPulse WhatsApp',
          new Error('WhatsApp provider returned an unsuccessful response')
        )
      }
    } catch (error) {
      throw error instanceof ReminderDeliveryError
        ? error
        : new ReminderDeliveryError('WHATSAPP', 'SendPulse WhatsApp', error)
    }
  }
  private resolveChannels(
    recipient: ReminderRecipient
  ): { channels: DeliveryChannel[]; errors: ReminderDeliveryError[] } {
    const preference = recipient.preferredChannel ?? 'EMAIL'
    const channels = new Set<DeliveryChannel>()
    const errors: ReminderDeliveryError[] = []
    if (preference === 'EMAIL' || preference === 'BOTH') {
      channels.add('EMAIL')
    }
    if (preference === 'WHATSAPP' || preference === 'BOTH') {
      if (recipient.phone) {
        channels.add('WHATSAPP')
      } else {
        errors.push(
          new ReminderDeliveryError(
            'WHATSAPP',
            'SendPulse WhatsApp',
            new Error('Recipient phone number is missing')
          )
        )
      }
    }
    return { channels: Array.from(channels), errors }
  }
  async sendSubscriptionRenewalReminder(
    recipient: ReminderRecipient,
    daysUntilRenewal: number,
    renewalDate: string
  ): Promise<ReminderDeliverySummary> {
    const message =
      daysUntilRenewal === 0
        ? 'Hoje é o dia da renovação da sua assinatura! 🎉\n\nSua próxima entrega será processada automaticamente.'
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
  ): Promise<ReminderDeliverySummary> {
    const sections = ['Seu pedido está a caminho! 📦']
    if (trackingCode) {
      sections.push(`Código de rastreio: ${trackingCode}`)
    }
    if (estimatedDelivery) {
      sections.push(`Previsão de entrega: ${estimatedDelivery}`)
    }
    sections.push('Acompanhe seu pedido em tempo real pela sua área de usuário.')
    const message = sections.join('\\n\\n')
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
  ): Promise<ReminderDeliverySummary> {
    const message = `Lembrete de consulta de acompanhamento! 👓\\n\\nData: ${appointmentDate}\\nHorário: ${appointmentTime}\\n\\nSua saúde ocular é nossa prioridade. Não esqueça de comparecer!`
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