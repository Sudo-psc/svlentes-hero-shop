/**
 * Prescription Validator
 * Validates prescription files and data for healthcare compliance
 *
 * Features:
 * - File format and size validation
 * - Medical data validation (OD/OE degrees, CRM)
 * - Prescription expiry check
 * - LGPD-compliant error handling
 */

import {
  PrescriptionValidationError,
  createPrescriptionValidationError,
  Phase3ErrorContext,
} from './phase3-error-types'

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FORMATS = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']
const PRESCRIPTION_VALIDITY_DAYS = 365 // 1 year

// Valid ranges for prescription values
const SPHERE_MIN = -20
const SPHERE_MAX = 20
const CYLINDER_MIN = -6
const CYLINDER_MAX = 0
const AXIS_MIN = 0
const AXIS_MAX = 180

// ============================================================================
// TYPES
// ============================================================================

export interface PrescriptionFile {
  file: File
  name: string
  size: number
  type: string
}

export interface PrescriptionData {
  // Right eye (OD - Olho Direito)
  odSphere?: number
  odCylinder?: number
  odAxis?: number
  odAddition?: number

  // Left eye (OE - Olho Esquerdo)
  oeSphere?: number
  oeCylinder?: number
  oeAxis?: number
  oeAddition?: number

  // Doctor information
  doctorName?: string
  doctorCrm?: string
  doctorCrmState?: string

  // Prescription date
  prescriptionDate: Date | string

  // Additional notes
  notes?: string
}

export interface ValidationResult {
  valid: boolean
  errors: PrescriptionValidationError[]
  warnings: string[]
}

// ============================================================================
// FILE VALIDATION
// ============================================================================

export class PrescriptionValidator {
  private context: Phase3ErrorContext

  constructor(userId?: string) {
    this.context = {
      feature: 'prescription',
      operation: 'validation',
      userId,
      timestamp: new Date(),
    }
  }

  /**
   * Validate prescription file
   */
  validateFile(fileData: PrescriptionFile): ValidationResult {
    const errors: PrescriptionValidationError[] = []
    const warnings: string[] = []

    // Check file size
    if (fileData.size > MAX_FILE_SIZE) {
      errors.push(
        createPrescriptionValidationError(
          'FILE_TOO_LARGE',
          {
            ...this.context,
            operation: 'file_size_check',
            metadata: { fileSize: fileData.size, maxSize: MAX_FILE_SIZE },
          }
        )
      )
    }

    // Check file format by MIME type
    if (!ALLOWED_FORMATS.includes(fileData.type)) {
      errors.push(
        createPrescriptionValidationError(
          'INVALID_FORMAT',
          {
            ...this.context,
            operation: 'file_format_check',
            metadata: { fileType: fileData.type },
          }
        )
      )
    }

    // Check file extension
    const extension = this.getFileExtension(fileData.name)
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      errors.push(
        createPrescriptionValidationError(
          'INVALID_FORMAT',
          {
            ...this.context,
            operation: 'file_extension_check',
            metadata: { extension },
          }
        )
      )
    }

    // Check if file appears to be corrupted (size too small)
    if (fileData.size < 100) {
      errors.push(
        createPrescriptionValidationError(
          'FILE_CORRUPTED',
          {
            ...this.context,
            operation: 'file_integrity_check',
            metadata: { fileSize: fileData.size },
          }
        )
      )
    }

    // Warning for large files (>3MB but <5MB)
    if (fileData.size > 3 * 1024 * 1024 && fileData.size <= MAX_FILE_SIZE) {
      warnings.push('Arquivo grande (>3MB). Upload pode demorar.')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate prescription data
   */
  validatePrescriptionData(data: PrescriptionData): ValidationResult {
    const errors: PrescriptionValidationError[] = []
    const warnings: string[] = []

    // Check if at least one eye has prescription data
    const hasOdData = this.hasEyeData('od', data)
    const hasOeData = this.hasEyeData('oe', data)

    if (!hasOdData && !hasOeData) {
      errors.push(
        createPrescriptionValidationError(
          'MISSING_OD_OE',
          {
            ...this.context,
            operation: 'eye_data_check',
          }
        )
      )
    }

    // Validate OD (right eye) if provided
    if (hasOdData) {
      const odErrors = this.validateEyeData('OD', {
        sphere: data.odSphere,
        cylinder: data.odCylinder,
        axis: data.odAxis,
        addition: data.odAddition,
      })
      errors.push(...odErrors)
    }

    // Validate OE (left eye) if provided
    if (hasOeData) {
      const oeErrors = this.validateEyeData('OE', {
        sphere: data.oeSphere,
        cylinder: data.oeCylinder,
        axis: data.oeAxis,
        addition: data.oeAddition,
      })
      errors.push(...oeErrors)
    }

    // Validate doctor CRM (mandatory for healthcare compliance)
    if (!data.doctorCrm || data.doctorCrm.trim() === '') {
      errors.push(
        createPrescriptionValidationError(
          'MISSING_CRM',
          {
            ...this.context,
            operation: 'crm_check',
          }
        )
      )
    }

    // Validate prescription date
    const prescriptionDate = this.parseDate(data.prescriptionDate)
    if (!prescriptionDate) {
      errors.push(
        createPrescriptionValidationError(
          'PRESCRIPTION_EXPIRED',
          {
            ...this.context,
            operation: 'date_validation',
            metadata: { reason: 'invalid_date' },
          }
        )
      )
    } else {
      // Check if prescription is expired (>1 year old)
      const expiryDate = new Date(prescriptionDate)
      expiryDate.setDate(expiryDate.getDate() + PRESCRIPTION_VALIDITY_DAYS)

      if (new Date() > expiryDate) {
        errors.push(
          createPrescriptionValidationError(
            'PRESCRIPTION_EXPIRED',
            {
              ...this.context,
              operation: 'expiry_check',
              metadata: {
                prescriptionDate: prescriptionDate.toISOString(),
                expiryDate: expiryDate.toISOString(),
              },
            }
          )
        )
      }

      // Warning if prescription is close to expiry (within 30 days)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      if (thirtyDaysFromNow > expiryDate) {
        const daysUntilExpiry = Math.floor(
          (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
        warnings.push(
          `Prescrição próxima do vencimento (${daysUntilExpiry} dias restantes)`
        )
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate complete prescription (file + data)
   */
  validateComplete(
    fileData: PrescriptionFile,
    prescriptionData: PrescriptionData
  ): ValidationResult {
    const fileResult = this.validateFile(fileData)
    const dataResult = this.validatePrescriptionData(prescriptionData)

    return {
      valid: fileResult.valid && dataResult.valid,
      errors: [...fileResult.errors, ...dataResult.errors],
      warnings: [...fileResult.warnings, ...dataResult.warnings],
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private hasEyeData(eye: 'od' | 'oe', data: PrescriptionData): boolean {
    const prefix = eye === 'od' ? 'od' : 'oe'
    return (
      data[`${prefix}Sphere` as keyof PrescriptionData] !== undefined ||
      data[`${prefix}Cylinder` as keyof PrescriptionData] !== undefined ||
      data[`${prefix}Axis` as keyof PrescriptionData] !== undefined
    )
  }

  private validateEyeData(
    eyeLabel: 'OD' | 'OE',
    data: {
      sphere?: number
      cylinder?: number
      axis?: number
      addition?: number
    }
  ): PrescriptionValidationError[] {
    const errors: PrescriptionValidationError[] = []

    // Validate sphere (esférico)
    if (data.sphere !== undefined) {
      if (data.sphere < SPHERE_MIN || data.sphere > SPHERE_MAX) {
        errors.push(
          createPrescriptionValidationError(
            'INVALID_DEGREES',
            {
              ...this.context,
              operation: 'sphere_validation',
              metadata: {
                eye: eyeLabel,
                value: data.sphere,
                min: SPHERE_MIN,
                max: SPHERE_MAX,
              },
            }
          )
        )
      }
    }

    // Validate cylinder (cilíndrico)
    if (data.cylinder !== undefined) {
      if (data.cylinder < CYLINDER_MIN || data.cylinder > CYLINDER_MAX) {
        errors.push(
          createPrescriptionValidationError(
            'INVALID_DEGREES',
            {
              ...this.context,
              operation: 'cylinder_validation',
              metadata: {
                eye: eyeLabel,
                value: data.cylinder,
                min: CYLINDER_MIN,
                max: CYLINDER_MAX,
              },
            }
          )
        )
      }
    }

    // Validate axis (eixo)
    if (data.axis !== undefined) {
      // Axis is required if cylinder is present
      if (data.cylinder !== undefined && data.cylinder !== 0) {
        if (data.axis < AXIS_MIN || data.axis > AXIS_MAX) {
          errors.push(
            createPrescriptionValidationError(
              'INVALID_DEGREES',
              {
                ...this.context,
                operation: 'axis_validation',
                metadata: {
                  eye: eyeLabel,
                  value: data.axis,
                  min: AXIS_MIN,
                  max: AXIS_MAX,
                },
              }
            )
          )
        }
      }
    }

    // Validate addition (adição) for multifocal lenses
    if (data.addition !== undefined) {
      if (data.addition < 0 || data.addition > 4) {
        errors.push(
          createPrescriptionValidationError(
            'INVALID_DEGREES',
            {
              ...this.context,
              operation: 'addition_validation',
              metadata: {
                eye: eyeLabel,
                value: data.addition,
                min: 0,
                max: 4,
              },
            }
          )
        )
      }
    }

    return errors
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.')
    if (lastDot === -1) return ''
    return filename.substring(lastDot).toLowerCase()
  }

  private parseDate(date: Date | string): Date | null {
    if (date instanceof Date) {
      return isNaN(date.getTime()) ? null : date
    }

    if (typeof date === 'string') {
      const parsed = new Date(date)
      return isNaN(parsed.getTime()) ? null : parsed
    }

    return null
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Quick validation for file only (without prescription data)
 */
export function validatePrescriptionFile(
  file: File,
  userId?: string
): ValidationResult {
  const validator = new PrescriptionValidator(userId)
  return validator.validateFile({
    file,
    name: file.name,
    size: file.size,
    type: file.type,
  })
}

/**
 * Quick validation for prescription data only (without file)
 */
export function validatePrescriptionData(
  data: PrescriptionData,
  userId?: string
): ValidationResult {
  const validator = new PrescriptionValidator(userId)
  return validator.validatePrescriptionData(data)
}

/**
 * Check if file type is allowed
 */
export function isAllowedFileType(file: File): boolean {
  return (
    ALLOWED_FORMATS.includes(file.type) ||
    ALLOWED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))
  )
}

/**
 * Check if file size is within limits
 */
export function isFileSizeValid(file: File): boolean {
  return file.size > 0 && file.size <= MAX_FILE_SIZE
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Get maximum file size in MB
 */
export function getMaxFileSizeMB(): number {
  return MAX_FILE_SIZE / (1024 * 1024)
}
