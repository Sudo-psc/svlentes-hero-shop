// Notification Scheduler
// Processes scheduled notifications and sends them through appropriate channels

import { reminderOrchestrator } from './reminder-orchestrator'
import { analyticsService } from './analytics-service'

/**
 * Notification Scheduler
 * Should be called by a cron job or serverless function every minute
 */
export class NotificationScheduler {
  private isProcessing = false

  /**
   * Process all scheduled notifications that are ready to be sent
   * Called by cron job every minute
   */
  async processScheduledNotifications(): Promise<{
    processed: number
    errors: number
  }> {
    // Prevent concurrent processing
    if (this.isProcessing) {
      console.log('Scheduler already running, skipping...')
      return { processed: 0, errors: 0 }
    }

    this.isProcessing = true
    let processed = 0
    let errors = 0

    try {
      console.log('[Scheduler] Starting notification processing...')
      
      // Process up to 100 notifications per batch
      const count = await reminderOrchestrator.processScheduledNotifications(100)
      processed = count

      console.log(`[Scheduler] Processed ${processed} notifications`)
    } catch (error) {
      console.error('[Scheduler] Error processing notifications:', error)
      errors++
    } finally {
      this.isProcessing = false
    }

    return { processed, errors }
  }

  /**
   * Create daily analytics snapshot
   * Should be called once per day at midnight
   */
  async createDailySnapshot(): Promise<void> {
    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      console.log('[Scheduler] Creating daily analytics snapshot...')
      await analyticsService.createDailySnapshot(yesterday)
      console.log('[Scheduler] Daily snapshot created successfully')
    } catch (error) {
      console.error('[Scheduler] Error creating daily snapshot:', error)
    }
  }

  /**
   * Health check for scheduler
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy'
    isProcessing: boolean
    timestamp: Date
  }> {
    return {
      status: 'healthy',
      isProcessing: this.isProcessing,
      timestamp: new Date(),
    }
  }
}

// Export singleton instance
export const notificationScheduler = new NotificationScheduler()
