/**
 * Prescription Upload Hook
 * Hook for prescription file upload with validation and retry logic
 *
 * Features:
 * - File validation before upload
 * - Automatic retry with exponential backoff
 * - Progress tracking
 * - Temp storage fallback
 * - LGPD-compliant error handling
 */

'use client'

import { useState, useCallback } from 'react'
import {
  PrescriptionValidator,
  PrescriptionData,
  ValidationResult,
} from '@/lib/prescription-validator'
import {
  prescriptionUploadHandler,
  UploadResult,
} from '@/lib/prescription-upload-handler'
import { logPhase3Error, trackPhase3Operation } from '@/lib/phase3-monitoring'
import {
  PrescriptionValidationError,
  PrescriptionUploadError,
} from '@/lib/phase3-error-types'

// ============================================================================
// TYPES
// ============================================================================

export interface UsePrescriptionUploadOptions {
  onSuccess?: (fileId: string, url: string) => void
  onError?: (error: PrescriptionUploadError | PrescriptionValidationError) => void
  onProgress?: (progress: number) => void
}

export interface UsePrescriptionUploadResult {
  uploadFile: (file: File) => Promise<UploadResult>
  uploadWithData: (
    file: File,
    data: PrescriptionData
  ) => Promise<UploadResult>
  uploading: boolean
  progress: number
  error: string | null
  validationErrors: PrescriptionValidationError[]
  validationWarnings: string[]
  reset: () => void
}

export interface UploadState {
  uploading: boolean
  progress: number
  error: string | null
  validationErrors: PrescriptionValidationError[]
  validationWarnings: string[]
}

// ============================================================================
// HOOK
// ============================================================================

export function usePrescriptionUpload(
  token: string | null,
  userId: string | null,
  options: UsePrescriptionUploadOptions = {}
): UsePrescriptionUploadResult {
  const { onSuccess, onError, onProgress } = options

  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    validationErrors: [],
    validationWarnings: [],
  })

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      error: null,
      validationErrors: [],
      validationWarnings: [],
    })
  }, [])

  /**
   * Validate file
   */
  const validateFile = useCallback(
    (file: File): ValidationResult => {
      const validator = new PrescriptionValidator(userId || undefined)
      return validator.validateFile({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
      })
    },
    [userId]
  )

  /**
   * Validate prescription data
   */
  const validateData = useCallback(
    (data: PrescriptionData): ValidationResult => {
      const validator = new PrescriptionValidator(userId || undefined)
      return validator.validatePrescriptionData(data)
    },
    [userId]
  )

  /**
   * Upload file only (without prescription data)
   */
  const uploadFile = useCallback(
    async (file: File): Promise<UploadResult> => {
      if (!token || !userId) {
        const error = 'Token ou userId ausente'
        setState((prev) => ({ ...prev, error }))
        return { success: false, error: undefined }
      }

      // Reset state
      setState({
        uploading: true,
        progress: 0,
        error: null,
        validationErrors: [],
        validationWarnings: [],
      })

      try {
        // Validate file
        const validation = validateFile(file)

        if (!validation.valid) {
          setState((prev) => ({
            ...prev,
            uploading: false,
            validationErrors: validation.errors,
            validationWarnings: validation.warnings,
            error: validation.errors[0]?.userMessage || 'Arquivo inválido',
          }))

          if (onError && validation.errors[0]) {
            onError(validation.errors[0])
          }

          return { success: false, error: validation.errors[0] }
        }

        // Set warnings if any
        if (validation.warnings.length > 0) {
          setState((prev) => ({
            ...prev,
            validationWarnings: validation.warnings,
          }))
        }

        // Upload with tracking
        const result = await trackPhase3Operation(
          'prescription',
          'upload',
          async () => {
            return await prescriptionUploadHandler.uploadPrescription(file, {
              endpoint: '/api/assinante/prescription-upload',
              token,
              userId,
              onProgress: (progress) => {
                setState((prev) => ({ ...prev, progress }))
                onProgress?.(progress)
              },
            })
          }
        )

        if (result.success && result.fileId && result.url) {
          setState((prev) => ({
            ...prev,
            uploading: false,
            progress: 100,
            error: null,
          }))

          onSuccess?.(result.fileId, result.url)
        } else if (result.fromTempStorage) {
          setState((prev) => ({
            ...prev,
            uploading: false,
            error:
              'Salvo temporariamente. Envie por WhatsApp: (33) 98606-1427',
          }))

          if (result.error) {
            logPhase3Error(result.error)
            if (onError) {
              onError(result.error)
            }
          }
        } else {
          const errorMessage =
            result.error?.userMessage || 'Erro ao enviar arquivo'
          setState((prev) => ({
            ...prev,
            uploading: false,
            error: errorMessage,
          }))

          if (result.error) {
            logPhase3Error(result.error)
            if (onError) {
              onError(result.error)
            }
          }
        }

        return result
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro desconhecido'
        setState((prev) => ({
          ...prev,
          uploading: false,
          error: errorMessage,
        }))

        console.error('[PrescriptionUpload] Upload error:', err)
        return { success: false, error: undefined }
      }
    },
    [token, userId, validateFile, onSuccess, onError, onProgress]
  )

  /**
   * Upload file with prescription data validation
   */
  const uploadWithData = useCallback(
    async (file: File, data: PrescriptionData): Promise<UploadResult> => {
      if (!token || !userId) {
        const error = 'Token ou userId ausente'
        setState((prev) => ({ ...prev, error }))
        return { success: false, error: undefined }
      }

      // Reset state
      setState({
        uploading: true,
        progress: 0,
        error: null,
        validationErrors: [],
        validationWarnings: [],
      })

      try {
        // Validate file
        const fileValidation = validateFile(file)
        const dataValidation = validateData(data)

        const allErrors = [
          ...fileValidation.errors,
          ...dataValidation.errors,
        ]
        const allWarnings = [
          ...fileValidation.warnings,
          ...dataValidation.warnings,
        ]

        if (allErrors.length > 0) {
          setState((prev) => ({
            ...prev,
            uploading: false,
            validationErrors: allErrors,
            validationWarnings: allWarnings,
            error: allErrors[0]?.userMessage || 'Dados inválidos',
          }))

          if (onError && allErrors[0]) {
            onError(allErrors[0])
          }

          return { success: false, error: allErrors[0] }
        }

        // Set warnings if any
        if (allWarnings.length > 0) {
          setState((prev) => ({
            ...prev,
            validationWarnings: allWarnings,
          }))
        }

        // Upload file (same as uploadFile)
        return await uploadFile(file)
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro desconhecido'
        setState((prev) => ({
          ...prev,
          uploading: false,
          error: errorMessage,
        }))

        console.error('[PrescriptionUpload] Upload with data error:', err)
        return { success: false, error: undefined }
      }
    },
    [token, userId, validateFile, validateData, uploadFile, onError]
  )

  return {
    uploadFile,
    uploadWithData,
    uploading: state.uploading,
    progress: state.progress,
    error: state.error,
    validationErrors: state.validationErrors,
    validationWarnings: state.validationWarnings,
    reset,
  }
}
