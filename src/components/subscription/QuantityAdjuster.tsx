'use client'

import { useState } from 'react'
import { CalculatorInput } from '@/types'
import { Minus, Plus, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuantityAdjusterProps {
  lensType: string
  values: Omit<CalculatorInput, 'lensType'>
  onChange: (values: Omit<CalculatorInput, 'lensType'>) => void
}

export function QuantityAdjuster({ lensType, values, onChange }: QuantityAdjusterProps) {
  const handleBoxesPerDeliveryChange = (delta: number) => {
    const newValue = Math.max(1, values.boxesPerDelivery + delta)
    onChange({ ...values, boxesPerDelivery: newValue })
  }

  const handleExtraBoxesChange = (delta: number) => {
    const newValue = Math.max(0, (values.extraBoxes || 0) + delta)
    onChange({ ...values, extraBoxes: newValue })
  }

  const handleBothEyesChange = (bothEyes: boolean) => {
    onChange({ ...values, bothEyes })
  }

  const handleDifferentGradesChange = (differentGrades: boolean) => {
    onChange({ ...values, differentGrades })
  }

  return (
    <div className="space-y-6 bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Suas Necessidades</h3>

      {/* Boxes per Delivery */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Caixas por entrega
          </label>
          <div className="text-sm text-gray-500">
            {values.boxesPerDelivery} {values.boxesPerDelivery === 1 ? 'caixa' : 'caixas'}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleBoxesPerDeliveryChange(-1)}
            disabled={values.boxesPerDelivery <= 1}
            className={cn(
              'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors',
              values.boxesPerDelivery <= 1
                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                : 'border-primary-600 text-primary-600 hover:bg-primary-50'
            )}
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="flex-1 h-2 bg-gray-200 rounded-full relative">
            <div
              className="absolute h-2 bg-primary-600 rounded-full transition-all duration-200"
              style={{ width: `${Math.min(100, (values.boxesPerDelivery / 6) * 100)}%` }}
            ></div>
          </div>
          <button
            onClick={() => handleBoxesPerDeliveryChange(1)}
            className="w-8 h-8 rounded-full border-2 border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Both Eyes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">
            Usa nos dois olhos?
          </label>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Se você usa lentes apenas em um olho, o cálculo será ajustado automaticamente.
            </div>
          </div>
        </div>
        <button
          onClick={() => handleBothEyesChange(!values.bothEyes)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            values.bothEyes ? 'bg-primary-600' : 'bg-gray-200'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              values.bothEyes ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>

      {/* Different Grades */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">
            Graus diferentes?
          </label>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Se cada olho tem grau diferente, você pode precisar de caixas adicionais.
            </div>
          </div>
        </div>
        <button
          onClick={() => handleDifferentGradesChange(!values.differentGrades)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            values.differentGrades ? 'bg-primary-600' : 'bg-gray-200'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              values.differentGrades ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>

      {/* Extra Boxes (shown only if different grades is true) */}
      {values.differentGrades && (
        <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-amber-900">
              Caixas adicionais
            </label>
            <div className="text-sm text-amber-700">
              {values.extraBoxes || 0} {(values.extraBoxes || 0) === 1 ? 'caixa' : 'caixas'}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleExtraBoxesChange(-1)}
              disabled={(values.extraBoxes || 0) <= 0}
              className={cn(
                'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors',
                (values.extraBoxes || 0) <= 0
                  ? 'border-amber-300 text-amber-400 cursor-not-allowed'
                  : 'border-amber-600 text-amber-600 hover:bg-amber-100'
              )}
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex-1 h-2 bg-amber-200 rounded-full relative">
              <div
                className="absolute h-2 bg-amber-600 rounded-full transition-all duration-200"
                style={{ width: `${Math.min(100, ((values.extraBoxes || 0) / 4) * 100)}%` }}
              ></div>
            </div>
            <button
              onClick={() => handleExtraBoxesChange(1)}
              className="w-8 h-8 rounded-full border-2 border-amber-600 text-amber-600 hover:bg-amber-100 transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-amber-700">
            Adicione caixas extras se cada olho precisa de graus diferentes.
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Tipo de lente:</span>
            <span className="font-medium text-gray-900">
              {lensType === 'monthly-basic' && 'Mensal Básica'}
              {lensType === 'monthly-intermediate' && 'Mensal Intermediária'}
              {lensType === 'monthly-premium' && 'Mensal Premium'}
              {lensType === 'daily-basic' && 'Diária Básica'}
              {lensType === 'daily-premium' && 'Diária Premium'}
              {lensType === 'toric-monthly' && 'Tórica para Astigmatismo'}
              {lensType === 'multifocal-monthly' && 'Multifocal'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Frequência de entrega:</span>
            <span className="font-medium text-gray-900">
              {values.boxesPerDelivery} {values.boxesPerDelivery === 1 ? 'caixa' : 'caixas'}
              {!values.bothEyes && ' (1 olho)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}