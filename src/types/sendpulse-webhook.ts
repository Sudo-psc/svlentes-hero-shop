/**
 * 🛠️ Quick Win: SendPulse Webhook Type Definitions
 *
 * Provides TypeScript types for SendPulse webhook payloads
 * to enable proper type checking in the webhook handler
 */

// Message content types
export interface MessageTextContent {
  body?: string;
}

export interface InteractiveButtonReply {
  type: 'button_reply';
  button_reply: {
    title: string;
    id?: string;
  };
}

export interface InteractiveListReply {
  type: 'list_reply';
  list_reply: {
    title: string;
    id?: string;
  };
}

export type InteractiveContent = InteractiveButtonReply | InteractiveListReply;

// SendPulse webhook message structure
export interface SendPulseMessage {
  id: string;
  from: string;
  to: string;
  timestamp: number;
  text?: MessageTextContent;
  interactive?: InteractiveContent;
  type?: string;
  ref?: string;
}

// Contact information
export interface SendPulseContact {
  id: string;
  name?: string;
  phone?: string;
}

// Webhook payload structure
export interface SendPulseWebhookPayload {
  messages: SendPulseMessage[];
  contacts?: SendPulseContact[];
  status?: string;
  event?: string;
  bot_id?: string;
  timestamp?: number;
}

// Response types
export interface WebhookResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// Command types for processing
export interface WhatsAppCommand {
  type: 'view_subscription' | 'pause_subscription' | 'reactivate_subscription' | 'next_delivery' | 'help' | 'unknown';
  parameters?: Record<string, string>;
  userId?: string;
}

// Processing context
export interface ProcessingContext {
  message: SendPulseMessage;
  contact: SendPulseContact | undefined;
  userId: string;
  phone: string;
  sessionId: string;
  timestamp: number;
}

// Error handling types
export interface WebhookError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
}

// Validation schemas
export const MessageTextSchema = {
  body: { type: 'string', maxLength: 5000, optional: true }
};

export const InteractiveButtonReplySchema = {
  type: { type: 'literal', value: 'button_reply' },
  button_reply: {
    title: { type: 'string', maxLength: 200 },
    id: { type: 'string', optional: true }
  }
};

export const InteractiveListReplySchema = {
  type: { type: 'literal', value: 'list_reply' },
  list_reply: {
    title: { type: 'string', maxLength: 200 },
    id: { type: 'string', optional: true }
  }
};

export const SendPulseMessageSchema = {
  id: { type: 'string' },
  from: { type: 'string' },
  to: { type: 'string' },
  timestamp: { type: 'number' },
  text: { type: 'object', properties: MessageTextSchema, optional: true },
  interactive: { type: 'object', optional: true },
  type: { type: 'string', optional: true },
  ref: { type: 'string', optional: true }
};

export const SendPulseWebhookSchema = {
  messages: { type: 'array', items: SendPulseMessageSchema },
  contacts: { type: 'array', optional: true },
  status: { type: 'string', optional: true },
  event: { type: 'string', optional: true },
  bot_id: { type: 'string', optional: true },
  timestamp: { type: 'number', optional: true }
};