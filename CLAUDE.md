# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Session Memory

### Current Session (2025-01-13)
**Session Start**: 2025-01-13
**Project State**:
- Branch: master
- Last Commit: 8866aff ("Update calculator colors to cyan scheme and add comprehensive tests")
- Status: Clean working directory with new untracked assets (icons, images, Hero2.mp4)
- Modified files: .env.local.example, CLAUDE.md

**Session Goals**: TBD (to be defined by user)

**Recent Work History**:
- Calculator color scheme updated to cyan palette
- Comprehensive test coverage added
- Patient manual PDF integration
- Animated logo assets added
- White footer with cyan/silver design implemented

**Session Context**: This is a production healthcare platform for SV Lentes contact lens subscription service.

## Project Overview

**SV Lentes Landing Page** is a Next.js 15 application for a contact lens subscription service with medical oversight. This is a production healthcare platform serving Saraiva Vision clinic in Caratinga/MG, Brazil.

**Business Context:**
- Contact lens subscription service with ophthalmological monitoring
- Responsible Physician: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
- LGPD-compliant (Brazilian data protection law)
- Production domain: **svlentes.com.br** (principal) / svlentes.shop (alternativo)
- Payment processor: **Asaas API v3** (Brazilian gateway - PIX, Boleto, Cartão de Crédito)

## Development Commands

### Core Development
```bash
npm run dev              # Development server (port 3000)
npm run build           # Production build
npm run start           # Production server (port 5000)
npm run lint            # ESLint checking
```

### Testing
```bash
npm run test            # Run Jest unit tests
npm run test:watch      # Jest in watch mode
npm run test:coverage   # Jest with coverage report
npm run test:e2e        # Run Playwright E2E tests
npm run test:e2e:ui     # Playwright with UI
npm run test:e2e:headed # Playwright headed mode
npm run test:e2e:debug  # Playwright debug mode
```

### Deployment & Performance
```bash
npm run deploy:staging    # Deploy to staging environment
npm run deploy:production # Deploy to production
npm run deploy:rollback   # Rollback deployment
npm run health-check      # Check application health
npm run lighthouse        # Run Lighthouse CI
```

### Asset Management
```bash
npm run optimize:icons    # Optimize icon assets
npm run optimize:logo     # Optimize logo files
npm run generate:favicons # Generate favicon variants
npm run icons:catalog     # View icon documentation
npm run icons:update      # Update components with new icons
npm run icons:analyze     # Analyze icon usage
```

## Architecture

### Next.js 15 App Router Structure
```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page (hero section)
│   ├── layout.tsx         # Root layout with metadata
│   ├── globals.css        # Global styles and CSS variables
│   ├── api/               # API routes
│   │   ├── webhooks/      # Asaas payment webhooks
│   │   ├── checkout-session/ # Stripe checkout sessions
│   │   ├── monitoring/    # Health and performance endpoints
│   │   └── whatsapp-redirect/ # WhatsApp integration
│   ├── calculadora/       # Savings calculator page
│   ├── assinar/          # Subscription signup flow
│   ├── agendar-consulta/ # Consultation scheduling
│   └── (other routes)    # Various landing pages
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── sections/          # Landing page sections
│   ├── forms/             # Form components
│   ├── layout/            # Header, Footer components
│   └── trust/             # Trust indicators
├── lib/
│   ├── calculator.ts      # Savings calculation logic
│   └── utils.ts           # Utility functions
├── data/
│   └── calculator-data.ts # Static calculator data
└── types/                 # TypeScript type definitions
```

### Key Technologies
- **Next.js 15** with App Router and TypeScript
- **Tailwind CSS v4** with custom cyan/silver color scheme
- **shadcn/ui** component library with Radix UI primitives
- **React Hook Form** with Zod validation
- **Framer Motion** for animations
- **Asaas API** for payment processing (Brazilian market)
- **Jest** for unit testing
- **Playwright** for E2E testing

### Payment Integration

**Asaas Payment Gateway (Primary):**
- Brazilian payment processor (PIX, Boleto, Cartão de Crédito)
- Webhook endpoint: `/api/webhooks/asaas`
- Supports recurring subscriptions
- Production and sandbox environments
- Webhook events: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`

**Stripe (Legacy/Backup):**
- Secondary payment processor
- Checkout sessions via `/api/checkout-session`
- Webhook endpoint: `/api/webhooks/stripe`

### Color Scheme
- **Primary**: Cyan (`#06b6d4`) with full range 50-900
- **Secondary**: Silver (`#64748b`) with metallic variants
- **Success**: Green (`#22c55e`)
- **Warning**: Amber (`#f59e0b`)
- **WhatsApp**: Official green (`#25d366`)

## Important Implementation Details

### Healthcare Compliance
- All features must comply with Brazilian healthcare regulations (CFM)
- Emergency contact information required throughout the application
- Prescription validation is mandatory - never bypass medical authorization
- LGPD compliance for data protection with explicit consent tracking

### Security Configuration
- HSTS headers configured in `next.config.js`
- Content Security Policy optimized for payment providers
- Asaas webhook authentication via `ASAAS_WEBHOOK_TOKEN`
- No sensitive data in client-side code

### Environment Variables
```bash
# Application
NEXT_PUBLIC_APP_URL=https://svlentes.shop
NEXT_PUBLIC_WHATSAPP_NUMBER=5533998601427

# Asaas Payment (Required for production)
ASAAS_ENV=production
ASAAS_API_KEY_PROD=<production-key>
ASAAS_WEBHOOK_TOKEN=<webhook-secret>

# Optional Integrations
NEXT_PUBLIC_GA_MEASUREMENT_ID=<analytics-id>
DATABASE_URL=<postgresql-url>
RESEND_API_KEY=<email-service-key>
```

### Static Assets & Optimization
- Images optimized via Next.js Image component
- Custom icon system with automated optimization
- Favicon generation for all platforms
- Performance monitoring via `/api/monitoring/*` endpoints

### Testing Strategy
- Unit tests with Jest for business logic (calculator, validation)
- E2E tests with Playwright covering critical user flows
- Component testing for UI elements
- Performance testing via Lighthouse CI

## Business Context

### Service Model
- Contact lens subscription with automated delivery
- Medical oversight by Dr. Philipe Saraiva Cruz
- Serving Brazilian market primarily from Minas Gerais
- LGPD compliance mandatory

### Key Features
1. **Hero Section**: Video background with value proposition
2. **Savings Calculator**: Compare subscription vs. individual lens purchases
3. **Subscription Flow**: Asaas payment integration with multiple payment methods
4. **Medical Credibility**: Professional information and emergency contacts
5. **WhatsApp Integration**: Direct contact with clinic

### Contact Information
- **WhatsApp**: +55 33 99860-1427
- **Email**: saraivavision@gmail.com
- **Website**: svlentes.shop
- **Responsible Physician**: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)

## Development Workflow

### Local Development
1. Install dependencies: `npm install`
2. Copy environment example: `cp .env.local.example .env.local`
3. Start development server: `npm run dev`
4. Access at http://localhost:3000

### Testing Before Deploy
1. Run unit tests: `npm run test`
2. Run E2E tests: `npm run test:e2e`
3. Check build: `npm run build`
4. Health check: `npm run health-check`

### Deployment
- Production deployed via Vercel to svlentes.shop
- Use deployment scripts: `npm run deploy:production`
- Monitor via Vercel logs and `/api/monitoring/*` endpoints

## Regulatory Requirements

### LGPD Compliance
- Explicit consent required for data collection
- Data usage limited to scheduling, prescriptions, delivery logistics
- Audit trail implementation for medical data access
- Right to deletion implementation

### Medical Safety
- Emergency signs prominently displayed
- Prescription validation mandatory
- Medical responsibility clearly stated
- Professional credentials visible

## Domain-Specific Knowledge

### Brazilian Payment Market
- PIX (instant payment) preference
- Boleto bancário (traditional method)
- Installment payment culture
- Asaas as local payment specialist

### Healthcare in Brazil
- CRM (Conselho Regional de Medicina) registration required
- CFM (Conselho Federal de Medicina) regulations
- Telemedicine regulations
- Emergency care protocols