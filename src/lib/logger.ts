/**
 * Sistema de Logs Estruturados - SV Lentes
 *
 * Sistema centralizado de logging com suporte a diferentes níveis,
 * estruturação de dados e integração com serviços externos.
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export enum LogCategory {
  PAYMENT = 'payment',
  WEBHOOK = 'webhook',
  API = 'api',
  AUTH = 'auth',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  BUSINESS = 'business',
  SYSTEM = 'system',
}

interface LogMetadata {
  [key: string]: any
  userId?: string
  customerId?: string
  subscriptionId?: string
  paymentId?: string
  transactionId?: string
  requestId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  duration?: number
  statusCode?: number
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  metadata?: LogMetadata
  stack?: string
  environment: string
  service: string
  version: string
}

class Logger {
  private service: string = 'svlentes-api'
  private version: string = '1.0.0'
  private environment: string

  constructor() {
    this.environment = process.env.NODE_ENV || 'development'
  }

  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: LogMetadata,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata,
      stack: error?.stack,
      environment: this.environment,
      service: this.service,
      version: this.version,
    }
  }

  private formatLog(entry: LogEntry): string {
    // Em desenvolvimento, formato legível
    if (this.environment === 'development') {
      const emoji = this.getLevelEmoji(entry.level)
      const color = this.getLevelColor(entry.level)

      let output = `${emoji} [${entry.level.toUpperCase()}] ${entry.category} - ${entry.message}`

      if (entry.metadata && Object.keys(entry.metadata).length > 0) {
        output += '\n  Metadata: ' + JSON.stringify(entry.metadata, null, 2)
      }

      if (entry.stack) {
        output += '\n  Stack: ' + entry.stack
      }

      return output
    }

    // Em produção, JSON estruturado
    return JSON.stringify(entry)
  }

  private getLevelEmoji(level: LogLevel): string {
    const emojis = {
      [LogLevel.DEBUG]: '🔍',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.ERROR]: '❌',
      [LogLevel.FATAL]: '🔥',
    }
    return emojis[level] || 'ℹ️'
  }

  private getLevelColor(level: LogLevel): string {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m', // Magenta
    }
    return colors[level] || '\x1b[0m'
  }

  private writeLog(entry: LogEntry): void {
    const formatted = this.formatLog(entry)

    // Console output
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted)
        break
      case LogLevel.INFO:
        console.info(formatted)
        break
      case LogLevel.WARN:
        console.warn(formatted)
        break
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted)
        break
    }

    // Em produção, enviar para serviços externos
    if (this.environment === 'production') {
      this.sendToExternalService(entry)
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // Integração com serviços de logging
    // Exemplos: DataDog, New Relic, CloudWatch, Sentry

    try {
      // DataDog
      if (process.env.DATADOG_API_KEY) {
        // await this.sendToDataDog(entry)
      }

      // Sentry (apenas erros)
      if (process.env.SENTRY_DSN && (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL)) {
        // await this.sendToSentry(entry)
      }

      // CloudWatch
      if (process.env.AWS_CLOUDWATCH_LOG_GROUP) {
        // await this.sendToCloudWatch(entry)
      }
    } catch (error) {
      // Não deixar falha de logging quebrar a aplicação
      console.error('Failed to send log to external service:', error)
    }
  }

  // Métodos públicos de logging

  debug(category: LogCategory, message: string, metadata?: LogMetadata): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, category, message, metadata)
    this.writeLog(entry)
  }

  info(category: LogCategory, message: string, metadata?: LogMetadata): void {
    const entry = this.createLogEntry(LogLevel.INFO, category, message, metadata)
    this.writeLog(entry)
  }

  warn(category: LogCategory, message: string, metadata?: LogMetadata): void {
    const entry = this.createLogEntry(LogLevel.WARN, category, message, metadata)
    this.writeLog(entry)
  }

  error(category: LogCategory, message: string, error?: Error, metadata?: LogMetadata): void {
    const entry = this.createLogEntry(LogLevel.ERROR, category, message, metadata, error)
    this.writeLog(entry)
  }

  fatal(category: LogCategory, message: string, error?: Error, metadata?: LogMetadata): void {
    const entry = this.createLogEntry(LogLevel.FATAL, category, message, metadata, error)
    this.writeLog(entry)
  }

  // Métodos específicos por contexto

  logPayment(action: string, metadata: LogMetadata): void {
    this.info(LogCategory.PAYMENT, `Payment ${action}`, metadata)
  }

  logWebhook(event: string, metadata: LogMetadata): void {
    this.info(LogCategory.WEBHOOK, `Webhook received: ${event}`, metadata)
  }

  logAPI(method: string, path: string, metadata: LogMetadata): void {
    this.info(LogCategory.API, `${method} ${path}`, metadata)
  }

  logAuth(action: string, metadata: LogMetadata): void {
    this.info(LogCategory.AUTH, `Auth ${action}`, metadata)
  }

  logSecurity(event: string, metadata: LogMetadata): void {
    this.warn(LogCategory.SECURITY, `Security event: ${event}`, metadata)
  }

  logPerformance(metric: string, metadata: LogMetadata): void {
    this.info(LogCategory.PERFORMANCE, `Performance: ${metric}`, metadata)
  }

  logBusiness(event: string, metadata: LogMetadata): void {
    this.info(LogCategory.BUSINESS, `Business event: ${event}`, metadata)
  }

  // Helper para medir duração de operações
  startTimer(): () => number {
    const start = Date.now()
    return () => Date.now() - start
  }

  // Helper para log de request/response
  logRequest(req: {
    method: string
    url: string
    headers?: Record<string, string>
    body?: any
  }, requestId?: string): void {
    this.logAPI(req.method, req.url, {
      requestId,
      headers: this.sanitizeHeaders(req.headers),
      bodySize: req.body ? JSON.stringify(req.body).length : 0,
    })
  }

  logResponse(
    req: { method: string; url: string },
    statusCode: number,
    duration: number,
    requestId?: string
  ): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO

    const entry = this.createLogEntry(
      level,
      LogCategory.API,
      `${req.method} ${req.url} - ${statusCode}`,
      {
        requestId,
        statusCode,
        duration,
      }
    )

    this.writeLog(entry)
  }

  // Sanitizar dados sensíveis
  private sanitizeHeaders(headers?: Record<string, string>): Record<string, string> {
    if (!headers) return {}

    const sanitized = { ...headers }
    const sensitiveKeys = ['authorization', 'cookie', 'access_token', 'api-key']

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]'
      }
    }

    return sanitized
  }

  sanitizeMetadata(metadata: LogMetadata): LogMetadata {
    const sanitized = { ...metadata }
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'cvv']

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]'
      }
    }

    return sanitized
  }
}

// Singleton instance
export const logger = new Logger()

// Helper para criar request ID único
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

// Middleware para Next.js API routes
export function withLogging<T>(
  handler: (req: any, res: any) => Promise<T>,
  routeName: string
) {
  return async (req: any, res: any): Promise<T> => {
    const requestId = generateRequestId()
    const timer = logger.startTimer()

    logger.logRequest(
      {
        method: req.method,
        url: req.url,
        headers: req.headers,
      },
      requestId
    )

    try {
      const result = await handler(req, res)
      const duration = timer()

      logger.logResponse(
        { method: req.method, url: req.url },
        res.statusCode || 200,
        duration,
        requestId
      )

      return result
    } catch (error) {
      const duration = timer()

      logger.error(
        LogCategory.API,
        `Error in ${routeName}`,
        error as Error,
        {
          requestId,
          method: req.method,
          url: req.url,
          duration,
        }
      )

      throw error
    }
  }
}

// Export types
export type { LogMetadata, LogEntry }
