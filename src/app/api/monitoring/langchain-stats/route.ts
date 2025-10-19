/**
 * LangChain Enhanced Processor Monitoring API
 * Provides detailed statistics and health information about the AI system
 */

import { NextRequest, NextResponse } from 'next/server'
import { enhancedLangChainProcessor } from '@/lib/langchain-enhanced-processor'
import { botMemory } from '@/lib/langchain-memory'
import { getLangSmithConfig } from '@/lib/langsmith-config'
import { logger, LogCategory } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Get enhanced processor stats
    const processorStats = await enhancedLangChainProcessor.getStats()

    // Get memory stats
    const memoryStats = await botMemory.getStats()

    // Get LangSmith configuration
    const langsmithConfig = getLangSmithConfig()

    // Get system performance metrics
    const systemMetrics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    }

    logger.info(LogCategory.MONITORING, 'LangChain stats requested', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent')
    })

    return NextResponse.json({
      success: true,
      data: {
        processor: processorStats,
        memory: memoryStats,
        langsmith: langsmithConfig,
        system: systemMetrics,
        performance: {
          averageResponseTime: 'N/A', // Will be calculated from logs
          totalRequests: 'N/A',
          successRate: 'N/A',
          averageTokensPerRequest: 'N/A',
          estimatedCostPerDay: 'N/A'
        },
        features: {
          enhancedMemory: true,
          persistentMemory: true,
          langSmithIntegration: langsmithConfig.tracingEnabled,
          contextAwareness: true,
          emergencyDetection: true,
          sentimentAnalysis: true,
          intentClassification: true,
          responseCaching: true
        }
      }
    })

  } catch (error) {
    logger.error(LogCategory.MONITORING, 'Error getting LangChain stats', {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve LangChain statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}