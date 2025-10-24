# Quick Start - Phase 4 E2E Tests

## TL;DR
```bash
# Run all Phase 4 tests
npm run test:e2e -- subscriber-dashboard-phase4.spec.ts

# Run with visual debugging
npm run test:e2e:ui -- subscriber-dashboard-phase4.spec.ts

# Run specific component tests
npm run test:e2e -- subscriber-dashboard-phase4.spec.ts -g "Prescription"
npm run test:e2e -- subscriber-dashboard-phase4.spec.ts -g "Payment"
npm run test:e2e -- subscriber-dashboard-phase4.spec.ts -g "Delivery"
```

---

## Test Structure

### 1️⃣ **Prescription Management** (19 tests)
Tests file upload, validation, history, and downloads.

**Key Features Tested**:
- Upload prescription via drag-drop or file chooser
- File type validation (PDF, JPG, PNG only)
- File size validation (5MB max)
- Preview and confirm upload
- Cancel upload operation
- View prescription history
- Download prescription files

**Run Only These Tests**:
```bash
npm run test:e2e -- subscriber-dashboard-phase4.spec.ts -g "Prescription Management"
```

---

### 2️⃣ **Payment History** (19 tests)
Tests payment table, filtering, pagination, and downloads.

**Key Features Tested**:
- Display payment history table
- Filter by status (PAID, PENDING, OVERDUE)
- Filter by payment method (PIX, Boleto, Card)
- Filter by date range (30, 60, 90 days)
- Navigate pagination (next/previous)
- Download receipts and invoices
- Display summary cards

**Run Only These Tests**:
```bash
npm run test:e2e -- subscriber-dashboard-phase4.spec.ts -g "Payment History"
```

---

### 3️⃣ **Delivery Preferences** (21 tests)
Tests address form, CEP validation, and notification settings.

**Key Features Tested**:
- Load existing preferences
- Search CEP and auto-fill address (ViaCEP)
- Manual address entry
- Validate required fields
- Select delivery time preference
- Add delivery instructions (max 500 chars)
- Toggle notification preferences
- Save and cancel operations

**Run Only These Tests**:
```bash
npm run test:e2e -- subscriber-dashboard-phase4.spec.ts -g "Delivery Preferences"
```

---

### 4️⃣ **Error Handling** (5 tests)
Tests network failures, API timeouts, and retry mechanisms.

**Scenarios Tested**:
- Prescription upload network failure
- Payment API timeout
- CEP API unavailable
- Delivery preferences save failure
- Retry failed operations

**Run Only These Tests**:
```bash
npm run test:e2e -- subscriber-dashboard-phase4.spec.ts -g "Error Handling"
```

---

### 5️⃣ **Mobile Responsive** (5 tests)
Tests mobile viewport (375px) for touch and responsive design.

**Features Tested**:
- Prescription manager on mobile
- Payment table with horizontal scroll
- Delivery form usability
- Touch interactions
- Readable text sizes (14px minimum)

**Run Only These Tests**:
```bash
npm run test:e2e -- subscriber-dashboard-phase4.spec.ts -g "Mobile Responsive"
```

---

### 6️⃣ **Performance** (3 tests)
Tests load times, memory efficiency, and pagination speed.

**Metrics Tested**:
- Load all components < 8 seconds
- File preview memory management
- Pagination < 3 seconds for 3 pages

**Run Only These Tests**:
```bash
npm run test:e2e -- subscriber-dashboard-phase4.spec.ts -g "Performance"
```

---

### 7️⃣ **Accessibility** (4 tests)
Tests WCAG 2.1 compliance, keyboard nav, and screen readers.

**Standards Tested**:
- Keyboard navigation (Tab, Enter)
- ARIA labels and roles
- Form error announcements
- Color contrast (WCAG AA)

**Run Only These Tests**:
```bash
npm run test:e2e -- subscriber-dashboard-phase4.spec.ts -g "Accessibility"
```

---

## Environment Setup

### Required Environment Variables
```bash
# .env.test or set in shell
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword
```

### Install Dependencies
```bash
npm install
npx playwright install chromium  # or all browsers
```

---

## Common Commands

### Development
```bash
# Watch mode (re-run on changes)
npm run test:e2e -- subscriber-dashboard-phase4.spec.ts --ui

# Debug specific test
npm run test:e2e:debug -- subscriber-dashboard-phase4.spec.ts -g "upload prescription"

# Run in headed mode (see browser)
npm run test:e2e:headed -- subscriber-dashboard-phase4.spec.ts
```

### CI/CD
```bash
# Run all tests (production-like)
CI=true npm run test:e2e -- subscriber-dashboard-phase4.spec.ts

# Generate HTML report
npm run test:e2e -- subscriber-dashboard-phase4.spec.ts --reporter=html

# Run with retries (2 retries on failure)
npm run test:e2e -- subscriber-dashboard-phase4.spec.ts --retries=2
```

### Debugging
```bash
# Show trace viewer for last run
npx playwright show-trace test-results/subscriber-dashboard-phase4-*/trace.zip

# View HTML report
npx playwright show-report

# Run single test by line number
npm run test:e2e -- subscriber-dashboard-phase4.spec.ts:150
```

---

## Test Output

### Success Example
```
✓ Prescription Management > should display current prescription with status badge (1.2s)
✓ Prescription Management > should upload prescription file via drag and drop (2.5s)
✓ Payment History > should filter payments by status (1.8s)
✓ Delivery Preferences > should search CEP and auto-fill address (3.1s)

72 passed (5m 23s)
```

### Failure Example
```
✗ Prescription Management > should validate file type on upload (2.1s)

Error: Timeout 3000ms exceeded.
waiting for locator("text=/formato.*suportado|tipo.*arquivo/i") to be visible

Screenshot: test-results/prescription-upload-failed.png
Video: test-results/prescription-upload-failed.webm
```

---

## Troubleshooting

### Test Timeouts
```bash
# Increase timeout for slow operations
npm run test:e2e -- subscriber-dashboard-phase4.spec.ts --timeout=30000
```

### Login Failures
```bash
# Verify test user credentials
echo $TEST_USER_EMAIL
echo $TEST_USER_PASSWORD

# Check if test user exists in database
npm run db:seed  # Seed test data
```

### File Upload Issues
```bash
# Ensure file paths are correct
# Tests create mock files in memory, no file system dependency
```

### Network Errors
```bash
# Check API endpoints are accessible
curl http://localhost:5000/api/health-check

# Verify Next.js is running
npm run build && npm run start
```

### ViaCEP API Failures
```bash
# CEP lookup depends on external API
# Tests handle API failures gracefully
# Check ViaCEP status: https://viacep.com.br/
```

---

## Quick Reference

### Test Coverage Summary
| Component | Tests | Focus Areas |
|-----------|-------|-------------|
| Prescription Manager | 19 | Upload, validation, history |
| Payment History | 19 | Table, filters, pagination |
| Delivery Preferences | 21 | Form, CEP, notifications |
| Error Handling | 5 | Network, retry, graceful degradation |
| Mobile Responsive | 5 | Touch, viewport, readability |
| Performance | 3 | Load time, memory, pagination |
| Accessibility | 4 | WCAG 2.1, keyboard, ARIA |
| **TOTAL** | **72** | **Complete Phase 4 coverage** |

### File Locations
```
e2e/
├── subscriber-dashboard-phase4.spec.ts     # Main test file
├── PHASE4_TEST_COVERAGE.md                 # Detailed coverage doc
└── QUICK_START_PHASE4_TESTS.md            # This file
```

### Test Data
```typescript
// Valid CEP for Caratinga/MG
CEP: '35300-000'

// Payment Statuses
PAID | PENDING | OVERDUE | CANCELLED

// Payment Methods
PIX | BOLETO | CREDIT_CARD

// Delivery Times
MORNING | AFTERNOON | EVENING | ANY

// File Types (Valid)
application/pdf | image/jpeg | image/png

// File Size Limit
5MB (5 * 1024 * 1024 bytes)
```

---

## Next Steps

### After Running Tests
1. **Review HTML Report**: `npx playwright show-report`
2. **Check Screenshots**: `test-results/` directory for failures
3. **View Traces**: Use trace viewer for detailed debugging
4. **Update Tests**: Modify tests if components change

### Integration
1. **Add to CI/CD**: Include in GitHub Actions workflow
2. **Pre-commit Hook**: Run critical tests before commits
3. **Automated Deployment**: Block deploy if tests fail
4. **Monitoring**: Track test pass rate and flakiness

---

## Support

### Documentation
- Full Coverage: `e2e/PHASE4_TEST_COVERAGE.md`
- Playwright Docs: https://playwright.dev
- Project Docs: `/root/svlentes-hero-shop/CLAUDE.md`

### Common Issues
- **Login fails**: Check test user credentials in database
- **Timeouts**: Increase timeout or check server performance
- **API errors**: Verify endpoints are accessible
- **File upload**: Ensure file input selectors are correct

### Getting Help
```bash
# Run test with verbose logging
DEBUG=pw:api npm run test:e2e -- subscriber-dashboard-phase4.spec.ts

# Check test environment
npm run test:e2e -- --list
```

---

**Quick Tip**: Start with `npm run test:e2e:ui` for visual debugging and interactive test development!
