import { CalculatorInput, CalculatorResult } from '@/types'
import { usagePatterns, lensTypes, planRecommendations, planPrices, consultationPrices } from '@/data/calculator-data'

export interface UnifiedCalculatorInput {
  lensType: 'daily' | 'weekly' | 'monthly'
  usagePattern: 'occasional' | 'regular' | 'daily'
  currentSpending?: number
  annualContactLensCost?: number
  annualConsultationCost?: number
}

export interface UnifiedCalculatorResult {
  monthlyAvulso: number
  monthlySubscription: number
  monthlySavings: number
  yearlyAvulso: number
  yearlySubscription: number
  yearlySavings: number
  savingsPercentage: number
  recommendedPlan: string
  totalCurrentAnnualCost: number
  totalSVLentesAnnualCost: number
  totalAnnualSavings: number
  includedConsultations: number
  lensesPerMonth: number
  costPerLens: {
    current: number
    subscription: number
  }
}

export function calculateEconomy(input: UnifiedCalculatorInput): UnifiedCalculatorResult {
  const usagePattern = usagePatterns.find(p => p.id === input.usagePattern)
  const lensType = lensTypes.find(l => l.id === input.lensType)

  if (!usagePattern || !lensType) {
    throw new Error('Padrão de uso ou tipo de lente inválido')
  }

  const lensesPerMonth = usagePattern.daysPerMonth * 2

  const monthlyAvulso = lensesPerMonth * lensType.avulsoPrice
  const monthlySubscription = lensesPerMonth * lensType.subscriptionPrice
  const monthlySavings = monthlyAvulso - monthlySubscription

  const yearlyAvulso = monthlyAvulso * 12
  const yearlySubscription = monthlySubscription * 12
  const yearlySavings = yearlyAvulso - yearlySubscription

  const savingsPercentage = (monthlySavings / monthlyAvulso) * 100

  const recommendedPlanId = planRecommendations[input.usagePattern as keyof typeof planRecommendations]
  const recommendedPlan = planPrices[recommendedPlanId as keyof typeof planPrices]

  const annualContactLensCost = input.annualContactLensCost || yearlyAvulso
  const annualConsultationCost = input.annualConsultationCost || (consultationPrices.market.consultation * 2)

  const totalCurrentAnnualCost = annualContactLensCost + annualConsultationCost
  const totalSVLentesAnnualCost = (recommendedPlan.monthlyPrice * 12) + yearlySubscription
  const totalAnnualSavings = totalCurrentAnnualCost - totalSVLentesAnnualCost

  return {
    monthlyAvulso,
    monthlySubscription,
    monthlySavings,
    yearlyAvulso,
    yearlySubscription,
    yearlySavings,
    savingsPercentage,
    recommendedPlan: recommendedPlanId,
    totalCurrentAnnualCost,
    totalSVLentesAnnualCost,
    totalAnnualSavings,
    includedConsultations: recommendedPlan.includedConsultations,
    lensesPerMonth,
    costPerLens: {
      current: lensType.avulsoPrice,
      subscription: lensType.subscriptionPrice,
    },
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}

export function validateCalculatorInput(input: Partial<UnifiedCalculatorInput>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!input.lensType) {
    errors.push('Tipo de lente é obrigatório')
  }

  if (!input.usagePattern) {
    errors.push('Padrão de uso é obrigatório')
  }

  if (input.currentSpending !== undefined) {
    if (input.currentSpending < 0) {
      errors.push('Gasto atual não pode ser negativo')
    }
    if (input.currentSpending > 1000) {
      errors.push('Gasto atual parece muito alto, verifique o valor')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
