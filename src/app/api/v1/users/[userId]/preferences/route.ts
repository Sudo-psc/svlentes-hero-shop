// API Route: /api/v1/users/[userId]/preferences
// Manage user notification preferences

import { NextRequest, NextResponse } from 'next/server'
import { reminderOrchestrator, behaviorService } from '@/lib/reminders'

export const runtime = 'nodejs'

interface RouteParams {
  params: {
    userId: string
  }
}

/**
 * GET /api/v1/users/[userId]/preferences
 * Get user notification preferences and behavior
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = params

    const [preferences, behavior] = await Promise.all([
      reminderOrchestrator.getUserPreferences(userId),
      behaviorService.getUserBehavior(userId),
    ])

    return NextResponse.json({
      success: true,
      preferences,
      behavior,
    })
  } catch (error) {
    console.error('Get preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/users/[userId]/preferences
 * Update user notification preferences
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = params
    const body = await request.json()

    await reminderOrchestrator.updateUserPreferences(userId, body)

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
    })
  } catch (error) {
    console.error('Update preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
