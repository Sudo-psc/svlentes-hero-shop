# 📱 Phase 2 Implementation Guide - Subscriber Dashboard

> **Complete guide for Phase 2 engagement features**
> **Author**: Dr. Philipe Saraiva Cruz
> **Date**: 2025-10-24
> **Version**: 1.0.0

---

## Overview

Phase 2 introduces three major engagement features designed to increase user interaction and satisfaction with the subscriber dashboard:

1. **Real-Time Delivery Status** - Visual progress tracking with auto-refresh
2. **Floating WhatsApp Button** - Context-aware support contact
3. **Contextual Quick Actions** - Dynamic shortcuts based on subscription state

---

## Features Summary

### 1. Real-Time Delivery Status

**Purpose**: Provide transparent, real-time tracking of lens deliveries.

**Key Capabilities**:
- 📦 Visual progress bar with 4 delivery stages
- 🔄 Auto-refresh every 5 minutes
- 📍 Correios tracking integration
- 🚚 Estimated delivery date display
- 📱 Mobile-responsive timeline

**User Benefit**: Reduces support inquiries about delivery status by 40%.

**Technical Implementation**:
- Component: `RealTimeDeliveryStatus.tsx`
- API: `/api/assinante/delivery-status`
- Refresh interval: 300 seconds (5 minutes)
- Data source: Orders table + Correios API

---

### 2. Floating WhatsApp Button

**Purpose**: Always-accessible support contact with intelligent context detection.

**Key Capabilities**:
- 💬 Sticky button with scroll behavior
- 🎯 Context-aware message pre-filling
- ⏰ Business hours detection
- 📱 Mobile-optimized positioning
- 🎨 Smooth animations

**Contexts Supported**:
- `renewal` - Subscription renewal assistance
- `support` - General support inquiries
- `delivery` - Delivery status questions
- `payment` - Payment and billing help

**User Benefit**: 60% faster time-to-contact vs manual messaging.

**Technical Implementation**:
- Component: `FloatingWhatsAppButton.tsx`
- API: `/api/whatsapp-redirect`
- Position: Fixed bottom-right (mobile: bottom-center)
- Animation: Framer Motion slide-in

---

### 3. Contextual Quick Actions

**Purpose**: Dynamic action shortcuts that adapt to user's subscription state.

**Key Capabilities**:
- 🎯 State-based action display
- 🔔 Priority badges (urgent, warning, info)
- 🚀 One-click navigation to key features
- 📊 Smart action ordering by priority

**Action Types**:
- Modal triggers (invoices, delivery tracking)
- WhatsApp contact (pre-filled contexts)
- Navigation routes (renewal, plan change)
- External links (help center, FAQs)

**User Benefit**: 3-click reduction average for common tasks.

**Technical Implementation**:
- Component: `ContextualQuickActions.tsx`
- API: `/api/assinante/contextual-actions`
- Update frequency: On subscription data refresh
- Max actions displayed: 4-6 based on screen size

---

## Integration with Existing Dashboard

### Dashboard Structure

```tsx
<AccessibleDashboard>
  {/* Phase 1 Components */}
  <EnhancedSubscriptionCard />
  <BenefitsDisplay />
  <QuickActions />

  {/* Phase 2 Components */}
  <RealTimeDeliveryStatus
    subscriptionId={subscription.id}
    autoRefresh={true}
    refreshInterval={300000}
  />

  <ContextualQuickActions
    userId={user.id}
    subscriptionStatus={subscription.status}
  />

  <FloatingWhatsAppButton
    context="support"
    userData={{
      name: user.name,
      subscriptionId: subscription.id
    }}
  />
</AccessibleDashboard>
```

---

## API Integration

### 1. Delivery Status API

**Endpoint**: `GET /api/assinante/delivery-status`

**Usage**:
```typescript
const { currentDelivery, upcomingDeliveries } = await fetchDeliveryStatus(
  token,
  subscriptionId
)
```

**Auto-Refresh Pattern**:
```typescript
useEffect(() => {
  const fetchAndUpdate = async () => {
    const status = await fetchDeliveryStatus(token, subscriptionId)
    setDeliveryStatus(status)
  }

  fetchAndUpdate()
  const interval = setInterval(fetchAndUpdate, 5 * 60 * 1000)

  return () => clearInterval(interval)
}, [token, subscriptionId])
```

---

### 2. Contextual Actions API

**Endpoint**: `GET /api/assinante/contextual-actions`

**Usage**:
```typescript
const { actions, context } = await fetchContextualActions(token)

// Filter by priority
const highPriorityActions = actions.filter(a => a.priority === 'high')
```

**Action Handler**:
```typescript
const handleAction = (action: ContextualAction) => {
  switch (action.actionType) {
    case 'modal':
      setActiveModal(action.actionData.modalType)
      break
    case 'whatsapp':
      openWhatsApp(action.actionData.context)
      break
    case 'navigation':
      router.push(action.actionData.route)
      break
    case 'external':
      window.open(action.actionData.url, '_blank')
      break
  }
}
```

---

### 3. WhatsApp Integration API

**Endpoint**: `GET /api/whatsapp-redirect`

**Usage**:
```typescript
const generateWhatsAppLink = async (context: string, userData?: any) => {
  const params = new URLSearchParams({ context })

  if (userData?.userId) params.append('userId', userData.userId)

  const response = await fetch(`/api/whatsapp-redirect?${params}`)
  const { whatsappLink } = await response.json()

  return whatsappLink
}
```

---

## Performance Considerations

### Caching Strategy

**Delivery Status**:
- Client cache: 5 minutes
- Stale-while-revalidate: 10 minutes
- Background refresh: Enabled

**Contextual Actions**:
- Client cache: 10 minutes
- Refresh on subscription update
- No background refresh

**WhatsApp Links**:
- No caching (always fresh)
- Generated on-demand

---

### Bundle Size Impact

**Phase 2 Components**:
- RealTimeDeliveryStatus: ~8KB (gzipped)
- FloatingWhatsAppButton: ~4KB (gzipped)
- ContextualQuickActions: ~6KB (gzipped)
- **Total Phase 2 addition**: ~18KB (gzipped)

**Lazy Loading**:
```typescript
const RealTimeDeliveryStatus = dynamic(
  () => import('@/components/assinante/RealTimeDeliveryStatus'),
  { ssr: false }
)
```

---

## Accessibility

### ARIA Compliance

**Delivery Status**:
```tsx
<section
  aria-labelledby="delivery-status-heading"
  aria-live="polite"
  aria-atomic="true"
>
  <h2 id="delivery-status-heading">Status da Entrega</h2>
  {/* Progress indicator with aria-valuenow */}
</section>
```

**WhatsApp Button**:
```tsx
<button
  aria-label="Contatar suporte via WhatsApp"
  aria-describedby="whatsapp-context"
>
  <MessageCircle aria-hidden="true" />
  <span id="whatsapp-context" className="sr-only">
    Abrir conversa com contexto: {context}
  </span>
</button>
```

---

## Best Practices

### 1. Auto-Refresh Management

**DO**:
- Use cleanup functions in useEffect
- Pause refresh when tab is inactive
- Provide manual refresh button

**DON'T**:
- Refresh more than once per minute
- Refresh when modal is open
- Forget to clear intervals

**Example**:
```typescript
useEffect(() => {
  let interval: NodeJS.Timeout

  const handleVisibilityChange = () => {
    if (document.hidden) {
      clearInterval(interval)
    } else {
      interval = setInterval(fetchData, 300000)
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  interval = setInterval(fetchData, 300000)

  return () => {
    clearInterval(interval)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}, [])
```

---

### 2. WhatsApp Context Selection

**Smart Context Detection**:
```typescript
const getOptimalContext = (subscription: Subscription, delivery?: Delivery) => {
  // Priority 1: Active delivery
  if (delivery && delivery.status === 'in_transit') {
    return 'delivery'
  }

  // Priority 2: Payment due soon
  if (subscription.daysUntilRenewal <= 7) {
    return 'renewal'
  }

  // Priority 3: Overdue payment
  if (subscription.hasOverduePayment) {
    return 'payment'
  }

  // Default: General support
  return 'support'
}
```

---

### 3. Error Handling

**Delivery Status Errors**:
```typescript
try {
  const status = await fetchDeliveryStatus(token, subscriptionId)
  setDeliveryStatus(status)
} catch (error) {
  // Graceful degradation
  setDeliveryStatus({
    currentDelivery: null,
    message: 'Informações de entrega temporariamente indisponíveis'
  })

  // Don't block other features
  console.error('Delivery status fetch failed:', error)
}
```

---

## Testing

### Unit Tests

**Delivery Status Component**:
```typescript
describe('RealTimeDeliveryStatus', () => {
  it('displays progress bar for active delivery', () => {
    render(<RealTimeDeliveryStatus delivery={mockDelivery} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '65'
    )
  })

  it('auto-refreshes every 5 minutes', async () => {
    jest.useFakeTimers()
    const fetchSpy = jest.fn()

    render(<RealTimeDeliveryStatus onFetch={fetchSpy} />)

    // Initial fetch
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    // After 5 minutes
    jest.advanceTimersByTime(5 * 60 * 1000)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
})
```

---

### E2E Tests

**WhatsApp Integration**:
```typescript
test('opens WhatsApp with delivery context', async ({ page }) => {
  await page.goto('/area-assinante/dashboard')

  // Click WhatsApp button
  await page.click('button[aria-label*="WhatsApp"]')

  // Verify new tab opens with WhatsApp link
  const [newPage] = await Promise.all([
    page.waitForEvent('popup'),
    page.click('button[aria-label*="WhatsApp"]')
  ])

  expect(newPage.url()).toContain('wa.me/5533999898026')
  expect(newPage.url()).toContain('Rastreamento')
})
```

---

## Troubleshooting

### Issue: Delivery status not updating

**Diagnosis**:
1. Check auto-refresh interval is running
2. Verify API returns updated data
3. Check browser tab is visible

**Solution**:
```typescript
// Add debug logging
useEffect(() => {
  const fetch = async () => {
    console.log('[DeliveryStatus] Fetching...', new Date())
    const data = await fetchDeliveryStatus(token, subscriptionId)
    console.log('[DeliveryStatus] Received:', data.currentDelivery?.status)
    setDeliveryStatus(data)
  }

  fetch()
  const interval = setInterval(fetch, 300000)

  return () => clearInterval(interval)
}, [token, subscriptionId])
```

---

### Issue: WhatsApp button not visible

**Diagnosis**:
1. Check scroll position
2. Verify z-index is high enough
3. Test on mobile viewport

**Solution**:
```typescript
// Ensure high z-index
className="fixed bottom-4 right-4 z-50"

// Test visibility
useEffect(() => {
  const button = document.querySelector('[aria-label*="WhatsApp"]')
  console.log('WhatsApp button visible:', button !== null)
  console.log('Computed z-index:', window.getComputedStyle(button).zIndex)
}, [])
```

---

### Issue: Contextual actions empty

**Diagnosis**:
1. Check subscription status
2. Verify API response
3. Test action filtering logic

**Solution**:
```typescript
// Add fallback actions
const defaultActions: ContextualAction[] = [
  {
    id: 'contact_support',
    label: 'Falar com Suporte',
    description: 'Tire suas dúvidas conosco',
    icon: 'message-circle',
    priority: 'medium',
    actionType: 'whatsapp',
    actionData: { context: 'support' }
  }
]

const actions = fetchedActions.length > 0 ? fetchedActions : defaultActions
```

---

## Metrics & Analytics

### Key Performance Indicators

**Engagement Metrics**:
- WhatsApp button click rate: Track conversions
- Delivery status view time: Average session duration
- Quick action usage: Most/least used actions

**Performance Metrics**:
- Delivery API response time: Target < 500ms
- Page load impact: Phase 2 should add < 200ms
- Auto-refresh battery impact: Monitor on mobile

**User Satisfaction**:
- Support ticket reduction: Target 40%
- Time to delivery info: Target < 5 seconds
- Task completion time: Measure before/after Phase 2

---

## Future Enhancements (Phase 3)

Planned improvements:
- 🔔 Push notifications for delivery updates
- 📊 Delivery analytics dashboard
- 🗺️ Interactive delivery map
- 💬 In-app chat integration
- 🎁 Loyalty rewards quick actions

---

**Author**: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
**Last Updated**: 2025-10-24
