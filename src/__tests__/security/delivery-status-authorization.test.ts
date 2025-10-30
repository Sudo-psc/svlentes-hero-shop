/**
 * Security E2E Test - delivery-status API Authorization
 * 
 * CRÍTICO: Valida que a API /api/assinante/delivery-status
 * implementa corretamente a validação de ownership
 * 
 * Cenário testado:
 * - User A não pode acessar subscriptionId do User B
 * - API retorna 403 FORBIDDEN (não 404 ou 200)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/assinante/delivery-status/route'
import { NextRequest } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'

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
  },
}))

describe('Security E2E - /api/assinante/delivery-status', () => {
  const USER_A = {
    id: 'user-a-123',
    firebaseUid: 'firebase-uid-a',
    email: 'usera@example.com',
    name: 'User A',
  }

  const USER_B = {
    id: 'user-b-456',
    firebaseUid: 'firebase-uid-b',
    email: 'userb@example.com',
    name: 'User B',
  }

  const SUBSCRIPTION_A = {
    id: 'sub-a-789',
    userId: USER_A.id,
    status: 'ACTIVE',
  }

  const SUBSCRIPTION_B = {
    id: 'sub-b-101',
    userId: USER_B.id,
    status: 'ACTIVE',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow user to access own subscription delivery status', async () => {
    // Mock: User A autenticado via Firebase
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: USER_A.firebaseUid,
    } as any)

    // Mock: User A encontrado no banco
    vi.mocked(prisma.user.findUnique).mockResolvedValue(USER_A as any)

    // Mock: Assinatura A pertence ao User A
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue(SUBSCRIPTION_A as any)

    const request = new NextRequest(
      `http://localhost:3000/api/assinante/delivery-status?subscriptionId=${SUBSCRIPTION_A.id}`,
      {
        headers: {
          Authorization: `Bearer valid-token-user-a`,
        },
      }
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.currentDelivery).toBeDefined()
  })

  it('should DENY user A from accessing user B subscription with 403', async () => {
    // Mock: User A autenticado via Firebase
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: USER_A.firebaseUid,
    } as any)

    // Mock: User A encontrado no banco
    vi.mocked(prisma.user.findUnique).mockResolvedValue(USER_A as any)

    // Mock: User A tenta acessar subscription do User B
    // findFirst retorna null porque userId não bate
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null)

    const request = new NextRequest(
      `http://localhost:3000/api/assinante/delivery-status?subscriptionId=${SUBSCRIPTION_B.id}`,
      {
        headers: {
          Authorization: `Bearer valid-token-user-a`,
        },
      }
    )

    const response = await GET(request)
    const data = await response.json()

    // ✅ CRÍTICO: Deve retornar 403 FORBIDDEN
    expect(response.status).toBe(403)
    expect(data.error).toBe('AUTHORIZATION')
    expect(data.message).toContain('permissão')

    // Verificar que o filtro correto foi aplicado
    expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
      where: {
        id: SUBSCRIPTION_B.id,
        userId: USER_A.id, // ← User A tentando acessar sub do User B
      },
    })
  })

  it('should return 401 for unauthenticated requests', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/assinante/delivery-status?subscriptionId=${SUBSCRIPTION_A.id}`,
      {
        headers: {},
      }
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('AUTHENTICATION')
  })

  it('should return 401 for invalid Firebase token', async () => {
    // Mock: Token inválido
    vi.mocked(adminAuth.verifyIdToken).mockRejectedValue(
      new Error('Token expired')
    )

    const request = new NextRequest(
      `http://localhost:3000/api/assinante/delivery-status?subscriptionId=${SUBSCRIPTION_A.id}`,
      {
        headers: {
          Authorization: `Bearer invalid-token`,
        },
      }
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('AUTHENTICATION')
  })

  it('should return 404 for user not found in database', async () => {
    // Mock: Firebase válido mas usuário não existe no banco
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: 'unknown-firebase-uid',
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const request = new NextRequest(
      `http://localhost:3000/api/assinante/delivery-status?subscriptionId=${SUBSCRIPTION_A.id}`,
      {
        headers: {
          Authorization: `Bearer valid-token`,
        },
      }
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('NOT_FOUND')
    expect(data.message).toContain('Usuário não encontrado')
  })

  it('should return 400 for invalid subscriptionId format', async () => {
    // Mock: User autenticado
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: USER_A.firebaseUid,
    } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(USER_A as any)

    const request = new NextRequest(
      'http://localhost:3000/api/assinante/delivery-status?subscriptionId=invalid-format',
      {
        headers: {
          Authorization: `Bearer valid-token`,
        },
      }
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Dados inválidos')
  })

  it('should log security warning when unauthorized access is attempted', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Setup: User A tenta acessar subscription do User B
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: USER_A.firebaseUid,
    } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(USER_A as any)
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null)

    const request = new NextRequest(
      `http://localhost:3000/api/assinante/delivery-status?subscriptionId=${SUBSCRIPTION_B.id}`,
      {
        headers: {
          Authorization: `Bearer valid-token-user-a`,
        },
      }
    )

    await GET(request)

    // Verificar que warning de segurança foi logado
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[SECURITY]'),
      expect.objectContaining({
        subscriptionId: SUBSCRIPTION_B.id,
        userId: USER_A.id,
      })
    )

    consoleWarnSpy.mockRestore()
  })

  describe('Audit Trail - LGPD Compliance', () => {
    it('should include requestId in all responses for auditability', async () => {
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
        uid: USER_A.firebaseUid,
      } as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(USER_A as any)
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(SUBSCRIPTION_A as any)

      const request = new NextRequest(
        `http://localhost:3000/api/assinante/delivery-status?subscriptionId=${SUBSCRIPTION_A.id}`,
        {
          headers: {
            Authorization: `Bearer valid-token`,
          },
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.metadata).toBeDefined()
      expect(data.metadata.requestId).toBeDefined()
      expect(data.metadata.requestId).toMatch(/^req_/)
    })

    it('should include timestamp in all responses', async () => {
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
        uid: USER_A.firebaseUid,
      } as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(USER_A as any)
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(SUBSCRIPTION_A as any)

      const request = new NextRequest(
        `http://localhost:3000/api/assinante/delivery-status?subscriptionId=${SUBSCRIPTION_A.id}`,
        {
          headers: {
            Authorization: `Bearer valid-token`,
          },
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.metadata.timestamp).toBeDefined()
      expect(data.metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
  })
})
