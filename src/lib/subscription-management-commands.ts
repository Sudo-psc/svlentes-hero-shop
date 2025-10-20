/**
 * Subscription Management Commands
 * Comandos para gerenciamento de assinaturas autenticadas via chatbot
 */
import { prisma } from '@/lib/prisma'
import { chatbotAuthService } from '@/lib/chatbot-auth-service'
import { logger, LogCategory } from '@/lib/logger'
export interface SubscriptionCommandResult {
  success: boolean
  message: string
  requiresResponse: boolean
  data?: any
  error?: string
}
/**
 * Verifica se o usuário tem uma sessão ativa e retorna os dados da sessão
 */
export async function validateAuthenticatedSession(phone: string): Promise<{
  valid: boolean
  session?: any
  user?: any
  subscriptions?: any[]
}> {
  try {
    // Buscar sessão ativa pelo telefone
    const session = await prisma.chatbotSession.findFirst({
      where: {
        phone,
        status: 'ACTIVE',
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          include: {
            subscriptions: {
              where: {
                status: {
                  in: ['ACTIVE', 'PAUSED', 'OVERDUE', 'SUSPENDED']
                }
              },
              include: {
                plan: true,
                orders: {
                  orderBy: { createdAt: 'desc' },
                  take: 1
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    if (!session) {
      return { valid: false }
    }
    // Atualizar última atividade
    await prisma.chatbotSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() }
    })
    return {
      valid: true,
      session,
      user: session.user,
      subscriptions: session.user.subscriptions
    }
  } catch (error) {
    logger.error(LogCategory.WHATSAPP, 'Erro ao validar sessão autenticada', {
      phone,
      error: error instanceof Error ? error.message : 'Unknown'
    })
    return { valid: false }
  }
}
/**
 * Comando: Ver detalhes da assinatura
 */
export async function viewSubscriptionCommand(phone: string): Promise<SubscriptionCommandResult> {
  try {
    const authCheck = await validateAuthenticatedSession(phone)
    if (!authCheck.valid) {
      return {
        success: false,
        message: '❌ Você precisa estar autenticado para visualizar sua assinatura.\n\nEnvie "fazer login" para acessar sua conta.',
        requiresResponse: true,
        error: 'not_authenticated'
      }
    }
    if (!authCheck.subscriptions || authCheck.subscriptions.length === 0) {
      return {
        success: false,
        message: '❌ Você não possui assinaturas ativas no momento.\n\nPara criar uma assinatura, acesse:\n👉 https://svlentes.shop',
        requiresResponse: true,
        error: 'no_subscriptions'
      }
    }
    // Exibir informações da primeira assinatura ativa
    const subscription = authCheck.subscriptions[0]
    const plan = subscription.plan
    const nextOrder = subscription.orders?.[0]
    let message = `📋 **Detalhes da sua Assinatura**\n\n`
    message += `🎯 **Plano:** ${plan.name}\n`
    message += `💰 **Valor:** R$ ${subscription.amount.toFixed(2)}/mês\n`
    message += `📅 **Status:** ${getStatusLabel(subscription.status)}\n`
    message += `🔄 **Ciclo:** A cada ${subscription.billingInterval} dias\n`
    if (subscription.status === 'PAUSED') {
      message += `⏸️ **Pausada até:** ${subscription.pauseUntil ? new Date(subscription.pauseUntil).toLocaleDateString('pt-BR') : 'Indefinidamente'}\n`
    }
    if (nextOrder) {
      message += `\n📦 **Próxima Entrega:**\n`
      message += `📍 ${nextOrder.shippingAddress}\n`
      message += `📅 Previsão: ${nextOrder.estimatedDelivery ? new Date(nextOrder.estimatedDelivery).toLocaleDateString('pt-BR') : 'A definir'}\n`
    }
    message += `\n💡 **Ações disponíveis:**\n`
    message += `• "pausar assinatura" - Pausar temporariamente\n`
    message += `• "reativar assinatura" - Reativar assinatura pausada\n`
    message += `• "próxima entrega" - Detalhes da próxima entrega\n`
    message += `• "alterar endereço" - Atualizar endereço de entrega\n`
    message += `• "sair" - Encerrar sessão`
    return {
      success: true,
      message,
      requiresResponse: true,
      data: { subscription, plan, nextOrder }
    }
  } catch (error) {
    logger.error(LogCategory.WHATSAPP, 'Erro ao exibir detalhes da assinatura', {
      phone,
      error: error instanceof Error ? error.message : 'Unknown'
    })
    return {
      success: false,
      message: '❌ Erro ao carregar detalhes da assinatura. Por favor, tente novamente.',
      requiresResponse: true,
      error: error instanceof Error ? error.message : 'unknown_error'
    }
  }
}
/**
 * Comando: Pausar assinatura
 */
export async function pauseSubscriptionCommand(
  phone: string,
  days: number = 30
): Promise<SubscriptionCommandResult> {
  try {
    const authCheck = await validateAuthenticatedSession(phone)
    if (!authCheck.valid) {
      return {
        success: false,
        message: '❌ Você precisa estar autenticado.\n\nEnvie "fazer login" para acessar sua conta.',
        requiresResponse: true,
        error: 'not_authenticated'
      }
    }
    if (!authCheck.subscriptions || authCheck.subscriptions.length === 0) {
      return {
        success: false,
        message: '❌ Você não possui assinaturas ativas para pausar.',
        requiresResponse: true,
        error: 'no_subscriptions'
      }
    }
    const subscription = authCheck.subscriptions[0]
    if (subscription.status === 'PAUSED') {
      return {
        success: false,
        message: '⏸️ Sua assinatura já está pausada.\n\nPara reativar, envie "reativar assinatura".',
        requiresResponse: true,
        error: 'already_paused'
      }
    }
    // Calcular data de retorno
    const pauseUntil = new Date()
    pauseUntil.setDate(pauseUntil.getDate() + days)
    // Atualizar status da assinatura
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'PAUSED',
        pauseUntil,
        pausedAt: new Date()
      }
    })
    logger.info(LogCategory.WHATSAPP, 'Assinatura pausada via chatbot', {
      phone,
      subscriptionId: subscription.id,
      pauseDays: days
    })
    const message = `✅ **Assinatura pausada com sucesso!**\n\n⏸️ Sua assinatura foi pausada por ${days} dias.\n📅 Retorno previsto: ${pauseUntil.toLocaleDateString('pt-BR')}\n\n💡 Para reativar antes, envie "reativar assinatura".`
    return {
      success: true,
      message,
      requiresResponse: true,
      data: { subscription, pauseUntil }
    }
  } catch (error) {
    logger.error(LogCategory.WHATSAPP, 'Erro ao pausar assinatura', {
      phone,
      error: error instanceof Error ? error.message : 'Unknown'
    })
    return {
      success: false,
      message: '❌ Erro ao pausar assinatura. Por favor, tente novamente ou entre em contato conosco.',
      requiresResponse: true,
      error: error instanceof Error ? error.message : 'unknown_error'
    }
  }
}
/**
 * Comando: Reativar assinatura
 */
export async function reactivateSubscriptionCommand(phone: string): Promise<SubscriptionCommandResult> {
  try {
    const authCheck = await validateAuthenticatedSession(phone)
    if (!authCheck.valid) {
      return {
        success: false,
        message: '❌ Você precisa estar autenticado.\n\nEnvie "fazer login" para acessar sua conta.',
        requiresResponse: true,
        error: 'not_authenticated'
      }
    }
    if (!authCheck.subscriptions || authCheck.subscriptions.length === 0) {
      return {
        success: false,
        message: '❌ Você não possui assinaturas para reativar.',
        requiresResponse: true,
        error: 'no_subscriptions'
      }
    }
    const subscription = authCheck.subscriptions[0]
    if (subscription.status !== 'PAUSED') {
      return {
        success: false,
        message: '✅ Sua assinatura já está ativa!\n\nEnvie "minha assinatura" para ver os detalhes.',
        requiresResponse: true,
        error: 'already_active'
      }
    }
    // Reativar assinatura
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        pauseUntil: null,
        pausedAt: null
      }
    })
    logger.info(LogCategory.WHATSAPP, 'Assinatura reativada via chatbot', {
      phone,
      subscriptionId: subscription.id
    })
    const message = `✅ **Assinatura reativada com sucesso!**\n\n🎉 Sua assinatura voltou a funcionar normalmente.\n📦 Seu próximo pedido será processado conforme o ciclo de entrega.\n\nEnvie "minha assinatura" para ver os detalhes.`
    return {
      success: true,
      message,
      requiresResponse: true,
      data: { subscription }
    }
  } catch (error) {
    logger.error(LogCategory.WHATSAPP, 'Erro ao reativar assinatura', {
      phone,
      error: error instanceof Error ? error.message : 'Unknown'
    })
    return {
      success: false,
      message: '❌ Erro ao reativar assinatura. Por favor, tente novamente ou entre em contato conosco.',
      requiresResponse: true,
      error: error instanceof Error ? error.message : 'unknown_error'
    }
  }
}
/**
 * Comando: Ver próxima entrega
 */
export async function nextDeliveryCommand(phone: string): Promise<SubscriptionCommandResult> {
  try {
    const authCheck = await validateAuthenticatedSession(phone)
    if (!authCheck.valid) {
      return {
        success: false,
        message: '❌ Você precisa estar autenticado.\n\nEnvie "fazer login" para acessar sua conta.',
        requiresResponse: true,
        error: 'not_authenticated'
      }
    }
    if (!authCheck.subscriptions || authCheck.subscriptions.length === 0) {
      return {
        success: false,
        message: '❌ Você não possui assinaturas ativas.',
        requiresResponse: true,
        error: 'no_subscriptions'
      }
    }
    const subscription = authCheck.subscriptions[0]
    const nextOrder = subscription.orders?.[0]
    if (!nextOrder) {
      return {
        success: true,
        message: `📦 **Próxima Entrega**\n\n📅 Seu próximo pedido será processado em breve.\n🔄 Ciclo de entrega: A cada ${subscription.billingInterval} dias.\n\nVocê receberá uma notificação quando o pedido for enviado!`,
        requiresResponse: true
      }
    }
    let message = `📦 **Detalhes da Próxima Entrega**\n\n`
    message += `📋 Pedido: #${nextOrder.orderNumber || nextOrder.id.substring(0, 8)}\n`
    message += `📍 **Endereço:**\n${nextOrder.shippingAddress}\n\n`
    if (nextOrder.estimatedDelivery) {
      message += `📅 **Previsão de entrega:** ${new Date(nextOrder.estimatedDelivery).toLocaleDateString('pt-BR')}\n`
    }
    if (nextOrder.trackingCode) {
      message += `📦 **Código de rastreamento:** ${nextOrder.trackingCode}\n`
    }
    message += `\n💡 Para alterar o endereço de entrega, envie "alterar endereço".`
    return {
      success: true,
      message,
      requiresResponse: true,
      data: { nextOrder }
    }
  } catch (error) {
    logger.error(LogCategory.WHATSAPP, 'Erro ao consultar próxima entrega', {
      phone,
      error: error instanceof Error ? error.message : 'Unknown'
    })
    return {
      success: false,
      message: '❌ Erro ao consultar próxima entrega. Por favor, tente novamente.',
      requiresResponse: true,
      error: error instanceof Error ? error.message : 'unknown_error'
    }
  }
}
/**
 * Helper: Retorna label amigável para status da assinatura
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'ACTIVE': '✅ Ativa',
    'PAUSED': '⏸️ Pausada',
    'CANCELLED': '❌ Cancelada',
    'PENDING': '⏳ Pendente',
    'OVERDUE': '⚠️ Em atraso',
    'SUSPENDED': '🚫 Suspensa',
    'EXPIRED': '🔒 Expirada',
    'TRIAL': '🆓 Período de teste'
  }
  return labels[status] || status
}