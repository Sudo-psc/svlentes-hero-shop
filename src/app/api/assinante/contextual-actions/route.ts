import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'

/**
 * GET /api/assinante/contextual-actions
 *
 * Retorna ações recomendadas baseadas no contexto da assinatura:
 * - Ações primárias com prioridade
 * - Alertas contextuais
 * - Atalhos inteligentes
 */
export async function GET(request: NextRequest) {
  // Rate limiting: 200 requisições em 15 minutos (leitura)
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.read)
  if (rateLimitResult) {
    return rateLimitResult
  }

  try {
    // Verificar se Firebase Admin está inicializado
    if (!adminAuth) {
      console.warn('[API /api/assinante/contextual-actions] Firebase Admin não configurado')
      return NextResponse.json(
        {
          error: 'SERVICE_UNAVAILABLE',
          message: 'Serviço de autenticação temporariamente indisponível'
        },
        { status: 503 }
      )
    }

    // Verificar token Firebase
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token de autenticação não fornecido' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    let firebaseUser

    try {
      firebaseUser = await adminAuth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }

    if (!firebaseUser || !firebaseUser.uid) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Buscar usuário com dados completos para análise contextual
    const user = await prisma.user.findUnique({
      where: { firebaseUid: firebaseUser.uid },
      include: {
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'PAUSED', 'OVERDUE'] } },
          include: {
            orders: {
              orderBy: { createdAt: 'desc' },
              take: 1
            },
            payments: {
              where: {
                status: { in: ['PENDING', 'OVERDUE'] }
              },
              orderBy: { dueDate: 'asc' },
              take: 1
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        notifications: {
          where: {
            status: { in: ['SENT', 'DELIVERED'] },
            // Não lidas nos últimos 7 dias
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    if (user.subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }

    const subscription = user.subscriptions[0]
    const now = new Date()

    // Análise contextual para gerar ações e alertas
    const primaryActions: Array<{
      id: string
      label: string
      description: string
      icon: string
      url: string
      variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
      priority: number
    }> = []

    const alerts: Array<{
      type: 'info' | 'warning' | 'error'
      message: string
      action?: { label: string; url: string }
    }> = []

    // 1. PAGAMENTO PENDENTE OU OVERDUE - Prioridade máxima
    if (subscription.payments.length > 0) {
      const pendingPayment = subscription.payments[0]
      const isOverdue = new Date(pendingPayment.dueDate) < now

      if (isOverdue) {
        alerts.push({
          type: 'error',
          message: `Pagamento em atraso desde ${new Date(pendingPayment.dueDate).toLocaleDateString('pt-BR')}. Regularize para manter sua assinatura ativa.`,
          action: {
            label: 'Pagar Agora',
            url: `/area-assinante/pagamentos/${pendingPayment.id}`
          }
        })

        primaryActions.push({
          id: 'pay_overdue',
          label: 'Regularizar Pagamento',
          description: 'Pague agora para evitar suspensão da assinatura',
          icon: 'AlertCircle',
          url: `/area-assinante/pagamentos/${pendingPayment.id}`,
          variant: 'danger',
          priority: 1
        })
      } else {
        alerts.push({
          type: 'warning',
          message: `Pagamento pendente com vencimento em ${new Date(pendingPayment.dueDate).toLocaleDateString('pt-BR')}.`,
          action: {
            label: 'Ver Detalhes',
            url: `/area-assinante/pagamentos/${pendingPayment.id}`
          }
        })
      }
    }

    // 2. ASSINATURA PAUSADA
    if (subscription.status === 'PAUSED') {
      alerts.push({
        type: 'warning',
        message: 'Sua assinatura está pausada. Reative para continuar recebendo suas lentes.',
        action: {
          label: 'Reativar',
          url: '/area-assinante/configuracoes/assinatura'
        }
      })

      primaryActions.push({
        id: 'reactivate_subscription',
        label: 'Reativar Assinatura',
        description: 'Volte a receber suas lentes mensalmente',
        icon: 'PlayCircle',
        url: '/area-assinante/configuracoes/assinatura',
        variant: 'success',
        priority: 1
      })
    }

    // 3. PRÓXIMO DE RENOVAÇÃO (< 7 dias)
    if (subscription.nextBillingDate) {
      const daysUntilRenewal = Math.ceil(
        (new Date(subscription.nextBillingDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysUntilRenewal > 0 && daysUntilRenewal <= 7 && subscription.status === 'ACTIVE') {
        alerts.push({
          type: 'info',
          message: `Sua assinatura renova em ${daysUntilRenewal} ${daysUntilRenewal === 1 ? 'dia' : 'dias'}.`,
          action: {
            label: 'Ver Detalhes',
            url: '/area-assinante/assinatura'
          }
        })

        primaryActions.push({
          id: 'view_renewal',
          label: 'Renovar Agora',
          description: 'Antecipe sua renovação e receba antes',
          icon: 'RefreshCw',
          url: '/area-assinante/assinatura',
          variant: 'primary',
          priority: 2
        })
      }
    }

    // 4. PRESCRIÇÃO ANTIGA (> 1 ano desde startDate)
    const prescriptionAge = Math.ceil(
      (now.getTime() - new Date(subscription.startDate).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (prescriptionAge > 365) {
      alerts.push({
        type: 'warning',
        message: 'Sua prescrição tem mais de 1 ano. Recomendamos agendar uma reavaliação oftalmológica.',
        action: {
          label: 'Agendar',
          url: '/agendar-consulta'
        }
      })

      primaryActions.push({
        id: 'schedule_consultation',
        label: 'Agendar Reavaliação',
        description: 'Mantenha sua prescrição atualizada para melhor saúde visual',
        icon: 'Calendar',
        url: '/agendar-consulta',
        variant: 'warning',
        priority: 2
      })
    }

    // 5. NOTIFICAÇÕES NÃO LIDAS (> 3 notificações)
    if (user.notifications.length > 3) {
      primaryActions.push({
        id: 'view_notifications',
        label: 'Ver Avisos Importantes',
        description: `Você tem ${user.notifications.length} notificações não visualizadas`,
        icon: 'Bell',
        url: '/area-assinante/notificacoes',
        variant: 'secondary',
        priority: 3
      })
    }

    // 6. AÇÕES SEMPRE DISPONÍVEIS
    primaryActions.push({
      id: 'whatsapp_support',
      label: 'Falar no WhatsApp',
      description: 'Suporte rápido via WhatsApp',
      icon: 'MessageCircle',
      url: `/api/whatsapp-redirect?context=support&subscriptionId=${subscription.id}`,
      variant: 'secondary',
      priority: 5
    })

    primaryActions.push({
      id: 'view_history',
      label: 'Ver Histórico',
      description: 'Histórico completo de entregas e pagamentos',
      icon: 'History',
      url: '/area-assinante/historico',
      variant: 'secondary',
      priority: 6
    })

    // Ordenar ações por prioridade
    primaryActions.sort((a, b) => a.priority - b.priority)

    return NextResponse.json({
      primaryActions: primaryActions.slice(0, 6), // Máximo 6 ações
      alerts,
      metadata: {
        subscriptionStatus: subscription.status,
        hasOverduePayment: subscription.payments.length > 0 && new Date(subscription.payments[0].dueDate) < now,
        isPaused: subscription.status === 'PAUSED',
        daysUntilRenewal: subscription.nextBillingDate
          ? Math.max(0, Math.ceil(
              (new Date(subscription.nextBillingDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            ))
          : null,
        prescriptionAgeInDays: prescriptionAge,
        unreadNotifications: user.notifications.length
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('[API /api/assinante/contextual-actions] Erro:', error.message)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'
