/**
 * SendPulse WhatsApp API Client
 * Manages WhatsApp messaging through SendPulse API
 */

interface SendPulseContact {
  id?: string
  name?: string
  email?: string
  phone: string
  variables?: Record<string, any>
  tags?: string[]
}

interface SendPulseMessage {
  phone: string
  message: string
  buttons?: SendPulseButton[]
  image?: string
  document?: string
}

interface SendPulseButton {
  type: 'reply' | 'url'
  reply?: {
    title: string
    id: string
  }
  url?: {
    title: string
    url: string
  }
}

interface SendPulseWebhookData {
  event: string
  message?: {
    id: string
    text?: {
      body: string
    }
    interactive?: {
      type: string
      list_reply?: {
        title: string
        id: string
      }
      button_reply?: {
        title: string
        id: string
      }
    }
    audio?: any
    image?: any
    video?: any
    document?: any
    timestamp: string
    from: string
    to: string
  }
  contact?: {
    id: string
    name?: string
    email?: string
    phone?: string
    identifier?: string
    variables?: Record<string, any>
    tags?: string[]
  }
  timestamp?: string
}

export class SendPulseClient {
  private apiToken: string
  private webhookToken: string
  private baseUrl: string

  constructor() {
    this.apiToken = process.env.SENDPULSE_API_TOKEN || ''
    this.webhookToken = process.env.SENDPULSE_WEBHOOK_TOKEN || ''
    this.baseUrl = 'https://api.sendpulse.com/whatsapp'
  }

  /**
   * Send text message via SendPulse
   */
  async sendMessage(params: SendPulseMessage): Promise<any> {
    try {
      if (!this.apiToken) {
        throw new Error('SendPulse API token not configured')
      }

      // Clean phone number (remove non-digits)
      const cleanPhone = params.phone.replace(/[^\d]/g, '')

      const payload = {
        phone: cleanPhone,
        message: params.message,
        ...(params.buttons && params.buttons.length > 0 && { buttons: params.buttons }),
        ...(params.image && { image: params.image }),
        ...(params.document && { document: params.document })
      }

      const response = await fetch(`${this.baseUrl}/contacts/sendMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`SendPulse API error: ${response.status} - ${errorData.error || response.statusText}`)
      }

      return await response.json()

    } catch (error) {
      console.error('Error sending SendPulse message:', error)
      throw error
    }
  }

  /**
   * Send message with quick reply buttons
   */
  async sendMessageWithQuickReplies(
    phone: string,
    message: string,
    quickReplies: string[]
  ): Promise<any> {
    const buttons = quickReplies.map(reply => ({
      type: 'reply' as const,
      reply: {
        title: reply,
        id: `option_${reply.toLowerCase().replace(/\s+/g, '_').substring(0, 20)}`
      }
    }))

    return this.sendMessage({
      phone,
      message,
      buttons
    })
  }

  /**
   * Send interactive list message
   */
  async sendListMessage(
    phone: string,
    message: string,
    buttonText: string,
    sections: Array<{
      title: string
      rows: Array<{
        id: string
        title: string
        description?: string
      }>
    }>
  ): Promise<any> {
    const payload = {
      phone: phone.replace(/[^\d]/g, ''),
      message,
      interactive: {
        type: 'list',
        body: { text: message },
        action: {
          button: buttonText,
          sections: sections.map(section => ({
            title: section.title,
            rows: section.rows
          }))
        }
      }
    }

    const response = await fetch(`${this.baseUrl}/contacts/sendMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`SendPulse API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Send image message
   */
  async sendImageMessage(phone: string, imageUrl: string, caption?: string): Promise<any> {
    return this.sendMessage({
      phone,
      message: caption || '',
      image: imageUrl
    })
  }

  /**
   * Send document message
   */
  async sendDocumentMessage(phone: string, documentUrl: string, filename?: string): Promise<any> {
    return this.sendMessage({
      phone,
      message: '',
      document: documentUrl
    })
  }

  /**
   * Create or update contact
   */
  async createOrUpdateContact(contact: SendPulseContact): Promise<any> {
    try {
      const payload = {
        phone: contact.phone.replace(/[^\d]/g, ''),
        ...(contact.name && { name: contact.name }),
        ...(contact.email && { email: contact.email }),
        ...(contact.variables && { variables: contact.variables }),
        ...(contact.tags && { tags: contact.tags })
      }

      const response = await fetch(`${this.baseUrl}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`SendPulse API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()

    } catch (error) {
      console.error('Error creating/updating SendPulse contact:', error)
      throw error
    }
  }

  /**
   * Get contact information
   */
  async getContact(phone: string): Promise<any> {
    try {
      const cleanPhone = phone.replace(/[^\d]/g, '')
      const response = await fetch(`${this.baseUrl}/contacts/${cleanPhone}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null // Contact not found
        }
        throw new Error(`SendPulse API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()

    } catch (error) {
      console.error('Error getting SendPulse contact:', error)
      throw error
    }
  }

  /**
   * Register webhook for receiving messages
   */
  async registerWebhook(webhookUrl: string): Promise<any> {
    try {
      const payload = {
        url: webhookUrl,
        events: ['message.new', 'message.status'],
        token: this.webhookToken
      }

      const response = await fetch(`${this.baseUrl}/webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`SendPulse API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()

    } catch (error) {
      console.error('Error registering SendPulse webhook:', error)
      throw error
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhook(payload: string, signature: string): boolean {
    // TODO: Implement webhook signature validation if SendPulse provides it
    // For now, just check if webhook token is configured
    return !!this.webhookToken
  }

  /**
   * Parse incoming webhook data
   */
  parseWebhookData(body: any): SendPulseWebhookData | null {
    try {
      if (!body.event) {
        return null
      }

      return {
        event: body.event,
        message: body.message,
        contact: body.contact,
        timestamp: body.timestamp
      }

    } catch (error) {
      console.error('Error parsing SendPulse webhook data:', error)
      return null
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/account/info`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      })

      return response.ok

    } catch (error) {
      console.error('SendPulse API connection test failed:', error)
      return false
    }
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/account/info`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`SendPulse API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()

    } catch (error) {
      console.error('Error getting SendPulse account info:', error)
      throw error
    }
  }
}

// Singleton instance
export const sendPulseClient = new SendPulseClient()