# Design System 2.0 - Architecture Diagram

**Project**: SV Lentes Healthcare Platform
**Version**: 2.0.0
**Date**: 2025-10-21

---

## System Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                    SV Lentes Design System 2.0                  │
│                     Healthcare Platform Layer                    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴───────────┐
                    │                        │
         ┌──────────▼──────────┐  ┌─────────▼──────────┐
         │   Token System      │  │  Component Layer   │
         │   (Foundation)      │  │  (Implementation)  │
         └──────────┬──────────┘  └─────────┬──────────┘
                    │                        │
         ┌──────────┴──────────┐  ┌─────────┴──────────┐
         │                     │  │                     │
    ┌────▼────┐          ┌────▼────┐            ┌─────▼─────┐
    │ Spacing │          │ Colors  │            │ Enhanced  │
    │ Sizing  │          │ Motion  │            │ Components│
    │ Elevation│         │ Typography│          │           │
    └────┬────┘          └────┬────┘            └─────┬─────┘
         │                    │                        │
         └────────────┬───────┴────────────────────────┘
                      │
         ┌────────────▼───────────────┐
         │   Application Pages        │
         │  (/, /assinar, /area-...)  │
         └────────────────────────────┘
```

---

## Token System Layer

```text
src/tokens/
│
├─ spacing.ts                   → Tailwind spacing scale
│  ├─ Base scale (4px unit)
│  ├─ Component gaps
│  ├─ Section gaps
│  └─ Container padding
│
├─ elevation.ts                 → Tailwind boxShadow
│  ├─ Standard elevation (sm, md, lg, xl, 2xl)
│  ├─ Medical context (medical-card, medical-elevated)
│  └─ Interactive states (hover, active)
│
├─ sizing.ts                    → Component dimensions
│  ├─ Touch targets (44x44px min)
│  ├─ Input/button heights
│  ├─ Icon sizes
│  └─ Container widths
│
├─ motion.ts                    → Animation tokens
│  ├─ Duration (instant, fast, normal, slow, slower)
│  ├─ Easing (linear, in, out, in-out, spring)
│  └─ Reduced motion support
│
├─ typography.ts                → Type system
│  ├─ Font families (Inter, Poppins, Monaco)
│  ├─ Font sizes (xs → 6xl)
│  ├─ Font weights (light → extrabold)
│  └─ Line heights (tight → loose)
│
├─ colors-healthcare.ts         → Healthcare palette
│  ├─ Medical (trust, safety, alert, critical, neutral)
│  ├─ LGPD (consent, pending, revoked, info)
│  ├─ Prescription (valid, expiring, expired, pending)
│  └─ Payment (pix, boleto, card, status colors)
│
├─ breakpoints.ts               → Responsive breakpoints
│  ├─ xs (475px)
│  ├─ sm (640px)
│  ├─ md (768px)
│  ├─ lg (1024px)
│  ├─ xl (1280px)
│  └─ 2xl (1536px)
│
└─ index.ts                     → Centralized exports
```

---

## Component Architecture

```text
src/components/
│
├─ ui/ (Base Components - shadcn/ui + Radix)
│  │
│  ├─ button-enhanced.tsx              [9 variants]
│  │  ├─ default, destructive, outline, secondary, ghost, link
│  │  ├─ medical, whatsapp, pix, emergency
│  │  ├─ Loading states (spinner + text)
│  │  ├─ Icon support (left/right)
│  │  ├─ Size variants (sm, md, lg, xl, icon)
│  │  └─ Full width option
│  │
│  ├─ card-enhanced.tsx                [8 variants]
│  │  ├─ default, elevated, medical, interactive
│  │  ├─ glass, gradient, success, warning, error
│  │  ├─ Padding variants (none, sm, md, lg)
│  │  └─ Link support (asLink prop)
│  │
│  ├─ brazilian-inputs.tsx             [4 components]
│  │  ├─ CPFInput (XXX.XXX.XXX-XX mask)
│  │  ├─ PhoneInput ((XX) XXXXX-XXXX mask)
│  │  ├─ CurrencyInput (R$ decimal comma)
│  │  └─ DateInputBR (DD/MM/YYYY format)
│  │
│  ├─ skeleton-system.tsx              [5 variants]
│  │  ├─ Skeleton.Text
│  │  ├─ Skeleton.Avatar
│  │  ├─ Skeleton.Card
│  │  ├─ Skeleton.Button
│  │  └─ Skeleton.Input
│  │
│  └─ [Existing 37 shadcn/ui components]
│     ├─ accordion, alert, badge, button (original)
│     ├─ calendar, card (original), checkbox, dialog
│     ├─ dropdown-menu, input, label, modal
│     ├─ popover, progress, scroll-area, select
│     ├─ separator, slider, switch, table, tabs
│     ├─ toast, toaster, tooltip, ...
│     └─ [Custom: Icon, Loader, OptimizedImage, Logo, etc.]
│
├─ medical/ (Healthcare-Specific Components)
│  │
│  ├─ prescription-card.tsx
│  │  ├─ Status indicators (valid, expiring, expired, pending)
│  │  ├─ Doctor credentials (name, CRM)
│  │  ├─ Prescription details (OD, OE, lens type)
│  │  ├─ Issue and expiry dates
│  │  └─ Color-coded status badges
│  │
│  ├─ prescription-card-skeleton.tsx
│  │  └─ Loading state for PrescriptionCard
│  │
│  └─ doctor-badge.tsx
│     ├─ Doctor name and CRM display
│     ├─ Medical icon
│     └─ Shield icon for credibility
│
├─ lgpd/ (LGPD Compliance Components)
│  │
│  ├─ consent-badge.tsx
│  │  ├─ Status: granted, pending, revoked
│  │  ├─ Purpose display
│  │  ├─ Date display
│  │  ├─ Color-coded backgrounds
│  │  └─ Icons for each state
│  │
│  └─ data-usage-indicator.tsx
│     ├─ Data types collected (badges)
│     ├─ Purpose display
│     ├─ Retention period
│     └─ LGPD-compliant design
│
└─ a11y/ (Accessibility Components)
   │
   ├─ skip-links.tsx
   │  ├─ "Skip to main content" link
   │  ├─ "Skip to navigation" link
   │  ├─ Only visible on keyboard focus
   │  └─ Fixed positioning
   │
   ├─ focus-trap.tsx
   │  ├─ Trap focus within modal/dialog
   │  ├─ Return focus on close
   │  └─ ESC key support
   │
   └─ live-region.tsx
      ├─ Polite/assertive modes
      ├─ Auto-clear after timeout
      └─ Screen reader announcements
```

---

## Component Relationship Diagram

```text
┌──────────────────────────────────────────────────────────────┐
│                    Application Pages                         │
│  (/, /calculadora, /assinar, /area-assinante, etc.)         │
└───────────────────┬──────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
   ┌────▼────┐ ┌───▼───┐  ┌───▼────┐
   │Sections │ │ Forms │  │ Layout │
   └────┬────┘ └───┬───┘  └───┬────┘
        │          │          │
        └──────────┼──────────┘
                   │
        ┌──────────┴──────────┐
        │   Composite Components│
        │ (Higher-level patterns)│
        └──────────┬──────────┘
                   │
        ┌──────────┴───────────────────┬──────────────┐
        │                              │              │
   ┌────▼─────┐              ┌────────▼────┐   ┌────▼─────┐
   │  Medical │              │    LGPD     │   │   A11y   │
   │Components│              │ Components  │   │Components│
   └────┬─────┘              └────┬────────┘   └────┬─────┘
        │                         │                 │
        └─────────────┬───────────┴─────────────────┘
                      │
        ┌─────────────▼──────────────┐
        │    Base UI Components      │
        │  (Enhanced + shadcn/ui)    │
        └─────────────┬──────────────┘
                      │
        ┌─────────────▼──────────────┐
        │      Token System          │
        │  (spacing, colors, etc.)   │
        └────────────────────────────┘
```

---

## Data Flow Architecture

```text
User Interaction
       ↓
┌──────────────────┐
│  Application     │
│  Page Component  │
└────────┬─────────┘
         │
         ├→ Fetch Data (API/Database)
         │       ↓
         │  ┌─────────────┐
         │  │ Data Models │
         │  │  (Prisma)   │
         │  └──────┬──────┘
         │         │
         ←─────────┘
         │
         ↓
┌──────────────────┐
│  Composite       │
│  Component       │
│  (Section/Form)  │
└────────┬─────────┘
         │
         ├→ Medical Data
         │       ↓
         │  ┌──────────────────┐
         │  │ PrescriptionCard │
         │  │  (Status logic)  │
         │  └────────┬─────────┘
         │           │
         │           ↓
         │  ┌────────────────┐
         │  │ DoctorBadge    │
         │  │ (CRM display)  │
         │  └────────────────┘
         │
         ├→ LGPD Data
         │       ↓
         │  ┌──────────────────┐
         │  │  ConsentBadge    │
         │  │ (Consent status) │
         │  └────────┬─────────┘
         │           │
         │           ↓
         │  ┌──────────────────┐
         │  │ DataUsageIndicator│
         │  │ (Transparency)   │
         │  └──────────────────┘
         │
         └→ Form Data
                 ↓
            ┌────────────────┐
            │ Brazilian      │
            │ Input Components│
            │ (CPF, Phone,   │
            │  Currency, Date)│
            └────────┬───────┘
                     │
                     ↓
            ┌────────────────┐
            │  Validation    │
            │  (Zod + RHF)   │
            └────────────────┘
```

---

## Token Application Flow

```text
Design Token → Tailwind Config → Component Styles → Rendered Output

Example 1: Spacing
─────────────────────
src/tokens/spacing.ts
  spacing.lg = '1.5rem'
        ↓
tailwind.config.js
  extend: { spacing: { lg: '1.5rem' } }
        ↓
Component
  className="p-lg"
        ↓
Rendered CSS
  padding: 1.5rem;

Example 2: Medical Colors
──────────────────────────
src/tokens/colors-healthcare.ts
  medical.trust = '#0891b2'
        ↓
tailwind.config.js
  extend: { colors: { medical: { trust: '#0891b2' } } }
        ↓
Component
  className="bg-medical-trust"
        ↓
Rendered CSS
  background-color: #0891b2;

Example 3: Elevation
────────────────────
src/tokens/elevation.ts
  elevation.medical-card = '0 2px 8px rgba(...)'
        ↓
tailwind.config.js
  extend: { boxShadow: { 'medical-card': '0 2px 8px rgba(...)' } }
        ↓
Component
  className="shadow-medical-card"
        ↓
Rendered CSS
  box-shadow: 0 2px 8px rgba(100, 116, 139, 0.08);
```

---

## Accessibility Architecture

```text
┌────────────────────────────────────────────────────────────┐
│                     Accessibility Layer                    │
└────────────────────┬───────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼─────┐ ┌───▼────┐  ┌───▼─────┐
   │Skip Links│ │ Focus  │  │  ARIA   │
   │          │ │ Trap   │  │ Patterns│
   └────┬─────┘ └───┬────┘  └───┬─────┘
        │           │           │
        └───────────┼───────────┘
                    │
        ┌───────────▼───────────┐
        │   Component Layer     │
        │ (keyboard navigation, │
        │  focus indicators)    │
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │   Reduced Motion      │
        │  (prefers-reduced-    │
        │   motion: reduce)     │
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │  Screen Reader        │
        │  Compatibility        │
        │ (NVDA, JAWS, VoiceOver)│
        └───────────────────────┘
```

---

## Brazilian Localization Flow

```text
User Input → Brazilian Input Component → Mask Applied → Validation → Formatted Value

Example: CPF Input
──────────────────
User types: "12345678900"
        ↓
<CPFInput />
  (react-imask with mask="000.000.000-00")
        ↓
Display: "123.456.789-00"
        ↓
Zod Validation
  (CPF algorithm check)
        ↓
Form Submission
  value = "12345678900" (unmasked)
        ↓
API/Database
  stored as string without formatting

Example: Currency Input
───────────────────────
User types: "10000"
        ↓
<CurrencyInput />
  (react-imask with R$ prefix, comma decimal)
        ↓
Display: "R$ 100,00"
        ↓
Form Submission
  value = 100.00 (number)
        ↓
API/Database
  stored as Decimal(10,2)
```

---

## Component Enhancement Pattern

```text
Base Component → Enhanced Component → Application

Example: Button Evolution
──────────────────────────
src/components/ui/button.tsx
  [shadcn/ui base button]
  ├─ 6 variants (default, destructive, outline, secondary, ghost, link)
  ├─ 4 sizes (default, sm, lg, icon)
  └─ Basic props (className, variant, size, asChild)
        ↓
src/components/ui/button-enhanced.tsx
  [Extended button]
  ├─ 9 variants (+ medical, whatsapp, pix, emergency)
  ├─ 6 sizes (+ xl, icon-sm, icon-lg)
  ├─ Loading state (loading prop, spinner, loadingText)
  ├─ Icon support (icon prop, iconPosition: left|right)
  └─ Full width option (fullWidth prop)
        ↓
Application Page
  <Button
    variant="medical"
    size="lg"
    loading={isLoading}
    loadingText="Agendando consulta..."
    icon={<Calendar />}
    iconPosition="left"
    fullWidth
  >
    Agendar Consulta
  </Button>
```

---

## Loading State Architecture

```text
Component Rendering Lifecycle
        ↓
┌───────────────────┐
│ Check Data Status │
└────────┬──────────┘
         │
    ┌────┴────┐
    │ Loading?│
    └────┬────┘
         │
    ┌────┴─────────┐
    │ YES      NO  │
    ↓              ↓
┌──────────┐  ┌──────────┐
│ Skeleton │  │Component │
│Component │  │with Data │
└──────────┘  └──────────┘

Example: PrescriptionCard Loading
──────────────────────────────────
<Suspense fallback={<PrescriptionCardSkeleton />}>
  <PrescriptionCard data={prescriptionData} />
</Suspense>

Loading State:
  ┌─────────────────────────────┐
  │ ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐      │  [Skeleton.Text]
  │ │                    │      │  [Skeleton.Text]
  │ └─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘      │
  │                              │
  │ ┌─ ─ ─ ─ ─ ─┐ ┌─ ─ ─ ─ ─ ─┐│  [Grid of Skeleton.Card]
  │ │          │ │          │ │
  │ └─ ─ ─ ─ ─ ─┘ └─ ─ ─ ─ ─ ─┘│
  └─────────────────────────────┘

Loaded State:
  ┌─────────────────────────────┐
  │ Prescrição Médica      [✓]  │
  │ Dr. Philipe Saraiva Cruz    │
  │ CRM-MG 69.870               │
  │─────────────────────────────│
  │ OD: -2.50  │  OE: -2.75    │
  │ Lente: Diária               │
  └─────────────────────────────┘
```

---

## Testing Architecture

```text
Component → Unit Tests → Integration Tests → E2E Tests → Manual Testing

Unit Tests (Jest + RTL)
────────────────────────
src/components/ui/__tests__/button-enhanced.test.tsx
  ├─ Rendering tests (all variants)
  ├─ Loading state tests
  ├─ Icon positioning tests
  ├─ Click handler tests
  └─ Accessibility tests (keyboard, ARIA)

Integration Tests (Jest + RTL)
───────────────────────────────
src/components/medical/__tests__/prescription-card.test.tsx
  ├─ Data fetching tests
  ├─ Status logic tests
  ├─ Doctor badge integration
  └─ Date formatting tests

E2E Tests (Playwright)
──────────────────────
tests/e2e/subscription-flow.spec.ts
  ├─ User fills CPF input
  ├─ User fills phone input
  ├─ User selects plan
  ├─ PrescriptionCard displays
  └─ Payment flow completes

Accessibility Tests
───────────────────
Lighthouse CI
  ├─ Accessibility score ≥ 90
  ├─ Performance score ≥ 85
  ├─ Best practices score ≥ 90
  └─ SEO score ≥ 90

axe DevTools
  ├─ Automated accessibility violations: 0
  ├─ Color contrast checks
  ├─ ARIA attribute validation
  └─ Keyboard navigation tests

Manual Testing
──────────────
NVDA Screen Reader
  ├─ Skip links work
  ├─ Form labels announced
  ├─ Button states announced
  └─ Live regions announce changes
```

---

## Deployment Architecture

```text
Development → Staging → Production

Development Environment
───────────────────────
Branch: feature/design-system-2.0
  ├─ NEXT_PUBLIC_ENHANCED_COMPONENTS=false
  ├─ NEXT_PUBLIC_BRAZILIAN_INPUTS=false
  └─ NEXT_PUBLIC_MEDICAL_COMPONENTS=false
        ↓
Local Testing
  ├─ npm run dev
  ├─ npm run test
  └─ npm run lint
        ↓
Pull Request
  ├─ CI/CD runs tests
  ├─ Lighthouse CI checks
  └─ Code review

Staging Environment
───────────────────
Branch: staging
  ├─ NEXT_PUBLIC_ENHANCED_COMPONENTS=true (per page)
  ├─ Feature flag testing
  └─ QA validation
        ↓
Staging Tests
  ├─ Manual QA
  ├─ Cross-browser testing
  ├─ Accessibility testing
  └─ Performance testing

Production Rollout (Gradual)
─────────────────────────────
Week 7: Token system only (invisible)
Week 8: /calculadora (test page)
Week 9: /area-assinante (authenticated)
Week 10: /assinar (subscription flow)
Week 11: / (landing page)
Week 12: Full rollout
        ↓
Monitoring
  ├─ Error tracking (Sentry)
  ├─ Performance monitoring
  ├─ User feedback
  └─ Rollback plan ready
```

---

## Maintenance & Evolution

```text
Design System Lifecycle

Initial Release (v2.0.0)
        ↓
Monthly Reviews
  ├─ Component usage analytics
  ├─ Performance metrics
  ├─ Accessibility audits
  └─ User feedback analysis
        ↓
Quarterly Updates
  ├─ Token refinements
  ├─ New component variants
  ├─ Accessibility improvements
  └─ Documentation updates
        ↓
Annual Major Release (v3.0.0)
  ├─ Breaking changes if needed
  ├─ New components
  ├─ Token system evolution
  └─ Technology upgrades
```

---

## Integration with Existing Systems

```text
Design System 2.0
        │
        ├─ Tailwind CSS v4
        │  ├─ Extends existing config
        │  ├─ Preserves existing utilities
        │  └─ Adds new token-based utilities
        │
        ├─ shadcn/ui
        │  ├─ Maintains compatibility
        │  ├─ Enhances with new variants
        │  └─ Preserves existing components
        │
        ├─ Radix UI Primitives
        │  ├─ No changes required
        │  ├─ Used as foundation
        │  └─ Accessibility built-in
        │
        ├─ React Hook Form + Zod
        │  ├─ Brazilian inputs compatible
        │  ├─ Validation schemas preserved
        │  └─ Error handling enhanced
        │
        └─ Next.js 15 App Router
           ├─ SSR/SSG compatible
           ├─ Client components optimized
           └─ Performance maintained
```

---

## Summary

This architecture provides:

✅ **Scalability**: Token-based system grows with the application
✅ **Maintainability**: Centralized tokens, reusable components
✅ **Consistency**: Unified design language across all pages
✅ **Accessibility**: WCAG 2.1 AA compliance built-in
✅ **Brazilian Optimization**: Native input patterns and localization
✅ **Medical Compliance**: Specialized healthcare components
✅ **LGPD Compliance**: Visual transparency and consent management
✅ **Performance**: Optimized loading states and bundle size
✅ **Developer Experience**: TypeScript-first, comprehensive documentation

---

**Related Documents**:
- Design System Improvements: `design-system-improvements.md`
- Implementation Plan: `design-system-implementation-plan.md`
- Executive Summary: `DESIGN_SYSTEM_SUMMARY.md`
- Architecture Diagram: `design-system-architecture.md` ← You are here

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-21
