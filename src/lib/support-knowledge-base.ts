/**
 * Customer Support Knowledge Base & FAQ Management
 * Provides structured knowledge for WhatsApp support chatbot
 */

import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// FAQ Categories for SVLentes business
export enum FAQCategory {
  SUBSCRIPTION = 'subscription',
  PAYMENT = 'payment',
  DELIVERY = 'delivery',
  PRODUCT = 'product',
  SCHEDULING = 'scheduling',
  TECHNICAL = 'technical',
  ACCOUNT = 'account',
  EMERGENCY = 'emergency',
  BILLING = 'billing',
  CANCELLATION = 'cancellation'
}

// FAQ Entry Schema
export const faqEntrySchema = z.object({
  id: z.string().optional(),
  category: z.nativeEnum(FAQCategory),
  question: z.string().min(5),
  answer: z.string().min(10),
  keywords: z.array(z.string()),
  priority: z.number().min(1).max(10).default(5),
  language: z.string().default('pt-BR'),
  isActive: z.boolean().default(true),
  relatedTopics: z.array(z.string()).optional(),
  escalationRequired: z.boolean().default(false),
  confidenceThreshold: z.number().min(0).max(1).default(0.8)
})

export type FAQEntry = z.infer<typeof faqEntrySchema>

// Support Response Templates
export const SUPPORT_RESPONSES = {
  // Subscription related responses
  subscription_pause: {
    text: "Entendemos que você precisa pausar sua assinatura. Posso ajudar com isso! Informe o motivo da pausa e por quanto tempo deseja mantê-la.",
    quickReplies: ["Pausar 30 dias", "Pausar 60 dias", "Pausar 90 dias", "Outro prazo"],
    category: FAQCategory.SUBSCRIPTION
  },

  subscription_cancel: {
    text: "Sinto muito que você queira cancelar. Para melhorar nosso serviço, você poderia nos informar o motivo do cancelamento?",
    quickReplies: ["Preço", "Mudança de endereço", "Não preciso mais", "Problema com produto", "Outro motivo"],
    category: FAQCategory.CANCELLATION,
    escalationRequired: true
  },

  // Payment related responses
  payment_failed: {
    text: "Identificamos uma falha no processamento do seu pagamento. Vamos te ajudar a resolver isso rapidamente.",
    quickReplies: ["Atualizar cartão", "Pagar com PIX", "Pagar com boleto", "Falar com atendente"],
    category: FAQCategory.PAYMENT
  },

  payment_method_change: {
    text: "Você pode alterar sua forma de pagamento a qualquer momento. Qual opção prefere?",
    quickReplies: ["Cartão de crédito", "PIX", "Boleto bancário"],
    category: FAQCategory.PAYMENT
  },

  // Delivery related responses
  delivery_tracking: {
    text: "Vou verificar o status da sua entrega. Por favor, informe seu código de rastreamento ou CPF para localização.",
    quickReplies: ["Tenho código", "Quero pesquisar por CPF"],
    category: FAQCategory.DELIVERY
  },

  delivery_delayed: {
    text: "Sinto muito pelo atraso na sua entrega. Vou verificar o que aconteceu e providenciar uma solução.",
    quickReplies: ["Verificar status", "Falar com atendente", "Reembolso", "Outra solução"],
    category: FAQCategory.DELIVERY
  },

  // Product related responses
  product_exchange: {
    text: "Para solicitação de troca, preciso saber: qual produto você deseja trocar e qual é o motivo?",
    quickReplies: ["Defeito", "Medida errada", "Não gostei", "Outro motivo"],
    category: FAQCategory.PRODUCT
  },

  product_info: {
    text: "Posso ajudar com informações sobre nossos produtos. O que você gostaria de saber?",
    quickReplies: ["Lentes diárias", "Lentes mensais", "Preços", "Tipos de grau"],
    category: FAQCategory.PRODUCT
  },

  // Scheduling related responses
  appointment_scheduling: {
    text: "Vou agendar sua consulta com Dr. Philipe. Qual data e horário prefere?",
    quickReplies: ["Hoje", "Amanhã", "Esta semana", "Próxima semana"],
    category: FAQCategory.SCHEDULING
  },

  appointment_change: {
    text: "Para remarcar sua consulta, preciso saber sua consulta atual e qual nova data prefere.",
    quickReplies: ["Verificar agendamentos", "Escolher nova data"],
    category: FAQCategory.SCHEDULING
  },

  // Emergency responses
  emergency_eye: {
    text: "⚠️ EMERGÊNCIA OCULAR ⚠️\n\nProcure imediatamente um pronto-socorro oftalmológico ou hospital.\n\nSaraiva Vision: (33) 98606-1427\n\nNão espere, sua visão é prioritária!",
    category: FAQCategory.EMERGENCY,
    escalationRequired: true,
    priority: 10
  },

  emergency_contact: {
    text: "🚨 SITUAÇÃO DE EMERGÊNCIA 🚨\n\nContato direto com Saraiva Vision:\n📞 WhatsApp: (33) 98606-1427\n📞 Telefone Clínica: (33) 98606-1427\n\nEndereço: Rua Catarina Maria Passos, 97 - Santa Zita, Caratinga/MG\n\nAtendimento para emergências.",
    category: FAQCategory.EMERGENCY,
    escalationRequired: true,
    priority: 10
  }
}

export class SupportKnowledgeBase {
  private faqCache: Map<string, FAQEntry[]> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutes

  /**
   * Search FAQ entries based on user query
   */
  async searchFAQ(query: string, category?: FAQCategory): Promise<FAQEntry[]> {
    const cacheKey = `${query.toLowerCase()}_${category || 'all'}`

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.faqCache.get(cacheKey) || []
    }

    try {
      // Build search conditions
      const searchConditions: any = {
        isActive: true,
        OR: [
          { question: { contains: query, mode: 'insensitive' } },
          { answer: { contains: query, mode: 'insensitive' } },
          { keywords: { hasSome: this.extractKeywords(query) } }
        ]
      }

      if (category) {
        searchConditions.category = category
      }

      // Search in database
      const faqEntries = await prisma.fAQ.findMany({
        where: searchConditions,
        orderBy: [
          { priority: 'desc' },
          { question: 'asc' }
        ],
        take: 10
      })

      // Cache the results
      this.faqCache.set(cacheKey, faqEntries as FAQEntry[])
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL)

      return faqEntries as FAQEntry[]
    } catch (error) {
      console.error('Error searching FAQ:', error)
      return []
    }
  }

  /**
   * Get FAQ entries by category
   */
  async getFAQByCategory(category: FAQCategory): Promise<FAQEntry[]> {
    const cacheKey = `category_${category}`

    if (this.isCacheValid(cacheKey)) {
      return this.faqCache.get(cacheKey) || []
    }

    try {
      const faqEntries = await prisma.fAQ.findMany({
        where: {
          category,
          isActive: true
        },
        orderBy: { priority: 'desc' }
      })

      this.faqCache.set(cacheKey, faqEntries as FAQEntry[])
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL)

      return faqEntries as FAQEntry[]
    } catch (error) {
      console.error('Error getting FAQ by category:', error)
      return []
    }
  }

  /**
   * Get popular FAQs based on user interactions
   */
  async getPopularFAQs(limit: number = 10): Promise<FAQEntry[]> {
    try {
      // This would typically track FAQ usage and return most accessed ones
      return await prisma.fAQ.findMany({
        where: { isActive: true },
        orderBy: { priority: 'desc' },
        take: limit
      }) as FAQEntry[]
    } catch (error) {
      console.error('Error getting popular FAQs:', error)
      return []
    }
  }

  /**
   * Add or update FAQ entry
   */
  async upsertFAQ(entry: FAQEntry): Promise<FAQEntry> {
    try {
      const faqEntry = await prisma.fAQ.upsert({
        where: { id: entry.id || '' },
        update: {
          category: entry.category,
          question: entry.question,
          answer: entry.answer,
          keywords: entry.keywords,
          priority: entry.priority,
          isActive: entry.isActive,
          relatedTopics: entry.relatedTopics || [],
          escalationRequired: entry.escalationRequired,
          confidenceThreshold: entry.confidenceThreshold
        },
        create: {
          category: entry.category,
          question: entry.question,
          answer: entry.answer,
          keywords: entry.keywords,
          priority: entry.priority,
          isActive: entry.isActive,
          relatedTopics: entry.relatedTopics || [],
          escalationRequired: entry.escalationRequired,
          confidenceThreshold: entry.confidenceThreshold
        }
      })

      // Clear cache for affected category
      this.clearCategoryCache(entry.category)

      return faqEntry as FAQEntry
    } catch (error) {
      console.error('Error upserting FAQ:', error)
      throw error
    }
  }

  /**
   * Get response template for specific intent
   */
  getResponseTemplate(intent: string, context?: any): any {
    const template = SUPPORT_RESPONSES[intent as keyof typeof SUPPORT_RESPONSES]

    if (!template) {
      return {
        text: "Ainda não tenho uma resposta específica para essa pergunta, mas vou conectar você com um atendente que poderá ajudar melhor.",
        quickReplies: ["Falar com atendente", "Voltar ao menu inicial"],
        category: FAQCategory.GENERAL,
        escalationRequired: true
      }
    }

    // Personalize response based on context if available
    if (context?.userName) {
      template.text = `Olá ${context.userName}! ${template.text}`
    }

    return template
  }

  /**
   * Extract keywords from query for better search
   */
  private extractKeywords(query: string): string[] {
    const stopWords = ['o', 'a', 'os', 'as', 'de', 'do', 'da', 'dos', 'das', 'em', 'para', 'com', 'sem', 'por', 'que', 'como', 'onde', 'quando']

    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key)
    return expiry !== undefined && Date.now() < expiry
  }

  /**
   * Clear cache for specific category
   */
  private clearCategoryCache(category: FAQCategory): void {
    const keysToDelete = Array.from(this.faqCache.keys()).filter(key =>
      key.includes(category.toString())
    )

    keysToDelete.forEach(key => {
      this.faqCache.delete(key)
      this.cacheExpiry.delete(key)
    })
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.faqCache.clear()
    this.cacheExpiry.clear()
  }

  /**
   * Get FAQ suggestions based on partial input
   */
  async getSuggestions(partialQuery: string, limit: number = 5): Promise<string[]> {
    try {
      const faqEntries = await prisma.fAQ.findMany({
        where: {
          isActive: true,
          OR: [
            { question: { contains: partialQuery, mode: 'insensitive' } },
            { keywords: { hasSome: this.extractKeywords(partialQuery) } }
          ]
        },
        select: { question: true },
        take: limit
      })

      return faqEntries.map(faq => faq.question)
    } catch (error) {
      console.error('Error getting suggestions:', error)
      return []
    }
  }
}

// Singleton instance
export const supportKnowledgeBase = new SupportKnowledgeBase()