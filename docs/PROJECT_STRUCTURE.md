# SV Lentes - Project Structure Documentation

## Overview

SV Lentes is a Next.js 15 healthcare platform for contact lens subscription service with medical oversight. This documentation provides a comprehensive overview of the project architecture, organization, and key components.

## 🏗️ Architecture Overview

### Technology Stack

**Frontend:**
- **Next.js 15** with App Router and TypeScript
- **React 18** with modern hooks and patterns
- **Tailwind CSS v4** with custom design system
- **shadcn/ui** component library built on Radix UI
- **Framer Motion** for animations
- **React Hook Form** with Zod validation

**Backend & Database:**
- **Prisma ORM** for database operations
- **PostgreSQL** for persistent data storage
- **Next.js API Routes** for server-side logic

**Third-party Integrations:**
- **Asaas API v3** - Brazilian payment gateway
- **SendPulse** - WhatsApp Business integration
- **OpenAI + LangChain** - AI-powered customer support
- **Google OAuth** - User authentication
- **Firebase** - Additional authentication layer

**Development Tools:**
- **Jest** for unit testing
- **Playwright** for E2E testing
- **ESLint** for code quality
- **TypeScript** for type safety

## 📁 Directory Structure

```
svlentes-hero-shop/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── page.tsx                  # Landing page
│   │   ├── layout.tsx                # Root layout with metadata
│   │   ├── globals.css               # Global styles and CSS variables
│   │   ├── api/                      # API routes
│   │   │   ├── webhooks/             # Webhook handlers
│   │   │   │   ├── asaas/            # Asaas payment webhooks
│   │   │   │   └── sendpulse/        # SendPulse WhatsApp webhooks
│   │   │   ├── asaas/                # Payment creation endpoints
│   │   │   ├── whatsapp/             # WhatsApp conversation management
│   │   │   ├── sendpulse/            # SendPulse integration
│   │   │   ├── monitoring/           # Health and performance endpoints
│   │   │   ├── privacy/              # LGPD compliance endpoints
│   │   │   ├── schedule-consultation/# Appointment booking
│   │   │   ├── whatsapp-redirect/    # WhatsApp integration
│   │   │   ├── create-checkout/      # Checkout session creation
│   │   │   └── health-check/         # Application health status
│   │   ├── calculadora/              # Savings calculator page
│   │   ├── assinar/                  # Subscription signup flow
│   │   ├── agendar-consulta/         # Consultation scheduling
│   │   ├── area-assinante/           # Subscriber dashboard
│   │   ├── lentes-diarias/           # Daily lenses information
│   │   ├── politica-privacidade/     # Privacy policy (LGPD)
│   │   ├── termos-uso/               # Terms of service
│   │   ├── success/                  # Payment success page
│   │   ├── cancel/                   # Payment cancellation page
│   │   └── agendamento-confirmado/   # Booking confirmation
│   ├── components/
│   │   ├── ui/                       # shadcn/ui base components
│   │   ├── sections/                 # Landing page sections
│   │   ├── forms/                    # Form components with validation
│   │   ├── layout/                   # Header, Footer components
│   │   ├── trust/                    # Trust indicators and credibility
│   │   ├── assinante/                # Subscriber area components
│   │   └── privacy/                  # LGPD compliance components
│   ├── lib/
│   │   ├── calculator.ts             # Savings calculation logic
│   │   ├── sendpulse-client.ts       # SendPulse API client
│   │   ├── sendpulse-auth.ts         # SendPulse authentication
│   │   ├── langchain-support-processor.ts # AI support processing
│   │   ├── chatbot-auth-handler.ts   # WhatsApp authentication system
│   │   ├── utils.ts                  # Utility functions
│   │   └── notifications.ts          # Notification system
│   ├── types/                        # TypeScript type definitions
│   ├── data/                         # Static data and constants
│   └── hooks/                        # Custom React hooks
├── public/                           # Static assets
├── docs/                             # Project documentation
├── prisma/                           # Database schema and migrations
│   ├── schema.prisma                 # Prisma database schema
│   └── migrations/                   # Database migration files
├── tests/                            # Test files
├── .env.local.example                # Environment variables template
├── next.config.js                    # Next.js configuration
├── tailwind.config.js                # Tailwind CSS configuration
└── package.json                      # npm dependencies and scripts
```

## 🎯 Core Business Flows

### 1. Subscription Flow
```
Lead Generation → Consultation Booking → Prescription Validation →
Subscription Creation → Payment Processing → Delivery Management →
Ongoing Support
```

### 2. Customer Support Flow
```
WhatsApp Message → AI Intent Classification → Automated Response →
Ticket Creation (if needed) → Human Escalation → Resolution
```

### 3. Payment Processing Flow
```
Payment Initiation → Asaas API → Payment Confirmation →
Webhook Processing → Subscription Update → Notification Delivery
```

## 🔌 Key Integration Points

### Asaas Payment Gateway
- **Purpose**: Brazilian market payment processing
- **Methods**: PIX, Boleto, Credit Card
- **Features**: Recurring subscriptions, webhook handling
- **Environment**: Production and sandbox

### SendPulse WhatsApp Integration
- **Purpose**: Customer support automation
- **Features**: AI-powered responses, conversation tracking
- **Authentication**: Automatic phone-based authentication
- **Commands**: Subscription management via WhatsApp

### AI Support System
- **Technology**: LangChain + OpenAI GPT
- **Purpose**: Intent classification and response generation
- **Capabilities**: Multi-language support, contextual responses
- **Escalation**: Automatic ticket creation for complex issues

## 🗄️ Database Architecture

### Core Models
- **User**: User accounts with authentication and profile data
- **Subscription**: Subscription plans and status management
- **Payment**: Individual payment records and history
- **Order**: Lens delivery orders with tracking
- **WhatsAppConversation**: Customer support interactions
- **SupportTicket**: Issue tracking and resolution

### Compliance Models
- **ConsentLog**: LGPD consent tracking
- **DataRequest**: Data access/deletion requests
- **PrivacyAudit**: Compliance audit trails

## 🔐 Security & Compliance

### LGPD Compliance
- Explicit consent management
- Data minimization principles
- Right to access and deletion
- Audit trail implementation

### Security Measures
- Next.js security headers configuration
- Content Security Policy (CSP)
- HTTPS enforcement with HSTS
- API rate limiting and validation
- Environment variable protection

## 🚀 Performance Optimizations

### Frontend Optimizations
- Next.js Image optimization
- Code splitting and lazy loading
- Static generation where possible
- Turbopack for faster builds

### Backend Optimizations
- Database query optimization
- API response caching
- Efficient webhook processing
- Background job queuing

## 📊 Monitoring & Analytics

### Health Monitoring
- `/api/health-check` endpoint
- Performance metrics tracking
- Error logging and alerting
- System status dashboard

### Business Analytics
- User behavior tracking
- Conversion funnel analysis
- Support ticket analytics
- Payment success metrics

## 🔧 Development Workflow

### Local Development
1. Environment setup with `.env.local`
2. Database configuration and migrations
3. Development server with hot reload
4. TypeScript and ESLint integration

### Testing Strategy
- **Unit Tests**: Jest for business logic
- **E2E Tests**: Playwright for user flows
- **Component Tests**: UI component validation
- **Performance Tests**: Lighthouse CI integration

### Production Deployment
- Systemd service management
- Nginx reverse proxy configuration
- SSL certificate automation
- Database backup procedures

## 📱 Mobile & Responsive Design

### Design System
- Mobile-first approach
- Responsive breakpoints
- Touch-friendly interactions
- Progressive Web App capabilities

### Accessibility
- WCAG 2.1 compliance
- Screen reader support
- Keyboard navigation
- Color contrast optimization

This structure provides a solid foundation for understanding and working with the SV Lentes healthcare platform, ensuring compliance with Brazilian healthcare regulations and delivering a seamless user experience.