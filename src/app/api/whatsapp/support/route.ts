/**
 * WhatsApp Support Integration API
 * Main endpoint for customer support via WhatsApp with LangGraph integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { langGraphAgent, conversationMemory } from '@/lib/langgraph'
import { whatsappClient } from '@/lib/langgraph/whatsapp-client'

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
 * Process individual incoming message with LangGraph
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

    console.log(`Processing WhatsApp message from ${customerPhone}: ${messageContent}`)

    // Get conversation history
    const conversationHistory = conversationMemory.getConversation(customerPhone)

    // Add user message to memory
    conversationMemory.addUserMessage(customerPhone, messageContent)

    // Process with LangGraph agent
    const result = await langGraphAgent.processMessage(
      messageContent,
      customerPhone,
      undefined,
      conversationHistory
    )

    // Add AI response to memory
    conversationMemory.addAIMessage(customerPhone, result.response)

    // Mark as escalated if needed
    if (result.escalationRequired) {
      conversationMemory.markAsEscalated(customerPhone)
    }

    // Log the interaction
    console.log(`LangGraph response for ${customerPhone}:`, {
      response: result.response.slice(0, 100) + '...',
      escalationRequired: result.escalationRequired,
      toolsUsed: result.toolsUsed,
    })

    // Mark message as read
    await whatsappClient.markAsRead(messageId)

    // Send reaction to show message was received
    await whatsappClient.sendReaction(customerPhone, messageId, '👀')

    // Send the AI response back via WhatsApp API
    await whatsappClient.sendTextMessage(customerPhone, result.response)

    // If escalated, notify team
    if (result.escalationRequired) {
      console.log(`🚨 Conversation escalated for ${customerPhone}`)
      // In production: send notification to support team
    }

  } catch (error) {
    console.error('Error processing incoming message:', error)
    
    // Send fallback response
    const fallbackResponse = 'Desculpe, tive um problema técnico. Um atendente entrará em contato em breve.'
    
    try {
      await whatsappClient.sendTextMessage(message.from, fallbackResponse)
    } catch (sendError) {
      console.error('Error sending fallback message:', sendError)
    }
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

    // Mock WhatsApp message sending
    console.log(`Mock sending message to ${customerPhone}: ${message}`)

    return NextResponse.json({ status: 'sent' })

  } catch (error) {
    console.error('Error sending direct message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}