/**
 * Message Statistics API
 * Get message delivery and performance statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { messageStatusTracker } from '@/lib/message-status-tracker'
import { logger, LogCategory } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const timer = logger.startTimer()

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const days = parseInt(searchParams.get('days') || '30')

    logger.debug(LogCategory.API, 'Stats request', { userId, days })

    let stats
    if (userId) {
      // Get stats for specific user
      stats = await messageStatusTracker.getUserStats(userId, days)
    } else {
      // Get global stats
      stats = await messageStatusTracker.getGlobalStats(days)
    }

    const duration = timer()
    logger.debug(LogCategory.API, 'Stats retrieved', {
      userId,
      days,
      duration,
      total: stats.total
    })

    return NextResponse.json({
      success: true,
      data: {
        stats,
        period: {
          days,
          from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString()
        },
        userId: userId || 'global'
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const duration = timer()
    logger.error(LogCategory.API, 'Error getting stats', error as Error, {
      duration
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
