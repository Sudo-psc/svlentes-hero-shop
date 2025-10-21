// API Route: /api/v1/reminders
// CRUD operations for reminders
import { NextRequest, NextResponse } from 'next/server'
import { reminderOrchestrator } from '@/lib/reminders'
import { NotificationType } from '@/types/reminders'
export const runtime = 'nodejs'
/**
 * POST /api/v1/reminders
 * Create a new reminder
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, content, subject, metadata, scheduledAt, preferredChannel } = body
    // Validate required fields
    if (!userId || !type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, content' },
        { status: 400 }
      )
    }
    // Validate type
    if (!Object.values(NotificationType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      )
    }
    // Create reminder
    const notificationId = await reminderOrchestrator.createIntelligentReminder({
      userId,
      type,
      content,
      subject,
      metadata,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      preferredChannel,
    })
    return NextResponse.json({
      success: true,
      notificationId,
      message: 'Reminder created successfully',
    })
  } catch (error) {
    console.error('Create reminder error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create reminder'
    const status = message.includes('fatigue') ? 429 : 500
    return NextResponse.json(
      { error: message },
      { status }
    )
  }
}
/**
 * GET /api/v1/reminders?userId={userId}&limit={limit}
 * Get reminders for a user
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      )
    }
    const reminders = await reminderOrchestrator.getUserHistory(userId, limit)
    return NextResponse.json({
      success: true,
      reminders,
      count: reminders.length,
    })
  } catch (error) {
    console.error('Get reminders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    )
  }
}