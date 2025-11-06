'use client'

import { EnhancedSubscriptionCard } from './EnhancedSubscriptionCard'
import { useStripeSubscription } from '@/hooks/useStripeSubscription'
import { useStripePortal } from '@/hooks/useStripePortal'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SubscriptionStatus } from '@/lib/subscription-helpers'

/**
 * Wrapper component que integra EnhancedSubscriptionCard com dados em tempo real do Stripe
 *
 * Este componente:
 * - Busca assinatura ativa do Stripe via API
 * - Transforma dados do Stripe para formato esperado pelo EnhancedSubscriptionCard
 * - Fornece integração com Stripe Customer Portal
 * - Gerencia estados de loading e erro
 *
 * @example
 * ```tsx
 * <StripeSubscriptionCard />
 * ```
 *
 * @author Dr. Philipe Saraiva Cruz
 */
export function StripeSubscriptionCard() {
  const { subscription, isLoading, error, refetch } = useStripeSubscription()
  const { openPortal, isLoading: portalLoading } = useStripePortal()

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden p-6 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erro ao Carregar Assinatura
          </h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md">
            {error}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  // No subscription state
  if (!subscription) {
    return (
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma Assinatura Ativa
          </h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md">
            Você ainda não possui uma assinatura ativa no momento.
          </p>
          <Button
            onClick={() => openPortal('/area-assinante/dashboard')}
            disabled={portalLoading}
          >
            {portalLoading ? 'Carregando...' : 'Ver Planos Disponíveis'}
          </Button>
        </div>
      </div>
    )
  }

  // Transform Stripe data to EnhancedSubscriptionCard format
  const mapStripeStatus = (stripeStatus: string): SubscriptionStatus => {
    switch (stripeStatus) {
      case 'active':
        return 'active'
      case 'canceled':
        return 'cancelled'
      case 'past_due':
      case 'unpaid':
        return 'pending'
      case 'paused':
        return 'paused'
      default:
        return 'pending'
    }
  }

  const status = mapStripeStatus(subscription.status)
  const planName = subscription.plan.name
  const price = subscription.plan.amount / 100 // Convert cents to currency
  const billingCycle = subscription.plan.interval === 'year' ? 'yearly' : 'monthly'
  const nextBillingDate = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : undefined

  // Payment method details
  const paymentMethod = subscription.payment_method?.type || undefined
  const paymentMethodLast4 = subscription.payment_method?.card?.last4 || undefined

  // Mock shipping address - in production, this would come from Stripe metadata or separate API
  const shippingAddress = undefined // TODO: Integrate with shipping API if needed

  return (
    <EnhancedSubscriptionCard
      status={status}
      planName={planName}
      price={price}
      billingCycle={billingCycle}
      nextBillingDate={nextBillingDate}
      paymentMethod={paymentMethod}
      paymentMethodLast4={paymentMethodLast4}
      shippingAddress={shippingAddress}
      onRefresh={refetch}
      onEditPlan={() => openPortal('/area-assinante/dashboard')}
      onEditPayment={() => openPortal('/area-assinante/dashboard')}
      onEditAddress={() => openPortal('/area-assinante/dashboard')}
      onReactivate={() => openPortal('/area-assinante/dashboard')}
      isLoading={isLoading}
    />
  )
}
