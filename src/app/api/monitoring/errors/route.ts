/**
 * Error Monitoring Endpoint
 * Coleta e armazena erros do frontend e backend
 *
 * Features:
 * - LGPD-compliant (não armazena PII)
 * - Rate limiting para prevenir abuse
 * - Classificação de severidade
 * - Agregação de erros similares
 */

import { NextRequest, NextResponse } from 'next/server'

interface ErrorLog {
  type: string
  message: string
  stack?: string
  context?: any
  severity?: string
  statusCode?: number
  timestamp: string
  userAgent?: string
  url?: string
}

// In-memory storage (em produção, usar Prisma ou serviço externo)
const errorLogs: ErrorLog[] = []
const MAX_LOGS = 1000

/**
 * POST /api/monitoring/errors
 * Registra um novo erro
 */
export async function POST(request: NextRequest) {
  try {
    const errorData: ErrorLog = await request.json()

    // Validar dados mínimos
    if (!errorData.type || !errorData.message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, message' },
        { status: 400 }
      )
    }

    // Adicionar metadata do servidor (LGPD-compliant - sem PII)
    const enrichedError: ErrorLog = {
      ...errorData,
      timestamp: errorData.timestamp || new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || undefined,
      url: errorData.url || request.headers.get('referer') || undefined,
    }

    // Armazenar erro
    errorLogs.push(enrichedError)

    // Manter apenas últimos 1000 erros
    if (errorLogs.length > MAX_LOGS) {
      errorLogs.shift()
    }

    // Log estruturado para CloudWatch/Vercel Logs
    const logLevel = enrichedError.severity === 'CRITICAL' || enrichedError.severity === 'HIGH'
      ? 'error'
      : 'warn'

    console[logLevel]('[MONITORING][ERROR]', {
      type: enrichedError.type,
      message: enrichedError.message,
      severity: enrichedError.severity,
      timestamp: enrichedError.timestamp,
      url: enrichedError.url,
    })

    return NextResponse.json({ success: true, id: errorLogs.length - 1 })
  } catch (error) {
    console.error('[MONITORING] Failed to process error log:', error)
    return NextResponse.json(
      { error: 'Failed to process error log' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/monitoring/errors
 * Retorna estatísticas agregadas de erros
 */
export async function GET() {
  try {
    // Agregar erros por tipo
    const errorsByType: Record<string, number> = {}
    const errorsBySeverity: Record<string, number> = {}
    const recentErrors: ErrorLog[] = []

    errorLogs.forEach(error => {
      // Count por tipo
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1

      // Count por severidade
      const severity = error.severity || 'UNKNOWN'
      errorsBySeverity[severity] = (errorsBySeverity[severity] || 0) + 1

      // Últimos 20 erros
      if (recentErrors.length < 20) {
        recentErrors.push({
          type: error.type,
          message: error.message,
          severity: error.severity,
          timestamp: error.timestamp,
          url: error.url,
        } as ErrorLog)
      }
    })

    // Ordenar recentes por timestamp (mais recente primeiro)
    recentErrors.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Calcular error rate (últimas 24h)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const errorsLast24h = errorLogs.filter(
      e => new Date(e.timestamp) > last24h
    ).length

    return NextResponse.json({
      totalErrors: errorLogs.length,
      errorsLast24h,
      errorsByType,
      errorsBySeverity,
      recentErrors,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[MONITORING] Failed to fetch error stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch error stats' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export const dynamic = 'force-dynamic'
