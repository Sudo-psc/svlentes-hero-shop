# Next.js 16 API Route Compatibility Audit Report

**Date**: 2025-11-03
**Project**: SVLentes Landing Page (Next.js 15)
**Target Version**: Next.js 16
**Total Route Files**: 104

---

## Executive Summary

This audit examined all 104 API route handlers in the `src/app/api/` directory for Next.js 16 compatibility issues. **Critical findings include widespread TypeScript suppression, missing dynamic declarations, and inconsistent header access patterns.**

### Key Metrics
- **99 files (95%)** have `@ts-nocheck` directives masking type errors
- **82 files (79%)** are missing required `export const dynamic` declarations
- **29 files (28%)** use deprecated `request.headers.get()` pattern
- **22 files (21%)** properly implement `export const dynamic` declarations

---

## Critical Issues

### 1. **HIGH PRIORITY: Widespread @ts-nocheck Usage (99 files)**

**Severity**: 🔴 HIGH  
**Impact**: Prevents type safety, hides real errors, makes future maintenance difficult  
**Status**: All but 5 files use this bypass

**Problem**: 
- TypeScript errors are completely suppressed across the API layer
- Real bugs may be hidden behind the `@ts-nocheck` directive
- Makes it impossible to maintain type safety as codebase grows

**Example**:
```typescript
// @ts-nocheck - Prisma type mismatches - requires schema regeneration or type fixes
import { NextRequest, NextResponse } from 'next/server'
// ... rest of code without type checking
```

**Files Affected**: 99 files including:
- All admin routes (34 files)
- All assinante/subscriber routes (12 files)
- All authentication routes (5 files)
- Most webhook and webhook routes
- Complete list in "Files with @ts-nocheck" section below

**Recommendations**:
1. ✅ Remove `@ts-nocheck` from files
2. ✅ Run `npx prisma generate` to regenerate Prisma types
3. ✅ Fix actual type mismatches rather than suppressing them
4. ✅ Enable strict TypeScript checking in `tsconfig.json`
5. ✅ Add pre-commit hooks to prevent new `@ts-nocheck` directives

---

### 2. **MEDIUM PRIORITY: Missing 'export const dynamic' Declarations (82 files)**

**Severity**: 🟡 MEDIUM  
**Impact**: Incorrect caching behavior, potential stale responses in production  
**Status**: 79% of routes affected

**Problem**:
- Routes that depend on dynamic data (headers, cookies, path parameters, query params) require `export const dynamic = 'force-dynamic'` in Next.js 13+
- Without this declaration, routes may be incorrectly cached
- Can lead to security issues if auth headers are cached incorrectly

**Next.js 16 Context**:
- App Router routes default to `'auto'` caching
- Routes accessing `request.headers`, `cookies()`, etc. must explicitly opt-out of caching
- This is enforced more strictly in Next.js 16

**Files Missing Dynamic Declaration** (82 total):
```
/root/svlentes-hero-shop/src/app/api/auth/set-token/route.ts
/root/svlentes-hero-shop/src/app/api/stripe/create-checkout/route.ts
/root/svlentes-hero-shop/src/app/api/stripe/pix/create-payment/route.ts
/root/svlentes-hero-shop/src/app/api/stripe/customer-portal/route.ts
/root/svlentes-hero-shop/src/app/api/v1/reminders/[id]/route.ts
/root/svlentes-hero-shop/src/app/api/v1/reminders/route.ts
/root/svlentes-hero-shop/src/app/api/v1/analytics/dashboard/route.ts
/root/svlentes-hero-shop/src/app/api/v1/analytics/engagement/route.ts
/root/svlentes-hero-shop/src/app/api/v1/users/[userId]/preferences/route.ts
/root/svlentes-hero-shop/src/app/api/v1/interactions/route.ts
/root/svlentes-hero-shop/src/app/api/v1/ml/predict/route.ts
/root/svlentes-hero-shop/src/app/api/v1/ml/metrics/route.ts
/root/svlentes-hero-shop/src/app/api/v1/scheduler/snapshot/route.ts
/root/svlentes-hero-shop/src/app/api/v1/scheduler/process/route.ts
/root/svlentes-hero-shop/src/app/api/whatsapp/support/route.ts
/root/svlentes-hero-shop/src/app/api/debug/stats/route.ts
/root/svlentes-hero-shop/src/app/api/debug/conversation/[phone]/route.ts
/root/svlentes-hero-shop/src/app/api/debug/health/route.ts
/root/svlentes-hero-shop/src/app/api/debug/message/[messageId]/route.ts
/root/svlentes-hero-shop/src/app/api/reminders/send/route.ts
... and 62 more files
```

**Recommendations**:
1. ✅ Add `export const dynamic = 'force-dynamic'` to all routes
2. ✅ Routes that are truly static (no headers/cookies/params) can use `'auto'` 
3. ✅ Never use `'force-static'` for authenticated routes
4. ✅ Use `revalidate` for routes that can be cached (not applicable to API routes)

**Correct Pattern**:
```typescript
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // ✅ Required for all dynamic routes

export async function GET(request: NextRequest) {
  // Your handler code
}
```

---

### 3. **MEDIUM PRIORITY: Mixed Header Access Patterns (29 files)**

**Severity**: 🟡 MEDIUM  
**Impact**: Inconsistent code patterns, potential compatibility issues  
**Status**: 29 files use deprecated pattern, 2 use correct pattern

**Problem**:
- **29 files** use `request.headers.get('header-name')` (old/direct pattern)
- **2 files** use `headers()` function from `next/headers` (correct pattern)
- No consistency across the codebase
- `request.headers` pattern is less idiomatic in Next.js

**Files Using request.headers.get()** (28 files):
```
/root/svlentes-hero-shop/src/app/api/assinante/subscription/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/orders/route.ts
/root/svlentes-hero-shop/src/app/api/stripe/customer-portal/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/payment-history/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/invoices/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/prescription/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/savings-widget/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/contextual-actions/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/dashboard-metrics/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/delivery-preferences/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/delivery-status/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/delivery-timeline/route.ts
/root/svlentes-hero-shop/src/app/api/admin/audit/route.ts
/root/svlentes-hero-shop/src/app/api/subscription/change-plan/route.ts
/root/svlentes-hero-shop/src/app/api/subscription/update-address/route.ts
/root/svlentes-hero-shop/src/app/api/subscription/history/route.ts
/root/svlentes-hero-shop/src/app/api/subscription/update-payment/route.ts
/root/svlentes-hero-shop/src/app/api/subscription/route.ts
/root/svlentes-hero-shop/src/app/api/privacy/consent-log/route.ts
/root/svlentes-hero-shop/src/app/api/privacy/data-export/route.ts
/root/svlentes-hero-shop/src/app/api/privacy/data-request/route.ts
/root/svlentes-hero-shop/src/app/api/user/notification-preferences/route.ts
/root/svlentes-hero-shop/src/app/api/user/preferences/route.ts
/root/svlentes-hero-shop/src/app/api/user/profile/route.ts
/root/svlentes-hero-shop/src/app/api/webhooks/asaas/route.ts
/root/svlentes-hero-shop/src/app/api/webhooks/sendpulse/route.ts
/root/svlentes-hero-shop/src/app/api/whatsapp-redirect/route.ts
/root/svlentes-hero-shop/src/app/api/monitoring/alerts/route.ts
... and 2+ more files
```

**Files Using headers() Correctly** (2 files):
```
/root/svlentes-hero-shop/src/app/api/webhooks/stripe/route.ts
/root/svlentes-hero-shop/src/app/api/stripe/customer-portal/route.ts
```

**Pattern Comparison**:

❌ **Deprecated Pattern** (request.headers.get):
```typescript
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  // Direct access to request.headers
}
```

✅ **Recommended Pattern** (headers function):
```typescript
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const headersList = await headers()
  const authHeader = headersList.get('Authorization')
  // Use headers() function instead
}
```

**Why the difference matters**:
- `headers()` function is the official Next.js way (supports edge runtime)
- `request.headers` requires server runtime
- `headers()` is async and signals intent to runtime
- Better for middleware composition and future compatibility

**Recommendations**:
1. ✅ Use `headers()` function instead of `request.headers.get()`
2. ✅ Import from `'next/headers'`
3. ✅ Make access async: `const headersList = await headers()`
4. ✅ Consistent pattern across all routes

---

## Files Status Summary

### ✅ Compliant Files (22 files - 21%)
These files have proper `export const dynamic` declarations:

```
/root/svlentes-hero-shop/src/app/api/admin/audit/route.ts
/root/svlentes-hero-shop/src/app/api/asaas/create-payment/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/contextual-actions/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/dashboard-metrics/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/delivery-preferences/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/delivery-timeline/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/invoices/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/orders/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/payment-history/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/prescription/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/register/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/savings-widget/route.ts
/root/svlentes-hero-shop/src/app/api/assinante/subscription/route.ts
/root/svlentes-hero-shop/src/app/api/auth/forgot-password/route.ts
/root/svlentes-hero-shop/src/app/api/auth/resend-verification/route.ts
/root/svlentes-hero-shop/src/app/api/auth/reset-password/route.ts
/root/svlentes-hero-shop/src/app/api/auth/verify-email/route.ts
/root/svlentes-hero-shop/src/app/api/config-health/route.ts
/root/svlentes-hero-shop/src/app/api/config/route.ts
/root/svlentes-hero-shop/src/app/api/monitoring/errors/route.ts
/root/svlentes-hero-shop/src/app/api/subscription/route.ts
/root/svlentes-hero-shop/src/app/api/webhooks/asaas/route.ts
```

### 🔴 Non-Compliant Files (82 files - 79%)
Missing `export const dynamic` declarations

---

## Detailed Issue Breakdown by Category

### Admin Routes
- **Total**: 34 files
- **With @ts-nocheck**: 34 (100%)
- **Missing dynamic**: 27 (79%)
- **Using request.headers.get()**: 3 (9%)

### Assinante (Subscriber) Routes
- **Total**: 12 files
- **With @ts-nocheck**: 12 (100%)
- **Missing dynamic**: 0 (0%) ✅
- **Using request.headers.get()**: 12 (100%)
- **Note**: These routes have proper dynamic declarations but all use deprecated header pattern

### Authentication Routes
- **Total**: 5 files
- **With @ts-nocheck**: 4 (80%)
- **Missing dynamic**: 1 (20%)
- **Using request.headers.get()**: 0 (0%)
- **Using headers()**: 0 (0%)
- **Status**: Mixed compliance

### Stripe/Payment Routes
- **Total**: 3 files
- **With @ts-nocheck**: 0 (0%) ✅
- **Missing dynamic**: 3 (100%)
- **Using headers()**: 1 (33%) ✅
- **Status**: No TypeScript bypass, but needs dynamic declarations

### Webhook Routes
- **Total**: 3 files
- **With @ts-nocheck**: 3 (100%)
- **Missing dynamic**: 1 (33%)
- **Using request.headers.get()**: 2 (67%)
- **Status**: Critical payment processing routes need fixes

### V1 API Routes
- **Total**: 10 files
- **With @ts-nocheck**: 10 (100%)
- **Missing dynamic**: 10 (100%)
- **Status**: Completely non-compliant

### Debug Routes
- **Total**: 4 files
- **With @ts-nocheck**: 4 (100%)
- **Missing dynamic**: 4 (100%)
- **Status**: Development-only but should still comply

---

## Migration Path to Next.js 16

### Phase 1: Type Safety (1-2 weeks)
**Priority**: CRITICAL

1. Remove all `@ts-nocheck` directives
2. Run `npx prisma generate` to ensure latest types
3. Fix actual TypeScript errors:
   - Type mismatches in request/response handling
   - Missing type definitions for environment variables
   - Prisma type incompatibilities

**Commands**:
```bash
# Generate Prisma types
npx prisma generate

# Check TypeScript errors
npx tsc --noEmit

# Locate all @ts-nocheck
grep -r "@ts-nocheck" src/app/api/
```

### Phase 2: Dynamic Declarations (1 week)
**Priority**: HIGH

1. Add `export const dynamic = 'force-dynamic'` to all 82 files
2. Review each route to confirm it actually needs dynamic rendering
3. Consider if some routes can use `'auto'` (rarely applicable for API routes)

**Pattern**:
```typescript
// Add at the top of every route.ts file
export const dynamic = 'force-dynamic'

// If route uses headers/cookies/request data
export async function GET(request: NextRequest) { }
```

**Script to add declarations**:
```bash
# For all assinante routes
for file in src/app/api/assinante/*/route.ts; do
  if ! grep -q "export const dynamic" "$file"; then
    sed -i '1s/^/export const dynamic = '\''force-dynamic'\''\n\n/' "$file"
  fi
done
```

### Phase 3: Header Pattern Standardization (1 week)
**Priority**: MEDIUM

1. Replace `request.headers.get()` with `headers()` function
2. Update all 29 affected files
3. Add async/await for headers access

**Find and replace pattern**:
```typescript
// Before
const authHeader = request.headers.get('Authorization')

// After
import { headers } from 'next/headers'

const headersList = await headers()
const authHeader = headersList.get('Authorization')
```

### Phase 4: Testing & Validation (1-2 weeks)
**Priority**: HIGH

1. Run full test suite: `npm run test && npm run test:e2e`
2. Test all authenticated endpoints
3. Verify webhook handling still works
4. Load testing for caching behavior changes
5. Monitor production behavior

```bash
npm run test
npm run test:e2e
npm run lint
npm run build
```

---

## Specific File Recommendations

### Critical Payment Routes
These need immediate attention (handle real money):

1. **`/src/app/api/asaas/create-payment/route.ts`**
   - Status: ✅ Has `export const dynamic = 'force-dynamic'`
   - Issue: Has @ts-nocheck
   - Action: Remove @ts-nocheck, fix types

2. **`/src/app/api/webhooks/stripe/route.ts`**
   - Status: ❌ Missing dynamic declaration (CRITICAL)
   - Issue: Uses `headers()` but no dynamic export
   - Action: Add `export const dynamic = 'force-dynamic'`
   - Reason: Stripe webhooks must never be cached

3. **`/src/app/api/webhooks/asaas/route.ts`**
   - Status: ✅ Has `export const dynamic = 'force-dynamic'`
   - Issue: Has @ts-nocheck
   - Action: Remove @ts-nocheck

4. **`/src/app/api/stripe/customer-portal/route.ts`**
   - Status: ❌ Missing dynamic declaration
   - Issue: Uses both `headers()` and `request.headers`
   - Action: Add dynamic, standardize to `headers()` only

### Authentication Routes
These handle user sessions and must be dynamic:

1. **`/src/app/api/auth/set-token/route.ts`**
   - Status: ❌ Missing dynamic declaration
   - Issue: Sets cookies, must be dynamic
   - Action: Add `export const dynamic = 'force-dynamic'`

2. **`/src/app/api/assinante/register/route.ts`**
   - Status: ✅ Has `export const dynamic = 'force-dynamic'`
   - Issue: Has @ts-nocheck
   - Action: Remove @ts-nocheck

### Admin Routes
All admin routes need dynamic (based on auth headers):

1. All routes in `/src/app/api/admin/**/*.ts` need review
2. Most use authentication headers
3. Should all have `export const dynamic = 'force-dynamic'`

---

## Best Practices for API Routes

### Template for Next.js 16 Compliant Route

```typescript
// ✅ CORRECT PATTERN FOR NEXT.JS 16

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// 1. Always declare dynamic for routes using headers/cookies/auth
export const dynamic = 'force-dynamic'

// 2. Optionally declare runtime
export const runtime = 'nodejs'

/**
 * GET /api/example
 * Description of what this endpoint does
 */
export async function GET(request: NextRequest) {
  try {
    // 3. Access headers using headers() function
    const headersList = await headers()
    const authorization = headersList.get('authorization')
    
    // 4. Validate auth
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 5. Business logic here
    
    // 6. Return proper response
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[API_ERROR]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/example
 */
export async function POST(request: NextRequest) {
  // Same pattern as GET
}

/**
 * OPTIONS for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BASE_URL || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
```

---

## Testing Recommendations

### Unit Tests
```typescript
// Test dynamic behavior
describe('API Route - Dynamic Rendering', () => {
  it('should have export const dynamic = "force-dynamic"', () => {
    // Import the route module
    // Verify dynamic export exists
  })
})
```

### E2E Tests
```typescript
// Test header access
test('should read Authorization header', async () => {
  const response = await fetch('/api/example', {
    headers: {
      'Authorization': 'Bearer test-token'
    }
  })
  expect(response.status).toBe(200)
})
```

### Integration Tests
```typescript
// Test caching behavior
test('should not cache auth-dependent responses', async () => {
  const request1 = fetch('/api/example', { headers: { ... } })
  const request2 = fetch('/api/example', { headers: { ... } })
  // Verify responses are fresh, not cached
})
```

---

## Risk Assessment

### High Risk Areas (if not fixed before N16 upgrade)
- **Stripe/Asaas Webhooks**: May cache webhook responses incorrectly
- **Authentication Routes**: May serve cached auth tokens to wrong users
- **Admin Routes**: Security bypass via caching
- **Subscriber Routes**: Customer data isolation issues

### Medium Risk Areas
- **Debug Routes**: Information leakage via caching
- **Monitoring Routes**: Stale health check data

### Low Risk Areas
- **Public Routes**: Least likely to have data isolation issues

---

## Compliance Checklist for Next.js 16 Migration

- [ ] All `@ts-nocheck` directives removed (99 files)
- [ ] All TypeScript type errors fixed
- [ ] `export const dynamic = 'force-dynamic'` added to 82 files
- [ ] Header access pattern standardized to `headers()` (29 files)
- [ ] Async/await for `headers()` calls verified
- [ ] All tests passing (`npm run test`)
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] Build successful (`npm run build`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] ESLint clean (`npm run lint`)
- [ ] Production deployment tested
- [ ] Caching behavior verified in production
- [ ] No security regressions
- [ ] Performance benchmarks collected

---

## Implementation Timeline

| Phase | Duration | Tasks | Priority |
|-------|----------|-------|----------|
| Type Safety | 1-2 weeks | Remove @ts-nocheck, fix types | CRITICAL |
| Dynamic Exports | 1 week | Add export const dynamic to 82 files | HIGH |
| Header Patterns | 1 week | Update 29 files to use headers() | MEDIUM |
| Testing | 1-2 weeks | Full test suite, E2E, load testing | HIGH |
| **Total** | **4-6 weeks** | | |

---

## Next Steps

1. **Immediate** (This week):
   - Review this report with the team
   - Prioritize payment/auth routes
   - Start removing @ts-nocheck from 5-10 files
   
2. **Short Term** (Next 2 weeks):
   - Complete Phase 1 & 2 (type safety & dynamic exports)
   - Create PR with all fixes
   - Run full test suite

3. **Medium Term** (Next 4 weeks):
   - Complete Phase 3 (header patterns)
   - Comprehensive testing
   - Prepare for N16 upgrade

4. **Long Term**:
   - Monitor production after upgrade
   - Collect performance metrics
   - Document lessons learned

---

## References

- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/getting-started/upgrading)
- [API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Dynamic Rendering in Next.js](https://nextjs.org/docs/app/building-your-application/rendering/dynamic-rendering)
- [Headers Function](https://nextjs.org/docs/app/api-reference/functions/headers)
- [Caching in Next.js](https://nextjs.org/docs/app/building-your-application/caching)

---

## Report Generated
- **Date**: 2025-11-03
- **Total Files Analyzed**: 104 route files
- **Issues Found**: 3 critical categories
- **Compliance Rate**: 21% (22/104 files)
- **Estimated Fix Time**: 4-6 weeks
