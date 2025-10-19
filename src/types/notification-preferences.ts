/**
 * Granular Notification Preferences Schema
 * Allows users to control notifications at channel and event type level
 */

export type NotificationChannel = 'email' | 'whatsapp' | 'sms' | 'push'

export type NotificationEventType =
  | 'plan_change'
  | 'address_update'
  | 'payment_method_update'
  | 'subscription_created'
  | 'subscription_cancelled'
  | 'subscription_paused'
  | 'subscription_resumed'
  | 'payment_received'
  | 'payment_overdue'
  | 'delivery_shipped'
  | 'delivery_delivered'
  | 'reminder_renewal'
  | 'marketing'
  | 'system_updates'

export interface ChannelPreferences {
  enabled: boolean
  events: {
    [K in NotificationEventType]?: boolean
  }
}

export interface NotificationPreferences {
  channels: {
    email: ChannelPreferences
    whatsapp: ChannelPreferences
    sms: ChannelPreferences
    push: ChannelPreferences
  }

  // Global settings
  quietHours: {
    enabled: boolean
    start: string // HH:mm format (e.g., "22:00")
    end: string   // HH:mm format (e.g., "08:00")
    timezone: string // e.g., "America/Sao_Paulo"
  }

  // Frequency limits
  frequency: {
    maxPerDay: number
    maxPerWeek: number
    respectQuietHours: boolean
  }

  // Fallback configuration
  fallback: {
    enabled: boolean
    primaryChannel: NotificationChannel
    fallbackChannel: NotificationChannel
    fallbackDelayMinutes: number // Time to wait before fallback
  }

  // Language and format
  language: 'pt-BR' | 'en-US'
  format: 'html' | 'plain'

  // Last updated
  updatedAt: Date
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  channels: {
    email: {
      enabled: true,
      events: {
        plan_change: true,
        address_update: true,
        payment_method_update: true,
        subscription_created: true,
        subscription_cancelled: true,
        subscription_paused: true,
        subscription_resumed: true,
        payment_received: true,
        payment_overdue: true,
        delivery_shipped: true,
        delivery_delivered: true,
        reminder_renewal: true,
        marketing: false,
        system_updates: true
      }
    },
    whatsapp: {
      enabled: true,
      events: {
        plan_change: true,
        address_update: true,
        payment_method_update: true,
        subscription_created: true,
        subscription_cancelled: true,
        subscription_paused: false,
        subscription_resumed: false,
        payment_received: false,
        payment_overdue: true,
        delivery_shipped: true,
        delivery_delivered: true,
        reminder_renewal: true,
        marketing: false,
        system_updates: false
      }
    },
    sms: {
      enabled: false,
      events: {
        plan_change: false,
        address_update: false,
        payment_method_update: false,
        subscription_created: false,
        subscription_cancelled: false,
        subscription_paused: false,
        subscription_resumed: false,
        payment_received: false,
        payment_overdue: true,
        delivery_shipped: false,
        delivery_delivered: false,
        reminder_renewal: true,
        marketing: false,
        system_updates: false
      }
    },
    push: {
      enabled: false,
      events: {
        plan_change: true,
        address_update: true,
        payment_method_update: true,
        subscription_created: true,
        subscription_cancelled: true,
        subscription_paused: true,
        subscription_resumed: true,
        payment_received: true,
        payment_overdue: true,
        delivery_shipped: true,
        delivery_delivered: true,
        reminder_renewal: true,
        marketing: false,
        system_updates: true
      }
    }
  },

  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00',
    timezone: 'America/Sao_Paulo'
  },

  frequency: {
    maxPerDay: 10,
    maxPerWeek: 50,
    respectQuietHours: true
  },

  fallback: {
    enabled: true,
    primaryChannel: 'email',
    fallbackChannel: 'whatsapp',
    fallbackDelayMinutes: 30
  },

  language: 'pt-BR',
  format: 'html',

  updatedAt: new Date()
}

/**
 * Event to human-readable label mapping
 */
export const EVENT_LABELS: Record<NotificationEventType, { pt: string; en: string; description: string }> = {
  plan_change: {
    pt: 'Mudança de Plano',
    en: 'Plan Change',
    description: 'Quando você alterar seu plano de assinatura'
  },
  address_update: {
    pt: 'Atualização de Endereço',
    en: 'Address Update',
    description: 'Quando você atualizar seu endereço de entrega'
  },
  payment_method_update: {
    pt: 'Forma de Pagamento',
    en: 'Payment Method Update',
    description: 'Quando você alterar sua forma de pagamento'
  },
  subscription_created: {
    pt: 'Assinatura Criada',
    en: 'Subscription Created',
    description: 'Quando sua assinatura for criada'
  },
  subscription_cancelled: {
    pt: 'Assinatura Cancelada',
    en: 'Subscription Cancelled',
    description: 'Quando sua assinatura for cancelada'
  },
  subscription_paused: {
    pt: 'Assinatura Pausada',
    en: 'Subscription Paused',
    description: 'Quando sua assinatura for pausada'
  },
  subscription_resumed: {
    pt: 'Assinatura Retomada',
    en: 'Subscription Resumed',
    description: 'Quando sua assinatura for retomada'
  },
  payment_received: {
    pt: 'Pagamento Recebido',
    en: 'Payment Received',
    description: 'Quando um pagamento for confirmado'
  },
  payment_overdue: {
    pt: 'Pagamento Atrasado',
    en: 'Payment Overdue',
    description: 'Quando um pagamento estiver atrasado'
  },
  delivery_shipped: {
    pt: 'Pedido Enviado',
    en: 'Delivery Shipped',
    description: 'Quando seu pedido for enviado'
  },
  delivery_delivered: {
    pt: 'Pedido Entregue',
    en: 'Delivery Delivered',
    description: 'Quando seu pedido for entregue'
  },
  reminder_renewal: {
    pt: 'Lembrete de Renovação',
    en: 'Renewal Reminder',
    description: 'Lembretes sobre renovação da assinatura'
  },
  marketing: {
    pt: 'Marketing e Promoções',
    en: 'Marketing',
    description: 'Ofertas especiais e novidades'
  },
  system_updates: {
    pt: 'Atualizações do Sistema',
    en: 'System Updates',
    description: 'Informações sobre manutenção e atualizações'
  }
}

/**
 * Channel to human-readable label mapping
 */
export const CHANNEL_LABELS: Record<NotificationChannel, { pt: string; en: string; icon: string }> = {
  email: {
    pt: 'Email',
    en: 'Email',
    icon: 'Mail'
  },
  whatsapp: {
    pt: 'WhatsApp',
    en: 'WhatsApp',
    icon: 'MessageCircle'
  },
  sms: {
    pt: 'SMS',
    en: 'SMS',
    icon: 'Smartphone'
  },
  push: {
    pt: 'Notificações Push',
    en: 'Push Notifications',
    icon: 'Bell'
  }
}
