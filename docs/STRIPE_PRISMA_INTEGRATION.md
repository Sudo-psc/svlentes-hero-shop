# Stripe - Prisma Database Integration

## Overview

This document describes the integration between Stripe payment processing and the Prisma database for the SV Lentes subscriber area.

## Architecture

### Data Flow

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Stripe    │──────▶│   Webhooks   │──────▶│   Prisma    │
│  (Payment)  │       │   Handler    │       │  Database   │
└─────────────┘       └──────────────┘       └─────────────┘
      │                      │                       │
      │                      │                       │
      ▼                      ▼                       ▼
  Customer                 Sync                 Local
   Portal              Subscriptions           Records
```

## Webhook Events Handled

### 1. `checkout.session.completed`
**Trigger**: Customer completes checkout  
**Action**: 
- Find user by email
- Create subscription record in Prisma
- Link Stripe customer to user

**Database Updates**:
```typescript
// Creates new Subscription record
prisma.subscription.create({
  userId: user.id,
  planType: 'Stripe Plan',
  status: 'ACTIVE',
  monthlyValue: amount,
  metadata: {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId
  }
})
```

### 2. `customer.subscription.created`
**Trigger**: New subscription created  
**Action**: 
- Map Stripe subscription to Prisma Subscription
- Store subscription metadata

**Status Mapping**:
```typescript
const statusMap = {
  'active': 'ACTIVE',
  'trialing': 'ACTIVE',
  'past_due': 'OVERDUE',
  'canceled': 'CANCELLED',
  'unpaid': 'SUSPENDED',
  'incomplete': 'PENDING_ACTIVATION'
}
```

### 3. `customer.subscription.updated`
**Trigger**: Subscription changed (plan, status, etc)  
**Action**:
- Update subscription status
- Update renewal date
- Update monthly value
- Store cancellation reason if applicable

### 4. `customer.subscription.deleted`
**Trigger**: Subscription cancelled  
**Action**:
- Set status to 'CANCELLED'
- Record end date
- Store cancellation reason

### 5. `invoice.payment_succeeded`
**Trigger**: Payment successful  
**Action**:
- Create Payment record
- Update subscription lastPaymentDate
- Record payment details

**Database Updates**:
```typescript
// Creates Payment record
prisma.payment.create({
  userId: subscription.userId,
  subscriptionId: subscription.id,
  asaasPaymentId: invoice.id,
  amount: invoice.amount_paid / 100,
  status: 'CONFIRMED',
  billingType: 'CREDIT_CARD',
  paymentDate: new Date(),
  invoiceUrl: invoice.hosted_invoice_url
})

// Updates Subscription
prisma.subscription.update({
  lastPaymentId: invoice.id,
  lastPaymentDate: new Date()
})
```

### 6. `invoice.payment_failed`
**Trigger**: Payment failed  
**Action**:
- Update subscription status to 'OVERDUE'
- Create/update failed Payment record
- Calculate days overdue

## API Endpoints

### Subscriber Area APIs with Stripe Integration

#### GET `/api/assinante/subscription`
- Returns active subscription from Prisma
- Shows Stripe-synced data (status, renewal date, amount)
- **Ownership validation**: Only returns user's own subscription

#### GET `/api/assinante/payment-history`
- Returns payment history from Prisma
- Includes Stripe invoice URLs
- Shows payment status synced from Stripe
- **Ownership validation**: Only returns user's own payments

#### POST `/api/stripe/customer-portal`
- Creates Stripe Customer Portal session
- Authenticated via Firebase token
- Returns URL for customer to manage subscription in Stripe
- **Security**: Validates user owns the Stripe customer account

#### GET `/api/assinante/orders`
- Returns order history
- Links to subscription and payments
- **Ownership validation**: Only returns user's own orders

## Security Features

### Ownership Validation
All subscriber APIs validate that the authenticated user owns the requested resources:

```typescript
// Example from subscription API
const subscription = await prisma.subscription.findFirst({
  where: {
    userId: user.id,  // CRITICAL: User's own data only
    status: 'ACTIVE'
  }
})

// Double-check ownership (defense in depth)
if (subscription.userId !== user.id) {
  return { error: 'FORBIDDEN', status: 403 }
}
```

### Webhook Security
- Validates Stripe webhook signatures
- Verifies webhook authenticity
- Prevents replay attacks
- Idempotent event processing

```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
)
```

## Database Schema

### Subscription Model
```prisma
model Subscription {
  id                   String             @id @default(cuid())
  userId               String
  asaasSubscriptionId  String?            @unique
  planType             String
  status               SubscriptionStatus
  monthlyValue         Decimal
  renewalDate          DateTime
  startDate            DateTime
  paymentMethod        PaymentMethod
  
  // Stripe integration fields
  metadata             Json?              // Stores Stripe IDs
  
  // Relations
  user                 User               @relation(...)
  payments             Payment[]
  orders               Order[]
}
```

### Payment Model
```prisma
model Payment {
  id                String         @id @default(cuid())
  userId            String
  subscriptionId    String
  
  // Using asaasPaymentId for Stripe invoice ID (compatibility)
  asaasPaymentId    String         @unique
  asaasCustomerId   String         // Stripe customer ID
  
  amount            Decimal
  status            PaymentStatus
  billingType       String
  dueDate           DateTime
  paymentDate       DateTime?
  confirmedDate     DateTime?
  
  invoiceUrl        String?        // Stripe hosted invoice URL
  invoiceNumber     String?
  
  metadata          Json?          // Stores Stripe metadata
}
```

## Configuration

### Environment Variables

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Database
DATABASE_URL=postgresql://...

# Firebase (for authentication)
FIREBASE_SERVICE_ACCOUNT_KEY={...}
```

### Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://svlentes.com.br/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Testing

### Test Webhook Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
```

### Verify Database Sync

```sql
-- Check subscriptions
SELECT * FROM subscriptions WHERE metadata->>'stripeSubscriptionId' IS NOT NULL;

-- Check payments
SELECT * FROM payments WHERE metadata->>'stripeInvoiceId' IS NOT NULL;

-- Check sync status
SELECT 
  s.id,
  s.status,
  s.monthlyValue,
  s.renewalDate,
  p.paymentDate,
  p.amount
FROM subscriptions s
LEFT JOIN payments p ON s.id = p.subscriptionId
WHERE s.metadata->>'stripeSubscriptionId' IS NOT NULL
ORDER BY s.updatedAt DESC;
```

## Error Handling

### Webhook Failures
- All webhook handlers are wrapped in try-catch
- Errors are logged but don't return 500 (to prevent Stripe retries)
- Failed syncs are logged for manual review

### Database Sync Issues
Common issues and solutions:

1. **User not found**: Check email matching between Firebase and Stripe
2. **Duplicate subscriptions**: Use `upsert` for idempotency
3. **Status mismatch**: Review status mapping in webhook handlers
4. **Payment not recorded**: Check invoice webhook is received

## Monitoring

### Key Metrics
- Webhook success rate
- Sync latency (time from Stripe event to DB update)
- Failed sync count
- Payment confirmation rate

### Logs to Monitor
```typescript
// Success logs
'stripe_subscription_synced_to_db'
'stripe_payment_recorded_in_db'

// Error logs
'Failed to sync subscription to database'
'User not found for subscription'
'Failed to record payment in database'
```

## Migration from Legacy System

### Asaas to Stripe Migration
The system uses Stripe but maintains Asaas field names for compatibility:

- `asaasPaymentId` → Stores Stripe invoice ID
- `asaasCustomerId` → Stores Stripe customer ID
- `asaasSubscriptionId` → Stores Stripe subscription ID

This allows gradual migration without breaking existing code.

## Best Practices

1. **Always validate ownership** before returning data
2. **Use webhook signatures** to verify authenticity
3. **Implement idempotency** for all webhook handlers
4. **Log all sync operations** for audit trail
5. **Handle Stripe API errors** gracefully
6. **Test webhooks** in sandbox before production
7. **Monitor sync status** regularly

## Troubleshooting

### Subscription not syncing
1. Check webhook is configured in Stripe
2. Verify webhook secret is correct
3. Check logs for errors: `journalctl -u svlentes-nextjs -f | grep stripe`
4. Test webhook manually with Stripe CLI

### Payment not appearing
1. Verify invoice webhook was received
2. Check subscription exists in database
3. Verify payment status mapping
4. Check for duplicate payment ID errors

### Customer portal not working
1. Verify Stripe customer ID is correct
2. Check Firebase authentication
3. Ensure user has active subscription
4. Review customer portal configuration in Stripe

## Support

For issues or questions:
- Email: saraivavision@gmail.com
- Documentation: `/docs/SUBSCRIBER_AREA_ANALYSIS.md`
- Webhook logs: `/var/log/svlentes/webhooks.log`

---

**Last Updated**: 2025-11-01  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
