// API Route: /api/v1/reminders/[id]
// Get, update, or delete a specific reminder
import { NextRequest, NextResponse } from 'next/server'
import { notificationService, reminderOrchestrator } from '@/lib/reminders'
export const runtime = 'nodejs'
interface RouteParams {
  params: Promise<{
    id: string
  }>
}
/**
 * GET /api/v1/reminders/[id]
 * Get a specific reminder
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const notification = await notificationService.getNotification(id)
    if (!notification) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({
      success: true,
      reminder: notification,
    })
  } catch (error) {
    console.error('Get reminder error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminder' },
      { status: 500 }
    )
  }
}
/**
 * DELETE /api/v1/reminders/[id]
 * Cancel a scheduled reminder
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    await reminderOrchestrator.cancelReminder(id)
    return NextResponse.json({
      success: true,
      message: 'Reminder cancelled successfully',
    })
  } catch (error) {
    console.error('Cancel reminder error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel reminder' },
      { status: 500 }
    )
  }
}