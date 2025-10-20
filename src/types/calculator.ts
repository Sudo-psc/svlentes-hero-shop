// Tipos para a calculadora de economia
export type LensTypeId = 'daily' | 'weekly' | 'monthly'
export type UsagePatternId = 'occasional' | 'regular' | 'daily'
export interface UsagePattern {
  id: UsagePatternId;
  name: string;
  daysPerMonth: number;
  description: string;
}
export interface LensType {
  id: LensTypeId;
  name: string;
  avulsoPrice: number;
  subscriptionPrice: number;
}
export interface CalculatorInput {
  lensType: LensTypeId;
  usagePattern: UsagePatternId;
  customUsageDays?: number; // Já validado, 1-31
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
  lensesPerMonth?: number;
  costPerLens?: {
    current: number;
    subscription: number;
  }
}
export interface CalculatorProps {
  onCalculate: (result: CalculatorResult) => void;
  initialData?: Partial<CalculatorInput>;
}
export interface SavedCalculation {
  id: string;
  timestamp: number;
  input: CalculatorInput;
  result: CalculatorResult;
}