/**
 * Comprehensive tests for WhatsApp Subscription Management Commands
 * Tests view, pause, reactivate, and next delivery commands
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  viewSubscriptionCommand,
  pauseSubscriptionCommand,
  reactivateSubscriptionCommand,
  nextDeliveryCommand,
} from '../subscription-management-commands'
import { prisma } from '../prisma'

// Mock Prisma
vi.mock('../prisma', () => ({
  prisma: {
    chatbotSession: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      update: vi.fn(),
    },
  },
}))

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  LogCategory: {
    WHATSAPP: 'WHATSAPP',
  },
}))

describe('Subscription Management Commands', () => {
  const mockPhone = '33999898026'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('viewSubscriptionCommand', () => {
    it('should reject unauthenticated user', async () => {
      vi.mocked(prisma.chatbotSession.findFirst).mockResolvedValueOnce(null)

      const result = await viewSubscriptionCommand(mockPhone)

      expect(result.success).toBe(false)
      expect(result.error).toBe('not_authenticated')
      expect(result.message).toContain('precisa estar autenticado')
    })

    it('should show subscription details for authenticated user', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        phone: mockPhone,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-123',
          name: 'João Silva',
          subscriptions: [
            {
              id: 'sub-123',
              status: 'ACTIVE',
              amount: 149.90,
              billingInterval: 30,
              plan: {
                name: 'Lentes Diárias Mensal',
              },
              orders: [
                {
                  shippingAddress: 'Rua Teste, 123, Caratinga/MG',
                  estimatedDelivery: new Date('2025-12-05'),
                },
              ],
            },
          ],
        },
      }

      vi.mocked(prisma.chatbotSession.findFirst).mockResolvedValueOnce(mockSession as any)
      vi.mocked(prisma.chatbotSession.update).mockResolvedValueOnce(mockSession as any)

      const result = await viewSubscriptionCommand(mockPhone)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Lentes Diárias Mensal')
      expect(result.message).toContain('149.90')
      expect(result.message).toContain('Ativa')
    })

    it('should handle user without subscription', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        phone: mockPhone,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-123',
          name: 'João Silva',
          subscriptions: [],
        },
      }

      vi.mocked(prisma.chatbotSession.findFirst).mockResolvedValueOnce(mockSession as any)
      vi.mocked(prisma.chatbotSession.update).mockResolvedValueOnce(mockSession as any)

      const result = await viewSubscriptionCommand(mockPhone)

      expect(result.success).toBe(false)
      expect(result.error).toBe('no_subscriptions')
      expect(result.message).toContain('não possui assinaturas ativas')
    })

    it('should show next delivery information when available', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        phone: mockPhone,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-123',
          name: 'João Silva',
          subscriptions: [
            {
              id: 'sub-123',
              status: 'ACTIVE',
              amount: 149.90,
              billingInterval: 30,
              plan: { name: 'Lentes Diárias Mensal' },
              orders: [
                {
                  shippingAddress: 'Rua Teste, 123',
                  estimatedDelivery: new Date('2025-12-05'),
                },
              ],
            },
          ],
        },
      }

      vi.mocked(prisma.chatbotSession.findFirst).mockResolvedValueOnce(mockSession as any)
      vi.mocked(prisma.chatbotSession.update).mockResolvedValueOnce(mockSession as any)

      const result = await viewSubscriptionCommand(mockPhone)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Próxima Entrega')
      expect(result.message).toContain('Rua Teste, 123')
    })

    it('should show paused status and date', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        phone: mockPhone,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-123',
          name: 'João Silva',
          subscriptions: [
            {
              id: 'sub-123',
              status: 'PAUSED',
              amount: 149.90,
              billingInterval: 30,
              pauseUntil: new Date('2025-12-01'),
              plan: { name: 'Lentes Diárias Mensal' },
              orders: [],
            },
          ],
        },
      }

      vi.mocked(prisma.chatbotSession.findFirst).mockResolvedValueOnce(mockSession as any)
      vi.mocked(prisma.chatbotSession.update).mockResolvedValueOnce(mockSession as any)

      const result = await viewSubscriptionCommand(mockPhone)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Pausada até')
    })

    it('should update last activity timestamp', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        phone: mockPhone,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-123',
          subscriptions: [
            {
              status: 'ACTIVE',
              amount: 149.90,
              billingInterval: 30,
              plan: { name: 'Test' },
              orders: [],
            },
          ],
        },
      }

      vi.mocked(prisma.chatbotSession.findFirst).mockResolvedValueOnce(mockSession as any)
      vi.mocked(prisma.chatbotSession.update).mockResolvedValueOnce(mockSession as any)

      await viewSubscriptionCommand(mockPhone)

      expect(prisma.chatbotSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { lastActivityAt: expect.any(Date) },
        })
      )
    })
  })

  describe('pauseSubscriptionCommand', () => {
    it('should reject unauthenticated user', async () => {
      vi.mocked(prisma.chatbotSession.findFirst).mockResolvedValueOnce(null)

      const result = await pauseSubscriptionCommand(mockPhone)

      expect(result.success).toBe(false)
      expect(result.error).toBe('not_authenticated')
    })

    it('should pause active subscription for 30 days by default', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        phone: mockPhone,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-123',
          subscriptions: [
            {
              id: 'sub-123',
              status: 'ACTIVE',
            },
          ],
        },
      }

      vi.mocked(prisma.chatbotSession.findFirst).mockResolvedValueOnce(mockSession as any)
      vi.mocked(prisma.chatbotSession.update).mockResolvedValueOnce(mockSession as any)
      vi.mocked(prisma.subscription.update).mockResolvedValueOnce({} as any)

      const result = await pauseSubscriptionCommand(mockPhone)

      expect(result.success).toBe(true)
      expect(result.message).toContain('30 dias')
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-123' },
          data: expect.objectContaining({
            status: 'PAUSED',
            pauseUntil: expect.any(Date),
            pausedAt: expect.any(Date),
          }),
        })
      )
    })

    it('should pause subscription for custom duration', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        phone: mockPhone,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-123',
          subscriptions: [
            {
              id: 'sub-123',
              status: 'ACTIVE',
            },
          ],
        },
      }

      vi.mocked(prisma.chatbotSession.findFirst).mockResolvedValueOnce(mockSession as any)
      vi.mocked(prisma.chatbotSession.update).mockResolvedValueOnce(mockSession as any)
      vi.mocked(prisma.subscription.update).mockResolvedValueOnce({} as any)

      const result = await pauseSubscriptionCommand(mockPhone, 60)

      expect(result.success).toBe(true)
      expect(result.message).toContain('60 dias')
    })

    it('should reject if subscription already paused', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        phone: mockPhone,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-123',
          subscriptions: [
            {
              id: 'sub-123',
              status: 'PAUSED',
            },
          ],
        },
      }

      vi.mocked(prisma.chatbotSession.findFirst).mockResolvedValueOnce(mockSession as any)
      vi.mocked(prisma.chatbotSession.update).mockResolvedValueOnce(mockSession as any)

      const result = await pauseSubscriptionCommand(mockPhone)

      expect(result.success).toBe(false)
      expect(result.error).toBe('already_paused')
      expect(result.message).toContain('já está pausada')
      expect(prisma.subscription.update).not.toHaveBeenCalled()
    })

    it('should handle user without subscription', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        phone: mockPhone,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-123',
          subscriptions: [],
        },
      }

      vi.mocked(prisma.chatbotSession.findFirst).mockResolvedValueOnce(mockSession as any)
      vi.mocked(prisma.chatbotSession.update).mockResolvedValueOnce(mockSession as any)

      const result = await pauseSubscriptionCommand(mockPhone)

      expect(result.success).toBe(false)
      expect(result.error).toBe('no_subscriptions')
    })
  })

  describe('reactivateSubscriptionCommand', () => {
    it('should reject unauthenticated user', async () => {
      vi.mocked(prisma.chatbotSession.findFirst).mockResolvedValueOnce(null)

      const result = await reactivateSubscriptionCommand(mockPhone)

      expect(result.success).toBe(false)
      expect(result.error).toBe('not_authenticated')
    })

    it('should reactivate paused subscription', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        phone: mockPhone,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-123',
          subscriptions: [
            {
              id: 'sub-123',
              status: 'PAUSED',
            },
          ],
        },
      }

      vi.mocked(prisma.chatbotSession.findFirst).mockResolvedValueOnce(mockSession as any)
      vi.mocked(prisma.chatbotSession.update).mockResolvedValueOnce(mockSession as any)
      vi.mocked(prisma.subscription.update).mockResolvedValueOnce({} as any)

      const result = await reactivateSubscriptionCommand(mockPhone)

      expect(result.success).toBe(true)
      expect(result.message).toContain('reativada com sucesso')
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-123' },
          data: expect.objectContaining({
            status: 'ACTIVE',
            pauseUntil: null,
            pausedAt: null,
          }),
        })
      )
    })

    it('should reject if subscription already active', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        phone: mockPhone,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-123',
          subscriptions: [
            {
              id: 'sub-123',
              status: 'ACTIVE',
            },
          ],
        },
      }

      vi.mocked(prisma.chatbotSession.findFirst).mockResolvedValueOnce(mockSession as any)
      vi.mocked(prisma.chatbotSession.update).mockResolvedValueOnce(mockSession as any)

      const result = await reactivateSubscriptionCommand(mockPhone)

      expect(result.success).toBe(false)
      expect(result.error).toBe('already_active')
      expect(result.message).toContain('já está ativa')
      expect(prisma.subscription.update).not.toHaveBeenCalled()
    })
  })

  describe('nextDeliveryCommand', () => {
    it('should reject unauthenticated user', async () => {
      vi.mocked(prisma.chatbotSession.findFirst).mockResolvedValueOnce(null)

      const result = await nextDeliveryCommand(mockPhone)

      expect(result.success).toBe(false)
      expect(result.error).toBe('not_authenticated')
    })

    it('should show next delivery details', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        phone: mockPhone,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-123',
          subscriptions: [
            {
              id: 'sub-123',
              status: 'ACTIVE',
              billingInterval: 30,
              orders: [
                {
                  id: 'order-123',
                  orderNumber: 'ORD-12345',
                  shippingAddress: 'Rua Teste, 123, Caratinga/MG',
                  estimatedDelivery: new Date('2025-12-05'),
                  trackingCode: 'BR123456789BR',
                },
              ],
            },
          ],
        },
      }

      vi.mocked(prisma.chatbotSession.findFirst).mockResolvedValueOnce(mockSession as any)
      vi.mocked(prisma.chatbotSession.update).mockResolvedValueOnce(mockSession as any)

      const result = await nextDeliveryCommand(mockPhone)

      expect(result.success).toBe(true)
      expect(result.message).toContain('ORD-12345')
      expect(result.message).toContain('Rua Teste, 123')
      expect(result.message).toContain('BR123456789BR')
    })

    it('should handle no pending orders', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        phone: mockPhone,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-123',
          subscriptions: [
            {
              id: 'sub-123',
              status: 'ACTIVE',
              billingInterval: 30,
              orders: [],
            },
          ],
        },
      }

      vi.mocked(prisma.chatbotSession.findFirst).mockResolvedValueOnce(mockSession as any)
      vi.mocked(prisma.chatbotSession.update).mockResolvedValueOnce(mockSession as any)

      const result = await nextDeliveryCommand(mockPhone)

      expect(result.success).toBe(true)
      expect(result.message).toContain('será processado em breve')
      expect(result.message).toContain('30 dias')
    })

    it('should handle order without tracking code', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        phone: mockPhone,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-123',
          subscriptions: [
            {
              id: 'sub-123',
              status: 'ACTIVE',
              orders: [
                {
                  id: 'order-123',
                  shippingAddress: 'Rua Teste, 123',
                  estimatedDelivery: new Date('2025-12-05'),
                  trackingCode: null,
                },
              ],
            },
          ],
        },
      }

      vi.mocked(prisma.chatbotSession.findFirst).mockResolvedValueOnce(mockSession as any)
      vi.mocked(prisma.chatbotSession.update).mockResolvedValueOnce(mockSession as any)

      const result = await nextDeliveryCommand(mockPhone)

      expect(result.success).toBe(true)
      expect(result.message).not.toContain('Código de rastreamento')
    })
  })
})
