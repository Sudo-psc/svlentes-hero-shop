/**
 * GET /api/admin/support/tickets/[id]
 * Obter detalhes de um ticket de suporte específico
 *
 * Retorna informações completas de um ticket incluindo histórico e interações
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createSuccessResponse } from '@/lib/admin-auth'
import { supportTicketUpdateSchema } from '@/lib/admin-validations'
import { trackTicketUpdate, trackTicketStatusChange, getIpAddress, getUserAgent } from '@/lib/ticket-history'
/**
 * @swagger
 * /api/admin/support/tickets/{id}:
 *   get:
 *     summary: Obter detalhes do ticket
 *     description: Retorna informações completas de um ticket específico
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
 *     responses:
 *       200:
 *         description: Detalhes do ticket obtidos com sucesso
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
 *                       $ref: '#/components/schemas/SupportTicketDetail'
 *                     interactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SupportInteraction'
 *                     timeline:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date-time
 *                           action:
 *                             type: string
 *                           description:
 *                             type: string
 *                           author:
 *                             type: string
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       404:
 *         description: Ticket não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('support:view')(request)
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
    // Buscar ticket com dados relacionados
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            whatsapp: true
          }
        },
        escalation: {
          select: {
            id: true,
            reason: true,
            priority: true,
            requestedBy: true,
            requestedAt: true,
            assignedAgentId: true,
            assignedAt: true,
            status: true,
            actualResolution: true,
            resolvedAt: true,
            notes: true
          }
        }
      }
    })
    if (!ticket) {
      return NextResponse.json(
        {
          error: 'TICKET_NOT_FOUND',
          message: 'Ticket não encontrado'
        },
        { status: 404 }
      )
    }
    // Buscar interações associadas
    const interactions = await prisma.whatsappInteraction.findMany({
      where: { ticketId },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        messageId: true,
        customerPhone: true,
        content: true,
        isFromCustomer: true,
        intent: true,
        sentiment: true,
        urgency: true,
        response: true,
        escalationRequired: true,
        ticketCreated: true,
        createdAt: true,
        llmModel: true,
        processingTime: true
      }
    })
    // Calcular métricas adicionais
    const resolutionTime = ticket.resolvedAt
      ? Math.ceil(
          (new Date(ticket.resolvedAt).getTime() - new Date(ticket.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
        )
      : null
    const daysSinceCreation = Math.ceil(
      (new Date().getTime() - new Date(ticket.createdAt).getTime()) /
      (1000 * 60 * 60 * 24)
    )
    const averageResponseTime = interactions.length > 0
      ? interactions.reduce((sum, interaction) => sum + (interaction.processingTime || 0), 0) / interactions.length
      : 0
    // Status detalhado
    const statusInfo = {
      current: ticket.status,
      isOpen: ['OPEN', 'IN_PROGRESS', 'PENDING_CUSTOMER', 'PENDING_AGENT'].includes(ticket.status),
      isResolved: ticket.status === 'RESOLVED',
      isClosed: ticket.status === 'CLOSED',
      isEscalated: ticket.status === 'ESCALATED',
      needsAttention: ['OPEN', 'ESCALATED'].includes(ticket.status),
      isOverdue: !ticket.resolvedAt && daysSinceCreation > getSLADays(ticket.priority)
    }
    // Criar timeline do ticket
    const timeline = createTicketTimeline(ticket, interactions)
    // Montar resposta completa
    const ticketDetail = {
      ticket: {
        ...ticket,
        status: statusInfo,
        metrics: {
          resolutionTime,
          daysSinceCreation,
          averageResponseTime,
          interactionCount: interactions.length,
          customerInteractions: interactions.filter(i => i.isFromCustomer).length,
          agentInteractions: interactions.filter(i => !i.isFromCustomer).length,
          hasEscalation: !!ticket.escalation
        }
      },
      interactions: interactions.map(interaction => ({
        id: interaction.id,
        messageId: interaction.messageId,
        content: interaction.content,
        isFromCustomer: interaction.isFromCustomer,
        intent: interaction.intent,
        sentiment: interaction.sentiment,
        urgency: interaction.urgency,
        response: interaction.response,
        escalationRequired: interaction.escalationRequired,
        ticketCreated: interaction.ticketCreated,
        createdAt: interaction.createdAt,
        processingTime: interaction.processingTime,
        llmModel: interaction.llmModel
      })),
      timeline,
      sla: {
        daysSinceCreation,
        slaDays: getSLADays(ticket.priority),
        isOverdue: statusInfo.isOverdue,
        remainingDays: Math.max(0, getSLADays(ticket.priority) - daysSinceCreation),
        priority: ticket.priority
      }
    }
    return createSuccessResponse(ticketDetail, 'Detalhes do ticket obtidos com sucesso')
  } catch (error) {
    console.error('Support ticket detail error:', error)
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
 * PUT /api/admin/support/tickets/[id]
 * Atualizar ticket de suporte
 *
 * Atualiza informações do ticket
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('support:update')(request)
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
    const { data: updateData, error: validationError } = validateBody(supportTicketUpdateSchema, body)
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
        priority: true,
        category: true
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
    // Preparar dados de atualização
    const updateDataWithTimestamps = {
      ...updateData,
      updatedAt: new Date()
    }
    // Adicionar campos específicos baseado no status
    if (updateData.status) {
      switch (updateData.status) {
        case 'RESOLVED':
          updateDataWithTimestamps.resolvedAt = new Date()
          break
        case 'CLOSED':
          updateDataWithTimestamps.resolvedAt = updateDataWithTimestamps.resolvedAt || new Date()
          break
      }
    }
    // Atualizar ticket
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateDataWithTimestamps,
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

    // Rastrear alterações no histórico
    await trackTicketUpdate({
      ticketId: updatedTicket.id,
      ticketNumber: updatedTicket.ticketNumber,
      userId: user.id,
      oldValues: {
        status: existingTicket.status,
        priority: existingTicket.priority,
        category: existingTicket.category,
      },
      newValues: {
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        category: updatedTicket.category,
      },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    })

    return createSuccessResponse(updatedTicket, 'Ticket atualizado com sucesso')
  } catch (error) {
    console.error('Support ticket update error:', error)
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
 * DELETE /api/admin/support/tickets/[id]
 * Excluir ticket de suporte
 *
 * Exclui um ticket e suas interações associadas
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('support:delete')(request)
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
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        status: true,
        escalationId: true
      }
    })
    if (!ticket) {
      return NextResponse.json(
        {
          error: 'TICKET_NOT_FOUND',
          message: 'Ticket não encontrado'
        },
        { status: 404 }
      )
    }
    // Verificar se ticket pode ser excluído
    if (ticket.escalationId) {
      return NextResponse.json(
        {
          error: 'CANNOT_DELETE_ESCALATED',
          message: 'Tickets escalados não podem ser excluídos'
        },
        { status: 409 }
      )
    }
    if (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') {
      return NextResponse.json(
        {
          error: 'CANNOT_DELETE_OPEN',
          message: 'Tickets em andamento não podem ser excluídos'
        },
        { status: 409 }
      )
    }
    // Excluir interações associadas primeiro
    await prisma.whatsappInteraction.deleteMany({
      where: { ticketId }
    })
    // Excluir ticket
    const deletedTicket = await prisma.supportTicket.delete({
      where: { id: ticketId },
      select: {
        id: true,
        ticketNumber: true,
        deletedAt: new Date()
      }
    })
    return createSuccessResponse(deletedTicket, 'Ticket excluído com sucesso')
  } catch (error) {
    console.error('Support ticket delete error:', error)
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
function createTicketTimeline(ticket: any, interactions: any[]): any[] {
  const timeline = []
  // Data de criação
  timeline.push({
    date: ticket.createdAt,
    action: 'ticket_created',
    description: `Ticket ${ticket.ticketNumber} criado`,
    author: 'System',
    type: 'info'
  })
  // Atribuição
  if (ticket.assignedAt) {
    timeline.push({
      date: ticket.assignedAt,
      action: 'ticket_assigned',
      description: 'Ticket atribuído a um agente',
      author: 'System',
      type: 'success'
    })
  }
  // Interações
  interactions.forEach(interaction => {
    timeline.push({
      date: interaction.createdAt,
      action: interaction.isFromCustomer ? 'customer_message' : 'agent_message',
      description: interaction.isFromCustomer ? 'Mensagem do cliente' : 'Resposta do agente',
      author: interaction.isFromCustomer ? 'Cliente' : 'Agente',
      type: interaction.isFromCustomer ? 'info' : 'success',
      messageId: interaction.messageId
    })
  })
  // Resolução
  if (ticket.resolvedAt) {
    timeline.push({
      date: ticket.resolvedAt,
      action: 'ticket_resolved',
      description: 'Ticket resolvido',
      author: 'System',
      type: 'success'
    })
  }
  // Última atualização
  if (ticket.updatedAt && ticket.updatedAt !== ticket.createdAt) {
    timeline.push({
      date: ticket.updatedAt,
      action: 'ticket_updated',
      description: 'Ticket atualizado',
      author: 'System',
      type: 'info'
    })
  }
  return timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
function getSLADays(priority: string): number {
  const slaDays: Record<string, number> = {
    'LOW': 7,
    'MEDIUM': 3,
    'HIGH': 1,
    'URGENT': 0.5, // 12 horas
    'CRITICAL': 0.25 // 6 horas
  }
  return slaDays[priority] || 3
}