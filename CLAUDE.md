# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SV Lentes Landing Page** is a Next.js 14.2.33 application for a contact lens subscription service with medical oversight. This is a production healthcare platform serving Saraiva Vision clinic in Caratinga/MG, Brazil.

**Business Context:**
- Contact lens subscription service with ophthalmological monitoring
- Responsible Physician: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
- LGPD-compliant (Brazilian data protection law)
- Production domains: **svlentes.com.br** (primary) / **svlentes.shop** (alternative)
- Payment processor: **Stripe** (International gateway with Customer Portal) - PRIMARY
- WhatsApp integration: **SendPulse** for customer support automation

## Essential Commands

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
npm run test:resilience # Run Vitest resilience tests
npm run test:integration # Run Vitest integration tests
npm run test:e2e        # Run Playwright E2E tests
npm run test:e2e:ui     # Playwright with UI
npm run test:e2e:headed # Playwright headed mode
npm run test:e2e:debug  # Playwright debug mode
npm run test:e2e:resilience # Playwright resilience tests
npm run test:all        # Run all test suites (resilience + E2E)
```

### Production Service Management (Systemd)
```bash
# Next.js Application Service
systemctl status svlentes-nextjs    # Check service status
systemctl restart svlentes-nextjs   # Restart after deployment
journalctl -u svlentes-nextjs -f    # View live logs

# Reverse Proxy (Nginx)
systemctl status nginx              # Check Nginx status
nginx -t                            # Test configuration validity
systemctl reload nginx              # Reload without downtime
journalctl -u nginx -f              # Real-time logs
```

### Database Operations
```bash
npm run db:seed          # Seed database with initial data
npx prisma generate      # Generate Prisma Client
npx prisma migrate dev   # Run migrations in development
npx prisma studio        # Open Prisma Studio GUI
npx prisma db push       # Push schema to database
npx prisma migrate reset # Reset database (destructive)
```

### Health Monitoring
```bash
npm run health-check     # Check application health
curl -f http://localhost:3000/api/health-check  # Manual health check
npm run lighthouse       # Run Lighthouse CI performance audit
```

## Architecture

### Multi-Domain Architecture
The application serves three main business domains within a Next.js monolith:

**Public Area:**
- Landing pages with pricing calculator
- Consultation scheduling
- Lead generation and contact forms

**Subscriber Dashboard (`/area-assinante`):**
- Subscription management via Stripe Customer Portal
- Payment history and invoice downloads
- Order tracking and delivery preferences
- Emergency contact information (healthcare compliance)

**Admin Area (`/admin`):**
- Analytics and reporting dashboard
- Customer management and support tickets
- Pricing configuration and subscription monitoring
- System health and performance metrics

### Key Technology Stack

**Core Framework:**
- **Next.js 14.2.33** with App Router and TypeScript (NOT 15)
- **React 18** with concurrent features
- **Tailwind CSS v3.4.17** with custom cyan/silver theme
- **shadcn/ui** component library with Radix UI primitives

**Data & Validation:**
- **React Hook Form** with **Zod** schemas for runtime validation
- **Prisma ORM** with PostgreSQL database
- **TypeScript** with strict mode enabled

**Authentication & Payments:**
- **Firebase Auth** (primary) with Google OAuth integration
- **Clerk Authentication** (alternative/modern)
- **Stripe Payments** (PRIMARY - international gateway)
- **Asaas Payments** (legacy Brazilian gateway - deprecated)

**Communication & AI:**
- **SendPulse** WhatsApp Business integration
- **LangChain** + **OpenAI GPT** for automated customer support
- **Email notifications** via Resend or SMTP

**Testing & Quality:**
- **Jest** for unit testing
- **Vitest** for resilience and integration testing
- **Playwright** for E2E testing
- **Lighthouse CI** for performance monitoring

### Critical Integrations

**Stripe Payment System (Primary):**
- API endpoints: `/api/stripe/subscription`, `/api/stripe/customer-portal`, `/api/stripe/create-checkout`
- Webhook endpoint: `/api/webhooks/stripe`
- Customer Portal for self-service subscription management
- Production and test environments with full feature parity

**SendPulse WhatsApp Integration:**
- Webhook endpoint: `/api/webhooks/sendpulse`
- AI-powered intent detection and response generation
- Conversation tracking and ticket escalation
- 24-hour conversation window management

**Authentication Systems:**
- Firebase ID tokens for API authentication
- Clerk middleware for route protection
- Phone-based authentication for WhatsApp chatbot
- Custom claims for role-based access control

### Business Logic Components

**Savings Calculator (`src/lib/calculator.ts`):**
- Compares subscription cost vs individual lens purchases
- Handles different lens types (daily, monthly)
- Accounts for delivery frequency and consultation costs
- Calculates annual savings projections with ROI analysis

**WhatsApp Chatbot System:**
- Automatic phone-based authentication (no OTP required)
- Intent classification: subscription_inquiry, billing_support, delivery_status
- Commands: "minha assinatura", "pausar assinatura", "reativar assinatura", "próxima entrega"
- Session management with 24-hour validity windows

**Subscription Management:**
- Stripe Customer Portal integration for self-service management
- Real-time subscription status tracking
- Automated billing cycle management
- LGPD-compliant data handling and audit trails

## Configuration

### Next.js Configuration (`next.config.js`)
- Build optimization with standalone output
- Security headers (HSTS, X-Frame-Options, X-Content-Type-Options)
- Image optimization with WebP/AVIF support
- CSP temporarily disabled for Stripe script loading
- TypeScript/ESLint errors ignored during builds (temporary)

### Production Deployment

**Systemd Service (`svlentes-nextjs`):**
- Runs on port 5000 with Node.js 20+
- Automatic restart on failure
- Resource limits and health monitoring
- Build artifact management

**Nginx Reverse Proxy:**
- SSL/TLS termination with Let's Encrypt certificates
- Static asset caching (`/_next/static` cached for 365 days)
- Rate limiting and connection throttling
- Security headers and CSP configuration

**Critical Environment Variables:**
```bash
# Application
NEXT_PUBLIC_SITE_URL=https://svlentes.shop
NEXT_PUBLIC_WHATSAPP_NUMBER=5533999898026
NEXT_PUBLIC_SUPPORT_PHONE=5533986061427

# Stripe Payment Integration (Primary)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# SendPulse WhatsApp Integration
SENDPULSE_USER_ID=<user-id>
SENDPULSE_SECRET=<api-secret>
SENDPULSE_ACCESS_TOKEN=<access-token>

# Database (Prisma)
DATABASE_URL=<postgresql-url>

# Clerk Authentication (Alternative to Firebase)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<clerk-publishable-key>
CLERK_SECRET_KEY=<clerk-secret-key>
```

## Development Workflow

### Local Development
1. Install dependencies: `npm install`
2. Configure environment: Copy `.env.local.example` to `.env.local`
3. Set up database: Configure `DATABASE_URL` in `.env.local`
4. Run migrations: `npx prisma migrate dev`
5. Generate Prisma client: `npx prisma generate`
6. Start development server: `npm run dev`

### Testing Before Deploy
1. Run unit tests: `npm run test`
2. Run resilience tests: `npm run test:resilience`
3. Run integration tests: `npm run test:integration`
4. Run E2E tests: `npm run test:e2e`
5. Build production: `npm run build`
6. Health check: `npm run health-check`

### Production Deployment
```bash
# 1. Build the application
npm run build

# 2. Emergency build (if ESLint errors block deployment)
node build-quick.js  # Bypasses ESLint/TypeScript validation

# 3. Restart production service
systemctl restart svlentes-nextjs

# 4. Verify deployment
curl -I https://svlentes.com.br
journalctl -u svlentes-nextjs -n 50
```

## Troubleshooting

### Build Failures
- Check TypeScript errors: `npm run lint`
- Verify all environment variables are set
- Ensure Prisma client is generated: `npx prisma generate`
- Clear Next.js cache: `rm -rf .next`

**Emergency Build if ESLint Blocks Deployment:**
```bash
node build-quick.js  # Bypasses ESLint/TypeScript validation
```

### 500 Errors on Static Chunks
**Symptoms**: All pages show 500 errors for .js files
**Solution**:
```bash
# 1. Check service status
systemctl status svlentes-nextjs

# 2. Kill conflicting processes
lsof -ti:5000 | xargs kill -9

# 3. Emergency rebuild
node build-quick.js

# 4. Restart service
systemctl restart svlentes-nextjs
```

### Payment Integration Issues
- **Stripe**: Verify API keys and webhook secret configuration
- **Customer Portal**: Check Stripe Dashboard > Settings > Customer Portal
- **Firebase Integration**: Verify users have `stripeCustomerId` in custom claims

### WhatsApp/SendPulse Issues
- Verify SendPulse credentials in `.env.sendpulse`
- Check webhook endpoint is publicly accessible
- Monitor webhook logs for incoming messages

## Security & Compliance

### LGPD Compliance Requirements
- **Explicit Consent**: Required for all data collection
- **Data Minimization**: Collect only essential data
- **Right to Access**: Users can request data via `/api/privacy/data-request`
- **Right to Deletion**: Implementation for data erasure requests
- **Audit Trail**: All data access logged via `/api/privacy/consent-log`

### Healthcare Compliance
- Emergency contact information required throughout application
- Medical responsibility clearly stated (Dr. Philipe Saraiva Cruz, CRM-MG 69.870)
- Prescription validation mandatory for subscription changes
- Professional credentials visible in all patient-facing areas

### Security Headers (Currently Disabled CSP)
```javascript
// CSP temporarily disabled to allow Stripe script loading
// Content-Security-Policy configured for:
// - Stripe domains (js.stripe.com, checkout.stripe.com)
// - Google OAuth domains
// - Firebase domains
// - Self-hosted resources
```

## Important Notes

- **Healthcare Platform**: Handles medical data - LGPD compliance mandatory
- **Production Environment**: All services are customer-facing - test thoroughly
- **Payment Gateway**: Stripe is PRIMARY (Asaas deprecated)
- **WhatsApp Business**: SendPulse integration with 24-hour conversation windows
- **Emergency Procedures**: Use `build-quick.js` for critical deployment issues
- **Service Dependencies**: Nginx depends on Next.js service on port 5000
- **Monitoring**: Use `journalctl` and health endpoints for system status

## Additional Resources

### API Endpoints
- **Health Check**: `/api/health-check`
- **Stripe APIs**: `/api/stripe/subscription`, `/api/stripe/customer-portal`
- **Webhooks**: `/api/webhooks/stripe`, `/api/webhooks/sendpulse`
- **Admin APIs**: `/api/admin/dashboard/*`, `/api/admin/analytics/*`

### Documentation Files
- `/claudedocs/` - Technical documentation and implementation guides
- `/e2e/` - E2E test documentation and coverage reports
- `/scripts/` - Deployment and utility scripts

### Performance Monitoring
- Application logs: `journalctl -u svlentes-nextjs -f`
- Nginx access logs: `/var/log/nginx/svlentes.com.br.access.log`
- Error logs: `/var/log/nginx/error.log`
- Lighthouse CI reports: Available via `npm run lighthouse`