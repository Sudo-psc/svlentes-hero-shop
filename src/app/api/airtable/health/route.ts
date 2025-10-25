/**
 * Airtable Health Check Endpoint
 * Verifica configuração e conectividade com Airtable
 */

import { NextResponse } from 'next/server'
import { airtableClient } from '@/lib/airtable-client'
import { conversationBackupService } from '@/lib/conversation-backup-service'

export async function GET() {
  try {
    const isConfigured = airtableClient.isConfigured()

    if (!isConfigured) {
      return NextResponse.json({
        status: 'not_configured',
        message: 'Airtable API key or Base ID not configured',
        configured: false,
        healthy: false,
        config: {
          hasApiKey: !!process.env.AIRTABLE_API_KEY,
          hasBaseId: !!process.env.AIRTABLE_BASE_ID,
          conversationsTable: process.env.AIRTABLE_CONVERSATIONS_TABLE || 'Conversations',
          interactionsTable: process.env.AIRTABLE_INTERACTIONS_TABLE || 'Interactions',
          escalationsTable: process.env.AIRTABLE_ESCALATIONS_TABLE || 'Escalations'
        }
      }, { status: 503 })
    }

    // Test connection
    const isHealthy = await airtableClient.healthCheck()

    // Get queue stats
    const queueStats = conversationBackupService.getQueueStats()

    if (isHealthy) {
      return NextResponse.json({
        status: 'healthy',
        message: 'Airtable is configured and responding',
        configured: true,
        healthy: true,
        queue: {
          size: queueStats.size,
          pendingSync: queueStats.items.filter(item => !item.hasAirtableId).length,
          inAirtable: queueStats.items.filter(item => item.hasAirtableId).length
        },
        config: {
          conversationsTable: process.env.AIRTABLE_CONVERSATIONS_TABLE || 'Conversations',
          interactionsTable: process.env.AIRTABLE_INTERACTIONS_TABLE || 'Interactions',
          escalationsTable: process.env.AIRTABLE_ESCALATIONS_TABLE || 'Escalations'
        },
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      status: 'unhealthy',
      message: 'Airtable is configured but not responding',
      configured: true,
      healthy: false,
      queue: {
        size: queueStats.size,
        pendingSync: queueStats.items.filter(item => !item.hasAirtableId).length,
        inAirtable: queueStats.items.filter(item => item.hasAirtableId).length
      }
    }, { status: 503 })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      configured: airtableClient.isConfigured(),
      healthy: false
    }, { status: 500 })
  }
}
