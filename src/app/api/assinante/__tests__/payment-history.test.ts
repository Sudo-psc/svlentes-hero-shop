/**
 * Payment History API Tests - Phase 3
 * Testes completos para histórico de pagamentos e filtragem
 */

import { describe, it, expect, beforeEach, vi } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '../payment-history/route'
import {
  mockPaymentHistory,
  createMockPaymentHistoryResponse
} from '@/__tests__/fixtures/phase3-fixtures'

describe('Payment History API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/assinante/payment-history', () => {
    it('should return complete list of payments', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.payments).toBeDefined()
      expect(Array.isArray(data.payments)).toBe(true)
      expect(data.payments.length).toBeGreaterThan(0)
    })

    it('should return summary with correct totals', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(data.summary).toBeDefined()
      expect(data.summary.totalPaid).toBeDefined()
      expect(data.summary.totalPending).toBeDefined()
      expect(data.summary.totalOverdue).toBeDefined()
      expect(data.summary.paymentCount).toBeDefined()
      expect(typeof data.summary.totalPaid).toBe('number')
      expect(typeof data.summary.paymentCount).toBe('number')
    })

    it('should return pagination metadata', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(data.pagination).toBeDefined()
      expect(data.pagination.page).toBeDefined()
      expect(data.pagination.limit).toBeDefined()
      expect(data.pagination.total).toBeDefined()
      expect(data.pagination.totalPages).toBeDefined()
    })

    it('should filter by status PAID', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&status=PAID'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.payments.every((p: any) => p.status === 'PAID')).toBe(true)
    })

    it('should filter by status PENDING', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&status=PENDING'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.payments.every((p: any) => p.status === 'PENDING')).toBe(true)
      expect(data.payments.length).toBeGreaterThan(0)
    })

    it('should filter by status OVERDUE', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&status=OVERDUE'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      // May return empty array if no overdue payments
      expect(Array.isArray(data.payments)).toBe(true)
    })

    it('should filter by payment method PIX', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&method=PIX'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.payments.every((p: any) => p.paymentMethod === 'PIX')).toBe(true)
    })

    it('should filter by payment method BOLETO', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&method=BOLETO'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.payments.every((p: any) => p.paymentMethod === 'BOLETO')).toBe(true)
    })

    it('should filter by payment method CREDIT_CARD', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&method=CREDIT_CARD'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.payments.every((p: any) => p.paymentMethod === 'CREDIT_CARD')).toBe(true)
    })

    it('should filter by date range (startDate/endDate)', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&startDate=2025-08-01&endDate=2025-10-31'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)

      const startDate = new Date('2025-08-01')
      const endDate = new Date('2025-10-31')

      data.payments.forEach((payment: any) => {
        const paymentDate = new Date(payment.dueDate)
        expect(paymentDate >= startDate).toBe(true)
        expect(paymentDate <= endDate).toBe(true)
      })
    })

    it('should combine multiple filters (status + method)', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&status=PAID&method=PIX'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(
        data.payments.every(
          (p: any) => p.status === 'PAID' && p.paymentMethod === 'PIX'
        )
      ).toBe(true)
    })

    it('should combine all filters (status + method + dateRange)', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&status=PAID&method=PIX&startDate=2025-09-01&endDate=2025-10-31'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)

      const startDate = new Date('2025-09-01')
      const endDate = new Date('2025-10-31')

      data.payments.forEach((payment: any) => {
        expect(payment.status).toBe('PAID')
        expect(payment.paymentMethod).toBe('PIX')
        const paymentDate = new Date(payment.dueDate)
        expect(paymentDate >= startDate && paymentDate <= endDate).toBe(true)
      })
    })

    it('should sort by date (most recent first)', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)

      for (let i = 0; i < data.payments.length - 1; i++) {
        const currentDate = new Date(data.payments[i].dueDate)
        const nextDate = new Date(data.payments[i + 1].dueDate)
        expect(currentDate >= nextDate).toBe(true)
      }
    })

    it('should paginate correctly (page 1)', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&page=1&limit=5'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.page).toBe(1)
      expect(data.payments.length).toBeLessThanOrEqual(5)
    })

    it('should paginate correctly (page 2)', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&page=2&limit=5'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.page).toBe(2)
    })

    it('should paginate correctly (page 3)', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&page=3&limit=5'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.page).toBe(3)
    })

    it('should respect limit parameter (10)', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&limit=10'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.payments.length).toBeLessThanOrEqual(10)
    })

    it('should respect limit parameter (20)', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&limit=20'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.payments.length).toBeLessThanOrEqual(20)
    })

    it('should respect limit parameter (50)', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&limit=50'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.payments.length).toBeLessThanOrEqual(50)
    })

    it('should return 401 without authentication', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Não autorizado')
    })

    it('should return empty array when user has no payments', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_999'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.payments).toEqual([])
      expect(data.summary.paymentCount).toBe(0)
    })

    it('should calculate onTimePaymentRate correctly', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(data.summary.onTimePaymentRate).toBeDefined()
      expect(data.summary.onTimePaymentRate).toBeGreaterThanOrEqual(0)
      expect(data.summary.onTimePaymentRate).toBeLessThanOrEqual(100)
      expect(typeof data.summary.onTimePaymentRate).toBe('number')
    })

    it('should calculate averagePaymentTime correctly', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(data.summary.averagePaymentTime).toBeDefined()
      expect(typeof data.summary.averagePaymentTime).toBe('number')
      expect(data.summary.averagePaymentTime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle page beyond total (returns empty)', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&page=999&limit=20'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.payments).toEqual([])
    })

    it('should use default limit when negative limit provided', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&limit=-10'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.limit).toBe(20) // Default limit
    })

    it('should return 400 for invalid date format', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&startDate=invalid-date'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('data inválida')
    })

    it('should return 400 for invalid status', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&status=INVALID_STATUS'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('status inválido')
    })

    it('should handle concurrent requests', async () => {
      const requests = []

      for (let i = 0; i < 5; i++) {
        requests.push(
          GET(
            new NextRequest(
              `http://localhost/api/assinante/payment-history?userId=user_123&page=${i + 1}`
            )
          )
        )
      }

      const responses = await Promise.all(requests)
      const successCount = responses.filter(r => r.status === 200).length

      expect(successCount).toBe(5)
    })

    it('should handle empty date range', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&startDate=2025-12-01&endDate=2025-12-31'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.payments).toEqual([])
    })

    it('should handle startDate after endDate', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&startDate=2025-12-01&endDate=2025-01-01'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('data')
    })

    it('should handle very large limit gracefully', async () => {
      const req = new NextRequest(
        'http://localhost/api/assinante/payment-history?userId=user_123&limit=10000'
      )

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.limit).toBeLessThanOrEqual(100) // Max limit cap
    })
  })
})
