import { CalculatorInput, CalculatorResult, PlanCalculation, LensType } from '@/types';
import { lensTypes, subscriptionPlans } from '@/data/calculator-data';

/**
 * Calcula o custo mensal base para o tipo de lente selecionado
 * 
 * @param lensType - Tipo de lente selecionada
 * @param bothEyes - Se usa lentes em ambos os olhos
 * @param differentGrades - Se possui graus diferentes nos olhos
 * @returns Custo mensal em R$
 * 
 * LÓGICA:
 * - Lentes Mensais (period='month'): 1 lente dura 30 dias
 *   - 1 olho: 1 lente/mês
 *   - 2 olhos: 2 lentes/mês
 *   - Graus diferentes: +1 caixa (6 lentes) = +1 lente/mês por 6 meses
 * 
 * - Lentes Diárias (period='semester'): 1 lente por dia
 *   - 1 olho: 30 lentes/mês
 *   - 2 olhos: 60 lentes/mês
 *   - Graus diferentes: +1 caixa (30 lentes) = +30 lentes/mês
 * 
 * - Graus diferentes AUTO: Se bothEyes=true e differentGrades=true, adiciona 1 caixa extra
 */
function calculateBaseMonthlyCost(lensType: LensType, bothEyes: boolean, differentGrades: boolean = false): number {
  // Determinar lentes necessárias por mês
  let lensesPerMonth = 0;
  
  if (lensType.period === 'month') {
    // Lentes MENSAIS: 1 lente dura 1 mês
    lensesPerMonth = bothEyes ? 2 : 1;
  } else {
    // Lentes DIÁRIAS: 1 lente por dia = 30 lentes/mês
    lensesPerMonth = bothEyes ? 60 : 30;
  }
  
  // Calcular custo base mensal
  const baseCost = lensesPerMonth * lensType.basePrice;
  
  // Adicionar custo de caixa extra (se graus diferentes e usa 2 olhos)
  // Lógica: Se os graus são diferentes, precisa de 1 caixa extra
  let extraCost = 0;
  if (bothEyes && differentGrades) {
    const lensesPerBox = lensType.period === 'month' ? 6 : 30;
    const boxCost = lensesPerBox * lensType.basePrice;
    
    if (lensType.period === 'month') {
      // Lentes mensais: 1 caixa extra = 6 lentes = 6 meses de uso por grau
      // Para graus diferentes: 2 caixas/ano = 1 caixa extra a cada 12 meses
      // Custo mensal = custo da caixa ÷ 12
      extraCost = boxCost / 12;
    } else {
      // Lentes diárias: 1 caixa extra = 30 lentes = 1 mês de uso
      // Custo mensal = custo da caixa completo
      extraCost = boxCost;
    }
  }
  
  return baseCost + extraCost;
}

/**
 * Calcula os valores para cada plano de assinatura
 * 
 * @param planId - 'monthly' ou 'annual'
 * @param baseMonthlyCost - Custo mensal sem desconto
 * @param months - Número de meses do plano (1 para mensal, 12 para anual)
 * @returns Objeto com todos os valores calculados
 * 
 * FÓRMULAS:
 * 1. originalPrice = baseMonthlyCost × months
 * 2. discountAmount = originalPrice × plan.discount
 * 3. finalPrice = originalPrice - discountAmount
 * 4. installmentValue = finalPrice ÷ plan.payment.installments
 * 5. effectiveAnnualCost = (finalPrice ÷ months) × 12  (normaliza para 1 ano)
 * 6. retailAnnualCost = baseMonthlyCost × 12  (custo sem assinatura)
 * 7. savingsVsRetail = retailAnnualCost - effectiveAnnualCost + totalBenefits
 */
function calculatePlan(
  planId: 'monthly' | 'annual',
  baseMonthlyCost: number,
  months: number = 1
): PlanCalculation {
  const plan = subscriptionPlans[planId];

  // 1. Preço original (sem desconto)
  const originalPrice = baseMonthlyCost * months;
  
  // 2. Valor do desconto
  const discountAmount = originalPrice * plan.discount;
  
  // 3. Preço final com desconto
  const finalPrice = originalPrice - discountAmount;

  // 4. Valor de cada parcela
  const installmentValue = finalPrice / plan.payment.installments;

  // 5. Valor total dos benefícios inclusos
  const totalBenefitsValue = plan.benefits.reduce((sum, benefit) => sum + benefit.value, 0);

  // 6. Custo anual efetivo (normalizado para 12 meses)
  const effectiveAnnualCost = (finalPrice / months) * 12;

  // 7. Custo anual comprando sem assinatura (varejo)
  const retailAnnualCost = baseMonthlyCost * 12;
  
  // 8. Economia total: diferença entre varejo e assinatura + benefícios
  const savingsVsRetail = retailAnnualCost - effectiveAnnualCost + totalBenefitsValue;

  return {
    planId,
    planName: plan.name,
    originalPrice,
    discountAmount,
    finalPrice,
    installmentValue,
    totalBenefitsValue,
    effectiveAnnualCost,
    savingsVsRetail,
    shippingIncluded: plan.shipping.free
  };
}

/**
 * Calcula a economia completa baseada na seleção do usuário
 */
export function calculateSubscription(input: CalculatorInput): CalculatorResult {
  const lensType = lensTypes.find(l => l.id === input.lensType);

  if (!lensType) {
    throw new Error('Tipo de lente inválido');
  }

  // Calcular custo mensal base
  const baseMonthlyCost = calculateBaseMonthlyCost(
    lensType,
    input.bothEyes,
    input.differentGrades
  );

  // Calcular planos usando as fórmulas
  const monthlyPlan = calculatePlan('monthly', baseMonthlyCost, 1);
  const annualPlan = calculatePlan('annual', baseMonthlyCost, 12);

  // Calcular custo anual varejo
  const retailAnnualCost = baseMonthlyCost * 12;

  // Determinar plano com melhor economia
  const savingsComparison = {
    monthly: monthlyPlan.savingsVsRetail,
    annual: annualPlan.savingsVsRetail
  };

  const bestSavingsPlan = savingsComparison.annual > savingsComparison.monthly ? 'annual' : 'monthly';

  return {
    selectedLens: lensType,
    baseMonthlyCost,
    plans: {
      monthly: monthlyPlan,
      annual: annualPlan
    },
    retailAnnualCost,
    bestSavingsPlan,
    totalAnnualSavings: savingsComparison
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