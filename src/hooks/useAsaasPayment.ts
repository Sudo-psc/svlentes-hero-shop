import { useCallback, useState } from 'react'
import { encryptPrescription } from '@/lib/encryption'
import type { ContactData, FlowData, PaymentRequest, PaymentResponse } from '@/types/subscription'
interface ProcessPaymentParams {
    flowData: FlowData
    contactData: ContactData
}
interface UseAsaasPaymentReturn {
    processPayment: (params: ProcessPaymentParams) => Promise<PaymentResponse>
    loading: boolean
    error: string | null
    clearError: () => void
}
export function useAsaasPayment(): UseAsaasPaymentReturn {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const clearError = useCallback(() => {
        setError(null)
    }, [])
    const processPayment = useCallback(async ({ flowData, contactData }: ProcessPaymentParams) => {
        if (!flowData.planId) {
            const planError = new Error('Plano não selecionado')
            setError(planError.message)
            throw planError
        }
        if (!flowData.lensData) {
            const lensError = new Error('Dados de lentes não selecionados')
            setError(lensError.message)
            throw lensError
        }
        setLoading(true)
        setError(null)
        try {
            let encryptedLensData = ''
            if (flowData.lensData) {
                try {
                    encryptedLensData = encryptPrescription(flowData.lensData)
                } catch (encryptionError) {
                    throw new Error('Erro ao processar dados de prescrição. Por favor, tente novamente.')
                }
            }
            const paymentRequest: PaymentRequest = {
                planId: flowData.planId,
                billingInterval: flowData.billingCycle,
                billingType: contactData.billingType,
                customerData: {
                    name: contactData.name,
                    email: contactData.email,
                    phone: contactData.phone,
                    cpfCnpj: contactData.cpfCnpj,
                },
                metadata: {
                    lensData: encryptedLensData,
                    addOns: JSON.stringify(flowData.addOns),
                    source: 'subscription_flow',
                    consentTimestamp: new Date().toISOString(),
                },
            }
            const response = await fetch('/api/asaas/create-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentRequest),
            })
            const responseBody = await response.json()
            if (!response.ok || responseBody?.success === false) {
                const message = responseBody?.error ?? 'Erro ao processar pagamento'
                throw new Error(message)
            }
            return responseBody as PaymentResponse
        } catch (caughtError) {
            const message = caughtError instanceof Error ? caughtError.message : 'Erro desconhecido'
            setError(`Erro ao processar pagamento: ${message}`)
            throw caughtError
        } finally {
            setLoading(false)
        }
    }, [])
    return {
        processPayment,
        loading,
        error,
        clearError,
    }
}