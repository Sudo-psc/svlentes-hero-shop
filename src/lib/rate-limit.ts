/**
 * Rate Limiting Implementation
 * 
 * Implementa rate limiting para proteger APIs contra abuso.
 * Usa um cache em memória simples. Para produção, substituir por Redis (Upstash).
 */

interface RateLimitConfig {
  windowMs: number // Janela de tempo em milissegundos
  maxRequests: number // Número máximo de requisições na janela
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Cache em memória (substituir por Redis em produção)
const rateLimitCache = new Map<string, RateLimitEntry>()

// Limpeza periódica do cache
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitCache.entries()) {
    if (entry.resetTime < now) {
      rateLimitCache.delete(key)
    }
  }
}, 60000) // Limpar a cada 60 segundos

/**
 * Verifica se uma requisição deve ser bloqueada por rate limiting
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 10 }
): {
  allowed: boolean
  limit: number
  remaining: number
  reset: number
} {
  const now = Date.now()
  const entry = rateLimitCache.get(identifier)

  // Se não existe entrada ou a janela expirou, criar nova
  if (!entry || entry.resetTime < now) {
    const resetTime = now + config.windowMs
    rateLimitCache.set(identifier, {
      count: 1,
      resetTime,
    })

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: resetTime,
    }
  }

  // Incrementar contador
  entry.count++

  // Verificar se excedeu o limite
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: entry.resetTime,
    }
  }

  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    reset: entry.resetTime,
  }
}

/**
 * Configurações de rate limit por tipo de endpoint
 */
export const RATE_LIMIT_CONFIGS = {
  // APIs públicas - limite mais restritivo
  public: {
    windowMs: 60000, // 1 minuto
    maxRequests: 10,
  },
  
  // Webhooks - limite médio
  webhook: {
    windowMs: 60000, // 1 minuto
    maxRequests: 100,
  },
  
  // Checkout/pagamento - limite mais restritivo
  payment: {
    windowMs: 300000, // 5 minutos
    maxRequests: 5,
  },
  
  // Consultas - limite médio
  consultation: {
    windowMs: 60000, // 1 minuto
    maxRequests: 20,
  },
  
  // Health check - sem limite (ou muito alto)
  health: {
    windowMs: 60000,
    maxRequests: 1000,
  },
}

/**
 * Extrai identificador único da requisição (IP + User Agent)
 */
export function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0].trim() || '0.0.0.0'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Hash simples para reduzir tamanho da chave
  const identifier = `${ip}:${userAgent.substring(0, 50)}`
  return Buffer.from(identifier).toString('base64')
}

/**
 * Middleware de rate limiting para Next.js API routes
 */
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  config?: RateLimitConfig
) {
  return async (request: Request): Promise<Response> => {
    const identifier = getClientIdentifier(request)
    const result = checkRateLimit(identifier, config)

    // Adicionar headers de rate limit
    const headers = new Headers()
    headers.set('X-RateLimit-Limit', result.limit.toString())
    headers.set('X-RateLimit-Remaining', result.remaining.toString())
    headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString())

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Você excedeu o limite de requisições. Por favor, tente novamente mais tarde.',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            ...Object.fromEntries(headers),
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Continuar com a requisição normal
    const response = await handler(request)
    
    // Adicionar headers de rate limit à resposta
    for (const [key, value] of headers.entries()) {
      response.headers.set(key, value)
    }

    return response
  }
}
