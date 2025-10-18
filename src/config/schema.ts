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
// 4. FEATURE FLAGS
// ============================================================================
const FeatureFlagsSchema = z.object({
  useCentralizedConfig: z.boolean(),
})

// ============================================================================
// ROOT CONFIG SCHEMA (MVP)
// ============================================================================
export const ConfigSchema = z.object({
  site: SiteConfigSchema,
  i18n: I18nConfigSchema,
  menus: MenusSchema,
  featureFlags: FeatureFlagsSchema,
})

export type AppConfig = z.infer<typeof ConfigSchema>
