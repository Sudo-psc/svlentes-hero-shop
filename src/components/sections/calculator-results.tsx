'use client';

import { CalculatorResult } from '@/types';
import { formatCurrency, formatPercentage } from '@/lib/calculator';
import { pricingPlans } from '@/data/pricing-plans';

interface CalculatorResultsProps {
  result: CalculatorResult;
  onReset: () => void;
}

export function CalculatorResults({ result, onReset }: CalculatorResultsProps) {
  const recommendedPlan = pricingPlans.find(plan => plan.id === result.recommendedPlan);

  return (
    <div className="space-y-6">
      {/* Resumo da Economia */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {formatCurrency(result.monthlySavings)}
          </div>
          <div className="text-sm text-green-700 mb-1">
            Economia mensal com a assinatura
          </div>
          <div className="text-lg font-semibold text-green-800">
            {formatPercentage(result.savingsPercentage)} de desconto
          </div>
        </div>
      </div>

      {/* Comparação Detalhada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Compra Avulsa */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-3">Compra Avulsa</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-red-700">Mensal:</span>
              <span className="font-medium text-red-800">
                {formatCurrency(result.monthlyAvulso)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-red-700">Anual:</span>
              <span className="font-medium text-red-800">
                {formatCurrency(result.yearlyAvulso)}
              </span>
            </div>
          </div>
        </div>

        {/* Assinatura SVlentes */}
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
          <h3 className="font-semibold text-cyan-800 mb-3">Assinatura SVlentes</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-cyan-700">Mensal:</span>
              <span className="font-medium text-cyan-800">
                {formatCurrency(result.monthlySubscription)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-cyan-700">Anual:</span>
              <span className="font-medium text-cyan-800">
                {formatCurrency(result.yearlySubscription)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Economia Anual */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <div className="text-lg font-semibold text-yellow-800 mb-1">
          Economia Anual Total
        </div>
        <div className="text-2xl font-bold text-yellow-900">
          {formatCurrency(result.yearlySavings)}
        </div>
      </div>

      {/* Plano Recomendado */}
      {recommendedPlan && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Plano Recomendado</h3>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-900">{recommendedPlan.name}</div>
              <div className="text-sm text-gray-600">
                A partir de {formatCurrency(recommendedPlan.priceMonthly)}/mês
              </div>
            </div>
            <button className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors">
              Ver Plano
            </button>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onReset}
          className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Calcular Novamente
        </button>
        <button className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors">
          Agendar Consulta
        </button>
      </div>
    </div>
  );
}