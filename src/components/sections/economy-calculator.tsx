'use client';

import { useState } from 'react';
import { CalculatorResult } from '@/types';
import { CalculatorForm } from '@/components/forms/calculator-form';
import { CalculatorResults } from './calculator-results';

export function EconomyCalculator() {
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleCalculate = (calculatorResult: CalculatorResult) => {
    setResult(calculatorResult);
    setShowResults(true);
  };

  const handleReset = () => {
    setResult(null);
    setShowResults(false);
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Calcule Sua Economia
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubra quanto você pode economizar com a assinatura SVlentes
            comparado à compra avulsa de lentes de contato
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {!showResults ? (
            <CalculatorForm onCalculate={handleCalculate} />
          ) : (
            result && <CalculatorResults result={result} onReset={handleReset} />
          )}
        </div>

        {/* Benefícios Adicionais */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏠</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Entrega em Casa</h3>
            <p className="text-sm text-gray-600">
              Receba suas lentes sem sair de casa, com frete grátis
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👨‍⚕️</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Acompanhamento Médico</h3>
            <p className="text-sm text-gray-600">
              Dr. Philipe Saraiva Cruz acompanha sua saúde ocular
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔄</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Flexibilidade Total</h3>
            <p className="text-sm text-gray-600">
              Pause, altere ou cancele sua assinatura quando quiser
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}