import { CalculatorInput, CalculatorResult } from '@/types';
import { usagePatterns, lensTypes, planRecommendations, planPrices, consultationPrices } from '@/data/calculator-data';

/**
 * Calcula a economia baseada no padrão de uso e tipo de lente
 */
export function calculateEconomy(input: CalculatorInput): CalculatorResult {
  const usagePattern = usagePatterns.find(p => p.id === input.usagePattern);
  const lensType = lensTypes.find(l => l.id === input.lensType);

  if (!usagePattern || !lensType) {
    throw new Error('Padrão de uso ou tipo de lente inválido');
  }

  // Cálculo baseado no uso mensal (2 lentes por dia de uso)
  const lensesPerMonth = usagePattern.daysPerMonth * 2;

  // Custos mensais das lentes
  const monthlyAvulso = lensesPerMonth * lensType.avulsoPrice;
  const monthlySubscription = lensesPerMonth * lensType.subscriptionPrice;
  const monthlySavings = monthlyAvulso - monthlySubscription;

  // Custos anuais das lentes
  const yearlyAvulso = monthlyAvulso * 12;
  const yearlySubscription = monthlySubscription * 12;
  const yearlySavings = yearlyAvulso - yearlySubscription;

  // Percentual de economia nas lentes
  const savingsPercentage = (monthlySavings / monthlyAvulso) * 100;

  // Plano recomendado e seus benefícios
  const recommendedPlanId = planRecommendations[input.usagePattern as keyof typeof planRecommendations];
  const recommendedPlan = planPrices[recommendedPlanId as keyof typeof planPrices];

  // Calcular custos totais anuais (incluindo consultas)
  const annualContactLensCost = input.annualContactLensCost || yearlyAvulso;
  const annualConsultationCost = input.annualConsultationCost || (consultationPrices.market.consultation * 2); // 2 consultas por ano em média

  // Custo total atual (lentes + consultas)
  const totalCurrentAnnualCost = annualContactLensCost + annualConsultationCost;

  // Custo total com SV Lentes (plano mensal + lentes com desconto)
  const totalSVLentesAnnualCost = (recommendedPlan.monthlyPrice * 12) + yearlySubscription;

  // Economia total anual
  const totalAnnualSavings = totalCurrentAnnualCost - totalSVLentesAnnualCost;

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
    includedConsultations: recommendedPlan.includedConsultations
  };
}

/**
 * Formata valor monetário para exibição
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata percentual para exibição
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}