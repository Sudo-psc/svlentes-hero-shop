// API Route: /api/v1/scheduler/snapshot
// Create daily analytics snapshot (called by cron)
import { NextRequest, NextResponse } from 'next/server'
import { notificationScheduler } from '@/lib/reminders/scheduler'
export const runtime = 'nodejs'
/**
 * POST /api/v1/scheduler/snapshot
 * Create daily analytics snapshot
 * Should be called once per day at midnight
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret'
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    await notificationScheduler.createDailySnapshot()
    return NextResponse.json({
      success: true,
      message: 'Daily snapshot created',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Snapshot creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create snapshot' },
      { status: 500 }
    )
  }
}