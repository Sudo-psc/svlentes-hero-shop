import {
  formatPhoneNumber,
  getWhatsAppLink,
  getPhoneNumbers,
  getFormattedPhoneNumbers,
} from '../phone-utils'

describe('phone-utils', () => {
  describe('formatPhoneNumber', () => {
    it('should format phone number with country code', () => {
      expect(formatPhoneNumber('5533999898026')).toBe('(33) 99989-8026')
      expect(formatPhoneNumber('5533986061427')).toBe('(33) 98606-1427')
    })

    it('should format phone number with plus sign', () => {
      expect(formatPhoneNumber('+5533999898026')).toBe('(33) 99989-8026')
      expect(formatPhoneNumber('+5533986061427')).toBe('(33) 98606-1427')
    })

    it('should format phone number without country code', () => {
      expect(formatPhoneNumber('33999898026')).toBe('(33) 99989-8026')
      expect(formatPhoneNumber('33986061427')).toBe('(33) 98606-1427')
    })

    it('should format landline numbers (8 digits)', () => {
      expect(formatPhoneNumber('3335219999')).toBe('(33) 3521-9999')
      expect(formatPhoneNumber('553335219999')).toBe('(33) 3521-9999')
    })

    it('should handle already formatted numbers', () => {
      expect(formatPhoneNumber('(33) 99989-8026')).toBe('(33) 99989-8026')
    })

    it('should return original if format is not recognized', () => {
      expect(formatPhoneNumber('123')).toBe('123')
    })
  })

  describe('getWhatsAppLink', () => {
    it('should generate WhatsApp link without message', () => {
      expect(getWhatsAppLink('5533999898026')).toBe('https://wa.me/5533999898026')
    })

    it('should generate WhatsApp link with message', () => {
      const message = 'Olá! Tenho uma dúvida.'
      const result = getWhatsAppLink('5533999898026', message)
      expect(result).toBe('https://wa.me/5533999898026?text=Ol%C3%A1!%20Tenho%20uma%20d%C3%BAvida.')
    })

    it('should clean phone number before generating link', () => {
      expect(getWhatsAppLink('(33) 99989-8026')).toBe('https://wa.me/33999898026')
      expect(getWhatsAppLink('+55 33 99989-8026')).toBe('https://wa.me/5533999898026')
    })
  })

  describe('getPhoneNumbers', () => {
    const originalEnv = process.env

    beforeEach(() => {
      jest.resetModules()
      process.env = { ...originalEnv }
    })

    afterAll(() => {
      process.env = originalEnv
    })

    it('should return default phone numbers when env vars are not set', () => {
      delete process.env.NEXT_PUBLIC_WHATSAPP_CHATBOT
      delete process.env.NEXT_PUBLIC_SUPPORT_PHONE

      const phones = getPhoneNumbers()
      expect(phones.chatbot).toBe('5533999898026')
      expect(phones.support).toBe('5533986061427')
    })

    it('should return env vars when set', () => {
      process.env.NEXT_PUBLIC_WHATSAPP_CHATBOT = '5511999999999'
      process.env.NEXT_PUBLIC_SUPPORT_PHONE = '5511888888888'

      const phones = getPhoneNumbers()
      expect(phones.chatbot).toBe('5511999999999')
      expect(phones.support).toBe('5511888888888')
    })
  })

  describe('getFormattedPhoneNumbers', () => {
    it('should return both raw and formatted phone numbers', () => {
      const result = getFormattedPhoneNumbers()
      
      expect(result.chatbot).toBe('(33) 99989-8026')
      expect(result.support).toBe('(33) 98606-1427')
      expect(result.chatbotRaw).toBe('5533999898026')
      expect(result.supportRaw).toBe('5533986061427')
    })
  })
})
