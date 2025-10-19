'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/Button'
import {
  Package,
  AlertTriangle,
  Calendar,
  CreditCard,
  MapPin,
  FileText,
  RefreshCcw,
  Settings,
  Edit
} from 'lucide-react'
import { DashboardLoading } from '@/components/assinante/DashboardLoading'
import { DashboardError } from '@/components/assinante/DashboardError'
import { OrdersModal } from '@/components/assinante/OrdersModal'
import { InvoicesModal } from '@/components/assinante/InvoicesModal'
import { ChangePlanModal } from '@/components/assinante/ChangePlanModal'
import { UpdateAddressModal } from '@/components/assinante/UpdateAddressModal'
import { UpdatePaymentModal } from '@/components/assinante/UpdatePaymentModal'
import { SubscriptionHistoryTimeline } from '@/components/assinante/SubscriptionHistoryTimeline'
import { formatDate, formatCurrency } from '@/lib/formatters'
import { getSubscriptionStatusColor, getSubscriptionStatusLabel } from '@/lib/subscription-helpers'

export default function DashboardPage() {
  const router = useRouter()
  const { user: authUser, loading: authLoading, signOut } = useAuth()
  const { subscription, user, loading: subLoading, error, refetch } = useSubscription()
  const [showOrdersModal, setShowOrdersModal] = useState(false)
  const [showInvoicesModal, setShowInvoicesModal] = useState(false)
  const [showChangePlanModal, setShowChangePlanModal] = useState(false)
  const [showUpdateAddressModal, setShowUpdateAddressModal] = useState(false)
  const [showUpdatePaymentModal, setShowUpdatePaymentModal] = useState(false)
  const [availablePlans, setAvailablePlans] = useState<any[]>([])

  // Load pricing plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const { default: plansData } = await import('@/data/pricing-plans')
        setAvailablePlans(plansData)
      } catch (error) {
        console.error('Error loading plans:', error)
      }
    }
    loadPlans()
  }, [])

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/area-assinante/login')
    }
  }, [authUser, authLoading, router])

  // Handler functions for modals
  const handlePlanChange = async (newPlanId: string) => {
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
  }

  const handleAddressUpdate = async (addressData: any) => {
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
  }

  const handlePaymentUpdate = async (paymentData: any) => {
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
  }

  if (authLoading || subLoading) {
    return <DashboardLoading />
  }

  if (!authUser) {
    return null
  }

  if (error) {
    return (
      <DashboardError
        message={error}
        onRetry={refetch}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo(a), {user?.name || authUser.displayName}!
          </h2>
          <p className="text-gray-600">
            Aqui você pode acompanhar sua assinatura de lentes de contato e gerenciar seus dados.
          </p>
        </div>

        {/* No Subscription State */}
        {!subscription && (
          <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Você ainda não possui uma assinatura ativa
            </h3>
            <p className="text-gray-600 mb-6">
              Comece agora a economizar com o plano de lentes de contato ideal para você!
            </p>
            <Button onClick={() => router.push('/assinar')}>
              Ver Planos Disponíveis
            </Button>
          </div>
        )}

        {/* Dashboard with Subscription */}
        {subscription && (
          <>
            {/* Subscription Status */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="h-5 w-5 text-cyan-600" />
                    Status da Assinatura
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getSubscriptionStatusColor(subscription.status)}`}>
                    {getSubscriptionStatusLabel(subscription.status)}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Plano:</span>
                    <span className="font-medium">{subscription.plan.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Valor mensal:</span>
                    <span className="font-bold text-cyan-600">
                      {formatCurrency(subscription.plan.price)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Próxima cobrança:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(subscription.nextBillingDate)}
                    </span>
                  </div>
                  <div className="pt-3 border-t grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowChangePlanModal(true)}
                      className="w-full"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Mudar Plano
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refetch}
                      className="w-full"
                    >
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Payment & Delivery Info */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-cyan-600" />
                  Pagamento e Entrega
                </h3>
                <div className="space-y-3">
                  {subscription.paymentMethod && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Forma de pagamento:</span>
                      <span className="font-medium capitalize">
                        {subscription.paymentMethod}
                        {subscription.paymentMethodLast4 && ` •••• ${subscription.paymentMethodLast4}`}
                      </span>
                    </div>
                  )}
                  {subscription.shippingAddress && (
                    <div className="pt-3 border-t">
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">Endereço de entrega:</p>
                          <p className="text-gray-600">
                            {subscription.shippingAddress.street}, {subscription.shippingAddress.number}
                            {subscription.shippingAddress.complement && `, ${subscription.shippingAddress.complement}`}
                          </p>
                          <p className="text-gray-600">
                            {subscription.shippingAddress.neighborhood} - {subscription.shippingAddress.city}/{subscription.shippingAddress.state}
                          </p>
                          <p className="text-gray-600">CEP: {subscription.shippingAddress.zipCode}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="pt-3 border-t grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUpdatePaymentModal(true)}
                      className="w-full"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Forma Pagamento
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUpdateAddressModal(true)}
                      className="w-full"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Endereço
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            {subscription.benefits && subscription.benefits.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Benefícios da Assinatura</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subscription.benefits.map((benefit) => (
                    <div key={benefit.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        {benefit.icon && (
                          <span className="text-2xl">{benefit.icon}</span>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{benefit.name}</p>
                          {benefit.description && (
                            <p className="text-sm text-gray-600 mt-1">{benefit.description}</p>
                          )}
                          {benefit.quantityTotal && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span>Utilizado: {benefit.quantityUsed || 0}/{benefit.quantityTotal}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-cyan-600 h-1.5 rounded-full"
                                  style={{
                                    width: `${((benefit.quantityUsed || 0) / benefit.quantityTotal) * 100}%`
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4 mb-8">
              <Button onClick={() => setShowOrdersModal(true)}>
                <Package className="h-4 w-4 mr-2" />
                Ver Histórico de Pedidos
              </Button>
              <Button variant="outline" onClick={() => setShowInvoicesModal(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Baixar Fatura
              </Button>
              <Button variant="outline" onClick={() => router.push('/area-assinante/configuracoes')}>
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </div>

            {/* Subscription History Timeline */}
            <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
              <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <RefreshCcw className="h-5 w-5 text-cyan-600" />
                Histórico de Alterações
              </h3>
              <SubscriptionHistoryTimeline userId={authUser.uid} />
            </div>
          </>
        )}

        {/* Emergency Contact */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-cyan-600" />
            Contato de Emergência
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">WhatsApp:</p>
              <a
                href="https://wa.me/5533999898026"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 hover:underline font-medium text-lg"
              >
                +55 33 99989-8026
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Email:</p>
              <a
                href="mailto:contato@svlentes.com.br"
                className="text-cyan-600 hover:underline font-medium"
              >
                contato@svlentes.com.br
              </a>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-gray-900">Médico Responsável:</p>
            <p className="text-sm text-gray-700">
              <strong>Dr. Philipe Saraiva Cruz</strong> - CRM-MG 69.870
            </p>
          </div>
        </div>
      </main>

      {/* Modals */}
      <OrdersModal isOpen={showOrdersModal} onClose={() => setShowOrdersModal(false)} />
      <InvoicesModal isOpen={showInvoicesModal} onClose={() => setShowInvoicesModal(false)} />

      {subscription && (
        <>
          <ChangePlanModal
            isOpen={showChangePlanModal}
            onClose={() => setShowChangePlanModal(false)}
            currentPlan={{
              id: subscription.plan.id,
              name: subscription.plan.name,
              price: subscription.plan.price
            }}
            availablePlans={availablePlans}
            onPlanChange={handlePlanChange}
          />

          <UpdateAddressModal
            isOpen={showUpdateAddressModal}
            onClose={() => setShowUpdateAddressModal(false)}
            currentAddress={subscription.shippingAddress}
            onAddressUpdate={handleAddressUpdate}
          />

          <UpdatePaymentModal
            isOpen={showUpdatePaymentModal}
            onClose={() => setShowUpdatePaymentModal(false)}
            currentPaymentMethod={{
              type: subscription.paymentMethod as any,
              last4: subscription.paymentMethodLast4
            }}
            onPaymentUpdate={handlePaymentUpdate}
          />
        </>
      )}
    </div>
  )
}

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'
