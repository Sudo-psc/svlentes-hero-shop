/**
 * API Authentication Utilities
 *
 * Centralized authentication and authorization utilities
 * to reduce code duplication across API routes.
 *
 * @author Dr. Philipe Saraiva Cruz
 */

import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { adminAuth } from '@/lib/firebase-admin'
import { validateToken } from '@/lib/token-cache'
import type { DecodedIdToken } from 'firebase-admin/auth'

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  error: string
  message: string
  code?: string
  statusCode: number
  timestamp?: string
}

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean
  user?: DecodedIdToken
  error?: ApiErrorResponse
}

/**
 * Extract Bearer token from Authorization header
 *
 * @param request - Next.js request object
 * @returns Token string or null
 */
export async function extractBearerToken(
  request: NextRequest
): Promise<string | null> {
  const headersList = await headers()
  const authorization = headersList.get('authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  const token = authorization.split('Bearer ')[1]
  return token || null
}

/**
 * Verify Firebase ID token and return decoded user data
 *
 * @param request - Next.js request object
 * @returns Authentication result with user data or error
 *
 * @example
 * ```typescript
 * const auth = await verifyAuthToken(request)
 * if (!auth.success || !auth.user) {
 *   return NextResponse.json(auth.error, { status: auth.error.statusCode })
 * }
 * const userId = auth.user.uid
 * ```
 */
export async function verifyAuthToken(
  request: NextRequest
): Promise<AuthResult> {
  try {
    // 1. Extract token from header
    const token = await extractBearerToken(request)

    if (!token) {
      return {
        success: false,
        error: {
          error: 'Token de autenticação inválido',
          message: 'Header Authorization deve conter um Bearer token válido.',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        },
      }
    }

    // 2. Enhanced token validation with caching
    const validation = await validateToken(token)

    if (!validation.valid) {
      // Determine appropriate error code based on validation error
      let statusCode = 401
      let errorCode = 'auth/invalid-token'

      if (validation.error?.includes('expired')) {
        errorCode = 'auth/id-token-expired'
      } else if (validation.error?.includes('revoked')) {
        errorCode = 'auth/id-token-revoked'
      } else if (validation.error?.includes('future')) {
        errorCode = 'auth/invalid-credential'
      }

      return {
        success: false,
        error: {
          error: 'Token inválido',
          message: 'Não foi possível validar sua autenticação.',
          code: errorCode,
          statusCode,
          timestamp: new Date().toISOString(),
        },
      }
    }

    // 3. Return success with validated user data
    return {
      success: true,
      user: validation.decodedToken,
    }
  } catch (error: any) {
    // Enhanced error handling with security logging
    console.error('[API Auth] Token verification failed', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      // Never log the actual token
    })

    // Generic authentication error (avoid information disclosure)
    return {
      success: false,
      error: {
        error: 'Erro de autenticação',
        message: 'Não foi possível verificar suas credenciais.',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      },
    }
  }
}

/**
 * Create standardized API error response
 *
 * @param error - Error string
 * @param message - Detailed message for user
 * @param statusCode - HTTP status code (default: 500)
 * @param code - Optional error code
 * @returns Structured error response
 */
export function createErrorResponse(
  error: string,
  message: string,
  statusCode: number = 500,
  code?: string
): ApiErrorResponse {
  return {
    error,
    message,
    code,
    statusCode,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Common error responses for reuse
 */
export const CommonErrors = {
  UNAUTHORIZED: createErrorResponse(
    'Não autorizado',
    'Você não tem permissão para acessar este recurso.',
    401
  ),

  FORBIDDEN: createErrorResponse(
    'Acesso negado',
    'Você não tem permissão para realizar esta ação.',
    403
  ),

  NOT_FOUND: createErrorResponse(
    'Não encontrado',
    'O recurso solicitado não foi encontrado.',
    404
  ),

  BAD_REQUEST: createErrorResponse(
    'Requisição inválida',
    'Os dados enviados são inválidos. Verifique e tente novamente.',
    400
  ),

  INTERNAL_ERROR: createErrorResponse(
    'Erro interno do servidor',
    'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
    500
  ),

  SERVICE_UNAVAILABLE: createErrorResponse(
    'Serviço indisponível',
    'O serviço está temporariamente indisponível. Tente novamente em alguns instantes.',
    503
  ),
}

/**
 * Log access for LGPD compliance audit trail
 *
 * @param userId - Firebase user UID
 * @param email - User email (optional)
 * @param action - Action being performed
 * @param metadata - Additional metadata for audit
 */
export function logAccess(
  userId: string,
  email: string | null | undefined,
  action: string,
  metadata?: Record<string, any>
): void {
  console.log(`[AUDIT_LOG]`, {
    userId,
    email,
    action,
    timestamp: new Date().toISOString(),
    ...metadata,
  })
}
