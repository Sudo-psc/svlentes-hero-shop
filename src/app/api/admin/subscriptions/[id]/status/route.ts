/**
 * PUT /api/admin/subscriptions/[id]/status
 * Atualizar status de assinatura
 *
 * Atualiza o status de uma assinatura com motivo e histórico
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createSuccessResponse } from '@/lib/admin-auth'
import { subscriptionStatusUpdateSchema } from '@/lib/admin-validations'

/**
 * @swagger
 * /api/admin/subscriptions/{id}/status:
 *   put:
 *     summary: Atualizar status da assinatura
 *     description: Atualiza o status de uma assinatura com motivo e histórico
 *     tags:
 *       - Assinaturas Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da assinatura
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING_ACTIVATION, ACTIVE, OVERDUE, SUSPENDED, PAUSED, CANCELLED, EXPIRED, REFUNDED, PENDING]
 *                 description: Novo status da assinatura
 *               reason:
 *                 type: string
 *                 description: Motivo da mudança de status
 *               metadata:
 *                 type: object
 *                 description: Metadados adicionais
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscription:
 *                       $ref: '#/components/schemas/Subscription'
 *                     history:
 *                       $ref: '#/components/schemas/SubscriptionHistory'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       404:
 *         description: Assinatura não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('subscriptions:status_update')(request)

    if (error) {
      return error
    }

    const subscriptionId = params.id

    if (!subscriptionId) {
      return NextResponse.json(
        {
          error: 'INVALID_ID',
          message: 'ID da assinatura é obrigatório'
        },
        { status: 400 }
      )
    }

    // Validar body
    const body = await request.json()
    const { data: statusData, error: validationError } = validateBody(subscriptionStatusUpdateSchema, body)

    if (validationError) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Campo inválido: ${validationError.field} - ${validationError.message}`
        },
        { status: 400 }
      )
    }

    // Verificar se assinatura existe
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        id: true,
        status: true,
        userId: true,
        planType: true,
        monthlyValue: true,
        lastPaymentDate: true,
        nextBillingDate: true,
        overdueDate: true,
        daysOverdue: true,
        suspendedDate: true
      }
    })

    if (!existingSubscription) {
      return NextResponse.json(
        {
          error: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Assinatura não encontrada'
        },
        { status: 404 }
      )
    }

    const oldStatus = existingSubscription.status
    const newStatus = statusData.status

    // Verificar se mudança é válida
    if (!isValidStatusTransition(oldStatus, newStatus)) {
      return NextResponse.json(
        {
          error: 'INVALID_STATUS_TRANSITION',
          message: `Transição de status inválida: ${oldStatus} → ${newStatus}`,
          validTransitions: getValidTransitions(oldStatus)
        },
        { status: 400 }
      )
    }

    // Preparar dados de atualização baseado no novo status
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date()
    }

    // Adicionar campos específicos baseado no status
    switch (newStatus) {
      case 'OVERDUE':
        updateData.overdueDate = new Date()
        updateData.daysOverdue = calculateDaysOverdue(existingSubscription.lastPaymentDate)
        break

      case 'SUSPENDED':
        updateData.suspendedDate = new Date()
        updateData.suspendedReason = statusData.reason || 'Suspensão administrativa'
        break

      case 'PAUSED':
        updateData.pausedAt = new Date() // Note: este campo pode não existir no schema
        break

      case 'CANCELLED':
        updateData.cancelledDate = new Date() // Note: este campo pode não existir no schema
        updateData.cancelReason = statusData.reason || 'Cancelamento administrativo'
        updateData.endDate = new Date()
        break

      case 'ACTIVE':
        // Limpar campos de problemas se reativando
        updateData.overdueDate = null
        updateData.daysOverdue = 0
        updateData.suspendedDate = null
        updateData.suspendedReason = null
        if (existingSubscription.nextBillingDate) {
          updateData.nextBillingDate = new Date(existingSubscription.nextBillingDate)
        }
        break
    }

    // Iniciar transação para atualizar status e criar histórico
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar assinatura
      const updatedSubscription = await tx.subscription.update({
        where: { id: subscriptionId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      // Criar registro no histórico
      const historyRecord = await tx.subscriptionHistory.create({
        data: {
          subscriptionId,
          userId: existingSubscription.userId,
          changeType: 'STATUS_CHANGE' as any,
          description: statusData.reason || `Mudança de status: ${oldStatus} → ${newStatus}`,
          oldValue: {
            status: oldStatus,
            overdueDate: existingSubscription.overdueDate,
            suspendedDate: existingSubscription.suspendedDate,
            daysOverdue: existingSubscription.daysOverdue
          },
          newValue: {
            status: newStatus,
            reason: statusData.reason,
            changedBy: user.email,
            ...(statusData.metadata && { metadata: statusData.metadata })
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          metadata: {
            userAgent: request.headers.get('user-agent'),
            timestamp: new Date().toISOString(),
            ...statusData.metadata
          }
        }
      })

      return { subscription: updatedSubscription, history: historyRecord }
    })

    // Disparar ações baseadas no novo status
    await triggerStatusActions(newStatus, result.subscription, user)

    return createSuccessResponse(
      {
        subscription: result.subscription,
        history: result.history,
        statusChange: {
          from: oldStatus,
          to: newStatus,
          reason: statusData.reason,
          changedBy: user.email,
          changedAt: new Date()
        }
      },
      'Status da assinatura atualizado com sucesso'
    )

  } catch (error) {
    console.error('Subscription status update error:', error)
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Funções auxiliares
function validateBody<T>(schema: any, body: unknown): {
  data: T | null
  error: { field: string; message: string } | null
} {
  try {
    const data = schema.parse(body)
    return { data, error: null }
  } catch (error: any) {
    if (error.errors && error.errors[0]) {
      const firstError = error.errors[0]
      return {
        data: null,
        error: {
          field: firstError.path.join('.'),
          message: firstError.message
        }
      }
    }
    return {
      data: null,
      error: {
        field: 'unknown',
        message: 'Erro de validação desconhecido'
      }
    }
  }
}

function isValidStatusTransition(from: string, to: string): boolean {
  const validTransitions: Record<string, string[]> = {
    'PENDING_ACTIVATION': ['ACTIVE', 'CANCELLED', 'PENDING'],
    'ACTIVE': ['OVERDUE', 'SUSPENDED', 'PAUSED', 'CANCELLED', 'EXPIRED'],
    'OVERDUE': ['ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'],
    'SUSPENDED': ['ACTIVE', 'CANCELLED', 'EXPIRED'],
    'PAUSED': ['ACTIVE', 'CANCELLED', 'EXPIRED'],
    'CANCELLED': [], // Status final
    'EXPIRED': ['ACTIVE'], // Pode ser reativada
    'REFUNDED': [], // Status final
    'PENDING': ['PENDING_ACTIVATION', 'ACTIVE', 'CANCELLED']
  }

  return validTransitions[from]?.includes(to) || false
}

function getValidTransitions(from: string): string[] {
  const validTransitions: Record<string, string[]> = {
    'PENDING_ACTIVATION': ['ACTIVE', 'CANCELLED', 'PENDING'],
    'ACTIVE': ['OVERDUE', 'SUSPENDED', 'PAUSED', 'CANCELLED', 'EXPIRED'],
    'OVERDUE': ['ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'],
    'SUSPENDED': ['ACTIVE', 'CANCELLED', 'EXPIRED'],
    'PAUSED': ['ACTIVE', 'CANCELLED', 'EXPIRED'],
    'CANCELLED': [],
    'EXPIRED': ['ACTIVE'],
    'REFUNDED': [],
    'PENDING': ['PENDING_ACTIVATION', 'ACTIVE', 'CANCELLED']
  }

  return validTransitions[from] || []
}

function calculateDaysOverdue(lastPaymentDate: Date | null): number {
  if (!lastPaymentDate) return 0

  const now = new Date()
  const dueDate = new Date(lastPaymentDate)
  dueDate.setDate(dueDate.getDate() + 30) // Assumindo ciclo de 30 dias

  const diffTime = now.getTime() - dueDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

async function triggerStatusActions(
  status: string,
  subscription: any,
  user: any
): Promise<void> {
  try {
    switch (status) {
      case 'ACTIVE':
        // Enviar email de boas-vindas/reactivação
        console.log(`Assinatura ${subscription.id} reativada por ${user.email}`)
        // TODO: Integrar com sistema de notificações
        break

      case 'OVERDUE':
        // Enviar notificação de cobrança
        console.log(`Assinatura ${subscription.id} em atraso`)
        // TODO: Integrar com sistema de cobrança
        break

      case 'SUSPENDED':
        // Notificar sobre suspensão
        console.log(`Assinatura ${subscription.id} suspensa: ${subscription.suspendedReason}`)
        // TODO: Integrar com sistema de notificações
        break

      case 'CANCELLED':
        // Enviar email de cancelamento
        console.log(`Assinatura ${subscription.id} cancelada: ${subscription.cancelReason}`)
        // TODO: Integrar com sistema de notificações
        break

      default:
        // Outros status
        break
    }
  } catch (error) {
    console.error('Error triggering status actions:', error)
    // Não falhar a atualização se as ações falharem
  }
}