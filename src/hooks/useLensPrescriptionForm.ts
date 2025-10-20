import { useCallback, useMemo, useState } from 'react'
import type { LensData } from '@/types/subscription'
import {
    LensEyeField,
    LensValidationErrors,
    validateLensData,
    canSubmitLensData,
} from '@/lib/lens-validation'
interface UseLensPrescriptionFormOptions {
    initialData?: Partial<LensData>
}
function createDefaultLensData(): LensData {
    return {
        type: 'monthly',
        brand: '',
        rightEye: { sphere: '', cylinder: '', axis: '' },
        leftEye: { sphere: '', cylinder: '', axis: '' },
    }
}
function mergeInitialData(initialData?: Partial<LensData>): LensData {
    const base = createDefaultLensData()
    if (!initialData) {
        return base
    }
    return {
        ...base,
        ...initialData,
        rightEye: {
            ...base.rightEye,
            ...initialData.rightEye,
        },
        leftEye: {
            ...base.leftEye,
            ...initialData.leftEye,
        },
    }
}
export interface UseLensPrescriptionFormReturn {
    lensData: LensData
    errors: LensValidationErrors
    sameForBothEyes: boolean
    selectLensType: (type: LensData['type']) => void
    selectBrand: (brand: string) => void
    updateEye: (eye: 'rightEye' | 'leftEye', field: LensEyeField, value: string) => void
    updatePrescriptionDate: (value: string) => void
    updateDoctorCRM: (value: string) => void
    updateDoctorName: (value: string) => void
    toggleSameForBothEyes: () => void
    setSameForBothEyes: (value: boolean) => void
    isValid: boolean
    reset: () => void
}
export function useLensPrescriptionForm(
    options?: UseLensPrescriptionFormOptions,
): UseLensPrescriptionFormReturn {
    const initialState = useMemo(() => mergeInitialData(options?.initialData), [options?.initialData])
    const [lensData, setLensData] = useState<LensData>(initialState)
    const [errors, setErrors] = useState<LensValidationErrors>(() => validateLensData(initialState))
    const [sameForBothEyes, setSameForBothEyesState] = useState(false)
    const recalculateErrors = useCallback((nextData: LensData) => {
        setErrors(validateLensData(nextData))
    }, [])
    const updateLensData = useCallback((updater: (current: LensData) => LensData) => {
        setLensData(prev => {
            const next = updater(prev)
            recalculateErrors(next)
            return next
        })
    }, [recalculateErrors])
    const ensureEyesInSync = useCallback((data: LensData, eye: 'rightEye' | 'leftEye'): LensData => {
        if (!sameForBothEyes || eye !== 'rightEye') {
            return data
        }
        return {
            ...data,
            leftEye: { ...data.rightEye },
        }
    }, [sameForBothEyes])
    const selectLensType = useCallback((type: LensData['type']) => {
        updateLensData(prev => ({
            ...prev,
            type,
        }))
    }, [updateLensData])
    const selectBrand = useCallback((brand: string) => {
        updateLensData(prev => ({
            ...prev,
            brand,
        }))
    }, [updateLensData])
    const updateEye = useCallback((eye: 'rightEye' | 'leftEye', field: LensEyeField, value: string) => {
        updateLensData(prev => {
            const updatedEye = {
                ...prev[eye],
                [field]: value,
            }
            const nextData: LensData = {
                ...prev,
                [eye]: updatedEye,
            }
            return ensureEyesInSync(nextData, eye)
        })
    }, [ensureEyesInSync, updateLensData])
    const updatePrescriptionDate = useCallback((value: string) => {
        updateLensData(prev => ({
            ...prev,
            prescriptionDate: value || undefined,
        }))
    }, [updateLensData])
    const updateDoctorCRM = useCallback((value: string) => {
        updateLensData(prev => ({
            ...prev,
            doctorCRM: value || undefined,
        }))
    }, [updateLensData])
    const updateDoctorName = useCallback((value: string) => {
        updateLensData(prev => ({
            ...prev,
            doctorName: value || undefined,
        }))
    }, [updateLensData])
    const toggleSameForBothEyes = useCallback(() => {
        setSameForBothEyesState(prev => {
            const nextValue = !prev
            if (nextValue) {
                updateLensData(current => ({
                    ...current,
                    leftEye: { ...current.rightEye },
                }))
            }
            return nextValue
        })
    }, [updateLensData])
    const setSameForBothEyes = useCallback((value: boolean) => {
        setSameForBothEyesState(currentValue => {
            if (currentValue === value) {
                return currentValue
            }
            if (value) {
                updateLensData(current => ({
                    ...current,
                    leftEye: { ...current.rightEye },
                }))
            }
            return value
        })
    }, [updateLensData])
    const reset = useCallback(() => {
        const nextInitial = mergeInitialData(options?.initialData)
        setLensData(nextInitial)
        setErrors(validateLensData(nextInitial))
        setSameForBothEyesState(false)
    }, [options?.initialData])
    const isValid = useMemo(() => canSubmitLensData(lensData, errors), [lensData, errors])
    return {
        lensData,
        errors,
        sameForBothEyes,
        selectLensType,
        selectBrand,
        updateEye,
        updatePrescriptionDate,
        updateDoctorCRM,
        updateDoctorName,
        toggleSameForBothEyes,
        setSameForBothEyes,
        isValid,
        reset,
    }
}