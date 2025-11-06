/**
 * Simplified Enhanced LangChain Processor
 *
 * A more practical implementation that focuses on core functionality
 * while maintaining LangSmith integration and improved capabilities
 */
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { z } from 'zod'
import { getLangSmithConfig, getLangSmithRunConfig } from './langsmith-config'
import { logger, LogCategory } from './logger'
import { responseCache } from './response-cache'

export interface SimpleLangChainProcessorContract {
  processMessage(userMessage: string, context: SimpleContext): Promise<SimpleProcessingResult>
  getStats(): Promise<any>
}

export interface SimpleIntent {
  name: string
  confidence: number
  category: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  escalationRequired: boolean
  sentiment: 'positive' | 'negative' | 'neutral'
  urgency: 'low' | 'medium' | 'high' | 'critical'
  suggestedActions: string[]
  responseStrategy: 'automated' | 'agent_required' | 'escalation'
}
export interface SimpleContext {
  sessionId: string
  userId?: string
  userProfile: {
    name?: string
    phone: string
    subscriptionStatus: string
    subscription?: {
      planType: string
      status: string
      renewalDate: Date
      monthlyValue: number
    }
  }
  conversationHistory: string[]
  systemState: {
    currentTime: Date
    businessHours: boolean
    emergencyContacts: boolean
  }
}
export interface SimpleProcessingResult {
  intent: SimpleIntent
  response: string
  quickReplies: string[]
  escalationRequired: boolean
  ticketCreated: boolean
  actions: string[]
  processingTime: number
  tokensUsed?: number
  estimatedCost?: number
  confidence: number
}
/**
 * Simplified validation schema
 */
const SimpleIntentSchema = z.object({
  intent: z.string(),
  category: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']),
  confidence: z.number().min(0).max(1),
  escalationRequired: z.boolean(),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  suggestedActions: z.array(z.string()),
  responseStrategy: z.enum(['automated', 'agent_required', 'escalation'])
})
/**
 * Simplified but powerful LangChain processor
 */
export class SimpleLangChainProcessor implements SimpleLangChainProcessorContract {
  private llm: ChatOpenAI
  private langsmithConfig: any
  // Simplified but effective templates
  private readonly SIMPLE_INTENT_TEMPLATE = `
Você é um assistente inteligente da SV Lentes para WhatsApp.
CONTEXTO DO CLIENTE:
- Nome: {customerName}
- Status: {customerStatus}
- Telefone: {customerPhone}
- Plano: {subscriptionPlan}
- Horário de atendimento: {businessHours}
- Data/Hora: {currentTime}
HISTÓRICO RECENTE:
{conversationHistory}
MENSAGEM ATUAL: "{userMessage}"
CLASSIFIQUE A INTENÇÃO:
CATEGORIAS PRINCIPAIS:
- subscription_pause, subscription_cancel, subscription_reactivate
- payment_failed, payment_method_update, billing_inquiry
- delivery_tracking, delivery_delay, delivery_issues
- product_info, product_exchange, product_quality
- appointment_schedule, appointment_reschedule
- technical_support, website_issues
- emergency_medical, urgent_eye_problem
- general_inquiry, compliment, complaint
PRIORIDADES:
- CRITICAL: Emergências médicas, risco à visão
- URGENT: Pagamentos urgentes, entrega atrasada
- HIGH: Reclamações, problemas técnicos
- MEDIUM: Dúvidas comuns, agendamentos
- LOW: Elogios, informações gerais
Forneça análise em JSON válido:
{
  "intent": "nome_da_intenção",
  "category": "CATEGORIA",
  "priority": "PRIORIDADE",
  "confidence": 0.9,
  "escalationRequired": false,
  "sentiment": "positive/negative/neutral",
  "urgency": "low/medium/high/critical",
  "suggestedActions": ["ação1", "ação2"],
  "responseStrategy": "automated"
}
Seja específico e considere o contexto completo do cliente.
`
  private readonly SIMPLE_RESPONSE_TEMPLATE = `
Você é um assistente prestativo da SV Lentes.
INFORMAÇÕES DA CLÍNICA:
- Clínica: Saraiva Vision - Caratinga/MG
- Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
- WhatsApp: (33) 98606-1427
- E-mail: contato@svlentes.com.br
- Site: svlentes.com.br
CLIENTE:
- Nome: {customerName}
- Status: {customerStatus}
- Plano: {subscriptionPlan}
CONTEXTO:
- Histórico recente: {conversationHistory}
- Intenção detectada: {intent}
- Sentimento: {sentiment}
- Urgência: {urgency}
MENSAGEM: "{userMessage}"
INSTRUÇÕES:
1. Use o nome do cliente se disponível
2. Seja empático e profissional
3. Forneça informações claras e úteis
4. Para emergências médicas, priorize segurança
5. Ofereça próximos passos claros
6. Inclua contato se necessário
Resposta em português brasileiro, natural e prestativa.
`
  private readonly EMERGENCY_TEMPLATE = `
Detectar emergências oftalmológicas.
SINAIS DE EMERGÊNCIA:
- Dor intensa nos olhos
- Perda súbita de visão
- Visão borrada persistente
- Trauma ocular
- Sangramento ocular
- Sensibilidade extrema à luz
- Olhos vermelhos intensos
MENSAGEM: "{userMessage}"
Responda apenas com:
EMERGENCY_TRUE ou EMERGENCY_FALSE
`
  // Processing chains
  private intentChain: RunnableSequence<any, SimpleIntent>
  private responseChain: RunnableSequence<any, string>
  private emergencyChain: RunnableSequence<any, string>
  constructor() {
    // Validate configuration
    const openAIApiKey = process.env.OPENAI_API_KEY
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured. Required: OPENAI_API_KEY')
    }
    this.langsmithConfig = getLangSmithConfig()
    // Initialize LLM
    this.llm = new ChatOpenAI({
      modelName: 'gpt-5-mini',
      temperature: 0.3,
      openAIApiKey,
      maxTokens: 800,
      timeout: 30000,
      callbacks: this.langsmithConfig.tracingEnabled ? undefined : []
    })
    this.initializeChains()
  }
  private initializeChains(): void {
    // Intent classification chain
    this.intentChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(this.SIMPLE_INTENT_TEMPLATE),
      this.llm,
      new StringOutputParser(),
      this.parseSimpleIntent.bind(this)
    ])
    // Response generation chain
    this.responseChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(this.SIMPLE_RESPONSE_TEMPLATE),
      this.llm,
      new StringOutputParser()
    ])
    // Emergency detection chain
    this.emergencyChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(this.EMERGENCY_TEMPLATE),
      this.llm,
      new StringOutputParser()
    ])
  }
  /**
   * Main processing method
   */
  async processMessage(
    userMessage: string,
    context: SimpleContext
  ): Promise<SimpleProcessingResult> {
    const startTime = Date.now()
    try {
      logger.info(LogCategory.WHATSAPP, 'Starting simple enhanced processing', {
        sessionId: context.sessionId,
        userId: context.userId,
        messageLength: userMessage.length
      })
      // Step 1: Check cache
      const cachedResponse = responseCache.get(userMessage, context)
      if (cachedResponse) {
        return {
          intent: this.parseCachedIntent(cachedResponse),
          response: cachedResponse.response,
          quickReplies: cachedResponse.quickReplies,
          escalationRequired: false,
          ticketCreated: false,
          actions: [],
          processingTime: Date.now() - startTime,
          confidence: cachedResponse.confidence
        }
      }
      // Step 2: Emergency detection
      const isEmergency = await this.detectEmergency(userMessage)
      if (isEmergency) {
        const emergencyResult = this.handleEmergency(context.userProfile.name)
        return {
          intent: emergencyResult.intent as SimpleIntent,
          response: emergencyResult.response,
          quickReplies: emergencyResult.quickReplies,
          escalationRequired: emergencyResult.escalationRequired,
          ticketCreated: emergencyResult.ticketCreated,
          actions: emergencyResult.actions,
          processingTime: Date.now() - startTime,
          tokensUsed: this.estimateTokens(userMessage + emergencyResult.response),
          estimatedCost: this.estimateCost(userMessage + emergencyResult.response),
          confidence: 1.0
        }
      }
      // Step 3: Intent classification
      const intent = await this.classifyIntent(userMessage, context)
      // Step 4: Generate response
      const response = await this.generateResponse(userMessage, intent, context)
      // Step 5: Generate quick replies
      const quickReplies = this.generateQuickReplies(intent, response)
      // Step 6: Cache response if appropriate
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
      // Enhanced logging
      console.log(`Processing completed in ${processingTime}ms`)
      console.log(`Intent: ${intent.name} (confidence: ${(intent.confidence * 100).toFixed(2)}%)`)
      logger.info(LogCategory.WHATSAPP, 'Message processed successfully', {
        sessionId: context.sessionId,
        intent: intent.name,
        confidence: intent.confidence,
        processingTime
      })
      return {
        intent,
        response,
        quickReplies,
        escalationRequired: intent.escalationRequired,
        ticketCreated: false,
        actions: intent.suggestedActions,
        processingTime,
        tokensUsed: this.estimateTokens(userMessage + response),
        estimatedCost: this.estimateCost(userMessage + response),
        confidence: intent.confidence
      }
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error in simple processing', {
        sessionId: context.sessionId,
        errorMessage: error instanceof Error ? error.message : 'Unknown',
        processingTime: Date.now() - startTime
      })
      return {
        intent: {
          name: 'processing_error',
          confidence: 0.1,
          category: 'TECHNICAL',
          priority: 'MEDIUM',
          escalationRequired: true,
          sentiment: 'neutral',
          urgency: 'medium',
          suggestedActions: ['contact_support'],
          responseStrategy: 'escalation'
        },
        response: this.generateErrorResponse(context.userProfile.name),
        quickReplies: ['Falar com atendente', 'Tentar novamente'],
        escalationRequired: true,
        ticketCreated: true,
        actions: ['escalate_to_human'],
        processingTime: Date.now() - startTime,
        confidence: 0.1
      }
    }
  }
  /**
   * Emergency detection
   */
  private async detectEmergency(userMessage: string): Promise<boolean> {
    try {
      const runConfig = getLangSmithRunConfig({
        step: 'emergency-detection',
        tags: ['emergency', 'safety', 'critical']
      })
      const result = await this.emergencyChain.invoke({ userMessage }, runConfig)
      return result === 'EMERGENCY_TRUE'
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error in emergency detection', {
        errorMessage: error instanceof Error ? error.message : 'Unknown'
      })
      return false
    }
  }
  /**
   * Enhanced intent classification
   */
  private async classifyIntent(
    userMessage: string,
    context: SimpleContext
  ): Promise<SimpleIntent> {
    try {
      const runConfig = getLangSmithRunConfig({
        sessionId: context.sessionId,
        userId: context.userId,
        step: 'intent-classification',
        tags: ['intent', 'classification', 'enhanced']
      })
      const promptData = {
        customerName: context.userProfile.name || 'Cliente',
        customerStatus: context.userProfile.subscriptionStatus,
        customerPhone: context.userProfile.phone,
        subscriptionPlan: context.userProfile.subscription?.planType || 'N/A',
        businessHours: context.systemState.businessHours,
        currentTime: context.systemState.currentTime.toISOString(),
        conversationHistory: context.conversationHistory.slice(-3).join('\n'),
        userMessage
      }
      const result = await this.intentChain.invoke(promptData, runConfig)
      logger.debug(LogCategory.WHATSAPP, 'Intent classified', {
        sessionId: context.sessionId,
        intent: result.name,
        confidence: result.confidence,
        category: result.category
      })
      return result
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error in intent classification', {
        errorMessage: error instanceof Error ? error.message : 'Unknown'
      })
      // Return fallback intent
      return {
        name: 'general_inquiry',
        confidence: 0.3,
        category: 'GENERAL',
        priority: 'MEDIUM',
        escalationRequired: false,
        sentiment: 'neutral',
        urgency: 'medium',
        suggestedActions: ['provide_information'],
        responseStrategy: 'automated'
      }
    }
  }
  /**
   * Parse intent from LLM response
   */
  private async parseSimpleIntent(result: string): Promise<SimpleIntent> {
    try {
      const cleanedResult = result
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()
      const parsed = JSON.parse(cleanedResult)
      const validated = SimpleIntentSchema.parse(parsed)
      return {
        name: validated.intent,
        confidence: validated.confidence,
        category: validated.category,
        priority: validated.priority,
        escalationRequired: validated.escalationRequired,
        sentiment: validated.sentiment,
        urgency: validated.urgency,
        suggestedActions: validated.suggestedActions,
        responseStrategy: validated.responseStrategy
      }
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error parsing intent', {
        errorMessage: error instanceof Error ? error.message : 'Unknown',
        result: result.substring(0, 200)
      })
      return {
        name: 'general_inquiry',
        confidence: 0.3,
        category: 'GENERAL',
        priority: 'MEDIUM',
        escalationRequired: false,
        sentiment: 'neutral',
        urgency: 'medium',
        suggestedActions: ['provide_information'],
        responseStrategy: 'automated'
      }
    }
  }
  /**
   * Generate contextual response
   */
  private async generateResponse(
    userMessage: string,
    intent: SimpleIntent,
    context: SimpleContext
  ): Promise<string> {
    try {
      const runConfig = getLangSmithRunConfig({
        sessionId: context.sessionId,
        userId: context.userId,
        step: 'response-generation',
        intent: intent.name,
        category: intent.category,
        tags: ['response', 'generation', 'enhanced']
      })
      const promptData = {
        customerName: context.userProfile.name || 'Cliente',
        customerStatus: context.userProfile.subscriptionStatus,
        subscriptionPlan: context.userProfile.subscription?.planType || 'N/A',
        conversationHistory: context.conversationHistory.slice(-2).join('\n'),
        intent: intent.name,
        sentiment: intent.sentiment,
        urgency: intent.urgency,
        userMessage
      }
      const response = await this.responseChain.invoke(promptData, runConfig)
      logger.debug(LogCategory.WHATSAPP, 'Response generated', {
        sessionId: context.sessionId,
        intent: intent.name,
        responseLength: response.length
      })
      return response
    } catch (error) {
      logger.error(LogCategory.WHATSAPP, 'Error generating response', {
        errorMessage: error instanceof Error ? error.message : 'Unknown'
      })
      return this.generateFallbackResponse(context.userProfile.name)
    }
  }
  /**
   * Generate quick replies based on intent
   */
  private generateQuickReplies(intent: SimpleIntent, response: string): string[] {
    const quickReplyMap = {
      subscription_pause: ['Pausar 30 dias', 'Pausar 60 dias', 'Cancelar pausa', 'Falar com atendente'],
      subscription_cancel: ['Manter assinatura', 'Cancelar assinatura', 'Ofertas especiais'],
      subscription_reactivate: ['Reativar agora', 'Escolher novo plano'],
      payment_failed: ['Pagar com PIX', 'Atualizar cartão', 'Gerar boleto', 'Ajuda com pagamento'],
      delivery_tracking: ['Rastrear pedido', 'Problemas na entrega', 'Alterar endereço'],
      product_exchange: ['Solicitar troca', 'Informações sobre produto', 'Política de troca'],
      appointment_schedule: ['Agendar consulta', 'Ver horários', 'Cancelar agendamento'],
      emergency_medical: ['Ligar para emergência', 'Encontrar hospital', 'Falar com Dr. Philipe'],
      technical_support: ['Acesso ao site', 'App não funciona', 'Recuperar senha'],
      general_inquiry: ['Ver produtos', 'Falar com atendente', 'Agendar consulta'],
      complaint: ['Falar com gerente', 'Registrar reclamação', 'Solução imediata'],
      compliment: ['Avaliar serviço', 'Indicar amigos', 'Ver promoções']
    }
    return quickReplyMap[intent.name as keyof typeof quickReplyMap] || [
      'Falar com atendente',
      'Menu principal',
      'Ajuda adicional'
    ]
  }
  /**
   * Handle emergency response
   */
  private handleEmergency(customerName?: string): Partial<SimpleProcessingResult> {
    const emergencyResponse = `⚠️ **EMERGÊNCIA OFTALMOLÓGICA DETECTADA** ⚠️
${customerName ? `Olá ${customerName},` : 'Olá,'}
Sua mensagem indica uma possível emergência oftalmológica. **NÃO ESPERE!**
🚨 **PROCURE ATENDIMENTO MÉDICO IMEDIATO:**
- Pronto-socorro oftalmológico mais próximo
- Hospital com serviço de oftalmologia
📞 **CONTATO DIRETO:**
- Dr. Philipe Saraiva Cruz: (33) 98606-1427
- WhatsApp para emergências: (33) 98606-1427
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
        sentiment: 'negative',
        urgency: 'critical',
        suggestedActions: ['emergency_contact', 'immediate_medical_attention'],
        responseStrategy: 'escalation'
      } as SimpleIntent,
      response: emergencyResponse,
      quickReplies: ['Ligar para Dr. Philipe', 'Encontrar hospital próximo'],
      escalationRequired: true,
      ticketCreated: true,
      actions: ['emergency_alert', 'contact_doctor']
    }
  }
  /**
   * Utility methods
   */
  private generateErrorResponse(customerName?: string): string {
    return `Olá ${customerName || 'cliente'},
Tive uma dificuldade técnica para processar sua mensagem. Um atendente humano já foi notificado e irá te ajudar em breve.
Enquanto isso:
- Tente enviar a mensagem novamente
- Nos ligue: (33) 98606-1427
- Acesse: svlentes.shop/area-assinante
Pedimos desculpas pelo inconveniente.`
  }
  private generateFallbackResponse(customerName?: string): string {
    return `Olá ${customerName || 'cliente'},
Estou processando sua solicitação. Um momento por favor...
Se precisar de ajuda imediata:
- WhatsApp: (33) 98606-1427
- Site: svlentes.shop`
  }
  private parseCachedIntent(cached: any): SimpleIntent {
    return {
      name: cached.intent,
      confidence: cached.confidence,
      category: 'GENERAL',
      priority: 'MEDIUM',
      escalationRequired: false,
      sentiment: 'neutral',
      urgency: 'medium',
      suggestedActions: [],
      responseStrategy: 'automated'
    }
  }
  private shouldCacheResponse(intent: SimpleIntent, response: string): boolean {
    return (
      intent.confidence > 0.8 &&
      !intent.escalationRequired &&
      response.length > 50 &&
      response.length < 800 &&
      !['emergency_medical', 'complaint'].includes(intent.name)
    )
  }
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }
  private estimateCost(text: string): number {
    const tokens = this.estimateTokens(text)
    return (tokens / 1000) * 0.02 // Average cost estimation
  }
  /**
   * Get processor statistics
   */
  async getStats(): Promise<any> {
    return {
      langsmith: {
        enabled: this.langsmithConfig.tracingEnabled,
        project: this.langsmithConfig.projectName,
        endpoint: this.langsmithConfig.endpoint
      },
      llm: {
        model: 'gpt-5-mini',
        temperature: 0.3,
        maxTokens: 800
      },
      features: {
        enhancedIntentClassification: true,
        contextAwareResponses: true,
        emergencyDetection: true,
        responseCaching: true,
        langSmithIntegration: this.langsmithConfig.tracingEnabled
      }
    }
  }
}

const createDisabledProcessor = (): SimpleLangChainProcessorContract => {
  const message =
    'Processamento automatizado indisponível temporariamente. Um atendente entrará em contato em breve.'
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Simple LangChain processor disabled: missing OPENAI_API_KEY')
  }
  return {
    async processMessage(): Promise<SimpleProcessingResult> {
      return {
        intent: {
          name: 'manual_support_required',
          confidence: 0,
          category: 'TECHNICAL',
          priority: 'HIGH',
          escalationRequired: true,
          sentiment: 'neutral',
          urgency: 'high',
          suggestedActions: ['route_to_human'],
          responseStrategy: 'agent_required'
        },
        response: message,
        quickReplies: ['Falar com atendente'],
        escalationRequired: true,
        ticketCreated: false,
        actions: ['escalate_to_human'],
        processingTime: 0,
        confidence: 0,
        tokensUsed: 0,
        estimatedCost: 0
      }
    },
    async getStats(): Promise<any> {
      return {
        enabled: false,
        langsmith: {
          enabled: false,
          project: null,
          endpoint: null
        },
        llm: null,
        features: {
          enhancedIntentClassification: false,
          contextAwareResponses: false,
          emergencyDetection: false,
          responseCaching: false,
          langSmithIntegration: false
        }
      }
    }
  }
}

export const simpleLangChainProcessor: SimpleLangChainProcessorContract = process.env.OPENAI_API_KEY
  ? new SimpleLangChainProcessor()
  : createDisabledProcessor()