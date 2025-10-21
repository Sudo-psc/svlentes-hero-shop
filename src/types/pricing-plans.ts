/**
 * Enhanced Pricing Plan Types
 *
 * This file defines comprehensive types for all pricing plans, supporting:
 * - Different lens types (asféricas, diárias, tóricas, multifocais)
 * - Different billing cycles (monthly, quarterly, semiannual, annual)
 * - Different consultation types (none, presencial, telemedicina, hybrid)
 * - Complete pricing information and features
 */
export type LensType = 'asferica' | 'diaria' | 'torica' | 'multifocal'
export type BillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'annual'
export type ConsultationType = 'none' | 'presencial' | 'telemedicina' | 'hybrid'
export type ServiceLevel = 'express' | 'smart' | 'premium' | 'vip' | 'basic'
export interface PricingPlanBenefit {
  id: string
  name: string
  description?: string
  icon?: string
  included: boolean
  quantity?: number
  value?: number // valor monetário do benefício
}
export interface PricingPlanComparison {
  feature: string
  express?: string | boolean
  smart?: string | boolean
  premium?: string | boolean
  vip?: string | boolean
  basic?: string | boolean
}
export interface PricingPlan {
  // Identificação
  id: string
  name: string
  description?: string
  // Categorização
  lensType: LensType
  billingCycle: BillingCycle
  consultationType: ConsultationType
  serviceLevel: ServiceLevel
  // Preços
  priceMonthly: number
  priceTotal: number
  pricePerLens?: number
  installments?: {
    count: number
    value: number
    show?: boolean
  }
  // Economia
  economy?: {
    percentage: number
    amount: number
    previousPrice?: number
    accessoriesValue?: number
  }
  // Visual
  badge?: string
  popularBadge?: string
  recommended?: boolean
  highlight?: boolean
  // Conteúdo
  features: string[]
  benefits: PricingPlanBenefit[]
  includedAccessories?: Array<{
    name: string
    quantity: number
    value: number
  }>
  // Entrega e Logística
  deliveryInfo?: {
    frequency: string
    freightFree?: boolean
    locations?: string[]
  }
  // Consultas
  consultationInfo?: {
    included: boolean
    type: ConsultationType
    count: number
    value?: number
    location?: string[]
  }
  // Suporte
  supportInfo?: {
    type: string
    availability: string
    priority?: 'standard' | 'priority' | 'vip'
  }
  // Integrações
  stripeProductId?: string
  stripePriceId?: string
  asaasProductId?: string
  asaasPlanId?: string
  // Marketing
  ctaText?: string
  tags?: string[]
  targetAudience?: string[]
  // Metadados
  createdAt?: string
  updatedAt?: string
  isActive?: boolean
  sortOrder?: number
}
export interface PricingPlanFilter {
  lensTypes?: LensType[]
  billingCycles?: BillingCycle[]
  consultationTypes?: ConsultationType[]
  serviceLevels?: ServiceLevel[]
  priceRange?: {
    min: number
    max: number
  }
}
export interface PricingPlanGroup {
  id: string
  name: string
  description?: string
  lensType: LensType
  icon?: string
  plans: PricingPlan[]
  order: number
}
export interface PricingComparisonTable {
  categories: string[]
  plans: PricingPlan[]
  comparison: PricingPlanComparison[]
}
export interface PricingCalculatorData {
  lensType: LensType
  plans: PricingPlan[]
  usagePatterns: {
    occasional: { daysPerMonth: number; multiplier: number }
    regular: { daysPerMonth: number; multiplier: number }
    daily: { daysPerMonth: number; multiplier: number }
  }
}
export interface PricingPageContent {
  hero: {
    title: string
    subtitle: string
    description: string
    badge?: string
  }
  filters: {
    enabled: boolean
    defaultFilters?: PricingPlanFilter
  }
  groups: PricingPlanGroup[]
  calculator: {
    enabled: boolean
    data: PricingCalculatorData
  }
  comparison: {
    enabled: boolean
    data: PricingComparisonTable
  }
  faq: {
    enabled: boolean
    category?: string
  }
}
// Types específicos para lentes
export interface AsphericLensPlan extends PricingPlan {
  lensType: 'asferica'
  replacementFrequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual'
  material?: string
  coating?: string
}
export interface DailyLensPlan extends PricingPlan {
  lensType: 'diaria'
  dailyQuantity: number
  packaging?: 'individual' | 'box'
  disposalInstructions?: string
}
export interface ToricLensPlan extends PricingPlan {
  lensType: 'torica'
  cylinderRange?: {
    min: number
    max: number
  }
  axisRange?: {
    min: number
    max: number
  }
  specialFitting?: boolean
}
export interface MultifocalLensPlan extends PricingPlan {
  lensType: 'multifocal'
  designType?: 'progressive' | 'bifocal' | 'trifocal'
  ageGroup?: '40+' | '50+' | '60+'
  adaptation?: 'standard' | 'premium'
}
// Status e validação
export interface PricingPlanValidation {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    code?: string
  }>
  warnings?: Array<{
    field: string
    message: string
  }>
}
export interface PricingPlanAnalytics {
  id: string
  views: number
  clicks: number
  conversions: number
  revenue: number
  conversionRate: number
  averageOrderValue: number
}
// Tipos para componentes UI
export interface PricingPlanCardProps {
  plan: PricingPlan
  selected?: boolean
  onSelect?: (planId: string) => void
  onCompare?: (planIds: string[]) => void
  showComparison?: boolean
  compact?: boolean
}
export interface PricingPlanComparisonProps {
  plans: PricingPlan[]
  features: string[]
  highlighted?: string[]
  responsive?: boolean
}
export interface PricingFilterProps {
  filters: PricingPlanFilter
  onChange: (filters: PricingPlanFilter) => void
  availableOptions: {
    lensTypes: LensType[]
    billingCycles: BillingCycle[]
    consultationTypes: ConsultationType[]
    serviceLevels: ServiceLevel[]
  }
}
// Enums para valores constantes
export const LENS_TYPES = {
  ASFERICA: 'asferica' as const,
  DIARIA: 'diaria' as const,
  TORICA: 'torica' as const,
  MULTIFOCAL: 'multifocal' as const
} as const;
export const BILLING_CYCLES = {
  MONTHLY: 'monthly' as const,
  QUARTERLY: 'quarterly' as const,
  SEMIANNUAL: 'semiannual' as const,
  ANNUAL: 'annual' as const
} as const;
export const CONSULTATION_TYPES = {
  NONE: 'none' as const,
  PRESENCIAL: 'presencial' as const,
  TELEMEDICINA: 'telemedicina' as const,
  HYBRID: 'hybrid' as const
} as const;
export const SERVICE_LEVELS = {
  BASIC: 'basic' as const,
  EXPRESS: 'express' as const,
  SMART: 'smart' as const,
  PREMIUM: 'premium' as const,
  VIP: 'vip' as const
} as const;
// Utilitários
export const getLensTypeLabel = (type: LensType): string => {
  const labels = {
    [LENS_TYPES.ASFERICA]: 'Lentes Asféricas',
    [LENS_TYPES.DIARIA]: 'Lentes Diárias',
    [LENS_TYPES.TORICA]: 'Lentes Tóricas (Astigmatismo)',
    [LENS_TYPES.MULTIFOCAL]: 'Lentes Multifocais (+40 anos)'
  };
  return labels[type];
};
export const getBillingCycleLabel = (cycle: BillingCycle): string => {
  const labels = {
    [BILLING_CYCLES.MONTHLY]: 'Mensal',
    [BILLING_CYCLES.QUARTERLY]: 'Trimestral',
    [BILLING_CYCLES.SEMIANNUAL]: 'Semestral',
    [BILLING_CYCLES.ANNUAL]: 'Anual'
  };
  return labels[cycle];
};
export const getConsultationTypeLabel = (type: ConsultationType): string => {
  const labels = {
    [CONSULTATION_TYPES.NONE]: 'Sem Consulta',
    [CONSULTATION_TYPES.PRESENCIAL]: 'Consulta Presencial',
    [CONSULTATION_TYPES.TELEMEDICINA]: 'Telemedicina',
    [CONSULTATION_TYPES.HYBRID]: 'Híbrido (Presencial + Online)'
  };
  return labels[type];
};
export const getServiceLevelLabel = (level: ServiceLevel): string => {
  const labels = {
    [SERVICE_LEVELS.BASIC]: 'Básico',
    [SERVICE_LEVELS.EXPRESS]: 'Express',
    [SERVICE_LEVELS.SMART]: 'Smart',
    [SERVICE_LEVELS.PREMIUM]: 'Premium',
    [SERVICE_LEVELS.VIP]: 'VIP'
  };
  return labels[level];
};