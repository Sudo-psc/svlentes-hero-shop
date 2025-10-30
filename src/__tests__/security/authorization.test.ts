/**
 * Security Tests - Authorization & Ownership Validation
 * 
 * CRÍTICO: Testes para prevenir acesso não autorizado entre usuários
 * LGPD Compliance: Art. 6º, VI - Princípio da Segurança
 * OWASP: A01:2021 - Broken Access Control
 * 
 * Cenário de ataque testado:
 * 1. User A autentica com Firebase ✅
 * 2. User A tenta acessar subscriptionId/paymentId/orderId do User B
 * 3. API deve retornar 403 FORBIDDEN (não 404)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'
import {
  validateSubscriptionOwnership,
  validatePaymentOwnership,
  validateOrderOwnership,
  ErrorType,
} from '@/lib/api-error-handler'

// Mock Firebase Admin
vi.mock('@/lib/firebase-admin', () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
}))

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(),
    },
    payment: {
      findFirst: vi.fn(),
    },
    order: {
      findFirst: vi.fn(),
    },
  },
}))

describe('Security - Authorization & Ownership Validation', () => {
  const USER_A_ID = 'user-a-123'
  const USER_B_ID = 'user-b-456'
  const SUBSCRIPTION_A_ID = 'sub-a-789'
  const SUBSCRIPTION_B_ID = 'sub-b-101'
  const PAYMENT_A_ID = 'pay-a-111'
  const PAYMENT_B_ID = 'pay-b-222'
  const ORDER_A_ID = 'order-a-333'
  const ORDER_B_ID = 'order-b-444'

  const context = {
    api: '/api/assinante/test',
    requestId: 'test-request-id',
    timestamp: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('validateSubscriptionOwnership', () => {
    it('should allow access to own subscription', async () => {
      // Mock: User A acessa sua própria assinatura
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        id: SUBSCRIPTION_A_ID,
        userId: USER_A_ID,
        status: 'ACTIVE',
      } as any)

      const result = await validateSubscriptionOwnership(
        prisma,
        SUBSCRIPTION_A_ID,
        USER_A_ID,
        context
      )

      expect(result).not.toBeInstanceOf(NextResponse)
      expect(result.id).toBe(SUBSCRIPTION_A_ID)
      expect(result.userId).toBe(USER_A_ID)
    })

    it('should DENY access to other user subscription with 403', async () => {
      // Mock: User A tenta acessar assinatura do User B
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null)

      const result = await validateSubscriptionOwnership(
        prisma,
        SUBSCRIPTION_B_ID,
        USER_A_ID,
        context
      )

      expect(result).toBeInstanceOf(NextResponse)
      
      const response = result as NextResponse
      expect(response.status).toBe(403)
      
      const body = await response.json()
      expect(body.error).toBe(ErrorType.AUTHORIZATION)
      expect(body.message).toContain('permissão')
    })

    it('should log security warning on unauthorized access attempt', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null)

      await validateSubscriptionOwnership(
        prisma,
        SUBSCRIPTION_B_ID,
        USER_A_ID,
        context
      )

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY]'),
        expect.objectContaining({
          subscriptionId: SUBSCRIPTION_B_ID,
          userId: USER_A_ID,
          api: context.api,
        })
      )

      consoleWarnSpy.mockRestore()
    })

    it('should handle database errors gracefully', async () => {
      vi.mocked(prisma.subscription.findFirst).mockRejectedValue(
        new Error('Database connection failed')
      )

      const result = await validateSubscriptionOwnership(
        prisma,
        SUBSCRIPTION_A_ID,
        USER_A_ID,
        context
      )

      expect(result).toBeInstanceOf(NextResponse)
      
      const response = result as NextResponse
      expect(response.status).toBe(500)
      
      const body = await response.json()
      expect(body.error).toBe(ErrorType.DATABASE)
    })
  })

  describe('validatePaymentOwnership', () => {
    it('should allow access to own payment', async () => {
      // Mock: User A acessa seu próprio pagamento
      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: PAYMENT_A_ID,
        userId: USER_A_ID,
        amount: 149.90,
        status: 'PENDING',
      } as any)

      const result = await validatePaymentOwnership(
        prisma,
        PAYMENT_A_ID,
        USER_A_ID,
        context
      )

      expect(result).not.toBeInstanceOf(NextResponse)
      expect(result.id).toBe(PAYMENT_A_ID)
      expect(result.userId).toBe(USER_A_ID)
    })

    it('should DENY access to other user payment with 403', async () => {
      // Mock: User A tenta acessar pagamento do User B
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null)

      const result = await validatePaymentOwnership(
        prisma,
        PAYMENT_B_ID,
        USER_A_ID,
        context
      )

      expect(result).toBeInstanceOf(NextResponse)
      
      const response = result as NextResponse
      expect(response.status).toBe(403)
      
      const body = await response.json()
      expect(body.error).toBe(ErrorType.AUTHORIZATION)
    })

    it('should log security warning on payment access attempt', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null)

      await validatePaymentOwnership(
        prisma,
        PAYMENT_B_ID,
        USER_A_ID,
        context
      )

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY]'),
        expect.objectContaining({
          paymentId: PAYMENT_B_ID,
          userId: USER_A_ID,
        })
      )

      consoleWarnSpy.mockRestore()
    })
  })

  describe('validateOrderOwnership', () => {
    it('should allow access to own order', async () => {
      // Mock: User A acessa seu próprio pedido
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: ORDER_A_ID,
        subscription: {
          userId: USER_A_ID,
        },
        status: 'PROCESSING',
      } as any)

      const result = await validateOrderOwnership(
        prisma,
        ORDER_A_ID,
        USER_A_ID,
        context
      )

      expect(result).not.toBeInstanceOf(NextResponse)
      expect(result.id).toBe(ORDER_A_ID)
    })

    it('should DENY access to other user order with 403', async () => {
      // Mock: User A tenta acessar pedido do User B
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null)

      const result = await validateOrderOwnership(
        prisma,
        ORDER_B_ID,
        USER_A_ID,
        context
      )

      expect(result).toBeInstanceOf(NextResponse)
      
      const response = result as NextResponse
      expect(response.status).toBe(403)
      
      const body = await response.json()
      expect(body.error).toBe(ErrorType.AUTHORIZATION)
    })

    it('should log security warning on order access attempt', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null)

      await validateOrderOwnership(
        prisma,
        ORDER_B_ID,
        USER_A_ID,
        context
      )

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY]'),
        expect.objectContaining({
          orderId: ORDER_B_ID,
          userId: USER_A_ID,
        })
      )

      consoleWarnSpy.mockRestore()
    })
  })

  describe('Cross-user attack scenarios', () => {
    it('should prevent User A from accessing User B subscription by ID manipulation', async () => {
      // Cenário: User A conhece o subscriptionId do User B e tenta acessar
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null)

      const result = await validateSubscriptionOwnership(
        prisma,
        SUBSCRIPTION_B_ID,
        USER_A_ID,
        { ...context, api: '/api/assinante/subscription' }
      )

      expect(result).toBeInstanceOf(NextResponse)
      const response = result as NextResponse
      expect(response.status).toBe(403)
      
      // Verificar que o filtro correto foi aplicado
      expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          id: SUBSCRIPTION_B_ID,
          userId: USER_A_ID, // ← CRÍTICO: deve filtrar por userId
        },
      })
    })

    it('should prevent User A from accessing User B payment by ID manipulation', async () => {
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null)

      const result = await validatePaymentOwnership(
        prisma,
        PAYMENT_B_ID,
        USER_A_ID,
        { ...context, api: '/api/assinante/payment-history' }
      )

      expect(result).toBeInstanceOf(NextResponse)
      const response = result as NextResponse
      expect(response.status).toBe(403)
      
      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: {
          id: PAYMENT_B_ID,
          userId: USER_A_ID,
        },
      })
    })

    it('should prevent User A from accessing User B order by ID manipulation', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null)

      const result = await validateOrderOwnership(
        prisma,
        ORDER_B_ID,
        USER_A_ID,
        { ...context, api: '/api/assinante/orders' }
      )

      expect(result).toBeInstanceOf(NextResponse)
      const response = result as NextResponse
      expect(response.status).toBe(403)
      
      // Order ownership é validado via subscription.userId
      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: {
          id: ORDER_B_ID,
          subscription: {
            userId: USER_A_ID,
          },
        },
      })
    })
  })

  describe('LGPD Compliance - Auditoria', () => {
    it('should log all unauthorized access attempts for audit trail', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null)

      // Simular múltiplas tentativas de acesso não autorizado
      await validateSubscriptionOwnership(prisma, SUBSCRIPTION_B_ID, USER_A_ID, context)
      await validatePaymentOwnership(prisma, PAYMENT_B_ID, USER_A_ID, context)
      await validateOrderOwnership(prisma, ORDER_B_ID, USER_A_ID, context)

      // Deve ter logado 3 tentativas
      expect(consoleWarnSpy).toHaveBeenCalledTimes(3)
      
      // Cada log deve conter informações de auditoria
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY]'),
        expect.objectContaining({
          userId: USER_A_ID,
          api: context.api,
          requestId: context.requestId,
          timestamp: expect.any(String),
        })
      )

      consoleWarnSpy.mockRestore()
    })

    it('should include timestamp in ISO format for audit logs', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null)

      await validateSubscriptionOwnership(prisma, SUBSCRIPTION_B_ID, USER_A_ID, context)

      const logCall = consoleWarnSpy.mock.calls[0][1] as any
      expect(logCall.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)

      consoleWarnSpy.mockRestore()
    })
  })

  describe('Error response format', () => {
    it('should return consistent error format for unauthorized access', async () => {
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null)

      const result = await validateSubscriptionOwnership(
        prisma,
        SUBSCRIPTION_B_ID,
        USER_A_ID,
        context
      )

      const response = result as NextResponse
      const body = await response.json()

      // Verificar estrutura da resposta de erro
      expect(body).toHaveProperty('error')
      expect(body).toHaveProperty('message')
      expect(body).toHaveProperty('requestId')
      expect(body).toHaveProperty('timestamp')
      
      expect(body.error).toBe(ErrorType.AUTHORIZATION)
      expect(body.message).toBe('Você não tem permissão para acessar este recurso.')
      expect(body.requestId).toBe(context.requestId)
    })

    it('should NOT leak information about resource existence', async () => {
      // Importante: erro deve ser genérico (403) e não específico (404)
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null)

      const result = await validateSubscriptionOwnership(
        prisma,
        'nonexistent-sub-999',
        USER_A_ID,
        context
      )

      const response = result as NextResponse
      const body = await response.json()

      // Mesmo para recurso inexistente, retornar 403 (não 404)
      expect(response.status).toBe(403)
      expect(body.error).toBe(ErrorType.AUTHORIZATION)
      // Mensagem deve ser genérica sobre autorização, não sobre recurso não encontrado
      expect(body.message).not.toMatch(/não encontrad[oa]/i)
    })
  })
})
