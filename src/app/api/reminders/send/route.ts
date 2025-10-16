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

    if (!reminder.phone && channel !== NotificationChannel.EMAIL) {
      return NextResponse.json(
        { error: 'Phone number is required for WhatsApp and SMS' },
        { status: 400 }
      )
    }

    if (!reminder.email && channel === NotificationChannel.EMAIL) {
      return NextResponse.json(
        { error: 'Email is required for email reminders' },
        { status: 400 }
      )
    }

    const success = await sendPulseReminderService.sendReminder(reminder, channel)

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Reminder sent successfully via ${channel}`,
        channel
      })
    } else {
      return NextResponse.json(
        { error: `Failed to send reminder via ${channel}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error sending reminder:', error)
    return NextResponse.json(
      {
        error: 'Failed to send reminder',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'SendPulse Reminder API',
    endpoints: {
      'POST /api/reminders/send': 'Send a reminder via specified channel',
      'POST /api/reminders/schedule': 'Schedule a reminder',
      'POST /api/reminders/bulk': 'Send bulk reminders'
    },
    supportedChannels: Object.values(NotificationChannel)
  })
}
