'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import StripeFallback from '@/components/ui/stripe-fallback'
import { CreditCard, Smartphone, QrCode, AlertCircle } from 'lucide-react'

interface PaymentMethodSelectorProps {
  planId: string
  planName: string
  amount: number
  customerEmail: string
  onAsaasPayment?: () => void
  className?: string
}

type PaymentMethod = 'asaas' | 'stripe'

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  planId,
  planName,
  amount,
  customerEmail,
  onAsaasPayment,
  className
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('asaas')
  const [showStripeFallback, setShowStripeFallback] = useState(false)

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setShowStripeFallback(method === 'stripe')
  }

  const handleAsaasPayment = () => {
    if (onAsaasPayment) {
      onAsaasPayment()
    }
  }

  return (
    <div className={className}>
      {/* Payment Method Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Escolha a forma de pagamento</h3>

        <div className="space-y-3">
          {/* Asaas - Primary Option */}
          <button
            onClick={() => handlePaymentMethodChange('asaas')}
            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedMethod === 'asaas'
                ? 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-200'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedMethod === 'asaas' ? 'bg-cyan-600' : 'bg-gray-100'
                }`}>
                  <Smartphone className={`w-5 h-5 ${
                    selectedMethod === 'asaas' ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Asaas (Recomendado)</div>
                  <div className="text-sm text-gray-500">PIX, Boleto ou Cartão de Crédito</div>
                </div>
              </div>
              {selectedMethod === 'asaas' && (
                <div className="text-cyan-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Stripe - Fallback Option */}
          <button
            onClick={() => handlePaymentMethodChange('stripe')}
            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedMethod === 'stripe'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedMethod === 'stripe' ? 'bg-blue-600' : 'bg-gray-100'
                }`}>
                  <CreditCard className={`w-5 h-5 ${
                    selectedMethod === 'stripe' ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Stripe Internacional</div>
                  <div className="text-sm text-gray-500">Cartão de Crédito (alternativa)</div>
                </div>
              </div>
              {selectedMethod === 'stripe' && (
                <div className="text-blue-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Plano selecionado:</span>
          <span className="font-medium text-gray-900">{planName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">Valor total:</span>
          <span className="text-lg font-bold text-cyan-600">{formatPrice(amount)}</span>
        </div>
      </div>

      {/* Payment Method Content */}
      {selectedMethod === 'asaas' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex gap-3">
              <QrCode className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 mb-1">Pagamento via Asaas</h4>
                <p className="text-sm text-green-700">
                  Pague com PIX para aprovação imediata, boleto bancário ou cartão de crédito.
                  Processamento seguro e confiável.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleAsaasPayment}
            size="lg"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
          >
            Continuar com Asaas
          </Button>
        </div>
      )}

      {selectedMethod === 'stripe' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Pagamento via Stripe</h4>
                <p className="text-sm text-blue-700">
                  Pagamento internacional via cartão de crédito. Opção alternativa
                  caso tenha problemas com o Asaas.
                </p>
              </div>
            </div>
          </div>

          <StripeFallback
            planId={planId}
            customerEmail={customerEmail}
            className="w-full"
          />
        </div>
      )}

      {/* Trust Badges */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Pagamento Seguro</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100 4h2a1 1 0 100 2 2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
            </svg>
            <span>Dados Protegidos</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Suporte 24/7</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentMethodSelector