import { CalculatorInput, CalculatorResult } from '@/types'
import { usagePatterns, lensTypes, planRecommendations, planPrices, consultationPrices } from '@/data/calculator-data'

export function calculateEconomy(input: CalculatorInput): CalculatorResult {
  const usagePattern = usagePatterns.find(p => p.id === input.usagePattern)
  const lensType = lensTypes.find(l => l.id === input.lensType)

  if (!usagePattern || !lensType) {
    throw new Error('Padrão de uso ou tipo de lente inválido')
  }

  // Se tiver customUsageDays, usa ele. Senão usa o padrão do usagePattern
  const daysPerMonth = input.customUsageDays ?? usagePattern.daysPerMonth
  const lensesPerMonth = daysPerMonth * 2 // 2 lentes por dia (ambos os olhos)

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
  // Com SV Lentes: paga apenas o plano mensal (que já inclui consultas)
  // E as lentes saem pelo preço com desconto (já calculado em yearlySubscription)
  // Então o custo total é: mensalidade do plano + custo das lentes com desconto
  // Mas isso está duplicando! Na verdade, o cliente paga:
  // - Mensalidade do plano (que inclui consultas médicas)
  // - Lentes pelo preço com desconto (yearlySubscription)
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
  }).format(value).replace(/\u00A0/g, ' ') // Normalizar espaço não-quebrável para testes
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}

export function validateCalculatorInput(input: Partial<CalculatorInput>): {
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

  if (input.customUsageDays !== undefined) {
    if (!Number.isInteger(input.customUsageDays) || input.customUsageDays < 1 || input.customUsageDays > 31) {
      errors.push('Dias de uso deve ser entre 1 e 31')
    }
  }

  if (input.annualContactLensCost !== undefined && input.annualContactLensCost < 0) {
    errors.push('Custo de lentes não pode ser negativo')
  }

  if (input.annualConsultationCost !== undefined && input.annualConsultationCost < 0) {
    errors.push('Custo de consultas não pode ser negativo')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Valida e converte string de dias customizados para número
 * @param value String representando número de dias
 * @returns Número validado ou null se inválido
 */
export function validateCustomUsageDays(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const num = parseInt(trimmed, 10)

  if (isNaN(num) || num < 1 || num > 31) {
    return null
  }

  return num
}
