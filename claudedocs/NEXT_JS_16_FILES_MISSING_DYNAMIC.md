# Next.js 16 API Routes - Missing Dynamic Declarations

Complete list of 82 route files that are missing `export const dynamic` declarations.

## Route Files Missing Dynamic Declaration (82 total)

### Authentication Routes (1 file)
- `/root/svlentes-hero-shop/src/app/api/auth/set-token/route.ts`

### Stripe/Payment Routes (3 files)
- `/root/svlentes-hero-shop/src/app/api/stripe/create-checkout/route.ts`
- `/root/svlentes-hero-shop/src/app/api/stripe/pix/create-payment/route.ts`
- `/root/svlentes-hero-shop/src/app/api/stripe/customer-portal/route.ts`

### V1 API Routes (10 files)
- `/root/svlentes-hero-shop/src/app/api/v1/reminders/[id]/route.ts`
- `/root/svlentes-hero-shop/src/app/api/v1/reminders/route.ts`
- `/root/svlentes-hero-shop/src/app/api/v1/analytics/dashboard/route.ts`
- `/root/svlentes-hero-shop/src/app/api/v1/analytics/engagement/route.ts`
- `/root/svlentes-hero-shop/src/app/api/v1/users/[userId]/preferences/route.ts`
- `/root/svlentes-hero-shop/src/app/api/v1/interactions/route.ts`
- `/root/svlentes-hero-shop/src/app/api/v1/ml/predict/route.ts`
- `/root/svlentes-hero-shop/src/app/api/v1/ml/metrics/route.ts`
- `/root/svlentes-hero-shop/src/app/api/v1/scheduler/snapshot/route.ts`
- `/root/svlentes-hero-shop/src/app/api/v1/scheduler/process/route.ts`

### WhatsApp Routes (1 file)
- `/root/svlentes-hero-shop/src/app/api/whatsapp/support/route.ts`

### Debug Routes (4 files)
- `/root/svlentes-hero-shop/src/app/api/debug/stats/route.ts`
- `/root/svlentes-hero-shop/src/app/api/debug/conversation/[phone]/route.ts`
- `/root/svlentes-hero-shop/src/app/api/debug/health/route.ts`
- `/root/svlentes-hero-shop/src/app/api/debug/message/[messageId]/route.ts`

### Reminders Routes (3 files)
- `/root/svlentes-hero-shop/src/app/api/reminders/send/route.ts`
- `/root/svlentes-hero-shop/src/app/api/reminders/schedule/route.ts`
- `/root/svlentes-hero-shop/src/app/api/reminders/bulk/route.ts`

### Health & Config Routes (3 files)
- `/root/svlentes-hero-shop/src/app/api/health-check/route.ts`
- `/root/svlentes-hero-shop/src/app/api/config-health/route.ts`
- `/root/svlentes-hero-shop/src/app/api/llm-info/route.ts`

### Create Checkout (1 file)
- `/root/svlentes-hero-shop/src/app/api/create-checkout/route.ts`

### Webhook Routes (1 file - CRITICAL)
- `/root/svlentes-hero-shop/src/app/api/webhooks/stripe/route.ts` ⚠️ CRITICAL - handles real payments

### Monitoring Routes (4 files)
- `/root/svlentes-hero-shop/src/app/api/monitoring/langchain-stats/route.ts`
- `/root/svlentes-hero-shop/src/app/api/monitoring/performance/route.ts`
- `/root/svlentes-hero-shop/src/app/api/monitoring/alerts/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/langsmith/logs/route.ts`

### Admin Routes (27 files)
- `/root/svlentes-hero-shop/src/app/api/admin/auth/login/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/auth/logout/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/auth/refresh/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/auth/me/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/customers/[id]/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/customers/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/customers/search/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/dashboard/analytics/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/dashboard/customer-growth/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/dashboard/export/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/dashboard/metrics/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/dashboard/recent-activity/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/dashboard/revenue/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/feature-flags/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/health/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/history-recovery/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/langsmith/diagnostics/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/memory/maintenance/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/orders/[id]/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/orders/[id]/status/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/orders/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/pricing/costs/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/pricing/planos/[id]/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/pricing/planos/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/sendpulse-health/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/sendpulse-troubleshoot/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/support/tickets/[id]/assign/route.ts`

### Subscription Routes (4 files)
- `/root/svlentes-hero-shop/src/app/api/subscription/change-plan/route.ts`
- `/root/svlentes-hero-shop/src/app/api/subscription/update-address/route.ts`
- `/root/svlentes-hero-shop/src/app/api/subscription/history/route.ts`
- `/root/svlentes-hero-shop/src/app/api/subscription/update-payment/route.ts`

### Privacy Routes (3 files)
- `/root/svlentes-hero-shop/src/app/api/privacy/consent-log/route.ts`
- `/root/svlentes-hero-shop/src/app/api/privacy/data-export/route.ts`
- `/root/svlentes-hero-shop/src/app/api/privacy/data-request/route.ts`

### User Routes (3 files)
- `/root/svlentes-hero-shop/src/app/api/user/notification-preferences/route.ts`
- `/root/svlentes-hero-shop/src/app/api/user/preferences/route.ts`
- `/root/svlentes-hero-shop/src/app/api/user/profile/route.ts`

### WhatsApp Redirect (1 file)
- `/root/svlentes-hero-shop/src/app/api/whatsapp-redirect/route.ts`

### SendPulse (1 file)
- `/root/svlentes-hero-shop/src/app/api/sendpulse/route.ts`

### Push Tokens (1 file)
- `/root/svlentes-hero-shop/src/app/api/push-tokens/route.ts`

### Schedule Consultation (1 file)
- `/root/svlentes-hero-shop/src/app/api/schedule-consultation/route.ts`

### Addons (1 file)
- `/root/svlentes-hero-shop/src/app/api/addons/route.ts`

### Analytics Support (1 file)
- `/root/svlentes-hero-shop/src/app/api/analytics/support/route.ts`

### Admin Support Tickets (2 files)
- `/root/svlentes-hero-shop/src/app/api/admin/support/tickets/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/support/tickets/[id]/route.ts`

### Admin Subscriptions (4 files)
- `/root/svlentes-hero-shop/src/app/api/admin/subscriptions/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/subscriptions/[id]/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/subscriptions/[id]/status/route.ts`
- `/root/svlentes-hero-shop/src/app/api/admin/subscriptions/analytics/route.ts`

### Admin System Health (1 file)
- `/root/svlentes-hero-shop/src/app/api/admin/system-health/route.ts`

---

## Quick Fix Command

Add `export const dynamic = 'force-dynamic'` to the top of each file:

```bash
#!/bin/bash
# Save this as fix-dynamic.sh

files=(
  "src/app/api/auth/set-token/route.ts"
  "src/app/api/stripe/create-checkout/route.ts"
  "src/app/api/stripe/pix/create-payment/route.ts"
  "src/app/api/stripe/customer-portal/route.ts"
  # ... (add all 82 files)
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    if ! grep -q "export const dynamic" "$file"; then
      # Get the first line (check if it's a comment)
      firstline=$(head -1 "$file")
      if [[ "$firstline" == //* ]]; then
        # Insert after the comment
        sed -i '1a export const dynamic = '\''force-dynamic'\''\n' "$file"
      else
        # Insert at the beginning
        sed -i '1i export const dynamic = '\''force-dynamic'\''\n' "$file"
      fi
      echo "Fixed: $file"
    fi
  fi
done
```

---

## Prioritized Fix Order

### 1. CRITICAL (This Week)
- [ ] `/root/svlentes-hero-shop/src/app/api/webhooks/stripe/route.ts` - Payment webhook
- [ ] `/root/svlentes-hero-shop/src/app/api/stripe/customer-portal/route.ts` - Customer portal
- [ ] `/root/svlentes-hero-shop/src/app/api/stripe/create-checkout/route.ts` - Checkout

### 2. HIGH (Next 2 Days)
- [ ] `/root/svlentes-hero-shop/src/app/api/auth/set-token/route.ts` - Auth/cookies
- [ ] `/root/svlentes-hero-shop/src/app/api/webhooks/sendpulse/route.ts` - WhatsApp webhook
- [ ] All admin auth routes (4 files)
- [ ] All subscription routes (4 files)

### 3. MEDIUM (Next Week)
- [ ] All remaining admin routes (23 files)
- [ ] Privacy routes (3 files)
- [ ] User routes (3 files)

### 4. LOW (Before Production N16 Upgrade)
- [ ] Debug routes (4 files)
- [ ] V1 API routes (10 files)
- [ ] Monitoring routes (4 files)
- [ ] Others

---

## Verification

After adding dynamic declarations, verify:

```bash
# Check all files now have the declaration
grep -l "export const dynamic" src/app/api/**/*.ts | wc -l
# Should show 104 (all files)

# Verify no duplicates
for file in src/app/api/**/*.ts; do
  count=$(grep -c "export const dynamic" "$file")
  if [ "$count" -gt 1 ]; then
    echo "DUPLICATE in $file"
  fi
done
```

