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
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const success = await emailReminderService.sendReminder(reminder)

    return NextResponse.json({
      success,
      status: success ? 'sent' : 'failed',
      message: `Reminder ${success ? 'sent successfully' : 'failed'}`,
      channel: 'EMAIL'
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
