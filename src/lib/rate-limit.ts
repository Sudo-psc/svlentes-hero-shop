/**
 * Rate Limiting Middleware for Next.js API Routes
 * Protege endpoints contra brute force e DDoS
 */
import { NextRequest, NextResponse } from 'next/server'
interface RateLimitOptions {
  /**
   * Janela de tempo em milissegundos (padrão: 15 minutos)
   */
  windowMs?: number
  /**
   * Máximo de requisições permitidas na janela (padrão: 5)
   */
  max?: number
  /**
   * Mensagem de erro personalizada
   */
  message?: string
  /**
   * Código de status HTTP (padrão: 429)
   */
  statusCode?: number
}
interface RateLimitEntry {
  count: number
  resetTime: number
}
// Armazena contadores de requisições em memória
// Em produção, considere usar Redis ou similar
const rateLimitStore = new Map<string, RateLimitEntry>()
/**
 * Limpa entradas expiradas do store (executado periodicamente)
 */
function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}
// Limpa entradas expiradas a cada 5 minutos
setInterval(cleanupExpiredEntries, 5 * 60 * 1000)
/**
 * Gera uma chave única para o cliente baseada em IP ou identificador
 */
function getClientKey(request: NextRequest, identifier?: string): string {
  if (identifier) {
    return `rate-limit:${identifier}`
  }
  // Tenta obter o IP real através de headers de proxy
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  return `rate-limit:${ip}`
}
/**
 * Middleware de rate limiting para Next.js API Routes
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await rateLimit(request, {
 *     windowMs: 15 * 60 * 1000, // 15 minutos
 *     max: 5, // 5 tentativas
 *   })
 *
 *   if (rateLimitResult) {
 *     return rateLimitResult // Retorna resposta 429
 *   }
 *
 *   // Continue com a lógica normal
 * }
 * ```
 */
export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions = {},
  identifier?: string
): Promise<NextResponse | null> {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutos
    max = 5,
    message = 'Muitas tentativas. Tente novamente mais tarde.',
    statusCode = 429
  } = options
  const key = getClientKey(request, identifier)
  const now = Date.now()
  const entry = rateLimitStore.get(key)
  // Se não existe entrada ou expirou, cria nova
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return null // Permite a requisição
  }
  // Incrementa contador
  entry.count += 1
  // Se excedeu o limite, retorna erro
  if (entry.count > max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return NextResponse.json(
      {
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfter
      },
      {
        status: statusCode,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
        }
      }
    )
  }
  // Atualiza a entrada
  rateLimitStore.set(key, entry)
  // Permite a requisição
  return null
}
/**
 * Configurações predefinidas de rate limiting
 */
export const rateLimitConfigs = {
  /**
   * Para endpoints de autenticação (login, registro)
   * 5 tentativas em 15 minutos
   */
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  /**
   * Para endpoints de API em geral
   * 100 requisições em 15 minutos
   */
  api: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Limite de requisições excedido. Tente novamente mais tarde.'
  },
  /**
   * Para endpoints de leitura (GET)
   * 200 requisições em 15 minutos
   */
  read: {
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: 'Muitas requisições de leitura. Tente novamente mais tarde.'
  },
  /**
   * Para endpoints de escrita (POST, PUT, DELETE)
   * 50 requisições em 15 minutos
   */
  write: {
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Muitas requisições de escrita. Tente novamente mais tarde.'
  },
  /**
   * Para endpoints de envio de email
   * 3 tentativas em 1 hora
   */
  email: {
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Muitos emails enviados. Tente novamente em 1 hora.'
  }
}
/**
 * Limpa manualmente o rate limit de um cliente
 * Útil para testes ou casos especiais
 */
export function clearRateLimit(request: NextRequest, identifier?: string): void {
  const key = getClientKey(request, identifier)
  rateLimitStore.delete(key)
}
/**
 * Obtém informações do rate limit atual de um cliente
 */
export function getRateLimitInfo(request: NextRequest, identifier?: string): {
  count: number
  remaining: number
  resetTime: Date
} | null {
  const key = getClientKey(request, identifier)
  const entry = rateLimitStore.get(key)
  if (!entry) {
    return null
  }
  return {
    count: entry.count,
    remaining: Math.max(0, 5 - entry.count), // Assumindo max padrão de 5
    resetTime: new Date(entry.resetTime)
  }
}