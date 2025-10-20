/**
 * Cliente para integração com Asaas API v3
 * Documentação: https://docs.asaas.com
 */
import type {
  AsaasCustomer,
  AsaasSubscription,
  AsaasPayment,
  AsaasError,
  AsaasPaginatedResponse
} from '@/types/asaas'
class AsaasClient {
  private baseURL: string
  private apiKey: string
  private headers: HeadersInit
  constructor() {
    this.baseURL = process.env.ASAAS_ENV === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3'
    this.apiKey = process.env.ASAAS_ENV === 'production'
      ? process.env.ASAAS_API_KEY_PROD!
      : process.env.ASAAS_API_KEY_SANDBOX!
    this.headers = {
      'Content-Type': 'application/json',
      'access_token': this.apiKey,
      'User-Agent': 'SV-Lentes/1.0.0'
    }
  }
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: AsaasError = await response.json()
      throw new Error(
        error.errors?.[0]?.description ||
        `Asaas API Error: ${response.status} ${response.statusText}`
      )
    }
    return response.json()
  }
  // ========== CLIENTES ==========
  /**
   * Cria um novo cliente no Asaas
   */
  async createCustomer(data: {
    name: string
    cpfCnpj: string
    email: string
    phone?: string
    mobilePhone: string
    address?: string
    addressNumber?: string
    complement?: string
    province?: string
    postalCode?: string
    externalReference?: string
    notificationDisabled?: boolean
    observations?: string
  }): Promise<AsaasCustomer> {
    const response = await fetch(`${this.baseURL}/customers`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    })
    return this.handleResponse<AsaasCustomer>(response)
  }
  /**
   * Busca um cliente por ID
   */
  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    const response = await fetch(`${this.baseURL}/customers/${customerId}`, {
      method: 'GET',
      headers: this.headers
    })
    return this.handleResponse<AsaasCustomer>(response)
  }
  /**
   * Atualiza dados de um cliente
   */
  async updateCustomer(
    customerId: string,
    data: Partial<AsaasCustomer>
  ): Promise<AsaasCustomer> {
    const response = await fetch(`${this.baseURL}/customers/${customerId}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(data)
    })
    return this.handleResponse<AsaasCustomer>(response)
  }
  /**
   * Lista clientes com filtros opcionais
   */
  async listCustomers(params?: {
    email?: string
    cpfCnpj?: string
    offset?: number
    limit?: number
  }): Promise<AsaasPaginatedResponse<AsaasCustomer>> {
    const queryParams = new URLSearchParams()
    if (params?.email) queryParams.append('email', params.email)
    if (params?.cpfCnpj) queryParams.append('cpfCnpj', params.cpfCnpj)
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    const response = await fetch(
      `${this.baseURL}/customers?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: this.headers
      }
    )
    return this.handleResponse<AsaasPaginatedResponse<AsaasCustomer>>(response)
  }
  // ========== ASSINATURAS ==========
  /**
   * Cria uma nova assinatura
   */
  async createSubscription(data: {
    customer: string
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX'
    value: number
    nextDueDate: string // YYYY-MM-DD
    cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
    description?: string
    endDate?: string
    maxPayments?: number
    externalReference?: string
    split?: Array<{
      walletId: string
      percentualValue?: number
      fixedValue?: number
    }>
  }): Promise<AsaasSubscription> {
    const response = await fetch(`${this.baseURL}/subscriptions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    })
    return this.handleResponse<AsaasSubscription>(response)
  }
  /**
   * Busca uma assinatura por ID
   */
  async getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    const response = await fetch(`${this.baseURL}/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: this.headers
    })
    return this.handleResponse<AsaasSubscription>(response)
  }
  /**
   * Atualiza uma assinatura existente
   */
  async updateSubscription(
    subscriptionId: string,
    data: {
      value?: number
      nextDueDate?: string
      cycle?: string
      description?: string
      updatePendingPayments?: boolean
    }
  ): Promise<AsaasSubscription> {
    const response = await fetch(`${this.baseURL}/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(data)
    })
    return this.handleResponse<AsaasSubscription>(response)
  }
  /**
   * Cancela uma assinatura (soft delete)
   */
  async deleteSubscription(subscriptionId: string): Promise<{ deleted: boolean; id: string }> {
    const response = await fetch(`${this.baseURL}/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: this.headers
    })
    return this.handleResponse<{ deleted: boolean; id: string }>(response)
  }
  /**
   * Lista assinaturas com filtros opcionais
   */
  async listSubscriptions(params?: {
    customer?: string
    status?: string
    offset?: number
    limit?: number
  }): Promise<AsaasPaginatedResponse<AsaasSubscription>> {
    const queryParams = new URLSearchParams()
    if (params?.customer) queryParams.append('customer', params.customer)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    const response = await fetch(
      `${this.baseURL}/subscriptions?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: this.headers
      }
    )
    return this.handleResponse<AsaasPaginatedResponse<AsaasSubscription>>(response)
  }
  // ========== COBRANÇAS ==========
  /**
   * Cria uma nova cobrança avulsa
   */
  async createPayment(data: {
    customer: string
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX'
    value: number
    dueDate: string // YYYY-MM-DD
    description?: string
    externalReference?: string
    installmentCount?: number
    installmentValue?: number
    discount?: {
      value: number
      dueDateLimitDays?: number
      type?: 'FIXED' | 'PERCENTAGE'
    }
    interest?: {
      value: number
    }
    fine?: {
      value: number
    }
    postalService?: boolean
    split?: Array<{
      walletId: string
      percentualValue?: number
      fixedValue?: number
    }>
  }): Promise<AsaasPayment> {
    const response = await fetch(`${this.baseURL}/payments`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    })
    return this.handleResponse<AsaasPayment>(response)
  }
  /**
   * Busca uma cobrança por ID
   */
  async getPayment(paymentId: string): Promise<AsaasPayment> {
    const response = await fetch(`${this.baseURL}/payments/${paymentId}`, {
      method: 'GET',
      headers: this.headers
    })
    return this.handleResponse<AsaasPayment>(response)
  }
  /**
   * Busca uma cobrança por referência externa
   */
  async getPaymentByExternalReference(externalReference: string): Promise<AsaasPayment | null> {
    const response = await fetch(
      `${this.baseURL}/payments?externalReference=${externalReference}`,
      {
        method: 'GET',
        headers: this.headers
      }
    )
    const data = await this.handleResponse<AsaasPaginatedResponse<AsaasPayment>>(response)
    return data.data[0] || null
  }
  /**
   * Lista cobranças com filtros opcionais
   */
  async listPayments(params?: {
    customer?: string
    subscription?: string
    status?: string
    offset?: number
    limit?: number
  }): Promise<AsaasPaginatedResponse<AsaasPayment>> {
    const queryParams = new URLSearchParams()
    if (params?.customer) queryParams.append('customer', params.customer)
    if (params?.subscription) queryParams.append('subscription', params.subscription)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    const response = await fetch(
      `${this.baseURL}/payments?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: this.headers
      }
    )
    return this.handleResponse<AsaasPaginatedResponse<AsaasPayment>>(response)
  }
  /**
   * Estorna uma cobrança
   */
  async refundPayment(paymentId: string, value?: number): Promise<AsaasPayment> {
    const response = await fetch(`${this.baseURL}/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ value })
    })
    return this.handleResponse<AsaasPayment>(response)
  }
  /**
   * Atualiza uma cobrança pendente
   */
  async updatePayment(
    paymentId: string,
    data: {
      value?: number
      dueDate?: string
      description?: string
      interest?: { value: number }
      fine?: { value: number }
      discount?: {
        value: number
        dueDateLimitDays?: number
        type?: 'FIXED' | 'PERCENTAGE'
      }
    }
  ): Promise<AsaasPayment> {
    const response = await fetch(`${this.baseURL}/payments/${paymentId}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(data)
    })
    return this.handleResponse<AsaasPayment>(response)
  }
  /**
   * Deleta uma cobrança pendente
   */
  async deletePayment(paymentId: string): Promise<{ deleted: boolean; id: string }> {
    const response = await fetch(`${this.baseURL}/payments/${paymentId}`, {
      method: 'DELETE',
      headers: this.headers
    })
    return this.handleResponse<{ deleted: boolean; id: string }>(response)
  }
}
// Singleton instance
export const asaas = new AsaasClient()