// API Route: /api/v1/ml/metrics
// ML model performance metrics

import { NextRequest, NextResponse } from 'next/server'
import { mlService } from '@/lib/reminders'

export const runtime = 'nodejs'

/**
 * GET /api/v1/ml/metrics
 * Get ML model accuracy and performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const metrics = await mlService.getModelAccuracy()

    return NextResponse.json({
      success: true,
      metrics: {
        accuracy: metrics.accuracy,
        accuracyPercentage: (metrics.accuracy * 100).toFixed(2) + '%',
        totalPredictions: metrics.totalPredictions,
        meetsRequirement: metrics.accuracy >= 0.75,
        requirement: '75%',
      },
    })
  } catch (error) {
    console.error('Get ML metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ML metrics' },
      { status: 500 }
    )
  }
}
