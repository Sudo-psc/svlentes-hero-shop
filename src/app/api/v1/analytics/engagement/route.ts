// API Route: /api/v1/analytics/engagement
// Get engagement analytics

import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/lib/reminders'

export const runtime = 'nodejs'

/**
 * GET /api/v1/analytics/engagement
 * Get engagement analytics for a time period
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const userId = searchParams.get('userId') || undefined

    // Default to last 7 days if not specified
    const endDate = endDateStr ? new Date(endDateStr) : new Date()
    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const analytics = await analyticsService.getEngagementAnalytics({
      startDate,
      endDate,
      userId,
    })

    return NextResponse.json({
      success: true,
      analytics,
    })
  } catch (error) {
    console.error('Get engagement analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch engagement analytics' },
      { status: 500 }
    )
  }
}
