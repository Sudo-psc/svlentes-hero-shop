/**
 * Zod Schemas para Configuração Centralizada - SV Lentes
 *
 * Versão: 1.0.0-mvp (Schema mínimo para Fase 1)
 * Fase: MVP - Menu
 *
 * NOTA: Este é um schema mínimo para MVP.
 * Schemas completos (Plans, SEO, Theme, etc.) serão adicionados nas Fases 2 e 3.
 */

import { z } from 'zod'

// ============================================================================
// 1. SITE METADATA (Mínimo)
// ============================================================================
const SiteConfigSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  tagline: z.string(),
  description: z.string(),
  url: z.string().url(),
})

// ============================================================================
// 2. I18N CONFIGURATION (Mínimo)
// ============================================================================
const I18nConfigSchema = z.object({
  defaultLocale: z.enum(['pt-BR', 'en-US']),
  locales: z.array(z.enum(['pt-BR', 'en-US'])),
  fallback: z.enum(['strict', 'soft']),
})

// ============================================================================
// 3. MENUS & NAVIGATION
// ============================================================================
const MenuItemSchema = z.object({
  label: z.string(),
  href: z.string(),
  isAnchor: z.boolean().optional(),
  icon: z.string().optional(),
  external: z.boolean().optional(),
  download: z.boolean().optional(),
  action: z.string().optional(), // For modal triggers
})

const MenusSchema = z.object({
  header: z.object({
    main: z.array(MenuItemSchema),
    cta: z.object({
      authenticated: z.object({
        dashboard: MenuItemSchema,
        logout: MenuItemSchema,
      }),
      unauthenticated: z.object({
        schedule: MenuItemSchema,
        login: MenuItemSchema,
      }),
    }),
  }),
  footer: z.object({
    quickLinks: z.array(MenuItemSchema),
    legalLinks: z.array(MenuItemSchema),
  }),
})

// ============================================================================
// 4. COPY/CONTENT (I18N) - Fase 2
// ============================================================================
const CommonCopySchema = z.object({
  cta: z.object({
    primary: z.string(),
    secondary: z.string(),
    contact: z.string(),
    schedule: z.string(),
  }),
  buttons: z.object({
    submit: z.string(),
    cancel: z.string(),
    close: z.string(),
    next: z.string(),
    back: z.string(),
  }),
})

const HeroCopySchema = z.object({
  badge: z.string(),
  title: z.object({
    line1: z.string(),
    line2: z.string(),
  }),
  subtitle: z.string(),
  description: z.string(),
  ctaPrimary: z.string(),
  ctaSecondary: z.string(),
})

const HowItWorksStepSchema = z.object({
  title: z.string(),
  description: z.string(),
  cost: z.string(),
  economy: z.string(),
  icon: z.string(),
  duration: z.string(),
})

const HowItWorksCopySchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  monthlyTab: z.string(),
  annualTab: z.string(),
  monthlyBadge: z.string(),
  annualBadge: z.string(),
  monthlySteps: z.array(HowItWorksStepSchema),
  annualSteps: z.array(HowItWorksStepSchema),
  ctaStart: z.string(),
  ctaLearnMore: z.string(),
})

const CopySchema = z.object({
  common: CommonCopySchema,
  hero: HeroCopySchema,
  howItWorks: HowItWorksCopySchema,
})

const LocalizedCopySchema = z.record(z.enum(['pt-BR', 'en-US']), CopySchema)

// ============================================================================
// 5. PRICING & PLANS (Fase 3)
// ============================================================================
const PricingPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  badge: z.string().optional(),
  popularBadge: z.string().optional(),
  description: z.string().optional(),
  priceMonthly: z.number(),
  priceAnnual: z.number(),
  features: z.array(z.string()),
  recommended: z.boolean().optional(),
  stripeProductId: z.string(),
  stripePriceId: z.string(),
  asaasProductId: z.string().optional(),
  ctaText: z.string(),
})

const FeatureComparisonRowSchema = z.object({
  feature: z.string(),
  basic: z.union([z.string(), z.boolean()]),
  premium: z.union([z.string(), z.boolean()]),
  vip: z.union([z.string(), z.boolean()]),
})

const FeatureComparisonSchema = z.object({
  features: z.array(z.string()),
  planComparison: z.array(FeatureComparisonRowSchema),
})

const ServiceBenefitSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  highlight: z.boolean(),
})

const CoverageInfoSchema = z.object({
  id: z.string(),
  icon: z.string(),
  title: z.string(),
  description: z.string(),
  locations: z.array(z.string()).optional(),
  nationwide: z.boolean(),
})

const FAQItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
})

const EconomyCalculatorDataSchema = z.object({
  averagePrices: z.object({
    daily: z.object({
      avulso: z.number(),
      subscription: z.number(),
    }),
    weekly: z.object({
      avulso: z.number(),
      subscription: z.number(),
    }),
    monthly: z.object({
      avulso: z.number(),
      subscription: z.number(),
    }),
  }),
  usagePatterns: z.object({
    occasional: z.object({
      daysPerMonth: z.number(),
      multiplier: z.number(),
    }),
    regular: z.object({
      daysPerMonth: z.number(),
      multiplier: z.number(),
    }),
    daily: z.object({
      daysPerMonth: z.number(),
      multiplier: z.number(),
    }),
  }),
})

const PricingConfigSchema = z.object({
  plans: z.array(PricingPlanSchema),
  featureComparison: FeatureComparisonSchema,
  serviceBenefits: z.array(ServiceBenefitSchema),
  coverageInfo: z.array(CoverageInfoSchema),
  faq: z.array(FAQItemSchema),
  economyCalculator: EconomyCalculatorDataSchema,
})

// ============================================================================
// 6. SEO METADATA (Fase 3 - Basic)
// ============================================================================
const SEOConfigSchema = z.object({
  defaultTitle: z.string(),
  titleTemplate: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
  openGraph: z.object({
    type: z.string(),
    siteName: z.string(),
    images: z.array(z.object({
      url: z.string(),
      width: z.number(),
      height: z.number(),
      alt: z.string(),
    })),
  }),
  twitter: z.object({
    card: z.string(),
    site: z.string().optional(),
    creator: z.string().optional(),
  }),
})

// ============================================================================
// 7. FEATURE FLAGS
// ============================================================================
const FeatureFlagsSchema = z.object({
  useCentralizedConfig: z.boolean(),
  useCentralizedCopy: z.boolean(),
  useCentralizedPricing: z.boolean(),
  useCentralizedSEO: z.boolean(),
})

// ============================================================================
// ROOT CONFIG SCHEMA (MVP + Fase 2 + Fase 3)
// ============================================================================
export const ConfigSchema = z.object({
  site: SiteConfigSchema,
  i18n: I18nConfigSchema,
  menus: MenusSchema,
  copy: LocalizedCopySchema,
  pricing: PricingConfigSchema,
  seo: SEOConfigSchema,
  featureFlags: FeatureFlagsSchema,
})

export type AppConfig = z.infer<typeof ConfigSchema>
