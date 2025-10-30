/**
 * E2E Tests: Subscriber Authorization
 * Tests to ensure users can only access their own subscription data (cross-user access prevention)
 */

import { test, expect } from '@playwright/test'
import {
  createTestUser,
  createSubscription,
  getAuthToken,
  cleanupTestUser,
  type TestUser
} from './helpers/test-utils'

test.describe('Authorization - Cross-User Access Prevention', () => {
  let userA: TestUser
  let userB: TestUser
  let userASubscriptionId: string
  let userBSubscriptionId: string

  test.beforeAll(async ({ request }) => {
    // Create two test users with subscriptions
    userA = await createTestUser('userA_auth@test.svlentes.shop')
    userB = await createTestUser('userB_auth@test.svlentes.shop')

    // Create subscriptions for both users
    try {
      userASubscriptionId = await createSubscription(request, userA.authToken)
      userBSubscriptionId = await createSubscription(request, userB.authToken)
    } catch (error) {
      console.warn('Failed to create test subscriptions:', error)
      // Tests will skip if subscriptions can't be created
    }
  })

  test.describe('GET /api/assinante/subscription - Read Access Control', () => {
    test('User A cannot access User B subscription', async ({ request }) => {
      test.skip(!userBSubscriptionId, 'Subscription not created')

      const response = await request.get(
        `/api/assinante/subscription?id=${userBSubscriptionId}`,
        {
          headers: { 'Authorization': `Bearer ${userA.authToken}` }
        }
      )

      // Should return 403 FORBIDDEN, not 404 (which would leak existence)
      expect(response.status()).toBe(403)

      const body = await response.json()
      expect(body.error).toBeTruthy()
      expect(body.message).toMatch(/acesso negado|não autorizado|forbidden/i)
    })

    test('User A CAN access their own subscription', async ({ request }) => {
      test.skip(!userASubscriptionId, 'Subscription not created')

      const response = await request.get(
        `/api/assinante/subscription?id=${userASubscriptionId}`,
        {
          headers: { 'Authorization': `Bearer ${userA.authToken}` }
        }
      )

      expect(response.status()).toBe(200)

      const body = await response.json()
      expect(body.subscription).toBeTruthy()
      expect(body.subscription.id).toBe(userASubscriptionId)
    })

    test('User B cannot access User A subscription', async ({ request }) => {
      test.skip(!userASubscriptionId, 'Subscription not created')

      const response = await request.get(
        `/api/assinante/subscription?id=${userASubscriptionId}`,
        {
          headers: { 'Authorization': `Bearer ${userB.authToken}` }
        }
      )

      expect(response.status()).toBe(403)

      const body = await response.json()
      expect(body.error).toBeTruthy()
    })

    test('Unauthenticated request returns 401', async ({ request }) => {
      const response = await request.get(
        `/api/assinante/subscription?id=${userASubscriptionId}`
      )

      expect(response.status()).toBe(401)

      const body = await response.json()
      expect(body.error).toBe('UNAUTHORIZED')
    })

    test('Invalid token returns 401', async ({ request }) => {
      const response = await request.get(
        `/api/assinante/subscription?id=${userASubscriptionId}`,
        {
          headers: { 'Authorization': 'Bearer invalid_token_12345' }
        }
      )

      expect(response.status()).toBe(401)
    })
  })

  test.describe('PUT /api/assinante/subscription - Update Access Control', () => {
    test('User A cannot update User B shipping address', async ({ request }) => {
      test.skip(!userBSubscriptionId, 'Subscription not created')

      const response = await request.put('/api/assinante/subscription', {
        headers: {
          'Authorization': `Bearer ${userA.authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          subscriptionId: userBSubscriptionId,
          shippingAddress: {
            zipCode: '12345-678',
            street: 'Rua Hacked',
            number: '666',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP'
          }
        }
      })

      expect(response.status()).toBe(403)

      const body = await response.json()
      expect(body.error).toBeTruthy()
      expect(body.message).toMatch(/acesso negado|não autorizado|forbidden/i)
    })

    test('User A CAN update their own shipping address', async ({ request }) => {
      test.skip(!userASubscriptionId, 'Subscription not created')

      const response = await request.put('/api/assinante/subscription', {
        headers: {
          'Authorization': `Bearer ${userA.authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          subscriptionId: userASubscriptionId,
          shippingAddress: {
            zipCode: '35300-000',
            street: 'Rua Legítima',
            number: '100',
            neighborhood: 'Centro',
            city: 'Caratinga',
            state: 'MG'
          }
        }
      })

      expect(response.status()).toBe(200)

      const body = await response.json()
      expect(body.success).toBeTruthy()
      expect(body.subscription?.shippingAddress?.street).toBe('Rua Legítima')
    })
  })

  test.describe('GET /api/assinante/payment-history - Payment Access Control', () => {
    test('User B cannot access User A payment history', async ({ request }) => {
      test.skip(!userASubscriptionId, 'Subscription not created')

      const response = await request.get(
        `/api/assinante/payment-history?subscriptionId=${userASubscriptionId}`,
        {
          headers: { 'Authorization': `Bearer ${userB.authToken}` }
        }
      )

      expect(response.status()).toBe(403)
    })

    test('User A CAN access their own payment history', async ({ request }) => {
      test.skip(!userASubscriptionId, 'Subscription not created')

      const response = await request.get(
        `/api/assinante/payment-history?subscriptionId=${userASubscriptionId}`,
        {
          headers: { 'Authorization': `Bearer ${userA.authToken}` }
        }
      )

      expect([200, 404]).toContain(response.status()) // 404 if no payments yet
    })
  })

  test.describe('GET /api/assinante/orders - Order Access Control', () => {
    test('User A cannot access User B orders', async ({ request }) => {
      test.skip(!userBSubscriptionId, 'Subscription not created')

      const response = await request.get(
        `/api/assinante/orders?subscriptionId=${userBSubscriptionId}`,
        {
          headers: { 'Authorization': `Bearer ${userA.authToken}` }
        }
      )

      expect(response.status()).toBe(403)
    })

    test('User B CAN access their own orders', async ({ request }) => {
      test.skip(!userBSubscriptionId, 'Subscription not created')

      const response = await request.get(
        `/api/assinante/orders?subscriptionId=${userBSubscriptionId}`,
        {
          headers: { 'Authorization': `Bearer ${userB.authToken}` }
        }
      )

      expect([200, 404]).toContain(response.status())
    })
  })

  test.describe('GET /api/assinante/invoices - Invoice Access Control', () => {
    test('User A cannot access User B invoices', async ({ request }) => {
      test.skip(!userBSubscriptionId, 'Subscription not created')

      const response = await request.get(
        `/api/assinante/invoices?subscriptionId=${userBSubscriptionId}`,
        {
          headers: { 'Authorization': `Bearer ${userA.authToken}` }
        }
      )

      expect(response.status()).toBe(403)
    })

    test('User A CAN access their own invoices', async ({ request }) => {
      test.skip(!userASubscriptionId, 'Subscription not created')

      const response = await request.get(
        `/api/assinante/invoices?subscriptionId=${userASubscriptionId}`,
        {
          headers: { 'Authorization': `Bearer ${userA.authToken}` }
        }
      )

      expect([200, 404]).toContain(response.status())
    })
  })

  test.describe('PUT /api/assinante/delivery-preferences - Preferences Access Control', () => {
    test('User B cannot update User A delivery preferences', async ({ request }) => {
      test.skip(!userASubscriptionId, 'Subscription not created')

      const response = await request.put('/api/assinante/delivery-preferences', {
        headers: {
          'Authorization': `Bearer ${userB.authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          subscriptionId: userASubscriptionId,
          notificationPhone: '(11) 98765-4321',
          deliveryInstructions: 'Malicious instructions'
        }
      })

      expect(response.status()).toBe(403)
    })

    test('User B CAN update their own delivery preferences', async ({ request }) => {
      test.skip(!userBSubscriptionId, 'Subscription not created')

      const response = await request.put('/api/assinante/delivery-preferences', {
        headers: {
          'Authorization': `Bearer ${userB.authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          subscriptionId: userBSubscriptionId,
          notificationPhone: '(33) 99999-8888',
          deliveryInstructions: 'Deixar com porteiro'
        }
      })

      expect([200, 201]).toContain(response.status())
    })
  })

  test.describe('POST /api/assinante/prescription - Prescription Upload Access Control', () => {
    test('User A cannot upload prescription for User B subscription', async ({ request }) => {
      test.skip(!userBSubscriptionId, 'Subscription not created')

      // Generate a small test PDF
      const testPDF = 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Cj4+Cj4+CmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2NCAwMDAwMCBuIAowMDAwMDAwMTQ4IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNAovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKMjI1CiUlRU9G'

      const response = await request.post('/api/assinante/prescription', {
        headers: {
          'Authorization': `Bearer ${userA.authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          subscriptionId: userBSubscriptionId,
          file: testPDF,
          fileName: 'receita-malicious.pdf',
          mimeType: 'application/pdf'
        }
      })

      expect(response.status()).toBe(403)
    })

    test('User A CAN upload prescription for their own subscription', async ({ request }) => {
      test.skip(!userASubscriptionId, 'Subscription not created')

      const testPDF = 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Cj4+Cj4+CmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2NCAwMDAwMCBuIAowMDAwMDAwMTQ4IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNAovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKMjI1CiUlRU9G'

      const response = await request.post('/api/assinante/prescription', {
        headers: {
          'Authorization': `Bearer ${userA.authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          subscriptionId: userASubscriptionId,
          file: testPDF,
          fileName: 'receita-legit.pdf',
          mimeType: 'application/pdf'
        }
      })

      expect([200, 201]).toContain(response.status())
    })
  })

  test.describe('Dashboard Metrics Access Control', () => {
    test('User cannot access dashboard metrics with invalid subscription', async ({ request }) => {
      const fakeSubscriptionId = 'fake_sub_12345'

      const response = await request.get(
        `/api/assinante/dashboard-metrics?subscriptionId=${fakeSubscriptionId}`,
        {
          headers: { 'Authorization': `Bearer ${userA.authToken}` }
        }
      )

      expect([403, 404]).toContain(response.status())
    })

    test('User CAN access their own dashboard metrics', async ({ request }) => {
      test.skip(!userASubscriptionId, 'Subscription not created')

      const response = await request.get(
        `/api/assinante/dashboard-metrics?subscriptionId=${userASubscriptionId}`,
        {
          headers: { 'Authorization': `Bearer ${userA.authToken}` }
        }
      )

      expect([200, 201]).toContain(response.status())
    })
  })

  test.describe('Delivery Timeline Access Control', () => {
    test('User cannot access another user delivery timeline', async ({ request }) => {
      test.skip(!userBSubscriptionId, 'Subscription not created')

      const response = await request.get(
        `/api/assinante/delivery-timeline?subscriptionId=${userBSubscriptionId}`,
        {
          headers: { 'Authorization': `Bearer ${userA.authToken}` }
        }
      )

      expect(response.status()).toBe(403)
    })

    test('User CAN access their own delivery timeline', async ({ request }) => {
      test.skip(!userASubscriptionId, 'Subscription not created')

      const response = await request.get(
        `/api/assinante/delivery-timeline?subscriptionId=${userASubscriptionId}`,
        {
          headers: { 'Authorization': `Bearer ${userA.authToken}` }
        }
      )

      expect([200, 404]).toContain(response.status())
    })
  })

  // Cleanup after all tests
  test.afterAll(async ({ request }) => {
    const adminToken = await getAuthToken()

    if (userA?.userId) {
      await cleanupTestUser(request, userA.userId, adminToken)
    }

    if (userB?.userId) {
      await cleanupTestUser(request, userB.userId, adminToken)
    }
  })
})
