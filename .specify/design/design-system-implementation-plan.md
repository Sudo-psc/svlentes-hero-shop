# Design System 2.0 Implementation Plan

**Project**: SV Lentes Landing Page
**Version**: 2.0.0
**Created**: 2025-10-21
**Status**: Ready for Implementation
**Estimated Timeline**: 6 weeks

---

## Overview

This plan outlines the step-by-step implementation of the enhanced design system for SV Lentes, ensuring minimal disruption to ongoing development while delivering significant improvements in consistency, accessibility, and maintainability.

---

## Phase 1: Foundation - Token System (Week 1)

### Objectives
- Establish semantic design token system
- Create healthcare-specific color palette
- Implement responsive token architecture
- Ensure backward compatibility

### Tasks

#### 1.1 Create Token Directory Structure
```bash
mkdir -p src/tokens
touch src/tokens/spacing.ts
touch src/tokens/elevation.ts
touch src/tokens/sizing.ts
touch src/tokens/motion.ts
touch src/tokens/typography.ts
touch src/tokens/colors-healthcare.ts
touch src/tokens/breakpoints.ts
touch src/tokens/index.ts
```

**Deliverable**: Token directory with TypeScript files
**Time**: 1 hour

#### 1.2 Implement Spacing Tokens
**File**: `src/tokens/spacing.ts`

```typescript
export const spacing = {
  // Base scale (4px base unit)
  none: '0',
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
  '4xl': '6rem',
  '5xl': '8rem',

  // Semantic spacing
  'component-gap': '0.5rem',
  'section-gap': '1rem',
  'page-padding': '1.5rem',
  'container-padding': '2rem',
} as const

export type Spacing = keyof typeof spacing
```

**Deliverable**: Spacing token system
**Time**: 2 hours
**Testing**: Verify values match Tailwind defaults

#### 1.3 Implement Elevation Tokens
**File**: `src/tokens/elevation.ts`

```typescript
export const elevation = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // Medical context
  'medical-card': '0 2px 8px rgba(100, 116, 139, 0.08)',
  'medical-elevated': '0 8px 24px rgba(100, 116, 139, 0.12)',

  // Interactive states
  hover: '0 8px 16px -4px rgba(0, 0, 0, 0.12)',
  active: '0 2px 4px -1px rgba(0, 0, 0, 0.08)',
} as const

export type Elevation = keyof typeof elevation
```

**Deliverable**: Elevation token system
**Time**: 2 hours

#### 1.4 Implement Healthcare Colors
**File**: `src/tokens/colors-healthcare.ts`

```typescript
export const healthcareColors = {
  medical: {
    trust: '#0891b2',
    safety: '#16a34a',
    alert: '#f59e0b',
    critical: '#dc2626',
    neutral: '#64748b',
  },
  lgpd: {
    consent: '#22c55e',
    pending: '#f59e0b',
    revoked: '#ef4444',
    info: '#3b82f6',
  },
  prescription: {
    valid: '#22c55e',
    expiring: '#f59e0b',
    expired: '#ef4444',
    pending: '#94a3b8',
  },
  payment: {
    pix: '#00c9a7',
    boleto: '#ff9500',
    card: '#3b82f6',
    approved: '#22c55e',
    pending: '#f59e0b',
    failed: '#ef4444',
  },
} as const

export type HealthcareColor = keyof typeof healthcareColors
```

**Deliverable**: Healthcare color palette
**Time**: 2 hours

#### 1.5 Update Tailwind Config
**File**: `tailwind.config.js`

```javascript
const { spacing } = require('./src/tokens/spacing')
const { elevation } = require('./src/tokens/elevation')
const { healthcareColors } = require('./src/tokens/colors-healthcare')

module.exports = {
  // ... existing config
  theme: {
    extend: {
      // Import token systems
      spacing,
      boxShadow: elevation,
      colors: {
        ...healthcareColors,
        // ... existing colors
      },
      // ... rest of config
    },
  },
}
```

**Deliverable**: Updated Tailwind configuration
**Time**: 2 hours
**Testing**: Run `npm run build` to verify no errors

#### 1.6 Create Token Index
**File**: `src/tokens/index.ts`

```typescript
export * from './spacing'
export * from './elevation'
export * from './sizing'
export * from './motion'
export * from './typography'
export * from './colors-healthcare'
export * from './breakpoints'
```

**Deliverable**: Centralized token exports
**Time**: 30 minutes

### Phase 1 Validation
- [ ] `npm run build` succeeds
- [ ] No visual regressions in existing components
- [ ] Token types properly exported
- [ ] Light/dark mode colors still work
- [ ] TypeScript compilation successful

**Phase 1 Total Time**: 12-16 hours (1 week part-time)

---

## Phase 2: Enhanced Components (Week 2-3)

### Objectives
- Create enhanced Button component with healthcare variants
- Build enhanced Card component
- Implement Brazilian input components
- Maintain backward compatibility

### Tasks

#### 2.1 Enhanced Button Component
**File**: `src/components/ui/button-enhanced.tsx`

**Features**:
- Loading states with spinner
- Icon support (left/right positioning)
- Healthcare variants (medical, whatsapp, pix, emergency)
- Full width option
- Size variants (sm, md, lg, xl, icon)

**Implementation Steps**:
1. Copy existing `button.tsx` to `button-enhanced.tsx`
2. Add new variants using CVA
3. Add loading prop and spinner
4. Add icon support
5. Add full width option
6. Export enhanced component

**Deliverable**: Enhanced Button component
**Time**: 4 hours
**Testing**:
- [ ] All variants render correctly
- [ ] Loading state shows spinner
- [ ] Icons position correctly
- [ ] Keyboard navigation works
- [ ] Focus indicators visible

#### 2.2 Enhanced Card Component
**File**: `src/components/ui/card-enhanced.tsx`

**Features**:
- Medical variant with special border
- Interactive variant with hover scale
- Glass morphism variant
- Gradient variants
- Padding variants (none, sm, md, lg)
- Link support with `asLink` prop

**Implementation Steps**:
1. Copy existing `card.tsx` to `card-enhanced.tsx`
2. Add variant system with CVA
3. Add padding variants
4. Add link support
5. Export enhanced component

**Deliverable**: Enhanced Card component
**Time**: 3 hours

#### 2.3 Brazilian Input Components
**File**: `src/components/ui/brazilian-inputs.tsx`

**Components**:
- CPFInput (mask: XXX.XXX.XXX-XX)
- PhoneInput (mask: (XX) XXXXX-XXXX)
- CurrencyInput (R$ with decimal comma)
- DateInputBR (DD/MM/YYYY format)

**Dependencies**:
```bash
npm install react-imask
npm install --save-dev @types/react-imask
```

**Implementation Steps**:
1. Install react-imask
2. Create CPFInput component
3. Create PhoneInput component
4. Create CurrencyInput component
5. Create DateInputBR component
6. Add validation helpers
7. Export all components

**Deliverable**: Brazilian input component library
**Time**: 6 hours
**Testing**:
- [ ] CPF mask formats correctly
- [ ] Phone mask accepts 9-digit mobile
- [ ] Currency shows R$ symbol
- [ ] Date accepts DD/MM/YYYY only
- [ ] All inputs support React Hook Form

#### 2.4 Component Migration Strategy
**Strategy**: Gradual adoption, no breaking changes

```typescript
// Option 1: Import enhanced components explicitly
import { Button } from '@/components/ui/button-enhanced'

// Option 2: Alias in tsconfig.json (after testing)
{
  "compilerOptions": {
    "paths": {
      "@/components/ui/button": ["./src/components/ui/button-enhanced.tsx"]
    }
  }
}

// Option 3: Keep both, migrate gradually
import { Button } from '@/components/ui/button' // Old
import { EnhancedButton } from '@/components/ui/button-enhanced' // New
```

**Recommendation**: Option 1 during development, Option 3 for production migration

**Deliverable**: Migration strategy document
**Time**: 1 hour

### Phase 2 Validation
- [ ] All new components render correctly
- [ ] No console errors or warnings
- [ ] TypeScript types are correct
- [ ] Components work in light/dark mode
- [ ] Mobile responsive
- [ ] Accessibility: keyboard navigation works
- [ ] Existing components still functional

**Phase 2 Total Time**: 24-32 hours (2 weeks part-time)

---

## Phase 3: Medical & LGPD Components (Week 3-4)

### Objectives
- Create medical-specific components
- Build LGPD compliance indicators
- Implement prescription display system

### Tasks

#### 3.1 Prescription Card Component
**File**: `src/components/medical/prescription-card.tsx`

**Features**:
- Status indicators (valid, expiring, expired, pending)
- Doctor credentials display (name, CRM)
- Prescription details (OD, OE, lens type)
- Issue and expiry dates
- Color-coded status badges

**Implementation Steps**:
1. Create component structure
2. Add status configuration
3. Implement status badge
4. Add prescription details grid
5. Add date display
6. Style with medical colors

**Deliverable**: PrescriptionCard component
**Time**: 4 hours

#### 3.2 Doctor Badge Component
**File**: `src/components/medical/doctor-badge.tsx`

**Features**:
- Doctor name and CRM display
- Medical icon
- Shield icon for credibility
- Consistent styling

**Deliverable**: DoctorBadge component
**Time**: 2 hours

#### 3.3 Consent Badge Component
**File**: `src/components/lgpd/consent-badge.tsx`

**Features**:
- Status indicators (granted, pending, revoked)
- Purpose display
- Date display
- Color-coded backgrounds
- Icons for each state

**Deliverable**: ConsentBadge component
**Time**: 3 hours

#### 3.4 Data Usage Indicator
**File**: `src/components/lgpd/data-usage-indicator.tsx`

**Features**:
- Data types collected (badges)
- Purpose display
- Retention period
- LGPD-compliant design

**Deliverable**: DataUsageIndicator component
**Time**: 3 hours

#### 3.5 Integration with Existing Pages
**Locations**:
- `/area-assinante` - Add PrescriptionCard
- `/assinar` - Add LGPD indicators
- `/politica-privacidade` - Add ConsentBadge examples

**Implementation Steps**:
1. Import components in relevant pages
2. Connect to data sources
3. Add loading states
4. Test user flows

**Deliverable**: Integrated components
**Time**: 4 hours

### Phase 3 Validation
- [ ] PrescriptionCard displays correctly
- [ ] Status colors are distinguishable
- [ ] DoctorBadge shows CRM correctly
- [ ] ConsentBadge states are clear
- [ ] DataUsageIndicator lists all data types
- [ ] LGPD compliance maintained
- [ ] Medical credibility preserved

**Phase 3 Total Time**: 16-20 hours (1.5 weeks part-time)

---

## Phase 4: Accessibility Enhancements (Week 5)

### Objectives
- Implement skip links
- Add reduced motion support
- Create focus management system
- Ensure WCAG 2.1 AA compliance

### Tasks

#### 4.1 Skip Links Component
**File**: `src/components/a11y/skip-links.tsx`

**Features**:
- "Skip to main content" link
- "Skip to navigation" link
- Only visible on keyboard focus
- Fixed positioning

**Implementation Steps**:
1. Create SkipLinks component
2. Add focus styles
3. Integrate in root layout
4. Test keyboard navigation

**Deliverable**: SkipLinks component
**Time**: 2 hours

#### 4.2 Reduced Motion Support
**File**: `src/app/globals.css`

**Implementation**:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Deliverable**: Reduced motion CSS
**Time**: 1 hour

#### 4.3 Focus Trap Hook
**File**: `src/hooks/use-focus-trap.ts`

**Features**:
- Trap focus within modal/dialog
- Return focus on close
- ESC key support

**Deliverable**: useFocusTrap hook
**Time**: 3 hours

#### 4.4 Live Region Component
**File**: `src/components/a11y/live-region.tsx`

**Features**:
- Polite/assertive modes
- Auto-clear after timeout
- Screen reader announcements

**Deliverable**: LiveRegion component
**Time**: 2 hours

#### 4.5 Accessibility Audit
**Tools**:
- Lighthouse (accessibility score ≥ 90)
- axe DevTools
- NVDA screen reader testing
- Keyboard-only navigation testing

**Testing Checklist**:
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible (not just outline: none)
- [ ] Skip links work
- [ ] ARIA labels present where needed
- [ ] Color contrast ≥ 4.5:1 for text
- [ ] Touch targets ≥ 44x44px
- [ ] Form labels associated correctly
- [ ] Error messages announced to screen readers
- [ ] Reduced motion respected

**Deliverable**: Accessibility audit report
**Time**: 4 hours

### Phase 4 Validation
- [ ] Lighthouse accessibility score ≥ 90
- [ ] axe DevTools shows 0 violations
- [ ] Screen reader can navigate entire site
- [ ] All forms keyboard accessible
- [ ] Skip links functional
- [ ] Reduced motion works

**Phase 4 Total Time**: 12-16 hours (1 week part-time)

---

## Phase 5: Loading States & Skeletons (Week 5-6)

### Objectives
- Create unified skeleton system
- Implement progressive loading
- Add suspense boundaries

### Tasks

#### 5.1 Skeleton System
**File**: `src/components/ui/skeleton-system.tsx`

**Components**:
- Skeleton.Text
- Skeleton.Avatar
- Skeleton.Card
- Skeleton.Button
- Skeleton.Input

**Implementation Steps**:
1. Create base Skeleton component
2. Add variant components
3. Style with pulse animation
4. Export all variants

**Deliverable**: Skeleton component system
**Time**: 3 hours

#### 5.2 Component-Specific Skeletons
**Files**:
- `src/components/medical/prescription-card-skeleton.tsx`
- `src/components/sections/hero-skeleton.tsx`
- `src/components/sections/pricing-skeleton.tsx`

**Implementation Steps**:
1. Create skeleton for PrescriptionCard
2. Create skeleton for Hero section
3. Create skeleton for Pricing section
4. Match real component layouts

**Deliverable**: Component skeletons
**Time**: 4 hours

#### 5.3 Suspense Boundaries
**Locations**:
- `/area-assinante/page.tsx`
- `/calculadora/page.tsx`
- `/assinar/page.tsx`

**Implementation**:
```typescript
import { Suspense } from 'react'
import { PrescriptionCardSkeleton } from '@/components/medical/prescription-card-skeleton'

export default function Page() {
  return (
    <Suspense fallback={<PrescriptionCardSkeleton />}>
      <PrescriptionCard />
    </Suspense>
  )
}
```

**Deliverable**: Suspense boundaries added
**Time**: 2 hours

### Phase 5 Validation
- [ ] Skeletons match real component shapes
- [ ] Pulse animation smooth
- [ ] No layout shift on load
- [ ] Loading states clear to users
- [ ] Suspense boundaries work correctly

**Phase 5 Total Time**: 9-12 hours (1 week part-time)

---

## Phase 6: Documentation & Testing (Week 6)

### Objectives
- Create comprehensive documentation
- Write tests for new components
- Generate style guide
- Conduct cross-browser testing

### Tasks

#### 6.1 Component Documentation
**Format**: JSDoc + README files

**Files**:
- `src/components/ui/README.md`
- `src/components/medical/README.md`
- `src/components/lgpd/README.md`
- `src/components/a11y/README.md`

**Content**:
- Component purpose
- Props documentation
- Usage examples
- Accessibility notes
- LGPD compliance notes

**Deliverable**: Component documentation
**Time**: 6 hours

#### 6.2 Design System Style Guide
**File**: `.specify/design/style-guide.md`

**Sections**:
- Color palette with hex codes
- Typography scale
- Spacing system
- Component variants
- Brazilian localization patterns
- Medical UI patterns
- LGPD compliance patterns

**Deliverable**: Style guide document
**Time**: 4 hours

#### 6.3 Component Tests
**Framework**: Jest + React Testing Library

**Test Files**:
- `src/components/ui/__tests__/button-enhanced.test.tsx`
- `src/components/ui/__tests__/card-enhanced.test.tsx`
- `src/components/ui/__tests__/brazilian-inputs.test.tsx`
- `src/components/medical/__tests__/prescription-card.test.tsx`
- `src/components/lgpd/__tests__/consent-badge.test.tsx`

**Test Coverage**:
- Rendering with different props
- Variant behavior
- Loading states
- Keyboard interactions
- Accessibility attributes

**Deliverable**: Component test suite
**Time**: 8 hours

#### 6.4 Cross-Browser Testing
**Browsers**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

**Test Checklist**:
- [ ] Layout renders correctly
- [ ] Animations work smoothly
- [ ] Forms submit properly
- [ ] Brazilian masks work
- [ ] Dark mode toggles correctly
- [ ] Touch interactions work on mobile

**Deliverable**: Cross-browser test report
**Time**: 4 hours

#### 6.5 Performance Testing
**Tools**: Lighthouse CI

**Metrics**:
- Performance: ≥ 85
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 90

**Test Pages**:
- Landing page (/)
- Calculator (/calculadora)
- Subscription (/assinar)
- Subscriber area (/area-assinante)

**Deliverable**: Performance test report
**Time**: 2 hours

### Phase 6 Validation
- [ ] All components documented
- [ ] Style guide published
- [ ] Test coverage ≥ 80%
- [ ] All tests passing
- [ ] Cross-browser compatibility confirmed
- [ ] Performance targets met

**Phase 6 Total Time**: 24-28 hours (1.5 weeks part-time)

---

## Rollout Strategy

### Gradual Rollout (Recommended)
1. **Week 7**: Deploy token system (no visual changes)
2. **Week 8**: Enable enhanced components on `/calculadora` (test page)
3. **Week 9**: Enable on `/area-assinante` (authenticated area)
4. **Week 10**: Enable on `/assinar` (subscription flow)
5. **Week 11**: Enable on `/` (landing page)
6. **Week 12**: Full rollout, deprecate old components

### Feature Flags
```typescript
// lib/feature-flags.ts
export const featureFlags = {
  enhancedComponents: process.env.NEXT_PUBLIC_ENHANCED_COMPONENTS === 'true',
  brazilianInputs: process.env.NEXT_PUBLIC_BRAZILIAN_INPUTS === 'true',
  medicalComponents: process.env.NEXT_PUBLIC_MEDICAL_COMPONENTS === 'true',
}

// Usage
import { featureFlags } from '@/lib/feature-flags'

const Button = featureFlags.enhancedComponents
  ? EnhancedButton
  : OriginalButton
```

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking changes to existing components | High | Medium | Maintain old components, gradual migration |
| Performance regression | Medium | Low | Lighthouse CI, bundle size monitoring |
| Accessibility issues | High | Low | Automated testing, screen reader testing |
| Brazilian mask library bugs | Medium | Low | Extensive input testing, fallback to plain inputs |
| Dark mode inconsistencies | Medium | Medium | Visual regression testing |

### Timeline Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep | High | Strict phase boundaries, defer non-critical items |
| Testing delays | Medium | Start testing early, parallel testing with development |
| Documentation incomplete | Low | Template-based docs, incremental documentation |

---

## Success Metrics

### Quantitative Metrics
- **Lighthouse Scores**: Accessibility ≥ 90, Performance ≥ 85
- **Test Coverage**: ≥ 80% for new components
- **Bundle Size**: No increase > 10% from baseline
- **Build Time**: No increase > 20% from baseline
- **TypeScript Errors**: 0 errors
- **Console Warnings**: 0 warnings in production

### Qualitative Metrics
- **Developer Experience**: Reduced time to build new features
- **Design Consistency**: Visual consistency across all pages
- **Accessibility**: Screen reader usability improved
- **Maintainability**: Reduced code duplication
- **Medical Compliance**: Clear visual indicators for medical credibility
- **LGPD Compliance**: Clear consent states

---

## Post-Implementation

### Monitoring
- Lighthouse CI on every PR
- Bundle size monitoring with bundlesize
- Error tracking with Sentry
- User feedback collection

### Maintenance
- Quarterly design system review
- Update dependencies (react-imask, radix-ui)
- Accessibility audit every 6 months
- Performance optimization as needed

### Future Enhancements (Phase 7+)
- Storybook integration for component playground
- Figma design system sync
- Additional Brazilian e-commerce patterns (Mercado Pago, Pagar.me)
- Enhanced prescription scanner component
- WhatsApp template components
- Multi-language support (Spanish for MERCOSUR)

---

## Approval & Sign-off

### Stakeholders
- [ ] Product Owner
- [ ] Technical Lead
- [ ] UX/Design Lead
- [ ] Medical Compliance Officer
- [ ] Data Protection Officer (LGPD)

### Checklist Before Implementation
- [ ] Constitution compliance verified
- [ ] LGPD requirements reviewed
- [ ] Medical compliance requirements reviewed
- [ ] Budget approved
- [ ] Timeline approved
- [ ] Risk mitigation strategies in place
- [ ] Rollback plan documented

---

## Resources

### Team Requirements
- **Frontend Developer**: 20-30 hours/week for 6 weeks
- **UX Designer**: 4-8 hours/week for design review
- **QA Tester**: 8-12 hours for testing phases
- **Accessibility Specialist**: 4-6 hours for audit

### Budget
- **Development Time**: 120-180 hours @ developer rate
- **QA Time**: 24-36 hours @ QA rate
- **Accessibility Audit**: 8-12 hours @ specialist rate
- **Total Estimate**: 152-228 hours

### External Dependencies
- `react-imask`: Brazilian input masks
- `@radix-ui/react-focus-scope`: Focus management
- Existing: `class-variance-authority`, `tailwindcss-animate`

---

## Contact & Questions

**Technical Lead**: Dr. Philipe Saraiva Cruz
**Repository**: svlentes-hero-shop
**Documentation**: `.specify/design/`

For questions or clarifications, refer to:
- Design system improvements: `design-system-improvements.md`
- Project constitution: `.specify/memory/constitution.md`
- Project guidance: `CLAUDE.md`

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-21
**Next Review**: 2025-11-21
