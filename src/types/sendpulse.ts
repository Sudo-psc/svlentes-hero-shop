export interface SendPulseConfig {
  clientId: string;
  clientSecret: string;
  apiUrl?: string;
}

export interface SendPulseAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface SendPulseWhatsAppMessage {
  phone: string;
  message: {
    type: 'text' | 'image' | 'document' | 'template';
    text?: string;
    media_url?: string;
    caption?: string;
    template_id?: string;
    template_variables?: Record<string, string>;
  };
}

export interface SendPulseWhatsAppResponse {
  result: boolean;
  data?: {
    message_id: string;
    status: string;
  };
  error?: {
    message: string;
    code: number;
  };
}

export interface SendPulseWebhookPayload {
  event: 'message_received' | 'message_sent' | 'message_delivered' | 'message_read' | 'message_failed';
  timestamp: number;
  contact: {
    phone: string;
    name?: string;
  };
  message?: {
    id: string;
    type: 'text' | 'image' | 'document' | 'audio' | 'video';
    text?: string;
    media_url?: string;
    caption?: string;
  };
  status?: {
    message_id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    error?: string;
  };
}

export interface SendPulseContact {
  phone: string;
  name?: string;
  variables?: Record<string, string>;
}

export interface SendPulseTemplateMessage {
  template_id: string;
  variables: Record<string, string>;
}
