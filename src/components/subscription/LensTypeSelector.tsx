'use client'

import { useState } from 'react'
import { LensType } from '@/types'
import { lensTypes } from '@/data/calculator-data'
import { cn } from '@/lib/utils'

interface LensTypeSelectorProps {
  selectedLensType: string
  onLensTypeChange: (lensTypeId: string) => void
}

export function LensTypeSelector({ selectedLensType, onLensTypeChange }: LensTypeSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Group lens types by category
  const categories = {
    all: { name: 'Todos', icon: '👁️' },
    monthly: { name: 'Mensais', icon: '📅' },
    daily: { name: 'Diárias', icon: '☀️' },
    specialized: { name: 'Especializadas', icon: '🎯' }
  }

  const filteredLensTypes = lensTypes.filter(lens => {
    if (selectedCategory === 'all') return true
    if (selectedCategory === 'monthly') return lens.id.includes('monthly') && !lens.id.includes('toric') && !lens.id.includes('multifocal')
    if (selectedCategory === 'daily') return lens.id.includes('daily')
    if (selectedCategory === 'specialized') return lens.id.includes('toric') || lens.id.includes('multifocal')
    return true
  })

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Lente</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(categories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={cn(
                'inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
                selectedCategory === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lens Type Options */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLensTypes.map((lens) => (
          <LensTypeCard
            key={lens.id}
            lens={lens}
            isSelected={selectedLensType === lens.id}
            onSelect={() => onLensTypeChange(lens.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface LensTypeCardProps {
  lens: LensType
  isSelected: boolean
  onSelect: () => void
}

function LensTypeCard({ lens, isSelected, onSelect }: LensTypeCardProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg',
        isSelected
          ? 'border-primary-600 bg-primary-50 shadow-lg'
          : 'border-gray-200 bg-white hover:border-primary-300'
      )}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      <div className="flex items-start space-x-4">
        <div className="text-4xl">{lens.icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold text-gray-900 mb-1">
            {lens.name}
          </h4>
          <p className="text-sm text-gray-500 mb-2">{lens.brand}</p>
          <p className="text-sm text-gray-600 mb-3">{lens.description}</p>

          {/* Features */}
          <div className="mb-4">
            {lens.features.slice(0, 2).map((feature, index) => (
              <div key={index} className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="w-1 h-1 bg-primary-400 rounded-full"></span>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Price */}
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-primary-600">
              R$ {lens.basePrice}
            </span>
            <span className="text-sm text-gray-500">
              /caixa
            </span>
          </div>

          {/* Usage Info */}
          <div className="mt-2 text-xs text-gray-500">
            Necessidade: {lens.boxesPerPeriod} caixa(s) por {lens.period === 'month' ? 'mês' : 'semestre'}
          </div>
        </div>
      </div>
    </div>
  )
}