import { validatePrescriptionDate, validateCRM } from '@/lib/validators'
import type { LensData, EyePrescription } from '@/types/subscription'
export type LensEyeField = 'sphere' | 'cylinder' | 'axis'
export interface LensValidationErrors {
    rightSphere?: string
    rightCylinder?: string
    rightAxis?: string
    leftSphere?: string
    leftCylinder?: string
    leftAxis?: string
    prescriptionDate?: string
    doctorCRM?: string
}
const SPHERE_MIN = -20
const SPHERE_MAX = 20
const CYLINDER_MIN = -6
const CYLINDER_MAX = 0
function parseNumeric(value: string | number | undefined): number | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null
    }
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value.replace(',', '.'))
        return Number.isFinite(parsed) ? parsed : null
    }
    return null
}
function isMultipleOfQuarter(value: number): boolean {
    return Math.abs((value * 100) % 25) <= 0.0001
}
export function validateSphere(value: string | number | undefined): string | undefined {
    if (value === undefined || value === null || `${value}`.trim() === '') {
        return 'Campo obrigatório'
    }
    const numeric = parseNumeric(value)
    if (numeric === null) {
        return 'Valor inválido'
    }
    if (numeric < SPHERE_MIN || numeric > SPHERE_MAX) {
        return 'Faixa válida: -20.00 a +20.00'
    }
    if (!isMultipleOfQuarter(numeric)) {
        return 'Use passos de 0.25 (ex: -2.00, -2.25, -2.50)'
    }
    return undefined
}
export function validateCylinder(value: string | number | undefined): string | undefined {
    if (value === undefined || value === null || `${value}`.trim() === '') {
        return undefined
    }
    const numeric = parseNumeric(value)
    if (numeric === null) {
        return 'Valor inválido'
    }
    if (numeric > CYLINDER_MAX) {
        return 'Cilíndrico deve ser negativo ou zero'
    }
    if (numeric < CYLINDER_MIN) {
        return 'Faixa válida: 0.00 a -6.00'
    }
    if (!isMultipleOfQuarter(numeric)) {
        return 'Use passos de 0.25 (ex: -0.75, -1.00)'
    }
    return undefined
}
export function validateAxis(value: string | number | undefined, cylinder: string | number | undefined): string | undefined {
    const cylinderNumeric = parseNumeric(cylinder)
    if (cylinderNumeric === null || cylinderNumeric === 0) {
        return undefined
    }
    if (value === undefined || value === null || `${value}`.trim() === '') {
        return 'Necessário quando há cilíndrico'
    }
    const numeric = parseNumeric(value)
    if (numeric === null) {
        return 'Valor inválido'
    }
    if (numeric < 0 || numeric > 180) {
        return 'Faixa válida: 0 a 180'
    }
    if (!Number.isInteger(Number(numeric.toFixed(0)))) {
        return 'Use valores inteiros de 0 a 180'
    }
    return undefined
}
function validateEye(prefix: 'right' | 'left', eye: EyePrescription): LensValidationErrors {
    const errors: LensValidationErrors = {}
    const sphereError = validateSphere(eye.sphere)
    if (sphereError) {
        errors[`${prefix}Sphere` as const] = sphereError
    }
    const cylinderError = validateCylinder(eye.cylinder)
    if (cylinderError) {
        errors[`${prefix}Cylinder` as const] = cylinderError
    }
    const axisError = validateAxis(eye.axis, eye.cylinder)
    if (axisError) {
        errors[`${prefix}Axis` as const] = axisError
    }
    return errors
}
export function validateLensData(lensData: LensData): LensValidationErrors {
    let errors: LensValidationErrors = {}
    errors = { ...errors, ...validateEye('right', lensData.rightEye) }
    errors = { ...errors, ...validateEye('left', lensData.leftEye) }
    if (lensData.prescriptionDate && !validatePrescriptionDate(lensData.prescriptionDate)) {
        errors.prescriptionDate = 'Prescrição deve ter menos de 1 ano'
    }
    if (lensData.doctorCRM && !validateCRM(lensData.doctorCRM)) {
        errors.doctorCRM = 'Formato inválido (ex: 123456-MG)'
    }
    return errors
}
export function hasLensErrors(errors: LensValidationErrors): boolean {
    return Object.values(errors).some(Boolean)
}
export function canSubmitLensData(lensData: LensData, errors: LensValidationErrors): boolean {
    if (!lensData.brand || !lensData.rightEye.sphere || !lensData.leftEye.sphere) {
        return false
    }
    return !hasLensErrors(errors)
}