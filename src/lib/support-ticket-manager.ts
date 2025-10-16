/**
 * Support Ticket Management System
 * Automated ticket creation, assignment, and tracking from WhatsApp conversations
 */

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { FAQCategory } from './support-knowledge-base'

// Ticket Priority Levels
export enum TicketPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4,
  CRITICAL = 5
}

// Ticket Status
export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_CUSTOMER = 'PENDING_CUSTOMER',
  PENDING_AGENT = 'PENDING_AGENT',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED'
}

// Ticket Categories
export enum TicketCategory {
  BILLING = 'billing',
  TECHNICAL = 'technical',
  PRODUCT = 'product',
  DELIVERY = 'delivery',
  ACCOUNT = 'account',
  COMPLAINT = 'complaint',
  COMPLIMENT = 'compliment',
  EMERGENCY = 'emergency',
  GENERAL = 'general'
}

// Agent Specializations
export enum AgentSpecialization {
  BILLING = 'billing',
  TECHNICAL = 'technical',
  PRODUCT = 'product',
  DELIVERY = 'delivery',
  CUSTOMER_SERVICE = 'customer_service',
  EMERGENCY = 'emergency',
  GENERAL = 'general'
}

// Ticket Creation Schema
export const createTicketSchema = z.object({
  userId: z.string(),
  customerInfo: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string(),
    whatsapp: z.string().optional(),
    subscriptionId: z.string().optional(),
    userId: z.string().optional()
  }),
  subject: z.string().min(3),
  description: z.string().min(10),
  category: z.nativeEnum(TicketCategory),
  priority: z.nativeEnum(TicketPriority).default(TicketPriority.MEDIUM),
  source: z.string().default('whatsapp'),
  messageId: z.string().optional(),
  intent: z.string().optional(),
  context: z.object({
    previousMessages: z.array(z.string()).optional(),
    userHistory: z.any().optional(),
    relatedOrders: z.array(z.string()).optional(),
    escalationReason: z.string().optional()
  }).optional(),
  tags: z.array(z.string()).optional(),
  estimatedResolution: z.string().optional(),
  slaBreach: z.boolean().default(false)
})

export type CreateTicketRequest = z.infer<typeof createTicketSchema>

// Agent Schema
export const agentSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  specializations: z.array(z.nativeEnum(AgentSpecialization)),
  isOnline: z.boolean().default(true),
  maxConcurrentTickets: z.number().default(5),
  currentTicketCount: z.number().default(0),
  averageResponseTime: z.number().optional(),
  satisfactionScore: z.number().min(0).max(5).optional(),
  workingHours: z.object({
    start: z.string(),
    end: z.string(),
    timezone: z.string().default('America/Sao_Paulo'),
    daysOff: z.array(z.string()).optional()
  }).optional(),
  lastActive: z.date().optional()
})

export type Agent = z.infer<typeof agentSchema>

export class SupportTicketManager {
  private activeTickets: Map<string, any> = new Map()
  private agentQueue: Map<string, string[]> = new Map()

  /**
   * Create a new support ticket from WhatsApp conversation
   */
  async createTicket(ticketData: CreateTicketRequest): Promise<any> {
    try {
      // Validate ticket data
      const validatedData = createTicketSchema.parse(ticketData)

      // Auto-categorize and prioritize based on content
      const { category, priority, escalationRequired } = await this.analyzeTicketContent(
        validatedData.description,
        validatedData.category,
        validatedData.priority
      )

      // Generate ticket number
      const ticketNumber = await this.generateTicketNumber(category)

      // Check if similar ticket exists
      const existingTicket = await this.findSimilarTicket(validatedData.userId, validatedData.description)
      if (existingTicket) {
        return { ticket: existingTicket, status: 'merged', message: 'Merged with existing ticket' }
      }

      // Create ticket in database
      const ticket = await prisma.supportTicket.create({
        data: {
          ticketNumber,
          userId: validatedData.userId,
          customerInfo: validatedData.customerInfo,
          subject: validatedData.subject,
          description: validatedData.description,
          category,
          priority,
          status: escalationRequired ? TicketStatus.ESCALATED : TicketStatus.OPEN,
          source: validatedData.source,
          messageId: validatedData.messageId,
          intent: validatedData.intent,
          context: validatedData.context,
          tags: validatedData.tags || [],
          slaBreach: validatedData.slaBreach,
          estimatedResolution: this.calculateSLA(category, priority),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Add to active tickets cache
      this.activeTickets.set(ticket.id, ticket)

      // Auto-assign to agent if not escalated
      if (!escalationRequired) {
        await this.autoAssignTicket(ticket.id, category, priority)
      }

      // Send confirmation to customer
      await this.sendTicketConfirmation(ticket)

      // Log ticket creation
      console.log(`Support ticket created: ${ticketNumber} for user ${validatedData.userId}`)

      return {
        ticket,
        status: 'created',
        message: escalationRequired ? 'Ticket escalated to specialist' : 'Ticket created and assigned'
      }
    } catch (error) {
      console.error('Error creating support ticket:', error)
      throw error
    }
  }

  /**
   * Analyze ticket content to determine category and priority
   */
  private async analyzeTicketContent(
    description: string,
    initialCategory: TicketCategory,
    initialPriority: TicketPriority
  ): Promise<{ category: TicketCategory; priority: TicketPriority; escalationRequired: boolean }> {
    const lowerDescription = description.toLowerCase()

    // Emergency detection
    if (this.containsEmergencyKeywords(lowerDescription)) {
      return {
        category: TicketCategory.EMERGENCY,
        priority: TicketPriority.CRITICAL,
        escalationRequired: true
      }
    }

    // Priority analysis
    let priority = initialPriority
    let escalationRequired = false

    // High priority indicators
    if (this.containsHighPriorityKeywords(lowerDescription)) {
      priority = Math.max(priority, TicketPriority.HIGH)
    }

    // Urgent indicators
    if (this.containsUrgentKeywords(lowerDescription)) {
      priority = TicketPriority.URGENT
      escalationRequired = true
    }

    // Category refinement
    let category = initialCategory
    if (category === TicketCategory.GENERAL) {
      category = this.categorizeFromContent(lowerDescription)
    }

    // Escalation triggers
    if (this.containsEscalationTriggers(lowerDescription)) {
      escalationRequired = true
    }

    return { category, priority, escalationRequired }
  }

  /**
   * Check for emergency keywords
   */
  private containsEmergencyKeywords(text: string): boolean {
    const emergencyKeywords = [
      'emergência', 'urgente', 'olho dói', 'visão borrada', 'não consigo ver',
      'acidente', 'lesão', 'sangue', 'dor forte', 'perda de visão',
      'emergency', 'urgent', 'eye pain', 'vision loss', 'accident'
    ]

    return emergencyKeywords.some(keyword => text.includes(keyword))
  }

  /**
   * Check for high priority keywords
   */
  private containsHighPriorityKeywords(text: string): boolean {
    const highPriorityKeywords = [
      'cancelar', 'reembolso', 'devolução', 'troca', 'queixa',
      'problema', 'erro', 'falha', 'não funciona', 'insatisfeito',
      'cancel', 'refund', 'return', 'complaint', 'broken', 'not working'
    ]

    return highPriorityKeywords.some(keyword => text.includes(keyword))
  }

  /**
   * Check for urgent keywords
   */
  private containsUrgentKeywords(text: string): boolean {
    const urgentKeywords = [
      'imediatamente', 'agora', 'hoje', 'pior', 'gravíssimo',
      'perigo', 'risco', 'sério', 'crítico',
      'immediately', 'now', 'today', 'worse', 'serious', 'critical'
    ]

    return urgentKeywords.some(keyword => text.includes(keyword))
  }

  /**
   * Check for escalation triggers
   */
  private containsEscalationTriggers(text: string): boolean {
    const escalationTriggers = [
      'gerente', 'supervisor', 'chefe', 'diretor',
      'falar com atendente', 'humano', 'pessoa',
      'manager', 'supervisor', 'speak to human', 'representative'
    ]

    return escalationTriggers.some(keyword => text.includes(keyword))
  }

  /**
   * Categorize ticket based on content
   */
  private categorizeFromContent(text: string): TicketCategory {
    if (text.includes('pagamento') || text.includes('cartão') || text.includes('boleto') || text.includes('pix')) {
      return TicketCategory.BILLING
    }
    if (text.includes('produto') || text.includes('lente') || text.includes('troca')) {
      return TicketCategory.PRODUCT
    }
    if (text.includes('entrega') || text.includes('frete') || text.includes('rastreio')) {
      return TicketCategory.DELIVERY
    }
    if (text.includes('conta') || text.includes('senha') || text.includes('login')) {
      return TicketCategory.ACCOUNT
    }
    if (text.includes('técnico') || text.includes('erro') || text.includes('site')) {
      return TicketCategory.TECHNICAL
    }
    if (text.includes('elogio') || text.includes('parabéns') || text.includes('ótimo')) {
      return TicketCategory.COMPLIMENT
    }
    if (text.includes('reclamação') || text.includes('insatisfeito') || text.includes('problema')) {
      return TicketCategory.COMPLAINT
    }

    return TicketCategory.GENERAL
  }

  /**
   * Generate unique ticket number
   */
  private async generateTicketNumber(category: TicketCategory): Promise<string> {
    const prefix = this.getCategoryPrefix(category)
    const year = new Date().getFullYear()
    const sequence = await this.getNextSequence(category)

    return `${prefix}-${year}-${sequence.toString().padStart(4, '0')}`
  }

  /**
   * Get category prefix for ticket number
   */
  private getCategoryPrefix(category: TicketCategory): string {
    const prefixes = {
      [TicketCategory.BILLING]: 'BIL',
      [TicketCategory.TECHNICAL]: 'TEC',
      [TicketCategory.PRODUCT]: 'PRO',
      [TicketCategory.DELIVERY]: 'ENT',
      [TicketCategory.ACCOUNT]: 'CON',
      [TicketCategory.COMPLAINT]: 'REC',
      [TicketCategory.COMPLIMENT]: 'ELO',
      [TicketCategory.EMERGENCY]: 'EMG',
      [TicketCategory.GENERAL]: 'GER'
    }

    return prefixes[category] || 'GER'
  }

  /**
   * Get next sequence number for category
   */
  private async getNextSequence(category: TicketCategory): Promise<number> {
    // This would typically use a database sequence or counter
    const today = new Date().toISOString().split('T')[0]
    const key = `ticket_sequence_${category}_${today}`

    // For now, return a simple incrementing number
    return Math.floor(Math.random() * 9999) + 1
  }

  /**
   * Find similar existing ticket
   */
  private async findSimilarTicket(userId: string, description: string): Promise<any> {
    try {
      // Look for open tickets from same user with similar content
      const similarTickets = await prisma.supportTicket.findMany({
        where: {
          userId,
          status: {
            in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.PENDING_CUSTOMER]
          },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      })

      // Simple similarity check - in production, use more sophisticated NLP
      if (similarTickets.length > 0) {
        const ticket = similarTickets[0]
        const similarity = this.calculateTextSimilarity(description, ticket.description)

        if (similarity > 0.7) {
          return ticket
        }
      }

      return null
    } catch (error) {
      console.error('Error finding similar ticket:', error)
      return null
    }
  }

  /**
   * Calculate text similarity (simple implementation)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))

    const intersection = new Set([...words1].filter(word => words2.has(word)))
    const union = new Set([...words1, ...words2])

    return intersection.size / union.size
  }

  /**
   * Auto-assign ticket to suitable agent
   */
  private async autoAssignTicket(ticketId: string, category: TicketCategory, priority: TicketPriority): Promise<void> {
    try {
      // Find suitable agent
      const agent = await this.findBestAgent(category, priority)

      if (agent) {
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: {
            assignedAgentId: agent.id,
            status: TicketStatus.IN_PROGRESS,
            assignedAt: new Date()
          }
        })

        // Update agent current ticket count
        await this.updateAgentTicketCount(agent.id, 1)

        // Notify agent
        await this.notifyAgentAssignment(agent.id, ticketId)
      }
    } catch (error) {
      console.error('Error auto-assigning ticket:', error)
    }
  }

  /**
   * Find best available agent for ticket
   */
  private async findBestAgent(category: TicketCategory, priority: TicketPriority): Promise<Agent | null> {
    try {
      const specialization = this.mapCategoryToSpecialization(category)

      // Find agents with matching specialization
      const agents = await prisma.agent.findMany({
        where: {
          specializations: { has: specialization },
          isOnline: true,
          currentTicketCount: { lt: prisma.agent.fields.maxConcurrentTickets }
        },
        orderBy: [
          { currentTicketCount: 'asc' },
          { satisfactionScore: 'desc' },
          { averageResponseTime: 'asc' }
        ],
        take: 1
      })

      return agents[0] as Agent || null
    } catch (error) {
      console.error('Error finding best agent:', error)
      return null
    }
  }

  /**
   * Map ticket category to agent specialization
   */
  private mapCategoryToSpecialization(category: TicketCategory): AgentSpecialization {
    const mapping = {
      [TicketCategory.BILLING]: AgentSpecialization.BILLING,
      [TicketCategory.TECHNICAL]: AgentSpecialization.TECHNICAL,
      [TicketCategory.PRODUCT]: AgentSpecialization.PRODUCT,
      [TicketCategory.DELIVERY]: AgentSpecialization.DELIVERY,
      [TicketCategory.EMERGENCY]: AgentSpecialization.EMERGENCY,
      [TicketCategory.ACCOUNT]: AgentSpecialization.CUSTOMER_SERVICE,
      [TicketCategory.COMPLAINT]: AgentSpecialization.CUSTOMER_SERVICE,
      [TicketCategory.COMPLIMENT]: AgentSpecialization.CUSTOMER_SERVICE,
      [TicketCategory.GENERAL]: AgentSpecialization.GENERAL
    }

    return mapping[category] || AgentSpecialization.GENERAL
  }

  /**
   * Update agent current ticket count
   */
  private async updateAgentTicketCount(agentId: string, increment: number): Promise<void> {
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        currentTicketCount: { increment },
        lastActive: new Date()
      }
    })
  }

  /**
   * Calculate SLA based on category and priority
   */
  private calculateSLA(category: TicketCategory, priority: TicketPriority): string {
    const slaMatrix = {
      [TicketPriority.CRITICAL]: '1 hora',
      [TicketPriority.URGENT]: '4 horas',
      [TicketPriority.HIGH]: '8 horas',
      [TicketPriority.MEDIUM]: '24 horas',
      [TicketPriority.LOW]: '48 horas'
    }

    return slaMatrix[priority] || '24 horas'
  }

  /**
   * Send ticket confirmation to customer
   */
  private async sendTicketConfirmation(ticket: any): Promise<void> {
    // This would integrate with the WhatsApp service to send confirmation
    console.log(`Ticket confirmation sent for ticket ${ticket.ticketNumber}`)
  }

  /**
   * Notify agent of new ticket assignment
   */
  private async notifyAgentAssignment(agentId: string, ticketId: string): Promise<void> {
    // This would send notification to agent dashboard or email
    console.log(`Agent ${agentId} notified of ticket ${ticketId} assignment`)
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(ticketId: string, status: TicketStatus, note?: string): Promise<void> {
    try {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status,
          updatedAt: new Date(),
          // Add note to history if provided
          ...(note && {
            history: {
              create: {
                action: 'STATUS_CHANGE',
                description: note,
                timestamp: new Date()
              }
            }
          })
        }
      })

      // Update cache
      const ticket = this.activeTickets.get(ticketId)
      if (ticket) {
        ticket.status = status
        ticket.updatedAt = new Date()
      }
    } catch (error) {
      console.error('Error updating ticket status:', error)
      throw error
    }
  }

  /**
   * Get ticket by ID
   */
  async getTicket(ticketId: string): Promise<any> {
    try {
      // Check cache first
      const cachedTicket = this.activeTickets.get(ticketId)
      if (cachedTicket) {
        return cachedTicket
      }

      // Fetch from database
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          history: true,
          agent: true
        }
      })

      if (ticket) {
        this.activeTickets.set(ticketId, ticket)
      }

      return ticket
    } catch (error) {
      console.error('Error getting ticket:', error)
      throw error
    }
  }

  /**
   * Get tickets for user
   */
  async getUserTickets(userId: string, status?: TicketStatus): Promise<any[]> {
    try {
      const whereClause: any = { userId }
      if (status) {
        whereClause.status = status
      }

      return await prisma.supportTicket.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          agent: true
        }
      })
    } catch (error) {
      console.error('Error getting user tickets:', error)
      return []
    }
  }
}

// Singleton instance
export const supportTicketManager = new SupportTicketManager()