import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateWhatsAppMessage, generateWhatsAppUrl } from '@/lib/whatsapp-integration'
import { mockWhatsAppContext, mockUser, mockSubscription } from '@/__tests__/fixtures/phase2-fixtures'

describe('WhatsApp Integration', () => {
  const defaultPhoneNumber = '+5533999898026'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generateWhatsAppMessage', () => {
    it('should generate message with subscription context', () => {
      const message = generateWhatsAppMessage('subscription', {
        planName: mockSubscription.planName,
        nextBillingDate: mockSubscription.currentPeriodEnd,
        status: mockSubscription.status
      })

      expect(message).toContain('assinatura')
      expect(message).toContain(mockSubscription.planName)
      expect(message).toBeTruthy()
    })

    it('should generate message with delivery context', () => {
      const message = generateWhatsAppMessage('delivery', {
        trackingCode: 'BR123456789BR',
        status: 'in_transit',
        estimatedDelivery: new Date('2025-11-05')
      })

      expect(message).toContain('entrega')
      expect(message).toContain('BR123456789BR')
      expect(message).toBeTruthy()
    })

    it('should generate message with payment context', () => {
      const message = generateWhatsAppMessage('payment', {
        amount: 149.90,
        dueDate: new Date('2025-11-03'),
        status: 'pending'
      })

      expect(message).toContain('pagamento')
      expect(message).toContain('149')
      expect(message).toBeTruthy()
    })

    it('should include user information when provided', () => {
      const message = generateWhatsAppMessage('subscription', {
        planName: mockSubscription.planName,
        userName: mockUser.name
      })

      expect(message).toContain(mockUser.name)
      expect(message).toBeTruthy()
    })

    it('should generate default message for unknown context', () => {
      const message = generateWhatsAppMessage('general', {})

      expect(message).toContain('Olá')
      expect(message).toBeTruthy()
    })
  })

  describe('generateWhatsAppUrl', () => {
    it('should generate valid WhatsApp URL', () => {
      const url = generateWhatsAppUrl({
        phoneNumber: defaultPhoneNumber,
        message: 'Olá! Tenho dúvidas sobre minha assinatura.'
      })

      expect(url).toContain('wa.me')
      expect(url).toContain('5533999898026')
      expect(url).toContain(encodeURIComponent('Olá'))
    })

    it('should include phone number correctly formatted', () => {
      const url = generateWhatsAppUrl({
        phoneNumber: '+55 33 99989-8026',
        message: 'Teste'
      })

      // Should strip non-numeric characters except leading +
      expect(url).toContain('5533999898026')
      expect(url).not.toContain('-')
      expect(url).not.toContain(' ')
    })

    it('should encode message correctly', () => {
      const specialMessage = 'Olá! Tenho dúvidas: 1) Preço 2) Entrega'

      const url = generateWhatsAppUrl({
        phoneNumber: defaultPhoneNumber,
        message: specialMessage
      })

      // Special characters should be URL encoded
      expect(url).toContain('%')
      expect(url).toContain('text=')
    })

    it('should handle empty message', () => {
      const url = generateWhatsAppUrl({
        phoneNumber: defaultPhoneNumber,
        message: ''
      })

      expect(url).toContain('wa.me')
      expect(url).toContain('5533999898026')
    })

    it('should handle missing phone number', () => {
      const url = generateWhatsAppUrl({
        phoneNumber: undefined,
        message: 'Teste'
      })

      // Should use default phone number
      expect(url).toContain('wa.me')
      expect(url).toBeTruthy()
    })

    it('should include context parameters', () => {
      const url = generateWhatsAppUrl({
        phoneNumber: defaultPhoneNumber,
        message: 'Teste',
        context: {
          type: 'subscription',
          subscriptionId: mockSubscription.id
        }
      })

      expect(url).toContain('wa.me')
      expect(url).toBeTruthy()
    })
  })

  describe('Context-Aware Message Generation', () => {
    it('should generate subscription inquiry message', () => {
      const context = mockWhatsAppContext.subscription

      const message = generateWhatsAppMessage('subscription', {
        planName: context.planName,
        nextBillingDate: context.nextBillingDate,
        status: context.status
      })

      expect(message).toContain(context.planName)
      expect(message.length).toBeGreaterThan(0)
    })

    it('should generate delivery tracking message', () => {
      const context = mockWhatsAppContext.delivery

      const message = generateWhatsAppMessage('delivery', {
        trackingCode: context.trackingCode,
        status: context.status,
        estimatedDelivery: context.estimatedDelivery
      })

      expect(message).toContain(context.trackingCode)
      expect(message.length).toBeGreaterThan(0)
    })

    it('should generate payment issue message', () => {
      const context = mockWhatsAppContext.payment

      const message = generateWhatsAppMessage('payment', {
        amount: context.amount,
        dueDate: context.dueDate,
        status: context.status
      })

      expect(message).toContain(context.amount.toString())
      expect(message.length).toBeGreaterThan(0)
    })
  })

  describe('URL Format Validation', () => {
    it('should create valid WhatsApp Web URL', () => {
      const url = generateWhatsAppUrl({
        phoneNumber: defaultPhoneNumber,
        message: 'Teste',
        platform: 'web'
      })

      expect(url).toMatch(/^https:\/\/wa\.me\//)
    })

    it('should create valid WhatsApp API URL', () => {
      const url = generateWhatsAppUrl({
        phoneNumber: defaultPhoneNumber,
        message: 'Teste',
        platform: 'api'
      })

      expect(url).toMatch(/^https:\/\/api\.whatsapp\.com\//)
    })

    it('should handle international phone numbers', () => {
      const url = generateWhatsAppUrl({
        phoneNumber: '+1234567890',
        message: 'Test'
      })

      expect(url).toContain('1234567890')
    })

    it('should remove special characters from phone number', () => {
      const url = generateWhatsAppUrl({
        phoneNumber: '+55 (33) 99989-8026',
        message: 'Teste'
      })

      expect(url).toContain('5533999898026')
      expect(url).not.toContain('(')
      expect(url).not.toContain(')')
      expect(url).not.toContain('-')
    })
  })

  describe('Message Templates', () => {
    it('should use template for new subscription', () => {
      const message = generateWhatsAppMessage('subscription', {
        planName: 'Lentes Diárias Mensal',
        isNew: true
      })

      expect(message).toContain('nova assinatura')
      expect(message).toContain('Lentes Diárias Mensal')
    })

    it('should use template for subscription pause', () => {
      const message = generateWhatsAppMessage('subscription', {
        planName: 'Lentes Diárias Mensal',
        action: 'pause'
      })

      expect(message).toContain('pausar')
      expect(message).toBeTruthy()
    })

    it('should use template for subscription reactivation', () => {
      const message = generateWhatsAppMessage('subscription', {
        planName: 'Lentes Diárias Mensal',
        action: 'reactivate'
      })

      expect(message).toContain('reativar')
      expect(message).toBeTruthy()
    })

    it('should use template for delivery delay', () => {
      const message = generateWhatsAppMessage('delivery', {
        trackingCode: 'BR123456789BR',
        status: 'delayed'
      })

      expect(message).toContain('atraso')
      expect(message).toContain('BR123456789BR')
    })

    it('should use template for payment reminder', () => {
      const message = generateWhatsAppMessage('payment', {
        amount: 149.90,
        dueDate: new Date('2025-11-03'),
        status: 'pending',
        isReminder: true
      })

      expect(message).toContain('vencimento')
      expect(message).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid context gracefully', () => {
      const message = generateWhatsAppMessage('invalid' as any, {})

      expect(message).toBeTruthy()
      expect(message.length).toBeGreaterThan(0)
    })

    it('should handle missing context data', () => {
      const message = generateWhatsAppMessage('subscription', {})

      expect(message).toBeTruthy()
      expect(message).toContain('assinatura')
    })

    it('should handle null values in context', () => {
      const message = generateWhatsAppMessage('delivery', {
        trackingCode: null,
        status: null
      })

      expect(message).toBeTruthy()
      expect(message.length).toBeGreaterThan(0)
    })
  })

  describe('Message Personalization', () => {
    it('should include customer name when available', () => {
      const message = generateWhatsAppMessage('subscription', {
        planName: 'Lentes Diárias Mensal',
        customerName: 'João Silva'
      })

      expect(message).toContain('João Silva')
    })

    it('should include subscription ID for reference', () => {
      const message = generateWhatsAppMessage('subscription', {
        planName: 'Lentes Diárias Mensal',
        subscriptionId: 'sub_123'
      })

      expect(message).toContain('sub_123')
    })

    it('should format dates in Brazilian format', () => {
      const message = generateWhatsAppMessage('payment', {
        amount: 149.90,
        dueDate: new Date('2025-11-03'),
        status: 'pending'
      })

      // Should contain Brazilian date format (dd/mm/yyyy)
      expect(message).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })

    it('should format currency in Brazilian format', () => {
      const message = generateWhatsAppMessage('payment', {
        amount: 149.90,
        dueDate: new Date('2025-11-03'),
        status: 'pending'
      })

      // Should contain R$ and comma for decimals
      expect(message).toMatch(/R\$\s*\d+,\d{2}/)
    })
  })

  describe('Integration with Subscriber Dashboard', () => {
    it('should generate correct URL for dashboard WhatsApp button', () => {
      const url = generateWhatsAppUrl({
        phoneNumber: defaultPhoneNumber,
        message: generateWhatsAppMessage('subscription', {
          planName: mockSubscription.planName
        })
      })

      expect(url).toContain('wa.me')
      expect(url).toContain(mockSubscription.planName.replace(/\s/g, '%20'))
    })

    it('should handle contextual action triggers', () => {
      const contexts = ['subscription', 'delivery', 'payment']

      contexts.forEach(context => {
        const url = generateWhatsAppUrl({
          phoneNumber: defaultPhoneNumber,
          message: generateWhatsAppMessage(context as any, {})
        })

        expect(url).toContain('wa.me')
        expect(url).toContain('5533999898026')
      })
    })
  })
})
