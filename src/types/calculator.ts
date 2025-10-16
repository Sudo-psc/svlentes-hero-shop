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
  brand: string;
  basePrice: number;
  boxesPerPeriod: number;
  period: 'month' | 'semester';
  description: string;
  icon: string;
  features: string[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  badge: string | null;
  discount: number;
  shipping: {
    free: boolean;
    condition: string;
    nationwide: boolean;
  };
  payment: {
    method: string;
    installments: number;
  };
  cancellation: string;
  benefits: Array<{
    name: string;
    value: number;
  }>;
  description: string;
}

export interface PlanCalculation {
  planId: string;
  planName: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  installmentValue: number;
  totalBenefitsValue: number;
  effectiveAnnualCost: number;
  savingsVsRetail: number;
  shippingIncluded: boolean;
}

export interface CalculatorInput {
  lensType: string;
  selectedPlan: 'monthly' | 'annual';
  bothEyes: boolean;
  differentGrades: boolean;
}

export interface CalculatorResult {
  selectedLens: LensType;
  baseMonthlyCost: number;
  plans: {
    monthly: PlanCalculation;
    annual: PlanCalculation;
  };
  retailAnnualCost: number;
  bestSavingsPlan: string;
  totalAnnualSavings: {
    monthly: number;
    annual: number;
  };
}

export interface CalculatorProps {
  onCalculate: (result: CalculatorResult) => void;
  initialData?: Partial<CalculatorInput>;
}