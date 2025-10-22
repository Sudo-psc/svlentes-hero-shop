/**
 * Conversation Memory Manager
 *
 * Sistema avançado de gerenciamento de memória para conversações do WhatsApp
 * Features:
 * - Cache de memória de curto prazo (LRU)
 * - Sumarização automática de conversas longas
 * - Tracking de contexto relevante
 * - Priorização de informações importantes
 * - Persistência de memória entre sessões
 */

import { prisma } from '@/lib/prisma'
import { logger, LogCategory } from '@/lib/logger'

/**
 * Estrutura de mensagem na memória
 */
export interface MemoryMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  intent?: string
  sentiment?: string
  metadata?: {
    ticketCreated?: boolean
    escalated?: boolean
    commandExecuted?: string
  }
}

/**
 * Contexto de conversa enriquecido
 */
export interface ConversationContext {
  conversationId: string
  userId?: string
  customerPhone: string
  customerName?: string

  // Histórico de mensagens
  messages: MemoryMessage[]

  // Resumo da conversa
  summary?: string
  summaryUpdatedAt?: Date

  // Intenções e sentimentos
  recentIntents: string[]
  dominantSentiment?: 'positive' | 'negative' | 'neutral'

  // Tópicos discutidos
  topics: string[]

  // Comandos executados
  executedCommands: string[]

  // Estado da conversa
  conversationState: 'greeting' | 'inquiry' | 'support' | 'resolution' | 'escalation' | 'idle'

  // Flags de comportamento
  isFirstInteraction: boolean
  needsEscalation: boolean
  satisfactionLevel?: number

  // Metadados
  lastMessageAt: Date
  totalMessages: number
  averageResponseTime?: number
}

/**
 * Configuração do cache LRU
 */
interface CacheConfig {
  maxSize: number
  ttlMs: number
  maxMessagesPerContext: number
  summaryThreshold: number
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 100, // Máximo de 100 conversas em cache
  ttlMs: 30 * 60 * 1000, // 30 minutos
  maxMessagesPerContext: 50, // Máximo de 50 mensagens por contexto
  summaryThreshold: 20 // Criar resumo após 20 mensagens
}

/**
 * Entrada do cache com metadados
 */
interface CacheEntry {
  context: ConversationContext
  lastAccessedAt: Date
  accessCount: number
}

/**
 * Conversation Memory Manager Class
 */
export class ConversationMemoryManager {
  private cache: Map<string, CacheEntry>
  private config: CacheConfig
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new Map()
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config }
    this.startCleanupTask()
  }

  /**
   * Inicia tarefa de limpeza periódica do cache
   */
  private startCleanupTask(): void {
    // Limpar cache a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries()
    }, 5 * 60 * 1000)
  }

  /**
   * Para a tarefa de limpeza
   */
  public stopCleanupTask(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Remove entradas expiradas do cache
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.lastAccessedAt.getTime()
      if (age > this.config.ttlMs) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key))

    if (expiredKeys.length > 0) {
      logger.debug(LogCategory.WHATSAPP, `Cache cleanup: removed ${expiredKeys.length} expired entries`)
    }
  }

  /**
   * Implementação LRU: Remove entrada mais antiga se cache estiver cheio
   */
  private evictLRU(): void {
    if (this.cache.size < this.config.maxSize) return

    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessedAt.getTime() < oldestTime) {
        oldestTime = entry.lastAccessedAt.getTime()
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      logger.debug(LogCategory.WHATSAPP, `LRU eviction: removed ${oldestKey}`)
    }
  }

  /**
   * Obtém contexto da conversa (do cache ou banco de dados)
   */
  async getContext(phone: string, userId?: string): Promise<ConversationContext> {
    const cacheKey = this.getCacheKey(phone)

    // Tentar obter do cache primeiro
    const cached = this.cache.get(cacheKey)
    if (cached) {
      cached.lastAccessedAt = new Date()
      cached.accessCount++

      logger.debug(LogCategory.WHATSAPP, 'Memory cache hit', {
        phone,
        messages: cached.context.messages.length,
        accessCount: cached.accessCount
      })

      return cached.context
    }

    // Não encontrado no cache, carregar do banco de dados
    logger.debug(LogCategory.WHATSAPP, 'Memory cache miss, loading from database', { phone })
    const context = await this.loadContextFromDatabase(phone, userId)

    // Adicionar ao cache
    this.setCache(cacheKey, context)

    return context
  }

  /**
   * Carrega contexto do banco de dados
   */
  private async loadContextFromDatabase(phone: string, userId?: string): Promise<ConversationContext> {
    try {
      // Buscar ou criar conversa
      let conversation = await prisma.whatsAppConversation.findUnique({
        where: { customerPhone: phone },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: this.config.maxMessagesPerContext
          },
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      // Criar conversa se não existir
      if (!conversation) {
        conversation = await prisma.whatsAppConversation.create({
          data: {
            customerPhone: phone,
            userId: userId,
            lastMessageAt: new Date(),
            messageCount: 0,
            isActive: true
          },
          include: {
            messages: true,
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
      }

      // Converter mensagens do banco para formato de memória
      const messages: MemoryMessage[] = conversation.messages
        .reverse() // Ordem cronológica
        .map(msg => ({
          role: msg.isFromCustomer ? 'user' as const : 'assistant' as const,
          content: msg.content,
          timestamp: msg.createdAt,
          intent: msg.intent || undefined,
          sentiment: msg.sentiment || undefined,
          metadata: {
            ticketCreated: msg.ticketCreated,
            escalated: msg.escalationRequired
          }
        }))

      // Extrair intenções recentes
      const recentIntents = conversation.messages
        .slice(0, 10) // Últimas 10 mensagens
        .map(msg => msg.intent)
        .filter(Boolean) as string[]

      // Extrair tópicos (simplificado - pode ser melhorado com NLP)
      const topics = this.extractTopics(messages)

      // Comandos executados (extrair do metadata)
      const executedCommands = this.extractExecutedCommands(messages)

      // Determinar estado da conversa
      const conversationState = this.determineConversationState(messages, recentIntents)

      // Calcular sentimento dominante
      const dominantSentiment = this.calculateDominantSentiment(messages)

      return {
        conversationId: conversation.id,
        userId: conversation.userId || undefined,
        customerPhone: phone,
        customerName: conversation.customerName || conversation.user?.name || undefined,
        messages,
        recentIntents: recentIntents.slice(0, 5), // Últimas 5 intenções
        dominantSentiment,
        topics,
        executedCommands,
        conversationState,
        isFirstInteraction: messages.length === 0,
        needsEscalation: recentIntents.includes('escalation_required'),
        lastMessageAt: conversation.lastMessageAt,
        totalMessages: conversation.messageCount
      }
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error loading conversation context', {
        phone,
        error: error instanceof Error ? error.message : 'Unknown'
      })

      // Retornar contexto vazio em caso de erro
      return this.createEmptyContext(phone, userId)
    }
  }

  /**
   * Cria contexto vazio para novo usuário
   */
  private createEmptyContext(phone: string, userId?: string): ConversationContext {
    return {
      conversationId: '',
      userId,
      customerPhone: phone,
      messages: [],
      recentIntents: [],
      topics: [],
      executedCommands: [],
      conversationState: 'greeting',
      isFirstInteraction: true,
      needsEscalation: false,
      lastMessageAt: new Date(),
      totalMessages: 0
    }
  }

  /**
   * Adiciona mensagem ao contexto
   */
  async addMessage(
    phone: string,
    message: MemoryMessage,
    persistToDatabase: boolean = true
  ): Promise<ConversationContext> {
    const context = await this.getContext(phone)

    // Adicionar mensagem ao array
    context.messages.push(message)
    context.lastMessageAt = message.timestamp
    context.totalMessages++

    // Atualizar intenções recentes
    if (message.intent) {
      context.recentIntents.unshift(message.intent)
      context.recentIntents = context.recentIntents.slice(0, 5) // Manter apenas 5
    }

    // Atualizar sentimento dominante
    context.dominantSentiment = this.calculateDominantSentiment(context.messages)

    // Atualizar estado da conversa
    context.conversationState = this.determineConversationState(
      context.messages,
      context.recentIntents
    )

    // Verificar se precisa de resumo
    if (context.messages.length >= this.config.summaryThreshold && !context.summary) {
      context.summary = await this.generateSummary(context.messages)
      context.summaryUpdatedAt = new Date()
    }

    // Limitar número de mensagens em memória
    if (context.messages.length > this.config.maxMessagesPerContext) {
      // Manter apenas as mais recentes
      context.messages = context.messages.slice(-this.config.maxMessagesPerContext)
    }

    // Atualizar cache
    const cacheKey = this.getCacheKey(phone)
    this.setCache(cacheKey, context)

    // Persistir no banco de dados se solicitado
    if (persistToDatabase && message.role !== 'system') {
      await this.persistMessage(context.conversationId, phone, message)
    }

    return context
  }

  /**
   * Persiste mensagem no banco de dados
   */
  private async persistMessage(
    conversationId: string,
    phone: string,
    message: MemoryMessage
  ): Promise<void> {
    try {
      // Garantir que a conversa existe
      if (!conversationId) {
        const conversation = await prisma.whatsAppConversation.upsert({
          where: { customerPhone: phone },
          create: {
            customerPhone: phone,
            lastMessageAt: message.timestamp,
            messageCount: 1,
            isActive: true,
            lastIntent: message.intent,
            lastSentiment: message.sentiment
          },
          update: {
            lastMessageAt: message.timestamp,
            messageCount: { increment: 1 },
            lastIntent: message.intent,
            lastSentiment: message.sentiment
          }
        })
        conversationId = conversation.id
      } else {
        // Atualizar conversa existente
        await prisma.whatsAppConversation.update({
          where: { id: conversationId },
          data: {
            lastMessageAt: message.timestamp,
            messageCount: { increment: 1 },
            lastIntent: message.intent,
            lastSentiment: message.sentiment
          }
        })
      }

      // Criar interação
      await prisma.whatsAppInteraction.create({
        data: {
          conversationId: conversationId,
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          customerPhone: phone,
          content: message.content,
          isFromCustomer: message.role === 'user',
          intent: message.intent,
          sentiment: message.sentiment,
          response: message.role === 'assistant' ? message.content : undefined,
          escalationRequired: message.metadata?.escalated || false,
          ticketCreated: message.metadata?.ticketCreated || false,
          createdAt: message.timestamp
        }
      })
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error persisting message', {
        phone,
        error: error instanceof Error ? error.message : 'Unknown'
      })
    }
  }

  /**
   * Gera resumo da conversa
   */
  private async generateSummary(messages: MemoryMessage[]): Promise<string> {
    // Simplificado - pode ser melhorado com LLM
    const userMessages = messages.filter(m => m.role === 'user')
    const intents = messages
      .map(m => m.intent)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index) // Unique

    const summary = `Conversa com ${userMessages.length} mensagens. Principais intenções: ${intents.join(', ')}.`

    logger.debug(LogCategory.WHATSAPP, 'Generated conversation summary', {
      messageCount: messages.length,
      intents
    })

    return summary
  }

  /**
   * Extrai tópicos da conversa (simplificado)
   */
  private extractTopics(messages: MemoryMessage[]): string[] {
    // Simplificado - baseado em palavras-chave frequentes
    const keywords = new Map<string, number>()
    const stopWords = ['o', 'a', 'de', 'para', 'com', 'em', 'que', 'e', 'é', 'do', 'da']

    messages.forEach(msg => {
      const words = msg.content
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.includes(w))

      words.forEach(word => {
        keywords.set(word, (keywords.get(word) || 0) + 1)
      })
    })

    // Retornar top 5 palavras-chave
    return Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
  }

  /**
   * Extrai comandos executados
   */
  private extractExecutedCommands(messages: MemoryMessage[]): string[] {
    return messages
      .filter(m => m.metadata?.commandExecuted)
      .map(m => m.metadata!.commandExecuted!)
      .filter(Boolean) as string[]
  }

  /**
   * Determina estado atual da conversa
   */
  private determineConversationState(
    messages: MemoryMessage[],
    recentIntents: string[]
  ): ConversationContext['conversationState'] {
    if (messages.length === 0) return 'greeting'

    // Verificar última intenção
    const lastIntent = recentIntents[0]

    if (lastIntent?.includes('escalation')) return 'escalation'
    if (lastIntent?.includes('complaint')) return 'support'
    if (lastIntent?.includes('resolved') || lastIntent?.includes('thanks')) return 'resolution'
    if (recentIntents.length > 0) return 'inquiry'

    // Verificar inatividade
    const lastMessage = messages[messages.length - 1]
    const timeSinceLastMessage = Date.now() - lastMessage.timestamp.getTime()
    if (timeSinceLastMessage > 30 * 60 * 1000) return 'idle' // 30 minutos

    return 'inquiry'
  }

  /**
   * Calcula sentimento dominante da conversa
   */
  private calculateDominantSentiment(
    messages: MemoryMessage[]
  ): 'positive' | 'negative' | 'neutral' {
    const sentiments = messages
      .filter(m => m.sentiment)
      .map(m => m.sentiment!)

    if (sentiments.length === 0) return 'neutral'

    const counts = {
      positive: sentiments.filter(s => s === 'positive').length,
      negative: sentiments.filter(s => s === 'negative').length,
      neutral: sentiments.filter(s => s === 'neutral').length
    }

    if (counts.positive > counts.negative && counts.positive > counts.neutral) {
      return 'positive'
    } else if (counts.negative > counts.positive && counts.negative > counts.neutral) {
      return 'negative'
    }

    return 'neutral'
  }

  /**
   * Limpa contexto do cache
   */
  clearContext(phone: string): void {
    const cacheKey = this.getCacheKey(phone)
    this.cache.delete(cacheKey)
  }

  /**
   * Limpa todo o cache
   */
  clearAllContexts(): void {
    this.cache.clear()
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        phone: key,
        messages: entry.context.messages.length,
        lastAccessed: entry.lastAccessedAt,
        accessCount: entry.accessCount
      }))
    }
  }

  /**
   * Gera chave de cache a partir do telefone
   */
  private getCacheKey(phone: string): string {
    return `conv:${phone}`
  }

  /**
   * Adiciona entrada ao cache com LRU
   */
  private setCache(key: string, context: ConversationContext): void {
    // Implementar LRU eviction se necessário
    this.evictLRU()

    this.cache.set(key, {
      context,
      lastAccessedAt: new Date(),
      accessCount: 1
    })
  }

  /**
   * Obtém resumo da conversa para uso em prompts
   */
  async getConversationSummary(phone: string): Promise<string> {
    const context = await this.getContext(phone)

    if (context.summary) {
      return context.summary
    }

    // Gerar resumo simples se não existir
    const recentMessages = context.messages.slice(-10)
    const userMessages = recentMessages.filter(m => m.role === 'user')

    return `Conversa recente: ${userMessages.length} mensagens do usuário. Últimas intenções: ${context.recentIntents.slice(0, 3).join(', ') || 'nenhuma'}.`
  }

  /**
   * Obtém mensagens formatadas para LangChain
   */
  async getFormattedHistory(
    phone: string,
    limit: number = 10
  ): Promise<{ role: string; content: string }[]> {
    const context = await this.getContext(phone)

    return context.messages
      .slice(-limit)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }))
  }
}

// Singleton instance
export const conversationMemory = new ConversationMemoryManager()
