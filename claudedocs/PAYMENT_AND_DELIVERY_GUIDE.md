# 💰 Payment History and Delivery Preferences Guide

> **Complete financial transparency and delivery management**
> **Author**: Dr. Philipe Saraiva Cruz
> **Date**: 2025-10-24
> **Version**: 1.0.0

---

## Table of Contents

- [Payment History](#payment-history)
  - [Overview](#payment-history-overview)
  - [Payment Status Lifecycle](#payment-status-lifecycle)
  - [Filters and Pagination](#filters-and-pagination)
  - [Summary Calculations](#summary-calculations)
  - [Invoice Downloads](#invoice-downloads)
  - [API Reference](#payment-api-reference)
- [Delivery Preferences](#delivery-preferences)
  - [Overview](#delivery-preferences-overview)
  - [Address Management](#address-management)
  - [ViaCEP Integration](#viacep-integration)
  - [Form Validation](#form-validation)
  - [Optimistic Updates](#optimistic-updates)
  - [API Reference](#delivery-api-reference)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Payment History

### Payment History Overview

Complete financial transparency system providing subscribers with full visibility into their payment history, including analytics, filtering, and document downloads.

**Key Features**:
- 💰 Complete payment transaction history
- 🔍 Advanced filtering (status, method, date range)
- 📊 Financial summary analytics
- 📄 Invoice and receipt downloads
- 📈 Payment performance metrics
- 📱 Mobile-responsive table design
- 🔄 Server-side pagination for performance

**User Benefits**:
- Full transparency into subscription costs
- Easy expense tracking and reporting
- Quick access to invoices for reimbursement
- Payment performance insights (on-time rate)
- Historical data for tax purposes

**Business Value**:
- Reduced support inquiries about billing
- Improved payment compliance awareness
- Enhanced user trust through transparency
- Data-driven insights into payment patterns

### Payment Status Lifecycle

```
Payment Created (Asaas)
        ↓
    PENDING ──────────→ PAID (payment confirmed)
        ↓
      OVERDUE ─────────→ CANCELLED (subscription cancelled)
```

**Status Definitions**:

| Status | Description | Next Steps | UI Color |
|--------|-------------|------------|----------|
| **PENDING** | Invoice generated, awaiting payment | User should pay via PIX, Boleto, or Card | 🟡 Yellow |
| **PAID** | Payment confirmed by Asaas | No action required | 🟢 Green |
| **OVERDUE** | Past due date, no payment received | Pay immediately or risk suspension | 🔴 Red |
| **CANCELLED** | Subscription cancelled, invoice voided | N/A (historical record only) | ⚫ Gray |

**Status Transitions**:
```typescript
// Allowed transitions
const allowedTransitions = {
  PENDING: ['PAID', 'OVERDUE', 'CANCELLED'],
  OVERDUE: ['PAID', 'CANCELLED'],
  PAID: [], // Terminal state
  CANCELLED: [] // Terminal state
}
```

**Webhook Updates** (Asaas):
- `PAYMENT_RECEIVED` → Change status to PAID
- `PAYMENT_CONFIRMED` → Final confirmation
- `PAYMENT_OVERDUE` → Mark as OVERDUE
- `PAYMENT_DELETED` → Mark as CANCELLED

### Filters and Pagination

**Filter Interface**:
```typescript
interface PaymentFilters {
  // Payment status
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'

  // Payment method
  method?: 'PIX' | 'BOLETO' | 'CREDIT_CARD'

  // Date range
  startDate?: string // ISO 8601: "2025-01-01T00:00:00.000Z"
  endDate?: string   // ISO 8601: "2025-12-31T23:59:59.999Z"

  // Pagination
  page?: number     // Default: 1
  limit?: number    // Default: 20, Max: 100

  // Sorting
  sortBy?: 'dueDate' | 'amount' | 'paidAt'
  sortOrder?: 'asc' | 'desc' // Default: 'desc'
}
```

**Common Filter Combinations**:

```typescript
// All payments in 2025
const yearFilter: PaymentFilters = {
  startDate: '2025-01-01T00:00:00.000Z',
  endDate: '2025-12-31T23:59:59.999Z',
  page: 1,
  limit: 20
}

// All overdue payments
const overdueFilter: PaymentFilters = {
  status: 'OVERDUE',
  sortBy: 'dueDate',
  sortOrder: 'asc' // Oldest first
}

// All PIX payments (paid)
const pixFilter: PaymentFilters = {
  status: 'PAID',
  method: 'PIX'
}

// Payments in specific month
const monthlyFilter: PaymentFilters = {
  startDate: '2025-10-01T00:00:00.000Z',
  endDate: '2025-10-31T23:59:59.999Z'
}

// Last 6 months
const last6Months: PaymentFilters = {
  startDate: new Date(
    Date.now() - 6 * 30 * 24 * 60 * 60 * 1000
  ).toISOString(),
  endDate: new Date().toISOString()
}
```

**Pagination Strategy**:

**Server-Side Pagination**:
- Improves performance for large datasets
- Reduces memory usage on client
- Faster initial page load

**Implementation**:
```typescript
// Client-side hook
const usePaymentHistory = (filters: PaymentFilters) => {
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useSWR(
    `/api/assinante/payment-history?${buildQueryString({ ...filters, page })}`,
    fetcher
  )

  const goToPage = (newPage: number) => {
    setPage(newPage)
  }

  return { data, isLoading, error, page, goToPage }
}

// Server-side query
const payments = await prisma.payment.findMany({
  where: {
    userId,
    status: filters.status,
    paymentMethod: filters.method,
    dueDate: {
      gte: filters.startDate ? new Date(filters.startDate) : undefined,
      lte: filters.endDate ? new Date(filters.endDate) : undefined
    }
  },
  orderBy: {
    [filters.sortBy || 'dueDate']: filters.sortOrder || 'desc'
  },
  skip: (page - 1) * limit,
  take: limit
})

const total = await prisma.payment.count({ where })

return {
  payments,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1
  }
}
```

**Pagination UI**:
```typescript
<Pagination
  currentPage={pagination.page}
  totalPages={pagination.totalPages}
  onPageChange={handlePageChange}
  showFirstLast={true}
  showPrevNext={true}
/>

// Example: Showing 1-20 of 150 payments
<div className="text-sm text-gray-500">
  Mostrando {(page - 1) * limit + 1}-{Math.min(page * limit, total)} de {total} pagamentos
</div>
```

### Summary Calculations

**Financial Metrics**:
```typescript
interface PaymentSummary {
  // Total amounts by status
  totalPaid: number        // SUM(amount WHERE status = 'PAID')
  totalPending: number     // SUM(amount WHERE status = 'PENDING')
  totalOverdue: number     // SUM(amount WHERE status = 'OVERDUE')
  totalCancelled: number   // SUM(amount WHERE status = 'CANCELLED')

  // Performance metrics
  onTimePaymentRate: number     // % of payments paid on/before due date
  averagePaymentTime: number    // Avg days between due date and payment
  latePaymentCount: number      // COUNT(paidAt > dueDate)

  // Payment methods
  mostUsedMethod: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  methodBreakdown: {
    PIX: number
    BOLETO: number
    CREDIT_CARD: number
  }

  // Time-based
  averageMonthlySpend: number   // Total / months
  yearToDateSpend: number       // Total this year
}
```

**SQL Calculation Formulas**:

```sql
-- Total Paid
SELECT SUM(amount) as total_paid
FROM "Payment"
WHERE status = 'PAID' AND "userId" = $1;

-- Total Pending
SELECT SUM(amount) as total_pending
FROM "Payment"
WHERE status = 'PENDING' AND "userId" = $1;

-- Total Overdue
SELECT SUM(amount) as total_overdue
FROM "Payment"
WHERE status = 'OVERDUE' AND "userId" = $1;

-- On-Time Payment Rate
SELECT
  (COUNT(*) FILTER (WHERE "paidAt" <= "dueDate")::float / NULLIF(COUNT(*), 0)) * 100 as rate
FROM "Payment"
WHERE status = 'PAID' AND "userId" = $1;

-- Average Payment Time (days)
SELECT
  AVG(EXTRACT(DAY FROM ("paidAt" - "dueDate"))) as avg_days
FROM "Payment"
WHERE status = 'PAID' AND "userId" = $1;

-- Late Payment Count
SELECT COUNT(*) as late_count
FROM "Payment"
WHERE status = 'PAID'
  AND "paidAt" > "dueDate"
  AND "userId" = $1;

-- Most Used Payment Method
SELECT "paymentMethod", COUNT(*) as count
FROM "Payment"
WHERE status = 'PAID' AND "userId" = $1
GROUP BY "paymentMethod"
ORDER BY count DESC
LIMIT 1;

-- Method Breakdown
SELECT
  "paymentMethod",
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM "Payment"
WHERE status = 'PAID' AND "userId" = $1
GROUP BY "paymentMethod";

-- Average Monthly Spend
SELECT
  SUM(amount) / NULLIF(
    EXTRACT(MONTH FROM AGE(MAX("paidAt"), MIN("paidAt"))) + 1,
    0
  ) as avg_monthly
FROM "Payment"
WHERE status = 'PAID' AND "userId" = $1;

-- Year-to-Date Spend
SELECT SUM(amount) as ytd_spend
FROM "Payment"
WHERE status = 'PAID'
  AND "userId" = $1
  AND EXTRACT(YEAR FROM "paidAt") = EXTRACT(YEAR FROM CURRENT_DATE);
```

**Implementation** (Prisma):
```typescript
async function calculatePaymentSummary(userId: string): Promise<PaymentSummary> {
  const payments = await prisma.payment.findMany({
    where: { userId },
    select: {
      status: true,
      amount: true,
      dueDate: true,
      paidAt: true,
      paymentMethod: true
    }
  })

  const paidPayments = payments.filter(p => p.status === 'PAID')

  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalPending = payments
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0)
  const totalOverdue = payments
    .filter(p => p.status === 'OVERDUE')
    .reduce((sum, p) => sum + p.amount, 0)

  const onTimeCount = paidPayments.filter(
    p => p.paidAt <= p.dueDate
  ).length

  const onTimePaymentRate = paidPayments.length > 0
    ? (onTimeCount / paidPayments.length) * 100
    : 0

  const totalDays = paidPayments.reduce((sum, p) => {
    const days = Math.floor(
      (p.paidAt.getTime() - p.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    return sum + days
  }, 0)

  const averagePaymentTime = paidPayments.length > 0
    ? totalDays / paidPayments.length
    : 0

  const methodCounts = paidPayments.reduce((counts, p) => {
    counts[p.paymentMethod] = (counts[p.paymentMethod] || 0) + 1
    return counts
  }, {} as Record<string, number>)

  const mostUsedMethod = Object.entries(methodCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] as PaymentMethod

  return {
    totalPaid,
    totalPending,
    totalOverdue,
    onTimePaymentRate,
    averagePaymentTime,
    latePaymentCount: paidPayments.length - onTimeCount,
    mostUsedMethod,
    methodBreakdown: {
      PIX: methodCounts.PIX || 0,
      BOLETO: methodCounts.BOLETO || 0,
      CREDIT_CARD: methodCounts.CREDIT_CARD || 0
    }
  }
}
```

**Summary Display**:
```typescript
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <SummaryCard
    title="Total Pago"
    value={formatCurrency(summary.totalPaid)}
    icon="💰"
    trend={summary.totalPaid > 0 ? 'positive' : 'neutral'}
    subtitle={`${payments.filter(p => p.status === 'PAID').length} pagamentos`}
  />

  <SummaryCard
    title="Pontualidade"
    value={`${summary.onTimePaymentRate.toFixed(1)}%`}
    icon="⏰"
    trend={summary.onTimePaymentRate > 90 ? 'positive' : summary.onTimePaymentRate > 70 ? 'neutral' : 'negative'}
    subtitle={`${summary.latePaymentCount} atrasos`}
  />

  <SummaryCard
    title="Pendente"
    value={formatCurrency(summary.totalPending)}
    icon="⏳"
    trend={summary.totalPending > 0 ? 'warning' : 'positive'}
    subtitle={`${payments.filter(p => p.status === 'PENDING').length} faturas`}
  />
</div>
```

### Invoice Downloads

**Document Types**:

1. **Invoice (Fatura)**:
   - Generated when payment is due
   - Contains: Amount, due date, payment instructions
   - Format: PDF
   - Available: Immediately when payment created

2. **Receipt (Recibo)**:
   - Generated after payment confirmed
   - Contains: Payment proof, transaction ID, paid date
   - Format: PDF
   - Available: Only for PAID status

**Download Flow**:
```
User clicks "Download" button
        ↓
Check authentication
        ↓
Verify document exists in Asaas
        ↓
Generate pre-signed URL (1-hour expiry)
        ↓
Return URL to client
        ↓
Open in new tab (browser downloads PDF)
```

**Implementation**:
```typescript
// Client-side
const downloadInvoice = async (paymentId: string, type: 'invoice' | 'receipt') => {
  try {
    setDownloading(paymentId)

    const response = await fetch(
      `/api/assinante/payment-history/${paymentId}/${type}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      throw new Error('Download failed')
    }

    const { downloadUrl } = await response.json()

    // Open in new tab (triggers download)
    window.open(downloadUrl, '_blank')

    toast.success('Download iniciado!')

  } catch (error) {
    toast.error('Erro ao baixar documento. Tente novamente.')
  } finally {
    setDownloading(null)
  }
}

// Server-side
export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string, type: string } }
) {
  try {
    const user = await authenticateRequest(request)

    // Verify ownership
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: { subscription: true }
    })

    if (!payment || payment.subscription.userId !== user.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Check document availability
    if (params.type === 'receipt' && payment.status !== 'PAID') {
      return NextResponse.json(
        {
          error: 'NOT_AVAILABLE',
          message: 'Recibo disponível apenas para pagamentos confirmados'
        },
        { status: 400 }
      )
    }

    // Fetch from Asaas
    const asaasResponse = await fetch(
      `https://api.asaas.com/v3/payments/${payment.asaasId}/${params.type}`,
      {
        headers: {
          'access_token': process.env.ASAAS_API_KEY_PROD
        }
      }
    )

    if (!asaasResponse.ok) {
      throw new Error('Asaas API error')
    }

    const { url } = await asaasResponse.json()

    // Return pre-signed URL (1-hour expiry)
    return NextResponse.json({
      downloadUrl: url,
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    })

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao gerar download' },
      { status: 500 }
    )
  }
}
```

**Download Button Component**:
```typescript
<Button
  size="sm"
  variant="ghost"
  onClick={() => downloadInvoice(payment.id, 'invoice')}
  disabled={downloading === payment.id}
>
  {downloading === payment.id ? (
    <Spinner size="sm" />
  ) : (
    <>
      <DownloadIcon className="w-4 h-4 mr-2" />
      Fatura
    </>
  )}
</Button>

{payment.status === 'PAID' && (
  <Button
    size="sm"
    variant="ghost"
    onClick={() => downloadInvoice(payment.id, 'receipt')}
  >
    <ReceiptIcon className="w-4 h-4 mr-2" />
    Recibo
  </Button>
)}
```

### Payment API Reference

Complete API documentation is in [Phase 3 Implementation Guide](./PHASE3_IMPLEMENTATION_GUIDE.md#payment-history).

**Key Endpoint**: `GET /api/assinante/payment-history`

**Response Example**:
```json
{
  "payments": [
    {
      "id": "pay_abc123",
      "status": "PAID",
      "amount": 89.90,
      "dueDate": "2025-10-01T00:00:00.000Z",
      "paidAt": "2025-09-30T14:23:45.000Z",
      "paymentMethod": "PIX",
      "description": "Assinatura Mensal - Outubro 2025",
      "invoiceUrl": "https://asaas.com/invoices/inv_123.pdf",
      "receiptUrl": "https://asaas.com/receipts/rec_123.pdf"
    }
  ],
  "summary": {
    "totalPaid": 2697.00,
    "totalPending": 89.90,
    "totalOverdue": 0.00,
    "onTimePaymentRate": 96.7,
    "averagePaymentTime": -1.2,
    "mostUsedMethod": "PIX"
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 35,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Delivery Preferences

### Delivery Preferences Overview

User-controlled delivery settings with Brazilian address management, automatic CEP lookup, and multi-channel notification preferences.

**Key Features**:
- 📍 Complete shipping address management
- 🔍 Automatic CEP lookup via ViaCEP API
- ✅ Brazilian address format validation
- 📞 Delivery contact phone number
- 🕐 Preferred delivery time windows
- 📆 Delivery frequency preferences
- 🔔 Multi-channel notifications (Email, WhatsApp, SMS)
- 💾 Optimistic UI updates for instant feedback

**User Benefits**:
- Control when and where deliveries arrive
- Automatic address validation (no typos)
- Reduced delivery failures
- Notification preferences match lifestyle
- Quick updates without page refreshes

### Address Management

**Brazilian Address Format**:
```
CEP: 12345-678
Rua/Avenida: Rua das Flores
Número: 123
Complemento: Apto 45 (optional)
Bairro: Centro
Cidade: Caratinga
Estado: MG (UF code)
```

**Required Fields**:
- ✅ CEP (8 digits with hyphen)
- ✅ Street (Rua, Avenida, Travessa, etc.)
- ✅ Number (numeric or "S/N" for no number)
- ✅ Neighborhood (Bairro)
- ✅ City (Cidade)
- ✅ State (UF: AC, AL, AP, ..., TO)
- ✅ Delivery phone number

**Optional Fields**:
- Complement (apartment, suite, block)
- Reference point (e.g., "próximo ao posto de gasolina")
- Delivery instructions (e.g., "deixar com porteiro")

**Special Cases**:
- **Rural addresses**: May not have CEP, allow manual entry
- **No number**: Use "S/N" (sem número)
- **PO Box**: Not supported for physical deliveries

### ViaCEP Integration

**Purpose**: Automatic Brazilian address lookup by CEP (postal code).

**API Details**:
- **Endpoint**: `https://viacep.com.br/ws/{cep}/json/`
- **Method**: GET
- **Rate Limit**: None (public API)
- **Response Time**: ~100-500ms
- **Availability**: 99.9% uptime

**Integration Flow**:
```
User enters CEP: 35300-000
        ↓
Remove formatting → 35300000
        ↓
Validate 8 digits
        ↓
Fetch from ViaCEP: GET /ws/35300000/json/
        ↓
Receive response:
{
  "cep": "35300-000",
  "logradouro": "Rua das Flores",
  "bairro": "Centro",
  "localidade": "Caratinga",
  "uf": "MG"
}
        ↓
Auto-fill form fields:
- Street: "Rua das Flores"
- Neighborhood: "Centro"
- City: "Caratinga"
- State: "MG"
        ↓
User completes:
- Number: "123"
- Complement: "Apto 45"
```

**Implementation**:
```typescript
interface CEPData {
  cep: string
  street: string      // logradouro
  neighborhood: string // bairro
  city: string        // localidade
  state: string       // uf
}

async function fetchCEP(cep: string): Promise<CEPData> {
  // Remove non-digit characters
  const cleanCEP = cep.replace(/\D/g, '')

  // Validate format
  if (cleanCEP.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos')
  }

  try {
    const response = await fetch(
      `https://viacep.com.br/ws/${cleanCEP}/json/`,
      {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }
    )

    if (!response.ok) {
      throw new Error('Erro ao buscar CEP')
    }

    const data = await response.json()

    // Check for error response
    if (data.erro) {
      throw new Error('CEP não encontrado')
    }

    return {
      cep: data.cep,
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Timeout ao buscar CEP. Tente novamente.')
    }
    throw error
  }
}
```

**React Component Integration**:
```typescript
const DeliveryPreferences = () => {
  const [formData, setFormData] = useState(initialData)
  const [isLoadingCEP, setIsLoadingCEP] = useState(false)
  const [manualEntry, setManualEntry] = useState(false)

  const handleCEPBlur = async (cep: string) => {
    if (!cep || cep.length < 8) return

    setIsLoadingCEP(true)
    setManualEntry(false)

    try {
      const address = await fetchCEP(cep)

      // Auto-fill address fields
      setFormData({
        ...formData,
        cep: address.cep,
        street: address.street,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state
      })

      toast.success('Endereço encontrado!')

    } catch (error) {
      toast.error(error.message)

      // Enable manual entry as fallback
      setManualEntry(true)

    } finally {
      setIsLoadingCEP(false)
    }
  }

  return (
    <form>
      {/* CEP Input */}
      <div className="flex gap-2 items-center">
        <Input
          label="CEP"
          value={formData.cep}
          onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
          onBlur={(e) => handleCEPBlur(e.target.value)}
          placeholder="12345-678"
          maxLength={9}
          required
        />
        {isLoadingCEP && <Spinner size="sm" />}
      </div>

      {/* Address Fields (disabled until CEP loaded or manual entry) */}
      <Input
        label="Rua"
        value={formData.street}
        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
        disabled={!manualEntry && isLoadingCEP}
        required
      />

      {/* ... other fields ... */}

      {/* Manual Entry Toggle */}
      {!manualEntry && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => setManualEntry(true)}
        >
          Preencher manualmente
        </Button>
      )}
    </form>
  )
}
```

**Error Handling**:
```typescript
// ViaCEP error scenarios

// 1. CEP not found
{
  "erro": true
}
→ Enable manual entry, show message: "CEP não encontrado. Preencha manualmente."

// 2. Network timeout
→ Show message: "Erro ao buscar CEP. Verifique sua conexão."
→ Enable manual entry

// 3. Invalid CEP format
→ Show message: "CEP inválido. Use formato: 12345-678"

// 4. ViaCEP API down (rare)
→ Show message: "Serviço de CEP temporariamente indisponível."
→ Enable manual entry immediately
```

### Form Validation

**Validation Schema** (Zod):
```typescript
import { z } from 'zod'

// Brazilian states (UF)
const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES',
  'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR',
  'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
] as const

const DeliveryPreferencesSchema = z.object({
  // Address
  cep: z.string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido. Use formato: 12345-678'),

  street: z.string()
    .min(3, 'Rua deve ter pelo menos 3 caracteres')
    .max(100, 'Rua muito longa'),

  number: z.string()
    .min(1, 'Número obrigatório')
    .max(10, 'Número muito longo'),

  complement: z.string()
    .max(50, 'Complemento muito longo')
    .optional(),

  neighborhood: z.string()
    .min(3, 'Bairro deve ter pelo menos 3 caracteres')
    .max(50, 'Bairro muito longo'),

  city: z.string()
    .min(3, 'Cidade deve ter pelo menos 3 caracteres')
    .max(50, 'Cidade muito longa'),

  state: z.enum(brazilianStates, {
    errorMap: () => ({ message: 'Estado inválido' })
  }),

  // Contact
  phone: z.string()
    .regex(
      /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/,
      'Telefone inválido. Use formato: (11) 98765-4321'
    ),

  alternatePhone: z.string()
    .regex(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/)
    .optional(),

  // Delivery Preferences
  preferredDeliveryTime: z.enum([
    'morning',    // 8h-12h
    'afternoon',  // 12h-18h
    'evening',    // 18h-21h
    'anytime'     // Qualquer horário
  ]),

  deliveryFrequency: z.enum([
    'weekly',
    'biweekly',
    'monthly'
  ]),

  deliveryInstructions: z.string()
    .max(200, 'Instruções muito longas')
    .optional(),

  // Notifications
  notificationEmail: z.boolean(),
  notificationWhatsApp: z.boolean(),
  notificationSMS: z.boolean()
})

export type DeliveryPreferences = z.infer<typeof DeliveryPreferencesSchema>
```

**Field-Level Validation**:
```typescript
// Real-time validation on blur
const validateField = (field: string, value: any) => {
  try {
    // Validate single field
    DeliveryPreferencesSchema.pick({ [field]: true }).parse({ [field]: value })
    setFieldErrors({ ...fieldErrors, [field]: null })
    return true
  } catch (error) {
    const zodError = error as z.ZodError
    setFieldErrors({
      ...fieldErrors,
      [field]: zodError.errors[0].message
    })
    return false
  }
}

// Example usage
<Input
  name="cep"
  value={formData.cep}
  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
  onBlur={(e) => validateField('cep', e.target.value)}
  error={fieldErrors.cep}
/>
```

**Submit Validation**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  // Validate entire form
  const validation = DeliveryPreferencesSchema.safeParse(formData)

  if (!validation.success) {
    // Extract all errors
    const errors = validation.error.flatten().fieldErrors

    // Set field errors
    setFieldErrors(errors)

    // Show global error toast
    toast.error('Preencha todos os campos obrigatórios corretamente')

    // Focus first error field
    const firstErrorField = Object.keys(errors)[0]
    document.querySelector(`[name="${firstErrorField}"]`)?.focus()

    return
  }

  // Proceed with save
  await savePreferences(validation.data)
}
```

### Optimistic Updates

**Purpose**: Provide instant UI feedback while saving to server, improving perceived performance.

**Pattern**:
```typescript
const savePreferences = async (newPrefs: DeliveryPreferences) => {
  // 1. Store old values for potential rollback
  const oldPreferences = { ...preferences }

  // 2. Update UI immediately (optimistic)
  setPreferences(newPrefs)
  setIsSaving(true)
  toast.info('Salvando preferências...', { duration: 1000 })

  try {
    // 3. Save to backend
    const response = await fetch('/api/assinante/delivery-preferences', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newPrefs)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Falha ao salvar')
    }

    // 4. Success - UI already updated
    toast.success('Preferências salvas com sucesso!', {
      duration: 3000,
      icon: '✅'
    })

    // 5. Revalidate cache (optional)
    mutate('/api/assinante/delivery-preferences')

  } catch (error) {
    // 6. Rollback UI on error
    setPreferences(oldPreferences)

    toast.error('Erro ao salvar preferências. Tente novamente.', {
      duration: 5000,
      action: {
        label: 'Tentar novamente',
        onClick: () => savePreferences(newPrefs)
      }
    })

    // Log error for debugging
    console.error('Save preferences error:', error)

  } finally {
    setIsSaving(false)
  }
}
```

**Benefits**:
- **Instant feedback**: UI updates immediately, no waiting
- **Smooth UX**: No loading spinners for successful saves
- **Error recovery**: Automatic rollback preserves data integrity
- **Retry mechanism**: Easy retry on failure

**Visual Feedback**:
```typescript
<Button
  type="submit"
  disabled={isSaving}
  className="w-full"
>
  {isSaving ? (
    <>
      <Spinner size="sm" className="mr-2" />
      Salvando...
    </>
  ) : (
    'Salvar Preferências'
  )}
</Button>

{/* Success indicator (shown briefly after save) */}
{showSuccessIndicator && (
  <div className="flex items-center gap-2 text-green-600">
    <CheckIcon className="w-4 h-4" />
    <span>Salvo automaticamente</span>
  </div>
)}
```

### Delivery API Reference

Complete API documentation is in [Phase 3 Implementation Guide](./PHASE3_IMPLEMENTATION_GUIDE.md#delivery-preferences).

**Key Endpoints**:

**GET** `/api/assinante/delivery-preferences`
```json
{
  "preferences": {
    "address": {
      "cep": "35300-000",
      "street": "Rua das Flores",
      "number": "123",
      "complement": "Apto 45",
      "neighborhood": "Centro",
      "city": "Caratinga",
      "state": "MG"
    },
    "contact": {
      "phone": "(33) 98765-4321"
    },
    "preferences": {
      "preferredDeliveryTime": "afternoon",
      "deliveryFrequency": "monthly"
    },
    "notifications": {
      "email": true,
      "whatsapp": true,
      "sms": false
    }
  }
}
```

**PUT** `/api/assinante/delivery-preferences`
- Updates all delivery preferences
- Validates Brazilian address format
- Returns updated preferences

---

## Testing

### Payment History Tests

**Unit Tests**:
```typescript
describe('Payment Summary Calculations', () => {
  it('should calculate total paid correctly', () => {
    const payments = [
      { status: 'PAID', amount: 89.90 },
      { status: 'PAID', amount: 89.90 },
      { status: 'PENDING', amount: 89.90 }
    ]

    const summary = calculatePaymentSummary(payments)

    expect(summary.totalPaid).toBe(179.80)
    expect(summary.totalPending).toBe(89.90)
  })

  it('should calculate on-time payment rate', () => {
    const payments = [
      { status: 'PAID', dueDate: '2025-10-01', paidAt: '2025-09-30' }, // On time
      { status: 'PAID', dueDate: '2025-10-01', paidAt: '2025-10-02' }  // Late
    ]

    const summary = calculatePaymentSummary(payments)

    expect(summary.onTimePaymentRate).toBe(50) // 1/2 = 50%
  })
})
```

**E2E Tests**:
```typescript
test('should filter payments by status', async ({ page }) => {
  await page.goto('/area-assinante/dashboard')
  await page.click('text=Pagamentos')

  // Apply filter
  await page.selectOption('[name="status"]', 'PAID')
  await page.click('button:has-text("Filtrar")')

  // Verify only PAID payments shown
  const paymentRows = await page.locator('[data-testid="payment-row"]').all()
  for (const row of paymentRows) {
    const status = await row.locator('[data-testid="payment-status"]').innerText()
    expect(status).toBe('Pago')
  }
})
```

### Delivery Preferences Tests

**Unit Tests**:
```typescript
describe('CEP Validation', () => {
  it('should accept valid CEP formats', () => {
    expect(validateCEP('12345-678')).toBe(true)
    expect(validateCEP('12345678')).toBe(true)
  })

  it('should reject invalid CEP formats', () => {
    expect(() => validateCEP('1234-567')).toThrow()
    expect(() => validateCEP('abcde-fgh')).toThrow()
  })
})
```

**Integration Tests**:
```typescript
describe('ViaCEP Integration', () => {
  it('should fetch address by CEP', async () => {
    const address = await fetchCEP('35300000')

    expect(address.city).toBe('Caratinga')
    expect(address.state).toBe('MG')
  })

  it('should handle invalid CEP', async () => {
    await expect(fetchCEP('00000000')).rejects.toThrow('CEP não encontrado')
  })
})
```

---

## Troubleshooting

### Payment History Issues

**Problem**: Payments not loading
```bash
# Check API endpoint
curl -H "Authorization: Bearer ${TOKEN}" \
  https://svlentes.shop/api/assinante/payment-history

# Check Asaas integration
journalctl -u svlentes-nextjs | grep -i asaas

# Verify database
docker exec -it postgres psql -U n8nuser -d n8ndb -c \
  "SELECT COUNT(*) FROM \"Payment\" WHERE \"userId\" = 'usr_abc123';"
```

**Solutions**:
1. Refresh page (clear cache)
2. Check Asaas API status
3. Verify database connection

---

### Delivery Preferences Issues

**Problem**: CEP not found
```bash
# Test ViaCEP API directly
curl https://viacep.com.br/ws/35300000/json/

# Check network connectivity
ping viacep.com.br
```

**Solutions**:
1. Verify CEP is correct (8 digits)
2. Use manual entry if CEP doesn't exist
3. Check ViaCEP API status page

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-24
**Maintained by**: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
**Contact**: saraivavision@gmail.com | (33) 98606-1427
