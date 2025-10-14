'use client';

import { useState } from 'react';
import { calculateEconomy, formatCurrency, formatPercentage } from '@/lib/calculator';

export function CalculatorDemo() {
  const [result, setResult] = useState<any>(null);

  const testCalculation = () => {
    try {
      const testResult = calculateEconomy({
        lensType: 'daily',
        usagePattern: 'regular'
      });
      setResult(testResult);
    } catch (error) {
      console.error('Erro no teste:', error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Teste da Calculadora</h3>
      
      <button
        onClick={testCalculation}
        className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 mb-4"
      >
        Testar Cálculo (Lentes Diárias - Uso Regular)
      </button>

      {result && (
        <div className="space-y-3">
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-green-700">Economia Mensal:</div>
            <div className="text-lg font-bold text-green-800">
              {formatCurrency(result.monthlySavings)}
            </div>
            <div className="text-sm text-green-600">
              {formatPercentage(result.savingsPercentage)} de desconto
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-gray-600">Avulso/mês:</div>
              <div className="font-medium">{formatCurrency(result.monthlyAvulso)}</div>
            </div>
            <div>
              <div className="text-gray-600">Assinatura/mês:</div>
              <div className="font-medium">{formatCurrency(result.monthlySubscription)}</div>
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            Plano recomendado: <span className="font-medium">{result.recommendedPlan}</span>
          </div>
        </div>
      )}
    </div>
  );
}