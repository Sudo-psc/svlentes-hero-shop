/**
 * CSRF Protection Middleware for Next.js
 * Implementa proteção Double Submit Cookie contra ataques CSRF
 */
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
const CSRF_TOKEN_COOKIE = 'csrf_token'
const CSRF_TOKEN_HEADER = 'x-csrf-token'
const CSRF_TOKEN_LENGTH = 32
/**
 * Gera um token CSRF criptograficamente seguro
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}
/**
 * Verifica se o token CSRF é válido (comparação constant-time)
 */
function verifyToken(token1: string, token2: string): boolean {
  if (!token1 || !token2) return false
  if (token1.length !== token2.length) return false
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token1, 'hex'),
      Buffer.from(token2, 'hex')
    )
  } catch {
    return false
  }
}
/**
 * Middleware de proteção CSRF
 * Deve ser chamado em rotas que modificam dados (POST, PUT, PATCH, DELETE)
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const csrfResult = await csrfProtection(request)
 *   if (csrfResult) {
 *     return csrfResult // Retorna resposta 403
 *   }
 *
 *   // Continue com a lógica normal
 * }
 * ```
 */
export async function csrfProtection(request: NextRequest): Promise<NextResponse | null> {
  // Apenas métodos que modificam dados precisam de proteção CSRF
  const method = request.method.toUpperCase()
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return null
  }
  // Obter token do cookie
  const tokenFromCookie = request.cookies.get(CSRF_TOKEN_COOKIE)?.value
  // Obter token do header
  const tokenFromHeader = request.headers.get(CSRF_TOKEN_HEADER)
  // Se não houver token ou não forem iguais, bloquear requisição
  if (!tokenFromCookie || !tokenFromHeader || !verifyToken(tokenFromCookie, tokenFromHeader)) {
    return NextResponse.json(
      {
        error: 'CSRF_TOKEN_INVALID',
        message: 'Token CSRF inválido ou ausente'
      },
      { status: 403 }
    )
  }
  // Token válido - permitir requisição
  return null
}
/**
 * Adiciona token CSRF à resposta
 * Deve ser chamado em rotas GET que servem formulários
 */
export function setCsrfToken(response: NextResponse): NextResponse {
  const existingToken = response.cookies.get(CSRF_TOKEN_COOKIE)?.value
  // Se já existe token válido, não gerar novo
  if (existingToken) {
    return response
  }
  // Gerar novo token e definir cookie
  const newToken = generateCsrfToken()
  response.cookies.set(CSRF_TOKEN_COOKIE, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 horas
  })
  return response
}
/**
 * Helper para obter o token CSRF do cookie
 * Usado no lado do cliente para incluir no header
 */
export function getCsrfTokenFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const cookies = document.cookie.split(';')
  const csrfCookie = cookies.find(cookie =>
    cookie.trim().startsWith(`${CSRF_TOKEN_COOKIE}=`)
  )
  if (!csrfCookie) return undefined
  return csrfCookie.split('=')[1]
}
/**
 * Hook React para obter o token CSRF
 * Usado em componentes para incluir token nas requisições
 */
export function useCsrfToken(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return getCsrfTokenFromCookie()
}
/**
 * Helper para incluir token CSRF em chamadas fetch
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/endpoint', {
 *   method: 'POST',
 *   headers: withCsrfToken({
 *     'Content-Type': 'application/json'
 *   }),
 *   body: JSON.stringify(data)
 * })
 * ```
 */
export function withCsrfToken(headers: Record<string, string> = {}): Record<string, string> {
  const token = getCsrfTokenFromCookie()
  if (token) {
    return {
      ...headers,
      [CSRF_TOKEN_HEADER]: token
    }
  }
  return headers
}
/**
 * Configuração para rotas que não precisam de proteção CSRF
 * Útil para APIs públicas ou endpoints sem estado
 */
export const csrfExemptRoutes = [
  '/api/health-check',
  '/api/webhooks/asaas',
  '/api/webhooks/stripe',
  '/api/monitoring/performance'
]
/**
 * Verifica se uma rota está isenta de proteção CSRF
 */
export function isCsrfExempt(pathname: string): boolean {
  return csrfExemptRoutes.some(route => pathname.startsWith(route))
}