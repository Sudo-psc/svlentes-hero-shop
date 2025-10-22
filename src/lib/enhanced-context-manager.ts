/**
 * Enhanced Context Manager
 *
 * Gerencia contexto enriquecido para conversas do WhatsApp
 * Features:
 * - Integração com Conversation Memory Manager
 * - Enriquecimento de contexto com dados do usuário
 * - Tracking de estado e comportamento
 * - Gerenciamento de sessões ativas
 * - Detecção de padrões e anomalias
 */

import { prisma } from '@/lib/prisma'
import { conversationMemory, type ConversationContext, type MemoryMessage } from './conversation-memory-manager'
import { logger, LogCategory } from '@/lib/logger'

/**
 * Contexto enriquecido com dados do usuário e assinatura
 */
export interface EnrichedContext {
  // Contexto de conversa
  conversation: ConversationContext

  // Dados do usuário
  user?: {
    id: string
    name: string
    email: string
    phone: string
    whatsapp?: string
    createdAt: Date
    lastLoginAt?: Date
  }

  // Dados da assinatura
  subscription?: {
    id: string
    planType: string
    status: string
    monthlyValue: number
    renewalDate: Date
    startDate: Date
    nextBillingDate?: Date
    daysUntilRenewal: number
    isOverdue: boolean
  }

  // Histórico de suporte
  supportHistory: {
    totalTickets: number
    openTickets: number
    resolvedTickets: number
    averageResolutionTime?: number
    lastTicketDate?: Date
    recentTicketCategories: string[]
  }

  // Comportamento do usuário
  behavior: {
    totalInteractions: number
    averageResponseTime?: number
    preferredChannel: 'whatsapp' | 'email' | 'phone'
    lastInteractionDate: Date
    engagementScore: number // 0-100
    satisfactionScore?: number // 0-10
    isFrequentUser: boolean
    isHighValue: boolean
    riskLevel: 'low' | 'medium' | 'high'
  }

  // Estado da sessão atual
  session?: {
    sessionId: string
    startedAt: Date
    expiresAt: Date
    commandsExecuted: number
    isAuthenticated: boolean
  }

  // Flags contextuais
  flags: {
    isFirstTimeUser: boolean
    hasActiveSubscription: boolean
    hasOverduePayment: boolean
    hasRecentComplaint: boolean
    needsAttention: boolean
    isVIP: boolean
  }

  // Metadados adicionais
  metadata: {
    deviceInfo?: any
    location?: string
    timezone?: string
    language: string
  }
}

/**
 * Opções para enriquecimento de contexto
 */
export interface ContextEnrichmentOptions {
  includeSubscription: boolean
  includeSupportHistory: boolean
  includeBehaviorAnalysis: boolean
  includeSessionData: boolean
  depth: 'basic' | 'standard' | 'deep'
}

const DEFAULT_ENRICHMENT_OPTIONS: ContextEnrichmentOptions = {
  includeSubscription: true,
  includeSupportHistory: true,
  includeBehaviorAnalysis: true,
  includeSessionData: true,
  depth: 'standard'
}

/**
 * Enhanced Context Manager Class
 */
export class EnhancedContextManager {
  /**
   * Obtém contexto enriquecido completo
   */
  async getEnrichedContext(
    phone: string,
    userId?: string,
    options: Partial<ContextEnrichmentOptions> = {}
  ): Promise<EnrichedContext> {
    const opts = { ...DEFAULT_ENRICHMENT_OPTIONS, ...options }

    try {
      // 1. Obter contexto de conversa da memória
      const conversation = await conversationMemory.getContext(phone, userId)

      // 2. Buscar dados do usuário
      const user = await this.getUserData(phone, userId)

      // 3. Buscar dados da assinatura
      const subscription = opts.includeSubscription && user
        ? await this.getSubscriptionData(user.id)
        : undefined

      // 4. Buscar histórico de suporte
      const supportHistory = opts.includeSupportHistory && user
        ? await this.getSupportHistory(user.id)
        : this.getEmptySupportHistory()

      // 5. Analisar comportamento do usuário
      const behavior = opts.includeBehaviorAnalysis && user
        ? await this.analyzeBehavior(user.id, phone, conversation)
        : this.getDefaultBehavior()

      // 6. Obter dados da sessão
      const session = opts.includeSessionData && user
        ? await this.getSessionData(user.id, phone)
        : undefined

      // 7. Calcular flags contextuais
      const flags = this.calculateFlags(user, subscription, supportHistory, conversation)

      // 8. Metadata
      const metadata = {
        language: 'pt-BR'
      }

      return {
        conversation,
        user,
        subscription,
        supportHistory,
        behavior,
        session,
        flags,
        metadata
      }
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error getting enriched context', {
        phone,
        error: error instanceof Error ? error.message : 'Unknown'
      })

      // Retornar contexto mínimo em caso de erro
      return this.getMinimalContext(phone, userId)
    }
  }

  /**
   * Busca dados do usuário
   */
  private async getUserData(phone: string, userId?: string) {
    try {
      const normalizedPhone = phone.replace(/\D/g, '')

      const user = await prisma.user.findFirst({
        where: userId
          ? { id: userId }
          : {
              OR: [
                { phone: normalizedPhone },
                { whatsapp: normalizedPhone },
                { phone },
                { whatsapp: phone }
              ]
            }
      })

      if (!user) return undefined

      return {
        id: user.id,
        name: user.name || 'Cliente',
        email: user.email,
        phone: user.phone || phone,
        whatsapp: user.whatsapp || undefined,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt || undefined
      }
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error fetching user data', {
        phone,
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return undefined
    }
  }

  /**
   * Busca dados da assinatura
   */
  private async getSubscriptionData(userId: string) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: {
            in: ['ACTIVE', 'OVERDUE', 'PAUSED']
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      if (!subscription) return undefined

      const now = new Date()
      const renewalDate = new Date(subscription.renewalDate)
      const daysUntilRenewal = Math.ceil(
        (renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        monthlyValue: Number(subscription.monthlyValue),
        renewalDate: renewalDate,
        startDate: new Date(subscription.startDate),
        nextBillingDate: subscription.nextBillingDate
          ? new Date(subscription.nextBillingDate)
          : undefined,
        daysUntilRenewal,
        isOverdue: subscription.status === 'OVERDUE'
      }
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error fetching subscription data', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return undefined
    }
  }

  /**
   * Busca histórico de suporte
   */
  private async getSupportHistory(userId: string) {
    try {
      const tickets = await prisma.supportTicket.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      const totalTickets = tickets.length
      const openTickets = tickets.filter(t => ['OPEN', 'IN_PROGRESS'].includes(t.status)).length
      const resolvedTickets = tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).length

      // Calcular tempo médio de resolução
      const resolvedWithTime = tickets.filter(t => t.status === 'RESOLVED' && t.resolvedAt)
      const avgResolutionTime = resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((sum, t) => {
            const resolutionTime = t.resolvedAt!.getTime() - t.createdAt.getTime()
            return sum + resolutionTime
          }, 0) / resolvedWithTime.length / (1000 * 60 * 60) // em horas
        : undefined

      // Categorias recentes
      const recentCategories = tickets
        .slice(0, 10)
        .map(t => t.category)
        .filter((value, index, self) => self.indexOf(value) === index)

      return {
        totalTickets,
        openTickets,
        resolvedTickets,
        averageResolutionTime: avgResolutionTime,
        lastTicketDate: tickets[0]?.createdAt,
        recentTicketCategories: recentCategories as string[]
      }
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error fetching support history', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return this.getEmptySupportHistory()
    }
  }

  /**
   * Analisa comportamento do usuário
   */
  private async analyzeBehavior(
    userId: string,
    phone: string,
    conversation: ConversationContext
  ) {
    try {
      // Buscar interações
      const interactions = await prisma.whatsAppInteraction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100
      })

      const totalInteractions = interactions.length

      // Calcular engagement score baseado em:
      // - Frequência de interações
      // - Resposta a mensagens
      // - Uso de comandos
      const last30Days = new Date()
      last30Days.setDate(last30Days.getDate() - 30)

      const recentInteractions = interactions.filter(
        i => i.createdAt >= last30Days
      ).length

      const engagementScore = Math.min(100, Math.round(
        (recentInteractions * 10) +
        (conversation.executedCommands.length * 5) +
        (conversation.totalMessages * 2)
      ))

      // Determinar se é usuário frequente
      const isFrequentUser = recentInteractions >= 10

      // Determinar se é high value (tem assinatura ativa há mais de 6 meses)
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE'
        }
      })
      const isHighValue = subscription
        ? (new Date().getTime() - new Date(subscription.startDate).getTime()) > 6 * 30 * 24 * 60 * 60 * 1000
        : false

      // Calcular risco
      const hasRecentComplaints = interactions
        .slice(0, 10)
        .some(i => i.intent?.includes('complaint'))

      const riskLevel: 'low' | 'medium' | 'high' = hasRecentComplaints
        ? 'high'
        : conversation.needsEscalation
        ? 'medium'
        : 'low'

      return {
        totalInteractions,
        preferredChannel: 'whatsapp' as const,
        lastInteractionDate: interactions[0]?.createdAt || new Date(),
        engagementScore,
        isFrequentUser,
        isHighValue,
        riskLevel
      }
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error analyzing behavior', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return this.getDefaultBehavior()
    }
  }

  /**
   * Busca dados da sessão ativa
   */
  private async getSessionData(userId: string, phone: string) {
    try {
      const session = await prisma.chatbotSession.findFirst({
        where: {
          userId,
          phone,
          status: 'ACTIVE',
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      if (!session) return undefined

      return {
        sessionId: session.sessionToken,
        startedAt: session.createdAt,
        expiresAt: session.expiresAt,
        commandsExecuted: session.commandsExecuted,
        isAuthenticated: true
      }
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error fetching session data', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return undefined
    }
  }

  /**
   * Calcula flags contextuais
   */
  private calculateFlags(
    user: any,
    subscription: any,
    supportHistory: any,
    conversation: ConversationContext
  ) {
    return {
      isFirstTimeUser: !user || conversation.isFirstInteraction,
      hasActiveSubscription: subscription?.status === 'ACTIVE',
      hasOverduePayment: subscription?.isOverdue || false,
      hasRecentComplaint: conversation.recentIntents.some(intent =>
        intent.includes('complaint')
      ),
      needsAttention: conversation.needsEscalation || supportHistory.openTickets > 0,
      isVIP: subscription && (
        subscription.monthlyValue > 200 ||
        new Date().getTime() - subscription.startDate.getTime() > 365 * 24 * 60 * 60 * 1000
      )
    }
  }

  /**
   * Adiciona mensagem e atualiza contexto
   */
  async addMessage(
    phone: string,
    content: string,
    role: 'user' | 'assistant',
    intent?: string,
    sentiment?: string,
    metadata?: any
  ): Promise<void> {
    const message: MemoryMessage = {
      role,
      content,
      timestamp: new Date(),
      intent,
      sentiment,
      metadata
    }

    await conversationMemory.addMessage(phone, message, true)

    logger.debug(LogCategory.WHATSAPP, 'Message added to context', {
      phone,
      role,
      intent,
      contentLength: content.length
    })
  }

  /**
   * Obtém histórico formatado para LangChain
   */
  async getFormattedHistory(phone: string, limit: number = 10) {
    return conversationMemory.getFormattedHistory(phone, limit)
  }

  /**
   * Obtém resumo da conversa
   */
  async getConversationSummary(phone: string): Promise<string> {
    return conversationMemory.getConversationSummary(phone)
  }

  /**
   * Limpa contexto
   */
  clearContext(phone: string): void {
    conversationMemory.clearContext(phone)
  }

  /**
   * Métodos auxiliares para retornar valores padrão
   */
  private getEmptySupportHistory() {
    return {
      totalTickets: 0,
      openTickets: 0,
      resolvedTickets: 0,
      recentTicketCategories: []
    }
  }

  private getDefaultBehavior() {
    return {
      totalInteractions: 0,
      preferredChannel: 'whatsapp' as const,
      lastInteractionDate: new Date(),
      engagementScore: 0,
      isFrequentUser: false,
      isHighValue: false,
      riskLevel: 'low' as const
    }
  }

  private async getMinimalContext(phone: string, userId?: string): Promise<EnrichedContext> {
    const conversation = await conversationMemory.getContext(phone, userId)

    return {
      conversation,
      supportHistory: this.getEmptySupportHistory(),
      behavior: this.getDefaultBehavior(),
      flags: {
        isFirstTimeUser: true,
        hasActiveSubscription: false,
        hasOverduePayment: false,
        hasRecentComplaint: false,
        needsAttention: false,
        isVIP: false
      },
      metadata: {
        language: 'pt-BR'
      }
    }
  }

  /**
   * Gera contexto textual para prompt do LLM
   */
  async generateLLMContext(enrichedContext: EnrichedContext): Promise<string> {
    const parts: string[] = []

    // Informações do usuário
    if (enrichedContext.user) {
      parts.push(`Cliente: ${enrichedContext.user.name}`)
      parts.push(`Telefone: ${enrichedContext.user.phone}`)
    }

    // Informações da assinatura
    if (enrichedContext.subscription) {
      parts.push(`Assinatura: ${enrichedContext.subscription.planType}`)
      parts.push(`Status: ${enrichedContext.subscription.status}`)
      parts.push(`Renovação em: ${enrichedContext.subscription.daysUntilRenewal} dias`)
    }

    // Histórico de suporte
    if (enrichedContext.supportHistory.totalTickets > 0) {
      parts.push(`Tickets: ${enrichedContext.supportHistory.totalTickets} total, ${enrichedContext.supportHistory.openTickets} abertos`)
    }

    // Comportamento
    if (enrichedContext.behavior.isFrequentUser) {
      parts.push('Cliente frequente')
    }
    if (enrichedContext.behavior.isHighValue) {
      parts.push('Cliente de alto valor')
    }

    // Flags
    if (enrichedContext.flags.isVIP) {
      parts.push('⭐ Cliente VIP')
    }
    if (enrichedContext.flags.hasOverduePayment) {
      parts.push('⚠️ Pagamento em atraso')
    }
    if (enrichedContext.flags.needsAttention) {
      parts.push('⚠️ Necessita atenção especial')
    }

    // Estado da conversa
    parts.push(`Estado da conversa: ${enrichedContext.conversation.conversationState}`)
    parts.push(`Sentimento: ${enrichedContext.conversation.dominantSentiment}`)

    // Resumo da conversa
    if (enrichedContext.conversation.summary) {
      parts.push(`Resumo: ${enrichedContext.conversation.summary}`)
    }

    return parts.join('\n')
  }

  /**
   * Obtém estatísticas do sistema de contexto
   */
  getStats() {
    return {
      memoryCache: conversationMemory.getCacheStats()
    }
  }
}

// Singleton instance
export const enhancedContextManager = new EnhancedContextManager()
