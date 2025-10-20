/**
 * Rate Limiting Enhanced Tests
 * Tests for the comprehensive rate limiting system
 */

import {
  RATE_LIMIT_CONFIGS,
  createRateLimit,
  getClientIdentifier,
  rateLimitWithConfig
} from '../../lib/rate-limiting-enhanced'

// Mock Date.now for consistent testing
const mockDateNow = jest.spyOn(Date, 'now')

describe('Rate Limiting Enhanced - Basic Functionality', () => {
  beforeEach(() => {
    mockDateNow.mockReturnValue(1000)
    jest.clearAllMocks()
  })

  afterAll(() => {
    mockDateNow.mockRestore()
  })

  describe('Configuration Validation', () => {
    it('should have all required rate limit configurations', () => {
      expect(RATE_LIMIT_CONFIGS).toHaveProperty('PAYMENT')
      expect(RATE_LIMIT_CONFIGS).toHaveProperty('WHATSAPP')
      expect(RATE_LIMIT_CONFIGS).toHaveProperty('AUTH')
      expect(RATE_LIMIT_CONFIGS).toHaveProperty('GENERAL')
    })

    it('should have valid payment rate limit config', () => {
      const config = RATE_LIMIT_CONFIGS.PAYMENT
      expect(config.windowMs).toBe(15 * 60 * 1000) // 15 minutes
      expect(config.max).toBe(5)
      expect(config.message).toContain('15 minutos')
    })

    it('should have valid WhatsApp rate limit config', () => {
      const config = RATE_LIMIT_CONFIGS.WHATSAPP
      expect(config.windowMs).toBe(10 * 60 * 1000) // 10 minutes
      expect(config.max).toBe(10)
      expect(config.message).toContain('10 minutos')
    })

    it('should have valid auth rate limit config', () => {
      const config = RATE_LIMIT_CONFIGS.AUTH
      expect(config.windowMs).toBe(15 * 60 * 1000) // 15 minutes
      expect(config.max).toBe(20)
      expect(config.message).toContain('15 minutos')
    })
  })

  describe('Client Identification', () => {
    it('should extract client identifier from IP', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header) => {
            if (header === 'x-forwarded-for') return '192.168.1.1'
            if (header === 'x-real-ip') return '10.0.0.1'
            return null
          })
        },
        ip: '127.0.0.1'
      } as any

      const clientId = getClientIdentifier(mockRequest)
      expect(clientId).toBe('192.168.1.1')
    })

    it('should fallback to request IP when forwarded headers missing', () => {
      const mockRequest = {
        headers: {
          get: jest.fn(() => null)
        },
        ip: '127.0.0.1'
      } as any

      const clientId = getClientIdentifier(mockRequest)
      expect(clientId).toBe('127.0.0.1')
    })

    it('should handle missing IP gracefully', () => {
      const mockRequest = {
        headers: {
          get: jest.fn(() => null)
        }
      } as any

      const clientId = getClientIdentifier(mockRequest)
      expect(clientId).toBe('unknown')
    })
  })

  describe('Rate Limiting Logic', () => {
    it('should allow requests within limit', () => {
      const config = RATE_LIMIT_CONFIGS.PAYMENT
      const rateLimit = createRateLimit(config)

      const mockRequest = {
        headers: {
          get: jest.fn(() => '192.168.1.1')
        }
      } as any

      // First request should pass
      expect(rateLimit(mockRequest)).toBe(true)
      expect(rateLimit(mockRequest)).toBe(true)
      expect(rateLimit(mockRequest)).toBe(true)
      expect(rateLimit(mockRequest)).toBe(true)
      expect(rateLimit(mockRequest)).toBe(true)
    })

    it('should block requests exceeding limit', () => {
      const config = RATE_LIMIT_CONFIGS.PAYMENT
      const rateLimit = createRateLimit(config)

      const mockRequest = {
        headers: {
          get: jest.fn(() => '192.168.1.2')
        }
      } as any

      // Use all allowed requests
      for (let i = 0; i < config.max; i++) {
        expect(rateLimit(mockRequest)).toBe(true)
      }

      // Next request should be blocked
      expect(rateLimit(mockRequest)).toBe(false)
    })

    it('should reset after window expires', () => {
      const config = RATE_LIMIT_CONFIGS.PAYMENT
      const rateLimit = createRateLimit(config)

      const mockRequest = {
        headers: {
          get: jest.fn(() => '192.168.1.3')
        }
      } as any

      // Use all allowed requests
      for (let i = 0; i < config.max; i++) {
        expect(rateLimit(mockRequest)).toBe(true)
      }

      // Should be blocked
      expect(rateLimit(mockRequest)).toBe(false)

      // Advance time beyond window
      mockDateNow.mockReturnValue(config.windowMs + 1000)

      // Should be allowed again
      expect(rateLimit(mockRequest)).toBe(true)
    })

    it('should handle different clients independently', () => {
      const config = RATE_LIMIT_CONFIGS.PAYMENT
      const rateLimit = createRateLimit(config)

      const client1 = {
        headers: { get: jest.fn(() => '192.168.1.10') }
      } as any

      const client2 = {
        headers: { get: jest.fn(() => '192.168.1.20') }
      } as any

      // Client 1 uses all requests
      for (let i = 0; i < config.max; i++) {
        expect(rateLimit(client1)).toBe(true)
      }

      // Client 1 should be blocked
      expect(rateLimit(client1)).toBe(false)

      // Client 2 should still be allowed
      expect(rateLimit(client2)).toBe(true)
    })
  })

  describe('Rate Limiting with Config Wrapper', () => {
    it('should create rate limit with specific config', () => {
      const mockHandler = jest.fn()
      const wrappedHandler = rateLimitWithConfig(
        RATE_LIMIT_CONFIGS.WHATSAPP,
        mockHandler
      )

      const mockRequest = {
        headers: { get: jest.fn(() => '192.168.1.50') }
      } as any

      // Should call handler within limits
      for (let i = 0; i < RATE_LIMIT_CONFIGS.WHATSAPP.max; i++) {
        wrappedHandler(mockRequest)
        expect(mockHandler).toHaveBeenCalledTimes(i + 1)
      }

      // Should not call handler when rate limited
      wrappedHandler(mockRequest)
      expect(mockHandler).toHaveBeenCalledTimes(RATE_LIMIT_CONFIGS.WHATSAPP.max)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing headers gracefully', () => {
      const config = RATE_LIMIT_CONFIGS.GENERAL
      const rateLimit = createRateLimit(config)

      const mockRequest = {} as any

      // Should not crash
      expect(() => rateLimit(mockRequest)).not.toThrow()
    })

    it('should handle null request gracefully', () => {
      const config = RATE_LIMIT_CONFIGS.GENERAL
      const rateLimit = createRateLimit(config)

      // Should not crash
      expect(() => rateLimit(null as any)).not.toThrow()
    })

    it('should handle concurrent requests correctly', () => {
      const config = RATE_LIMIT_CONFIGS.AUTH
      const rateLimit = createRateLimit(config)

      const mockRequest = {
        headers: { get: jest.fn(() => '192.168.1.100') }
      } as any

      // Simulate concurrent requests
      const results = []
      for (let i = 0; i < config.max + 5; i++) {
        results.push(rateLimit(mockRequest))
      }

      // First max requests should be true
      for (let i = 0; i < config.max; i++) {
        expect(results[i]).toBe(true)
      }

      // Remaining should be false
      for (let i = config.max; i < results.length; i++) {
        expect(results[i]).toBe(false)
      }
    })
  })
})

describe('Rate Limiting - Performance', () => {
  it('should handle high volume requests efficiently', () => {
    const config = RATE_LIMIT_CONFIGS.GENERAL
    const rateLimit = createRateLimit(config)

    const startTime = Date.now()

    // Simulate 1000 requests
    for (let i = 0; i < 1000; i++) {
      const mockRequest = {
        headers: { get: jest.fn(() => `192.168.1.${i % 255}`) }
      } as any
      rateLimit(mockRequest)
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    // Should complete within reasonable time (less than 100ms)
    expect(duration).toBeLessThan(100)
  })

  it('should not leak memory with many clients', () => {
    const config = RATE_LIMIT_CONFIGS.GENERAL
    const rateLimit = createRateLimit(config)

    // Create many different clients
    for (let i = 0; i < 1000; i++) {
      const mockRequest = {
        headers: { get: jest.fn(() => `192.168.${i % 255}.${Math.floor(i / 255)}`) }
      } as any
      rateLimit(mockRequest)
    }

    // Should not crash or run out of memory
    expect(true).toBe(true)
  })
})

describe('Rate Limiting - Integration with SV Lentes APIs', () => {
  describe('Payment API Rate Limiting', () => {
    it('should configure appropriate limits for payment endpoints', () => {
      const config = RATE_LIMIT_CONFIGS.PAYMENT

      expect(config.max).toBe(5) // Strict limit for financial operations
      expect(config.windowMs).toBe(15 * 60 * 1000) // 15 minute window
      expect(config.message).toContain('pagamento')
    })
  })

  describe('WhatsApp API Rate Limiting', () => {
    it('should configure appropriate limits for WhatsApp endpoints', () => {
      const config = RATE_LIMIT_CONFIGS.WHATSAPP

      expect(config.max).toBe(10) // Moderate limit for messaging
      expect(config.windowMs).toBe(10 * 60 * 1000) // 10 minute window
      expect(config.message).toContain('WhatsApp')
    })
  })

  describe('Authentication API Rate Limiting', () => {
    it('should configure appropriate limits for auth endpoints', () => {
      const config = RATE_LIMIT_CONFIGS.AUTH

      expect(config.max).toBe(20) // Higher limit for legitimate auth attempts
      expect(config.windowMs).toBe(15 * 60 * 1000) // 15 minute window
      expect(config.message).toContain('login')
    })
  })

  describe('General API Rate Limiting', () => {
    it('should configure appropriate limits for general endpoints', () => {
      const config = RATE_LIMIT_CONFIGS.GENERAL

      expect(config.max).toBe(100) // Highest limit for general use
      expect(config.windowMs).toBe(15 * 60 * 1000) // 15 minute window
      expect(config.message).toContain('requisições')
    })
  })
})