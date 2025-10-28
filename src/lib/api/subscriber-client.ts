/**
 * Subscriber API Client
 *
 * Centralized client for subscriber area API operations
 * Handles authentication, error handling, and type safety
 *
 * @author Dr. Philipe Saraiva Cruz
 * @version 1.0.0
 */

import type { User } from 'firebase/auth'
import type { PricingPlan } from '@/types'

/**
 * Address data for subscription updates
 */
export interface AddressData {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

/**
 * Payment data for subscription updates
 */
export interface PaymentData {
  paymentMethod: 'credit_card' | 'pix' | 'boleto'
  cardNumber?: string
  cardHolderName?: string
  cardExpiryDate?: string
  cardCvv?: string
}

/**
 * API error with additional context
 */
export class SubscriberAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string
  ) {
    super(message)
    this.name = 'SubscriberAPIError'
  }
}

/**
 * Get authentication token from Firebase user
 */
async function getAuthToken(user: User | null): Promise<string> {
  if (!user) {
    throw new SubscriberAPIError('Usuário não autenticado', 401, 'UNAUTHORIZED')
  }

  try {
    return await user.getIdToken()
  } catch (error) {
    throw new SubscriberAPIError(
      'Erro ao obter token de autenticação',
      401,
      'TOKEN_ERROR'
    )
  }
}

/**
 * Make authenticated API request
 */
async function makeAuthenticatedRequest<T>(
  endpoint: string,
  user: User | null,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken(user)

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new SubscriberAPIError(
      errorData.error || errorData.message || 'Erro na requisição',
      response.status,
      errorData.error
    )
  }

  return response.json()
}

/**
 * Subscriber API Client
 *
 * Provides type-safe methods for all subscriber area operations
 */
export class SubscriberAPIClient {
  constructor(private user: User | null) {}

  /**
   * Change subscription plan
   */
  async changePlan(newPlanId: string): Promise<{ success: boolean; message: string }> {
    return makeAuthenticatedRequest(
      '/api/subscription/change-plan',
      this.user,
      {
        method: 'POST',
        body: JSON.stringify({ newPlanId }),
      }
    )
  }

  /**
   * Update shipping address
   */
  async updateAddress(addressData: AddressData): Promise<{ success: boolean; message: string }> {
    return makeAuthenticatedRequest(
      '/api/subscription/update-address',
      this.user,
      {
        method: 'POST',
        body: JSON.stringify(addressData),
      }
    )
  }

  /**
   * Update payment method
   */
  async updatePayment(paymentData: PaymentData): Promise<{ success: boolean; message: string }> {
    return makeAuthenticatedRequest(
      '/api/subscription/update-payment',
      this.user,
      {
        method: 'POST',
        body: JSON.stringify(paymentData),
      }
    )
  }

  /**
   * Fetch subscription data
   */
  async getSubscription(): Promise<any> {
    return makeAuthenticatedRequest(
      '/api/assinante/subscription',
      this.user,
      { method: 'GET' }
    )
  }

  /**
   * Fetch orders history
   */
  async getOrders(params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<any> {
    const queryString = params
      ? '?' + new URLSearchParams(params as any).toString()
      : ''

    return makeAuthenticatedRequest(
      `/api/assinante/orders${queryString}`,
      this.user,
      { method: 'GET' }
    )
  }

  /**
   * Fetch invoices
   */
  async getInvoices(params?: {
    page?: number
    limit?: number
    startDate?: string
    endDate?: string
  }): Promise<any> {
    const queryString = params
      ? '?' + new URLSearchParams(params as any).toString()
      : ''

    return makeAuthenticatedRequest(
      `/api/assinante/invoices${queryString}`,
      this.user,
      { method: 'GET' }
    )
  }

  /**
   * Upload prescription
   */
  async uploadPrescription(file: File, metadata?: {
    validUntil?: string
    notes?: string
  }): Promise<{ success: boolean; prescriptionId: string }> {
    const formData = new FormData()
    formData.append('file', file)
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata))
    }

    const token = await getAuthToken(this.user)

    const response = await fetch('/api/assinante/prescription', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new SubscriberAPIError(
        errorData.error || 'Erro ao enviar prescrição',
        response.status
      )
    }

    return response.json()
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(params?: {
    page?: number
    limit?: number
    status?: string
    startDate?: string
    endDate?: string
  }): Promise<any> {
    const queryString = params
      ? '?' + new URLSearchParams(params as any).toString()
      : ''

    return makeAuthenticatedRequest(
      `/api/assinante/payment-history${queryString}`,
      this.user,
      { method: 'GET' }
    )
  }

  /**
   * Get delivery preferences
   */
  async getDeliveryPreferences(): Promise<any> {
    return makeAuthenticatedRequest(
      '/api/assinante/delivery-preferences',
      this.user,
      { method: 'GET' }
    )
  }

  /**
   * Update delivery preferences
   */
  async updateDeliveryPreferences(preferences: {
    preferredDeliveryTime?: string
    deliveryInstructions?: string
    notifyBeforeDelivery?: boolean
    alternativePhone?: string
  }): Promise<{ success: boolean; message: string }> {
    return makeAuthenticatedRequest(
      '/api/assinante/delivery-preferences',
      this.user,
      {
        method: 'PUT',
        body: JSON.stringify(preferences),
      }
    )
  }
}

/**
 * Create a subscriber API client instance
 *
 * @param user - Firebase authenticated user
 * @returns SubscriberAPIClient instance
 *
 * @example
 * const client = createSubscriberClient(authUser)
 * await client.changePlan('plan-premium')
 */
export function createSubscriberClient(user: User | null): SubscriberAPIClient {
  return new SubscriberAPIClient(user)
}
