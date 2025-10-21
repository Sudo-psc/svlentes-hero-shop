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
  metadata?: Record<string, unknown>
}