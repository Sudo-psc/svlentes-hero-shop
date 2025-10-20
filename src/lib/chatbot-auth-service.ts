/**
 * Chatbot Authentication Service
 * Sistema de autenticação via código OTP para gerenciamento de assinaturas pelo WhatsApp
 */
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
export enum ChatbotAuthStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  USED = 'USED'
}
export enum ChatbotSessionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  REVOKED = 'REVOKED'
}
interface AuthCodeGenerationOptions {
  userId: string
  phone: string
  expiresInMinutes?: number
  maxAttempts?: number
}
interface CodeVerificationResult {
  success: boolean
  sessionToken?: string
  error?: string
  attemptsRemaining?: number
}
interface SessionValidationResult {
  valid: boolean
  session?: any
  error?: string
}
export class ChatbotAuthService {
  // Configurações padrão
  private readonly DEFAULT_CODE_EXPIRY_MINUTES = 10
  private readonly DEFAULT_SESSION_EXPIRY_HOURS = 24
  private readonly MAX_ACTIVE_SESSIONS_PER_USER = 3
  private readonly CODE_LENGTH = 6
  /**
   * Gera um código de autenticação numérico de 6 dígitos
   */
  private generateAuthCode(): string {
    // Gera número aleatório entre 100000 e 999999
    const min = 100000
    const max = 999999
    const code = Math.floor(Math.random() * (max - min + 1)) + min
    return code.toString()
  }
  /**
   * Gera um token de sessão seguro
   */
  private generateSessionToken(): string {
    return randomBytes(32).toString('hex')
  }
  /**
   * Gera um código de autenticação para o usuário
   */
  async generateAuthCode(options: AuthCodeGenerationOptions): Promise<{
    success: boolean
    code?: string
    expiresAt?: Date
    error?: string
  }> {
    try {
      const { userId, phone, expiresInMinutes, maxAttempts } = options
      // Verificar se usuário existe
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscriptions: true }
      })
      if (!user) {
        return { success: false, error: 'Usuário não encontrado' }
      }
      // Verificar se o telefone pertence ao usuário
      const userPhone = user.phone || user.whatsapp
      if (userPhone !== phone) {
        return { success: false, error: 'Telefone não corresponde ao usuário' }
      }
      // Revogar códigos pendentes anteriores do mesmo usuário/telefone
      await prisma.chatbotAuthCode.updateMany({
        where: {
          userId,
          phone,
          status: ChatbotAuthStatus.PENDING
        },
        data: {
          status: ChatbotAuthStatus.REVOKED
        }
      })
      // Gerar novo código
      const code = this.generateAuthCode()
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + (expiresInMinutes || this.DEFAULT_CODE_EXPIRY_MINUTES))
      // Criar registro do código
      const authCode = await prisma.chatbotAuthCode.create({
        data: {
          userId,
          phone,
          code,
          status: ChatbotAuthStatus.PENDING,
          expiresAt,
          maxAttempts: maxAttempts || 3,
          attempts: 0
        }
      })
      return {
        success: true,
        code: authCode.code,
        expiresAt: authCode.expiresAt
      }
    } catch (error) {
      console.error('[ChatbotAuth] Erro ao gerar código:', error)
      return {
        success: false,
        error: 'Erro ao gerar código de autenticação'
      }
    }
  }
  /**
   * Verifica um código de autenticação e cria uma sessão se válido
   */
  async verifyAuthCode(
    phone: string,
    code: string,
    conversationId?: string
  ): Promise<CodeVerificationResult> {
    try {
      // Buscar código válido
      const authCode = await prisma.chatbotAuthCode.findFirst({
        where: {
          phone,
          code,
          status: ChatbotAuthStatus.PENDING
        },
        include: {
          user: {
            include: {
              subscriptions: {
                where: {
                  status: {
                    in: ['ACTIVE', 'OVERDUE', 'PAUSED']
                  }
                }
              }
            }
          }
        }
      })
      if (!authCode) {
        return {
          success: false,
          error: 'Código inválido ou expirado'
        }
      }
      // Verificar se expirou
      if (new Date() > authCode.expiresAt) {
        await prisma.chatbotAuthCode.update({
          where: { id: authCode.id },
          data: { status: ChatbotAuthStatus.EXPIRED }
        })
        return {
          success: false,
          error: 'Código expirado'
        }
      }
      // Verificar tentativas
      if (authCode.attempts >= authCode.maxAttempts) {
        await prisma.chatbotAuthCode.update({
          where: { id: authCode.id },
          data: { status: ChatbotAuthStatus.REVOKED }
        })
        return {
          success: false,
          error: 'Número máximo de tentativas excedido'
        }
      }
      // Incrementar tentativas
      await prisma.chatbotAuthCode.update({
        where: { id: authCode.id },
        data: {
          attempts: authCode.attempts + 1
        }
      })
      // Marcar código como verificado
      await prisma.chatbotAuthCode.update({
        where: { id: authCode.id },
        data: {
          status: ChatbotAuthStatus.VERIFIED,
          verifiedAt: new Date()
        }
      })
      // Criar sessão
      const sessionToken = this.generateSessionToken()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + this.DEFAULT_SESSION_EXPIRY_HOURS)
      // Limitar sessões ativas por usuário
      await this.cleanupOldSessions(authCode.userId)
      const session = await prisma.chatbotSession.create({
        data: {
          userId: authCode.userId,
          phone,
          conversationId,
          sessionToken,
          status: ChatbotSessionStatus.ACTIVE,
          expiresAt,
          dataAccessLog: {
            loginAt: new Date(),
            method: 'otp_code'
          }
        }
      })
      return {
        success: true,
        sessionToken: session.sessionToken
      }
    } catch (error) {
      console.error('[ChatbotAuth] Erro ao verificar código:', error)
      return {
        success: false,
        error: 'Erro ao verificar código'
      }
    }
  }
  /**
   * Valida um token de sessão
   */
  async validateSession(sessionToken: string): Promise<SessionValidationResult> {
    try {
      const session = await prisma.chatbotSession.findUnique({
        where: { sessionToken },
        include: {
          user: {
            include: {
              subscriptions: {
                where: {
                  status: {
                    in: ['ACTIVE', 'OVERDUE', 'PAUSED', 'SUSPENDED']
                  }
                },
                include: {
                  benefits: true,
                  orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                  },
                  invoices: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                  },
                  payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                  }
                }
              }
            }
          }
        }
      })
      if (!session) {
        return {
          valid: false,
          error: 'Sessão não encontrada'
        }
      }
      // Verificar se sessão está ativa
      if (session.status !== ChatbotSessionStatus.ACTIVE) {
        return {
          valid: false,
          error: 'Sessão não está ativa'
        }
      }
      // Verificar se expirou
      if (new Date() > session.expiresAt) {
        await prisma.chatbotSession.update({
          where: { id: session.id },
          data: { status: ChatbotSessionStatus.EXPIRED }
        })
        return {
          valid: false,
          error: 'Sessão expirada'
        }
      }
      // Atualizar última atividade
      await prisma.chatbotSession.update({
        where: { id: session.id },
        data: { lastActivityAt: new Date() }
      })
      return {
        valid: true,
        session
      }
    } catch (error) {
      console.error('[ChatbotAuth] Erro ao validar sessão:', error)
      return {
        valid: false,
        error: 'Erro ao validar sessão'
      }
    }
  }
  /**
   * Registra acesso a dados na sessão
   */
  async logDataAccess(sessionToken: string, accessType: string, dataAccessed: any): Promise<void> {
    try {
      const session = await prisma.chatbotSession.findUnique({
        where: { sessionToken }
      })
      if (!session) return
      const currentLog = (session.dataAccessLog as any) || {}
      const accessLog = {
        ...currentLog,
        accesses: [
          ...(currentLog.accesses || []),
          {
            timestamp: new Date(),
            type: accessType,
            data: dataAccessed
          }
        ]
      }
      await prisma.chatbotSession.update({
        where: { sessionToken },
        data: {
          dataAccessLog: accessLog,
          commandsExecuted: session.commandsExecuted + 1
        }
      })
    } catch (error) {
      console.error('[ChatbotAuth] Erro ao registrar acesso:', error)
    }
  }
  /**
   * Encerra uma sessão
   */
  async terminateSession(sessionToken: string, reason?: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      await prisma.chatbotSession.update({
        where: { sessionToken },
        data: {
          status: ChatbotSessionStatus.TERMINATED,
          terminatedAt: new Date(),
          terminationReason: reason || 'user_logout'
        }
      })
      return { success: true }
    } catch (error) {
      console.error('[ChatbotAuth] Erro ao encerrar sessão:', error)
      return {
        success: false,
        error: 'Erro ao encerrar sessão'
      }
    }
  }
  /**
   * Limpa sessões antigas do usuário
   */
  private async cleanupOldSessions(userId: string): Promise<void> {
    try {
      // Buscar sessões ativas do usuário
      const activeSessions = await prisma.chatbotSession.findMany({
        where: {
          userId,
          status: ChatbotSessionStatus.ACTIVE
        },
        orderBy: { createdAt: 'desc' }
      })
      // Se exceder o limite, encerrar as mais antigas
      if (activeSessions.length >= this.MAX_ACTIVE_SESSIONS_PER_USER) {
        const sessionsToTerminate = activeSessions.slice(this.MAX_ACTIVE_SESSIONS_PER_USER - 1)
        for (const session of sessionsToTerminate) {
          await prisma.chatbotSession.update({
            where: { id: session.id },
            data: {
              status: ChatbotSessionStatus.TERMINATED,
              terminatedAt: new Date(),
              terminationReason: 'max_sessions_exceeded'
            }
          })
        }
      }
    } catch (error) {
      console.error('[ChatbotAuth] Erro ao limpar sessões antigas:', error)
    }
  }
  /**
   * Limpa códigos e sessões expirados (job de manutenção)
   */
  async cleanupExpired(): Promise<{
    codesExpired: number
    sessionsExpired: number
  }> {
    try {
      const now = new Date()
      // Expirar códigos antigos
      const codesResult = await prisma.chatbotAuthCode.updateMany({
        where: {
          status: ChatbotAuthStatus.PENDING,
          expiresAt: { lt: now }
        },
        data: { status: ChatbotAuthStatus.EXPIRED }
      })
      // Expirar sessões antigas
      const sessionsResult = await prisma.chatbotSession.updateMany({
        where: {
          status: ChatbotSessionStatus.ACTIVE,
          expiresAt: { lt: now }
        },
        data: { status: ChatbotSessionStatus.EXPIRED }
      })
      return {
        codesExpired: codesResult.count,
        sessionsExpired: sessionsResult.count
      }
    } catch (error) {
      console.error('[ChatbotAuth] Erro na limpeza:', error)
      return { codesExpired: 0, sessionsExpired: 0 }
    }
  }
  /**
   * Busca usuário por telefone para gerar código
   */
  async findUserByPhone(phone: string): Promise<{
    found: boolean
    userId?: string
    userName?: string
    hasActiveSubscription?: boolean
    error?: string
  }> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone },
            { whatsapp: phone }
          ]
        },
        include: {
          subscriptions: {
            where: {
              status: {
                in: ['ACTIVE', 'OVERDUE', 'PAUSED']
              }
            }
          }
        }
      })
      if (!user) {
        return {
          found: false,
          error: 'Usuário não encontrado'
        }
      }
      return {
        found: true,
        userId: user.id,
        userName: user.name || undefined,
        hasActiveSubscription: user.subscriptions.length > 0
      }
    } catch (error) {
      console.error('[ChatbotAuth] Erro ao buscar usuário:', error)
      return {
        found: false,
        error: 'Erro ao buscar usuário'
      }
    }
  }
}
// Singleton instance
export const chatbotAuthService = new ChatbotAuthService()