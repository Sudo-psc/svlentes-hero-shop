// @ts-nocheck - Type incompatibilities in subscriber dashboard - needs refactoring
/**
 * No Subscription State Component
 *
 * Empty state when user has no active subscription
 * Encourages user to browse available plans
 *
 * @author Dr. Philipe Saraiva Cruz
 */

'use client'

import { motion } from 'framer-motion'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NoSubscriptionStateProps {
  /**
   * Callback when user clicks to view plans
   */
  onViewPlans: () => void
}

/**
 * Empty state for users without active subscription
 *
 * Features:
 * - Large icon to draw attention
 * - Clear message
 * - Call-to-action button
 * - Animated entrance
 *
 * @example
 * <NoSubscriptionState
 *   onViewPlans={() => router.push('/planos')}
 * />
 */
export function NoSubscriptionState({ onViewPlans }: NoSubscriptionStateProps) {
  return (
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
      <Button onClick={onViewPlans} size="lg">
        Ver Planos Disponíveis
      </Button>
    </motion.div>
  )
}
