/**
 * SendPulse Health Check API
 *
 * Administrative endpoint to check SendPulse bot health
 * using MCP tools for detailed diagnostics
 *
 * GET /api/admin/sendpulse-health?bot_id=<bot-id>
 */
import { NextRequest, NextResponse } from 'next/server'
import { sendPulseAdminTools } from '@/lib/sendpulse-admin-tools'
import { logger, LogCategory } from '@/lib/logger'
import { requirePermission } from '@/lib/admin-auth'
export async function GET(request: NextRequest) {
  // Require admin authentication with system administration permission
  const { user, error } = await requirePermission('admin:system')(request)
  if (error) {
    return error
  }

  const timer = logger.startTimer()
  try {
    // Get bot ID from query params or env
    const searchParams = request.nextUrl.searchParams
    const botId = searchParams.get('bot_id') || process.env.SENDPULSE_BOT_ID
    if (!botId) {
      return NextResponse.json(
        { error: 'bot_id is required' },
        { status: 400 }
      )
    }
    // Check MCP availability
    const mcpAvailable = await sendPulseAdminTools.checkMCPAvailability()
    // Get health report
    const healthReport = await sendPulseAdminTools.getBotHealthReport(botId)
    const duration = timer()
    logger.info(LogCategory.SENDPULSE, 'Health check completed', {
      botId,
      status: healthReport.status,
      duration
    })
    return NextResponse.json({
      success: true,
      mcpAvailable,
      health: healthReport,
      timestamp: new Date().toISOString(),
      duration
    })
  } catch (error) {
    const duration = timer()
    logger.error(LogCategory.SENDPULSE, 'Health check failed', {
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