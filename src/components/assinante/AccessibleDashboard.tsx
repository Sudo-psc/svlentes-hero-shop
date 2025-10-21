'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { useDashboardActions } from '@/hooks/useDashboardActions'
import { useToast } from '@/components/assinante/ToastFeedback'
import { createQuickActions } from '@/components/assinante/QuickActions'
import { EnhancedSubscriptionCard } from '@/components/assinante/EnhancedSubscriptionCard'
import { DashboardLoading } from '@/components/assinante/DashboardLoading'
import { DashboardError } from '@/components/assinante/DashboardError'
import { OrdersModal } from '@/components/assinante/OrdersModal'
import { InvoicesModal } from '@/components/assinante/InvoicesModal'
import { ChangePlanModal } from '@/components/assinante/ChangePlanModal'
import { UpdateAddressModal } from '@/components/assinante/UpdateAddressModal'
import { UpdatePaymentModal } from '@/components/assinante/UpdatePaymentModal'
import { SubscriptionHistoryTimeline } from '@/components/assinante/SubscriptionHistoryTimeline'
import { EmergencyContact } from '@/components/assinante/EmergencyContact'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, AlertTriangle, Settings, Accessibility, Volume2, VolumeX } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
interface AccessibleDashboardProps {
  className?: string
}
export function AccessibleDashboard({ className }: AccessibleDashboardProps) {
  const router = useRouter()
  const { user: authUser, loading: authLoading, signOut } = useAuth()
  const { subscription, user, loading: subLoading, error, refetch } = useSubscription()
  const dashboardActions = useDashboardActions()
  const { toasts } = useToast()
  // Modal states
  const [showOrdersModal, setShowOrdersModal] = useState(false)
  const [showInvoicesModal, setShowInvoicesModal] = useState(false)
  const [showChangePlanModal, setShowChangePlanModal] = useState(false)
  const [showUpdateAddressModal, setShowUpdateAddressModal] = useState(false)
  const [showUpdatePaymentModal, setShowUpdatePaymentModal] = useState(false)
  // Accessibility states
  const [highContrast, setHighContrast] = useState(false)
  const [largeText, setLargeText] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false)
  // Available plans for plan change
  const [availablePlans, setAvailablePlans] = useState<any[]>([])
  // Refs for accessibility
  const mainRef = useRef<HTMLElement>(null)
  const skipLinkRef = useRef<HTMLAnchorElement>(null)
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
  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/area-assinante/login')
    }
  }, [authUser, authLoading, router])
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + S: Skip to main content
      if (event.altKey && event.key === 's') {
        event.preventDefault()
        mainRef.current?.focus()
      }
      // Alt + A: Toggle accessibility panel
      if (event.altKey && event.key === 'a') {
        event.preventDefault()
        // Toggle accessibility panel
      }
      // Escape: Close modals
      if (event.key === 'Escape') {
        setShowOrdersModal(false)
        setShowInvoicesModal(false)
        setShowChangePlanModal(false)
        setShowUpdateAddressModal(false)
        setShowUpdatePaymentModal(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
  // Auto-refresh data
  useEffect(() => {
    if (subscription?.status === 'active') {
      const interval = setInterval(() => {
        refetch()
      }, 5 * 60 * 1000) // Refresh every 5 minutes
      return () => clearInterval(interval)
    }
  }, [subscription?.status, refetch])
  // Quick actions configuration
  const quickActions = createQuickActions({
    onOrdersClick: () => setShowOrdersModal(true),
    onInvoicesClick: () => setShowInvoicesModal(true),
    onSettingsClick: () => router.push('/area-assinante/configuracoes'),
    onScheduleClick: () => router.push('/agendar-consulta'),
    onPaymentClick: () => setShowUpdatePaymentModal(true),
    onAddressClick: () => setShowUpdateAddressModal(true),
    onSupportClick: () => dashboardActions.support.contact('whatsapp'),
    onBenefitsClick: () => setShowOrdersModal(true),
    pendingOrders: subscription?.pendingOrders || 0,
    unreadMessages: subscription?.unreadMessages || 0
  })
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
  const dashboardVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        when: 'beforeChildren',
        staggerChildren: 0.1
      }
    }
  }
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    }
  }
  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50',
      highContrast && 'high-contrast',
      largeText && 'text-lg',
      reducedMotion && 'reduce-motion',
      className
    )}>
      {/* Skip to main content link for screen readers */}
      <a
        ref={skipLinkRef}
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-cyan-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        Pular para o conteúdo principal
      </a>
      {/* Accessibility Panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-4 left-4 z-40 bg-white rounded-lg shadow-lg p-4 border"
      >
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Accessibility className="h-4 w-4" />
          Acessibilidade
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => setHighContrast(!highContrast)}
            className="w-full text-left text-xs p-2 rounded hover:bg-gray-100 flex items-center gap-2"
            aria-pressed={highContrast}
          >
            Alto Contraste
          </button>
          <button
            onClick={() => setLargeText(!largeText)}
            className="w-full text-left text-xs p-2 rounded hover:bg-gray-100 flex items-center gap-2"
            aria-pressed={largeText}
          >
            Texto Grande
          </button>
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            className="w-full text-left text-xs p-2 rounded hover:bg-gray-100 flex items-center gap-2"
            aria-pressed={reducedMotion}
          >
            Reduzir Movimento
          </button>
          <button
            onClick={() => setScreenReaderEnabled(!screenReaderEnabled)}
            className="w-full text-left text-xs p-2 rounded hover:bg-gray-100 flex items-center gap-2"
            aria-pressed={screenReaderEnabled}
          >
            {screenReaderEnabled ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            Leitor de Tela
          </button>
        </div>
      </motion.div>
      {/* Main Content */}
      <main
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-inset rounded-lg"
        role="main"
        aria-label="Painel do assinante"
      >
        <motion.div
          variants={dashboardVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Welcome Section */}
          <motion.header variants={contentVariants} className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Bem-vindo(a), {user?.name || authUser.displayName}!
                </h1>
                <p className="text-gray-600 text-lg">
                  Aqui você pode acompanhar sua assinatura de lentes de contato e gerenciar seus dados.
                </p>
                {screenReaderEnabled && (
                  <p className="text-xs text-gray-500 mt-2" role="status" aria-live="polite">
                    Área do painel do assinante carregada. Use Tab para navegar pelos elementos.
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => signOut()}
                className="hidden sm:flex items-center gap-2"
              >
                Sair
              </Button>
            </div>
          </motion.header>
          {/* No Subscription State */}
          <AnimatePresence>
            {!subscription && (
              <motion.section
                variants={contentVariants}
                className="bg-white p-8 rounded-xl shadow-sm border text-center"
                role="region"
                aria-labelledby="no-subscription-title"
              >
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 id="no-subscription-title" className="text-xl font-semibold text-gray-900 mb-2">
                  Você ainda não possui uma assinatura ativa
                </h2>
                <p className="text-gray-600 mb-6">
                  Comece agora a economizar com o plano de lentes de contato ideal para você!
                </p>
                <Button
                  onClick={() => router.push('/assinar')}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Ver Planos Disponíveis
                </Button>
              </motion.section>
            )}
          </AnimatePresence>
          {/* Dashboard with Subscription */}
          <AnimatePresence>
            {subscription && (
              <motion.div
                variants={contentVariants}
                className="space-y-8"
              >
                {/* Enhanced Subscription Card */}
                <section role="region" aria-label="Status da assinatura">
                  <EnhancedSubscriptionCard
                    status={subscription.status}
                    planName={subscription.plan.name}
                    price={subscription.plan.price}
                    billingCycle={subscription.plan.billingCycle}
                    nextBillingDate={subscription.nextBillingDate}
                    paymentMethod={subscription.paymentMethod}
                    paymentMethodLast4={subscription.paymentMethodLast4}
                    shippingAddress={subscription.shippingAddress}
                    benefits={subscription.benefits}
                    onRefresh={dashboardActions.actions.refresh}
                    onEditPlan={() => setShowChangePlanModal(true)}
                    onEditPayment={() => setShowUpdatePaymentModal(true)}
                    onEditAddress={() => setShowUpdateAddressModal(true)}
                    onReactivate={dashboardActions.actions.reactivate}
                    isLoading={dashboardActions.isUpdating}
                  />
                </section>
                {/* Quick Actions */}
                <section role="region" aria-label="Ações rápidas">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-1 w-8 bg-cyan-600 rounded-full" />
                    <h2 className="text-lg font-semibold text-gray-900">Ações Rápidas</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => (
                      <motion.div
                        key={action.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Button
                          variant={action.variant}
                          size="lg"
                          onClick={action.onClick}
                          disabled={action.isDisabled}
                          className="w-full h-auto p-4 flex flex-col items-center gap-3"
                          aria-label={action.label}
                        >
                          {action.icon}
                          <span className="text-sm font-medium">{action.label}</span>
                          {action.badge && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                              {action.badge}
                            </span>
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </section>
                {/* Subscription History Timeline */}
                <section role="region" aria-label="Histórico da assinatura">
                  <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      Histórico de Alterações
                    </h2>
                    <SubscriptionHistoryTimeline userId={authUser.uid} />
                  </div>
                </section>
                {/* Emergency Contact */}
                <section role="region" aria-label="Contatos de emergência">
                  <EmergencyContact />
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
      {/* Modals */}
      <AnimatePresence>
        {showOrdersModal && (
          <OrdersModal
            isOpen={showOrdersModal}
            onClose={() => setShowOrdersModal(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showInvoicesModal && (
          <InvoicesModal
            isOpen={showInvoicesModal}
            onClose={() => setShowInvoicesModal(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showChangePlanModal && subscription && (
          <ChangePlanModal
            isOpen={showChangePlanModal}
            onClose={() => setShowChangePlanModal(false)}
            currentPlan={{
              id: subscription.plan.id,
              name: subscription.plan.name,
              price: subscription.plan.price
            }}
            availablePlans={availablePlans}
            onPlanChange={dashboardActions.actions.changePlan}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showUpdateAddressModal && subscription && (
          <UpdateAddressModal
            isOpen={showUpdateAddressModal}
            onClose={() => setShowUpdateAddressModal(false)}
            currentAddress={subscription.shippingAddress}
            onAddressUpdate={dashboardActions.actions.updateAddress}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showUpdatePaymentModal && subscription && (
          <UpdatePaymentModal
            isOpen={showUpdatePaymentModal}
            onClose={() => setShowUpdatePaymentModal(false)}
            currentPaymentMethod={{
              type: subscription.paymentMethod as any,
              last4: subscription.paymentMethodLast4
            }}
            onPaymentUpdate={dashboardActions.actions.updatePayment}
          />
        )}
      </AnimatePresence>
      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm"
            role="alert"
            aria-live="polite"
          >
            <p className="font-medium text-sm">{toast.title}</p>
            {toast.message && <p className="text-xs text-gray-600 mt-1">{toast.message}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
// Helper function for conditional className
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
export default AccessibleDashboard