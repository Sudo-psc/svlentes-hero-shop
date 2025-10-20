/**
 * Rate Limiting for Authentication System
 * Previne ataques de força bruta e abuso do sistema de autenticação
 */
import { logger, LogCategory } from '@/lib/logger'
interface RateLimitEntry {
  attempts: number
  firstAttempt: number
  lastAttempt: number
  blockedUntil?: number
}
export class AuthRateLimiter {
  private loginAttempts: Map<string, RateLimitEntry> = new Map()
  private codeGenerations: Map<string, RateLimitEntry> = new Map()
  // Configurações de rate limiting
  private readonly MAX_LOGIN_ATTEMPTS = 5 // Máximo de tentativas de login
  private readonly LOGIN_WINDOW_MS = 15 * 60 * 1000 // 15 minutos
  private readonly LOGIN_BLOCK_DURATION_MS = 30 * 60 * 1000 // 30 minutos de bloqueio
  private readonly MAX_CODE_GENERATIONS = 3 // Máximo de gerações de código
  private readonly CODE_WINDOW_MS = 10 * 60 * 1000 // 10 minutos
  private readonly CODE_BLOCK_DURATION_MS = 60 * 60 * 1000 // 1 hora de bloqueio
  // Limpeza automática de entries antigas
  private cleanupInterval: NodeJS.Timeout
  constructor() {
    // Executar limpeza a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }
  /**
   * Verifica se um telefone pode fazer login
   */
  canAttemptLogin(phone: string): {
    allowed: boolean
    remainingAttempts?: number
    blockedUntil?: Date
    reason?: string
  } {
    const now = Date.now()
    const entry = this.loginAttempts.get(phone)
    if (!entry) {
      return { allowed: true, remainingAttempts: this.MAX_LOGIN_ATTEMPTS }
    }
    // Verificar se está bloqueado
    if (entry.blockedUntil && now < entry.blockedUntil) {
      logger.warn(LogCategory.WHATSAPP, 'Login bloqueado por rate limit', {
        phone,
        blockedUntil: new Date(entry.blockedUntil)
      })
      return {
        allowed: false,
        blockedUntil: new Date(entry.blockedUntil),
        reason: 'too_many_attempts'
      }
    }
    // Verificar se a janela de tempo expirou
    if (now - entry.firstAttempt > this.LOGIN_WINDOW_MS) {
      // Resetar contadores
      this.loginAttempts.delete(phone)
      return { allowed: true, remainingAttempts: this.MAX_LOGIN_ATTEMPTS }
    }
    // Verificar número de tentativas
    const remainingAttempts = this.MAX_LOGIN_ATTEMPTS - entry.attempts
    if (remainingAttempts <= 0) {
      // Bloquear por excesso de tentativas
      entry.blockedUntil = now + this.LOGIN_BLOCK_DURATION_MS
      this.loginAttempts.set(phone, entry)
      logger.warn(LogCategory.WHATSAPP, 'Login bloqueado por excesso de tentativas', {
        phone,
        attempts: entry.attempts,
        blockedUntil: new Date(entry.blockedUntil)
      })
      return {
        allowed: false,
        blockedUntil: new Date(entry.blockedUntil),
        reason: 'max_attempts_exceeded'
      }
    }
    return {
      allowed: true,
      remainingAttempts
    }
  }
  /**
   * Registra uma tentativa de login
   */
  recordLoginAttempt(phone: string): void {
    const now = Date.now()
    const entry = this.loginAttempts.get(phone)
    if (!entry) {
      this.loginAttempts.set(phone, {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      })
    } else {
      entry.attempts++
      entry.lastAttempt = now
      this.loginAttempts.set(phone, entry)
    }
    logger.info(LogCategory.WHATSAPP, 'Tentativa de login registrada', {
      phone,
      attempts: entry?.attempts || 1
    })
  }
  /**
   * Reseta as tentativas de login após sucesso
   */
  resetLoginAttempts(phone: string): void {
    this.loginAttempts.delete(phone)
    logger.info(LogCategory.WHATSAPP, 'Tentativas de login resetadas', { phone })
  }
  /**
   * Verifica se um telefone pode gerar código
   */
  canGenerateCode(phone: string): {
    allowed: boolean
    remainingGenerations?: number
    blockedUntil?: Date
    reason?: string
  } {
    const now = Date.now()
    const entry = this.codeGenerations.get(phone)
    if (!entry) {
      return { allowed: true, remainingGenerations: this.MAX_CODE_GENERATIONS }
    }
    // Verificar se está bloqueado
    if (entry.blockedUntil && now < entry.blockedUntil) {
      logger.warn(LogCategory.WHATSAPP, 'Geração de código bloqueada por rate limit', {
        phone,
        blockedUntil: new Date(entry.blockedUntil)
      })
      return {
        allowed: false,
        blockedUntil: new Date(entry.blockedUntil),
        reason: 'too_many_code_requests'
      }
    }
    // Verificar se a janela de tempo expirou
    if (now - entry.firstAttempt > this.CODE_WINDOW_MS) {
      // Resetar contadores
      this.codeGenerations.delete(phone)
      return { allowed: true, remainingGenerations: this.MAX_CODE_GENERATIONS }
    }
    // Verificar número de gerações
    const remainingGenerations = this.MAX_CODE_GENERATIONS - entry.attempts
    if (remainingGenerations <= 0) {
      // Bloquear por excesso de solicitações
      entry.blockedUntil = now + this.CODE_BLOCK_DURATION_MS
      this.codeGenerations.set(phone, entry)
      logger.warn(LogCategory.WHATSAPP, 'Geração de código bloqueada por excesso de solicitações', {
        phone,
        attempts: entry.attempts,
        blockedUntil: new Date(entry.blockedUntil)
      })
      return {
        allowed: false,
        blockedUntil: new Date(entry.blockedUntil),
        reason: 'max_code_requests_exceeded'
      }
    }
    return {
      allowed: true,
      remainingGenerations
    }
  }
  /**
   * Registra uma geração de código
   */
  recordCodeGeneration(phone: string): void {
    const now = Date.now()
    const entry = this.codeGenerations.get(phone)
    if (!entry) {
      this.codeGenerations.set(phone, {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      })
    } else {
      entry.attempts++
      entry.lastAttempt = now
      this.codeGenerations.set(phone, entry)
    }
    logger.info(LogCategory.WHATSAPP, 'Geração de código registrada', {
      phone,
      attempts: entry?.attempts || 1
    })
  }
  /**
   * Reseta as gerações de código
   */
  resetCodeGenerations(phone: string): void {
    this.codeGenerations.delete(phone)
    logger.info(LogCategory.WHATSAPP, 'Gerações de código resetadas', { phone })
  }
  /**
   * Limpa entries antigas do mapa
   */
  private cleanup(): void {
    const now = Date.now()
    let cleanedLogin = 0
    let cleanedCode = 0
    // Limpar tentativas de login antigas
    for (const [phone, entry] of this.loginAttempts.entries()) {
      if (now - entry.lastAttempt > this.LOGIN_WINDOW_MS * 2) {
        this.loginAttempts.delete(phone)
        cleanedLogin++
      }
    }
    // Limpar gerações de código antigas
    for (const [phone, entry] of this.codeGenerations.entries()) {
      if (now - entry.lastAttempt > this.CODE_WINDOW_MS * 2) {
        this.codeGenerations.delete(phone)
        cleanedCode++
      }
    }
    if (cleanedLogin > 0 || cleanedCode > 0) {
      logger.info(LogCategory.WHATSAPP, 'Rate limiter cleanup executado', {
        loginEntriesRemoved: cleanedLogin,
        codeEntriesRemoved: cleanedCode
      })
    }
  }
  /**
   * Obtém estatísticas do rate limiter
   */
  getStats(): {
    totalLoginAttempts: number
    totalCodeGenerations: number
    blockedPhones: number
  } {
    const now = Date.now()
    let blockedPhones = 0
    for (const entry of this.loginAttempts.values()) {
      if (entry.blockedUntil && now < entry.blockedUntil) {
        blockedPhones++
      }
    }
    for (const entry of this.codeGenerations.values()) {
      if (entry.blockedUntil && now < entry.blockedUntil) {
        blockedPhones++
      }
    }
    return {
      totalLoginAttempts: this.loginAttempts.size,
      totalCodeGenerations: this.codeGenerations.size,
      blockedPhones
    }
  }
  /**
   * Limpa todos os dados (útil para testes)
   */
  reset(): void {
    this.loginAttempts.clear()
    this.codeGenerations.clear()
    logger.info(LogCategory.WHATSAPP, 'Rate limiter resetado completamente')
  }
  /**
   * Cleanup ao destruir a instância
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}
// Singleton instance
export const authRateLimiter = new AuthRateLimiter()