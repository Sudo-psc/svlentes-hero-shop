interface AsaasConfig {
    apiKey: string
    environment: 'sandbox' | 'production'
}

interface AsaasCustomer {
    name: string
    email: string
    phone?: string
    mobilePhone?: string
    cpfCnpj?: string
    postalCode?: string
    address?: string
    addressNumber?: string
    complement?: string
    province?: string
    externalReference?: string
    notificationDisabled?: boolean
    additionalEmails?: string
    municipalInscription?: string
    stateInscription?: string
    observations?: string
}

interface AsaasPayment {
    customer: string
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'DEBIT_CARD'
    value: number
    dueDate: string
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
        type?: 'FIXED' | 'PERCENTAGE'
    }
    postalService?: boolean
}

interface AsaasPaymentResponse {
    object: string
    id: string
    dateCreated: string
    customer: string
    value: number
    netValue: number
    description?: string
    billingType: string
    status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED'
    dueDate: string
    originalDueDate: string
    invoiceUrl: string
    bankSlipUrl?: string
    invoiceNumber?: string
    externalReference?: string
    deleted: boolean
}

export class AsaasClient {
    private apiKey: string
    private baseUrl: string

    constructor(config: AsaasConfig) {
        this.apiKey = config.apiKey
        this.baseUrl = config.environment === 'production'
            ? 'https://api.asaas.com/v3'
            : 'https://sandbox.asaas.com/api/v3'
    }

    private async request<T>(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        body?: any
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'access_token': this.apiKey,
        }

        const options: RequestInit = {
            method,
            headers,
        }

        if (body && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(body)
        }

        try {
            const response = await fetch(url, options)

            if (!response.ok) {
                const error = await response.json()
                throw new Error(
                    `ASAAS API Error: ${response.status} - ${JSON.stringify(error)}`
                )
            }

            return await response.json()
        } catch (error) {
            console.error('ASAAS API Request Failed:', error)
            throw error
        }
    }

    async createCustomer(customerData: AsaasCustomer): Promise<any> {
        return this.request('/customers', 'POST', customerData)
    }

    async getCustomer(customerId: string): Promise<any> {
        return this.request(`/customers/${customerId}`, 'GET')
    }

    async updateCustomer(customerId: string, customerData: Partial<AsaasCustomer>): Promise<any> {
        return this.request(`/customers/${customerId}`, 'PUT', customerData)
    }

    async deleteCustomer(customerId: string): Promise<void> {
        return this.request(`/customers/${customerId}`, 'DELETE')
    }

    async listCustomers(filters?: {
        email?: string
        cpfCnpj?: string
        offset?: number
        limit?: number
    }): Promise<{ data: any[]; totalCount: number }> {
        const queryParams = new URLSearchParams()

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryParams.append(key, String(value))
                }
            })
        }

        const query = queryParams.toString()
        return this.request(`/customers${query ? `?${query}` : ''}`, 'GET')
    }

    async createPayment(paymentData: AsaasPayment): Promise<AsaasPaymentResponse> {
        return this.request('/payments', 'POST', paymentData)
    }

    async getPayment(paymentId: string): Promise<AsaasPaymentResponse> {
        return this.request(`/payments/${paymentId}`, 'GET')
    }

    async listPayments(filters?: {
        customer?: string
        billingType?: string
        status?: string
        subscription?: string
        offset?: number
        limit?: number
    }): Promise<{ data: AsaasPaymentResponse[]; totalCount: number }> {
        const queryParams = new URLSearchParams()

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryParams.append(key, String(value))
                }
            })
        }

        const query = queryParams.toString()
        return this.request(`/payments${query ? `?${query}` : ''}`, 'GET')
    }

    async deletePayment(paymentId: string): Promise<void> {
        return this.request(`/payments/${paymentId}`, 'DELETE')
    }

    async refundPayment(paymentId: string, value?: number, description?: string): Promise<any> {
        return this.request(`/payments/${paymentId}/refund`, 'POST', {
            value,
            description
        })
    }

    async createSubscription(subscriptionData: {
        customer: string
        billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX'
        value: number
        nextDueDate: string
        cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
        description?: string
        externalReference?: string
        discount?: {
            value: number
            type?: 'FIXED' | 'PERCENTAGE'
        }
    }): Promise<any> {
        return this.request('/subscriptions', 'POST', subscriptionData)
    }

    async getSubscription(subscriptionId: string): Promise<any> {
        return this.request(`/subscriptions/${subscriptionId}`, 'GET')
    }

    async updateSubscription(subscriptionId: string, updateData: any): Promise<any> {
        return this.request(`/subscriptions/${subscriptionId}`, 'PUT', updateData)
    }

    async deleteSubscription(subscriptionId: string): Promise<void> {
        return this.request(`/subscriptions/${subscriptionId}`, 'DELETE')
    }

    async getPixQrCode(paymentId: string): Promise<{
        encodedImage: string
        payload: string
        expirationDate: string
    }> {
        return this.request(`/payments/${paymentId}/pixQrCode`, 'GET')
    }
}

import { APP_CONFIG } from './constants'

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                   (typeof window === 'undefined' && !APP_CONFIG.asaas.apiKeySandbox && !APP_CONFIG.asaas.apiKeyProduction)

const getApiKey = (): string => {
    if (isBuildTime) {
        return 'build-time-placeholder'
    }
    
    const env = APP_CONFIG.asaas.environment
    
    if (env === 'production') {
        const key = APP_CONFIG.asaas.apiKeyProduction
        if (!key) {
            throw new Error('ASAAS_API_KEY_PROD is not defined')
        }
        return key
    } else {
        const key = APP_CONFIG.asaas.apiKeySandbox
        if (!key) {
            throw new Error('ASAAS_API_KEY_SANDBOX is not defined')
        }
        return key
    }
}

// Lazy initialization of ASAAS client
let asaasInstance: AsaasClient | null = null

export const getAsaasClient = (): AsaasClient => {
    // During build, return a dummy client that will never be used
    if (isBuildTime) {
        throw new Error('ASAAS client cannot be used during build time')
    }
    
    if (!asaasInstance) {
        const apiKey = getApiKey()
        if (apiKey === 'build-time-placeholder') {
            throw new Error('ASAAS API keys are not configured. Please set ASAAS_API_KEY_SANDBOX or ASAAS_API_KEY_PROD in environment variables.')
        }
        asaasInstance = new AsaasClient({
            apiKey,
            environment: APP_CONFIG.asaas.environment
        })
    }
    return asaasInstance
}

// Create a completely lazy proxy that doesn't initialize anything until actually used
let proxyInstance: AsaasClient | null = null

export const asaas = new Proxy({} as AsaasClient, {
    get(target, prop, receiver) {
        if (!proxyInstance) {
            proxyInstance = getAsaasClient()
        }
        return Reflect.get(proxyInstance, prop, receiver)
    }
})

export type {
    AsaasConfig,
    AsaasCustomer,
    AsaasPayment,
    AsaasPaymentResponse
}
