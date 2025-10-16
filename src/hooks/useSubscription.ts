'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Subscription,
  PaymentMethod,
  DeliveryAddress,
  Order,
  Invoice,
  SubscriptionUpdateData,
  PlanChangeRequest
} from '@/types/subscription'
import {
  AirtableSubscriptionService,
  AirtableOrderService,
  AirtableAnalyticsService,
  checkAirtableConnection
} from '@/lib/airtable'

interface UseSubscriptionReturn {
  // Estado
  subscription: Subscription | null
  loading: boolean
  error: string | null
  orders: Order[]
  invoices: Invoice[]

  // Ações de Assinatura
  createSubscription: (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Subscription>
  updateSubscription: (updates: SubscriptionUpdateData) => Promise<Subscription>
  cancelSubscription: (reason: string, effectiveDate?: Date) => Promise<Subscription>
  pauseSubscription: (reason: string) => Promise<Subscription>
  reactivateSubscription: () => Promise<Subscription>
  changePlan: (newPlan: 'monthly' | 'annual', effectiveDate: 'immediate' | 'next_billing', reason?: string) => Promise<Subscription>

  // Métodos de Pagamento
  addPaymentMethod: (paymentMethod: Omit<PaymentMethod, 'id' | 'createdAt'>) => Promise<PaymentMethod>
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethod>) => Promise<PaymentMethod>
  removePaymentMethod: (id: string) => Promise<void>
  setDefaultPaymentMethod: (id: string) => Promise<PaymentMethod>

  // Endereço
  updateDeliveryAddress: (address: Partial<DeliveryAddress>) => Promise<Subscription>

  // Pedidos e Faturas
  refreshOrders: () => Promise<void>
  refreshInvoices: () => Promise<void>

  // Utilitários
  refreshSubscription: () => Promise<void>
  isAirtableConnected: boolean
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAirtableConnected, setIsAirtableConnected] = useState(false)

  // Verificar conexão com Airtable
  useEffect(() => {
    checkAirtableConnection().then(setIsAirtableConnected)
  }, [])

  // Carregar assinatura do usuário
  const refreshSubscription = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const userSubscription = await AirtableSubscriptionService.getSubscriptionByUserId(user.uid)
      setSubscription(userSubscription)

      // Se existe assinatura, carregar pedidos relacionados
      if (userSubscription) {
        await Promise.all([
          refreshOrdersForSubscription(userSubscription.id),
          refreshInvoicesForSubscription(userSubscription.id)
        ])
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar assinatura')
      console.error('Erro ao carregar assinatura:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Carregar pedidos de uma assinatura
  const refreshOrdersForSubscription = async (subscriptionId: string) => {
    try {
      const subscriptionOrders = await AirtableOrderService.getOrdersBySubscription(subscriptionId)
      setOrders(subscriptionOrders)
    } catch (err: any) {
      console.error('Erro ao carregar pedidos:', err)
    }
  }

  // Carregar faturas de uma assinatura (simulação - implementar conforme necessário)
  const refreshInvoicesForSubscription = async (subscriptionId: string) => {
    // Implementar quando tivermos a tabela de invoices
    // const subscriptionInvoices = await AirtableInvoiceService.getInvoicesBySubscription(subscriptionId)
    // setInvoices(subscriptionInvoices)
  }

  // Métodos públicos
  const refreshOrders = useCallback(async () => {
    if (!subscription) return
    await refreshOrdersForSubscription(subscription.id)
  }, [subscription])

  const refreshInvoices = useCallback(async () => {
    if (!subscription) return
    await refreshInvoicesForSubscription(subscription.id)
  }, [subscription])

  // Criar nova assinatura
  const createSubscription = async (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true)
    setError(null)

    try {
      const newSubscription = await AirtableSubscriptionService.createSubscription(data)
      setSubscription(newSubscription)
      return newSubscription
    } catch (err: any) {
      setError(err.message || 'Erro ao criar assinatura')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Atualizar assinatura
  const updateSubscription = async (updates: SubscriptionUpdateData) => {
    if (!subscription) throw new Error('Nenhuma assinatura encontrada')

    setLoading(true)
    setError(null)

    try {
      const updatedSubscription = await AirtableSubscriptionService.updateSubscription(subscription.id, updates)
      setSubscription(updatedSubscription)
      return updatedSubscription
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar assinatura')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Cancelar assinatura
  const cancelSubscription = async (reason: string, effectiveDate?: Date) => {
    if (!subscription) throw new Error('Nenhuma assinatura encontrada')

    setLoading(true)
    setError(null)

    try {
      const cancelledSubscription = await AirtableSubscriptionService.cancelSubscription(
        subscription.id,
        reason,
        effectiveDate
      )
      setSubscription(cancelledSubscription)
      return cancelledSubscription
    } catch (err: any) {
      setError(err.message || 'Erro ao cancelar assinatura')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Pausar assinatura
  const pauseSubscription = async (reason: string) => {
    if (!subscription) throw new Error('Nenhuma assinatura encontrada')

    setLoading(true)
    setError(null)

    try {
      const pausedSubscription = await AirtableSubscriptionService.pauseSubscription(subscription.id, reason)
      setSubscription(pausedSubscription)
      return pausedSubscription
    } catch (err: any) {
      setError(err.message || 'Erro ao pausar assinatura')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Reativar assinatura
  const reactivateSubscription = async () => {
    if (!subscription) throw new Error('Nenhuma assinatura encontrada')

    setLoading(true)
    setError(null)

    try {
      const reactivatedSubscription = await AirtableSubscriptionService.reactivateSubscription(subscription.id)
      setSubscription(reactivatedSubscription)
      return reactivatedSubscription
    } catch (err: any) {
      setError(err.message || 'Erro ao reativar assinatura')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Alterar plano
  const changePlan = async (
    newPlan: 'monthly' | 'annual',
    effectiveDate: 'immediate' | 'next_billing' = 'next_billing',
    reason?: string
  ) => {
    if (!subscription) throw new Error('Nenhuma assinatura encontrada')
    if (subscription.plan === newPlan) throw new Error('O plano selecionado é o mesmo do atual')

    setLoading(true)
    setError(null)

    try {
      if (effectiveDate === 'immediate') {
        // Alteração imediata
        await updateSubscription({ plan: newPlan })
      } else {
        // Alteração no próximo ciclo de cobrança (implementar lógica de agendamento)
        await updateSubscription({
          plan: newPlan,
          metadata: {
            ...subscription.metadata,
            pendingPlanChange: {
              newPlan,
              effectiveDate: subscription.nextBillingDate,
              reason
            }
          }
        })
      }

      return subscription!
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar plano')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Adicionar método de pagamento
  const addPaymentMethod = async (paymentMethod: Omit<PaymentMethod, 'id' | 'createdAt'>) => {
    // Implementar quando tivermos a tabela de payment methods
    const newPaymentMethod: PaymentMethod = {
      ...paymentMethod,
      id: `pm_${Date.now()}`,
      createdAt: new Date().toISOString()
    }

    // Se for o primeiro método ou marcado como padrão, atualizar assinatura
    if (!subscription || paymentMethod.isDefault) {
      await updateSubscription({ paymentMethod: newPaymentMethod })
    }

    return newPaymentMethod
  }

  // Atualizar método de pagamento
  const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethod>) => {
    if (!subscription) throw new Error('Nenhuma assinatura encontrada')

    if (subscription.paymentMethod.id === id) {
      const updatedPaymentMethod = { ...subscription.paymentMethod, ...updates }
      await updateSubscription({ paymentMethod: updatedPaymentMethod })
      return updatedPaymentMethod
    }

    throw new Error('Método de pagamento não encontrado')
  }

  // Remover método de pagamento
  const removePaymentMethod = async (id: string) => {
    if (!subscription) throw new Error('Nenhuma assinatura encontrada')
    if (subscription.paymentMethod.id === id) {
      throw new Error('Não é possível remover o método de pagamento padrão')
    }
    // Implementar quando tivermos múltiplos métodos de pagamento
  }

  // Definir método de pagamento padrão
  const setDefaultPaymentMethod = async (id: string) => {
    // Implementar quando tivermos múltiplos métodos de pagamento
    throw new Error('Funcionalidade não implementada ainda')
  }

  // Atualizar endereço de entrega
  const updateDeliveryAddress = async (address: Partial<DeliveryAddress>) => {
    if (!subscription) throw new Error('Nenhuma assinatura encontrada')
    return updateSubscription({ deliveryAddress: address })
  }

  // Carregar assinatura quando o usuário mudar
  useEffect(() => {
    if (user) {
      refreshSubscription()
    } else {
      setSubscription(null)
      setOrders([])
      setInvoices([])
    }
  }, [user, refreshSubscription])

  return {
    // Estado
    subscription,
    loading,
    error,
    orders,
    invoices,

    // Ações
    createSubscription,
    updateSubscription,
    cancelSubscription,
    pauseSubscription,
    reactivateSubscription,
    changePlan,

    // Métodos de pagamento
    addPaymentMethod,
    updatePaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,

    // Endereço
    updateDeliveryAddress,

    // Pedidos e faturas
    refreshOrders,
    refreshInvoices,

    // Utilitários
    refreshSubscription,
    isAirtableConnected
  }
}