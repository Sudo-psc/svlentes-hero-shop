/**
 * Prescription API Tests - Phase 3
 * Testes completos para gerenciamento de prescrições médicas
 */

import { describe, it, expect, beforeEach, vi } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST, PUT } from '../prescription/route'
import {
  mockPrescription,
  mockPrescriptionHistory,
  validPrescriptionFile,
  validJpgFile,
  validPngFile,
  oversizedFile,
  invalidFormatFile
} from '@/__tests__/fixtures/phase3-fixtures'

describe('Prescription API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/assinante/prescription', () => {
    it('should return current prescription with status VALID', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/prescription?userId=user_123'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.currentPrescription).toBeDefined()
      expect(data.currentPrescription.status).toBe('VALID')
      expect(data.currentPrescription.daysUntilExpiry).toBeGreaterThan(30)
    })

    it('should return prescription with status EXPIRING_SOON (< 30 days)', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/prescription?userId=user_123&mockStatus=EXPIRING_SOON'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.currentPrescription.status).toBe('EXPIRING_SOON')
      expect(data.currentPrescription.daysUntilExpiry).toBeLessThan(30)
      expect(data.currentPrescription.daysUntilExpiry).toBeGreaterThan(0)
    })

    it('should return prescription with status EXPIRED', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/prescription?userId=user_123&mockStatus=EXPIRED'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.currentPrescription.status).toBe('EXPIRED')
      expect(data.currentPrescription.daysUntilExpiry).toBeLessThan(0)
    })

    it('should calculate daysUntilExpiry correctly', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/prescription?userId=user_123'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(data.currentPrescription.daysUntilExpiry).toBeDefined()
      expect(typeof data.currentPrescription.daysUntilExpiry).toBe('number')

      const expiryDate = new Date(data.currentPrescription.expiryDate)
      const today = new Date()
      const diffTime = expiryDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      expect(data.currentPrescription.daysUntilExpiry).toBe(diffDays)
    })

    it('should return prescription history', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/prescription?userId=user_123'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(data.history).toBeDefined()
      expect(Array.isArray(data.history)).toBe(true)
      expect(data.history.length).toBeGreaterThanOrEqual(1)
      expect(data.history[0]).toHaveProperty('id')
      expect(data.history[0]).toHaveProperty('status')
      expect(data.history[0]).toHaveProperty('expiryDate')
    })

    it('should return alerts when prescription expiring', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/prescription?userId=user_123&mockStatus=EXPIRING_SOON'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(data.alerts).toBeDefined()
      expect(Array.isArray(data.alerts)).toBe(true)
      expect(data.alerts.length).toBeGreaterThan(0)
      expect(data.alerts[0].type).toBe('warning')
      expect(data.alerts[0].message).toContain('vence')
    })

    it('should return 401 without authentication', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/prescription'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Não autorizado')
    })

    it('should return 404 when user has no prescription', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/prescription?userId=user_999'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Prescrição não encontrada')
    })

    it('should return 200 with cache headers', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/prescription?userId=user_123'
      )

      const response = await GET(req)

      expect(response.status).toBe(200)
      expect(response.headers.get('Cache-Control')).toBeDefined()
      expect(response.headers.get('Cache-Control')).toContain('max-age')
    })
  })

  describe('POST /api/assinante/prescription', () => {
    it('should upload valid PDF file (< 5MB)', async () => {
      const formData = new FormData()
      formData.append('file', validPrescriptionFile)
      formData.append('userId', 'user_123')
      formData.append('rightEyeSph', '-2.50')
      formData.append('leftEyeSph', '-2.25')

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription',
        {
          method: 'POST',
          body: formData
        }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.prescription).toBeDefined()
      expect(data.prescription.fileUrl).toBeDefined()
      expect(data.prescription.status).toBe('VALID')
    })

    it('should upload valid JPG file (< 5MB)', async () => {
      const formData = new FormData()
      formData.append('file', validJpgFile)
      formData.append('userId', 'user_123')
      formData.append('rightEyeSph', '-2.50')
      formData.append('leftEyeSph', '-2.25')

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription',
        {
          method: 'POST',
          body: formData
        }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.prescription.fileMimeType).toBe('image/jpeg')
    })

    it('should upload valid PNG file (< 5MB)', async () => {
      const formData = new FormData()
      formData.append('file', validPngFile)
      formData.append('userId', 'user_123')
      formData.append('rightEyeSph', '-2.50')
      formData.append('leftEyeSph', '-2.25')

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription',
        {
          method: 'POST',
          body: formData
        }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.prescription.fileMimeType).toBe('image/png')
    })

    it('should reject file > 5MB', async () => {
      const formData = new FormData()
      formData.append('file', oversizedFile)
      formData.append('userId', 'user_123')

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription',
        {
          method: 'POST',
          body: formData
        }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('5MB')
    })

    it('should reject invalid format (.doc, .txt)', async () => {
      const formData = new FormData()
      formData.append('file', invalidFormatFile)
      formData.append('userId', 'user_123')

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription',
        {
          method: 'POST',
          body: formData
        }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('formato')
    })

    it('should validate required fields (graus OD/OE)', async () => {
      const formData = new FormData()
      formData.append('file', validPrescriptionFile)
      formData.append('userId', 'user_123')
      // Missing rightEyeSph and leftEyeSph

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription',
        {
          method: 'POST',
          body: formData
        }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toBeDefined()
      expect(data.errors.length).toBeGreaterThan(0)
    })

    it('should create new record in database', async () => {
      const formData = new FormData()
      formData.append('file', validPrescriptionFile)
      formData.append('userId', 'user_123')
      formData.append('rightEyeSph', '-2.50')
      formData.append('leftEyeSph', '-2.25')

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription',
        {
          method: 'POST',
          body: formData
        }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.prescription.id).toBeDefined()
      expect(data.prescription.userId).toBe('user_123')
      expect(data.prescription.createdAt).toBeDefined()
    })

    it('should invalidate previous prescription', async () => {
      const formData = new FormData()
      formData.append('file', validPrescriptionFile)
      formData.append('userId', 'user_123')
      formData.append('rightEyeSph', '-2.50')
      formData.append('leftEyeSph', '-2.25')

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription',
        {
          method: 'POST',
          body: formData
        }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.message).toContain('anterior invalidada')
    })

    it('should return 400 with Zod validation errors', async () => {
      const formData = new FormData()
      formData.append('file', validPrescriptionFile)
      formData.append('userId', 'user_123')
      formData.append('rightEyeSph', 'invalid') // Invalid number format
      formData.append('leftEyeSph', '-2.25')

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription',
        {
          method: 'POST',
          body: formData
        }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toBeDefined()
    })

    it('should return 401 without authentication', async () => {
      const formData = new FormData()
      formData.append('file', validPrescriptionFile)

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription',
        {
          method: 'POST',
          body: formData
        }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Não autorizado')
    })
  })

  describe('PUT /api/assinante/prescription/:id', () => {
    it('should update prescription graus', async () => {
      const body = {
        userId: 'user_123',
        prescriptionData: {
          rightEye: { spherical: -3.00, cylindrical: -0.75, axis: 180 },
          leftEye: { spherical: -2.75, cylindrical: -0.50, axis: 175 }
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription/presc_123',
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.prescription.prescriptionData.rightEye.spherical).toBe(-3.00)
    })

    it('should update doctor information', async () => {
      const body = {
        userId: 'user_123',
        doctorInfo: {
          name: 'Dr. Maria Silva',
          crm: 'CRM-SP 12345',
          issueDate: new Date('2025-11-01')
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription/presc_123',
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.prescription.doctorInfo.name).toBe('Dr. Maria Silva')
    })

    it('should validate ownership (only owner can update)', async () => {
      const body = {
        userId: 'user_123',
        prescriptionData: {
          rightEye: { spherical: -3.00 }
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription/presc_456',
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 403 when user tries to update another user prescription', async () => {
      const body = {
        userId: 'user_999',
        prescriptionData: {
          rightEye: { spherical: -3.00 }
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription/presc_123',
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Acesso negado')
    })

    it('should return 404 for non-existent ID', async () => {
      const body = {
        userId: 'user_123',
        prescriptionData: {
          rightEye: { spherical: -3.00 }
        }
      }

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription/presc_999',
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Prescrição não encontrada')
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple simultaneous uploads', async () => {
      const uploads = []

      for (let i = 0; i < 3; i++) {
        const formData = new FormData()
        formData.append('file', validPrescriptionFile)
        formData.append('userId', `user_${i}`)
        formData.append('rightEyeSph', '-2.50')
        formData.append('leftEyeSph', '-2.25')

        uploads.push(
          POST(
            new NextRequest('http://localhost/api/assinante/prescription', {
              method: 'POST',
              body: formData
            })
          )
        )
      }

      const responses = await Promise.all(uploads)
      const successCount = responses.filter(r => r.status === 201).length

      expect(successCount).toBeGreaterThan(0)
    })

    it('should handle upload with interrupted connection', async () => {
      const formData = new FormData()
      formData.append('file', validPrescriptionFile)
      formData.append('userId', 'user_123')

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription',
        {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(1) // Immediate timeout
        }
      )

      try {
        await POST(req)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should handle prescription already expired on upload', async () => {
      const formData = new FormData()
      formData.append('file', validPrescriptionFile)
      formData.append('userId', 'user_123')
      formData.append('rightEyeSph', '-2.50')
      formData.append('leftEyeSph', '-2.25')
      formData.append('expiryDate', '2025-01-01') // Already expired

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription',
        {
          method: 'POST',
          body: formData
        }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('expirada')
    })

    it('should handle special characters in fileName', async () => {
      const specialFile = new File(
        [validPrescriptionFile],
        'prescrição-médica-2025_#1.pdf',
        { type: 'application/pdf' }
      )

      const formData = new FormData()
      formData.append('file', specialFile)
      formData.append('userId', 'user_123')
      formData.append('rightEyeSph', '-2.50')
      formData.append('leftEyeSph', '-2.25')

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription',
        {
          method: 'POST',
          body: formData
        }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.prescription.fileName).toBeDefined()
    })

    it('should handle file size exactly 5MB (boundary)', async () => {
      const exactFile = new File(
        [new Array(5242880).fill('a').join('')], // Exactly 5MB
        'prescription.pdf',
        { type: 'application/pdf' }
      )

      const formData = new FormData()
      formData.append('file', exactFile)
      formData.append('userId', 'user_123')
      formData.append('rightEyeSph', '-2.50')
      formData.append('leftEyeSph', '-2.25')

      const req = new NextRequest(
        'http://localhost/api/assinante/prescription',
        {
          method: 'POST',
          body: formData
        }
      )

      const response = await POST(req)

      expect(response.status).toBe(201)
    })
  })
})
