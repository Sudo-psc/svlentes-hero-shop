import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET, PUT } from '@/app/api/assinante/subscription/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn()
    },
    subscription: {
      update: vi.fn()
    }
  }
}))

// Mock the auth config
vi.mock('@/lib/auth/auth.config', () => ({
  authOptions: {}
}))

const mockUser = {
  id: 'user_123',
  email: 'john@example.com',
  name: 'John Doe',
  avatarUrl: 'https://example.com/avatar.jpg',
  googleId: 'google_123',
  createdAt: new Date('2025-10-14'),
  lastLoginAt: new Date('2025-10-14')
}

const mockSubscription = {
  id: 'sub_123',
  status: 'active',
  planName: 'Lentes Diárias Mensal',
  price: 149.90,
  billingCycle: 'monthly',
  currentPeriodStart: new Date('2025-10-14'),
  currentPeriodEnd: new Date('2025-11-14'),
  shippingAddress: {
    street: 'Rua Principal',
    number: '123',
    neighborhood: 'Centro',
    city: 'Caratinga',
    state: 'MG',
    zipCode: '35300-000'
  },
  createdAt: new Date('2025-10-14'),
  updatedAt: new Date('2025-10-14')
}

const mockBenefits = [
  {
    id: '1',
    name: 'Lentes de contato diárias',
    description: 'Lentes descartáveis de uso diário',
    category: 'product',
    included: true
  }
]

describe('/api/assinante/subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/assinante/subscription', () => {
    it('should return subscription data for authenticated user', async () => {
      // Mock successful authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'john@example.com' }
      } as any)

      // Mock Prisma response
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        subscriptions: [
          {
            ...mockSubscription,
            benefits: mockBenefits,
            orders: []
          }
        ]
      } as any)

      const request = new NextRequest('http://localhost:3000/api/assinante/subscription')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.subscription).toBeDefined()
      expect(data.subscription.plan.name).toBe('Lentes Diárias Mensal')
      expect(data.subscription.status).toBe('active')
      expect(data.user.email).toBe('john@example.com')
    })

    it('should return 401 for unauthenticated user', async () => {
      // Mock failed authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/assinante/subscription')
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

      const request = new NextRequest('http://localhost:3000/api/assinante/subscription')
      const response = await GET(request)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('NOT_FOUND')
      expect(data.message).toBe('Usuário não encontrado')
    })

    it('should handle user with no subscriptions', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'john@example.com' }
      } as any)

      // Mock user with no subscriptions
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        subscriptions: []
      } as any)

      const request = new NextRequest('http://localhost:3000/api/assinante/subscription')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.subscription).toBeNull()
      expect(data.message).toBe('Nenhuma assinatura encontrada')
    })

    it('should return 500 for database errors', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'john@example.com' }
      } as any)

      // Mock database error
      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/assinante/subscription')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('INTERNAL_ERROR')
      expect(data.message).toBe('Erro interno do servidor')
    })

    it('should prioritize active subscription over inactive ones', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'john@example.com' }
      } as any)

      // Mock user with multiple subscriptions
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        subscriptions: [
          {
            ...mockSubscription,
            status: 'cancelled',
            id: 'sub_old'
          },
          {
            ...mockSubscription,
            status: 'active',
            id: 'sub_active'
          }
        ]
      } as any)

      const request = new NextRequest('http://localhost:3000/api/assinante/subscription')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.subscription.id).toBe('sub_active')
    })
  })

  describe('PUT /api/assinante/subscription', () => {
    const validShippingAddress = {
      street: 'Rua Nova',
      number: '456',
      neighborhood: 'Bairro Novo',
      city: 'Nova Cidade',
      state: 'SP',
      zipCode: '01234-567'
    }

    it('should update shipping address successfully', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'john@example.com' }
      } as any)

      // Mock user with active subscription
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        subscriptions: [mockSubscription]
      } as any)

      // Mock successful update
      vi.mocked(prisma.subscription.update).mockResolvedValue({
        ...mockSubscription,
        shippingAddress: validShippingAddress
      } as any)

      const request = new NextRequest('http://localhost:3000/api/assinante/subscription', {
        method: 'PUT',
        body: JSON.stringify({ shippingAddress: validShippingAddress }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Endereço atualizado com sucesso')
      expect(data.shippingAddress.street).toBe('Rua Nova')
      expect(data.shippingAddress.city).toBe('Nova Cidade')
    })

    it('should return 401 for unauthenticated user', async () => {
      // Mock failed authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/assinante/subscription', {
        method: 'PUT',
        body: JSON.stringify({ shippingAddress: validShippingAddress }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await PUT(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('UNAUTHORIZED')
    })

    it('should return 400 for missing shipping address', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'john@example.com' }
      } as any)

      const request = new NextRequest('http://localhost:3000/api/assinante/subscription', {
        method: 'PUT',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await PUT(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('VALIDATION_ERROR')
      expect(data.message).toBe('Endereço de entrega é obrigatório')
    })

    it('should return 404 for user with no active subscription', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'john@example.com' }
      } as any)

      // Mock user with no active subscription
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        subscriptions: []
      } as any)

      const request = new NextRequest('http://localhost:3000/api/assinante/subscription', {
        method: 'PUT',
        body: JSON.stringify({ shippingAddress: validShippingAddress }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await PUT(request)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('NO_SUBSCRIPTION')
      expect(data.message).toBe('Nenhuma assinatura ativa encontrada')
    })

    it('should handle malformed JSON', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'john@example.com' }
      } as any)

      const request = new NextRequest('http://localhost:3000/api/assinante/subscription', {
        method: 'PUT',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await PUT(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('INTERNAL_ERROR')
    })

    it('should handle database errors during update', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'john@example.com' }
      } as any)

      // Mock user with active subscription
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        subscriptions: [mockSubscription]
      } as any)

      // Mock database error
      vi.mocked(prisma.subscription.update).mockRejectedValue(new Error('Update failed'))

      const request = new NextRequest('http://localhost:3000/api/assinante/subscription', {
        method: 'PUT',
        body: JSON.stringify({ shippingAddress: validShippingAddress }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await PUT(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('INTERNAL_ERROR')
    })
  })
})