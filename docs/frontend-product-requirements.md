# Frontend Product Requirements

## Document Control
- **Product**: SVLentes Online Lens & Subscription Platform
- **Prepared For**: Frontend Engineering, Product Design, QA
- **Last Updated**: 2025-10-18
- **Related References**: `docs/PROJECT_STRUCTURE.md`, `COLOR_SYSTEM_GUIDE.md`, `SHADCN_IMPLEMENTATION.md`

## 1. Vision & Goals
- Deliver a responsive, accessible, and trustworthy storefront that educates customers on prescription contact lenses and manages recurring subscriptions.
- Simplify onboarding for new customers while preserving regulatory compliance (prescription validation, LGPD data privacy).
- Enable continuous experimentation (A/B testing, feature flags) without degrading performance or SEO.

## 2. Target Audiences
1. **New Lens Customers**
   - Needs: Understand lens types, submit prescription, estimate pricing.
   - Success: Completes onboarding, uploads prescription, selects subscription cadence.
2. **Returning Subscribers**
   - Needs: Manage deliveries, update prescription, pause/resume plans.
   - Success: Adjusts plan in under 3 clicks, receives confirmation notifications.
3. **Health Professionals / Partners**
   - Needs: Review compliance info, refer patients, track verification status.
   - Success: Access secure portal overview with minimal training.

## 3. Experience Map
| Stage | Entry Points | Key Actions | UX Requirements | Exit Criteria |
| --- | --- | --- | --- | --- |
| Awareness | SEO landing pages, ads, referrals | Skim hero content, CTA to calculator | Fast load (<2.5s), meaningful animations disabled on prefers-reduced-motion | User explores pricing or product detail |
| Consideration | Product catalog, pricing calculator | Compare lens plans, read FAQ | Sticky CTA bar, accessible tabbed specs | Adds plan to cart or starts onboarding |
| Conversion | Checkout onboarding flow | Create account, upload prescription, choose delivery cadence | Progressive disclosure, inline validation, upload progress states | Payment authorized, verification pending |
| Retention | Account dashboard | Track orders, manage subscription, contact support | Personalized dashboard cards, WhatsApp support entry point | Session rating prompt completed |

## 4. Functional Requirements
### 4.1 Global Shell
- Responsive header with logo, navigation, CTA button.
- Persistent toast system for success/error messages integrated with shadcn `use-toast`.
- Feature flag hydration using `@/lib/featureFlags` to gate experiments.
- Accessibility baseline: WCAG 2.1 AA, keyboard navigable, skip-to-content link.

### 4.2 Home / Landing
- Hero block with dynamic value proposition, CTA to calculator and WhatsApp support.
- Lens category highlights with filter chips (toric, multifocal, colored, daily, extended wear).
- Testimonial carousel using reduced motion fallback.
- Educational content sections linking to blog resources.

### 4.3 Pricing Calculator
- Multi-step wizard (Usage profile → Prescription details → Suggested plans → Summary).
- Form powered by React Hook Form + Zod (`leadFormSchema` reference) with inline validation.
- Real-time pricing updates with skeleton loaders.
- Capture marketing consent (LGPD) and escalate to CRM via SendPulse API integration.

### 4.4 Checkout / Subscription Flow
- Guided onboarding: account creation, prescription upload, delivery preferences, payment redirect.
- Upload component with drag-and-drop, preview, progress, and success/error states.
- Payment status polling (Asaas primary, Stripe fallback) with optimistic UI.
- Compliance gating: disable payment step until prescription validated.

### 4.5 Account Dashboard
- Personalized welcome (name, current plan, next delivery date).
- Cards for subscription status, prescription status, payment status, support tickets.
- Actions: pause/resume, change delivery frequency, upload new prescription.
- Notifications center with filters (All, Critical, Billing, Logistics) using `Tabs` component.
- Integration with WhatsApp chatbot entry point (`/support/whatsapp`).

### 4.6 Support & Education
- FAQ accordion backed by CMS (Sanity) with search-as-you-type.
- Contact panel with WhatsApp deep link, phone click-to-call, email form.
- Accessibility resources page describing eye health responsibilities.

## 5. Non-Functional Requirements
- **Performance**: LCP < 2.5s on 4G, Lighthouse performance score ≥ 85.
- **SEO**: Pre-render critical pages, maintain structured data (FAQ, Product) via `next-seo` utilities.
- **Internationalization**: Portuguese primary, ready for Spanish secondary locale.
- **Reliability**: Graceful offline states for pricing calculator and dashboard data (Vitest resilience).
- **Security**: Do not expose API keys; rely on API routes/proxies. Enforce secure cookies.

## 6. UX & Visual Guidelines
- Follow Tailwind utility tokens defined in `COLOR_SYSTEM_GUIDE.md` (cyan primary, silver secondary).
- Use shadcn/ui components for consistency; extend via variants (no inline style overrides).
- Typography hierarchy: `text-3xl` hero, `text-xl` section headings, `text-base` body.
- Form inputs must surface helper text, error states, and success states.
- Animations respect user preferences and avoid blocking interactions.

## 7. Content Strategy
- Tone: Empathetic, medically responsible, avoids jargon without context.
- Highlight compliance credentials and partner optometrist network.
- Provide transparent pricing (monthly, quarterly, semi-annual) with savings badges.
- CTA labels action-oriented: “Começar Avaliação”, “Gerenciar Plano”, “Falar com Especialista”.

## 8. Data & Integrations
- **CMS**: Sanity (landing content, FAQs, testimonials). Use `@/lib/sanity` fetchers.
- **CRM / Messaging**: SendPulse for onboarding flows and WhatsApp follow-up.
- **Payments**: Asaas API (primary), Stripe (fallback). Display status per gateway.
- **Analytics**: Meta Pixel, Google Analytics 4, PostHog. Implement consent mode hooks.
- **Feature Flags**: Configured via `@/lib/feature-flags-client`, stored in Supabase.

## 9. Accessibility & Compliance
- All interactive elements must have ARIA labels or semantic roles.
- Color contrast ratio ≥ 4.5:1; validate with axe.
- Prescription upload instructions available in text and downloadable PDF.
- LGPD consent checkboxes required before capturing personal data.
- Provide bilingual privacy policy links and terms of service.

## 10. Observability & QA
- Instrument key flows with LangSmith tracing (`@/lib/langsmith-config`).
- Implement client-side error boundary logging to Sentry.
- QA checkpoints: automated Jest/Playwright coverage, manual cross-browser (Chrome, Safari, Edge), responsive device matrix (iPhone SE → Desktop 1440px).
- Use `npm run kluster_code_review_auto` before release for automated analysis.

## 11. Dependencies & Risks
- **Dependencies**: Backend verification endpoints, Asaas webhook reliability, Sanity content publishing workflows.
- **Risks**: Prescription validation delays, payment gateway downtime, WhatsApp API rate limits, accessibility regressions.
- **Mitigations**: Provide fallback messaging, queue notifications, implement status page, automated axe scans in CI.

## 12. Acceptance Criteria
1. User completes subscription onboarding with valid prescription and receives confirmation email.
2. Dashboard accurately reflects subscription and payment status within 5 seconds of page load.
3. Feature flags can toggle homepage hero variant without redeploy.
4. Accessibility audit via axe CLI reports no critical issues.
5. Lighthouse performance score ≥ 85 on production build.

## 13. Future Enhancements
- Dynamic product recommendations using purchase history.
- Progressive Web App support (offline caching of catalog, push notifications).
- In-app chat assistant integrated with LangChain knowledge base.
- Appointment scheduling with partner optometrists.

## 14. Open Questions
- How should prescription expiration reminders be surfaced (email vs WhatsApp)?
- Do we need multilingual support for onboarding microcopy at launch?
- What KPIs determine success of WhatsApp support integration?
- Should we integrate BNPL (Buy Now, Pay Later) options for annual plans?
