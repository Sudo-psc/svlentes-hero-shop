import {
  AdminRole,
  Permission,
  UserStatus,
  SubscriptionStatus,
  OrderStatus,
  PaymentStatus,
  TicketStatus,
  TicketPriority,
  PaymentMethod
} from './enums'
// Base interfaces
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
// Admin User interfaces
export interface AdminUser extends BaseEntity {
  name: string
  email: string
  role: AdminRole
  permissions: Permission[]
  isActive: boolean
  lastLoginAt?: Date
  avatar?: string
  phone?: string
  department?: string
}
export interface CreateAdminUser {
  name: string
  email: string
  role: AdminRole
  password: string
  phone?: string
  department?: string
}
export interface UpdateAdminUser {
  name?: string
  email?: string
  role?: AdminRole
  isActive?: boolean
  phone?: string
  department?: string
}
// Customer User interfaces
export interface CustomerUser extends BaseEntity {
  name: string
  email: string
  phone: string
  cpf?: string
  status: UserStatus
  avatar?: string
  dateOfBirth?: Date
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  address?: Address
  emergencyContact?: EmergencyContact
  medicalInfo?: MedicalInfo
  subscription?: Subscription
  orders: Order[]
  supportTickets: SupportTicket[]
}
export interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  country?: string
}
export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}
export interface MedicalInfo {
  doctorName: string
  doctorCRM: string
  clinicPhone: string
  observations?: string
}
// Subscription interfaces
export interface Subscription extends BaseEntity {
  customerId: string
  customer: CustomerUser
  plan: SubscriptionPlan
  status: SubscriptionStatus
  startDate: Date
  endDate?: Date
  nextBillingDate?: Date
  cancelledAt?: Date
  pausedAt?: Date
  pauseReason?: string
  lensesPerMonth: number
  monthlyAmount: number
  asaasSubscriptionId?: string
  asaasCustomerId?: string
  deliveryAddress: Address
  deliveryFrequency: 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY'
  customInstructions?: string
}
export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  lensesPerMonth: number
  monthlyAmount: number
  isActive: boolean
  features: string[]
  lensType: 'DAILY' | 'MONTHLY' | 'BIFOCAL' | 'MULTIFOCAL'
}
export interface CreateSubscription {
  customerId: string
  planId: string
  lensesPerMonth: number
  monthlyAmount: number
  deliveryAddress: Address
  deliveryFrequency: 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY'
  customInstructions?: string
  startDate: Date
}
// Order interfaces
export interface Order extends BaseEntity {
  subscriptionId: string
  subscription: Subscription
  customerId: string
  customer: CustomerUser
  orderNumber: string
  status: OrderStatus
  items: OrderItem[]
  shippingAddress: Address
  trackingCode?: string
  carrier?: string
  estimatedDelivery?: Date
  deliveredAt?: Date
  totalAmount: number
  notes?: string
}
export interface OrderItem {
  id: string
  productType: 'LENSES_DAILY' | 'LENSES_MONTHLY' | 'SOLUTION' | 'ACCESSORIES'
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  prescription?: LensPrescription
}
export interface LensPrescription {
  eye: 'LEFT' | 'RIGHT' | 'BOTH'
  sphere: number
  cylinder?: number
  axis?: number
  addition?: number
  baseCurve?: number
  diameter?: number
  brand?: string
}
// Payment interfaces
export interface Payment extends BaseEntity {
  subscriptionId?: string
  subscription?: Subscription
  orderId?: string
  order?: Order
  customerId: string
  customer: CustomerUser
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  transactionId?: string
  asaasPaymentId?: string
  dueDate?: Date
  paidAt?: Date
  failedAt?: Date
  refundedAt?: Date
  chargebackAt?: Date
  refundAmount?: number
  failureReason?: string
  metadata?: Record<string, any>
}
// Support Ticket interfaces
export interface SupportTicket extends BaseEntity {
  customerId: string
  customer: CustomerUser
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: 'BILLING' | 'TECHNICAL' | 'DELIVERY' | 'PRODUCT' | 'ACCOUNT' | 'OTHER'
  assignedToId?: string
  assignedTo?: AdminUser
  interactions: TicketInteraction[]
  resolvedAt?: Date
  closedAt?: Date
  satisfactionRating?: number
  satisfactionComment?: string
}
export interface TicketInteraction extends BaseEntity {
  ticketId: string
  senderType: 'CUSTOMER' | 'ADMIN'
  senderId: string
  senderName: string
  message: string
  attachments?: string[]
  isInternal?: boolean
}
export interface CreateTicketInteraction {
  message: string
  attachments?: string[]
  isInternal?: boolean
}
// Analytics interfaces
export interface DashboardMetrics {
  totalCustomers: number
  activeSubscriptions: number
  monthlyRevenue: number
  monthlyGrowth: number
  pendingOrders: number
  openTickets: number
  recentSignups: number
  churnRate: number
  averageOrderValue: number
  customerLifetimeValue: number
}
export interface RevenueData {
  date: string
  revenue: number
  subscriptions: number
  orders: number
}
export interface CustomerGrowthData {
  date: string
  newCustomers: number
  totalCustomers: number
  churnedCustomers: number
}
export interface SubscriptionMetrics {
  active: number
  paused: number
  cancelled: number
  expired: number
  pendingPayment: number
}
export interface TopProduct {
  productName: string
  quantity: number
  revenue: number
}
// Filter and Search interfaces
export interface FilterOptions {
  search?: string
  status?: string | string[]
  dateRange?: {
    start: Date
    end: Date
  }
  category?: string
  priority?: string
  assignedTo?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
export interface TableColumn<T = any> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
  width?: string
}
// Settings interfaces
export interface SystemSettings {
  siteName: string
  siteUrl: string
  contactEmail: string
  supportPhone: string
  whatsappNumber: string
  address: Address
  businessHours: {
    weekdays: string
    weekends: string
  }
  paymentSettings: {
    asaasApiKey: string
    asaasWebhookToken: string
    sandboxMode: boolean
  }
  emailSettings: {
    resendApiKey: string
    fromEmail: string
    fromName: string
  }
  notificationSettings: {
    emailNotifications: boolean
    smsNotifications: boolean
    whatsappNotifications: boolean
  }
  securitySettings: {
    sessionTimeout: number
    maxLoginAttempts: number
    passwordMinLength: number
    requireTwoFactor: boolean
  }
}
// Activity Log interfaces
export interface ActivityLog extends BaseEntity {
  userId?: string
  user?: AdminUser | CustomerUser
  action: string
  resource: string
  resourceId: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}
// Export all types
export * from './enums'