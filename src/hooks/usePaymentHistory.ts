/**
 * Payment History Hook
 * Resilient hook for fetching payment history with circuit breaker
 *
 * Features:
 * - Circuit breaker pattern (3 failures → open for 60s)
 * - Exponential backoff retry (1s, 2s)
 * - Cache with 5min TTL
 * - Graceful degradation to expired cache
 * - LGPD-compliant error handling
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { resilientFetcher } from '@/lib/resilient-data-fetcher'
import {
  Payment,
  PaymentHistoryResponse,
  validatePaymentList,
  sortPaymentsByDate,
} from '@/lib/payment-validator'
import {
  createPaymentHistoryError,
  PaymentDataValidationError,
  CircuitState,
  CircuitBreakerState,
} from '@/lib/phase3-error-types'
import { logPhase3Error, trackPhase3Operation } from '@/lib/phase3-monitoring'

// ============================================================================
// TYPES
// ============================================================================

export interface UsePaymentHistoryOptions {
  enabled?: boolean
  refetchInterval?: number
  cacheTime?: number
  retryCount?: number
}

export interface UsePaymentHistoryResult {
  payments: Payment[]
  loading: boolean
  error: string | null
  isFromCache: boolean
  isOffline: boolean
  circuitState: CircuitState
  retry: () => void
  refetch: () => void
}

// ============================================================================
// CIRCUIT BREAKER STATE
// ============================================================================

const CIRCUIT_BREAKER_THRESHOLD = 3
const CIRCUIT_BREAKER_TIMEOUT = 60000 // 60 seconds
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const RETRY_COUNT = 2
const RETRY_DELAYS = [1000, 2000] // 1s, 2s

class PaymentHistoryCircuitBreaker {
  private state: CircuitBreakerState = {
    state: CircuitState.CLOSED,
    failureCount: 0,
  }

  getState(): CircuitBreakerState {
    return { ...this.state }
  }

  isOpen(): boolean {
    if (this.state.state === CircuitState.OPEN) {
      // Check if timeout elapsed (transition to HALF_OPEN)
      if (
        this.state.nextAttemptTime &&
        new Date() >= this.state.nextAttemptTime
      ) {
        this.state.state = CircuitState.HALF_OPEN
        return false
      }
      return true
    }
    return false
  }

  recordSuccess(): void {
    this.state = {
      state: CircuitState.CLOSED,
      failureCount: 0,
    }
  }

  recordFailure(): void {
    this.state.failureCount++
    this.state.lastFailureTime = new Date()

    if (this.state.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
      this.state.state = CircuitState.OPEN
      this.state.nextAttemptTime = new Date(Date.now() + CIRCUIT_BREAKER_TIMEOUT)
      console.warn('[PaymentHistory] Circuit breaker OPENED')
    }
  }

  reset(): void {
    this.state = {
      state: CircuitState.CLOSED,
      failureCount: 0,
    }
  }
}

// Global circuit breaker instance
const circuitBreaker = new PaymentHistoryCircuitBreaker()

// ============================================================================
// HOOK
// ============================================================================

export function usePaymentHistory(
  token: string | null,
  userId: string | null,
  options: UsePaymentHistoryOptions = {}
): UsePaymentHistoryResult {
  const {
    enabled = true,
    refetchInterval,
    cacheTime = CACHE_TTL,
    retryCount = RETRY_COUNT,
  } = options

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [circuitState, setCircuitState] = useState<CircuitState>(CircuitState.CLOSED)

  const retryTimeoutRef = useRef<NodeJS.Timeout>()
  const refetchIntervalRef = useRef<NodeJS.Timeout>()

  /**
   * Detect offline status
   */
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  /**
   * Fetch payment history with resilience
   */
  const fetchPaymentHistory = useCallback(async () => {
    if (!enabled || !token || !userId) {
      return
    }

    // Check circuit breaker
    if (circuitBreaker.isOpen()) {
      console.warn('[PaymentHistory] Circuit breaker is OPEN, using cache')
      setCircuitState(CircuitState.OPEN)
      setError('Serviço temporariamente indisponível. Usando dados em cache.')
      return
    }

    setCircuitState(circuitBreaker.getState().state)
    setLoading(true)
    setError(null)

    try {
      // Track operation performance
      const result = await trackPhase3Operation(
        'payment-history',
        'fetch',
        async () => {
          return await resilientFetcher.fetch<PaymentHistoryResponse>({
            url: '/api/assinante/payment-history',
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 10000,
            retries: retryCount,
            cacheTTL: cacheTime,
            fallbackData: {
              payments: [],
              total: 0,
            },
          })
        }
      )

      if (result.status === 'success' || result.status === 'cached') {
        // Validate payment data
        const validationResult = validatePaymentList(
          result.data?.payments || [],
          userId
        )

        if (validationResult.valid || validationResult.validData) {
          const validPayments = validationResult.validData || []
          const sortedPayments = sortPaymentsByDate(validPayments)

          setPayments(sortedPayments)
          setIsFromCache(result.fromCache)
          setError(null)

          // Record success in circuit breaker
          circuitBreaker.recordSuccess()
          setCircuitState(CircuitState.CLOSED)

          // Log warning if some payments were invalid
          if (validationResult.invalidCount && validationResult.invalidCount > 0) {
            console.warn(
              `[PaymentHistory] ${validationResult.invalidCount} invalid payment(s) filtered out`
            )
          }
        } else {
          // Validation failed completely
          const validationError = new PaymentDataValidationError(
            'Payment data validation failed',
            {
              feature: 'payment-history',
              operation: 'validation',
              userId,
            },
            validationResult.invalidCount || 0,
            []
          )

          logPhase3Error(validationError)
          circuitBreaker.recordFailure()
          setCircuitState(circuitBreaker.getState().state)
          setError('Dados inconsistentes recebidos')
        }
      } else if (result.status === 'fallback') {
        // Using fallback/cache data
        setPayments([])
        setIsFromCache(true)
        setError('Usando dados em cache devido a erro temporário')
        circuitBreaker.recordFailure()
        setCircuitState(circuitBreaker.getState().state)
      } else {
        // Error
        const apiError = createPaymentHistoryError(
          'API_TIMEOUT',
          {
            feature: 'payment-history',
            operation: 'fetch',
            userId,
          },
          new Error(result.error || 'Unknown error')
        )

        logPhase3Error(apiError)
        circuitBreaker.recordFailure()
        setCircuitState(circuitBreaker.getState().state)
        setError(apiError.userMessage)
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao carregar histórico'

      console.error('[PaymentHistory] Fetch error:', errorMessage)

      const apiError = createPaymentHistoryError(
        'INTERNAL_ERROR',
        {
          feature: 'payment-history',
          operation: 'fetch',
          userId,
        },
        err as Error
      )

      logPhase3Error(apiError)
      circuitBreaker.recordFailure()
      setCircuitState(circuitBreaker.getState().state)
      setError(apiError.userMessage)
    } finally {
      setLoading(false)
    }
  }, [token, userId, enabled, retryCount, cacheTime])

  /**
   * Manual retry
   */
  const retry = useCallback(() => {
    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }

    // Reset circuit breaker if user manually retries
    circuitBreaker.reset()
    setCircuitState(CircuitState.CLOSED)

    fetchPaymentHistory()
  }, [fetchPaymentHistory])

  /**
   * Initial fetch and auto-refetch
   */
  useEffect(() => {
    if (enabled && token && userId) {
      fetchPaymentHistory()

      // Setup refetch interval if configured
      if (refetchInterval && refetchInterval > 0) {
        refetchIntervalRef.current = setInterval(
          fetchPaymentHistory,
          refetchInterval
        )

        return () => {
          if (refetchIntervalRef.current) {
            clearInterval(refetchIntervalRef.current)
          }
        }
      }
    }
  }, [enabled, token, userId, fetchPaymentHistory, refetchInterval])

  /**
   * Auto-retry when back online
   */
  useEffect(() => {
    if (!isOffline && error) {
      // Wait 2s before retrying
      retryTimeoutRef.current = setTimeout(() => {
        console.log('[PaymentHistory] Network restored, retrying')
        retry()
      }, 2000)

      return () => {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current)
        }
      }
    }
  }, [isOffline, error, retry])

  return {
    payments,
    loading,
    error,
    isFromCache,
    isOffline,
    circuitState,
    retry,
    refetch: fetchPaymentHistory,
  }
}
