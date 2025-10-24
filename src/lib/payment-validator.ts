/**
 * Payment Validator
 * Validates payment history data with sanitization and error recovery
 *
 * Features:
 * - Zod schema validation with fallback
 * - Data inconsistency detection
 * - LGPD-compliant error logging (no PII)
 * - Graceful degradation for partial data
 */

import { z } from 'zod'
import {
  PaymentDataValidationError,
  Phase3ErrorContext,
} from './phase3-error-types'

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * Payment status enum
 */
export const PaymentStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'RECEIVED',
  'OVERDUE',
  'REFUNDED',
  'CANCELLED',
])

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>

/**
 * Payment method enum
 */
export const PaymentMethodSchema = z.enum([
  'PIX',
  'BOLETO',
  'CREDIT_CARD',
  'DEBIT_CARD',
])

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>

/**
 * Single payment schema
 */
export const PaymentSchema = z.object({
  id: z.string().min(1),
  invoiceId: z.string().optional(),
  subscriptionId: z.string().optional(),

  // Payment details
  amount: z.number().positive(),
  status: PaymentStatusSchema,
  paymentMethod: PaymentMethodSchema.optional(),

  // Dates
  dueDate: z.string().datetime().or(z.date()),
  paymentDate: z.string().datetime().or(z.date()).optional().nullable(),
  confirmedDate: z.string().datetime().or(z.date()).optional().nullable(),

  // Additional info
  description: z.string().optional(),
  installment: z.number().int().positive().optional(),
  totalInstallments: z.number().int().positive().optional(),

  // External references
  externalReference: z.string().optional(),
  transactionId: z.string().optional(),

  // Metadata
  createdAt: z.string().datetime().or(z.date()).optional(),
  updatedAt: z.string().datetime().or(z.date()).optional(),
})

export type Payment = z.infer<typeof PaymentSchema>

/**
 * Payment list schema
 */
export const PaymentListSchema = z.array(PaymentSchema)

/**
 * Payment history response schema
 */
export const PaymentHistoryResponseSchema = z.object({
  payments: PaymentListSchema,
  total: z.number().int().nonnegative(),
  hasMore: z.boolean().optional(),
  nextCursor: z.string().optional(),
})

export type PaymentHistoryResponse = z.infer<typeof PaymentHistoryResponseSchema>

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationResult<T> {
  valid: boolean
  data?: T
  validData?: T
  invalidCount?: number
  errors: Array<{
    field: string
    message: string
    value?: unknown
  }>
  warnings: string[]
}

// ============================================================================
// PAYMENT VALIDATOR CLASS
// ============================================================================

export class PaymentValidator {
  private context: Phase3ErrorContext

  constructor(userId?: string) {
    this.context = {
      feature: 'payment-history',
      operation: 'validation',
      userId,
      timestamp: new Date(),
    }
  }

  /**
   * Validate single payment with strict mode
   */
  validatePayment(
    payment: unknown,
    strict = false
  ): ValidationResult<Payment> {
    const errors: Array<{ field: string; message: string; value?: unknown }> = []
    const warnings: string[] = []

    try {
      const validatedPayment = PaymentSchema.parse(payment)

      // Additional business logic validations
      const businessErrors = this.validateBusinessRules(validatedPayment)
      errors.push(...businessErrors)

      const businessWarnings = this.checkBusinessWarnings(validatedPayment)
      warnings.push(...businessWarnings)

      return {
        valid: errors.length === 0,
        data: validatedPayment,
        validData: validatedPayment,
        errors,
        warnings,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Extract validation errors
        error.errors.forEach((err) => {
          errors.push({
            field: err.path.join('.'),
            message: err.message,
            value: err.message.includes('Required') ? undefined : err.code,
          })
        })

        // In non-strict mode, try to recover partial data
        if (!strict) {
          const partialData = this.extractPartialPaymentData(payment)
          if (partialData) {
            warnings.push('Partial payment data recovered')
            return {
              valid: false,
              validData: partialData,
              errors,
              warnings,
            }
          }
        }
      }

      return {
        valid: false,
        errors,
        warnings,
      }
    }
  }

  /**
   * Validate payment list with error recovery
   */
  validatePaymentData(
    payments: unknown
  ): ValidationResult<Payment[]> {
    const errors: Array<{ field: string; message: string; value?: unknown }> = []
    const warnings: string[] = []
    const validPayments: Payment[] = []
    let invalidCount = 0

    // Check if input is an array
    if (!Array.isArray(payments)) {
      errors.push({
        field: 'root',
        message: 'Expected array of payments',
      })
      return {
        valid: false,
        errors,
        warnings,
      }
    }

    // Validate each payment individually
    payments.forEach((payment, index) => {
      const result = this.validatePayment(payment, false)

      if (result.valid && result.data) {
        validPayments.push(result.data)
      } else if (result.validData) {
        // Partial data recovered
        validPayments.push(result.validData)
        invalidCount++
        warnings.push(`Payment ${index}: Partial data recovered`)
      } else {
        invalidCount++
        result.errors.forEach((err) => {
          errors.push({
            ...err,
            field: `payments[${index}].${err.field}`,
          })
        })
      }
    })

    // Log inconsistencies (without PII)
    if (invalidCount > 0) {
      console.warn('[PaymentHistory] Invalid data detected', {
        totalPayments: payments.length,
        invalidCount,
        validCount: validPayments.length,
        // NO PII: não logar valores, IDs de usuário, etc.
      })
    }

    return {
      valid: invalidCount === 0,
      data: validPayments,
      validData: validPayments,
      invalidCount,
      errors,
      warnings,
    }
  }

  /**
   * Validate payment history response
   */
  validatePaymentHistoryResponse(
    response: unknown
  ): ValidationResult<PaymentHistoryResponse> {
    const errors: Array<{ field: string; message: string; value?: unknown }> = []
    const warnings: string[] = []

    try {
      const validated = PaymentHistoryResponseSchema.parse(response)

      // Validate nested payments
      const paymentsResult = this.validatePaymentData(validated.payments)

      if (!paymentsResult.valid && paymentsResult.validData) {
        // Some payments are invalid but we have valid data
        warnings.push(
          `${paymentsResult.invalidCount} payment(s) had validation issues`
        )

        return {
          valid: true,
          data: {
            ...validated,
            payments: paymentsResult.validData,
            total: paymentsResult.validData.length,
          },
          validData: {
            ...validated,
            payments: paymentsResult.validData,
            total: paymentsResult.validData.length,
          },
          invalidCount: paymentsResult.invalidCount,
          errors: paymentsResult.errors,
          warnings,
        }
      }

      return {
        valid: true,
        data: validated,
        validData: validated,
        errors,
        warnings,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          errors.push({
            field: err.path.join('.'),
            message: err.message,
          })
        })
      }

      return {
        valid: false,
        errors,
        warnings,
      }
    }
  }

  // ============================================================================
  // PRIVATE VALIDATION METHODS
  // ============================================================================

  private validateBusinessRules(
    payment: Payment
  ): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = []

    // Payment date must be after due date for confirmed payments
    if (
      payment.status === 'CONFIRMED' ||
      payment.status === 'RECEIVED'
    ) {
      if (payment.paymentDate && payment.dueDate) {
        const paymentDate = new Date(payment.paymentDate)
        const dueDate = new Date(payment.dueDate)

        if (paymentDate < dueDate) {
          // This is actually ok (early payment), just note it
          // errors.push({ field: 'paymentDate', message: 'Payment before due date' })
        }
      }
    }

    // Installment validation
    if (payment.installment !== undefined && payment.totalInstallments !== undefined) {
      if (payment.installment > payment.totalInstallments) {
        errors.push({
          field: 'installment',
          message: 'Installment number exceeds total installments',
        })
      }

      if (payment.installment < 1) {
        errors.push({
          field: 'installment',
          message: 'Installment number must be positive',
        })
      }
    }

    // Status-specific validations
    if (
      (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') &&
      !payment.paymentDate
    ) {
      errors.push({
        field: 'paymentDate',
        message: 'Payment date required for confirmed/received status',
      })
    }

    return errors
  }

  private checkBusinessWarnings(payment: Payment): string[] {
    const warnings: string[] = []

    // Check for old pending payments
    if (payment.status === 'PENDING') {
      const dueDate = new Date(payment.dueDate)
      const daysSinceDue = Math.floor(
        (Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceDue > 30) {
        warnings.push('Old pending payment (>30 days past due)')
      }
    }

    // Check for overdue payments
    if (payment.status === 'OVERDUE') {
      const dueDate = new Date(payment.dueDate)
      const daysOverdue = Math.floor(
        (Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysOverdue > 60) {
        warnings.push('Severely overdue payment (>60 days)')
      }
    }

    // Check for missing payment method on confirmed payments
    if (
      (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') &&
      !payment.paymentMethod
    ) {
      warnings.push('Payment method not recorded')
    }

    return warnings
  }

  private extractPartialPaymentData(data: unknown): Payment | null {
    if (!data || typeof data !== 'object') return null

    const partial = data as Record<string, unknown>

    // Try to extract at minimum: id, amount, status, dueDate
    try {
      return {
        id: String(partial.id || ''),
        amount: Number(partial.amount || 0),
        status: (partial.status as PaymentStatus) || 'PENDING',
        dueDate: String(partial.dueDate || new Date().toISOString()),
        paymentDate: partial.paymentDate
          ? String(partial.paymentDate)
          : null,
        confirmedDate: partial.confirmedDate
          ? String(partial.confirmedDate)
          : null,
        description: partial.description ? String(partial.description) : undefined,
        paymentMethod: partial.paymentMethod as PaymentMethod | undefined,
        invoiceId: partial.invoiceId ? String(partial.invoiceId) : undefined,
        subscriptionId: partial.subscriptionId
          ? String(partial.subscriptionId)
          : undefined,
      }
    } catch {
      return null
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Quick validate single payment
 */
export function validatePayment(
  payment: unknown,
  userId?: string
): ValidationResult<Payment> {
  const validator = new PaymentValidator(userId)
  return validator.validatePayment(payment)
}

/**
 * Quick validate payment list
 */
export function validatePaymentList(
  payments: unknown,
  userId?: string
): ValidationResult<Payment[]> {
  const validator = new PaymentValidator(userId)
  return validator.validatePaymentData(payments)
}

/**
 * Sanitize payment for display (remove sensitive data)
 */
export function sanitizePaymentForDisplay(payment: Payment): Payment {
  // Remove potentially sensitive fields
  return {
    ...payment,
    // Keep transaction ID masked
    transactionId: payment.transactionId
      ? `***${payment.transactionId.slice(-4)}`
      : undefined,
    // Keep external reference masked
    externalReference: payment.externalReference
      ? `***${payment.externalReference.slice(-4)}`
      : undefined,
  }
}

/**
 * Sort payments by date (newest first)
 */
export function sortPaymentsByDate(payments: Payment[]): Payment[] {
  return [...payments].sort((a, b) => {
    const dateA = new Date(a.dueDate).getTime()
    const dateB = new Date(b.dueDate).getTime()
    return dateB - dateA // Descending order (newest first)
  })
}

/**
 * Filter payments by status
 */
export function filterPaymentsByStatus(
  payments: Payment[],
  status: PaymentStatus | PaymentStatus[]
): Payment[] {
  const statusArray = Array.isArray(status) ? status : [status]
  return payments.filter((p) => statusArray.includes(p.status))
}

/**
 * Calculate total amount for payments
 */
export function calculateTotalAmount(payments: Payment[]): number {
  return payments.reduce((sum, payment) => sum + payment.amount, 0)
}
