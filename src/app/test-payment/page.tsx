'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import PaymentTestModal from '@/components/payment/PaymentTestModal'
import { CreditCard, TestTube } from 'lucide-react'
export default function TestPaymentPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState({
    id: 'premium',
    name: 'Plano Premium (Teste)',
    price: 104.00
  })
  const testPlans = [
    {
      id: 'express',
      name: 'Plano Express (Teste)',
      price: 128.00
    },
    {
      id: 'smart',
      name: 'Plano Smart (Teste)',
      price: 111.00
    },
    {
      id: 'premium',
      name: 'Plano Premium (Teste)',
      price: 104.00
    },
    {
      id: 'vip',
      name: 'Plano VIP (Teste)',
      price: 91.00
    }
  ]
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <TestTube className="w-8 h-8 text-cyan-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Teste de Integração Stripe
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Interface de teste para validação do fallback de pagamento Stripe como alternativa ao Asaas.
            </p>
          </div>
          {/* Environment Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Informações do Ambiente</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Stripe Publishable Key:</span>
                <p className="text-blue-600 break-all font-mono">
                  {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?
                    `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 20)}...` :
                    'Não configurada'
                  }
                </p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Ambiente:</span>
                <p className="text-blue-600">
                  {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test') ?
                    'Teste (Sandbox)' :
                    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live') ?
                    'Produção' :
                    'Não configurado'
                  }
                </p>
              </div>
            </div>
          </div>
          {/* Plan Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Selecione o Plano para Testar</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {testPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    selectedPlan.id === plan.id
                      ? 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-200'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{plan.name}</h3>
                    <span className="text-lg font-bold text-cyan-600">
                      {formatPrice(plan.price)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Mensal × {plan.id === 'vip' ? '12' : plan.id === 'premium' ? '6' : plan.id === 'smart' ? '3' : '1'}
                  </p>
                </button>
              ))}
            </div>
            <div className="text-center">
              <Button
                onClick={() => setIsModalOpen(true)}
                size="lg"
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold flex items-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Testar Pagamento com Plano Selecionado
              </Button>
            </div>
          </div>
          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-amber-900 mb-4">Instruções de Teste</h2>
            <div className="space-y-3 text-sm text-amber-800">
              <div className="flex gap-3">
                <span className="font-semibold">1.</span>
                <p>Selecione um plano acima para testar o fluxo de pagamento.</p>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold">2.</span>
                <p>Clique em "Testar Pagamento" para abrir o modal de seleção de método.</p>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold">3.</span>
                <p>Escolha "Stripe Internacional" para testar o fallback.</p>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold">4.</span>
                <p>Use os dados de teste do Stripe:</p>
              </div>
              <div className="ml-6 p-3 bg-white rounded border border-amber-300">
                <p className="font-mono text-xs">
                  Cartão: 4242 4242 4242 4242<br/>
                  Validade: Qualquer data futura<br/>
                  CVV: Qualquer código de 3 dígitos<br/>
                  Nome: Qualquer nome
                </p>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold">5.</span>
                <p>O pagamento será redirecionado para o Checkout do Stripe (ambiente de teste).</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Payment Test Modal */}
      <PaymentTestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        planData={selectedPlan}
      />
    </div>
  )
}