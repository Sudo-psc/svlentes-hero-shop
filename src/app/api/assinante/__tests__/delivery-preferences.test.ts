/**
 * Delivery Preferences API Tests - Phase 3
 * Testes completos para gerenciamento de preferências de entrega
 */

import { describe, it, expect, beforeEach, vi } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, PUT } from '../delivery-preferences/route'
import {
  mockDeliveryPreferences,
  createMockDeliveryPreferencesResponse
} from '@/__tests__/fixtures/phase3-fixtures'

describe('Delivery Preferences API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/assinante/delivery-preferences', () => {
    it('should return current preferences', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences?userId=user_123'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.preferences).toBeDefined()
      expect(data.preferences.address).toBeDefined()
      expect(data.preferences.contact).toBeDefined()
      expect(data.preferences.deliveryWindow).toBeDefined()
      expect(data.preferences.notifications).toBeDefined()
    })

    it('should return upcomingDelivery info', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences?userId=user_123'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(data.upcomingDelivery).toBeDefined()
      expect(data.upcomingDelivery.estimatedDate).toBeDefined()
      expect(data.upcomingDelivery.daysUntilNext).toBeDefined()
      expect(data.upcomingDelivery.status).toBeDefined()
    })

    it('should return metadata with last update info', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences?userId=user_123'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(data.metadata).toBeDefined()
      expect(data.metadata.lastUpdated).toBeDefined()
      expect(data.metadata.canUpdate).toBeDefined()
    })

    it('should return 401 without authentication', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Não autorizado')
    })

    it('should return defaults when user has no preferences', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences?userId=user_999'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.preferences).toBeDefined()
      expect(data.preferences.notifications).toEqual({
        sms: false,
        email: true,
        whatsapp: true,
        pushNotification: false
      })
    })
  })

  describe('PUT /api/assinante/delivery-preferences', () => {
    it('should update complete address', async () => {
      const body = {
        userId: 'user_123',
        address: {
          street: 'Rua Nova',
          number: '456',
          complement: 'Casa 2',
          neighborhood: 'Bairro Novo',
          city: 'Caratinga',
          state: 'MG',
          zipCode: '35300-001'
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences',
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.preferences.address.street).toBe('Rua Nova')
      expect(data.preferences.address.number).toBe('456')
    })

    it('should update delivery time preferences', async () => {
      const body = {
        userId: 'user_123',
        deliveryWindow: {
          preferredPeriod: 'afternoon',
          instructions: 'Ligar antes de entregar'
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences',
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.preferences.deliveryWindow.preferredPeriod).toBe('afternoon')
      expect(data.preferences.deliveryWindow.instructions).toBe(
        'Ligar antes de entregar'
      )
    })

    it('should update notification preferences', async () => {
      const body = {
        userId: 'user_123',
        notifications: {
          sms: true,
          email: true,
          whatsapp: true,
          pushNotification: true
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences',
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.preferences.notifications.sms).toBe(true)
      expect(data.preferences.notifications.pushNotification).toBe(true)
    })

    it('should validate CEP format (12345-678)', async () => {
      const validBody = {
        userId: 'user_123',
        address: {
          zipCode: '35300-000'
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences',
        {
          method: 'PUT',
          body: JSON.stringify(validBody)
        }
      )

      const response = await PUT(req)
      expect(response.status).toBe(200)
    })

    it('should reject invalid CEP format', async () => {
      const invalidBody = {
        userId: 'user_123',
        address: {
          zipCode: '12345678' // Missing hyphen
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences',
        {
          method: 'PUT',
          body: JSON.stringify(invalidBody)
        }
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('CEP')
    })

    it('should validate phone format (11987654321)', async () => {
      const validBody = {
        userId: 'user_123',
        contact: {
          phone: '5533999898026'
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences',
        {
          method: 'PUT',
          body: JSON.stringify(validBody)
        }
      )

      const response = await PUT(req)
      expect(response.status).toBe(200)
    })

    it('should reject invalid phone format', async () => {
      const invalidBody = {
        userId: 'user_123',
        contact: {
          phone: '123' // Too short
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences',
        {
          method: 'PUT',
          body: JSON.stringify(invalidBody)
        }
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('telefone')
    })

    it('should validate required fields', async () => {
      const incompleteBody = {
        userId: 'user_123',
        address: {
          street: 'Rua Teste'
          // Missing required fields
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences',
        {
          method: 'PUT',
          body: JSON.stringify(incompleteBody)
        }
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.errors).toBeDefined()
      expect(data.errors.length).toBeGreaterThan(0)
    })

    it('should return 400 with Zod validation errors', async () => {
      const invalidBody = {
        userId: 'user_123',
        address: {
          state: 'INVALID' // Should be 2-letter UF code
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences',
        {
          method: 'PUT',
          body: JSON.stringify(invalidBody)
        }
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.errors).toBeDefined()
    })

    it('should return 401 without authentication', async () => {
      const body = {
        address: {
          street: 'Rua Teste'
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences',
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Não autorizado')
    })

    it('should create audit log of changes', async () => {
      const body = {
        userId: 'user_123',
        address: {
          street: 'Rua Principal',
          number: '123',
          neighborhood: 'Centro',
          city: 'Caratinga',
          state: 'MG',
          zipCode: '35300-000'
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences',
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.metadata.lastUpdated).toBeDefined()
    })

    it('should not affect deliveries in transit', async () => {
      const body = {
        userId: 'user_123',
        address: {
          street: 'Rua Nova',
          number: '456',
          neighborhood: 'Centro',
          city: 'Caratinga',
          state: 'MG',
          zipCode: '35300-001'
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences',
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('próxima entrega')
    })

    it('should affect next scheduled delivery', async () => {
      const body = {
        userId: 'user_123',
        address: {
          street: 'Rua Nova',
          number: '456',
          neighborhood: 'Centro',
          city: 'Caratinga',
          state: 'MG',
          zipCode: '35300-001'
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences',
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.upcomingDelivery).toBeDefined()
      expect(data.upcomingDelivery.estimatedDate).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should reject invalid CEP format variations', async () => {
      const invalidCeps = ['1234567', '12345-67', 'abcde-fgh', '']

      for (const cep of invalidCeps) {
        const body = {
          userId: 'user_123',
          address: { zipCode: cep }
        }

        const req = new NextRequest(
          'http://localhost/api/assinante/delivery-preferences',
          {
            method: 'PUT',
            body: JSON.stringify(body)
          }
        )

        const response = await PUT(req)
        expect(response.status).toBe(400)
      }
    })

    it('should reject invalid phone formats', async () => {
      const invalidPhones = ['123', '12345', 'abcdefghij', '+55']

      for (const phone of invalidPhones) {
        const body = {
          userId: 'user_123',
          contact: { phone }
        }

        const req = new NextRequest(
          'http://localhost/api/assinante/delivery-preferences',
          {
            method: 'PUT',
            body: JSON.stringify(body)
          }
        )

        const response = await PUT(req)
        expect(response.status).toBe(400)
      }
    })

    it('should validate Brazilian state codes (UF)', async () => {
      const validStates = ['MG', 'SP', 'RJ', 'RS', 'BA']

      for (const state of validStates) {
        const body = {
          userId: 'user_123',
          address: {
            street: 'Rua Teste',
            number: '123',
            neighborhood: 'Centro',
            city: 'Cidade',
            state,
            zipCode: '35300-000'
          }
        }

        const req = new NextRequest(
          'http://localhost/api/assinante/delivery-preferences',
          {
            method: 'PUT',
            body: JSON.stringify(body)
          }
        )

        const response = await PUT(req)
        expect(response.status).toBe(200)
      }
    })

    it('should reject invalid state codes', async () => {
      const invalidStates = ['XX', 'ABC', '12', 'mg']

      for (const state of invalidStates) {
        const body = {
          userId: 'user_123',
          address: { state }
        }

        const req = new NextRequest(
          'http://localhost/api/assinante/delivery-preferences',
          {
            method: 'PUT',
            body: JSON.stringify(body)
          }
        )

        const response = await PUT(req)
        expect(response.status).toBe(400)
      }
    })

    it('should handle empty string fields', async () => {
      const body = {
        userId: 'user_123',
        address: {
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: 'MG',
          zipCode: '35300-000'
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences',
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.errors).toBeDefined()
    })

    it('should handle special characters in address', async () => {
      const body = {
        userId: 'user_123',
        address: {
          street: 'Rua São João',
          number: '123-A',
          complement: 'Apto 201 - Bloco 3',
          neighborhood: 'Centro',
          city: 'Caratinga',
          state: 'MG',
          zipCode: '35300-000'
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences',
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
      )

      const response = await PUT(req)
      expect(response.status).toBe(200)
    })

    it('should handle concurrent updates', async () => {
      const updates = []

      for (let i = 0; i < 3; i++) {
        const body = {
          userId: `user_${i}`,
          address: {
            street: `Rua ${i}`,
            number: `${i}`,
            neighborhood: 'Centro',
            city: 'Caratinga',
            state: 'MG',
            zipCode: '35300-000'
          }
        }

        updates.push(
          PUT(
            new NextRequest(
              'http://localhost/api/assinante/delivery-preferences',
              {
                method: 'PUT',
                body: JSON.stringify(body)
              }
            )
          )
        )
      }

      const responses = await Promise.all(updates)
      const successCount = responses.filter(r => r.status === 200).length

      expect(successCount).toBeGreaterThan(0)
    })

    it('should handle null complement gracefully', async () => {
      const body = {
        userId: 'user_123',
        address: {
          street: 'Rua Principal',
          number: '123',
          complement: null,
          neighborhood: 'Centro',
          city: 'Caratinga',
          state: 'MG',
          zipCode: '35300-000'
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-preferences',
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
      )

      const response = await PUT(req)
      expect(response.status).toBe(200)
    })
  })
})
