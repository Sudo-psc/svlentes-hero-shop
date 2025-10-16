/**
 * SendPulse WhatsApp API Client - Corrected Implementation
 * Based on SendPulse REST API documentation
 * Uses OAuth2 for authentication
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

export class SendPulseWhatsAppClient {
  private clientId: string
  private clientSecret: string
  private webhookToken: string
  private baseUrl: string
  private accessToken: string = ''
  private tokenExpiry: number = 0

  constructor() {
    this.clientId = process.env.SENDPULSE_CLIENT_ID || ''
    this.clientSecret = process.env.SENDPULSE_CLIENT_SECRET || ''
    this.webhookToken = process.env.SENDPULSE_WEBHOOK_TOKEN || ''
    this.baseUrl = 'https://api.sendpulse.com'
  }

  /**
   * Get OAuth2 access token
   * SendPulse uses OAuth2 with client_credentials grant
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('SendPulse Client ID and Secret are required')
    }

    const response = await fetch(`${this.baseUrl}/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`SendPulse OAuth failed: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + ((data.expires_in || 3600) - 60) * 1000

    return this.accessToken
  }

  /**
   * Clean and format phone number for Brazilian WhatsApp
   */
  private cleanPhone(phone: string): string {
    let cleanPhone = phone.replace(/[^\d]/g, '')
    
    if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
      return cleanPhone
    }
    
    if (cleanPhone.length === 11 && cleanPhone.startsWith('55')) {
      return cleanPhone
    }
    
    if (cleanPhone.length === 11) {
      return '55' + cleanPhone
    }
    
    if (cleanPhone.length === 10) {
      return '55' + cleanPhone
    }
    
    return cleanPhone
  }

  /**
   * Send text message via WhatsApp
   * Note: SendPulse uses WhatsApp Cloud API format
   */
  async sendMessage(params: SendPulseMessage): Promise<any> {
    try {
      const token = await this.getAccessToken()
      const cleanPhone = this.cleanPhone(params.phone)

      const response = await fetch(`${this.baseUrl}/whatsapp/contacts/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: cleanPhone,
          message: params.message
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`SendPulse API error: ${response.status} - ${JSON.stringify(errorData)}`)
      }

      return await response.json()

    } catch (error) {
      console.error('Error sending SendPulse message:', error)
      throw error
    }
  }

  /**
   * Send message with quick reply buttons
   * Maximum 3 buttons for WhatsApp
   */
  async sendMessageWithQuickReplies(
    phone: string,
    message: string,
    quickReplies: string[]
  ): Promise<any> {
    try {
      const token = await this.getAccessToken()
      const cleanPhone = this.cleanPhone(phone)

      if (quickReplies.length > 3) {
        console.warn('WhatsApp supports maximum 3 quick reply buttons. Trimming to 3.')
        quickReplies = quickReplies.slice(0, 3)
      }

      const response = await fetch(`${this.baseUrl}/whatsapp/contacts/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: cleanPhone,
          message,
          buttons: quickReplies.map((reply, index) => ({
            id: `btn_${index + 1}`,
            text: reply.substring(0, 20)
          }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`SendPulse API error: ${response.status} - ${JSON.stringify(errorData)}`)
      }

      return await response.json()

    } catch (error) {
      console.error('Error sending SendPulse message with quick replies:', error)
      throw error
    }
  }

  /**
   * Send image message
   */
  async sendImageMessage(phone: string, imageUrl: string, caption?: string): Promise<any> {
    try {
      const token = await this.getAccessToken()
      const cleanPhone = this.cleanPhone(phone)

      const response = await fetch(`${this.baseUrl}/whatsapp/contacts/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: cleanPhone,
          media: {
            type: 'image',
            url: imageUrl,
            caption: caption || ''
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`SendPulse API error: ${response.status} - ${JSON.stringify(errorData)}`)
      }

      return await response.json()

    } catch (error) {
      console.error('Error sending SendPulse image:', error)
      throw error
    }
  }

  /**
   * Create or update contact in SendPulse
   */
  async createOrUpdateContact(contact: SendPulseContact): Promise<any> {
    try {
      const token = await this.getAccessToken()
      const cleanPhone = this.cleanPhone(contact.phone)

      const response = await fetch(`${this.baseUrl}/whatsapp/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: cleanPhone,
          name: contact.name || '',
          email: contact.email || '',
          variables: contact.variables || {},
          tags: contact.tags || []
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`SendPulse API error: ${response.status} - ${JSON.stringify(errorData)}`)
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
      const token = await this.getAccessToken()
      const cleanPhone = this.cleanPhone(phone)

      const response = await fetch(`${this.baseUrl}/whatsapp/contacts/${cleanPhone}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`SendPulse API error: ${response.status} - ${JSON.stringify(errorData)}`)
      }

      return await response.json()

    } catch (error) {
      console.error('Error getting SendPulse contact:', error)
      throw error
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const token = await this.getAccessToken()
      return !!token && token.length > 0
    } catch (error) {
      console.error('SendPulse API connection test failed:', error)
      return false
    }
  }

  /**
   * Verify webhook token
   */
  verifyWebhook(token: string): boolean {
    return token === this.webhookToken
  }
}

export const sendPulseWhatsAppClient = new SendPulseWhatsAppClient()
