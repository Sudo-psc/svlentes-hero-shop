# Plano de Centralização de Configuração - SV Lentes

**Autor**: Claude Code
**Data**: 2025-10-18
**Versão**: 1.0
**Stack**: Next.js 15 + App Router + TypeScript + Tailwind CSS + SSR/ISR
**Repositório**: /root/svlentes-hero-shop
**Idiomas**: pt-BR (default), en-US (planejado)
**Ambientes**: dev, staging, production

---

## Executive Summary

Este documento especifica a migração de configurações dispersas para um modelo centralizado único, permitindo manutenção rápida, versionada e consistente via arquivos YAML com validação TypeScript.

**Objetivo**: Centralizar texto/copy, dados estruturados, planos, tema, SEO, menus, feature flags em configuração única com acesso type-safe.

**Benefícios**:
- 🎯 Fonte única de verdade para todo conteúdo
- 🌐 Preparação para i18n multi-idioma
- 🔧 Manutenção simplificada (editar 1 arquivo vs. 24+ arquivos)
- ✅ Validação em build-time com Zod
- 🚀 Zero-downtime com versionamento adequado

---

## A) Mapa da Situação Atual

### Arquitetura Atual do Front

```
Next.js 15 App Router
├── src/app/                    # Routes (SSR/ISR)
│   ├── layout.tsx             # Root layout + SEO defaults
│   ├── page.tsx               # Landing page
│   ├── calculadora/           # Feature routes
│   ├── assinar/
│   └── area-assinante/
├── src/components/             # React components
│   ├── ui/                    # shadcn/ui base
│   ├── sections/              # Landing sections
│   ├── forms/                 # Forms with validation
│   └── layout/                # Header, Footer
├── src/data/                  # **Static data (dispersed)**
│   ├── pricing-plans.ts
│   ├── doctor-info.ts
│   ├── calculator-data.ts
│   └── [6+ more files]
├── src/lib/                   # Business logic
└── tailwind.config.js         # **Theme tokens**
```

### Tabela de Localização Atual

| Tipo de Conteúdo | Onde Reside Hoje | Exemplos | Risco |
|------------------|------------------|----------|-------|
| **Texto/Copy** | Hardcoded em JSX | "Assine agora", "Fale conosco" | 🔴 Alta duplicação, sem i18n |
| **Menus/Rotas** | `Header.tsx`, `Footer.tsx` | Links hardcoded | 🟡 Duplicação moderada |
| **Planos/Pricing** | `src/data/pricing-plans.ts` | 3 planos, sem fonte única | 🔴 Sem versionamento |
| **Tema/Tokens** | `tailwind.config.js` + CSS vars | Cores, fontes, spacing | 🟡 Divergência possível |
| **SEO Defaults** | `src/app/layout.tsx` | Meta tags, Open Graph | 🟡 Parcialmente centralizado |
| **SEO por Página** | Cada `page.tsx` metadata | Title, description únicos | 🔴 Inconsistências |
| **Feature Flags** | **Não existe** | - | 🔴 Risco alto |
| **Tracking** | `NEXT_PUBLIC_GA_ID` hardcoded | Google Analytics | 🟡 Sem gestão por ambiente |
| **Dados Médicos** | `src/data/doctor-info.ts` | Dr. Philipe info | 🔴 LGPD risk - duplicado em 8+ locais |
| **WhatsApp Number** | Hardcoded em 24+ arquivos | +5533999898026 | 🔴 Manutenção insustentável |

### Locais de Duplicação Crítica

1. **Número WhatsApp**: 24+ arquivos (recentemente corrigido de 3399898026 → 5533999898026)
2. **Informações do Dr. Philipe**:
   - `src/data/doctor-info.ts`
   - `src/components/trust/DoctorCard.tsx`
   - `src/components/layout/Footer.tsx`
   - `src/app/politica-privacidade/page.tsx`
   - 4+ outros locais
3. **Textos de CTA**: "Assine agora", "Fale conosco", "Agende consulta" - sem padrão
4. **Valores de planos**: Hardcoded em `PlanCard.tsx`, sem validação cross-page
5. **URLs de redirecionamento**: Hardcoded em handlers de webhook e API

---

## B) Especificação do Arquivo de Configuração Unificado

### Formato: YAML

**Justificativa**:
- ✅ Suporta comentários (documentação inline)
- ✅ Mais legível que JSON para não-desenvolvedores
- ✅ Validável via Zod em build-time
- ✅ Diff-friendly para Git

### Estrutura de Arquivos

```
config/
├── schema.ts                  # Zod schema + TypeScript types
├── base.yaml                  # Configuração base (pt-BR)
├── production.yaml            # Overrides de produção
├── staging.yaml               # Overrides de staging
├── loader.ts                  # ConfigService implementation
└── README.md                  # Documentação do sistema
```

### Estratégia de Merge por Ambiente

```typescript
// Deep merge com precedência:
// 1. base.yaml (defaults)
// 2. {environment}.yaml (overrides)
// 3. process.env (runtime secrets)

const config = deepMerge(
  baseConfig,
  environmentConfig[process.env.NODE_ENV],
  { tracking: { gaId: process.env.NEXT_PUBLIC_GA_ID } }
)
```

### Esquema Zod Completo

```typescript
// config/schema.ts
import { z } from 'zod'

// ============================================================================
// 1. SITE METADATA
// ============================================================================
const SiteConfigSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  tagline: z.string(),
  description: z.string().min(50).max(160), // SEO optimal
  url: z.string().url(),
  domains: z.object({
    primary: z.string().url(),
    alternative: z.array(z.string().url()),
  }),
  legal: z.object({
    cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/),
    razaoSocial: z.string(),
  }),
})

// ============================================================================
// 2. I18N CONFIGURATION
// ============================================================================
const I18nConfigSchema = z.object({
  defaultLocale: z.enum(['pt-BR', 'en-US']),
  locales: z.array(z.enum(['pt-BR', 'en-US'])),
  fallback: z.enum(['strict', 'soft']), // strict: error, soft: fallback to default
})

// ============================================================================
// 3. THEME TOKENS
// ============================================================================
const ColorTokenSchema = z.object({
  50: z.string().regex(/^#[0-9a-f]{6}$/i),
  100: z.string().regex(/^#[0-9a-f]{6}$/i),
  200: z.string().regex(/^#[0-9a-f]{6}$/i),
  300: z.string().regex(/^#[0-9a-f]{6}$/i),
  400: z.string().regex(/^#[0-9a-f]{6}$/i),
  500: z.string().regex(/^#[0-9a-f]{6}$/i),
  600: z.string().regex(/^#[0-9a-f]{6}$/i),
  700: z.string().regex(/^#[0-9a-f]{6}$/i),
  800: z.string().regex(/^#[0-9a-f]{6}$/i),
  900: z.string().regex(/^#[0-9a-f]{6}$/i),
})

const ThemeTokensSchema = z.object({
  colors: z.object({
    primary: ColorTokenSchema,
    secondary: ColorTokenSchema,
    success: ColorTokenSchema,
    warning: ColorTokenSchema,
    whatsapp: ColorTokenSchema,
    medical: ColorTokenSchema,
  }),
  typography: z.object({
    fontFamily: z.object({
      sans: z.array(z.string()),
      heading: z.array(z.string()),
      mono: z.array(z.string()).optional(),
    }),
    fontSize: z.record(z.string(), z.tuple([z.string(), z.object({
      lineHeight: z.string(),
      letterSpacing: z.string().optional(),
      fontWeight: z.string().optional(),
    })])),
  }),
  spacing: z.record(z.string(), z.string()),
  borderRadius: z.record(z.string(), z.string()),
  shadows: z.record(z.string(), z.string()),
})

// ============================================================================
// 4. SEO CONFIGURATION
// ============================================================================
const SeoDefaultsSchema = z.object({
  titleTemplate: z.string(), // e.g., "%s | SV Lentes"
  defaultTitle: z.string(),
  description: z.string().min(50).max(160),
  keywords: z.array(z.string()),
  openGraph: z.object({
    type: z.string(),
    locale: z.string(),
    siteName: z.string(),
    images: z.array(z.object({
      url: z.string().url(),
      width: z.number(),
      height: z.number(),
      alt: z.string(),
    })),
  }),
  twitter: z.object({
    cardType: z.enum(['summary', 'summary_large_image']),
    site: z.string().optional(),
    creator: z.string().optional(),
  }),
  robots: z.object({
    index: z.boolean(),
    follow: z.boolean(),
    googleBot: z.string().optional(),
  }),
})

const PageSeoSchema = z.record(z.string(), z.object({
  title: z.string(),
  description: z.string().min(50).max(160),
  keywords: z.array(z.string()).optional(),
  openGraph: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    images: z.array(z.object({
      url: z.string().url(),
      alt: z.string(),
    })).optional(),
  }).optional(),
}))

// ============================================================================
// 5. MENUS & NAVIGATION
// ============================================================================
const MenuItemSchema = z.object({
  label: z.string(),
  href: z.string(),
  icon: z.string().optional(),
  external: z.boolean().optional(),
  highlighted: z.boolean().optional(),
  subitems: z.array(z.lazy(() => MenuItemSchema)).optional(),
})

const MenusSchema = z.object({
  header: z.object({
    main: z.array(MenuItemSchema),
    cta: MenuItemSchema.optional(),
  }),
  footer: z.object({
    sections: z.array(z.object({
      title: z.string(),
      items: z.array(MenuItemSchema),
    })),
    social: z.array(z.object({
      platform: z.string(),
      url: z.string().url(),
      icon: z.string(),
    })),
  }),
})

// ============================================================================
// 6. COPY/CONTENT (I18N)
// ============================================================================
const CopySchema = z.record(z.string(), z.record(z.string(), z.union([
  z.string(),
  z.record(z.string(), z.string()),
])))

// ============================================================================
// 7. PLANS/PRICING
// ============================================================================
const PlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  badge: z.string().optional(),
  popularBadge: z.string().optional(),
  price: z.object({
    monthly: z.number().positive(),
    annual: z.number().positive(),
    currency: z.enum(['BRL', 'USD']),
  }),
  description: z.string(),
  features: z.array(z.string()),
  recommended: z.boolean(),
  paymentIds: z.object({
    asaasProductId: z.string(),
    stripePriceId: z.string().optional(),
  }),
  ctaText: z.string(),
})

const PlansSchema = z.object({
  currency: z.enum(['BRL', 'USD']),
  displayFormat: z.object({
    monthly: z.string(), // e.g., "R$ {price}/mês"
    annual: z.string(),  // e.g., "R$ {price}/ano"
  }),
  plans: z.array(PlanSchema),
})

// ============================================================================
// 8. TRACKING & ANALYTICS
// ============================================================================
const TrackingSchema = z.object({
  googleAnalytics: z.object({
    enabled: z.boolean(),
    measurementId: z.string().optional(),
  }),
  gtm: z.object({
    enabled: z.boolean(),
    containerId: z.string().optional(),
  }),
  pixels: z.object({
    facebook: z.string().optional(),
    linkedin: z.string().optional(),
  }),
})

// ============================================================================
// 9. FEATURE FLAGS
// ============================================================================
const FeatureFlagsSchema = z.record(z.string(), z.boolean())

// ============================================================================
// 10. CONTACT & MEDICAL INFO
// ============================================================================
const DoctorSchema = z.object({
  name: z.string(),
  crm: z.string(),
  crmEquipe: z.string().optional(),
  specialty: z.string(),
  photo: z.string(),
  credentials: z.array(z.string()),
  bio: z.string(),
  contact: z.object({
    whatsapp: z.string().regex(/^\+\d{13}$/), // +5533999898026
    email: z.string().email(),
    clinicAddress: z.string(),
  }),
  socialProof: z.object({
    patientsServed: z.string(),
    satisfactionRate: z.string(),
    consultationsPerformed: z.string(),
  }),
})

const ContactSchema = z.object({
  phone: z.string(),
  whatsapp: z.string().regex(/^\+\d{13}$/),
  email: z.string().email(),
  address: z.object({
    street: z.string(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }),
  businessHours: z.object({
    weekdays: z.string(),
    saturday: z.string(),
    sunday: z.string(),
    emergency: z.string(),
  }),
})

// ============================================================================
// ROOT CONFIG SCHEMA
// ============================================================================
export const ConfigSchema = z.object({
  site: SiteConfigSchema,
  i18n: I18nConfigSchema,
  theme: z.object({
    tokens: ThemeTokensSchema,
  }),
  seo: z.object({
    defaults: SeoDefaultsSchema,
    pages: PageSeoSchema,
  }),
  menus: MenusSchema,
  copy: CopySchema,
  plans: PlansSchema,
  tracking: TrackingSchema,
  featureFlags: FeatureFlagsSchema,
  doctor: DoctorSchema,
  contact: ContactSchema,
})

export type AppConfig = z.infer<typeof ConfigSchema>
```

### Exemplo Completo: config/base.yaml

```yaml
# ============================================================================
# SV LENTES - CONFIGURAÇÃO BASE
# Versão: 1.0.0
# Ambiente: Base (pt-BR)
# ============================================================================

site:
  name: "SV Lentes"
  shortName: "SVLentes"
  tagline: "Lentes de contato por assinatura com acompanhamento médico"
  description: "Assinatura de lentes de contato com acompanhamento médico especializado. Entrega mensal, economia garantida e praticidade para cuidar da sua visão."
  url: "https://svlentes.com.br"
  domains:
    primary: "https://svlentes.com.br"
    alternative:
      - "https://svlentes.shop"
  legal:
    cnpj: "53.864.119/0001-79"
    razaoSocial: "SV Lentes - Serviços Oftalmológicos Especializados"

# ============================================================================
# I18N CONFIGURATION
# ============================================================================
i18n:
  defaultLocale: "pt-BR"
  locales:
    - "pt-BR"
    - "en-US"
  fallback: "soft" # soft: fallback to defaultLocale, strict: throw error

# ============================================================================
# THEME TOKENS
# ============================================================================
theme:
  tokens:
    colors:
      primary:
        50: "#ecfeff"
        100: "#cffafe"
        200: "#a5f3fc"
        300: "#67e8f9"
        400: "#22d3ee"
        500: "#06b6d4"
        600: "#0891b2"
        700: "#0e7490"
        800: "#155e75"
        900: "#164e63"
      secondary:
        50: "#f8fafc"
        100: "#f1f5f9"
        200: "#e2e8f0"
        300: "#cbd5e1"
        400: "#94a3b8"
        500: "#64748b"
        600: "#475569"
        700: "#334155"
        800: "#1e293b"
        900: "#0f172a"
      success:
        50: "#f0fdf4"
        100: "#dcfce7"
        200: "#bbf7d0"
        300: "#86efac"
        400: "#4ade80"
        500: "#22c55e"
        600: "#16a34a"
        700: "#15803d"
        800: "#166534"
        900: "#14532d"
      warning:
        50: "#fffbeb"
        100: "#fef3c7"
        200: "#fde68a"
        300: "#fcd34d"
        400: "#fbbf24"
        500: "#f59e0b"
        600: "#d97706"
        700: "#b45309"
        800: "#92400e"
        900: "#78350f"
      whatsapp:
        50: "#f0fdf4"
        100: "#dcfce7"
        200: "#bbf7d0"
        300: "#86efac"
        400: "#4ade80"
        500: "#25d366" # Official WhatsApp green
        600: "#16a34a"
        700: "#15803d"
        800: "#166534"
        900: "#14532d"
      medical:
        50: "#f8fafc"
        100: "#f1f5f9"
        200: "#e2e8f0"
        300: "#cbd5e1"
        400: "#94a3b8"
        500: "#64748b"
        600: "#475569"
        700: "#334155"
        800: "#1e293b"
        900: "#0f172a"

    typography:
      fontFamily:
        sans: ["Inter", "system-ui", "sans-serif"]
        heading: ["Poppins", "system-ui", "sans-serif"]
      fontSize:
        xs: ["0.75rem", { lineHeight: "1rem" }]
        sm: ["0.875rem", { lineHeight: "1.25rem" }]
        base: ["1rem", { lineHeight: "1.5rem" }]
        lg: ["1.125rem", { lineHeight: "1.75rem" }]
        xl: ["1.25rem", { lineHeight: "1.75rem" }]
        "2xl": ["1.5rem", { lineHeight: "2rem" }]
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }]
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }]
        "5xl": ["3rem", { lineHeight: "1" }]

    spacing:
      "0": "0"
      "1": "0.25rem"
      "2": "0.5rem"
      "3": "0.75rem"
      "4": "1rem"
      "6": "1.5rem"
      "8": "2rem"
      "12": "3rem"
      "16": "4rem"
      "24": "6rem"

    borderRadius:
      none: "0"
      sm: "0.125rem"
      DEFAULT: "0.25rem"
      md: "0.375rem"
      lg: "0.5rem"
      xl: "0.75rem"
      "2xl": "1rem"
      full: "9999px"

    shadows:
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
      DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
      glass: "0 8px 32px 0 rgba(31, 38, 135, 0.15)"
      neon: "0 0 20px rgba(59, 130, 246, 0.5)"

# ============================================================================
# SEO DEFAULTS
# ============================================================================
seo:
  defaults:
    titleTemplate: "%s | SV Lentes"
    defaultTitle: "SV Lentes - Assinatura de Lentes de Contato com Acompanhamento Médico"
    description: "Assinatura de lentes de contato com acompanhamento médico especializado. Entrega mensal, economia garantida e praticidade para cuidar da sua visão."
    keywords:
      - "lentes de contato"
      - "assinatura lentes"
      - "oftalmologia"
      - "lentes mensais"
      - "telemedicina"
      - "Caratinga"
      - "Dr. Philipe Saraiva"
    openGraph:
      type: "website"
      locale: "pt_BR"
      siteName: "SV Lentes"
      images:
        - url: "https://svlentes.com.br/og-image.jpg"
          width: 1200
          height: 630
          alt: "SV Lentes - Assinatura de Lentes de Contato"
    twitter:
      cardType: "summary_large_image"
    robots:
      index: true
      follow: true

  pages:
    home:
      title: "Início"
      description: "Assinatura de lentes de contato com acompanhamento médico. Economia de até 40% e entrega mensal automática."
      keywords:
        - "assinatura lentes contato"
        - "lentes mensais"
        - "economia lentes"
    calculadora:
      title: "Calculadora de Economia"
      description: "Calcule quanto você economiza com nossa assinatura de lentes de contato. Compare com compras avulsas."
      keywords:
        - "calculadora lentes"
        - "economia lentes de contato"
    assinar:
      title: "Assine Agora"
      description: "Escolha seu plano de assinatura de lentes de contato com acompanhamento médico especializado."
      keywords:
        - "planos lentes contato"
        - "assinar lentes"
    "area-assinante":
      title: "Área do Assinante"
      description: "Gerencie sua assinatura, consulte pedidos e agende consultas médicas."
      keywords:
        - "área assinante"
        - "gerenciar assinatura"

# ============================================================================
# MENUS & NAVIGATION
# ============================================================================
menus:
  header:
    main:
      - label: "Início"
        href: "/"
      - label: "Como Funciona"
        href: "/#como-funciona"
      - label: "Planos"
        href: "/#planos"
      - label: "Calculadora"
        href: "/calculadora"
        highlighted: true
      - label: "Área do Cliente"
        href: "/area-assinante/login"
    cta:
      label: "Assine Agora"
      href: "/assinar"
      icon: "ArrowRight"

  footer:
    sections:
      - title: "Empresa"
        items:
          - label: "Sobre"
            href: "/sobre"
          - label: "Como Funciona"
            href: "/#como-funciona"
          - label: "Blog"
            href: "/blog"
      - title: "Serviços"
        items:
          - label: "Planos"
            href: "/#planos"
          - label: "Calculadora"
            href: "/calculadora"
          - label: "Agendar Consulta"
            href: "/agendar-consulta"
      - title: "Suporte"
        items:
          - label: "FAQ"
            href: "/#faq"
          - label: "Contato"
            href: "/#contato"
          - label: "WhatsApp"
            href: "https://wa.me/5533999898026"
            external: true
      - title: "Legal"
        items:
          - label: "Termos de Uso"
            href: "/termos-uso"
          - label: "Política de Privacidade"
            href: "/politica-privacidade"
    social:
      - platform: "Instagram"
        url: "https://instagram.com/svlentes"
        icon: "Instagram"
      - platform: "Facebook"
        url: "https://facebook.com/svlentes"
        icon: "Facebook"
      - platform: "WhatsApp"
        url: "https://wa.me/5533999898026"
        icon: "WhatsApp"

# ============================================================================
# COPY/CONTENT (I18N)
# ============================================================================
copy:
  pt-BR:
    common:
      cta:
        primary: "Assine Agora"
        secondary: "Saiba Mais"
        contact: "Fale Conosco"
        schedule: "Agende Consulta"
      buttons:
        submit: "Enviar"
        cancel: "Cancelar"
        close: "Fechar"
        next: "Próximo"
        back: "Voltar"
      labels:
        name: "Nome completo"
        email: "E-mail"
        phone: "Telefone"
        whatsapp: "WhatsApp"
        message: "Mensagem"

    hero:
      title: "Lentes de Contato por Assinatura"
      subtitle: "Com Acompanhamento Médico Especializado"
      description: "Receba suas lentes em casa todo mês, economize até 40% e tenha o acompanhamento de um oftalmologista sempre que precisar."
      cta: "Assine Agora"
      ctaSecondary: "Calcular Economia"

    howItWorks:
      title: "Como Funciona?"
      subtitle: "Simples, prático e com acompanhamento médico"
      steps:
        - title: "Escolha seu Plano"
          description: "Selecione o plano que melhor se adapta às suas necessidades e ao tipo de lente que você usa."
        - title: "Consulta Médica"
          description: "Agende sua consulta de avaliação presencial ou por telemedicina com nosso oftalmologista."
        - title: "Receba em Casa"
          description: "Suas lentes chegam todo mês no seu endereço, sem custo adicional de frete."
        - title: "Acompanhamento"
          description: "Conte com suporte médico contínuo via telemedicina e WhatsApp."

    features:
      economy:
        title: "Economia Garantida"
        description: "Economize até 40% comparado à compra avulsa"
      medical:
        title: "Acompanhamento Médico"
        description: "Consultas e teleorientação incluídas"
      delivery:
        title: "Entrega Automática"
        description: "Receba em casa todo mês sem preocupação"
      quality:
        title: "Lentes Premium"
        description: "Produtos certificados pela ANVISA"

    faq:
      title: "Perguntas Frequentes"
      subtitle: "Tire suas dúvidas sobre nossa assinatura"

  en-US:
    common:
      cta:
        primary: "Subscribe Now"
        secondary: "Learn More"
        contact: "Contact Us"
        schedule: "Schedule Appointment"
    # ... (adicionar traduções conforme necessário)

# ============================================================================
# PLANS/PRICING
# ============================================================================
plans:
  currency: "BRL"
  displayFormat:
    monthly: "R$ {price}/mês"
    annual: "R$ {price}/ano (economize 1 mês)"
  plans:
    - id: "basico"
      name: "Plano Básico"
      badge: "Pioneiro no Brasil"
      price:
        monthly: 89.00
        annual: 979.00
        currency: "BRL"
      description: "Plano básico de lentes de contato com acompanhamento 100% online via telemedicina."
      features:
        - "12 pares de lentes gelatinosas asféricas"
        - "1 consulta de telemedicina por ano"
        - "Acompanhamento médico mensal online"
        - "Lembretes mensais de troca"
        - "Entrega em casa sem custo adicional"
        - "Atendimento em todo o Brasil"
      recommended: false
      paymentIds:
        asaasProductId: "prod_basico_svlentes"
        stripePriceId: "price_basic_monthly"
      ctaText: "Assinar Plano Básico"

    - id: "padrao"
      name: "Plano Padrão Online"
      badge: "RECOMENDADO"
      popularBadge: "Mais Popular"
      price:
        monthly: 119.00
        annual: 1309.00
        currency: "BRL"
      description: "Plano completo com lentes premium e acompanhamento online prioritário."
      features:
        - "Todos os benefícios do Plano Básico"
        - "13 pares de lentes gelatinosas premium"
        - "2 consultas de telemedicina por ano"
        - "Prioridade no agendamento"
        - "Frete expresso grátis"
        - "Suporte via WhatsApp 24/7"
      recommended: true
      paymentIds:
        asaasProductId: "prod_padrao_svlentes"
        stripePriceId: "price_standard_monthly"
      ctaText: "Assinar Plano Padrão"

    - id: "premium"
      name: "Plano Premium Online"
      badge: "Premium"
      price:
        monthly: 149.00
        annual: 1639.00
        currency: "BRL"
      description: "Experiência VIP online com lentes multifocais e atendimento personalizado exclusivo."
      features:
        - "Todos os benefícios do Plano Padrão"
        - "14 pares de lentes premium multifocais"
        - "4 consultas de telemedicina por ano"
        - "Kit premium de higienização"
        - "Atendimento personalizado exclusivo"
      recommended: false
      paymentIds:
        asaasProductId: "prod_premium_svlentes"
        stripePriceId: "price_premium_monthly"
      ctaText: "Assinar Plano Premium"

# ============================================================================
# TRACKING & ANALYTICS
# ============================================================================
tracking:
  googleAnalytics:
    enabled: true
    measurementId: "${NEXT_PUBLIC_GA_MEASUREMENT_ID}" # From env
  gtm:
    enabled: false
  pixels:
    facebook: null
    linkedin: null

# ============================================================================
# FEATURE FLAGS
# ============================================================================
featureFlags:
  enableBlog: false
  enableChat: true
  enablePersonalization: true
  enableReferralProgram: false
  enableMultiLanguage: false
  enableDarkMode: false
  enablePWA: false
  enableWhatsAppBot: true
  enableLangChainSupport: true
  enableAsaasPayment: true
  enableStripePayment: false

# ============================================================================
# DOCTOR INFORMATION
# ============================================================================
doctor:
  name: "Dr. Philipe Saraiva Cruz"
  crm: "CRM-MG 69.870"
  crmEquipe: "CRM_EQP 155869.006"
  specialty: "Oftalmologia"
  photo: "/icones/drphilipe_perfil.jpeg"
  credentials:
    - "Especialista em Oftalmologia"
    - "Graduado em Medicina pela Universidade Federal"
    - "Residência em Oftalmologia"
    - "Especialização em Lentes de Contato"
    - "Membro da Sociedade Brasileira de Oftalmologia"
  bio: "Dr. Philipe Saraiva Cruz é pioneiro no Brasil em serviços de assinatura de lentes de contato com acompanhamento médico especializado, dedicando-se a proporcionar cuidado oftalmológico personalizado e acessível."
  contact:
    whatsapp: "+5533999898026"
    email: "dr.philipe@svlentes.com.br"
    clinicAddress: "Rua Catarina Maria Passos, 97 - Santa Zita, Caratinga/MG"
  socialProof:
    patientsServed: "5000+"
    satisfactionRate: "98%"
    consultationsPerformed: "10000+"

# ============================================================================
# CONTACT INFORMATION
# ============================================================================
contact:
  phone: "+55 33 99989-8026"
  whatsapp: "+5533999898026"
  email: "contato@svlentes.com.br"
  address:
    street: "Rua Catarina Maria Passos, 97"
    neighborhood: "Santa Zita"
    city: "Caratinga"
    state: "MG"
    zipCode: "35300-299"
    country: "Brasil"
  businessHours:
    weekdays: "Segunda a Sexta: 8h às 18h"
    saturday: "Sábado: 8h às 12h"
    sunday: "Domingo: Fechado"
    emergency: "24h via WhatsApp para emergências"
```

### config/production.yaml (Overrides)

```yaml
# Production-specific overrides
site:
  url: "https://svlentes.com.br"

tracking:
  googleAnalytics:
    enabled: true
    # measurementId from process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

featureFlags:
  enableWhatsAppBot: true
  enableLangChainSupport: true
  enableAsaasPayment: true
```

### config/staging.yaml (Overrides)

```yaml
# Staging-specific overrides
site:
  url: "https://staging.svlentes.shop"

tracking:
  googleAnalytics:
    enabled: false

featureFlags:
  enableWhatsAppBot: false
  enableAsaasPayment: false # Use sandbox
```

---

*Continua na próxima mensagem com as seções C, D, E, F, G, H, e I...*
