export type NotificationChannel = 'EMAIL' | 'WHATSAPP' | 'BOTH'
export interface UserNotificationPreferences {
  channel: NotificationChannel
  subscriptionReminders: boolean
  orderUpdates: boolean
  appointmentReminders: boolean
  marketingMessages: boolean
}
export interface UserPreferences {
  notifications: UserNotificationPreferences
  phone?: string
  phoneVerified?: boolean
}
export const defaultNotificationPreferences: UserNotificationPreferences = {
  channel: 'EMAIL',
  subscriptionReminders: true,
  orderUpdates: true,
  appointmentReminders: true,
  marketingMessages: false
}