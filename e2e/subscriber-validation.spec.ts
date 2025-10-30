/**
 * E2E Tests: Subscriber Input Validation
 * Tests to ensure Zod schema validation is properly enforced on all subscriber APIs
 */

import { test, expect } from '@playwright/test'
import {
  getAuthToken,
  generateBase64PDF,
  generateBase64Image,
  BRAZILIAN_STATES,
  VALID_TEST_ADDRESS
} from './helpers/test-utils'

test.describe('Input Validation - Zod Schema Enforcement', () => {
  let authToken: string

  test.beforeAll(async () => {
    authToken = await getAuthToken()
  })

  test.describe('Brazilian Address Validation', () => {
    test('rejects invalid CEP format - too short', async ({ request }) => {
      const response = await request.put('/api/assinante/subscription', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          shippingAddress: {
            ...VALID_TEST_ADDRESS,
            zipCode: '123' // ❌ Too short
          }
        }
      })

      expect(response.status()).toBe(400)

      const body = await response.json()
      expect(body.error).toBe('VALIDATION_ERROR')
      expect(body.message || JSON.stringify(body.details || {})).toMatch(/CEP|zipCode/i)
    })

    test('rejects invalid CEP format - wrong pattern', async ({ request }) => {
      const response = await request.put('/api/assinante/subscription', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          shippingAddress: {
            ...VALID_TEST_ADDRESS,
            zipCode: '1234-5678' // ❌ Wrong pattern (should be 12345-678)
          }
        }
      })

      expect(response.status()).toBe(400)

      const body = await response.json()
      expect(body.error).toBe('VALIDATION_ERROR')
    })

    test('accepts valid CEP formats', async ({ request }) => {
      const validCEPs = [
        '12345-678', // With dash
        '12345678',  // Without dash
        '35300-000'  // Real Caratinga CEP
      ]

      for (const cep of validCEPs) {
        const response = await request.put('/api/assinante/subscription', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          data: {
            shippingAddress: {
              ...VALID_TEST_ADDRESS,
              zipCode: cep
            }
          }
        })

        // Should accept the CEP (might fail auth, but not validation)
        expect([200, 401, 403, 404]).toContain(response.status())

        if (response.status() === 400) {
          const body = await response.json()
          // If 400, should NOT be CEP validation error
          expect(JSON.stringify(body)).not.toMatch(/CEP|zipCode/i)
        }
      }
    })

    test('rejects invalid state code', async ({ request }) => {
      const response = await request.put('/api/assinante/subscription', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          shippingAddress: {
            ...VALID_TEST_ADDRESS,
            state: 'XX' // ❌ Invalid UF
          }
        }
      })

      expect(response.status()).toBe(400)

      const body = await response.json()
      expect(body.error).toBe('VALIDATION_ERROR')
      expect(body.message || JSON.stringify(body.details || {})).toMatch(/state|estado|UF/i)
    })

    test('accepts all valid Brazilian state codes', async ({ request }) => {
      // Test a sample of states
      const sampleStates = ['SP', 'RJ', 'MG', 'BA', 'RS', 'PR']

      for (const state of sampleStates) {
        const response = await request.put('/api/assinante/subscription', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          data: {
            shippingAddress: {
              ...VALID_TEST_ADDRESS,
              state
            }
          }
        })

        // Should accept the state code (might fail auth, but not validation)
        expect([200, 401, 403, 404]).toContain(response.status())

        if (response.status() === 400) {
          const body = await response.json()
          // If 400, should NOT be state validation error
          expect(JSON.stringify(body)).not.toMatch(/state|estado|UF/i)
        }
      }
    })

    test('rejects missing required address fields', async ({ request }) => {
      const response = await request.put('/api/assinante/subscription', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          shippingAddress: {
            zipCode: '35300-000',
            // Missing: street, number, city, state, neighborhood
          }
        }
      })

      expect(response.status()).toBe(400)

      const body = await response.json()
      expect(body.error).toBe('VALIDATION_ERROR')
      expect(body.details || body.message).toBeTruthy()
    })

    test('accepts optional complement field', async ({ request }) => {
      const response = await request.put('/api/assinante/subscription', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          shippingAddress: {
            ...VALID_TEST_ADDRESS,
            complement: undefined // Optional field
          }
        }
      })

      // Should accept without complement
      expect([200, 401, 403, 404]).toContain(response.status())
    })
  })

  test.describe('Prescription Upload Validation', () => {
    test('rejects file larger than 5MB', async ({ request }) => {
      const largePDF = generateBase64PDF(6 * 1024 * 1024) // 6MB

      const response = await request.post('/api/assinante/prescription', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          file: largePDF,
          fileName: 'receita-grande.pdf',
          mimeType: 'application/pdf'
        }
      })

      expect(response.status()).toBe(400)

      const body = await response.json()
      expect(body.error).toBe('VALIDATION_ERROR')
      expect(body.message || JSON.stringify(body.details)).toMatch(/5MB|tamanho|size/i)
    })

    test('rejects invalid MIME types', async ({ request }) => {
      const invalidFiles = [
        {
          data: 'data:text/plain;base64,dGVzdA==',
          mime: 'text/plain',
          name: 'test.txt'
        },
        {
          data: 'data:application/javascript;base64,Y29uc29sZS5sb2coJ2hhY2snKQ==',
          mime: 'application/javascript',
          name: 'malicious.js'
        },
        {
          data: 'data:text/html;base64,PGh0bWw+PHNjcmlwdD5hbGVydCgneHNzJyk8L3NjcmlwdD48L2h0bWw+',
          mime: 'text/html',
          name: 'xss.html'
        }
      ]

      for (const file of invalidFiles) {
        const response = await request.post('/api/assinante/prescription', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          data: {
            file: file.data,
            fileName: file.name,
            mimeType: file.mime
          }
        })

        expect(response.status()).toBe(400)

        const body = await response.json()
        expect(body.error).toBe('VALIDATION_ERROR')
        expect(body.message || JSON.stringify(body.details)).toMatch(/tipo|type|mime|formato/i)
      }
    })

    test('accepts valid PDF upload', async ({ request }) => {
      const validPDF = generateBase64PDF(1024 * 1024) // 1MB

      const response = await request.post('/api/assinante/prescription', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          file: validPDF,
          fileName: 'receita.pdf',
          mimeType: 'application/pdf'
        }
      })

      // Should accept PDF (might fail auth, but not validation)
      expect([200, 201, 401, 403, 404]).toContain(response.status())

      if (response.status() === 400) {
        const body = await response.json()
        // If 400, should NOT be file validation error
        expect(JSON.stringify(body)).not.toMatch(/mime|type|formato/i)
      }
    })

    test('accepts valid JPEG image', async ({ request }) => {
      const validImage = generateBase64Image(500 * 1024, 'image/jpeg') // 500KB

      const response = await request.post('/api/assinante/prescription', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          file: validImage,
          fileName: 'receita.jpg',
          mimeType: 'image/jpeg'
        }
      })

      // Should accept JPEG
      expect([200, 201, 401, 403, 404]).toContain(response.status())

      if (response.status() === 400) {
        const body = await response.json()
        expect(JSON.stringify(body)).not.toMatch(/mime|type|formato/i)
      }
    })

    test('accepts valid PNG image', async ({ request }) => {
      const validImage = generateBase64Image(500 * 1024, 'image/png') // 500KB

      const response = await request.post('/api/assinante/prescription', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          file: validImage,
          fileName: 'receita.png',
          mimeType: 'image/png'
        }
      })

      // Should accept PNG
      expect([200, 201, 401, 403, 404]).toContain(response.status())
    })

    test('rejects missing file data', async ({ request }) => {
      const response = await request.post('/api/assinante/prescription', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          fileName: 'receita.pdf',
          mimeType: 'application/pdf'
          // Missing: file
        }
      })

      expect(response.status()).toBe(400)

      const body = await response.json()
      expect(body.error).toBe('VALIDATION_ERROR')
    })
  })

  test.describe('Delivery Preferences Validation', () => {
    test('rejects invalid phone format - too short', async ({ request }) => {
      const response = await request.put('/api/assinante/delivery-preferences', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          notificationPhone: '123' // ❌ Too short
        }
      })

      expect(response.status()).toBe(400)

      const body = await response.json()
      expect(body.error).toBe('VALIDATION_ERROR')
      expect(body.message || JSON.stringify(body.details)).toMatch(/phone|telefone/i)
    })

    test('rejects invalid phone format - letters', async ({ request }) => {
      const response = await request.put('/api/assinante/delivery-preferences', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          notificationPhone: 'abc-defg-hijk' // ❌ Letters
        }
      })

      expect(response.status()).toBe(400)

      const body = await response.json()
      expect(body.error).toBe('VALIDATION_ERROR')
    })

    test('accepts valid Brazilian phone formats', async ({ request }) => {
      const validPhones = [
        '(11) 98765-4321',  // Mobile with formatting
        '11987654321',      // Mobile without formatting
        '(11) 3456-7890',   // Landline with formatting
        '1134567890',       // Landline without formatting
        '(33) 99999-8888',  // Caratinga mobile
        '5511987654321'     // With country code
      ]

      for (const phone of validPhones) {
        const response = await request.put('/api/assinante/delivery-preferences', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          data: {
            notificationPhone: phone
          }
        })

        // Should accept the phone (might fail auth, but not validation)
        expect([200, 201, 401, 403, 404]).toContain(response.status())

        if (response.status() === 400) {
          const body = await response.json()
          // If 400, should NOT be phone validation error
          expect(JSON.stringify(body)).not.toMatch(/phone|telefone/i)
        }
      }
    })

    test('accepts valid delivery instructions', async ({ request }) => {
      const validInstructions = [
        'Deixar com porteiro',
        'Entregar após 18h',
        'Tocar campainha 2x',
        'Apartamento 101, 3º andar'
      ]

      for (const instructions of validInstructions) {
        const response = await request.put('/api/assinante/delivery-preferences', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          data: {
            deliveryInstructions: instructions
          }
        })

        // Should accept instructions
        expect([200, 201, 401, 403, 404]).toContain(response.status())
      }
    })

    test('rejects extremely long delivery instructions', async ({ request }) => {
      // Create a very long string (>500 characters)
      const longInstructions = 'A'.repeat(1000)

      const response = await request.put('/api/assinante/delivery-preferences', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          deliveryInstructions: longInstructions
        }
      })

      expect(response.status()).toBe(400)

      const body = await response.json()
      expect(body.error).toBe('VALIDATION_ERROR')
      expect(body.message || JSON.stringify(body.details)).toMatch(/instruc|length|tamanho/i)
    })
  })

  test.describe('Email Validation', () => {
    test('rejects invalid email formats during registration', async ({ request }) => {
      const invalidEmails = [
        'notanemail',
        '@nodomain.com',
        'user@',
        'user @domain.com',
        'user@domain',
        'user..double@domain.com'
      ]

      for (const email of invalidEmails) {
        const response = await request.post('/api/assinante/register', {
          headers: { 'Content-Type': 'application/json' },
          data: {
            email,
            password: 'ValidPass123!',
            name: 'Test User'
          }
        })

        expect(response.status()).toBe(400)

        const body = await response.json()
        expect(body.error).toBe('VALIDATION_ERROR')
        expect(body.message || JSON.stringify(body.details)).toMatch(/email|e-mail/i)
      }
    })

    test('accepts valid email formats', async ({ request }) => {
      const validEmails = [
        'user@domain.com',
        'user.name@domain.com',
        'user+tag@domain.com.br',
        'user123@sub.domain.com'
      ]

      for (const email of validEmails) {
        const response = await request.post('/api/assinante/register', {
          headers: { 'Content-Type': 'application/json' },
          data: {
            email,
            password: 'ValidPass123!',
            name: 'Test User'
          }
        })

        // Should accept email format (might fail for other reasons)
        if (response.status() === 400) {
          const body = await response.json()
          // If 400, should NOT be email validation error
          expect(JSON.stringify(body)).not.toMatch(/email.*inválid|invalid.*email/i)
        }
      }
    })
  })

  test.describe('Password Validation', () => {
    test('rejects weak passwords during registration', async ({ request }) => {
      const weakPasswords = [
        '123',          // Too short
        'password',     // No numbers or special chars
        '12345678',     // Only numbers
        'Pass123'       // Too short
      ]

      for (const password of weakPasswords) {
        const response = await request.post('/api/assinante/register', {
          headers: { 'Content-Type': 'application/json' },
          data: {
            email: 'test@svlentes.shop',
            password,
            name: 'Test User'
          }
        })

        expect(response.status()).toBe(400)

        const body = await response.json()
        expect(body.error).toBe('VALIDATION_ERROR')
        expect(body.message || JSON.stringify(body.details)).toMatch(/senha|password/i)
      }
    })

    test('accepts strong passwords', async ({ request }) => {
      const strongPasswords = [
        'ValidPass123!',
        'Str0ng!Pass',
        'MyP@ssw0rd123',
        'Secure#2024'
      ]

      for (const password of strongPasswords) {
        const response = await request.post('/api/assinante/register', {
          headers: { 'Content-Type': 'application/json' },
          data: {
            email: `test_${Date.now()}@svlentes.shop`,
            password,
            name: 'Test User'
          }
        })

        // Should accept password format (might fail for duplicate email)
        if (response.status() === 400) {
          const body = await response.json()
          // If 400, should NOT be password validation error
          expect(JSON.stringify(body)).not.toMatch(/senha.*fraca|weak.*password/i)
        }
      }
    })
  })

  test.describe('Date Validation', () => {
    test('rejects invalid date formats for payment history', async ({ request }) => {
      const response = await request.get(
        '/api/assinante/payment-history?startDate=invalid-date&endDate=2024-12-31',
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      )

      expect(response.status()).toBe(400)

      const body = await response.json()
      expect(body.error).toBe('VALIDATION_ERROR')
      expect(body.message || JSON.stringify(body.details)).toMatch(/data|date/i)
    })

    test('accepts valid ISO date formats', async ({ request }) => {
      const response = await request.get(
        '/api/assinante/payment-history?startDate=2024-01-01&endDate=2024-12-31',
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      )

      // Should accept date format (might fail auth, but not validation)
      expect([200, 401, 403, 404]).toContain(response.status())

      if (response.status() === 400) {
        const body = await response.json()
        // If 400, should NOT be date validation error
        expect(JSON.stringify(body)).not.toMatch(/data.*inválid|invalid.*date/i)
      }
    })

    test('rejects future dates for payment history', async ({ request }) => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const futureDateStr = futureDate.toISOString().split('T')[0]

      const response = await request.get(
        `/api/assinante/payment-history?startDate=${futureDateStr}&endDate=${futureDateStr}`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      )

      // Should either reject or return empty results
      if (response.status() === 400) {
        const body = await response.json()
        expect(body.error).toBe('VALIDATION_ERROR')
      } else if (response.status() === 200) {
        const body = await response.json()
        // Should return no results for future dates
        expect(body.payments || []).toHaveLength(0)
      }
    })
  })
})
