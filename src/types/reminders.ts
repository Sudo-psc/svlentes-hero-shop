// Types for Intelligent Reminder System
export enum NotificationChannel {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  PUSH = 'PUSH',
}
export enum NotificationStatus {
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}
export enum NotificationType {
  REMINDER = 'REMINDER',
  PROMOTION = 'PROMOTION',
  UPDATE = 'UPDATE',
  ALERT = 'ALERT',
}
export enum InteractionType {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  DISMISSED = 'DISMISSED',
  OPTED_OUT = 'OPTED_OUT',
  CONVERTED = 'CONVERTED',
}
// User preferences for notifications
export interface UserPreferences {
  channels: {
    email?: {
      enabled: boolean
      address?: string
    }
    whatsapp?: {
      enabled: boolean
      number?: string
    }
    sms?: {
      enabled: boolean
      number?: string
    }
    push?: {
      enabled: boolean
      token?: string
    }
  }
  frequency?: {
    max_per_day: number
    quiet_hours?: {
      start: number // 0-23
      end: number // 0-23
    }
  }
  types?: {
    [key in NotificationType]?: boolean
  }
}
// Notification payload
export interface NotificationPayload {
  userId: string
  channel: NotificationChannel
  type: NotificationType
  subject?: string
  content: string
  metadata?: Record<string, any>
  scheduledAt: Date
}
// ML prediction result
export interface MLPredictionResult {
  channel: NotificationChannel
  time: Date
  confidence: number
  features: Record<string, any>
}
// User behavior metrics
export interface UserBehaviorMetrics {
  userId: string
  emailOpenRate: number
  emailClickRate: number
  whatsappOpenRate: number
  whatsappClickRate: number
  smsOpenRate: number
  smsClickRate: number
  pushOpenRate: number
  pushClickRate: number
  bestHourOfDay?: number
  averageResponseTime?: number
  preferredFrequency: number
  currentFatigueScore: number
  conversionRate: number
}
// Channel metrics
export interface ChannelMetrics {
  channel: NotificationChannel
  sent: number
  delivered: number
  opened: number
  clicked: number
  failed: number
  openRate: number
  clickRate: number
  deliveryRate: number
  avgResponseTime?: number
}
// Engagement analytics
export interface EngagementAnalytics {
  period: {
    start: Date
    end: Date
  }
  global: {
    totalSent: number
    totalDelivered: number
    totalOpened: number
    totalClicked: number
    totalConverted: number
    engagementRate: number
    optOutRate: number
    avgResponseTime: number
  }
  byChannel: ChannelMetrics[]
  byType: Record<NotificationType, {
    sent: number
    opened: number
    converted: number
  }>
}
// Reminder creation input
export interface CreateReminderInput {
  userId: string
  type: NotificationType
  content: string
  subject?: string
  metadata?: Record<string, any>
  scheduledAt?: Date
  preferredChannel?: NotificationChannel
}
// Reminder update input
export interface UpdateReminderInput {
  content?: string
  subject?: string
  metadata?: Record<string, any>
  scheduledAt?: Date
  status?: NotificationStatus
}
// ML model features
export interface MLFeatures {
  hourOfDay: number
  dayOfWeek: number
  channelHistory: Record<NotificationChannel, number>
  recentEngagement: number
  fatigueScore: number
  avgResponseTime: number
  preferredFrequency: number
}
// Analytics query parameters
export interface AnalyticsQuery {
  userId?: string
  startDate: Date
  endDate: Date
  channels?: NotificationChannel[]
  types?: NotificationType[]
}
// Fatigue score calculation input
export interface FatigueScoreInput {
  recentNotificationCount: number
  recentInteractionRate: number
  timeSinceLastNotification: number // minutes
  optOutHistory: boolean
}
// Channel selection result
export interface ChannelSelectionResult {
  primary: NotificationChannel
  fallback: NotificationChannel[]
  score: number
  reason: string
}
// Notification send result
export interface NotificationSendResult {
  success: boolean
  notificationId: string
  channel: NotificationChannel
  status: NotificationStatus
  sentAt?: Date
  error?: string
}
// Report generation options
export interface ReportOptions {
  format: 'CSV' | 'JSON' | 'PDF'
  period: {
    start: Date
    end: Date
  }
  includeUserLevel?: boolean
  includeChannelBreakdown?: boolean
}