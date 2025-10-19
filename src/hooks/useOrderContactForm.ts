import { useCallback, useMemo, useState } from 'react'
import type { ContactData } from '@/types/subscription'
import {
    validateEmail,
    validatePhone,
    validateCPFOrCNPJ,
    maskPhone,
    maskCPFOrCNPJ,
} from '@/lib/validators'

export type ContactField = keyof ContactData
export type ContactErrors = Partial<Record<ContactField, string>>
export type ContactTouched = Partial<Record<ContactField, boolean>>

function createDefaultContactData(): ContactData {
    return {
        name: '',
        email: '',
        phone: '',
        cpfCnpj: '',
        billingType: 'PIX',
        acceptsTerms: false,
        acceptsDataProcessing: false,
        acceptsMarketingCommunication: false,
    }
}

interface UseOrderContactFormOptions {
    initialData?: Partial<ContactData>
}

export function validateContactField(field: ContactField, value: ContactData[ContactField]): string {
    switch (field) {
        case 'name': {
            const text = typeof value === 'string' ? value.trim() : ''
            if (text.length < 3) {
                return 'Nome deve ter pelo menos 3 caracteres'
            }
            return ''
        }
        case 'email': {
            const email = typeof value === 'string' ? value.trim() : ''
            if (!email || !validateEmail(email)) {
                return 'Email inválido'
            }
            return ''
        }
        case 'phone': {
            const phone = typeof value === 'string' ? value : ''
            if (!phone || !validatePhone(phone)) {
                return 'Telefone inválido (formato: (XX) 9XXXX-XXXX)'
            }
            return ''
        }
        case 'cpfCnpj': {
            const document = typeof value === 'string' ? value.trim() : ''
            if (!document) {
                return ''
            }
            if (!validateCPFOrCNPJ(document)) {
                return 'CPF/CNPJ inválido'
            }
            return ''
        }
        case 'acceptsTerms': {
            return value ? '' : 'Você deve aceitar os termos de uso'
        }
        case 'acceptsDataProcessing': {
            return value ? '' : 'Você deve autorizar o processamento de dados'
        }
        default:
            return ''
    }
}

export interface UseOrderContactFormReturn {
    contactData: ContactData
    errors: ContactErrors
    touched: ContactTouched
    handleInputChange: (field: ContactField, value: string) => void
    handleCheckboxChange: (
        field: Extract<ContactField, 'acceptsTerms' | 'acceptsDataProcessing' | 'acceptsMarketingCommunication'>,
        checked: boolean,
    ) => void
    handleBlur: (field: ContactField) => void
    setBillingType: (billingType: ContactData['billingType']) => void
    isValid: boolean
    reset: () => void
}

export function useOrderContactForm(options?: UseOrderContactFormOptions): UseOrderContactFormReturn {
    const initialData = useMemo(() => ({
        ...createDefaultContactData(),
        ...options?.initialData,
    }), [options?.initialData])

    const [contactData, setContactData] = useState<ContactData>(initialData)
    const [errors, setErrors] = useState<ContactErrors>({})
    const [touched, setTouched] = useState<ContactTouched>({})

    const updateFieldError = useCallback((field: ContactField, currentValue: ContactData[ContactField]) => {
        const validation = validateContactField(field, currentValue)
        setErrors(prev => ({
            ...prev,
            [field]: validation,
        }))
    }, [])

    const handleInputChange = useCallback((field: ContactField, value: string) => {
        let formattedValue: string = value

        if (field === 'phone') {
            formattedValue = maskPhone(value)
        }

        if (field === 'cpfCnpj') {
            formattedValue = maskCPFOrCNPJ(value)
        }

        setContactData(prev => {
            const next = {
                ...prev,
                [field]: formattedValue,
            }

            if (touched[field]) {
                updateFieldError(field, next[field])
            }

            return next
        })
    }, [touched, updateFieldError])

    const handleCheckboxChange = useCallback((
        field: Extract<ContactField, 'acceptsTerms' | 'acceptsDataProcessing' | 'acceptsMarketingCommunication'>,
        checked: boolean,
    ) => {
        setContactData(prev => {
            const next = {
                ...prev,
                [field]: checked,
            }

            if (touched[field]) {
                updateFieldError(field, next[field])
            }

            return next
        })
    }, [touched, updateFieldError])

    const handleBlur = useCallback((field: ContactField) => {
        setTouched(prev => ({
            ...prev,
            [field]: true,
        }))

        updateFieldError(field, contactData[field])
    }, [contactData, updateFieldError])

    const setBillingType = useCallback((billingType: ContactData['billingType']) => {
        setContactData(prev => ({
            ...prev,
            billingType,
        }))
    }, [])

    const reset = useCallback(() => {
        const base = {
            ...createDefaultContactData(),
            ...options?.initialData,
        }
        setContactData(base)
        setErrors({})
        setTouched({})
    }, [options?.initialData])

    const isValid = useMemo(() => {
        const requiredFields: ContactField[] = [
            'name',
            'email',
            'phone',
            'acceptsTerms',
            'acceptsDataProcessing',
        ]

        const requiredValid = requiredFields.every(field => validateContactField(field, contactData[field]) === '')
        const noErrors = Object.values(errors).every(error => !error)

        return requiredValid && noErrors
    }, [contactData, errors])

    return {
        contactData,
        errors,
        touched,
        handleInputChange,
        handleCheckboxChange,
        handleBlur,
        setBillingType,
        isValid,
        reset,
    }
}
