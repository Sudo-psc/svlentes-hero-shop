'use client'

import { useState } from 'react'
import { useSubscription } from '@/hooks/useSubscription'
import { formatCurrency } from '@/lib/calculator'
import { cn } from '@/lib/utils'
import {
  CreditCard,
  Package,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Settings,
  X,
  Check,
  Clock,
  MapPin,
  Phone,
  User,
  Download,
  RefreshCw,
  Pause,
  Play,
  ArrowUpDown,
  CreditCard as PaymentIcon,
  FileText,
  MessageCircle,
  ChevronRight,
  Activity,
  DollarSign,
  Users,
  ShoppingCart
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface SubscriptionDashboardProps {
  className?: string
}

export function SubscriptionDashboard({ className }: SubscriptionDashboardProps) {
  const {
    subscription,
    loading,
    error,
    orders,
    invoices,
    updateSubscription,
    cancelSubscription,
    pauseSubscription,
    reactivateSubscription,
    changePlan,
    updateDeliveryAddress,
    refreshOrders,
    refreshInvoices,
    refreshSubscription,
    isAirtableConnected
  } = useSubscription()

  const [activeTab, setActiveTab] = useState('overview')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false)
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [pauseReason, setPauseReason] = useState('')
  const [newPlan, setNewPlan] = useState<'monthly' | 'annual'>('annual')
  const [planChangeReason, setPlanChangeReason] = useState('')

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-600" />
        <span className="ml-2 text-gray-600">Carregando informações...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-800 font-medium">Erro ao carregar informações</span>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <Button
          onClick={refreshSubscription}
          variant="outline"
          size="sm"
          className="mt-4"
        >
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma assinatura encontrada</h3>
        <p className="text-gray-600 mb-4">
          Você ainda não possui uma assinatura ativa. Assine hoje para começar a receber suas lentes em casa!
        </p>
        <Button onClick={() => window.location.href = '/calculadora'}>
          Começar Assinatura
        </Button>
      </div>
    )
  }

  const handleCancelSubscription = async () => {
    if (!cancelReason.trim()) return

    try {
      await cancelSubscription(cancelReason)
      setShowCancelModal(false)
      setCancelReason('')
    } catch (err: any) {
      console.error('Erro ao cancelar assinatura:', err)
    }
  }

  const handlePauseSubscription = async () => {
    if (!pauseReason.trim()) return

    try {
      await pauseSubscription(pauseReason)
      setShowPauseModal(false)
      setPauseReason('')
    } catch (err: any) {
      console.error('Erro ao pausar assinatura:', err)
    }
  }

  const handlePlanChange = async () => {
    try {
      await changePlan(newPlan, 'next_billing', planChangeReason)
      setShowPlanChangeModal(false)
      setPlanChangeReason('')
    } catch (err: any) {
      console.error('Erro ao alterar plano:', err)
    }
  }

  const isPaused = subscription.status === 'paused'
  const isCancelled = subscription.status === 'cancelled'
  const isActive = subscription.status === 'active'

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Activity },
    { id: 'orders', label: 'Meus Pedidos', icon: Package },
    { id: 'payment', label: 'Pagamento', icon: CreditCard },
    { id: 'address', label: 'Endereço', icon: MapPin },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ]

  return (
    <div className={cn('space-y-6', className)}>
      {/* Status Alert */}
      {!isAirtableConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">Conexão com banco de dados limitada</span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Algumas funcionalidades podem estar indisponíveis no momento.
          </p>
        </div>
      )}

      {/* Subscription Status Card */}
      <div className={cn(
        'rounded-xl p-6 border-2',
        isActive ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-600' :
        isPaused ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-600' :
        'bg-gradient-to-r from-red-50 to-pink-50 border-red-600'
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-xl font-bold text-gray-900">Minha Assinatura</h3>
              <span className={cn(
                'px-3 py-1 text-xs font-semibold rounded-full',
                isActive ? 'bg-green-100 text-green-800' :
                isPaused ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              )}>
                {isActive ? '✓ Ativa' : isPaused ? '⏸ Pausada' : '✕ Cancelada'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Plano:</span>
                <div className="font-semibold text-gray-900">
                  {subscription.plan === 'monthly' ? '💳 Mensal' : '💎 Anual'}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Tipo de Lente:</span>
                <div className="font-semibold text-gray-900">{subscription.lensType}</div>
              </div>
              <div>
                <span className="text-gray-600">Valor Mensal:</span>
                <div className="font-bold text-lg text-cyan-600">
                  {formatCurrency(subscription.monthlyPrice)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isActive && (
          <div className="bg-white/50 rounded-lg p-3 border border-white/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">Próxima cobrança:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(subscription.nextBillingDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex space-x-2">
                {isPaused ? (
                  <Button
                    onClick={() => reactivateSubscription()}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Reativar
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => setShowPauseModal(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pausar
                    </Button>
                    <Button
                      onClick={() => setShowCancelModal(true)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2',
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <OverviewTab
            subscription={subscription}
            orders={orders}
            onChangePlan={() => setShowPlanChangeModal(true)}
          />
        )}
        {activeTab === 'orders' && (
          <OrdersTab
            orders={orders}
            onRefresh={refreshOrders}
          />
        )}
        {activeTab === 'payment' && (
          <PaymentTab
            subscription={subscription}
            onChangePlan={() => setShowPlanChangeModal(true)}
          />
        )}
        {activeTab === 'address' && (
          <AddressTab
            subscription={subscription}
            onUpdateAddress={updateDeliveryAddress}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            subscription={subscription}
            onPause={() => setShowPauseModal(true)}
            onCancel={() => setShowCancelModal(true)}
            onReactivate={reactivateSubscription}
          />
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <CancelModal
          onConfirm={handleCancelSubscription}
          onCancel={() => {
            setShowCancelModal(false)
            setCancelReason('')
          }}
          reason={cancelReason}
          onReasonChange={setCancelReason}
        />
      )}

      {/* Pause Modal */}
      {showPauseModal && (
        <PauseModal
          onConfirm={handlePauseSubscription}
          onCancel={() => {
            setShowPauseModal(false)
            setPauseReason('')
          }}
          reason={pauseReason}
          onReasonChange={setPauseReason}
        />
      )}

      {/* Plan Change Modal */}
      {showPlanChangeModal && (
        <PlanChangeModal
          currentPlan={subscription.plan}
          onConfirm={handlePlanChange}
          onCancel={() => {
            setShowPlanChangeModal(false)
            setPlanChangeReason('')
          }}
          newPlan={newPlan}
          onNewPlanChange={setNewPlan}
          reason={planChangeReason}
          onReasonChange={setPlanChangeReason}
        />
      )}
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ subscription, orders, onChangePlan }: any) {
  const nextBillingDate = new Date(subscription.nextBillingDate)
  const daysUntilBilling = Math.ceil((nextBillingDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Próxima cobrança</p>
              <p className="text-2xl font-bold text-gray-900">{daysUntilBilling}</p>
              <p className="text-xs text-gray-500">dias</p>
            </div>
            <Calendar className="h-8 w-8 text-cyan-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pedidos este ano</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-xs text-gray-500">entregues</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Economia total</p>
              <p className="text-2xl font-bold text-gray-900">R$ 840</p>
              <p className="text-xs text-gray-500">este ano</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-bold text-green-600">Ativo</p>
              <p className="text-xs text-gray-500">desde {subscription.startDate}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Pedidos Recentes</h3>
        </div>
        <div className="p-4">
          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.slice(0, 3).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Pedido #{order.id.slice(-6)}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-sm text-green-600">{order.status}</p>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {/* Navigate to orders tab */}}
              >
                Ver todos os pedidos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Nenhum pedido encontrado ainda.
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Ações Rápidas</h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button onClick={onChangePlan} variant="outline" className="justify-start">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Alterar Plano
          </Button>
          <Button variant="outline" className="justify-start">
            <Download className="h-4 w-4 mr-2" />
            Baixar Fatura
          </Button>
          <Button variant="outline" className="justify-start">
            <MessageCircle className="h-4 w-4 mr-2" />
            Suporte via WhatsApp
          </Button>
          <Button variant="outline" className="justify-start">
            <FileText className="h-4 w-4 mr-2" />
            Histórico Completo
          </Button>
        </div>
      </div>
    </div>
  )
}

// Orders Tab Component
function OrdersTab({ orders, onRefresh }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Histórico de Pedidos</h3>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-1" />
          Atualizar
        </Button>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Pedido #{order.id.slice(-6)}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <span className={cn(
                    'px-2 py-1 text-xs rounded-full',
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  )}>
                    {order.status === 'delivered' ? 'Entregue' :
                     order.status === 'shipped' ? 'Enviado' :
                     order.status === 'processing' ? 'Processando' :
                     order.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {order.items?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>

              {order.trackingCode && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Código de rastreamento: <span className="font-mono font-medium">{order.trackingCode}</span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
          <p className="text-gray-600">
            Seus pedidos aparecerão aqui assim que forem processados.
          </p>
        </div>
      )}
    </div>
  )
}

// Payment Tab Component
function PaymentTab({ subscription, onChangePlan }: any) {
  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Plano Atual</h3>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">
                {subscription.plan === 'monthly' ? '💳' : '💎'}
              </span>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {subscription.plan === 'monthly' ? 'Plano Mensal' : 'Plano Anual'}
                </h4>
                <p className="text-sm text-gray-600">
                  {subscription.plan === 'monthly'
                    ? 'Flexibilidade mensal sem compromisso'
                    : 'Máxima economia com benefícios exclusivos'
                  }
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold text-cyan-600">
              {formatCurrency(subscription.monthlyPrice)}
              <span className="text-sm font-normal text-gray-600">/mês</span>
            </div>
          </div>
        </div>
        <Button onClick={onChangePlan} className="w-full">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          Alterar Plano
        </Button>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Método de Pagamento</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <PaymentIcon className="h-8 w-8 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">
                {subscription.paymentMethod.brand || 'Cartão'} •••• {subscription.paymentMethod.last4}
              </p>
              <p className="text-sm text-gray-600">
                {subscription.paymentMethod.holderName}
              </p>
            </div>
          </div>
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
            Padrão
          </span>
        </div>
        <Button variant="outline" className="w-full mt-4">
          Alterar Método de Pagamento
        </Button>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Cobranças</h3>
        <p className="text-gray-600 text-center py-8">
          Histórico de cobranças será exibido aqui em breve.
        </p>
      </div>
    </div>
  )
}

// Address Tab Component
function AddressTab({ subscription, onUpdateAddress }: any) {
  const [isEditing, setIsEditing] = useState(false)
  const [address, setAddress] = useState(subscription.deliveryAddress)

  const handleSave = async () => {
    try {
      await onUpdateAddress(address)
      setIsEditing(false)
    } catch (err) {
      console.error('Erro ao atualizar endereço:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Endereço de Entrega</h3>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              Editar
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rua
                </label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  value={address.number}
                  onChange={(e) => setAddress({ ...address, number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  value={address.complement || ''}
                  onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={address.neighborhood}
                  onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <input
                  type="text"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  value={address.zipCode}
                  onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <Button onClick={handleSave}>
                Salvar
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false)
                  setAddress(subscription.deliveryAddress)
                }}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-gray-900">
                  {address.street}, {address.number}
                  {address.complement && `, ${address.complement}`}
                </p>
                <p className="text-gray-600">
                  {address.neighborhood}, {address.city} - {address.state}
                </p>
                <p className="text-gray-600">{address.zipCode}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Contato</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">WhatsApp</p>
              <p className="font-medium text-gray-900">{subscription.contactInfo.whatsapp}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{subscription.contactInfo.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Settings Tab Component
function SettingsTab({ subscription, onPause, onCancel, onReactivate }: any) {
  const isPaused = subscription.status === 'paused'
  const isCancelled = subscription.status === 'cancelled'

  return (
    <div className="space-y-6">
      {/* Subscription Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gerenciar Assinatura</h3>

        {isCancelled ? (
          <div className="text-center py-8">
            <X className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Assinatura Cancelada</h4>
            <p className="text-gray-600 mb-4">
              Sua assinatura foi cancelada em {subscription.endDate}.
            </p>
            <Button>
              Criar Nova Assinatura
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {isPaused ? (
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-yellow-900">Assinatura Pausada</h4>
                  <p className="text-sm text-yellow-700">
                    As entregas estão temporariamente suspensas.
                  </p>
                </div>
                <Button onClick={onReactivate} className="bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-1" />
                  Reativar
                </Button>
              </div>
            ) : (
              <>
                <Button onClick={onPause} variant="outline" className="w-full justify-start">
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar Assinatura Temporariamente
                </Button>
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="w-full justify-start text-red-600 border-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar Assinatura
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Support */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Suporte e Ajuda</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Precisa de ajuda?</h4>
            <p className="text-gray-600 mb-3">
              Nossa equipe está disponível para ajudar com qualquer dúvida sobre sua assinatura.
            </p>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp: +55 33 99898-026
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Central de Ajuda
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Medical Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-900">Informações Médicas</h4>
        </div>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Dr. Philipe Saraiva Cruz</strong></p>
          <p>CRM-MG 69.870</p>
          <p>Em caso de emergência, ligue imediatamente para o serviço de emergência ou contate nosso médico.</p>
        </div>
      </div>
    </div>
  )
}

// Cancel Modal Component
function CancelModal({ onConfirm, onCancel, reason, onReasonChange }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancelar Assinatura</h3>
        <p className="text-gray-600 mb-4">
          Tem certeza que deseja cancelar sua assinatura? Você pode reativá-la a qualquer momento.
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo do cancelamento (opcional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Nos ajude a melhorar contando o motivo..."
          />
        </div>
        <div className="flex space-x-3">
          <Button onClick={onConfirm} className="flex-1">
            Confirmar Cancelamento
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex-1">
            Manter Assinatura
          </Button>
        </div>
      </div>
    </div>
  )
}

// Pause Modal Component
function PauseModal({ onConfirm, onCancel, reason, onReasonChange }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pausar Assinatura</h3>
        <p className="text-gray-600 mb-4">
          Você pode pausar sua assinatura temporariamente. As entregas serão suspensas, mas você poderá reativá-la quando quiser.
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo da pausa (opcional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Por que você precisa pausar sua assinatura?"
          />
        </div>
        <div className="flex space-x-3">
          <Button onClick={onConfirm} className="flex-1">
            Pausar Assinatura
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex-1">
            Continuar Ativa
          </Button>
        </div>
      </div>
    </div>
  )
}

// Plan Change Modal Component
function PlanChangeModal({ currentPlan, onConfirm, onCancel, newPlan, onNewPlanChange, reason, onReasonChange }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alterar Plano</h3>
        <p className="text-gray-600 mb-4">
          Escolha seu novo plano. A alteração será efetivada na próxima data de cobrança.
        </p>

        <div className="space-y-3 mb-4">
          <label className="flex items-center p-3 border rounded-lg cursor-pointer">
            <input
              type="radio"
              value="monthly"
              checked={newPlan === 'monthly'}
              onChange={(e) => onNewPlanChange(e.target.value)}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="font-medium">💳 Plano Mensal</div>
              <div className="text-sm text-gray-600">Flexibilidade sem compromisso</div>
            </div>
          </label>

          <label className="flex items-center p-3 border rounded-lg cursor-pointer">
            <input
              type="radio"
              value="annual"
              checked={newPlan === 'annual'}
              onChange={(e) => onNewPlanChange(e.target.value)}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="font-medium">💎 Plano Anual</div>
              <div className="text-sm text-gray-600">Economia máxima com benefícios</div>
            </div>
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo da alteração (opcional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Por que você está alterando seu plano?"
          />
        </div>

        <div className="flex space-x-3">
          <Button onClick={onConfirm} className="flex-1" disabled={newPlan === currentPlan}>
            Alterar Plano
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex-1">
            Manter Plano Atual
          </Button>
        </div>
      </div>
    </div>
  )
}