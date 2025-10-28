# Testing Strategy - Multi-Framework Approach

## Overview

This project uses a **multi-framework testing strategy** optimized for different types of tests:

- **Jest** - General unit and component tests
- **Vitest** - Resilience and integration tests
- **Playwright** - End-to-end browser tests

## ✅ Why Multiple Frameworks?

This is **intentional** and follows best practices:

1. **Jest**: Best for Next.js component testing with built-in Next.js integration
2. **Vitest**: Faster execution for resilience tests, modern API, better performance for specific test types
3. **Playwright**: Industry standard for E2E browser automation

## Test Organization

### Jest Tests (`npm test`)
**Location**: `src/**/__tests__/*.test.{ts,tsx}`
**Configuration**: `jest.config.js`
**Environment**: `jsdom` (browser simulation)

**Purpose:**
- React component tests
- General utility function tests
- Next.js-specific functionality
- API route handlers (simulated)

**Example:**
```typescript
// src/lib/__tests__/calculator.test.ts
describe('Calculator Functions', () => {
  it('should calculate economy correctly', () => {
    const result = calculateEconomy({ lensType: 'daily', usagePattern: 'regular' })
    expect(result.monthlySavings).toBe(72)
  })
})
```

### Vitest Tests (`npm run test:resilience`, `npm run test:integration`)
**Location**: `src/__tests__/**/*.test.{ts,tsx}`
**Configuration**: `vitest.config.ts`
**Environment**: `jsdom` with extended timeouts

**Purpose:**
- Resilience system tests (offline functionality, backup systems)
- Integration tests (API + database)
- Performance-critical tests requiring longer timeouts
- Tests with complex async operations

**Example:**
```typescript
// src/__tests__/lib/resilient-data-fetcher.test.ts
import { describe, it, expect, vi } from 'vitest'

describe('ResilientDataFetcher', () => {
  it('should retry failed requests with exponential backoff', async () => {
    // Vitest tests for resilience features
  })
})
```

### Playwright Tests (`npm run test:e2e`)
**Location**: `e2e/**/*.spec.ts`
**Configuration**: `playwright.config.ts`, `playwright.config.resilience.ts`
**Environment**: Real browser (Chromium, Firefox, WebKit)

**Purpose:**
- End-to-end user flows
- Cross-browser compatibility
- Visual regression testing
- Accessibility testing (WCAG 2.1 AA)
- Real network condition simulation

**Example:**
```typescript
// e2e/subscriber-dashboard-phase4.spec.ts
test('should upload prescription successfully', async ({ page }) => {
  await page.goto('/area-assinante/dashboard')
  await page.click('[data-testid="upload-prescription"]')
  // ... E2E test flow
})
```

## Running Tests

### Quick Commands
```bash
# Jest - General unit tests
npm test                    # Run all Jest tests
npm run test:watch          # Jest watch mode
npm run test:coverage       # Jest with coverage

# Vitest - Resilience & Integration
npm run test:resilience     # Resilience tests
npm run test:integration    # Integration tests

# Playwright - E2E tests
npm run test:e2e            # All E2E tests
npm run test:e2e:resilience # Resilience E2E tests
npm run test:e2e:ui         # Playwright UI mode
npm run test:e2e:debug      # Debug mode

# All Tests
npm run test:all            # Resilience + E2E resilience tests
```

### Full Test Suite
```bash
# Run everything sequentially
npm test && npm run test:resilience && npm run test:integration && npm run test:e2e
```

## Test Coverage

### Coverage Thresholds

**Jest (General):**
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

**Vitest (Resilience Code):**
Higher thresholds for critical resilience features:
- `resilient-data-fetcher.ts`: 90%
- `offline-storage.ts`: 90%
- `backup-auth.ts`: 90%
- `useResilientSubscription.ts`: 85%

### Check Coverage
```bash
# Jest coverage
npm run test:coverage

# Vitest coverage
npx vitest run --coverage

# Open HTML reports
open coverage/index.html
```

## Test File Structure

### Naming Conventions
- **Unit Tests**: `*.test.ts` or `*.spec.ts`
- **Component Tests**: `*.test.tsx` or `*.spec.tsx`
- **E2E Tests**: `*.spec.ts` (in `e2e/` directory)

### Directory Structure
```
src/
├── __tests__/                    # Vitest tests (resilience/integration)
│   ├── lib/
│   │   ├── resilient-data-fetcher.test.ts
│   │   ├── offline-storage.test.ts
│   │   └── backup-auth.test.ts
│   ├── hooks/
│   │   └── useResilientSubscription.test.ts
│   └── integration/
│       └── api-integration.test.ts
│
├── lib/__tests__/                # Jest tests (general utilities)
│   ├── calculator.test.ts
│   ├── validations.test.ts
│   └── validators.test.ts
│
├── components/__tests__/         # Jest tests (React components)
│   ├── HeroSection.test.tsx
│   └── DashboardMetrics.test.tsx
│
└── app/api/__tests__/            # Jest tests (API routes)
    └── health-check.test.ts

e2e/                              # Playwright tests (E2E)
├── subscriber-dashboard-phase4.spec.ts
├── subscription-flow.spec.ts
└── fixtures/
    └── test-data.ts
```

## Best Practices

### When to Use Each Framework

**Use Jest when:**
- Testing React components
- Testing Next.js-specific features (App Router, API routes)
- Writing general utility unit tests
- Need Next.js automatic mocking and setup

**Use Vitest when:**
- Testing resilience features (retry logic, offline support)
- Testing integration scenarios (API + database)
- Need faster test execution for specific test suites
- Require extended timeouts for async operations
- Testing performance-critical code

**Use Playwright when:**
- Testing complete user workflows
- Need real browser environment
- Testing cross-browser compatibility
- Checking accessibility compliance
- Visual regression testing
- Testing network conditions and failures

### Test Isolation

- **Jest and Vitest**: Run in separate processes, share no state
- **Configuration**: Separate config files prevent conflicts
- **Mocking**: Use framework-specific mocking (`jest.mock` vs `vi.mock`)
- **Path Aliases**: Both frameworks support `@/` aliases via configuration

## Common Patterns

### Mocking in Jest
```typescript
jest.mock('@/lib/analytics', () => ({
  trackEvent: jest.fn()
}))
```

### Mocking in Vitest
```typescript
import { vi } from 'vitest'

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn()
}))
```

### Shared Test Utilities
Location: `e2e/fixtures/` and `src/__tests__/setup.ts`

```typescript
// Shared mock data
export const mockSubscriptionData = {
  id: 'sub-123',
  status: 'active',
  plan: 'monthly'
}

// Shared test helpers
export function createMockUser() {
  return { id: '1', name: 'Test User' }
}
```

## Troubleshooting

### "Cannot find module" errors
- Check path aliases in `jest.config.js` and `vitest.config.ts`
- Verify `tsconfig.json` paths match test configurations

### Tests passing locally but failing in CI
- Check environment variables in `.env.test`
- Verify Node.js version matches CI environment
- Review timeout configurations

### Flaky E2E tests
- Use `page.waitForSelector()` instead of `page.waitForTimeout()`
- Enable `retries: 2` in Playwright config
- Check for race conditions in async operations

## CI/CD Integration

### GitHub Actions (Recommended)
```yaml
- name: Run Jest Tests
  run: npm test

- name: Run Vitest Tests
  run: npm run test:resilience && npm run test:integration

- name: Run Playwright Tests
  run: npm run test:e2e
```

### Pre-commit Hooks
```bash
# .husky/pre-commit
npm test                    # Jest unit tests
npm run test:resilience     # Critical resilience tests
```

## Maintenance

### Updating Test Dependencies
```bash
# Jest
npm update jest @testing-library/react @testing-library/jest-dom

# Vitest
npm update vitest @vitest/ui

# Playwright
npm update @playwright/test
npx playwright install      # Update browsers
```

### Review Test Health
```bash
# Run all tests with verbose output
npm test -- --verbose
npm run test:resilience -- --reporter=verbose
npm run test:e2e -- --reporter=list
```

## Summary

This multi-framework approach provides:

✅ **Framework Specialization**: Each tool used for its strengths
✅ **No Conflicts**: Separate configuration and execution
✅ **Complete Coverage**: Unit → Integration → E2E testing
✅ **Developer Experience**: Fast feedback loops with appropriate tools
✅ **Production Quality**: Resilience and accessibility testing included

---

**Last Updated:** 2025-10-28
**Maintained By:** SVLentes Development Team
