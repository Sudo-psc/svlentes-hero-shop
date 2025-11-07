'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronRight, CreditCard } from 'lucide-react'

interface StripeFallbackProps {
  className?: string
  onContactUs?: () => void
  onWhatsApp?: () => void
}

export const StripeFallback: React.FC<StripeFallbackProps> = ({
  className = "",
  onContactUs,
  onWhatsApp
}) => {
  return (
    <div className={`w-full max-w-4xl mx-auto p-8 bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-50 rounded-2xl shadow-xl border border-blue-100 ${className}`}>
      <div className="text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mb-6">
          <CreditCard className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Planos de Assinatura
          </h2>
          <p className="text-lg text-gray-600">
            Escolha o plano ideal para você
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {/* Basic Plan */}
          <div className="bg-white rounded-xl border border-blue-200 p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Básico</h3>
            <div className="text-3xl font-bold text-cyan-600 mb-4">
              R$ 79<span className="text-lg text-gray-500">/mês</span>
            </div>
            <ul className="space-y-2 text-left text-gray-600 mb-6">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Lentes mensais
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Entrega mensal
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Suporte por WhatsApp
              </li>
            </ul>
            <Button
              className="w-full btn-gradient"
              onClick={onContactUs}
            >
              Escolher Plano
            </Button>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-xl p-6 transform hover:scale-105 transition-all shadow-xl">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold">Premium</h3>
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-semibold">
                MAIS POPULAR
              </span>
            </div>
            <div className="text-3xl font-bold mb-4">
              R$ 99<span className="text-lg opacity-80">/mês</span>
            </div>
            <ul className="space-y-2 text-left mb-6 opacity-90">
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Lentes diárias premium
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Entrega semanal
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Consultas incluídas
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Suporte prioritário
              </li>
            </ul>
            <Button
              className="w-full bg-white text-cyan-600 hover:bg-gray-100 font-semibold"
              onClick={onContactUs}
            >
              Escolher Plano
            </Button>
          </div>

          {/* Family Plan */}
          <div className="bg-white rounded-xl border border-blue-200 p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Family</h3>
            <div className="text-3xl font-bold text-cyan-600 mb-4">
              R$ 159<span className="text-lg text-gray-500">/mês</span>
            </div>
            <ul className="space-y-2 text-left text-gray-600 mb-6">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                2 pares de lentes
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Tipos diferentes
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Entrega combinada
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Descontos especiais
              </li>
            </ul>
            <Button
              className="w-full btn-gradient"
              onClick={onContactUs}
            >
              Escolher Plano
            </Button>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-gray-700 mb-4">
            Precisa de ajuda para escolher o plano ideal?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={onWhatsApp}
              className="flex items-center gap-2"
            >
              Falar com especialista
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={onContactUs}
              className="flex items-center gap-2"
            >
              Agendar consulta
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-sm text-gray-500">
          <p>Todos os planos incluem acompanhamento do Dr. Philipe Saraiva Cruz (CRM-MG 69.870)</p>
          <p className="mt-1">Cancelamento a qualquer momento sem taxa adicional</p>
        </div>
      </div>
    </div>
  )
}

export default StripeFallback