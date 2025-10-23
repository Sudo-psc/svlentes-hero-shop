# 📡 Subscriber Dashboard Phase 1 - API Documentation

> **Comprehensive API reference for subscriber dashboard backend services**
> **Author**: Dr. Philipe Saraiva Cruz
> **Date**: 2025-10-23
> **Version**: 1.0.0

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Core APIs](#core-apis)
  - [Subscription Management](#subscription-management)
  - [Orders](#orders)
  - [Invoices](#invoices)
  - [User Registration](#user-registration)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

The Subscriber Dashboard Phase 1 introduces enhanced backend APIs for managing subscriptions, orders, and user data. All APIs require Firebase authentication and implement comprehensive security measures.

**Key Features**:
- 🔐 Firebase Admin SDK authentication
- ⚡ Rate limiting for API protection
- 🛡️ CSRF protection on write operations
- 📊 Structured error responses
- 🔄 Automatic data validation

---

## Authentication

### Firebase Bearer Token

All API endpoints require a Firebase ID token in the Authorization header.

**Header Format**:
```http
Authorization: Bearer <firebase-id-token>
```

**Token Verification Flow**:
1. Extract token from `Authorization` header
2. Verify token using Firebase Admin SDK
3. Extract user UID from verified token
4. Lookup user in database by `firebaseUid`

**Example Token Retrieval** (Client-side):
```typescript
import { getAuth } from 'firebase/auth'

const auth = getAuth()
const user = auth.currentUser

if (user) {
  const token = await user.getIdToken()

  const response = await fetch('/api/assinante/subscription', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
}
```

---

## Rate Limiting

APIs implement different rate limits based on operation type:

| Operation Type | Limit | Window | Example Endpoints |
|---------------|-------|--------|-------------------|
| **Read** | 200 requests | 15 minutes | GET /subscription, /orders |
| **Write** | 50 requests | 15 minutes | PUT /subscription, POST /register |
| **Sensitive** | 10 requests | 15 minutes | Payment updates, address changes |

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 195
X-RateLimit-Reset: 1698067200
```

**Rate Limit Exceeded Response**:
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

---

## Core APIs

### Subscription Management

#### GET /api/assinante/subscription

**Description**: Retrieve active subscription details for authenticated user.

**Authentication**: Required (Firebase Bearer token)

**Rate Limit**: 200 requests / 15 minutes

**Request Headers**:
```http
Authorization: Bearer <firebase-token>
```

**Success Response** (200 OK):
```json
{
  "subscription": {
    "id": "sub_abc123",
    "status": "active",
    "plan": {
      "name": "Plano Mensal Premium",
      "price": 89.90,
      "billingCycle": "monthly"
    },
    "currentPeriodStart": "2025-10-01T00:00:00.000Z",
    "currentPeriodEnd": "2025-11-01T00:00:00.000Z",
    "nextBillingDate": "2025-11-01T00:00:00.000Z",
    "benefits": [
      {
        "id": "ben_1",
        "name": "Lentes Mensais",
        "description": "6 caixas por mês",
        "icon": "📦",
        "type": "PRODUCT",
        "quantityTotal": 6,
        "quantityUsed": 2,
        "expirationDate": null
      }
    ],
    "shippingAddress": {
      "street": "Rua das Flores",
      "number": "123",
      "complement": "Apto 45",
      "neighborhood": "Centro",
      "city": "Caratinga",
      "state": "MG",
      "zipCode": "35300-000"
    },
    "paymentMethod": "credit_card",
    "paymentMethodLast4": "4242",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-10-23T14:22:00.000Z"
  },
  "user": {
    "id": "usr_xyz789",
    "name": "Maria Silva",
    "email": "maria@example.com",
    "avatarUrl": "https://example.com/avatar.jpg"
  }
}
```

**No Active Subscription** (200 OK):
```json
{
  "subscription": null,
  "user": {
    "id": "usr_xyz789",
    "name": "Maria Silva",
    "email": "maria@example.com",
    "avatarUrl": null
  }
}
```

**Error Responses**:

**401 Unauthorized** - Missing or invalid token:
```json
{
  "error": "UNAUTHORIZED",
  "message": "Token de autenticação não fornecido"
}
```

**404 Not Found** - User not found in database:
```json
{
  "error": "NOT_FOUND",
  "message": "Usuário não encontrado"
}
```

**503 Service Unavailable** - Firebase Admin not configured:
```json
{
  "error": "SERVICE_UNAVAILABLE",
  "message": "Serviço de autenticação temporariamente indisponível",
  "subscription": null
}
```

**cURL Example**:
```bash
curl -X GET https://svlentes.shop/api/assinante/subscription \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

#### PUT /api/assinante/subscription

**Description**: Update subscription shipping address.

**Authentication**: Required (Firebase Bearer token)

**CSRF Protection**: Required

**Rate Limit**: 50 requests / 15 minutes

**Request Headers**:
```http
Authorization: Bearer <firebase-token>
Content-Type: application/json
X-CSRF-Token: <csrf-token>
```

**Request Body**:
```json
{
  "shippingAddress": {
    "street": "Rua Nova",
    "number": "456",
    "complement": "Casa 2",
    "neighborhood": "Bairro Alto",
    "city": "Caratinga",
    "state": "MG",
    "zipCode": "35300-100"
  }
}
```

**Success Response** (200 OK):
```json
{
  "message": "Endereço atualizado com sucesso",
  "subscription": {
    "id": "sub_abc123",
    "shippingAddress": {
      "street": "Rua Nova",
      "number": "456",
      "complement": "Casa 2",
      "neighborhood": "Bairro Alto",
      "city": "Caratinga",
      "state": "MG",
      "zipCode": "35300-100"
    },
    "updatedAt": "2025-10-23T14:30:00.000Z"
  }
}
```

**Error Responses**:

**404 Not Found** - No active subscription:
```json
{
  "error": "NOT_FOUND",
  "message": "Assinatura não encontrada"
}
```

**fetch Example**:
```typescript
const response = await fetch('/api/assinante/subscription', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({
    shippingAddress: {
      street: 'Rua Nova',
      number: '456',
      complement: 'Casa 2',
      neighborhood: 'Bairro Alto',
      city: 'Caratinga',
      state: 'MG',
      zipCode: '35300-100'
    }
  })
})

const data = await response.json()
```

---

### Orders

#### GET /api/assinante/orders

**Description**: Retrieve order history for authenticated user.

**Authentication**: Required (Firebase Bearer token)

**Rate Limit**: 200 requests / 15 minutes

**Query Parameters**:
- `limit` (optional): Number of orders to return (default: 10, max: 50)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by status (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`)

**Request Headers**:
```http
Authorization: Bearer <firebase-token>
```

**Success Response** (200 OK):
```json
{
  "orders": [
    {
      "id": "ord_001",
      "status": "DELIVERED",
      "orderNumber": "SV-2025-001234",
      "totalAmount": 89.90,
      "items": [
        {
          "id": "item_1",
          "productName": "Lentes de Contato Diárias",
          "quantity": 6,
          "unitPrice": 14.98,
          "totalPrice": 89.88
        }
      ],
      "shippingAddress": {
        "street": "Rua das Flores",
        "number": "123",
        "city": "Caratinga",
        "state": "MG",
        "zipCode": "35300-000"
      },
      "trackingCode": "BR123456789MG",
      "shippedAt": "2025-10-15T10:00:00.000Z",
      "deliveredAt": "2025-10-18T14:30:00.000Z",
      "createdAt": "2025-10-14T08:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

**cURL Example with Filters**:
```bash
curl -X GET "https://svlentes.shop/api/assinante/orders?limit=5&status=DELIVERED" \
  -H "Authorization: Bearer <token>"
```

---

### Invoices

#### GET /api/assinante/invoices

**Description**: Retrieve invoice/payment history for authenticated user.

**Authentication**: Required (Firebase Bearer token)

**Rate Limit**: 200 requests / 15 minutes

**Query Parameters**:
- `limit` (optional): Number of invoices to return (default: 12, max: 50)
- `year` (optional): Filter by year (e.g., 2025)
- `status` (optional): Filter by payment status (`PAID`, `PENDING`, `OVERDUE`, `CANCELLED`)

**Request Headers**:
```http
Authorization: Bearer <firebase-token>
```

**Success Response** (200 OK):
```json
{
  "invoices": [
    {
      "id": "inv_001",
      "invoiceNumber": "NF-2025-10-001",
      "status": "PAID",
      "amount": 89.90,
      "description": "Assinatura Mensal - Outubro 2025",
      "dueDate": "2025-10-01T00:00:00.000Z",
      "paidAt": "2025-10-01T10:15:00.000Z",
      "paymentMethod": "credit_card",
      "downloadUrl": "https://svlentes.shop/invoices/inv_001.pdf",
      "createdAt": "2025-09-25T00:00:00.000Z"
    },
    {
      "id": "inv_002",
      "invoiceNumber": "NF-2025-11-002",
      "status": "PENDING",
      "amount": 89.90,
      "description": "Assinatura Mensal - Novembro 2025",
      "dueDate": "2025-11-01T00:00:00.000Z",
      "paidAt": null,
      "paymentMethod": "credit_card",
      "downloadUrl": null,
      "createdAt": "2025-10-25T00:00:00.000Z"
    }
  ],
  "summary": {
    "totalPaid": 449.50,
    "totalPending": 89.90,
    "totalOverdue": 0,
    "currentYear": 2025
  }
}
```

**TypeScript Example**:
```typescript
interface InvoiceResponse {
  invoices: Array<{
    id: string
    invoiceNumber: string
    status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED'
    amount: number
    dueDate: string
    paidAt: string | null
    downloadUrl: string | null
  }>
  summary: {
    totalPaid: number
    totalPending: number
    totalOverdue: number
  }
}

const fetchInvoices = async (token: string): Promise<InvoiceResponse> => {
  const response = await fetch('/api/assinante/invoices', {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch invoices')
  }

  return response.json()
}
```

---

### User Registration

#### POST /api/assinante/register

**Description**: Register new user account with Firebase integration.

**Authentication**: Required (Firebase Bearer token for new user)

**CSRF Protection**: Required

**Rate Limit**: 10 requests / 15 minutes (sensitive operation)

**Request Headers**:
```http
Authorization: Bearer <firebase-token>
Content-Type: application/json
X-CSRF-Token: <csrf-token>
```

**Request Body**:
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "5533999898026",
  "cpf": "123.456.789-00",
  "birthDate": "1990-05-15",
  "address": {
    "street": "Rua Principal",
    "number": "100",
    "complement": null,
    "neighborhood": "Centro",
    "city": "Caratinga",
    "state": "MG",
    "zipCode": "35300-000"
  }
}
```

**Success Response** (201 Created):
```json
{
  "message": "Usuário registrado com sucesso",
  "user": {
    "id": "usr_new123",
    "firebaseUid": "firebase_uid_abc",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "5533999898026",
    "createdAt": "2025-10-23T15:00:00.000Z"
  }
}
```

**Validation Errors** (400 Bad Request):
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Dados inválidos",
  "details": [
    {
      "field": "cpf",
      "message": "CPF inválido"
    },
    {
      "field": "email",
      "message": "Email já cadastrado"
    }
  ]
}
```

---

## Error Handling

### Standard Error Response Format

All APIs return errors in a consistent format:

```typescript
interface ApiError {
  error: string        // Error code (uppercase with underscores)
  message: string      // Human-readable error message
  details?: any        // Optional additional error context
  retryAfter?: number  // Seconds to wait before retry (rate limiting)
}
```

### Common Error Codes

| HTTP Status | Error Code | Description | Retry Recommended |
|------------|------------|-------------|-------------------|
| 400 | `VALIDATION_ERROR` | Invalid request data | No - fix data |
| 401 | `UNAUTHORIZED` | Missing or invalid auth token | No - reauthenticate |
| 403 | `FORBIDDEN` | Insufficient permissions | No |
| 404 | `NOT_FOUND` | Resource not found | No |
| 409 | `CONFLICT` | Resource state conflict | No |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests | Yes - after delay |
| 500 | `INTERNAL_ERROR` | Server error | Yes - with backoff |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily down | Yes - after delay |

### Error Handling Best Practices

**Client-Side Example**:
```typescript
async function fetchSubscription(token: string) {
  try {
    const response = await fetch('/api/assinante/subscription', {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) {
      const error = await response.json()

      switch (error.error) {
        case 'UNAUTHORIZED':
          // Redirect to login
          window.location.href = '/area-assinante/login'
          break

        case 'RATE_LIMIT_EXCEEDED':
          // Wait and retry
          await new Promise(resolve =>
            setTimeout(resolve, error.retryAfter * 1000)
          )
          return fetchSubscription(token)

        case 'SERVICE_UNAVAILABLE':
          // Show fallback UI
          showOfflineMessage()
          break

        default:
          // Show generic error
          showError(error.message)
      }

      throw new Error(error.message)
    }

    return response.json()
  } catch (error) {
    console.error('Subscription fetch failed:', error)
    throw error
  }
}
```

---

## Examples

### Complete Subscription Fetch Example

```typescript
import { getAuth } from 'firebase/auth'

interface SubscriptionData {
  subscription: Subscription | null
  user: User
}

async function getSubscriptionData(): Promise<SubscriptionData> {
  // Get Firebase auth token
  const auth = getAuth()
  const firebaseUser = auth.currentUser

  if (!firebaseUser) {
    throw new Error('User not authenticated')
  }

  const token = await firebaseUser.getIdToken()

  // Fetch subscription
  const response = await fetch('/api/assinante/subscription', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch subscription')
  }

  return response.json()
}

// Usage
try {
  const data = await getSubscriptionData()

  if (data.subscription) {
    console.log('Active subscription:', data.subscription.plan.name)
    console.log('Next billing:', data.subscription.nextBillingDate)
  } else {
    console.log('No active subscription')
  }
} catch (error) {
  console.error('Error:', error)
}
```

### Update Address with Error Handling

```typescript
async function updateShippingAddress(
  token: string,
  address: ShippingAddress
): Promise<void> {
  const response = await fetch('/api/assinante/subscription', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-CSRF-Token': getCsrfToken()
    },
    body: JSON.stringify({ shippingAddress: address })
  })

  if (!response.ok) {
    const error = await response.json()

    if (error.error === 'NOT_FOUND') {
      throw new Error('Nenhuma assinatura ativa encontrada')
    }

    throw new Error(error.message || 'Erro ao atualizar endereço')
  }

  const result = await response.json()
  console.log('Address updated:', result.message)
}
```

---

## API Testing

### Using cURL

**Test Subscription Endpoint**:
```bash
# Set your Firebase token
export TOKEN="your-firebase-token-here"

# Get subscription
curl -X GET https://svlentes.shop/api/assinante/subscription \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Update address
curl -X PUT https://svlentes.shop/api/assinante/subscription \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: your-csrf-token" \
  -d '{
    "shippingAddress": {
      "street": "Test Street",
      "number": "123",
      "city": "Caratinga",
      "state": "MG",
      "zipCode": "35300-000"
    }
  }'
```

### Using Postman

1. Create new request
2. Set method and URL
3. Add Authorization header: `Bearer <token>`
4. For PUT/POST: Add `Content-Type: application/json`
5. For PUT/POST: Add request body
6. Send and inspect response

---

## Security Considerations

### Authentication
- ✅ All endpoints require valid Firebase token
- ✅ Tokens verified server-side using Firebase Admin SDK
- ✅ User identity extracted from verified token
- ❌ Never trust client-provided user IDs

### Rate Limiting
- ✅ Different limits for read vs write operations
- ✅ Stricter limits for sensitive operations
- ✅ Per-user rate limiting (based on IP + user ID)
- ⚠️ Monitor for abuse patterns

### Data Validation
- ✅ All inputs validated server-side
- ✅ Address data sanitized
- ✅ CPF validation for Brazilian users
- ✅ Email format validation

### CSRF Protection
- ✅ Required for all state-changing operations (PUT, POST, DELETE)
- ✅ Token verified server-side
- ❌ GET requests do not require CSRF token

### LGPD Compliance
- ✅ Only collect necessary data
- ✅ User consent logged
- ✅ Data access audit trail
- ✅ Data deletion support

---

## Performance Optimization

### Caching Strategy
- **Subscription Data**: Cache for 5 minutes on client
- **Orders**: Cache for 30 minutes
- **Invoices**: Cache for 1 hour
- **User Profile**: Cache for 10 minutes

### Database Queries
- Indexed fields: `firebaseUid`, `email`, `subscriptionId`
- Optimized joins with Prisma `include`
- Pagination for large result sets
- Limited data retrieval (only necessary fields)

### Response Times
- **Target**: < 500ms for read operations
- **Target**: < 1000ms for write operations
- **Monitoring**: Track P95 and P99 latencies

---

## Changelog

### Version 1.0.0 (2025-10-23)
- ✨ Initial API documentation for Phase 1
- 📡 Subscription management endpoints
- 📦 Orders and invoices endpoints
- 👤 User registration endpoint
- 🔐 Firebase authentication integration
- ⚡ Rate limiting implementation
- 🛡️ CSRF protection for write operations

---

## Support

For API issues or questions:
- **Email**: saraivavision@gmail.com
- **WhatsApp**: (33) 98606-1427
- **Documentation**: `/root/svlentes-hero-shop/CLAUDE.md`

---

**Author**: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
**Last Updated**: 2025-10-23
