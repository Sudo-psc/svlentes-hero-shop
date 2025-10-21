/**
 * useBackupAuth Hook
 * Hook para gerenciar autenticação backup
 */
import { useState, useCallback, useEffect } from 'react'
import { backupAuth, AuthMethod, AuthResult } from '@/lib/backup-auth'
import type { BackupCredentials } from '@/lib/backup-auth'
interface UseBackupAuthReturn {
  availableMethods: AuthMethod[]
  isBackupAvailable: boolean
  hasBackupCredentials: boolean
  authenticate: (method: string, credentials: any) => Promise<AuthResult>
  loadBackupCredentials: (userId: string) => Promise<BackupCredentials | null>
  saveBackupCredentials: (credentials: BackupCredentials) => Promise<void>
  removeBackupCredentials: (userId: string) => Promise<void>
  cleanupExpiredCredentials: () => Promise<void>
  backupStats: any
}
export function useBackupAuth(): UseBackupAuthReturn {
  const [availableMethods, setAvailableMethods] = useState<AuthMethod[]>([])
  const [hasBackupCredentials, setHasBackupCredentials] = useState(false)
  const availableMethods = backupAuth.getAvailableMethods()
  const isBackupAvailable = availableMethods.length > 0
  // Verificar se há credenciais backup para o usuário atual
  const checkForBackupCredentials = useCallback(async (userId: string) => {
    try {
      const credentials = await backupAuth.loadBackupCredentials(userId)
      setHasBackupCredentials(!!credentials)
      return credentials
    } catch (error) {
      console.error('[useBackupAuth] Failed to check backup credentials:', error)
      return null
    }
  }, [])
  // Autenticar com método backup
  const authenticate = useCallback(async (method: string, credentials: any): Promise<AuthResult> => {
    try {
      return await backupAuth.authenticate(method, credentials)
    } catch (error) {
      console.error('[useBackupAuth] Authentication failed:', error)
      throw error
    }
  }, [])
  // Carregar credenciais backup
  const loadBackupCredentials = useCallback(async (userId: string): Promise<BackupCredentials | null> => {
    try {
      return await backupAuth.loadBackupCredentials(userId)
    } catch (error) {
      console.error('[useBackupAuth] Failed to load backup credentials:', error)
      return null
    }
  }, [])
  // Salvar credenciais backup
  const saveBackupCredentials = useCallback(async (credentials: BackupCredentials): Promise<void> => {
    try {
      await backupAuth.saveBackupCredentials(credentials)
      setHasBackupCredentials(true)
    } catch (error) {
      console.error('[useBackupAuth] Failed to save backup credentials:', error)
      throw error
    }
  }, [])
  // Remover credenciais backup
  const removeBackupCredentials = useCallback(async (userId: string): Promise<void> => {
    try {
      await backupAuth.removeBackupCredentials(userId)
      setHasBackupCredentials(false)
    } catch (error) {
      console.error('[useBackupAuth] Failed to remove backup credentials:', error)
      throw error
    }
  }, [])
  // Limpar credenciais expiradas
  const cleanupExpiredCredentials = useCallback(async (): Promise<void> => {
    try {
      await backupAuth.cleanupExpiredCredentials()
    } catch (error) {
      console.error('[useBackupAuth] Failed to cleanup expired credentials:', error)
    }
  }, [])
  // Obter estatísticas
  const backupStats = backupAuth.getBackupStats()
  // Atualizar métodos disponíveis
  useEffect(() => {
    setAvailableMethods(backupAuth.getAvailableMethods())
  }, [])
  // Limpar credenciais expiradas ao iniciar
  useEffect(() => {
    cleanupExpiredCredentials()
  }, [cleanupExpiredCredentials])
  return {
    availableMethods,
    isBackupAvailable,
    hasBackupCredentials,
    authenticate,
    loadBackupCredentials,
    saveBackupCredentials,
    removeBackupCredentials,
    cleanupExpiredCredentials,
    backupStats
  }
}