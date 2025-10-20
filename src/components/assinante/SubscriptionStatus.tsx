'use client'
import { Package, Calendar, RefreshCcw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDateLong } from '@/lib/formatters'
import { getSubscriptionStatusColor, getSubscriptionStatusLabel, type SubscriptionStatus } from '@/lib/subscription-helpers'
interface SubscriptionStatusCardProps {
  status: SubscriptionStatus
  planName: string
  price: number
  billingCycle: 'monthly' | 'yearly'
  nextBillingDate: string
  onRefresh?: () => void
  onReactivate?: () => void
}
export default function SubscriptionStatusCard({
  status,
  planName,
  price,
  billingCycle,
  nextBillingDate,
  onRefresh,
  onReactivate
}: SubscriptionStatusCardProps) {
  const billingCycleLabel = billingCycle === 'monthly' ? 'mensal' : 'anual'
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Package className="h-5 w-5 text-cyan-600" />
          Status da Assinatura
        </h3>
        <span className={`px-3 py-1 text-xs rounded-full font-medium ${getSubscriptionStatusColor(status)}`}>
          {getSubscriptionStatusLabel(status)}
        </span>
      </div>
      {/* Status Messages */}
      {status === 'pending' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Pagamento em processamento</p>
            <p className="text-xs text-blue-700 mt-1">
              Seu pagamento está sendo processado. Você receberá uma confirmação em breve.
            </p>
          </div>
        </div>
      )}
      {status === 'cancelled' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Assinatura cancelada</p>
            <p className="text-xs text-red-700 mt-1">
              Sua assinatura foi cancelada. Você pode reativá-la a qualquer momento.
            </p>
          </div>
        </div>
      )}
      {status === 'paused' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Assinatura pausada</p>
            <p className="text-xs text-yellow-700 mt-1">
              Sua assinatura está temporariamente pausada. Reative quando desejar retomar.
            </p>
          </div>
        </div>
      )}
      {/* Subscription Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Plano:</span>
          <span className="font-medium">{planName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Valor {billingCycleLabel}:</span>
          <span className="font-bold text-cyan-600 text-lg">
            {formatCurrency(price)}
          </span>
        </div>
        {status === 'active' && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Próxima cobrança:</span>
            <span className="font-medium flex items-center gap-1">
              <Calendar className="h-4 w-4 text-gray-400" />
              {formatDateLong(nextBillingDate)}
            </span>
          </div>
        )}
        {/* Actions */}
        <div className="pt-3 border-t flex gap-2">
          {status === 'active' && onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="flex-1"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          )}
          {(status === 'cancelled' || status === 'paused') && onReactivate && (
            <Button
              size="sm"
              onClick={onReactivate}
              className="flex-1"
            >
              Reativar Assinatura
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}