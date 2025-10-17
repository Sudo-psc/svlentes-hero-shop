/**
 * Subscription Types
 * Types for subscription data, benefits, and related entities
 */

export interface SubscriptionBenefit {
  id: string
  name: string
  description: string | null
  icon: string | null
  type: string
  quantityTotal: number | null
  quantityUsed: number | null
  expirationDate: string | null
}

export interface SubscriptionPlan {
  name: string
  price: number
  billingCycle: string
}

export interface ShippingAddress {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

export interface Subscription {
  id: string
  status: 'active' | 'inactive' | 'cancelled' | 'paused'
  plan: SubscriptionPlan
  currentPeriodStart: string
  currentPeriodEnd: string
  nextBillingDate: string
  benefits: SubscriptionBenefit[]
  shippingAddress: ShippingAddress | null
  paymentMethod: string | null
  paymentMethodLast4: string | null
  createdAt: string
  updatedAt: string
}

export interface SubscriptionUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

export interface SubscriptionResponse {
  subscription: Subscription | null
  user: SubscriptionUser
}

export interface SubscriptionError {
  error: string
  message: string
}

export type SubscriptionStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error'

/**
 * Tipos para o fluxo de assinatura (SubscriptionFlow)
 */

export interface EyePrescription {
  sphere: string | number
  cylinder?: string | number
  axis?: string | number
}

export interface LensData {
  type: 'daily' | 'weekly' | 'monthly'
  brand?: string
  rightEye: EyePrescription
  leftEye: EyePrescription
  prescriptionDate?: string | Date
  doctorCRM?: string
  doctorName?: string
}

export interface ContactData {
  name: string
  email: string
  phone: string
  cpfCnpj: string
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  acceptsTerms: boolean
  acceptsDataProcessing?: boolean
  acceptsMarketingCommunication?: boolean
}

export interface FlowData {
  planId: string | null
  billingCycle: 'monthly' | 'annual'
  lensData: LensData | null
  addOns: string[]
}

export interface ValidationError {
  field: string
  message: string
}

export interface FormValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface AddOnOption {
  id: string
  name: string
  description: string
  price: number
  category?: 'accessory' | 'service' | 'insurance'
}

export interface PlanOption {
  id: string
  name: string
  description: string
  priceMonthly: number
  priceAnnual: number
  features: string[]
  includedConsultations: number
  recommended?: boolean
}

export interface PaymentRequest {
  planId: string
  billingInterval: 'monthly' | 'annual'
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  customerData: {
    name: string
    email: string
    phone: string
    cpfCnpj: string
  }
  metadata: {
    lensData: string
    addOns: string
    source: string
    consentTimestamp?: string
  }
}

export interface PaymentResponse {
  success: boolean
  invoiceUrl?: string
  paymentId?: string
  error?: string
}
