/**
 * Phase 3 Error Types
 * Healthcare-grade error classification for Prescription, Payment History, and Delivery Preferences
 *
 * Features:
 * - LGPD-compliant error types (zero PII in logs)
 * - User-friendly messages in Portuguese
 * - Retry and recovery strategies
 * - Severity classification for monitoring
 */

// ============================================================================
// BASE ERROR CLASSES
// ============================================================================

export enum Phase3ErrorSeverity {
  LOW = 'LOW',       // Expected errors (validation, not found)
  MEDIUM = 'MEDIUM', // Recoverable errors (network, temporary)
  HIGH = 'HIGH',     // Service degradation (API down, quota)
  CRITICAL = 'CRITICAL', // System failures (config missing, permissions)
}

export interface Phase3ErrorContext {
  feature: 'prescription' | 'payment-history' | 'delivery-preferences'
  operation: string
  userId?: string
  timestamp?: Date
  metadata?: Record<string, unknown>
}

export abstract class Phase3BaseError extends Error {
  abstract readonly code: string
  abstract readonly userMessage: string
  abstract readonly severity: Phase3ErrorSeverity
  abstract readonly retryable: boolean

  context: Phase3ErrorContext
  originalError?: Error

  constructor(
    message: string,
    context: Phase3ErrorContext,
    originalError?: Error
  ) {
    super(message)
    this.name = this.constructor.name
    this.context = context
    this.originalError = originalError

    // Maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Sanitize context for LGPD compliance
   */
  getSanitizedContext(): Record<string, unknown> {
    return {
      feature: this.context.feature,
      operation: this.context.operation,
      timestamp: this.context.timestamp || new Date(),
      // Include userId only (no PII like email, CPF, phone)
      userId: this.context.userId,
      // Sanitize metadata
      metadata: this.sanitizeMetadata(this.context.metadata),
    }
  }

  private sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
    if (!metadata) return {}

    const sanitized: Record<string, unknown> = {}
    const sensitiveKeys = ['email', 'cpf', 'phone', 'password', 'token', 'address', 'cep']

    for (const [key, value] of Object.entries(metadata)) {
      // Skip sensitive data
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        continue
      }
      sanitized[key] = value
    }

    return sanitized
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      retryable: this.retryable,
      context: this.getSanitizedContext(),
    }
  }
}

// ============================================================================
// PRESCRIPTION UPLOAD ERRORS
// ============================================================================

export class PrescriptionValidationError extends Phase3BaseError {
  readonly code: string
  readonly userMessage: string
  readonly severity = Phase3ErrorSeverity.LOW
  readonly retryable = false

  constructor(
    code: string,
    message: string,
    userMessage: string,
    context: Phase3ErrorContext,
    originalError?: Error
  ) {
    super(message, context, originalError)
    this.code = code
    this.userMessage = userMessage
  }
}

export class PrescriptionUploadError extends Phase3BaseError {
  readonly code: string
  readonly userMessage: string
  readonly severity: Phase3ErrorSeverity
  readonly retryable: boolean
  readonly retryAfter?: number // seconds

  constructor(
    code: string,
    message: string,
    userMessage: string,
    options: {
      severity: Phase3ErrorSeverity
      retryable: boolean
      retryAfter?: number
      context: Phase3ErrorContext
      originalError?: Error
    }
  ) {
    super(message, options.context, options.originalError)
    this.code = code
    this.userMessage = userMessage
    this.severity = options.severity
    this.retryable = options.retryable
    this.retryAfter = options.retryAfter
  }
}

// Prescription validation error codes and messages
export const PRESCRIPTION_ERRORS = {
  // File validation
  FILE_TOO_LARGE: {
    code: 'FILE_TOO_LARGE',
    message: 'File size exceeds maximum allowed',
    userMessage: 'Arquivo muito grande. Tamanho máximo: 5MB',
  },
  INVALID_FORMAT: {
    code: 'INVALID_FORMAT',
    message: 'File format not supported',
    userMessage: 'Formato não suportado. Use PDF, JPG ou PNG',
  },
  FILE_CORRUPTED: {
    code: 'FILE_CORRUPTED',
    message: 'File appears to be corrupted',
    userMessage: 'Arquivo corrompido. Tente novamente',
  },

  // Prescription data validation
  MISSING_OD_OE: {
    code: 'MISSING_OD_OE',
    message: 'Missing degrees for one or both eyes',
    userMessage: 'Informe os graus de ambos os olhos (OD e OE)',
  },
  INVALID_DEGREES: {
    code: 'INVALID_DEGREES',
    message: 'Degrees out of valid range',
    userMessage: 'Graus inválidos. Esfera deve estar entre -20 e +20',
  },
  PRESCRIPTION_EXPIRED: {
    code: 'PRESCRIPTION_EXPIRED',
    message: 'Prescription is expired',
    userMessage: 'Prescrição vencida. Prescrições são válidas por 1 ano',
  },
  MISSING_CRM: {
    code: 'MISSING_CRM',
    message: 'Doctor CRM number is required',
    userMessage: 'CRM do médico oftalmologista é obrigatório',
  },

  // Upload errors
  NETWORK_TIMEOUT: {
    code: 'NETWORK_TIMEOUT',
    message: 'Network timeout during upload',
    userMessage: 'Tempo esgotado. Verifique sua conexão e tente novamente',
  },
  STORAGE_ERROR: {
    code: 'STORAGE_ERROR',
    message: 'Failed to save file to storage',
    userMessage: 'Erro ao salvar arquivo. Tente novamente',
  },
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Failed to save prescription metadata',
    userMessage: 'Erro ao salvar informações. Tente novamente',
  },
  QUOTA_EXCEEDED: {
    code: 'QUOTA_EXCEEDED',
    message: 'Storage quota exceeded',
    userMessage: 'Limite de armazenamento atingido. Entre em contato com o suporte',
  },
  PERMISSION_DENIED: {
    code: 'PERMISSION_DENIED',
    message: 'Permission denied for file upload',
    userMessage: 'Sem permissão para enviar arquivo. Faça login novamente',
  },
} as const

// ============================================================================
// PAYMENT HISTORY ERRORS
// ============================================================================

export class PaymentHistoryError extends Phase3BaseError {
  readonly code: string
  readonly userMessage: string
  readonly severity: Phase3ErrorSeverity
  readonly retryable: boolean

  constructor(
    code: string,
    message: string,
    userMessage: string,
    options: {
      severity: Phase3ErrorSeverity
      retryable: boolean
      context: Phase3ErrorContext
      originalError?: Error
    }
  ) {
    super(message, options.context, options.originalError)
    this.code = code
    this.userMessage = userMessage
    this.severity = options.severity
    this.retryable = options.retryable
  }
}

export class PaymentDataValidationError extends Phase3BaseError {
  readonly code = 'PAYMENT_DATA_INVALID'
  readonly userMessage = 'Dados de pagamento inválidos'
  readonly severity = Phase3ErrorSeverity.MEDIUM
  readonly retryable = false

  invalidCount: number
  validPayments: unknown[]

  constructor(
    message: string,
    context: Phase3ErrorContext,
    invalidCount: number,
    validPayments: unknown[],
    originalError?: Error
  ) {
    super(message, context, originalError)
    this.invalidCount = invalidCount
    this.validPayments = validPayments
  }
}

export const PAYMENT_HISTORY_ERRORS = {
  // API errors
  API_TIMEOUT: {
    code: 'API_TIMEOUT',
    message: 'API request timeout',
    userMessage: 'Tempo esgotado ao buscar histórico. Tente novamente',
    severity: Phase3ErrorSeverity.MEDIUM,
    retryable: true,
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    userMessage: 'Erro ao buscar histórico. Tente novamente em instantes',
    severity: Phase3ErrorSeverity.HIGH,
    retryable: true,
  },
  RATE_LIMIT: {
    code: 'RATE_LIMIT',
    message: 'Rate limit exceeded',
    userMessage: 'Muitas tentativas. Aguarde 60 segundos e tente novamente',
    severity: Phase3ErrorSeverity.MEDIUM,
    retryable: true,
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Forbidden access to payment history',
    userMessage: 'Sem permissão para acessar histórico. Faça login novamente',
    severity: Phase3ErrorSeverity.HIGH,
    retryable: false,
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: 'Payment history not found',
    userMessage: 'Nenhum histórico de pagamentos encontrado',
    severity: Phase3ErrorSeverity.LOW,
    retryable: false,
  },

  // Data validation
  INVALID_DATA: {
    code: 'INVALID_DATA',
    message: 'Invalid payment data received',
    userMessage: 'Dados recebidos estão inconsistentes',
    severity: Phase3ErrorSeverity.MEDIUM,
    retryable: false,
  },
} as const

// ============================================================================
// DELIVERY PREFERENCES ERRORS
// ============================================================================

export class DeliveryPreferencesError extends Phase3BaseError {
  readonly code: string
  readonly userMessage: string
  readonly severity: Phase3ErrorSeverity
  readonly retryable: boolean

  constructor(
    code: string,
    message: string,
    userMessage: string,
    options: {
      severity: Phase3ErrorSeverity
      retryable: boolean
      context: Phase3ErrorContext
      originalError?: Error
    }
  ) {
    super(message, options.context, options.originalError)
    this.code = code
    this.userMessage = userMessage
    this.severity = options.severity
    this.retryable = options.retryable
  }
}

export class CEPValidationError extends Phase3BaseError {
  readonly code: string
  readonly userMessage: string
  readonly severity = Phase3ErrorSeverity.LOW
  readonly retryable: boolean

  constructor(
    code: string,
    message: string,
    userMessage: string,
    retryable: boolean,
    context: Phase3ErrorContext,
    originalError?: Error
  ) {
    super(message, context, originalError)
    this.code = code
    this.userMessage = userMessage
    this.retryable = retryable
  }
}

export const DELIVERY_ERRORS = {
  // CEP validation
  CEP_INVALID_FORMAT: {
    code: 'CEP_INVALID_FORMAT',
    message: 'CEP format is invalid',
    userMessage: 'CEP inválido. Use o formato: 12345-678',
    severity: Phase3ErrorSeverity.LOW,
    retryable: false,
  },
  CEP_NOT_FOUND: {
    code: 'CEP_NOT_FOUND',
    message: 'CEP not found in database',
    userMessage: 'CEP não encontrado. Verifique e tente novamente',
    severity: Phase3ErrorSeverity.LOW,
    retryable: false,
  },
  CEP_API_ERROR: {
    code: 'CEP_API_ERROR',
    message: 'Failed to fetch CEP data',
    userMessage: 'Erro ao buscar CEP. Preencha o endereço manualmente',
    severity: Phase3ErrorSeverity.MEDIUM,
    retryable: true,
  },

  // Form validation
  STREET_REQUIRED: {
    code: 'STREET_REQUIRED',
    message: 'Street name is required',
    userMessage: 'Rua é obrigatória',
    severity: Phase3ErrorSeverity.LOW,
    retryable: false,
  },
  NUMBER_REQUIRED: {
    code: 'NUMBER_REQUIRED',
    message: 'Street number is required',
    userMessage: 'Número é obrigatório',
    severity: Phase3ErrorSeverity.LOW,
    retryable: false,
  },
  STATE_INVALID: {
    code: 'STATE_INVALID',
    message: 'Invalid Brazilian state code',
    userMessage: 'Estado inválido',
    severity: Phase3ErrorSeverity.LOW,
    retryable: false,
  },
  PHONE_INVALID: {
    code: 'PHONE_INVALID',
    message: 'Invalid phone number format',
    userMessage: 'Telefone inválido. Use o formato: (11) 98765-4321',
    severity: Phase3ErrorSeverity.LOW,
    retryable: false,
  },

  // Save errors
  SAVE_FAILED: {
    code: 'SAVE_FAILED',
    message: 'Failed to save delivery preferences',
    userMessage: 'Erro ao salvar preferências. Tente novamente',
    severity: Phase3ErrorSeverity.HIGH,
    retryable: true,
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network error during save',
    userMessage: 'Erro de conexão. Verifique sua internet e tente novamente',
    severity: Phase3ErrorSeverity.MEDIUM,
    retryable: true,
  },
} as const

// ============================================================================
// CIRCUIT BREAKER STATE
// ============================================================================

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing recovery
}

export interface CircuitBreakerState {
  state: CircuitState
  failureCount: number
  lastFailureTime?: Date
  nextAttemptTime?: Date
}

// ============================================================================
// ERROR FACTORY FUNCTIONS
// ============================================================================

export function createPrescriptionValidationError(
  errorKey: keyof typeof PRESCRIPTION_ERRORS,
  context: Phase3ErrorContext,
  originalError?: Error
): PrescriptionValidationError {
  const error = PRESCRIPTION_ERRORS[errorKey]
  return new PrescriptionValidationError(
    error.code,
    error.message,
    error.userMessage,
    context,
    originalError
  )
}

export function createPrescriptionUploadError(
  errorKey: keyof typeof PRESCRIPTION_ERRORS,
  context: Phase3ErrorContext,
  options: {
    severity: Phase3ErrorSeverity
    retryable: boolean
    retryAfter?: number
    originalError?: Error
  }
): PrescriptionUploadError {
  const error = PRESCRIPTION_ERRORS[errorKey]
  return new PrescriptionUploadError(
    error.code,
    error.message,
    error.userMessage,
    {
      ...options,
      context,
    }
  )
}

export function createPaymentHistoryError(
  errorKey: keyof typeof PAYMENT_HISTORY_ERRORS,
  context: Phase3ErrorContext,
  originalError?: Error
): PaymentHistoryError {
  const error = PAYMENT_HISTORY_ERRORS[errorKey]
  return new PaymentHistoryError(
    error.code,
    error.message,
    error.userMessage,
    {
      severity: error.severity,
      retryable: error.retryable,
      context,
      originalError,
    }
  )
}

export function createDeliveryPreferencesError(
  errorKey: keyof typeof DELIVERY_ERRORS,
  context: Phase3ErrorContext,
  originalError?: Error
): DeliveryPreferencesError {
  const error = DELIVERY_ERRORS[errorKey]
  return new DeliveryPreferencesError(
    error.code,
    error.message,
    error.userMessage,
    {
      severity: error.severity,
      retryable: error.retryable,
      context,
      originalError,
    }
  )
}

export function createCEPValidationError(
  errorKey: keyof typeof DELIVERY_ERRORS,
  context: Phase3ErrorContext,
  originalError?: Error
): CEPValidationError {
  const error = DELIVERY_ERRORS[errorKey]
  return new CEPValidationError(
    error.code,
    error.message,
    error.userMessage,
    error.retryable,
    context,
    originalError
  )
}
