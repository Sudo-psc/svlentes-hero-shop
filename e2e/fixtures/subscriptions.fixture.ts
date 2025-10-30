/**
 * Test Subscription Fixtures
 * Pre-defined subscriptions for E2E testing
 */

import { TEST_USER_A, TEST_USER_B } from './users.fixture.js'

export interface TestSubscriptionFixture {
  id: string
  userId: string
  planId: string
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED'
  startDate: Date
  nextBillingDate: Date
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  price: number
  shippingAddress: {
    zipCode: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    country: string
  }
  lensSpecifications: {
    rightEye: {
      sphere: number
      cylinder: number
      axis: number
      addition: number
    }
    leftEye: {
      sphere: number
      cylinder: number
      axis: number
      addition: number
    }
  }
}

/**
 * User A's Active Subscription
 */
export const SUBSCRIPTION_A: TestSubscriptionFixture = {
  id: 'test_sub_a_001',
  userId: TEST_USER_A.id,
  planId: 'monthly-basic',
  status: 'ACTIVE',
  startDate: new Date('2024-01-01T00:00:00Z'),
  nextBillingDate: new Date('2025-11-30T00:00:00Z'),
  billingCycle: 'MONTHLY',
  price: 159.90,
  shippingAddress: {
    zipCode: '35300-000',
    street: 'Rua Principal',
    number: '100',
    complement: 'Apto 101',
    neighborhood: 'Centro',
    city: 'Caratinga',
    state: 'MG',
    country: 'Brasil'
  },
  lensSpecifications: {
    rightEye: {
      sphere: -2.50,
      cylinder: -0.75,
      axis: 180,
      addition: 0
    },
    leftEye: {
      sphere: -2.25,
      cylinder: -0.50,
      axis: 175,
      addition: 0
    }
  }
}

/**
 * User B's Active Subscription
 */
export const SUBSCRIPTION_B: TestSubscriptionFixture = {
  id: 'test_sub_b_002',
  userId: TEST_USER_B.id,
  planId: 'quarterly-premium',
  status: 'ACTIVE',
  startDate: new Date('2024-01-15T00:00:00Z'),
  nextBillingDate: new Date('2025-10-15T00:00:00Z'),
  billingCycle: 'QUARTERLY',
  price: 449.90,
  shippingAddress: {
    zipCode: '35301-000',
    street: 'Avenida Central',
    number: '200',
    neighborhood: 'Limoeiro',
    city: 'Caratinga',
    state: 'MG',
    country: 'Brasil'
  },
  lensSpecifications: {
    rightEye: {
      sphere: -3.00,
      cylinder: -1.00,
      axis: 90,
      addition: 0
    },
    leftEye: {
      sphere: -2.75,
      cylinder: -0.75,
      axis: 85,
      addition: 0
    }
  }
}

/**
 * All test subscriptions
 */
export const ALL_TEST_SUBSCRIPTIONS = [
  SUBSCRIPTION_A,
  SUBSCRIPTION_B
]
