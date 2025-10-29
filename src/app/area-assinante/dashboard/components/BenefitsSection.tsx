// @ts-nocheck - Type incompatibilities in subscriber dashboard - needs refactoring
/**
 * Benefits Section Component
 *
 * Displays subscription benefits with usage tracking
 * and animated progress bars
 *
 * @author Dr. Philipe Saraiva Cruz
 */

'use client'

import { motion } from 'framer-motion'

interface Benefit {
  id: string
  name: string
  description?: string
  icon?: string
  quantityTotal?: number
  quantityUsed?: number
}

interface BenefitsSectionProps {
  benefits: Benefit[]
}

/**
 * Grid display of subscription benefits with progress tracking
 *
 * Features:
 * - Responsive grid (1-3 columns)
 * - Progress bars for trackable benefits
 * - Hover effects
 * - Staggered animations
 * - Icon support
 *
 * @example
 * <BenefitsSection benefits={subscription.benefits} />
 */
export function BenefitsSection({ benefits }: BenefitsSectionProps) {
  if (!benefits || benefits.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white p-6 rounded-xl shadow-sm border mb-8"
    >
      <h3 className="font-semibold text-gray-900 mb-4">Benefícios da Assinatura</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {benefits.map((benefit, index) => (
          <motion.div
            key={benefit.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start gap-3">
              {benefit.icon && (
                <span className="text-2xl">{benefit.icon}</span>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{benefit.name}</p>
                {benefit.description && (
                  <p className="text-sm text-gray-600 mt-1">{benefit.description}</p>
                )}
                {benefit.quantityTotal && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Utilizado: {benefit.quantityUsed || 0}/{benefit.quantityTotal}</span>
                      <span>{Math.round(((benefit.quantityUsed || 0) / benefit.quantityTotal) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-cyan-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${((benefit.quantityUsed || 0) / benefit.quantityTotal) * 100}%`
                        }}
                        transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
