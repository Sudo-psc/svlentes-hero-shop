// Enums para status e permissões do sistema admin
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SUPPORT = 'SUPPORT',
  VIEWER = 'VIEWER'
}

export enum Permission {
  // Dashboard
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',

  // Users
  VIEW_USERS = 'VIEW_USERS',
  CREATE_USERS = 'CREATE_USERS',
  EDIT_USERS = 'EDIT_USERS',
  DELETE_USERS = 'DELETE_USERS',

  // Subscriptions
  VIEW_SUBSCRIPTIONS = 'VIEW_SUBSCRIPTIONS',
  CREATE_SUBSCRIPTIONS = 'CREATE_SUBSCRIPTIONS',
  EDIT_SUBSCRIPTIONS = 'EDIT_SUBSCRIPTIONS',
  DELETE_SUBSCRIPTIONS = 'DELETE_SUBSCRIPTIONS',
  CANCEL_SUBSCRIPTIONS = 'CANCEL_SUBSCRIPTIONS',

  // Orders
  VIEW_ORDERS = 'VIEW_ORDERS',
  CREATE_ORDERS = 'CREATE_ORDERS',
  EDIT_ORDERS = 'EDIT_ORDERS',
  DELETE_ORDERS = 'DELETE_ORDERS',

  // Payments
  VIEW_PAYMENTS = 'VIEW_PAYMENTS',
  PROCESS_REFUNDS = 'PROCESS_REFUNDS',
  VIEW_FINANCIAL_REPORTS = 'VIEW_FINANCIAL_REPORTS',

  // Support
  VIEW_SUPPORT_TICKETS = 'VIEW_SUPPORT_TICKETS',
  RESPOND_TICKETS = 'RESPOND_TICKETS',
  ESCALATE_TICKETS = 'ESCALATE_TICKETS',

  // Analytics
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  EXPORT_REPORTS = 'EXPORT_REPORTS',

  // Settings
  VIEW_SETTINGS = 'VIEW_SETTINGS',
  EDIT_SETTINGS = 'EDIT_SETTINGS'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  EXPIRED = 'EXPIRED'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CHARGEBACK = 'CHARGEBACK'
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_CUSTOMER = 'WAITING_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED'
}

export enum TicketPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  BOLETO = 'BOLETO',
  PIX = 'PIX',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  [AdminRole.SUPER_ADMIN]: Object.values(Permission),

  [AdminRole.ADMIN]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_USERS,
    Permission.CREATE_USERS,
    Permission.EDIT_USERS,
    Permission.VIEW_SUBSCRIPTIONS,
    Permission.CREATE_SUBSCRIPTIONS,
    Permission.EDIT_SUBSCRIPTIONS,
    Permission.CANCEL_SUBSCRIPTIONS,
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.EDIT_ORDERS,
    Permission.VIEW_PAYMENTS,
    Permission.PROCESS_REFUNDS,
    Permission.VIEW_FINANCIAL_REPORTS,
    Permission.VIEW_SUPPORT_TICKETS,
    Permission.RESPOND_TICKETS,
    Permission.ESCALATE_TICKETS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_SETTINGS,
    Permission.EDIT_SETTINGS
  ],

  [AdminRole.MANAGER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_USERS,
    Permission.VIEW_SUBSCRIPTIONS,
    Permission.EDIT_SUBSCRIPTIONS,
    Permission.CANCEL_SUBSCRIPTIONS,
    Permission.VIEW_ORDERS,
    Permission.EDIT_ORDERS,
    Permission.VIEW_PAYMENTS,
    Permission.PROCESS_REFUNDS,
    Permission.VIEW_SUPPORT_TICKETS,
    Permission.RESPOND_TICKETS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_SETTINGS
  ],

  [AdminRole.SUPPORT]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_USERS,
    Permission.VIEW_SUBSCRIPTIONS,
    Permission.VIEW_ORDERS,
    Permission.VIEW_PAYMENTS,
    Permission.VIEW_SUPPORT_TICKETS,
    Permission.RESPOND_TICKETS,
    Permission.VIEW_ANALYTICS
  ],

  [AdminRole.VIEWER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_USERS,
    Permission.VIEW_SUBSCRIPTIONS,
    Permission.VIEW_ORDERS,
    Permission.VIEW_PAYMENTS,
    Permission.VIEW_SUPPORT_TICKETS,
    Permission.VIEW_ANALYTICS
  ]
}

// Status color mappings for UI
export const STATUS_COLORS = {
  [UserStatus.ACTIVE]: 'text-green-700 bg-green-50 border-green-200',
  [UserStatus.INACTIVE]: 'text-gray-700 bg-gray-50 border-gray-200',
  [UserStatus.SUSPENDED]: 'text-red-700 bg-red-50 border-red-200',
  [UserStatus.PENDING_VERIFICATION]: 'text-yellow-700 bg-yellow-50 border-yellow-200',

  [SubscriptionStatus.ACTIVE]: 'text-green-700 bg-green-50 border-green-200',
  [SubscriptionStatus.CANCELLED]: 'text-red-700 bg-red-50 border-red-200',
  [SubscriptionStatus.PAUSED]: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  [SubscriptionStatus.PENDING_PAYMENT]: 'text-orange-700 bg-orange-50 border-orange-200',
  [SubscriptionStatus.EXPIRED]: 'text-gray-700 bg-gray-50 border-gray-200',

  [OrderStatus.PENDING]: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  [OrderStatus.PROCESSING]: 'text-blue-700 bg-blue-50 border-blue-200',
  [OrderStatus.SHIPPED]: 'text-purple-700 bg-purple-50 border-purple-200',
  [OrderStatus.DELIVERED]: 'text-green-700 bg-green-50 border-green-200',
  [OrderStatus.CANCELLED]: 'text-red-700 bg-red-50 border-red-200',
  [OrderStatus.RETURNED]: 'text-orange-700 bg-orange-50 border-orange-200',

  [PaymentStatus.PENDING]: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  [PaymentStatus.CONFIRMED]: 'text-green-700 bg-green-50 border-green-200',
  [PaymentStatus.FAILED]: 'text-red-700 bg-red-50 border-red-200',
  [PaymentStatus.REFUNDED]: 'text-orange-700 bg-orange-50 border-orange-200',
  [PaymentStatus.CHARGEBACK]: 'text-red-900 bg-red-50 border-red-200',

  [TicketStatus.OPEN]: 'text-blue-700 bg-blue-50 border-blue-200',
  [TicketStatus.IN_PROGRESS]: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  [TicketStatus.WAITING_CUSTOMER]: 'text-purple-700 bg-purple-50 border-purple-200',
  [TicketStatus.RESOLVED]: 'text-green-700 bg-green-50 border-green-200',
  [TicketStatus.CLOSED]: 'text-gray-700 bg-gray-50 border-gray-200',
  [TicketStatus.ESCALATED]: 'text-red-700 bg-red-50 border-red-200',

  [TicketPriority.LOW]: 'text-gray-700 bg-gray-50 border-gray-200',
  [TicketPriority.NORMAL]: 'text-blue-700 bg-blue-50 border-blue-200',
  [TicketPriority.HIGH]: 'text-orange-700 bg-orange-50 border-orange-200',
  [TicketPriority.URGENT]: 'text-red-700 bg-red-50 border-red-200'
} as const

// Portuguese translations for status
export const STATUS_LABELS = {
  [UserStatus.ACTIVE]: 'Ativo',
  [UserStatus.INACTIVE]: 'Inativo',
  [UserStatus.SUSPENDED]: 'Suspenso',
  [UserStatus.PENDING_VERIFICATION]: 'Pendente Verificação',

  [SubscriptionStatus.ACTIVE]: 'Ativa',
  [SubscriptionStatus.CANCELLED]: 'Cancelada',
  [SubscriptionStatus.PAUSED]: 'Pausada',
  [SubscriptionStatus.PENDING_PAYMENT]: 'Pagamento Pendente',
  [SubscriptionStatus.EXPIRED]: 'Expirada',

  [OrderStatus.PENDING]: 'Pendente',
  [OrderStatus.PROCESSING]: 'Processando',
  [OrderStatus.SHIPPED]: 'Enviado',
  [OrderStatus.DELIVERED]: 'Entregue',
  [OrderStatus.CANCELLED]: 'Cancelado',
  [OrderStatus.RETURNED]: 'Devolvido',

  [PaymentStatus.PENDING]: 'Pendente',
  [PaymentStatus.CONFIRMED]: 'Confirmado',
  [PaymentStatus.FAILED]: 'Falhou',
  [PaymentStatus.REFUNDED]: 'Reembolsado',
  [PaymentStatus.CHARGEBACK]: 'Chargeback',

  [TicketStatus.OPEN]: 'Aberto',
  [TicketStatus.IN_PROGRESS]: 'Em Andamento',
  [TicketStatus.WAITING_CUSTOMER]: 'Aguardando Cliente',
  [TicketStatus.RESOLVED]: 'Resolvido',
  [TicketStatus.CLOSED]: 'Fechado',
  [TicketStatus.ESCALATED]: 'Escalado',

  [TicketPriority.LOW]: 'Baixa',
  [TicketPriority.NORMAL]: 'Normal',
  [TicketPriority.HIGH]: 'Alta',
  [TicketPriority.URGENT]: 'Urgente',

  [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
  [PaymentMethod.BOLETO]: 'Boleto',
  [PaymentMethod.PIX]: 'PIX',
  [PaymentMethod.BANK_TRANSFER]: 'Transferência Bancária'
} as const