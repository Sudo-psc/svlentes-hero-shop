// API Route: /api/v1/analytics/dashboard
// Real-time dashboard metrics
import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/lib/reminders'
export const runtime = 'nodejs'
/**
 * GET /api/v1/analytics/dashboard
 * Get real-time dashboard metrics (last 24 hours)
 */
export async function GET(request: NextRequest) {
  try {
    const metrics = await analyticsService.getDashboardMetrics()
    return NextResponse.json({
      success: true,
      metrics,
    })
  } catch (error) {
    console.error('Get dashboard metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    )
  }
}