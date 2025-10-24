# 🔧 Subscriber Dashboard - Troubleshooting Guide

> **Diagnostic procedures and solutions for common issues**
> **Author**: Dr. Philipe Saraiva Cruz
> **Date**: 2025-10-23
> **Version**: 1.0.0

---

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Common Issues](#common-issues)
  - [Authentication Problems](#authentication-problems)
  - [Data Loading Issues](#data-loading-issues)
  - [Payment Integration](#payment-integration)
  - [Modal Issues](#modal-issues)
  - [Performance Problems](#performance-problems)
- [Error Messages](#error-messages)
- [Health Check Procedures](#health-check-procedures)
- [Development Debugging](#development-debugging)
- [Production Debugging](#production-debugging)

---

## Quick Diagnostics

### 🚨 Dashboard Not Loading

**Symptoms**: Blank screen, infinite loading, or error message.

**Quick Check**:
```bash
# 1. Check service status
systemctl status svlentes-nextjs

# 2. Check application health
curl https://svlentes.shop/api/health-check

# 3. View recent logs
journalctl -u svlentes-nextjs -n 50 --no-pager

# 4. Check database connection
docker exec -it postgres psql -U n8nuser -d n8ndb -c "SELECT 1"
```

**Common Causes**:
- Service not running → `systemctl restart svlentes-nextjs`
- Database offline → `docker compose up -d postgres`
- Firebase misconfigured → Check environment variables
- Network issues → Test with `curl localhost:5000`

---

### 🔐 Authentication Failures

**Symptoms**: "Token inválido", redirects to login, "UNAUTHORIZED" errors.

**Quick Check**:
```typescript
// In browser console
const auth = getAuth()
const user = auth.currentUser

if (user) {
  user.getIdToken().then(token => {
    console.log('Token:', token.substring(0, 20) + '...')
    console.log('UID:', user.uid)
  })
} else {
  console.log('No user authenticated')
}
```

**Common Causes**:
- Expired token → User will auto-refresh on next request
- Firebase Admin not configured → Check `FIREBASE_SERVICE_ACCOUNT`
- User not in database → Check Prisma User table
- Token verification failed → Verify Firebase project settings

---

### 📊 Subscription Data Not Showing

**Symptoms**: "Você ainda não possui uma assinatura ativa" when subscription exists.

**Quick Check**:
```bash
# Check database for active subscriptions
docker exec -it postgres psql -U n8nuser -d n8ndb -c \
  "SELECT id, status, \"planType\", \"userId\" FROM \"Subscription\" WHERE status = 'ACTIVE' LIMIT 10;"

# Check specific user subscription (replace with actual Firebase UID)
docker exec -it postgres psql -U n8nuser -d n8ndb -c \
  "SELECT s.* FROM \"Subscription\" s
   JOIN \"User\" u ON s.\"userId\" = u.id
   WHERE u.\"firebaseUid\" = 'YOUR_FIREBASE_UID'
   AND s.status = 'ACTIVE';"
```

**Common Causes**:
- User not linked to Firebase UID → Check `User.firebaseUid` field
- Subscription status not 'ACTIVE' → Update status in database
- API rate limiting → Wait 15 minutes and retry
- Incorrect query logic → Check API route code

---

## Common Issues

### Authentication Problems

#### Issue: "Firebase Admin não configurado"

**Error Message**:
```json
{
  "error": "SERVICE_UNAVAILABLE",
  "message": "Serviço de autenticação temporariamente indisponível"
}
```

**Diagnosis**:
```bash
# Check if Firebase service account file exists
ls -la /root/svlentes-hero-shop/firebase-service-account.json

# Check environment variable
grep FIREBASE_SERVICE_ACCOUNT /root/svlentes-hero-shop/.env.local

# Test Firebase Admin initialization
cd /root/svlentes-hero-shop
node -e "const admin = require('firebase-admin'); console.log('Admin SDK:', admin ? 'OK' : 'ERROR')"
```

**Solution**:
1. Ensure `firebase-service-account.json` exists in project root
2. Verify `FIREBASE_SERVICE_ACCOUNT` env var points to correct path
3. Restart Next.js service: `systemctl restart svlentes-nextjs`
4. Check Firebase console for project status

---

#### Issue: "Token inválido ou expirado"

**Error Message**:
```json
{
  "error": "UNAUTHORIZED",
  "message": "Token inválido ou expirado"
}
```

**Diagnosis**:
```typescript
// Client-side check
import { getAuth } from 'firebase/auth'

const auth = getAuth()
const user = auth.currentUser

if (user) {
  const token = await user.getIdToken(true) // Force refresh
  console.log('Token refreshed successfully')
} else {
  console.log('No user - redirect to login')
}
```

**Solution**:
1. **Client-side**: Call `user.getIdToken(true)` to force token refresh
2. **Clear cookies**: Delete all site cookies and re-authenticate
3. **Re-login**: Sign out and sign in again to get fresh token
4. **Check token expiry**: Firebase tokens expire after 1 hour

**Prevention**:
```typescript
// Implement automatic token refresh
useEffect(() => {
  const auth = getAuth()

  const unsubscribe = auth.onIdTokenChanged(async (user) => {
    if (user) {
      const token = await user.getIdToken()
      // Update token in API calls
    }
  })

  return () => unsubscribe()
}, [])
```

---

#### Issue: "Usuário não encontrado"

**Error Message**:
```json
{
  "error": "NOT_FOUND",
  "message": "Usuário não encontrado"
}
```

**Diagnosis**:
```sql
-- Check if user exists with Firebase UID
SELECT id, name, email, "firebaseUid", "createdAt"
FROM "User"
WHERE "firebaseUid" = 'ACTUAL_FIREBASE_UID';

-- List all users (for debugging)
SELECT id, name, email, "firebaseUid"
FROM "User"
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Solution**:
1. **User not registered**: Call `/api/assinante/register` to create user
2. **Firebase UID mismatch**: Update `firebaseUid` in database
3. **Case sensitivity**: Ensure exact UID match (case-sensitive)

**Registration Flow**:
```typescript
// Register new user after Firebase authentication
const registerUser = async (firebaseUser: FirebaseUser) => {
  const token = await firebaseUser.getIdToken()

  const response = await fetch('/api/assinante/register', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: firebaseUser.displayName,
      email: firebaseUser.email,
      phone: firebaseUser.phoneNumber
    })
  })

  if (!response.ok) {
    throw new Error('Registration failed')
  }

  return response.json()
}
```

---

### Data Loading Issues

#### Issue: Infinite loading spinner

**Symptoms**: Loading state never transitions to data display.

**Diagnosis**:
```typescript
// Add debug logging to hooks
export function useSubscription() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('[useSubscription] Starting fetch...')

    fetchSubscription()
      .then(data => {
        console.log('[useSubscription] Success:', data)
        setData(data)
      })
      .catch(err => {
        console.error('[useSubscription] Error:', err)
        setError(err.message)
      })
      .finally(() => {
        console.log('[useSubscription] Finished')
        setLoading(false)
      })
  }, [])

  return { data, loading, error }
}
```

**Common Causes**:
1. **API timeout**: Increase timeout or optimize query
2. **Missing error handling**: Always set `loading = false` in `finally`
3. **Dependency loop**: Check useEffect dependencies
4. **Network error**: API request failing silently

**Solution**:
```typescript
// Implement timeout and proper error handling
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server não respondeu')
    }

    throw error
  }
}
```

---

#### Issue: Stale data displayed

**Symptoms**: Dashboard shows old data even after updates.

**Diagnosis**:
```typescript
// Check cache headers in API response
const checkCacheHeaders = async () => {
  const response = await fetch('/api/assinante/subscription', {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  console.log('Cache-Control:', response.headers.get('Cache-Control'))
  console.log('ETag:', response.headers.get('ETag'))
  console.log('Last-Modified:', response.headers.get('Last-Modified'))
}
```

**Solution**:
1. **Force refresh**: Add `refetch()` function to component
2. **Disable cache**: Add `cache: 'no-store'` to fetch options
3. **Clear browser cache**: Hard reload with Ctrl+Shift+R
4. **SWR revalidation**: Use `mutate()` from SWR library

**Cache Busting**:
```typescript
const fetchSubscription = async (token: string) => {
  const response = await fetch('/api/assinante/subscription', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache'
    },
    cache: 'no-store'
  })

  return response.json()
}
```

---

### Payment Integration

#### Issue: Asaas webhook not received

**Symptoms**: Payment confirmed in Asaas dashboard but subscription status not updated.

**Diagnosis**:
```bash
# Check webhook logs
journalctl -u svlentes-nextjs | grep '/api/webhooks/asaas'

# Test webhook endpoint manually
curl -X POST https://svlentes.shop/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: YOUR_WEBHOOK_TOKEN" \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "payment": {
      "id": "pay_test123",
      "status": "RECEIVED",
      "value": 89.90
    }
  }'

# Check Nginx logs for webhook requests
tail -f /var/log/nginx/svlentes.shop.access.log | grep webhook
```

**Common Causes**:
1. **Webhook URL incorrect**: Verify in Asaas dashboard
2. **Token mismatch**: Check `ASAAS_WEBHOOK_TOKEN` env var
3. **Firewall blocking**: Ensure port 443 allows Asaas IPs
4. **SSL certificate issues**: Test with `curl -v`

**Solution**:
1. **Verify webhook URL** in Asaas dashboard: `https://svlentes.shop/api/webhooks/asaas`
2. **Check webhook token** matches environment variable
3. **Test locally** with ngrok tunnel for debugging
4. **Monitor logs** during payment flow

**Asaas Webhook Configuration**:
```
Dashboard → Configurações → Webhooks
URL: https://svlentes.shop/api/webhooks/asaas
Token: <ASAAS_WEBHOOK_TOKEN value>
Events: PAYMENT_RECEIVED, PAYMENT_CONFIRMED, PAYMENT_OVERDUE
```

---

#### Issue: Payment method update fails

**Symptoms**: "Erro ao atualizar forma de pagamento" message.

**Diagnosis**:
```bash
# Check API logs for payment update errors
journalctl -u svlentes-nextjs | grep 'update-payment' | tail -20

# Verify Asaas API connectivity
curl -X GET https://api.asaas.com/v3/customers \
  -H "access_token: $ASAAS_API_KEY_PROD"
```

**Solution**:
1. **Verify Asaas API key**: Check `ASAAS_API_KEY_PROD` is correct
2. **Check customer ID**: Ensure user has Asaas customer ID in database
3. **Validate card data**: Test with Asaas sandbox first
4. **Review error logs**: Check for specific Asaas error codes

---

### Modal Issues

#### Issue: Modal won't open

**Symptoms**: Button click doesn't open modal, no visual response.

**Diagnosis**:
```typescript
// Add debug logging to modal state
const [showModal, setShowModal] = useState(false)

const openModal = () => {
  console.log('[Modal] Opening...')
  setShowModal(true)
  console.log('[Modal] State:', showModal) // May still be false (async update)
}

// Check modal component rendering
useEffect(() => {
  console.log('[Modal] isOpen changed:', showModal)
}, [showModal])
```

**Common Causes**:
1. **State not updating**: Check `setShowModal` is called
2. **Z-index conflict**: Modal hidden behind other elements
3. **Portal not rendered**: Check `document.body` for modal portal
4. **Conditional rendering**: Modal component not in DOM

**Solution**:
```typescript
// Proper modal state management
const [modalState, setModalState] = useState({
  orders: false,
  invoices: false,
  changePlan: false
})

const openModal = (modalName: keyof typeof modalState) => {
  setModalState(prev => ({
    ...prev,
    [modalName]: true
  }))
}

const closeModal = (modalName: keyof typeof modalState) => {
  setModalState(prev => ({
    ...prev,
    [modalName]: false
  }))
}

// Render modals
<OrdersModal
  isOpen={modalState.orders}
  onClose={() => closeModal('orders')}
/>
```

---

#### Issue: Modal won't close

**Symptoms**: Clicking backdrop or close button doesn't close modal.

**Diagnosis**:
```typescript
// Test close handler
const handleClose = () => {
  console.log('[Modal] Close requested')
  onClose()
  console.log('[Modal] onClose called')
}

// Check for event propagation issues
const handleBackdropClick = (e: React.MouseEvent) => {
  console.log('[Modal] Backdrop clicked')
  console.log('[Modal] Target:', e.target)
  console.log('[Modal] CurrentTarget:', e.currentTarget)

  if (e.target === e.currentTarget) {
    handleClose()
  }
}
```

**Common Causes**:
1. **Event propagation**: Child elements blocking click
2. **State not updating**: `onClose` not calling `setIsOpen(false)`
3. **Multiple modals**: Competing state management
4. **Async state update**: State update not synchronous

**Solution**:
```typescript
// Proper backdrop click handling
const Modal = ({ isOpen, onClose, children }) => {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking backdrop itself
    if (e.target === e.currentTarget) {
      e.stopPropagation()
      onClose()
    }
  }

  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      return () => document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div className="modal-content">
        {children}
      </div>
    </div>
  )
}
```

---

### Performance Problems

#### Issue: Slow page load

**Symptoms**: Dashboard takes >3 seconds to load.

**Diagnosis**:
```typescript
// Add performance markers
const DashboardPage = () => {
  useEffect(() => {
    performance.mark('dashboard-start')

    return () => {
      performance.mark('dashboard-end')
      performance.measure('dashboard-load', 'dashboard-start', 'dashboard-end')

      const measure = performance.getEntriesByName('dashboard-load')[0]
      console.log('[Performance] Dashboard load time:', measure.duration, 'ms')
    }
  }, [])

  // Component code
}

// Check API response times
const fetchSubscription = async () => {
  const startTime = Date.now()

  const data = await fetch('/api/assinante/subscription')

  const endTime = Date.now()
  console.log('[API] Subscription fetch time:', endTime - startTime, 'ms')

  return data.json()
}
```

**Common Causes**:
1. **Large bundle size**: Check Next.js build output
2. **Slow API queries**: Database not indexed properly
3. **Unoptimized images**: Missing Next.js Image optimization
4. **Too many re-renders**: Inefficient state management

**Solution**:
```bash
# 1. Analyze bundle size
cd /root/svlentes-hero-shop
npm run build
# Check output for large chunks

# 2. Check database indexes
docker exec -it postgres psql -U n8nuser -d n8ndb -c \
  "SELECT * FROM pg_indexes WHERE tablename = 'Subscription';"

# 3. Add missing indexes
docker exec -it postgres psql -U n8nuser -d n8ndb -c \
  "CREATE INDEX IF NOT EXISTS idx_subscription_user_id ON \"Subscription\"(\"userId\");
   CREATE INDEX IF NOT EXISTS idx_user_firebase_uid ON \"User\"(\"firebaseUid\");"

# 4. Enable Prisma query logging
# In .env: DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=10"
```

**Code Optimization**:
```typescript
// Memoize expensive computations
const benefitsSummary = useMemo(() => {
  return subscription.benefits.reduce((acc, benefit) => {
    acc.total += benefit.quantityTotal
    acc.used += benefit.quantityUsed
    return acc
  }, { total: 0, used: 0 })
}, [subscription.benefits])

// Lazy load heavy components
const InvoicesModal = dynamic(
  () => import('@/components/assinante/InvoicesModal'),
  { ssr: false }
)
```

---

#### Issue: High memory usage

**Symptoms**: Browser tab crashes, "Out of memory" errors.

**Diagnosis**:
```typescript
// Monitor component renders
useEffect(() => {
  console.log('[Component] Rendered at', new Date().toISOString())
}, []) // Empty deps = log only on mount

// Check for memory leaks
useEffect(() => {
  const interval = setInterval(() => {
    console.log('[Memory] Used:', performance.memory?.usedJSHeapSize)
  }, 5000)

  return () => clearInterval(interval) // Cleanup!
}, [])
```

**Common Causes**:
1. **Memory leaks**: Missing cleanup in useEffect
2. **Large state objects**: Storing too much data
3. **Event listeners**: Not removing listeners on unmount
4. **Infinite loops**: Dependency array issues

**Solution**:
```typescript
// Proper cleanup
useEffect(() => {
  const subscription = api.subscribe(data => {
    setData(data)
  })

  return () => {
    subscription.unsubscribe() // Always cleanup!
  }
}, [])

// Limit data in state
const [recentOrders, setRecentOrders] = useState([])

useEffect(() => {
  fetchOrders().then(orders => {
    // Only keep last 10 orders in memory
    setRecentOrders(orders.slice(0, 10))
  })
}, [])
```

---

## Error Messages

### API Error Codes

| Error Code | HTTP Status | Meaning | User Action |
|-----------|-------------|---------|-------------|
| `UNAUTHORIZED` | 401 | Invalid/missing auth token | Re-login |
| `FORBIDDEN` | 403 | Insufficient permissions | Contact support |
| `NOT_FOUND` | 404 | Resource doesn't exist | Verify data exists |
| `VALIDATION_ERROR` | 400 | Invalid input data | Fix form data |
| `CONFLICT` | 409 | Resource state conflict | Retry operation |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Wait and retry |
| `INTERNAL_ERROR` | 500 | Server error | Retry or contact support |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily down | Wait and retry |

### User-Friendly Error Messages

**Mapping**:
```typescript
const errorMessages = {
  UNAUTHORIZED: 'Sua sessão expirou. Por favor, faça login novamente.',
  NOT_FOUND: 'Dados não encontrados. Verifique se você possui uma assinatura ativa.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos e tente novamente.',
  RATE_LIMIT_EXCEEDED: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  INTERNAL_ERROR: 'Erro interno. Nossa equipe foi notificada. Tente novamente em alguns minutos.',
  SERVICE_UNAVAILABLE: 'Serviço temporariamente indisponível. Tente novamente em breve.'
}

const getUserFriendlyError = (apiError: string): string => {
  return errorMessages[apiError] || 'Erro desconhecido. Contate o suporte.'
}
```

---

## Health Check Procedures

### Application Health

```bash
# 1. Check Next.js service
systemctl is-active svlentes-nextjs
# Expected: "active"

# 2. Check HTTP response
curl -f http://localhost:5000/api/health-check
# Expected: {"status":"ok","timestamp":"..."}

# 3. Check HTTPS through Nginx
curl -f https://svlentes.shop/api/health-check
# Expected: {"status":"ok","timestamp":"..."}

# 4. View recent errors
journalctl -u svlentes-nextjs -p err -n 20 --no-pager
```

### Database Health

```bash
# 1. Check PostgreSQL container
docker ps | grep postgres
# Expected: Container running

# 2. Test connection
docker exec -it postgres psql -U n8nuser -d n8ndb -c "SELECT NOW();"
# Expected: Current timestamp

# 3. Check database size
docker exec -it postgres psql -U n8nuser -d n8ndb -c \
  "SELECT pg_size_pretty(pg_database_size('n8ndb'));"

# 4. Check table row counts
docker exec -it postgres psql -U n8nuser -d n8ndb -c \
  "SELECT 'User' as table, COUNT(*) FROM \"User\"
   UNION ALL
   SELECT 'Subscription', COUNT(*) FROM \"Subscription\"
   UNION ALL
   SELECT 'Order', COUNT(*) FROM \"Order\";"
```

### Firebase Health

```bash
# Test Firebase Admin initialization
cd /root/svlentes-hero-shop
node << 'EOF'
const admin = require('firebase-admin')
const serviceAccount = require('./firebase-service-account.json')

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })

  console.log('✅ Firebase Admin initialized successfully')
  console.log('Project ID:', serviceAccount.project_id)
} catch (error) {
  console.error('❌ Firebase Admin failed:', error.message)
}
EOF
```

### Full System Check

```bash
#!/bin/bash
# save as: /root/svlentes-hero-shop/scripts/health-check.sh

echo "🔍 SV Lentes Health Check - $(date)"
echo "===================================="

# 1. Next.js Service
echo -n "Next.js Service: "
systemctl is-active svlentes-nextjs || echo "❌ NOT RUNNING"

# 2. Database
echo -n "PostgreSQL: "
docker exec postgres psql -U n8nuser -d n8ndb -c "SELECT 1" > /dev/null 2>&1 && echo "✅ OK" || echo "❌ ERROR"

# 3. HTTP endpoint
echo -n "HTTP Endpoint: "
curl -sf http://localhost:5000/api/health-check > /dev/null && echo "✅ OK" || echo "❌ ERROR"

# 4. HTTPS endpoint
echo -n "HTTPS Endpoint: "
curl -sf https://svlentes.shop/api/health-check > /dev/null && echo "✅ OK" || echo "❌ ERROR"

# 5. Nginx
echo -n "Nginx: "
systemctl is-active nginx || echo "❌ NOT RUNNING"

# 6. SSL Certificate
echo -n "SSL Certificate: "
certbot certificates 2>/dev/null | grep -q "svlentes.shop" && echo "✅ OK" || echo "❌ ERROR"

echo "===================================="
echo "✅ Health check complete"
```

---

## Development Debugging

### Enable Verbose Logging

```typescript
// In .env.local
NEXT_PUBLIC_DEBUG=true
LOG_LEVEL=debug

// In code
if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
  console.log('[DEBUG]', ...args)
}
```

### React DevTools

```bash
# Install React DevTools browser extension
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/

# Enable in development
# Inspect component props, state, hooks
# Profile component renders
```

### Network Debugging

```typescript
// Log all fetch requests
const originalFetch = window.fetch

window.fetch = async (...args) => {
  console.log('[Fetch]', args[0])

  const response = await originalFetch(...args)

  console.log('[Response]', response.status, response.statusText)

  return response
}
```

---

## Production Debugging

### Server-Side Errors

```bash
# View live logs
journalctl -u svlentes-nextjs -f

# Filter by error level
journalctl -u svlentes-nextjs -p err -n 50

# Search for specific error
journalctl -u svlentes-nextjs | grep "UNAUTHORIZED"

# View logs for specific time period
journalctl -u svlentes-nextjs --since "1 hour ago"
```

### Client-Side Errors

```typescript
// Add global error handler
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error)

  // Send to monitoring service
  fetch('/api/monitoring/errors', {
    method: 'POST',
    body: JSON.stringify({
      message: event.error.message,
      stack: event.error.stack,
      url: window.location.href,
      timestamp: new Date().toISOString()
    })
  })
})

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise]', event.reason)
})
```

---

## FAQ for Developers

### Q: How do I test webhook locally?

**A**: Use ngrok to expose localhost:

```bash
# 1. Install ngrok
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/

# 2. Start tunnel
ngrok http 3000

# 3. Use ngrok URL in Asaas webhook settings
# Example: https://abc123.ngrok.io/api/webhooks/asaas
```

### Q: How do I reset database for testing?

**A**: Use Prisma reset (⚠️ **DESTRUCTIVE**):

```bash
cd /root/svlentes-hero-shop

# Reset database (deletes all data!)
npx prisma migrate reset

# Re-seed with test data
npm run db:seed
```

### Q: How do I debug authentication flow?

**A**: Add extensive logging:

```typescript
// In useAuth hook
export function useAuth() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[Auth] State changed:', firebaseUser?.uid || 'null')

      if (firebaseUser) {
        const token = await firebaseUser.getIdToken()
        console.log('[Auth] Token obtained:', token.substring(0, 20) + '...')

        // Test token with API
        const response = await fetch('/api/assinante/subscription', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        console.log('[Auth] API response:', response.status)
      } else {
        console.log('[Auth] No user authenticated')
      }
    })

    return unsubscribe
  }, [])
}
```

---

## Support Escalation

If issue persists after following this guide:

1. **Collect diagnostic data**:
   - Error messages (exact text)
   - Browser console logs
   - Server logs (`journalctl`)
   - Steps to reproduce
   - Expected vs actual behavior

2. **Create issue report**:
   ```markdown
   ## Issue Description
   [Brief description]

   ## Environment
   - Browser: Chrome 120
   - OS: Ubuntu 22.04
   - User: [Firebase UID]

   ## Steps to Reproduce
   1. Login to dashboard
   2. Click "Ver Pedidos"
   3. Modal doesn't open

   ## Logs
   ```
   [Paste relevant logs]
   ```

   ## Screenshots
   [Attach if applicable]
   ```

3. **Contact support**:
   - Email: saraivavision@gmail.com
   - WhatsApp: (33) 98606-1427
   - Include diagnostic data

---

---

## Phase 2 Troubleshooting

### Real-Time Delivery Status

#### Issue: Status not auto-refreshing

**Symptoms**: Delivery status remains static, no updates after 5 minutes.

**Diagnosis**:
```typescript
// Check if interval is running
useEffect(() => {
  console.log('[DeliveryStatus] Mounted, starting auto-refresh')

  const interval = setInterval(() => {
    console.log('[DeliveryStatus] Auto-refresh triggered')
    fetchDeliveryStatus()
  }, 300000)

  return () => {
    console.log('[DeliveryStatus] Cleanup, clearing interval')
    clearInterval(interval)
  }
}, [])
```

**Common Causes**:
1. **Tab inactive**: Browser throttles timers for hidden tabs
2. **Component unmounting**: Interval cleared too early
3. **Memory leak**: Multiple intervals running

**Solution**:
```typescript
// Respect page visibility
useEffect(() => {
  let interval: NodeJS.Timeout | null = null

  const startRefresh = () => {
    if (interval) clearInterval(interval)

    interval = setInterval(() => {
      if (!document.hidden) {
        fetchDeliveryStatus()
      }
    }, 300000)
  }

  const handleVisibilityChange = () => {
    if (document.hidden) {
      if (interval) clearInterval(interval)
    } else {
      startRefresh()
      fetchDeliveryStatus() // Immediate refresh when tab becomes visible
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  startRefresh()

  return () => {
    if (interval) clearInterval(interval)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}, [])
```

---

#### Issue: Progress bar stuck at 0%

**Symptoms**: Visual progress indicator shows 0% despite delivery data.

**Diagnosis**:
```typescript
// Check delivery data structure
console.log('Delivery data:', currentDelivery)
console.log('Progress:', currentDelivery?.progress)
console.log('Percentage:', currentDelivery?.progress?.percentage)
```

**Solution**:
```typescript
// Ensure progress data exists with fallback
const progress = currentDelivery?.progress || {
  percentage: 0,
  currentStep: 0,
  totalSteps: 4,
  steps: []
}

<progress
  value={progress.percentage}
  max={100}
  aria-valuenow={progress.percentage}
  aria-valuemin={0}
  aria-valuemax={100}
>
  {progress.percentage}%
</progress>
```

---

### Floating WhatsApp Button

#### Issue: Button not visible

**Symptoms**: WhatsApp button missing from dashboard.

**Diagnosis**:
```bash
# Check component rendering
# In browser console:
document.querySelector('[aria-label*="WhatsApp"]')
# Should return: <button>...</button>

# Check z-index
const button = document.querySelector('[aria-label*="WhatsApp"]')
console.log(window.getComputedStyle(button).zIndex)
# Expected: 50 or higher
```

**Common Causes**:
1. **Low z-index**: Button behind other elements
2. **CSS conflict**: Tailwind class override
3. **Conditional rendering**: Component not mounting
4. **Mobile viewport**: Wrong positioning class

**Solution**:
```tsx
// Ensure high z-index and proper positioning
<button
  className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6"
  style={{ zIndex: 9999 }} // Inline style as failsafe
  aria-label="Contatar suporte via WhatsApp"
>
  <MessageCircle className="h-6 w-6" />
</button>
```

---

#### Issue: WhatsApp link opens but message not pre-filled

**Symptoms**: WhatsApp opens with blank message instead of context.

**Diagnosis**:
```typescript
// Log generated link
const handleClick = async () => {
  const link = await generateWhatsAppLink(context, userData)

  console.log('WhatsApp Link:', link)
  console.log('Decoded message:', decodeURIComponent(link.split('text=')[1]))

  window.open(link, '_blank')
}
```

**Common Causes**:
1. **Message too long**: URL exceeds 2000 chars
2. **Encoding issue**: Special characters not properly encoded
3. **WhatsApp version**: Old app version doesn't support pre-fill

**Solution**:
```typescript
// Truncate and properly encode message
const generateWhatsAppLink = (phoneNumber: string, message: string) => {
  // Truncate if too long
  const truncatedMessage = message.length > 1500
    ? message.substring(0, 1500) + '\n\n[mensagem truncada]'
    : message

  // Proper encoding
  const encodedMessage = encodeURIComponent(truncatedMessage)

  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`
}
```

---

### Contextual Quick Actions

#### Issue: No actions displayed

**Symptoms**: Quick actions section empty or shows "Nenhuma ação disponível".

**Diagnosis**:
```typescript
// Check API response
const { actions, context } = await fetchContextualActions(token)

console.log('Actions received:', actions)
console.log('Actions count:', actions.length)
console.log('Context:', context)

if (actions.length === 0) {
  console.log('Subscription status:', context.subscriptionStatus)
  console.log('Has active delivery:', context.hasActiveDelivery)
  console.log('Days until renewal:', context.daysUntilRenewal)
}
```

**Common Causes**:
1. **Subscription inactive**: No actions for cancelled subscriptions
2. **API filtering**: All actions filtered out by priority
3. **Data missing**: Required subscription data not available

**Solution**:
```typescript
// Provide fallback actions
const defaultActions: ContextualAction[] = [
  {
    id: 'contact_support',
    label: 'Falar com Suporte',
    description: 'Tire suas dúvidas conosco',
    icon: 'message-circle',
    priority: 'medium',
    actionType: 'whatsapp',
    actionData: { context: 'support' }
  },
  {
    id: 'view_subscription',
    label: 'Ver Assinatura',
    description: 'Detalhes da sua assinatura',
    icon: 'file-text',
    priority: 'low',
    actionType: 'modal',
    actionData: { modalType: 'subscription_details' }
  }
]

const displayActions = actions.length > 0 ? actions : defaultActions
```

---

#### Issue: Actions not updating after subscription change

**Symptoms**: Quick actions remain static after updating subscription.

**Diagnosis**:
```typescript
// Check if refetch is triggered
const { refetch } = useSubscription()

console.log('Subscription updated')
await refetch()
console.log('Actions should update now')
```

**Solution**:
```typescript
// Trigger actions refetch after subscription update
const updateSubscription = async (newData) => {
  await updateSubscriptionAPI(newData)

  // Refetch subscription
  await refetchSubscription()

  // Refetch contextual actions
  await refetchActions()

  toast.success('Assinatura atualizada com sucesso!')
}
```

---

### WhatsApp Redirect API

#### Issue: 404 Error on /api/whatsapp-redirect

**Symptoms**: "Not Found" error when calling WhatsApp redirect endpoint.

**Diagnosis**:
```bash
# Test endpoint existence
curl -I https://svlentes.shop/api/whatsapp-redirect

# Expected: 200 OK or 405 Method Not Allowed
# If 404: Route file missing or not deployed
```

**Solution**:
```bash
# 1. Verify file exists
ls -la /root/svlentes-hero-shop/src/app/api/whatsapp-redirect/route.ts

# 2. Check Next.js build
cd /root/svlentes-hero-shop
npm run build

# 3. Restart service
systemctl restart svlentes-nextjs

# 4. Verify deployment
curl https://svlentes.shop/api/whatsapp-redirect?context=support
```

---

#### Issue: Context validation error

**Symptoms**: "Contexto inválido" error message.

**Diagnosis**:
```typescript
// Check allowed contexts
const allowedContexts = [
  'hero', 'pricing', 'consultation', 'support',
  'calculator', 'emergency', 'renewal', 'delivery', 'payment'
]

console.log('Provided context:', context)
console.log('Is valid:', allowedContexts.includes(context))
```

**Solution**:
```typescript
// Use valid context or fallback
const validatedContext = allowedContexts.includes(context)
  ? context
  : 'support'

const link = await generateWhatsAppLink(validatedContext, userData)
```

---

## Quick Diagnostic Commands

### Check All Phase 2 Features

```bash
#!/bin/bash
# Phase 2 health check script

echo "🔍 Phase 2 Feature Check"
echo "========================"

# 1. Delivery Status API
echo -n "Delivery Status API: "
curl -sf https://svlentes.shop/api/assinante/delivery-status \
  -H "Authorization: Bearer TEST" > /dev/null 2>&1 && echo "✅ OK" || echo "❌ ERROR"

# 2. Contextual Actions API
echo -n "Contextual Actions API: "
curl -sf https://svlentes.shop/api/assinante/contextual-actions \
  -H "Authorization: Bearer TEST" > /dev/null 2>&1 && echo "✅ OK" || echo "❌ ERROR"

# 3. WhatsApp Redirect API
echo -n "WhatsApp Redirect API: "
curl -sf "https://svlentes.shop/api/whatsapp-redirect?context=support" > /dev/null 2>&1 \
  && echo "✅ OK" || echo "❌ ERROR"

# 4. Component Files
echo -n "RealTimeDeliveryStatus: "
[ -f /root/svlentes-hero-shop/src/components/assinante/RealTimeDeliveryStatus.tsx ] \
  && echo "✅ OK" || echo "❌ MISSING"

echo -n "FloatingWhatsAppButton: "
[ -f /root/svlentes-hero-shop/src/components/assinante/FloatingWhatsAppButton.tsx ] \
  && echo "✅ OK" || echo "❌ MISSING"

echo -n "ContextualQuickActions: "
[ -f /root/svlentes-hero-shop/src/components/assinante/ContextualQuickActions.tsx ] \
  && echo "✅ OK" || echo "❌ MISSING"

echo "========================"
```

---

## Phase 3 - Troubleshooting

### Prescription Management Issues

#### "Upload de Prescrição Falha"

**Sintomas**: Upload não completa, fica em loading infinito, ou erro retornado.

**Diagnóstico**:
```bash
# 1. Check file size
ls -lh prescription.pdf
# Should be < 5MB (5242880 bytes)

# 2. Check file format
file prescription.pdf
# Should be: PDF, JPEG, or PNG

# 3. View recent upload logs
journalctl -u svlentes-nextjs | grep -i prescription | tail -20

# 4. Check database for recent uploads
docker exec -it postgres psql -U n8nuser -d n8ndb -c \
  "SELECT * FROM \"Prescription\"
   WHERE \"userId\" = 'usr_abc123'
   ORDER BY \"createdAt\" DESC LIMIT 5;"

# 5. Check storage space
df -h
# Ensure sufficient space in /root/svlentes-hero-shop/storage/
```

**Possíveis Causas**:
1. **Arquivo > 5MB**: Compressão necessária
2. **Formato não suportado**: Apenas PDF, JPG, PNG aceitos
3. **Network timeout**: Upload interrompido
4. **Storage service offline**: S3 ou filesystem indisponível
5. **Malware detected**: Arquivo rejeitado por segurança
6. **Rate limit exceeded**: Mais de 10 uploads/hora

**Soluções**:

**1. Comprimir arquivo grande**:
```bash
# Para imagens JPG/PNG
convert large-prescription.jpg -quality 85 -resize 1600x1600\> prescription.jpg

# Para PDF
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook \
   -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=compressed.pdf original.pdf

# Verificar tamanho resultante
ls -lh prescription.jpg compressed.pdf
```

**2. Converter formato**:
```bash
# JPG/PNG para PDF
convert prescription.jpg prescription.pdf

# Verificar formato
file prescription.pdf
```

**3. Aumentar timeout (Next.js config)**:
```javascript
// next.config.js
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb'
    },
    responseLimit: false,
    timeout: 60000 // 60 seconds
  }
}
```

**4. Verificar storage**:
```bash
# Check local storage
ls -la /root/svlentes-hero-shop/storage/prescriptions/

# Check permissions
chmod -R 755 /root/svlentes-hero-shop/storage/

# Check S3 connectivity (if using)
aws s3 ls s3://your-bucket/prescriptions/ || echo "S3 unavailable"
```

**5. Clear rate limit**:
```bash
# Reset rate limit in Redis (if using)
redis-cli DEL "ratelimit:prescription_upload:usr_abc123"

# Or wait 60 minutes for automatic reset
```

---

#### "Prescrição Não Aparece Após Upload"

**Sintomas**: Upload completa (status 201) mas prescrição não aparece na lista ou em "Current Prescription".

**Diagnóstico**:
```bash
# 1. Verify prescription in database
docker exec -it postgres psql -U n8nuser -d n8ndb -c \
  "SELECT id, status, \"fileUrl\", \"createdAt\"
   FROM \"Prescription\"
   WHERE \"userId\" = 'usr_abc123'
   ORDER BY \"createdAt\" DESC LIMIT 1;"

# 2. Check if file exists
ls -la /root/svlentes-hero-shop/storage/prescriptions/usr_abc123/

# 3. View API logs for prescription GET
journalctl -u svlentes-nextjs | grep "GET.*prescription" | tail -10

# 4. Check cache status
curl -I https://svlentes.shop/api/assinante/prescription \
  -H "Authorization: Bearer ${TOKEN}"
# Look for Cache-Control headers
```

**Possíveis Causas**:
1. **Cache desatualizado**: Browser ou API cache não invalidado
2. **Database replication lag**: Prescrição ainda não replicada
3. **Prescrição inválida**: Status marcado como EXPIRED ou INVALID
4. **Query incorreta**: API não retornando prescrição corretamente

**Soluções**:

**1. Clear cache**:
```bash
# Client-side (browser console)
localStorage.clear()
sessionStorage.clear()
location.reload(true) // Hard reload

# Server-side cache (if using Redis)
redis-cli FLUSHDB
```

**2. Aguardar replication lag**:
```bash
# Check replication status
docker exec -it postgres psql -U n8nuser -d n8ndb -c \
  "SELECT NOW() - pg_last_xact_replay_timestamp() AS replication_lag;"

# If lag > 30 seconds, investigate replication issues
# Otherwise, wait 30-60 seconds and refresh
```

**3. Verificar status da prescrição**:
```sql
-- Update status if incorrectly marked
UPDATE "Prescription"
SET status = 'VALID'
WHERE id = 'prx_abc123' AND status != 'VALID';

-- Recalculate expiry if needed
UPDATE "Prescription"
SET "expiryDate" = "issueDate" + INTERVAL '1 year'
WHERE id = 'prx_abc123';
```

**4. Invalidate SWR cache (React)**:
```typescript
// In component
import { mutate } from 'swr'

// Force revalidation
mutate('/api/assinante/prescription')

// Or trigger manual refetch
const { data, error, mutate: refetch } = useSWR('/api/assinante/prescription')
refetch()
```

---

#### "Alerta de Expiração Não Aparece"

**Sintomas**: Prescrição expira em menos de 30 dias mas alerta não é exibido.

**Diagnóstico**:
```bash
# Check prescription expiry
docker exec -it postgres psql -U n8nuser -d n8ndb -c \
  "SELECT
     id,
     \"expiryDate\",
     EXTRACT(DAY FROM (\"expiryDate\" - NOW())) as days_until_expiry
   FROM \"Prescription\"
   WHERE \"userId\" = 'usr_abc123' AND status = 'VALID';"

# Should return days_until_expiry < 30
```

**Possíveis Causas**:
1. **daysUntilExpiry > 30**: Prescrição ainda não dentro do período de alerta
2. **Component not rendering**: Alerta não incluído no render condicional
3. **Notification dismissed**: Usuário já dispensou o alerta

**Soluções**:

**1. Verify calculation**:
```typescript
// Check calculation in browser console
const prescription = { expiryDate: '2025-11-15T00:00:00.000Z' }
const daysUntilExpiry = Math.ceil(
  (new Date(prescription.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
)
console.log('Days until expiry:', daysUntilExpiry)
// Should be < 30 for alert to show
```

**2. Force alert display**:
```typescript
// Temporarily override threshold for testing
{prescription?.daysUntilExpiry < 60 && (
  <ExpiryAlert prescription={prescription} />
)}
```

**3. Check dismissed state**:
```typescript
// Clear dismissed alerts from localStorage
localStorage.removeItem('dismissedAlerts')
```

---

### Payment History Issues

#### "Pagamentos Não Carregam"

**Sintomas**: Tabela vazia, loading infinito, ou erro "Failed to fetch".

**Diagnóstico**:
```bash
# 1. Test endpoint manually
curl -X GET "https://svlentes.shop/api/assinante/payment-history" \
  -H "Authorization: Bearer ${TOKEN}" \
  | jq

# 2. Check database for payments
docker exec -it postgres psql -U n8nuser -d n8ndb -c \
  "SELECT COUNT(*) as total_payments
   FROM \"Payment\" p
   JOIN \"Subscription\" s ON p.\"subscriptionId\" = s.id
   WHERE s.\"userId\" = 'usr_abc123';"

# 3. Check Asaas integration
journalctl -u svlentes-nextjs | grep -i asaas | tail -20

# 4. View API errors
journalctl -u svlentes-nextjs | grep "payment-history" | grep ERROR
```

**Possíveis Causas**:
1. **API timeout**: Query muito lenta ou timeout configurado muito baixo
2. **Circuit breaker aberto**: Muitas falhas consecutivas
3. **Database query slow**: Faltam índices ou query ineficiente
4. **Filtros muito restritivos**: Nenhum pagamento corresponde aos filtros
5. **Asaas API down**: Integração com Asaas indisponível

**Soluções**:

**1. Aumentar timeout**:
```typescript
// In fetch call
const response = await fetch('/api/assinante/payment-history', {
  headers: { 'Authorization': `Bearer ${token}` },
  signal: AbortSignal.timeout(30000) // 30 seconds
})
```

**2. Reset circuit breaker**:
```bash
# If using circuit breaker library
curl -X POST https://svlentes.shop/api/monitoring/circuit-breaker/reset \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"

# Or wait 60 seconds for auto-recovery
```

**3. Optimize database query**:
```sql
-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_payment_subscription_id ON "Payment"("subscriptionId");
CREATE INDEX IF NOT EXISTS idx_payment_status ON "Payment"(status);
CREATE INDEX IF NOT EXISTS idx_payment_due_date ON "Payment"("dueDate");

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM "Payment" p
JOIN "Subscription" s ON p."subscriptionId" = s.id
WHERE s."userId" = 'usr_abc123'
ORDER BY p."dueDate" DESC
LIMIT 20;
```

**4. Limpar filtros**:
```typescript
// Reset all filters to default
setFilters({
  page: 1,
  limit: 20,
  sortBy: 'dueDate',
  sortOrder: 'desc'
})
```

**5. Check Asaas API status**:
```bash
# Test Asaas connectivity
curl -I https://api.asaas.com/v3/payments \
  -H "access_token: ${ASAAS_API_KEY_PROD}"

# If 5xx error, use cached data
# Add fallback in API:
const cachedPayments = await redis.get(`payments:${userId}`)
if (asaasDown && cachedPayments) {
  return JSON.parse(cachedPayments)
}
```

---

#### "Summary Cards Mostram Valores Errados"

**Sintomas**: Total Pago, Pendente, ou Pontualidade incorretos.

**Diagnóstico**:
```bash
# Verify calculations manually
docker exec -it postgres psql -U n8nuser -d n8ndb

# Total Paid
SELECT SUM(amount) as total_paid
FROM "Payment" p
JOIN "Subscription" s ON p."subscriptionId" = s.id
WHERE s."userId" = 'usr_abc123' AND p.status = 'PAID';

# Total Pending
SELECT SUM(amount) as total_pending
FROM "Payment" p
JOIN "Subscription" s ON p."subscriptionId" = s.id
WHERE s."userId" = 'usr_abc123' AND p.status = 'PENDING';

# On-Time Rate
SELECT
  COUNT(*) FILTER (WHERE "paidAt" <= "dueDate") as on_time,
  COUNT(*) as total,
  (COUNT(*) FILTER (WHERE "paidAt" <= "dueDate")::float / COUNT(*)) * 100 as rate
FROM "Payment" p
JOIN "Subscription" s ON p."subscriptionId" = s.id
WHERE s."userId" = 'usr_abc123' AND p.status = 'PAID';
```

**Possíveis Causas**:
1. **Cache desatualizado**: Summary calculado com dados antigos
2. **Calculation error**: Lógica de cálculo incorreta
3. **Filtros aplicados**: Summary calculado apenas com registros filtrados
4. **Timezone issues**: paidAt vs dueDate em timezones diferentes

**Soluções**:

**1. Invalidate cache**:
```bash
# Clear payment summary cache
redis-cli DEL "payment_summary:usr_abc123"

# Or in API, reduce cache TTL
const summary = await cache.get('payment_summary', {
  ttl: 60 // 1 minute instead of 2
})
```

**2. Fix calculation logic**:
```typescript
// Ensure correct status filtering
const totalPaid = payments
  .filter(p => p.status === 'PAID')
  .reduce((sum, p) => sum + p.amount, 0)

// Not just truthy check
const totalPending = payments
  .filter(p => p.status === 'PENDING') // Explicit check
  .reduce((sum, p) => sum + p.amount, 0)
```

**3. Calculate before filtering**:
```typescript
// Calculate summary from ALL payments, then apply filters for table
const allPayments = await fetchAllPayments(userId)
const summary = calculateSummary(allPayments)

const filteredPayments = applyFilters(allPayments, filters)

return { payments: filteredPayments, summary }
```

**4. Normalize timezones**:
```typescript
// Convert all dates to UTC for comparison
const onTime = payments.filter(p => {
  const paidAtUTC = new Date(p.paidAt).toISOString()
  const dueDateUTC = new Date(p.dueDate).toISOString()
  return paidAtUTC <= dueDateUTC
})
```

---

### Delivery Preferences Issues

#### "CEP Não Encontrado"

**Sintomas**: Busca de CEP retorna erro "CEP não encontrado" ou timeout.

**Diagnóstico**:
```bash
# 1. Test ViaCEP API directly
curl https://viacep.com.br/ws/35300000/json/
# Should return JSON with address

# 2. Test with user's CEP
curl https://viacep.com.br/ws/12345678/json/
# Check if valid response

# 3. Check network connectivity
ping viacep.com.br

# 4. View ViaCEP integration logs
journalctl -u svlentes-nextjs | grep -i viacep | tail -20
```

**Possíveis Causas**:
1. **CEP digitado errado**: Typo ou formato incorreto
2. **ViaCEP API offline**: Serviço temporariamente indisponível
3. **CEP não existe**: CEP válido mas não cadastrado
4. **Network timeout**: Conexão lenta ou bloqueada
5. **Rural area**: CEP de área rural pode não estar no sistema

**Soluções**:

**1. Validar formato**:
```typescript
// CEP format validation
const validateCEPFormat = (cep: string): boolean => {
  const cleanCEP = cep.replace(/\D/g, '')
  return cleanCEP.length === 8 && /^\d{8}$/.test(cleanCEP)
}

// Examples
validateCEPFormat('12345-678') // true
validateCEPFormat('12345678')  // true
validateCEPFormat('1234567')   // false
```

**2. Usar CEP alternativo**:
```bash
# Se CEP exato não existe, usar CEP da rua ou bairro
# Example: 35300-000 (genérico) instead of 35300-123 (específico)

# Test with generic CEP
curl https://viacep.com.br/ws/35300000/json/
```

**3. Enable manual entry**:
```typescript
// Show manual entry form if ViaCEP fails
const handleCEPError = (error: Error) => {
  toast.error('CEP não encontrado. Preencha manualmente.')
  setManualEntry(true) // Enable all address fields
}
```

**4. Implement retry logic**:
```typescript
async function fetchCEPWithRetry(cep: string, retries = 3): Promise<CEPData> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchCEP(cep)
    } catch (error) {
      if (i === retries - 1) throw error
      await sleep(1000 * (i + 1)) // Exponential backoff
    }
  }
}
```

**5. Check ViaCEP status**:
```bash
# Check ViaCEP website status
curl -I https://viacep.com.br

# If 5xx or timeout, show message:
# "Serviço de CEP temporariamente indisponível. Preencha manualmente."
```

---

#### "Preferências Não Salvam"

**Sintomas**: Ao clicar "Salvar", erro retornado ou UI faz rollback.

**Diagnóstico**:
```bash
# 1. Test API manually
curl -X PUT "https://svlentes.shop/api/assinante/delivery-preferences" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "address": {
      "cep": "35300-000",
      "street": "Rua das Flores",
      "number": "123",
      "neighborhood": "Centro",
      "city": "Caratinga",
      "state": "MG"
    },
    "contact": { "phone": "(33) 98765-4321" },
    "preferences": {
      "preferredDeliveryTime": "afternoon",
      "deliveryFrequency": "monthly"
    },
    "notifications": {
      "email": true,
      "whatsapp": true,
      "sms": false
    }
  }'

# 2. Check database
docker exec -it postgres psql -U n8nuser -d n8ndb -c \
  "SELECT * FROM \"DeliveryPreferences\"
   WHERE \"userId\" = 'usr_abc123';"

# 3. View validation errors
journalctl -u svlentes-nextjs | grep "delivery-preferences" | grep ERROR
```

**Possíveis Causas**:
1. **Validation failed**: Campos obrigatórios faltando ou formato inválido
2. **Network error**: Request não chegou ao servidor
3. **Delivery in transit**: Bloqueio de atualização durante entrega ativa
4. **Database constraint**: Violação de constraint (unique, foreign key)

**Soluções**:

**1. Fix validation errors**:
```typescript
// Check all required fields before submit
const validateBeforeSubmit = (): boolean => {
  const required = ['cep', 'street', 'number', 'neighborhood', 'city', 'state', 'phone']

  for (const field of required) {
    if (!formData[field] || formData[field].trim() === '') {
      toast.error(`Campo obrigatório: ${field}`)
      return false
    }
  }

  // Validate formats
  if (!validateCEP(formData.cep)) {
    toast.error('CEP inválido')
    return false
  }

  if (!validatePhone(formData.phone)) {
    toast.error('Telefone inválido')
    return false
  }

  return true
}
```

**2. Retry on network error**:
```typescript
const saveWithRetry = async (data: DeliveryPreferences) => {
  try {
    await savePreferences(data)
  } catch (error) {
    if (error.name === 'NetworkError') {
      const retry = confirm('Erro de rede. Tentar novamente?')
      if (retry) {
        await saveWithRetry(data)
      }
    } else {
      throw error
    }
  }
}
```

**3. Check delivery status**:
```bash
# Verify no active deliveries
docker exec -it postgres psql -U n8nuser -d n8ndb -c \
  "SELECT * FROM \"Order\"
   WHERE \"subscriptionId\" IN (
     SELECT id FROM \"Subscription\" WHERE \"userId\" = 'usr_abc123'
   )
   AND status IN ('PREPARING', 'SHIPPED');"

# If active delivery exists, show message:
# "Não é possível alterar endereço durante entrega em andamento"
```

**4. Debug database constraints**:
```sql
-- Check constraint violations
SELECT conname, contype, conkey
FROM pg_constraint
WHERE conrelid = '"DeliveryPreferences"'::regclass;

-- If unique constraint on userId, ensure only one record
DELETE FROM "DeliveryPreferences"
WHERE "userId" = 'usr_abc123' AND id NOT IN (
  SELECT MAX(id) FROM "DeliveryPreferences" WHERE "userId" = 'usr_abc123'
);
```

---

### General Phase 3 Health Check

**Quick Validation Script**:
```bash
#!/bin/bash
echo "========================"
echo "Phase 3 Health Check"
echo "========================"

# 1. Prescription API
echo -n "Prescription API: "
curl -sf https://svlentes.shop/api/assinante/prescription \
  -H "Authorization: Bearer TEST" > /dev/null 2>&1 && echo "✅ OK" || echo "❌ ERROR"

# 2. Payment History API
echo -n "Payment History API: "
curl -sf "https://svlentes.shop/api/assinante/payment-history?page=1&limit=20" \
  -H "Authorization: Bearer TEST" > /dev/null 2>&1 && echo "✅ OK" || echo "❌ ERROR"

# 3. Delivery Preferences API
echo -n "Delivery Preferences API: "
curl -sf https://svlentes.shop/api/assinante/delivery-preferences \
  -H "Authorization: Bearer TEST" > /dev/null 2>&1 && echo "✅ OK" || echo "❌ ERROR"

# 4. ViaCEP Integration
echo -n "ViaCEP Integration: "
curl -sf https://viacep.com.br/ws/35300000/json/ > /dev/null 2>&1 \
  && echo "✅ OK" || echo "❌ ERROR"

# 5. Storage Directory
echo -n "Prescription Storage: "
[ -d /root/svlentes-hero-shop/storage/prescriptions ] \
  && echo "✅ OK" || echo "❌ MISSING"

# 6. Database Tables
echo -n "Prescription Table: "
docker exec -it postgres psql -U n8nuser -d n8ndb -c \
  "SELECT 1 FROM \"Prescription\" LIMIT 1;" > /dev/null 2>&1 \
  && echo "✅ OK" || echo "❌ MISSING"

echo -n "Payment Table: "
docker exec -it postgres psql -U n8nuser -d n8ndb -c \
  "SELECT 1 FROM \"Payment\" LIMIT 1;" > /dev/null 2>&1 \
  && echo "✅ OK" || echo "❌ MISSING"

echo -n "DeliveryPreferences Table: "
docker exec -it postgres psql -U n8nuser -d n8ndb -c \
  "SELECT 1 FROM \"DeliveryPreferences\" LIMIT 1;" > /dev/null 2>&1 \
  && echo "✅ OK" || echo "❌ MISSING"

echo "========================"
```

---

**Author**: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
**Last Updated**: 2025-10-24
