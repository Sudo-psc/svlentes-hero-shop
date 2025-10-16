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
