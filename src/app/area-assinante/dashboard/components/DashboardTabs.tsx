/**
 * Dashboard Tabs Component
 *
 * Tab navigation for different dashboard sections
 * Includes animations and responsive design
 *
 * @author Dr. Philipe Saraiva Cruz
 */

'use client'

import { motion } from 'framer-motion'
import { Settings, ClipboardList, Receipt, Truck } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AccessibleDashboard } from '@/components/assinante/AccessibleDashboard'
import { PrescriptionManager } from '@/components/assinante/PrescriptionManager'
import { PaymentHistoryTable } from '@/components/assinante/PaymentHistoryTable'
import { DeliveryPreferences } from '@/components/assinante/DeliveryPreferences'

/**
 * Animation variants for tab content
 */
const tabContentVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
}

/**
 * Tab navigation component with 4 main sections
 *
 * Sections:
 * - Overview: Main dashboard with subscription details
 * - Prescription: Upload and manage medical prescriptions
 * - Payments: Payment history and invoices
 * - Delivery: Address and delivery preferences
 *
 * Features:
 * - Responsive labels (shortened on mobile)
 * - Smooth transitions with Framer Motion
 * - Icon-based navigation
 * - WCAG 2.1 AA accessible
 *
 * @example
 * <DashboardTabs />
 */
export function DashboardTabs() {
  return (
    <Tabs defaultValue="overview" className="w-full">
      {/* Tab Navigation */}
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
        <motion.div {...tabContentVariants}>
          <PrescriptionManager />
        </motion.div>
      </TabsContent>

      {/* Payments Tab */}
      <TabsContent value="payments" className="mt-6">
        <motion.div {...tabContentVariants}>
          <PaymentHistoryTable />
        </motion.div>
      </TabsContent>

      {/* Delivery Tab */}
      <TabsContent value="delivery" className="mt-6">
        <motion.div {...tabContentVariants}>
          <DeliveryPreferences />
        </motion.div>
      </TabsContent>
    </Tabs>
  )
}
