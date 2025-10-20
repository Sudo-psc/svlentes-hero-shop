/**
 * SendPulse Webhook Handler
 * Event processing for incoming webhook events
 * Uses event emitter pattern for flexible handler registration
 */
import type {
  WebhookEvent,
  WebhookEventType,
  MessageEvent,
  StatusEvent,
  ContactEvent,
  ConversationEvent
} from './types'
type EventHandler<T = any> = (event: T, rawEvent: WebhookEvent) => Promise<void> | void
export class WebhookHandler {
  private handlers: Map<WebhookEventType | 'all', EventHandler[]> = new Map()
  private webhookToken: string | null = null
  private processedEvents: Set<string> = new Set()
  private maxProcessedEvents = 1000 // Prevent memory leak
  constructor(webhookToken?: string) {
    this.webhookToken = webhookToken || process.env.SENDPULSE_WEBHOOK_TOKEN || null
  }
  /**
   * Validate webhook signature/token
   */
  validateWebhook(token?: string, payload?: any): boolean {
    if (!this.webhookToken) {
      console.warn('[WebhookHandler] No webhook token configured - skipping validation')
      return true // Allow if no token configured (for testing)
    }
    if (!token) {
      return false
    }
    return token === this.webhookToken
  }
  /**
   * Process incoming webhook event
   */
  async process(event: WebhookEvent): Promise<void> {
    // Generate event ID for deduplication
    const eventId = this.generateEventId(event)
    // Check if already processed (deduplication)
    if (this.processedEvents.has(eventId)) {
      return
    }
    // Mark as processed
    this.addProcessedEvent(eventId)
    try {
      // Get handlers for this event type
      const specificHandlers = this.handlers.get(event.event) || []
      const globalHandlers = this.handlers.get('all') || []
      const allHandlers = [...specificHandlers, ...globalHandlers]
      if (allHandlers.length === 0) {
        console.warn(`[WebhookHandler] No handlers registered for event type: ${event.event}`)
        return
      }
      // Execute all handlers in parallel
      await Promise.allSettled(
        allHandlers.map(handler =>
          this.executeHandler(handler, event)
        )
      )
    } catch (error) {
      console.error('[WebhookHandler] Error processing webhook event:', error)
      throw error
    }
  }
  /**
   * Execute handler with error handling
   */
  private async executeHandler(handler: EventHandler, event: WebhookEvent): Promise<void> {
    try {
      await handler(event.data, event)
    } catch (error) {
      console.error(`[WebhookHandler] Handler error for event ${event.event}:`, error)
      // Don't throw - allow other handlers to continue
    }
  }
  /**
   * Register handler for specific event type
   */
  on(eventType: WebhookEventType, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) || []
    handlers.push(handler)
    this.handlers.set(eventType, handlers)
  }
  /**
   * Register handler for message.new events
   */
  onMessageReceived(handler: EventHandler<MessageEvent>): void {
    this.on('message.new', handler)
  }
  /**
   * Register handler for message.status events
   */
  onMessageStatus(handler: EventHandler<StatusEvent>): void {
    this.on('message.status', handler)
  }
  /**
   * Register handler for contact.created events
   */
  onContactCreated(handler: EventHandler<ContactEvent>): void {
    this.on('contact.created', handler)
  }
  /**
   * Register handler for contact.updated events
   */
  onContactUpdated(handler: EventHandler<ContactEvent>): void {
    this.on('contact.updated', handler)
  }
  /**
   * Register handler for conversation.opened events
   */
  onConversationOpened(handler: EventHandler<ConversationEvent>): void {
    this.on('conversation.opened', handler)
  }
  /**
   * Register handler for conversation.closed events
   */
  onConversationClosed(handler: EventHandler<ConversationEvent>): void {
    this.on('conversation.closed', handler)
  }
  /**
   * Register handler for all events
   */
  onAll(handler: EventHandler): void {
    const handlers = this.handlers.get('all') || []
    handlers.push(handler)
    this.handlers.set('all', handlers)
  }
  /**
   * Remove handler for event type
   */
  off(eventType: WebhookEventType | 'all', handler?: EventHandler): void {
    if (!handler) {
      // Remove all handlers for this event type
      this.handlers.delete(eventType)
      return
    }
    const handlers = this.handlers.get(eventType) || []
    const index = handlers.indexOf(handler)
    if (index > -1) {
      handlers.splice(index, 1)
      this.handlers.set(eventType, handlers)
    }
  }
  /**
   * Remove all handlers
   */
  removeAllHandlers(): void {
    this.handlers.clear()
  }
  /**
   * Generate unique event ID for deduplication
   */
  private generateEventId(event: WebhookEvent): string {
    return `${event.event}_${event.contact_id}_${event.timestamp}`
  }
  /**
   * Add event to processed set
   */
  private addProcessedEvent(eventId: string): void {
    this.processedEvents.add(eventId)
    // Prevent memory leak by limiting processed events cache
    if (this.processedEvents.size > this.maxProcessedEvents) {
      // Remove oldest 20%
      const toRemove = Math.floor(this.maxProcessedEvents * 0.2)
      const iterator = this.processedEvents.values()
      for (let i = 0; i < toRemove; i++) {
        const next = iterator.next()
        if (!next.done) {
          this.processedEvents.delete(next.value)
        }
      }
    }
  }
  /**
   * Parse webhook payload from SendPulse
   */
  parsePayload(body: any): WebhookEvent | null {
    try {
      // Validate required fields
      if (!body.event || !body.bot_id || !body.timestamp) {
        console.error('[WebhookHandler] Invalid webhook payload: missing required fields')
        return null
      }
      // Map SendPulse payload to our WebhookEvent structure
      return {
        event: body.event as WebhookEventType,
        bot_id: body.bot_id,
        contact_id: body.contact_id || body.contact?.id,
        timestamp: body.timestamp,
        data: body.data || body.message || body.contact || body
      }
    } catch (error) {
      console.error('[WebhookHandler] Error parsing webhook payload:', error)
      return null
    }
  }
  /**
   * Get handler statistics
   */
  getStats(): {
    registeredHandlers: Record<string, number>
    processedEvents: number
    maxProcessedEvents: number
  } {
    const stats: Record<string, number> = {}
    Array.from(this.handlers.entries()).forEach(([event, handlers]) => {
      stats[event] = handlers.length
    })
    return {
      registeredHandlers: stats,
      processedEvents: this.processedEvents.size,
      maxProcessedEvents: this.maxProcessedEvents
    }
  }
  /**
   * Clear processed events cache
   */
  clearProcessedEvents(): void {
    this.processedEvents.clear()
  }
  /**
   * Update webhook token
   */
  setWebhookToken(token: string): void {
    this.webhookToken = token
  }
}
// Singleton instance
export const webhookHandler = new WebhookHandler()