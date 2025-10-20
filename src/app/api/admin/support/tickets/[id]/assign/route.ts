/**
 * PUT /api/admin/support/tickets/[id]/assign
 * Atribuir ticket a um agente
 *
 * Atribui um ticket de suporte a um agente específico
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createSuccessResponse } from '@/lib/admin-auth'
import { supportTicketAssignSchema } from '@/lib/admin-validations'
/**
 * @swagger
 * /api/admin/support/tickets/{id}/assign:
 *   put:
 *     summary: Atribuir ticket a agente
 *     description: Atribui um ticket de suporte a um agente específico
 *     tags:
 *       - Suporte Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assignedAgentId:
 *                 type: string
 *                 description: ID do agente a ser atribuído
 *               notes:
 *                 type: string
 *                 description: Notas sobre a atribuição
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT, CRITICAL]
 *                 description: Nova prioridade (opcional)
 *             required:
 *               - assignedAgentId
 *     responses:
 *       200:
 *         description: Ticket atribuído com sucesso
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
 *                     ticket:
 *                       $ref: '#/components/schemas/SupportTicket'
 *                     assignment:
 *                       type: object
 *                       properties:
 *                         assignedTo:
 *                           type: string
 *                           description: Nome do agente
 *                         assignedBy:
 *                           type: string
 *                           description: Nome do admin que atribuiu
 *                         assignedAt:
 *                           type: string
 *                           format: date-time
 *                         notes:
 *                           type: string
 *                           description: Notas da atribuição
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       404:
 *         description: Ticket não encontrado
 *       409:
 *         description: Ticket já atribuído ou agente inválido
 *       500:
 *         description: Erro interno do servidor
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('support:assign')(request)
    if (error) {
      return error
    }
    const ticketId = params.id
    if (!ticketId) {
      return NextResponse.json(
        {
          error: 'INVALID_ID',
          message: 'ID do ticket é obrigatório'
        },
        { status: 400 }
      )
    }
    // Validar body
    const body = await request.json()
    const { data: assignData, error: validationError } = validateBody(supportTicketAssignSchema, body)
    if (validationError) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Campo inválido: ${validationError.field} - ${validationError.message}`
        },
        { status: 400 }
      )
    }
    // Verificar se ticket existe
    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        status: true,
        assignedAgentId: true,
        priority: true,
        escalationId: true
      }
    })
    if (!existingTicket) {
      return NextResponse.json(
        {
          error: 'TICKET_NOT_FOUND',
          message: 'Ticket não encontrado'
        },
        { status: 404 }
      )
    }
    // Verificar se ticket pode ser atribuído
    if (existingTicket.status === 'CLOSED' || existingTicket.status === 'RESOLVED') {
      return NextResponse.json(
        {
          error: 'TICKET_CLOSED',
          message: 'Tickets fechados ou resolvidos não podem ser atribuídos'
        },
        { status: 409 }
      )
    }
    // Verificar se agente existe
    const agent = await prisma.agent.findUnique({
      where: { id: assignData.assignedAgentId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        maxConcurrentTickets: true,
        currentTicketCount: true
      }
    })
    if (!agent) {
      return NextResponse.json(
        {
          error: 'AGENT_NOT_FOUND',
          message: 'Agente não encontrado'
        },
        { status: 404 }
      )
    }
    if (!agent.isActive) {
      return NextResponse.json(
        {
          error: 'AGENT_INACTIVE',
          message: 'Agente não está ativo'
        },
        { status: 409 }
      )
    }
    // Verificar capacidade do agente
    if (agent.currentTicketCount >= agent.maxConcurrentTickets) {
      return NextResponse.json(
        {
          error: 'AGENT_AT_CAPACITY',
          message: 'Agente atingiu capacidade máxima de tickets simultâneos'
        },
        { status: 409 }
      )
    }
    // Verificar se já está atribuído ao mesmo agente
    if (existingTicket.assignedAgentId === assignData.assignedAgentId) {
      return NextResponse.json(
        {
          error: 'ALREADY_ASSIGNED',
          message: 'Ticket já está atribuído a este agente'
        },
        { status: 409 }
      )
    }
    // Iniciar transação para atualizar ticket e contador do agente
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar ticket
      const updatedTicket = await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          assignedAgentId: assignData.assignedAgentId,
          assignedAt: new Date(),
          status: existingTicket.status === 'OPEN' ? 'IN_PROGRESS' : existingTicket.status,
          priority: assignData.priority || existingTicket.priority,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          escalation: {
            select: {
              id: true,
              reason: true,
              priority: true,
              status: true
            }
          }
        }
      })
      // Incrementar contador de tickets do agente
      await tx.agent.update({
        where: { id: assignData.assignedAgentId },
        data: {
          currentTicketCount: agent.currentTicketCount + 1,
          lastActive: new Date()
        }
      })
      // Criar registro de atribuição no histórico (se houver tabela de histórico)
      // TODO: Implementar quando houver tabela de histórico de tickets
      return { ticket: updatedTicket, agent }
    })
    // Disparar notificações
    await triggerAssignmentNotifications(result.ticket, agent, user, assignData.notes)
    // Enviar notificação ao cliente sobre atribuição
    const { sendSupportTicketAssignmentNotification } = await import('@/lib/admin-notifications')
    await sendSupportTicketAssignmentNotification(
      result.ticket.user.id,
      result.ticket.id,
      result.ticket.ticketNumber,
      agent.name
    )
    return createSuccessResponse(
      {
        ticket: result.ticket,
        assignment: {
          assignedTo: agent.name,
          assignedBy: user.email,
          assignedAt: new Date(),
          notes: assignData.notes,
          priority: result.ticket.priority,
          agentCapacity: {
            current: agent.currentTicketCount + 1,
            max: agent.maxConcurrentTickets,
            available: agent.maxConcurrentTickets - (agent.currentTicketCount + 1)
          }
        }
      },
      'Ticket atribuído com sucesso'
    )
  } catch (error) {
    console.error('Support ticket assign error:', error)
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
/**
 * DELETE /api/admin/support/tickets/[id]/assign
 * Remover atribuição do ticket
 *
 * Remove a atribuição de um ticket ao agente
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('support:assign')(request)
    if (error) {
      return error
    }
    const ticketId = params.id
    if (!ticketId) {
      return NextResponse.json(
        {
          error: 'INVALID_ID',
          message: 'ID do ticket é obrigatório'
        },
        { status: 400 }
      )
    }
    // Verificar se ticket existe
    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        status: true,
        assignedAgentId: true,
        escalationId: true
      }
    })
    if (!existingTicket) {
      return NextResponse.json(
        {
          error: 'TICKET_NOT_FOUND',
          message: 'Ticket não encontrado'
        },
        { status: 404 }
      )
    }
    if (!existingTicket.assignedAgentId) {
      return NextResponse.json(
        {
          error: 'NOT_ASSIGNED',
          message: 'Ticket não está atribuído a nenhum agente'
        },
        { status: 409 }
      )
    }
    // Buscar informações do agente atual
    const currentAgent = await prisma.agent.findUnique({
      where: { id: existingTicket.assignedAgentId },
      select: {
        id: true,
        name: true,
        currentTicketCount: true
      }
    })
    if (!currentAgent) {
      return NextResponse.json(
        {
          error: 'AGENT_NOT_FOUND',
          message: 'Agente atual não encontrado'
        },
        { status: 404 }
      )
    }
    // Verificar se ticket pode ser desatribuído
    if (existingTicket.status === 'CLOSED' || existingTicket.status === 'RESOLVED') {
      return NextResponse.json(
        {
          error: 'CANNOT_UNASSIGN_CLOSED',
          message: 'Tickets fechados ou resolvidos não podem ser desatribuídos'
        },
        { status: 409 }
      )
    }
    // Iniciar transação para atualizar ticket e contador do agente
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar ticket
      const updatedTicket = await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          assignedAgentId: null,
          assignedAt: null,
          status: existingTicket.status === 'IN_PROGRESS' ? 'OPEN' : existingTicket.status,
          updatedAt: new Date()
        },
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
      // Decrementar contador de tickets do agente
      await tx.agent.update({
        where: { id: existingTicket.assignedAgentId },
        data: {
          currentTicketCount: Math.max(0, currentAgent.currentTicketCount - 1)
        }
      })
      return { ticket: updatedTicket, previousAgent: currentAgent }
    })
    return createSuccessResponse(
      {
        ticket: result.ticket,
        unassignment: {
          unassignedFrom: result.previousAgent.name,
          unassignedBy: user.email,
          unassignedAt: new Date(),
          previousStatus: existingTicket.status,
          newStatus: result.ticket.status
        }
      },
      'Atribuição do ticket removida com sucesso'
    )
  } catch (error) {
    console.error('Support ticket unassign error:', error)
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
async function triggerAssignmentNotifications(
  ticket: any,
  agent: any,
  assignedBy: any,
  notes?: string
): Promise<void> {
  try {
    // Notificar agente sobre nova atribuição
    // Notificar cliente sobre a atribuição (se aplicável)
    // TODO: Implementar notificações reais:
    // - Email para o agente com detalhes do ticket
    // - Notificação no painel do agente
    // - Email/SMS para o cliente informando que o ticket está sendo tratado
    // - Atualizar status em sistemas externos se aplicável
  } catch (error) {
    console.error('Error triggering assignment notifications:', error)
    // Não falhar a atribuição se as notificações falharem
  }
}