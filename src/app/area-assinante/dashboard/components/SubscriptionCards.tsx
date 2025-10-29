// @ts-nocheck - Type mismatch with SubscriptionStatus enum - needs type fixing
/**
 * Subscription Cards Component
 *
 * Displays subscription status and payment/delivery information
 * in two side-by-side cards
 *
 * @author Dr. Philipe Saraiva Cruz
 */

'use client'

import { motion } from 'framer-motion'
import { Package, Calendar, CreditCard, MapPin, Edit, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate, formatCurrency } from '@/lib/formatters'
import { getSubscriptionStatusColor, getSubscriptionStatusLabel } from '@/lib/subscription-helpers'

interface Subscription {
  status: string
  plan: {
    name: string
    price: number
  }
  nextBillingDate: string
  paymentMethod?: string
  paymentMethodLast4?: string
  shippingAddress?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
}

interface SubscriptionCardsProps {
  subscription: Subscription
  isLoading: boolean
  onChangePlan: () => void
  onUpdatePayment: () => void
  onUpdateAddress: () => void
  onRefresh: () => void
}

/**
 * Two-card layout showing subscription and payment info
 *
 * Features:
 * - Subscription status card with plan details
 * - Payment and delivery card with address
 * - Action buttons for editing
 * - Responsive grid layout
 * - Loading states
 *
 * @example
 * <SubscriptionCards
 *   subscription={subscription}
 *   isLoading={false}
 *   onChangePlan={() => setShowChangePlanModal(true)}
 *   onUpdatePayment={() => setShowUpdatePaymentModal(true)}
 *   onUpdateAddress={() => setShowUpdateAddressModal(true)}
 *   onRefresh={refetch}
 * />
 */
export function SubscriptionCards({
  subscription,
  isLoading,
  onChangePlan,
  onUpdatePayment,
  onUpdateAddress,
  onRefresh
}: SubscriptionCardsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      {/* Subscription Status Card */}
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
              onClick={onChangePlan}
              className="w-full"
              disabled={isLoading}
            >
              <Edit className="h-4 w-4 mr-2" />
              Mudar Plano
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="w-full"
              disabled={isLoading}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Payment & Delivery Card */}
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
              onClick={onUpdatePayment}
              className="w-full"
              disabled={isLoading}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Pagamento
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onUpdateAddress}
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
  )
}
