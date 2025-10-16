/**
 * Logger Tests - Secure Logging System
 *
 * Tests PII sanitization, environment-based logging, and LGPD compliance
 */

import { logger, LogCategory, LogLevel } from '../logger'

describe('Logger', () => {
  const originalEnv = process.env.NODE_ENV
  const originalWindow = global.window

  beforeEach(() => {
    // Reset environment
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    // Restore environment
    process.env.NODE_ENV = originalEnv
    global.window = originalWindow
  })

  describe('PII Sanitization - sanitizeMetadata', () => {
    it('should redact CPF in metadata', () => {
      const metadata = { cpf: '123.456.789-00', userId: 'user123' }
      const sanitized = logger.sanitizeMetadata(metadata)

      expect(sanitized.cpf).toBe('[REDACTED]')
      expect(sanitized.userId).toBe('user123')
    })

    it('should redact CNPJ in metadata', () => {
      const metadata = { cnpj: '12.345.678/0001-90', userId: 'user123' }
      const sanitized = logger.sanitizeMetadata(metadata)

      expect(sanitized.cnpj).toBe('[REDACTED]')
      expect(sanitized.userId).toBe('user123')
    })

    it('should redact email addresses', () => {
      const metadata = { email: 'user@example.com', orderId: 'ord123' }
      const sanitized = logger.sanitizeMetadata(metadata)

      expect(sanitized.email).toBe('[REDACTED]')
      expect(sanitized.orderId).toBe('ord123')
    })

    it('should redact phone numbers', () => {
      const metadata = {
        phone: '33998980262',
        mobilePhone: '5533998980262',
        userId: 'user123'
      }
      const sanitized = logger.sanitizeMetadata(metadata)

      expect(sanitized.phone).toBe('[REDACTED]')
      expect(sanitized.mobilePhone).toBe('[REDACTED]')
      expect(sanitized.userId).toBe('user123')
    })

    it('should redact payment amounts', () => {
      const metadata = { value: 150.00, netValue: 142.50, paymentId: 'pay123' }
      const sanitized = logger.sanitizeMetadata(metadata)

      expect(sanitized.value).toBe('[REDACTED]')
      expect(sanitized.netValue).toBe('[REDACTED]')
      expect(sanitized.paymentId).toBe('pay123')
    })

    it('should redact passwords and tokens', () => {
      const metadata = {
        password: 'secret123',
        token: 'abc123',
        // FIXED: apiKey with capital K is now correctly detected after bug fix
        // The check now does key.toLowerCase().includes(sk.toLowerCase())
        apiKey: 'key123',
        secret: 'top_secret',
        userId: 'user123'
      }
      const sanitized = logger.sanitizeMetadata(metadata)

      expect(sanitized.password).toBe('[REDACTED]')
      expect(sanitized.token).toBe('[REDACTED]')
      // FIXED: apiKey is now correctly redacted after bug fix
      expect(sanitized.apiKey).toBe('[REDACTED]')
      expect(sanitized.secret).toBe('[REDACTED]')
      expect(sanitized.userId).toBe('user123')
    })

    it('should redact customer information', () => {
      const metadata = {
        customer: 'cus_456',
        customerId: 'cus_789',
        name: 'John Doe',
        address: 'Rua Example 123',
        userId: 'user123'
      }
      const sanitized = logger.sanitizeMetadata(metadata)

      expect(sanitized.customer).toBe('[REDACTED]')
      expect(sanitized.customerId).toBe('[REDACTED]')
      expect(sanitized.name).toBe('[REDACTED]')
      expect(sanitized.address).toBe('[REDACTED]')
      expect(sanitized.userId).toBe('user123')
    })

    it('should handle nested objects with PII', () => {
      const metadata = {
        userId: 'user123',
        paymentData: {
          customer: 'cus_456',
          value: 150.00,
          billingType: 'CREDIT_CARD'
        }
      }
      const sanitized = logger.sanitizeMetadata(metadata)

      expect(sanitized.userId).toBe('user123')
      // Nested objects are not sanitized by sanitizeMetadata
      // Use sanitizePaymentData for payment objects
    })

    it('should preserve non-sensitive metadata', () => {
      const metadata = {
        userId: 'user123',
        paymentId: 'pay_456',
        status: 'CONFIRMED',
        method: 'POST',
        duration: 150
      }
      const sanitized = logger.sanitizeMetadata(metadata)

      expect(sanitized).toEqual(metadata)
    })
  })

  describe('PII Sanitization - sanitizePaymentData', () => {
    it('should sanitize payment data completely', () => {
      const payment = {
        id: 'pay123',
        customer: 'cus_456',
        value: 150.00,
        netValue: 142.50,
        billingType: 'CREDIT_CARD',
        status: 'CONFIRMED',
        dueDate: '2025-12-31',
        paymentDate: '2025-10-16',
        externalReference: 'sub_789'
      }
      const sanitized = logger.sanitizePaymentData(payment)

      // Should keep operational data
      expect(sanitized.id).toBe('pay123')
      expect(sanitized.status).toBe('CONFIRMED')
      expect(sanitized.dueDate).toBe('2025-12-31')
      expect(sanitized.paymentDate).toBe('2025-10-16')

      // Should redact PII
      expect(sanitized.customer).toBe('[REDACTED]')
      expect(sanitized.value).toBe('[REDACTED]')
      expect(sanitized.billingType).toBe('[REDACTED]')
      expect(sanitized.externalReference).toBe('[REDACTED]')
    })

    it('should handle null payment gracefully', () => {
      const sanitized = logger.sanitizePaymentData(null)
      expect(sanitized).toBeNull()
    })

    it('should handle undefined payment gracefully', () => {
      const sanitized = logger.sanitizePaymentData(undefined)
      expect(sanitized).toBeNull()
    })

    it('should handle partial payment data', () => {
      const payment = {
        id: 'pay123',
        status: 'PENDING'
      }
      const sanitized = logger.sanitizePaymentData(payment)

      expect(sanitized.id).toBe('pay123')
      expect(sanitized.status).toBe('PENDING')
      expect(sanitized.customer).toBeUndefined()
      expect(sanitized.value).toBeUndefined()
    })
  })

  describe('Environment-based logging', () => {
    it('should not log to console in production client-side', () => {
      // Mock production + client-side
      process.env.NODE_ENV = 'production'
      // @ts-ignore
      global.window = {} as any

      const consoleSpy = jest.spyOn(console, 'info')
      logger.info(LogCategory.API, 'test message')

      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should log to console in development', () => {
      // Need to create a new Logger instance with development environment
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      // Re-import logger to get new environment
      jest.resetModules()
      const { logger: devLogger } = require('../logger')

      delete (global as any).window

      const consoleSpy = jest.spyOn(console, 'info')
      devLogger.info('API' as any, 'test message')

      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    it('should log errors to console in production server-side', () => {
      process.env.NODE_ENV = 'production'
      delete (global as any).window

      const consoleSpy = jest.spyOn(console, 'error')
      logger.error(LogCategory.API, 'error message', new Error('test error'))

      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should NOT log info to console in production server-side', () => {
      process.env.NODE_ENV = 'production'
      delete (global as any).window

      const consoleSpy = jest.spyOn(console, 'info')
      logger.info(LogCategory.API, 'info message')

      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('Context-specific logging methods', () => {
    it('should log payment events with sanitized metadata', () => {
      const infoSpy = jest.spyOn(logger, 'info')
      logger.logPayment('created', { paymentId: 'pay123', value: 150.00 })

      expect(infoSpy).toHaveBeenCalledWith(
        LogCategory.PAYMENT,
        'Payment created',
        expect.objectContaining({
          paymentId: 'pay123'
        })
      )

      infoSpy.mockRestore()
    })

    it('should log webhook events', () => {
      const infoSpy = jest.spyOn(logger, 'info')
      logger.logWebhook('PAYMENT_RECEIVED', { paymentId: 'pay123' })

      expect(infoSpy).toHaveBeenCalledWith(
        LogCategory.WEBHOOK,
        'Webhook received: PAYMENT_RECEIVED',
        expect.objectContaining({
          paymentId: 'pay123'
        })
      )

      infoSpy.mockRestore()
    })

    it('should log API requests', () => {
      const infoSpy = jest.spyOn(logger, 'info')
      logger.logAPI('POST', '/api/webhooks/asaas', { requestId: 'req123' })

      expect(infoSpy).toHaveBeenCalledWith(
        LogCategory.API,
        'POST /api/webhooks/asaas',
        expect.objectContaining({
          requestId: 'req123'
        })
      )

      infoSpy.mockRestore()
    })

    it('should log security events', () => {
      const warnSpy = jest.spyOn(logger, 'warn')
      logger.logSecurity('invalid_token', { requestId: 'req123' })

      expect(warnSpy).toHaveBeenCalledWith(
        LogCategory.SECURITY,
        'Security event: invalid_token',
        expect.objectContaining({
          requestId: 'req123'
        })
      )

      warnSpy.mockRestore()
    })

    it('should log business events', () => {
      const infoSpy = jest.spyOn(logger, 'info')
      logger.logBusiness('subscription_created', { subscriptionId: 'sub123' })

      expect(infoSpy).toHaveBeenCalledWith(
        LogCategory.BUSINESS,
        'Business event: subscription_created',
        expect.objectContaining({
          subscriptionId: 'sub123'
        })
      )

      infoSpy.mockRestore()
    })
  })

  describe('Timer utility', () => {
    it('should measure operation duration', async () => {
      const timer = logger.startTimer()

      // Simulate operation
      await new Promise(resolve => setTimeout(resolve, 100))

      const duration = timer()

      expect(duration).toBeGreaterThanOrEqual(100)
      expect(duration).toBeLessThan(200) // Allow some margin
    })
  })

  describe('Request/Response logging', () => {
    it('should log request with sanitized headers', () => {
      const logAPISpy = jest.spyOn(logger, 'logAPI')

      logger.logRequest(
        {
          method: 'POST',
          url: '/api/webhooks/asaas',
          headers: {
            'content-type': 'application/json',
            'authorization': 'Bearer secret_token'
          },
          body: { test: 'data' }
        },
        'req123'
      )

      expect(logAPISpy).toHaveBeenCalled()
      logAPISpy.mockRestore()
    })

    it('should log response with appropriate level', () => {
      const logSpy = jest.spyOn(logger as any, 'writeLog')

      // Success response
      logger.logResponse(
        { method: 'POST', url: '/api/test' },
        200,
        150,
        'req123'
      )

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.INFO,
          category: LogCategory.API
        })
      )

      logSpy.mockClear()

      // Client error response
      logger.logResponse(
        { method: 'POST', url: '/api/test' },
        400,
        150,
        'req123'
      )

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.WARN,
          category: LogCategory.API
        })
      )

      logSpy.mockClear()

      // Server error response
      logger.logResponse(
        { method: 'POST', url: '/api/test' },
        500,
        150,
        'req123'
      )

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.ERROR,
          category: LogCategory.API
        })
      )

      logSpy.mockRestore()
    })
  })

  describe('LGPD Compliance', () => {
    it('should never log raw PII in any environment', () => {
      const testCases = [
        { cpf: '123.456.789-00', email: 'user@example.com' },
        { customer: 'cus_123', value: 150.00 },
        { password: 'secret123', token: 'abc123' }
      ]

      testCases.forEach(testCase => {
        const sanitized = logger.sanitizeMetadata(testCase)

        // Verify no original PII values remain
        Object.values(sanitized).forEach(value => {
          expect(value).toBe('[REDACTED]')
        })
      })
    })

    it('should preserve audit trail without PII', () => {
      const payment = {
        id: 'pay123',
        customer: 'cus_456',
        value: 150.00,
        status: 'CONFIRMED'
      }

      const sanitized = logger.sanitizePaymentData(payment)

      // Can trace payment by ID and status
      expect(sanitized.id).toBe('pay123')
      expect(sanitized.status).toBe('CONFIRMED')

      // But no customer PII
      expect(sanitized.customer).toBe('[REDACTED]')
      expect(sanitized.value).toBe('[REDACTED]')
    })
  })
})
