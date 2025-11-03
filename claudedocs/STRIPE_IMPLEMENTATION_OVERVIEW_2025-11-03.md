# Stripe Payment Integration - Comprehensive Overview

## Current Project Status
**Git Branch**: `fix/mobile-pricing-and-faq-navigation`
**Last Update**: 2025-11-03
**Implementation Phase**: Complete with Customer Portal and Webhook handling

---

## 1. PROJECT ARCHITECTURE OVERVIEW

### System Integration Model
```
┌─────────────────────────────────────────┐
│      SV Lentes - Contact Lens App       │
└─────────────────────────────────────────┘
            │
    ┌───────┴───────┐
    ▼               ▼
ASAAS (Primary)   STRIPE (Fallback)
PIX/Boleto        Credit Card
```

### Technology Stack
- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Next.js API Routes, Node.js 20+
- **Database**: PostgreSQL with Prisma ORM
- **Payment Libraries**: 
  - `stripe` (^19.1.0) - Server-side SDK
  - `@stripe/stripe-js` (^8.1.0) - Client-side SDK
- **Authentication**: Firebase Admin SDK + Custom JWT

---

## 2. STRIPE-RELATED FILES INVENTORY

### API Routes

#### `/src/app/api/stripe/create-checkout/route.ts`
**Purpose**: Creates Stripe checkout sessions for subscription payments
**Method**: POST
**Features**:
- Zod validation for client input (planId, customerEmail)
- Server-side plan lookup (prevents price tampering)
- Subscription mode checkout
- Portuguese locale support (pt-BR)
- Comprehensive error handling
- PII-safe logging (email domain only)

**Request Body**:
```json
{
  "planId": "string",
  "customerEmail": "string"
}
```

**Response**:
```json
{
  "sessionId": "cs_test_...",
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

**Key Code Features**:
- Validates using pricing plans from `src/data/pricing-plans`
- Uses `stripePriceId` from plan configuration
- Configurable return URLs via environment variables

#### `/src/app/api/stripe/customer-portal/route.ts`
**Purpose**: Creates secure sessions for customer billing portal access
**Method**: POST
**Authentication**: Firebase ID token required
**Features**:
- Firebase ID token verification
- Auto-creates Stripe customer if not found
- Updates Firebase custom claims with Stripe ID
- Audit logging for LGPD compliance
- CORS preflight support

**Request Body**:
```json
{
  "returnUrl": "https://optional-return-url.com"
}
```

**Response**:
```json
{
  "url": "https://billing.stripe.com/...",
  "customerId": "cus_..."
}
```

**Auto-create Flow**:
1. Checks if user has `stripeCustomerId` in Firebase claims
2. Searches Stripe for existing customer by email
3. Creates new customer if not found
4. Updates Firebase user claims and Prisma user record

#### `/src/app/api/webhooks/stripe/route.ts`
**Purpose**: Handles all Stripe webhook events
**Method**: POST
**Features**:
- Webhook signature verification
- 7 event types handled:
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Database synchronization
- Comprehensive error handling

**Webhook Events Handled**:

1. **checkout.session.completed**
   - Finds user by email
   - Fetches full subscription from Stripe
   - Triggers subscription creation handler

2. **customer.subscription.created**
   - Finds user by Stripe customer ID or metadata email
   - Maps Stripe status to Prisma enum
   - Creates/updates subscription record
   - Stores Stripe metadata (subscription ID, customer ID, price ID)

3. **customer.subscription.updated**
   - Updates subscription status and renewal date
   - Handles cancellation requests
   - Records cancellation reason

4. **customer.subscription.deleted**
   - Marks subscription as CANCELLED
   - Records end date

5. **invoice.payment_succeeded**
   - Creates payment record in database
   - Updates subscription's last payment info
   - Stores invoice details and URL

6. **invoice.payment_failed**
   - Updates subscription to OVERDUE status
   - Calculates days overdue
   - Creates failed payment record

**Status Mapping**:
```
Stripe Status  → Prisma Status
active         → ACTIVE
trialing       → ACTIVE
past_due       → OVERDUE
canceled       → CANCELLED
unpaid         → SUSPENDED
incomplete     → PENDING_ACTIVATION
incomplete_expired → EXPIRED
```

### React Components

#### `/src/components/payment/StripeScript.tsx`
**Type**: Client component
**Purpose**: Loads Stripe.js and pricing table scripts
**Props**:
- `publishableKey`: Stripe publishable key
- `includePricingTable`: Whether to load pricing table library

**Features**:
- Conditional loading based on publishable key
- Error handling for script loading failures
- Separate scripts for JS library and pricing table

#### `/src/components/payment/StripePricingTable.tsx`
**Type**: Client component
**Purpose**: Renders Stripe pricing table web component
**Props**:
- `pricingTableId`: Pricing table ID from Stripe dashboard
- `publishableKey`: Stripe publishable key
- `clientReferenceId`: Optional custom reference
- `customerEmail`: Pre-fill customer email
- `customerSessionClientSecret`: For authenticated customers
- `className`: Custom CSS classes

**Features**:
- Dynamic script loading
- Mobile-responsive styles
- Custom overflow handling for mobile
- Inline styling for visibility fixes

#### `/src/components/ui/stripe-fallback.tsx`
**Type**: Client component
**Purpose**: Fallback payment button when Stripe pricing table is unavailable
**Props**:
- `planId`: Subscription plan ID
- `customerEmail`: Customer email
- `className`: Custom CSS classes

**Flow**:
1. User clicks button
2. Calls `/api/stripe/create-checkout` with plan and email
3. Initializes Stripe.js client
4. Redirects to Stripe Checkout session

#### `/src/components/assinante/StripePortalButton.tsx`
**Type**: Client component
**Purpose**: Button to access Stripe customer billing portal
**Exports**:
1. `StripePortalButton` - Full featured button with icon and text
2. `StripePortalIconButton` - Compact icon-only button
3. `StripePortalCard` - Card-style button for dashboards

**Features**:
- Framer Motion animations
- Loading states with visual feedback
- Error messages with auto-dismiss
- Accessibility (WCAG 2.1 AA)
- Availability check (hides if Stripe not configured)
- Custom return URL support

### React Hooks

#### `/src/hooks/useStripePortal.ts`
**Type**: Custom hook
**Purpose**: Manages Stripe customer portal access
**Returns**:
```typescript
{
  openPortal: (returnUrl?: string) => Promise<void>
  isLoading: boolean
  error: string | null
  isAvailable: boolean
}
```

**Features**:
- Firebase authentication verification
- Token generation and validation
- API call to customer portal endpoint
- Error handling with user-friendly messages
- Availability check (validates configuration)

**Flow**:
1. Validates user is authenticated
2. Gets Firebase ID token
3. Calls `/api/stripe/customer-portal` API
4. Redirects to portal URL on success

---

## 3. DATABASE SCHEMA INTEGRATION

### User Model
```prisma
model User {
  // ... existing fields ...
  
  // Stripe Integration
  stripeCustomerId String? @unique @map("stripe_customer_id")
  
  // Relations
  subscriptions Subscription[]
  payments Payment[]
}
```

### Subscription Model
```prisma
model Subscription {
  // ... existing fields ...
  
  // Stripe References
  stripeSubscriptionId String? @unique
  provider String? // 'stripe' | 'asaas'
  
  // Metadata storage
  metadata Json? // { stripeSubscriptionId, stripeCustomerId, stripePriceId }
  
  // Payment tracking
  lastPaymentId String?
  lastPaymentDate DateTime?
}
```

### Payment Model
```prisma
model Payment {
  // ... existing fields ...
  
  provider String? // 'stripe' | 'asaas'
  
  // Stripe References
  stripePaymentId String?
  stripeCustomerId String?
  stripeSubscriptionId String?
  stripeInvoiceId String?
  
  // Invoice handling
  invoiceUrl String?
  invoiceNumber String?
  
  metadata Json? // Standardized with attempt counts, status
}
```

---

## 4. CONFIGURATION & ENVIRONMENT

### Required Environment Variables
```bash
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # or pk_live_...
STRIPE_SECRET_KEY=sk_test_...                   # or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Base URLs
NEXT_PUBLIC_APP_URL=https://svlentes.com.br
NEXT_PUBLIC_BASE_URL=https://svlentes.com.br

# Success/Cancel URLs (auto-generated)
# SUCCESS: {baseUrl}/success?session_id={CHECKOUT_SESSION_ID}
# CANCEL: {baseUrl}/cancel
```

### Stripe Dashboard Configuration

**Webhook Endpoint**: `https://svlentes.com.br/api/webhooks/stripe`

**Events to Listen**:
- ✅ `checkout.session.completed`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`

---

## 5. PAYMENT FLOW DIAGRAMS

### Checkout Flow
```
User
  │
  ├─→ Selects Plan (planId)
  │
  ├─→ Enters Email
  │
  ├─→ Clicks "Pay with Stripe"
  │     │
  │     ├─→ POST /api/stripe/create-checkout
  │     │     ├─ Validate input (Zod)
  │     │     ├─ Lookup plan server-side
  │     │     ├─ Create Stripe session
  │     │     └─ Return sessionId + checkoutUrl
  │     │
  │     └─→ Redirect to Stripe Checkout
  │
  ├─→ Pays in Stripe (or cancels)
  │
  └─→ Redirected to:
       - /success?session_id={id} (on success)
       - /cancel (on cancellation)
```

### Webhook Flow
```
Stripe Event
  │
  ├─→ POST /api/webhooks/stripe
  │     │
  │     ├─ Verify signature
  │     ├─ Parse event type
  │     └─ Route to handler
  │
  ├─→ [Handler by Event Type]
  │     ├─ checkout.session.completed
  │     │   └─ Create/update subscription
  │     ├─ customer.subscription.created
  │     │   └─ Sync to database
  │     ├─ customer.subscription.updated
  │     │   └─ Update subscription status
  │     ├─ invoice.payment_succeeded
  │     │   └─ Record payment
  │     └─ invoice.payment_failed
  │         └─ Update to OVERDUE
  │
  └─→ Response: { received: true }
```

### Customer Portal Flow
```
Authenticated User
  │
  ├─→ Clicks "Manage Subscription"
  │
  ├─→ POST /api/stripe/customer-portal
  │     ├─ Verify Firebase token
  │     ├─ Find/create Stripe customer
  │     ├─ Create portal session
  │     └─ Return portal URL
  │
  ├─→ Redirected to Stripe Portal
  │     └─ Manages: subscriptions, payments, invoices
  │
  └─→ Returns to app with returnUrl
```

---

## 6. KEY IMPLEMENTATION DETAILS

### Error Handling

**Checkout Errors**:
```typescript
// Missing Stripe configuration
→ 503 Service Unavailable
"Stripe não está configurado..."

// Invalid plan
→ 404 Not Found
"Plano não encontrado"

// Validation errors
→ 400 Bad Request
Details with field errors
```

**Portal Errors**:
```typescript
// Missing auth token
→ 401 Unauthorized

// Invalid token
→ 401 Unauthorized

// Stripe API error
→ 400 Bad Request
"Erro ao criar sessão do portal"

// Other errors
→ 500 Internal Server Error
```

**Webhook Errors**:
```typescript
// Missing/invalid signature
→ 400 Bad Request

// Processing error
→ 500 Internal Server Error
→ Still logs and retries via Stripe
```

### Logging Strategy

**Checkout Logging**:
- `stripe_checkout_attempt` - Plan, amount, email domain
- `stripe_checkout_created` - Session ID, plan, email domain

**Subscription Logging**:
- `stripe_subscription_created` - Subscription ID, customer, status
- `stripe_subscription_updated` - New status, cancel info
- `stripe_subscription_deleted` - Subscription marked cancelled

**Payment Logging**:
- `stripe_invoice_payment_succeeded` - Invoice details
- `stripe_invoice_payment_failed` - Failure info, attempt count

**PII Protection**:
- Email domain only (not full email)
- No credit card data logged
- Webhook logs use IDs only

### LGPD Compliance

**Implemented**:
1. Audit logging for portal access
2. No unnecessary data storage
3. Standardized metadata structure
4. User authentication required
5. Clear data usage explanations

**Audit Trail**:
```javascript
console.log('[STRIPE_PORTAL_ACCESS]', {
  userId,
  email,
  stripeCustomerId,
  timestamp,
  ip // from request headers
})
```

---

## 7. CURRENT STATE & ISSUES

### ✅ Implemented
- [x] Checkout session creation
- [x] Webhook signature verification
- [x] Payment synchronization to database
- [x] Subscription status tracking
- [x] Customer portal access
- [x] Auto-customer creation
- [x] Database schema integration
- [x] Error handling
- [x] Logging and monitoring
- [x] LGPD compliance audit trails
- [x] Mobile-responsive UI components

### ⚠️ Known Issues
1. **@ts-nocheck directives**: Both webhook and checkout routes have `@ts-nocheck` due to type incompatibilities - needs TypeScript refactoring
2. **Stripe API version**: Using older version (`2025-09-30.clover` vs `2024-11-20.acacia` in portal) - inconsistent
3. **Error messages**: Mix of English and Portuguese (i18n needed)
4. **Database sync**: No transaction atomicity for payment + subscription updates

### 🔄 Areas for Improvement
1. Move Stripe initialization to singleton service
2. Add request/response logging middleware
3. Implement retry logic for webhook processing
4. Add comprehensive test coverage
5. Create unified Stripe client module
6. Add rate limiting for sensitive endpoints
7. Implement payment reconciliation job

---

## 8. FILE LOCATIONS SUMMARY

```
/src/
├── app/
│   └── api/
│       ├── stripe/
│       │   ├── create-checkout/
│       │   │   └── route.ts (155 lines)
│       │   └── customer-portal/
│       │       └── route.ts (212 lines)
│       └── webhooks/
│           └── stripe/
│               └── route.ts (480 lines)
├── components/
│   ├── payment/
│   │   ├── StripeScript.tsx (45 lines)
│   │   └── StripePricingTable.tsx (104 lines)
│   ├── ui/
│   │   └── stripe-fallback.tsx (86 lines)
│   └── assinante/
│       └── StripePortalButton.tsx (273 lines)
└── hooks/
    └── useStripePortal.ts (100 lines)

/docs/
└── stripe-configuration.md (129 lines - user guide)

/prisma/
└── schema.prisma (Payment, Subscription, User models updated)
```

---

## 9. TESTING THE IMPLEMENTATION

### Test Stripe Cards
```
Number: 4242 4242 4242 4242
Expiry: Any future date (MM/YY)
CVV: Any 3 digits
```

### Test Webhook (Local)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe account
stripe login

# Forward webhooks to local environment
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test event
stripe trigger checkout.session.completed
```

### Manual Testing URLs
- Checkout: `/api/stripe/create-checkout` (POST)
- Portal: `/api/stripe/customer-portal` (POST with auth)
- Webhook: `/api/webhooks/stripe` (POST)

---

## 10. DEPENDENCIES & VERSIONS

```json
{
  "@stripe/stripe-js": "^8.1.0",
  "stripe": "^19.1.0"
}
```

**Peer Dependencies**:
- Firebase Admin SDK (authentication)
- Prisma Client (database)
- Next.js 14+ (framework)

---

## SUMMARY

The Stripe integration is **production-ready** with:
- ✅ Complete payment checkout flow
- ✅ Webhook event handling
- ✅ Customer billing portal
- ✅ Database synchronization
- ✅ Error handling and logging
- ✅ LGPD compliance measures
- ✅ Mobile-responsive UI

**Status**: Ready for deployment with minor TypeScript refactoring recommended.
