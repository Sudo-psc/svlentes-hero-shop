# SV Lentes - Project Overview

## Purpose
Healthcare platform for contact lens subscription service with medical oversight. Production application serving Saraiva Vision clinic in Caratinga/MG, Brazil.

## Business Context
- **Service**: Contact lens subscription with ophthalmological monitoring
- **Responsible Physician**: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
- **Compliance**: LGPD-compliant (Brazilian data protection law)
- **Domains**: svlentes.com.br (primary), svlentes.shop (alternative)
- **Target Market**: Brazil nationwide (telemedicine + delivery)

## Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v3.4 + shadcn/ui components
- **UI Library**: Radix UI primitives
- **Forms**: React Hook Form + Zod validation
- **Animation**: Framer Motion
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Jest (unit) + Playwright (E2E)
- **Payment**: Asaas API v3 (Brazilian gateway)
- **Messaging**: SendPulse WhatsApp integration
- **AI**: LangChain + OpenAI for customer support

## Production Environment
- **Deployment**: Systemd service (svlentes-nextjs)
- **Reverse Proxy**: Nginx with SSL/TLS (Let's Encrypt)
- **Dev Port**: 3000
- **Production Port**: 5000
- **Database**: PostgreSQL (via Prisma)

## Key Features
- Subscription management with Asaas payment processing
- WhatsApp automation via SendPulse
- AI-powered customer support with LangChain
- Medical consultation scheduling (presencial + telemedicina)
- Savings calculator
- Subscriber dashboard
- LGPD compliance endpoints