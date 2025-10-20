// Types para integração com Asaas API v3
export interface AsaasCustomer {
  id: string
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
  deleted?: boolean
}
export interface AsaasSubscription {
  id: string
  customer: string
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX'
  value: number
  nextDueDate: string
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
  description?: string
  status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE'
  deleted: boolean
  endDate?: string
  maxPayments?: number
  externalReference?: string
}
export interface AsaasPayment {
  id: string
  customer: string
  subscription?: string
  installment?: string
  dateCreated: string
  dueDate: string
  value: number
  netValue: number
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX'
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS'
  description?: string
  externalReference?: string
  confirmedDate?: string
  paymentDate?: string
  clientPaymentDate?: string
  installmentNumber?: number
  transactionReceiptUrl?: string
  nossoNumero?: string
  invoiceUrl?: string
  bankSlipUrl?: string
  invoiceNumber?: string
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
  deleted: boolean
  postalService: boolean
  anticipated: boolean
  refunds?: AsaasRefund[]
  pixTransaction?: {
    qrCode: {
      payload: string
      encodedImage: string
    }
    expirationDate: string
  }
}
export interface AsaasRefund {
  id: string
  status: string
  value: number
  description?: string
  transactionReceiptUrl?: string
}
export type AsaasWebhookEvent =
  | 'PAYMENT_CREATED'
  | 'PAYMENT_AWAITING_RISK_ANALYSIS'
  | 'PAYMENT_APPROVED_BY_RISK_ANALYSIS'
  | 'PAYMENT_REPROVED_BY_RISK_ANALYSIS'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED'
  | 'PAYMENT_ANTICIPATED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_RESTORED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_RECEIVED_IN_CASH_UNDONE'
  | 'PAYMENT_CHARGEBACK_REQUESTED'
  | 'PAYMENT_CHARGEBACK_DISPUTE'
  | 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
  | 'PAYMENT_DUNNING_RECEIVED'
  | 'PAYMENT_DUNNING_REQUESTED'
  | 'PAYMENT_BANK_SLIP_VIEWED'
  | 'PAYMENT_CHECKOUT_VIEWED'
export interface AsaasWebhookPayload {
  event: AsaasWebhookEvent
  payment: AsaasPayment
}
export interface AsaasError {
  errors: Array<{
    code: string
    description: string
  }>
}
export interface AsaasPaginatedResponse<T> {
  object: string
  hasMore: boolean
  totalCount: number
  limit: number
  offset: number
  data: T[]
}