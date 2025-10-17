/**
 * LangChain Support-Specific Message Processor
 * Specialized prompts and workflows for customer support via WhatsApp
 */

import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence, RunnableMap } from '@langchain/core/runnables'
import { Document } from '@langchain/core/documents'
import { SupportKnowledgeBase, FAQCategory } from './support-knowledge-base'
import { supportTicketManager, TicketCategory, TicketPriority } from './support-ticket-manager'
import { getLangSmithConfig, logLangSmithStatus, getLangSmithRunConfig } from './langsmith-config'

interface SupportIntent {
  name: string
  confidence: number
  category: TicketCategory
  priority: TicketPriority
  escalationRequired: boolean
  entities: {
    sentiment: 'positive' | 'negative' | 'neutral'
    urgency: 'low' | 'medium' | 'high' | 'critical'
    emotions: string[]
    keywords: string[]
  }
  suggestedActions: string[]
  responseStrategy: 'automated' | 'agent_required' | 'escalation'
}

interface SupportContext {
  userHistory: any[]
  previousTickets: any[]
  subscriptionInfo: any
  userProfile: any
  conversationHistory: string[]
  lastIntent?: SupportIntent
}

export class LangChainSupportProcessor {
  private llm: ChatOpenAI
  private knowledgeBase: SupportKnowledgeBase

  // Support-specific intent classification template
  private readonly SUPPORT_INTENT_TEMPLATE = `
Você é um assistente de atendimento ao cliente especializado em lentes de contato da SV Lentes.

Analise a mensagem do cliente e classifique a intenção com base nas seguintes categorias:

CATEGORIAS PRINCIPAIS:
- BILLING: Questões sobre pagamento, fatura, cartão, PIX, boleto
- TECHNICAL: Problemas técnicos, site, app, sistema
- PRODUCT: Informações sobre produtos, troca, qualidade, tipos de lentes
- DELIVERY: Entrega, frete, rastreamento, atraso, correios
- ACCOUNT: Conta, login, senha, dados pessoais
- COMPLAINT: Reclamações, insatisfação, problemas
- COMPLIMENT: Elogios, feedback positivo
- EMERGENCY: Emergências médicas, problemas oculares urgentes
- GENERAL: Dúvidas gerais, informações variadas

NÍVEIS DE PRIORIDADE:
- CRITICAL: Emergências médicas, risco à visão, segurança
- URGENT: Pagamentos urgentes, entrega atrasada, cancelamento imediato
- HIGH: Reclamações sérias, problemas recorrentes, trocas urgentes
- MEDIUM: Dúvidas comuns, agendamentos, informações gerais
- LOW: Elogios, sugestões, curiosidades

MENSAGEM DO CLIENTE: "{message}"

HISTÓRICO RECENTE: {history}

DADOS DO CLIENTE: {customerData}

Forneça a análise no formato JSON:
{{
  "intent": "nome_da_intenção_específica",
  "category": "CATEGORIA",
  "priority": "PRIORIDADE",
  "confidence": 0.0,
  "escalationRequired": true/false,
  "entities": {{
    "sentiment": "positive/negative/neutral",
    "urgency": "low/medium/high/critical",
    "emotions": ["emoção1", "emoção2"],
    "keywords": ["palavra1", "palavra2"],
    "mentionedProducts": ["produto1"],
    "mentionedOrders": ["pedido1"],
    "urgencyIndicators": ["indicador1"]
  }},
  "suggestedActions": ["ação1", "ação2"],
  "responseStrategy": "automated/agent_required/escalation",
  "requiresImmediateAttention": true/false,
  "riskLevel": "low/medium/high/critical"
}}

Seja específico e preciso na classificação. Considere o contexto do cliente.
`

  // Response generation template for support
  private readonly SUPPORT_RESPONSE_TEMPLATE = `
Você é um assistente de atendimento ao cliente da SV Lentes, especializado em lentes de contato com supervisão do Dr. Philipe Saraiva Cruz (CRM-MG 69.870).

REGRAS DE ATENDIMENTO:
- Seja empático, profissional e claro
- Forneça informações precisas e úteis
- Priorize segurança e bem-estar do cliente
- Para emergências oculares, direcione imediatamente para atendimento médico
- Mantenha tom calmo e tranquilizador
- Use linguagem simples e acessível

INFORMAÇÕES DA EMPRESA:
- Clínica: Saraiva Vision - Caratinga/MG
- Responsável: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
- WhatsApp: (33) 99898-026
- Site: svlentes.shop

CONTEXTUALIZAÇÃO:
- Nome do cliente: {customerName}
- Tipo de cliente: {customerType}
- Status da assinatura: {subscriptionStatus}
- Histórico recente: {recentHistory}

INTENÇÃO DETECTADA: {intent}
CATEGORIA: {category}
PRIORIDADE: {priority}
SENTIMENTO: {sentiment}
URGÊNCIA: {urgency}

MENSAGEM ORIGINAL: "{originalMessage}"

CONHECIMENTO RELEVANTE: {knowledgeBase}

Instruções específicas baseadas na intenção:
{specificInstructions}

Forneça uma resposta que:
1. Responda diretamente à preocupação do cliente
2. Demonstre empatia e compreensão
3. Ofereça solução ou próximos passos claros
4. Inclua opções de resposta rápida quando apropriado
5. Identifique quando é necessário escalar para atendente humano

Resposta em português brasileiro, natural e conversacional.
`

  // Emergency detection template
  private readonly EMERGENCY_DETECTION_TEMPLATE = `
Analise a mensagem para detectar possíveis emergências oftalmológicas.

SINAIS DE EMERGÊNCIA:
- Dor intensa nos olhos
- Perda súbita de visão
- Visão borrada persistente
- Trauma ocular
- Sangramento nos olhos
- Sensibilidade extrema à luz
- Olhos vermelhos intensos
- Ferimentos nos olhos

MENSAGEM: "{message}"

Responda apenas com "EMERGENCY_TRUE" se houver sinais claros de emergência, ou "EMERGENCY_FALSE" caso contrário.
`

  // Escalation decision template
  private readonly ESCALATION_DECISION_TEMPLATE = `
Analise se esta interação requer escalonamento para atendente humano.

CRITÉRIOS DE ESCALONAMENTO:
- Cliente solicitou explicitamente falar com atendente
- Problema complexo não resolvido pelo chatbot
- Reclamação persistente ou insatisfação
- Situação de emergência
- Questões de segurança
- Operações financeiras complexas
- Cancelamento de serviço

MENSAGEM: "{message}"
INTENÇÃO: {intent}
PRIORIDADE: {priority}
TENTATIVAS ANTERIORES: {attempts}
HISTÓRICO DE CONVERSA: {conversationHistory}

Responda com "ESCALATE_TRUE" ou "ESCALATE_FALSE" e justifique em uma linha.
`

  private intentChain: RunnableSequence<any, SupportIntent>
  private responseChain: RunnableSequence<any, string>
  private emergencyChain: RunnableSequence<any, string>
  private escalationChain: RunnableSequence<any, string>

  constructor() {
    const langsmithConfig = getLangSmithConfig()
    
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.3,
      openAIApiKey: process.env.OPENAI_API_KEY,
      callbacks: langsmithConfig.tracingEnabled ? undefined : []
    })
    this.knowledgeBase = new SupportKnowledgeBase()
    this.initializeChains()
    
    logLangSmithStatus()
  }

  private initializeChains(): void {
    // Intent classification chain
    this.intentChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(this.SUPPORT_INTENT_TEMPLATE),
      this.llm,
      new StringOutputParser(),
      this.parseSupportIntent.bind(this)
    ])

    // Response generation chain
    this.responseChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(this.SUPPORT_RESPONSE_TEMPLATE),
      this.llm,
      new StringOutputParser()
    ])

    // Emergency detection chain
    this.emergencyChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(this.EMERGENCY_DETECTION_TEMPLATE),
      this.llm,
      new StringOutputParser()
    ])

    // Escalation decision chain
    this.escalationChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(this.ESCALATION_DECISION_TEMPLATE),
      this.llm,
      new StringOutputParser()
    ])
  }

  /**
   * Process customer support message
   */
  async processSupportMessage(
    message: string,
    context: SupportContext
  ): Promise<{
    intent: SupportIntent
    response: string
    quickReplies: string[]
    escalationRequired: boolean
    ticketCreated: boolean
    actions: string[]
  }> {
    const runConfig = getLangSmithRunConfig({
      userId: context.userProfile?.id,
      userName: context.userProfile?.name,
      hasSubscription: !!context.subscriptionInfo,
      messageLength: message.length,
      conversationLength: context.conversationHistory.length,
      tags: ['whatsapp-support', 'customer-service']
    })

    try {
      // Step 1: Check for emergency
      const emergencyCheck = await this.detectEmergency(message)
      if (emergencyCheck === 'EMERGENCY_TRUE') {
        return this.handleEmergencyResponse(context.userProfile?.name)
      }

      // Step 2: Classify intent
      const intent = await this.classifySupportIntent(message, context)

      // Step 3: Get relevant knowledge base entries
      const knowledgeBaseInfo = await this.getRelevantKnowledge(intent.category, message)

      // Step 4: Generate response
      const response = await this.generateSupportResponse(message, intent, context, knowledgeBaseInfo)

      // Step 5: Determine escalation needs
      const escalationDecision = await this.determineEscalation(message, intent, context)

      // Step 6: Create ticket if needed
      let ticketCreated = false
      if (this.shouldCreateTicket(intent, escalationDecision)) {
        await this.createSupportTicket(message, intent, context)
        ticketCreated = true
      }

      // Step 7: Generate quick replies
      const quickReplies = this.generateQuickReplies(intent, response)

      return {
        intent,
        response,
        quickReplies,
        escalationRequired: escalationDecision,
        ticketCreated,
        actions: intent.suggestedActions
      }
    } catch (error) {
      console.error('Error processing support message:', error)
      return this.handleErrorProcessing(context.userProfile?.name)
    }
  }

  /**
   * Classify support intent from message
   */
  private async classifySupportIntent(message: string, context: SupportContext): Promise<SupportIntent> {
    const history = context.conversationHistory.slice(-5).join(' | ')
    const customerData = this.formatCustomerData(context)

    const runConfig = getLangSmithRunConfig({
      step: 'intent-classification',
      tags: ['intent', 'classification', 'support']
    })

    const result = await this.intentChain.invoke({
      message,
      history,
      customerData
    }, runConfig)

    return result
  }

  /**
   * Parse intent analysis result
   */
  private async parseSupportIntent(result: string): Promise<SupportIntent> {
    try {
      const parsed = JSON.parse(result)
      return {
        name: parsed.intent || 'general_inquiry',
        confidence: parsed.confidence || 0.5,
        category: this.parseCategory(parsed.category),
        priority: this.parsePriority(parsed.priority),
        escalationRequired: parsed.escalationRequired || false,
        entities: {
          sentiment: parsed.entities?.sentiment || 'neutral',
          urgency: parsed.entities?.urgency || 'medium',
          emotions: parsed.entities?.emotions || [],
          keywords: parsed.entities?.keywords || []
        },
        suggestedActions: parsed.suggestedActions || [],
        responseStrategy: parsed.responseStrategy || 'automated'
      }
    } catch (error) {
      console.error('Error parsing support intent:', error)
      return {
        name: 'general_inquiry',
        confidence: 0.3,
        category: TicketCategory.GENERAL,
        priority: TicketPriority.MEDIUM,
        escalationRequired: false,
        entities: {
          sentiment: 'neutral',
          urgency: 'medium',
          emotions: [],
          keywords: []
        },
        suggestedActions: ['provide_information'],
        responseStrategy: 'automated'
      }
    }
  }

  /**
   * Detect emergency in message
   */
  private async detectEmergency(message: string): Promise<string> {
    try {
      const runConfig = getLangSmithRunConfig({
        step: 'emergency-detection',
        tags: ['emergency', 'safety', 'critical']
      })
      return await this.emergencyChain.invoke({ message }, runConfig)
    } catch (error) {
      console.error('Error detecting emergency:', error)
      return 'EMERGENCY_FALSE'
    }
  }

  /**
   * Handle emergency response
   */
  private handleEmergencyResponse(customerName?: string): any {
    const emergencyResponse = `⚠️ **EMERGÊNCIA OFTALMOLÓGICA DETECTADA** ⚠️

${customerName ? `Olá ${customerName},` : 'Olá,'}

Sua mensagem indica uma possível emergência oftalmológica. **NÃO ESPERE!**

🚨 **PROCURE ATENDIMENTO MÉDICO IMEDIATO:**
- Pronto-socorro oftalmológico mais próximo
- Hospital com serviço de oftalmologia

📞 **CONTATO DIRETO COM DR. PHILIPE:**
- WhatsApp: (33) 99898-026
- Disponível 24h para emergências

📍 **CLÍNICA SARAIVA VISION:**
- Caratinga/MG

Sua visão é prioridade absoluta. Não adie o atendimento médico!`

    return {
      intent: {
        name: 'emergency',
        confidence: 1.0,
        category: TicketCategory.EMERGENCY,
        priority: TicketPriority.CRITICAL,
        escalationRequired: true,
        entities: { sentiment: 'negative', urgency: 'critical', emotions: ['fear', 'pain'], keywords: [] },
        suggestedActions: ['emergency_contact', 'immediate_medical_attention'],
        responseStrategy: 'escalation'
      } as SupportIntent,
      response: emergencyResponse,
      quickReplies: ['Ligar para Dr. Philipe', 'Encontrar hospital próximo'],
      escalationRequired: true,
      ticketCreated: false,
      actions: ['emergency_alert']
    }
  }

  /**
   * Generate support response
   */
  private async generateSupportResponse(
    originalMessage: string,
    intent: SupportIntent,
    context: SupportContext,
    knowledgeBaseInfo: string
  ): Promise<string> {
    const customerName = context.userProfile?.name || 'Cliente'
    const customerType = context.subscriptionInfo ? 'Assinante' : 'Potencial cliente'
    const subscriptionStatus = context.subscriptionInfo?.status || 'Não aplicável'
    const recentHistory = context.previousTickets.slice(0, 3).map(t => t.subject).join(', ') || 'Nenhum'

    const specificInstructions = this.getSpecificInstructions(intent)

    const runConfig = getLangSmithRunConfig({
      step: 'response-generation',
      intent: intent.name,
      category: intent.category,
      priority: intent.priority,
      sentiment: intent.entities.sentiment,
      tags: ['response', 'generation', intent.category]
    })

    return await this.responseChain.invoke({
      customerName,
      customerType,
      subscriptionStatus,
      recentHistory,
      intent: intent.name,
      category: intent.category,
      priority: intent.priority,
      sentiment: intent.entities.sentiment,
      urgency: intent.entities.urgency,
      originalMessage,
      knowledgeBase: knowledgeBaseInfo,
      specificInstructions
    }, runConfig)
  }

  /**
   * Get specific instructions based on intent
   */
  private getSpecificInstructions(intent: SupportIntent): string {
    const instructions = {
      subscription_pause: 'Oferecer opções de pausa, explicar processo, confirmar data de retorno',
      subscription_cancel: 'Expressar empatia, tentar retenção, explicar processo de cancelamento',
      payment_failed: 'Verificar status, oferecer soluções, guiar para pagamento bem-sucedido',
      delivery_tracking: 'Solicitar informações de rastreamento, fornecer status atual',
      product_exchange: 'Explicar política de troca, coletar informações necessárias',
      appointment_scheduling: 'Verificar disponibilidade, oferecer datas, confirmar agendamento',
      emergency: 'ENFOQUE EM SEGURANÇA! Direcionar para atendimento médico imediato',
      complaint: 'Demonstrar empatia, ouvir atentamente, oferecer soluções',
      compliment: 'Agradecer, reforçar positividade, solicitar feedback'
    }

    return instructions[intent.name as keyof typeof instructions] || 'Fornecer informação clara e útil, oferecer ajuda adicional'
  }

  /**
   * Determine if escalation is needed
   */
  private async determineEscalation(
    message: string,
    intent: SupportIntent,
    context: SupportContext
  ): Promise<boolean> {
    if (intent.escalationRequired || intent.priority >= TicketPriority.HIGH) {
      return true
    }

    const conversationHistory = context.conversationHistory.slice(-10).join(' | ')
    const attempts = context.conversationHistory.length

    try {
      const runConfig = getLangSmithRunConfig({
        step: 'escalation-decision',
        intent: intent.name,
        priority: intent.priority,
        attempts,
        tags: ['escalation', 'decision', 'routing']
      })

      const decision = await this.escalationChain.invoke({
        message,
        intent: intent.name,
        priority: intent.priority,
        attempts,
        conversationHistory
      }, runConfig)

      return decision.includes('ESCALATE_TRUE')
    } catch (error) {
      console.error('Error determining escalation:', error)
      return intent.escalationRequired
    }
  }

  /**
   * Get relevant knowledge base entries
   */
  private async getRelevantKnowledge(category: TicketCategory, message: string): Promise<string> {
    try {
      const faqEntries = await this.knowledgeBase.searchFAQ(message, category)
      return faqEntries.slice(0, 3).map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n')
    } catch (error) {
      console.error('Error getting relevant knowledge:', error)
      return ''
    }
  }

  /**
   * Generate quick replies based on intent and response
   */
  private generateQuickReplies(intent: SupportIntent, response: string): string[] {
    const quickReplyMap = {
      subscription_pause: ['Pausar 30 dias', 'Pausar 60 dias', 'Cancelar pausa'],
      subscription_cancel: ['Cancelar assinatura', 'Falar com atendente', 'Reconsiderar'],
      payment_failed: ['Atualizar cartão', 'Pagar com PIX', 'Falar com atendente'],
      delivery_tracking: ['Rastrear pedido', 'Problemas na entrega', 'Falar com atendente'],
      product_exchange: ['Solicitar troca', 'Informações sobre produto', 'Falar com atendente'],
      appointment_scheduling: ['Agendar consulta', 'Ver disponibilidade', 'Cancelar agendamento'],
      general_inquiry: ['Falar com atendente', 'Ver produtos', 'Agendar consulta'],
      complaint: ['Falar com gerente', 'Registrar reclamação', 'Solicitar reembolso'],
      compliment: ['Avaliar serviço', 'Indicar amigos', 'Ver promoções']
    }

    return quickReplyMap[intent.name as keyof typeof quickReplyMap] || [
      'Falar com atendente',
      'Menu principal',
      'Ajuda adicional'
    ]
  }

  /**
   * Determine if ticket should be created
   */
  private shouldCreateTicket(intent: SupportIntent, escalationRequired: boolean): boolean {
    return (
      escalationRequired ||
      intent.priority >= TicketPriority.HIGH ||
      intent.responseStrategy !== 'automated' ||
      ['complaint', 'product_exchange', 'payment_failed', 'subscription_cancel'].includes(intent.name)
    )
  }

  /**
   * Create support ticket
   */
  private async createSupportTicket(message: string, intent: SupportIntent, context: SupportContext): Promise<void> {
    try {
      await supportTicketManager.createTicket({
        userId: context.userProfile?.id || 'unknown',
        customerInfo: {
          name: context.userProfile?.name || 'Cliente',
          email: context.userProfile?.email,
          phone: context.userProfile?.phone,
          whatsapp: context.userProfile?.whatsapp,
          subscriptionId: context.subscriptionInfo?.id,
          userId: context.userProfile?.id
        },
        subject: this.generateTicketSubject(intent),
        description: message,
        category: intent.category,
        priority: intent.priority,
        source: 'whatsapp',
        intent: intent.name,
        context: {
          previousMessages: context.conversationHistory,
          userHistory: context.userHistory,
          sentiment: intent.entities.sentiment,
          urgency: intent.entities.urgency
        },
        tags: [intent.name, intent.entities.sentiment, intent.priority.toString()]
      })
    } catch (error) {
      console.error('Error creating support ticket:', error)
    }
  }

  /**
   * Generate ticket subject
   */
  private generateTicketSubject(intent: SupportIntent): string {
    const subjectMap = {
      subscription_pause: 'Solicitação de pausa na assinatura',
      subscription_cancel: 'Solicitação de cancelamento',
      payment_failed: 'Problema com pagamento',
      delivery_tracking: 'Consulta sobre entrega',
      product_exchange: 'Solicitação de troca de produto',
      appointment_scheduling: 'Agendamento de consulta',
      emergency: 'EMERGÊNCIA OFTALMOLÓGICA',
      complaint: 'Reclamação de cliente',
      compliment: 'Elogio de cliente'
    }

    return subjectMap[intent.name as keyof typeof subjectMap] || 'Contato via WhatsApp'
  }

  /**
   * Handle error in processing
   */
  private handleErrorProcessing(customerName?: string): any {
    const fallbackResponse = `Olá ${customerName || 'cliente'}, tive uma dificuldade técnica. Um atendente humano já foi notificado para te ajudar melhor.`

    return {
      intent: {
        name: 'processing_error',
        confidence: 0.1,
        category: TicketCategory.TECHNICAL,
        priority: TicketPriority.MEDIUM,
        escalationRequired: true,
        entities: { sentiment: 'neutral', urgency: 'medium', emotions: [], keywords: [] },
        suggestedActions: ['human_agent'],
        responseStrategy: 'escalation'
      } as SupportIntent,
      response: fallbackResponse,
      quickReplies: ['Falar com atendente', 'Tentar novamente'],
      escalationRequired: true,
      ticketCreated: true,
      actions: ['escalate_to_human']
    }
  }

  // Helper methods
  private parseCategory(category: string): TicketCategory {
    const mapping: { [key: string]: TicketCategory } = {
      'BILLING': TicketCategory.BILLING,
      'TECHNICAL': TicketCategory.TECHNICAL,
      'PRODUCT': TicketCategory.PRODUCT,
      'DELIVERY': TicketCategory.DELIVERY,
      'ACCOUNT': TicketCategory.ACCOUNT,
      'COMPLAINT': TicketCategory.COMPLAINT,
      'COMPLIMENT': TicketCategory.COMPLIMENT,
      'EMERGENCY': TicketCategory.EMERGENCY,
      'GENERAL': TicketCategory.GENERAL
    }

    return mapping[category] || TicketCategory.GENERAL
  }

  private parsePriority(priority: string): TicketPriority {
    const mapping: { [key: string]: TicketPriority } = {
      'CRITICAL': TicketPriority.CRITICAL,
      'URGENT': TicketPriority.URGENT,
      'HIGH': TicketPriority.HIGH,
      'MEDIUM': TicketPriority.MEDIUM,
      'LOW': TicketPriority.LOW
    }

    return mapping[priority] || TicketPriority.MEDIUM
  }

  private formatCustomerData(context: SupportContext): string {
    const data = []
    if (context.userProfile?.name) data.push(`Nome: ${context.userProfile.name}`)
    if (context.userProfile?.subscriptionStatus) data.push(`Assinatura: ${context.userProfile.subscriptionStatus}`)
    if (context.previousTickets.length > 0) data.push(`Tickets anteriores: ${context.previousTickets.length}`)
    if (context.subscriptionInfo) data.push(`Plano: ${context.subscriptionInfo.planType}`)

    return data.join(' | ') || 'Novo cliente'
  }
}

// Singleton instance
export const langchainSupportProcessor = new LangChainSupportProcessor()