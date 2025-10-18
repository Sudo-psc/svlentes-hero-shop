import {
    validateSphere,
    validateCylinder,
    validateAxis,
    validateLensData,
    canSubmitLensData,
} from '../lens-validation'
import type { LensData } from '@/types/subscription'

describe('lens validation helpers', () => {
    describe('validateSphere', () => {
        it('rejects empty values', () => {
            expect(validateSphere('')).toBe('Campo obrigatório')
        })

        it('rejects values outside the allowed range', () => {
            expect(validateSphere('-25')).toBe('Faixa válida: -20.00 a +20.00')
            expect(validateSphere('21')).toBe('Faixa válida: -20.00 a +20.00')
        })

        it('rejects values that are not multiples of 0.25', () => {
            expect(validateSphere('-1.23')).toBe('Use passos de 0.25 (ex: -2.00, -2.25, -2.50)')
        })

        it('accepts valid spherical values', () => {
            expect(validateSphere('-2.00')).toBeUndefined()
            expect(validateSphere('1.25')).toBeUndefined()
        })
    })

    describe('validateCylinder', () => {
        it('allows empty values', () => {
            expect(validateCylinder('')).toBeUndefined()
        })

        it('rejects positive values', () => {
            expect(validateCylinder('0.50')).toBe('Cilíndrico deve ser negativo ou zero')
        })

        it('rejects values below the minimum', () => {
            expect(validateCylinder('-7')).toBe('Faixa válida: 0.00 a -6.00')
        })

        it('accepts multiples of 0.25 within range', () => {
            expect(validateCylinder('-1.25')).toBeUndefined()
            expect(validateCylinder('-0.75')).toBeUndefined()
        })
    })

    describe('validateAxis', () => {
        it('ignores axis when there is no cylinder', () => {
            expect(validateAxis('', '')).toBeUndefined()
        })

        it('requires axis when cylinder is present', () => {
            expect(validateAxis('', '-1')).toBe('Necessário quando há cilíndrico')
        })

        it('rejects axis outside range', () => {
            expect(validateAxis('-1', '-1')).toBe('Faixa válida: 0 a 180')
            expect(validateAxis('181', '-1')).toBe('Faixa válida: 0 a 180')
        })

        it('accepts valid axis values', () => {
            expect(validateAxis('90', '-1')).toBeUndefined()
        })
    })

    describe('validateLensData & canSubmitLensData', () => {
        const baseLensData: LensData = {
            type: 'monthly',
            brand: 'Acuvue',
            rightEye: { sphere: '-2.00', cylinder: '-1.00', axis: '90' },
            leftEye: { sphere: '-1.50', cylinder: '', axis: '' },
            prescriptionDate: undefined,
            doctorCRM: undefined,
            doctorName: undefined,
        }

        it('detects invalid prescriptions', () => {
            const invalidData: LensData = {
                ...baseLensData,
                rightEye: { sphere: '-25', cylinder: '-1', axis: '90' },
            }

            const errors = validateLensData(invalidData)
            expect(errors.rightSphere).toBe('Faixa válida: -20.00 a +20.00')
        })

        it('requires brand and valid eyes to submit', () => {
            const validErrors = validateLensData(baseLensData)
            expect(canSubmitLensData(baseLensData, validErrors)).toBe(true)

            const missingBrand = { ...baseLensData, brand: '' }
            const errors = validateLensData(missingBrand)
            expect(canSubmitLensData(missingBrand, errors)).toBe(false)
        })

        it('blocks submission when validation errors exist', () => {
            const invalidData: LensData = {
                ...baseLensData,
                leftEye: { sphere: '-1.10', cylinder: '', axis: '' },
            }
            const errors = validateLensData(invalidData)
            expect(canSubmitLensData(invalidData, errors)).toBe(false)
        })
    })
})
