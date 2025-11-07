import { NextRequest, NextResponse } from 'next/server'
import { getUserAuditLogs, getAuditStats } from '@/lib/audit-logger'
import { adminAuth } from '@/lib/firebase-admin'

/**
 * GET /api/admin/audit
 * Retrieve audit logs with filtering
 *
 * Query Parameters:
 * - userId: Filter by user ID
 * - action: Filter by audit action
 * - entityType: Filter by entity type
 * - startDate: Filter by start date (ISO string)
 * - endDate: Filter by end date (ISO string)
 * - limit: Max results to return (default: 100)
 * - offset: Pagination offset (default: 0)
 *
 * Access: Admin only
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Implement proper admin authentication
    // For now, require Firebase auth (should be enhanced with role check)
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Autenticação necessária' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'SERVICE_UNAVAILABLE', message: 'Serviço indisponível' },
        { status: 503 }
      )
    }

    try {
      await adminAuth.verifyIdToken(token)
    } catch {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token inválido' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || undefined
    const action = searchParams.get('action') || undefined
    const entityType = searchParams.get('entityType') || undefined
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 100
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset')!)
      : 0

    // Fetch audit logs
    let logs

    if (userId) {
      // User-specific query
      logs = await getUserAuditLogs(userId, {
        startDate,
        endDate,
        action: action as any,
        entityType,
        limit,
        offset,
      })
    } else {
      // Global query (all users)
      // TODO: Implement global audit log query
      // For now, return empty for non-user-specific queries
      logs = []
    }

    return NextResponse.json({
      logs,
      pagination: {
        limit,
        offset,
        total: logs.length,
      },
    })
  } catch (error: any) {
    console.error('[API /api/admin/audit] Error:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Erro ao buscar logs de auditoria',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/audit/stats
 * Get audit statistics for compliance reporting
 *
 * Request Body:
 * - startDate: Start date (ISO string)
 * - endDate: End date (ISO string)
 *
 * Access: Admin only
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Implement proper admin authentication
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Autenticação necessária' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'SERVICE_UNAVAILABLE', message: 'Serviço indisponível' },
        { status: 503 }
      )
    }

    try {
      await adminAuth.verifyIdToken(token)
    } catch {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token inválido' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { startDate, endDate } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'startDate e endDate são obrigatórios',
        },
        { status: 400 }
      )
    }

    // Get audit statistics
    const stats = await getAuditStats(new Date(startDate), new Date(endDate))

    return NextResponse.json({ stats })
  } catch (error: any) {
    console.error('[API /api/admin/audit/stats] Error:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Erro ao calcular estatísticas de auditoria',
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
