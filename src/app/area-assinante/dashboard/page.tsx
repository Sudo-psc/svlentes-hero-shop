'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import {
  User,
  Package,
  AlertTriangle,
  Calendar,
  CreditCard,
  MapPin,
  FileText,
  RefreshCcw
} from 'lucide-react'
import { DashboardLoading } from '@/components/assinante/DashboardLoading'
import { DashboardError } from '@/components/assinante/DashboardError'
import { OrdersModal } from '@/components/assinante/OrdersModal'
import { InvoicesModal } from '@/components/assinante/InvoicesModal'

export default function DashboardPage() {
  const router = useRouter()
  const { user: authUser, loading: authLoading, signOut } = useAuth()
  const { subscription, user, loading: subLoading, error, refetch } = useSubscription()
  const [showOrdersModal, setShowOrdersModal] = useState(false)
  const [showInvoicesModal, setShowInvoicesModal] = useState(false)

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/area-assinante/login')
    }
  }, [authUser, authLoading, router])

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

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa'
      case 'paused':
        return 'Pausada'
      case 'cancelled':
        return 'Cancelada'
      case 'inactive':
        return 'Inativa'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Logo className="h-8 w-auto" />
              <span className="text-lg font-semibold text-gray-900">Área do Assinante</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-cyan-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.name || authUser.displayName}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

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
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(subscription.status)}`}>
                    {getStatusLabel(subscription.status)}
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
                  <div className="pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refetch}
                      className="w-full"
                    >
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Atualizar Dados
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
              <Button variant="outline" onClick={() => {/* TODO: Implement payment method change */}}>
                <CreditCard className="h-4 w-4 mr-2" />
                Alterar Forma de Pagamento
              </Button>
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
                href="https://wa.me/553399898026"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 hover:underline font-medium text-lg"
              >
                +55 33 99898-026
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
    </div>
  )
}

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'
