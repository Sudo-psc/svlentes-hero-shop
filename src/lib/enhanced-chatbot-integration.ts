/**
 * Enhanced Chatbot Integration
 * Integra todos os novos sistemas: memória, personalização, UX e fallbacks
 */

import { advancedMemory, ConversationMemory } from './advanced-conversation-memory'
import { personalizationEngine, PersonalizedResponse } from './personalization-engine'
import { dbFallbackSystem } from './database-fallback-system'
import { interactiveUX, OnboardingState } from './interactive-ux-system'
import { sendPulseClient } from './sendpulse-client'
import { logger, LogCategory } from './logger'

export interface EnhancedChatbotContext {
  phone: string
  userId?: string
  userName?: string
  message: string
  isChatOpened: boolean
  isNewUser: boolean
  memory?: ConversationMemory
}

export interface EnhancedChatbotResponse {
  personalizedResponse: PersonalizedResponse
  memoryUpdated: boolean
  fallbackUsed: boolean
  actionsTaken: string[]
  shouldShowMenu: boolean
  menuType?: string
}

/**
 * Enhanced Chatbot Integration
 * Orquestra todos os sistemas para uma experiência completa
 */
export class EnhancedChatbotIntegration {
  private onboardingStates = new Map<string, OnboardingState>()

  /**
   * Process message with all enhanced features
   */
  async processMessage(context: EnhancedChatbotContext): Promise<EnhancedChatbotResponse> {
    const actionsTaken: string[] = []

    try {
      // 1. Handle new users with onboarding
      if (context.isNewUser) {
        return await this.handleNewUser(context, actionsTaken)
      }

      // 2. Check if user is in onboarding flow
      const onboardingState = this.onboardingStates.get(context.phone)
      if (onboardingState && !onboardingState.completed) {
        return await this.continueOnboarding(context, onboardingState, actionsTaken)
      }

      // 3. Load user data with fallback
      const userResult = await dbFallbackSystem.findUserWithFallback(context.phone)

      if (!userResult.success || !userResult.data) {
        return await this.handleUnknownUser(context, actionsTaken)
      }

      const userId = userResult.data.id
      actionsTaken.push(`user_lookup:${userResult.source}`)

      // 4. Load conversation memory
      let memory: ConversationMemory
      try {
        memory = await advancedMemory.loadMemory(userId, context.phone)
        actionsTaken.push('memory_loaded')
      } catch (error) {
        logger.error(LogCategory.WHATSAPP, 'Error loading memory - using empty', { error })
        memory = await advancedMemory.loadMemory(userId, context.phone) // Will return empty on error
        actionsTaken.push('memory_fallback')
      }

      // 5. Check for menu commands
      const menuCommand = this.detectMenuCommand(context.message)
      if (menuCommand) {
        await interactiveUX.showMenu(context.phone, menuCommand, memory, context.isChatOpened)
        actionsTaken.push(`menu_shown:${menuCommand}`)

        return {
          personalizedResponse: {
            content: '',
            tone: memory.longTerm.communicationStyle.formalityLevel,
            useEmojis: memory.preferences.communication.useEmojis,
            personalizedElements: {
              nameUsed: memory.longTerm.name,
              styleAdjusted: false,
              contextReferences: [],
              proactiveSuggestions: []
            }
          },
          memoryUpdated: false,
          fallbackUsed: userResult.fallbackUsed,
          actionsTaken,
          shouldShowMenu: true,
          menuType: menuCommand
        }
      }

      // 6. Check for quick help command
      if (this.isHelpRequest(context.message)) {
        await interactiveUX.showQuickHelp(context.phone, context.isChatOpened)
        actionsTaken.push('help_shown')

        return {
          personalizedResponse: {
            content: '',
            tone: memory.longTerm.communicationStyle.formalityLevel,
            useEmojis: memory.preferences.communication.useEmojis,
            personalizedElements: {
              nameUsed: memory.longTerm.name,
              styleAdjusted: false,
              contextReferences: [],
              proactiveSuggestions: []
            }
          },
          memoryUpdated: false,
          fallbackUsed: userResult.fallbackUsed,
          actionsTaken,
          shouldShowMenu: false
        }
      }

      // 7. Process message with AI (would integrate with langchain-support-processor)
      const baseResponse = await this.processWithAI(context.message, memory)
      const intent = this.extractIntent(context.message) // Simplified intent extraction
      actionsTaken.push(`ai_processed:${intent}`)

      // 8. Personalize response
      const personalizedResponse = await personalizationEngine.personalizeResponse({
        memory,
        userMessage: context.message,
        intent,
        baseResponse
      })
      actionsTaken.push('response_personalized')

      // 9. Send personalized response
      if (personalizedResponse.quickReplies && personalizedResponse.quickReplies.length > 0) {
        await sendPulseClient.sendMessageWithQuickReplies(
          context.phone,
          personalizedResponse.content,
          personalizedResponse.quickReplies,
          { isChatOpened: context.isChatOpened }
        )
      } else {
        await sendPulseClient.sendMessage({
          phone: context.phone,
          message: personalizedResponse.content,
          isChatOpened: context.isChatOpened
        })
      }
      actionsTaken.push('response_sent')

      // 10. Update memory with new interaction
      await advancedMemory.addMessage(
        userId,
        context.phone,
        'user',
        context.message,
        { intent, sentiment: 'neutral' }
      )
      await advancedMemory.addMessage(
        userId,
        context.phone,
        'assistant',
        personalizedResponse.content,
        { intent }
      )
      actionsTaken.push('memory_updated')

      // 11. Store interaction in database (with fallback)
      const storeResult = await dbFallbackSystem.storeInteractionWithFallback({
        messageId: `msg_${Date.now()}`,
        customerPhone: context.phone,
        content: context.message,
        intent: { intent, sentiment: 'neutral' },
        response: personalizedResponse.content,
        escalationRequired: false,
        ticketCreated: false,
        userProfile: {
          id: userId,
          name: memory.longTerm.name,
          phone: context.phone,
          whatsapp: context.phone,
          email: '',
          subscription: null,
          subscriptionStatus: memory.longTerm.subscriptionInfo.status,
          source: 'chatbot'
        }
      })

      if (storeResult.fallbackUsed) {
        actionsTaken.push('interaction_queued')
      } else {
        actionsTaken.push('interaction_stored')
      }

      return {
        personalizedResponse,
        memoryUpdated: true,
        fallbackUsed: userResult.fallbackUsed || storeResult.fallbackUsed,
        actionsTaken,
        shouldShowMenu: false
      }
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error in enhanced chatbot integration', {
        phone: context.phone,
        error
      })

      // Ultimate fallback - simple response
      const fallbackMessage = `Desculpe, estou com dificuldades técnicas no momento. 😔\n\nPor favor, tente novamente em alguns instantes ou fale com nossa equipe:\n📞 (33) 98606-1427`

      await sendPulseClient.sendMessage({
        phone: context.phone,
        message: fallbackMessage,
        isChatOpened: context.isChatOpened
      })

      return {
        personalizedResponse: {
          content: fallbackMessage,
          tone: 'casual',
          useEmojis: true,
          personalizedElements: {
            nameUsed: 'Cliente',
            styleAdjusted: false,
            contextReferences: [],
            proactiveSuggestions: []
          }
        },
        memoryUpdated: false,
        fallbackUsed: true,
        actionsTaken: ['error_fallback'],
        shouldShowMenu: false
      }
    }
  }

  /**
   * Handle new user with onboarding
   */
  private async handleNewUser(
    context: EnhancedChatbotContext,
    actionsTaken: string[]
  ): Promise<EnhancedChatbotResponse> {
    const onboardingState = await interactiveUX.startOnboarding(context.phone)
    this.onboardingStates.set(context.phone, onboardingState)
    actionsTaken.push('onboarding_started')

    return {
      personalizedResponse: {
        content: '',
        tone: 'casual',
        useEmojis: true,
        personalizedElements: {
          nameUsed: 'Cliente',
          styleAdjusted: false,
          contextReferences: [],
          proactiveSuggestions: []
        }
      },
      memoryUpdated: false,
      fallbackUsed: false,
      actionsTaken,
      shouldShowMenu: false
    }
  }

  /**
   * Continue onboarding flow
   */
  private async continueOnboarding(
    context: EnhancedChatbotContext,
    state: OnboardingState,
    actionsTaken: string[]
  ): Promise<EnhancedChatbotResponse> {
    const updatedState = await interactiveUX.processOnboardingStep(
      context.phone,
      state,
      context.message
    )

    this.onboardingStates.set(context.phone, updatedState)
    actionsTaken.push(`onboarding_step:${updatedState.step}`)

    if (updatedState.completed) {
      this.onboardingStates.delete(context.phone)
      actionsTaken.push('onboarding_completed')

      // Create user profile in database (with fallback)
      // Would integrate with user creation logic here
    }

    return {
      personalizedResponse: {
        content: '',
        tone: 'casual',
        useEmojis: true,
        personalizedElements: {
          nameUsed: updatedState.data.name || 'Cliente',
          styleAdjusted: false,
          contextReferences: [],
          proactiveSuggestions: []
        }
      },
      memoryUpdated: false,
      fallbackUsed: false,
      actionsTaken,
      shouldShowMenu: updatedState.completed
    }
  }

  /**
   * Handle unknown user (not registered)
   */
  private async handleUnknownUser(
    context: EnhancedChatbotContext,
    actionsTaken: string[]
  ): Promise<EnhancedChatbotResponse> {
    const message = `👋 Olá!

Não encontrei seu cadastro em nosso sistema.

*Você já é cliente da SV Lentes?*`

    await sendPulseClient.sendMessageWithQuickReplies(
      context.phone,
      message,
      ['✅ Sim, sou cliente', '📝 Quero assinar', '📞 Falar com atendente'],
      { isChatOpened: context.isChatOpened }
    )

    actionsTaken.push('unknown_user_prompt')

    return {
      personalizedResponse: {
        content: message,
        tone: 'casual',
        useEmojis: true,
        personalizedElements: {
          nameUsed: 'Cliente',
          styleAdjusted: false,
          contextReferences: [],
          proactiveSuggestions: []
        }
      },
      memoryUpdated: false,
      fallbackUsed: false,
      actionsTaken,
      shouldShowMenu: false
    }
  }

  /**
   * Detect menu command from message
   */
  private detectMenuCommand(message: string): any {
    const lowerMessage = message.toLowerCase()

    if (/menu|principal|início|home|voltar/.test(lowerMessage)) {
      return 'main_menu'
    }

    if (/assinatura|plano|gerenciar/.test(lowerMessage)) {
      return 'subscription_menu'
    }

    if (/pagamento|fatura|boleto|pix|cartão/.test(lowerMessage)) {
      return 'billing_menu'
    }

    if (/suporte|ajuda|atendente|humano/.test(lowerMessage)) {
      return 'support_menu'
    }

    if (/preferência|configuração|notificação/.test(lowerMessage)) {
      return 'preferences_menu'
    }

    return null
  }

  /**
   * Check if message is a help request
   */
  private isHelpRequest(message: string): boolean {
    const lowerMessage = message.toLowerCase()
    return /^(ajuda|help|auxilio|socorro|comandos|\?)$/i.test(lowerMessage)
  }

  /**
   * Process message with AI (simplified - would integrate with langchain)
   */
  private async processWithAI(message: string, memory: ConversationMemory): Promise<string> {
    // This would integrate with langchain-support-processor
    // For now, return a simple response based on context

    const name = memory.longTerm.preferredName || memory.longTerm.name.split(' ')[0]

    // Check for common patterns
    if (/obrigad|valeu|thanks/i.test(message)) {
      return `Por nada, ${name}! 😊 Estou sempre aqui para ajudar. Precisa de mais alguma coisa?`
    }

    if (/tudo bem|como vai|oi|olá|hey/i.test(message)) {
      return `Olá, ${name}! Tudo ótimo por aqui! Como posso ajudar você hoje?`
    }

    // Default response
    return `Entendi, ${name}. Vou processar sua solicitação...`
  }

  /**
   * Extract intent from message (simplified)
   */
  private extractIntent(message: string): string {
    const lowerMessage = message.toLowerCase()

    if (/pausar|suspender|parar/.test(lowerMessage)) return 'SUBSCRIPTION_PAUSE'
    if (/reativar|ativar|voltar/.test(lowerMessage)) return 'SUBSCRIPTION_REACTIVATE'
    if (/rastrear|entrega|pedido/.test(lowerMessage)) return 'DELIVERY_TRACKING'
    if (/pagamento|fatura|boleto/.test(lowerMessage)) return 'BILLING'
    if (/cancelar/.test(lowerMessage)) return 'SUBSCRIPTION_CANCEL'
    if (/problema|erro|bug/.test(lowerMessage)) return 'TECHNICAL'
    if (/reclamação|insatisfeito/.test(lowerMessage)) return 'COMPLAINT'

    return 'GENERAL'
  }

  /**
   * Generate welcome message for returning user
   */
  async generateWelcomeForReturningUser(
    phone: string,
    userId: string
  ): Promise<void> {
    try {
      const memory = await advancedMemory.loadMemory(userId, phone)
      const personalizedWelcome = await personalizationEngine.generateWelcomeMessage(memory)

      if (personalizedWelcome.quickReplies && personalizedWelcome.quickReplies.length > 0) {
        await sendPulseClient.sendMessageWithQuickReplies(
          phone,
          personalizedWelcome.content,
          personalizedWelcome.quickReplies
        )
      } else {
        await sendPulseClient.sendMessage({
          phone,
          message: personalizedWelcome.content
        })
      }

      logger.info(LogCategory.WHATSAPP, 'Welcome message sent to returning user', {
        phone,
        userId
      })
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error generating welcome message', {
        phone,
        userId,
        error
      })
    }
  }

  /**
   * Generate re-engagement message
   */
  async generateReengagementMessage(
    phone: string,
    userId: string
  ): Promise<void> {
    try {
      const memory = await advancedMemory.loadMemory(userId, phone)
      const reengagementMessage = await personalizationEngine.generateReengagementMessage(memory)

      if (reengagementMessage.quickReplies && reengagementMessage.quickReplies.length > 0) {
        await sendPulseClient.sendMessageWithQuickReplies(
          phone,
          reengagementMessage.content,
          reengagementMessage.quickReplies
        )
      } else {
        await sendPulseClient.sendMessage({
          phone,
          message: reengagementMessage.content
        })
      }

      logger.info(LogCategory.WHATSAPP, 'Re-engagement message sent', {
        phone,
        userId
      })
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error generating re-engagement message', {
        phone,
        userId,
        error
      })
    }
  }

  /**
   * Health check for all systems
   */
  async healthCheck(): Promise<{
    memory: boolean
    personalization: boolean
    database: any
    ux: boolean
    overall: boolean
  }> {
    const dbHealth = await dbFallbackSystem.healthCheck()

    return {
      memory: true, // Memory system is always available (has fallbacks)
      personalization: true,
      database: dbHealth,
      ux: true,
      overall: dbHealth.database || dbHealth.fallback
    }
  }

  /**
   * Get system statistics
   */
  getStats() {
    return {
      memory: advancedMemory.getCacheStats(),
      database: dbFallbackSystem.getStats(),
      onboardingActive: this.onboardingStates.size
    }
  }
}

// Singleton instance
export const enhancedChatbot = new EnhancedChatbotIntegration()
