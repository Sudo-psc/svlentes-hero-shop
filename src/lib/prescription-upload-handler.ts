/**
 * Prescription Upload Handler
 * Handles prescription file uploads with resilience and graceful degradation
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Fallback to temporary storage
 * - Circuit breaker pattern
 * - LGPD-compliant error logging
 * - Progress tracking
 */

import {
  PrescriptionUploadError,
  createPrescriptionUploadError,
  Phase3ErrorContext,
  Phase3ErrorSeverity,
  CircuitState,
  CircuitBreakerState,
} from './phase3-error-types'
import { offlineStorage } from './offline-storage'

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_RETRIES = 3
const RETRY_DELAYS = [2000, 4000, 8000] // 2s, 4s, 8s
const CIRCUIT_BREAKER_THRESHOLD = 5
const CIRCUIT_BREAKER_TIMEOUT = 60000 // 1 minute
const UPLOAD_TIMEOUT = 30000 // 30 seconds

// ============================================================================
// TYPES
// ============================================================================

export interface UploadConfig {
  endpoint: string
  token: string
  userId: string
  retries?: number
  timeout?: number
  onProgress?: (progress: number) => void
}

export interface UploadResult {
  success: boolean
  fileId?: string
  url?: string
  error?: PrescriptionUploadError
  fromTempStorage?: boolean
  retryCount?: number
}

export interface TempStorageData {
  file: File
  metadata: {
    userId: string
    uploadedAt: Date
    retryCount: number
  }
}

// ============================================================================
// PRESCRIPTION UPLOAD HANDLER CLASS
// ============================================================================

export class PrescriptionUploadHandler {
  private circuitBreakers = new Map<string, CircuitBreakerState>()
  private activeUploads = new Map<string, Promise<UploadResult>>()

  /**
   * Upload prescription file with retry and fallback
   */
  async uploadPrescription(
    file: File,
    config: UploadConfig
  ): Promise<UploadResult> {
    const context: Phase3ErrorContext = {
      feature: 'prescription',
      operation: 'upload',
      userId: config.userId,
      timestamp: new Date(),
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    }

    // Check circuit breaker
    if (this.isCircuitOpen(config.endpoint)) {
      return this.handleCircuitOpen(file, config, context)
    }

    // Deduplication: check if same file is already uploading
    const uploadKey = this.generateUploadKey(file, config.userId)
    if (this.activeUploads.has(uploadKey)) {
      console.log('[PrescriptionUpload] Deduplicating concurrent upload')
      return this.activeUploads.get(uploadKey)!
    }

    // Start upload with retry logic
    const uploadPromise = this.executeUploadWithRetry(file, config, context)
    this.activeUploads.set(uploadKey, uploadPromise)

    try {
      const result = await uploadPromise
      return result
    } finally {
      this.activeUploads.delete(uploadKey)
    }
  }

  /**
   * Execute upload with automatic retry
   */
  private async executeUploadWithRetry(
    file: File,
    config: UploadConfig,
    context: Phase3ErrorContext
  ): Promise<UploadResult> {
    const maxRetries = config.retries ?? MAX_RETRIES
    let lastError: PrescriptionUploadError | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Attempt upload
        const result = await this.performUpload(file, config, context, attempt)

        // Success! Reset circuit breaker
        this.resetCircuitBreaker(config.endpoint)

        return {
          success: true,
          ...result,
          retryCount: attempt,
        }
      } catch (error) {
        lastError = error as PrescriptionUploadError

        console.error(
          `[PrescriptionUpload] Attempt ${attempt + 1} failed:`,
          lastError.code
        )

        // Record failure for circuit breaker
        if (attempt === maxRetries) {
          this.recordCircuitBreakerFailure(config.endpoint)
        }

        // Don't retry if not retryable
        if (!lastError.retryable) {
          break
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
          await this.delay(delay)
        }
      }
    }

    // All retries failed - try fallback to temp storage
    return this.handleUploadFailure(file, config, context, lastError!)
  }

  /**
   * Perform single upload attempt
   */
  private async performUpload(
    file: File,
    config: UploadConfig,
    context: Phase3ErrorContext,
    attemptNumber: number
  ): Promise<{ fileId: string; url: string }> {
    const timeout = config.timeout ?? UPLOAD_TIMEOUT
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', config.userId)
      formData.append('attemptNumber', attemptNumber.toString())

      // Track upload progress
      const xhr = new XMLHttpRequest()

      const uploadPromise = new Promise<{ fileId: string; url: string }>(
        (resolve, reject) => {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && config.onProgress) {
              const progress = (event.loaded / event.total) * 100
              config.onProgress(progress)
            }
          })

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText)
                resolve({
                  fileId: response.fileId || response.id,
                  url: response.url || response.fileUrl,
                })
              } catch {
                reject(
                  createPrescriptionUploadError(
                    'STORAGE_ERROR',
                    context,
                    {
                      severity: Phase3ErrorSeverity.HIGH,
                      retryable: true,
                      originalError: new Error('Invalid response format'),
                    }
                  )
                )
              }
            } else if (xhr.status === 403) {
              reject(
                createPrescriptionUploadError(
                  'PERMISSION_DENIED',
                  context,
                  {
                    severity: Phase3ErrorSeverity.HIGH,
                    retryable: false,
                  }
                )
              )
            } else if (xhr.status === 413) {
              reject(
                createPrescriptionUploadError(
                  'QUOTA_EXCEEDED',
                  context,
                  {
                    severity: Phase3ErrorSeverity.HIGH,
                    retryable: false,
                  }
                )
              )
            } else {
              reject(
                createPrescriptionUploadError(
                  'STORAGE_ERROR',
                  context,
                  {
                    severity: Phase3ErrorSeverity.HIGH,
                    retryable: true,
                    originalError: new Error(`HTTP ${xhr.status}`),
                  }
                )
              )
            }
          })

          xhr.addEventListener('error', () => {
            reject(
              createPrescriptionUploadError(
                'NETWORK_TIMEOUT',
                context,
                {
                  severity: Phase3ErrorSeverity.MEDIUM,
                  retryable: true,
                  retryAfter: RETRY_DELAYS[attemptNumber] / 1000,
                }
              )
            )
          })

          xhr.addEventListener('abort', () => {
            reject(
              createPrescriptionUploadError(
                'NETWORK_TIMEOUT',
                context,
                {
                  severity: Phase3ErrorSeverity.MEDIUM,
                  retryable: true,
                  retryAfter: RETRY_DELAYS[attemptNumber] / 1000,
                }
              )
            )
          })

          xhr.open('POST', config.endpoint)
          xhr.setRequestHeader('Authorization', `Bearer ${config.token}`)
          xhr.send(formData)
        }
      )

      const result = await uploadPromise
      clearTimeout(timeoutId)
      return result
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof PrescriptionUploadError) {
        throw error
      }

      // Unknown error
      throw createPrescriptionUploadError(
        'STORAGE_ERROR',
        context,
        {
          severity: Phase3ErrorSeverity.HIGH,
          retryable: true,
          originalError: error as Error,
        }
      )
    }
  }

  /**
   * Handle upload failure with fallback to temp storage
   */
  private async handleUploadFailure(
    file: File,
    config: UploadConfig,
    context: Phase3ErrorContext,
    error: PrescriptionUploadError
  ): Promise<UploadResult> {
    console.warn('[PrescriptionUpload] All retries failed, trying temp storage')

    try {
      // Save to temporary offline storage
      const tempKey = `prescription_temp_${config.userId}_${Date.now()}`
      const tempData: TempStorageData = {
        file,
        metadata: {
          userId: config.userId,
          uploadedAt: new Date(),
          retryCount: MAX_RETRIES,
        },
      }

      await offlineStorage.set(tempKey, tempData, {
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        tags: ['prescription', 'temp-upload', config.userId],
      })

      console.log('[PrescriptionUpload] Saved to temp storage:', tempKey)

      return {
        success: false,
        fromTempStorage: true,
        error,
      }
    } catch (storageError) {
      console.error('[PrescriptionUpload] Temp storage also failed:', storageError)

      // Even temp storage failed - return error
      return {
        success: false,
        error,
      }
    }
  }

  /**
   * Handle circuit breaker open state
   */
  private handleCircuitOpen(
    file: File,
    config: UploadConfig,
    context: Phase3ErrorContext
  ): UploadResult {
    console.warn('[PrescriptionUpload] Circuit breaker open, using temp storage')

    // Circuit is open - immediately save to temp storage
    const tempKey = `prescription_temp_${config.userId}_${Date.now()}`
    const tempData: TempStorageData = {
      file,
      metadata: {
        userId: config.userId,
        uploadedAt: new Date(),
        retryCount: 0,
      },
    }

    offlineStorage.set(tempKey, tempData, {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      tags: ['prescription', 'temp-upload', config.userId],
    })

    const error = createPrescriptionUploadError(
      'STORAGE_ERROR',
      context,
      {
        severity: Phase3ErrorSeverity.HIGH,
        retryable: true,
        retryAfter: 60, // Try again after circuit breaker timeout
      }
    )

    return {
      success: false,
      fromTempStorage: true,
      error,
    }
  }

  /**
   * Retry pending uploads from temp storage
   */
  async retryPendingUploads(
    userId: string,
    config: Omit<UploadConfig, 'userId'>
  ): Promise<{ success: number; failed: number }> {
    try {
      // Get all temp uploads for user
      const tempUploads = await offlineStorage.getByTag(`prescription`)

      const userUploads = tempUploads.filter((item) => {
        const data = item.data as TempStorageData
        return data.metadata.userId === userId
      })

      console.log(`[PrescriptionUpload] Found ${userUploads.length} pending uploads`)

      let successCount = 0
      let failedCount = 0

      for (const upload of userUploads) {
        try {
          const data = upload.data as TempStorageData

          const result = await this.uploadPrescription(data.file, {
            ...config,
            userId,
          })

          if (result.success) {
            // Delete from temp storage
            await offlineStorage.delete(upload.key)
            successCount++
          } else {
            failedCount++
          }
        } catch (error) {
          console.error('[PrescriptionUpload] Retry failed:', error)
          failedCount++
        }
      }

      return { success: successCount, failed: failedCount }
    } catch (error) {
      console.error('[PrescriptionUpload] Failed to retry pending uploads:', error)
      return { success: 0, failed: 0 }
    }
  }

  // ============================================================================
  // CIRCUIT BREAKER METHODS
  // ============================================================================

  private isCircuitOpen(endpoint: string): boolean {
    const breaker = this.circuitBreakers.get(endpoint)
    if (!breaker) return false

    if (breaker.state === CircuitState.OPEN) {
      // Check if timeout elapsed (transition to HALF_OPEN)
      if (
        breaker.nextAttemptTime &&
        new Date() >= breaker.nextAttemptTime
      ) {
        breaker.state = CircuitState.HALF_OPEN
        this.circuitBreakers.set(endpoint, breaker)
        return false
      }
      return true
    }

    return false
  }

  private recordCircuitBreakerFailure(endpoint: string): void {
    const breaker = this.circuitBreakers.get(endpoint) || {
      state: CircuitState.CLOSED,
      failureCount: 0,
    }

    breaker.failureCount++
    breaker.lastFailureTime = new Date()

    if (breaker.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
      breaker.state = CircuitState.OPEN
      breaker.nextAttemptTime = new Date(Date.now() + CIRCUIT_BREAKER_TIMEOUT)
      console.warn(`[PrescriptionUpload] Circuit breaker OPENED for ${endpoint}`)
    }

    this.circuitBreakers.set(endpoint, breaker)
  }

  private resetCircuitBreaker(endpoint: string): void {
    this.circuitBreakers.set(endpoint, {
      state: CircuitState.CLOSED,
      failureCount: 0,
    })
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateUploadKey(file: File, userId: string): string {
    return `${userId}-${file.name}-${file.size}-${file.lastModified}`
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get circuit breaker stats for monitoring
   */
  getCircuitBreakerStats(): Map<string, CircuitBreakerState> {
    return new Map(this.circuitBreakers)
  }

  /**
   * Manually reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    this.circuitBreakers.clear()
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const prescriptionUploadHandler = new PrescriptionUploadHandler()

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Upload prescription file with default config
 */
export async function uploadPrescriptionFile(
  file: File,
  token: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  return prescriptionUploadHandler.uploadPrescription(file, {
    endpoint: '/api/assinante/prescription-upload',
    token,
    userId,
    onProgress,
  })
}

/**
 * Retry all pending uploads for user
 */
export async function retryPendingUploads(
  userId: string,
  token: string
): Promise<{ success: number; failed: number }> {
  return prescriptionUploadHandler.retryPendingUploads(userId, {
    endpoint: '/api/assinante/prescription-upload',
    token,
  })
}
