// Tipos para a calculadora de economia

export interface UsagePattern {
  id: string;
  name: string;
  daysPerMonth: number;
  description: string;
}

export interface LensType {
  id: string;
  name: string;
  avulsoPrice: number;
  subscriptionPrice: number;
}

export interface CalculatorInput {
  lensType: string;
  usagePattern: string;
  currentMonthlySpend?: number;
  annualContactLensCost?: number;
  annualConsultationCost?: number;
}

export interface CalculatorResult {
  monthlyAvulso: number;
  monthlySubscription: number;
  monthlySavings: number;
  yearlyAvulso: number;
  yearlySubscription: number;
  yearlySavings: number;
  savingsPercentage: number;
  recommendedPlan: string;
  totalCurrentAnnualCost?: number;
  totalSVLentesAnnualCost?: number;
  totalAnnualSavings?: number;
  includedConsultations?: number;
}

export interface CalculatorProps {
  onCalculate: (result: CalculatorResult) => void;
  initialData?: Partial<CalculatorInput>;
}