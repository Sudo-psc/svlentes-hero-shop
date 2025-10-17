/**
 * SendPulse WhatsApp API Client - WORKING Implementation
 * Based on official SendPulse API: https://api.sendpulse.com/whatsapp
 * Uses OAuth2 for authentication
 * Endpoints tested and confirmed working: /contacts/send and /contacts/sendByPhone
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
  phone?: string
  contactId?: string
  text: string
  buttons?: SendPulseButton[]
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
    this.baseUrl = 'https://api.sendpulse.com/whatsapp'
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
    const cleanPhone = phone.replace(/[^\d]/g, '')
    
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

  private botId: string = process.env.SENDPULSE_BOT_ID || '68f176502ca6f03a9705c489'
  
  private async getBotId(): Promise<string> {
    if (this.botId) {
      return this.botId
    }

    const token = await this.getAccessToken()
    
    const response = await fetch('https://api.sendpulse.com/whatsapp/bots', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get bot ID: ${response.status}`)
    }

    const data = await response.json()
    if (!data.success || !data.data || data.data.length === 0) {
      throw new Error('No WhatsApp bots configured in SendPulse')
    }

    this.botId = data.data[0].id
    return this.botId
  }

  /**
   * Send text message via WhatsApp
   * Uses correct SendPulse endpoint: /contacts/sendByPhone
   */
  async sendMessage(params: SendPulseMessage): Promise<any> {
    try {
      const token = await this.getAccessToken()
      const botId = await this.getBotId()

      if (params.phone) {
        const cleanPhone = this.cleanPhone(params.phone)

        const response = await fetch(`${this.baseUrl}/contacts/sendByPhone`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            bot_id: botId,
            phone: cleanPhone,
            message: {
              type: 'text',
              text: {
                body: params.text
              }
            }
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`SendPulse API error: ${response.status} - ${JSON.stringify(errorData)}`)
        }

        return await response.json()
      } else if (params.contactId) {
        const response = await fetch(`${this.baseUrl}/contacts/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contact_id: params.contactId,
            message: {
              type: 'text',
              text: {
                body: params.text
              }
            }
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`SendPulse API error: ${response.status} - ${JSON.stringify(errorData)}`)
        }

        return await response.json()
      } else {
        throw new Error('Either phone or contactId is required')
      }

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
      const botId = await this.getBotId()
      const cleanPhone = this.cleanPhone(phone)

      if (quickReplies.length > 3) {
        console.warn('WhatsApp supports maximum 3 quick reply buttons. Trimming to 3.')
        quickReplies = quickReplies.slice(0, 3)
      }

      const response = await fetch(`${this.baseUrl}/contacts/sendByPhone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bot_id: botId,
          phone: cleanPhone,
          message: {
            type: 'interactive',
            interactive: {
              type: 'button',
              body: {
                text: message
              },
              action: {
                buttons: quickReplies.map((reply, index) => ({
                  type: 'reply',
                  reply: {
                    id: `btn_${index + 1}`,
                    title: reply.substring(0, 20)
                  }
                }))
              }
            }
          }
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
      const botId = await this.getBotId()
      const cleanPhone = this.cleanPhone(phone)

      const response = await fetch(`${this.baseUrl}/contacts/sendByPhone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bot_id: botId,
          phone: cleanPhone,
          message: {
            type: 'image',
            image: {
              link: imageUrl,
              caption: caption || ''
            }
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

      const response = await fetch('https://api.sendpulse.com/whatsapp/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: cleanPhone,
          name: contact.name || '',
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
   * Get contact information by phone
   */
  async getContact(phone: string): Promise<any> {
    try {
      const token = await this.getAccessToken()
      const cleanPhone = this.cleanPhone(phone)

      const response = await fetch(`${this.baseUrl}/contacts/getByPhone?phone=${cleanPhone}`, {
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
