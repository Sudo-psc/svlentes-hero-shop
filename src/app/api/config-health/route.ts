/**
 * Config Health Check API Endpoint
 *
 * Provides health status and metrics for the centralized configuration system.
 * Useful for monitoring, alerting, and debugging.
 */

import { NextResponse } from 'next/server'
import { enhancedConfig } from '@/config/loader-enhanced'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const healthMetrics = enhancedConfig.getHealthMetrics()
    const loadStats = enhancedConfig.getLoadStats()

    const response = {
      status: enhancedConfig.getHealthStatus(),
      operational: enhancedConfig.isOperational(),
      timestamp: new Date().toISOString(),
      metrics: {
        totalAttempts: healthMetrics.totalAttempts,
        successCount: healthMetrics.successCount,
        failureCount: healthMetrics.failureCount,
        successRate: healthMetrics.totalAttempts > 0
          ? (healthMetrics.successCount / healthMetrics.totalAttempts * 100).toFixed(2) + '%'
          : 'N/A',
        lastSuccess: healthMetrics.lastSuccess?.toISOString() || null,
        lastFailure: healthMetrics.lastFailure?.toISOString() || null,
        circuitState: healthMetrics.circuitState
      },
      config: {
        loaded: loadStats.isLoaded,
        loadAttempts: loadStats.attempts,
        lastLoadTime: loadStats.lastLoadTime?.toISOString() || null
      }
    }

    // Set appropriate HTTP status based on health
    const httpStatus = healthMetrics.currentState === 'healthy' ? 200 :
                       healthMetrics.currentState === 'degraded' ? 200 :
                       503 // Service Unavailable for failed state

    return NextResponse.json(response, { status: httpStatus })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      operational: false,
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
