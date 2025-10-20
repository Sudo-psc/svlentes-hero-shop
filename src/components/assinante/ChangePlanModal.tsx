'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { X, Check, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import type { PricingPlan } from '@/types'
interface ChangePlanModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: {
    id: string
    name: string
    price: number
  }
  availablePlans: PricingPlan[]
  onPlanChange: (newPlanId: string) => Promise<void>
}
export function ChangePlanModal({
  isOpen,
  onClose,
  currentPlan,
  availablePlans,
  onPlanChange
}: ChangePlanModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(currentPlan.id)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const handleConfirm = async () => {
    if (selectedPlanId === currentPlan.id) {
      setError('Você já está no plano selecionado')
      return
    }
    try {
      setLoading(true)
      setError(null)
      await onPlanChange(selectedPlanId)
      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar plano')
    } finally {
      setLoading(false)
    }
  }
  const selectedPlan = availablePlans.find(p => p.id === selectedPlanId)
  const priceDifference = selectedPlan
    ? selectedPlan.priceMonthly - currentPlan.price
    : 0
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Alterar Plano</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <Check className="h-5 w-5" />
              <p className="font-medium">Plano alterado com sucesso!</p>
            </div>
          </div>
        )}
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}
        {/* Current Plan */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Plano atual:</p>
          <p className="font-bold text-gray-900">{currentPlan.name}</p>
          <p className="text-cyan-600 font-bold">{formatCurrency(currentPlan.price)}/mês</p>
        </div>
        {/* Available Plans */}
        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-gray-700">Escolha seu novo plano:</p>
          {availablePlans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`
                p-4 border-2 rounded-lg cursor-pointer transition-all
                ${selectedPlanId === plan.id
                  ? 'border-cyan-600 bg-cyan-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
                ${plan.id === currentPlan.id ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                    {plan.badge && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                        {plan.badge}
                      </span>
                    )}
                    {plan.id === currentPlan.id && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                        Atual
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                  <div className="mt-2">
                    <span className="text-lg font-bold text-cyan-600">
                      {formatCurrency(plan.priceMonthly)}/mês
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <div className={`
                    h-5 w-5 rounded-full border-2 flex items-center justify-center
                    ${selectedPlanId === plan.id
                      ? 'border-cyan-600 bg-cyan-600'
                      : 'border-gray-300'
                    }
                  `}>
                    {selectedPlanId === plan.id && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Price Difference */}
        {selectedPlanId !== currentPlan.id && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                Diferença mensal:
              </span>
              <span className={`text-lg font-bold ${
                priceDifference > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {priceDifference > 0 ? '+' : ''}{formatCurrency(Math.abs(priceDifference))}
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              {priceDifference > 0
                ? 'A diferença será cobrada de forma proporcional na próxima fatura.'
                : 'O crédito será aplicado proporcionalmente nas próximas faturas.'
              }
            </p>
          </div>
        )}
        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || selectedPlanId === currentPlan.id}
            className="flex-1"
          >
            {loading ? 'Alterando...' : 'Confirmar Alteração'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}