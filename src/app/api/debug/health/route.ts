/**
 * System Health API
 * Get comprehensive system health status and metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { debugUtilities } from '@/lib/debug-utilities'
import { messageStatusTracker } from '@/lib/message-status-tracker'
import { logger, LogCategory } from '@/lib/logger'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  // Require admin authentication for debug access
  const { user, error } = await requirePermission('admin:system')(request)

  if (error) {
    return error
  }
  const timer = logger.startTimer()

  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    logger.debug(LogCategory.API, 'Health check requested', { days })

    // Get system health
    const health = await debugUtilities.getSystemHealth()

    // Get global stats
    const stats = await messageStatusTracker.getGlobalStats(days)

    // Get failed messages
    const failedMessages = await messageStatusTracker.getFailedMessages(24)

    const duration = timer()
    logger.info(LogCategory.API, 'Health check completed', {
      status: health.status,
      duration,
      failedCount: failedMessages.length
    })

    return NextResponse.json({
      success: true,
      data: {
        health,
        stats,
        failedMessages: failedMessages.slice(0, 10), // Return only first 10
        failedCount: failedMessages.length,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    const duration = timer()
    logger.error(LogCategory.API, 'Error getting system health', error as Error, {
      duration
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        health: {
          status: 'critical',
          checks: {
            database: false,
            sendpulse: false,
            langchain: false
          },
          metrics: {
            messagesLast24h: 0,
            failureRate: 0,
            averageDeliveryTime: 0,
            averageResponseTime: 0
          },
          alerts: ['Health check failed']
        }
      },
      { status: 500 }
    )
  }
}
