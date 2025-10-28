import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from '@/app/api/v1/analytics/dashboard/route'
import { NextRequest } from 'next/server'
import { analyticsService } from '@/lib/reminders'

// Mock do analyticsService
vi.mock('@/lib/reminders', () => ({
  analyticsService: {
    getDashboardMetrics: vi.fn()
  }
}))

describe('/api/v1/analytics/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/v1/analytics/dashboard', () => {
    const mockMetrics = {
      totalRevenue: 2450.0,
      activeSubscriptions: 156,
      scheduledAppointments: 23,
      conversionRate: 68.5,
      deliveryProgress: 75,
      customerSatisfaction: 92,
      inventoryStatus: 45,
      trends: {
        revenue: { value: 12.5, isPositive: true },
        subscriptions: { value: 8.2, isPositive: true },
        appointments: { value: 3.1, isPositive: false },
        conversion: { value: 5.7, isPositive: true }
      }
    }

    it('should return dashboard metrics successfully', async () => {
      // Mock successful metrics response
      vi.mocked(analyticsService.getDashboardMetrics).mockResolvedValue(mockMetrics)

      const request = new NextRequest('http://localhost:3000/api/v1/analytics/dashboard')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.metrics).toEqual(mockMetrics)
      expect(analyticsService.getDashboardMetrics).toHaveBeenCalledTimes(1)
    })

    it('should return all required metric fields', async () => {
      vi.mocked(analyticsService.getDashboardMetrics).mockResolvedValue(mockMetrics)

      const request = new NextRequest('http://localhost:3000/api/v1/analytics/dashboard')
      const response = await GET(request)
      const data = await response.json()

      expect(data.metrics).toHaveProperty('totalRevenue')
      expect(data.metrics).toHaveProperty('activeSubscriptions')
      expect(data.metrics).toHaveProperty('scheduledAppointments')
      expect(data.metrics).toHaveProperty('conversionRate')
      expect(data.metrics).toHaveProperty('deliveryProgress')
      expect(data.metrics).toHaveProperty('customerSatisfaction')
      expect(data.metrics).toHaveProperty('inventoryStatus')
      expect(data.metrics).toHaveProperty('trends')
    })

    it('should calculate metrics with correct types', async () => {
      vi.mocked(analyticsService.getDashboardMetrics).mockResolvedValue(mockMetrics)

      const request = new NextRequest('http://localhost:3000/api/v1/analytics/dashboard')
      const response = await GET(request)
      const data = await response.json()

      expect(typeof data.metrics.totalRevenue).toBe('number')
      expect(typeof data.metrics.activeSubscriptions).toBe('number')
      expect(typeof data.metrics.scheduledAppointments).toBe('number')
      expect(typeof data.metrics.conversionRate).toBe('number')
      expect(typeof data.metrics.deliveryProgress).toBe('number')
      expect(typeof data.metrics.customerSatisfaction).toBe('number')
      expect(typeof data.metrics.inventoryStatus).toBe('number')
      expect(typeof data.metrics.trends).toBe('object')
    })

    it('should return 500 on service error', async () => {
      // Mock service error
      vi.mocked(analyticsService.getDashboardMetrics).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new NextRequest('http://localhost:3000/api/v1/analytics/dashboard')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch dashboard metrics')
    })

    it('should handle null values gracefully', async () => {
      const metricsWithNulls = {
        ...mockMetrics,
        scheduledAppointments: 0,
        inventoryStatus: 0
      }

      vi.mocked(analyticsService.getDashboardMetrics).mockResolvedValue(metricsWithNulls)

      const request = new NextRequest('http://localhost:3000/api/v1/analytics/dashboard')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.metrics.scheduledAppointments).toBe(0)
      expect(data.metrics.inventoryStatus).toBe(0)
    })

    it('should include trend information', async () => {
      vi.mocked(analyticsService.getDashboardMetrics).mockResolvedValue(mockMetrics)

      const request = new NextRequest('http://localhost:3000/api/v1/analytics/dashboard')
      const response = await GET(request)
      const data = await response.json()

      expect(data.metrics.trends).toBeDefined()
      expect(data.metrics.trends.revenue).toHaveProperty('value')
      expect(data.metrics.trends.revenue).toHaveProperty('isPositive')
      expect(data.metrics.trends.subscriptions).toHaveProperty('value')
      expect(data.metrics.trends.subscriptions).toHaveProperty('isPositive')
    })

    it('should handle network errors', async () => {
      vi.mocked(analyticsService.getDashboardMetrics).mockRejectedValue(
        new Error('Network error: ETIMEDOUT')
      )

      const request = new NextRequest('http://localhost:3000/api/v1/analytics/dashboard')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })

    it('should validate positive trend values', async () => {
      vi.mocked(analyticsService.getDashboardMetrics).mockResolvedValue(mockMetrics)

      const request = new NextRequest('http://localhost:3000/api/v1/analytics/dashboard')
      const response = await GET(request)
      const data = await response.json()

      expect(data.metrics.trends.revenue.value).toBeGreaterThan(0)
      expect(data.metrics.trends.revenue.isPositive).toBe(true)
    })

    it('should validate negative trend values', async () => {
      vi.mocked(analyticsService.getDashboardMetrics).mockResolvedValue(mockMetrics)

      const request = new NextRequest('http://localhost:3000/api/v1/analytics/dashboard')
      const response = await GET(request)
      const data = await response.json()

      expect(data.metrics.trends.appointments.value).toBeGreaterThan(0)
      expect(data.metrics.trends.appointments.isPositive).toBe(false)
    })

    it('should handle timeout errors', async () => {
      vi.mocked(analyticsService.getDashboardMetrics).mockImplementation(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      )

      const request = new NextRequest('http://localhost:3000/api/v1/analytics/dashboard')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })
})
