# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SV Lentes Landing Page** is a Next.js 16.0.1 application for a contact lens subscription service with medical oversight. This is a production healthcare platform serving Saraiva Vision clinic in Caratinga/MG, Brazil.

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

### Subscriber Dashboard Phase 1 (Issue #31)

**Enhanced Features** (2025-10-23):
- 🎨 **AccessibleDashboard**: WCAG 2.1 AA compliant interface with ARIA landmarks
- 📊 **EnhancedSubscriptionCard**: Real-time billing countdown, expandable sections
- 🔔 **ToastFeedback**: Non-intrusive notification system with 4 types
- 📦 **OrdersModal**: Complete order history with tracking integration
- 📄 **InvoicesModal**: Invoice download and payment history
- 🔄 **ChangePlanModal**: Visual plan comparison and instant switching
- 📍 **UpdateAddressModal**: CEP lookup and address validation
- 💳 **UpdatePaymentModal**: Secure payment updates via Asaas
- 🚨 **EmergencyContact**: Healthcare compliance with Dr. Philipe's info
- 📅 **SubscriptionHistoryTimeline**: Visual event timeline

**New APIs**:
- `GET /api/assinante/subscription` - Fetch active subscription
- `PUT /api/assinante/subscription` - Update shipping address
- `GET /api/assinante/orders` - List order history
- `GET /api/assinante/invoices` - List invoices/receipts
- `POST /api/assinante/register` - User registration

**Documentation**:
- 📡 [API Documentation](./claudedocs/SUBSCRIBER_DASHBOARD_PHASE1_APIS.md)
- 🎨 [Component Guide](./claudedocs/SUBSCRIBER_DASHBOARD_PHASE1_COMPONENTS.md)
- 🏗️ [Architecture](./claudedocs/SUBSCRIBER_DASHBOARD_ARCHITECTURE.md)
- 🔧 [Troubleshooting](./claudedocs/SUBSCRIBER_DASHBOARD_TROUBLESHOOTING.md)
- 📋 [Changelog](./claudedocs/CHANGELOG.md)

### Next.js 16 App Router Structure
```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main landing page
│   ├── layout.tsx         # Root layout with metadata
│   ├── globals.css        # Global styles and CSS variables
│   ├── api/               # API routes
│   │   ├── assinante/     # Subscriber dashboard APIs (NEW - Phase 1)
│   │   │   ├── subscription/ # Subscription management
│   │   │   ├── orders/    # Order history
│   │   │   ├── invoices/  # Invoice download
│   │   │   └── register/  # User registration
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
- **Next.js 16.0.1** with App Router, TypeScript, and Turbopack
- **Tailwind CSS v4** with custom cyan/silver color scheme
- **shadcn/ui** component library with Radix UI primitives
- **React Hook Form** with Zod validation
- **Framer Motion** for animations
- **Firebase Authentication** - Primary authentication system (ID tokens)
- **Clerk** - Secondary authentication option (integrated but not primary)
- **Asaas API v3** for payment processing (Brazilian market)
- **SendPulse** for WhatsApp Business integration
- **LangChain + OpenAI** for AI-powered customer support
- **Prisma** for database ORM (PostgreSQL)
- **Jest** for unit testing
- **Vitest** for resilience and integration testing
- **Playwright** for E2E testing
- **Lighthouse CI** for performance monitoring

### Firebase Authentication (Primary)

**Implementation:**
Firebase Authentication is the primary authentication system used throughout the application. Token-based authentication with Firebase ID tokens protects all subscriber routes.

**Key Components:**
- **Client SDK**: `src/lib/firebase.ts` - Client-side Firebase configuration
- **Admin SDK**: `src/lib/firebase-admin.ts` - Server-side Firebase Admin for token verification
- **Middleware**: `src/middleware.ts:280-404` - Route protection and token validation

**Protected Routes:**
- `/area-assinante/*` - All subscriber dashboard pages
- `/api/assinante/*` - All subscriber API endpoints

**Public Routes (excluded from protection):**
- `/area-assinante/login` - Login page
- `/area-assinante/registro` - Registration page
- `/api/assinante/register` - Registration API endpoint

**Authentication Flow:**
1. User logs in → Firebase Client SDK generates ID token
2. Token stored in cookie (`firebase-token`) or localStorage
3. Middleware checks for token on protected routes
4. Token sent via `Authorization: Bearer <token>` header or cookie
5. API routes verify token using Firebase Admin SDK
6. Successful verification extracts `firebaseUid` for database queries

**Token Storage:**
- **Cookie**: `firebase-token` (preferred for SSR)
- **Header**: `Authorization: Bearer <token>` (for API calls)
- **Validation**: Middleware at `src/middleware.ts:368-404`

**Environment Variables:**
```bash
# Firebase Admin SDK (server-side)
FIREBASE_PROJECT_ID=<your-project-id>
FIREBASE_CLIENT_EMAIL=<service-account-email>
FIREBASE_PRIVATE_KEY=<service-account-private-key>

# Firebase Client SDK (client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=<firebase-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>
```

**API Route Pattern with Firebase Auth:**
```typescript
import { adminAuth } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 1. Extract token
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Token não fornecido' },
      { status: 401 }
    );
  }

  // 2. Verify token with Firebase Admin
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // 3. Use firebaseUid for database queries
    const data = await prisma.model.findMany({
      where: { firebaseUid }
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Token inválido' },
      { status: 401 }
    );
  }
}
```

### Clerk Authentication (Secondary/Optional)

**Overview:**
- Modern authentication platform available as alternative to Firebase
- Built-in support for social logins, email/password, passwordless authentication
- Currently integrated but **not the primary authentication system**
- Can be used for new features while maintaining Firebase for existing functionality

**Implementation Details:**
- **Middleware**: `src/middleware.ts` - Clerk middleware integrated alongside Firebase
- **Layout**: `ClerkProvider` wraps application in `src/app/layout.tsx`
- **Demo**: `/clerk-demo` page for testing Clerk authentication flow

**Components Available:**
- `<SignInButton>` - Trigger sign-in modal or redirect
- `<SignUpButton>` - Trigger sign-up modal or redirect
- `<UserButton>` - User profile dropdown with account management
- `<SignedIn>` - Conditional rendering for authenticated users
- `<SignedOut>` - Conditional rendering for unauthenticated users

**Configuration:**
```bash
# Clerk Authentication (Optional - Firebase is primary)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<clerk-publishable-key>
CLERK_SECRET_KEY=<clerk-secret-key>
```

**Note**: Middleware preserves all existing security headers and logging. Error handling prevents authentication failures from crashing the application.

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

**Phone Number Management:**
All phone numbers throughout the codebase are managed centrally via `src/lib/phone-utils.ts`:

```typescript
import { CHATBOT_PHONE, SUPPORT_PHONE, formatPhoneDisplay, getWhatsAppURL } from '@/lib/phone-utils';

// Display formatted phone numbers
const chatbotDisplay = formatPhoneDisplay(CHATBOT_PHONE);    // "(33) 99989-8026"
const supportDisplay = formatPhoneDisplay(SUPPORT_PHONE);    // "(33) 98606-1427"

// Generate WhatsApp link
const whatsappLink = getWhatsAppURL(CHATBOT_PHONE, "Olá! Preciso de ajuda.");
// Returns: "https://wa.me/5533999898026?text=Olá%21%20Preciso%20de%20ajuda."

// Generate tel link
const telLink = getTelURL(SUPPORT_PHONE);
// Returns: "tel:+5533986061427"
```

**Phone Numbers:**
- **WhatsApp Chatbot**: `NEXT_PUBLIC_WHATSAPP_NUMBER` (5533999898026)
  - Display format: `(33) 99989-8026`
  - For automated customer support via SendPulse

- **Direct Support**: `NEXT_PUBLIC_SUPPORT_PHONE` (5533986061427)
  - Display format: `(33) 98606-1427`
  - For human escalation and complex issues

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
- Firebase token validation on protected routes
- Asaas webhook token validation
- SendPulse webhook authentication
- CORS configuration for payment providers
- **Rate Limiting**: Comprehensive rate limiting on all API routes
- No sensitive data in client-side code

### Rate Limiting

**Implementation** (Added: 2025-10-30):
- Rate limiting implemented in `src/middleware.ts` using `@upstash/ratelimit`
- Supports both Upstash Redis (distributed) and in-memory storage (single-instance)
- Automatic failover to in-memory if Redis is not configured
- Returns HTTP 429 with proper headers when limit exceeded

**Rate Limits by Endpoint:**
- `/api/assinante/*` - 100 requests/hour per authenticated user (via Firebase UID)
- `/api/webhooks/*` - 1000 requests/hour per webhook source (IP or token)
- `/api/asaas/*` - 50 requests/hour per IP address
- All other `/api/*` - 200 requests/hour per IP

**Rate Limit Headers:**
- `X-RateLimit-Limit` - Maximum requests allowed in current window
- `X-RateLimit-Remaining` - Requests remaining in current window
- `X-RateLimit-Reset` - Unix timestamp when limit resets
- `Retry-After` - Seconds until rate limit resets (included in 429 response)

**Configuration:**
```bash
# Optional - defaults to in-memory if not configured
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token_here
```

**Monitoring:**
- Rate limit violations logged to console with identifier, pathname, and limit
- All rate limit checks logged for monitoring and analytics
- Fail-open policy: errors don't block requests (logged and allowed)

**Key Files:**
- `src/middleware.ts:288-446` - Rate limiting middleware implementation
- `src/lib/rate-limiter.ts` - Rate limiter configuration and utilities

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

# Contact Numbers
NEXT_PUBLIC_WHATSAPP_NUMBER=5533999898026  # Chatbot: (33) 99989-8026
NEXT_PUBLIC_SUPPORT_PHONE=5533986061427     # Direct Support: (33) 98606-1427

# Firebase Authentication (Primary - Required)
FIREBASE_PROJECT_ID=<your-project-id>
FIREBASE_CLIENT_EMAIL=<service-account-email>
FIREBASE_PRIVATE_KEY=<service-account-private-key>
NEXT_PUBLIC_FIREBASE_API_KEY=<firebase-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>

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
DATABASE_DIRECT_URL=<postgresql-direct-url>  # Optional: for migrations

# Clerk Authentication (Optional - Firebase is primary)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<clerk-publishable-key>
CLERK_SECRET_KEY=<clerk-secret-key>

# Rate Limiting (Optional - defaults to in-memory if not configured)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=<upstash-redis-token>

# Optional Integrations
NEXT_PUBLIC_GA_MEASUREMENT_ID=<analytics-id>
RESEND_API_KEY=<email-service-key>
NEXTAUTH_SECRET=<auth-secret>
NEXTAUTH_URL=https://svlentes.shop
```

### Testing Strategy
- **Unit Tests**: Jest for business logic (calculator, validation, utilities)
- **Resilience Tests**: Vitest for offline functionality, backup systems, error recovery
- **Integration Tests**: Vitest for API endpoint testing and database operations
- **E2E Tests**: Playwright covering critical user flows
  - Subscription flow
  - Calculator interaction
  - Form validation
  - Payment integration
  - Consultation scheduling
  - WhatsApp chatbot interaction
- **Component Tests**: UI components and sections
- **Performance**: Lighthouse CI for web vitals monitoring with automated audits

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

**Chatbot Authentication System (src/lib/chatbot-auth-handler.ts):**
- **Automatic phone-based authentication**: No OTP codes required
- When user sends WhatsApp message, system automatically checks if phone number is registered
- If registered with active subscription, creates 24-hour session automatically
- Authentication flow:
  1. Message received → Check existing session
  2. If no session → Lookup user by phone in database
  3. If found + active subscription → Create ChatbotSession (24h validity)
  4. If not found → Send registration link message
- Session managed via `ChatbotSession` model in Prisma
- Subscription management commands available after authentication:
  - `"minha assinatura"` - View subscription details
  - `"pausar assinatura"` - Pause subscription (default 30 days)
  - `"reativar assinatura"` - Reactivate paused subscription
  - `"próxima entrega"` - Check next delivery details

## Common Development Patterns

### API Route Structure with Firebase Authentication
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // 1. Extract and verify Firebase token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token não fornecido' },
        { status: 401 }
      );
    }

    // 2. Verify token with Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // 3. Fetch data from database using firebaseUid
    const subscription = await prisma.subscription.findFirst({
      where: {
        user: { firebaseUid }
      },
      include: {
        user: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Assinatura não encontrada' },
        { status: 404 }
      );
    }

    // 4. Return response
    return NextResponse.json({
      subscription
    }, { status: 200 });

  } catch (error) {
    console.error('[API Error]:', error);

    // Firebase auth errors
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'TOKEN_EXPIRED', message: 'Token expirado' },
        { status: 401 }
      );
    }

    // Generic error
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 1. Extract and verify token (same as GET)
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // 2. Parse and validate request body
    const body = await request.json();

    // Use Zod for validation (optional but recommended)
    const { address, city, state, zipCode } = body;

    // 3. Update database
    const updatedSubscription = await prisma.subscription.update({
      where: {
        user: { firebaseUid }
      },
      data: {
        shippingAddress: address,
        shippingCity: city,
        shippingState: state,
        shippingZipCode: zipCode,
        updatedAt: new Date()
      }
    });

    // 4. Return updated data
    return NextResponse.json({
      subscription: updatedSubscription
    }, { status: 200 });

  } catch (error) {
    console.error('[API Error]:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
```

### Form Validation Pattern
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Define Zod schema with Brazilian-specific validations
const addressFormSchema = z.object({
  zipCode: z.string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP deve ter formato 12345-678'),
  street: z.string().min(3, 'Endereço deve ter no mínimo 3 caracteres'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres (ex: MG)'),
});

type AddressFormData = z.infer<typeof addressFormSchema>;

// 2. Use in component
function AddressForm() {
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: ''
    }
  });

  const onSubmit = async (data: AddressFormData) => {
    try {
      // Get Firebase token
      const token = await getFirebaseToken(); // Your auth helper

      // Submit to API
      const response = await fetch('/api/assinante/subscription', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to update address');

      const result = await response.json();
      console.log('Address updated:', result);

    } catch (error) {
      console.error('Error updating address:', error);
      form.setError('root', {
        message: 'Erro ao atualizar endereço. Tente novamente.'
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Form fields using form.register() */}
      <input {...form.register('zipCode')} placeholder="CEP" />
      {form.formState.errors.zipCode && (
        <p className="text-red-500">{form.formState.errors.zipCode.message}</p>
      )}

      {/* ... other fields ... */}

      <button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
}
```

### Database Query Pattern
```typescript
import { prisma } from '@/lib/prisma';

// Always import Prisma client from singleton instance

// Example: Find subscription with related data
const subscription = await prisma.subscription.findFirst({
  where: {
    user: { firebaseUid: 'firebase-uid-here' },
    status: 'ACTIVE'
  },
  include: {
    user: true,  // Include user data
    orders: {
      where: { status: 'DELIVERED' },
      orderBy: { createdAt: 'desc' },
      take: 10  // Last 10 delivered orders
    },
    payments: {
      where: { status: 'PAID' },
      orderBy: { paidAt: 'desc' }
    }
  }
});

// Example: Create new order with transaction
const newOrder = await prisma.$transaction(async (tx) => {
  // 1. Create order
  const order = await tx.order.create({
    data: {
      subscriptionId: subscription.id,
      totalAmount: 150.00,
      status: 'PENDING',
      deliveryDate: new Date('2025-12-01')
    }
  });

  // 2. Update subscription next delivery date
  await tx.subscription.update({
    where: { id: subscription.id },
    data: { nextDeliveryDate: new Date('2025-12-01') }
  });

  return order;
});

// Example: Complex query with aggregations
const analytics = await prisma.subscription.aggregate({
  where: { status: 'ACTIVE' },
  _count: { id: true },
  _avg: { monthlyPrice: true },
  _sum: { monthlyPrice: true }
});
```

### Client-Side Firebase Authentication
```typescript
'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Get ID token
      const token = await userCredential.user.getIdToken();

      // Store token in cookie for server-side access
      document.cookie = `firebase-token=${token}; path=/; max-age=3600; secure; samesite=strict`;

      // Redirect to dashboard
      window.location.href = '/area-assinante/dashboard';

    } catch (error) {
      console.error('Login error:', error);
      setError('Email ou senha incorretos');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      document.cookie = 'firebase-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
        required
      />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit">Entrar</button>
    </form>
  );
}
```

### Phone Number Utilities Usage
```typescript
import {
  CHATBOT_PHONE,
  SUPPORT_PHONE,
  formatPhoneDisplay,
  getWhatsAppURL,
  getTelURL
} from '@/lib/phone-utils';

// In a component
function ContactSection() {
  return (
    <div>
      {/* WhatsApp Chatbot Link */}
      <a href={getWhatsAppURL(CHATBOT_PHONE, "Olá! Preciso de ajuda com minha assinatura.")}>
        <WhatsAppIcon />
        {formatPhoneDisplay(CHATBOT_PHONE)}
      </a>

      {/* Direct Phone Support Link */}
      <a href={getTelURL(SUPPORT_PHONE)}>
        <PhoneIcon />
        {formatPhoneDisplay(SUPPORT_PHONE)}
      </a>
    </div>
  );
}

// Generate WhatsApp share link
const shareLink = getWhatsAppURL(
  CHATBOT_PHONE,
  "Olá! Vi o site da SVLentes e gostaria de saber mais sobre as assinaturas."
);
// Returns: "https://wa.me/5533999898026?text=Ol%C3%A1!%20Vi%20o%20site..."
```

## Development Workflow

### Local Development
1. Install dependencies: `npm install`
2. Copy environment example: `cp .env.local.example .env.local`
3. Configure Firebase credentials in `.env.local`
4. Configure Asaas sandbox keys in `.env.local`
5. Configure database: Set `DATABASE_URL` in `.env.local`
6. Run migrations: `npx prisma migrate dev`
7. Generate Prisma client: `npx prisma generate`
8. Start development server: `npm run dev`
9. Access at http://localhost:3000
10. Optional: Seed database with sample data: `npm run db:seed`

### Testing Before Deploy
1. Run unit tests: `npm run test`
2. Run resilience tests: `npm run test:resilience`
3. Run integration tests: `npm run test:integration`
4. Run E2E tests: `npm run test:e2e`
5. Build production: `npm run build`
6. Health check: `npm run health-check`
7. Performance audit: `npm run lighthouse`

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
- [ ] All tests passing (`npm run test && npm run test:resilience && npm run test:e2e`)
- [ ] Production build successful (`npm run build`)
- [ ] Environment variables configured (especially Firebase credentials)
- [ ] Asaas production keys active
- [ ] SendPulse integration configured
- [ ] SSL certificates valid (Let's Encrypt via Certbot)
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] Health check endpoint responding
- [ ] Database migrations applied
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Performance audit passing (`npm run lighthouse`)
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

### Protected Subscriber Endpoints (Firebase Auth Required)
- `GET /api/assinante/subscription` - Fetch active subscription
- `PUT /api/assinante/subscription` - Update subscription details
- `GET /api/assinante/orders` - List order history
- `GET /api/assinante/invoices` - List invoices/receipts
- `POST /api/assinante/register` - User registration

### Monitoring Endpoints
- `GET /api/monitoring/performance` - Performance metrics
- `GET /api/monitoring/errors` - Error logs
- `GET /api/monitoring/alerts` - System alerts

### Privacy/LGPD Endpoints
- `POST /api/privacy/consent-log` - Log user consent
- `POST /api/privacy/data-request` - Data access/deletion requests

## Key File Locations

### Authentication
- **Firebase Client**: `src/lib/firebase.ts` - Client SDK configuration
- **Firebase Admin**: `src/lib/firebase-admin.ts` - Server SDK for token verification
- **Middleware Auth**: `src/middleware.ts:280-404` - Route protection logic
- **Rate Limiting**: `src/lib/rate-limiter.ts` - API rate limit configuration

### Business Logic
- **Payment Processing**: `src/lib/asaas.ts` - Asaas API client
- **WhatsApp Chatbot**: `src/lib/sendpulse-client.ts` - SendPulse API
- **Chatbot Auth**: `src/lib/chatbot-auth-handler.ts` - Phone-based authentication
- **Calculator Logic**: `src/lib/calculator.ts` - Savings calculations
- **Validation Schemas**: `src/lib/validation-schemas.ts` - Zod schemas

### Database
- **Prisma Client**: `src/lib/prisma.ts` - Singleton Prisma instance
- **Schema**: `prisma/schema.prisma` - Database models and relations
- **Migrations**: `prisma/migrations/` - Schema version history
- **Seed**: `prisma/seed.ts` - Test data generation

### Utilities
- **Phone Utils**: `src/lib/phone-utils.ts` - Phone number management
- **General Utils**: `src/lib/utils.ts` - Utility functions (cn, etc.)
- **Formatters**: `src/lib/formatters.ts` - Data formatting helpers
- **Validators**: `src/lib/validators.ts` - Input validation

### Configuration
- **Next.js**: `next.config.js` - Build config, security headers, image optimization
- **TypeScript**: `tsconfig.json` - Path aliases, compiler options
- **Tailwind**: `tailwind.config.js` - Custom theme, colors, animations
- **Prisma**: `prisma/schema.prisma` - Database schema
- **Environment**: `.env.local` - Local development variables

### Testing
- **Unit Tests**: `src/__tests__/` - Jest unit tests
- **E2E Tests**: `e2e/` - Playwright E2E tests
- **Test Helpers**: `e2e/helpers/` - Shared test utilities
- **Fixtures**: `e2e/fixtures/` - Test data fixtures
- **Config**: `playwright.config.ts` - Playwright configuration

### Component Organization
- **UI Components**: `src/components/ui/` - shadcn/ui base components
- **Layout**: `src/components/layout/` - Header, Footer, Navigation
- **Forms**: `src/components/forms/` - Validation-enabled forms
- **Sections**: `src/components/sections/` - Landing page sections
- **Subscriber**: `src/components/assinante/` - Dashboard components

### Data Configuration
- **Pricing Plans**: `src/data/pricing-plans.ts` - Subscription tiers
- **Calculator Data**: `src/data/calculator-data.ts` - Lens cost presets
- **Medical Info**: `src/data/doctor-info.ts` - Dr. Philipe's credentials
- **FAQ Content**: `src/data/faq-data.ts` - Support Q&A

### Import Aliases (configured in tsconfig.json)
```typescript
@/components/*  → src/components/*
@/lib/*         → src/lib/*
@/types/*       → src/types/*
@/data/*        → src/data/*
@/hooks/*       → src/hooks/*
```

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
- **WhatsApp Chatbot**: +55 33 99989-8026 (5533999898026)
  - **Format**: (33) 99989-8026
  - **Environment Variable**: `NEXT_PUBLIC_WHATSAPP_NUMBER`
  - SendPulse chatbot for automated customer support
  - Users send messages for subscription management

- **Direct Support (Human)**: +55 33 98606-1427 (5533986061427)
  - **Format**: (33) 98606-1427
  - **Environment Variable**: `NEXT_PUBLIC_SUPPORT_PHONE`
  - SaraivaVision team for direct human support
  - Used for escalations and complex issues

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

## Development Tools & Debugging

### Code Quality Tools
```bash
# ESLint configuration
npm run lint            # Check for linting issues
npm run lint:fix        # Auto-fix linting issues
npm run lint:strict     # Strict linting (zero warnings)

# TypeScript checking
npx tsc --noEmit        # Type check without compilation
```

### Debug Commands
```bash
# Test MCP integration
npm run test:mcp        # Test MCP server connectivity

# Test WhatsApp functionality
npm run test:send       # Send test WhatsApp message
npm run test:chatbot    # Test WhatsApp chatbot status

# Database debugging
npx prisma studio        # Visual database browser
npm run db:seed         # Populate with test data
```

### Performance Monitoring
```bash
# Application performance
curl http://localhost:3000/api/monitoring/performance

# Error logs
curl http://localhost:3000/api/monitoring/errors

# System health
curl http://localhost:3000/api/health-check
```

## Resilience & Backup Systems

### Offline Functionality
- **Resilient Data Fetcher**: Handles network failures with graceful degradation
- **Offline Storage**: Local storage backup for critical user data
- **Backup Authentication**: Session persistence during network outages
- **Error Recovery**: Automatic retry mechanisms with exponential backoff

### Resilience Testing
```bash
npm run test:resilience          # Core resilience tests
npm run test:e2e:resilience     # E2E resilience scenarios
npm run test:all                # Complete resilience test suite
```

## Troubleshooting

### Build Failures
- Check TypeScript errors: `npm run lint`
- Verify all environment variables are set (especially Firebase credentials)
- Ensure Prisma client is generated: `npx prisma generate`
- Clear Next.js cache: `rm -rf .next`
- Check Node.js version (requires 20+): `node --version`

### Authentication Issues
- Verify Firebase credentials in environment variables
- Check Firebase Admin SDK service account key format
- Test token generation: use Firebase console to verify user exists
- Monitor middleware logs: `journalctl -u svlentes-nextjs -f | grep Auth`
- Verify token is being sent in Authorization header or cookie

### Payment Integration Issues
- Verify Asaas API keys in environment variables
- Check webhook token matches Asaas dashboard
- Monitor webhook logs: `journalctl -u svlentes-nextjs -f`
- Test in sandbox environment first
- Verify webhook endpoint is publicly accessible

### WhatsApp/SendPulse Issues
- Verify SendPulse credentials in `.env.sendpulse`
- Check webhook endpoint is publicly accessible
- Monitor webhook logs for incoming messages
- Test AI response generation locally
- Verify database has WhatsApp tables: `npx prisma studio`
- Check chatbot authentication: test with registered phone number

### Database Issues
- Check DATABASE_URL connection string
- Run migrations: `npx prisma migrate dev`
- Verify PostgreSQL is running: `docker ps | grep postgres`
- Check Prisma Studio for data: `npx prisma studio`
- Reset database if needed: `npx prisma migrate reset`
- Check database connection: `npx prisma db pull`

### Performance Issues
- Check monitoring endpoints: `/api/monitoring/performance`
- Review Lighthouse CI reports: `npm run lighthouse`
- Verify image optimization settings in `next.config.js`
- Check Next.js build output for large bundles: `analyze .next`
- Monitor memory usage: `curl /api/monitoring/performance`

### Resilience System Issues
- Test offline functionality: `npm run test:resilience`
- Check backup storage: localStorage in browser dev tools
- Verify error recovery: test network disconnection scenarios
- Check MCP integration: `npm run test:mcp`

### Rate Limiting Issues
- Check rate limit headers in API responses
- Verify Upstash Redis connection (if configured)
- Monitor rate limit logs: `journalctl -u svlentes-nextjs -f | grep "Rate limit"`
- Test with different IP addresses or user IDs
- Verify rate limiter is using correct identifier (IP vs UID)

## Code Patterns & Conventions

### Form Validation
- **Library**: React Hook Form + Zod schemas
- **Pattern**: Define Zod schema first, then pass to React Hook Form resolver
- **Files**: Look for `*-schema.ts` or `validation-schemas.ts` files
- **Brazilian Validations**: CPF, CEP, phone number formats

### Error Handling
- **API Errors**: Structured error responses with proper HTTP status codes
- **Client Errors**: User-friendly error messages with actionable next steps
- **Logging**: Centralized error logging for debugging and monitoring
- **Firebase Auth Errors**: Handle token expiration, invalid token, etc.

### Database Patterns
- **Prisma Client**: Always import singleton instance from `src/lib/prisma.ts`
- **Migrations**: Version-controlled schema changes via `npx prisma migrate`
- **Seeding**: Test data generation via `prisma/seed.ts`
- **Transactions**: Use `prisma.$transaction()` for atomic operations

### Styling Patterns
- **Component-First**: Each component has its own styles using Tailwind classes
- **Design System**: Consistent color palette and spacing via Tailwind config
- **Responsive**: Mobile-first design with breakpoint utilities (`sm:`, `md:`, `lg:`)

### Security Patterns
- **Environment Variables**: Sensitive data never hardcoded
- **Input Validation**: All user inputs validated on both client and server
- **CSP Headers**: Content Security Policy configured in `next.config.js`
- **API Authentication**: Firebase token validation on all protected endpoints
- **Rate Limiting**: API rate limits on all routes via middleware
