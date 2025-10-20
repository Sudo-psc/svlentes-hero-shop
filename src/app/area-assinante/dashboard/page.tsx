'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { useResilientSubscription } from '@/hooks/useResilientSubscription'
import { ResilientDashboardWrapper } from '@/components/assinante/ResilientDashboardWrapper'
import { AccessibleDashboard } from '@/components/assinante/AccessibleDashboard'
import { ToastContainer } from '@/components/assinante/ToastFeedback'
import { DashboardLoading } from '@/components/assinante/DashboardLoading'
import { DashboardError } from '@/components/assinante/DashboardError'
import { OrdersModal } from '@/components/assinante/OrdersModal'
import { InvoicesModal } from '@/components/assinante/InvoicesModal'
import { ChangePlanModal } from '@/components/assinante/ChangePlanModal'
import { UpdateAddressModal } from '@/components/assinante/UpdateAddressModal'
import { UpdatePaymentModal } from '@/components/assinante/UpdatePaymentModal'
import { SubscriptionHistoryTimeline } from '@/components/assinante/SubscriptionHistoryTimeline'
import { EmergencyContact } from '@/components/assinante/EmergencyContact'
import { formatDate, formatCurrency } from '@/lib/formatters'
import { getSubscriptionStatusColor, getSubscriptionStatusLabel } from '@/lib/subscription-helpers'
import { motion } from 'framer-motion'
import { useToast } from '@/components/assinante/ToastFeedback'
import { Button } from '@/components/ui/button'
import { Package, Calendar, CreditCard, MapPin, Edit, RefreshCcw, FileText, Settings } from 'lucide-react'
function DashboardContent() {
  const router = useRouter()
  const { user: authUser, loading: authLoading, signOut } = useAuth()
  const { subscription, user, loading: subLoading, error, refetch } = useResilientSubscription()
  const { toasts, removeToast } = useToast()
  // Modal states
  const [showOrdersModal, setShowOrdersModal] = useState(false)
  const [showInvoicesModal, setShowInvoicesModal] = useState(false)
  const [showChangePlanModal, setShowChangePlanModal] = useState(false)
  const [showUpdateAddressModal, setShowUpdateAddressModal] = useState(false)
  const [showUpdatePaymentModal, setShowUpdatePaymentModal] = useState(false)
  const [availablePlans, setAvailablePlans] = useState<any[]>([])
  // Enhanced features state
  const [useEnhancedUI, setUseEnhancedUI] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  // Load pricing plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setIsLoading(true)
        const { default: plansData } = await import('@/data/pricing-plans')
        setAvailablePlans(plansData)
      } catch (error) {
        console.error('Error loading plans:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadPlans()
  }, [])
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/area-assinante/login')
    }
  }, [authUser, authLoading, router])
  // Enhanced handler functions with better error handling
  const handlePlanChange = async (newPlanId: string) => {
    setIsLoading(true)
    try {
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
    } catch (err) {
      throw err
    } finally {
      setIsLoading(false)
    }
  }
  const handleAddressUpdate = async (addressData: any) => {
    setIsLoading(true)
    try {
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
    } catch (err) {
      throw err
    } finally {
      setIsLoading(false)
    }
  }
  const handlePaymentUpdate = async (paymentData: any) => {
    setIsLoading(true)
    try {
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
    } catch (err) {
      throw err
    } finally {
      setIsLoading(false)
    }
  }
  // Toggle enhanced UI for fallback
  const toggleEnhancedUI = () => {
    setUseEnhancedUI(!useEnhancedUI)
  }
  if (authLoading || subLoading) {
    return <DashboardLoading />
  }
  if (!authUser) {
    return null
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <DashboardError
            message={error}
            onRetry={refetch}
          />
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={toggleEnhancedUI}
              className="text-sm"
            >
              {useEnhancedUI ? 'Usar Interface Simplificada' : 'Usar Interface Avançada'}
            </Button>
          </div>
        </div>
      </div>
    )
  }
  // Use Enhanced Dashboard when available, fallback to original
  if (useEnhancedUI) {
    return (
      <>
        <AccessibleDashboard />
        {/* Toast Notifications */}
        <ToastContainer
          toasts={toasts}
          onRemove={removeToast}
        />
        {/* Global Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Processando...</p>
            </div>
          </div>
        )}
        {/* Debug Toggle */}
        <div className="fixed bottom-4 left-4 z-40">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleEnhancedUI}
            className="text-xs opacity-50 hover:opacity-100"
          >
            Debug UI
          </Button>
        </div>
      </>
    )
  }
  // Enhanced Original Dashboard (kept as fallback)
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50">
      {/* Enhanced Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Painel do Assinante
              </h1>
              <p className="text-sm text-gray-600">
                Gerencie sua assinatura de lentes de contato
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleEnhancedUI}
              >
                Interface Avançada
              </Button>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo(a), {user?.name || authUser.displayName}!
          </h2>
          <p className="text-lg text-gray-600">
            Aqui você pode acompanhar sua assinatura de lentes de contato e gerenciar seus dados.
          </p>
        </motion.div>
        {/* No Subscription State */}
        {!subscription && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-8 rounded-xl shadow-sm border text-center"
          >
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Você ainda não possui uma assinatura ativa
            </h3>
            <p className="text-gray-600 mb-6">
              Comece agora a economizar com o plano de lentes de contato ideal para você!
            </p>
            <Button onClick={() => router.push('/assinar')} size="lg">
              Ver Planos Disponíveis
            </Button>
          </motion.div>
        )}
        {/* Dashboard with Subscription */}
        {subscription && (
          <>
            {/* Enhanced Subscription Status Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="h-5 w-5 text-cyan-600" />
                    Status da Assinatura
                  </h3>
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${getSubscriptionStatusColor(subscription.status)}`}>
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
                    <span className="font-bold text-cyan-600 text-lg">
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
                      disabled={isLoading}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Mudar Plano
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refetch}
                      className="w-full"
                      disabled={isLoading}
                    >
                      <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      Atualizar
                    </Button>
                  </div>
                </div>
              </motion.div>
              {/* Payment & Delivery Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"
              >
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
                      disabled={isLoading}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pagamento
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUpdateAddressModal(true)}
                      className="w-full"
                      disabled={isLoading}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Endereço
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
            {/* Enhanced Benefits Section */}
            {subscription.benefits && subscription.benefits.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-xl shadow-sm border mb-8"
              >
                <h3 className="font-semibold text-gray-900 mb-4">Benefícios da Assinatura</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subscription.benefits.map((benefit, index) => (
                    <motion.div
                      key={benefit.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
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
                                <span>{Math.round(((benefit.quantityUsed || 0) / benefit.quantityTotal) * 100)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <motion.div
                                  className="bg-cyan-600 h-2 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${((benefit.quantityUsed || 0) / benefit.quantityTotal) * 100}%`
                                  }}
                                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
            {/* Enhanced Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4 mb-8"
            >
              <Button onClick={() => setShowOrdersModal(true)} size="lg">
                <Package className="h-4 w-4 mr-2" />
                Ver Histórico de Pedidos
              </Button>
              <Button variant="outline" onClick={() => setShowInvoicesModal(true)} size="lg">
                <FileText className="h-4 w-4 mr-2" />
                Baixar Fatura
              </Button>
              <Button variant="outline" onClick={() => router.push('/area-assinante/configuracoes')} size="lg">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </motion.div>
            {/* Subscription History Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white p-6 rounded-xl shadow-sm border mb-8"
            >
              <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <RefreshCcw className="h-5 w-5 text-cyan-600" />
                Histórico de Alterações
              </h3>
              <SubscriptionHistoryTimeline userId={authUser.uid} />
            </motion.div>
          </>
        )}
        {/* Enhanced Emergency Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white p-6 rounded-xl shadow-sm border"
        >
          <EmergencyContact />
        </motion.div>
      </main>
      {/* Enhanced Modals */}
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
      {/* Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Processando...</p>
          </div>
        </div>
      )}
    </div>
  )
}
// Wrapper principal com sistema resiliente
export default function DashboardPage() {
  return (
    <ResilientDashboardWrapper>
      <DashboardContent />
    </ResilientDashboardWrapper>
  )
}
// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'
