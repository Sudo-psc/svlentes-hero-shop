'use client'
import { Check, X, Package, Truck, HeadphonesIcon, Sparkles } from 'lucide-react'
export interface SubscriptionBenefit {
  id: string
  name: string
  description: string | null
  category: 'product' | 'service' | 'support' | 'discount'
  included: boolean
  icon?: string
}
interface BenefitsDisplayProps {
  benefits: SubscriptionBenefit[]
}
const categoryIcons = {
  product: Package,
  service: Truck,
  support: HeadphonesIcon,
  discount: Sparkles
}
const categoryLabels = {
  product: 'Produto',
  service: 'Serviço',
  support: 'Suporte',
  discount: 'Desconto'
}
export default function BenefitsDisplay({ benefits }: BenefitsDisplayProps) {
  const includedBenefits = benefits.filter(b => b.included)
  const excludedBenefits = benefits.filter(b => !b.included)
  const totalBenefits = benefits.length
  const includedCount = includedBenefits.length
  if (benefits.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="font-semibold text-gray-900 mb-4">Benefícios da Assinatura</h3>
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Nenhum benefício encontrado</p>
        </div>
      </div>
    )
  }
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Benefícios da Assinatura</h3>
        {includedCount < totalBenefits && (
          <span className="text-xs text-gray-500">
            {includedCount} de {totalBenefits} incluídos
          </span>
        )}
      </div>
      {/* Benefits Summary */}
      {includedCount < totalBenefits && (
        <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
          <p className="text-sm text-cyan-900">
            Sua assinatura inclui {includedCount} de {totalBenefits} benefícios disponíveis
          </p>
          <p className="text-xs text-cyan-700 mt-1">
            Faça upgrade para desbloquear todos os benefícios
          </p>
        </div>
      )}
      {/* Included Benefits */}
      {includedBenefits.length > 0 && (
        <div className="space-y-3 mb-4">
          {includedBenefits.map((benefit) => {
            const Icon = categoryIcons[benefit.category]
            return (
              <div
                key={benefit.id}
                className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {benefit.icon ? (
                    <span className="text-2xl">{benefit.icon}</span>
                  ) : (
                    <Icon className="h-5 w-5 text-green-600 mt-0.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{benefit.name}</p>
                      {benefit.description && (
                        <p className="text-sm text-gray-600 mt-1">{benefit.description}</p>
                      )}
                      <span className="inline-block mt-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">
                        {categoryLabels[benefit.category]}
                      </span>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="flex items-center gap-1 text-green-700">
                        <Check className="h-4 w-4" />
                        <span className="text-xs font-medium">Incluído</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {/* Excluded Benefits */}
      {excludedBenefits.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Benefícios Adicionais</h4>
          {excludedBenefits.map((benefit) => {
            const Icon = categoryIcons[benefit.category]
            return (
              <div
                key={benefit.id}
                className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-75"
              >
                <div className="flex-shrink-0">
                  {benefit.icon ? (
                    <span className="text-2xl grayscale">{benefit.icon}</span>
                  ) : (
                    <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-700">{benefit.name}</p>
                      {benefit.description && (
                        <p className="text-sm text-gray-500 mt-1">{benefit.description}</p>
                      )}
                      <span className="inline-block mt-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {categoryLabels[benefit.category]}
                      </span>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="flex items-center gap-1 text-gray-500">
                        <X className="h-4 w-4" />
                        <span className="text-xs font-medium">Não disponível</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}