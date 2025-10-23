# 🎨 Subscriber Dashboard Phase 1 - Component Documentation

> **Comprehensive guide to subscriber dashboard UI components**
> **Author**: Dr. Philipe Saraiva Cruz
> **Date**: 2025-10-23
> **Version**: 1.0.0

---

## Table of Contents

- [Overview](#overview)
- [Component Architecture](#component-architecture)
- [Core Components](#core-components)
  - [AccessibleDashboard](#accessibledashboard)
  - [EnhancedSubscriptionCard](#enhancedsubscriptioncard)
  - [DashboardLoading](#dashboardloading)
  - [ToastFeedback](#toastfeedback)
- [Modal Components](#modal-components)
- [Utility Components](#utility-components)
- [Component Usage Examples](#component-usage-examples)
- [Performance Considerations](#performance-considerations)

---

## Overview

The Subscriber Dashboard Phase 1 introduces a comprehensive suite of React components built with Next.js 15, TypeScript, and Framer Motion animations. All components follow accessibility best practices (WCAG 2.1 AA) and implement responsive design.

**Key Technologies**:
- ⚛️ **React 19** with TypeScript
- 🎭 **Framer Motion** for animations
- 🎨 **Tailwind CSS v4** for styling
- ♿ **ARIA compliance** for accessibility
- 🔥 **Firebase** for authentication

---

## Component Architecture

### Directory Structure

```
src/components/assinante/
├── AccessibleDashboard.tsx         # Main dashboard component
├── EnhancedSubscriptionCard.tsx    # Subscription status card
├── DashboardLoading.tsx            # Loading state
├── DashboardError.tsx              # Error state
├── ToastFeedback.tsx               # Toast notifications
├── QuickActions.tsx                # Quick action buttons
├── EmergencyContact.tsx            # Emergency medical contact
├── SubscriptionHistoryTimeline.tsx # Subscription events timeline
├── OrdersModal.tsx                 # Order history modal
├── InvoicesModal.tsx               # Invoice download modal
├── ChangePlanModal.tsx             # Plan change modal
├── UpdateAddressModal.tsx          # Address update modal
├── UpdatePaymentModal.tsx          # Payment method modal
└── ...other components
```

### Component Hierarchy

```
DashboardPage (page.tsx)
└── DashboardContent
    ├── AccessibleDashboard (Enhanced UI)
    │   ├── Header
    │   ├── EnhancedSubscriptionCard
    │   ├── QuickActions
    │   ├── SubscriptionHistoryTimeline
    │   └── EmergencyContact
    └── Fallback Dashboard (Original UI)
        ├── SubscriptionStatus
        ├── PaymentInfo
        ├── BenefitsDisplay
        └── Modals
```

---

## Core Components

### AccessibleDashboard

**Purpose**: Main dashboard component with full accessibility features and enhanced UX.

**File**: `src/components/assinante/AccessibleDashboard.tsx`

**Props**: None (uses context hooks internally)

**Features**:
- 🔐 Firebase authentication integration
- ♿ ARIA landmarks and live regions
- 📱 Responsive design (mobile-first)
- ⚡ Real-time subscription data
- 🎭 Smooth animations with Framer Motion

**Internal Dependencies**:
- `useAuth()` - Firebase authentication context
- `useSubscription()` - Subscription data hook
- `useToast()` - Toast notification system

**States**:
- Loading: Shows skeleton UI
- Authenticated with subscription: Shows full dashboard
- Authenticated without subscription: Shows onboarding
- Unauthenticated: Redirects to login
- Error: Shows error state with retry

**Example Usage**:
```tsx
import { AccessibleDashboard } from '@/components/assinante/AccessibleDashboard'

export default function DashboardPage() {
  return <AccessibleDashboard />
}
```

**Accessibility Features**:
```tsx
// ARIA landmarks
<main role="main" aria-label="Dashboard do Assinante">
  <section aria-labelledby="subscription-heading">
    <h2 id="subscription-heading">Status da Assinatura</h2>
    {/* Content */}
  </section>
</main>

// Live regions for dynamic updates
<div aria-live="polite" aria-atomic="true">
  Assinatura atualizada com sucesso
</div>

// Keyboard navigation
<button aria-label="Atualizar dados da assinatura" onClick={refetch}>
  <RefreshCcw aria-hidden="true" />
</button>
```

**Performance**:
- Code splitting with dynamic imports
- Memoized components for reduced re-renders
- Lazy loading for heavy components (modals)
- Optimized animations (GPU acceleration)

---

### EnhancedSubscriptionCard

**Purpose**: Visual card displaying subscription status with interactive elements.

**File**: `src/components/assinante/EnhancedSubscriptionCard.tsx`

**Props Interface**:
```typescript
interface EnhancedSubscriptionCardProps {
  status: SubscriptionStatus             // 'active' | 'pending' | 'cancelled' | 'paused'
  planName: string                       // e.g., "Plano Mensal Premium"
  price: number                          // Monthly price (e.g., 89.90)
  billingCycle: 'monthly' | 'yearly'     // Billing frequency
  nextBillingDate?: string               // ISO date string
  paymentMethod?: string                 // 'credit_card' | 'pix' | 'boleto'
  paymentMethodLast4?: string            // Last 4 digits (e.g., "4242")
  shippingAddress?: ShippingAddress      // Delivery address object
  benefits?: Benefit[]                   // Array of subscription benefits
  onRefresh?: () => void                 // Refresh subscription data
  onEditPlan?: () => void                // Open plan change modal
  onEditPayment?: () => void             // Open payment update modal
  onEditAddress?: () => void             // Open address update modal
  onReactivate?: () => void              // Reactivate cancelled/paused subscription
  isLoading?: boolean                    // Loading state
}
```

**Visual States**:

**Active Subscription**:
```tsx
<EnhancedSubscriptionCard
  status="active"
  planName="Plano Mensal Premium"
  price={89.90}
  billingCycle="monthly"
  nextBillingDate="2025-11-01T00:00:00.000Z"
  paymentMethod="credit_card"
  paymentMethodLast4="4242"
  onRefresh={() => refetchSubscription()}
  onEditPlan={() => setShowChangePlanModal(true)}
/>
```

**Cancelled Subscription**:
```tsx
<EnhancedSubscriptionCard
  status="cancelled"
  planName="Plano Mensal Basic"
  price={49.90}
  billingCycle="monthly"
  onReactivate={() => handleReactivate()}
/>
```

**Features**:
- 🎨 Status-based color coding (green=active, red=cancelled, yellow=pending)
- ⏱️ Real-time countdown to next billing
- 🔄 Expandable sections for payment/address details
- 🎭 Smooth expand/collapse animations
- 📊 Visual benefit usage indicators

**Animation Example**:
```tsx
// Card entrance animation
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
}

<motion.div
  variants={cardVariants}
  initial="hidden"
  animate="visible"
>
  {/* Card content */}
</motion.div>
```

**Status Color Mapping**:
```typescript
const statusColors = {
  active: 'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  paused: 'bg-gray-50 text-gray-700 border-gray-200'
}
```

**Responsive Breakpoints**:
- Mobile (< 640px): Single column, stacked layout
- Tablet (640-1024px): Two columns for info cards
- Desktop (> 1024px): Full width with optimal spacing

---

### DashboardLoading

**Purpose**: Loading skeleton UI while fetching dashboard data.

**File**: `src/components/assinante/DashboardLoading.tsx`

**Props**: None

**Features**:
- 💀 Skeleton UI matching dashboard layout
- ✨ Pulse animation for loading feedback
- 📱 Responsive skeleton cards
- ⚡ Instant visual feedback

**Example Usage**:
```tsx
if (loading) {
  return <DashboardLoading />
}
```

**Implementation**:
```tsx
export function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50">
      {/* Header Skeleton */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-1/3" />
        </div>
      </header>

      {/* Content Skeleton */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Subscription Card Skeleton */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-2/3" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              <div className="h-12 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Payment Info Skeleton */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-2/3" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

**Performance**:
- CSS animations (no JS)
- Minimal DOM nodes
- Matches actual layout to prevent layout shift

---

### ToastFeedback

**Purpose**: Non-intrusive notification system for user feedback.

**File**: `src/components/assinante/ToastFeedback.tsx`

**Components**:
1. `useToast()` - Hook for managing toast state
2. `ToastContainer` - Container component for rendering toasts

**Hook Interface**:
```typescript
interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number  // Auto-dismiss after N ms (default: 5000)
}

interface UseToastReturn {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
}
```

**Usage Example**:
```tsx
import { useToast, ToastContainer } from '@/components/assinante/ToastFeedback'

function MyComponent() {
  const { toasts, removeToast, success, error } = useToast()

  const handleSave = async () => {
    try {
      await saveData()
      success('Dados salvos com sucesso!')
    } catch (err) {
      error('Erro ao salvar dados. Tente novamente.')
    }
  }

  return (
    <>
      <button onClick={handleSave}>Salvar</button>

      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />
    </>
  )
}
```

**Toast Types**:

**Success**:
```tsx
success('Assinatura atualizada com sucesso!')
// Green background, checkmark icon
```

**Error**:
```tsx
error('Erro ao processar pagamento')
// Red background, alert icon
```

**Info**:
```tsx
info('Sua próxima entrega será em 5 dias')
// Blue background, info icon
```

**Warning**:
```tsx
warning('Pagamento vence em 2 dias')
// Yellow background, warning icon
```

**Features**:
- 🎭 Smooth enter/exit animations
- ⏱️ Auto-dismiss after 5 seconds (configurable)
- 📱 Responsive positioning
- ♿ Screen reader announcements via aria-live
- 🎨 Type-based color coding

**Accessibility**:
```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="toast"
>
  {message}
</div>
```

**Animation**:
```tsx
const toastVariants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 }
}

<AnimatePresence>
  {toasts.map(toast => (
    <motion.div
      key={toast.id}
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Toast content */}
    </motion.div>
  ))}
</AnimatePresence>
```

---

## Modal Components

### OrdersModal

**Purpose**: Display order history in modal overlay.

**File**: `src/components/assinante/OrdersModal.tsx`

**Props**:
```typescript
interface OrdersModalProps {
  isOpen: boolean
  onClose: () => void
}
```

**Features**:
- 📦 Order history timeline
- 📍 Tracking code integration
- 📊 Order status visualization
- 🔍 Search and filter capabilities

**Usage**:
```tsx
const [showOrders, setShowOrders] = useState(false)

<button onClick={() => setShowOrders(true)}>
  Ver Pedidos
</button>

<OrdersModal
  isOpen={showOrders}
  onClose={() => setShowOrders(false)}
/>
```

---

### InvoicesModal

**Purpose**: Download and view invoices/receipts.

**File**: `src/components/assinante/InvoicesModal.tsx`

**Props**:
```typescript
interface InvoicesModalProps {
  isOpen: boolean
  onClose: () => void
}
```

**Features**:
- 📄 PDF invoice download
- 💰 Payment history
- 📅 Filter by date range
- 📊 Payment summary

**Invoice Data Structure**:
```typescript
interface Invoice {
  id: string
  invoiceNumber: string
  status: 'PAID' | 'PENDING' | 'OVERDUE'
  amount: number
  dueDate: string
  paidAt: string | null
  downloadUrl: string | null
}
```

---

### ChangePlanModal

**Purpose**: Allow user to change subscription plan.

**File**: `src/components/assinante/ChangePlanModal.tsx`

**Props**:
```typescript
interface ChangePlanModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: {
    id: string
    name: string
    price: number
  }
  availablePlans: Plan[]
  onPlanChange: (newPlanId: string) => Promise<void>
}
```

**Features**:
- 📊 Plan comparison table
- 💰 Price difference calculation
- ⚡ Instant plan switch
- ✅ Confirmation dialog

**Plan Comparison**:
```tsx
<div className="plan-comparison">
  <div className="current-plan">
    <h3>Plano Atual</h3>
    <p>{currentPlan.name}</p>
    <p>{formatCurrency(currentPlan.price)}/mês</p>
  </div>

  <div className="available-plans">
    {availablePlans.map(plan => (
      <PlanCard
        key={plan.id}
        plan={plan}
        isCurrent={plan.id === currentPlan.id}
        onSelect={() => handlePlanSelect(plan.id)}
      />
    ))}
  </div>
</div>
```

---

### UpdateAddressModal

**Purpose**: Update shipping address for deliveries.

**File**: `src/components/assinante/UpdateAddressModal.tsx`

**Props**:
```typescript
interface UpdateAddressModalProps {
  isOpen: boolean
  onClose: () => void
  currentAddress?: ShippingAddress
  onAddressUpdate: (address: ShippingAddress) => Promise<void>
}

interface ShippingAddress {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}
```

**Features**:
- 🗺️ CEP lookup integration
- ✅ Address validation
- 📍 Google Maps preview (optional)
- 💾 Auto-save on blur

**Form Validation**:
```tsx
import { z } from 'zod'

const addressSchema = z.object({
  street: z.string().min(3, 'Rua inválida'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(3, 'Bairro inválido'),
  city: z.string().min(3, 'Cidade inválida'),
  state: z.string().length(2, 'UF deve ter 2 caracteres'),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido')
})
```

---

### UpdatePaymentModal

**Purpose**: Update payment method for subscription.

**File**: `src/components/assinante/UpdatePaymentModal.tsx`

**Props**:
```typescript
interface UpdatePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  currentPaymentMethod?: {
    type: 'credit_card' | 'pix' | 'boleto'
    last4?: string
  }
  onPaymentUpdate: (paymentData: PaymentData) => Promise<void>
}
```

**Features**:
- 💳 Credit card form
- 📲 PIX integration
- 📄 Boleto generation
- 🔐 Secure payment processing (Asaas)

**Payment Method Selection**:
```tsx
<div className="payment-methods">
  <button onClick={() => setMethod('credit_card')}>
    <CreditCard />
    Cartão de Crédito
  </button>

  <button onClick={() => setMethod('pix')}>
    <QrCode />
    PIX
  </button>

  <button onClick={() => setMethod('boleto')}>
    <FileText />
    Boleto Bancário
  </button>
</div>
```

---

## Utility Components

### EmergencyContact

**Purpose**: Display emergency medical contact information (healthcare compliance).

**File**: `src/components/assinante/EmergencyContact.tsx`

**Features**:
- 🚨 Emergency contact details
- 👨‍⚕️ Dr. Philipe information
- 📞 Quick call buttons
- ⚠️ Emergency symptom checklist

**Compliance**: Required by Brazilian healthcare regulations (CFM/CRM).

---

### SubscriptionHistoryTimeline

**Purpose**: Visual timeline of subscription events.

**File**: `src/components/assinante/SubscriptionHistoryTimeline.tsx`

**Props**:
```typescript
interface SubscriptionHistoryTimelineProps {
  userId: string
}
```

**Event Types**:
- ✅ Subscription created
- 📦 Plan changed
- 💳 Payment method updated
- 📍 Address updated
- ⏸️ Subscription paused
- ▶️ Subscription reactivated
- ❌ Subscription cancelled

**Timeline Example**:
```tsx
<div className="timeline">
  <TimelineEvent
    icon={<CheckCircle />}
    title="Assinatura criada"
    description="Plano Mensal Premium"
    timestamp="2025-01-15T10:30:00Z"
  />

  <TimelineEvent
    icon={<MapPin />}
    title="Endereço atualizado"
    description="Nova Rua, 456 - Caratinga/MG"
    timestamp="2025-03-22T14:15:00Z"
  />

  <TimelineEvent
    icon={<CreditCard />}
    title="Forma de pagamento alterada"
    description="Cartão de crédito •••• 4242"
    timestamp="2025-05-10T09:45:00Z"
  />
</div>
```

---

## Component Usage Examples

### Complete Dashboard Implementation

```tsx
'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { AccessibleDashboard } from '@/components/assinante/AccessibleDashboard'
import { DashboardLoading } from '@/components/assinante/DashboardLoading'
import { DashboardError } from '@/components/assinante/DashboardError'
import { ToastContainer, useToast } from '@/components/assinante/ToastFeedback'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { subscription, loading: subLoading, error, refetch } = useSubscription()
  const { toasts, removeToast, success, error: showError } = useToast()

  if (authLoading || subLoading) {
    return <DashboardLoading />
  }

  if (error) {
    return (
      <DashboardError
        message={error}
        onRetry={refetch}
      />
    )
  }

  return (
    <>
      <AccessibleDashboard />

      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />
    </>
  )
}
```

---

### Modal Management Pattern

```tsx
function DashboardWithModals() {
  // Modal state management
  const [modals, setModals] = useState({
    orders: false,
    invoices: false,
    changePlan: false,
    updateAddress: false,
    updatePayment: false
  })

  const openModal = (modal: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modal]: true }))
  }

  const closeModal = (modal: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modal]: false }))
  }

  return (
    <>
      {/* Trigger buttons */}
      <button onClick={() => openModal('orders')}>Ver Pedidos</button>
      <button onClick={() => openModal('invoices')}>Baixar Faturas</button>

      {/* Modals */}
      <OrdersModal
        isOpen={modals.orders}
        onClose={() => closeModal('orders')}
      />

      <InvoicesModal
        isOpen={modals.invoices}
        onClose={() => closeModal('invoices')}
      />

      <ChangePlanModal
        isOpen={modals.changePlan}
        onClose={() => closeModal('changePlan')}
        currentPlan={subscription.plan}
        availablePlans={plans}
        onPlanChange={handlePlanChange}
      />
    </>
  )
}
```

---

## Performance Considerations

### Code Splitting

```tsx
// Lazy load heavy modals
const OrdersModal = dynamic(() => import('@/components/assinante/OrdersModal'), {
  loading: () => <ModalSkeleton />,
  ssr: false
})

const InvoicesModal = dynamic(() => import('@/components/assinante/InvoicesModal'), {
  loading: () => <ModalSkeleton />,
  ssr: false
})
```

### Memoization

```tsx
import { memo, useMemo } from 'react'

// Memoize expensive components
const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* Complex rendering */}</div>
})

// Memoize computed values
function MyComponent({ subscription }) {
  const benefitsSummary = useMemo(() => {
    return subscription.benefits.reduce((acc, benefit) => {
      acc.total += benefit.quantityTotal
      acc.used += benefit.quantityUsed
      return acc
    }, { total: 0, used: 0 })
  }, [subscription.benefits])

  return <div>{/* Use benefitsSummary */}</div>
}
```

### Animation Performance

```tsx
// Use GPU-accelerated properties
const optimizedVariants = {
  hidden: {
    opacity: 0,
    transform: 'translateY(20px)' // Use transform instead of top/bottom
  },
  visible: {
    opacity: 1,
    transform: 'translateY(0)',
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
}

// Reduce motion for accessibility
<motion.div
  variants={optimizedVariants}
  initial="hidden"
  animate="visible"
  reducedMotion="user" // Respect user's motion preferences
/>
```

### Image Optimization

```tsx
import Image from 'next/image'

// Use Next.js Image component
<Image
  src="/subscription-icon.png"
  alt="Subscription status"
  width={48}
  height={48}
  loading="lazy"
  quality={85}
/>
```

---

## Testing Components

### Unit Testing Example

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { EnhancedSubscriptionCard } from '@/components/assinante/EnhancedSubscriptionCard'

describe('EnhancedSubscriptionCard', () => {
  it('renders active subscription correctly', () => {
    render(
      <EnhancedSubscriptionCard
        status="active"
        planName="Plano Premium"
        price={89.90}
        billingCycle="monthly"
      />
    )

    expect(screen.getByText('Plano Premium')).toBeInTheDocument()
    expect(screen.getByText(/R\$ 89,90/)).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })

  it('calls onRefresh when refresh button clicked', () => {
    const onRefresh = jest.fn()

    render(
      <EnhancedSubscriptionCard
        status="active"
        planName="Plano Premium"
        price={89.90}
        billingCycle="monthly"
        onRefresh={onRefresh}
      />
    )

    fireEvent.click(screen.getByLabelText('Atualizar'))

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })
})
```

### Accessibility Testing

```tsx
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

it('should have no accessibility violations', async () => {
  const { container } = render(<AccessibleDashboard />)
  const results = await axe(container)

  expect(results).toHaveNoViolations()
})
```

---

## Styling Guidelines

### Tailwind CSS Usage

```tsx
// ✅ Good: Semantic class names, responsive design
<div className="bg-white rounded-xl shadow-sm border p-6 md:p-8 hover:shadow-md transition-shadow">
  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
    Title
  </h3>
</div>

// ❌ Bad: Inline styles, no responsiveness
<div style={{ background: '#fff', padding: '24px', borderRadius: '12px' }}>
  <h3 style={{ fontSize: '20px', fontWeight: 600 }}>
    Title
  </h3>
</div>
```

### Color System

```tsx
// Primary (Cyan)
'bg-cyan-50'   // Light backgrounds
'bg-cyan-600'  // Primary buttons
'text-cyan-700' // Primary text

// Status colors
'bg-green-50 text-green-700'  // Success/Active
'bg-red-50 text-red-700'      // Error/Cancelled
'bg-yellow-50 text-yellow-700' // Warning/Pending
'bg-gray-50 text-gray-700'    // Paused/Inactive
```

---

## Troubleshooting

### Component Not Rendering

**Issue**: Component renders blank or with errors.

**Solutions**:
1. Check authentication state: `useAuth()` returns valid user
2. Verify subscription data: `useSubscription()` returns data without errors
3. Check console for hydration errors (client/server mismatch)
4. Ensure all required props are provided

### Animation Performance Issues

**Issue**: Animations stutter or lag.

**Solutions**:
1. Use `transform` and `opacity` for animations (GPU accelerated)
2. Reduce number of simultaneously animating elements
3. Add `will-change: transform` CSS hint
4. Use `layoutId` sparingly in Framer Motion

### Modal Not Closing

**Issue**: Modal stays open after `onClose` called.

**Solutions**:
1. Verify `isOpen` prop is controlled correctly
2. Check for event propagation issues (use `e.stopPropagation()`)
3. Ensure state updates are synchronous
4. Check for competing state management

---

## Future Enhancements (Phase 2)

Planned component additions:
- 📊 **DashboardMetrics**: Visual analytics cards
- 🔔 **NotificationCenter**: In-app notification system
- 📈 **SavingsWidget**: Accumulated savings calculator
- 🚚 **DeliveryTimeline**: Visual delivery tracking
- 🎁 **BenefitsGallery**: Interactive benefits showcase

---

**Author**: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
**Last Updated**: 2025-10-23
