/**
 * GET /api/admin/dashboard/recent-activity
 * Atividades recentes do sistema
 *
 * Retorna timeline de atividades recentes para o dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createSuccessResponse } from '@/lib/admin-auth'

/**
 * @swagger
 * /api/admin/dashboard/recent-activity:
 *   get:
 *     summary: Obter atividades recentes
 *     description: Retorna timeline das atividades mais recentes do sistema
 *     tags:
 *       - Dashboard Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Número máximo de atividades a retornar
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, customer, subscription, order, payment, support]
 *           default: all
 *         description: Tipo de atividades para filtrar
 *     responses:
 *       200:
 *         description: Atividades obtidas com sucesso
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
 *                     activities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: act_123
 *                           type:
 *                             type: string
 *                             enum: [customer, subscription, order, payment, support]
 *                             example: subscription
 *                           action:
 *                             type: string
 *                             example: created
 *                           description:
 *                             type: string
 *                             example: Nova assinatura criada
 *                           entityId:
 *                             type: string
 *                             example: sub_456
 *                           entityName:
 *                             type: string
 *                             example: João Silva
 *                           userId:
 *                             type: string
 *                             example: user_789
 *                           metadata:
 *                             type: object
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: 2024-01-15T10:30:00Z
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 20
 *                         byType:
 *                           type: object
 *                           additionalProperties:
 *                             type: integer
 *                           example:
 *                             customer: 5
 *                             subscription: 8
 *                             order: 4
 *                             payment: 2
 *                             support: 1
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar permissão
    const { user, error } = await requirePermission('dashboard:view')(request)

    if (error) {
      return error
    }

    // Extrair parâmetros
    const { searchParams } = new URL(request.url)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const type = searchParams.get('type') || 'all'

    // Buscar atividades recentes em paralelo
    const [
      recentCustomers,
      recentSubscriptions,
      recentOrders,
      recentPayments,
      recentTickets
    ] = await Promise.all([
      // Clientes recentes
      type === 'all' || type === 'customer'
        ? prisma.user.findMany({
            where: {
              role: 'subscriber'
            },
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: Math.ceil(limit / 5)
          })
        : [],

      // Assinaturas recentes
      type === 'all' || type === 'subscription'
        ? prisma.subscription.findMany({
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: Math.ceil(limit / 5)
          })
        : [],

      // Pedidos recentes
      type === 'all' || type === 'order'
        ? prisma.order.findMany({
            include: {
              subscription: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: Math.ceil(limit / 5)
          })
        : [],

      // Pagamentos recentes
      type === 'all' || type === 'payment'
        ? prisma.payment.findMany({
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              subscription: {
                select: {
                  id: true,
                  planType: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: Math.ceil(limit / 5)
          })
        : [],

      // Tickets de suporte recentes
      type === 'all' || type === 'support'
        ? prisma.supportTicket.findMany({
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: Math.ceil(limit / 5)
          })
        : []
    ])

    // Processar e formatar atividades
    const activities = []

    // Processar clientes
    recentCustomers.forEach(customer => {
      activities.push({
        id: `customer_${customer.id}`,
        type: 'customer',
        action: 'created',
        description: `Novo cliente cadastrado`,
        entityId: customer.id,
        entityName: customer.name || customer.email,
        userId: customer.id,
        metadata: {
          email: customer.email
        },
        createdAt: customer.createdAt
      })
    })

    // Processar assinaturas
    recentSubscriptions.forEach(subscription => {
      const action = subscription.status === 'ACTIVE' ? 'created' :
                    subscription.status === 'CANCELLED' ? 'cancelled' : 'updated'

      activities.push({
        id: `subscription_${subscription.id}`,
        type: 'subscription',
        action,
        description: `Assinatura ${action === 'created' ? 'criada' :
                        action === 'cancelled' ? 'cancelada' : 'atualizada'}`,
        entityId: subscription.id,
        entityName: subscription.user?.name || subscription.user?.email || 'Unknown',
        userId: subscription.userId,
        metadata: {
          planType: subscription.planType,
          status: subscription.status,
          monthlyValue: subscription.monthlyValue
        },
        createdAt: subscription.createdAt
      })
    })

    // Processar pedidos
    recentOrders.forEach(order => {
      const action = order.deliveryStatus === 'PENDING' ? 'created' :
                    order.deliveryStatus === 'DELIVERED' ? 'delivered' : 'updated'

      activities.push({
        id: `order_${order.id}`,
        type: 'order',
        action,
        description: `Pedido ${action === 'created' ? 'criado' :
                        action === 'delivered' ? 'entregue' : 'atualizado'}`,
        entityId: order.id,
        entityName: `Pedido #${order.id.slice(-8)}`,
        userId: order.subscription?.user?.id,
        metadata: {
          deliveryStatus: order.deliveryStatus,
          totalAmount: order.totalAmount,
          trackingCode: order.trackingCode
        },
        createdAt: order.createdAt
      })
    })

    // Processar pagamentos
    recentPayments.forEach(payment => {
      const action = payment.status === 'RECEIVED' ? 'received' :
                    payment.status === 'CONFIRMED' ? 'confirmed' :
                    payment.status === 'PENDING' ? 'created' : 'updated'

      activities.push({
        id: `payment_${payment.id}`,
        type: 'payment',
        action,
        description: `Pagamento ${action === 'received' ? 'recebido' :
                        action === 'confirmed' ? 'confirmado' :
                        action === 'created' ? 'criado' : 'atualizado'}`,
        entityId: payment.id,
        entityName: payment.user?.name || payment.user?.email || 'Unknown',
        userId: payment.userId,
        metadata: {
          amount: payment.amount,
          status: payment.status,
          billingType: payment.billingType,
          planType: payment.subscription?.planType
        },
        createdAt: payment.createdAt
      })
    })

    // Processar tickets de suporte
    recentTickets.forEach(ticket => {
      const action = ticket.status === 'OPEN' ? 'created' :
                    ticket.status === 'RESOLVED' ? 'resolved' :
                    ticket.status === 'IN_PROGRESS' ? 'updated' : 'created'

      activities.push({
        id: `ticket_${ticket.id}`,
        type: 'support',
        action,
        description: `Ticket ${action === 'created' ? 'criado' :
                        action === 'resolved' ? 'resolvido' : 'atualizado'}`,
        entityId: ticket.id,
        entityName: `#${ticket.ticketNumber}`,
        userId: ticket.userId,
        metadata: {
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status,
          subject: ticket.subject
        },
        createdAt: ticket.createdAt
      })
    })

    // Ordenar por data e limitar resultados
    const sortedActivities = activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)

    // Calcular resumo
    const summary = {
      total: sortedActivities.length,
      byType: {
        customer: sortedActivities.filter(a => a.type === 'customer').length,
        subscription: sortedActivities.filter(a => a.type === 'subscription').length,
        order: sortedActivities.filter(a => a.type === 'order').length,
        payment: sortedActivities.filter(a => a.type === 'payment').length,
        support: sortedActivities.filter(a => a.type === 'support').length
      }
    }

    return createSuccessResponse({
      activities: sortedActivities,
      summary,
      filters: {
        limit,
        type
      }
    }, 'Atividades recentes obtidas com sucesso')

  } catch (error) {
    console.error('Recent activity error:', error)
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