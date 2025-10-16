// API Route: /api/v1/scheduler/process
// Trigger notification processing (called by cron)

import { NextRequest, NextResponse } from 'next/server'
import { notificationScheduler } from '@/lib/reminders/scheduler'

export const runtime = 'nodejs'
export const maxDuration = 60 // Allow up to 60 seconds for processing

/**
 * POST /api/v1/scheduler/process
 * Process scheduled notifications
 * Should be called by cron job every minute
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await notificationScheduler.processScheduledNotifications()

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Scheduler process error:', error)
    return NextResponse.json(
      { error: 'Failed to process notifications' },
      { status: 500 }
    )
  }
}
