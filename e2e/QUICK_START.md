# E2E Test Suite - Quick Start Guide

## 🚀 Running the Tests

### Prerequisites
```bash
# Ensure dependencies are installed
npm install

# Ensure application is built
npm run build

# Start the application (in another terminal)
npm run start
```

### Run All New Security Tests
```bash
# Run all subscriber security tests
npm run test:e2e -- subscriber-authorization.spec.ts subscriber-validation.spec.ts subscriber-audit.spec.ts subscriber-integration.spec.ts

# Or use pattern matching
npm run test:e2e -- subscriber-*.spec.ts
```

### Run Individual Test Suites

#### Authorization Tests (21 tests)
```bash
npm run test:e2e -- subscriber-authorization.spec.ts
```
**What it tests**: Cross-user access prevention, ownership validation

#### Validation Tests (25 tests)
```bash
npm run test:e2e -- subscriber-validation.spec.ts
```
**What it tests**: Zod schema enforcement, input sanitization

#### Audit Tests (9 tests)
```bash
npm run test:e2e -- subscriber-audit.spec.ts
```
**What it tests**: LGPD compliance, audit logging, sensitive data sanitization

#### Integration Tests (6 tests)
```bash
npm run test:e2e -- subscriber-integration.spec.ts
```
**What it tests**: Complete user journeys, UI + API integration

### Debug Mode
```bash
# Run with Playwright Inspector
npm run test:e2e:debug -- subscriber-authorization.spec.ts

# Run with UI mode
npm run test:e2e:ui -- subscriber-validation.spec.ts

# Run in headed mode (see browser)
npm run test:e2e:headed -- subscriber-integration.spec.ts
```

---

## 📊 Expected Results

### Test Summary
- **Total Tests**: 61
- **Test Files**: 4
- **Helper Utilities**: 1
- **Test Fixtures**: 3

### Pass Criteria
✅ All authorization tests should pass (user isolation enforced)
✅ All validation tests should pass (invalid inputs rejected)
✅ Most audit tests should pass (some may skip if audit system incomplete)
✅ Integration tests may have partial passes (depends on UI implementation)

### Known Test Behaviors

#### Tests That May Skip
Some tests will skip if prerequisites aren't met:
- `test.skip(!subscriptionId, 'Subscription not created')` - Skips if subscription creation fails
- `test.skip(!userBSubscriptionId, 'Subscription not created')` - Skips if second user setup fails

This is expected behavior and doesn't indicate test failure.

#### Tests That May Fail (Expected)
If certain features aren't fully implemented:
- Audit logging tests - May fail if audit system not complete
- Some integration tests - May fail if UI elements have different selectors

---

## 🔧 Configuration

### Environment Variables Required
Create `.env.test` or set in your environment:

```bash
# Test User (optional - created dynamically)
TEST_USER_EMAIL=test@svlentes.shop
TEST_USER_PASSWORD=Test123!@#

# Firebase Admin (required for auth)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Database (required for data operations)
DATABASE_URL=postgresql://user:password@localhost:5432/svlentes_test

# Application URL (default: http://localhost:5000)
BASE_URL=http://localhost:5000
```

### Playwright Configuration
The tests use the existing `playwright.config.ts`:
- **Base URL**: http://localhost:5000
- **Timeout**: 30 seconds per test
- **Retries**: 2 (in CI), 0 (local)
- **Workers**: 1 (sequential execution)

---

## 📝 Test Structure

### Helper Functions (`e2e/helpers/test-utils.ts`)
```typescript
// Create test users
const user = await createTestUser('email@test.com')

// Create subscriptions
const subId = await createSubscription(request, authToken)

// Get auth tokens
const token = await getAuthToken()

// Get audit logs
const logs = await getAuditLogs(request, userId)

// Generate test files
const pdf = generateBase64PDF(1024 * 1024) // 1MB PDF
const img = generateBase64Image(500 * 1024) // 500KB image

// Login in browser
await login(page, 'email@test.com', 'password')

// Cleanup
await cleanupTestUser(request, userId, adminToken)
```

### Test Fixtures (`e2e/fixtures/`)
- `sample-prescription.pdf` - Valid PDF for upload tests
- `test-data.json` - Sample addresses, phones, etc.
- `README.md` - Fixture documentation

---

## 🐛 Troubleshooting

### Issue: "Error: Target page, context or browser has been closed"
**Solution**: Ensure application is running on http://localhost:5000

### Issue: All tests skip
**Solution**: Check database connection and Firebase configuration

### Issue: "Cannot find module 'e2e/helpers/test-utils'"
**Solution**: Run `npx tsc` to compile TypeScript files

### Issue: Tests timeout
**Solution**: Increase timeout in test file or check application responsiveness

### Issue: "Firebase Admin not configured"
**Solution**: Set FIREBASE_PROJECT_ID and related environment variables

---

## 📖 Reading Test Results

### Success Output
```
✓ User A cannot access User B subscription (503ms)
✓ User A CAN access their own subscription (412ms)
```

### Failure Output
```
✗ User A cannot access User B subscription (1205ms)

  Error: expect(received).toBe(expected)
  Expected: 403
  Received: 200
```

### Skip Output
```
⊘ User A cannot access User B subscription
  → Subscription not created
```

---

## 🔍 Understanding Test Coverage

### Authorization Tests Cover:
- ✅ Cross-user subscription access
- ✅ Cross-user payment history access
- ✅ Cross-user order access
- ✅ Cross-user invoice access
- ✅ Cross-user delivery preferences
- ✅ Cross-user prescription uploads
- ✅ Dashboard metrics isolation
- ✅ Delivery timeline isolation

### Validation Tests Cover:
- ✅ Brazilian address validation (CEP, UF)
- ✅ File upload validation (size, type)
- ✅ Phone number validation
- ✅ Email format validation
- ✅ Password strength validation
- ✅ Date format validation

### Audit Tests Cover:
- ✅ Address update logging
- ✅ Prescription upload logging
- ✅ Payment history access logging
- ✅ Delivery preferences logging
- ✅ Sensitive data sanitization
- ✅ Metadata completeness

### Integration Tests Cover:
- ✅ Complete login → action → verification flows
- ✅ Multi-action workflows
- ✅ UI + API interaction
- ✅ Error recovery
- ✅ URL manipulation prevention

---

## 📚 Next Steps

### After Running Tests

1. **Review Results**: Check which tests passed/failed
2. **Fix Failures**: Address any real security issues found
3. **Update Tests**: Adjust selectors if UI changed
4. **Add Tests**: Cover new features as they're added

### Recommended Follow-ups

1. **Performance Testing**: Add load tests for concurrent access
2. **Rate Limiting**: Add tests for API rate limits
3. **Session Management**: Test session expiration
4. **CSRF Protection**: Verify CSRF tokens
5. **SQL Injection**: Test for SQL injection vulnerabilities

---

## 📞 Support

### Questions?
- Review `TEST_SUITE_SUMMARY.md` for detailed documentation
- Check `e2e/helpers/test-utils.ts` for helper functions
- Look at existing tests for patterns

### Contributing
When adding new tests:
1. Follow existing patterns
2. Use helper functions
3. Add cleanup in `afterAll` hooks
4. Document in TEST_SUITE_SUMMARY.md

---

## ✅ Quick Checklist

Before running tests:
- [ ] Application built (`npm run build`)
- [ ] Application running (`npm run start`)
- [ ] Database accessible
- [ ] Firebase configured
- [ ] Environment variables set

After tests complete:
- [ ] Review results
- [ ] Document failures
- [ ] Update tests if needed
- [ ] Clean up test data (automatic)

---

**Last Updated**: 2025-10-30
**Version**: 1.0
**Status**: ✅ Ready to run
