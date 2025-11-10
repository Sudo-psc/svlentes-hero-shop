/**
 * SendPulse Webhook Type-Safe Wrapper
 *
 * Provides type-safe utilities for handling SendPulse webhooks
 *
 * @author Dr. Philipe Saraiva Cruz
 */

import { z } from 'zod'
import { NextResponse } from 'next/server'

// ============================================================================
// Type Definitions
// ============================================================================

export const WebhookMessageSchema = z.object({
  contact: z.object({
    phone: z.string(),
    name: z.string().optional(),
  }),
  message: z.object({
    text: z.string(),
    timestamp: z.number().optional(),
  }),
  type: z.string().optional(),
})

export type WebhookMessage = z.infer<typeof WebhookMessageSchema>

// ============================================================================
// Validator
// ============================================================================

export class SendPulseWebhookValidator {
  static validate(body: unknown): { valid: boolean; data?: WebhookMessage; error?: string } {
    try {
      const data = WebhookMessageSchema.parse(body)
      return { valid: true, data }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid webhook data'
      }
    }
  }
}

// ============================================================================
// Message Processor
// ============================================================================

export class SendPulseMessageProcessor {
  static async process(message: WebhookMessage): Promise<{ success: boolean; response?: string }> {
    // TODO: Implement message processing logic
    // For now, return success placeholder
    return {
      success: true,
      response: 'Message received'
    }
  }
}

// ============================================================================
// Utilities
// ============================================================================

export function withTypeSafety<T>(
  handler: (data: T) => Promise<NextResponse>
): (data: unknown) => Promise<NextResponse> {
  return async (data: unknown) => {
    try {
      return await handler(data as T)
    } catch (error) {
      console.error('[SendPulse] Handler error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

export function parseWebhookBody(body: unknown): WebhookMessage | null {
  const result = SendPulseWebhookValidator.validate(body)
  return result.valid ? result.data! : null
}

export const WebhookResponses = {
  success: (message?: string) => NextResponse.json({ success: true, message }, { status: 200 }),
  error: (message: string, status = 400) => NextResponse.json({ error: message }, { status }),
  unauthorized: () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  notFound: () => NextResponse.json({ error: 'Not found' }, { status: 404 }),
}
