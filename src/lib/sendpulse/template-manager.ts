/**
 * SendPulse Template Manager
 * Manages WhatsApp message templates for expired conversation windows
 * Templates must be pre-approved by WhatsApp/Facebook Business
 */

import { sendPulseAuth } from '../sendpulse-auth'
import type {
  SendPulseTemplate,
  SendPulseTemplatesResponse,
  TemplateMessage
} from './types'
import {
  SendPulseMessageError,
  createSendPulseError
} from './errors'

export class TemplateManager {
  private baseUrl = 'https://api.sendpulse.com/whatsapp'
  private cachedTemplates: Map<string, SendPulseTemplate[]> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private cacheTTL = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Get all templates for a bot
   */
  async getTemplates(botId: string, forceRefresh = false): Promise<SendPulseTemplate[]> {
    // Return cached templates if still valid
    if (!forceRefresh && this.isCacheValid(botId)) {
      return this.cachedTemplates.get(botId) || []
    }

    try {
      const apiToken = await sendPulseAuth.getAccessToken()

      const response = await fetch(
        `${this.baseUrl}/templates?bot_id=${botId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw createSendPulseError(response.status, errorData)
      }

      const data: SendPulseTemplatesResponse = await response.json()

      // Cache templates
      this.cachedTemplates.set(botId, data.data)
      this.cacheExpiry.set(botId, Date.now() + this.cacheTTL)

      return data.data

    } catch (error) {
      console.error('Error fetching templates:', error)
      throw error
    }
  }

  /**
   * Get approved templates only
   */
  async getApprovedTemplates(botId: string): Promise<SendPulseTemplate[]> {
    const templates = await this.getTemplates(botId)
    return templates.filter(t => t.status === 'APPROVED')
  }

  /**
   * Get template by name
   */
  async getTemplate(botId: string, templateName: string): Promise<SendPulseTemplate | null> {
    const templates = await this.getTemplates(botId)
    return templates.find(t => t.name === templateName) || null
  }

  /**
   * Check if template exists and is approved
   */
  async isTemplateApproved(botId: string, templateName: string): Promise<boolean> {
    const template = await this.getTemplate(botId, templateName)
    return template?.status === 'APPROVED'
  }

  /**
   * Build template message for sending
   */
  buildTemplateMessage(
    templateName: string,
    languageCode: string = 'pt_BR',
    parameters?: {
      header?: string[]
      body?: string[]
      buttons?: Array<{ index: number; text?: string }>
    }
  ): TemplateMessage {
    const components: TemplateMessage['template']['components'] = []

    // Add header parameters if provided
    if (parameters?.header && parameters.header.length > 0) {
      components.push({
        type: 'header',
        parameters: parameters.header.map(text => ({
          type: 'text',
          text
        }))
      })
    }

    // Add body parameters if provided
    if (parameters?.body && parameters.body.length > 0) {
      components.push({
        type: 'body',
        parameters: parameters.body.map(text => ({
          type: 'text',
          text
        }))
      })
    }

    // Add button parameters if provided
    if (parameters?.buttons && parameters.buttons.length > 0) {
      parameters.buttons.forEach(button => {
        components.push({
          type: 'button',
          sub_type: 'quick_reply',
          index: button.index,
          parameters: button.text ? [{
            type: 'text',
            text: button.text
          }] : undefined
        })
      })
    }

    return {
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        ...(components.length > 0 && { components })
      }
    }
  }

  /**
   * Validate template parameters
   */
  validateTemplateParameters(
    template: SendPulseTemplate,
    parameters?: {
      header?: string[]
      body?: string[]
    }
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check if template is approved
    if (template.status !== 'APPROVED') {
      errors.push(`Template "${template.name}" is not approved (status: ${template.status})`)
      return { valid: false, errors }
    }

    // Validate header parameters
    const headerComponent = template.components.find(c => c.type === 'HEADER')
    if (headerComponent?.format === 'TEXT' && headerComponent.example?.header_text) {
      const expectedCount = headerComponent.example.header_text.length
      const providedCount = parameters?.header?.length || 0

      if (providedCount !== expectedCount) {
        errors.push(
          `Header expects ${expectedCount} parameters, but ${providedCount} provided`
        )
      }
    }

    // Validate body parameters
    const bodyComponent = template.components.find(c => c.type === 'BODY')
    if (bodyComponent?.example?.body_text && bodyComponent.example.body_text[0]) {
      const expectedCount = bodyComponent.example.body_text[0].length
      const providedCount = parameters?.body?.length || 0

      if (providedCount !== expectedCount) {
        errors.push(
          `Body expects ${expectedCount} parameters, but ${providedCount} provided`
        )
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get default template for reengagement
   */
  async getDefaultReengagementTemplate(botId: string): Promise<SendPulseTemplate | null> {
    const templates = await this.getApprovedTemplates(botId)

    // Look for common reengagement template names
    const reengagementNames = [
      'reengagement',
      'notification',
      'update',
      'hello',
      'ola'
    ]

    for (const name of reengagementNames) {
      const template = templates.find(t =>
        t.name.toLowerCase().includes(name) &&
        t.category === 'UTILITY'
      )
      if (template) return template
    }

    // Return first utility template as fallback
    return templates.find(t => t.category === 'UTILITY') || templates[0] || null
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(botId: string): boolean {
    const expiry = this.cacheExpiry.get(botId)
    if (!expiry) return false
    return Date.now() < expiry
  }

  /**
   * Clear cached templates
   */
  clearCache(botId?: string): void {
    if (botId) {
      this.cachedTemplates.delete(botId)
      this.cacheExpiry.delete(botId)
    } else {
      this.cachedTemplates.clear()
      this.cacheExpiry.clear()
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    cachedBots: number
    totalTemplates: number
    oldestCache: number | null
    newestCache: number | null
  } {
    const cachedBots = this.cachedTemplates.size
    let totalTemplates = 0

    Array.from(this.cachedTemplates.values()).forEach(templates => {
      totalTemplates += templates.length
    })

    const expiryTimes = Array.from(this.cacheExpiry.values())
    const oldestCache = expiryTimes.length > 0 ? Math.min(...expiryTimes) : null
    const newestCache = expiryTimes.length > 0 ? Math.max(...expiryTimes) : null

    return {
      cachedBots,
      totalTemplates,
      oldestCache,
      newestCache
    }
  }
}

// Singleton instance
export const templateManager = new TemplateManager()
