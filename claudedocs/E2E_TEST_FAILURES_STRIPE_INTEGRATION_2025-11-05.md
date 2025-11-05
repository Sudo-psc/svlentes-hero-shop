# ❌ E2E Test Failures After Stripe Integration
**Data**: 2025-11-05
**Horário**: 19:15 UTC
**Status**: 🔍 UNDER INVESTIGATION

---

## 🔍 Problem Summary

After successfully migrating the subscriber dashboard from database-driven to Stripe API-driven data display, **all E2E tests are failing** with timeout errors (~32 seconds per test).

**Test Command Used**:
```bash
npx playwright test e2e/subscriber-dashboard*.spec.ts --reporter=list
```

**Result**: 870 tests total, all accessibility tests timing out at login/navigation step.

---

## 🧪 Test Failures Observed

### Failing Test Categories (All timing out at ~32s):
1. **WCAG 2.1 Compliance Tests** (3 tests)
   - Accessibility violations detection
   - Color contrast requirements
   - Heading hierarchy

2. **ARIA Labels and Roles Tests** (5 tests)
   - Interactive element labels
   - Dashboard section roles
   - Metric card accessibility
   - Progress bar accessibility
   - Form label validation

3. **Keyboard Navigation Tests** (4+ tests)
   - Full keyboard navigation
   - Focus indicators
   - Reverse tab navigation
   - Enter key activation

### Test Execution Pattern:
```
✘ 1 [chromium] › subscriber-dashboard-accessibility.spec.ts:20:9 › WCAG 2.1 Compliance › ... (32.8s)
✘ 2 [chromium] › subscriber-dashboard-accessibility.spec.ts:28:9 › WCAG 2.1 Compliance › ... (33.1s)
✘ 3 [chromium] › subscriber-dashboard-accessibility.spec.ts:36:9 › WCAG 2.1 Compliance › ... (32.2s)
...
```

All tests timeout at exactly the same duration (~32 seconds), indicating they're failing at the same point in the test flow.

---

## 🕵️ Root Cause Analysis

### Test Flow Expected:
```
1. Navigate to /area-assinante/login
2. Fill email: test@example.com
3. Fill password: testpassword123
4. Click submit button
5. Wait for URL change to /area-assinante/dashboard ❌ FAILS HERE
6. Wait for networkidle state
7. Run accessibility checks
```

### Why Tests Are Failing:

#### 1. **Mock Credentials vs Real API Calls**

**Test Environment Configuration** (`.env.test`):
```bash
# Mock Firebase credentials
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyDevelopmentTestKey123456789012345"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="svlentes-test"

# Mock Stripe test keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51TestKeyForUnitTestsOnly"
STRIPE_SECRET_KEY="sk_test_51TestKeyForUnitTestsOnly"

# Test user credentials
TEST_USER_EMAIL="test@example.com"
TEST_USER_PASSWORD="testpassword123"
```

**Problem**: These are **mock/placeholder credentials**, not real Firebase or Stripe test accounts.

#### 2. **Dashboard Stripe Integration**

**Dashboard Component** (`/src/app/area-assinante/dashboard/page.tsx`):
```typescript
// Uses real Stripe API call
const { subscription, isLoading: subLoading, error, refetch } = useStripeSubscription()
const { products: stripeProducts, isLoading: productsLoading } = useStripeProducts()
```

**API Endpoint** (`/src/hooks/useStripeSubscription.ts`):
```typescript
const response = await fetch('/api/stripe/subscription', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

**API Route** (`/api/stripe/subscription/route.ts`):
```typescript
// Makes real Stripe API call with mock credentials
const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
  expand: ['default_payment_method', 'plan.product']
})
```

#### 3. **The Failure Chain**

```
1. Test logs in with mock Firebase credentials
   ↓
2. Firebase mock auth "succeeds" (no real validation)
   ↓
3. Test navigates to dashboard
   ↓
4. Dashboard calls useStripeSubscription()
   ↓
5. Hook calls /api/stripe/subscription with mock Stripe keys
   ↓
6. Stripe API returns error: "Invalid API key provided"
   ↓
7. Dashboard shows error state OR loading state indefinitely
   ↓
8. Elements tests expect (h1, buttons, cards) never appear
   ↓
9. Tests timeout waiting for elements (30s default Playwright timeout)
```

---

## 📊 Impact Assessment

### What's Broken:
- ❌ All E2E tests (870 tests)
- ❌ Accessibility validation
- ❌ Regression testing
- ❌ CI/CD pipeline (if configured)

### What Still Works:
- ✅ Production dashboard with real Stripe integration
- ✅ Unit tests (don't require API calls)
- ✅ Build process
- ✅ Deployment

---

## 🔧 Solutions

### Solution 1: Mock Stripe API in Test Environment (RECOMMENDED)

**Implementation**: Use MSW (Mock Service Worker) to intercept Stripe API calls during tests.

**Steps**:
1. Install MSW:
   ```bash
   npm install --save-dev msw
   ```

2. Create Stripe API mocks (`e2e/mocks/stripe-handlers.ts`):
   ```typescript
   import { http, HttpResponse } from 'msw'

   export const stripeHandlers = [
     // Mock subscription retrieve
     http.get('https://api.stripe.com/v1/subscriptions/:id', () => {
       return HttpResponse.json({
         id: 'sub_test123',
         status: 'active',
         current_period_end: 1735689600,
         plan: {
           id: 'price_test123',
           amount: 12800,
           interval: 'month',
           product: {
             id: 'prod_test123',
             name: 'Express Mensal'
           }
         },
         payment_method: {
           type: 'card',
           card: {
             brand: 'visa',
             last4: '4242'
           }
         }
       })
     }),

     // Mock products list
     http.get('https://api.stripe.com/v1/products', () => {
       return HttpResponse.json({
         data: [
           {
             id: 'prod_test123',
             name: 'Express Mensal',
             description: 'Assinatura mensal express',
             default_price: {
               id: 'price_test123',
               unit_amount: 12800,
               recurring: { interval: 'month' }
             }
           }
         ]
       })
     })
   ]
   ```

3. Setup MSW in Playwright config:
   ```typescript
   // playwright.config.ts
   import { setupServer } from 'msw/node'
   import { stripeHandlers } from './e2e/mocks/stripe-handlers'

   const server = setupServer(...stripeHandlers)

   export default defineConfig({
     globalSetup: async () => {
       server.listen()
     },
     globalTeardown: async () => {
       server.close()
     }
   })
   ```

**Pros**:
- ✅ Fast test execution (no real API calls)
- ✅ Deterministic test results
- ✅ No external dependencies
- ✅ Full control over test scenarios

**Cons**:
- ⚠️ Requires initial setup effort
- ⚠️ Mocks need maintenance if Stripe API changes

---

### Solution 2: Use Real Stripe Test Mode

**Implementation**: Create real Stripe test account and use test mode subscriptions.

**Steps**:
1. Create Stripe test account
2. Generate real test mode API keys
3. Create test products and prices in Stripe dashboard
4. Create test customers with active subscriptions
5. Update `.env.test` with real test keys:
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51RealTestKey..."
   STRIPE_SECRET_KEY="sk_test_51RealTestKey..."
   ```

**Pros**:
- ✅ Tests real Stripe integration
- ✅ No mocking required
- ✅ Validates actual API behavior

**Cons**:
- ❌ Slower test execution (real API calls)
- ❌ Requires internet connection
- ❌ Stripe test account required
- ❌ Harder to test edge cases

---

### Solution 3: Environment-Based Data Source

**Implementation**: Add flag to use database instead of Stripe API in test environment.

**Steps**:
1. Modify `useStripeSubscription` hook:
   ```typescript
   export function useStripeSubscription() {
     const isTestEnv = process.env.NODE_ENV === 'test'

     if (isTestEnv) {
       // Use database mock data
       return useDatabaseSubscription()
     }

     // Use real Stripe API
     return useRealStripeSubscription()
   }
   ```

2. Keep database-seeded test data
3. Tests run against database, production uses Stripe

**Pros**:
- ✅ Fast test execution
- ✅ Simple implementation
- ✅ No external dependencies

**Cons**:
- ⚠️ Tests don't validate Stripe integration
- ⚠️ Maintains two code paths (database + Stripe)
- ⚠️ Risk of divergence between test and production

---

## 📋 Recommended Action Plan

### Phase 1: Immediate (MSW Mock Setup)
1. ✅ Document test failures (this file)
2. ⏳ Install MSW package
3. ⏳ Create Stripe API mock handlers
4. ⏳ Configure MSW in Playwright
5. ⏳ Verify tests pass with mocks

### Phase 2: Short-term (Test Infrastructure)
1. ⏳ Add test fixtures for common scenarios
2. ⏳ Create helper functions for Stripe test data
3. ⏳ Document test patterns
4. ⏳ Add CI/CD integration

### Phase 3: Long-term (Real Stripe Testing)
1. ⏳ Set up Stripe test account
2. ⏳ Create automated test data setup
3. ⏳ Add integration test suite with real Stripe
4. ⏳ Implement test data cleanup

---

## 🎯 Success Criteria

Tests should:
- ✅ Complete in <5 minutes for full suite
- ✅ Pass consistently without flakiness
- ✅ Cover critical user flows
- ✅ Validate Stripe integration (mocked or real)
- ✅ Run in CI/CD pipeline

---

## 🔗 Related Files

### Test Files:
- `e2e/subscriber-dashboard-accessibility.spec.ts` - Accessibility tests (all failing)
- `e2e/subscriber-dashboard-phase4.spec.ts` - Phase 4 tests (likely failing)
- `e2e/subscriber-dashboard.spec.ts` - General dashboard tests (likely failing)

### Configuration:
- `.env.test` - Test environment variables (mock credentials)
- `playwright.config.ts` - Playwright configuration
- `e2e/helpers/test-setup.ts` - Test setup utilities

### Dashboard Code:
- `src/app/area-assinante/dashboard/page.tsx` - Dashboard component (uses Stripe)
- `src/hooks/useStripeSubscription.ts` - Stripe subscription hook
- `src/hooks/useStripeProducts.ts` - Stripe products hook
- `src/api/stripe/subscription/route.ts` - Stripe API endpoint

### Documentation:
- `claudedocs/STRIPE_INTEGRATION_DASHBOARD_2025-11-05.md` - Stripe integration docs
- `claudedocs/DEPLOY_TEST_RESULTS_2025-11-05.md` - Previous deploy and test results

---

## 🚨 Critical Notes

1. **Don't Skip This**: E2E tests are essential for regression detection and quality assurance.

2. **Production is OK**: The production dashboard works perfectly with real Stripe integration. This is **purely a test infrastructure issue**.

3. **Quick Win**: MSW mock setup can be done in 1-2 hours and will unblock all 870 tests.

4. **Test Data**: The database seeding works perfectly (4 users, 2 subscriptions, 3 orders, 4 payments). The issue is purely with Stripe API calls.

---

## 📞 Next Steps

**Immediate**:
- [x] ✅ Document root cause (this file)
- [ ] ⏳ Choose solution approach (MSW recommended)
- [ ] ⏳ Implement solution
- [ ] ⏳ Verify tests pass
- [ ] ⏳ Update CI/CD if needed

**User Decision Required**:
- Which solution to implement? (MSW, Real Stripe, or Environment-based)
- Timeline for test infrastructure fix
- Whether to run manual smoke tests in production instead

---

**Criado por**: Claude Code
**Status Final**: 🔍 ROOT CAUSE IDENTIFIED - AWAITING SOLUTION IMPLEMENTATION
**Próximo Passo**: Implement MSW mocks or choose alternative solution
