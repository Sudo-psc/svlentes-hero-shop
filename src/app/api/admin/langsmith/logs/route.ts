/**
 * LangSmith Logs API
 * Provides access to LangChain traces and logs for administrative viewing
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLangSmithConfig, isLangSmithConfigured } from '@/lib/langsmith-config'
import { botMemory } from '@/lib/langchain-memory'
import { simpleLangChainProcessor } from '@/lib/simple-langchain-processor'
import { logger, LogCategory } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const level = searchParams.get('level') || 'all'
    const category = searchParams.get('category') || 'all'

    logger.info(LogCategory.ADMIN, 'LangSmith logs requested', {
      limit,
      offset,
      level,
      category,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    // Get LangSmith configuration
    const config = getLangSmithConfig()
    const isConfigured = isLangSmithConfigured()

    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        error: 'LangSmith not configured',
        data: {
          logs: [],
          total: 0,
          configured: false
        }
      })
    }

    // Get logs from multiple sources
    const logs = await getLogsFromMultipleSources(limit, offset, level, category)

    return NextResponse.json({
      success: true,
      data: {
        logs: logs.entries,
        total: logs.total,
        filtered: logs.filtered,
        configured: true,
        langsmith: {
          project: config.projectName,
          endpoint: config.endpoint,
          viewUrl: `https://smith.langchain.com/`
        },
        sources: logs.sources,
        filters: {
          level,
          category,
          limit,
          offset
        }
      }
    })

  } catch (error) {
    logger.error(LogCategory.ADMIN, 'Error retrieving LangSmith logs', {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Get logs from multiple sources (memory, processor, system logs)
 */
async function getLogsFromMultipleSources(
  limit: number,
  offset: number,
  level: string,
  category: string
): Promise<{
  entries: any[]
  total: number
  filtered: number
  sources: string[]
}> {
  const allLogs: any[] = []
  const sources: string[] = []

  try {
    // Source 1: Memory system logs
    const memoryLogs = await getMemorySystemLogs()
    if (memoryLogs.length > 0) {
      allLogs.push(...memoryLogs)
      sources.push('memory')
    }

    // Source 2: Processor logs
    const processorLogs = await getProcessorLogs()
    if (processorLogs.length > 0) {
      allLogs.push(...processorLogs)
      sources.push('processor')
    }

    // Source 3: Application logs (mock for now)
    const applicationLogs = await getApplicationLogs()
    if (applicationLogs.length > 0) {
      allLogs.push(...applicationLogs)
      sources.push('application')
    }

    // Sort by timestamp (newest first)
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply filters
    const filteredLogs = allLogs.filter(log => {
      if (level !== 'all' && log.level !== level.toUpperCase()) {
        return false
      }
      if (category !== 'all' && log.category !== category) {
        return false
      }
      return true
    })

    // Apply pagination
    const paginatedLogs = filteredLogs.slice(offset, offset + limit)

    return {
      entries: paginatedLogs,
      total: allLogs.length,
      filtered: filteredLogs.length,
      sources
    }

  } catch (error) {
    logger.error(LogCategory.ADMIN, 'Error getting logs from sources', {
      error: error instanceof Error ? error.message : 'Unknown'
    })
    return {
      entries: [],
      total: 0,
      filtered: 0,
      sources: []
    }
  }
}

/**
 * Get logs from memory system
 */
async function getMemorySystemLogs(): Promise<any[]> {
  try {
    const stats = await botMemory.getStats()
    const logs = []

    if (stats.totalInteractions > 0) {
      logs.push({
        id: `memory_${Date.now()}_interactions`,
        timestamp: new Date().toISOString(),
        level: 'INFO',
        category: 'memory',
        message: `Memory system processed ${stats.totalInteractions} total interactions`,
        metadata: {
          totalSessions: stats.totalSessions,
          activeSessions: stats.activeSessions,
          totalInteractions: stats.totalInteractions,
          cachedSessions: stats.cachedSessions,
          cachedSummaries: stats.cachedSummaries
        },
        source: 'memory',
        traceId: null
      })
    }

    if (stats.cachedSummaries > 0) {
      logs.push({
        id: `memory_${Date.now()}_summaries`,
        timestamp: new Date().toISOString(),
        level: 'INFO',
        category: 'memory',
        message: `Generated ${stats.cachedSummaries} conversation summaries`,
        metadata: {
          cachedSummaries: stats.cachedSummaries,
          compressionEnabled: true
        },
        source: 'memory',
        traceId: null
      })
    }

    return logs
  } catch (error) {
    return []
  }
}

/**
 * Get logs from processor system
 */
async function getProcessorLogs(): Promise<any[]> {
  try {
    const stats = await simpleLangChainProcessor.getStats()
    const logs = []

    logs.push({
      id: `processor_${Date.now()}_status`,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      category: 'processor',
      message: 'LangChain processor status check',
      metadata: {
        totalProcessed: stats.totalProcessed || 0,
        successRate: stats.successRate || 0,
        averageResponseTime: stats.averageResponseTime || 0,
        model: stats.model,
        temperature: stats.temperature,
        maxTokens: stats.maxTokens
      },
      source: 'processor',
      traceId: null
    })

    return logs
  } catch (error) {
    return []
  }
}

/**
 * Get application logs (mock implementation)
 */
async function getApplicationLogs(): Promise<any[]> {
  const logs = []

  // Mock recent application logs based on current system state
  logs.push({
    id: `app_${Date.now()}_startup`,
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    level: 'INFO',
    category: 'application',
    message: 'Application started with LangChain integration',
    metadata: {
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
      langchainConfigured: true
    },
    source: 'application',
    traceId: null
  })

  logs.push({
    id: `app_${Date.now()}_langsmith`,
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    level: 'INFO',
    category: 'langsmith',
    message: 'LangSmith observability initialized',
    metadata: {
      project: process.env.LANGCHAIN_PROJECT,
      tracingEnabled: process.env.LANGCHAIN_TRACING_V2,
      endpoint: process.env.LANGCHAIN_ENDPOINT
    },
    source: 'application',
    traceId: null
  })

  // Add a sample WhatsApp processing log
  logs.push({
    id: `app_${Date.now()}_whatsapp`,
    timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
    level: 'INFO',
    category: 'whatsapp',
    message: 'WhatsApp message processed with LangChain',
    metadata: {
      intent: 'subscription_inquiry',
      responseTime: 1250,
      confidence: 0.89,
      sessionId: 'session_' + Math.random().toString(36).substr(2, 9)
    },
    source: 'application',
    traceId: 'trace_' + Math.random().toString(36).substr(2, 9)
  })

  return logs
}

/**
 * Search logs endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, filters = {} } = body

    logger.info(LogCategory.ADMIN, 'LangSmith log search requested', {
      query,
      filters,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    // Get all logs and search
    const allLogsResult = await getLogsFromMultipleSources(1000, 0, 'all', 'all')

    let searchResults = allLogsResult.entries

    // Apply text search
    if (query) {
      const searchTerm = query.toLowerCase()
      searchResults = searchResults.filter(log =>
        log.message.toLowerCase().includes(searchTerm) ||
        log.category.toLowerCase().includes(searchTerm) ||
        JSON.stringify(log.metadata).toLowerCase().includes(searchTerm)
      )
    }

    // Apply additional filters
    if (filters.level && filters.level !== 'all') {
      searchResults = searchResults.filter(log => log.level === filters.level.toUpperCase())
    }

    if (filters.category && filters.category !== 'all') {
      searchResults = searchResults.filter(log => log.category === filters.category)
    }

    if (filters.source && filters.source !== 'all') {
      searchResults = searchResults.filter(log => log.source === filters.source)
    }

    // Apply pagination to search results
    const limit = filters.limit || 50
    const offset = filters.offset || 0
    const paginatedResults = searchResults.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: {
        logs: paginatedResults,
        total: searchResults.length,
        query,
        filters,
        searchTime: Date.now()
      }
    })

  } catch (error) {
    logger.error(LogCategory.ADMIN, 'Error searching LangSmith logs', {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Log search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}