# Plano de Centralização de Configuração - Parte 3 (Final)

**Continuação de**: CENTRALIZACAO_CONFIGURACAO_PARTE2.md

---

## G) Riscos e Mitigação

### 1. Exposição de Segredos

**Risco**: API keys ou tokens no config YAML visível no client.

**Mitigação**:
```yaml
# ❌ NUNCA fazer isso:
tracking:
  googleAnalytics:
    apiKey: "AIza..." # EXPOSTO!

# ✅ Correto:
tracking:
  googleAnalytics:
    measurementId: "${NEXT_PUBLIC_GA_MEASUREMENT_ID}" # Interpolado de env
```

**Regras**:
- ✅ Secrets ficam em `.env.local` (git-ignored)
- ✅ Config YAML usa interpolação `${VAR_NAME}`
- ✅ Prefix `NEXT_PUBLIC_` apenas para valores safe no client
- ✅ Server-side secrets: nunca expor no config acessível ao client

**Checklist de Segurança**:
```bash
# Verificar se há secrets hardcoded no YAML
grep -E "(api_key|secret|password|token)" config/*.yaml

# CI check
npm run lint:secrets
```

### 2. Divergência Tema CSS vs. Config

**Risco**: Tokens em `tailwind.config.js` diferentes de `config/base.yaml`.

**Mitigação**:

**Opção A: Config como Fonte Única de Verdade**
```javascript
// tailwind.config.js
const { themeService } = require('./config/services/theme-service')

module.exports = {
  theme: {
    extend: themeService.buildTailwindTheme(),
  },
}
```

**Opção B: CI Check de Divergência**
```typescript
// scripts/validate-theme-sync.ts
import { config } from './config/loader'
import tailwindConfig from './tailwind.config.js'

const configColors = config.getThemeTokens().colors
const tailwindColors = tailwindConfig.theme.extend.colors

// Compare and error if mismatch
if (JSON.stringify(configColors) !== JSON.stringify(tailwindColors)) {
  throw new Error('Theme divergence detected between config.yaml and tailwind.config.js')
}
```

**Governança**:
- 🔒 **Single Source**: Config YAML → gera Tailwind config
- 📝 **Documentation**: README.md explica que editar tokens = editar YAML
- ✅ **CI Enforcement**: `npm run build` valida sincronização

### 3. Regressões de SEO

**Risco**: Metadata alterada acidentalmente causa queda no ranking.

**Mitigação**:

**Checklist por Página**:
```typescript
// __tests__/seo/metadata-regression.test.ts
import { config } from '@/config/loader'

describe('SEO Regression Tests', () => {
  const criticalPages = ['home', 'assinar', 'calculadora', 'area-assinante']

  criticalPages.forEach(page => {
    it(`should have valid SEO for ${page}`, () => {
      const seo = config.get().seo.pages[page]

      expect(seo.title).toBeTruthy()
      expect(seo.description.length).toBeGreaterThanOrEqual(50)
      expect(seo.description.length).toBeLessThanOrEqual(160)
      expect(seo.keywords?.length).toBeGreaterThan(0)
    })
  })
})
```

**Comparação Antes/Depois**:
```bash
# Snapshot de <head> antes da migração
npm run snapshot:head -- --output before.json

# Após migração
npm run snapshot:head -- --output after.json

# Diff
diff before.json after.json
```

**Lighthouse CI com Baseline**:
```yaml
# lighthouserc.json
{
  "ci": {
    "assert": {
      "assertions": {
        "seo-score": ["error", { "minScore": 0.95 }],
        "meta-description": "error"
      }
    }
  }
}
```

### 4. Dependência de CMS Externo

**Risco**: Parte do conteúdo vem de WordPress/Strapi, como mesclar com config?

**Estratégia de Merge**:

```typescript
// lib/content-merger.ts
import { config } from '@/config/loader'
import { fetchFromCMS } from '@/lib/wordpress/api'

export async function getMergedContent(page: string) {
  // 1. Get static config
  const staticConfig = config.get().seo.pages[page]

  // 2. Fetch dynamic CMS content
  const cmsContent = await fetchFromCMS(`/pages/${page}`)

  // 3. Merge com precedência: CMS > Config (para campos editáveis)
  return {
    title: cmsContent?.seo?.title || staticConfig.title,
    description: cmsContent?.seo?.description || staticConfig.description,
    keywords: [...staticConfig.keywords, ...(cmsContent?.seo?.keywords || [])],
  }
}
```

**Definir Campos Dinâmicos**:
```yaml
# config/base.yaml
# Comentário documenta o que é editável no CMS:

seo:
  pages:
    blog: # ⚠️ DINÂMICO: Títulos e descrições vêm do WordPress
      title: "Blog - SV Lentes" # Fallback se CMS falhar
      description: "Artigos sobre saúde ocular e lentes de contato"
```

---

## H) Exemplos de Código Essenciais

### 1. ConfigSchema (Zod) Completo

*(Já incluído na Parte 1, seção B)*

### 2. ConfigService Completo

*(Já incluído na Parte 2, seção C)*

### 3. buildCssVars() e Uso no Layout

```typescript
// config/services/theme-service.ts
export class ThemeService {
  buildCssVars(): string {
    const tokens = config.getThemeTokens()
    const cssVars: string[] = []

    // Colors
    Object.entries(tokens.colors).forEach(([colorName, shades]) => {
      Object.entries(shades as Record<string, string>).forEach(([shade, value]) => {
        cssVars.push(`  --color-${colorName}-${shade}: ${value};`)
      })
    })

    // Typography
    Object.entries(tokens.typography.fontFamily).forEach(([key, fonts]) => {
      cssVars.push(`  --font-${key}: ${(fonts as string[]).join(', ')};`)
    })

    // Spacing, radius, shadows
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      cssVars.push(`  --spacing-${key}: ${value};`)
    })
    Object.entries(tokens.borderRadius).forEach(([key, value]) => {
      const varName = key === 'DEFAULT' ? 'radius' : `radius-${key}`
      cssVars.push(`  --${varName}: ${value};`)
    })
    Object.entries(tokens.shadows).forEach(([key, value]) => {
      const varName = key === 'DEFAULT' ? 'shadow' : `shadow-${key}`
      cssVars.push(`  --${varName}: ${value};`)
    })

    return `:root {\n${cssVars.join('\n')}\n}`
  }
}
```

**Uso no Layout Global**:
```typescript
// src/app/layout.tsx
import { config } from '@/config/loader'
import { themeService } from '@/config/services/theme-service'

config.load(process.env.NODE_ENV || 'production')

export const metadata = {
  ...config.get().seo.defaults,
  title: config.get().seo.defaults.defaultTitle,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={config.get().i18n.defaultLocale}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeService.buildCssVars() }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

### 4. Exemplo de Uso em Componente

**Menu no Header**:
```typescript
// src/components/layout/Header.tsx
import { config } from '@/config/loader'
import Link from 'next/link'

export function Header() {
  const menu = config.getMenu('pt-BR', 'header')
  const t = (key: string) => config.t('pt-BR', key)

  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto flex items-center justify-between py-4">
        {/* Logo */}
        <Link href="/" className="text-2xl font-heading font-bold text-primary-600">
          {config.get().site.shortName}
        </Link>

        {/* Main Menu */}
        <ul className="flex gap-6">
          {menu.main.map((item: any) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`hover:text-primary-600 ${
                  item.highlighted ? 'text-primary-600 font-semibold' : ''
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        {menu.cta && (
          <Link href={menu.cta.href} className="btn btn-primary">
            {menu.cta.label}
          </Link>
        )}
      </nav>
    </header>
  )
}
```

**Hero Section com Copy**:
```typescript
// src/components/sections/HeroSection.tsx
import { config } from '@/config/loader'

export function HeroSection() {
  const t = (key: string) => config.t('pt-BR', key)

  return (
    <section className="bg-gradient-to-br from-primary-50 to-white py-20">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl font-heading font-bold text-gray-900">
          {t('hero.title')}
        </h1>
        <p className="text-2xl text-gray-700 mt-4">
          {t('hero.subtitle')}
        </p>
        <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
          {t('hero.description')}
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <button className="btn btn-primary btn-lg">
            {t('hero.cta')}
          </button>
          <button className="btn btn-secondary btn-lg">
            {t('hero.ctaSecondary')}
          </button>
        </div>
      </div>
    </section>
  )
}
```

**Plan Card com PlanService**:
```typescript
// src/components/pricing/PricingSection.tsx
import { useState } from 'react'
import { PlanService } from '@/config/services/plan-service'

export function PricingSection() {
  const planService = new PlanService()
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly')

  const plans = planService.getPlans(period, 'pt-BR')

  return (
    <section className="py-20">
      <div className="container mx-auto">
        {/* Period Toggle */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-6 py-2 ${period === 'monthly' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
          >
            Mensal
          </button>
          <button
            onClick={() => setPeriod('annual')}
            className={`px-6 py-2 ${period === 'annual' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
          >
            Anual
          </button>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map(plan => (
            <div key={plan.id} className="border rounded-lg p-6">
              {plan.badge && (
                <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-2xl font-bold mt-4">{plan.name}</h3>
              <p className="text-gray-600 mt-2">{plan.description}</p>

              {/* Price */}
              <div className="mt-6">
                <span className="text-4xl font-bold">{plan.currentPriceFormatted}</span>
                {period === 'annual' && plan.annualDiscount && (
                  <p className="text-green-600 mt-2">
                    Economize {plan.annualDiscount.savingsFormatted} ({plan.annualDiscount.percentage}%)
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="mt-6 space-y-2">
                {plan.features.map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button className="btn btn-primary w-full mt-8">
                {plan.ctaText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

### 5. Script CLI para Validar Config

```typescript
// scripts/validate-config.ts
import { config } from '../config/loader'
import { ConfigSchema } from '../config/schema'

async function validateConfig() {
  try {
    console.log('🔍 Validating configuration...')

    // Load config
    const cfg = config.load(process.env.NODE_ENV || 'production', false)

    // Validate with Zod
    ConfigSchema.parse(cfg)

    console.log('✅ Configuration is valid')
    console.log(`📊 Stats:`)
    console.log(`   - Locales: ${cfg.i18n.locales.join(', ')}`)
    console.log(`   - Plans: ${cfg.plans.plans.length}`)
    console.log(`   - Pages with SEO: ${Object.keys(cfg.seo.pages).length}`)
    console.log(`   - Feature flags: ${Object.keys(cfg.featureFlags).length}`)
    console.log(`   - Config hash: ${config.getHash()}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Configuration validation failed:')
    console.error(error)
    process.exit(1)
  }
}

validateConfig()
```

**Executar**:
```bash
npx ts-node scripts/validate-config.ts
```

**Adicionar ao package.json**:
```json
{
  "scripts": {
    "config:validate": "ts-node scripts/validate-config.ts",
    "prebuild": "npm run config:validate"
  }
}
```

---

## I) Checklist Operacional

### Padrão de Nomenclatura de Chaves i18n

**Convenção**: Dot notation hierárquica

```yaml
copy:
  pt-BR:
    # Estrutura: <área>.<componente>.<elemento>
    hero:
      title: "..." # hero.title
      subtitle: "..." # hero.subtitle
      cta: "..." # hero.cta

    common:
      cta:
        primary: "..." # common.cta.primary
        secondary: "..." # common.cta.secondary
      buttons:
        submit: "..." # common.buttons.submit

    forms:
      contact:
        labels:
          name: "..." # forms.contact.labels.name
        placeholders:
          name: "..." # forms.contact.placeholders.name
```

**Regras**:
- ✅ Lowercase com separador `.`
- ✅ Máximo 4 níveis: `área.componente.tipo.item`
- ✅ Plurais para listas: `forms.errors.required`
- ❌ Evitar abreviações: `btn` → `button`

### Versionamento do Config (Semver + CHANGELOG)

**Versão no Config**:
```yaml
# config/base.yaml
_meta:
  version: "1.2.0"
  lastUpdated: "2025-10-18"
  changelog: "config/CHANGELOG.md"
```

**CHANGELOG.md**:
```markdown
# Config Changelog

## [1.2.0] - 2025-10-18
### Added
- New feature flag: `enablePersonalization`
- Doctor social proof metrics

### Changed
- WhatsApp number: 3399898026 → 5533999898026
- Plan "Básico" price: R$ 79 → R$ 89

### Fixed
- SEO description for `/calculadora` (was 180 chars, now 155)

## [1.1.0] - 2025-10-10
### Added
- English locale support (`en-US`)
- Plan annual discount display
```

**Commit Message Format**:
```
config: [BREAKING] update pricing plans (v1.2.0)

- Increased Plano Básico monthly price from R$ 79 to R$ 89
- Updated annual plan discount calculation
- Adjusted plan descriptions for clarity

BREAKING CHANGE: PlanService.getPlans() now returns `annualDiscount` object
```

### Processo para Contribuintes Editarem Config

**PR Template** (`.github/PULL_REQUEST_TEMPLATE/config_change.md`):
```markdown
## Config Change Request

### Type of Change
- [ ] Content/Copy update
- [ ] Pricing change
- [ ] SEO metadata
- [ ] Theme/Design tokens
- [ ] Feature flag
- [ ] Other

### Changed Keys
List changed keys in dot notation:
- `plans.plans[0].price.monthly`
- `copy.pt-BR.hero.title`

### Reason for Change
Why is this change necessary?

### Validation Checklist
- [ ] Ran `npm run config:validate`
- [ ] No Zod validation errors
- [ ] Tested locally with changes
- [ ] Updated CHANGELOG.md
- [ ] Incremented version in `_meta.version`

### Screenshots (if visual change)
Before | After
```

**Branch Naming**:
```
config/update-pricing-plans
config/fix-whatsapp-number
config/add-en-translation
```

### Logs/Observabilidade

**Config Hash em Startup**:
```typescript
// src/app/layout.tsx
import { config } from '@/config/loader'

config.load(process.env.NODE_ENV || 'production')

console.log(`[Config] Loaded version ${config.get()._meta.version} (hash: ${config.getHash()})`)
```

**HTTP Header X-Config-Hash**:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set('X-Config-Hash', config.getHash())
  return response
}
```

**Verificar Hash Remotamente**:
```bash
curl -I https://svlentes.com.br | grep X-Config-Hash
# X-Config-Hash: a1b2c3d4
```

**Sentry Breadcrumb**:
```typescript
import * as Sentry from '@sentry/nextjs'
import { config } from '@/config/loader'

Sentry.addBreadcrumb({
  category: 'config',
  message: `Config loaded: version ${config.get()._meta.version}`,
  level: 'info',
  data: {
    hash: config.getHash(),
    locale: config.get().i18n.defaultLocale,
  },
})
```

---

## Estimativas de Esforço

### Breakdown por Etapa (em Story Points)

| Etapa | Descrição | Horas | Story Points (Fibonacci) |
|-------|-----------|-------|--------------------------|
| **1. Descoberta** | Inventário de conteúdo disperso | 2-3h | 2 |
| **2. Config YAML** | Criar base.yaml completo | 3-4h | 3 |
| **3. Camada de Acesso** | ConfigService, PlanService, ThemeService | 4-6h | 5 |
| **4. Refactor Menus** | Header.tsx, Footer.tsx | 2h | 2 |
| **5. Refactor Copy** | HeroSection, CTAs, etc. | 3h | 3 |
| **6. Refactor Planos** | PricingSection, PlanCard | 3h | 3 |
| **7. Refactor SEO** | layout.tsx, page metadata | 2h | 2 |
| **8. Refactor Tema** | Tailwind integration | 2h | 2 |
| **9. Testes** | Unit, snapshot, E2E | 4-6h | 5 |
| **10. Feature Flag** | Gradual rollout setup | 1-2h | 1 |
| **11. Monitoramento** | Logs, health endpoint | 1h | 1 |
| **12. Documentação** | README, CHANGELOG, PR template | 2h | 2 |
| **TOTAL** | - | **29-37h** | **31 pts** |

### Estimativa por Perfil

**Developer Sênior**: 3-4 sprints (2 semanas cada) = 6-8 semanas

**Developer Pleno**: 5-6 sprints = 10-12 semanas

**Developer Júnior**: 7-8 sprints = 14-16 semanas (com mentoria)

### Cronograma Recomendado (Developer Sênior)

```
Semana 1-2: Descoberta + Config YAML + Camada de Acesso
Semana 3-4: Refactor (Menus, Copy, Planos, SEO, Tema)
Semana 5-6: Testes + Feature Flag + Rollout Gradual
Semana 7-8: Monitoramento + Ajustes + Documentação
```

---

## Conclusão

Este plano fornece uma especificação completa e pragmática para centralizar a configuração do projeto SV Lentes em um modelo único, type-safe e versionado.

**Próximos Passos**:
1. ✅ Revisar e aprovar este plano com stakeholders
2. 📋 Criar issues/tasks no GitHub/Jira baseadas nas etapas
3. 🚀 Iniciar implementação seguindo a ordem de prioridade
4. 📊 Monitorar métricas e ajustar conforme necessário

**Benefícios Esperados**:
- 🎯 **Fonte única de verdade**: Fim da duplicação de conteúdo
- 🌐 **i18n-ready**: Preparado para expansão multi-idioma
- 🔧 **Manutenção simplificada**: Editar 1 arquivo vs. 24+ arquivos
- ✅ **Validação build-time**: Erros capturados antes do deploy
- 🚀 **Zero-downtime**: Rollout gradual com feature flags

**Autor**: Claude Code
**Contato**: Via GitHub Issues ou /sc:brainstorm para dúvidas
