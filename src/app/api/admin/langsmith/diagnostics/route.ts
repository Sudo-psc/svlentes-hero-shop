/**
 * LangSmith Diagnostics API
 * Tests connection and provides detailed information about LangSmith integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLangSmithConfig, isLangSmithConfigured, logLangSmithStatus } from '@/lib/langsmith-config'
import { botMemory } from '@/lib/langchain-memory'
import { simpleLangChainProcessor } from '@/lib/simple-langchain-processor'
import { logger, LogCategory } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    logger.info(LogCategory.ADMIN, 'LangSmith diagnostics requested', {
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    // Get LangSmith configuration
    const config = getLangSmithConfig()
    const isConfigured = isLangSmithConfigured()

    // Test basic connectivity
    let connectionStatus = 'not_configured'
    let apiTestResult = null
    let lastTraces = []

    if (isConfigured) {
      try {
        // Test API connection
        const testResponse = await fetch(`${config.endpoint}/health`, {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(5000)
        })

        if (testResponse.ok) {
          connectionStatus = 'connected'
        } else {
          connectionStatus = 'api_error'
          apiTestResult = {
            status: testResponse.status,
            statusText: testResponse.statusText
          }
        }
      } catch (error) {
        connectionStatus = 'connection_failed'
        apiTestResult = {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Get processor and memory stats
    const processorStats = await simpleLangChainProcessor.getStats()
    const memoryStats = await botMemory.getStats()

    // Test LangChain configuration
    const envVars = {
      LANGCHAIN_TRACING_V2: process.env.LANGCHAIN_TRACING_V2,
      LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY ? `${process.env.LANGCHAIN_API_KEY.substring(0, 10)}...` : undefined,
      LANGCHAIN_ENDPOINT: process.env.LANGCHAIN_ENDPOINT,
      LANGCHAIN_PROJECT: process.env.LANGCHAIN_PROJECT
    }

    // Check recent LangChain logs from application logs
    const recentLogs = await getRecentLangChainLogs()

    const diagnostics = {
      timestamp: new Date().toISOString(),
      configuration: {
        isConfigured,
        connectionStatus,
        config: {
          tracingEnabled: config.tracingEnabled,
          endpoint: config.endpoint,
          projectName: config.projectName,
          apiKeyConfigured: !!config.apiKey
        },
        environmentVariables: envVars
      },
      connectivity: {
        apiTestResult,
        endpointReachable: connectionStatus === 'connected',
        lastChecked: new Date().toISOString()
      },
      systemStats: {
        processor: processorStats,
        memory: memoryStats
      },
      logs: {
        recentEntries: recentLogs,
        totalEntries: recentLogs.length
      },
      recommendations: generateRecommendations(config, isConfigured, connectionStatus)
    }

    return NextResponse.json({
      success: true,
      data: diagnostics
    })

  } catch (error) {
    logger.error(LogCategory.ADMIN, 'Error in LangSmith diagnostics', {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        success: false,
        error: 'LangSmith diagnostics failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Get recent LangChain-related logs from system
 */
async function getRecentLangChainLogs(): Promise<any[]> {
  try {
    // In a real implementation, this would query a log storage system
    // For now, we'll return mock recent logs based on system state
    const logs = []

    // Check if we have recent interactions in memory
    const stats = await botMemory.getStats()

    if (stats.totalInteractions > 0) {
      logs.push({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `LangChain processed ${stats.totalInteractions} total interactions`,
        category: 'LANGCHAIN_PROCESSING',
        metadata: { totalInteractions: stats.totalInteractions }
      })
    }

    if (stats.activeSessions > 0) {
      logs.push({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `${stats.activeSessions} active sessions in memory`,
        category: 'LANGCHAIN_MEMORY',
        metadata: { activeSessions: stats.activeSessions }
      })
    }

    return logs
  } catch (error) {
    logger.error(LogCategory.ADMIN, 'Error getting LangChain logs', {
      error: error instanceof Error ? error.message : 'Unknown'
    })
    return []
  }
}

/**
 * Generate recommendations based on configuration status
 */
function generateRecommendations(config: any, isConfigured: boolean, connectionStatus: string): string[] {
  const recommendations: string[] = []

  if (!isConfigured) {
    recommendations.push('Configure LANGCHAIN_TRACING_V2=true and LANGCHAIN_API_KEY to enable observability')
  }

  if (isConfigured && connectionStatus === 'connection_failed') {
    recommendations.push('Check network connectivity to api.smith.langchain.com')
    recommendations.push('Verify LANGCHAIN_API_KEY is valid and not expired')
  }

  if (isConfigured && connectionStatus === 'api_error') {
    recommendations.push('LangSmith API returned an error - check service status')
  }

  if (isConfigured && connectionStatus === 'connected') {
    recommendations.push('Connection working - view traces at https://smith.langchain.com/')
    recommendations.push('Consider setting up alerts for trace failures')
  }

  // Memory optimization recommendations
  if (config.tracingEnabled) {
    recommendations.push('Monitor memory usage with growing trace data')
    recommendations.push('Set up regular cleanup of old traces')
  }

  return recommendations
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation } = body

    logger.info(LogCategory.ADMIN, 'LangSmith diagnostic operation requested', {
      operation,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    let result

    switch (operation) {
      case 'test-connection':
        // Perform detailed connection test
        const config = getLangSmithConfig()
        const testResult = await testLangSmithConnection(config)
        result = {
          operation: 'test-connection',
          ...testResult,
          timestamp: new Date().toISOString()
        }
        break

      case 'clear-cache':
        // Clear LangChain caches if implemented
        result = {
          operation: 'clear-cache',
          message: 'Cache clearing not implemented',
          timestamp: new Date().toISOString()
        }
        break

      case 'refresh-config':
        // Refresh configuration
        const newConfig = getLangSmithConfig()
        logLangSmithStatus()
        result = {
          operation: 'refresh-config',
          config: newConfig,
          timestamp: new Date().toISOString()
        }
        break

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid operation',
            validOperations: ['test-connection', 'clear-cache', 'refresh-config']
          },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    logger.error(LogCategory.ADMIN, 'Error in LangSmith diagnostic operation', {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Diagnostic operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Test LangSmith connection with detailed diagnostics
 */
async function testLangSmithConnection(config: any): Promise<any> {
  if (!config.apiKey) {
    return {
      success: false,
      error: 'API key not configured'
    }
  }

  const tests = []

  // Test 1: Basic connectivity
  try {
    const response = await fetch(`${config.endpoint}/health`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    })

    tests.push({
      name: 'Basic Connectivity',
      success: response.ok,
      status: response.status,
      responseTime: Date.now()
    })
  } catch (error) {
    tests.push({
      name: 'Basic Connectivity',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 2: Project access
  try {
    const response = await fetch(`${config.endpoint}/projects`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    })

    tests.push({
      name: 'Project Access',
      success: response.ok,
      status: response.status,
      responseTime: Date.now()
    })
  } catch (error) {
    tests.push({
      name: 'Project Access',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  return {
    overall: tests.every(t => t.success),
    tests,
    endpoint: config.endpoint,
    project: config.projectName
  }
}