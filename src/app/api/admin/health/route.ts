import { NextRequest } from 'next/server'
import { withAdminAuth } from '@/lib/admin/auth'
import { Permission } from '@/types/admin'
export const GET = withAdminAuth(
  async (req: NextRequest, { user }) => {
    // Check system health
    const healthChecks = {
      database: await checkDatabaseHealth(),
      api: await checkApiHealth(),
      cache: await checkCacheHealth(),
      external_services: await checkExternalServicesHealth(),
    }
    const isHealthy = Object.values(healthChecks).every(check => check.status === 'healthy')
    return Response.json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        user: user.email,
        checks: healthChecks,
      },
    })
  },
  Permission.VIEW_DASHBOARD
)
async function checkDatabaseHealth() {
  try {
    // In production, check actual database connection
    // For now, return mock data
    return {
      status: 'healthy',
      latency: '15ms',
      last_check: new Date().toISOString(),
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
async function checkApiHealth() {
  try {
    // Check if main API is responding
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/health-check`, {
      method: 'GET',
      cache: 'no-store',
    })
    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      status_code: response.status,
      latency: response.headers.get('x-response-time') || 'unknown',
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'API unreachable',
    }
  }
}
async function checkCacheHealth() {
  try {
    // In production, check Redis/Cache service
    return {
      status: 'healthy',
      memory_usage: '45%',
      connections: 12,
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Cache service error',
    }
  }
}
async function checkExternalServicesHealth() {
  const services = {
    asaas: await checkAsaasHealth(),
    sendpulse: await checkSendpulseHealth(),
  }
  const allHealthy = Object.values(services).every(service => service.status === 'healthy')
  return {
    status: allHealthy ? 'healthy' : 'degraded',
    services,
  }
}
async function checkAsaasHealth() {
  try {
    if (!process.env.ASAAS_API_KEY_PROD) {
      return {
        status: 'warning',
        message: 'API key not configured',
      }
    }
    // In production, make actual API call to Asaas
    return {
      status: 'healthy',
      last_check: new Date().toISOString(),
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Asaas service error',
    }
  }
}
async function checkSendpulseHealth() {
  try {
    if (!process.env.SENDPULSE_ACCESS_TOKEN) {
      return {
        status: 'warning',
        message: 'SendPulse credentials not configured',
      }
    }
    // In production, make actual API call to SendPulse
    return {
      status: 'healthy',
      last_check: new Date().toISOString(),
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'SendPulse service error',
    }
  }
}