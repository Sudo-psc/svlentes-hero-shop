# 🧪 Subscriber API Tests

> **Testing guide for subscriber dashboard APIs**
> **Author**: Dr. Philipe Saraiva Cruz

---

## Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- subscription.test.ts
```

---

## Test Structure

```
src/app/api/assinante/__tests__/
├── subscription.test.ts    # Subscription API tests
├── orders.test.ts          # Orders API tests
├── invoices.test.ts        # Invoices API tests
├── register.test.ts        # User registration tests
└── mocks/
    ├── firebase.ts         # Firebase Admin mocks
    └── prisma.ts           # Prisma client mocks
```

---

## Mocks & Fixtures

### Firebase Mock

```typescript
// __tests__/mocks/firebase.ts
export const mockVerifyIdToken = jest.fn()

export const adminAuth = {
  verifyIdToken: mockVerifyIdToken
}
```

### Test Data

```typescript
// Common test fixtures
export const mockUser = {
  id: 'usr_test123',
  firebaseUid: 'firebase_uid_test',
  name: 'Test User',
  email: 'test@example.com'
}

export const mockSubscription = {
  id: 'sub_test456',
  userId: 'usr_test123',
  status: 'ACTIVE',
  planType: 'Plano Premium',
  monthlyValue: 89.90
}
```

---

## Example Test

```typescript
import { GET } from '../subscription/route'
import { mockVerifyIdToken } from '../__tests__/mocks/firebase'

describe('GET /api/assinante/subscription', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns subscription for authenticated user', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'firebase_test' })

    const request = new NextRequest('http://localhost/api/assinante/subscription', {
      headers: { 'Authorization': 'Bearer valid_token' }
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.subscription).toBeDefined()
  })

  it('returns 401 for missing token', async () => {
    const request = new NextRequest('http://localhost/api/assinante/subscription')

    const response = await GET(request)

    expect(response.status).toBe(401)
  })
})
```

---

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

---

## Adding New Tests

1. Create test file: `api-name.test.ts`
2. Import API route handler
3. Mock dependencies (Firebase, Prisma)
4. Write test cases covering:
   - Success scenarios
   - Error cases
   - Edge cases
   - Authentication failures
   - Rate limiting

---

**Author**: Dr. Philipe Saraiva Cruz
**Last Updated**: 2025-10-23
