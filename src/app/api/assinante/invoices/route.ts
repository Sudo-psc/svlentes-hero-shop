// @ts-nocheck - Prisma type mismatch with Payment model - paidAt field missing in generated types
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { logAudit, AuditAction } from '@/lib/audit-logger'
import {
  ApiErrorHandler,
  ErrorType,
  generateRequestId,
  validateFirebaseAuth,
  createSuccessResponse,
} from '@/lib/api-error-handler'
import {
  getUserByFirebaseUid,
  isErrorResponse,
} from '@/lib/api-helpers'
/**
 * GET /api/assinante/invoices
 * Retorna histórico de faturas do usuário autenticado
 *
 * SECURITY: Ownership validation enforced
 * - Filters subscriptions by authenticated user ID
 * - Prevents access to other users' invoices (OWASP A01:2021)
 * - Returns HTTP 403 for unauthorized access attempts
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  const context = {
    api: '/api/assinante/invoices',
    requestId,
    timestamp: new Date(),
  }

  // Rate limiting: 200 requisições em 15 minutos (leitura)
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.read)
  if (rateLimitResult) {
    return rateLimitResult
  }

  return ApiErrorHandler.wrapApiHandler(async () => {
    // Validar autenticação Firebase
    const authResult = await validateFirebaseAuth(
      request.headers.get('Authorization'),
      adminAuth,
      context
    )

    if (authResult instanceof NextResponse) {
      return authResult // Error response
    }

    const { uid } = authResult

    // === OWNERSHIP VALIDATION: Buscar usuário autenticado ===
    const userResult = await getUserByFirebaseUid(uid, context)
    if (isErrorResponse(userResult)) return userResult
    const user = userResult
    // === OWNERSHIP VALIDATION: Buscar subscriptions do usuário ===
    // Filtrar APENAS subscriptions que pertencem ao usuário autenticado
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: user.id, // ← OWNERSHIP FILTER
      },
      select: { id: true },
    })

    if (subscriptions.length === 0) {
      return createSuccessResponse(
        {
          invoices: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        },
        requestId
      )
    }

    const subscriptionIds = subscriptions.map(sub => sub.id)

    // Buscar pagamentos com paginação
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Buscar total de pagamentos
    const totalInvoices = await prisma.payment.count({
      where: {
        subscriptionId: { in: subscriptionIds }, // ← OWNERSHIP via subscriptionIds
      },
    })

    // === BUSCAR PAYMENTS COM OWNERSHIP VALIDATION ===
    // Payments já estão filtrados por subscriptionIds que pertencem ao usuário
    const payments = await prisma.payment.findMany({
      where: {
        subscriptionId: { in: subscriptionIds }, // ← OWNERSHIP via subscriptionIds
      },
      include: {
        subscription: {
          select: {
            planType: true,
            userId: true, // Incluir para auditoria LGPD
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    // === LGPD AUDIT LOG ===
    // Registrar acesso/download de faturas (documentos fiscais sensíveis)
    // LGPD Article 7: tratamento de dados financeiros e fiscais requer rastreamento
    await logAudit({
      userId: user.id,
      action: AuditAction.DOWNLOAD_INVOICE,
      entityType: 'Payment',
      entityId: null, // Null para listagens
      oldValue: null,
      newValue: {
        accessType: 'invoice_list',
        recordCount: payments.length,
        totalInvoices: totalInvoices,
        pagination: {
          page,
          limit,
        },
        // NÃO logar valores financeiros completos, apenas metadados
        hasDownloadUrls: payments.some(p => p.invoiceUrl || p.boletoUrl),
      },
      request,
    })

    return createSuccessResponse(
      {
        invoices: payments.map(payment => ({
          id: payment.id,
          subscriptionId: payment.subscriptionId,
          status: payment.status.toLowerCase(),
          planName: payment.subscription.planType,
          amount: Number(payment.amount),
          dueDate: payment.dueDate.toISOString(),
          paidAt: payment.paidAt?.toISOString(),
          invoiceUrl: payment.invoiceUrl,
          boletoUrl: payment.boletoUrl,
          pixCode: payment.pixCode,
          pixQrCode: payment.pixQrCode,
          createdAt: payment.createdAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total: totalInvoices,
          totalPages: Math.ceil(totalInvoices / limit),
        },
      },
      requestId
    )
  }, context)
}
// Force dynamic rendering
export const dynamic = 'force-dynamic'