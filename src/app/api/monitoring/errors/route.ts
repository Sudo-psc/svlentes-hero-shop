/**
 * Error logging endpoint for monitoring
 * Collects and stores error reports
 */
import { NextRequest, NextResponse } from 'next/server'
export async function POST(request: NextRequest) {
    try {
        const errorReport = await request.json()
        // Add server-side metadata
        const enrichedReport = {
            ...errorReport,
            serverTimestamp: new Date().toISOString(),
            ip: request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown',
            headers: {
                userAgent: request.headers.get('user-agent'),
                referer: request.headers.get('referer'),
                origin: request.headers.get('origin')
            }
        }
        // Log to console (in production, this would go to a logging service)
        console.error('Error Report:', JSON.stringify(enrichedReport, null, 2))
        // In production, you would:
        // 1. Store in database
        // 2. Send to external monitoring service (Sentry, LogRocket, etc.)
        // 3. Trigger alerts if necessary
        // Example: Store in database
        // await db.errorLogs.create({ data: enrichedReport })
        // Example: Send to Sentry
        // if (process.env.SENTRY_DSN) {
        //   Sentry.captureException(new Error(errorReport.message), {
        //     extra: enrichedReport
        //   })
        // }
        return NextResponse.json({
            success: true,
            id: `error_${Date.now()}`
        })
    } catch (error) {
        console.error('Failed to process error report:', error)
        return NextResponse.json(
            { error: 'Failed to process error report' },
            { status: 500 }
        )
    }
}
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
}