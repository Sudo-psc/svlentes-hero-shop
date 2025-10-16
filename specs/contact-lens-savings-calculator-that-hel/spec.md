# Feature Specification: Contact Lens Savings Calculator

**Status**: Draft
**Created**: 2025-10-16
**Last Updated**: 2025-10-16
**Owner**: Product Team

---

## Executive Summary

The Contact Lens Savings Calculator is an interactive tool that helps potential subscribers understand the financial benefits of SV Lentes subscription service compared to purchasing contact lenses individually. By inputting their current lens usage and costs, users receive personalized calculations showing potential annual savings, monthly cost comparison, and recommended subscription plans.

---

## Problem Statement

### Current Situation
Potential customers struggle to understand the true cost difference between their current lens purchasing habits (buying individual lenses) and a subscription model. Without concrete numbers, the value proposition remains abstract, leading to:
- Low conversion rates from visitor to subscriber
- Difficulty justifying subscription cost to price-sensitive customers
- Unclear which subscription plan best fits their needs

### User Need
Users need a clear, personalized demonstration of:
- How much they currently spend on contact lenses annually
- How much they would spend with SV Lentes subscription
- Exact savings amount in Brazilian currency (R$)
- Which subscription plan optimizes their savings

### Business Impact
- **Conversion barrier**: Without financial clarity, visitors hesitate to commit to subscription
- **Missed revenue**: Potential subscribers don't convert due to perceived cost concerns
- **Support burden**: Manual cost comparisons consume customer service time
- **Competitive disadvantage**: Without transparent pricing comparison, competitors gain advantage

---

## Proposed Solution

### Overview
A web-based interactive calculator that accepts user inputs about their current lens usage and costs, performs real-time calculations comparing subscription vs individual purchase costs, and displays comprehensive savings analysis with personalized plan recommendations.

### Key Capabilities
1. **Input Collection**: Capture user's annual lens costs, consultation costs, and usage patterns
2. **Real-Time Calculation**: Instant calculation as user adjusts input values
3. **Comprehensive Results**: Display monthly comparison, annual savings, savings percentage, and recommended plan
4. **Benefit Visualization**: Show included benefits (consultations, delivery, discounts)
5. **Conversion Path**: Save calculations and guide users to subscription signup

### Out of Scope
- Lens brand/type specific pricing (uses average pricing)
- Integration with user accounts (calculator is pre-signup, anonymous)
- Historical cost tracking (single-session calculation only)
- Comparison with competitor pricing (focuses on individual vs subscription)
- Multi-currency support (Brazilian Real only)
- PDF export of results
- Email delivery of calculation results

---

## User Scenarios & Testing

### Primary User Flow
**Actor**: Prospective subscriber (not yet logged in)
**Goal**: Understand if SV Lentes subscription will save money compared to current lens purchasing

**Steps**:
1. User navigates to `/calculadora` page
2. User sees default calculation with pre-filled industry-average values:
   - R$ 1200/year for contact lenses
   - R$ 400/year for consultations
3. User adjusts "Current Annual Lens Cost" slider (R$ 0 - R$ 5000)
4. Calculator updates results in real-time showing:
   - Monthly cost comparison (current vs subscription)
   - Annual total savings
   - Savings percentage
   - Recommended subscription plan
5. User reviews included benefits (consultations, delivery, discounts)
6. User clicks "Save Results & Continue" button
7. Results saved to localStorage for use in signup flow
8. User redirected to `/assinar` (subscription signup page)

**Success Outcome**: User understands their potential savings and proceeds to subscription signup with confidence

### Alternative Flows

**Flow 1: Low-Cost User**
- User has very low current costs (< R$ 500/year)
- Calculator shows small or negative savings
- System displays message: "Your current costs are already low. Consider premium plans for better lens quality and convenience"
- User may still proceed to see premium lens options

**Flow 2: High-Cost User**
- User has very high current costs (> R$ 3000/year)
- Calculator shows substantial savings (> R$ 1500/year)
- System highlights premium plan recommendation
- Emphasizes percentage savings (40-50%)

**Flow 3: Exploration Mode**
- User experiments with multiple values
- Each adjustment triggers recalculation
- User can compare different scenarios before deciding
- No commitment required until clicking "Save Results"

### Edge Cases

- **Case 1: Zero values entered** ’ System shows validation message "Please enter your current lens costs to see potential savings"
- **Case 2: Extremely high values (> R$ 10,000)** ’ Calculator still processes but suggests user contact support for custom enterprise plan
- **Case 3: Incomplete browser localStorage** ’ Results don't persist to signup page, but calculator still functions
- **Case 4: Rapid slider adjustments** ’ Debounced calculation prevents performance issues
- **Case 5: User revisits calculator after saving** ’ Previous values not restored (fresh calculation each visit)

### Error Scenarios

- **Error 1: Invalid numerical input** ’ System sanitizes input and uses last valid value
- **Error 2: Calculation overflow/underflow** ’ System clamps values to reasonable ranges (R$ 0 - R$ 10,000)
- **Error 3: localStorage quota exceeded** ’ Calculator functions normally, shows warning that results won't transfer to signup
- **Error 4: JavaScript disabled** ’ Graceful degradation: show static example calculation with CTA to enable JavaScript

---

## Functional Requirements

### Core Requirements

1. **[REQ-001]**: Accept Annual Contact Lens Cost Input
   - **Acceptance Criteria**:
     - Slider input with range R$ 0 to R$ 5,000
     - Default value: R$ 1,200
     - Real-time visual feedback of selected value
     - Input persists during session (not across page refreshes)
   - **Priority**: Must Have

2. **[REQ-002]**: Accept Annual Consultation Cost Input
   - **Acceptance Criteria**:
     - Slider input with range R$ 0 to R$ 2,000
     - Default value: R$ 400
     - Real-time visual feedback of selected value
     - Input persists during session
   - **Priority**: Must Have

3. **[REQ-003]**: Calculate Monthly Cost Comparison
   - **Acceptance Criteria**:
     - Show "Current Monthly Cost" (annual lens cost ÷ 12)
     - Show "Subscription Monthly Cost" based on recommended plan
     - Display both values in Brazilian Real format (R$ X,XX)
     - Calculate and display difference as "Monthly Savings"
   - **Priority**: Must Have

4. **[REQ-004]**: Calculate Annual Savings
   - **Acceptance Criteria**:
     - Total current annual cost = lens cost + consultation cost
     - Total subscription annual cost = (plan monthly price × 12)
     - Annual savings = current cost - subscription cost
     - Display in Brazilian Real format with proper currency symbol
   - **Priority**: Must Have

5. **[REQ-005]**: Calculate Savings Percentage
   - **Acceptance Criteria**:
     - Formula: (annual savings ÷ total current cost) × 100
     - Display as percentage with 0 decimal places
     - Show positive percentages for savings, negative for increased cost
   - **Priority**: Must Have

6. **[REQ-006]**: Recommend Subscription Plan
   - **Acceptance Criteria**:
     - Logic determines best plan based on usage/cost profile
     - Display recommended plan name (Basic, Premium, etc.)
     - Show plan monthly price
     - Explain why plan was recommended
   - **Priority**: Must Have

7. **[REQ-007]**: Display Included Benefits
   - **Acceptance Criteria**:
     - List of included benefits in subscription plan
     - Each benefit shows icon, title, and brief description
     - Benefits include: consultations, delivery, lens discounts
     - Visual distinction for premium vs basic benefits
   - **Priority**: Should Have

8. **[REQ-008]**: Real-Time Calculation Updates
   - **Acceptance Criteria**:
     - Results update immediately as user adjusts sliders
     - No "Calculate" button required
     - Smooth transition between values (no flickering)
     - Calculation completes within 100ms of input change
   - **Priority**: Must Have

9. **[REQ-009]**: Save Results for Signup Flow
   - **Acceptance Criteria**:
     - "Save Results & Continue" button visible after calculation
     - On click, saves calculation inputs and results to browser localStorage
     - Redirects user to `/assinar` (signup page)
     - Saved data persists until browser localStorage is cleared
   - **Priority**: Must Have

10. **[REQ-010]**: Responsive Mobile Layout
    - **Acceptance Criteria**:
      - Calculator fully functional on mobile devices (e 375px width)
      - Touch-friendly slider controls (minimum 44×44px touch targets)
      - All text readable without horizontal scrolling
      - Results display in stacked layout on small screens
    - **Priority**: Must Have

11. **[REQ-011]**: Brazilian Currency Formatting
    - **Acceptance Criteria**:
      - All monetary values display with R$ symbol
      - Thousands separator: . (dot)
      - Decimal separator: , (comma)
      - Two decimal places for centavos
      - Example: R$ 1.234,56
    - **Priority**: Must Have

12. **[REQ-012]**: Default Values Based on Industry Data
    - **Acceptance Criteria**:
      - Default annual lens cost: R$ 1,200 (industry average in Brazil)
      - Default annual consultation cost: R$ 400 (2 consultations @ R$ 200)
      - Defaults show realistic scenario without user input
      - User can immediately see example savings
    - **Priority**: Should Have

### Data Requirements

**Key Entities**:
- **Calculation Input**: User-provided cost values
  - `annualContactLensCost`: number (R$ 0 - R$ 5,000)
  - `annualConsultationCost`: number (R$ 0 - R$ 2,000)

- **Calculation Result**: Computed savings analysis
  - `currentMonthlyCost`: number (calculated)
  - `subscriptionMonthlyCost`: number (calculated)
  - `monthlySavings`: number (calculated)
  - `annualSavings`: number (calculated)
  - `savingsPercentage`: number (calculated)
  - `recommendedPlan`: object (name, price, benefits)

- **Subscription Plan**: Available plan options
  - `planId`: string
  - `name`: string
  - `monthlyPrice`: number
  - `annualPrice`: number (monthlyPrice × 12)
  - `includedConsultations`: number
  - `benefits`: array of benefit objects

**Data Relationships**:
- Calculation Input ’ Calculation Result (one-to-one, ephemeral)
- Calculation Result ’ Recommended Plan (many-to-one, derived)
- Saved Calculation (localStorage) ’ Signup Flow (one-to-one, cross-page)

---

## Non-Functional Requirements

### Performance
- Initial page load: < 2 seconds on 3G network
- Calculation execution: < 100ms per input change
- Slider responsiveness: < 50ms visual feedback on drag
- No layout shift during calculation updates (CLS < 0.1)

### Security & Privacy
- No user authentication required (public page)
- No personal identifiable information collected
- No server-side data storage (calculations are client-side only)
- localStorage data stays on user's device
- LGPD compliant: no data sent to third parties

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation for all slider controls (arrow keys adjust values)
- Screen reader announcements for calculation results
- Minimum color contrast ratio: 4.5:1 for text
- Focus indicators visible on all interactive elements
- Descriptive labels for all form inputs

### Usability
- Calculator understandable without instructions
- Results visible without scrolling on desktop (above fold)
- Clear visual hierarchy: inputs ’ results ’ CTA
- Currency symbols and formatting familiar to Brazilian users
- Error states communicated clearly in Portuguese

---

## Success Criteria

**Quantitative Metrics**:
- **Engagement**: 60% of calculator page visitors complete a calculation (adjust at least one slider)
- **Conversion**: 30% of users who complete calculation proceed to signup page
- **Time on page**: Average 45-90 seconds (indicates thoughtful interaction)
- **Bounce rate**: < 40% (users stay to see results)
- **Mobile usage**: Calculator functions equivalently on mobile (< 5% drop in conversion vs desktop)

**Qualitative Outcomes**:
- Users report understanding the value proposition clearly
- Support tickets about pricing decrease by 40%
- Sales team reports calculator as frequently cited reason for signup
- User feedback indicates calculator builds trust and confidence

---

## Assumptions

1. Industry average contact lens cost in Brazil is R$ 1,200/year (based on 2024 market research)
2. Average ophthalmology consultation cost is R$ 200 per visit
3. Users primarily purchase daily or monthly lenses (not specialized/medical lenses)
4. Users have basic understanding of their current lens purchasing costs
5. Brazilian Real (R$) is the only required currency
6. Target browsers support localStorage and ES6 JavaScript
7. Subscription plans and pricing are already defined in business model
8. Users trust self-reported savings calculations without third-party validation
9. Mobile users have functional touch interfaces (no stylus-only devices)
10. Calculator is pre-signup tool (not for existing subscribers to recalculate)

---

## Dependencies

### Internal Dependencies
- **Subscription plan data**: Calculator requires current plan pricing and benefit information
- **Signup flow integration**: Saved results must be readable by `/assinar` page
- **Design system**: Reuses existing Tailwind CSS components and color scheme (cyan/silver)
- **Analytics tracking**: Page views and interactions tracked via existing Google Analytics setup

### External Dependencies
- **Browser localStorage API**: Required for persisting calculation results to signup page
- **Modern browser support**: Requires ES6 JavaScript, CSS Grid, Flexbox support

---

## Open Questions

_None - specification is complete with reasonable defaults. Implementation can proceed._

---

## Approval

- [ ] Product Owner
- [ ] Technical Lead
- [ ] UX/Design
- [ ] Security Review (N/A - no sensitive data)

---

## Revision History

| Version | Date       | Changes                     | Author        |
|---------|------------|-----------------------------|---------------|
| 1.0     | 2025-10-16 | Initial specification       | Product Team  |
