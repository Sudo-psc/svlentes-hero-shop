/**
 * Airtable Client
 * Cliente para comunicação com API do Airtable para backup e fallback
 */

import { logger, LogCategory } from '@/lib/logger'

// Airtable Configuration
interface AirtableConfig {
  apiKey: string
  baseId: string
  conversationsTable: string
  interactionsTable: string
  escalationsTable: string
}

// Airtable Record Types
export interface AirtableConversationRecord {
  id?: string
  fields: {
    ConversationId: string
    CustomerPhone: string
    CustomerName?: string
    Status: 'active' | 'closed' | 'escalated'
    StartedAt: string
    LastActivity: string
    MessageCount: number
    Intent?: string
    Sentiment?: string
    Priority?: string
    AssignedAgent?: string
    Tags?: string
    Metadata?: string
    CreatedAt: string
    UpdatedAt: string
  }
}

export interface AirtableInteractionRecord {
  id?: string
  fields: {
    InteractionId: string
    ConversationId: string
    MessageId: string
    Direction: 'inbound' | 'outbound'
    Content: string
    Intent?: string
    Response?: string
    ProcessingTime?: number
    Status: 'sent' | 'delivered' | 'read' | 'failed'
    ErrorMessage?: string
    Timestamp: string
    CreatedAt: string
  }
}

export interface AirtableEscalationRecord {
  id?: string
  fields: {
    EscalationId: string
    TicketId: string
    ConversationId: string
    Reason: string
    Priority: string
    Status: string
    CustomerPhone: string
    AssignedAgent?: string
    CreatedAt: string
    ResolvedAt?: string
    Notes?: string
  }
}

export class AirtableClient {
  private config: AirtableConfig
  private baseUrl: string

  constructor() {
    this.config = {
      apiKey: process.env.AIRTABLE_API_KEY || '',
      baseId: process.env.AIRTABLE_BASE_ID || '',
      conversationsTable: process.env.AIRTABLE_CONVERSATIONS_TABLE || 'Conversations',
      interactionsTable: process.env.AIRTABLE_INTERACTIONS_TABLE || 'Interactions',
      escalationsTable: process.env.AIRTABLE_ESCALATIONS_TABLE || 'Escalations'
    }
    this.baseUrl = `https://api.airtable.com/v0/${this.config.baseId}`
  }

  /**
   * Check if Airtable is configured
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.baseId)
  }

  /**
   * Create a conversation record
   */
  async createConversation(record: AirtableConversationRecord): Promise<AirtableConversationRecord | null> {
    try {
      if (!this.isConfigured()) {
        logger.warn(LogCategory.SYSTEM, 'Airtable not configured, skipping conversation backup')
        return null
      }

      const response = await fetch(`${this.baseUrl}/${this.config.conversationsTable}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: record.fields })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Airtable API error: ${error.error?.message || response.statusText}`)
      }

      const result = await response.json()
      logger.info(LogCategory.SYSTEM, 'Conversation backed up to Airtable', {
        conversationId: record.fields.ConversationId,
        airtableId: result.id
      })

      return {
        id: result.id,
        fields: result.fields
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to create Airtable conversation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        conversationId: record.fields.ConversationId
      })
      return null
    }
  }

  /**
   * Update a conversation record
   */
  async updateConversation(
    recordId: string,
    updates: Partial<AirtableConversationRecord['fields']>
  ): Promise<AirtableConversationRecord | null> {
    try {
      if (!this.isConfigured()) {
        return null
      }

      const response = await fetch(`${this.baseUrl}/${this.config.conversationsTable}/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: updates })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Airtable API error: ${error.error?.message || response.statusText}`)
      }

      const result = await response.json()
      return {
        id: result.id,
        fields: result.fields
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to update Airtable conversation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        recordId
      })
      return null
    }
  }

  /**
   * Create an interaction record
   */
  async createInteraction(record: AirtableInteractionRecord): Promise<AirtableInteractionRecord | null> {
    try {
      if (!this.isConfigured()) {
        return null
      }

      const response = await fetch(`${this.baseUrl}/${this.config.interactionsTable}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: record.fields })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Airtable API error: ${error.error?.message || response.statusText}`)
      }

      const result = await response.json()
      return {
        id: result.id,
        fields: result.fields
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to create Airtable interaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        interactionId: record.fields.InteractionId
      })
      return null
    }
  }

  /**
   * Create an escalation record
   */
  async createEscalation(record: AirtableEscalationRecord): Promise<AirtableEscalationRecord | null> {
    try {
      if (!this.isConfigured()) {
        return null
      }

      const response = await fetch(`${this.baseUrl}/${this.config.escalationsTable}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: record.fields })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Airtable API error: ${error.error?.message || response.statusText}`)
      }

      const result = await response.json()
      logger.info(LogCategory.SYSTEM, 'Escalation backed up to Airtable', {
        escalationId: record.fields.EscalationId,
        airtableId: result.id
      })

      return {
        id: result.id,
        fields: result.fields
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to create Airtable escalation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        escalationId: record.fields.EscalationId
      })
      return null
    }
  }

  /**
   * Find conversation by ConversationId
   */
  async findConversation(conversationId: string): Promise<AirtableConversationRecord | null> {
    try {
      if (!this.isConfigured()) {
        return null
      }

      const filterFormula = `{ConversationId} = '${conversationId}'`
      const url = `${this.baseUrl}/${this.config.conversationsTable}?filterByFormula=${encodeURIComponent(filterFormula)}`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.records && result.records.length > 0) {
        return {
          id: result.records[0].id,
          fields: result.records[0].fields
        }
      }

      return null
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to find Airtable conversation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        conversationId
      })
      return null
    }
  }

  /**
   * Get recent conversations by phone
   */
  async getConversationsByPhone(
    phone: string,
    limit: number = 10
  ): Promise<AirtableConversationRecord[]> {
    try {
      if (!this.isConfigured()) {
        return []
      }

      const filterFormula = `{CustomerPhone} = '${phone}'`
      const url = `${this.baseUrl}/${this.config.conversationsTable}?` +
        `filterByFormula=${encodeURIComponent(filterFormula)}&` +
        `maxRecords=${limit}&` +
        `sort[0][field]=LastActivity&` +
        `sort[0][direction]=desc`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.statusText}`)
      }

      const result = await response.json()
      return result.records.map((record: any) => ({
        id: record.id,
        fields: record.fields
      }))
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get Airtable conversations', {
        error: error instanceof Error ? error.message : 'Unknown error',
        phone
      })
      return []
    }
  }

  /**
   * Get conversation interactions
   */
  async getConversationInteractions(
    conversationId: string,
    limit: number = 50
  ): Promise<AirtableInteractionRecord[]> {
    try {
      if (!this.isConfigured()) {
        return []
      }

      const filterFormula = `{ConversationId} = '${conversationId}'`
      const url = `${this.baseUrl}/${this.config.interactionsTable}?` +
        `filterByFormula=${encodeURIComponent(filterFormula)}&` +
        `maxRecords=${limit}&` +
        `sort[0][field]=Timestamp&` +
        `sort[0][direction]=asc`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.statusText}`)
      }

      const result = await response.json()
      return result.records.map((record: any) => ({
        id: record.id,
        fields: record.fields
      }))
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get Airtable interactions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        conversationId
      })
      return []
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        return false
      }

      const response = await fetch(`${this.baseUrl}/${this.config.conversationsTable}?maxRecords=1`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      })

      return response.ok
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Airtable health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }
}

// Singleton instance
export const airtableClient = new AirtableClient()
