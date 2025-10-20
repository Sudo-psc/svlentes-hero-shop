'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { useToast } from '@/components/assinante/ToastFeedback'
interface DashboardActionState {
  isLoading: boolean
  isUpdating: boolean
  errors: Record<string, string | null>
  lastUpdated: Date | null
}
export function useDashboardActions() {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const { refetch } = useSubscription()
  const { success, error, warning } = useToast()
  const [state, setState] = useState<DashboardActionState>({
    isLoading: false,
    isUpdating: false,
    errors: {},
    lastUpdated: null
  })
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }))
  }, [])
  const setError = useCallback((action: string, error: string | null) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [action]: error }
    }))
  }, [])
  const clearError = useCallback((action: string) => {
    setError(action, null)
  }, [setError])
  const executeAction = useCallback(async <T,>(
    actionName: string,
    actionFn: () => Promise<T>,
    successMessage?: string,
    errorMessage?: string
  ): Promise<T | null> => {
    try {
      setError(actionName, null)
      setState(prev => ({ ...prev, isUpdating: true }))
      const result = await actionFn()
      if (successMessage) {
        success(successMessage)
      }
      setState(prev => ({
        ...prev,
        isUpdating: false,
        lastUpdated: new Date()
      }))
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : (errorMessage || 'Ocorreu um erro')
      setError(actionName, message)
      error('Erro', message)
      setState(prev => ({ ...prev, isUpdating: false }))
      return null
    }
  }, [setError, success, error])
  // Plan Actions
  const handleChangePlan = useCallback(async (newPlanId: string) => {
    return executeAction(
      'changePlan',
      async () => {
        const response = await fetch('/api/subscription/change-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': authUser?.uid || ''
          },
          body: JSON.stringify({ newPlanId })
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao alterar plano')
        }
        await refetch()
        return response.json()
      },
      'Plano alterado com sucesso!',
      'Não foi possível alterar seu plano no momento'
    )
  }, [executeAction, authUser?.uid, refetch])
  // Address Actions
  const handleUpdateAddress = useCallback(async (addressData: any) => {
    return executeAction(
      'updateAddress',
      async () => {
        const response = await fetch('/api/subscription/update-address', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': authUser?.uid || ''
          },
          body: JSON.stringify(addressData)
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao atualizar endereço')
        }
        await refetch()
        return response.json()
      },
      'Endereço atualizado com sucesso!',
      'Não foi possível atualizar seu endereço no momento'
    )
  }, [executeAction, authUser?.uid, refetch])
  // Payment Method Actions
  const handleUpdatePayment = useCallback(async (paymentData: any) => {
    return executeAction(
      'updatePayment',
      async () => {
        const response = await fetch('/api/subscription/update-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': authUser?.uid || ''
          },
          body: JSON.stringify(paymentData)
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao atualizar forma de pagamento')
        }
        await refetch()
        return response.json()
      },
      'Forma de pagamento atualizada com sucesso!',
      'Não foi possível atualizar sua forma de pagamento no momento'
    )
  }, [executeAction, authUser?.uid, refetch])
  // Reactivate Subscription
  const handleReactivate = useCallback(async () => {
    return executeAction(
      'reactivate',
      async () => {
        const response = await fetch('/api/subscription/reactivate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': authUser?.uid || ''
          }
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao reativar assinatura')
        }
        await refetch()
        return response.json()
      },
      'Assinatura reativada com sucesso!',
      'Não foi possível reativar sua assinatura no momento'
    )
  }, [executeAction, authUser?.uid, refetch])
  // Pause Subscription
  const handlePause = useCallback(async (duration: number = 30) => {
    return executeAction(
      'pause',
      async () => {
        const response = await fetch('/api/subscription/pause', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': authUser?.uid || ''
          },
          body: JSON.stringify({ duration })
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao pausar assinatura')
        }
        await refetch()
        return response.json()
      },
      'Assinatura pausada com sucesso!',
      'Não foi possível pausar sua assinatura no momento'
    )
  }, [executeAction, authUser?.uid, refetch])
  // Cancel Subscription
  const handleCancel = useCallback(async (reason?: string) => {
    return executeAction(
      'cancel',
      async () => {
        const response = await fetch('/api/subscription/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': authUser?.uid || ''
          },
          body: JSON.stringify({ reason })
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao cancelar assinatura')
        }
        await refetch()
        return response.json()
      },
      'Assinatura cancelada com sucesso.',
      'Não foi possível cancelar sua assinatura no momento'
    )
  }, [executeAction, authUser?.uid, refetch])
  // Navigation Actions
  const navigateToOrders = useCallback(() => {
    // Open orders modal or navigate to orders page
    success('Abrindo histórico de pedidos...')
  }, [success])
  const navigateToInvoices = useCallback(() => {
    // Open invoices modal or navigate to invoices page
    success('Abrindo faturas...')
  }, [success])
  const navigateToSettings = useCallback(() => {
    router.push('/area-assinante/configuracoes')
  }, [router])
  const navigateToSchedule = useCallback(() => {
    router.push('/agendar-consulta')
  }, [router])
  const navigateToUpgrade = useCallback(() => {
    router.push('/assinar')
  }, [router])
  // Support Actions
  const contactSupport = useCallback((type: 'whatsapp' | 'phone' | 'email') => {
    switch (type) {
      case 'whatsapp':
        window.open('https://wa.me/5533999898026', '_blank')
        break
      case 'phone':
        window.open('tel:+5533986061427', '_blank')
        break
      case 'email':
        window.open('mailto:contato@svlentes.com.br', '_blank')
        break
    }
    success('Canal de suporte aberto')
  }, [success])
  // Refresh Data
  const refreshData = useCallback(async () => {
    return executeAction(
      'refresh',
      async () => {
        await refetch()
        return true
      },
      'Dados atualizados com sucesso!',
      'Não foi possível atualizar os dados no momento'
    )
  }, [executeAction, refetch])
  // Error Recovery
  const retryAction = useCallback(async (actionName: string) => {
    clearError(actionName)
    switch (actionName) {
      case 'changePlan':
        warning('Por favor, selecione um novo plano para tentar novamente')
        break
      case 'updateAddress':
        warning('Por favor, verifique seus dados e tente novamente')
        break
      case 'updatePayment':
        warning('Por favor, verifique seus dados de pagamento e tente novamente')
        break
      case 'reactivate':
        await handleReactivate()
        break
      case 'pause':
        await handlePause()
        break
      case 'cancel':
        warning('Por favor, confirme o cancelamento para tentar novamente')
        break
      default:
        await refreshData()
    }
  }, [clearError, handleReactivate, handlePause, refreshData, warning])
  return {
    // State
    state,
    isLoading: state.isLoading,
    isUpdating: state.isUpdating,
    errors: state.errors,
    lastUpdated: state.lastUpdated,
    // Actions
    actions: {
      changePlan: handleChangePlan,
      updateAddress: handleUpdateAddress,
      updatePayment: handleUpdatePayment,
      reactivate: handleReactivate,
      pause: handlePause,
      cancel: handleCancel,
      refresh: refreshData,
      retry: retryAction
    },
    // Navigation
    navigation: {
      orders: navigateToOrders,
      invoices: navigateToInvoices,
      settings: navigateToSettings,
      schedule: navigateToSchedule,
      upgrade: navigateToUpgrade
    },
    // Support
    support: {
      contact: contactSupport
    },
    // Utilities
    clearError,
    setLoading
  }
}
export type DashboardActions = ReturnType<typeof useDashboardActions>