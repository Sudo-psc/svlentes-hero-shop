/**
 * Mock Server para testes
 * Simula respostas da API para testes isolados
 */

import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const mockResponses = {
  subscription: {
    success: {
      id: 'sub_123',
      status: 'active',
      plan: {
        id: 'plan_premium',
        name: 'Plano Premium',
        price: 199.90,
        lensesPerMonth: 6,
        features: [
          'Lentes de qualidade premium',
          'Consulta mensal inclusa',
          'Delivery grátis',
          'Suporte prioritário'
        ]
      },
      user: {
        id: 'user_123',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '+5533999898026'
      },
      nextDelivery: {
        date: '2024-01-15',
        status: 'scheduled',
        tracking: null
      },
      payments: {
        nextPayment: '2024-02-01',
        amount: 199.90,
        method: 'credit_card',
        status: 'pending'
      },
      usage: {
        lensesDelivered: 24,
        lensesUsed: 18,
        averageUsage: 4.5
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    error: {
      error: 'Subscription not found',
      code: 'SUB_NOT_FOUND'
    },
    degraded: {
      id: 'sub_123',
      status: 'active',
      plan: {
        name: 'Plano Premium',
        price: 199.90
        // Dados limitados em modo degradado
      },
      // Outros campos omitidos para simular degradação
    }
  },
  orders: {
    success: [
      {
        id: 'order_1',
        status: 'delivered',
        date: '2024-01-01',
        lenses: 6,
        tracking: 'BR123456789',
        address: 'Rua Teste, 123 - Caratinga/MG'
      },
      {
        id: 'order_2',
        status: 'shipping',
        date: '2024-01-08',
        lenses: 6,
        tracking: 'BR987654321',
        address: 'Rua Teste, 123 - Caratinga/MG'
      }
    ]
  },
  health: {
    healthy: {
      status: 'healthy',
      timestamp: Date.now(),
      checks: [
        {
          name: '/api/health-check',
          status: 'pass',
          message: 'API responding normally',
          responseTime: 45,
          lastChecked: new Date(),
          endpoint: '/api/health-check'
        },
        {
          name: '/api/assinante/subscription',
          status: 'pass',
          message: 'Subscription API healthy',
          responseTime: 120,
          lastChecked: new Date(),
          endpoint: '/api/assinante/subscription'
        },
        {
          name: '/api/auth/me',
          status: 'pass',
          message: 'Auth API healthy',
          responseTime: 85,
          lastChecked: new Date(),
          endpoint: '/api/auth/me'
        },
        {
          name: 'indexeddb',
          status: 'pass',
          message: 'IndexedDB working normally',
          responseTime: 12,
          lastChecked: new Date()
        },
        {
          name: 'localStorage',
          status: 'pass',
          message: 'LocalStorage working normally',
          responseTime: 5,
          lastChecked: new Date()
        },
        {
          name: 'memory',
          status: 'pass',
          message: 'Memory usage: 45%',
          responseTime: 3,
          lastChecked: new Date()
        },
        {
          name: 'connectivity',
          status: 'pass',
          message: 'Online and connected',
          responseTime: 1,
          lastChecked: new Date()
        }
      ],
      metrics: {
        memoryUsage: 0.45,
        storageQuota: 1073741824,
        storageUsage: 52428800,
        activeConnections: 2,
        cacheHitRate: 0.85,
        errorRate: 0.02,
        averageResponseTime: 65,
        uptime: 86400000
      }
    },
    degraded: {
      status: 'degraded',
      timestamp: Date.now(),
      checks: [
        {
          name: '/api/health-check',
          status: 'pass',
          message: 'API responding normally',
          responseTime: 45,
          lastChecked: new Date()
        },
        {
          name: '/api/assinante/subscription',
          status: 'warn',
          message: 'Slow response time',
          responseTime: 2000,
          lastChecked: new Date()
        },
        {
          name: 'indexeddb',
          status: 'pass',
          message: 'IndexedDB working normally',
          responseTime: 12,
          lastChecked: new Date()
        }
      ],
      metrics: {
        memoryUsage: 0.75,
        storageQuota: 1073741824,
        storageUsage: 52428800,
        activeConnections: 2,
        cacheHitRate: 0.60,
        errorRate: 0.15,
        averageResponseTime: 650,
        uptime: 86400000
      }
    },
    unhealthy: {
      status: 'unhealthy',
      timestamp: Date.now(),
      checks: [
        {
          name: '/api/health-check',
          status: 'fail',
          message: 'Connection timeout',
          responseTime: 5000,
          lastChecked: new Date()
        },
        {
          name: '/api/assinante/subscription',
          status: 'fail',
          message: 'Service unavailable',
          responseTime: 1000,
          lastChecked: new Date()
        }
      ],
      metrics: {
        memoryUsage: 0.90,
        storageQuota: 1073741824,
        storageUsage: 104857600,
        activeConnections: 0,
        cacheHitRate: 0.30,
        errorRate: 0.50,
        averageResponseTime: 3000,
        uptime: 3600000
      }
    }
  },
  auth: {
    firebaseSuccess: {
      user: {
        uid: 'user_123',
        email: 'joao@example.com',
        displayName: 'João Silva',
        photoURL: null
      }
    },
    firebaseError: {
      error: 'Invalid Firebase token',
      code: 'INVALID_TOKEN'
    },
    phoneSuccess: {
      success: true,
      sessionId: 'session_123',
      message: 'Code sent successfully'
    },
    phoneVerifySuccess: {
      user: {
        uid: 'user_123',
        phone: '+5533999898026',
        displayName: 'João Silva'
      }
    },
    emailSuccess: {
      success: true,
      message: 'Email sent successfully'
    },
    emailVerifySuccess: {
      user: {
        uid: 'user_123',
        email: 'joao@example.com',
        displayName: 'João Silva'
      }
    },
    tokenSuccess: {
      user: {
        uid: 'user_123',
        email: 'joao@example.com',
        tokenAccess: true
      }
    }
  }
}

export const handlers = [
  // Subscription API
  http.get('/api/assinante/subscription', (req, res, ctx) => {
    const status = req.url.searchParams.get('status') || 'success'

    switch (status) {
      case 'success':
        return res(
          ctx.status(200),
          ctx.json(mockResponses.subscription.success)
        )
      case 'error':
        return res(
          ctx.status(404),
          ctx.json(mockResponses.subscription.error)
        )
      case 'degraded':
        return res(
          ctx.status(200),
          ctx.json(mockResponses.subscription.degraded)
        )
      case 'timeout':
        return res(
          ctx.delay(10000), // 10 segundos timeout
          ctx.status(200),
          ctx.json(mockResponses.subscription.success)
        )
      default:
        return res(
          ctx.status(500),
          ctx.json({ error: 'Internal Server Error' })
        )
    }
  }),

  http.post('/api/assinante/subscription', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true, updated: true })
    )
  }),

  // Orders API
  http.get('/api/assinante/orders', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockResponses.orders.success)
    )
  }),

  // Health Check API
  http.get('/api/health-check', (req, res, ctx) => {
    const health = req.url.searchParams.get('health') || 'healthy'

    switch (health) {
      case 'healthy':
        return res(
          ctx.status(200),
          ctx.json(mockResponses.health.healthy)
        )
      case 'degraded':
        return res(
          ctx.status(200),
          ctx.json(mockResponses.health.degraded)
        )
      case 'unhealthy':
        return res(
          ctx.status(500),
          ctx.json(mockResponses.health.unhealthy)
        )
      default:
        return res(
          ctx.status(500),
          ctx.json({ error: 'Health check failed' })
        )
    }
  }),

  // Authentication APIs
  http.post('/api/auth/verify-firebase-token', (req, res, ctx) => {
    const status = req.url.searchParams.get('status') || 'success'

    switch (status) {
      case 'success':
        return res(
          ctx.status(200),
          ctx.json(mockResponses.auth.firebaseSuccess)
        )
      case 'error':
        return res(
          ctx.status(401),
          ctx.json(mockResponses.auth.firebaseError)
        )
      default:
        return res(
          ctx.status(401),
          ctx.json({ error: 'Authentication failed' })
        )
    }
  }),

  http.post('/api/auth/send-phone-code', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockResponses.auth.phoneSuccess)
    )
  }),

  http.post('/api/auth/verify-phone-code', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockResponses.auth.phoneVerifySuccess)
    )
  }),

  http.post('/api/auth/send-email-code', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockResponses.auth.emailSuccess)
    )
  }),

  http.post('/api/auth/verify-email-code', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockResponses.auth.emailVerifySuccess)
    )
  }),

  http.post('/api/auth/verify-access-token', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockResponses.auth.tokenSuccess)
    )
  }),

  // Monitoring APIs
  http.get('/api/monitoring/performance', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        metrics: {
          responseTime: 120,
          throughput: 1000,
          errorRate: 0.02,
          cacheHitRate: 0.85
        },
        timestamp: Date.now()
      })
    )
  }),

  http.get('/api/monitoring/errors', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        errors: [
          {
            id: 'error_1',
            message: 'Database connection timeout',
            stack: 'Error: Database connection timeout...',
            timestamp: Date.now() - 3600000,
            severity: 'medium'
          }
        ],
        total: 1
      })
    )
  }),

  http.get('/api/monitoring/alerts', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        alerts: [
          {
            id: 'alert_1',
            type: 'performance',
            message: 'High response time detected',
            severity: 'warning',
            timestamp: Date.now() - 1800000
          }
        ],
        active: 1
      })
    )
  }),

  // Mock para APIs que podem falhar
  http.get('/api/unreliable-endpoint', (req, res, ctx) => {
    const random = Math.random()
    if (random < 0.3) {
      return res(
        ctx.status(500),
        ctx.json({ error: 'Random failure' })
      )
    }
    if (random < 0.1) {
      return res(
        ctx.delay(5000), // Timeout lento
        ctx.status(200),
        ctx.json({ data: 'slow response' })
      )
    }
    return res(
      ctx.status(200),
      ctx.json({ data: 'success', timestamp: Date.now() })
    )
  })
]

export const setupMockServer = () => {
  const server = setupServer(...handlers)

  beforeAll(() => {
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  return server
}

// Helper para simular diferentes condições
export const mockServerConditions = {
  slowAPI: (delay: number = 2000) => {
    return http.get('/api/assinante/subscription', (req, res, ctx) => {
      return res(
        ctx.delay(delay),
        ctx.status(200),
        ctx.json(mockResponses.subscription.success)
      )
    })
  },

  failingAPI: (statusCode: number = 500) => {
    return http.get('/api/assinante/subscription', (req, res, ctx) => {
      return res(
        ctx.status(statusCode),
        ctx.json({ error: 'API Error', code: 'INTERNAL_ERROR' })
      )
    })
  },

  timeoutAPI: (timeout: number = 30000) => {
    return http.get('/api/assinante/subscription', (req, res, ctx) => {
      return res(
        ctx.delay(timeout),
        ctx.status(200),
        ctx.json(mockResponses.subscription.success)
      )
    })
  },

  intermittentFailure: (failureRate: number = 0.5) => {
    return http.get('/api/assinante/subscription', (req, res, ctx) => {
      if (Math.random() < failureRate) {
        return res(
          ctx.status(500),
          ctx.json({ error: 'Intermittent failure' })
        )
      }
      return res(
        ctx.status(200),
        ctx.json(mockResponses.subscription.success)
      )
    })
  }
}

export { rest }