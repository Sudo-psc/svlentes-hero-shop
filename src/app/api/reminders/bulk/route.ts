import { NextRequest, NextResponse } from 'next/server'
import { sendPulseReminderService, type ReminderMessage } from '@/lib/reminders/sendpulse-reminder-service'
import { NotificationChannel } from '@/types/reminders'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reminders, channel } = body as {
      reminders: ReminderMessage[]
      channel: NotificationChannel
    }

    if (!reminders || !Array.isArray(reminders) || reminders.length === 0) {
      return NextResponse.json(
        { error: 'Reminders array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel is required' },
        { status: 400 }
      )
    }

    if (reminders.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 reminders per request' },
        { status: 400 }
      )
    }

    const result = await sendPulseReminderService.sendBulkReminders(reminders, channel)

    return NextResponse.json({
      success: result.failed === 0,
      result: {
        sent: result.sent,
        failed: result.failed,
        total: result.total,
        successRate: ((result.sent / result.total) * 100).toFixed(2) + '%'
      },
      channel
    })
  } catch (error) {
    console.error('Error sending bulk reminders:', error)
    return NextResponse.json(
      {
        error: 'Failed to send bulk reminders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
