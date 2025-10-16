/**
 * SendPulse Management API
 * Manages SendPulse WhatsApp integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendPulseClient } from '@/lib/sendpulse-client'

// Get SendPulse account info and test connection
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'test':
        const isConnected = await sendPulseClient.testConnection()
        return NextResponse.json({
          connected: isConnected,
          timestamp: new Date().toISOString()
        })

      case 'account':
        const accountInfo = await sendPulseClient.getAccountInfo()
        return NextResponse.json({
          account: accountInfo,
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({
          status: 'SendPulse API is available',
          endpoints: ['test', 'account'],
          usage: '?action=test|account'
        })
    }

  } catch (error) {
    console.error('SendPulse API error:', error)
    return NextResponse.json(
      { error: 'Failed to process SendPulse request', details: error.message },
      { status: 500 }
    )
  }
}

// Register webhook and send messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'register-webhook':
        return await registerWebhook(body)

      case 'send-message':
        return await sendMessage(body)

      case 'create-contact':
        return await createContact(body)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('SendPulse API error:', error)
    return NextResponse.json(
      { error: 'Failed to process SendPulse request', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Register SendPulse webhook (Brazilian API)
 */
async function registerWebhook(body: any) {
  try {
    const { webhookUrl } = body

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'webhookUrl is required' },
        { status: 400 }
      )
    }

    const result = await sendPulseClient.setupWebhook(webhookUrl)

    return NextResponse.json({
      success: true,
      webhook: result,
      message: 'SendPulse webhook registered successfully'
    })

  } catch (error) {
    console.error('Error registering SendPulse webhook:', error)
    return NextResponse.json(
      { error: 'Failed to register webhook', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Send message via SendPulse
 */
async function sendMessage(body: any) {
  try {
    const { phone, message, quickReplies } = body

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'phone and message are required' },
        { status: 400 }
      )
    }

    let result

    if (quickReplies && Array.isArray(quickReplies) && quickReplies.length > 0) {
      result = await sendPulseClient.sendMessageWithQuickReplies(
        phone,
        message,
        quickReplies
      )
    } else {
      result = await sendPulseClient.sendMessage({ phone, message })
    }

    return NextResponse.json({
      success: true,
      result,
      message: 'Message sent successfully'
    })

  } catch (error) {
    console.error('Error sending SendPulse message:', error)
    return NextResponse.json(
      { error: 'Failed to send message', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Create or update contact
 */
async function createContact(body: any) {
  try {
    const { phone, name, email, variables, tags } = body

    if (!phone) {
      return NextResponse.json(
        { error: 'phone is required' },
        { status: 400 }
      )
    }

    const contact = {
      phone,
      ...(name && { name }),
      ...(email && { email }),
      ...(variables && { variables }),
      ...(tags && { tags })
    }

    const result = await sendPulseClient.createOrUpdateContact(contact)

    return NextResponse.json({
      success: true,
      contact: result,
      message: 'Contact created/updated successfully'
    })

  } catch (error) {
    console.error('Error creating SendPulse contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact', details: error.message },
      { status: 500 }
    )
  }
}