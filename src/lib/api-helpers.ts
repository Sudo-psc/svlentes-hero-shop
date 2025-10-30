/**
 * API Helper Functions
 * Reusable utilities for API route handlers with security focus
 *
 * Features:
 * - Ownership validation (OWASP A01:2021 - Broken Access Control prevention)
 * - LGPD-compliant authorization checking
 * - Healthcare-grade security patterns
 * - Standardized error responses
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  ApiErrorHandler,
  ErrorType,
  ErrorContext,
} from '@/lib/api-error-handler'

// ============================================================================
// OWNERSHIP VALIDATION
// ============================================================================

/**
 * Validates that a subscription belongs to the authenticated user
 *
 * SECURITY CRITICAL: Prevents OWASP A01:2021 Broken Access Control
 * Returns HTTP 403 (not 404!) when ownership check fails
 *
 * @param subscriptionId - ID of subscription to validate
 * @param userId - Authenticated user's ID
 * @param context - Error context for logging
 * @returns Subscription object if owned, NextResponse with 403 if not
 */
export async function validateSubscriptionOwnership(
  subscriptionId: string,
  userId: string,
  context: ErrorContext
): Promise<any | NextResponse> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: userId, // ← OWNERSHIP VALIDATION
      },
    })

    if (!subscription) {
      return ApiErrorHandler.handleError(
        ErrorType.AUTHORIZATION,
        'Acesso negado a este recurso',
        { ...context, userId, metadata: { subscriptionId } }
      )
    }

    return subscription
  } catch (error) {
    return ApiErrorHandler.handleError(
      ErrorType.DATABASE,
      'Erro ao validar propriedade do recurso',
      context,
      error as Error
    )
  }
}

/**
 * Validates that a payment belongs to the authenticated user
 *
 * @param paymentId - ID of payment to validate
 * @param userId - Authenticated user's ID
 * @param context - Error context for logging
 * @returns Payment object if owned, NextResponse with 403 if not
 */
export async function validatePaymentOwnership(
  paymentId: string,
  userId: string,
  context: ErrorContext
): Promise<any | NextResponse> {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: userId, // ← OWNERSHIP VALIDATION
      },
    })

    if (!payment) {
      return ApiErrorHandler.handleError(
        ErrorType.AUTHORIZATION,
        'Acesso negado a este recurso',
        { ...context, userId, metadata: { paymentId } }
      )
    }

    return payment
  } catch (error) {
    return ApiErrorHandler.handleError(
      ErrorType.DATABASE,
      'Erro ao validar propriedade do recurso',
      context,
      error as Error
    )
  }
}

/**
 * Validates that an order belongs to the authenticated user (via subscription)
 *
 * @param orderId - ID of order to validate
 * @param userId - Authenticated user's ID
 * @param context - Error context for logging
 * @returns Order object if owned, NextResponse with 403 if not
 */
export async function validateOrderOwnership(
  orderId: string,
  userId: string,
  context: ErrorContext
): Promise<any | NextResponse> {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        subscription: {
          userId: userId, // ← OWNERSHIP VALIDATION via relationship
        },
      },
      include: {
        subscription: {
          select: {
            userId: true,
            planType: true,
          },
        },
      },
    })

    if (!order) {
      return ApiErrorHandler.handleError(
        ErrorType.AUTHORIZATION,
        'Acesso negado a este recurso',
        { ...context, userId, metadata: { orderId } }
      )
    }

    return order
  } catch (error) {
    return ApiErrorHandler.handleError(
      ErrorType.DATABASE,
      'Erro ao validar propriedade do recurso',
      context,
      error as Error
    )
  }
}

/**
 * Validates that an invoice belongs to the authenticated user (via subscription)
 *
 * @param invoiceId - ID of invoice to validate
 * @param userId - Authenticated user's ID
 * @param context - Error context for logging
 * @returns Invoice object if owned, NextResponse with 403 if not
 */
export async function validateInvoiceOwnership(
  invoiceId: string,
  userId: string,
  context: ErrorContext
): Promise<any | NextResponse> {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        subscription: {
          userId: userId, // ← OWNERSHIP VALIDATION via relationship
        },
      },
      include: {
        subscription: {
          select: {
            userId: true,
            planType: true,
          },
        },
      },
    })

    if (!invoice) {
      return ApiErrorHandler.handleError(
        ErrorType.AUTHORIZATION,
        'Acesso negado a este recurso',
        { ...context, userId, metadata: { invoiceId } }
      )
    }

    return invoice
  } catch (error) {
    return ApiErrorHandler.handleError(
      ErrorType.DATABASE,
      'Erro ao validar propriedade do recurso',
      context,
      error as Error
    )
  }
}

/**
 * Validates that a support ticket belongs to the authenticated user
 *
 * @param ticketId - ID of ticket to validate
 * @param userId - Authenticated user's ID
 * @param context - Error context for logging
 * @returns Ticket object if owned, NextResponse with 403 if not
 */
export async function validateTicketOwnership(
  ticketId: string,
  userId: string,
  context: ErrorContext
): Promise<any | NextResponse> {
  try {
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        userId: userId, // ← OWNERSHIP VALIDATION
      },
    })

    if (!ticket) {
      return ApiErrorHandler.handleError(
        ErrorType.AUTHORIZATION,
        'Acesso negado a este recurso',
        { ...context, userId, metadata: { ticketId } }
      )
    }

    return ticket
  } catch (error) {
    return ApiErrorHandler.handleError(
      ErrorType.DATABASE,
      'Erro ao validar propriedade do recurso',
      context,
      error as Error
    )
  }
}

// ============================================================================
// USER LOOKUP HELPERS
// ============================================================================

/**
 * Finds user by Firebase UID with error handling
 * Returns NextResponse with appropriate error if user not found
 *
 * @param firebaseUid - Firebase UID from authenticated token
 * @param context - Error context for logging
 * @returns User object or NextResponse with error
 */
export async function getUserByFirebaseUid(
  firebaseUid: string,
  context: ErrorContext
): Promise<any | NextResponse> {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
    })

    if (!user) {
      return ApiErrorHandler.handleError(
        ErrorType.NOT_FOUND,
        'Usuário não encontrado no banco de dados',
        { ...context, userId: firebaseUid }
      )
    }

    return user
  } catch (error) {
    return ApiErrorHandler.handleError(
      ErrorType.DATABASE,
      'Erro ao buscar usuário',
      context,
      error as Error
    )
  }
}

/**
 * Finds active subscription for user with ownership validation
 * Returns NextResponse with appropriate error if not found
 *
 * @param userId - User's database ID
 * @param context - Error context for logging
 * @returns Subscription object or NextResponse with error
 */
export async function getActiveSubscription(
  userId: string,
  context: ErrorContext
): Promise<any | NextResponse> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        status: 'ACTIVE',
      },
    })

    if (!subscription) {
      return ApiErrorHandler.handleError(
        ErrorType.NOT_FOUND,
        'Assinatura ativa não encontrada',
        { ...context, userId }
      )
    }

    return subscription
  } catch (error) {
    return ApiErrorHandler.handleError(
      ErrorType.DATABASE,
      'Erro ao buscar assinatura',
      context,
      error as Error
    )
  }
}

// ============================================================================
// RESPONSE TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if result is a NextResponse (error) or actual data
 * Useful for TypeScript type narrowing after validation calls
 *
 * @param result - Result from validation function
 * @returns true if result is an error response
 */
export function isErrorResponse(result: any): result is NextResponse {
  return result instanceof NextResponse
}

/**
 * Helper to handle validation result in API handlers
 * Returns the error response if validation failed, otherwise continues with data
 *
 * Usage:
 * ```typescript
 * const userOrError = await getUserByFirebaseUid(uid, context)
 * if (isErrorResponse(userOrError)) return userOrError
 * const user = userOrError // TypeScript knows this is User now
 * ```
 */
export function handleValidationResult<T>(
  result: T | NextResponse,
  onSuccess: (data: T) => Promise<NextResponse> | NextResponse
): Promise<NextResponse> | NextResponse {
  if (isErrorResponse(result)) {
    return result
  }
  return onSuccess(result as T)
}

// ============================================================================
// BULK OWNERSHIP VALIDATION
// ============================================================================

/**
 * Validates that all subscriptions in a list belong to the user
 * Used for bulk operations like fetching all orders across subscriptions
 *
 * @param subscriptionIds - Array of subscription IDs to validate
 * @param userId - Authenticated user's ID
 * @param context - Error context for logging
 * @returns Array of subscription IDs if all owned, NextResponse with 403 if not
 */
export async function validateBulkSubscriptionOwnership(
  subscriptionIds: string[],
  userId: string,
  context: ErrorContext
): Promise<string[] | NextResponse> {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        id: { in: subscriptionIds },
        userId: userId, // ← OWNERSHIP VALIDATION
      },
      select: { id: true },
    })

    // Check if all requested subscriptions were found
    if (subscriptions.length !== subscriptionIds.length) {
      return ApiErrorHandler.handleError(
        ErrorType.AUTHORIZATION,
        'Acesso negado a um ou mais recursos',
        {
          ...context,
          userId,
          metadata: {
            requested: subscriptionIds.length,
            found: subscriptions.length
          }
        }
      )
    }

    return subscriptions.map(sub => sub.id)
  } catch (error) {
    return ApiErrorHandler.handleError(
      ErrorType.DATABASE,
      'Erro ao validar propriedade dos recursos',
      context,
      error as Error
    )
  }
}

// ============================================================================
// QUERY FILTER HELPERS
// ============================================================================

/**
 * Creates Prisma where clause with ownership filter
 * Ensures all queries are scoped to the authenticated user
 *
 * @param userId - Authenticated user's ID
 * @param additionalFilters - Additional where clause filters
 * @returns Combined where clause with ownership protection
 */
export function createOwnershipFilter(
  userId: string,
  additionalFilters: Record<string, any> = {}
): Record<string, any> {
  return {
    userId: userId, // ← OWNERSHIP FILTER
    ...additionalFilters,
  }
}

/**
 * Creates Prisma where clause with subscription ownership filter
 * For models that relate to subscriptions (orders, invoices, etc.)
 *
 * @param userId - Authenticated user's ID
 * @param additionalFilters - Additional where clause filters
 * @returns Combined where clause with ownership protection via subscription
 */
export function createSubscriptionOwnershipFilter(
  userId: string,
  additionalFilters: Record<string, any> = {}
): Record<string, any> {
  return {
    subscription: {
      userId: userId, // ← OWNERSHIP FILTER via relationship
    },
    ...additionalFilters,
  }
}
