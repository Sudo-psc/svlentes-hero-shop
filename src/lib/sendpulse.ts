import {
  type SendPulseConfig,
  type SendPulseAuthResponse,
  type SendPulseWhatsAppMessage,
  type SendPulseWhatsAppResponse,
  type SendPulseContact,
} from '@/types/sendpulse';

class SendPulseClient {
  private clientId: string;
  private clientSecret: string;
  private apiUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: SendPulseConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.apiUrl = config.apiUrl || 'https://api.sendpulse.com';
  }

  private async authenticate(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${this.apiUrl}/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`SendPulse authentication failed: ${response.statusText}`);
      }

      const data: SendPulseAuthResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('SendPulse authentication error:', error);
      throw error;
    }
  }

  async sendWhatsAppMessage(
    message: SendPulseWhatsAppMessage
  ): Promise<SendPulseWhatsAppResponse> {
    try {
      const token = await this.authenticate();

      const response = await fetch(`${this.apiUrl}/whatsapp/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send WhatsApp message');
      }

      return data;
    } catch (error) {
      console.error('SendPulse send message error:', error);
      throw error;
    }
  }

  async sendTextMessage(phone: string, text: string): Promise<SendPulseWhatsAppResponse> {
    return this.sendWhatsAppMessage({
      phone,
      message: {
        type: 'text',
        text,
      },
    });
  }

  async sendTemplateMessage(
    phone: string,
    templateId: string,
    variables: Record<string, string>
  ): Promise<SendPulseWhatsAppResponse> {
    return this.sendWhatsAppMessage({
      phone,
      message: {
        type: 'template',
        template_id: templateId,
        template_variables: variables,
      },
    });
  }

  async getContactInfo(phone: string): Promise<SendPulseContact | null> {
    try {
      const token = await this.authenticate();

      const response = await fetch(
        `${this.apiUrl}/whatsapp/contacts/${encodeURIComponent(phone)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get contact info: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SendPulse get contact error:', error);
      throw error;
    }
  }

  async createOrUpdateContact(contact: SendPulseContact): Promise<void> {
    try {
      const token = await this.authenticate();

      const response = await fetch(`${this.apiUrl}/whatsapp/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contact),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to create/update contact');
      }
    } catch (error) {
      console.error('SendPulse create/update contact error:', error);
      throw error;
    }
  }
}

let sendPulseClient: SendPulseClient | null = null;

export function getSendPulseClient(): SendPulseClient {
  if (!sendPulseClient) {
    const clientId = process.env.SENDPULSE_CLIENT_ID;
    const clientSecret = process.env.SENDPULSE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('SendPulse credentials not configured. Set SENDPULSE_CLIENT_ID and SENDPULSE_CLIENT_SECRET environment variables.');
    }

    sendPulseClient = new SendPulseClient({
      clientId,
      clientSecret,
    });
  }

  return sendPulseClient;
}

export { SendPulseClient };
