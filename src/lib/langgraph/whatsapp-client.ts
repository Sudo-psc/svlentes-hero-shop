/**
 * WhatsApp Cloud API Client
 * Helper for sending messages via WhatsApp Business API
 */

interface WhatsAppMessageResponse {
  messaging_product: string
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string }>
}

export class WhatsAppClient {
  private apiVersion: string
  private phoneNumberId: string
  private accessToken: string
  private baseUrl: string

  constructor() {
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0'
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || ''
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || ''
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`

    if (!this.phoneNumberId || !this.accessToken) {
      console.warn('WhatsApp credentials not configured. Messages will not be sent.')
    }
  }

  /**
   * Send a text message
   */
  async sendTextMessage(to: string, message: string): Promise<WhatsAppMessageResponse | null> {
    if (!this.phoneNumberId || !this.accessToken) {
      console.log('[WhatsApp Mock] Would send message to', to, ':', message)
      return null
    }

    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: {
            preview_url: true,
            body: message,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`WhatsApp API error: ${response.status} - ${error}`)
      }

      const result = await response.json()
      console.log(`Message sent to ${to}:`, result)
      return result
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      throw error
    }
  }

  /**
   * Send a reaction to a message
   */
  async sendReaction(to: string, messageId: string, emoji: string): Promise<void> {
    if (!this.phoneNumberId || !this.accessToken) {
      console.log('[WhatsApp Mock] Would send reaction', emoji, 'to message', messageId)
      return
    }

    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`

      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'reaction',
          reaction: {
            message_id: messageId,
            emoji: emoji,
          },
        }),
      })
    } catch (error) {
      console.error('Error sending reaction:', error)
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    if (!this.phoneNumberId || !this.accessToken) {
      console.log('[WhatsApp Mock] Would mark message as read:', messageId)
      return
    }

    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`

      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      })
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  /**
   * Send message with quick reply buttons
   */
  async sendButtonMessage(to: string, bodyText: string, buttons: Array<{ id: string; title: string }>): Promise<void> {
    if (!this.phoneNumberId || !this.accessToken) {
      console.log('[WhatsApp Mock] Would send button message to', to)
      return
    }

    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`

      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: {
              text: bodyText,
            },
            action: {
              buttons: buttons.map((btn) => ({
                type: 'reply',
                reply: {
                  id: btn.id,
                  title: btn.title,
                },
              })),
            },
          },
        }),
      })
    } catch (error) {
      console.error('Error sending button message:', error)
    }
  }
}

// Export singleton instance
export const whatsappClient = new WhatsAppClient()
