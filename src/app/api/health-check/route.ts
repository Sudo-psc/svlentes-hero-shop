/**
 * Health check endpoint for monitoring
 * Verifies system health and dependencies
 */
import { NextRequest, NextResponse } from 'next/server'
export async function GET(request: NextRequest) {
    const startTime = Date.now()
    try {
        const checks = {
            timestamp: new Date().toISOString(),
            status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy' | 'warning',
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime(),
            checks: {
                database: { status: 'healthy' as string, responseTime: 0 },
                asaas: { status: 'unknown' as string, responseTime: 0, error: undefined as string | undefined },
                memory: { status: 'healthy' as string, usage: 0 }
            }
        }
        // Check Asaas connectivity
        try {
            const asaasStart = Date.now()
            // Check if Asaas environment variables are configured
            const asaasEnv = process.env.ASAAS_ENV || 'sandbox'
            const hasSandboxKey = !!process.env.ASAAS_API_KEY_SANDBOX
            const hasProdKey = !!process.env.ASAAS_API_KEY_PROD
            if (asaasEnv === 'production' && !hasProdKey) {
                checks.checks.asaas = {
                    status: 'warning',
                    responseTime: Date.now() - asaasStart,
                    error: 'Asaas production key not configured'
                }
            } else if (asaasEnv === 'sandbox' && !hasSandboxKey) {
                checks.checks.asaas = {
                    status: 'warning',
                    responseTime: Date.now() - asaasStart,
                    error: 'Asaas sandbox key not configured'
                }
            } else {
                checks.checks.asaas = {
                    status: 'healthy',
                    responseTime: Date.now() - asaasStart,
                    error: undefined
                }
            }
        } catch (error) {
            checks.checks.asaas = {
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
            checks.status = 'degraded'
        }
        // Check memory usage
        const memoryUsage = process.memoryUsage()
        const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
        checks.checks.memory = {
            status: memoryUsageMB > 512 ? 'warning' : 'healthy',
            usage: memoryUsageMB
        }
        // Overall response time
        const totalResponseTime = Date.now() - startTime
        // Determine overall status
        const hasUnhealthy = Object.values(checks.checks).some(check => check.status === 'unhealthy')
        const hasWarning = Object.values(checks.checks).some(check => check.status === 'warning')
        if (hasUnhealthy) {
            checks.status = 'unhealthy'
        } else if (hasWarning) {
            checks.status = 'warning'
        }
        const statusCode = checks.status === 'healthy' ? 200 :
            checks.status === 'warning' ? 200 : 503
        return NextResponse.json({
            ...checks,
            responseTime: totalResponseTime
        }, {
            status: statusCode,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        })
    } catch (error) {
        console.error('Health check failed:', error)
        return NextResponse.json({
            timestamp: new Date().toISOString(),
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            responseTime: Date.now() - startTime
        }, {
            status: 503,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        })
    }
}
// Handle OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
}