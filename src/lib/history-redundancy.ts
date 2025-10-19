/**
 * History Redundancy System
 * Provides backup and recovery mechanisms for subscription history records
 */

import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

const BACKUP_DIR = '/tmp/svlentes-history-backup'

export interface HistoryRecord {
  subscriptionId: string
  userId: string
  changeType: string
  description: string
  oldValue?: any
  newValue?: any
  metadata?: any
  ipAddress?: string
  userAgent?: string
  createdAt?: Date
}

export interface HistoryBackupResult {
  success: boolean
  backupPath?: string
  error?: string
}

export interface HistoryRecoveryResult {
  success: boolean
  recordsRecovered: number
  errors: string[]
}

/**
 * Create a backup of a history record to local file system
 */
export async function backupHistoryRecord(record: HistoryRecord): Promise<HistoryBackupResult> {
  try {
    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true })

    // Create filename with timestamp and user ID
    const timestamp = Date.now()
    const filename = `history_${timestamp}_${record.userId}_${record.changeType}.json`
    const backupPath = path.join(BACKUP_DIR, filename)

    // Write record to file
    const backupData = {
      ...record,
      timestamp: new Date().toISOString(),
      backupVersion: '1.0'
    }

    await fs.writeFile(
      backupPath,
      JSON.stringify(backupData, null, 2),
      'utf-8'
    )

    return {
      success: true,
      backupPath
    }
  } catch (error) {
    console.error('Error backing up history record:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Save history record with automatic backup
 * Uses database-first approach with file system redundancy
 */
export async function saveHistoryWithBackup(
  record: HistoryRecord
): Promise<{ dbSuccess: boolean; backupSuccess: boolean; historyId?: string }> {
  let dbSuccess = false
  let backupSuccess = false
  let historyId: string | undefined

  try {
    // Try to save to database first
    const historyEntry = await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: record.subscriptionId,
        userId: record.userId,
        changeType: record.changeType as any,
        description: record.description,
        oldValue: record.oldValue,
        newValue: record.newValue,
        metadata: record.metadata,
        ipAddress: record.ipAddress,
        userAgent: record.userAgent
      },
      select: { id: true }
    })

    historyId = historyEntry.id
    dbSuccess = true
  } catch (dbError) {
    console.error('Database save failed, proceeding with backup:', dbError)
  }

  // Always create backup, regardless of database success
  const backupResult = await backupHistoryRecord(record)
  backupSuccess = backupResult.success

  // If database failed but backup succeeded, log for later recovery
  if (!dbSuccess && backupSuccess) {
    console.warn(`History record saved to backup only: ${backupResult.backupPath}`)
    await logFailedDatabaseWrite(record, backupResult.backupPath!)
  }

  return { dbSuccess, backupSuccess, historyId }
}

/**
 * Log failed database writes for later recovery
 */
async function logFailedDatabaseWrite(
  record: HistoryRecord,
  backupPath: string
): Promise<void> {
  try {
    const failedLogPath = path.join(BACKUP_DIR, 'failed-writes.log')
    const logEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      backupPath,
      record: {
        userId: record.userId,
        subscriptionId: record.subscriptionId,
        changeType: record.changeType
      }
    }) + '\n'

    await fs.appendFile(failedLogPath, logEntry, 'utf-8')
  } catch (error) {
    console.error('Error logging failed write:', error)
  }
}

/**
 * Recover history records from backup files
 * Attempts to restore backup files to database
 */
export async function recoverHistoryFromBackups(): Promise<HistoryRecoveryResult> {
  const errors: string[] = []
  let recordsRecovered = 0

  try {
    // Check if backup directory exists
    try {
      await fs.access(BACKUP_DIR)
    } catch {
      return {
        success: true,
        recordsRecovered: 0,
        errors: ['No backup directory found']
      }
    }

    // Read all backup files
    const files = await fs.readdir(BACKUP_DIR)
    const backupFiles = files.filter(f => f.startsWith('history_') && f.endsWith('.json'))

    for (const file of backupFiles) {
      try {
        const filePath = path.join(BACKUP_DIR, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const record: HistoryRecord = JSON.parse(content)

        // Check if record already exists in database
        const existing = await prisma.subscriptionHistory.findFirst({
          where: {
            subscriptionId: record.subscriptionId,
            userId: record.userId,
            changeType: record.changeType as any,
            createdAt: record.createdAt ? new Date(record.createdAt) : undefined
          }
        })

        if (existing) {
          // Record already exists, delete backup
          await fs.unlink(filePath)
          continue
        }

        // Attempt to restore to database
        await prisma.subscriptionHistory.create({
          data: {
            subscriptionId: record.subscriptionId,
            userId: record.userId,
            changeType: record.changeType as any,
            description: record.description,
            oldValue: record.oldValue,
            newValue: record.newValue,
            metadata: record.metadata,
            ipAddress: record.ipAddress,
            userAgent: record.userAgent,
            createdAt: record.createdAt ? new Date(record.createdAt) : undefined
          }
        })

        recordsRecovered++

        // Delete backup file after successful recovery
        await fs.unlink(filePath)
      } catch (error) {
        const errorMsg = `Failed to recover ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    return {
      success: errors.length === 0,
      recordsRecovered,
      errors
    }
  } catch (error) {
    return {
      success: false,
      recordsRecovered,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Clean old backup files (older than 30 days)
 */
export async function cleanOldBackups(daysToKeep: number = 30): Promise<number> {
  try {
    await fs.access(BACKUP_DIR)
  } catch {
    return 0 // No backup directory
  }

  const files = await fs.readdir(BACKUP_DIR)
  const backupFiles = files.filter(f => f.startsWith('history_') && f.endsWith('.json'))
  const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)
  let deletedCount = 0

  for (const file of backupFiles) {
    try {
      const filePath = path.join(BACKUP_DIR, file)
      const stats = await fs.stat(filePath)

      if (stats.mtimeMs < cutoffDate) {
        await fs.unlink(filePath)
        deletedCount++
      }
    } catch (error) {
      console.error(`Error cleaning backup file ${file}:`, error)
    }
  }

  return deletedCount
}

/**
 * Get backup statistics
 */
export async function getBackupStats(): Promise<{
  totalBackups: number
  oldestBackup?: Date
  newestBackup?: Date
  totalSize: number
}> {
  try {
    await fs.access(BACKUP_DIR)
  } catch {
    return { totalBackups: 0, totalSize: 0 }
  }

  const files = await fs.readdir(BACKUP_DIR)
  const backupFiles = files.filter(f => f.startsWith('history_') && f.endsWith('.json'))

  if (backupFiles.length === 0) {
    return { totalBackups: 0, totalSize: 0 }
  }

  let totalSize = 0
  let oldestTime = Number.MAX_SAFE_INTEGER
  let newestTime = 0

  for (const file of backupFiles) {
    try {
      const filePath = path.join(BACKUP_DIR, file)
      const stats = await fs.stat(filePath)
      totalSize += stats.size

      if (stats.mtimeMs < oldestTime) oldestTime = stats.mtimeMs
      if (stats.mtimeMs > newestTime) newestTime = stats.mtimeMs
    } catch (error) {
      console.error(`Error getting stats for ${file}:`, error)
    }
  }

  return {
    totalBackups: backupFiles.length,
    oldestBackup: oldestTime < Number.MAX_SAFE_INTEGER ? new Date(oldestTime) : undefined,
    newestBackup: newestTime > 0 ? new Date(newestTime) : undefined,
    totalSize
  }
}
