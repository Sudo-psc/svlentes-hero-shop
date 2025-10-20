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
  highlight: z.boolean().default(false),
})
const CoverageInfoSchema = z.object({
  id: z.string(),
  icon: z.string(),
  title: z.string(),
  description: z.string(),
  locations: z.array(z.string()).optional(),
  nationwide: z.boolean().default(false),
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
// 7. MEDICAL DATA (Fase 4)
// ============================================================================
const DoctorContactSchema = z.object({
  whatsapp: z.string(),
  email: z.string().email(),
  clinicAddress: z.string(),
})
const DoctorSocialProofSchema = z.object({
  patientsServed: z.string(),
  satisfactionRate: z.string(),
  consultationsPerformed: z.string(),
})
const DoctorSchema = z.object({
  name: z.string(),
  crm: z.string(),
  crmEquipe: z.string(),
  specialty: z.string(),
  photo: z.string(),
  credentials: z.array(z.string()),
  experience: z.string(),
  bio: z.string(),
  contact: DoctorContactSchema,
  socialProof: DoctorSocialProofSchema,
})
const ClinicAddressSchema = z.object({
  street: z.string(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string(),
})
const ClinicContactSchema = z.object({
  phone: z.string(),
  whatsapp: z.string(),
  email: z.string().email(),
  website: z.string().url(),
})
const ClinicBusinessHoursSchema = z.object({
  weekdays: z.string(),
  saturday: z.string(),
  sunday: z.string(),
  emergency: z.string(),
})
const ClinicCoverageSchema = z.object({
  area: z.string(),
  shipping: z.string(),
  consultation: z.string(),
})
const ClinicSchema = z.object({
  name: z.string(),
  fullName: z.string(),
  cnpj: z.string(),
  address: ClinicAddressSchema,
  contact: ClinicContactSchema,
  businessHours: ClinicBusinessHoursSchema,
  coverage: ClinicCoverageSchema,
})
const TrustBadgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  verified: z.boolean().default(false),
})
const CertificationSchema = z.object({
  id: z.string(),
  name: z.string(),
  institution: z.string(),
  year: z.string().optional(),
  number: z.string().optional(),
  verified: z.boolean().default(false),
})
const SocialProofStatSchema = z.object({
  id: z.string(),
  value: z.string(),
  label: z.string(),
  icon: z.string(),
})
const HighlightSchema = z.object({
  id: z.string(),
  text: z.string(),
  description: z.string(),
  icon: z.string(),
  featured: z.boolean().default(false),
})
const TrustSchema = z.object({
  badges: z.array(TrustBadgeSchema),
  certifications: z.array(CertificationSchema),
  socialProofStats: z.array(SocialProofStatSchema),
  highlights: z.array(HighlightSchema),
})
const MedicalConfigSchema = z.object({
  doctor: DoctorSchema,
  clinic: ClinicSchema,
  trust: TrustSchema,
})
// ============================================================================
// 8. ANALYTICS & TRACKING (Fase 4)
// ============================================================================
const GAConsentSchema = z.object({
  analytics_storage: z.enum(['granted', 'denied']),
  ad_storage: z.enum(['granted', 'denied']),
})
const GACustomDimensionsSchema = z.object({
  plan_type: z.string(),
  billing_interval: z.string(),
})
const GAFeaturesSchema = z.object({
  pageTracking: z.boolean().default(false),
  scrollTracking: z.boolean().default(false),
  sessionRecording: z.boolean().default(false),
  enhancedEcommerce: z.boolean().default(false),
})
const GoogleAnalyticsSchema = z.object({
  enabled: z.boolean().default(false),
  measurementId: z.string(),
  consent: GAConsentSchema,
  customDimensions: GACustomDimensionsSchema,
  features: GAFeaturesSchema,
})
const ConversionEventSchema = z.object({
  event: z.string(),
  category: z.string(),
  label: z.string(),
  value: z.number(),
})
const MonitoringThresholdsSchema = z.object({
  pageLoadTime: z.number(),
  interactionDelay: z.number(),
})
const VitalsSchema = z.object({
  LCP: z.number(),
  FID: z.number(),
  CLS: z.number(),
})
const MonitoringSchema = z.object({
  errorTracking: z.boolean().default(false),
  performanceMetrics: z.boolean().default(false),
  thresholds: MonitoringThresholdsSchema,
  vitals: VitalsSchema,
})
const AnalyticsConfigSchema = z.object({
  googleAnalytics: GoogleAnalyticsSchema,
  conversionEvents: z.array(ConversionEventSchema),
  monitoring: MonitoringSchema,
})
// ============================================================================
// 9. PRIVACY & COMPLIANCE (Fase 4)
// ============================================================================
const CookieConsentSchema = z.object({
  essential: z.boolean().default(false),
  analytics: z.string(),
  marketing: z.string(),
})
const LGPDSchema = z.object({
  enabled: z.boolean().default(false),
  consentRequired: z.boolean().default(false),
  dataRetentionDays: z.number(),
  cookieConsent: CookieConsentSchema,
  dataSubjectRights: z.array(z.string()),
})
const PrivacyConfigSchema = z.object({
  lgpd: LGPDSchema,
})
// ============================================================================
// 10. FEATURE FLAGS
// ============================================================================
const FeatureFlagsSchema = z.object({
  useCentralizedConfig: z.boolean().default(false),
  useCentralizedCopy: z.boolean().default(false),
  useCentralizedPricing: z.boolean().default(false),
  useCentralizedSEO: z.boolean().default(false),
  useCentralizedMedical: z.boolean().default(false),
  useCentralizedAnalytics: z.boolean().default(false),
  useCentralizedPrivacy: z.boolean().default(false),
  usePricingAsfericos: z.boolean().default(false),
  usePricingToricos: z.boolean().default(false),
})
// ============================================================================
// 11. PRICING ASFÉRICOS (Fase 4 - Enhanced)
// ============================================================================
const PricingAsfericosSchema = z.object({
  // Schema flexível para planos asféricos - validação básica
}).catchall(z.any()) // Permite qualquer estrutura interna por enquanto
// ============================================================================
// 12. PRICING TÓRICOS (Fase 4 - Enhanced)
// ============================================================================
const PricingToricosSchema = z.object({
  // Schema flexível para planos tóricos - validação básica
}).catchall(z.any()) // Permite qualquer estrutura interna por enquanto
// ============================================================================
// ROOT CONFIG SCHEMA (MVP + Fase 2 + Fase 3 + Fase 4)
// ============================================================================
export const ConfigSchema = z.object({
  site: SiteConfigSchema,
  i18n: I18nConfigSchema,
  menus: MenusSchema,
  copy: LocalizedCopySchema,
  pricing: PricingConfigSchema,
  pricing_asfericos: PricingAsfericosSchema.optional(),
  pricing_toricos: PricingToricosSchema.optional(),
  seo: SEOConfigSchema,
  medical: MedicalConfigSchema,
  analytics: AnalyticsConfigSchema,
  privacy: PrivacyConfigSchema,
  featureFlags: FeatureFlagsSchema,
})
export type AppConfig = z.infer<typeof ConfigSchema>