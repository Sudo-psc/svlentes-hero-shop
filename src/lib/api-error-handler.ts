/**
 * Centralized API Error Handler
 * Healthcare-grade error handling with LGPD compliance
 *
 * Features:
 * - LGPD-compliant logging (no PII in logs)
 * - User-friendly error messages
 * - Monitoring integration
 * - Structured error responses
 */

import { NextResponse } from 'next/server'

// Error types para classificação
export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE = 'DATABASE',
  EXTERNAL_API = 'EXTERNAL_API',
  INTERNAL = 'INTERNAL',
  TIMEOUT = 'TIMEOUT',
}

// Severity levels
export enum ErrorSeverity {
  LOW = 'LOW',       // Expected errors (404, validation)
  MEDIUM = 'MEDIUM', // Recoverable errors (rate limit, timeout)
  HIGH = 'HIGH',     // Service issues (DB down, external API)
  CRITICAL = 'CRITICAL', // System failures (config missing)
}

export interface ApiError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  userMessage: string
  statusCode: number
  context?: Record<string, any>
  originalError?: Error
}

export interface ErrorContext {
  api: string
  userId?: string
  requestId?: string
  timestamp?: Date
  metadata?: Record<string, any>
}

/**
 * Mapeamento de tipos de erro para mensagens user-friendly
 */
const USER_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.AUTHENTICATION]: 'Sua sessão expirou. Por favor, faça login novamente.',
  [ErrorType.AUTHORIZATION]: 'Você não tem permissão para acessar este recurso.',
  [ErrorType.VALIDATION]: 'Os dados fornecidos são inválidos. Verifique e tente novamente.',
  [ErrorType.NOT_FOUND]: 'Recurso não encontrado.',
  [ErrorType.RATE_LIMIT]: 'Muitas requisições. Por favor, aguarde alguns instantes.',
  [ErrorType.SERVICE_UNAVAILABLE]: 'Serviço temporariamente indisponível. Tente novamente em breve.',
  [ErrorType.DATABASE]: 'Erro ao acessar dados. Nossa equipe foi notificada.',
  [ErrorType.EXTERNAL_API]: 'Erro ao comunicar com serviço externo. Tente novamente.',
  [ErrorType.INTERNAL]: 'Erro interno do servidor. Nossa equipe foi notificada.',
  [ErrorType.TIMEOUT]: 'A operação demorou muito tempo. Tente novamente.',
}

/**
 * Mapeamento de tipos de erro para status HTTP
 */
const STATUS_CODES: Record<ErrorType, number> = {
  [ErrorType.AUTHENTICATION]: 401,
  [ErrorType.AUTHORIZATION]: 403,
  [ErrorType.VALIDATION]: 400,
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.RATE_LIMIT]: 429,
  [ErrorType.SERVICE_UNAVAILABLE]: 503,
  [ErrorType.DATABASE]: 500,
  [ErrorType.EXTERNAL_API]: 502,
  [ErrorType.INTERNAL]: 500,
  [ErrorType.TIMEOUT]: 504,
}

/**
 * Classe principal de tratamento de erros
 */
export class ApiErrorHandler {
  /**
   * Cria uma resposta de erro padronizada
   */
  static createError(
    type: ErrorType,
    message: string,
    context: ErrorContext,
    originalError?: Error
  ): ApiError {
    const severity = this.determineSeverity(type)
    const statusCode = STATUS_CODES[type]
    const userMessage = USER_MESSAGES[type]

    return {
      type,
      severity,
      message,
      userMessage,
      statusCode,
      context: this.sanitizeContext(context),
      originalError,
    }
  }

  /**
   * Determina a severidade baseada no tipo de erro
   */
  private static determineSeverity(type: ErrorType): ErrorSeverity {
    switch (type) {
      case ErrorType.NOT_FOUND:
      case ErrorType.VALIDATION:
        return ErrorSeverity.LOW

      case ErrorType.RATE_LIMIT:
      case ErrorType.TIMEOUT:
      case ErrorType.EXTERNAL_API:
        return ErrorSeverity.MEDIUM

      case ErrorType.DATABASE:
      case ErrorType.AUTHORIZATION:
        return ErrorSeverity.HIGH

      case ErrorType.SERVICE_UNAVAILABLE:
      case ErrorType.INTERNAL:
        return ErrorSeverity.CRITICAL

      default:
        return ErrorSeverity.MEDIUM
    }
  }

  /**
   * Sanitiza contexto para remover PII (LGPD compliance)
   */
  private static sanitizeContext(context: ErrorContext): Record<string, any> {
    const sanitized: Record<string, any> = {
      api: context.api,
      timestamp: context.timestamp || new Date(),
      requestId: context.requestId,
    }

    // Incluir userId apenas (não dados pessoais)
    if (context.userId) {
      sanitized.userId = context.userId
    }

    // Incluir metadata não-sensível
    if (context.metadata) {
      sanitized.metadata = this.sanitizeMetadata(context.metadata)
    }

    return sanitized
  }

  /**
   * Remove dados sensíveis do metadata
   */
  private static sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {}
    const sensitiveKeys = ['email', 'cpf', 'phone', 'password', 'token', 'address']

    for (const [key, value] of Object.entries(metadata)) {
      // Skip dados sensíveis
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        continue
      }

      sanitized[key] = value
    }

    return sanitized
  }

  /**
   * Loga erro para monitoramento
   */
  static async logError(error: ApiError): Promise<void> {
    const logData = {
      type: error.type,
      severity: error.severity,
      message: error.message,
      statusCode: error.statusCode,
      context: error.context,
      stack: error.originalError?.stack,
    }

    // Console log sempre (para CloudWatch/Vercel Logs)
    console.error(`[API_ERROR][${error.severity}] ${error.type}:`, logData)

    // Enviar para endpoint de monitoring (não-bloqueante)
    try {
      if (typeof window === 'undefined') {
        // Server-side: enviar para API de monitoring
        await fetch('/api/monitoring/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logData),
          signal: AbortSignal.timeout(2000), // 2s timeout
        }).catch(() => {
          // Silently fail - não queremos quebrar API por erro de logging
        })
      }
    } catch {
      // Ignorar falhas de logging
    }
  }

  /**
   * Cria NextResponse com erro tratado
   */
  static async handleError(
    type: ErrorType,
    message: string,
    context: ErrorContext,
    originalError?: Error
  ): Promise<NextResponse> {
    const error = this.createError(type, message, context, originalError)

    // Log para monitoramento
    await this.logError(error)

    // Retornar resposta user-friendly
    return NextResponse.json(
      {
        error: error.type,
        message: error.userMessage,
        requestId: context.requestId,
        timestamp: error.context?.timestamp,
      },
      { status: error.statusCode }
    )
  }

  /**
   * Wrapper para try-catch em APIs
   */
  static async wrapApiHandler<T>(
    handler: () => Promise<T>,
    context: ErrorContext
  ): Promise<T | NextResponse> {
    try {
      return await handler()
    } catch (error) {
      console.error(`[${context.api}] Unhandled error:`, error)

      // Determinar tipo de erro baseado na exception
      let errorType = ErrorType.INTERNAL
      let message = 'Erro interno do servidor'

      if (error instanceof Error) {
        message = error.message

        // Classificar erro baseado na mensagem
        if (message.includes('Firebase') || message.includes('auth')) {
          errorType = ErrorType.AUTHENTICATION
        } else if (message.includes('Prisma') || message.includes('database')) {
          errorType = ErrorType.DATABASE
        } else if (message.includes('timeout')) {
          errorType = ErrorType.TIMEOUT
        } else if (message.includes('fetch') || message.includes('network')) {
          errorType = ErrorType.EXTERNAL_API
        }
      }

      return this.handleError(errorType, message, context, error as Error)
    }
  }
}

/**
 * Helper para gerar requestId único
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Tipos de resposta padronizados
 */
export interface SuccessResponse<T = any> {
  success: true
  data: T
  requestId?: string
  timestamp?: string
}

export interface ErrorResponse {
  error: string
  message: string
  requestId?: string
  timestamp?: string
}

/**
 * Helper para criar resposta de sucesso
 */
export function createSuccessResponse<T>(
  data: T,
  requestId?: string
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    requestId,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Helper para validar autenticação
 */
export async function validateFirebaseAuth(
  authHeader: string | null,
  adminAuth: any,
  context: ErrorContext
): Promise<{ uid: string } | NextResponse> {
  if (!adminAuth) {
    return ApiErrorHandler.handleError(
      ErrorType.SERVICE_UNAVAILABLE,
      'Firebase Admin não inicializado',
      context
    )
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiErrorHandler.handleError(
      ErrorType.AUTHENTICATION,
      'Token não fornecido',
      context
    )
  }

  const token = authHeader.split('Bearer ')[1]

  try {
    const firebaseUser = await adminAuth.verifyIdToken(token)

    if (!firebaseUser?.uid) {
      return ApiErrorHandler.handleError(
        ErrorType.AUTHENTICATION,
        'Token inválido',
        context
      )
    }

    return { uid: firebaseUser.uid }
  } catch (error) {
    return ApiErrorHandler.handleError(
      ErrorType.AUTHENTICATION,
      'Token expirado ou inválido',
      context,
      error as Error
    )
  }
}
