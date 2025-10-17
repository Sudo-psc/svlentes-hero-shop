# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SV Lentes Landing Page** is a Next.js 15 application for a contact lens subscription service with medical oversight. This is a production healthcare platform serving Saraiva Vision clinic in Caratinga/MG, Brazil.

**Business Context:**
- Contact lens subscription service with ophthalmological monitoring
- Responsible Physician: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
- LGPD-compliant (Brazilian data protection law)
- Production domains: **svlentes.com.br** (primary) / **svlentes.shop** (alternative)
- Payment processor: **Asaas API v3** (Brazilian gateway - PIX, Boleto, Cartão de Crédito)
- WhatsApp integration: **SendPulse** for customer support automation

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

# View Nginx configuration
cat /etc/nginx/sites-enabled/svlentes.com.br
cat /etc/nginx/sites-enabled/svlentes.shop
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

### Database Operations
```bash
npm run db:seed          # Seed database with initial data
npx prisma generate      # Generate Prisma Client
npx prisma migrate dev   # Run migrations in development
npx prisma studio        # Open Prisma Studio GUI
```

### Health Monitoring
```bash
npm run health-check     # Check application health
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
│   │   ├── webhooks/      # Webhook handlers
│   │   │   ├── asaas/     # Asaas payment webhooks
│   │   │   └── sendpulse/ # SendPulse WhatsApp webhooks
│   │   ├── asaas/         # Payment creation endpoints
│   │   ├── whatsapp/      # WhatsApp conversation management
│   │   ├── sendpulse/     # SendPulse integration
│   │   ├── monitoring/    # Health and performance endpoints
│   │   ├── privacy/       # LGPD compliance endpoints
│   │   ├── schedule-consultation/ # Appointment booking
│   │   ├── whatsapp-redirect/ # WhatsApp integration
│   │   ├── create-checkout/ # Checkout session creation
│   │   └── health-check/  # Application health status
│   ├── calculadora/       # Savings calculator page
│   ├── assinar/          # Subscription signup flow
│   ├── agendar-consulta/ # Consultation scheduling
│   ├── area-assinante/    # Subscriber dashboard
│   ├── lentes-diarias/    # Daily lenses information
│   ├── politica-privacidade/ # Privacy policy (LGPD)
│   ├── termos-uso/        # Terms of service
│   ├── success/           # Payment success page
│   ├── cancel/            # Payment cancellation page
│   └── agendamento-confirmado/ # Booking confirmation
├── components/
│   ├── ui/                # shadcn/ui components (Radix primitives)
│   ├── sections/          # Landing page sections
│   ├── forms/             # Form components with validation
│   ├── layout/            # Header, Footer components
│   ├── trust/             # Trust indicators and credibility
│   ├── assinante/         # Subscriber area components
│   └── privacy/           # LGPD compliance components
├── lib/
│   ├── calculator.ts      # Savings calculation logic
│   ├── sendpulse-client.ts # SendPulse API client
│   ├── sendpulse-auth.ts   # SendPulse authentication
│   ├── langchain-support-processor.ts # AI-powered support
│   └── utils.ts           # Utility functions (cn, etc.)
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
- **Asaas API v3** for payment processing (Brazilian market)
- **SendPulse** for WhatsApp Business integration
- **LangChain + OpenAI** for AI-powered customer support
- **Prisma** for database ORM (PostgreSQL)
- **Jest** for unit testing
- **Playwright** for E2E testing

### Payment Integration

**Asaas Payment Gateway (Primary):**
- Brazilian payment processor (PIX, Boleto, Cartão de Crédito)
- API endpoint: `/api/asaas/create-payment`
- Webhook endpoint: `/api/webhooks/asaas`
- Supports recurring subscriptions
- Production and sandbox environments
- Webhook events: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`
- Authentication via `ASAAS_API_KEY_PROD` and `ASAAS_WEBHOOK_TOKEN`

**Stripe (Legacy/Backup):**
- Secondary payment processor
- Checkout sessions via `/api/create-checkout`
- Webhook endpoint: `/api/webhooks/stripe`

### WhatsApp Integration

**SendPulse WhatsApp Business:**
- Automated customer support via WhatsApp
- Webhook endpoint: `/api/webhooks/sendpulse`
- AI-powered intent detection and response generation
- Conversation tracking and ticket escalation
- Database models: `WhatsAppConversation`, `WhatsAppInteraction`
- Environment variables: Check `.env.sendpulse` for required configuration

**AI Support Processing:**
- LangChain for natural language understanding
- OpenAI GPT for response generation
- Intent classification: subscription_inquiry, billing_support, delivery_status, etc.
- Automatic ticket creation for complex issues
- Response templates with personalization

### Database Schema (Prisma + PostgreSQL)

**Core Models:**
- `User` - User accounts with Google OAuth and Firebase integration
- `Subscription` - Subscription plans with Asaas integration
- `Payment` - Individual payment records from Asaas webhooks
- `Order` - Lens delivery orders with tracking
- `SupportTicket` - Customer support tickets with escalation

**WhatsApp Models:**
- `WhatsAppConversation` - Conversation threads
- `WhatsAppInteraction` - Individual messages with AI analysis
- `FAQ` - Knowledge base for automated responses

**LGPD Compliance Models:**
- `ConsentLog` - User consent tracking
- `DataRequest` - Data access/deletion requests

**Notification System:**
- `Notification` - Multi-channel notifications (email, WhatsApp, SMS)
- `UserBehavior` - ML-driven engagement optimization
- `Campaign` - Marketing campaign management

### Design System

**Color Scheme:**
- **Primary**: Cyan (`#06b6d4`) with full range 50-900
- **Secondary**: Silver (`#64748b`) with metallic variants
- **Success**: Green (`#22c55e`)
- **Warning**: Amber (`#f59e0b`)
- **WhatsApp**: Official green (`#25d366`)
- **Medical**: Professional gray palette for healthcare context

**Typography:**
- **Sans**: Inter (body text)
- **Heading**: Poppins (headings and emphasis)

**Animations:**
- Custom animations: `fade-in`, `slide-up`, `pulse-slow`, `float`, `glow`
- Accordion animations from Radix UI
- Framer Motion for complex interactions

**Custom Utilities:**
- Glass morphism effects (`shadow-glass`, `backdrop-blur-xs`)
- Neon glow effects (`shadow-neon`, `shadow-neon-lg`)
- Extended border radius system

### Security Configuration

**Next.js Security Headers (next.config.js:59-122):**
- **HSTS**: Strict-Transport-Security with preload
- **CSP**: Content Security Policy optimized for Asaas, Google OAuth
- **X-Frame-Options**: SAMEORIGIN
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: enabled with block mode
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: restrictive camera/microphone/geolocation

**Image Optimization:**
- Remote patterns: Unsplash, Google, svlentes.shop
- Formats: WebP, AVIF
- Device sizes: 640-3840px
- Quality levels: 75-100
- 7-day cache TTL
- SVG support with sandboxing

**API Security:**
- Asaas webhook token validation
- SendPulse webhook authentication
- CORS configuration for payment providers
- Rate limiting on sensitive endpoints
- No sensitive data in client-side code

## Important Implementation Details

### Healthcare Compliance
- All features must comply with Brazilian healthcare regulations (CFM/CRM)
- Emergency contact information required throughout application
- Prescription validation is mandatory - never bypass medical authorization
- LGPD compliance for data protection with explicit consent tracking
- Audit trail via `/api/privacy/consent-log` and `/api/privacy/data-request`

### LGPD Data Protection
- **Consent Management**: Explicit user consent required for data collection
- **Data Minimization**: Collect only essential data (scheduling, prescriptions, delivery)
- **Right to Access**: Users can request their data via privacy endpoints
- **Right to Deletion**: Implementation for data erasure requests
- **Audit Trail**: All data access logged for compliance

### Environment Variables
```bash
# Application
NEXT_PUBLIC_APP_URL=https://svlentes.shop
NEXT_PUBLIC_WHATSAPP_NUMBER=553399898026

# Asaas Payment (Required for production)
ASAAS_ENV=production
ASAAS_API_KEY_PROD=<production-key>
ASAAS_API_KEY_SANDBOX=<sandbox-key>
ASAAS_WEBHOOK_TOKEN=<webhook-secret>

# SendPulse WhatsApp Integration
SENDPULSE_USER_ID=<user-id>
SENDPULSE_SECRET=<api-secret>
SENDPULSE_ACCESS_TOKEN=<access-token>
SENDPULSE_REFRESH_TOKEN=<refresh-token>
SENDPULSE_BOT_ID=<whatsapp-bot-id>

# AI/LangChain
OPENAI_API_KEY=<openai-key>
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=<langchain-key>

# Database (Prisma)
DATABASE_URL=<postgresql-url>

# Optional Integrations
NEXT_PUBLIC_GA_MEASUREMENT_ID=<analytics-id>
RESEND_API_KEY=<email-service-key>
NEXTAUTH_SECRET=<auth-secret>
NEXTAUTH_URL=https://svlentes.shop
```

### Testing Strategy
- **Unit Tests**: Jest for business logic (calculator, validation, utilities)
- **E2E Tests**: Playwright covering critical user flows
  - Subscription flow
  - Calculator interaction
  - Form validation
  - Payment integration
  - Consultation scheduling
- **Component Tests**: UI components and sections
- **Performance**: Lighthouse CI for web vitals monitoring

### Critical Business Logic

**Savings Calculator (src/lib/calculator.ts):**
- Compares subscription cost vs individual lens purchases
- Handles different lens types (daily, monthly)
- Accounts for delivery frequency
- Calculates annual savings projections

**Form Validation:**
- React Hook Form for form state management
- Zod schemas for runtime validation
- Brazilian-specific validations (CPF, phone format)

**WhatsApp Integration:**
- SendPulse webhook handling for incoming messages
- LangChain-powered intent classification
- Automated response generation with context awareness
- Ticket escalation for complex queries
- Direct contact flow via `/api/whatsapp-redirect`

## Development Workflow

### Local Development
1. Install dependencies: `npm install`
2. Copy environment example: `cp .env.local.example .env.local`
3. Configure Asaas sandbox keys in `.env.local`
4. Configure database: Set `DATABASE_URL` in `.env.local`
5. Run migrations: `npx prisma migrate dev`
6. Start development server: `npm run dev`
7. Access at http://localhost:3000

### Testing Before Deploy
1. Run unit tests: `npm run test`
2. Run E2E tests: `npm run test:e2e`
3. Build production: `npm run build`
4. Health check: `npm run health-check`

### Production Deployment
```bash
# 1. Build the application
npm run build

# 2. Restart production service
systemctl restart svlentes-nextjs

# 3. Verify deployment
curl -I https://svlentes.com.br
journalctl -u svlentes-nextjs -n 50

# 4. Monitor health endpoints
curl https://svlentes.com.br/api/health-check
```

### Deployment Checklist
- [ ] All tests passing (`npm run test && npm run test:e2e`)
- [ ] Production build successful (`npm run build`)
- [ ] Environment variables configured
- [ ] Asaas production keys active
- [ ] SendPulse integration configured
- [ ] SSL certificates valid (Let's Encrypt via Certbot)
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] Health check endpoint responding
- [ ] Database migrations applied
- [ ] Monitoring alerts configured
- [ ] Clear Next.js build cache if needed (`rm -rf .next`)

## API Endpoints

### Public Endpoints
- `GET /api/health-check` - Application health status
- `POST /api/schedule-consultation` - Book medical consultation
- `POST /api/asaas/create-payment` - Create Asaas payment
- `POST /api/webhooks/asaas` - Asaas webhook handler
- `POST /api/webhooks/sendpulse` - SendPulse WhatsApp webhook
- `GET /api/whatsapp-redirect` - WhatsApp contact redirect

### Monitoring Endpoints
- `GET /api/monitoring/performance` - Performance metrics
- `GET /api/monitoring/errors` - Error logs
- `GET /api/monitoring/alerts` - System alerts

### Privacy/LGPD Endpoints
- `POST /api/privacy/consent-log` - Log user consent
- `POST /api/privacy/data-request` - Data access/deletion requests

## Regulatory Requirements

### LGPD Compliance
- Explicit consent required for all data collection
- Data usage limited to scheduling, prescriptions, delivery logistics
- Audit trail for medical data access
- Right to deletion implementation
- Privacy policy accessible at `/politica-privacidade`

### Medical Safety
- Emergency signs prominently displayed
- Prescription validation mandatory
- Medical responsibility clearly stated
- Professional credentials (CRM) visible throughout
- Emergency contact information available

## Domain-Specific Knowledge

### Brazilian Payment Market
- **PIX**: Instant payment method (preferred by users)
- **Boleto Bancário**: Traditional bank slip payment
- **Cartão de Crédito**: Credit card with installment options (parcelamento)
- **Asaas**: Specialized Brazilian payment gateway with local expertise

### Healthcare in Brazil
- **CRM**: Conselho Regional de Medicina (state medical council registration)
- **CFM**: Conselho Federal de Medicina (federal medical council)
- **Telemedicine**: Regulations for remote consultations (CFM Resolution 2.314/2022)
- **Emergency Care**: Mandatory emergency contact information for medical services

### Contact Information
- **WhatsApp**: +55 33 99898-026
- **Email**: saraivavision@gmail.com
- **Website**: svlentes.shop
- **Responsible Physician**: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)

## Nginx Reverse Proxy Configuration

### Overview
The application uses **Nginx 1.24.0** as reverse proxy for SSL termination and routing.

### Virtual Hosts
- **svlentes.com.br** (primary domain) → proxies to `localhost:5000`
- **svlentes.shop** (alternative) → redirects to `svlentes.com.br`

### Key Features
- **SSL/TLS**: Let's Encrypt certificates with auto-renewal via Certbot
- **HTTP/2**: Enabled for performance
- **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Static Asset Caching**: `/_next/static` cached for 365 days
- **Image Optimization**: 1-year expiry for images/fonts
- **Client Max Body**: 10MB limit

### Configuration Files
```
/etc/nginx/sites-available/svlentes.com.br  # Main config
/etc/nginx/sites-available/svlentes.shop     # Redirect config
/etc/nginx/sites-enabled/                    # Symlinks to enabled sites
```

### SSL Certificate Management
```bash
# List certificates
certbot certificates

# Renew certificates (automatic via systemd timer)
certbot renew

# Test auto-renewal
certbot renew --dry-run

# View certificate expiry
certbot certificates | grep Expiry

# Manual renewal if needed
certbot renew --force-renewal
systemctl reload nginx
```

### Cache Management
```bash
# Clear Next.js build cache
rm -rf .next

# Rebuild application
npm run build

# Restart services
systemctl restart svlentes-nextjs
systemctl reload nginx

# Force browser cache clear
# Note: Nginx caches /_next/static for 365 days
# Users may need Ctrl+F5 (hard refresh) after updates
```

### Common Nginx Operations
```bash
# Test configuration before applying
nginx -t

# Reload configuration (no downtime)
systemctl reload nginx

# Restart Nginx (brief downtime)
systemctl restart nginx

# View access logs
tail -f /var/log/nginx/svlentes.com.br.access.log

# View error logs
tail -f /var/log/nginx/error.log

# Check which process is using port 443
lsof -ti:443
```

### Troubleshooting Nginx

**Configuration Test Warnings:**
```
protocol options redefined for [::]:443
```
This is a known warning when multiple virtual hosts use the same SSL settings. It's safe to ignore.

**Port Already in Use:**
```bash
# Check what's using port 80/443
netstat -tlnp | grep -E ":80|:443"

# If needed, stop conflicting service
systemctl stop caddy  # If Caddy is installed but not in use
```

**SSL Certificate Issues:**
```bash
# Verify certificate files exist
ls -la /etc/letsencrypt/live/svlentes.com.br/
ls -la /etc/letsencrypt/live/svlentes.shop/

# Test SSL connection
openssl s_client -connect svlentes.com.br:443 -servername svlentes.com.br

# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/svlentes.com.br/fullchain.pem -text -noout | grep "Not After"
```

**Changes Not Reflecting:**
1. Clear Next.js cache: `rm -rf .next`
2. Rebuild: `npm run build`
3. Restart Next.js: `systemctl restart svlentes-nextjs`
4. Reload Nginx: `systemctl reload nginx`
5. Clear browser cache: Ctrl+F5 (hard refresh)

## Troubleshooting

### Build Failures
- Check TypeScript errors: `npm run lint`
- Verify all environment variables are set
- Ensure Prisma client is generated: `npx prisma generate`

### Payment Integration Issues
- Verify Asaas API keys in environment variables
- Check webhook token matches Asaas dashboard
- Monitor webhook logs: `journalctl -u svlentes-nextjs -f`
- Test in sandbox environment first

### WhatsApp/SendPulse Issues
- Verify SendPulse credentials in `.env.sendpulse`
- Check webhook endpoint is publicly accessible
- Monitor webhook logs for incoming messages
- Test AI response generation locally
- Verify database has WhatsApp tables: `npx prisma studio`

### Performance Issues
- Check monitoring endpoints: `/api/monitoring/performance`
- Review Lighthouse CI reports
- Verify image optimization settings
- Check Next.js build output for large bundles

### Database Issues
- Check DATABASE_URL connection string
- Run migrations: `npx prisma migrate dev`
- Verify PostgreSQL is running
- Check Prisma Studio for data: `npx prisma studio`
