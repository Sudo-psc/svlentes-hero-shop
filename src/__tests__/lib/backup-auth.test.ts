/**
 * Tests para BackupAuthManager
 * Testa métodos de autenticação, validação de credenciais, recuperação
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BackupAuthManager, backupAuth } from '@/lib/backup-auth'

// Mock do fetch global usando vi.stubGlobal
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true
})

describe('BackupAuthManager', () => {
  let authManager: BackupAuthManager

  beforeEach(() => {
    vi.clearAllMocks()
    authManager = new BackupAuthManager()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    // Limpar storage
    authManager = new BackupAuthManager() // Nova instância para limpeza
  })

  describe('Singleton Pattern', () => {
    it('deve retornar mesma instância', () => {
      const instance1 = BackupAuthManager.getInstance()
      const instance2 = BackupAuthManager.getInstance()

      expect(instance1).toBe(instance2)
    })

    it('deve exportar instância singleton', () => {
      expect(backupAuth).toBeInstanceOf(BackupAuthManager)
    })
  })

  describe('Available Methods', () => {
    it('deve retornar métodos de autenticação disponíveis', () => {
      const methods = authManager.getAvailableMethods()

      expect(methods).toHaveLength(4)
      expect(methods[0].type).toBe('firebase')
      expect(methods[0].priority).toBe(1)
      expect(methods[1].type).toBe('phone')
      expect(methods[1].priority).toBe(2)
      expect(methods[2].type).toBe('email')
      expect(methods[2].priority).toBe(3)
      expect(methods[3].type).toBe('token')
      expect(methods[3].priority).toBe(4)
    })

    it('deve ordenar métodos por prioridade', () => {
      const methods = authManager.getAvailableMethods()

      expect(methods[0].priority).toBeLessThan(methods[1].priority)
      expect(methods[1].priority).toBeLessThan(methods[2].priority)
      expect(methods[2].priority).toBeLessThan(methods[3].priority)
    })

    it('deve filtrar métodos indisponíveis', () => {
      // Marcar método como indisponível
      const methods = authManager.getAvailableMethods()
      const whatsappMethod = methods.find(m => m.type === 'phone')
      if (whatsappMethod) {
        whatsappMethod.isAvailable = false
      }

      const availableMethods = authManager.getAvailableMethods()
      expect(availableMethods.find(m => m.type === 'phone')).toBeUndefined()
    })
  })

  describe('Firebase Authentication', () => {
    it('deve autenticar com token Firebase válido', async () => {
      const mockUser = { uid: 'user123', email: 'test@example.com' }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockUser })
      } as Response)

      const result = await authManager.authenticate('firebase', {
        token: 'valid-firebase-token'
      })

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
      expect(result.method).toBe('firebase')
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/verify-firebase-token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'valid-firebase-token' })
        }
      )
    })

    it('deve falhar com token Firebase inválido', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid token' })
      } as Response)

      const result = await authManager.authenticate('firebase', {
        token: 'invalid-token'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Token inválido')
    })

    it('deve falhar quando token não fornecido', async () => {
      const result = await authManager.authenticate('firebase', {})

      expect(result.success).toBe(false)
      expect(result.error).toContain('Token Firebase não fornecido')
    })
  })

  describe('Phone Authentication', () => {
    it('deve solicitar código de verificação por telefone', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, sessionId: 'session123' })
      } as Response)

      const result = await authManager.authenticate('phone', {
        phone: '+5533999898026'
      })

      expect(result.success).toBe(false)
      expect(result.requiresVerification).toBe(true)
      expect(result.verificationData).toEqual({
        phone: '+5533999898026',
        method: 'phone'
      })
    })

    it('deve verificar código de telefone', async () => {
      const mockUser = { uid: 'user123', phone: '+5533999898026' }

      // Mock envio de código
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      // Mock verificação de código
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser })
      } as Response)

      // Primeiro passo: solicitar código
      const sendResult = await authManager.authenticate('phone', {
        phone: '+5533999898026'
      })

      expect(sendResult.requiresVerification).toBe(true)

      // Segundo passo: verificar código
      const verifyResult = await authManager.authenticate('phone', {
        phone: '+5533999898026',
        code: '123456'
      })

      expect(verifyResult.success).toBe(true)
      expect(verifyResult.user).toEqual(mockUser)
      expect(verifyResult.method).toBe('phone')
    })

    it('deve falhar com código incorreto', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid code' })
      } as Response)

      const result = await authManager.authenticate('phone', {
        phone: '+5533999898026',
        code: 'wrong-code'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Código inválido')
    })
  })

  describe('Email Authentication', () => {
    it('deve solicitar código de verificação por email', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      const result = await authManager.authenticate('email', {
        email: 'test@example.com'
      })

      expect(result.success).toBe(false)
      expect(result.requiresVerification).toBe(true)
      expect(result.verificationData).toEqual({
        email: 'test@example.com',
        method: 'email'
      })
    })

    it('deve verificar código de email', async () => {
      const mockUser = { uid: 'user123', email: 'test@example.com' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser })
      } as Response)

      // Solicitar código
      await authManager.authenticate('email', { email: 'test@example.com' })

      // Verificar código
      const result = await authManager.authenticate('email', {
        email: 'test@example.com',
        code: '123456'
      })

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
    })
  })

  describe('Token Authentication', () => {
    it('deve autenticar com token de acesso válido', async () => {
      const mockUser = { uid: 'user123', tokenAccess: true }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockUser })
      } as Response)

      const result = await authManager.authenticate('token', {
        token: 'valid-access-token'
      })

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
      expect(result.method).toBe('token')
    })

    it('deve falhar com token inválido', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Token expired' })
      } as Response)

      const result = await authManager.authenticate('token', {
        token: 'expired-token'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Token inválido')
    })
  })

  describe('Credentials Management', () => {
    it('deve salvar credenciais backup', async () => {
      const credentials = {
        userId: 'user123',
        email: 'test@example.com',
        phone: '+5533999898026',
        method: 'phone' as const,
        expiresAt: Date.now() + 86400000, // 24h
        isActive: true,
        createdAt: Date.now()
      }

      await authManager.saveBackupCredentials(credentials)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'backup_auth_user123',
        JSON.stringify(credentials)
      )
    })

    it('deve carregar credenciais backup', async () => {
      const credentials = {
        userId: 'user123',
        email: 'test@example.com',
        phone: '+5533999898026',
        method: 'phone' as const,
        expiresAt: Date.now() + 86400000,
        isActive: true,
        createdAt: Date.now()
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(credentials))

      const loaded = await authManager.loadBackupCredentials('user123')

      expect(loaded).toEqual(credentials)
    })

    it('deve retornar null para credenciais não encontradas', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const loaded = await authManager.loadBackupCredentials('nonexistent')

      expect(loaded).toBeNull()
    })

    it('deve rejeitar credenciais expiradas', async () => {
      const expiredCredentials = {
        userId: 'user123',
        email: 'test@example.com',
        method: 'email' as const,
        expiresAt: Date.now() - 1000, // Expirado
        isActive: true,
        createdAt: Date.now()
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredCredentials))

      const loaded = await authManager.loadBackupCredentials('user123')

      expect(loaded).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('backup_auth_user123')
    })

    it('deve remover credenciais backup', async () => {
      await authManager.removeBackupCredentials('user123')

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('backup_auth_user123')
    })

    it('deve limpar credenciais expiradas', async () => {
      const expiredCredentials = {
        userId: 'user123',
        email: 'test@example.com',
        method: 'email' as const,
        expiresAt: Date.now() - 1000,
        isActive: true,
        createdAt: Date.now()
      }

      const validCredentials = {
        userId: 'user456',
        email: 'valid@example.com',
        method: 'phone' as const,
        expiresAt: Date.now() + 86400000,
        isActive: true,
        createdAt: Date.now()
      }

      // Mock localStorage com múltiplas chaves
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'backup_auth_user123') {
          return JSON.stringify(expiredCredentials)
        }
        if (key === 'backup_auth_user456') {
          return JSON.stringify(validCredentials)
        }
        if (key.startsWith('backup_auth_')) {
          return JSON.stringify(validCredentials)
        }
        return null
      })

      // Mock Object.keys para localStorage
      Object.defineProperty(localStorageMock, 'length', { value: 2 })
      Object.defineProperty(localStorageMock, 'key', {
        value: vi.fn((index) => {
          if (index === 0) return 'backup_auth_user123'
          if (index === 1) return 'backup_auth_user456'
          return null
        })
      })

      await authManager.cleanupExpiredCredentials()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('backup_auth_user123')
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('backup_auth_user456')
    })
  })

  describe('Backup Statistics', () => {
    it('deve retornar estatísticas do sistema backup', () => {
      // Mock localStorage com dados
      Object.defineProperty(localStorageMock, 'length', { value: 2 })
      Object.defineProperty(localStorageMock, 'key', {
        value: vi.fn((index) => {
          if (index === 0) return 'backup_auth_user123'
          if (index === 1) return 'backup_auth_user456'
          return null
        })
      })

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'backup_auth_user123') {
          return JSON.stringify({
            userId: 'user123',
            method: 'phone',
            expiresAt: Date.now() + 86400000,
            isActive: true
          })
        }
        if (key === 'backup_auth_user456') {
          return JSON.stringify({
            userId: 'user456',
            method: 'email',
            expiresAt: Date.now() - 1000, // Expirado
            isActive: true
          })
        }
        return null
      })

      const stats = authManager.getBackupStats()

      expect(stats.totalCredentials).toBe(2)
      expect(stats.activeCredentials).toBe(1)
      expect(stats.expiredCredentials).toBe(1)
      expect(stats.methods).toHaveLength(2)
      expect(stats.methods.find(m => m.name === 'phone')?.count).toBe(1)
      expect(stats.methods.find(m => m.name === 'email')?.count).toBe(1)
    })

    it('deve retornar estatísticas vazias quando não há dados', () => {
      Object.defineProperty(localStorageMock, 'length', { value: 0 })
      Object.defineProperty(localStorageMock, 'key', { value: vi.fn(() => null) })

      const stats = authManager.getBackupStats()

      expect(stats.totalCredentials).toBe(0)
      expect(stats.activeCredentials).toBe(0)
      expect(stats.expiredCredentials).toBe(0)
      expect(stats.methods).toHaveLength(0)
    })
  })

  describe('Error Handling', () => {
    it('deve lidar com método de autenticação não encontrado', async () => {
      const result = await authManager.authenticate('nonexistent', {})

      expect(result.success).toBe(false)
      expect(result.error).toContain('não encontrado')
    })

    it('deve lidar com método indisponível', async () => {
      const result = await authManager.authenticate('firebase', {}, {
        checkAvailability: true,
        availableMethods: [] // Firebase não disponível
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('não está disponível')
    })

    it('deve lidar com erro de rede', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await authManager.authenticate('firebase', {
        token: 'valid-token'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })

    it('deve lidar com falha no localStorage', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage disabled')
      })

      const credentials = {
        userId: 'user123',
        email: 'test@example.com',
        method: 'email' as const,
        expiresAt: Date.now() + 86400000,
        isActive: true,
        createdAt: Date.now()
      }

      await expect(authManager.saveBackupCredentials(credentials)).rejects.toThrow('Storage disabled')
    })

    it('deve lidar com JSON corrompido no localStorage', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json {')

      const loaded = await authManager.loadBackupCredentials('user123')

      expect(loaded).toBeNull()
    })
  })

  describe('Integration Tests', () => {
    it('deve handle fluxo completo de autenticação backup', async () => {
      const mockUser = { uid: 'user123', email: 'test@example.com' }

      // Passo 1: Tentar Firebase (falhar)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Firebase error' })
      } as Response)

      const firebaseResult = await authManager.authenticate('firebase', {
        token: 'invalid-token'
      })

      expect(firebaseResult.success).toBe(false)

      // Passo 2: Tentar telefone
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      const phoneSendResult = await authManager.authenticate('phone', {
        phone: '+5533999898026'
      })

      expect(phoneSendResult.requiresVerification).toBe(true)

      // Passo 3: Verificar código
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser })
      } as Response)

      const phoneVerifyResult = await authManager.authenticate('phone', {
        phone: '+5533999898026',
        code: '123456'
      })

      expect(phoneVerifyResult.success).toBe(true)
      expect(phoneVerifyResult.user).toEqual(mockUser)

      // Passo 4: Salvar credenciais backup
      const credentials = {
        userId: 'user123',
        email: 'test@example.com',
        phone: '+5533999898026',
        method: 'phone' as const,
        expiresAt: Date.now() + 86400000,
        isActive: true,
        createdAt: Date.now()
      }

      await authManager.saveBackupCredentials(credentials)

      // Passo 5: Verificar recuperação de credenciais
      localStorageMock.getItem.mockReturnValue(JSON.stringify(credentials))

      const loadedCredentials = await authManager.loadBackupCredentials('user123')

      expect(loadedCredentials).toEqual(credentials)
    })

    it('deve fallback para métodos alternativos em ordem de prioridade', async () => {
      const mockUser = { uid: 'user123', email: 'test@example.com' }

      // Firebase indisponível
      mockFetch.mockRejectedValueOnce(new Error('Firebase down'))

      const firebaseResult = await authManager.authenticate('firebase', {
        token: 'token'
      })

      expect(firebaseResult.success).toBe(false)

      // Telefone falha
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Phone service down' })
      } as Response)

      const phoneResult = await authManager.authenticate('phone', {
        phone: '+5533999898026'
      })

      expect(phoneResult.success).toBe(false)

      // Email funciona
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser })
      } as Response)

      const emailResult = await authManager.authenticate('email', {
        email: 'test@example.com',
        code: '123456'
      })

      expect(emailResult.success).toBe(true)
      expect(emailResult.user).toEqual(mockUser)
    })
  })
})