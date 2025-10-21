import { NextRequest, NextResponse } from 'next/server'
import {
  recoverHistoryFromBackups,
  cleanOldBackups,
  getBackupStats
} from '@/lib/history-redundancy'
import { requirePermission, createSuccessResponse } from '@/lib/admin-auth'
/**
 * GET - Get backup statistics
 */
export async function GET(req: NextRequest) {
  try {
    // Require admin authentication with system administration permission
    const { user, error } = await requirePermission('admin:system')(req)
    if (error) {
      return error
    }
    const stats = await getBackupStats()
    return createSuccessResponse({
      stats: {
        totalBackups: stats.totalBackups,
        oldestBackup: stats.oldestBackup?.toISOString(),
        newestBackup: stats.newestBackup?.toISOString(),
        totalSizeBytes: stats.totalSize,
        totalSizeMB: (stats.totalSize / 1024 / 1024).toFixed(2)
      }
    }, 'Estatísticas de backup obtidas com sucesso')
  } catch (error) {
    console.error('Error getting backup stats:', error)
    return NextResponse.json(
      { error: 'Erro ao obter estatísticas de backup' },
      { status: 500 }
    )
  }
}
/**
 * POST - Recover history from backups
 */
export async function POST(req: NextRequest) {
  try {
    // Require admin authentication with system administration permission
    const { user, error } = await requirePermission('admin:system')(req)
    if (error) {
      return error
    }
    const result = await recoverHistoryFromBackups()
    return createSuccessResponse({
      recordsRecovered: result.recordsRecovered,
      errors: result.errors
    }, result.recordsRecovered > 0
      ? `${result.recordsRecovered} registros recuperados com sucesso`
      : 'Nenhum registro para recuperar')
  } catch (error) {
    console.error('Error recovering history:', error)
    return NextResponse.json(
      { error: 'Erro ao recuperar histórico' },
      { status: 500 }
    )
  }
}
/**
 * DELETE - Clean old backups
 */
export async function DELETE(req: NextRequest) {
  try {
    // Require admin authentication with system administration permission
    const { user, error } = await requirePermission('admin:system')(req)
    if (error) {
      return error
    }
    const daysToKeep = parseInt(req.nextUrl.searchParams.get('days') || '30')
    if (daysToKeep < 1 || daysToKeep > 365) {
      return NextResponse.json(
        { error: 'Dias deve estar entre 1 e 365' },
        { status: 400 }
      )
    }
    const deletedCount = await cleanOldBackups(daysToKeep)
    return createSuccessResponse({
      deletedCount,
      daysToKeep
    }, `${deletedCount} backups antigos removidos`)
  } catch (error) {
    console.error('Error cleaning backups:', error)
    return NextResponse.json(
      { error: 'Erro ao limpar backups' },
      { status: 500 }
    )
  }
}