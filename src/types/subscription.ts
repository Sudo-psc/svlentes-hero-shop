// Tipos para gestão de assinaturas

export interface Subscription {
  id: string
  userId: string
  email: string
  displayName: string
  plan: 'monthly' | 'annual'
  status: 'active' | 'cancelled' | 'paused' | 'pending' | 'overdue'
  lensType: string
  bothEyes: boolean
  differentGrades: boolean
  monthlyPrice: number
  nextBillingDate: string
  startDate: string
  endDate?: string
  cancelReason?: string
  paymentMethod: PaymentMethod
  deliveryAddress: DeliveryAddress
  contactInfo: ContactInfo
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
}

export interface PaymentMethod {
  id: string
  type: 'credit_card' | 'debit_card' | 'pix' | 'boleto'
  brand?: string
  last4?: string
  expiryMonth?: string
  expiryYear?: string
  holderName: string
  isDefault: boolean
  asaasCardId?: string
  createdAt: string
}

export interface DeliveryAddress {
  id: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  isDefault: boolean
}

export interface ContactInfo {
  phone: string
  whatsapp: string
  email: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}

export interface Order {
  id: string
  subscriptionId: string
  type: 'subscription' | 'one_time'
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items: OrderItem[]
  totalAmount: number
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: PaymentMethod
  shippingAddress: DeliveryAddress
  trackingCode?: string
  estimatedDelivery?: string
  createdAt: string
  deliveredAt?: string
  notes?: string
}

export interface OrderItem {
  id: string
  name: string
  description?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  sku?: string
  category?: string
}

export interface Invoice {
  id: string
  subscriptionId: string
  orderId?: string
  type: 'subscription' | 'one_time' | 'adjustment'
  amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  dueDate: string
  paidAt?: string
  paymentMethod: PaymentMethod
  items: InvoiceItem[]
  taxes: number
  discounts: number
  pdfUrl?: string
  createdAt: string
}

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface SubscriptionAnalytics {
  totalSubscribers: number
  activeSubscribers: number
  churnRate: number
  monthlyRevenue: number
  annualRevenue: number
  averageRevenuePerUser: number
  planDistribution: {
    monthly: number
    annual: number
  }
  recentActivity: Activity[]
}

export interface Activity {
  id: string
  type: 'subscription_created' | 'subscription_cancelled' | 'payment_success' | 'payment_failed' | 'plan_changed'
  description: string
  timestamp: string
  userId: string
  metadata?: Record<string, any>
}

export interface SupportTicket {
  id: string
  userId: string
  subject: string
  description: string
  category: 'billing' | 'technical' | 'delivery' | 'general'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  responses: SupportResponse[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface SupportResponse {
  id: string
  userId?: string
  adminId?: string
  message: string
  isFromUser: boolean
  attachments?: string[]
  createdAt: string
}

// Airtable field mappings
export interface AirtableSubscriptionRecord {
  id: string
  fields: {
    'User ID': string
    'Email': string
    'Display Name': string
    'Plan': 'Monthly' | 'Annual'
    'Status': 'Active' | 'Cancelled' | 'Paused' | 'Pending' | 'Overdue'
    'Lens Type': string
    'Both Eyes': boolean
    'Different Grades': boolean
    'Monthly Price': number
    'Next Billing Date': string
    'Start Date': string
    'End Date'?: string
    'Cancel Reason'?: string
    'Payment Method': string
    'Delivery Address': string
    'Contact Info': string
    'Created At': string
    'Updated At': string
    'Metadata'?: string
  }
}

export interface SubscriptionUpdateData {
  plan?: 'monthly' | 'annual'
  status?: 'active' | 'cancelled' | 'paused'
  paymentMethod?: Partial<PaymentMethod>
  deliveryAddress?: Partial<DeliveryAddress>
  contactInfo?: Partial<ContactInfo>
  cancelReason?: string
}

export interface PlanChangeRequest {
  currentPlan: 'monthly' | 'annual'
  newPlan: 'monthly' | 'annual'
  effectiveDate: 'immediate' | 'next_billing'
  reason?: string
}