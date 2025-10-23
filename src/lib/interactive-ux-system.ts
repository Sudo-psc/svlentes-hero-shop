/**
 * Interactive UX System
 * Sistema de experiência do usuário com menus interativos, onboarding e fluxos guiados
 */

import { sendPulseClient } from './sendpulse-client'
import { ConversationMemory } from './advanced-conversation-memory'
import { logger, LogCategory } from './logger'

export type MenuType =
  | 'main_menu'
  | 'subscription_menu'
  | 'delivery_menu'
  | 'billing_menu'
  | 'support_menu'
  | 'preferences_menu'
  | 'onboarding_menu'

export type OnboardingStep =
  | 'welcome'
  | 'collect_name'
  | 'collect_email'
  | 'collect_preferences'
  | 'complete'

export interface InteractiveMenu {
  type: MenuType
  title: string
  description?: string
  options: MenuOption[]
  footer?: string
}

export interface MenuOption {
  id: string
  label: string
  emoji?: string
  description?: string
  action: 'navigate' | 'command' | 'external' | 'input'
  target?: string // Menu target or command
}

export interface OnboardingState {
  step: OnboardingStep
  data: {
    name?: string
    email?: string
    preferredName?: string
    communicationStyle?: 'formal' | 'casual' | 'very_casual'
    useEmojis?: boolean
    notifications?: {
      renewal: boolean
      delivery: boolean
      promotions: boolean
    }
  }
  completed: boolean
}

/**
 * Interactive UX System
 */
export class InteractiveUXSystem {
  /**
   * Show main menu to user
   */
  async showMainMenu(
    phone: string,
    memory: ConversationMemory,
    isChatOpened: boolean = true
  ): Promise<void> {
    try {
      const menu = this.buildMainMenu(memory)

      const message = this.formatMenuMessage(menu)

      await sendPulseClient.sendMessageWithQuickReplies(
        phone,
        message,
        menu.options.slice(0, 3).map(opt => `${opt.emoji} ${opt.label}`),
        { isChatOpened }
      )

      logger.info(LogCategory.WHATSAPP, 'Main menu sent', { phone })
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error showing main menu', { phone, error })
    }
  }

  /**
   * Build main menu based on user context
   */
  private buildMainMenu(memory: ConversationMemory): InteractiveMenu {
    const hasActiveSubscription = memory.longTerm.subscriptionInfo.status === 'ACTIVE'

    const options: MenuOption[] = []

    if (hasActiveSubscription) {
      options.push({
        id: 'view_subscription',
        label: 'Ver assinatura',
        emoji: '📋',
        description: 'Detalhes do seu plano e renovação',
        action: 'command',
        target: 'view_subscription'
      })

      options.push({
        id: 'track_delivery',
        label: 'Rastrear entrega',
        emoji: '📦',
        description: 'Acompanhar seu pedido',
        action: 'command',
        target: 'track_delivery'
      })

      options.push({
        id: 'manage_subscription',
        label: 'Gerenciar plano',
        emoji: '⚙️',
        description: 'Pausar, alterar ou cancelar',
        action: 'navigate',
        target: 'subscription_menu'
      })
    } else {
      options.push({
        id: 'learn_about_plans',
        label: 'Conhecer planos',
        emoji: '💎',
        description: 'Veja nossas opções de assinatura',
        action: 'external',
        target: 'https://svlentes.shop/planos'
      })

      options.push({
        id: 'subscribe_now',
        label: 'Assinar agora',
        emoji: '✨',
        description: 'Comece sua assinatura',
        action: 'external',
        target: 'https://svlentes.shop/assinar'
      })
    }

    options.push({
      id: 'billing',
      label: 'Pagamentos',
      emoji: '💳',
      description: 'Faturas e formas de pagamento',
      action: 'navigate',
      target: 'billing_menu'
    })

    options.push({
      id: 'support',
      label: 'Suporte',
      emoji: '💬',
      description: 'Fale com nossa equipe',
      action: 'navigate',
      target: 'support_menu'
    })

    options.push({
      id: 'preferences',
      label: 'Preferências',
      emoji: '⚙️',
      description: 'Configurar notificações e privacidade',
      action: 'navigate',
      target: 'preferences_menu'
    })

    return {
      type: 'main_menu',
      title: '📱 *Menu Principal*',
      description: 'Escolha uma opção abaixo:',
      options,
      footer: '\n_Digite o número da opção ou use os botões_'
    }
  }

  /**
   * Build subscription management menu
   */
  private buildSubscriptionMenu(memory: ConversationMemory): InteractiveMenu {
    const options: MenuOption[] = [
      {
        id: 'view_details',
        label: 'Ver detalhes',
        emoji: '📋',
        description: 'Informações completas do plano',
        action: 'command',
        target: 'view_subscription'
      },
      {
        id: 'pause_subscription',
        label: 'Pausar entrega',
        emoji: '⏸️',
        description: 'Suspender temporariamente',
        action: 'command',
        target: 'pause_subscription'
      },
      {
        id: 'change_plan',
        label: 'Alterar plano',
        emoji: '🔄',
        description: 'Mudar para outro plano',
        action: 'command',
        target: 'change_plan'
      },
      {
        id: 'update_address',
        label: 'Atualizar endereço',
        emoji: '📍',
        description: 'Mudar local de entrega',
        action: 'input',
        target: 'update_address'
      },
      {
        id: 'cancel_subscription',
        label: 'Cancelar assinatura',
        emoji: '❌',
        description: 'Encerrar sua assinatura',
        action: 'command',
        target: 'cancel_subscription'
      },
      {
        id: 'back',
        label: 'Voltar',
        emoji: '⬅️',
        description: 'Menu principal',
        action: 'navigate',
        target: 'main_menu'
      }
    ]

    return {
      type: 'subscription_menu',
      title: '📋 *Gerenciar Assinatura*',
      description: `Plano atual: *${memory.longTerm.subscriptionInfo.planType}*\nStatus: *${memory.longTerm.subscriptionInfo.status}*`,
      options,
      footer: '\n_Escolha uma opção:_'
    }
  }

  /**
   * Build billing menu
   */
  private buildBillingMenu(): InteractiveMenu {
    const options: MenuOption[] = [
      {
        id: 'view_invoices',
        label: 'Ver faturas',
        emoji: '📄',
        description: 'Histórico de pagamentos',
        action: 'command',
        target: 'view_invoices'
      },
      {
        id: 'update_payment',
        label: 'Atualizar pagamento',
        emoji: '💳',
        description: 'Mudar forma de pagamento',
        action: 'command',
        target: 'update_payment'
      },
      {
        id: 'payment_methods',
        label: 'Métodos disponíveis',
        emoji: '💰',
        description: 'PIX, cartão, boleto',
        action: 'command',
        target: 'payment_methods'
      },
      {
        id: 'billing_support',
        label: 'Suporte financeiro',
        emoji: '📞',
        description: 'Dúvidas sobre pagamentos',
        action: 'navigate',
        target: 'support_menu'
      },
      {
        id: 'back',
        label: 'Voltar',
        emoji: '⬅️',
        action: 'navigate',
        target: 'main_menu'
      }
    ]

    return {
      type: 'billing_menu',
      title: '💳 *Pagamentos*',
      description: 'Gerencie suas faturas e formas de pagamento',
      options,
      footer: '\n_Escolha uma opção:_'
    }
  }

  /**
   * Build support menu
   */
  private buildSupportMenu(): InteractiveMenu {
    const options: MenuOption[] = [
      {
        id: 'faq',
        label: 'Perguntas frequentes',
        emoji: '❓',
        description: 'Respostas rápidas',
        action: 'command',
        target: 'show_faq'
      },
      {
        id: 'human_support',
        label: 'Falar com atendente',
        emoji: '👤',
        description: 'Atendimento humano',
        action: 'command',
        target: 'escalate_to_human'
      },
      {
        id: 'consultation',
        label: 'Agendar consulta',
        emoji: '📅',
        description: 'Marcar horário com Dr. Philipe',
        action: 'external',
        target: 'https://svlentes.shop/agendar-consulta'
      },
      {
        id: 'emergency',
        label: 'Emergência ocular',
        emoji: '🚨',
        description: 'Orientação para urgências',
        action: 'command',
        target: 'emergency_protocol'
      },
      {
        id: 'feedback',
        label: 'Dar feedback',
        emoji: '⭐',
        description: 'Avalie nosso atendimento',
        action: 'input',
        target: 'collect_feedback'
      },
      {
        id: 'back',
        label: 'Voltar',
        emoji: '⬅️',
        action: 'navigate',
        target: 'main_menu'
      }
    ]

    return {
      type: 'support_menu',
      title: '💬 *Suporte*',
      description: 'Como podemos ajudar?',
      options,
      footer: '\n📞 *Contato direto:* (33) 98606-1427'
    }
  }

  /**
   * Build preferences menu
   */
  private buildPreferencesMenu(memory: ConversationMemory): InteractiveMenu {
    const options: MenuOption[] = [
      {
        id: 'notifications',
        label: 'Notificações',
        emoji: '🔔',
        description: `Ativas: ${Object.values(memory.preferences.notifications).filter(Boolean).length}/4`,
        action: 'command',
        target: 'manage_notifications'
      },
      {
        id: 'communication_style',
        label: 'Estilo de comunicação',
        emoji: '💬',
        description: `Atual: ${memory.longTerm.communicationStyle.formalityLevel}`,
        action: 'command',
        target: 'change_communication_style'
      },
      {
        id: 'privacy',
        label: 'Privacidade',
        emoji: '🔒',
        description: 'Controle seus dados',
        action: 'command',
        target: 'privacy_settings'
      },
      {
        id: 'preferred_name',
        label: 'Nome preferido',
        emoji: '✏️',
        description: memory.longTerm.preferredName || 'Não definido',
        action: 'input',
        target: 'set_preferred_name'
      },
      {
        id: 'reset_preferences',
        label: 'Restaurar padrões',
        emoji: '↩️',
        description: 'Voltar configurações originais',
        action: 'command',
        target: 'reset_preferences'
      },
      {
        id: 'back',
        label: 'Voltar',
        emoji: '⬅️',
        action: 'navigate',
        target: 'main_menu'
      }
    ]

    return {
      type: 'preferences_menu',
      title: '⚙️ *Preferências*',
      description: 'Personalize sua experiência',
      options,
      footer: '\n_Suas configurações são salvas automaticamente_'
    }
  }

  /**
   * Format menu message for WhatsApp
   */
  private formatMenuMessage(menu: InteractiveMenu): string {
    let message = `${menu.title}\n`

    if (menu.description) {
      message += `\n${menu.description}\n`
    }

    message += '\n'

    // Add numbered options
    menu.options.forEach((option, index) => {
      const number = index + 1
      const emoji = option.emoji || '•'
      message += `${number}️⃣ ${emoji} *${option.label}*\n`
      if (option.description) {
        message += `   _${option.description}_\n`
      }
    })

    if (menu.footer) {
      message += menu.footer
    }

    return message
  }

  /**
   * Show menu by type
   */
  async showMenu(
    phone: string,
    menuType: MenuType,
    memory: ConversationMemory,
    isChatOpened: boolean = true
  ): Promise<void> {
    let menu: InteractiveMenu

    switch (menuType) {
      case 'main_menu':
        menu = this.buildMainMenu(memory)
        break
      case 'subscription_menu':
        menu = this.buildSubscriptionMenu(memory)
        break
      case 'billing_menu':
        menu = this.buildBillingMenu()
        break
      case 'support_menu':
        menu = this.buildSupportMenu()
        break
      case 'preferences_menu':
        menu = this.buildPreferencesMenu(memory)
        break
      default:
        menu = this.buildMainMenu(memory)
    }

    const message = this.formatMenuMessage(menu)

    await sendPulseClient.sendMessageWithQuickReplies(
      phone,
      message,
      menu.options.slice(0, 3).map(opt => `${opt.emoji} ${opt.label}`),
      { isChatOpened }
    )

    logger.info(LogCategory.WHATSAPP, 'Menu sent', { phone, menuType })
  }

  /**
   * Start onboarding flow for new users
   */
  async startOnboarding(phone: string): Promise<OnboardingState> {
    const state: OnboardingState = {
      step: 'welcome',
      data: {},
      completed: false
    }

    const welcomeMessage = `👋 *Bem-vindo à SV Lentes!*

Olá! Sou o assistente virtual da *Saraiva Vision*.

Estou aqui para ajudar você com:
• 📋 Gerenciar sua assinatura
• 📦 Acompanhar entregas
• 💳 Questões de pagamento
• 📞 Suporte especializado

*Vamos começar?*

Para personalizar seu atendimento, preciso de algumas informações básicas. Levará apenas 1 minuto! ⏱️`

    await sendPulseClient.sendMessageWithQuickReplies(
      phone,
      welcomeMessage,
      ['✅ Começar', '📞 Falar com atendente', 'ℹ️ Saber mais']
    )

    logger.info(LogCategory.WHATSAPP, 'Onboarding started', { phone })

    return state
  }

  /**
   * Process onboarding step
   */
  async processOnboardingStep(
    phone: string,
    state: OnboardingState,
    userResponse: string
  ): Promise<OnboardingState> {
    switch (state.step) {
      case 'welcome':
        if (userResponse.toLowerCase().includes('começar')) {
          state.step = 'collect_name'
          await this.askForName(phone)
        } else if (userResponse.toLowerCase().includes('atendente')) {
          // Escalate to human
          await sendPulseClient.sendMessage({
            phone,
            message: '📞 Conectando você com um atendente...\n\nAguarde um momento.'
          })
          state.completed = true
        }
        break

      case 'collect_name':
        state.data.name = userResponse
        state.step = 'collect_email'
        await this.askForEmail(phone, state.data.name)
        break

      case 'collect_email':
        state.data.email = userResponse
        state.step = 'collect_preferences'
        await this.askForPreferences(phone, state.data.name || 'Cliente')
        break

      case 'collect_preferences':
        // Process preferences response
        state.data.useEmojis = !userResponse.toLowerCase().includes('formal')
        state.data.communicationStyle = userResponse.toLowerCase().includes('formal')
          ? 'formal'
          : 'casual'
        state.step = 'complete'
        await this.completeOnboarding(phone, state)
        break

      case 'complete':
        state.completed = true
        break
    }

    return state
  }

  /**
   * Ask for user name
   */
  private async askForName(phone: string): Promise<void> {
    const message = `✨ *Ótimo!*

Para começar, qual é o seu *nome completo*?

_Isso me ajudará a personalizar seu atendimento._`

    await sendPulseClient.sendMessage({ phone, message })
  }

  /**
   * Ask for user email
   */
  private async askForEmail(phone: string, name: string): Promise<void> {
    const firstName = name.split(' ')[0]

    const message = `👍 *Prazer em conhecer, ${firstName}!*

Agora, qual é o seu *e-mail*?

_Usaremos para enviar confirmações e faturas._

*Exemplo:* seuemail@exemplo.com`

    await sendPulseClient.sendMessage({ phone, message })
  }

  /**
   * Ask for communication preferences
   */
  private async askForPreferences(phone: string, name: string): Promise<void> {
    const message = `📱 *Última etapa, ${name}!*

Como você prefere se comunicar?

*Escolha um estilo:*`

    await sendPulseClient.sendMessageWithQuickReplies(
      phone,
      message,
      ['😊 Casual e amigável', '👔 Formal e profissional', '🎉 Descontraído com emojis']
    )
  }

  /**
   * Complete onboarding
   */
  private async completeOnboarding(phone: string, state: OnboardingState): Promise<void> {
    const name = state.data.name || 'Cliente'
    const firstName = name.split(' ')[0]

    const message = `🎉 *Tudo pronto, ${firstName}!*

Seu perfil foi configurado com sucesso!

✅ *Nome:* ${name}
✅ *E-mail:* ${state.data.email}
✅ *Estilo:* ${state.data.communicationStyle === 'formal' ? 'Formal' : 'Casual'}

*O que você gostaria de fazer agora?*`

    await sendPulseClient.sendMessageWithQuickReplies(
      phone,
      message,
      ['📋 Ver planos', '💬 Fazer uma pergunta', '📱 Ver menu principal']
    )

    logger.info(LogCategory.WHATSAPP, 'Onboarding completed', {
      phone,
      name: state.data.name
    })
  }

  /**
   * Show quick help card
   */
  async showQuickHelp(phone: string, isChatOpened: boolean = true): Promise<void> {
    const message = `🆘 *Ajuda Rápida*

*Comandos disponíveis:*

📋 *"minha assinatura"* - Ver detalhes do plano
📦 *"rastrear"* - Acompanhar entrega
⏸️ *"pausar"* - Pausar assinatura
💳 *"pagamento"* - Faturas e pagamentos
📞 *"atendente"* - Falar com humano
🏠 *"menu"* - Menu principal

*Dicas:*
• Você pode digitar naturalmente
• Use números para navegar nos menus
• Digite "ajuda" quando precisar

_💡 Experimente: "quero pausar minha assinatura"_`

    await sendPulseClient.sendMessage({
      phone,
      message,
      isChatOpened
    })
  }

  /**
   * Show FAQ with interactive navigation
   */
  async showFAQ(phone: string, category?: string): Promise<void> {
    const categories = [
      { id: 'subscription', label: 'Assinatura', emoji: '📋' },
      { id: 'delivery', label: 'Entregas', emoji: '📦' },
      { id: 'billing', label: 'Pagamentos', emoji: '💳' },
      { id: 'product', label: 'Produtos', emoji: '👓' },
      { id: 'account', label: 'Conta', emoji: '👤' }
    ]

    if (!category) {
      const message = `❓ *Perguntas Frequentes*

Escolha uma categoria:

${categories.map((cat, idx) => `${idx + 1}️⃣ ${cat.emoji} ${cat.label}`).join('\n')}

_Ou digite sua dúvida diretamente_`

      await sendPulseClient.sendMessageWithQuickReplies(
        phone,
        message,
        categories.slice(0, 3).map(cat => `${cat.emoji} ${cat.label}`)
      )
    } else {
      // Show FAQs for specific category (would be loaded from database)
      const message = `❓ *FAQ - ${category}*\n\n_FAQs would be loaded here from database_\n\nDigite *"voltar"* para categorias`

      await sendPulseClient.sendMessage({ phone, message })
    }
  }
}

// Singleton instance
export const interactiveUX = new InteractiveUXSystem()
