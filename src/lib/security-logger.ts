/**
 * Security Logger
 * 
 * Logger seguro que sanitiza dados sensíveis antes de registrar.
 * Previne exposição acidental de informações sensíveis em logs.
 */

interface LogContext {
  [key: string]: any
}

/**
 * Campos considerados sensíveis que devem ser mascarados
 */
const SENSITIVE_FIELDS = [
  'password',
  'senha',
  'token',
  'apiKey',
  'api_key',
  'secret',
  'authorization',
  'cookie',
  'cpf',
  'cnpj',
  'cardNumber',
  'card_number',
  'cvv',
  'creditCard',
  'credit_card',
  'ssn',
  'taxId',
  'tax_id',
]

/**
 * Campos que devem ser parcialmente mascarados
 */
const PARTIAL_MASK_FIELDS = [
  'email',
  'phone',
  'telephone',
  'whatsapp',
  'mobile',
]

/**
 * Mascara email preservando primeiros 2 caracteres
 */
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***'
  
  const [user, domain] = email.split('@')
  if (user.length <= 2) return `${user}***@${domain}`
  
  return `${user.substring(0, 2)}***@${domain}`
}

/**
 * Mascara telefone preservando DDD
 */
function maskPhone(phone: string): string {
  if (!phone) return '***'
  
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length <= 2) return '***'
  
  return `(${cleaned.substring(0, 2)})****-****`
}

/**
 * Mascara CPF preservando últimos 2 dígitos
 */
function maskCPF(cpf: string): string {
  if (!cpf) return '***'
  
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return '***'
  
  return `***.***.${cleaned.substring(cleaned.length - 2)}-**`
}

/**
 * Mascara completamente um valor sensível
 */
function maskSensitive(value: any): string {
  if (typeof value === 'string' && value.length > 0) {
    return '***REDACTED***'
  }
  return '***'
}

/**
 * Sanitiza um objeto recursivamente, mascarando campos sensíveis
 */
function sanitizeObject(obj: any, depth: number = 0): any {
  // Prevenir recursão infinita
  if (depth > 10) return '[MAX_DEPTH_REACHED]'
  
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1))
  }

  const sanitized: any = {}

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()

    // Mascarar campos completamente sensíveis
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      sanitized[key] = maskSensitive(value)
      continue
    }

    // Mascarar parcialmente
    if (PARTIAL_MASK_FIELDS.some(field => lowerKey.includes(field))) {
      if (lowerKey.includes('email')) {
        sanitized[key] = typeof value === 'string' ? maskEmail(value) : value
      } else if (lowerKey.includes('cpf')) {
        sanitized[key] = typeof value === 'string' ? maskCPF(value) : value
      } else {
        sanitized[key] = typeof value === 'string' ? maskPhone(value) : value
      }
      continue
    }

    // Recursão para objetos aninhados
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, depth + 1)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Logger seguro que sanitiza dados automaticamente
 */
export class SecurityLogger {
  private static formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const sanitizedContext = context ? sanitizeObject(context) : {}
    
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...sanitizedContext,
    })
  }

  /**
   * Log de informação
   */
  static info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('INFO', message, context))
  }

  /**
   * Log de aviso
   */
  static warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('WARN', message, context))
  }

  /**
   * Log de erro
   */
  static error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }
    }
    
    console.error(this.formatMessage('ERROR', message, errorContext))
  }

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  static debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, context))
    }
  }

  /**
   * Log de evento de webhook
   */
  static webhook(
    provider: 'stripe' | 'asaas',
    eventType: string,
    data: LogContext
  ): void {
    this.info(`Webhook received: ${provider}.${eventType}`, {
      provider,
      eventType,
      ...data,
    })
  }

  /**
   * Log de evento de pagamento
   */
  static payment(
    action: 'created' | 'succeeded' | 'failed' | 'refunded',
    data: LogContext
  ): void {
    this.info(`Payment ${action}`, {
      action,
      ...data,
    })
  }

  /**
   * Log de evento de assinatura
   */
  static subscription(
    action: 'created' | 'updated' | 'canceled' | 'paused' | 'resumed',
    data: LogContext
  ): void {
    this.info(`Subscription ${action}`, {
      action,
      ...data,
    })
  }

  /**
   * Log de segurança (tentativas de acesso não autorizado, etc)
   */
  static security(event: string, data: LogContext): void {
    this.warn(`Security event: ${event}`, {
      securityEvent: event,
      ...data,
    })
  }

  /**
   * Log de conformidade LGPD
   */
  static lgpd(action: string, data: LogContext): void {
    this.info(`LGPD action: ${action}`, {
      lgpdAction: action,
      ...data,
    })
  }
}

/**
 * Exportar funções de sanitização para uso direto
 */
export const sanitize = {
  email: maskEmail,
  phone: maskPhone,
  cpf: maskCPF,
  sensitive: maskSensitive,
  object: sanitizeObject,
}
