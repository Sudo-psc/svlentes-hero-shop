// API Route: /api/v1/interactions
// Track notification interactions (webhooks from email, WhatsApp, etc.)

import { NextRequest, NextResponse } from 'next/server'
import { reminderOrchestrator } from '@/lib/reminders'
import { InteractionType } from '@/types/reminders'

export const runtime = 'nodejs'

/**
 * POST /api/v1/interactions
 * Record a notification interaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, userId, actionType, metadata } = body

    // Validate required fields
    if (!notificationId || !userId || !actionType) {
      return NextResponse.json(
        { error: 'Missing required fields: notificationId, userId, actionType' },
        { status: 400 }
      )
    }

    // Validate action type
    if (!Object.values(InteractionType).includes(actionType)) {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400 }
      )
    }

    // Handle interaction
    await reminderOrchestrator.handleInteraction(
      notificationId,
      userId,
      actionType,
      metadata
    )

    return NextResponse.json({
      success: true,
      message: 'Interaction recorded successfully',
    })
  } catch (error) {
    console.error('Record interaction error:', error)
    return NextResponse.json(
      { error: 'Failed to record interaction' },
      { status: 500 }
    )
  }
}
