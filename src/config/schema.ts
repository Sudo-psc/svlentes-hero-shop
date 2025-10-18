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
// 5. FEATURE FLAGS
// ============================================================================
const FeatureFlagsSchema = z.object({
  useCentralizedConfig: z.boolean(),
  useCentralizedCopy: z.boolean(),
})

// ============================================================================
// ROOT CONFIG SCHEMA (MVP + Fase 2)
// ============================================================================
export const ConfigSchema = z.object({
  site: SiteConfigSchema,
  i18n: I18nConfigSchema,
  menus: MenusSchema,
  copy: LocalizedCopySchema,
  featureFlags: FeatureFlagsSchema,
})

export type AppConfig = z.infer<typeof ConfigSchema>
