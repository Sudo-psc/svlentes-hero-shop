'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import PaymentMethodSelector from './PaymentMethodSelector'

interface PaymentTestModalProps {
  isOpen: boolean
  onClose: () => void
  planData: {
    id: string
    name: string
    price: number
  }
}

export const PaymentTestModal: React.FC<PaymentTestModalProps> = ({
  isOpen,
  onClose,
  planData
}) => {
  const [customerEmail] = useState('test@svlentes.com.br')

  const handleAsaasPayment = () => {
    // Redirect to existing checkout flow
    window.location.href = `/api/create-checkout`
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Testar Pagamento
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100 4h2a1 1 0 100 2 2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-cyan-900">{planData.name}</h3>
                <p className="text-cyan-700">Teste de integração de pagamento</p>
              </div>
            </div>
          </div>

          <PaymentMethodSelector
            planId={planData.id}
            amount={planData.price}
            planName={planData.name}
            customerEmail={customerEmail}
            onAsaasPayment={handleAsaasPayment}
          />

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500 text-center">
              <p>Esta é uma interface de teste para validação do fallback do Stripe.</p>
              <p>Nenhum pagamento será processado realment.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentTestModal