/**
 * SendPulse Troubleshooting API
 *
 * Administrative endpoint to troubleshoot message delivery issues
 * using MCP tools for detailed diagnostics
 *
 * POST /api/admin/sendpulse-troubleshoot
 * Body: { phone, issue }
 */
import { NextRequest, NextResponse } from 'next/server'
import { sendPulseAdminTools } from '@/lib/sendpulse-admin-tools'
import { logger, LogCategory } from '@/lib/logger'
export async function POST(request: NextRequest) {
  const timer = logger.startTimer()
  try {
    const body = await request.json()
    const { phone, issue } = body
    if (!phone) {
      return NextResponse.json(
        { error: 'phone is required' },
        { status: 400 }
      )
    }
    const botId = process.env.SENDPULSE_BOT_ID
    if (!botId) {
      return NextResponse.json(
        { error: 'SENDPULSE_BOT_ID not configured' },
        { status: 500 }
      )
    }
    // Get subscriber insight
    const subscriberInsight = await sendPulseAdminTools.getSubscriberInsight(
      botId,
      phone
    )
    // Troubleshoot delivery
    const troubleshooting = await sendPulseAdminTools.troubleshootDelivery(
      botId,
      phone,
      issue || 'Message delivery issue'
    )
    const duration = timer()
    logger.info(LogCategory.SENDPULSE, 'Troubleshooting completed', {
      phone,
      duration
    })
    return NextResponse.json({
      success: true,
      phone,
      subscriber: subscriberInsight,
      troubleshooting,
      timestamp: new Date().toISOString(),
      duration
    })
  } catch (error) {
    const duration = timer()
    logger.error(LogCategory.SENDPULSE, 'Troubleshooting failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      duration
    })
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}