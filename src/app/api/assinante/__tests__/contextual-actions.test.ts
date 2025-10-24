import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from '@/app/api/assinante/contextual-actions/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  mockUser,
  mockSubscription,
  mockPayment,
  mockContextualActions
} from '@/__tests__/fixtures/phase2-fixtures'

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    },
    subscription: {
      findFirst: vi.fn()
    },
    payment: {
      findFirst: vi.fn()
    }
  }
}))

// Mock auth config
vi.mock('@/lib/auth/auth.config', () => ({
  authOptions: {}
}))

describe('/api/assinante/contextual-actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/assinante/contextual-actions', () => {
    it('should return renewal action when prescription expires in < 7 days', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: mockUser.email }
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      // Mock subscription with prescription expiring in 5 days
      const fiveDaysFromNow = new Date()
      fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5)

      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        ...mockSubscription,
        prescriptionExpiryDate: fiveDaysFromNow,
        status: 'active'
      } as any)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/assinante/contextual-actions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.actions).toBeDefined()
      expect(Array.isArray(data.actions)).toBe(true)

      const renewalAction = data.actions.find((a: any) => a.type === 'renewal')
      expect(renewalAction).toBeDefined()
      expect(renewalAction.priority).toBe('high')
      expect(renewalAction.variant).toBe('destructive')
      expect(renewalAction.daysUntilExpiry).toBeLessThanOrEqual(7)
    })

    it('should return evaluation action when last consultation > 6 months ago', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: mockUser.email }
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      // Mock subscription with last consultation 6 months ago
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      // Prescription not expiring soon
      const twoMonthsFromNow = new Date()
      twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2)

      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        ...mockSubscription,
        lastConsultationDate: sixMonthsAgo,
        prescriptionExpiryDate: twoMonthsFromNow,
        status: 'active'
      } as any)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/assinante/contextual-actions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      const evaluationAction = data.actions.find((a: any) => a.type === 'evaluation')
      expect(evaluationAction).toBeDefined()
      expect(evaluationAction.priority).toBe('medium')
      expect(evaluationAction.variant).toBe('warning')
      expect(evaluationAction.monthsSinceLastVisit).toBeGreaterThanOrEqual(6)
    })

    it('should return payment alert when payment is pending', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: mockUser.email }
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      // Mock active subscription
      const twoMonthsFromNow = new Date()
      twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2)

      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        ...mockSubscription,
        prescriptionExpiryDate: twoMonthsFromNow,
        status: 'active'
      } as any)

      // Mock pending payment due in 2 days
      const twoDaysFromNow = new Date()
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        ...mockPayment,
        status: 'pending',
        dueDate: twoDaysFromNow
      } as any)

      const request = new NextRequest('http://localhost:3000/api/assinante/contextual-actions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      const paymentAction = data.actions.find((a: any) => a.type === 'payment')
      expect(paymentAction).toBeDefined()
      expect(paymentAction.priority).toBe('high')
      expect(paymentAction.variant).toBe('destructive')
      expect(paymentAction.daysUntilDue).toBeLessThanOrEqual(3)
    })

    it('should return reactivation action when subscription is paused', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: mockUser.email }
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      // Mock paused subscription
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        ...mockSubscription,
        status: 'paused',
        pausedAt: new Date('2025-10-01')
      } as any)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/assinante/contextual-actions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      const reactivateAction = data.actions.find((a: any) => a.type === 'reactivate')
      expect(reactivateAction).toBeDefined()
      expect(reactivateAction.priority).toBe('medium')
      expect(reactivateAction.variant).toBe('default')
    })

    it('should always return WhatsApp action', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: mockUser.email }
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      // Mock normal subscription with no urgent actions
      const twoMonthsFromNow = new Date()
      twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2)

      const twoMonthsAgo = new Date()
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        ...mockSubscription,
        prescriptionExpiryDate: twoMonthsFromNow,
        lastConsultationDate: twoMonthsAgo,
        status: 'active'
      } as any)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/assinante/contextual-actions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.actions).toBeDefined()

      const whatsappAction = data.actions.find((a: any) => a.type === 'whatsapp')
      expect(whatsappAction).toBeDefined()
      expect(whatsappAction.priority).toBe('low')
      expect(whatsappAction.variant).toBe('success')
    })

    it('should order actions by priority correctly', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: mockUser.email }
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      // Mock scenario with multiple actions (high, medium, low priority)
      const fiveDaysFromNow = new Date()
      fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5)

      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        ...mockSubscription,
        prescriptionExpiryDate: fiveDaysFromNow, // High priority
        lastConsultationDate: sixMonthsAgo, // Medium priority
        status: 'active'
      } as any)

      const twoDaysFromNow = new Date()
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        ...mockPayment,
        status: 'pending',
        dueDate: twoDaysFromNow // High priority
      } as any)

      const request = new NextRequest('http://localhost:3000/api/assinante/contextual-actions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.actions).toBeDefined()

      // Actions should be ordered: high priority first, then medium, then low
      const priorities = data.actions.map((a: any) => a.priority)
      const highPriorityCount = priorities.filter((p: string) => p === 'high').length
      const mediumPriorityCount = priorities.filter((p: string) => p === 'medium').length

      expect(highPriorityCount).toBeGreaterThan(0)
      expect(mediumPriorityCount).toBeGreaterThan(0)

      // Verify high priority actions come before medium priority
      const firstHighIndex = priorities.indexOf('high')
      const firstMediumIndex = priorities.indexOf('medium')
      const firstLowIndex = priorities.indexOf('low')

      if (firstMediumIndex !== -1) {
        expect(firstHighIndex).toBeLessThan(firstMediumIndex)
      }
      if (firstLowIndex !== -1) {
        expect(firstMediumIndex).toBeLessThan(firstLowIndex)
      }
    })

    it('should return 401 without authentication', async () => {
      // Mock failed authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/assinante/contextual-actions')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('UNAUTHORIZED')
      expect(data.message).toBe('Você precisa estar autenticado')
    })

    it('should return 404 for non-existent user', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'nonexistent@example.com' }
      } as any)

      // Mock user not found
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/assinante/contextual-actions')
      const response = await GET(request)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('NOT_FOUND')
      expect(data.message).toBe('Usuário não encontrado')
    })

    it('should handle database errors gracefully', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: mockUser.email }
      } as any)

      // Mock database error
      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/assinante/contextual-actions')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('INTERNAL_ERROR')
      expect(data.message).toBe('Erro interno do servidor')
    })

    it('should not return renewal action if prescription is valid for > 7 days', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: mockUser.email }
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      // Mock subscription with prescription valid for 2 months
      const twoMonthsFromNow = new Date()
      twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2)

      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        ...mockSubscription,
        prescriptionExpiryDate: twoMonthsFromNow,
        status: 'active'
      } as any)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/assinante/contextual-actions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      const renewalAction = data.actions.find((a: any) => a.type === 'renewal')
      expect(renewalAction).toBeUndefined()
    })

    it('should include action metadata for frontend rendering', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: mockUser.email }
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const fiveDaysFromNow = new Date()
      fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5)

      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        ...mockSubscription,
        prescriptionExpiryDate: fiveDaysFromNow,
        status: 'active'
      } as any)

      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/assinante/contextual-actions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      data.actions.forEach((action: any) => {
        expect(action).toHaveProperty('id')
        expect(action).toHaveProperty('type')
        expect(action).toHaveProperty('title')
        expect(action).toHaveProperty('description')
        expect(action).toHaveProperty('icon')
        expect(action).toHaveProperty('priority')
        expect(action).toHaveProperty('variant')
      })
    })
  })
})
