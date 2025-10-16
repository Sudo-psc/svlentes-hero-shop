import { NextRequest, NextResponse } from 'next/server'
import { sendPulseReminderService, type ReminderMessage } from '@/lib/reminders/sendpulse-reminder-service'
import { NotificationChannel } from '@/types/reminders'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reminder, channel } = body as {
      reminder: ReminderMessage
      channel: NotificationChannel
    }

    if (!reminder || !channel) {
      return NextResponse.json(
        { error: 'Reminder data and channel are required' },
        { status: 400 }
      )
    }

    if (!reminder.scheduledAt) {
      return NextResponse.json(
        { error: 'scheduledAt is required for scheduling' },
        { status: 400 }
      )
    }

    const scheduledAt = new Date(reminder.scheduledAt)
    if (scheduledAt < new Date()) {
      return NextResponse.json(
        { error: 'scheduledAt must be in the future' },
        { status: 400 }
      )
    }

    reminder.scheduledAt = scheduledAt

    const status = await sendPulseReminderService.scheduleReminder(reminder, channel)

    return NextResponse.json({
      success: status !== 'failed',
      status,
      message: `Reminder ${status}`,
      scheduledAt: reminder.scheduledAt,
      channel
    })
  } catch (error) {
    console.error('Error scheduling reminder:', error)
    return NextResponse.json(
      {
        error: 'Failed to schedule reminder',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
