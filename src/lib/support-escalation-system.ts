/**
 * Support Escalation System
 * Intelligent escalation management with human agent handoff
 */

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { TicketPriority, TicketStatus, AgentSpecialization } from './support-ticket-manager'
import { langchainSupportProcessor } from './langchain-support-processor'

// Escalation Reasons
export enum EscalationReason {
  EMERGENCY = 'emergency',
  CUSTOMER_REQUEST = 'customer_request',
  COMPLEX_ISSUE = 'complex_issue',
  TECHNICAL_LIMITATION = 'technical_limitation',
  PAYMENT_ISSUE = 'payment_issue',
  LEGAL_CONCERN = 'legal_concern',
  COMPLAINT_ESCALATION = 'complaint_escalation',
  SATISFACTION_ISSUE = 'satisfaction_issue',
  RECURRING_PROBLEM = 'recurring_problem',
  SPECIALIST_REQUIRED = 'specialist_required'
}

// Escalation Status
export enum EscalationStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled'
}

// Escalation Schema
export const escalationSchema = z.object({
  ticketId: z.string(),
  reason: z.nativeEnum(EscalationReason),
  priority: z.nativeEnum(TicketPriority),
  requestedBy: z.enum(['system', 'agent', 'customer']),
  requestedAt: z.date(),
  context: z.object({
    customerMessage: z.string(),
    conversationHistory: z.array(z.string()).optional(),
    previousAttempts: z.number().default(0),
    customerSentiment: z.string().optional(),
    riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    timeToResolution: z.string().optional(),
    businessImpact: z.string().optional()
  }),
  assignedAgentId: z.string().optional(),
  assignedAt: z.date().optional(),
  estimatedResolution: z.string().optional(),
  actualResolution: z.string().optional(),
  status: z.nativeEnum(EscalationStatus).default(EscalationStatus.PENDING),
  notes: z.string().optional(),
  escalationScore: z.number().min(0).max(100).default(50)
})

export type EscalationRequest = z.infer<typeof escalationSchema>

// Agent Availability Schema
export const agentAvailabilitySchema = z.object({
  agentId: z.string(),
  isOnline: z.boolean(),
  currentLoad: z.number().min(0),
  maxCapacity: z.number().min(1),
  specializations: z.array(z.nativeEnum(AgentSpecialization)),
  averageResponseTime: z.number().optional(),
  satisfactionScore: z.number().min(0).max(5).optional(),
  workingHours: z.object({
    start: z.string(),
    end: z.string(),
    timezone: z.string(),
    daysAvailable: z.array(z.string())
  }),
  lastActive: z.date(),
  nextAvailable: z.date().optional()
})

export type AgentAvailability = z.infer<typeof agentAvailabilitySchema>

export class SupportEscalationSystem {
  private escalationQueue: Map<string, EscalationRequest> = new Map()
  private agentAvailability: Map<string, AgentAvailability> = new Map()
  private escalationRules: Map<string, any> = new Map()

  constructor() {
    this.initializeEscalationRules()
    this.loadAgentAvailability()
  }

  /**
   * Initialize escalation rules
   */
  private initializeEscalationRules(): void {
    this.escalationRules.set('emergency', {
      immediateEscalation: true,
      requiredSpecialization: AgentSpecialization.EMERGENCY,
      maxResponseTime: 300, // 5 minutes
      autoNotify: ['manager', 'on_call_doctor']
    })

    this.escalationRules.set('payment_failure', {
      maxAttempts: 3,
      escalationAfter: 30, // 30 minutes
      requiredSpecialization: AgentSpecialization.BILLING,
      autoEscalate: true
    })

    this.escalationRules.set('complaint', {
      satisfactionThreshold: 2.0,
      escalationAfter: 1, // immediate if sentiment negative
      requiredSpecialization: AgentSpecialization.CUSTOMER_SERVICE,
      notifyManager: true
    })

    this.escalationRules.set('technical_issue', {
      maxAttempts: 2,
      escalationAfter: 15, // 15 minutes
      requiredSpecialization: AgentSpecialization.TECHNICAL,
      autoEscalate: false
    })
  }

  /**
   * Load agent availability data
   */
  private async loadAgentAvailability(): Promise<void> {
    try {
      const agents = await prisma.agent.findMany({
        where: { isActive: true }
      })

      agents.forEach(agent => {
        // Parse JSON fields
        const specializations = Array.isArray(agent.specializations)
          ? agent.specializations as string[]
          : []

        const workingHours = agent.workingHours as {
          start: string
          end: string
          timezone: string
          daysAvailable: string[]
        }

        this.agentAvailability.set(agent.id, {
          agentId: agent.id,
          isOnline: agent.isOnline,
          currentLoad: agent.currentTicketCount,
          maxCapacity: agent.maxConcurrentTickets,
          specializations: specializations as AgentSpecialization[],
          averageResponseTime: agent.averageResponseTime ?? undefined,
          satisfactionScore: agent.satisfactionScore ?? undefined,
          workingHours: {
            start: workingHours.start,
            end: workingHours.end,
            timezone: workingHours.timezone,
            daysAvailable: workingHours.daysAvailable
          },
          lastActive: agent.lastActive ?? new Date()
        })
      })
    } catch (error) {
      console.error('Error loading agent availability:', error)
    }
  }

  /**
   * Process escalation request
   */
  async processEscalation(
    ticketId: string,
    reason: EscalationReason,
    context: any,
    requestedBy: string = 'system'
  ): Promise<{
    escalationId: string
    assigned: boolean
    agentId?: string
    estimatedResponseTime?: string
    nextSteps: string[]
  }> {
    try {
      // Validate escalation request
      const escalationData = escalationSchema.parse({
        ticketId,
        reason,
        requestedBy,
        requestedAt: new Date(),
        context,
        priority: this.calculateEscalationPriority(reason, context),
        escalationScore: this.calculateEscalationScore(reason, context)
      })

      // Check if escalation is necessary
      if (!await this.shouldEscalate(escalationData)) {
        return {
          escalationId: '',
          assigned: false,
          nextSteps: ['Continue automated support', 'Monitor for further escalation triggers']
        }
      }

      // Create escalation record
      const escalation = await this.createEscalationRecord(escalationData)

      // Find and assign suitable agent
      const agentAssignment = await this.findAndAssignAgent(escalation)

      // Update escalation status
      await this.updateEscalationStatus(escalation.id, agentAssignment.assigned ? EscalationStatus.ASSIGNED : EscalationStatus.PENDING)

      // Send notifications
      await this.sendEscalationNotifications(escalation, agentAssignment)

      // Log escalation
      console.log(`Escalation processed: ${escalation.id} for ticket ${ticketId}`)

      return {
        escalationId: escalation.id,
        assigned: agentAssignment.assigned,
        agentId: agentAssignment.agentId,
        estimatedResponseTime: agentAssignment.estimatedResponseTime,
        nextSteps: this.generateNextSteps(escalation, agentAssignment)
      }
    } catch (error) {
      console.error('Error processing escalation:', error)
      throw error
    }
  }

  /**
   * Determine if escalation is necessary
   */
  private async shouldEscalate(escalation: EscalationRequest): Promise<boolean> {
    const rule = this.escalationRules.get(escalation.reason.toString())

    // Emergency escalations are always approved
    if (escalation.reason === EscalationReason.EMERGENCY || escalation.priority >= TicketPriority.CRITICAL) {
      return true
    }

    // Customer request escalations
    if (escalation.requestedBy === 'customer') {
      return true
    }

    // Apply escalation rules
    if (rule?.immediateEscalation) {
      return true
    }

    if (rule?.maxAttempts && escalation.context.previousAttempts >= rule.maxAttempts) {
      return true
    }

    if (rule?.escalationAfter) {
      const ticketAge = Date.now() - escalation.requestedAt.getTime()
      const escalationThreshold = rule.escalationAfter * 60 * 1000 // Convert minutes to milliseconds
      return ticketAge >= escalationThreshold
    }

    // Sentiment-based escalation
    if (escalation.context.customerSentiment === 'negative' && escalation.priority >= TicketPriority.HIGH) {
      return true
    }

    return escalation.escalationScore >= 70 // High escalation score threshold
  }

  /**
   * Calculate escalation priority
   */
  private calculateEscalationPriority(reason: EscalationReason, context: any): TicketPriority {
    // Emergency reasons get highest priority
    if (reason === EscalationReason.EMERGENCY) {
      return TicketPriority.CRITICAL
    }

    // Customer requested escalation
    if (context.customerRequested) {
      return TicketPriority.HIGH
    }

    // Payment issues
    if (reason === EscalationReason.PAYMENT_ISSUE) {
      return TicketPriority.URGENT
    }

    // Complaint escalations
    if (reason === EscalationReason.COMPLAINT_ESCALATION) {
      return context.businessImpact === 'high' ? TicketPriority.HIGH : TicketPriority.MEDIUM
    }

    // Technical issues
    if (reason === EscalationReason.TECHNICAL_LIMITATION) {
      return context.affectedUsers > 10 ? TicketPriority.HIGH : TicketPriority.MEDIUM
    }

    return TicketPriority.MEDIUM
  }

  /**
   * Calculate escalation score (0-100)
   */
  private calculateEscalationScore(reason: EscalationReason, context: any): number {
    let score = 50 // Base score

    // Reason-based scoring
    const reasonScores = {
      [EscalationReason.EMERGENCY]: 95,
      [EscalationReason.CUSTOMER_REQUEST]: 80,
      [EscalationReason.COMPLAINT_ESCALATION]: 75,
      [EscalationReason.PAYMENT_ISSUE]: 70,
      [EscalationReason.RECURRING_PROBLEM]: 65,
      [EscalationReason.TECHNICAL_LIMITATION]: 60,
      [EscalationReason.SATISFACTION_ISSUE]: 55,
      [EscalationReason.SPECIALIST_REQUIRED]: 50,
      [EscalationReason.LEGAL_CONCERN]: 90,
      [EscalationReason.COMPLEX_ISSUE]: 45
    }

    score = reasonScores[reason] || 50

    // Context-based adjustments
    if (context.previousAttempts > 3) score += 10
    if (context.customerSentiment === 'negative') score += 15
    if (context.businessImpact === 'high') score += 20
    if (context.timeWaiting > 60) score += 10 // minutes

    // Risk level adjustments
    if (context.riskLevel === 'critical') score += 25
    if (context.riskLevel === 'high') score += 15
    if (context.riskLevel === 'medium') score += 5

    return Math.min(100, score)
  }

  /**
   * Create escalation record in database
   */
  private async createEscalationRecord(escalationData: EscalationRequest): Promise<any> {
    try {
      const escalation = await prisma.escalation.create({
        data: {
          ticketId: escalationData.ticketId,
          reason: escalationData.reason.toString(),
          priority: escalationData.priority.toString(),
          requestedBy: escalationData.requestedBy,
          requestedAt: escalationData.requestedAt,
          context: escalationData.context,
          status: escalationData.status.toString(),
          escalationScore: escalationData.escalationScore,
          estimatedResolution: this.calculateEstimatedResolution(escalationData.priority)
        }
      })

      // Add to cache
      this.escalationQueue.set(escalation.id, escalationData)

      return escalation
    } catch (error) {
      console.error('Error creating escalation record:', error)
      throw error
    }
  }

  /**
   * Find and assign best agent for escalation
   */
  private async findAndAssignAgent(escalation: any): Promise<{
    assigned: boolean
    agentId?: string
    estimatedResponseTime?: string
  }> {
    try {
      const rule = this.escalationRules.get(escalation.reason)
      const requiredSpecialization = rule?.requiredSpecialization

      // Find available agents
      const availableAgents = Array.from(this.agentAvailability.values())
        .filter(agent => {
          if (!agent.isOnline) return false
          if (agent.currentLoad >= agent.maxCapacity) return false
          if (requiredSpecialization && !agent.specializations.includes(requiredSpecialization)) return false

          // Check working hours
          return this.isAgentWorking(agent)
        })
        .sort((a, b) => {
          // Sort by availability and performance
          const scoreA = this.calculateAgentScore(a, escalation)
          const scoreB = this.calculateAgentScore(b, escalation)
          return scoreB - scoreA
        })

      if (availableAgents.length === 0) {
        return {
          assigned: false,
          estimatedResponseTime: 'Próximo agente disponível em até 2 horas'
        }
      }

      // Assign best agent
      const bestAgent = availableAgents[0]

      // Update agent load
      await this.updateAgentLoad(bestAgent.agentId, 1)

      // Update escalation with agent assignment
      await prisma.escalation.update({
        where: { id: escalation.id },
        data: {
          assignedAgentId: bestAgent.agentId,
          assignedAt: new Date(),
          status: EscalationStatus.ASSIGNED.toString()
        }
      })

      return {
        assigned: true,
        agentId: bestAgent.agentId,
        estimatedResponseTime: this.calculateAgentResponseTime(bestAgent, escalation.priority)
      }
    } catch (error) {
      console.error('Error finding and assigning agent:', error)
      return { assigned: false }
    }
  }

  /**
   * Calculate agent score for assignment
   */
  private calculateAgentScore(agent: AgentAvailability, escalation: any): number {
    let score = 0

    // Availability score (40% weight)
    const availabilityScore = (1 - agent.currentLoad / agent.maxCapacity) * 40
    score += availabilityScore

    // Specialization match (30% weight)
    const rule = this.escalationRules.get(escalation.reason)
    if (rule?.requiredSpecialization && agent.specializations.includes(rule.requiredSpecialization)) {
      score += 30
    } else {
      score += 10
    }

    // Performance score (20% weight)
    if (agent.satisfactionScore) {
      score += (agent.satisfactionScore / 5) * 20
    }

    // Response time score (10% weight)
    if (agent.averageResponseTime) {
      const responseScore = Math.max(0, 10 - agent.averageResponseTime / 60) // Lower response time = higher score
      score += responseScore
    }

    return score
  }

  /**
   * Check if agent is currently working
   */
  private isAgentWorking(agent: AgentAvailability): boolean {
    const now = new Date()
    const agentTime = new Date(now.toLocaleString('en-US', { timeZone: agent.workingHours.timezone }))

    const currentHour = agentTime.getHours()
    const currentDay = agentTime.getDay()

    const startHour = parseInt(agent.workingHours.start.split(':')[0])
    const endHour = parseInt(agent.workingHours.end.split(':')[0])
    const workingDays = agent.workingHours.daysAvailable.map(day => day.toLowerCase())

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const currentDayName = dayNames[currentDay]

    return workingDays.includes(currentDayName) && currentHour >= startHour && currentHour < endHour
  }

  /**
   * Calculate agent response time
   */
  private calculateAgentResponseTime(agent: AgentAvailability, priority: TicketPriority): string {
    const baseTime = agent.averageResponseTime || 15 // minutes

    const multipliers = {
      [TicketPriority.CRITICAL]: 0.5,
      [TicketPriority.URGENT]: 0.75,
      [TicketPriority.HIGH]: 1.0,
      [TicketPriority.MEDIUM]: 1.5,
      [TicketPriority.LOW]: 2.0
    }

    const adjustedTime = baseTime * (multipliers[priority] || 1.0)
    const loadPenalty = (agent.currentLoad / agent.maxCapacity) * 10

    const totalMinutes = Math.round(adjustedTime + loadPenalty)

    if (totalMinutes < 5) return 'menos de 5 minutos'
    if (totalMinutes < 30) return `aproximadamente ${totalMinutes} minutos`
    if (totalMinutes < 60) return `aproximadamente ${Math.round(totalMinutes / 10) * 10} minutos`
    return `aproximadamente ${Math.round(totalMinutes / 15) * 15} minutos`
  }

  /**
   * Update agent load
   */
  private async updateAgentLoad(agentId: string, increment: number): Promise<void> {
    try {
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          currentTicketCount: { increment },
          lastActive: new Date()
        }
      })

      // Update cache
      const agent = this.agentAvailability.get(agentId)
      if (agent) {
        agent.currentLoad += increment
        agent.lastActive = new Date()
      }
    } catch (error) {
      console.error('Error updating agent load:', error)
    }
  }

  /**
   * Update escalation status
   */
  private async updateEscalationStatus(escalationId: string, status: EscalationStatus): Promise<void> {
    try {
      await prisma.escalation.update({
        where: { id: escalationId },
        data: {
          status: status.toString(),
          updatedAt: new Date()
        }
      })

      // Update cache
      const escalation = this.escalationQueue.get(escalationId)
      if (escalation) {
        escalation.status = status
      }
    } catch (error) {
      console.error('Error updating escalation status:', error)
    }
  }

  /**
   * Send escalation notifications
   */
  private async sendEscalationNotifications(escalation: any, agentAssignment: any): Promise<void> {
    try {
      // Notify assigned agent
      if (agentAssignment.assigned && agentAssignment.agentId) {
        await this.notifyAgent(agentAssignment.agentId, escalation)
      }

      // Notify manager if required
      const rule = this.escalationRules.get(escalation.reason)
      if (rule?.notifyManager || escalation.priority >= TicketPriority.HIGH) {
        await this.notifyManager(escalation)
      }

      // Send emergency notifications
      if (escalation.reason === EscalationReason.EMERGENCY) {
        await this.sendEmergencyNotifications(escalation)
      }
    } catch (error) {
      console.error('Error sending escalation notifications:', error)
    }
  }

  /**
   * Notify assigned agent
   */
  private async notifyAgent(agentId: string, escalation: any): Promise<void> {
    // Implementation would send notification to agent dashboard/email/WhatsApp
    console.log(`Agent ${agentId} notified of escalation ${escalation.id}`)
  }

  /**
   * Notify manager
   */
  private async notifyManager(escalation: any): Promise<void> {
    // Implementation would send notification to manager
    console.log(`Manager notified of escalation ${escalation.id}`)
  }

  /**
   * Send emergency notifications
   */
  private async sendEmergencyNotifications(escalation: any): Promise<void> {
    // Implementation would send emergency notifications to all channels
    console.log(`Emergency notifications sent for escalation ${escalation.id}`)
  }

  /**
   * Generate next steps for customer
   */
  private generateNextSteps(escalation: any, agentAssignment: any): string[] {
    const steps = []

    if (agentAssignment.assigned) {
      steps.push(`Aguardar contato do atendente em ${agentAssignment.estimatedResponseTime}`)
      steps.push('Manter WhatsApp disponível para contato')
    } else {
      steps.push('Aguardar próximo atendente disponível')
      steps.push('Você receberá uma notificação quando um atendente for designado')
    }

    if (escalation.reason === EscalationReason.EMERGENCY) {
      steps.push('Em caso de emergência, ligue para (33) 99898-026')
    }

    steps.push('Seu caso tem prioridade máxima em nossa fila')

    return steps
  }

  /**
   * Calculate estimated resolution time
   */
  private calculateEstimatedResolution(priority: TicketPriority): string {
    const estimates = {
      [TicketPriority.CRITICAL]: '1 hora',
      [TicketPriority.URGENT]: '4 horas',
      [TicketPriority.HIGH]: '8 horas',
      [TicketPriority.MEDIUM]: '24 horas',
      [TicketPriority.LOW]: '48 horas'
    }

    return estimates[priority] || '24 horas'
  }

  /**
   * Get active escalations for monitoring
   */
  async getActiveEscalations(): Promise<any[]> {
    try {
      return await prisma.escalation.findMany({
        where: {
          status: {
            in: [EscalationStatus.PENDING.toString(), EscalationStatus.ASSIGNED.toString(), EscalationStatus.IN_PROGRESS.toString()]
          }
        },
        include: {
          ticket: true,
          agent: true
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.error('Error getting active escalations:', error)
      return []
    }
  }

  /**
   * Handle escalation resolution
   */
  async resolveEscalation(
    escalationId: string,
    resolution: string,
    resolvedBy: string
  ): Promise<void> {
    try {
      await prisma.escalation.update({
        where: { id: escalationId },
        data: {
          status: EscalationStatus.RESOLVED.toString(),
          actualResolution: resolution,
          resolvedAt: new Date(),
          resolvedBy
        }
      })

      // Update agent load
      const escalation = this.escalationQueue.get(escalationId)
      if (escalation?.assignedAgentId) {
        await this.updateAgentLoad(escalation.assignedAgentId, -1)
      }

      // Remove from cache
      this.escalationQueue.delete(escalationId)

      console.log(`Escalation resolved: ${escalationId} by ${resolvedBy}`)
    } catch (error) {
      console.error('Error resolving escalation:', error)
      throw error
    }
  }
}

// Singleton instance
export const supportEscalationSystem = new SupportEscalationSystem()