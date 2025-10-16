/**
 * LangGraph Agent Implementation
 * Stateful AI agent with memory and tools for WhatsApp customer support
 */

import { ChatOpenAI } from '@langchain/openai'
import { StateGraph, END, START, Annotation } from '@langchain/langgraph'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { supportTicketManager, TicketCategory, TicketPriority } from '../support-ticket-manager'
import { SupportKnowledgeBase } from '../support-knowledge-base'

// Define the state structure for our agent
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  customerPhone: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  customerName: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  conversationContext: Annotation<Record<string, any>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  escalationRequired: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
})

// Define tools for the agent
const knowledgeBase = new SupportKnowledgeBase()

const searchKnowledgeBaseTool = tool(
  async ({ query, category }: { query: string; category?: string }) => {
    try {
      const results = await knowledgeBase.searchFAQ(query, category as any)
      return results
        .slice(0, 3)
        .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`)
        .join('\n\n')
    } catch (error) {
      return 'Desculpe, não consegui buscar informações no momento.'
    }
  },
  {
    name: 'search_knowledge_base',
    description:
      'Busca informações na base de conhecimento sobre lentes de contato, assinaturas, políticas e procedimentos. Use quando precisar de informações específicas para responder o cliente.',
    schema: z.object({
      query: z.string().describe('A consulta de busca'),
      category: z
        .string()
        .optional()
        .describe('Categoria opcional: product, subscription, delivery, billing, etc.'),
    }),
  }
)

const createSupportTicketTool = tool(
  async ({
    subject,
    description,
    category,
    priority,
    customerPhone,
  }: {
    subject: string
    description: string
    category: string
    priority: string
    customerPhone: string
  }) => {
    try {
      const ticket = await supportTicketManager.createTicket({
        userId: customerPhone,
        customerInfo: {
          name: 'Cliente',
          phone: customerPhone,
          whatsapp: customerPhone,
        },
        subject,
        description,
        category: category as TicketCategory,
        priority: priority as TicketPriority,
        source: 'whatsapp',
        intent: 'support_request',
        context: {},
        tags: [category, priority],
      })
      return `Ticket #${ticket.id} criado com sucesso. Um atendente entrará em contato em breve.`
    } catch (error) {
      return 'Erro ao criar ticket. Por favor, tente novamente.'
    }
  },
  {
    name: 'create_support_ticket',
    description:
      'Cria um ticket de suporte para situações que requerem atenção humana. Use quando: cliente solicita atendente, problema complexo, reclamação séria, ou cancelamento.',
    schema: z.object({
      subject: z.string().describe('Assunto do ticket'),
      description: z.string().describe('Descrição detalhada do problema'),
      category: z
        .enum(['BILLING', 'TECHNICAL', 'PRODUCT', 'DELIVERY', 'ACCOUNT', 'COMPLAINT', 'EMERGENCY', 'GENERAL'])
        .describe('Categoria do ticket'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).describe('Prioridade do ticket'),
      customerPhone: z.string().describe('Número de telefone do cliente'),
    }),
  }
)

const checkOrderStatusTool = tool(
  async ({ orderNumber }: { orderNumber: string }) => {
    // Mock implementation - replace with real order lookup
    const mockOrders: Record<string, string> = {
      '12345': 'Em separação',
      '67890': 'Enviado - Código rastreio: BR123456789',
      '11111': 'Entregue em 15/01/2025',
    }

    const status = mockOrders[orderNumber]
    if (status) {
      return `Pedido #${orderNumber}: ${status}`
    }
    return `Pedido #${orderNumber} não encontrado. Verifique o número ou solicite ajuda de um atendente.`
  },
  {
    name: 'check_order_status',
    description: 'Consulta o status de um pedido pelo número. Use quando o cliente perguntar sobre entregas ou rastreamento.',
    schema: z.object({
      orderNumber: z.string().describe('Número do pedido'),
    }),
  }
)

const scheduleConsultationTool = tool(
  async ({ preferredDate, customerPhone }: { preferredDate: string; customerPhone: string }) => {
    // Mock implementation - replace with real scheduling system
    return `Consulta agendada para ${preferredDate}. Você receberá uma confirmação por WhatsApp no número ${customerPhone} em breve.`
  },
  {
    name: 'schedule_consultation',
    description: 'Agenda uma consulta oftalmológica. Use quando cliente solicitar agendamento.',
    schema: z.object({
      preferredDate: z.string().describe('Data preferida no formato DD/MM/YYYY'),
      customerPhone: z.string().describe('Número de telefone do cliente'),
    }),
  }
)

// System prompt for the agent
const SYSTEM_PROMPT = `Você é um assistente virtual da SVLentes, especializado em atendimento ao cliente via WhatsApp.

INFORMAÇÕES DA EMPRESA:
- Clínica: Saraiva Vision - Caratinga/MG
- Responsável: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
- WhatsApp: (33) 99898-026
- Site: svlentes.com.br

SUAS CAPACIDADES:
1. Responder dúvidas sobre lentes de contato e assinaturas
2. Buscar informações na base de conhecimento
3. Consultar status de pedidos
4. Agendar consultas
5. Criar tickets para atendimento humano quando necessário

DIRETRIZES DE ATENDIMENTO:
- Seja sempre educado, empático e profissional
- Use linguagem natural e brasileira
- Mantenha respostas concisas mas completas
- Para emergências oculares, direcione IMEDIATAMENTE para atendimento médico
- Quando não souber algo, seja honesto e ofereça escalar para atendente humano
- Use emojis moderadamente para humanizar o atendimento
- Sempre confirme informações importantes antes de prosseguir

QUANDO ESCALAR PARA ATENDENTE HUMANO:
- Cliente solicita explicitamente
- Reclamação séria ou insatisfação persistente
- Problemas financeiros complexos
- Cancelamento de serviço
- Situações de emergência
- Após 3 tentativas sem resolver o problema

EMERGÊNCIAS OCULARES (AÇÃO IMEDIATA):
Se detectar: dor intensa nos olhos, perda súbita de visão, trauma ocular, sangramento:
1. Alerte sobre a gravidade
2. Direcione para atendimento médico imediato
3. Forneça contato do Dr. Philipe: (33) 99898-026

Lembre-se: você representa a SVLentes. Seja sempre profissional e útil!`

/**
 * LangGraph Agent for customer support
 */
export class LangGraphSupportAgent {
  private model: ChatOpenAI
  private tools: any[]
  private graph: any

  constructor() {
    this.model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    })

    this.tools = [searchKnowledgeBaseTool, createSupportTicketTool, checkOrderStatusTool, scheduleConsultationTool]

    this.initializeGraph()
  }

  private initializeGraph() {
    // Bind tools to the model
    const modelWithTools = this.model.bindTools(this.tools)

    // Define the function that determines whether to continue or end
    function shouldContinue(state: typeof StateAnnotation.State) {
      const messages = state.messages
      const lastMessage = messages[messages.length - 1] as AIMessage

      // If there are no tool calls, then we finish
      if (!lastMessage.tool_calls || lastMessage.tool_calls.length === 0) {
        return END
      }
      // Otherwise, continue to tools
      return 'tools'
    }

    // Define the function that calls the model
    async function callModel(state: typeof StateAnnotation.State) {
      const messages = state.messages

      // Add system message at the beginning
      const messagesWithSystem = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]

      const response = await modelWithTools.invoke(messagesWithSystem)

      return { messages: [response] }
    }

    // Create the tool node
    const toolNode = new ToolNode(this.tools)

    // Define the graph
    const workflow = new StateGraph(StateAnnotation)
      .addNode('agent', callModel)
      .addNode('tools', toolNode)
      .addEdge(START, 'agent')
      .addConditionalEdges('agent', shouldContinue, {
        tools: 'tools',
        [END]: END,
      })
      .addEdge('tools', 'agent')

    this.graph = workflow.compile()
  }

  /**
   * Process a message from the user
   */
  async processMessage(
    message: string,
    customerPhone: string,
    customerName?: string,
    conversationHistory: BaseMessage[] = []
  ): Promise<{
    response: string
    escalationRequired: boolean
    toolsUsed: string[]
  }> {
    try {
      // Prepare initial state
      const initialState = {
        messages: [...conversationHistory, new HumanMessage(message)],
        customerPhone,
        customerName: customerName || 'Cliente',
        conversationContext: {},
        escalationRequired: false,
      }

      // Run the graph
      const finalState = await this.graph.invoke(initialState)

      // Extract the final response
      const messages = finalState.messages
      const lastMessage = messages[messages.length - 1] as AIMessage

      // Extract tools used
      const toolsUsed: string[] = []
      for (const msg of messages) {
        if (msg instanceof AIMessage && msg.tool_calls) {
          toolsUsed.push(...msg.tool_calls.map((tc: any) => tc.name))
        }
      }

      // Check if escalation was requested
      const escalationRequired =
        finalState.escalationRequired ||
        lastMessage.content.toLowerCase().includes('atendente') ||
        toolsUsed.includes('create_support_ticket')

      return {
        response: lastMessage.content as string,
        escalationRequired,
        toolsUsed,
      }
    } catch (error) {
      console.error('Error processing message with LangGraph:', error)
      return {
        response:
          'Desculpe, tive um problema técnico. Um atendente humano foi notificado e entrará em contato em breve.',
        escalationRequired: true,
        toolsUsed: [],
      }
    }
  }

  /**
   * Stream responses for real-time updates
   */
  async *streamMessage(
    message: string,
    customerPhone: string,
    customerName?: string,
    conversationHistory: BaseMessage[] = []
  ): AsyncGenerator<{ content: string; toolCall?: any }> {
    try {
      const initialState = {
        messages: [...conversationHistory, new HumanMessage(message)],
        customerPhone,
        customerName: customerName || 'Cliente',
        conversationContext: {},
        escalationRequired: false,
      }

      // Stream the graph execution
      const stream = await this.graph.stream(initialState)

      for await (const step of stream) {
        if (step.agent) {
          const messages = step.agent.messages
          const lastMessage = messages[messages.length - 1]

          if (lastMessage instanceof AIMessage) {
            if (lastMessage.content) {
              yield {
                content: lastMessage.content as string,
              }
            }

            if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
              for (const toolCall of lastMessage.tool_calls) {
                yield {
                  content: '',
                  toolCall: {
                    name: toolCall.name,
                    args: toolCall.args,
                  },
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming message:', error)
      yield {
        content: 'Desculpe, tive um problema técnico. Por favor, tente novamente.',
      }
    }
  }
}

// Export singleton instance
export const langGraphAgent = new LangGraphSupportAgent()
