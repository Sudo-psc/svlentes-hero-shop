/**
 * 🛠️ Quick Win: Type-Safe SendPulse Webhook Wrapper
 *
 * Provides type-safe functions to wrap the existing webhook logic
 * and gradually improve TypeScript coverage
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  SendPulseWebhookPayload,
  SendPulseMessage,
  WhatsAppCommand,
  ProcessingContext,
  WebhookError,
  WebhookResponse
} from '@/types/sendpulse-webhook';
import { z } from 'zod';

/**
 * Type-safe webhook payload validation
 */
export class SendPulseWebhookValidator {
  private static webhookSchema = z.object({
    messages: z.array(z.object({
      id: z.string(),
      from: z.string(),
      to: z.string(),
      timestamp: z.number(),
      text: z.object({
        body: z.string().max(5000).optional()
      }).optional(),
      interactive: z.object({
        type: z.enum(['button_reply', 'list_reply']),
        button_reply: z.object({
          title: z.string().max(200),
          id: z.string().optional()
        }).optional(),
        list_reply: z.object({
          title: z.string().max(200),
          id: z.string().optional()
        }).optional()
      }).optional(),
      type: z.string().optional(),
      ref: z.string().optional()
    })),
    contacts: z.array(z.object({
      id: z.string(),
      name: z.string().optional(),
      phone: z.string().optional()
    })).optional(),
    status: z.string().optional(),
    event: z.string().optional(),
    bot_id: z.string().optional(),
    timestamp: z.number().optional()
  });

  /**
   * Validate webhook payload with proper typing
   */
  static validatePayload(data: unknown): SendPulseWebhookPayload {
    try {
      return this.webhookSchema.parse(data) as SendPulseWebhookPayload;
    } catch (error) {
      throw new WebhookError(
        `Invalid webhook payload: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'VALIDATION_ERROR',
        400
      );
    }
  }

  /**
   * Validate individual message
   */
  static validateMessage(message: unknown): SendPulseMessage {
    try {
      return this.webhookSchema.shape.messages.element.parse(message) as SendPulseMessage;
    } catch (error) {
      throw new WebhookError(
        `Invalid message format: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'MESSAGE_VALIDATION_ERROR',
        400
      );
    }
  }
}

/**
 * Type-safe message processing utilities
 */
export class SendPulseMessageProcessor {
  /**
   * Extract command from message with proper typing
   */
  static extractCommand(message: SendPulseMessage): WhatsAppCommand {
    const text = message.text?.body?.toLowerCase().trim() || '';
    const interactive = message.interactive;

    // Handle button interactions
    if (interactive?.type === 'button_reply') {
      const buttonTitle = interactive.button_reply.title.toLowerCase();

      if (buttonTitle.includes('ver') || buttonTitle.includes('assinatura')) {
        return { type: 'view_subscription', parameters: { source: 'button' } };
      }
      if (buttonTitle.includes('pausar') || buttonTitle.includes('pause')) {
        return { type: 'pause_subscription', parameters: { source: 'button' } };
      }
      if (buttonTitle.includes('reativar') || buttonTitle.includes('reative')) {
        return { type: 'reactivate_subscription', parameters: { source: 'button' } };
      }
      if (buttonTitle.includes('próxima') || buttonTitle.includes('next')) {
        return { type: 'next_delivery', parameters: { source: 'button' } };
      }
    }

    // Handle text commands
    if (text.includes('ver assinatura') || text.includes('minha assinatura')) {
      return { type: 'view_subscription', parameters: { source: 'text' } };
    }
    if (text.includes('pausar') || text.includes('cancelar')) {
      return { type: 'pause_subscription', parameters: { source: 'text' } };
    }
    if (text.includes('reativar') || text.includes('reativ')) {
      return { type: 'reactivate_subscription', parameters: { source: 'text' } };
    }
    if (text.includes('próxima entrega') || text.includes('proximo')) {
      return { type: 'next_delivery', parameters: { source: 'text' } };
    }
    if (text.includes('ajuda') || text.includes('help')) {
      return { type: 'help', parameters: { source: 'text' } };
    }

    return { type: 'unknown', parameters: { source: 'auto' } };
  }

  /**
   * Create processing context with proper typing
   */
  static createContext(
    message: SendPulseMessage,
    contacts: Array<{ id: string; name?: string; phone?: string }> = []
  ): ProcessingContext {
    const contact = contacts.find(c => c.id === message.from);
    const phone = contact?.phone || message.from;

    return {
      message,
      contact,
      userId: contact?.id || message.from,
      phone,
      sessionId: `${phone}_${Date.now()}`,
      timestamp: Date.now()
    };
  }

  /**
   * Generate response with proper typing
   */
  static createResponse(
    success: boolean,
    message?: string,
    data?: any
  ): NextResponse<WebhookResponse> {
    const response: WebhookResponse = {
      success,
      message,
      data
    };

    return NextResponse.json(response, {
      status: success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * Type-safe webhook handler wrapper
 */
export function withTypeSafety<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse<WebhookResponse>>
) {
  return async (...args: T): Promise<NextResponse<WebhookResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('[SendPulseWebhook] Error:', error);

      if (error instanceof WebhookError) {
        return error.toResponse();
      }

      // Handle unexpected errors
      const webhookError = new WebhookError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'INTERNAL_ERROR',
        500,
        error
      );

      return webhookError.toResponse();
    }
  };
}

/**
 * Type-safe request body parsing
 */
export async function parseWebhookBody(request: NextRequest): Promise<SendPulseWebhookPayload> {
  try {
    const body = await request.json();
    return SendPulseWebhookValidator.validatePayload(body);
  } catch (error) {
    throw new WebhookError(
      'Failed to parse webhook body',
      'PARSE_ERROR',
      400,
      { originalError: error }
    );
  }
}

/**
 * Type-safe response utilities
 */
export const WebhookResponses = {
  success: (message?: string, data?: any) =>
    SendPulseMessageProcessor.createResponse(true, message, data),

  badRequest: (message?: string) =>
    SendPulseMessageProcessor.createResponse(false, message || 'Bad request'),

  unauthorized: (message?: string) =>
    SendPulseMessageProcessor.createResponse(false, message || 'Unauthorized'),

  serverError: (message?: string) =>
    SendPulseMessageProcessor.createResponse(false, message || 'Internal server error')
};