# PaymentHistoryTable - Usage Guide

## Quick Start

```typescript
import { PaymentHistoryTable } from '@/components/assinante/PaymentHistoryTable'

export default function DashboardPage() {
  return (
    <div>
      <h1>Payment History</h1>
      <PaymentHistoryTable initialPageSize={10} />
    </div>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialPageSize` | `number` | `10` | Number of payments per page |
| `className` | `string` | `undefined` | Additional CSS classes |

## Features

### 1. Automatic Data Fetching
- Fetches data on mount
- Re-fetches when filters/pagination change
- Handles authentication automatically

### 2. Status Filtering
- All statuses
- Received (RECEIVED)
- Confirmed (CONFIRMED)
- Pending (PENDING)
- Overdue (OVERDUE)
- Cancelled (CANCELLED)
- Refunded (REFUNDED)

### 3. Pagination
- Previous/Next navigation
- Direct page selection
- Smart ellipsis for large page counts
- Shows current range

### 4. Manual Refresh
- Refresh button in header
- Spinner animation during refresh
- Maintains current page/filters

### 5. Error Handling
- Toast notifications
- Retry button on error
- Console logging for debugging

### 6. Loading States
- Skeleton on initial load
- Spinner on refresh
- Disabled controls during operations

### 7. Empty States
- Helpful message when no payments
- Suggestion to adjust filters

### 8. Document Downloads
- Invoice download (FileText icon)
- Receipt download (Download icon)
- Opens in new tab

## Authentication Requirements

Component requires AuthContext with authenticated user:

```typescript
import { AuthProvider } from '@/contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <PaymentHistoryTable />
    </AuthProvider>
  )
}
```

## API Endpoint

**Endpoint**: `GET /api/assinante/payment-history`

**Query Parameters**:
- `page` (required): Current page number
- `limit` (required): Items per page
- `status` (optional): Filter by status
- `startDate` (optional): ISO 8601 datetime
- `endDate` (optional): ISO 8601 datetime

**Headers**:
```
Authorization: Bearer <firebase-id-token>
```

**Response**:
```json
{
  "payments": [...],
  "summary": {
    "totalPaid": 1200.00,
    "totalPending": 300.00,
    "totalOverdue": 0,
    "averagePaymentTime": 2,
    "onTimePaymentRate": 95
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

## Customization

### Custom Page Size
```typescript
<PaymentHistoryTable initialPageSize={20} />
```

### Custom Styling
```typescript
<PaymentHistoryTable className="my-custom-class" />
```

## Mobile Responsiveness

- Desktop: Full table view
- Mobile: Card-based layout
- Filters: Stack vertically on small screens
- Pagination: Responsive button sizes

## Performance

- Memoized page number calculations
- Optimized re-renders with useCallback
- Efficient state updates
- 2-minute API cache on backend

## Troubleshooting

### "Erro ao carregar pagamentos"
- Check user is authenticated
- Verify API endpoint is accessible
- Check browser console for details

### No payments showing
- Check filter settings
- Verify user has subscription
- Check backend logs for errors

### Pagination not working
- Check total pages in response
- Verify page change handler
- Look for disabled state

## Testing

```typescript
import { render, screen } from '@testing-library/react'
import { PaymentHistoryTable } from '@/components/assinante/PaymentHistoryTable'

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { getIdToken: () => 'mock-token' }
  })
}))

// Mock fetch
global.fetch = vi.fn()

test('renders payment history', async () => {
  render(<PaymentHistoryTable />)
  // Add assertions
})
```

## Dependencies

- `@/contexts/AuthContext` - User authentication
- `@/hooks/use-toast` - Toast notifications
- `@/lib/formatters` - Date/currency formatting
- `framer-motion` - Animations
- `lucide-react` - Icons
- `@/components/ui/*` - UI components

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- Keyboard navigation ✓
- Screen reader support ✓
- ARIA labels ✓
- Color contrast (WCAG AA) ✓
- Focus indicators ✓
