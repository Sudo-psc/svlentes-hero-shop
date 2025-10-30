/**
 * Unit Tests for LGPD Audit Logger
 *
 * Tests sanitization, IP extraction, and logging functionality
 */

import { logAudit, AuditAction } from '../audit-logger'
import { prisma } from '../prisma'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('../prisma', () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

describe('Audit Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('logAudit()', () => {
    it('should create audit log entry with basic data', async () => {
      const mockCreate = prisma.auditLog.create as jest.Mock
      mockCreate.mockResolvedValue({ id: 'test-log-id' })

      await logAudit({
        userId: 'user-123',
        action: AuditAction.UPDATE_SHIPPING_ADDRESS,
        entityType: 'Subscription',
        entityId: 'sub-456',
      })

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          action: 'UPDATE_SHIPPING_ADDRESS',
          entityType: 'Subscription',
          entityId: 'sub-456',
          oldValue: null,
          newValue: null,
          ipAddress: null,
          userAgent: null,
        }),
      })
    })

    it('should sanitize sensitive fields in oldValue/newValue', async () => {
      const mockCreate = prisma.auditLog.create as jest.Mock
      mockCreate.mockResolvedValue({ id: 'test-log-id' })

      const sensitiveData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'super-secret-password',
        creditCard: '4111111111111111',
        apiKey: 'sk_live_1234567890',
      }

      await logAudit({
        userId: 'user-123',
        action: AuditAction.UPDATE_PERSONAL_INFO,
        entityType: 'User',
        oldValue: sensitiveData,
      })

      const loggedData = mockCreate.mock.calls[0][0].data.oldValue

      // Check sensitive fields are redacted
      expect(loggedData.password).toBe('[REDACTED]')
      expect(loggedData.creditCard).toMatch(/^\*\*\*\*1111$/)
      expect(loggedData.apiKey).toBe('[REDACTED]')

      // Check non-sensitive fields are preserved
      expect(loggedData.name).toBe('John Doe')
      expect(loggedData.email).toBe('john@example.com')
    })

    it('should handle nested objects in value sanitization', async () => {
      const mockCreate = prisma.auditLog.create as jest.Mock
      mockCreate.mockResolvedValue({ id: 'test-log-id' })

      const nestedData = {
        user: {
          name: 'John',
          password: 'secret',
        },
        payment: {
          method: 'credit_card',
          cardNumber: '4111111111111111',
        },
      }

      await logAudit({
        userId: 'user-123',
        action: AuditAction.UPDATE_PAYMENT_METHOD,
        entityType: 'Payment',
        newValue: nestedData,
      })

      const loggedData = mockCreate.mock.calls[0][0].data.newValue

      expect(loggedData.user.password).toBe('[REDACTED]')
      expect(loggedData.payment.cardNumber).toMatch(/^\*\*\*\*1111$/)
      expect(loggedData.user.name).toBe('John')
    })

    it('should extract IP from x-forwarded-for header (Nginx proxy)', async () => {
      const mockCreate = prisma.auditLog.create as jest.Mock
      mockCreate.mockResolvedValue({ id: 'test-log-id' })

      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '203.0.113.45, 198.51.100.1'
            if (name === 'user-agent') return 'Mozilla/5.0'
            return null
          },
        },
        ip: null,
      } as unknown as NextRequest

      await logAudit({
        userId: 'user-123',
        action: AuditAction.ACCESS_PERSONAL_DATA,
        entityType: 'User',
        request: mockRequest,
      })

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ipAddress: '203.0.113.45', // First IP from x-forwarded-for
          userAgent: 'Mozilla/5.0',
        }),
      })
    })

    it('should extract IP from x-real-ip header (alternative)', async () => {
      const mockCreate = prisma.auditLog.create as jest.Mock
      mockCreate.mockResolvedValue({ id: 'test-log-id' })

      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-real-ip') return '203.0.113.89'
            if (name === 'user-agent') return 'Chrome/120.0'
            return null
          },
        },
        ip: null,
      } as unknown as NextRequest

      await logAudit({
        userId: 'user-123',
        action: AuditAction.ACCESS_PERSONAL_DATA,
        entityType: 'User',
        request: mockRequest,
      })

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ipAddress: '203.0.113.89',
          userAgent: 'Chrome/120.0',
        }),
      })
    })

    it('should not throw error if Prisma fails (non-blocking)', async () => {
      const mockCreate = prisma.auditLog.create as jest.Mock
      mockCreate.mockRejectedValue(new Error('Database error'))

      // Should not throw
      await expect(
        logAudit({
          userId: 'user-123',
          action: AuditAction.UPDATE_SHIPPING_ADDRESS,
          entityType: 'Subscription',
        })
      ).resolves.not.toThrow()

      expect(mockCreate).toHaveBeenCalled()
    })

    it('should handle null/undefined values gracefully', async () => {
      const mockCreate = prisma.auditLog.create as jest.Mock
      mockCreate.mockResolvedValue({ id: 'test-log-id' })

      await logAudit({
        userId: 'user-123',
        action: AuditAction.DELETE_PRESCRIPTION,
        entityType: 'Prescription',
        oldValue: null,
        newValue: undefined,
      })

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          oldValue: null,
          newValue: null,
        }),
      })
    })

    it('should preserve last4 field for credit cards', async () => {
      const mockCreate = prisma.auditLog.create as jest.Mock
      mockCreate.mockResolvedValue({ id: 'test-log-id' })

      const paymentData = {
        method: 'credit_card',
        last4: '4242',
        cardNumber: '4242424242424242',
      }

      await logAudit({
        userId: 'user-123',
        action: AuditAction.UPDATE_PAYMENT_METHOD,
        entityType: 'Payment',
        newValue: paymentData,
      })

      const loggedData = mockCreate.mock.calls[0][0].data.newValue

      expect(loggedData.last4).toBe('4242') // Preserved
      expect(loggedData.cardNumber).toMatch(/^\*\*\*\*4242$/) // Masked
    })
  })

  describe('AuditAction Enum', () => {
    it('should have all required actions defined', () => {
      expect(AuditAction.UPDATE_SHIPPING_ADDRESS).toBe('UPDATE_SHIPPING_ADDRESS')
      expect(AuditAction.CHANGE_SUBSCRIPTION_PLAN).toBe(
        'CHANGE_SUBSCRIPTION_PLAN'
      )
      expect(AuditAction.UPDATE_PAYMENT_METHOD).toBe('UPDATE_PAYMENT_METHOD')
      expect(AuditAction.UPLOAD_PRESCRIPTION).toBe('UPLOAD_PRESCRIPTION')
      expect(AuditAction.DELETE_PRESCRIPTION).toBe('DELETE_PRESCRIPTION')
      expect(AuditAction.ACCESS_PERSONAL_DATA).toBe('ACCESS_PERSONAL_DATA')
    })
  })
})
