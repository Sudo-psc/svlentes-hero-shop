'use client';

import { useState } from 'react';
import { CalculatorInput, CalculatorResult } from '@/types';
import { usagePatterns, lensTypes } from '@/data/calculator-data';
import { calculateEconomy } from '@/lib/calculator';

interface CalculatorFormProps {
  onCalculate: (result: CalculatorResult) => void;
  initialData?: Partial<CalculatorInput>;
}

export function CalculatorForm({ onCalculate, initialData }: CalculatorFormProps) {
  const [input, setInput] = useState<CalculatorInput>({
    lensType: initialData?.lensType || 'daily',
    usagePattern: initialData?.usagePattern || 'regular',
    currentMonthlySpend: initialData?.currentMonthlySpend
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = calculateEconomy(input);
      onCalculate(result);
    } catch (error) {
      console.error('Erro no cálculo:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tipo de Lente */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Que tipo de lente você usa?
        </label>
        <div className="grid grid-cols-1 gap-3">
          {lensTypes.map((lens) => (
            <label
              key={lens.id}
              className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                input.lensType === lens.id
                  ? 'border-cyan-600 bg-cyan-50'
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="lensType"
                value={lens.id}
                checked={input.lensType === lens.id}
                onChange={(e) => setInput({ ...input, lensType: e.target.value })}
                className="sr-only"
              />
              <div className="flex w-full items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {lens.name}
                  </div>
                </div>
                <div className={`h-4 w-4 rounded-full border-2 ${
                  input.lensType === lens.id
                    ? 'border-cyan-600 bg-cyan-600'
                    : 'border-gray-300'
                }`}>
                  {input.lensType === lens.id && (
                    <div className="h-full w-full rounded-full bg-white scale-50" />
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Padrão de Uso */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Com que frequência você usa lentes?
        </label>
        <div className="grid grid-cols-1 gap-3">
          {usagePatterns.map((pattern) => (
            <label
              key={pattern.id}
              className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                input.usagePattern === pattern.id
                  ? 'border-cyan-600 bg-cyan-50'
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="usagePattern"
                value={pattern.id}
                checked={input.usagePattern === pattern.id}
                onChange={(e) => setInput({ ...input, usagePattern: e.target.value })}
                className="sr-only"
              />
              <div className="flex w-full items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {pattern.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {pattern.description}
                  </div>
                </div>
                <div className={`h-4 w-4 rounded-full border-2 ${
                  input.usagePattern === pattern.id
                    ? 'border-cyan-600 bg-cyan-600'
                    : 'border-gray-300'
                }`}>
                  {input.usagePattern === pattern.id && (
                    <div className="h-full w-full rounded-full bg-white scale-50" />
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Botão de Calcular */}
      <button
        type="submit"
        className="w-full bg-cyan-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-cyan-700 transition-colors"
      >
        Calcular Economia
      </button>
    </form>
  );
}