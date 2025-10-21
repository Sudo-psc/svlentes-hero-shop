/**
 * Backup Authentication System
 * Sistema de autenticação backup com múltiplos métodos
 */
import { z } from 'zod'
// Schema para credenciais backup
const BackupCredentialsSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  method: z.enum(['phone', 'email', 'token']),
  expiresAt: z.number(),
  isActive: z.boolean(),
  createdAt: z.number()
})
export type BackupCredentials = z.infer<typeof BackupCredentialsSchema>
export interface AuthMethod {
  name: string
  type: 'firebase' | 'phone' | 'email' | 'token'
  description: string
  icon: string
  isAvailable: boolean
  priority: number
}
export interface AuthResult {
  success: boolean
  user?: any
  error?: string
  method?: string
  requiresVerification?: boolean
  verificationData?: any
}
class BackupAuthManager {
  private static instance: BackupAuthManager
  private storage: Storage
  private methods: Map<string, AuthMethod> = new Map()
  private verificationCallbacks: Map<string, (code: string) => Promise<boolean>> = new Map()
  constructor() {
    this.storage = this.initStorage()
    this.setupAuthMethods()
  }
  static getInstance(): BackupAuthManager {
    if (!BackupAuthManager.instance) {
      BackupAuthManager.instance = new BackupAuthManager()
    }
    return BackupAuthManager.instance
  }
  private initStorage(): Storage {
    // Usar localStorage como storage backup
    try {
      return window.localStorage
    } catch (error) {
      console.error('[BackupAuth] Failed to initialize storage:', error)
      throw new Error('Storage not available')
    }
  }
  private setupAuthMethods(): void {
    // Firebase (método primário)
    this.methods.set('firebase', {
      name: 'Google/Firebase',
      type: 'firebase',
      description: 'Login com conta Google',
      icon: '🔥',
      isAvailable: true,
      priority: 1
    })
    // WhatsApp (método secundário)
    this.methods.set('whatsapp', {
      name: 'WhatsApp',
      type: 'phone',
      description: 'Verificação via WhatsApp',
      icon: '💬',
      isAvailable: true,
      priority: 2
    })
    // Email (método terciário)
    this.methods.set('email', {
      name: 'Email',
      type: 'email',
      description: 'Login via email',
      icon: '📧',
      isAvailable: true,
      priority: 3
    })
    // Token (método de emergência)
    this.methods.set('token', {
      name: 'Token de Acesso',
      type: 'token',
      description: 'Token único de acesso',
      icon: '🔑',
      isAvailable: true,
      priority: 4
    })
  }
  /**
   * Obter métodos de autenticação disponíveis
   */
  getAvailableMethods(): AuthMethod[] {
    return Array.from(this.methods.values())
      .sort((a, b) => a.priority - b.priority)
      .filter(method => method.isAvailable)
  }
  /**
   * Verificar se método está disponível
   */
  isMethodAvailable(methodName: string): boolean {
    const method = this.methods.get(methodName)
    return method?.isAvailable ?? false
  }
  /**
   * Autenticar usando método específico
   */
  async authenticate(methodName: string, credentials: any): Promise<AuthResult> {
    const method = this.methods.get(methodName)
    if (!method) {
      return {
        success: false,
        error: `Método de autenticação "${methodName}" não encontrado`
      }
    }
    if (!method.isAvailable) {
      return {
        success: false,
        error: `Método "${method.name}" não está disponível`
      }
    }
    try {
      switch (method.type) {
        case 'firebase':
          return await this.authenticateWithFirebase(credentials)
        case 'phone':
          return await this.authenticateWithPhone(credentials)
        case 'email':
          return await this.authenticateWithEmail(credentials)
        case 'token':
          return await this.authenticateWithToken(credentials)
        default:
          return {
            success: false,
            error: `Método "${method.type}" não implementado`
          }
      }
    } catch (error) {
      console.error(`[BackupAuth] ${method.name} authentication failed:`, error)
      return {
        success: false,
        error: `Falha na autenticação: ${(error as Error).message}`,
        method: methodName
      }
    }
  }
  /**
   * Autenticação com Firebase (método primário)
   */
  private async authenticateWithFirebase(credentials: { token?: string }): Promise<AuthResult> {
    try {
      if (!credentials.token) {
        throw new Error('Token Firebase não fornecido')
      }
      // Validar token com Firebase Admin
      const response = await fetch('/api/auth/verify-firebase-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credentials.token })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Token inválido')
      }
      const data = await response.json()
      return {
        success: true,
        user: data.user,
        method: 'firebase'
      }
    } catch (error) {
      throw new Error(`Firebase auth failed: ${(error as Error).message}`)
    }
  }
  /**
   * Autenticação com número de telefone
   */
  private async authenticateWithPhone(credentials: { phone: string; code?: string }): Promise<AuthResult> {
    try {
      if (!credentials.phone) {
        throw new Error('Número de telefone não fornecido')
      }
      // Se não tiver código, solicitar envio
      if (!credentials.code) {
        const sendResult = await this.sendPhoneVerificationCode(credentials.phone)
        if (!sendResult.success) {
          throw new Error(sendResult.error)
        }
        return {
          success: false,
          requiresVerification: true,
          verificationData: {
            phone: credentials.phone,
            method: 'phone'
          }
        }
      }
      // Verificar código
      const verifyResult = await this.verifyPhoneCode(credentials.phone, credentials.code)
      if (!verifyResult.success) {
        throw new Error(verifyResult.error)
      }
      return {
        success: true,
        user: verifyResult.user,
        method: 'phone'
      }
    } catch (error) {
      throw new Error(`Phone auth failed: ${(error as Error).message}`)
    }
  }
  /**
   * Autenticação com email
   */
  private async authenticateWithEmail(credentials: { email: string; code?: string }): Promise<AuthResult> {
    try {
      if (!credentials.email) {
        throw new Error('Email não fornecido')
      }
      // Se não tiver código, solicitar envio
      if (!credentials.code) {
        const sendResult = await this.sendEmailVerificationCode(credentials.email)
        if (!sendResult.success) {
          throw new Error(sendResult.error)
        }
        return {
          success: false,
          requiresVerification: true,
          verificationData: {
            email: credentials.email,
            method: 'email'
          }
        }
      }
      // Verificar código
      const verifyResult = await this.verifyEmailCode(credentials.email, credentials.code)
      if (!verifyResult.success) {
        throw new Error(verifyResult.error)
      }
      return {
        success: true,
        user: verifyResult.user,
        method: 'email'
      }
    } catch (error) {
      throw new Error(`Email auth failed: ${(error as Error).message}`)
    }
  }
  /**
   * Autenticação com token de acesso
   */
  private async authenticateWithToken(credentials: { token: string }): Promise<AuthResult> {
    try {
      if (!credentials.token) {
        throw new Error('Token de acesso não fornecido')
      }
      const response = await fetch('/api/auth/verify-access-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credentials.token })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Token inválido')
      }
      const data = await response.json()
      return {
        success: true,
        user: data.user,
        method: 'token'
      }
    } catch (error) {
      throw new Error(`Token auth failed: ${(error as Error).message}`)
    }
  }
  /**
   * Enviar código de verificação por telefone
   */
  private async sendPhoneVerificationCode(phone: string): Promise<AuthResult> {
    try {
      const response = await fetch('/api/auth/send-phone-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha ao enviar código')
      }
      const data = await response.json()
      return {
        success: true,
        verificationData: data
      }
    } catch (error) {
      return {
        success: false,
        error: `Falha ao enviar código: ${(error as Error).message}`
      }
    }
  }
  /**
   * Verificar código por telefone
   */
  private async verifyPhoneCode(phone: string, code: string): Promise<AuthResult> {
    try {
      const response = await fetch('/api/auth/verify-phone-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Código inválido')
      }
      const data = await response.json()
      return {
        success: true,
        user: data.user
      }
    } catch (error) {
      return {
        success: false,
        error: `Falha na verificação: ${(error as Error).message}`
      }
    }
  }
  /**
   * Enviar código de verificação por email
   */
  private async sendEmailVerificationCode(email: string): Promise<AuthResult> {
    try {
      const response = await fetch('/api/auth/send-email-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha ao enviar código')
      }
      const data = await response.json()
      return {
        success: true,
        verificationData: data
      }
    } catch (error) {
      return {
        success: false,
        error: `Falha ao enviar código: ${(error as Error).message}`
      }
    }
  }
  /**
   * Verificar código por email
   */
  private async verifyEmailCode(email: string, code: string): Promise<AuthResult> {
    try {
      const response = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Código inválido')
      }
      const data = await response.json()
      return {
        success: true,
        user: data.user
      }
    } catch (error) {
      return {
        success: false,
        error: `Falha na verificação: ${(error as Error).message}`
      }
    }
  }
  /**
   * Salvar credenciais backup
   */
  async saveBackupCredentials(credentials: BackupCredentials): Promise<void> {
    try {
      const key = `backup_auth_${credentials.userId}`
      this.storage.setItem(key, JSON.stringify(credentials))
    } catch (error) {
      console.error('[BackupAuth] Failed to save backup credentials:', error)
      throw error
    }
  }
  /**
   * Carregar credenciais backup
   */
  async loadBackupCredentials(userId: string): Promise<BackupCredentials | null> {
    try {
      const key = `backup_auth_${userId}`
      const item = this.storage.getItem(key)
      if (!item) return null
      const credentials = JSON.parse(item)
      const validated = BackupCredentialsSchema.parse(credentials)
      // Verificar se não expirou
      if (validated.expiresAt < Date.now()) {
        this.storage.removeItem(key)
        return null
      }
      return validated
    } catch (error) {
      console.error('[BackupAuth] Failed to load backup credentials:', error)
      return null
    }
  }
  /**
   * Remover credenciais backup
   */
  async removeBackupCredentials(userId: string): Promise<void> {
    try {
      const key = `backup_auth_${userId}`
      this.storage.removeItem(key)
    } catch (error) {
      console.error('[BackupAuth] Failed to remove backup credentials:', error)
    }
  }
  /**
   * Limpar todas as credenciais backup expiradas
   */
  async cleanupExpiredCredentials(): Promise<void> {
    try {
      const keys = Object.keys(this.storage)
      const backupKeys = keys.filter(key => key.startsWith('backup_auth_'))
      let cleaned = 0
      for (const key of backupKeys) {
        try {
          const item = this.storage.getItem(key)
          if (item) {
            const credentials = JSON.parse(item)
            if (credentials.expiresAt < Date.now()) {
              this.storage.removeItem(key)
              cleaned++
            }
          }
        } catch (error) {
          // Remover item corrompido
          this.storage.removeItem(key)
          cleaned++
        }
      }
    } catch (error) {
      console.error('[BackupAuth] Failed to cleanup expired credentials:', error)
    }
  }
  /**
   * Obter estatísticas do sistema de backup
   */
  getBackupStats(): {
    totalCredentials: number
    activeCredentials: number
    expiredCredentials: number
    methods: Array<{ name: string; count: number }>
  } {
    try {
      const keys = Object.keys(this.storage)
      const backupKeys = keys.filter(key => key.startsWith('backup_auth_'))
      let total = 0
      let active = 0
      let expired = 0
      const methodCounts = new Map<string, number>()
      for (const key of backupKeys) {
        try {
          const item = this.storage.getItem(key)
          if (item) {
            const credentials = JSON.parse(item)
            total++
            methodCounts.set(
              credentials.method,
              (methodCounts.get(credentials.method) || 0) + 1
            )
            if (credentials.expiresAt > Date.now() && credentials.isActive) {
              active++
            } else {
              expired++
            }
          }
        } catch (error) {
          // Contar como expirado/corrompido
          total++
          expired++
        }
      }
      return {
        totalCredentials: total,
        activeCredentials: active,
        expiredCredentials: expired,
        methods: Array.from(methodCounts.entries()).map(([method, count]) => ({
          name: method,
          count
        }))
      }
    } catch (error) {
      console.error('[BackupAuth] Failed to get backup stats:', error)
      return {
        totalCredentials: 0,
        activeCredentials: 0,
        expiredCredentials: 0,
        methods: []
      }
    }
  }
}

// Export the class for testing
export { BackupAuthManager }

// Exportar instância singleton
export const backupAuth = BackupAuthManager.getInstance()