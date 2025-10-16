# SV Lentes Project Constitution

**Last Updated**: 2025-10-16
**Version**: 1.0.0

This document establishes the **non-negotiable principles** that govern all development, design, and implementation decisions for the SV Lentes contact lens subscription platform.

---

## Core Mission

Build a **secure, accessible, and LGPD-compliant** healthcare platform that delivers exceptional user experience while maintaining the highest standards of medical responsibility and data protection.

---

## I. Code Quality Principles

### 1.1 Type Safety (CRITICAL)
- ✅ **All code must be TypeScript** with strict mode enabled
- ✅ **No `any` types** without explicit justification and `// @ts-expect-error` documentation
- ✅ **Complete type coverage** for API contracts, database models, and component props
- ✅ **Prisma Client generation** must be up-to-date before build/deploy

**Validation**: `npx tsc --noEmit` must pass with zero errors

### 1.2 Testing Requirements (CRITICAL)
- ✅ **Unit tests required** for all business logic (calculator, payments, validation)
- ✅ **E2E tests required** for critical user flows (subscription, payment, scheduling)
- ✅ **Minimum 80% coverage** for `src/lib/` and `src/components/`
- ✅ **Tests must pass** before merging to main branch

**Validation**: `npm test` and `npm run test:e2e` must pass

### 1.3 Code Organization (IMPORTANT)
- ✅ **Separation of concerns**: UI components, business logic, API routes clearly separated
- ✅ **Single Responsibility Principle**: Each module has one clear purpose
- ✅ **DRY principle**: No duplicated business logic across files
- ✅ **Consistent naming**: camelCase for variables/functions, PascalCase for components/types

---

## II. Security & Compliance Principles

### 2.1 LGPD Data Protection (CRITICAL)
- ✅ **Explicit consent required** for all data collection
- ✅ **Data minimization**: Collect only essential data (medical, contact, delivery)
- ✅ **Right to access**: Users can request their data via `/api/privacy/data-request`
- ✅ **Right to deletion**: Implementation for data erasure requests
- ✅ **Audit trail**: All sensitive data access must be logged
- ✅ **No sensitive data in logs**: Redact CPF, credit cards, medical records

**Validation**: Privacy policy accessible at `/politica-privacidade`

### 2.2 Medical Compliance (CRITICAL)
- ✅ **Prescription validation mandatory**: Never bypass medical authorization
- ✅ **Emergency contact prominent**: Displayed on all critical pages
- ✅ **Medical credentials visible**: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
- ✅ **Professional responsibility**: Clear attribution throughout application
- ✅ **CFM Resolution 2.314/2022**: Telemedicine regulations compliance

### 2.3 Authentication & Authorization (CRITICAL)
- ✅ **Firebase Authentication** for user identity
- ✅ **JWT token validation** on all protected API routes
- ✅ **Role-based access**: Subscribers only access their own data
- ✅ **Secure password reset**: Time-limited tokens, email verification
- ✅ **Session management**: Proper token refresh and expiry handling

**Validation**: All `/api/assinante/*` endpoints require valid Firebase token

### 2.4 Payment Security (CRITICAL)
- ✅ **PCI compliance**: Never store credit card numbers
- ✅ **Asaas gateway integration**: Use official API, verify webhooks
- ✅ **Webhook signature validation**: `ASAAS_WEBHOOK_TOKEN` required
- ✅ **HTTPS enforcement**: All payment flows over secure connections
- ✅ **Sandbox testing**: All payment features tested in sandbox first

---

## III. Accessibility Principles

### 3.1 WCAG 2.1 AA Compliance (IMPORTANT)
- ✅ **Semantic HTML**: Proper heading hierarchy, landmark regions
- ✅ **Keyboard navigation**: All interactive elements keyboard-accessible
- ✅ **Screen reader support**: Proper ARIA labels, alt text for images
- ✅ **Color contrast**: Minimum 4.5:1 for body text, 3:1 for large text
- ✅ **Focus indicators**: Visible focus rings for all interactive elements

**Validation**: Lighthouse accessibility score ≥ 90

### 3.2 Mobile Responsiveness (IMPORTANT)
- ✅ **Mobile-first design**: Layouts optimized for small screens
- ✅ **Touch targets**: Minimum 44×44px for interactive elements
- ✅ **Viewport meta tag**: Proper mobile viewport configuration
- ✅ **No horizontal scroll**: Content fits within viewport width

**Validation**: Test on mobile viewports (375px, 390px, 414px)

---

## IV. Performance Principles

### 4.1 Core Web Vitals (IMPORTANT)
- ✅ **LCP (Largest Contentful Paint)**: < 2.5s
- ✅ **FID (First Input Delay)**: < 100ms
- ✅ **CLS (Cumulative Layout Shift)**: < 0.1
- ✅ **Time to Interactive**: < 3.5s on 3G

**Validation**: Lighthouse performance score ≥ 85

### 4.2 Optimization Techniques (IMPORTANT)
- ✅ **Image optimization**: Next.js Image component with WebP/AVIF
- ✅ **Code splitting**: Dynamic imports for heavy components
- ✅ **Lazy loading**: Below-the-fold content deferred
- ✅ **Static generation**: Use SSG where possible (blog, landing pages)
- ✅ **API response caching**: Appropriate cache headers on static endpoints

---

## V. Brazilian Localization Principles

### 5.1 Language & Format (IMPORTANT)
- ✅ **Brazilian Portuguese**: All user-facing text in pt-BR
- ✅ **Currency formatting**: R$ with proper decimal separator (,)
- ✅ **Date formatting**: DD/MM/YYYY (pt-BR standard)
- ✅ **Phone formatting**: +55 (DDD) 9XXXX-XXXX
- ✅ **CPF validation**: Proper algorithm with format XXX.XXX.XXX-XX

### 5.2 Brazilian Payment Methods (IMPORTANT)
- ✅ **PIX support**: Instant payment with QR code
- ✅ **Boleto bancário**: Bank slip generation and tracking
- ✅ **Cartão de crédito**: Credit card with installment options (parcelamento)
- ✅ **Asaas integration**: Specialized Brazilian payment gateway

---

## VI. Documentation Principles

### 6.1 Code Documentation (RECOMMENDED)
- ✅ **JSDoc comments** for all public functions and complex logic
- ✅ **README files** for each major module/feature
- ✅ **API documentation** in `/docs/API_DOCUMENTATION.md`
- ✅ **CLAUDE.md files** for project-specific AI assistant guidance

### 6.2 User Documentation (RECOMMENDED)
- ✅ **Privacy policy**: Comprehensive LGPD compliance document
- ✅ **Terms of service**: Clear subscription terms and conditions
- ✅ **Help documentation**: FAQ and troubleshooting guides
- ✅ **Contact information**: Always accessible emergency contacts

---

## VII. Development Workflow Principles

### 7.1 Version Control (IMPORTANT)
- ✅ **Feature branches**: Never commit directly to main
- ✅ **Meaningful commits**: Descriptive commit messages
- ✅ **Pull requests**: Code review required before merge
- ✅ **Protected main branch**: Require passing tests to merge

### 7.2 Environment Management (CRITICAL)
- ✅ **No secrets in code**: All API keys in environment variables
- ✅ **`.env.local` gitignored**: Never commit environment files
- ✅ **Separate environments**: Production vs sandbox keys clearly distinguished
- ✅ **Environment validation**: Required vars checked at build time

### 7.3 Deployment Process (CRITICAL)
- ✅ **Build verification**: `npm run build` must succeed
- ✅ **Test execution**: All tests pass before deploy
- ✅ **Health check**: `/api/health-check` responds after deploy
- ✅ **Rollback plan**: Previous build available for quick revert

**Validation**: `systemctl status svlentes-nextjs` shows active status

---

## VIII. Business Logic Principles

### 8.1 Savings Calculator (CRITICAL)
- ✅ **Accurate calculations**: Double-checked against manual calculations
- ✅ **Transparent pricing**: All cost components clearly displayed
- ✅ **Realistic assumptions**: Usage patterns based on real data
- ✅ **No misleading claims**: Conservative estimates, not inflated savings

**Reference**: `src/lib/calculator.ts` - core calculation logic

### 8.2 Subscription Management (CRITICAL)
- ✅ **Clear billing cycles**: Transparent next billing date display
- ✅ **Cancellation flow**: Easy cancellation with confirmation
- ✅ **Pause functionality**: Allow temporary subscription pause
- ✅ **Upgrade/downgrade**: Smooth plan transition handling

---

## IX. Error Handling Principles

### 9.1 User-Facing Errors (IMPORTANT)
- ✅ **Friendly messages**: No technical jargon in error messages
- ✅ **Actionable guidance**: Tell users what to do next
- ✅ **Fallback content**: Graceful degradation on API failures
- ✅ **Support contact**: Always provide help contact information

### 9.2 Developer Errors (IMPORTANT)
- ✅ **Comprehensive logging**: Use `console.error` with context
- ✅ **Error boundaries**: React error boundaries for component failures
- ✅ **API error responses**: Standard error format with status codes
- ✅ **Monitoring integration**: Log errors to monitoring service

---

## X. Enforcement

### Automated Checks
- **Pre-commit**: ESLint, TypeScript type checking
- **Pre-push**: Unit tests, build verification
- **CI/CD**: E2E tests, Lighthouse audits
- **Production**: Health checks, monitoring alerts

### Manual Review
- **Code review**: Required for all pull requests
- **Security review**: For authentication, payment, data handling changes
- **Accessibility review**: For UI/UX changes
- **Medical compliance review**: For prescription/consultation features

---

## Revision History

| Version | Date       | Changes                                    |
|---------|------------|--------------------------------------------|
| 1.0.0   | 2025-10-16 | Initial constitution established           |

---

**Principle Hierarchy**: CRITICAL > IMPORTANT > RECOMMENDED

**Non-Negotiable**: CRITICAL principles must be satisfied. IMPORTANT principles require explicit justification to skip. RECOMMENDED principles should be followed unless resource/time constraints prevent it.
