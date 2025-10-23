/**
 * Personalization Engine
 * Motor de personalização de respostas baseado em perfil e histórico do usuário
 */

import { advancedMemory, ConversationMemory } from './advanced-conversation-memory'
import { logger, LogCategory } from './logger'

export interface PersonalizedResponse {
  content: string
  tone: 'formal' | 'casual' | 'very_casual'
  useEmojis: boolean
  quickReplies?: string[]
  personalizedElements: {
    nameUsed: string
    styleAdjusted: boolean
    contextReferences: string[]
    proactivesuggestions: string[]
  }
}

export interface PersonalizationContext {
  memory: ConversationMemory
  userMessage: string
  intent: string
  baseResponse: string
}

/**
 * Personalization Engine
 */
export class PersonalizationEngine {
  /**
   * Personalize response based on user profile and history
   */
  async personalizeResponse(context: PersonalizationContext): Promise<PersonalizedResponse> {
    const { memory, userMessage, intent, baseResponse } = context

    try {
      // 1. Determine name to use
      const name = this.determineNameUsage(memory)

      // 2. Adjust tone based on communication style
      const adjustedTone = this.adjustTone(baseResponse, memory.longTerm.communicationStyle.formalityLevel)

      // 3. Add/remove emojis based on preference
      const withEmojis = this.adjustEmojiUsage(
        adjustedTone,
        memory.preferences.communication.useEmojis,
        memory.longTerm.communicationStyle.emojiUsage
      )

      // 4. Add context references from conversation history
      const withContext = await this.addContextReferences(withEmojis, memory)

      // 5. Add proactive suggestions based on user behavior
      const proactiveSuggestions = await this.generateProactiveSuggestions(memory, intent)

      // 6. Adjust response length
      const finalResponse = this.adjustResponseLength(
        withContext,
        memory.longTerm.communicationStyle.responseLength
      )

      // 7. Generate quick replies if enabled
      const quickReplies = memory.preferences.communication.quickReplies
        ? await this.generateQuickReplies(intent, memory)
        : undefined

      return {
        content: finalResponse,
        tone: memory.longTerm.communicationStyle.formalityLevel,
        useEmojis: memory.preferences.communication.useEmojis,
        quickReplies,
        personalizedElements: {
          nameUsed: name,
          styleAdjusted: true,
          contextReferences: [],
          proactiveSuggestions
        }
      }
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error personalizing response', { error })
      // Fallback to base response
      return {
        content: baseResponse,
        tone: 'casual',
        useEmojis: true,
        personalizedElements: {
          nameUsed: 'Cliente',
          styleAdjusted: false,
          contextReferences: [],
          proactiveSuggestions: []
        }
      }
    }
  }

  /**
   * Determine which name to use (preferred or formal)
   */
  private determineNameUsage(memory: ConversationMemory): string {
    if (memory.longTerm.preferredName) {
      return memory.longTerm.preferredName
    }

    const firstName = memory.longTerm.name.split(' ')[0]

    // Use first name for casual/very_casual, full name for formal
    if (memory.longTerm.communicationStyle.formalityLevel === 'formal') {
      return memory.longTerm.name
    }

    return firstName
  }

  /**
   * Adjust tone based on formality level
   */
  private adjustTone(response: string, formalityLevel: 'formal' | 'casual' | 'very_casual'): string {
    let adjusted = response

    if (formalityLevel === 'formal') {
      // Replace casual terms with formal equivalents
      adjusted = adjusted
        .replace(/\btá\b/gi, 'está')
        .replace(/\bpra\b/gi, 'para')
        .replace(/\bvc\b/gi, 'você')
        .replace(/\btô\b/gi, 'estou')
        .replace(/\bblz\b/gi, 'certo')
        .replace(/\bvaleu\b/gi, 'obrigado')
    } else if (formalityLevel === 'very_casual') {
      // Replace formal terms with very casual equivalents
      adjusted = adjusted
        .replace(/\bestá\b/gi, 'tá')
        .replace(/\bpara\b/gi, 'pra')
        .replace(/\bvocê\b/gi, 'vc')
        .replace(/\bestou\b/gi, 'tô')
    }

    return adjusted
  }

  /**
   * Adjust emoji usage based on preference
   */
  private adjustEmojiUsage(
    response: string,
    useEmojis: boolean,
    emojiUsageLevel: 'none' | 'moderate' | 'frequent'
  ): string {
    if (!useEmojis || emojiUsageLevel === 'none') {
      // Remove all emojis
      return response.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    }

    if (emojiUsageLevel === 'frequent') {
      // Add more emojis for emphasis
      return this.enhanceWithEmojis(response)
    }

    // moderate - keep as is
    return response
  }

  /**
   * Enhance response with additional emojis
   */
  private enhanceWithEmojis(response: string): string {
    let enhanced = response

    // Add emojis based on context
    if (/obrigad/i.test(response)) enhanced = enhanced.replace(/obrigad/gi, '🙏 Obrigad')
    if (/bem[- ]vind/i.test(response)) enhanced = enhanced.replace(/bem[- ]vind/gi, '👋 Bem-vind')
    if (/sucesso/i.test(response)) enhanced = enhanced.replace(/sucesso/gi, '✅ Sucesso')
    if (/aten[çc][aã]o/i.test(response)) enhanced = enhanced.replace(/aten[çc][aã]o/gi, '⚠️ Atenção')
    if (/importante/i.test(response)) enhanced = enhanced.replace(/importante/gi, '❗ Importante')
    if (/entreg/i.test(response)) enhanced = enhanced.replace(/entreg/gi, '📦 Entreg')
    if (/pagamento/i.test(response)) enhanced = enhanced.replace(/pagamento/gi, '💳 Pagamento')
    if (/assinatura/i.test(response)) enhanced = enhanced.replace(/assinatura/gi, '📋 Assinatura')

    return enhanced
  }

  /**
   * Add context references from conversation history
   */
  private async addContextReferences(response: string, memory: ConversationMemory): Promise<string> {
    try {
      // Check if we can reference previous interactions
      const recentMessages = memory.shortTerm.recentMessages.slice(-5)

      // Find relevant context to reference
      const hasRecentIssue = recentMessages.some(msg =>
        msg.intent === 'COMPLAINT' || msg.intent === 'TECHNICAL'
      )

      if (hasRecentIssue && !response.includes('como mencionado')) {
        return `${response}\n\n_Lembro que você mencionou um problema anteriormente. Já está tudo resolvido?_`
      }

      // Reference recent purchase
      const hasPurchase = memory.longTerm.purchaseHistory.length > 0
      if (hasPurchase && memory.longTerm.purchaseHistory[0].date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
        const lastPurchase = memory.longTerm.purchaseHistory[0]
        if (!response.includes('pedido')) {
          return `${response}\n\n_Vejo que você fez um pedido recentemente de ${lastPurchase.product}. Chegou tudo bem?_`
        }
      }

      return response
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error adding context references', { error })
      return response
    }
  }

  /**
   * Generate proactive suggestions based on user behavior and intent
   */
  private async generateProactiveSuggestions(
    memory: ConversationMemory,
    intent: string
  ): Promise<string[]> {
    const suggestions: string[] = []

    try {
      // Suggest renewal if approaching renewal date
      const daysUntilRenewal = Math.ceil(
        (memory.longTerm.subscriptionInfo.renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      if (daysUntilRenewal <= 7 && daysUntilRenewal > 0) {
        suggestions.push(`💡 Sua renovação está próxima (${daysUntilRenewal} dias). Gostaria de revisar seu plano?`)
      }

      // Suggest pause if approaching pause limit
      if (memory.longTerm.subscriptionInfo.pauseCount >= 2) {
        suggestions.push(`ℹ️ Você já pausou ${memory.longTerm.subscriptionInfo.pauseCount} vezes. Considera ajustar seu plano?`)
      }

      // Suggest consultation if prescription is old
      if (memory.longTerm.personalizedInfo.prescriptionDate) {
        const monthsSincePrescription = Math.floor(
          (Date.now() - memory.longTerm.personalizedInfo.prescriptionDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        )

        if (monthsSincePrescription >= 12) {
          suggestions.push(`👓 Sua receita tem mais de 1 ano. Que tal agendar uma consulta para atualizar?`)
        }
      }

      // Contextual suggestions based on intent
      switch (intent) {
        case 'DELIVERY':
          suggestions.push(`📍 Precisa atualizar seu endereço de entrega?`)
          break
        case 'BILLING':
          suggestions.push(`💳 Gostaria de conhecer outras formas de pagamento disponíveis?`)
          break
        case 'PRODUCT':
          suggestions.push(`📦 Quer saber sobre nossos novos produtos e promoções?`)
          break
      }

      return suggestions.slice(0, 2) // Limit to 2 suggestions
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error generating proactive suggestions', { error })
      return []
    }
  }

  /**
   * Adjust response length based on preference
   */
  private adjustResponseLength(
    response: string,
    lengthPreference: 'concise' | 'detailed' | 'very_detailed'
  ): string {
    if (lengthPreference === 'concise') {
      // Keep only essential information (first paragraph or main point)
      const sentences = response.split(/[.!?]\s+/)
      return sentences.slice(0, 2).join('. ') + '.'
    }

    if (lengthPreference === 'very_detailed') {
      // Response is already detailed, no need to modify
      return response
    }

    // detailed - keep as is
    return response
  }

  /**
   * Generate context-aware quick replies
   */
  private async generateQuickReplies(intent: string, memory: ConversationMemory): Promise<string[]> {
    const quickReplies: string[] = []

    try {
      // Base replies for common intents
      switch (intent) {
        case 'SUBSCRIPTION':
          quickReplies.push('📋 Ver assinatura', '⏸️ Pausar', '🔄 Alterar plano')
          break
        case 'DELIVERY':
          quickReplies.push('📦 Rastrear', '📍 Mudar endereço', '📞 Falar com atendente')
          break
        case 'BILLING':
          quickReplies.push('💳 Atualizar pagamento', '📄 Ver faturas', '💬 Dúvida específica')
          break
        case 'PRODUCT':
          quickReplies.push('🛒 Ver catálogo', '💰 Promoções', '📦 Fazer pedido')
          break
        case 'ACCOUNT':
          quickReplies.push('🔐 Trocar senha', '📝 Atualizar dados', '❓ Ajuda')
          break
        default:
          // Generic helpful replies
          quickReplies.push('✅ Resolvido', '💬 Mais dúvidas', '📞 Falar com atendente')
      }

      // Add personalized reply based on history
      if (memory.longTerm.supportHistory.totalInteractions < 3) {
        quickReplies.push('ℹ️ Conhecer recursos')
      }

      return quickReplies.slice(0, 3) // WhatsApp limit: 3 buttons
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error generating quick replies', { error })
      return ['✅ Sim', '❌ Não', '💬 Mais info']
    }
  }

  /**
   * Generate personalized welcome message
   */
  async generateWelcomeMessage(memory: ConversationMemory): Promise<PersonalizedResponse> {
    const name = this.determineNameUsage(memory)
    const emoji = memory.preferences.communication.useEmojis ? '👋' : ''

    let welcomeContent = `${emoji} Olá, ${name}!`

    // Add personalized greeting based on time of day and context
    const hour = new Date().getHours()
    let timeGreeting = ''

    if (hour < 12) timeGreeting = 'Bom dia'
    else if (hour < 18) timeGreeting = 'Boa tarde'
    else timeGreeting = 'Boa noite'

    welcomeContent = `${emoji} ${timeGreeting}, ${name}!`

    // Add subscription context
    if (memory.longTerm.subscriptionInfo.status === 'ACTIVE') {
      const daysUntilRenewal = Math.ceil(
        (memory.longTerm.subscriptionInfo.renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      welcomeContent += `\n\n✅ Sua assinatura está ativa!`
      welcomeContent += `\n📦 Plano: ${memory.longTerm.subscriptionInfo.planType}`
      welcomeContent += `\n📅 Renovação em ${daysUntilRenewal} dias`
    }

    // Add personalized menu
    welcomeContent += `\n\n*Como posso ajudar você hoje?*`

    const quickReplies = [
      '📋 Ver assinatura',
      '📦 Meus pedidos',
      '📞 Atendimento'
    ]

    return {
      content: welcomeContent,
      tone: memory.longTerm.communicationStyle.formalityLevel,
      useEmojis: memory.preferences.communication.useEmojis,
      quickReplies,
      personalizedElements: {
        nameUsed: name,
        styleAdjusted: true,
        contextReferences: [],
        proactiveSuggestions: []
      }
    }
  }

  /**
   * Generate onboarding message for new users
   */
  async generateOnboardingMessage(phone: string): Promise<PersonalizedResponse> {
    const welcomeContent = `👋 Olá! Bem-vindo à *SV Lentes*!

Sou o assistente virtual e estou aqui para ajudar com:

📋 *Gerenciar sua assinatura*
📦 *Acompanhar entregas*
💳 *Questões de pagamento*
📞 *Atendimento personalizado*

*Vamos começar?*

Para prosseguir, preciso que você:
1️⃣ Informe seu nome completo
2️⃣ Confirme seu e-mail

Ou, se preferir, posso te conectar direto com um atendente! 😊`

    return {
      content: welcomeContent,
      tone: 'casual',
      useEmojis: true,
      quickReplies: ['✍️ Informar dados', '📞 Falar com atendente', 'ℹ️ Saber mais'],
      personalizedElements: {
        nameUsed: 'Cliente',
        styleAdjusted: false,
        contextReferences: [],
        proactiveSuggestions: []
      }
    }
  }

  /**
   * Generate re-engagement message for returning users
   */
  async generateReengagementMessage(memory: ConversationMemory): Promise<PersonalizedResponse> {
    const name = this.determineNameUsage(memory)
    const daysSinceLastInteraction = Math.floor(
      (Date.now() - memory.context.lastInteractionTime.getTime()) / (1000 * 60 * 60 * 24)
    )

    let content = `👋 Olá novamente, ${name}!`

    if (daysSinceLastInteraction > 30) {
      content += `\n\n*Faz um tempo que não conversamos!* (${daysSinceLastInteraction} dias)`
      content += `\n\n*Novidades:*\n• Sistema de autoatendimento melhorado\n• Novos produtos disponíveis\n• Consultas online facilitadas`
    } else if (daysSinceLastInteraction > 7) {
      content += `\n\nBom te ver de volta! Como posso ajudar hoje?`
    } else {
      content += `\n\nContinuando de onde paramos... 😊`
    }

    // Check for pending issues
    if (memory.context.unresolvedIssues.length > 0) {
      content += `\n\n⚠️ *Nota:* Vejo que ainda temos ${memory.context.unresolvedIssues.length} pendência(s). Gostaria de resolver?`
    }

    return {
      content,
      tone: memory.longTerm.communicationStyle.formalityLevel,
      useEmojis: memory.preferences.communication.useEmojis,
      quickReplies: [
        '📋 Ver assinatura',
        '💬 Nova solicitação',
        '📞 Atendente'
      ],
      personalizedElements: {
        nameUsed: name,
        styleAdjusted: true,
        contextReferences: memory.context.unresolvedIssues,
        proactiveSuggestions: []
      }
    }
  }
}

// Singleton instance
export const personalizationEngine = new PersonalizationEngine()
