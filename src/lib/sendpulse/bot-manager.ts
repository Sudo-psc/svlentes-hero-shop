/**
 * SendPulse Bot Manager
 * Handles bot selection, caching, and bot-related operations
 */

import { sendPulseAuth } from '../sendpulse-auth'
import type { SendPulseBot, SendPulseBotsResponse } from './types'
import { SendPulseBotError, SendPulseNetworkError, createSendPulseError } from './errors'

export class BotManager {
  private baseUrl = 'https://api.sendpulse.com/whatsapp'
  private cachedBots: SendPulseBot[] | null = null
  private cacheExpiry: number = 0
  private defaultBotId: string | null = null

  constructor(defaultBotId?: string) {
    this.defaultBotId = defaultBotId || process.env.SENDPULSE_BOT_ID || null
  }

  /**
   * Get all bots for the account
   */
  async getBots(forceRefresh = false): Promise<SendPulseBot[]> {
    // Return cached bots if still valid
    if (!forceRefresh && this.cachedBots && Date.now() < this.cacheExpiry) {
      return this.cachedBots
    }

    try {
      const apiToken = await sendPulseAuth.getAccessToken()

      const response = await fetch(`${this.baseUrl}/bots`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw createSendPulseError(response.status, errorData)
      }

      const data: SendPulseBotsResponse = await response.json()

      if (!data.success || !data.data || data.data.length === 0) {
        throw new SendPulseBotError(
          'No WhatsApp bots found. Create a bot in SendPulse dashboard first.',
          { dashboardUrl: 'https://login.sendpulse.com/whatsapp/bots' }
        )
      }

      // Cache bots for 5 minutes
      this.cachedBots = data.data
      this.cacheExpiry = Date.now() + 5 * 60 * 1000

      return data.data

    } catch (error) {
      if (error instanceof SendPulseBotError) {
        throw error
      }
      console.error('Error fetching SendPulse bots:', error)
      throw new SendPulseBotError(
        `Failed to fetch bots: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      )
    }
  }

  /**
   * Get a specific bot by ID
   */
  async getBot(botId: string): Promise<SendPulseBot> {
    const bots = await this.getBots()
    const bot = bots.find(b => b.id === botId)

    if (!bot) {
      throw new SendPulseBotError(
        `Bot with ID ${botId} not found`,
        { availableBots: bots.map(b => ({ id: b.id, name: b.name })) }
      )
    }

    return bot
  }

  /**
   * Get the default bot (configured or first available)
   */
  async getDefaultBot(): Promise<SendPulseBot> {
    const bots = await this.getBots()

    if (this.defaultBotId) {
      const bot = bots.find(b => b.id === this.defaultBotId)
      if (bot) return bot

      console.warn(
        `Default bot ID ${this.defaultBotId} not found, using first available bot`
      )
    }

    // Return first active bot
    const activeBot = bots.find(b => b.status === 3)
    if (activeBot) return activeBot

    // Fallback to first bot
    return bots[0]
  }

  /**
   * Get bot by name
   */
  async getBotByName(name: string): Promise<SendPulseBot> {
    const bots = await this.getBots()
    const bot = bots.find(b =>
      b.name.toLowerCase() === name.toLowerCase() ||
      b.channel_data.name?.toLowerCase() === name.toLowerCase()
    )

    if (!bot) {
      throw new SendPulseBotError(
        `Bot named "${name}" not found`,
        { availableBots: bots.map(b => b.name) }
      )
    }

    return bot
  }

  /**
   * Check if a bot is active
   */
  async isBotActive(botId: string): Promise<boolean> {
    try {
      const bot = await this.getBot(botId)
      return bot.status === 3
    } catch {
      return false
    }
  }

  /**
   * Get bot statistics
   */
  async getBotStats(botId: string): Promise<{
    inbox: { total: number; unread: number }
    phone: number
    name: string
  }> {
    const bot = await this.getBot(botId)
    return {
      inbox: bot.inbox,
      phone: bot.channel_data.phone,
      name: bot.channel_data.name
    }
  }

  /**
   * Clear cached bots
   */
  clearCache(): void {
    this.cachedBots = null
    this.cacheExpiry = 0
  }

  /**
   * Set default bot ID
   */
  setDefaultBotId(botId: string): void {
    this.defaultBotId = botId
  }
}

// Singleton instance
export const botManager = new BotManager()
