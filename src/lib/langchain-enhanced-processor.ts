/**
 * Enhanced LangChain Support Processor with Advanced Memory
 *
 * Improved version with:
 * - Better prompt templates
 * - Persistent memory integration
 * - Enhanced LangSmith logging
 * - Context-aware responses
 * - Real-time learning capabilities
 */

import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence, RunnableMap, RunnablePassthrough } from '@langchain/core/runnables'
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'
import { botMemory, ConversationSummary } from './langchain-memory'
import { getLangSmithConfig, getLangSmithRunConfig } from './langsmith-config'
import { logger, LogCategory } from './logger'
import { responseCache } from './response-cache'

// Enhanced type definitions
export interface EnhancedIntent {
  name: string
  confidence: number
  category: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  escalationRequired: boolean
  entities: {
    sentiment: 'positive' | 'negative' | 'neutral'
    urgency: 'low' | 'medium' | 'high' | 'critical'
    emotions: string[]
    keywords: string[]
    mentionedProducts?: string[]
    mentionedOrders?: string[]
    mentionedDates?: string[]
    mentionedAmounts?: string[]
  }
  suggestedActions: string[]
  responseStrategy: 'automated' | 'agent_required' | 'escalation'
  followUpRequired: boolean
  estimatedResolutionTime?: string
}

export interface EnhancedSupportContext {
  sessionId: string
  userId?: string
  userProfile: {
    id?: string
    name?: string
    email?: string
    phone: string
    whatsapp: string
    subscription?: {
      id: string
      planType: string
      status: string
      renewalDate: Date
      monthlyValue: number
    }
    subscriptionStatus: string
    preferences?: any
    previousInteractions: number
  }
  conversationHistory: string[]
  conversationSummary?: ConversationSummary
  previousTickets: Array<{
    id: string
    subject: string
    status: string
    category: string
    createdAt: Date
    resolution?: string
  }>
  systemState: {
    currentTime: Date
    businessHours: boolean
    emergencyContacts: boolean
    maintenanceMode: boolean
  }
}

export interface ProcessingResult {
  intent: EnhancedIntent
  response: string
  quickReplies: string[]
  escalationRequired: boolean
  ticketCreated: boolean
  actions: string[]
  followUpRequired: boolean
  memoryStored: boolean
  processingTime: number
  tokensUsed?: number
  estimatedCost?: number
  confidence: number
}

/**
 * Enhanced validation schemas
 */
const IntentSchema = z.object({
  intent: z.string(),
  category: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']),
  confidence: z.number().min(0).max(1),
  escalationRequired: z.boolean(),
  entities: z.object({
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    urgency: z.enum(['low', 'medium', 'high', 'critical']),
    emotions: z.array(z.string()),
    keywords: z.array(z.string()),
    mentionedProducts: z.array(z.string()).optional(),
    mentionedOrders: z.array(z.string()).optional(),
    mentionedDates: z.array(z.string()).optional(),
    mentionedAmounts: z.array(z.string()).optional()
  }),
  suggestedActions: z.array(z.string()),
  responseStrategy: z.enum(['automated', 'agent_required', 'escalation']),
  followUpRequired: z.boolean(),
  estimatedResolutionTime: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional()
})

/**
 * Enhanced LangChain Processor with Memory Integration
 */
export class EnhancedLangChainProcessor {
  private llm: ChatOpenAI
  private memory: typeof botMemory
  private langsmithConfig: any

  // Enhanced prompt templates
  private readonly ENHANCED_INTENT_TEMPLATE = `
Você é um assistente de IA avançado da SV Lentes, especializado em atendimento oftalmológico.

CONTEXTUALIZAÇÃO COMPLETA:
- Data/Hora: {currentTime}
- Horário de atendimento: {businessHours}
- Cliente: {customerName}
- Status: {customerStatus}
- Telefone: {customerPhone}
- Plano: {subscriptionPlan}
- Interações anteriores: {previousInteractions}
- Resumo da conversa: {conversationSummary}

HISTÓRICO RECENTE:
{conversationHistory}

TICKETS ANTERIORES:
{previousTickets}

MENSAGEM ATUAL: "{userMessage}"

ANALISE E CLASSIFIQUE:

1. INTENÇÃO PRINCIPAL (seja específico):
   - subscription_pause, subscription_cancel, subscription_reactivate
   - payment_failed, payment_method_update, billing_inquiry
   - delivery_tracking, delivery_delay, delivery_issues
   - product_info, product_exchange, product_quality
   - appointment_schedule, appointment_reschedule, appointment_cancel
   - technical_support, website_issues, app_problems
   - emergency_medical, urgent_eye_problem
   - general_inquiry, compliment, complaint

2. CATEGORIA:
   - SUBSCRIPTION, BILLING, DELIVERY, PRODUCT, TECHNICAL, EMERGENCY, GENERAL

3. PRIORIDADE:
   - CRITICAL: Emergências médicas, risco à visão
   - URGENT: Pagamentos urgentes, entrega atrasada
   - HIGH: Reclamações, problemas técnicos
   - MEDIUM: Dúvidas comuns, agendamentos
   - LOW: Elogios, informações gerais

4. ENTIDADES EXTRAÍDAS:
   - Sentimento: positive/negative/neutral
   - Urgência: low/medium/high/critical
   - Emoções detectadas
   - Palavras-chave importantes
   - Produtos mencionados
   - Pedidos mencionados
   - Datas mencionadas
   - Valores mencionados

5. ANÁLISE DE RISCO:
   - Nível de risco: low/medium/high/critical
   - Possibilidade de escalonamento
   - Requerimento de acompanhamento

Forneça a análise em formato JSON válido:
{intent_analysis_schema}

Considere o contexto completo do cliente e histórico de interações.
`

  private readonly ENHANCED_RESPONSE_TEMPLATE = `
Você é um assistente inteligente da SV Lentes, especializado em lentes de contato oftalmológicas.

INFORMAÇÕES DA CLÍNICA:
- Clínica: Saraiva Vision - Caratinga/MG
- Responsável: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
- WhatsApp: (33) 98606-1427 (atendimento humano)
- WhatsApp Chatbot: (33) 99989-8026 (automático)
- E-mail: contato@svlentes.com.br
- Site: svlentes.com.br
- Endereço: Rua Catarina Maria Passos, 97 - Santa Zita

PERFIL DO CLIENTE:
- Nome: {customerName}
- Status: {customerStatus}
- Plano: {subscriptionPlan}
- Telefone: {customerPhone}
- Interações anteriores: {previousInteractions}

CONTEXTO DA CONVERSA:
- Resumo anterior: {conversationSummary}
- Histórico recente: {conversationHistory}
- Tickets anteriores: {previousTickets}

INTENÇÃO DETECTADA:
- Tipo: {intentType}
- Categoria: {intentCategory}
- Prioridade: {intentPriority}
- Confiança: {intentConfidence}
- Sentimento: {sentiment}
- Urgência: {urgency}

MENSAGEM DO CLIENTE: "{userMessage}"

INSTRUÇÕES ESPECÍFICAS:
{specificInstructions}

REGRAS DE RESPOSTA:
1. **Personalização**: Use o nome do cliente e referências a conversas anteriores
2. **Empatia**: Demonstre compreensão do sentimento e urgência
3. **Precisão**: Forneça informações exatas e úteis
4. **Segurança**: Priorize saúde e bem-estar ocular
5. ** Clareza**: Seja objetivo e fácil de entender
6. **Proatividade**: Antecipe próximas perguntas necessárias

ESTRUTURA DA RESPOSTA:
- Saudação personalizada
- Reconhecimento da necessidade
- Solução ou próximos passos
- Opções de resposta rápida
- Informações de contato se necessário

Gere uma resposta natural, empática e eficaz em português brasileiro.
`

  private readonly EMERGENCY_DETECTION_TEMPLATE = `
ANÁLISE DE EMERGÊNCIA OFTALMOLÓGICA

SINAIS CRÍTICOS:
- Dor intensa ou súbita nos olhos
- Perda parcial ou total de visão
- Visão dupla persistente
- Sangramento ocular
- Trauma ou ferimento nos olhos
- Sensibilidade extrema à luz
- Olhos vermelhos intensos
- Visão borrada repentina
- Flashes ou moscas volantes
- Sensação de corpo estranho

MENSAGEM: "{userMessage}"
CONTEXTO: {customerContext}

ANALISE E RESPONDA APENAS COM:
EMERGENCY_TRUE (se houver sinais claros de emergência)
OU
EMERGENCY_FALSE (se não houver emergência)

Priorize a segurança do paciente acima de tudo.
`

  private readonly CONTEXT_SUMMARY_TEMPLATE = `
CRIE UM RESUMO DA CONVERSA ANTERIOR:

CONTEXTO:
- Cliente: {customerName}
- Status: {customerStatus}
- Total de interações: {totalInteractions}

MENSAGENS ANTERIORES:
{previousMessages}

INSTRUÇÕES:
1. Extraia os tópicos principais discutidos
2. Identifique o sentimento geral
3. Liste ações pendentes
4. Identifique se há necessidade de acompanhamento
5. Crie um resumo conciso (máximo 200 caracteres)

FORNEÇA EM FORMATO JSON:
{{
  "summary": "Resumo conciso da conversa",
  "keyTopics": ["tópico1", "tópico2"],
  "sentiment": "positive/negative/neutral",
  "actionItems": ["ação1", "ação2"],
  "followUpRequired": true/false,
  "resolution": "resolved/ongoing/escalated"
}}
`

  // Processing chains
  private intentChain: RunnableSequence<any, EnhancedIntent>
  private responseChain: RunnableSequence<any, string>
  private emergencyChain: RunnableSequence<any, string>
  private summaryChain: RunnableSequence<any, any>

  constructor() {
    // Validate OpenAI configuration
    const openAIApiKey = process.env.OPENAI_API_KEY
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured. Required: OPENAI_API_KEY')
    }

    this.langsmithConfig = getLangSmithConfig()
    this.memory = botMemory

    // Initialize LLM with advanced configuration
    this.llm = new ChatOpenAI({
      modelName: 'gpt-5-mini',
      temperature: 0.3, // Lower for more consistent responses
      openAIApiKey,
      maxTokens: 1000, // Limit for cost control
      timeout: 30000, // 30 seconds timeout
      callbacks: this.langsmithConfig.tracingEnabled ? undefined : []
    })

    this.initializeChains()
  }

  private initializeChains(): void {
    // Intent classification chain with enhanced schema
    this.intentChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(this.ENHANCED_INTENT_TEMPLATE),
      this.llm,
      new StringOutputParser(),
      this.parseEnhancedIntent.bind(this)
    ])

    // Response generation chain
    this.responseChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(this.ENHANCED_RESPONSE_TEMPLATE),
      this.llm,
      new StringOutputParser()
    ])

    // Emergency detection chain
    this.emergencyChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(this.EMERGENCY_DETECTION_TEMPLATE),
      this.llm,
      new StringOutputParser()
    ])

    // Context summary chain
    this.summaryChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(this.CONTEXT_SUMMARY_TEMPLATE),
      this.llm,
      new StringOutputParser(),
      this.parseSummary.bind(this)
    ])
  }

  /**
   * Main processing method with full memory integration
   */
  async processMessage(
    userMessage: string,
    context: EnhancedSupportContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now()
    const sessionId = context.sessionId

    try {
      logger.info(LogCategory.WHATSAPP, 'Starting enhanced message processing', {
        sessionId,
        userId: context.userId,
        messageLength: userMessage.length,
        hasHistory: context.conversationHistory.length > 0,
        hasSummary: !!context.conversationSummary
      })

      // Step 1: Check cache first
      const cacheKey = this.generateCacheKey(userMessage, context)
      const cachedResponse = responseCache.get(userMessage, context)

      if (cachedResponse) {
        logger.debug(LogCategory.WHATSAPP, 'Cache hit for message', {
          sessionId,
          intent: cachedResponse.intent,
          confidence: cachedResponse.confidence
        })

        return {
          intent: this.parseCachedIntent(cachedResponse),
          response: cachedResponse.response,
          quickReplies: cachedResponse.quickReplies,
          escalationRequired: false,
          ticketCreated: false,
          actions: [],
          followUpRequired: false,
          memoryStored: false,
          processingTime: Date.now() - startTime,
          confidence: cachedResponse.confidence
        }
      }

      // Step 2: Emergency detection (always first)
      const isEmergency = await this.detectEmergency(userMessage, context)
      if (isEmergency) {
        const emergencyResult = await this.handleEmergency(context)
        await this.memory.saveInteraction(sessionId, userMessage, emergencyResult.response, {
          intent: 'emergency_medical',
          sentiment: 'negative',
          urgency: 'critical',
          confidence: 1.0,
          escalationRequired: true,
          ticketCreated: false,
          responseTime: Date.now() - startTime,
          llmModel: 'gpt-5-mini'
        })

        return {
          ...emergencyResult,
          memoryStored: true,
          processingTime: Date.now() - startTime,
          tokensUsed: this.estimateTokens(userMessage + emergencyResult.response),
          estimatedCost: this.estimateCost(userMessage + emergencyResult.response),
          confidence: 1.0
        }
      }

      // Step 3: Enhanced intent classification
      const intent = await this.classifyEnhancedIntent(userMessage, context)

      // Step 4: Generate contextual response
      const response = await this.generateEnhancedResponse(userMessage, intent, context)

      // Step 5: Generate quick replies
      const quickReplies = this.generateEnhancedQuickReplies(intent, response)

      // Step 6: Determine follow-up requirements
      const followUpRequired = this.determineFollowUpRequired(intent, response)

      // Step 7: Store in memory with full metadata
      await this.memory.saveInteraction(sessionId, userMessage, response, {
        intent: intent.name,
        sentiment: intent.entities.sentiment,
        urgency: intent.entities.urgency,
        confidence: intent.confidence,
        escalationRequired: intent.escalationRequired,
        ticketCreated: false,
        responseTime: Date.now() - startTime,
        llmModel: 'gpt-5-mini',
        tokensUsed: this.estimateTokens(userMessage + response),
        cost: this.estimateCost(userMessage + response)
      })

      // Step 8: Cache appropriate responses
      if (this.shouldCacheResponse(intent, response)) {
        responseCache.set(
          userMessage,
          response,
          intent.name,
          intent.confidence,
          quickReplies,
          context,
          [intent.category, intent.responseStrategy]
        )
      }

      const processingTime = Date.now() - startTime

      logger.info(LogCategory.WHATSAPP, 'Message processed successfully', {
        sessionId,
        intent: intent.name,
        confidence: intent.confidence,
        processingTime,
        tokensUsed: this.estimateTokens(userMessage + response)
      })

      return {
        intent,
        response,
        quickReplies,
        escalationRequired: intent.escalationRequired,
        ticketCreated: false,
        actions: intent.suggestedActions,
        followUpRequired,
        memoryStored: true,
        processingTime,
        tokensUsed: this.estimateTokens(userMessage + response),
        estimatedCost: this.estimateCost(userMessage + response),
        confidence: intent.confidence
      }

    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error processing message', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown',
        processingTime: Date.now() - startTime
      })

      return {
        intent: {
          name: 'processing_error',
          confidence: 0.1,
          category: 'TECHNICAL',
          priority: 'MEDIUM',
          escalationRequired: true,
          entities: {
            sentiment: 'neutral',
            urgency: 'medium',
            emotions: [],
            keywords: []
          },
          suggestedActions: ['contact_support'],
          responseStrategy: 'escalation',
          followUpRequired: true
        },
        response: this.generateErrorResponse(context.userProfile.name),
        quickReplies: ['Falar com atendente', 'Tentar novamente'],
        escalationRequired: true,
        ticketCreated: true,
        actions: ['escalate_to_human'],
        followUpRequired: true,
        memoryStored: false,
        processingTime: Date.now() - startTime,
        confidence: 0.1
      }
    }
  }

  /**
   * Enhanced intent classification with full context
   */
  private async classifyEnhancedIntent(
    userMessage: string,
    context: EnhancedSupportContext
  ): Promise<EnhancedIntent> {
    const runConfig = getLangSmithRunConfig({
      sessionId: context.sessionId,
      userId: context.userId,
      step: 'enhanced-intent-classification',
      tags: ['intent', 'classification', 'enhanced']
    })

    const promptData = {
      currentTime: context.systemState.currentTime.toISOString(),
      businessHours: context.systemState.businessHours,
      customerName: context.userProfile.name || 'Cliente',
      customerStatus: context.userProfile.subscriptionStatus,
      customerPhone: context.userProfile.phone,
      subscriptionPlan: context.userProfile.subscription?.planType || 'N/A',
      previousInteractions: context.userProfile.previousInteractions,
      conversationSummary: context.conversationSummary?.summary || 'Nenhuma',
      conversationHistory: context.conversationHistory.slice(-5).join('\n'),
      previousTickets: context.previousTickets.map(t => `- ${t.subject} (${t.status})`).join('\n'),
      userMessage,
      intent_analysis_schema: JSON.stringify(IntentSchema.shape, null, 2)
    }

    const result = await this.intentChain.invoke(promptData, runConfig)

    logger.debug(LogCategory.WHATSAPP, 'Intent classified', {
      sessionId: context.sessionId,
      intent: result.name,
      confidence: result.confidence,
      category: result.category
    })

    return result
  }

  /**
   * Parse enhanced intent from LLM response
   */
  private async parseEnhancedIntent(result: string): Promise<EnhancedIntent> {
    try {
      // Clean up the response
      const cleanedResult = result
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()

      const parsed = JSON.parse(cleanedResult)

      // Validate with schema
      const validated = IntentSchema.parse(parsed)

      return {
        ...validated,
        name: validated.intent,
        category: validated.category,
        priority: validated.priority,
        suggestedActions: validated.suggestedActions,
        responseStrategy: validated.responseStrategy,
        followUpRequired: validated.followUpRequired,
        estimatedResolutionTime: validated.estimatedResolutionTime
      }
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error parsing enhanced intent', {
        error: error instanceof Error ? error.message : 'Unknown',
        result: result.substring(0, 200)
      })

      // Return fallback intent
      return {
        name: 'general_inquiry',
        confidence: 0.3,
        category: 'GENERAL',
        priority: 'MEDIUM',
        escalationRequired: false,
        entities: {
          sentiment: 'neutral',
          urgency: 'medium',
          emotions: [],
          keywords: []
        },
        suggestedActions: ['provide_information'],
        responseStrategy: 'automated',
        followUpRequired: false
      }
    }
  }

  /**
   * Generate enhanced contextual response
   */
  private async generateEnhancedResponse(
    userMessage: string,
    intent: EnhancedIntent,
    context: EnhancedSupportContext
  ): Promise<string> {
    const runConfig = getLangSmithRunConfig({
      sessionId: context.sessionId,
      userId: context.userId,
      step: 'enhanced-response-generation',
      intent: intent.name,
      category: intent.category,
      tags: ['response', 'generation', 'enhanced']
    })

    const specificInstructions = this.getSpecificInstructions(intent)

    const promptData = {
      customerName: context.userProfile.name || 'Cliente',
      customerStatus: context.userProfile.subscriptionStatus,
      subscriptionPlan: context.userProfile.subscription?.planType || 'N/A',
      customerPhone: context.userProfile.phone,
      previousInteractions: context.userProfile.previousInteractions,
      conversationSummary: context.conversationSummary?.summary || 'Primeira vez',
      conversationHistory: context.conversationHistory.slice(-3).join('\n'),
      previousTickets: context.previousTickets.slice(0, 3).map(t => `- ${t.subject}`).join('\n'),
      intentType: intent.name,
      intentCategory: intent.category,
      intentPriority: intent.priority,
      intentConfidence: intent.confidence,
      sentiment: intent.entities.sentiment,
      urgency: intent.entities.urgency,
      userMessage,
      specificInstructions
    }

    const response = await this.responseChain.invoke(promptData, runConfig)

    logger.debug(LogCategory.WHATSAPP, 'Response generated', {
      sessionId: context.sessionId,
      intent: intent.name,
      responseLength: response.length
    })

    return response
  }

  /**
   * Get specific instructions based on intent
   */
  private getSpecificInstructions(intent: EnhancedIntent): string {
    const instructions = {
      subscription_pause: 'Oferecer opções de pausa (30, 60 dias), explicar processo, confirmar data de retorno automático',
      subscription_cancel: 'Expressar empatia, tentar retenção com benefícios, explicar processo claro',
      payment_failed: 'Verificar status atual, oferecer múltiplas opções de pagamento, guiar passo a passo',
      delivery_tracking: 'Solicitar código de rastreamento, fornecer status atual e previsão',
      product_exchange: 'Explicar política clara, coletar informações necessárias, informar prazos',
      appointment_schedule: 'Verificar disponibilidade em tempo real, oferecer múltiplas opções',
      emergency_medical: 'ENFOQUE MÁXIMO EM SEGURANÇA! Direcionar para atendimento imediato',
      technical_support: 'Coletar detalhes do problema, oferecer soluções step-by-step',
      general_inquiry: 'Fornecer informações claras, oferecer ajuda adicional',
      complaint: 'Demonstrar empatia genuína, ouvir atentamente, oferecer soluções concretas',
      compliment: 'Agradecer sinceramente, reforçar positividade, solicitar feedback'
    }

    return instructions[intent.name as keyof typeof instructions] ||
           'Fornecer informação clara e útil, oferecer ajuda adicional quando apropriado'
  }

  /**
   * Generate enhanced quick replies based on intent
   */
  private generateEnhancedQuickReplies(intent: EnhancedIntent, response: string): string[] {
    const quickReplyMap = {
      subscription_pause: ['Pausar 30 dias', 'Pausar 60 dias', 'Cancelar pausa', 'Falar com atendente'],
      subscription_cancel: ['Manter assinatura', 'Cancelar assinatura', 'Ofertas especiais', 'Falar com gerente'],
      subscription_reactivate: ['Reativar agora', 'Escolher novo plano', 'Falar com atendente'],
      payment_failed: ['Pagar com PIX', 'Atualizar cartão', 'Gerar novo boleto', 'Ajuda com pagamento'],
      delivery_tracking: ['Rastrear pedido', 'Problemas na entrega', 'Alterar endereço', 'Contatar transportadora'],
      product_exchange: ['Solicitar troca', 'Informações sobre produto', 'Política de troca', 'Falar com especialista'],
      appointment_schedule: ['Agendar consulta', 'Ver horários', 'Cancelar agendamento', 'Consulta online'],
      emergency_medical: ['Ligar para emergência', 'Encontrar hospital', 'Falar com Dr. Philipe'],
      technical_support: ['Acesso ao site', 'App não funciona', 'Recuperar senha', 'Chat técnico'],
      general_inquiry: ['Ver produtos', 'Falar com atendente', 'Agendar consulta', 'Informações gerais'],
      complaint: ['Falar com gerente', 'Registrar reclamação', 'Solução imediata', 'Reembolso'],
      compliment: ['Avaliar serviço', 'Indicar amigos', 'Ver promoções', 'Deixar depoimento']
    }

    return quickReplyMap[intent.name as keyof typeof quickReplyMap] || [
      'Falar com atendente',
      'Menu principal',
      'Ajuda adicional'
    ]
  }

  /**
   * Emergency detection with enhanced context
   */
  private async detectEmergency(userMessage: string, context: EnhancedSupportContext): Promise<boolean> {
    try {
      const runConfig = getLangSmithRunConfig({
        sessionId: context.sessionId,
        step: 'emergency-detection',
        tags: ['emergency', 'safety', 'critical']
      })

      const customerContext = `${context.userProfile.name} (${context.userProfile.subscriptionStatus})`

      const result = await this.emergencyChain.invoke({
        userMessage,
        customerContext
      }, runConfig)

      return result === 'EMERGENCY_TRUE'
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error in emergency detection', {
        sessionId: context.sessionId,
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return false
    }
  }

  /**
   * Handle emergency response
   */
  private async handleEmergency(context: EnhancedSupportContext): Promise<Partial<ProcessingResult>> {
    const emergencyResponse = `⚠️ **EMERGÊNCIA OFTALMOLÓGICA DETECTADA** ⚠️

${context.userProfile.name ? `Olá ${context.userProfile.name},` : 'Olá,'}

Sua mensagem indica uma possível emergência oftalmológica. **NÃO ESPERE!**

🚨 **PROCURE ATENDIMENTO MÉDICO IMEDIATO:**
- Pronto-socorro oftalmológico mais próximo
- Hospital com serviço de oftalmologia
- Oftalmologista de plantão

📞 **CONTATO DIRETO SARAIVA VISION:**
- Dr. Philipe Saraiva Cruz: (33) 98606-1427
- WhatsApp para emergências: (33) 98606-1427
- Disponível 24/7 para emergências

📍 **CLÍNICA:**
- Saraiva Vision - Caratinga/MG
- Rua Catarina Maria Passos, 97 - Santa Zita

Sua visão é prioridade absoluta. Não adie o atendimento médico!`

    return {
      intent: {
        name: 'emergency_medical',
        confidence: 1.0,
        category: 'EMERGENCY',
        priority: 'CRITICAL',
        escalationRequired: true,
        entities: {
          sentiment: 'negative',
          urgency: 'critical',
          emotions: ['fear', 'pain', 'anxiety'],
          keywords: ['emergência', 'urgência', 'olhos']
        },
        suggestedActions: ['emergency_contact', 'immediate_medical_attention'],
        responseStrategy: 'escalation',
        followUpRequired: true
      } as EnhancedIntent,
      response: emergencyResponse,
      quickReplies: ['Ligar para Dr. Philipe', 'Encontrar hospital próximo', 'Continuar no chatbot'],
      escalationRequired: true,
      ticketCreated: true,
      actions: ['emergency_alert', 'contact_doctor'],
      followUpRequired: true
    }
  }

  /**
   * Determine if follow-up is required
   */
  private determineFollowUpRequired(intent: EnhancedIntent, response: string): boolean {
    return (
      intent.followUpRequired ||
      intent.escalationRequired ||
      intent.priority === 'CRITICAL' ||
      intent.priority === 'URGENT' ||
      ['subscription_cancel', 'product_exchange', 'complaint'].includes(intent.name)
    )
  }

  /**
   * Generate error response
   */
  private generateErrorResponse(customerName?: string): string {
    return `Olá ${customerName || 'cliente'},

Tive uma dificuldade técnica para processar sua mensagem. Um atendente humano já foi notificado e irá te ajudar em breve.

Enquanto isso, você pode:
- Tentar enviar a mensagem novamente
- Nos ligar: (33) 98606-1427
- Acessar sua área do assinante: svlentes.shop/area-assinante

Pedimos desculpas pelo inconveniente.`
  }

  /**
   * Utility methods
   */
  private generateCacheKey(message: string, context: EnhancedSupportContext): string {
    const normalizedMessage = message.toLowerCase().trim()
    const contextHash = context.userId || context.userProfile.phone
    return `${normalizedMessage}:${contextHash}`
  }

  private parseCachedIntent(cached: any): EnhancedIntent {
    return {
      name: cached.intent,
      confidence: cached.confidence,
      category: 'GENERAL',
      priority: 'MEDIUM',
      escalationRequired: false,
      entities: {
        sentiment: 'neutral',
        urgency: 'medium',
        emotions: [],
        keywords: []
      },
      suggestedActions: [],
      responseStrategy: 'automated',
      followUpRequired: false
    }
  }

  private shouldCacheResponse(intent: EnhancedIntent, response: string): boolean {
    return (
      intent.confidence > 0.8 &&
      !intent.escalationRequired &&
      response.length > 50 &&
      response.length < 800 &&
      !['emergency_medical', 'complaint'].includes(intent.name)
    )
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }

  private estimateCost(text: string): number {
    // GPT-4 Turbo pricing: ~$0.01 per 1K tokens (input), $0.03 per 1K tokens (output)
    const tokens = this.estimateTokens(text)
    return (tokens / 1000) * 0.02 // Average input/output cost
  }

  private async parseSummary(result: string): Promise<any> {
    try {
      const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      return JSON.parse(cleaned)
    } catch (error) {
      return null
    }
  }

  /**
   * Get processing statistics
   */
  async getStats(): Promise<any> {
    const memoryStats = await this.memory.getStats()
    const langsmithEnabled = this.langsmithConfig.tracingEnabled

    return {
      langsmith: {
        enabled: langsmithEnabled,
        project: this.langsmithConfig.projectName,
        endpoint: this.langsmithConfig.endpoint
      },
      memory: memoryStats,
      llm: {
        model: 'gpt-5-mini',
        temperature: 0.3,
        maxTokens: 1000
      }
    }
  }
}

// Export singleton instance
export const enhancedLangChainProcessor = new EnhancedLangChainProcessor()