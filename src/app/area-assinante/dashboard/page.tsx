/**
 * Subscriber Dashboard Page
 * Main dashboard for subscribers to manage their subscription
 *
 * @author Dr. Philipe Saraiva Cruz
 * @date 2025-10-25 (refactored for better maintainability)
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { useSubscriptionMutations } from '@/hooks/useSubscriptionMutations'
import { useModals } from '@/hooks/useModals'
import { DashboardHeader } from '@/components/assinante/DashboardHeader'
import { AccessibleDashboard } from '@/components/assinante/AccessibleDashboard'
import { ToastContainer, useToast } from '@/components/assinante/ToastFeedback'
import { DashboardLoading } from '@/components/assinante/DashboardLoading'
import { DashboardError } from '@/components/assinante/DashboardError'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { PrescriptionManager } from '@/components/assinante/PrescriptionManager'
import { PaymentHistoryTable } from '@/components/assinante/PaymentHistoryTable'
import { DeliveryPreferences } from '@/components/assinante/DeliveryPreferences'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, ClipboardList, Receipt, Truck } from 'lucide-react'
import { motion } from 'framer-motion'
import { OrdersModal } from '@/components/assinante/OrdersModal'
import { InvoicesModal } from '@/components/assinante/InvoicesModal'
import { ChangePlanModal } from '@/components/assinante/ChangePlanModal'
import { UpdateAddressModal } from '@/components/assinante/UpdateAddressModal'
import { UpdatePaymentModal } from '@/components/assinante/UpdatePaymentModal'

// Modal names type-safe definition
const MODAL_NAMES = ['orders', 'invoices', 'changePlan', 'updateAddress', 'updatePayment'] as const

function DashboardContent() {
  const router = useRouter()
  const { user: authUser, loading: authLoading, signOut } = useAuth()
  const { subscription, user, loading: subLoading, error, refetch } = useSubscription()
  const { toasts, removeToast } = useToast()

  // Custom hooks for cleaner state management
  const { close, isOpen } = useModals(MODAL_NAMES)
  const { updatePlan, updateAddress, updatePayment, isLoading: isMutating } = useSubscriptionMutations({
    authUser,
    onSuccess: refetch
  })

  // Available pricing plans
  const [availablePlans, setAvailablePlans] = useState<unknown[]>([])

  // Load pricing plans on mount
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/area-assinante/login')
    }
  }, [authUser, authLoading, router])

  // Loading state
  if (authLoading || subLoading) {
    return <DashboardLoading />
  }

  // Not authenticated
  if (!authUser) {
    return null
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <DashboardError message={error} onRetry={refetch} />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50">
        {/* Header */}
        <DashboardHeader
          userName={user?.name || authUser.displayName}
          onSignOut={signOut}
        />

        {/* Main Content with Tabs */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Visão Geral</span>
                <span className="sm:hidden">Geral</span>
              </TabsTrigger>
              <TabsTrigger value="prescription" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Prescrição</span>
                <span className="sm:hidden">Receita</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">Pagamentos</span>
                <span className="sm:hidden">Pagar</span>
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <span className="hidden sm:inline">Entrega</span>
                <span className="sm:hidden">Local</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <AccessibleDashboard />
            </TabsContent>

            {/* Prescription Tab */}
            <TabsContent value="prescription" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PrescriptionManager />
              </motion.div>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PaymentHistoryTable />
              </motion.div>
            </TabsContent>

            {/* Delivery Tab */}
            <TabsContent value="delivery" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DeliveryPreferences />
              </motion.div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Global Loading Overlay */}
      <LoadingOverlay isLoading={isMutating} message="Processando..." />

      {/* Modals - Only rendered when needed (lazy loaded) */}
      {isOpen('orders') && (
        <OrdersModal
          isOpen={true}
          onClose={() => close('orders')}
        />
      )}

      {isOpen('invoices') && (
        <InvoicesModal
          isOpen={true}
          onClose={() => close('invoices')}
        />
      )}

      {subscription && isOpen('changePlan') && (
        <ChangePlanModal
          isOpen={true}
          onClose={() => close('changePlan')}
          currentPlan={{
            id: subscription.plan.id,
            name: subscription.plan.name,
            price: subscription.plan.price
          }}
          availablePlans={availablePlans}
          onPlanChange={updatePlan}
        />
      )}

      {subscription && isOpen('updateAddress') && (
        <UpdateAddressModal
          isOpen={true}
          onClose={() => close('updateAddress')}
          currentAddress={subscription.shippingAddress}
          onAddressUpdate={updateAddress}
        />
      )}

      {subscription && isOpen('updatePayment') && (
        <UpdatePaymentModal
          isOpen={true}
          onClose={() => close('updatePayment')}
          currentPaymentMethod={{
            type: subscription.paymentMethod as 'credit_card' | 'pix' | 'boleto',
            last4: subscription.paymentMethodLast4
          }}
          onPaymentUpdate={updatePayment}
        />
      )}
    </>
  )
}

/**
 * Main Dashboard Page Component
 * Wraps DashboardContent with error boundary
 */
export default function DashboardPage() {
  return <DashboardContent />
}

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'
