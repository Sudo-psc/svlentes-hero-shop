/**
 * MCP SendPulse Client - Auxiliary Administrative Layer
 *
 * This client uses the SendPulse MCP server (https://mcp.sendpulse.com/mcp)
 * as an auxiliary tool for:
 * - Administrative operations (analytics, bot management)
 * - Intelligent fallback when direct API fails
 * - Advanced troubleshooting and debugging
 *
 * Architecture:
 * - Primary: Direct SendPulse WhatsApp API (sendpulse-client.ts)
 * - Auxiliary: MCP Server for admin operations (this file)
 *
 * DO NOT use this for customer-facing message delivery.
 * Use direct API for production messaging.
 */
import { logger, LogCategory } from './logger'
interface MCPServerConfig {
  url: string
  userId: string
  secret: string
}
interface MCPRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: any
}
interface MCPResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}
interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}
/**
 * MCP SendPulse Client for administrative operations
 */
export class MCPSendPulseClient {
  private config: MCPServerConfig
  private toolsCache: MCPTool[] | null = null
  private toolsCacheExpiry: number = 0
  private requestId: number = 0
  constructor() {
    this.config = {
      url: process.env.MCP_SENDPULSE_URL || 'https://mcp.sendpulse.com/mcp',
      userId: process.env.SENDPULSE_APP_ID || '',
      secret: process.env.SENDPULSE_APP_SECRET || ''
    }
  }
  /**
   * Check if MCP is configured and available
   */
  isAvailable(): boolean {
    return !!(this.config.userId && this.config.secret)
  }
  /**
   * Make authenticated request to MCP server
   */
  private async mcpRequest(method: string, params?: any): Promise<MCPResponse> {
    if (!this.isAvailable()) {
      throw new Error('MCP SendPulse not configured. Set MCP_SENDPULSE_URL, SENDPULSE_APP_ID, SENDPULSE_APP_SECRET')
    }
    const requestId = ++this.requestId
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      ...(params && { params })
    }
    try {
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SP-ID': this.config.userId,
          'X-SP-SECRET': this.config.secret
        },
        body: JSON.stringify(request)
      })
      if (!response.ok) {
        throw new Error(`MCP HTTP error: ${response.status} ${response.statusText}`)
      }
      const data: MCPResponse = await response.json()
      if (data.error) {
        throw new Error(`MCP error: ${data.error.message} (code: ${data.error.code})`)
      }
      return data
    } catch (error) {
      logger.error(LogCategory.SENDPULSE, 'MCP request failed', {
        method,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }
  /**
   * List available MCP tools
   */
  async listTools(): Promise<MCPTool[]> {
    // Return cached tools if available and not expired
    if (this.toolsCache && Date.now() < this.toolsCacheExpiry) {
      return this.toolsCache
    }
    try {
      const response = await this.mcpRequest('tools/list')
      const tools = response.result?.tools || []
      // Cache for 1 hour
      this.toolsCache = tools
      this.toolsCacheExpiry = Date.now() + 60 * 60 * 1000
      logger.info(LogCategory.SENDPULSE, `MCP tools discovered: ${tools.length}`)
      return tools
    } catch (error) {
      logger.error(LogCategory.SENDPULSE, 'Failed to list MCP tools', {
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return []
    }
  }
  /**
   * Call an MCP tool by name
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    try {
      logger.info(LogCategory.SENDPULSE, `Calling MCP tool: ${toolName}`, { args })
      const response = await this.mcpRequest('tools/call', {
        name: toolName,
        arguments: args
      })
      logger.info(LogCategory.SENDPULSE, `MCP tool completed: ${toolName}`)
      return response.result
    } catch (error) {
      logger.error(LogCategory.SENDPULSE, `MCP tool failed: ${toolName}`, {
        error: error instanceof Error ? error.message : 'Unknown',
        args
      })
      throw error
    }
  }
  // ============================================================================
  // Administrative Operations (using MCP tools)
  // ============================================================================
  /**
   * Get list of chatbots in account
   */
  async getBots(): Promise<any[]> {
    try {
      const result = await this.callTool('chatbots_bots_list', {})
      return result?.bots || []
    } catch (error) {
      logger.warn(LogCategory.SENDPULSE, 'Failed to get bots via MCP', {
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return []
    }
  }
  /**
   * Get bot statistics
   */
  async getBotStats(botId: string): Promise<any> {
    try {
      return await this.callTool('chatbots_bots_stats', { bot_id: botId })
    } catch (error) {
      logger.warn(LogCategory.SENDPULSE, 'Failed to get bot stats via MCP', {
        botId,
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return null
    }
  }
  /**
   * Get subscriber information by ID
   */
  async getSubscriberInfo(subscriberId: string): Promise<any> {
    try {
      return await this.callTool('chatbots_subscribers_get', {
        subscriber_id: subscriberId
      })
    } catch (error) {
      logger.warn(LogCategory.SENDPULSE, 'Failed to get subscriber via MCP', {
        subscriberId,
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return null
    }
  }
  /**
   * Search subscribers by filter
   */
  async searchSubscribers(params: {
    bot_id: string
    filter?: Record<string, any>
    limit?: number
  }): Promise<any[]> {
    try {
      const result = await this.callTool('chatbots_subscribers_list', params)
      return result?.subscribers || []
    } catch (error) {
      logger.warn(LogCategory.SENDPULSE, 'Failed to search subscribers via MCP', {
        params,
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return []
    }
  }
  /**
   * Update subscriber variables
   */
  async updateSubscriberVariables(
    subscriberId: string,
    variables: Record<string, any>
  ): Promise<boolean> {
    try {
      await this.callTool('chatbots_subscribers_update', {
        subscriber_id: subscriberId,
        variables
      })
      return true
    } catch (error) {
      logger.error(LogCategory.SENDPULSE, 'Failed to update subscriber via MCP', {
        subscriberId,
        variables,
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return false
    }
  }
  // ============================================================================
  // Intelligent Fallback Operations
  // ============================================================================
  /**
   * Try to send message via MCP as fallback
   * Use only when direct API fails
   */
  async sendMessageFallback(params: {
    bot_id: string
    phone: string
    message: string
  }): Promise<{ success: boolean; method: 'mcp' | 'failed'; error?: string }> {
    logger.warn(LogCategory.SENDPULSE, 'Attempting MCP fallback for message sending', {
      phone: params.phone
    })
    try {
      // Try to send via MCP
      await this.callTool('chatbots_send_message', {
        bot_id: params.bot_id,
        phone: params.phone,
        message: {
          type: 'text',
          text: { body: params.message }
        }
      })
      logger.info(LogCategory.SENDPULSE, 'MCP fallback succeeded', {
        phone: params.phone
      })
      return { success: true, method: 'mcp' }
    } catch (error) {
      logger.error(LogCategory.SENDPULSE, 'MCP fallback also failed', {
        phone: params.phone,
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return {
        success: false,
        method: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  /**
   * Troubleshoot message delivery issues via MCP
   */
  async troubleshootDelivery(params: {
    bot_id: string
    phone: string
  }): Promise<{
    botStatus: any
    subscriberExists: boolean
    subscriberStatus?: any
    recommendations: string[]
  }> {
    const recommendations: string[] = []
    try {
      // 1. Check bot status
      const botStats = await this.getBotStats(params.bot_id)
      if (!botStats) {
        recommendations.push('Bot may not be active or accessible')
      }
      // 2. Search for subscriber
      const subscribers = await this.searchSubscribers({
        bot_id: params.bot_id,
        filter: { phone: params.phone },
        limit: 1
      })
      const subscriberExists = subscribers.length > 0
      const subscriberStatus = subscriberExists ? subscribers[0] : null
      if (!subscriberExists) {
        recommendations.push('Subscriber not found in bot - may need to initiate conversation first')
      } else if (subscriberStatus?.is_blocked) {
        recommendations.push('Subscriber has blocked the bot')
      } else if (!subscriberStatus?.is_chat_opened) {
        recommendations.push('24-hour conversation window may be closed - use template message')
      }
      return {
        botStatus: botStats,
        subscriberExists,
        subscriberStatus,
        recommendations
      }
    } catch (error) {
      logger.error(LogCategory.SENDPULSE, 'MCP troubleshooting failed', {
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return {
        botStatus: null,
        subscriberExists: false,
        recommendations: ['MCP troubleshooting unavailable - check direct API logs']
      }
    }
  }
  // ============================================================================
  // Analytics and Reporting
  // ============================================================================
  /**
   * Get comprehensive analytics using MCP tools
   */
  async getAnalytics(botId: string, dateRange?: { from: string; to: string }): Promise<any> {
    try {
      const stats = await this.getBotStats(botId)
      return {
        bot: {
          id: botId,
          stats
        },
        dateRange,
        fetchedAt: new Date().toISOString(),
        source: 'mcp'
      }
    } catch (error) {
      logger.error(LogCategory.SENDPULSE, 'Failed to get analytics via MCP', {
        botId,
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return null
    }
  }
  /**
   * Export subscriber data for reporting
   */
  async exportSubscribers(botId: string, filters?: Record<string, any>): Promise<any[]> {
    try {
      return await this.searchSubscribers({
        bot_id: botId,
        filter: filters,
        limit: 1000 // MCP may have pagination
      })
    } catch (error) {
      logger.error(LogCategory.SENDPULSE, 'Failed to export subscribers via MCP', {
        botId,
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return []
    }
  }
}
// Singleton instance
export const mcpSendPulseClient = new MCPSendPulseClient()
/**
 * Hybrid messaging strategy:
 * 1. Try direct API (sendpulse-client.ts) - PRIMARY
 * 2. If fails, try MCP fallback - SECONDARY
 * 3. If both fail, log and escalate
 */
export async function sendMessageWithFallback(
  directApiClient: any,
  params: {
    phone: string
    message: string
    botId: string
  }
): Promise<{
  success: boolean
  method: 'direct' | 'mcp' | 'failed'
  error?: string
}> {
  // Try direct API first (primary)
  try {
    await directApiClient.sendMessage({
      phone: params.phone,
      message: params.message
    })
    return { success: true, method: 'direct' }
  } catch (directError) {
    logger.warn(LogCategory.SENDPULSE, 'Direct API failed, trying MCP fallback', {
      phone: params.phone,
      error: directError instanceof Error ? directError.message : 'Unknown'
    })
    // Try MCP fallback (secondary)
    if (mcpSendPulseClient.isAvailable()) {
      return await mcpSendPulseClient.sendMessageFallback({
        bot_id: params.botId,
        phone: params.phone,
        message: params.message
      })
    }
    // Both failed
    return {
      success: false,
      method: 'failed',
      error: directError instanceof Error ? directError.message : 'Unknown error'
    }
  }
}