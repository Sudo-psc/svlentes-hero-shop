# Design System 2.0 Documentation

**Project**: SV Lentes Healthcare Platform
**Version**: 2.0.0
**Created**: 2025-10-21
**Status**: ✅ Design Complete, Ready for Implementation

---

## 📚 Documentation Overview

This directory contains comprehensive documentation for the SV Lentes Design System 2.0, a healthcare-focused design system with Brazilian localization and LGPD compliance.

---

## 📖 Document Index

### 1. **Executive Summary**

**File**: `DESIGN_SYSTEM_SUMMARY.md`
**Purpose**: High-level overview for stakeholders
**Read Time**: 10-15 minutes

**Contents**:

- What we're improving
- Key deliverables
- Expected improvements
- Implementation timeline (6 weeks)
- Success criteria
- Rollout strategy

**Audience**: Product Owners, Stakeholders, Management

---

### 2. **Detailed Specifications**

**File**: `design-system-improvements.md`
**Purpose**: Comprehensive design specifications
**Read Time**: 60-90 minutes

**Contents**:

- Current state analysis (strengths + gaps)
- Design token system (spacing, elevation, colors, motion, typography)
- Component architecture improvements
- Brazilian input components
- Medical-specific components
- LGPD compliance components
- Accessibility enhancements
- Loading states & skeletons
- Success criteria
- Dependencies
- Migration guide

**Audience**: Frontend Developers, UX Designers, Technical Leads

---

### 3. **Implementation Plan**

**File**: `design-system-implementation-plan.md`
**Purpose**: Step-by-step implementation guide
**Read Time**: 40-60 minutes

**Contents**:

- 6-phase implementation plan
- Phase 1: Token System (Week 1)
- Phase 2: Enhanced Components (Week 2-3)
- Phase 3: Medical & LGPD Components (Week 3-4)
- Phase 4: Accessibility Enhancements (Week 5)
- Phase 5: Loading States & Skeletons (Week 5-6)
- Phase 6: Documentation & Testing (Week 6)
- Rollout strategy (gradual, 7-12 weeks)
- Risk assessment
- Success metrics

**Audience**: Frontend Developers, Project Managers, QA Engineers

---

### 4. **Architecture Diagram**

**File**: `design-system-architecture.md`
**Purpose**: Visual system architecture
**Read Time**: 20-30 minutes

**Contents**:

- System architecture overview
- Token system layer
- Component architecture
- Component relationship diagram
- Data flow architecture
- Token application flow
- Accessibility architecture
- Brazilian localization flow
- Component enhancement pattern
- Loading state architecture
- Testing architecture
- Deployment architecture
- Integration with existing systems

**Audience**: System Architects, Technical Leads, Senior Developers

---

### 5. **This README**

**File**: `README.md` ← You are here
**Purpose**: Documentation navigation and quick reference
**Read Time**: 5 minutes

**Contents**:

- Document index
- Quick start guide
- Key features summary
- Decision framework
- Related resources

**Audience**: Everyone

---

## 🚀 Quick Start Guide

### For Stakeholders (Non-Technical)

1. Read **Executive Summary** (`DESIGN_SYSTEM_SUMMARY.md`)
2. Review timeline and budget
3. Approve implementation
4. Monitor progress via weekly check-ins

### For Frontend Developers

1. Read **Implementation Plan** (`design-system-implementation-plan.md`)
2. Review **Detailed Specifications** (`design-system-improvements.md`)
3. Understand **Architecture** (`design-system-architecture.md`)
4. Start with Phase 1: Token System
5. Follow phased implementation

### For UX Designers

1. Review **Executive Summary** for design direction
2. Study **Detailed Specifications** for component variants
3. Review healthcare color palette
4. Validate medical UI patterns
5. Provide feedback on accessibility

### For QA Engineers

1. Read **Implementation Plan** (Phase 6: Testing)
2. Review accessibility requirements
3. Study test architecture in **Architecture Diagram**
4. Prepare test plans for each phase
5. Set up Lighthouse CI and axe DevTools

---

## 🎯 Key Features Summary

### Design Token System

- ✅ Semantic spacing scale (4px base unit)
- ✅ Elevation system (medical variants)
- ✅ Healthcare color palette
- ✅ Motion tokens (duration + easing + reduced motion)
- ✅ Typography scale (Inter + Poppins)
- ✅ Responsive breakpoints

### Enhanced Components

- ✅ Button: 9 variants (medical, whatsapp, pix, emergency)
- ✅ Card: 8 variants (medical, interactive, glass, gradient)
- ✅ Brazilian inputs: CPF, Phone, Currency, Date
- ✅ Unified skeleton system

### Medical Components

- ✅ PrescriptionCard (status-aware display)
- ✅ DoctorBadge (CRM credibility indicator)

### LGPD Components

- ✅ ConsentBadge (visual consent status)
- ✅ DataUsageIndicator (data transparency)

### Accessibility

- ✅ Skip links
- ✅ Focus trap
- ✅ Reduced motion support
- ✅ WCAG 2.1 AA compliance
- ✅ Live regions for screen readers

---

## 📊 Implementation Timeline

```
Week 1: Token System Foundation
Week 2-3: Enhanced Components
Week 3-4: Medical & LGPD Components
Week 5: Accessibility Enhancements
Week 5-6: Loading States & Skeletons
Week 6: Documentation & Testing

Total: 6 weeks (120-180 hours)
```

### Gradual Rollout (Weeks 7-12)

```
Week 7:  Token system deployment (invisible to users)
Week 8:  /calculadora (test page)
Week 9:  /area-assinante (authenticated area)
Week 10: /assinar (subscription flow)
Week 11: / (landing page)
Week 12: Full rollout, deprecate old components
```

---

## 🎨 Visual Examples

### Color Palette Preview

**Primary (Cyan)**: `#06b6d4` - Professional, technological
**Secondary (Silver)**: `#64748b` - Neutral, balanced
**Success (Green)**: `#22c55e` - Medical safety, approval
**Warning (Amber)**: `#f59e0b` - Caution, pending
**Medical Gray**: `#475569` - Professional credibility
**WhatsApp**: `#25d366` - Official WhatsApp green
**PIX**: `#00c9a7` - Brazilian instant payment

### Component Examples

#### Enhanced Button

```tsx
// Medical variant with loading state
<Button
  variant="medical"
  size="lg"
  loading={isLoading}
  loadingText="Agendando consulta..."
  icon={<Calendar />}
  fullWidth
>
  Agendar Consulta
</Button>

// WhatsApp action button
<Button variant="whatsapp" icon={<MessageCircle />}>
  Falar no WhatsApp
</Button>

// PIX payment button
<Button variant="pix" icon={<QrCode />}>
  Pagar com PIX
</Button>
```

#### Brazilian Inputs

```tsx
// CPF with automatic formatting
<CPFInput
  placeholder="Digite seu CPF"
  value={cpf}
  onChange={(e) => setCpf(e.target.value)}
/>

// Phone with Brazilian format
<PhoneInput
  placeholder="(00) 00000-0000"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
/>

// Currency with R$ and comma separator
<CurrencyInput
  placeholder="R$ 0,00"
  value={price}
  onChange={(e) => setPrice(e.target.value)}
/>

// Brazilian date format
<DateInputBR
  placeholder="DD/MM/AAAA"
  value={date}
  onChange={(e) => setDate(e.target.value)}
/>
```

#### PrescriptionCard

```tsx
<PrescriptionCard
  status='valid'
  doctorName='Dr. Philipe Saraiva Cruz'
  doctorCRM='CRM-MG 69.870'
  issueDate='15/10/2025'
  expiryDate='15/10/2026'
  prescriptionDetails={{
    rightEye: '-2.50 -0.75 x 180',
    leftEye: '-2.75 -1.00 x 170',
    lensType: 'Lentes de Contato Diárias'
  }}
/>
```

#### ConsentBadge

```tsx
<ConsentBadge
  status='granted'
  purpose='Agendamento de consultas e envio de prescrições'
  date='15/10/2025'
/>
```

---

## 🔍 Decision Framework

### When to Use Which Component?

#### Buttons

- **default**: General actions
- **medical**: Medical-related actions (consultations, prescriptions)
- **whatsapp**: WhatsApp contact actions
- **pix**: PIX payment actions
- **emergency**: Urgent medical actions (requires attention)
- **outline**: Secondary actions
- **ghost**: Tertiary actions
- **link**: Text-only links

#### Cards

- **default**: Standard content containers
- **medical**: Medical information (prescriptions, doctor info)
- **elevated**: Important highlighted content
- **interactive**: Clickable cards (product selection, plan choice)
- **glass**: Overlay content with transparency
- **gradient**: Special promotional content
- **success/warning/error**: Status-specific content

#### Inputs

- **CPFInput**: Brazilian CPF (tax ID)
- **PhoneInput**: Brazilian mobile/landline
- **CurrencyInput**: Monetary values in Brazilian Real
- **DateInputBR**: Dates in DD/MM/YYYY format
- **Standard Input**: All other text inputs

---

## ✅ Success Criteria Checklist

### Functional Requirements

- [ ] All components support light/dark modes
- [ ] Brazilian input masks work correctly
- [ ] Medical components display data accurately
- [ ] LGPD components reflect consent states
- [ ] Loading states provide clear feedback
- [ ] Accessibility features work (skip links, focus trap)

### Non-Functional Requirements

- [ ] WCAG 2.1 AA compliance (Lighthouse ≥ 90)
- [ ] Performance: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Mobile responsive: 375px - 1920px
- [ ] TypeScript: Full type coverage, no `any`
- [ ] Bundle size: ≤ 10% increase
- [ ] Test coverage: ≥ 80%

### Compliance Requirements

- [ ] LGPD visual indicators functional
- [ ] Medical credibility preserved (CRM visible)
- [ ] Brazilian localization maintained
- [ ] Emergency contacts accessible

---

## 📦 Dependencies

### New Packages (2 total)

```json
{
  "react-imask": "^7.1.3",
  "@radix-ui/react-focus-scope": "^1.0.4"
}
```

### Existing Packages (No Changes)

- `class-variance-authority` - Component variants
- `tailwindcss-animate` - Animations
- `@radix-ui/*` - UI primitives (shadcn/ui foundation)

---

## 🧪 Testing Strategy

### Automated Testing

```bash
# Unit tests (Jest + RTL)
npm run test

# Resilience tests (Vitest)
npm run test:resilience

# Integration tests (Vitest)
npm run test:integration

# E2E tests (Playwright)
npm run test:e2e

# All tests
npm run test:all
```

### Accessibility Testing

```bash
# Lighthouse CI
npm run lighthouse

# Manual: axe DevTools browser extension
# Manual: NVDA screen reader
# Manual: Keyboard-only navigation
```

### Cross-Browser Testing

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

---

## 📈 Monitoring & Maintenance

### Post-Implementation Monitoring

- **Lighthouse CI**: Every PR
- **Bundle Size**: Automated monitoring with bundlesize
- **Error Tracking**: Sentry integration
- **User Feedback**: Collection and analysis

### Maintenance Schedule

- **Monthly**: Component usage analytics, performance review
- **Quarterly**: Design system review, dependency updates
- **Semi-Annual**: Accessibility audit, comprehensive testing
- **Annual**: Major version planning, technology upgrades

---

## 🤝 Stakeholder Approval

Required approvals before implementation:

- [ ] **Product Owner** - Business value and timeline
- [ ] **Technical Lead** - Technical architecture and feasibility
- [ ] **UX/Design Lead** - Design quality and consistency
- [ ] **Medical Compliance Officer** - Medical credibility and safety
- [ ] **Data Protection Officer** - LGPD compliance and data handling

---

## 📞 Contact & Support

**Technical Lead**: Dr. Philipe Saraiva Cruz
**Repository**: svlentes-hero-shop
**Documentation Location**: `.specify/design/`

### Questions or Clarifications?

Refer to the appropriate document:

- **Business questions**: `DESIGN_SYSTEM_SUMMARY.md`
- **Technical questions**: `design-system-improvements.md`
- **Implementation questions**: `design-system-implementation-plan.md`
- **Architecture questions**: `design-system-architecture.md`

---

## 🔗 Related Resources

### Project Documentation

- **Project Constitution**: `.specify/memory/constitution.md`
- **Project Guidance**: `CLAUDE.md`
- **Tailwind Config**: `tailwind.config.js`
- **Global Styles**: `src/app/globals.css`

### External Resources

- **shadcn/ui**: [https://ui.shadcn.com/](https://ui.shadcn.com/)
- **Radix UI**: [https://www.radix-ui.com/](https://www.radix-ui.com/)
- **Tailwind CSS**: [https://tailwindcss.com/](https://tailwindcss.com/)
- **React IMask**: [https://imask.js.org/guide.html](https://imask.js.org/guide.html)
- **WCAG 2.1**: [https://www.w3.org/WAI/WCAG21/quickref/](https://www.w3.org/WAI/WCAG21/quickref/)
- **LGPD**: [https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)

---

## 📄 Document Versions

| Document                | Version | Last Updated | Status      |
| ----------------------- | ------- | ------------ | ----------- |
| Executive Summary       | 1.0.0   | 2025-10-21   | ✅ Complete |
| Detailed Specifications | 2.0.0   | 2025-10-21   | ✅ Complete |
| Implementation Plan     | 1.0.0   | 2025-10-21   | ✅ Complete |
| Architecture Diagram    | 1.0.0   | 2025-10-21   | ✅ Complete |
| README (this file)      | 1.0.0   | 2025-10-21   | ✅ Complete |

---

## 🎉 Next Steps

1. **Review** all documentation (estimated 2-3 hours)
2. **Approve** implementation plan and budget
3. **Assign** frontend developer and QA tester
4. **Schedule** kickoff meeting
5. **Start** Phase 1: Token System (Week 1)

---

**Ready to transform the SV Lentes design system!** 🚀

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-21
**Next Review**: After Phase 1 completion (Week 2)
