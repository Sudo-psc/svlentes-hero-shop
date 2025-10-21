# SV Lentes - Knowledge Base

## Overview

This knowledge base serves as a comprehensive reference for developers, administrators, and stakeholders working with the SV Lentes healthcare platform. It covers business context, technical implementation, compliance requirements, and operational procedures.

## 📚 Table of Contents

1. [Business Context](#business-context)
2. [Technical Architecture](#technical-architecture)
3. [Component Library](#component-library)
4. [Database Schema](#database-schema)
5. [Integration Guides](#integration-guides)
6. [Deployment & Operations](#deployment--operations)
7. [Troubleshooting](#troubleshooting)
8. [Security & Compliance](#security--compliance)
9. [Development Guidelines](#development-guidelines)

---

## 🏢 Business Context

### Company Information
- **Company**: Saraiva Vision
- **Location**: Caratinga/MG, Brazil
- **Responsible Physician**: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
- **Business**: Contact lens subscription service with medical oversight

### Service Model
- **Core Product**: Monthly contact lens subscription
- **Value Proposition**: Convenience + medical supervision
- **Target Market**: Brazilian contact lens wearers
- **Delivery**: Home delivery with prescription validation

### Regulatory Environment
- **Healthcare Regulations**: CFM/CRM medical council requirements
- **Data Protection**: LGPD (Lei Geral de Proteção de Dados)
- **Payment Regulations**: Brazilian Central Bank standards
- **Telemedicine**: CFM Resolution 2.314/2022

### Key Metrics
- **Customer Acquisition Cost**: Target R$ 50-80
- **Monthly Revenue per User**: R$ 120-200
- **Customer Lifetime Value**: Target 18-24 months
- **Delivery Coverage**: Southeast Brazil region

---

## 🏗️ Technical Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │   Next.js App   │    │   PostgreSQL    │
│  (React/Next)   │◄──►│   (API Routes)  │◄──►│   (Prisma ORM)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   Asaas API     │    │  SendPulse API  │
│   (SSL/TLS)     │    │  (Payments)     │    │   (WhatsApp)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack Details

#### Frontend Layer
- **Next.js 15**: App Router, Server Components, Edge Runtime
- **React 18**: Concurrent features, Server Components
- **TypeScript**: Strict mode, comprehensive type coverage
- **Tailwind CSS v4**: Custom design system, responsive utilities
- **shadcn/ui**: Component library with Radix UI primitives
- **Framer Motion**: Production-ready animations

#### Backend Layer
- **Next.js API Routes**: Server-side business logic
- **Prisma ORM**: Type-safe database operations
- **PostgreSQL**: ACID compliance, JSON support
- **Node.js**: JavaScript runtime, event-driven architecture

#### Integration Layer
- **Asaas API v3**: Brazilian payment processing
- **SendPulse WhatsApp**: Customer communication
- **OpenAI API**: AI-powered support responses
- **Google OAuth**: User authentication
- **Firebase Auth**: Additional authentication layer

### Design Patterns

#### Component Architecture
```
Pages (app directory)
├── Layout Components
│   ├── Header (navigation, user menu)
│   └── Footer (links, contact info)
├── Section Components
│   ├── Hero (value proposition)
│   ├── Features (service highlights)
│   ├── Pricing (subscription plans)
│   └── Testimonials (social proof)
├── Form Components
│   ├── SubscriptionForm (multi-step signup)
│   ├── ConsultationForm (appointment booking)
│   └── SupportForm (customer service)
└── UI Components (shadcn/ui)
    ├── Button, Input, Card, Modal
    └── Complex: FormField, DataTable
```

#### State Management
- **Local State**: React useState, useReducer
- **Form State**: React Hook Form with Zod validation
- **Server State**: Next.js Server Components, SWR fallback
- **Global State**: React Context for user session

#### Error Handling
```typescript
// Global error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);
    // Log to monitoring service
  }
}

// API error handling
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}
```

---

## 🎨 Component Library

### Design System

#### Color Palette
```css
:root {
  /* Primary - Cyan */
  --color-primary-50: #ecfeff;
  --color-primary-500: #06b6d4;
  --color-primary-900: #164e63;

  /* Secondary - Silver */
  --color-secondary-50: #f8fafc;
  --color-secondary-500: #64748b;
  --color-secondary-900: #0f172a;

  /* Success */
  --color-success-500: #22c55e;

  /* Warning */
  --color-warning-500: #f59e0b;

  /* WhatsApp */
  --color-whatsapp: #25d366;

  /* Medical Theme */
  --color-medical-50: #f0fdf4;
  --color-medical-500: #16a34a;
  --color-medical-900: #14532d;
}
```

#### Typography
```typescript
export const typography = {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
  scales: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  }
};
```

### Component Categories

#### 1. Layout Components
- **Header**: Navigation, user menu, search
- **Footer**: Links, contact info, legal pages
- **Sidebar**: Navigation for subscriber area
- **Container**: Responsive layout wrapper

#### 2. Form Components
- **FormField**: Input with label and validation
- **FormSelect**: Dropdown with search
- **FormTextarea**: Multi-line text input
- **FormCheckbox**: Boolean selection
- **FormRadio**: Single selection from options
- **FormDatePicker**: Date selection with validation

#### 3. Business Components
- **SubscriptionCard**: Plan details and pricing
- **ConsultationCalendar**: Appointment scheduling
- **OrderTracker**: Delivery status and tracking
- **SupportChat**: WhatsApp integration interface
- **SavingsCalculator**: Cost comparison tool

#### 4. Trust & Credibility
- **TrustBadges**: Certifications and guarantees
- **TestimonialCarousel**: Customer reviews
- **MedicalCredentials**: Doctor information and CRM
- **SecurityIndicators**: LGPD compliance, payment security

### Component Usage Examples

#### Subscription Form
```typescript
<SubscriptionForm
  onSubmit={handleSubscription}
  validationSchema={subscriptionSchema}
  defaultValues={{
    plan: 'monthly',
    lenses: 'daily',
    quantity: 30,
  }}
>
  <FormField name="name" label="Nome Completo" required />
  <FormField name="email" label="E-mail" type="email" required />
  <FormField name="phone" label="WhatsApp" mask="(99) 99999-9999" required />
  <FormField name="cpf" label="CPF" mask="999.999.999-99" required />

  <FormSelect name="plan" label="Plano" required>
    <option value="monthly">Mensal</option>
    <option value="quarterly">Trimestral</option>
    <option value="annual">Anual</option>
  </FormSelect>

  <AddressForm />
  <PaymentMethods />
  <TermsCheckbox />

  <Button type="submit" className="w-full">
    Assinar Agora
  </Button>
</SubscriptionForm>
```

---

## 🗄️ Database Schema

### Core Entities

#### User Management
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  cpf VARCHAR(14) UNIQUE,
  password_hash VARCHAR(255),
  google_id VARCHAR(255),
  firebase_uid VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User addresses
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  street VARCHAR(255) NOT NULL,
  number VARCHAR(20) NOT NULL,
  complement VARCHAR(255),
  neighborhood VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  postal_code VARCHAR(9) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Subscription Management
```sql
-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  asaas_subscription_id VARCHAR(255) UNIQUE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELED', 'OVERDUE')),
  plan_type VARCHAR(50) NOT NULL,
  lens_type VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL,
  next_payment_date DATE,
  last_payment_date DATE,
  delivery_address_id UUID REFERENCES user_addresses(id),
  prescription_valid_until DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  asaas_payment_id VARCHAR(255) UNIQUE,
  asaas_invoice_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  billing_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  description TEXT,
  installments INTEGER DEFAULT 1,
  installment_value DECIMAL(10,2),
  webhook_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### WhatsApp Integration
```sql
-- WhatsApp conversations
CREATE TABLE whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  last_message_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- WhatsApp interactions
CREATE TABLE whatsapp_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('USER', 'BOT', 'HUMAN')),
  message_content TEXT NOT NULL,
  intent_classification VARCHAR(100),
  confidence_score DECIMAL(3,2),
  response_template_id UUID,
  escalation_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Relationships & Indexes

#### Key Relationships
- Users → Subscriptions (1:N)
- Users → Addresses (1:N)
- Subscriptions → Payments (1:N)
- Users → WhatsApp Conversations (1:1, nullable)
- Conversations → Interactions (1:N)

#### Performance Indexes
```sql
-- User lookup indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_cpf ON users(cpf);

-- Subscription queries
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_next_payment ON subscriptions(next_payment_date) WHERE status = 'ACTIVE';

-- Payment analytics
CREATE INDEX idx_payments_user_date ON payments(user_id, created_at);
CREATE INDEX idx_payments_status_date ON payments(status, created_at);

-- WhatsApp queries
CREATE INDEX idx_conversations_phone ON whatsapp_conversations(phone_number);
CREATE INDEX idx_interactions_conversation_date ON whatsapp_interactions(conversation_id, created_at);
```

---

## 🔌 Integration Guides

### Asaas Payment Integration

#### Configuration
```typescript
// lib/asaas-client.ts
import axios from 'axios';

export class AsaasClient {
  private baseURL: string;
  private apiKey: string;
  private webhookToken: string;

  constructor(environment: 'sandbox' | 'production') {
    this.baseURL = environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/v3';
    this.apiKey = environment === 'production'
      ? process.env.ASAAS_API_KEY_PROD!
      : process.env.ASAAS_API_KEY_SANDBOX!;
    this.webhookToken = process.env.ASAAS_WEBHOOK_TOKEN!;
  }

  async createCustomer(data: CustomerData) {
    return this.post('/customers', data);
  }

  async createPayment(data: PaymentData) {
    return this.post('/payments', data);
  }

  async createSubscription(data: SubscriptionData) {
    return this.post('/subscriptions', data);
  }

  private async post(endpoint: string, data: any) {
    try {
      const response = await axios.post(`${this.baseURL}${endpoint}`, data, {
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw new APIError('ASAAS_ERROR', 'Failed to call Asaas API', error);
    }
  }
}
```

#### Payment Types Support
```typescript
export type BillingType = 'BOLETO' | 'CREDIT_CARD' | 'PIX';

export interface PaymentRequest {
  customer: string; // Asaas customer ID
  billingType: BillingType;
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
    phone?: string;
    mobilePhone?: string;
  };
}
```

### SendPulse WhatsApp Integration

#### Authentication Flow
```typescript
// lib/sendpulse-auth.ts
export class SendPulseAuth {
  private clientId: string;
  private clientSecret: string;
  private accessToken?: string;
  private refreshToken?: string;

  async authenticate(): Promise<void> {
    try {
      const response = await fetch('https://api.sendpulse.com/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      const data = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;

      // Store tokens securely
      await this.storeTokens(data);
    } catch (error) {
      throw new Error('SendPulse authentication failed');
    }
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      await this.authenticate();
      return;
    }

    try {
      const response = await fetch('https://api.sendpulse.com/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }),
      });

      const data = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;

      await this.storeTokens(data);
    } catch (error) {
      await this.authenticate();
    }
  }
}
```

#### Message Processing
```typescript
// lib/whatsapp-processor.ts
export class WhatsAppProcessor {
  private aiProcessor: LangChainSupportProcessor;

  async processIncomingMessage(webhookData: SendPulseWebhook): Promise<void> {
    const { message, contact } = webhookData;

    // 1. Authenticate user automatically
    const user = await this.authenticateUser(contact.phone);

    // 2. Create or update conversation
    const conversation = await this.upsertConversation(contact.phone, user?.id);

    // 3. Log user message
    await this.logInteraction(conversation.id, 'USER', message.text);

    // 4. AI-powered intent classification
    const intent = await this.aiProcessor.classifyIntent(message.text);

    // 5. Generate response
    const response = await this.generateResponse(intent, user, conversation);

    // 6. Send response via SendPulse
    await this.sendWhatsAppMessage(contact.phone, response.text);

    // 7. Log bot response
    await this.logInteraction(conversation.id, 'BOT', response.text, intent);

    // 8. Escalate if needed
    if (response.escalate) {
      await this.escalateToHuman(conversation.id, intent);
    }
  }

  private async authenticateUser(phoneNumber: string): Promise<User | null> {
    // Remove country code and formatting
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // Look up user by phone
    return await prisma.user.findFirst({
      where: { phone: { contains: cleanPhone } },
      include: { subscription: true },
    });
  }

  private async generateResponse(
    intent: IntentResult,
    user: User | null,
    conversation: WhatsAppConversation
  ): Promise<WhatsAppResponse> {
    switch (intent.type) {
      case 'SUBSCRIPTION_INQUIRY':
        return this.handleSubscriptionInquiry(user, conversation);
      case 'PAYMENT_ISSUE':
        return this.handlePaymentIssue(user, conversation);
      case 'DELIVERY_STATUS':
        return this.handleDeliveryStatus(user, conversation);
      case 'APPOINTMENT_REQUEST':
        return this.handleAppointmentRequest(user, conversation);
      case 'GENERAL_QUESTION':
        return this.handleGeneralQuestion(intent, user);
      default:
        return this.handleUnknownIntent(intent, user);
    }
  }
}
```

---

## 🚀 Deployment & Operations

### Production Architecture

#### Server Configuration
```bash
# Systemd service: /etc/systemd/system/svlentes-nextjs.service
[Unit]
Description=SV Lentes Next.js Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/root/svlentes-hero-shop
Environment=NODE_ENV=production
Environment=PORT=5000
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/svlentes.shop
server {
    listen 443 ssl http2;
    server_name svlentes.shop;

    ssl_certificate /etc/letsencrypt/live/svlentes.shop/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/svlentes.shop/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching
    location /_next/static {
        proxy_pass http://localhost:5000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Environment Configuration

#### Production Variables
```bash
# .env.production
NODE_ENV=production
PORT=5000

# Application
NEXT_PUBLIC_APP_URL=https://svlentes.shop
NEXT_PUBLIC_WHATSAPP_NUMBER=5533999898026

# Asaas (Production)
ASAAS_ENV=production
ASAAS_API_KEY_PROD=prod_xxxxxxxxxxxxxxxxxxxxxxxx
ASAAS_API_KEY_SANDBOX=sandbox_xxxxxxxxxxxxxxxxxxxxxxxx
ASAAS_WEBHOOK_TOKEN=webhook_xxxxxxxxxxxxxxxxxxxxxxxx

# SendPulse WhatsApp
SENDPULSE_USER_ID=xxxxxxxxxxxxxxxxxxxxxxxx
SENDPULSE_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
SENDPULSE_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
SENDPULSE_REFRESH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
SENDPULSE_BOT_ID=xxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/svlentes

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Authentication
NEXTAUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
NEXTAUTH_URL=https://svlentes.shop
```

### Deployment Pipeline

#### Automated Deployment Script
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 Starting SV Lentes deployment..."

# 1. Pull latest changes
git pull origin main

# 2. Install dependencies
npm ci --production

# 3. Run type checking
npx tsc --noEmit

# 4. Build application
npm run build

# 5. Run database migrations
npx prisma migrate deploy

# 6. Generate Prisma client
npx prisma generate

# 7. Restart service
systemctl restart svlentes-nextjs

# 8. Verify deployment
sleep 10
curl -f https://svlentes.shop/api/health-check || {
  echo "❌ Health check failed"
  exit 1
}

# 9. Clear CDN cache if applicable
# curl -X POST "https://api.cloudflare.com/client/v4/zones/zone_id/purge_cache"

echo "✅ Deployment completed successfully"
```

### Monitoring & Logging

#### Application Monitoring
```typescript
// lib/monitoring.ts
export class MonitoringService {
  private logError(error: Error, context?: any): void {
    console.error({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      context,
    });

    // Send to external monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(error, context);
    }
  }

  async trackMetric(name: string, value: number, tags?: Record<string, string>): Promise<void> {
    // Send to metrics service (DataDog, New Relic, etc.)
  }

  async createAlert(message: string, severity: 'low' | 'medium' | 'high' | 'critical'): Promise<void> {
    // Send alert to monitoring service
  }
}
```

#### Health Check Implementation
```typescript
// app/api/health-check/route.ts
export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check external services
    const [asaasHealth, sendpulseHealth] = await Promise.allSettled([
      checkAsaasHealth(),
      checkSendPulseHealth(),
    ]);

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        asaas: asaasHealth.status === 'fulfilled' ? 'available' : 'error',
        sendpulse: sendpulseHealth.status === 'fulfilled' ? 'available' : 'error',
      },
      version: process.env.npm_package_version,
    });
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 500 }
    );
  }
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check TypeScript errors
npm run lint

# Verify environment variables
npm run build:check

# Clear Next.js cache
rm -rf .next

# Rebuild from scratch
npm run clean && npm install && npm run build
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
systemctl status postgresql

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check Prisma schema
npx prisma validate

# Reset database (development only)
npx prisma migrate reset
```

#### Payment Integration Issues
```bash
# Test Asaas connectivity
curl -H "access_token: $ASAAS_API_KEY_PROD" \
     https://api.asaas.com/v3/myAccount

# Check webhook logs
journalctl -u svlentes-nextjs -f | grep asaas

# Verify webhook token
echo $ASAAS_WEBHOOK_TOKEN | sha256sum
```

#### WhatsApp Integration Issues
```bash
# Test SendPulse authentication
curl -X POST https://api.sendpulse.com/oauth/access_token \
     -H "Content-Type: application/json" \
     -d '{"grant_type":"client_credentials","client_id":"$SENDPULSE_USER_ID","client_secret":"$SENDPULSE_SECRET"}'

# Check webhook URL accessibility
curl -I https://svlentes.shop/api/webhooks/sendpulse

# Verify SendPulse bot configuration
echo "Bot ID: $SENDPULSE_BOT_ID"
```

### Performance Issues

#### Slow Page Loads
```bash
# Analyze bundle size
npm run analyze

# Check image optimization
find public -name "*.jpg" -o -name "*.png" | xargs -I {} ls -lh {}

# Profile Next.js performance
npm run build -- --profile

# Check database queries
npx prisma studio --port 5555
```

#### Memory Issues
```bash
# Check Node.js process memory
ps aux | grep node

# Monitor memory usage
top -p $(pgrep node)

# Generate heap dump
kill -USR2 $(pgrep node)

# Check for memory leaks
npm run test:memory
```

### Security Issues

#### SSL Certificate Problems
```bash
# Check certificate status
certbot certificates

# Test SSL configuration
openssl s_client -connect svlentes.shop:443 -servername svlentes.shop

# Force renewal
certbot renew --force-renewal

# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/svlentes.shop/fullchain.pem -noout -dates
```

#### Security Headers Validation
```bash
# Test security headers
curl -I https://svlentes.shop

# Check CSP compliance
curl -s https://svlentes.shop | grep -i "content-security-policy"

# Test XSS protection
curl -H "X-XSS-Protection: 1; mode=block" https://svlentes.shop
```

---

## 🔒 Security & Compliance

### LGPD Implementation

#### Consent Management
```typescript
// lib/lgpd-consent.ts
export class LGPDConsentManager {
  async logConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    documentId: string,
    context: ConsentContext
  ): Promise<void> {
    await prisma.consentLog.create({
      data: {
        userId,
        consentType,
        granted,
        timestamp: new Date(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        documentId,
        metadata: context.metadata,
      },
    });
  }

  async checkConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    const latestConsent = await prisma.consentLog.findFirst({
      where: { userId, consentType },
      orderBy: { timestamp: 'desc' },
    });

    return latestConsent?.granted ?? false;
  }

  async handleDataRequest(request: DataRequest): Promise<void> {
    switch (request.type) {
      case 'ACCESS':
        await this.provideDataAccess(request);
        break;
      case 'DELETION':
        await this.processDataDeletion(request);
        break;
      case 'CORRECTION':
        await this.updateUserData(request);
        break;
      case 'PORTABILITY':
        await this.exportUserData(request);
        break;
    }
  }
}
```

#### Data Encryption
```typescript
// lib/encryption.ts
import crypto from 'crypto';

export class EncryptionService {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly keyLength = 32;

  static encrypt(text: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from('svlentes', 'utf8'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText: string, key: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAAD(Buffer.from('svlentes', 'utf8'));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### Security Best Practices

#### Input Validation
```typescript
// lib/validation.ts
import { z } from 'zod';

export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .transform(phone => phone.replace(/\D/g, ''));

export const cpfSchema = z.string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Invalid CPF format')
  .transform(cpf => cpf.replace(/\D/g, ''));

export const paymentValueSchema = z.number()
  .min(1, 'Payment value must be greater than 0')
  .max(10000, 'Payment value cannot exceed R$ 10.000');

export const secureInputSchema = z.object({
  name: z.string().min(3).max(100).regex(/^[a-zA-Z\s]+$/, 'Invalid name format'),
  email: z.string().email(),
  phone: phoneSchema,
  cpf: cpfSchema,
});
```

#### Rate Limiting
```typescript
// lib/rate-limiting.ts
import rateLimit from 'express-rate-limit';

export const createRateLimit = (windowMs: number, max: number) => rateLimit({
  windowMs,
  max,
  message: {
    error: 'Too many requests',
    retryAfter: Math.ceil(windowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimits = {
  auth: createRateLimit(15 * 60 * 1000, 5), // 5 attempts per 15 minutes
  payment: createRateLimit(60 * 1000, 10), // 10 attempts per minute
  whatsapp: createRateLimit(60 * 1000, 30), // 30 messages per minute
  general: createRateLimit(15 * 60 * 1000, 100), // 100 requests per 15 minutes
};
```

---

## 👨‍💻 Development Guidelines

### Code Standards

#### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### ESLint Configuration
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/prefer-const": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Testing Strategy

#### Unit Testing Example
```typescript
// tests/lib/calculator.test.ts
import { calculateSavings } from '@/lib/calculator';

describe('calculateSavings', () => {
  it('should calculate savings for daily lenses subscription', () => {
    const result = calculateSavings({
      lensType: 'daily',
      currentCost: 200,
      subscriptionCost: 120,
      usageDaysPerMonth: 30,
    });

    expect(result.monthlySavings).toBe(80);
    expect(result.annualSavings).toBe(960);
    expect(result.savingsPercentage).toBe(40);
  });

  it('should handle edge cases gracefully', () => {
    expect(() => {
      calculateSavings({
        lensType: 'daily',
        currentCost: 0,
        subscriptionCost: 120,
        usageDaysPerMonth: 30,
      });
    }).toThrow('Current cost must be greater than 0');
  });
});
```

#### E2E Testing Example
```typescript
// tests/e2e/subscription-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Subscription Flow', () => {
  test('user can complete subscription flow', async ({ page }) => {
    await page.goto('/assinar');

    // Fill personal information
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john@example.com');
    await page.fill('[data-testid="phone-input"]', '11999999999');
    await page.fill('[data-testid="cpf-input"]', '12345678909');

    // Select plan
    await page.click('[data-testid="monthly-plan"]');

    // Fill address
    await page.fill('[data-testid="address-input"]', 'Rua Principal, 123');
    await page.fill('[data-testid="city-input"]', 'São Paulo');
    await page.selectOption('[data-testid="state-select"]', 'SP');
    await page.fill('[data-testid="postal-code-input"]', '01234-567');

    // Accept terms
    await page.click('[data-testid="terms-checkbox"]');

    // Submit form
    await page.click('[data-testid="submit-button"]');

    // Verify redirection to payment
    await expect(page).toHaveURL(/\/payment/);
    await expect(page.locator('[data-testid="payment-summary"]')).toBeVisible();
  });
});
```

### Git Workflow

#### Branch Naming Conventions
```bash
# Feature branches
feature/subscription-management
feature/whatsapp-integration

# Bugfix branches
bugfix/payment-webhook-error
bugfix/mobile-responsive-issues

# Hotfix branches
hotfix/security-vulnerability
hotfix/critical-bug-production

# Release branches
release/v1.2.0
release/production-deployment
```

#### Commit Message Format
```bash
# Format: type(scope): description

feat(subscription): add pause subscription functionality
fix(payment): resolve webhook token validation issue
docs(api): update payment integration documentation
refactor(auth): simplify login flow logic
test(calculator): add edge case validation tests
chore(deps): update next.js to v15.1.0
```

This comprehensive knowledge base provides developers and stakeholders with the information needed to understand, maintain, and extend the SV Lentes healthcare platform effectively.