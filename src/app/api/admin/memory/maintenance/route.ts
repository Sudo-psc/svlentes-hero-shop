/**
 * Memory Maintenance API
 * Provides cleanup and maintenance operations for the bot memory system
 */

import { NextRequest, NextResponse } from 'next/server'
import { botMemory } from '@/lib/langchain-memory'
import { logger, LogCategory } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation } = body

    logger.info(LogCategory.ADMIN, 'Memory maintenance operation requested', {
      operation,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    let result

    switch (operation) {
      case 'cleanup':
        // Clean old sessions and memory
        const deletedCount = await botMemory.cleanup()
        result = {
          operation: 'cleanup',
          deletedSessions: deletedCount,
          timestamp: new Date().toISOString()
        }
        break

      case 'stats':
        // Get current memory statistics
        const stats = await botMemory.getStats()
        result = {
          operation: 'stats',
          ...stats,
          timestamp: new Date().toISOString()
        }
        break

      case 'compress':
        // Force memory compression
        // This would need to be implemented in the memory class
        result = {
          operation: 'compress',
          message: 'Memory compression not yet implemented',
          timestamp: new Date().toISOString()
        }
        break

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid operation',
            validOperations: ['cleanup', 'stats', 'compress']
          },
          { status: 400 }
        )
    }

    logger.info(LogCategory.ADMIN, 'Memory maintenance completed', {
      operation,
      result
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    logger.error(LogCategory.ADMIN, 'Error in memory maintenance', {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Memory maintenance failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const stats = await botMemory.getStats()

    logger.info(LogCategory.ADMIN, 'Memory stats requested', {
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    logger.error(LogCategory.ADMIN, 'Error getting memory stats', {
      error: error instanceof Error ? error.message : 'Unknown'
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve memory statistics'
      },
      { status: 500 }
    )
  }
}