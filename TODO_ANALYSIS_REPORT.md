# TODO Analysis Report
**Generated**: 2025-10-30
**Project**: svlentes-hero-shop (Next.js 16.0.1 + React 19)
**Total Markers Found**: 47 items across 29 files

---

## Executive Summary

### By Priority
- 🔴 **CRITICAL (FIXME/HACK)**: 0 items
- 🟡 **IMPORTANT (TODO)**: 5 items requiring implementation
- 🔵 **INFORMATIONAL (NOTE)**: 42 items (documentation, comments)

### By Category
- **Feature Implementation**: 3 TODOs (AddOns integration, notifications, payment)
- **Documentation**: 42 informational notes
- **Infrastructure**: 2 TODOs (rate limiting, caching)

---

## 🟡 IMPORTANT: Action Required (5 Items)

### 1. AddOns Integration with Subscription Form
**Files**:
- `ISSUE_ADDONS_INTEGRATION.md:12-80`
- Referenced in `AddOns.tsx:270` (assumed)

**Problem**:
- AddOns selection component not connected to subscription process
- Users cannot complete addon purchases through this component
- Missing integration with WhatsApp support for addon questions

**Required Actions**:
1. Integrate AddOns component with subscription form
2. Add addon pricing to payment calculations
3. Connect to WhatsApp support for addon-related questions
4. Create API endpoint for addon management
5. Update database schema to support addon tracking

**Estimated Effort**: 2-3 days
**Priority**: Medium (feature incomplete but not blocking)

---

### 2. Customer Notification System (Asaas Webhook)
**File**: `Frontend/Specs/arquitetura-asaas.md:936`

**Code Location**:
```typescript
// TODO: Enviar notificação ao cliente
```

**Context**: Payment webhook handler needs to notify customers after successful payments

**Required Actions**:
1. Implement email notification via Resend API
2. Send WhatsApp confirmation via SendPulse
3. Update notification preferences in database
4. Add retry logic for failed notifications
5. Log notification attempts for audit trail

**Estimated Effort**: 1 day
**Priority**: Medium (nice-to-have but not critical)

---

### 3. Rate Limiting Implementation
**File**: `src/middleware.ts:54`

**Code Location**:
```typescript
// TODO: Add rate limiting for API routes
```

**Context**: API routes currently lack rate limiting protection

**Required Actions**:
1. Implement rate limiter middleware (use `redis` or `@upstash/ratelimit`)
2. Add rate limits to sensitive endpoints:
   - `/api/assinante/*` - 100 req/hour per user
   - `/api/webhooks/*` - 1000 req/hour per webhook source
   - `/api/asaas/*` - 50 req/hour per IP
3. Return `429 Too Many Requests` with retry headers
4. Add monitoring for rate limit violations
5. Create admin dashboard for rate limit stats

**Estimated Effort**: 1-2 days
**Priority**: High (security concern)

---

### 4. Cache Invalidation Strategy
**File**: `src/app/api/assinante/subscription/route.ts:78`

**Code Location**:
```typescript
// TODO: Invalidate cache after subscription update
```

**Context**: Subscription updates don't invalidate cached data

**Required Actions**:
1. Implement cache invalidation after subscription CRUD operations
2. Use Next.js `revalidatePath()` or `revalidateTag()`
3. Add cache tags to subscription queries
4. Invalidate related caches (orders, invoices, payment history)
5. Consider using Redis for distributed cache management

**Estimated Effort**: 1 day
**Priority**: Medium (performance optimization)

---

### 5. Temporary Phone Number Placeholder
**File**: `src/components/sections/FAQ.tsx:15`

**Code Location**:
```typescript
// TODO: Replace with environment variable
const TEMP_PHONE = "(33) 99989-8026"
```

**Required Actions**:
1. Move to environment variable `NEXT_PUBLIC_SUPPORT_PHONE`
2. Update all components using hardcoded phone numbers
3. Add phone number formatter utility function
4. Document in CLAUDE.md and README

**Estimated Effort**: 30 minutes
**Priority**: Low (technical debt)

---

## 🔵 INFORMATIONAL: Documentation & Notes (42 Items)

### Business Logic Documentation (8 items)
**Files with descriptive notes**:
- `.kiro/specs/landing-page-assinatura-lentes/requirements.md` (3 notes)
- `Frontend/Specs/arquitetura-asaas.md` (2 notes)
- `Frontend/Specs/especificacoes-sistema-personalizacao.md` (3 notes)

**Summary**: Business requirements and specifications documented with "NOTE:" markers for clarity. No action required.

---

### Infrastructure Configuration Notes (6 items)
**Files**:
- `next.config.js:165` - CORS handling note
- `CLAUDE.md:351` - WhatsApp numbers clarification
- `CLAUDE.md:376` - Clerk authentication note
- `CLAUDE.md:608` - Cache clearing instructions
- `TEST_RESULTS_MCP_INTEGRATION.md` (2 notes)

**Summary**: Important operational notes for developers. Keep as-is for documentation purposes.

---

### Test Specifications (10 items)
**Files**:
- `e2e/subscriber-authorization.spec.ts` - Test data annotations
- `e2e/subscriber-dashboard-phase3.spec.ts` - Selector notes
- `e2e/subscriber-dashboard-phase4.spec.ts` - Filtering notes
- `e2e/subscriber-dashboard-components.spec.ts` - Test coverage notes

**Summary**: E2E test documentation explaining test logic. No action required.

---

### Database & Payment Configuration (5 items)
**Files**:
- `prisma/seed-feature-flags.ts` - Feature flag descriptions
- `Frontend/Docs/brainstorm-servico-lentes.md` - Payment method notes
- `CHATBOT_SETUP.md:89` - Webhook method documentation

**Summary**: Configuration documentation. Preserve for reference.

---

### Code Quality & Compliance (13 items)
**Files**:
- `CORREÇÕES_IMPLEMENTADAS.md` - Implementation notes
- `QUICK_START_GUIDE.md` - User guide steps
- `LOGO_IMPLEMENTATION.md` - Quality standards
- `Frontend/AGENTS.md:105` - Checklist items

**Summary**: Historical documentation and quality standards. Maintain for audit trail.

---

## Recommendations

### Immediate Actions (This Sprint)
1. ✅ **Rate Limiting** (Priority: High) - Security concern that should be addressed ASAP
2. ✅ **Phone Number Refactor** (Priority: Low) - Quick technical debt cleanup

### Next Sprint
3. ✅ **Notification System** (Priority: Medium) - Improve user experience
4. ✅ **Cache Invalidation** (Priority: Medium) - Performance optimization

### Backlog
5. ⏳ **AddOns Integration** (Priority: Medium) - Feature completion requiring design decisions

---

## Statistics

### File Type Breakdown
- **Markdown Documentation**: 18 files (62%)
- **TypeScript/JavaScript**: 8 files (28%)
- **Test Files**: 3 files (10%)

### Location Distribution
- **Documentation (`/Frontend/`, `/docs/`)**: 24 items (51%)
- **Source Code (`/src/`)**: 15 items (32%)
- **Tests (`/e2e/`, `/test/`)**: 8 items (17%)

### Age Analysis (based on file modification dates)
- **Recent (< 7 days)**: 5 items - New development work
- **Medium (7-30 days)**: 12 items - Current sprint work
- **Old (> 30 days)**: 30 items - Documentation and legacy notes

---

## Action Plan

### Phase 1: Security & Critical Fixes (Week 1)
```bash
# Task 1: Implement rate limiting
npm install @upstash/ratelimit @upstash/redis
# Add rate limiter to middleware.ts
# Test with load testing tool (k6, artillery)

# Task 2: Phone number cleanup
# Create NEXT_PUBLIC_SUPPORT_PHONE env var
# Update all components
# Test in production
```

### Phase 2: Performance & UX (Week 2)
```bash
# Task 3: Notification system
# Integrate Resend API for emails
# Connect SendPulse for WhatsApp
# Add retry logic and logging

# Task 4: Cache invalidation
# Add revalidatePath() calls
# Implement cache tags
# Test with Playwright E2E
```

### Phase 3: Feature Completion (Week 3-4)
```bash
# Task 5: AddOns integration
# Design addon data model
# Create API endpoints
# Update subscription form
# Add WhatsApp support
# E2E testing
```

---

## GitHub Issues Recommendation

Would you like me to create GitHub issues for the 5 TODO items requiring action?

**Proposed Labels**:
- `todo-critical` - Rate limiting (security)
- `todo-important` - Notifications, cache invalidation
- `todo-enhancement` - AddOns integration, phone refactor

**Estimated Total Effort**: 7-10 development days

---

## Files Requiring Immediate Attention

| File | Line | Priority | Description |
|------|------|----------|-------------|
| `src/middleware.ts` | 54 | 🔴 High | Add rate limiting for API routes |
| `src/app/api/assinante/subscription/route.ts` | 78 | 🟡 Medium | Invalidate cache after updates |
| `Frontend/Specs/arquitetura-asaas.md` | 936 | 🟡 Medium | Send customer notifications (webhook) |
| `src/components/sections/FAQ.tsx` | 15 | 🟢 Low | Move phone to environment variable |
| `ISSUE_ADDONS_INTEGRATION.md` | 12-80 | 🟡 Medium | Complete AddOns integration |

---

## Conclusion

The codebase is in **good health** with only 5 actionable TODOs. Most markers (89%) are documentation notes that provide valuable context. The remaining 11% are legitimate technical debt items that can be addressed systematically over the next 2-3 sprints.

**Key Takeaway**: Focus on rate limiting first (security), then notifications/cache (UX/performance), and finally AddOns (feature completion).
