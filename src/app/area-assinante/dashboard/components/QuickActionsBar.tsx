/**
 * Quick Actions Bar Component
 *
 * Action buttons for common dashboard tasks
 * (orders, invoices, settings)
 *
 * @author Dr. Philipe Saraiva Cruz
 */

'use client'

import { motion } from 'framer-motion'
import { Package, FileText, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuickActionsBarProps {
  onViewOrders: () => void
  onViewInvoices: () => void
  onViewSettings: () => void
}

/**
 * Bar with quick action buttons
 *
 * Features:
 * - Orders history button
 * - Invoices download button
 * - Settings navigation button
 * - Responsive layout
 * - Animated entrance
 *
 * @example
 * <QuickActionsBar
 *   onViewOrders={() => setShowOrdersModal(true)}
 *   onViewInvoices={() => setShowInvoicesModal(true)}
 *   onViewSettings={() => router.push('/area-assinante/configuracoes')}
 * />
 */
export function QuickActionsBar({
  onViewOrders,
  onViewInvoices,
  onViewSettings
}: QuickActionsBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex flex-wrap gap-4 mb-8"
    >
      <Button onClick={onViewOrders} size="lg">
        <Package className="h-4 w-4 mr-2" />
        Ver Histórico de Pedidos
      </Button>
      <Button variant="outline" onClick={onViewInvoices} size="lg">
        <FileText className="h-4 w-4 mr-2" />
        Baixar Fatura
      </Button>
      <Button variant="outline" onClick={onViewSettings} size="lg">
        <Settings className="h-4 w-4 mr-2" />
        Configurações
      </Button>
    </motion.div>
  )
}
