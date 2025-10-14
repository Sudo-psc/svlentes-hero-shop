# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Session Memory

### Current Session (2025-10-13)
**Session Start**: 2025-10-13
**Project State**:
- Branch: master
- Last Commit: 34f0bdd ("style: reduce cookie consent size by 50% and change navbar button to cyan")
- Status: ✅ **Caddy migration COMPLETED successfully**
- Reverse Proxy: **Caddy 2.10.2** (migrated from Nginx 1.24.0)

**Session Goals**: ✅ Nginx to Caddy migration - COMPLETED

**Recent Work History**:
- ✅ Nginx → Caddy migration completed (2025-10-13 16:17 UTC)
- ✅ First attempt failed (15:17) - log permissions, rolled back
- ✅ Problem corrected - systemd journal logs adopted
- ✅ Second attempt successful (16:17) - all endpoints validated
- ✅ 6 SSL certificates acquired automatically
- ✅ HTTP/3 enabled, all services operational
- ✅ AGENTS.md and CLAUDE.md updated
- ✅ Complete migration documentation in /migration/

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

### Production Service Management (Systemd)
```bash
# Next.js Application Service
systemctl status svlentes-nextjs    # Check service status
systemctl restart svlentes-nextjs   # Restart after deployment
journalctl -u svlentes-nextjs -f    # View live logs

# Reverse Proxy (Currently: Caddy) ✅ MIGRATED
systemctl status caddy              # Check Caddy status
caddy validate --config /etc/caddy/Caddyfile  # Test configuration
caddy reload --config /etc/caddy/Caddyfile    # Reload without downtime (zero-downtime)
systemctl restart caddy             # Full restart

# SSL Certificate Management (Automatic via Caddy)
# No manual intervention needed - Caddy handles everything automatically
ls -lh /var/lib/caddy/.local/share/caddy/certificates/  # View certificates

# Logs (via systemd journal)
journalctl -u caddy -f              # Real-time logs
journalctl -u caddy -n 100          # Last 100 lines
journalctl -u caddy --since "1 hour ago"  # Time-filtered logs

# Legacy Nginx (if rollback needed)
# cd /root/svlentes-hero-shop/migration
# ./rollback-to-nginx.sh            # Emergency rollback (tested)
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

### Asset Management
```bash
npm run optimize:icons    # Optimize icon assets
npm run optimize:logo     # Optimize logo files
npm run generate:favicons # Generate favicon variants
npm run icons:catalog     # View icon documentation
npm run icons:watch       # Watch mode for icon updates
npm run icons:update      # Update components with new icons
npm run icons:analyze     # Analyze icon usage
```

### Health Monitoring
```bash
npm run health-check      # Check application health
curl -f http://localhost:3000/api/health-check  # Manual health check
```

## Architecture

### Next.js 15 App Router Structure
```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main landing page
│   ├── layout.tsx         # Root layout with metadata
│   ├── globals.css        # Global styles and CSS variables
│   ├── api/               # API routes
│   │   ├── webhooks/asaas/ # Asaas payment webhooks
│   │   ├── asaas/         # Payment creation endpoints
│   │   ├── monitoring/    # Health and performance endpoints
│   │   ├── privacy/       # LGPD compliance endpoints
│   │   ├── schedule-consultation/ # Appointment booking
│   │   ├── whatsapp-redirect/ # WhatsApp integration
│   │   ├── create-checkout/ # Checkout session creation
│   │   └── health-check/  # Application health status
│   ├── calculadora/       # Savings calculator page
│   ├── assinar/          # Subscription signup flow
│   ├── agendar-consulta/ # Consultation scheduling
│   ├── lentes-diarias/    # Daily lenses information
│   ├── politica-privacidade/ # Privacy policy
│   ├── termos-uso/        # Terms of service
│   ├── success/           # Payment success page
│   ├── cancel/            # Payment cancellation page
│   └── agendamento-confirmado/ # Booking confirmation
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
NEXT_PUBLIC_WHATSAPP_NUMBER=553399898026

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
- **WhatsApp**: +55 33 99898-026
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

### Production Deployment
- Deployed via systemd service to svlentes.com.br (primary) / svlentes.shop (redirect)
- Build and restart: `npm run build && systemctl restart svlentes-nextjs`
- Monitor via systemd logs: `journalctl -u svlentes-nextjs -f`
- Health endpoints: `/api/health-check`, `/api/monitoring/*`

### Deployment Workflow
```bash
# 1. Build the application
npm run build

# 2. Restart production service
systemctl restart svlentes-nextjs

# 3. Verify deployment
curl -I https://svlentes.com.br
journalctl -u svlentes-nextjs -n 50
```

### Reverse Proxy Migration (Nginx → Caddy)
**Status:** ✅ **COMPLETED SUCCESSFULLY** (2025-10-13 16:17 UTC)  
**Documentation:** `/root/svlentes-hero-shop/migration/`

```bash
# Monitor Caddy logs
journalctl -u caddy -f

# Reload configuration (zero-downtime)
caddy reload --config /etc/caddy/Caddyfile

# Check service status
systemctl status caddy

# View migration status
cat /root/svlentes-hero-shop/migration/STATUS.md

# Emergency rollback (if needed)
cd /root/svlentes-hero-shop/migration
sudo ./rollback-to-nginx.sh
```

**Migration Results:**
- ✅ 85% less configuration (101 vs 663 lines)
- ✅ Automatic SSL/TLS (6 certificates acquired)
- ✅ HTTP/3 enabled and operational
- ✅ Zero-downtime certificate renewal
- ✅ Logs via systemd journal
- ✅ All endpoints validated and working

**Migration Timeline:**
- 15:17 UTC - First attempt (failed - log permissions)
- 15:53 UTC - Rollback executed successfully
- 15:55 UTC - Problem corrected
- 16:17 UTC - Second attempt (SUCCESS)
- 16:20 UTC - Full validation complete

**Migration Files:**
- `STATUS.md` - ⭐ Complete migration report with results
- `MIGRATION_REVIEW.md` - Analysis of issues and fixes
- `CADDY_MIGRATION.md` - Complete migration guide
- `Caddyfile` - Active production configuration (101 lines)
- `rollback-to-nginx.sh` - Emergency rollback (tested ✅)

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
