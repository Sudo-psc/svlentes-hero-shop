import { NextRequest, NextResponse } from 'next/server'
import { emailReminderService, type ReminderMessage } from '@/lib/reminders/email-reminder-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reminder } = body as {
      reminder: ReminderMessage
    }

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder data is required' },
        { status: 400 }
      )
    }

    if (!reminder.email) {
      return NextResponse.json(
        { error: 'Email is required for reminders' },
        { status: 400 }
      )
    }

    const success = await emailReminderService.sendReminder(reminder)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Reminder sent successfully via email',
        channel: 'EMAIL'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send reminder via email' },
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
    message: 'Email Reminder API',
    endpoints: {
      'POST /api/reminders/send': 'Send a reminder via email',
      'POST /api/reminders/schedule': 'Schedule a reminder',
      'POST /api/reminders/bulk': 'Send bulk reminders'
    },
    supportedChannels: ['EMAIL']
  })
}
