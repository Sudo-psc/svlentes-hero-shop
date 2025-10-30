/**
 * Test Payment Fixtures
 * Pre-defined payments for E2E testing
 */

import { TEST_USER_A, TEST_USER_B } from './users.fixture.js'
import { SUBSCRIPTION_A, SUBSCRIPTION_B } from './subscriptions.fixture.js'

export interface TestPaymentFixture {
  id: string
  userId: string
  subscriptionId: string
  orderId: string
  transactionId: string
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'REFUNDED' | 'FAILED'
  paymentMethod: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  amount: number
  currency: string
  createdAt: Date
  paidAt?: Date
  cardLastFour?: string
  cardBrand?: string
}

/**
 * User A - Confirmed Credit Card Payment
 */
export const PAYMENT_A1: TestPaymentFixture = {
  id: 'test_payment_a1',
  userId: TEST_USER_A.id,
  subscriptionId: SUBSCRIPTION_A.id,
  orderId: 'test_order_a1',
  transactionId: 'asaas_txn_a1_001',
  status: 'CONFIRMED',
  paymentMethod: 'CREDIT_CARD',
  amount: 159.90,
  currency: 'BRL',
  createdAt: new Date('2024-09-01T00:00:00Z'),
  paidAt: new Date('2024-09-01T00:05:00Z'),
  cardLastFour: '4242',
  cardBrand: 'VISA'
}

/**
 * User A - Confirmed PIX Payment
 */
export const PAYMENT_A2: TestPaymentFixture = {
  id: 'test_payment_a2',
  userId: TEST_USER_A.id,
  subscriptionId: SUBSCRIPTION_A.id,
  orderId: 'test_order_a2',
  transactionId: 'asaas_txn_a2_002',
  status: 'CONFIRMED',
  paymentMethod: 'PIX',
  amount: 159.90,
  currency: 'BRL',
  createdAt: new Date('2024-10-01T00:00:00Z'),
  paidAt: new Date('2024-10-01T00:02:00Z')
}

/**
 * User A - Pending Boleto Payment
 */
export const PAYMENT_A3: TestPaymentFixture = {
  id: 'test_payment_a3',
  userId: TEST_USER_A.id,
  subscriptionId: SUBSCRIPTION_A.id,
  orderId: 'test_order_a2',
  transactionId: 'asaas_txn_a3_003',
  status: 'PENDING',
  paymentMethod: 'BOLETO',
  amount: 159.90,
  currency: 'BRL',
  createdAt: new Date('2024-11-01T00:00:00Z')
}

/**
 * User B - Confirmed Credit Card Payment
 */
export const PAYMENT_B1: TestPaymentFixture = {
  id: 'test_payment_b1',
  userId: TEST_USER_B.id,
  subscriptionId: SUBSCRIPTION_B.id,
  orderId: 'test_order_b1',
  transactionId: 'asaas_txn_b1_004',
  status: 'CONFIRMED',
  paymentMethod: 'CREDIT_CARD',
  amount: 449.90,
  currency: 'BRL',
  createdAt: new Date('2024-08-15T00:00:00Z'),
  paidAt: new Date('2024-08-15T00:10:00Z'),
  cardLastFour: '1111',
  cardBrand: 'MASTERCARD'
}

/**
 * All test payments
 */
export const ALL_TEST_PAYMENTS = [
  PAYMENT_A1,
  PAYMENT_A2,
  PAYMENT_A3,
  PAYMENT_B1
]
