/**
 * Alerts endpoint for monitoring
 * Handles alert notifications and escalations
 */
import { NextRequest, NextResponse } from 'next/server'
export async function POST(request: NextRequest) {
    try {
        const alert = await request.json()
        // Add server-side metadata
        const enrichedAlert = {
            ...alert,
            id: `alert_${Date.now()}`,
            serverTimestamp: new Date().toISOString(),
            severity: determineSeverity(alert.type, alert.data),
            ip: request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown'
        }
        // Log alert
        console.warn('Alert Triggered:', JSON.stringify(enrichedAlert, null, 2))
        // Process alert based on severity
        await processAlert(enrichedAlert)
        return NextResponse.json({
            success: true,
            alertId: enrichedAlert.id,
            severity: enrichedAlert.severity
        })
    } catch (error) {
        console.error('Failed to process alert:', error)
        return NextResponse.json(
            { error: 'Failed to process alert' },
            { status: 500 }
        )
    }
}
export async function GET(request: NextRequest) {
    try {
        // Return recent alerts
        // In production, this would query your alerts database
        const mockAlerts = [
            {
                id: 'alert_1',
                type: 'performance_threshold_exceeded',
                severity: 'warning',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                data: { metric: 'LCP', value: 3200, threshold: 2500 },
                status: 'resolved'
            },
            {
                id: 'alert_2',
                type: 'error_threshold_exceeded',
                severity: 'critical',
                timestamp: new Date(Date.now() - 1800000).toISOString(),
                data: { errorCount: 15, timeWindow: 3600000 },
                status: 'active'
            }
        ]
        return NextResponse.json({
            alerts: mockAlerts,
            summary: {
                active: mockAlerts.filter(a => a.status === 'active').length,
                resolved: mockAlerts.filter(a => a.status === 'resolved').length,
                total: mockAlerts.length
            }
        })
    } catch (error) {
        console.error('Failed to fetch alerts:', error)
        return NextResponse.json(
            { error: 'Failed to fetch alerts' },
            { status: 500 }
        )
    }
}
// Helper functions
function determineSeverity(type: string, data: any): 'info' | 'warning' | 'critical' {
    switch (type) {
        case 'error_threshold_exceeded':
            return data.errorCount > 20 ? 'critical' : 'warning'
        case 'performance_threshold_exceeded':
            if (data.metric === 'LCP' && data.value > 4000) return 'critical'
            if (data.metric === 'FID' && data.value > 300) return 'critical'
            return 'warning'
        case 'uptime_check_failed':
            return 'critical'
        case 'conversion_rate_drop':
            return data.dropPercentage > 50 ? 'critical' : 'warning'
        default:
            return 'info'
    }
}
async function processAlert(alert: any) {
    // Send notifications based on severity
    switch (alert.severity) {
        case 'critical':
            await sendCriticalAlert(alert)
            break
        case 'warning':
            await sendWarningAlert(alert)
            break
        case 'info':
            await logInfoAlert(alert)
            break
    }
    // Store alert in database
    // await db.alerts.create({ data: alert })
}
async function sendCriticalAlert(alert: any) {
    // Send immediate notifications for critical alerts
    console.error('🚨 CRITICAL ALERT:', alert.type, alert.data)
    // In production, you would:
    // 1. Send email notifications
    // 2. Send SMS/phone alerts
    // 3. Create PagerDuty incident
    // 4. Send Slack notifications
    // Example: Send email
    // await sendEmail({
    //   to: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
    //   subject: `🚨 Critical Alert: ${alert.type}`,
    //   body: `
    //     Alert Type: ${alert.type}
    //     Severity: ${alert.severity}
    //     Time: ${alert.timestamp}
    //     Data: ${JSON.stringify(alert.data, null, 2)}
    //     Environment: ${alert.environment}
    //   `
    // })
    // Example: Send Slack notification
    // if (process.env.SLACK_WEBHOOK_URL) {
    //   await fetch(process.env.SLACK_WEBHOOK_URL, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       text: `🚨 Critical Alert: ${alert.type}`,
    //       attachments: [{
    //         color: 'danger',
    //         fields: [
    //           { title: 'Type', value: alert.type, short: true },
    //           { title: 'Severity', value: alert.severity, short: true },
    //           { title: 'Time', value: alert.timestamp, short: false },
    //           { title: 'Data', value: JSON.stringify(alert.data), short: false }
    //         ]
    //       }]
    //     })
    //   })
    // }
}
async function sendWarningAlert(alert: any) {
    // Send notifications for warning alerts (less urgent)
    console.warn('⚠️ WARNING ALERT:', alert.type, alert.data)
    // In production, you would:
    // 1. Send email notifications (less frequent)
    // 2. Send Slack notifications
    // 3. Log to monitoring dashboard
}
async function logInfoAlert(alert: any) {
    // Just log info alerts
}
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
}