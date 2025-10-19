'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  Calendar,
  CreditCard,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Zap,
  Shield,
  Star,
  Edit,
  RefreshCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDateLong, formatRelativeTime } from '@/lib/formatters'
import { getSubscriptionStatusColor, getSubscriptionStatusLabel, type SubscriptionStatus } from '@/lib/subscription-helpers'
import { cn } from '@/lib/utils'

interface EnhancedSubscriptionCardProps {
  status: SubscriptionStatus
  planName: string
  price: number
  billingCycle: 'monthly' | 'yearly'
  nextBillingDate?: string
  paymentMethod?: string
  paymentMethodLast4?: string
  shippingAddress?: any
  benefits?: any[]
  onRefresh?: () => void
  onEditPlan?: () => void
  onEditPayment?: () => void
  onEditAddress?: () => void
  onReactivate?: () => void
  isLoading?: boolean
}

export function EnhancedSubscriptionCard({
  status,
  planName,
  price,
  billingCycle,
  nextBillingDate,
  paymentMethod,
  paymentMethodLast4,
  shippingAddress,
  benefits = [],
  onRefresh,
  onEditPlan,
  onEditPayment,
  onEditAddress,
  onReactivate,
  isLoading = false
}: EnhancedSubscriptionCardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [timeUntilBilling, setTimeUntilBilling] = useState<string>('')

  useEffect(() => {
    if (nextBillingDate && status === 'active') {
      const updateTime = () => {
        const now = new Date()
        const billing = new Date(nextBillingDate)
        const diff = billing.getTime() - now.getTime()

        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24))
          if (days > 0) {
            setTimeUntilBilling(`${days} dia${days !== 1 ? 's' : ''}`)
          } else {
            const hours = Math.floor(diff / (1000 * 60 * 60))
            setTimeUntilBilling(`${hours} hora${hours !== 1 ? 's' : ''}`)
          }
        } else {
          setTimeUntilBilling('Hoje')
        }
      }

      updateTime()
      const interval = setInterval(updateTime, 60000) // Update every minute
      return () => clearInterval(interval)
    }
  }, [nextBillingDate, status])

  const billingCycleLabel = billingCycle === 'monthly' ? 'mês' : 'ano'
  const isActive = status === 'active'

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    }
  }

  const statusIcon = {
    active: <CheckCircle className="h-5 w-5 text-green-600" />,
    pending: <Clock className="h-5 w-5 text-yellow-600" />,
    cancelled: <AlertCircle className="h-5 w-5 text-red-600" />,
    paused: <AlertCircle className="h-5 w-5 text-yellow-600" />
  }

  const planFeatures = [
    { icon: <Zap className="h-4 w-4" />, label: 'Entrega Rápida', available: true },
    { icon: <Shield className="h-4 w-4" />, label: 'Garantia Estendida', available: true },
    { icon: <Star className="h-4 w-4" />, label: 'Suporte Prioritário', available: isActive },
    { icon: <TrendingUp className="h-4 w-4" />, label: 'Economia Mensal', available: true }
  ]

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isActive ? [0, 360] : 0 }}
              transition={{ duration: 2, ease: 'linear', repeat: isActive ? Infinity : 0 }}
            >
              {statusIcon[status]}
            </motion.div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Status da Assinatura</h3>
              <p className="text-sm text-gray-600">
                {planName} • {billingCycle === 'monthly' ? 'Mensal' : 'Anual'}
              </p>
            </div>
          </div>
          <motion.div
            className={cn(
              'px-3 py-1 text-xs rounded-full font-medium',
              getSubscriptionStatusColor(status)
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {getSubscriptionStatusLabel(status)}
          </motion.div>
        </div>

        {/* Price Display */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-cyan-600">
            {formatCurrency(price)}
          </span>
          <span className="text-gray-500">/{billingCycleLabel}</span>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-auto text-sm text-gray-600"
            >
              Próxima cobrança: {timeUntilBilling}
            </motion.div>
          )}
        </div>
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {status === 'pending' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 py-4 bg-blue-50 border-b border-blue-200"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Pagamento em processamento</p>
                <p className="text-xs text-blue-700 mt-1">
                  Seu pagamento está sendo processado. Você receberá uma confirmação em breve.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {status === 'cancelled' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 py-4 bg-red-50 border-b border-red-200"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Assinatura cancelada</p>
                <p className="text-xs text-red-700 mt-1">
                  Sua assinatura foi cancelada. Você pode reativá-la a qualquer momento.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {status === 'paused' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 py-4 bg-yellow-50 border-b border-yellow-200"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Assinatura pausada</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Sua assinatura está temporariamente pausada. Reative quando desejar retomar.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Next Billing Date */}
        {isActive && nextBillingDate && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Próxima cobrança</p>
                <p className="text-xs text-gray-600">{formatDateLong(nextBillingDate)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-cyan-600">{formatCurrency(price)}</p>
              <p className="text-xs text-gray-500">em {timeUntilBilling}</p>
            </div>
          </div>
        )}

        {/* Payment Method */}
        {paymentMethod && (
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === 'payment' ? null : 'payment')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">Forma de Pagamento</p>
                  <p className="text-xs text-gray-600 capitalize">
                    {paymentMethod}
                    {paymentMethodLast4 && ` •••• ${paymentMethodLast4}`}
                  </p>
                </div>
              </div>
              <Edit className="h-4 w-4 text-gray-400" />
            </button>

            <AnimatePresence>
              {expandedSection === 'payment' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEditPayment}
                    className="w-full"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Alterar Forma de Pagamento
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Shipping Address */}
        {shippingAddress && (
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === 'address' ? null : 'address')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">Endereço de Entrega</p>
                  <p className="text-xs text-gray-600 line-clamp-1">
                    {shippingAddress.street}, {shippingAddress.number} - {shippingAddress.city}
                  </p>
                </div>
              </div>
              <Edit className="h-4 w-4 text-gray-400" />
            </button>

            <AnimatePresence>
              {expandedSection === 'address' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 p-4 bg-gray-50 rounded-lg text-sm text-gray-600"
                >
                  <p>{shippingAddress.street}, {shippingAddress.number}</p>
                  {shippingAddress.complement && <p>{shippingAddress.complement}</p>}
                  <p>{shippingAddress.neighborhood} - {shippingAddress.city}/{shippingAddress.state}</p>
                  <p>CEP: {shippingAddress.zipCode}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEditAddress}
                    className="w-full mt-3"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Alterar Endereço
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Plan Features */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Benefícios do Plano</h4>
          <div className="grid grid-cols-2 gap-3">
            {planFeatures.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border',
                  feature.available
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                )}
              >
                {feature.icon}
                <span className="text-xs font-medium">{feature.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          {isActive && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onEditPlan}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Mudar Plano
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="flex-1"
              >
                <RefreshCcw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                Atualizar
              </Button>
            </>
          )}

          {(status === 'cancelled' || status === 'paused') && onReactivate && (
            <Button
              size="sm"
              onClick={onReactivate}
              className="w-full"
            >
              Reativar Assinatura
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}