/**
 * WhatsApp Support Integration API
 * Main endpoint for customer support via WhatsApp with SendPulse integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSendPulseClient } from '@/lib/sendpulse'

// Webhook verification for WhatsApp Cloud API
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge)
  }

  return NextResponse.json({ error: 'Invalid verification' }, { status: 403 })
}

// Main message processing endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle WhatsApp Cloud API webhook
    if (body.object === 'whatsapp_business_account') {
      await processWhatsAppWebhook(body)
      return NextResponse.json({ status: 'processed' })
    }

    // Handle direct API calls for testing/manual intervention
    if (body.action === 'send_message') {
      return await handleDirectMessage(body)
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  } catch (error) {
    console.error('Error in WhatsApp support API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Process incoming WhatsApp webhook
 */
async function processWhatsAppWebhook(body: any) {
  try {
    const entry = body.entry?.[0]
    if (!entry?.changes) return

    for (const change of entry.changes) {
      const messages = change.value?.messages
      if (!messages) continue

      for (const message of messages) {
        await processIncomingMessage(message, change.value)
      }
    }
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error)
  }
}

/**
 * Process individual incoming message
 */
async function processIncomingMessage(message: any, metadata: any) {
  try {
    // Skip if message is from our own number
    if (message.from === metadata.metadata?.phone_number_id) {
      return
    }

    // Extract message content
    const messageContent = extractMessageContent(message)
    if (!messageContent) return

    const customerPhone = message.from
    const messageId = message.id

    // Mock processing for testing
    console.log(`Processing WhatsApp message from ${customerPhone}: ${messageContent}`)

    // Store mock interaction
    const mockResponse = `Olá! Recebemos sua mensagem: "${messageContent}". Em breve um de nossos atendentes irá responder.`

    console.log(`Generated response: ${mockResponse}`)

  } catch (error) {
    console.error('Error processing incoming message:', error)
  }
}

/**
 * Extract message content from WhatsApp message
 */
function extractMessageContent(message: any): string | null {
  if (message.text?.body) {
    return message.text.body.trim()
  }

  if (message.interactive?.type === 'list_reply') {
    return message.interactive.list_reply.title
  }

  if (message.interactive?.type === 'button_reply') {
    return message.interactive.button_reply.title
  }

  if (message.audio) {
    return '[Mensagem de áudio]'
  }

  if (message.image) {
    return '[Imagem enviada]'
  }

  return null
}

/**
 * Handle direct message sending (for testing/manual intervention)
 */
async function handleDirectMessage(body: any) {
  try {
    const { customerPhone, message, type = 'text' } = body

    if (!customerPhone || !message) {
      return NextResponse.json({ error: 'Missing customerPhone or message' }, { status: 400 })
    }

    const client = getSendPulseClient()
    const response = await client.sendTextMessage(customerPhone, message)

    if (!response.result) {
      console.error(`Failed to send message to ${customerPhone}:`, response.error)
      return NextResponse.json(
        { error: response.error?.message || 'Failed to send message' },
        { status: 500 }
      )
    }

    console.log(`Message sent via SendPulse to ${customerPhone}:`, response.data)

    return NextResponse.json({
      status: 'sent',
      messageId: response.data?.message_id,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error sending direct message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}