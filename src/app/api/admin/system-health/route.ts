import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBackupStats } from '@/lib/history-redundancy'
import { promises as fs } from 'fs'
import path from 'path'
const NOTIFICATION_BACKUP_DIR = '/tmp/svlentes-notifications-backup'
const HISTORY_BACKUP_DIR = '/tmp/svlentes-history-backup'
interface SystemHealthMetrics {
  database: {
    status: 'healthy' | 'degraded' | 'down'
    responseTime: number
    error?: string
  }
  notifications: {
    backupSystem: {
      enabled: boolean
      totalBackups: number
      totalSizeMB: number
      oldestBackup?: string
      newestBackup?: string
    }
    failedNotifications: {
      last24Hours: number
      lastWeek: number
    }
  }
  history: {
    backupSystem: {
      enabled: boolean
      totalBackups: number
      totalSizeMB: number
      oldestBackup?: string
      newestBackup?: string
    }
    totalRecords: number
    recordsLast24Hours: number
  }
  system: {
    nodeVersion: string
    platform: string
    uptime: number
  }
}
/**
 * GET - Get comprehensive system health metrics
 */
export async function GET(req: NextRequest) {
  const metrics: SystemHealthMetrics = {
    database: {
      status: 'healthy',
      responseTime: 0
    },
    notifications: {
      backupSystem: {
        enabled: true,
        totalBackups: 0,
        totalSizeMB: 0
      },
      failedNotifications: {
        last24Hours: 0,
        lastWeek: 0
      }
    },
    history: {
      backupSystem: {
        enabled: true,
        totalBackups: 0,
        totalSizeMB: 0
      },
      totalRecords: 0,
      recordsLast24Hours: 0
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime()
    }
  }
  // Test database connection and response time
  const dbStart = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    metrics.database.responseTime = Date.now() - dbStart
    metrics.database.status = 'healthy'
  } catch (error) {
    metrics.database.responseTime = Date.now() - dbStart
    metrics.database.status = 'down'
    metrics.database.error = error instanceof Error ? error.message : 'Unknown error'
  }
  // Get notification backup stats
  try {
    const notifBackupStats = await getDirectoryStats(NOTIFICATION_BACKUP_DIR)
    metrics.notifications.backupSystem = {
      enabled: true,
      totalBackups: notifBackupStats.fileCount,
      totalSizeMB: parseFloat((notifBackupStats.totalSize / 1024 / 1024).toFixed(2)),
      oldestBackup: notifBackupStats.oldestFile?.toISOString(),
      newestBackup: notifBackupStats.newestFile?.toISOString()
    }
  } catch (error) {
    console.error('Error getting notification backup stats:', error)
  }
  // Get history backup stats
  try {
    const historyBackupStats = await getBackupStats()
    metrics.history.backupSystem = {
      enabled: true,
      totalBackups: historyBackupStats.totalBackups,
      totalSizeMB: parseFloat((historyBackupStats.totalSize / 1024 / 1024).toFixed(2)),
      oldestBackup: historyBackupStats.oldestBackup?.toISOString(),
      newestBackup: historyBackupStats.newestBackup?.toISOString()
    }
  } catch (error) {
    console.error('Error getting history backup stats:', error)
  }
  // Get history record counts
  if (metrics.database.status === 'healthy') {
    try {
      const totalRecords = await prisma.subscriptionHistory.count()
      const recordsLast24Hours = await prisma.subscriptionHistory.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
      metrics.history.totalRecords = totalRecords
      metrics.history.recordsLast24Hours = recordsLast24Hours
    } catch (error) {
      console.error('Error getting history record counts:', error)
    }
  }
  // Get failed notification counts from backup directory
  try {
    const failedLogPath = path.join(NOTIFICATION_BACKUP_DIR, 'failed-notifications.log')
    try {
      const failedLogContent = await fs.readFile(failedLogPath, 'utf-8')
      const lines = failedLogContent.trim().split('\n').filter(l => l.length > 0)
      const last24Hours = lines.filter(line => {
        try {
          const entry = JSON.parse(line)
          const timestamp = new Date(entry.timestamp)
          return timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
        } catch {
          return false
        }
      }).length
      const lastWeek = lines.filter(line => {
        try {
          const entry = JSON.parse(line)
          const timestamp = new Date(entry.timestamp)
          return timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        } catch {
          return false
        }
      }).length
      metrics.notifications.failedNotifications = {
        last24Hours,
        lastWeek
      }
    } catch {
      // File doesn't exist or is empty - no failed notifications
    }
  } catch (error) {
    console.error('Error reading failed notifications log:', error)
  }
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    metrics
  })
}
/**
 * Helper function to get directory statistics
 */
async function getDirectoryStats(dirPath: string): Promise<{
  fileCount: number
  totalSize: number
  oldestFile?: Date
  newestFile?: Date
}> {
  try {
    await fs.access(dirPath)
  } catch {
    return { fileCount: 0, totalSize: 0 }
  }
  const files = await fs.readdir(dirPath)
  const jsonFiles = files.filter(f => f.endsWith('.json'))
  if (jsonFiles.length === 0) {
    return { fileCount: 0, totalSize: 0 }
  }
  let totalSize = 0
  let oldestTime = Number.MAX_SAFE_INTEGER
  let newestTime = 0
  for (const file of jsonFiles) {
    try {
      const filePath = path.join(dirPath, file)
      const stats = await fs.stat(filePath)
      totalSize += stats.size
      if (stats.mtimeMs < oldestTime) oldestTime = stats.mtimeMs
      if (stats.mtimeMs > newestTime) newestTime = stats.mtimeMs
    } catch (error) {
      console.error(`Error getting stats for ${file}:`, error)
    }
  }
  return {
    fileCount: jsonFiles.length,
    totalSize,
    oldestFile: oldestTime < Number.MAX_SAFE_INTEGER ? new Date(oldestTime) : undefined,
    newestFile: newestTime > 0 ? new Date(newestTime) : undefined
  }
}