# Codebase Structure - SV Lentes

## Root Level
```
/root/svlentes-hero-shop/
├── src/                    # Application source code
├── public/                 # Static assets
├── e2e/                    # Playwright E2E tests
├── prisma/                 # Database schema and migrations
├── scripts/                # Build/deployment scripts
├── docs/                   # Documentation
├── .claude/                # Claude Code configuration
└── [config files]          # package.json, tsconfig.json, etc.
```

## Source Code Structure (src/)

### Application Routes (src/app/)
- **App Router**: Next.js 15 file-based routing
- **Key routes**:
  - `/` - Landing page
  - `/calculadora` - Savings calculator
  - `/assinar` - Subscription signup flow
  - `/area-assinante` - Subscriber dashboard
  - `/agendar-consulta` - Consultation scheduling
  - `/politica-privacidade` - LGPD privacy policy
  
### API Routes (src/app/api/)
- **Webhooks**: `/api/webhooks/asaas`, `/api/webhooks/sendpulse`
- **Payments**: `/api/asaas/create-payment`
- **WhatsApp**: `/api/whatsapp/support`, `/api/whatsapp-redirect`
- **Health**: `/api/health-check`
- **Privacy/LGPD**: `/api/privacy/*`
- **Monitoring**: `/api/monitoring/*`

### Components (src/components/)
```
components/
├── ui/                    # shadcn/ui base components (Button, Input, etc.)
├── sections/              # Landing page sections (Hero, Pricing, FAQ)
├── forms/                 # Form components (LeadCapture, Calculator)
├── layout/                # Header, Footer, WhatsAppFloat
├── trust/                 # Trust indicators, DoctorCard, TrustBadges
├── pricing/               # Pricing-specific components
├── assinante/             # Subscriber dashboard components
├── auth/                  # Authentication components
├── privacy/               # LGPD compliance components
└── performance/           # Performance optimization components
```

### Data Layer (src/data/)
**Static configuration files** (currently dispersed):
- `pricing-plans.ts` - Subscription plans
- `doctor-info.ts` - Dr. Philipe's information
- `calculator-data.ts` - Calculator presets
- `trust-indicators.ts` - Trust badges
- `faq-data.ts` - FAQ content
- `how-it-works.ts` - Process steps
- `add-ons.ts` - Additional products
- `problems-solutions.ts` - Value propositions

### Library (src/lib/)
**Business logic and utilities**:
- `calculator.ts` - Savings calculation logic
- `sendpulse-client.ts` - SendPulse API integration
- `asaas.ts` - Asaas payment integration
- `langchain-support-processor.ts` - AI support processing
- `prisma.ts` - Database client
- `validators.ts`, `validations.ts` - Input validation
- `utils.ts` - Common utilities (cn, etc.)
- `formatters.ts` - Data formatting
- `icons.tsx` - Icon components

### Types (src/types/)
- `subscription.ts` - Subscription-related types
- `asaas.ts` - Payment types
- `calculator.ts` - Calculator types
- `privacy.ts` - LGPD types
- `reminders.ts` - Notification types
- `personalization.ts` - User personalization types

## Critical Files for Configuration Centralization

### Current Dispersed Configuration
1. **Tailwind Config**: `tailwind.config.js` - Theme tokens (colors, fonts)
2. **Data Files**: `src/data/*.ts` - Content and structured data
3. **Layout Metadata**: `src/app/layout.tsx` - SEO defaults
4. **Page Metadata**: Each `page.tsx` - Per-page SEO
5. **Components**: Hardcoded text in JSX
6. **Environment**: `.env.local` - Runtime configuration

### Target for Centralization
- All text/copy, menus, plans, theme, SEO, feature flags
- Single source of truth: `config/base.yaml`
- Environment overrides: `config/production.yaml`, `config/staging.yaml`
- Type-safe access via ConfigService