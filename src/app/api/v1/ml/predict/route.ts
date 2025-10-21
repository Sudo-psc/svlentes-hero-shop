// API Route: /api/v1/ml/predict
// ML prediction endpoints
import { NextRequest, NextResponse } from 'next/server'
import { mlService } from '@/lib/reminders'
export const runtime = 'nodejs'
/**
 * POST /api/v1/ml/predict
 * Get ML predictions for optimal channel and time
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }
    const [prediction, channelSelection, fatigueScore] = await Promise.all([
      mlService.predictOptimalChannel(userId),
      mlService.selectChannelWithFallback(userId),
      mlService.calculateFatigueScore(userId),
    ])
    return NextResponse.json({
      success: true,
      prediction: {
        channel: prediction.channel,
        time: prediction.time,
        confidence: prediction.confidence,
      },
      channelSelection: {
        primary: channelSelection.primary,
        fallback: channelSelection.fallback,
        reason: channelSelection.reason,
      },
      fatigueScore,
    })
  } catch (error) {
    console.error('ML predict error:', error)
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    )
  }
}