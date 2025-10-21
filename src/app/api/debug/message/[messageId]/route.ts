/**
 * Message Debug API
 * Get comprehensive debug information for a specific message
 */
import { NextRequest, NextResponse } from 'next/server'
import { debugUtilities } from '@/lib/debug-utilities'
import { logger, LogCategory } from '@/lib/logger'
import { requirePermission } from '@/lib/admin-auth'
export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  // Require admin authentication for debug access
  const { user, error } = await requirePermission('support:view')(request)
  if (error) {
    return error
  }
  const timer = logger.startTimer()
  try {
    const { messageId } = params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json' // json or text
    logger.debug(LogCategory.API, `Debug request for message: ${messageId}`, {
      format
    })
    const debugInfo = await debugUtilities.getMessageDebugInfo(messageId)
    if (!debugInfo) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }
    if (format === 'text') {
      const report = await debugUtilities.generateMessageReport(messageId)
      const duration = timer()
      logger.debug(LogCategory.API, `Debug report generated`, {
        messageId,
        duration
      })
      return new NextResponse(report, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain'
        }
      })
    }
    const duration = timer()
    logger.debug(LogCategory.API, `Debug info retrieved`, {
      messageId,
      duration
    })
    return NextResponse.json({
      success: true,
      data: debugInfo,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const duration = timer()
    logger.error(LogCategory.API, 'Error getting message debug info', error as Error, {
      messageId: params.messageId,
      duration
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}