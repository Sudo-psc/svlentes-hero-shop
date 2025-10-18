# Plano de Centralização de Configuração - Parte 2

**Continuação de**: CENTRALIZACAO_CONFIGURACAO_PLANO.md

---

## C) Camada de Acesso (Classes/Objetos)

### ConfigService (Singleton)

```typescript
// config/loader.ts
import { readFileSync, watch } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import { ConfigSchema, type AppConfig } from './schema'
import crypto from 'crypto'

class ConfigService {
  private static instance: ConfigService
  private config: AppConfig | null = null
  private configHash: string = ''
  private watchers: (() => void)[] = []

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService()
    }
    return ConfigService.instance
  }

  /**
   * Load and validate configuration
   * @param environment - 'development' | 'staging' | 'production'
   * @param enableHotReload - Enable file watching in development
   */
  load(environment: string = process.env.NODE_ENV || 'development', enableHotReload: boolean = false): AppConfig {
    try {
      // 1. Load base config
      const basePath = join(process.cwd(), 'config', 'base.yaml')
      const baseContent = readFileSync(basePath, 'utf-8')
      const baseConfig = parse(baseContent)

      // 2. Load environment-specific config
      const envPath = join(process.cwd(), 'config', `${environment}.yaml`)
      let envConfig = {}
      try {
        const envContent = readFileSync(envPath, 'utf-8')
        envConfig = parse(envContent)
      } catch (error) {
        console.warn(`No environment config found for ${environment}, using base only`)
      }

      // 3. Deep merge configs
      const merged = this.deepMerge(baseConfig, envConfig)

      // 4. Interpolate environment variables
      const interpolated = this.interpolateEnvVars(merged)

      // 5. Validate with Zod
      const validated = ConfigSchema.parse(interpolated)

      // 6. Generate hash for cache invalidation
      this.configHash = crypto.createHash('md5').update(JSON.stringify(validated)).digest('hex')

      this.config = validated

      // 7. Setup hot reload in development
      if (enableHotReload && environment === 'development') {
        this.setupHotReload(basePath, envPath)
      }

      console.log(`[ConfigService] Loaded config for ${environment} (hash: ${this.configHash.substring(0, 8)})`)

      return this.config
    } catch (error) {
      console.error('[ConfigService] Failed to load config:', error)
      throw new Error(`Configuration validation failed: ${error}`)
    }
  }

  /**
   * Get current configuration
   */
  get(): AppConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.')
    }
    return this.config
  }

  /**
   * Get configuration hash for cache invalidation
   */
  getHash(): string {
    return this.configHash
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    if (typeof target !== 'object' || typeof source !== 'object') {
      return source
    }

    const result = { ...target }

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }

    return result
  }

  /**
   * Interpolate environment variables in config
   * Replaces ${VAR_NAME} with process.env.VAR_NAME
   */
  private interpolateEnvVars(obj: any): any {
    if (typeof obj === 'string') {
      return obj.replace(/\$\{([^}]+)\}/g, (_, varName) => {
        return process.env[varName] || ''
      })
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateEnvVars(item))
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: any = {}
      for (const key in obj) {
        result[key] = this.interpolateEnvVars(obj[key])
      }
      return result
    }

    return obj
  }

  /**
   * Setup hot reload for development
   */
  private setupHotReload(basePath: string, envPath: string): void {
    const handleChange = (path: string) => {
      console.log(`[ConfigService] Detected change in ${path}, reloading...`)
      try {
        this.load(process.env.NODE_ENV || 'development', false)
        this.watchers.forEach(fn => fn())
        console.log('[ConfigService] Hot reload successful')
      } catch (error) {
        console.error('[ConfigService] Hot reload failed:', error)
      }
    }

    watch(basePath, () => handleChange(basePath))
    watch(envPath, () => handleChange(envPath))
  }

  /**
   * Subscribe to config changes (hot reload)
   */
  onChange(callback: () => void): () => void {
    this.watchers.push(callback)
    return () => {
      this.watchers = this.watchers.filter(fn => fn !== callback)
    }
  }

  /**
   * Translate function with i18n fallback
   * @param locale - Locale code (e.g., 'pt-BR', 'en-US')
   * @param key - Dot-notation key (e.g., 'hero.title', 'common.cta.primary')
   * @param fallbackStrategy - 'strict' | 'soft'
   */
  t(locale: string, key: string, fallbackStrategy: 'strict' | 'soft' = 'soft'): string {
    const config = this.get()
    const keys = key.split('.')
    let value: any = config.copy[locale]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Key not found in locale
        if (fallbackStrategy === 'strict') {
          throw new Error(`Translation key "${key}" not found for locale "${locale}"`)
        } else {
          // Fallback to default locale
          const defaultLocale = config.i18n.defaultLocale
          if (locale !== defaultLocale) {
            console.warn(`[ConfigService] Key "${key}" not found for locale "${locale}", falling back to ${defaultLocale}`)
            return this.t(defaultLocale, key, 'strict')
          } else {
            console.warn(`[ConfigService] Key "${key}" not found, returning key as-is`)
            return key
          }
        }
      }
    }

    return typeof value === 'string' ? value : key
  }

  /**
   * Get menu by locale and area
   */
  getMenu(locale: string, area: 'header' | 'footer'): any {
    const config = this.get()
    // Future: support locale-specific menus
    // For now, menus are language-agnostic (defined in base config)
    return config.menus[area]
  }

  /**
   * Get plans with locale-specific formatting
   */
  getPlans(locale: string): any[] {
    const config = this.get()
    return config.plans.plans.map(plan => ({
      ...plan,
      priceFormatted: {
        monthly: config.plans.displayFormat.monthly.replace('{price}', plan.price.monthly.toFixed(2)),
        annual: config.plans.displayFormat.annual.replace('{price}', plan.price.annual.toFixed(2)),
      },
    }))
  }

  /**
   * Get theme tokens for CSS generation
   */
  getThemeTokens(): any {
    return this.get().theme.tokens
  }

  /**
   * Format price with locale and currency
   */
  formatPrice(amount: number, locale: string, currency: string = 'BRL'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount)
  }
}

export const config = ConfigService.getInstance()
```

### PlanService

```typescript
// config/services/plan-service.ts
import { config } from '../loader'
import type { AppConfig } from '../schema'

export class PlanService {
  private config: AppConfig

  constructor() {
    this.config = config.get()
  }

  /**
   * Get all plans with period toggle (monthly/yearly)
   */
  getPlans(period: 'monthly' | 'annual' = 'monthly', locale: string = 'pt-BR') {
    return this.config.plans.plans.map(plan => {
      const price = period === 'monthly' ? plan.price.monthly : plan.price.annual
      const formatted = config.formatPrice(price, locale, plan.price.currency)

      // Calculate annual discount
      const monthlyTotal = plan.price.monthly * 12
      const annualSavings = monthlyTotal - plan.price.annual
      const discountPercentage = (annualSavings / monthlyTotal) * 100

      return {
        ...plan,
        currentPrice: price,
        currentPriceFormatted: formatted,
        period,
        annualDiscount: period === 'annual' ? {
          savings: annualSavings,
          savingsFormatted: config.formatPrice(annualSavings, locale, plan.price.currency),
          percentage: discountPercentage.toFixed(0),
        } : null,
      }
    })
  }

  /**
   * Get plan by ID
   */
  getPlanById(id: string) {
    return this.config.plans.plans.find(plan => plan.id === id)
  }

  /**
   * Get recommended plan
   */
  getRecommendedPlan() {
    return this.config.plans.plans.find(plan => plan.recommended)
  }
}
```

### buildCssVars() for Theme Tokens

```typescript
// config/services/theme-service.ts
import { config } from '../loader'
import type { AppConfig } from '../schema'

export class ThemeService {
  /**
   * Build CSS custom properties from theme tokens
   * Output: CSS variables string for injection into :root
   */
  buildCssVars(): string {
    const tokens = config.getThemeTokens()
    const cssVars: string[] = []

    // Colors
    Object.entries(tokens.colors).forEach(([colorName, shades]) => {
      Object.entries(shades as Record<string, string>).forEach(([shade, value]) => {
        cssVars.push(`  --color-${colorName}-${shade}: ${value};`)
      })
    })

    // Typography - Font Families
    Object.entries(tokens.typography.fontFamily).forEach(([key, fonts]) => {
      cssVars.push(`  --font-${key}: ${(fonts as string[]).join(', ')};`)
    })

    // Spacing
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      cssVars.push(`  --spacing-${key}: ${value};`)
    })

    // Border Radius
    Object.entries(tokens.borderRadius).forEach(([key, value]) => {
      const varName = key === 'DEFAULT' ? 'radius' : `radius-${key}`
      cssVars.push(`  --${varName}: ${value};`)
    })

    // Shadows
    Object.entries(tokens.shadows).forEach(([key, value]) => {
      const varName = key === 'DEFAULT' ? 'shadow' : `shadow-${key}`
      cssVars.push(`  --${varName}: ${value};`)
    })

    return `:root {\n${cssVars.join('\n')}\n}`
  }

  /**
   * Build Tailwind theme configuration from tokens
   * For use in tailwind.config.js
   */
  buildTailwindTheme() {
    const tokens = config.getThemeTokens()

    return {
      colors: this.convertColorsToTailwind(tokens.colors),
      fontFamily: tokens.typography.fontFamily,
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadows,
      fontSize: this.convertFontSizeToTailwind(tokens.typography.fontSize),
    }
  }

  private convertColorsToTailwind(colors: any) {
    const result: any = {}
    Object.entries(colors).forEach(([name, shades]) => {
      result[name] = shades
    })
    return result
  }

  private convertFontSizeToTailwind(fontSize: any) {
    const result: any = {}
    Object.entries(fontSize).forEach(([key, value]) => {
      const [size, props] = value as [string, any]
      result[key] = [size, props]
    })
    return result
  }
}

export const themeService = new ThemeService()
```

---

## D) Integração com Build e Estilo

### Tailwind Config Integrado

```javascript
// tailwind.config.js
const { themeService } = require('./config/services/theme-service')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Load theme from config
      ...themeService.buildTailwindTheme(),

      // Additional Tailwind-specific config
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### Injeção de CSS Vars no Layout

```typescript
// src/app/layout.tsx
import { config } from '@/config/loader'
import { themeService } from '@/config/services/theme-service'

// Load config at build time (or server startup for SSR)
config.load(process.env.NODE_ENV || 'production')

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeService.buildCssVars() }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### Dark Mode Strategy (CSS Vars)

```css
/* src/app/globals.css */
:root {
  /* Light mode - loaded from config via buildCssVars() */
  /* Example output:
  --color-primary-500: #06b6d4;
  --font-sans: Inter, system-ui, sans-serif;
  */
}

[data-theme="dark"] {
  /* Dark mode overrides */
  --color-primary-500: #22d3ee;
  --background: #0f172a;
  --foreground: #f8fafc;
}
```

### SSR/ISR Cache Invalidation

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { config } from './config/loader'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add config hash to headers for cache busting
  response.headers.set('X-Config-Hash', config.getHash())

  // ETag for client-side cache validation
  response.headers.set('ETag', `"config-${config.getHash()}"`)

  return response
}
```

---

## E) Plano de Migração e Rollout

### Passo a Passo Detalhado

#### Etapa 1: Descoberta e Inventário (2-3 horas)

**Objetivo**: Mapear todos os locais com conteúdo a centralizar.

**Ações**:
```bash
# 1. Buscar strings hardcoded em JSX
grep -r "Assine agora" src/
grep -r "Fale conosco" src/
grep -r "+5533" src/

# 2. Listar arquivos em src/data/
ls -la src/data/

# 3. Identificar metadata dispersa
grep -r "export const metadata" src/app/

# 4. Localizar menus hardcoded
grep -r "href=" src/components/layout/

# 5. Encontrar referências ao Dr. Philipe
grep -r "Philipe" src/
```

**Deliverable**: `claudedocs/INVENTORY.md` com:
- Lista de strings hardcoded por arquivo
- Estruturas de dados em `src/data/`
- Metadata por página
- Menus por componente

#### Etapa 2: Criação do config.yaml (3-4 horas)

**Objetivo**: Criar configuração centralizada com todos os dados mapeados.

**Ações**:
1. Criar `config/base.yaml` com estrutura completa
2. Migrar dados de `src/data/*.ts` para YAML
3. Extrair strings hardcoded e adicionar em `copy.pt-BR`
4. Definir menus centralizados
5. Consolidar informações do Dr. Philipe em seção `doctor`

**Validação**:
```bash
# Validar YAML syntax
npm install -g yaml-validator
yaml-validator config/base.yaml
```

#### Etapa 3: Implementação da Camada de Acesso (4-6 horas)

**Objetivo**: Criar ConfigService, PlanService, ThemeService.

**Ações**:
1. Implementar `config/schema.ts` (Zod schemas)
2. Implementar `config/loader.ts` (ConfigService)
3. Implementar `config/services/plan-service.ts`
4. Implementar `config/services/theme-service.ts`
5. Escrever testes unitários para cada service

**Testes**:
```typescript
// __tests__/config/loader.test.ts
import { config } from '@/config/loader'

describe('ConfigService', () => {
  it('should load base config', () => {
    const cfg = config.load('development')
    expect(cfg).toBeDefined()
    expect(cfg.site.name).toBe('SV Lentes')
  })

  it('should validate config with Zod', () => {
    expect(() => config.load('development')).not.toThrow()
  })

  it('should interpolate env vars', () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'
    const cfg = config.load('development')
    expect(cfg.tracking.googleAnalytics.measurementId).toBe('G-TEST123')
  })
})
```

#### Etapa 4: Refactor Incremental por Domínio (10-15 horas)

**Ordem de Prioridade**:

1. **Menus** (2h) - Baixo risco, alto impacto visual
   - Refatorar `Header.tsx` para usar `config.getMenu('pt-BR', 'header')`
   - Refatorar `Footer.tsx` para usar `config.getMenu('pt-BR', 'footer')`

2. **Copy/Textos** (3h) - Médio risco, prepara i18n
   - Refatorar `HeroSection.tsx` para usar `config.t('pt-BR', 'hero.title')`
   - Refatorar CTAs para usar `config.t('pt-BR', 'common.cta.primary')`

3. **Planos/Pricing** (3h) - Alto impacto, crítico para negócio
   - Refatorar `PricingSection.tsx` para usar `planService.getPlans('monthly', 'pt-BR')`
   - Adicionar toggle mensal/anual com recálculo automático

4. **SEO/Metadata** (2h) - Baixo risco, alta consistência
   - Refatorar `layout.tsx` para usar `config.get().seo.defaults`
   - Refatorar `page.tsx` metadata para usar `config.get().seo.pages.home`

5. **Tema/Tokens** (2h) - Build-time, zero impacto em runtime
   - Integrar `themeService.buildTailwindTheme()` em `tailwind.config.js`
   - Injetar CSS vars em `layout.tsx`

**Template de Refactor**:

```typescript
// ANTES:
export function HeroSection() {
  return (
    <section>
      <h1>Lentes de Contato por Assinatura</h1>
      <button>Assine Agora</button>
    </section>
  )
}

// DEPOIS:
import { config } from '@/config/loader'

export function HeroSection() {
  const t = (key: string) => config.t('pt-BR', key)

  return (
    <section>
      <h1>{t('hero.title')}</h1>
      <button>{t('common.cta.primary')}</button>
    </section>
  )
}
```

#### Etapa 5: Testes e Validação (4-6 horas)

**Unit Tests**:
- ConfigService: load, validate, t(), getMenu(), getPlans()
- PlanService: getPlans(), getPlanById(), annual discount calculation
- ThemeService: buildCssVars(), buildTailwindTheme()

**Snapshot Tests**:
```typescript
// __tests__/config/snapshot.test.ts
import { config } from '@/config/loader'

describe('Config Snapshot', () => {
  it('should match config snapshot', () => {
    const cfg = config.load('production')
    expect(cfg).toMatchSnapshot()
  })
})
```

**E2E Tests**:
```typescript
// e2e/config-integration.spec.ts
import { test, expect } from '@playwright/test'

test('should display correct plan prices', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Planos')

  // Verify plan from config is displayed
  await expect(page.locator('[data-plan="padrao"] .price')).toContainText('R$ 119,00')
})
```

**i18n Fallback Tests**:
```typescript
test('should fallback to default locale on missing key', () => {
  const result = config.t('en-US', 'hero.nonexistent')
  expect(result).toBe('hero.nonexistent') // Key returned as-is (soft fallback)
})
```

#### Etapa 6: Feature Flag e Rollout Gradual (1-2 horas)

**Feature Flag**:
```yaml
# config/base.yaml
featureFlags:
  useCentralizedConfig: false # Start disabled
```

**Gradual Activation**:
```typescript
// src/components/sections/HeroSection.tsx
import { config } from '@/config/loader'

export function HeroSection() {
  const useCentralized = config.get().featureFlags.useCentralizedConfig

  if (useCentralized) {
    // New centralized config flow
    return <HeroSectionV2 />
  } else {
    // Legacy hardcoded flow
    return <HeroSectionV1 />
  }
}
```

**Rollout Plan**:
1. Deploy com flag `useCentralizedConfig: false`
2. Ativar em staging: `useCentralizedConfig: true` em `config/staging.yaml`
3. Monitorar por 24h (erros, performance, UX)
4. Ativar em 10% prod (A/B test via Vercel ou feature flag service)
5. Se OK → 50% → 100%
6. Remover código legacy após 1 semana de 100%

#### Etapa 7: Monitoramento e Ajustes (Contínuo)

**Métricas**:
- Erros de i18n (chaves ausentes): Log no console + Sentry
- Performance: Lighthouse CI (antes/depois)
- SEO: Compare `<head>` metadata antes/depois
- Visual regression: Percy ou Chromatic

**Dashboard de Monitoramento**:
```typescript
// src/app/api/admin/config-health/route.ts
export async function GET() {
  const cfg = config.get()

  return Response.json({
    hash: config.getHash(),
    version: '1.0.0',
    locale: cfg.i18n.defaultLocale,
    plansCount: cfg.plans.plans.length,
    featureFlags: cfg.featureFlags,
    lastReload: new Date().toISOString(),
  })
}
```

### Critérios de Aceite

| Critério | Validação |
|----------|-----------|
| **Nenhum erro de i18n** | Console limpo, sem warnings de chaves ausentes |
| **DOM diff mínimo** | Percy/Chromatic: 0 visual regressions |
| **CLS/LCP inalterados** | Lighthouse CI: variação <5% |
| **Testes passando** | Jest: 100% testes verdes, Playwright: 100% |
| **Build sem erros** | `npm run build` sucesso |
| **Config válido** | Zod validation sem throws |

---

## F) Testes e Qualidade

### Testes Zod de Validação

```typescript
// __tests__/config/validation.test.ts
import { ConfigSchema } from '@/config/schema'

describe('Config Validation', () => {
  it('should validate valid config', () => {
    const validConfig = {
      site: { name: 'SV Lentes', url: 'https://svlentes.com.br', /* ... */ },
      i18n: { defaultLocale: 'pt-BR', locales: ['pt-BR'], fallback: 'soft' },
      // ... resto da config
    }

    expect(() => ConfigSchema.parse(validConfig)).not.toThrow()
  })

  it('should reject invalid whatsapp format', () => {
    const invalidConfig = {
      doctor: {
        contact: {
          whatsapp: '33999898026', // Missing +55 prefix
        },
      },
    }

    expect(() => ConfigSchema.parse(invalidConfig)).toThrow(/whatsapp/)
  })

  it('should reject SEO description >160 chars', () => {
    const invalidConfig = {
      seo: {
        defaults: {
          description: 'a'.repeat(161), // Too long
        },
      },
    }

    expect(() => ConfigSchema.parse(invalidConfig)).toThrow(/description/)
  })
})
```

### Snapshot Tests

```typescript
// __tests__/config/snapshot.test.ts
import { config } from '@/config/loader'

test('production config snapshot', () => {
  const cfg = config.load('production', false)
  expect(cfg).toMatchSnapshot()
})

test('staging config snapshot', () => {
  const cfg = config.load('staging', false)
  expect(cfg).toMatchSnapshot()
})
```

### Testes de i18n Fallback

```typescript
// __tests__/config/i18n.test.ts
import { config } from '@/config/loader'

describe('i18n Fallback', () => {
  beforeAll(() => {
    config.load('development')
  })

  it('should return key for missing translation (soft fallback)', () => {
    const result = config.t('en-US', 'nonexistent.key', 'soft')
    expect(result).toBe('nonexistent.key')
  })

  it('should throw for missing translation (strict fallback)', () => {
    expect(() => {
      config.t('en-US', 'nonexistent.key', 'strict')
    }).toThrow(/not found/)
  })

  it('should fallback to default locale', () => {
    // Key exists in pt-BR but not in en-US
    const result = config.t('en-US', 'hero.title', 'soft')
    expect(result).toBe('Lentes de Contato por Assinatura') // pt-BR value
  })
})
```

### Testes de Planos (Formatação, Período, Moeda)

```typescript
// __tests__/config/plans.test.ts
import { PlanService } from '@/config/services/plan-service'

describe('PlanService', () => {
  let service: PlanService

  beforeAll(() => {
    service = new PlanService()
  })

  it('should format prices correctly', () => {
    const plans = service.getPlans('monthly', 'pt-BR')
    expect(plans[0].currentPriceFormatted).toMatch(/R\$.*89,00/)
  })

  it('should calculate annual discount', () => {
    const plans = service.getPlans('annual', 'pt-BR')
    const basicPlan = plans.find(p => p.id === 'basico')!

    expect(basicPlan.annualDiscount).toBeDefined()
    expect(basicPlan.annualDiscount!.savings).toBe(89 * 12 - 979) // 1068 - 979 = 89
  })

  it('should handle period toggle', () => {
    const monthly = service.getPlans('monthly', 'pt-BR')
    const annual = service.getPlans('annual', 'pt-BR')

    expect(monthly[0].currentPrice).toBe(89)
    expect(annual[0].currentPrice).toBe(979)
  })
})
```

### Linters/CI Checks

```yaml
# .github/workflows/config-validation.yml
name: Config Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Validate YAML syntax
        run: |
          npm install -g yaml-validator
          yaml-validator config/*.yaml

      - name: Validate with Zod
        run: npm run test -- config/validation.test.ts

      - name: Check schema drift
        run: |
          # Ensure config/schema.ts is in sync with base.yaml
          npm run validate:schema
```

---

*Continua na próxima mensagem com G, H, I e estimativas...*
