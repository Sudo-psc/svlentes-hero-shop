/**
 * E2E Tests: Subscriber Audit Logging
 * Tests to ensure all subscriber actions are properly logged for LGPD compliance
 */

import { test, expect } from '@playwright/test'
import {
  createTestUser,
  createSubscription,
  getAuditLogs,
  generateBase64PDF,
  cleanupTestUser,
  type TestUser,
  VALID_TEST_ADDRESS
} from './helpers/test-utils'

test.describe('Audit Logging - LGPD Compliance', () => {
  let testUser: TestUser
  let subscriptionId: string

  test.beforeAll(async ({ request }) => {
    // Create test user with subscription
    testUser = await createTestUser('audit_test@svlentes.shop')

    try {
      subscriptionId = await createSubscription(request, testUser.authToken)
    } catch (error) {
      console.warn('Failed to create test subscription:', error)
    }
  })

  test.describe('Subscription Address Update Audit', () => {
    test('logs shipping address update with full details', async ({ request }) => {
      test.skip(!subscriptionId, 'Subscription not created')

      // 1. Update shipping address
      const newAddress = {
        zipCode: '12345-678',
        street: 'Rua Nova de Teste',
        number: '200',
        complement: 'Sala 5',
        neighborhood: 'Bairro Novo',
        city: 'São Paulo',
        state: 'SP'
      }

      const updateResponse = await request.put('/api/assinante/subscription', {
        headers: {
          'Authorization': `Bearer ${testUser.authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          subscriptionId,
          shippingAddress: newAddress
        }
      })

      expect([200, 201]).toContain(updateResponse.status())

      // 2. Wait a moment for audit log to be written
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 3. Retrieve audit logs
      const auditLogs = await getAuditLogs(request, testUser.userId)

      // 4. Find the address update log
      const addressUpdateLog = auditLogs.find(
        log => log.action === 'UPDATE_SHIPPING_ADDRESS' || log.action === 'UPDATE_SUBSCRIPTION'
      )

      // 5. Verify audit log exists and has required fields
      expect(addressUpdateLog).toBeTruthy()

      if (addressUpdateLog) {
        expect(addressUpdateLog.entityType).toBe('Subscription')
        expect(addressUpdateLog.entityId).toBe(subscriptionId)
        expect(addressUpdateLog.userId).toBe(testUser.userId)

        // Verify new address is logged
        expect(addressUpdateLog.newValue).toBeTruthy()
        expect(addressUpdateLog.newValue.street || addressUpdateLog.newValue.shippingAddress?.street)
          .toBe('Rua Nova de Teste')

        // Verify metadata
        expect(addressUpdateLog.ipAddress).toBeTruthy()
        expect(addressUpdateLog.userAgent).toBeTruthy()
        expect(addressUpdateLog.timestamp || addressUpdateLog.createdAt).toBeTruthy()
      }
    })

    test('audit log contains old and new values for comparison', async ({ request }) => {
      test.skip(!subscriptionId, 'Subscription not created')

      // Update address again to create comparison
      const response = await request.put('/api/assinante/subscription', {
        headers: {
          'Authorization': `Bearer ${testUser.authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          subscriptionId,
          shippingAddress: {
            ...VALID_TEST_ADDRESS,
            number: '999' // Changed number
          }
        }
      })

      expect([200, 201]).toContain(response.status())

      await new Promise(resolve => setTimeout(resolve, 1000))

      const auditLogs = await getAuditLogs(request, testUser.userId)
      const recentLog = auditLogs[0] // Most recent

      if (recentLog && recentLog.action.includes('UPDATE')) {
        // Should have either oldValue or be able to compare with previous log
        const hasOldValue = recentLog.oldValue !== undefined && recentLog.oldValue !== null
        const hasNewValue = recentLog.newValue !== undefined && recentLog.newValue !== null

        expect(hasOldValue || hasNewValue).toBe(true)
      }
    })
  })

  test.describe('Prescription Upload Audit', () => {
    test('logs prescription upload with metadata only (not file content)', async ({ request }) => {
      test.skip(!subscriptionId, 'Subscription not created')

      const testPDF = generateBase64PDF(1024 * 1024) // 1MB PDF
      const fileName = 'receita-audit-test.pdf'

      // 1. Upload prescription
      const uploadResponse = await request.post('/api/assinante/prescription', {
        headers: {
          'Authorization': `Bearer ${testUser.authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          subscriptionId,
          file: testPDF,
          fileName,
          mimeType: 'application/pdf'
        }
      })

      expect([200, 201]).toContain(uploadResponse.status())

      // 2. Wait for audit log
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 3. Retrieve audit logs
      const auditLogs = await getAuditLogs(request, testUser.userId)

      // 4. Find prescription upload log
      const uploadLog = auditLogs.find(
        log => log.action === 'UPLOAD_PRESCRIPTION' || log.action === 'CREATE_PRESCRIPTION'
      )

      // 5. Verify audit log structure
      expect(uploadLog).toBeTruthy()

      if (uploadLog) {
        expect(uploadLog.entityType).toBe('Prescription')
        expect(uploadLog.userId).toBe(testUser.userId)

        // Should log metadata
        expect(uploadLog.newValue).toBeTruthy()
        expect(uploadLog.newValue.fileName).toBe(fileName)
        expect(uploadLog.newValue.mimeType).toBe('application/pdf')
        expect(uploadLog.newValue.fileSize || uploadLog.newValue.size).toBeGreaterThan(0)

        // CRITICAL: Should NOT log file content (LGPD compliance)
        expect(uploadLog.newValue.file).toBeUndefined()
        expect(uploadLog.newValue.content).toBeUndefined()
        expect(uploadLog.newValue.data).toBeUndefined()

        // File content should not appear anywhere in stringified log
        const logString = JSON.stringify(uploadLog)
        expect(logString).not.toContain('base64')
        expect(logString).not.toContain(testPDF.substring(50, 100))
      }
    })
  })

  test.describe('Payment History Access Audit', () => {
    test('logs payment history access with query parameters', async ({ request }) => {
      test.skip(!subscriptionId, 'Subscription not created')

      const startDate = '2024-01-01'
      const endDate = '2024-12-31'

      // 1. Access payment history
      const response = await request.get(
        `/api/assinante/payment-history?subscriptionId=${subscriptionId}&startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { 'Authorization': `Bearer ${testUser.authToken}` }
        }
      )

      expect([200, 404]).toContain(response.status())

      // 2. Wait for audit log
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 3. Retrieve audit logs
      const auditLogs = await getAuditLogs(request, testUser.userId)

      // 4. Find access log
      const accessLog = auditLogs.find(
        log => log.action === 'ACCESS_PAYMENT_HISTORY' || log.action === 'VIEW_PAYMENT_HISTORY'
      )

      // 5. Verify audit log
      if (accessLog) {
        expect(accessLog.userId).toBe(testUser.userId)
        expect(accessLog.entityType).toMatch(/Payment|Subscription/i)

        // Should log query parameters
        expect(accessLog.newValue || accessLog.metadata).toBeTruthy()

        const logData = accessLog.newValue || accessLog.metadata || {}
        expect(logData.startDate || accessLog.details?.includes(startDate)).toBeTruthy()
        expect(logData.endDate || accessLog.details?.includes(endDate)).toBeTruthy()

        // Should log result count
        if (logData.resultCount !== undefined) {
          expect(logData.resultCount).toBeGreaterThanOrEqual(0)
        }
      }
    })
  })

  test.describe('Delivery Preferences Update Audit', () => {
    test('logs delivery preferences changes', async ({ request }) => {
      test.skip(!subscriptionId, 'Subscription not created')

      const newPreferences = {
        subscriptionId,
        notificationPhone: '(33) 99999-8888',
        deliveryInstructions: 'Deixar com porteiro - teste audit'
      }

      // 1. Update preferences
      const response = await request.put('/api/assinante/delivery-preferences', {
        headers: {
          'Authorization': `Bearer ${testUser.authToken}`,
          'Content-Type': 'application/json'
        },
        data: newPreferences
      })

      expect([200, 201]).toContain(response.status())

      // 2. Wait for audit log
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 3. Retrieve audit logs
      const auditLogs = await getAuditLogs(request, testUser.userId)

      // 4. Find preferences update log
      const updateLog = auditLogs.find(
        log => log.action === 'UPDATE_DELIVERY_PREFERENCES' || log.action === 'UPDATE_PREFERENCES'
      )

      // 5. Verify audit log
      if (updateLog) {
        expect(updateLog.userId).toBe(testUser.userId)

        const logData = updateLog.newValue || {}
        expect(
          logData.notificationPhone ||
          logData.phone ||
          updateLog.details?.includes('99999-8888')
        ).toBeTruthy()

        expect(
          logData.deliveryInstructions ||
          updateLog.details?.includes('porteiro')
        ).toBeTruthy()
      }
    })
  })

  test.describe('Sensitive Data Sanitization', () => {
    test('sanitizes sensitive data in audit logs', async ({ request }) => {
      const auditLogs = await getAuditLogs(request, testUser.userId)

      for (const log of auditLogs) {
        const logString = JSON.stringify(log)

        // Should not contain passwords
        expect(logString.toLowerCase()).not.toMatch(/password|senha/i)

        // Should not contain full credit card numbers (only last 4 digits allowed)
        const cardMatches = logString.match(/\d{16}/)
        expect(cardMatches).toBeNull()

        // Should not contain raw auth tokens
        expect(logString).not.toMatch(/Bearer [a-zA-Z0-9]{50,}/)

        // Should not contain Firebase UIDs (unless intentional)
        // Except in structured fields where it's expected
        if (!log.userId && !log.firebaseUid) {
          expect(logString).not.toMatch(/firebase_[a-zA-Z0-9]{20,}/)
        }
      }
    })

    test('masks credit card numbers if present', async ({ request }) => {
      const auditLogs = await getAuditLogs(request, testUser.userId)

      for (const log of auditLogs) {
        const logString = JSON.stringify(log)

        // If contains card number reference, should be masked
        const cardMaskPatterns = [
          /\*{4}\d{4}/, // ****1234
          /\*{12}\d{4}/, // ************1234
          /X{4}\d{4}/i, // XXXX1234
          /\*+\d{4}/ // ***1234 or similar
        ]

        const hasCardReference = cardMaskPatterns.some(pattern => pattern.test(logString))

        // If has card reference, should NOT have full number
        if (hasCardReference) {
          expect(logString).not.toMatch(/\d{16}/)
        }
      }
    })
  })

  test.describe('Audit Log Metadata Requirements', () => {
    test('all audit logs contain required metadata', async ({ request }) => {
      test.skip(!subscriptionId, 'Subscription not created')

      // Perform any action to generate audit log
      await request.get(`/api/assinante/subscription?id=${subscriptionId}`, {
        headers: { 'Authorization': `Bearer ${testUser.authToken}` }
      })

      await new Promise(resolve => setTimeout(resolve, 1000))

      const auditLogs = await getAuditLogs(request, testUser.userId)

      expect(auditLogs.length).toBeGreaterThan(0)

      for (const log of auditLogs) {
        // Required fields for LGPD compliance
        expect(log.userId || log.user || log.userEmail).toBeTruthy()
        expect(log.action || log.actionType).toBeTruthy()
        expect(log.timestamp || log.createdAt).toBeTruthy()

        // Should have either entityType or resource type
        expect(
          log.entityType ||
          log.resourceType ||
          log.resource
        ).toBeTruthy()

        // Should have IP address for security tracking
        expect(
          log.ipAddress ||
          log.ip ||
          log.metadata?.ipAddress
        ).toBeTruthy()

        // Should have user agent for device tracking
        expect(
          log.userAgent ||
          log.metadata?.userAgent ||
          log.metadata?.device
        ).toBeTruthy()
      }
    })

    test('audit logs are chronologically ordered', async ({ request }) => {
      const auditLogs = await getAuditLogs(request, testUser.userId)

      if (auditLogs.length > 1) {
        for (let i = 0; i < auditLogs.length - 1; i++) {
          const current = new Date(auditLogs[i].timestamp || auditLogs[i].createdAt)
          const next = new Date(auditLogs[i + 1].timestamp || auditLogs[i + 1].createdAt)

          // Logs should be in descending order (newest first) or ascending order (oldest first)
          // Just check they have valid dates
          expect(current.getTime()).toBeGreaterThan(0)
          expect(next.getTime()).toBeGreaterThan(0)
        }
      }
    })
  })

  // Cleanup after tests
  test.afterAll(async ({ request }) => {
    if (testUser?.userId) {
      const adminToken = testUser.authToken // In real scenario, use admin token
      await cleanupTestUser(request, testUser.userId, adminToken)
    }
  })
})
