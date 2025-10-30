/**
 * Test Order Fixtures
 * Pre-defined orders for E2E testing
 */

import { TEST_USER_A, TEST_USER_B } from './users.fixture.js'
import { SUBSCRIPTION_A, SUBSCRIPTION_B } from './subscriptions.fixture.js'

export interface TestOrderFixture {
  id: string
  userId: string
  subscriptionId: string
  orderNumber: string
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  createdAt: Date
  deliveredAt?: Date
  trackingCode?: string
  courier?: string
  items: {
    productName: string
    quantity: number
    unitPrice: number
  }[]
  totalPrice: number
  shippingAddress: {
    zipCode: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
  }
}

/**
 * User A - Delivered Order
 */
export const ORDER_A1: TestOrderFixture = {
  id: 'test_order_a1',
  userId: TEST_USER_A.id,
  subscriptionId: SUBSCRIPTION_A.id,
  orderNumber: 'ORD-2024-001',
  status: 'DELIVERED',
  createdAt: new Date('2024-09-01T00:00:00Z'),
  deliveredAt: new Date('2024-09-10T00:00:00Z'),
  trackingCode: 'BR123456789BR',
  courier: 'Correios',
  items: [
    {
      productName: 'Lentes de Contato Mensais - 30 unidades',
      quantity: 1,
      unitPrice: 159.90
    }
  ],
  totalPrice: 159.90,
  shippingAddress: {
    zipCode: '35300-000',
    street: 'Rua Principal',
    number: '100',
    complement: 'Apto 101',
    neighborhood: 'Centro',
    city: 'Caratinga',
    state: 'MG'
  }
}

/**
 * User A - Shipped Order
 */
export const ORDER_A2: TestOrderFixture = {
  id: 'test_order_a2',
  userId: TEST_USER_A.id,
  subscriptionId: SUBSCRIPTION_A.id,
  orderNumber: 'ORD-2024-002',
  status: 'SHIPPED',
  createdAt: new Date('2024-10-01T00:00:00Z'),
  trackingCode: 'BR987654321BR',
  courier: 'Correios',
  items: [
    {
      productName: 'Lentes de Contato Mensais - 30 unidades',
      quantity: 1,
      unitPrice: 159.90
    }
  ],
  totalPrice: 159.90,
  shippingAddress: {
    zipCode: '35300-000',
    street: 'Rua Principal',
    number: '100',
    complement: 'Apto 101',
    neighborhood: 'Centro',
    city: 'Caratinga',
    state: 'MG'
  }
}

/**
 * User B - Delivered Order
 */
export const ORDER_B1: TestOrderFixture = {
  id: 'test_order_b1',
  userId: TEST_USER_B.id,
  subscriptionId: SUBSCRIPTION_B.id,
  orderNumber: 'ORD-2024-003',
  status: 'DELIVERED',
  createdAt: new Date('2024-08-15T00:00:00Z'),
  deliveredAt: new Date('2024-08-25T00:00:00Z'),
  trackingCode: 'BR111222333BR',
  courier: 'Correios',
  items: [
    {
      productName: 'Lentes de Contato Mensais Premium - 90 unidades',
      quantity: 1,
      unitPrice: 449.90
    }
  ],
  totalPrice: 449.90,
  shippingAddress: {
    zipCode: '35301-000',
    street: 'Avenida Central',
    number: '200',
    neighborhood: 'Limoeiro',
    city: 'Caratinga',
    state: 'MG'
  }
}

/**
 * All test orders
 */
export const ALL_TEST_ORDERS = [
  ORDER_A1,
  ORDER_A2,
  ORDER_B1
]
