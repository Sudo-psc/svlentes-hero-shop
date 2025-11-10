import { NextRequest } from 'next/server'

const firebaseAdminState = {
  adminAuth: {} as any,
  isFirebaseAdminInitialized: true,
}

jest.mock('@/lib/firebase-admin', () => ({
  __esModule: true,
  get adminAuth() {
    return firebaseAdminState.adminAuth
  },
  get isFirebaseAdminInitialized() {
    return firebaseAdminState.isFirebaseAdminInitialized
  },
  setAdminAuth(value: any) {
    firebaseAdminState.adminAuth = value
  },
  setFirebaseAdminInitialized(value: boolean) {
    firebaseAdminState.isFirebaseAdminInitialized = value
  },
  default: {},
}))

const validateTokenMock = jest.fn()

jest.mock('@/lib/token-cache', () => ({
  validateToken: validateTokenMock,
}))

const prismaUserMock = {
  findUnique: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
}

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: prismaUserMock,
  },
}))

const { setAdminAuth, setFirebaseAdminInitialized } = jest.requireMock('@/lib/firebase-admin') as {
  setAdminAuth: (value: any) => void
  setFirebaseAdminInitialized: (value: boolean) => void
}

const { prisma } = jest.requireMock('@/lib/prisma') as {
  prisma: {
    user: typeof prismaUserMock
  }
}

describe('/api/auth/verify-firebase-token', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL

  beforeEach(() => {
    jest.clearAllMocks()
    setFirebaseAdminInitialized(true)
    setAdminAuth({})
    validateTokenMock.mockReset()
    prisma.user.findUnique.mockReset()
    prisma.user.update.mockReset()
    prisma.user.create.mockReset()
    process.env.DATABASE_URL = originalDatabaseUrl
  })

  afterAll(() => {
    process.env.DATABASE_URL = originalDatabaseUrl
  })

  it('returns 503 when Firebase Admin is unavailable', async () => {
    const { POST } = await import('@/app/api/auth/verify-firebase-token/route')

    setFirebaseAdminInitialized(false)
    setAdminAuth(null)

    const request = new NextRequest('http://localhost/api/auth/verify-firebase-token', {
      method: 'POST',
      body: JSON.stringify({ token: 'dummy' }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.error).toBe('FIREBASE_ADMIN_UNAVAILABLE')
    expect(validateTokenMock).not.toHaveBeenCalled()
  })

  it('returns 400 for invalid JSON payloads', async () => {
    const { POST } = await import('@/app/api/auth/verify-firebase-token/route')

    const request = new NextRequest('http://localhost/api/auth/verify-firebase-token', {
      method: 'POST',
      body: 'invalid-json',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('INVALID_JSON')
    expect(validateTokenMock).not.toHaveBeenCalled()
  })

  it('returns 401 when token validation fails', async () => {
    const { POST } = await import('@/app/api/auth/verify-firebase-token/route')

    validateTokenMock.mockResolvedValue({ valid: false, error: 'Token expired' })

    const request = new NextRequest('http://localhost/api/auth/verify-firebase-token', {
      method: 'POST',
      body: JSON.stringify({ token: 'expired-token' }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('UNAUTHORIZED')
    expect(data.details).toEqual({ reason: 'Token expired' })
  })

  it('synchronizes user profile when validation succeeds', async () => {
    const { POST } = await import('@/app/api/auth/verify-firebase-token/route')

    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db'

    const decodedToken = {
      uid: 'uid-123',
      email: 'user@example.com',
      name: 'Firebase User',
      picture: 'https://example.com/avatar.png',
      email_verified: true,
      auth_time: 1_700_000_000,
      iss: 'https://securetoken.google.com/project',
      sub: 'uid-123',
      iat: 1_700_000_000,
      exp: 1_700_003_600,
      aud: 'project',
      firebase: { sign_in_provider: 'password' },
    }

    validateTokenMock.mockResolvedValue({ valid: true, decodedToken })

    prisma.user.findUnique
      .mockResolvedValueOnce(null) // by firebaseUid
      .mockResolvedValueOnce(null) // by email
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Firebase User',
      avatarUrl: 'https://example.com/avatar.png',
      role: 'subscriber',
      emailVerified: new Date('2024-01-01T00:00:00.000Z'),
      lastLoginAt: new Date('2024-01-02T00:00:00.000Z'),
    })

    const request = new NextRequest('http://localhost/api/auth/verify-firebase-token', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token' }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.profileSync).toBe('synced')
    expect(data.user).toMatchObject({
      uid: 'uid-123',
      email: 'user@example.com',
      name: 'Firebase User',
    })
    expect(prisma.user.create).toHaveBeenCalled()
  })

  it('returns warning when database synchronization fails', async () => {
    const { POST } = await import('@/app/api/auth/verify-firebase-token/route')

    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db'

    const decodedToken = {
      uid: 'uid-999',
      email: 'warning@example.com',
      name: 'Warning User',
      picture: null,
      email_verified: false,
      auth_time: 1_700_000_100,
      iss: 'issuer',
      sub: 'uid-999',
      iat: 1_700_000_100,
      exp: 1_700_003_700,
      aud: 'project',
      firebase: { sign_in_provider: 'password' },
    }

    validateTokenMock.mockResolvedValue({ valid: true, decodedToken })

    prisma.user.findUnique.mockRejectedValueOnce(new Error('Database offline'))

    const request = new NextRequest('http://localhost/api/auth/verify-firebase-token', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token' }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.profileSync).toBe('failed')
    expect(data.warnings).toEqual(['USER_PROFILE_SYNC_FAILED'])
  })
})
