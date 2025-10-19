# CodeRabbit Knowledge Base Context

This is a Next.js 15 healthcare e-commerce application for contact lens subscriptions in Brazil.

## Regulatory Compliance
- LGPD (Brazilian Data Protection Law) compliance is mandatory.
- Healthcare regulations (CFM/CRM) must be respected.
- Medical credentials (CRM-MG 69.870) must be validated.
- Prescription validation is required.

## Technology Stack
- Next.js 15 with App Router.
- TypeScript 5.9 (strict mode).
- React 18 with Server Components.
- Prisma ORM with PostgreSQL.
- Tailwind CSS v4 + shadcn/ui.
- Jest + Playwright for testing.

## Integrations
- Asaas API v3 for payments (Brazilian market).
- SendPulse for WhatsApp Business messaging.
- Firebase for authentication.
- n8n for workflow automation.

## Deployment
- Systemd-based deployment (not Vercel).
- Nginx reverse proxy with SSL/TLS.
- Production URL: svlentes.shop.
- Staging environment available.

## Quality Standards
- Zero security vulnerabilities required.
- 85%+ test coverage expected.
- TypeScript strict mode enforced.
- Accessibility (WCAG 2.1 AA) required.
- Performance budgets enforced.

## Security Priorities
- Environment variables only (no hardcoded secrets).
- Webhook token validation required.
- HTTPS enforced with proper headers.
- CSP, HSTS, and X-Frame-Options configured.
- Input validation and sanitization.
- Rate limiting on sensitive endpoints.

## Code Quality Standards
- Prefer TypeScript over JavaScript.
- Use functional components with hooks.
- Follow React Server Components best practices.
- Use Prisma for all database operations.
- Implement proper error boundaries.
- Include comprehensive error handling.
