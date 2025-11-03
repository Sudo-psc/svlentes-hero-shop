# Next.js 16 API Route Migration - Quick Reference Guide

**Last Updated**: 2025-11-03  
**Audit Status**: Complete (104 route files analyzed)

---

## Issues at a Glance

| Issue | Files | Severity | Fix Time |
|-------|-------|----------|----------|
| `@ts-nocheck` directives | 99 | 🔴 HIGH | 1-2 weeks |
| Missing `export const dynamic` | 82 | 🟡 MEDIUM | 1 week |
| Deprecated header access patterns | 29 | 🟡 MEDIUM | 1 week |
| **Total Non-Compliant** | **82** | - | **4-6 weeks** |

---

## Issue 1: Remove @ts-nocheck (99 files)

### The Problem
```typescript
// ❌ BAD - Suppresses ALL type checking
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
// Real errors are hidden!
```

### The Solution
```typescript
// ✅ GOOD - Proper types, no suppression
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Errors are visible and fixable
```

### Action Items
1. Remove `// @ts-nocheck` comments
2. Run `npx prisma generate` 
3. Fix actual TypeScript errors
4. Run `npx tsc --noEmit` to verify

---

## Issue 2: Add Dynamic Declaration (82 files)

### The Problem
```typescript
// ❌ BAD - Route may be incorrectly cached
export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization')
  // This route is dynamic but Next.js might cache it!
}
```

### The Solution
```typescript
// ✅ GOOD - Route is explicitly dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization')
  // Never cached - always fresh
}
```

### Where to Add
- At the very top of the route file
- Before function declarations
- After imports (optional)

### Pattern Template
```typescript
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // ADD THIS LINE
export const runtime = 'nodejs' // Optional

export async function GET(request: NextRequest) {
  // Handler code
}
```

---

## Issue 3: Standardize Header Access (29 files)

### The Problem
```typescript
// ❌ OLD PATTERN - Less idiomatic
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  // Works but not best practice
}
```

### The Solution
```typescript
// ✅ NEW PATTERN - Official Next.js way
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const headersList = await headers()
  const authHeader = headersList.get('Authorization')
  // Better compatibility and flexibility
}
```

### Why This Matters
- `headers()` works with Edge Runtime
- More compatible with Next.js internals
- Better for middleware composition
- Official recommended pattern

---

## Critical Routes to Fix FIRST

### 1. Stripe Webhook (PAYMENT PROCESSING!)
**File**: `/api/webhooks/stripe/route.ts`  
**Issue**: Missing `export const dynamic`  
**Impact**: CRITICAL - payment webhooks could be cached  
**Fix Time**: 5 minutes

```typescript
// Add this at the top
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Then keep existing code
```

### 2. Asaas Webhook (PAYMENT PROCESSING!)
**File**: `/api/webhooks/asaas/route.ts`  
**Issue**: Has `@ts-nocheck`  
**Impact**: CRITICAL - payment webhooks  
**Fix Time**: 30 minutes (fix types)

### 3. Customer Portal
**File**: `/api/stripe/customer-portal/route.ts`  
**Issue**: Missing `export const dynamic`  
**Impact**: HIGH - customer data access  
**Fix Time**: 10 minutes

### 4. Auth Token Setter
**File**: `/api/auth/set-token/route.ts`  
**Issue**: Missing `export const dynamic`  
**Impact**: HIGH - authentication/cookies  
**Fix Time**: 10 minutes

### 5. All Admin Routes (27 files)
**Issue**: Missing `export const dynamic`  
**Impact**: MEDIUM - access control  
**Fix Time**: 30 minutes (batch add)

---

## Daily Task Breakdown

### Day 1-2: Critical Routes
- [ ] Add `export const dynamic = 'force-dynamic'` to 5 critical routes
- [ ] Test each route after change
- [ ] Deploy to staging

### Day 3-5: High Priority Routes
- [ ] Add dynamic to 20+ remaining payment/auth routes
- [ ] Remove @ts-nocheck from payment routes
- [ ] Fix any type errors found
- [ ] Run full test suite

### Week 2: Admin Routes
- [ ] Add dynamic to all 27 admin routes
- [ ] Remove @ts-nocheck from admin routes
- [ ] Fix types
- [ ] Deploy to staging

### Week 3: Everything Else
- [ ] Handle all remaining 82 routes
- [ ] Standardize header access patterns
- [ ] Run comprehensive tests

---

## Testing Checklist

After each fix:

```bash
# 1. TypeScript check
npx tsc --noEmit

# 2. ESLint
npm run lint

# 3. Build
npm run build

# 4. Unit tests
npm run test

# 5. E2E tests (for critical routes)
npm run test:e2e
```

---

## Verification Commands

### Check How Many Files Still Need Fixes
```bash
# Files missing dynamic declaration
grep -L "export const dynamic" src/app/api/**/*.ts | wc -l

# Files with @ts-nocheck
grep -l "@ts-nocheck" src/app/api/**/*.ts | wc -l

# Files using request.headers.get
grep -l "request\.headers\.get" src/app/api/**/*.ts | wc -l
```

### Quick Progress Check
```bash
# Should increase as you fix files
grep -l "export const dynamic" src/app/api/**/*.ts | wc -l
# Current: 22 files
# Target: 104 files
```

---

## Common Mistakes to Avoid

### ❌ Wrong: Multiple dynamic declarations
```typescript
export const dynamic = 'force-dynamic'
export const dynamic = 'auto'  // WRONG! Duplicate
```

### ❌ Wrong: Dynamic in wrong place
```typescript
import { NextRequest } from 'next/server'
export async function GET(request: NextRequest) {
  export const dynamic = 'force-dynamic' // Wrong location!
}
```

### ❌ Wrong: Partial header migration
```typescript
import { headers } from 'next/headers'

const headersList = await headers()
const auth1 = headersList.get('auth') // ✅ Correct
const auth2 = request.headers.get('auth') // ❌ Mixed pattern
```

### ✅ Correct: All patterns consistent
```typescript
export const dynamic = 'force-dynamic'

import { headers } from 'next/headers'

const headersList = await headers()
const auth = headersList.get('Authorization') // ✅ All consistent
```

---

## Rollback Plan

If something breaks:

```bash
# 1. Identify broken files
npm run test  # See which tests fail

# 2. Revert recent changes
git diff src/app/api/  # Review what changed

# 3. Revert to previous state
git checkout -- src/app/api/problematic-file/route.ts

# 4. Make incremental change
# Fix one thing at a time, test after each change

# 5. Re-deploy to staging
npm run build && npm run test
```

---

## Migration Timeline

```
Week 1: Critical + High Priority Routes
├─ Days 1-2: Payment/Auth routes
├─ Days 3-5: Admin routes
└─ Testing

Week 2: Type Safety
├─ Remove @ts-nocheck
├─ Fix TypeScript errors
└─ Run full test suite

Week 3: Header Standardization
├─ Migrate request.headers → headers()
├─ Ensure async/await pattern
└─ Test all auth routes

Week 4: Final Testing
├─ E2E testing
├─ Load testing
├─ Production staging
└─ Deploy

TOTAL: 4 weeks
```

---

## Support & Questions

### Where to Find More Info
- **Full Report**: `/claudedocs/NEXT_JS_16_API_AUDIT_REPORT.md`
- **File List**: `/claudedocs/NEXT_JS_16_FILES_MISSING_DYNAMIC.md`
- **Next.js Docs**: https://nextjs.org/docs/getting-started/upgrading

### Key People
- Dr. Philipe Saraiva Cruz (Project Owner)
- DevOps Team (Deployment & Testing)
- Frontend Team (Integration Testing)

---

## Success Criteria

Before Next.js 16 upgrade:

- [ ] All `@ts-nocheck` removed (99 files)
- [ ] All `export const dynamic` declarations added (82 files)
- [ ] Header access standardized to `headers()` (29 files)
- [ ] Zero TypeScript errors (`npx tsc --noEmit`)
- [ ] All tests passing (`npm run test && npm run test:e2e`)
- [ ] Build successful (`npm run build`)
- [ ] No security regressions in production
- [ ] Performance metrics collected

---

**Report Generated**: 2025-11-03  
**Audit Completed By**: Claude Code  
**Status**: Ready for Implementation  
**Estimated Completion**: 4-6 weeks  
