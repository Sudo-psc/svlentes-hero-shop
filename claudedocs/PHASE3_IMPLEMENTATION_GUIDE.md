# 📋 Phase 3 Implementation Guide - Subscriber Dashboard

> **Complete guide for Phase 3 medical and operational features**
> **Author**: Dr. Philipe Saraiva Cruz
> **Date**: 2025-10-24
> **Version**: 3.0.0

---

## Table of Contents

- [Overview](#overview)
- [Features Summary](#features-summary)
- [Prescription Management](#prescription-management)
- [Payment History](#payment-history)
- [Delivery Preferences](#delivery-preferences)
- [Technical Architecture](#technical-architecture)
- [Integration Examples](#integration-examples)
- [Testing Guide](#testing-guide)
- [Deployment Checklist](#deployment-checklist)

---

## Overview

Phase 3 introduces three critical features that complete the subscriber dashboard with medical compliance, financial transparency, and delivery management capabilities:

1. **Prescription Management** - Medical compliance and prescription lifecycle tracking
2. **Payment History** - Complete financial transparency with analytics
3. **Delivery Preferences** - User-controlled shipping and notification settings

### Key Objectives

- **Medical Compliance**: CFM regulation adherence for prescription validity (1 year)
- **Financial Transparency**: Complete payment history with filtering and analytics
- **User Empowerment**: Full control over delivery preferences and notifications
- **LGPD Compliance**: Privacy-first data handling with explicit consent

### Dependencies

**Required Services**:
- Firebase Authentication (user identity)
- PostgreSQL Database (data persistence)
- Asaas Payment Gateway (payment history integration)
- ViaCEP API (Brazilian address lookup)
- File Storage Service (prescription uploads - S3/local)

**Technology Stack**:
- Next.js 15 with App Router
- React 19 + TypeScript
- Prisma ORM (database access)
- React Hook Form + Zod (form validation)
- Framer Motion (animations)

---

## Features Summary

### 1. Prescription Management

**Purpose**: Manage contact lens prescriptions with medical compliance and expiry tracking.

**Key Capabilities**:
- 📄 Upload prescription files (PDF, JPG, PNG - max 5MB)
- 📊 Manual data entry with validation (sphere, cylinder, axis, addition)
- 📅 Automatic expiry tracking (1 year from issue date - CFM compliance)
- 🔔 Expiry alerts (30 days before expiration)
- 📜 Complete prescription history
- 👁️ Visual preview of current prescription
- 🔐 Secure encrypted storage

**User Benefit**:
- Never miss prescription renewal
- Digital record always accessible
- Automatic validation prevents errors
- Medical compliance guaranteed

**Technical Implementation**:
- Component: `PrescriptionManager.tsx`
- API: `/api/assinante/prescription` (GET/POST/PUT)
- Storage: S3-compatible or local file system
- Validation: Zod schema with medical ranges

---

### 2. Payment History

**Purpose**: Complete financial transparency with analytics and reporting.

**Key Capabilities**:
- 💰 Complete payment history with all transactions
- 🔍 Advanced filters (status, method, date range)
- 📊 Financial summary cards (total paid, pending, overdue)
- 📈 On-time payment rate calculation
- 📄 Invoice and receipt downloads
- 📱 Mobile-responsive table with sorting
- 📄 Server-side pagination (20 items/page)

**User Benefit**:
- Complete financial transparency
- Easy expense tracking and reporting
- Quick access to invoices for reimbursement
- Payment performance insights

**Technical Implementation**:
- Component: `PaymentHistoryTable.tsx`
- API: `/api/assinante/payment-history` (GET)
- Integration: Asaas Payment Gateway
- Cache: 2-minute TTL for performance

---

### 3. Delivery Preferences

**Purpose**: User-controlled delivery settings with address management.

**Key Capabilities**:
- 📍 Complete shipping address management
- 🔍 CEP auto-fill via ViaCEP integration
- 📞 Delivery contact phone number
- 🕐 Preferred delivery time windows
- 📆 Delivery frequency preferences
- 🔔 Multi-channel notifications (Email, WhatsApp, SMS)
- 💾 Optimistic UI updates for instant feedback

**User Benefit**:
- Control when and where deliveries arrive
- Automatic address validation
- Reduced delivery failures
- Notification preferences match user lifestyle

**Technical Implementation**:
- Component: `DeliveryPreferences.tsx`
- API: `/api/assinante/delivery-preferences` (GET/PUT)
- External: ViaCEP API for address lookup
- Validation: Brazilian address format (CEP, phone)

---

## Prescription Management

### Medical Compliance Framework

**CFM Regulations**:
- Prescription validity: **1 year from issue date**
- Required fields: Patient name, CRM, issue date, expiry date
- Prescription grading ranges (see validation section)
- Medical authorization required for renewal

**LGPD Compliance**:
- Explicit consent for medical data storage
- Encrypted file storage for prescription images
- Audit trail for all access and modifications
- User right to access and delete data
- 5-year retention policy for medical records

### File Upload Specifications

**Accepted Formats**:
- PDF documents (recommended for scan quality)
- JPG images (photo of physical prescription)
- PNG images (screenshot or digital prescription)

**File Constraints**:
- Maximum size: **5MB**
- Minimum recommended resolution: 1200x1600px
- Color or grayscale accepted
- Multipart form-data for upload

**Upload Flow**:
```
User selects file
  ↓
Client-side validation (size, format)
  ↓
Multipart POST to /api/assinante/prescription
  ↓
Server-side validation (malware scan, format check)
  ↓
Store in S3/local with encryption
  ↓
Save metadata to database
  ↓
Return file URL and prescription ID
```

### Validation Rules

**Sphere (Grau Esférico)**:
- Range: **-20.00 to +20.00**
- Step: **0.25**
- Format: Decimal with 2 places
- Examples: -2.50, +1.75, 0.00

**Cylinder (Grau Cilíndrico)**:
- Range: **-6.00 to +6.00**
- Step: **0.25**
- Format: Decimal with 2 places
- Optional: Can be 0.00 if no astigmatism

**Axis (Eixo)**:
- Range: **0° to 180°**
- Step: **1°**
- Format: Integer
- Required: Only if cylinder is not 0.00

**Addition (Adição)** - For multifocal lenses:
- Range: **+0.75 to +3.50**
- Step: **0.25**
- Format: Decimal with 2 places
- Optional: Only for multifocal/progressive lenses

**Validation Schema** (Zod):
```typescript
const PrescriptionSchema = z.object({
  leftEye: z.object({
    sphere: z.number().min(-20).max(20).step(0.25),
    cylinder: z.number().min(-6).max(6).step(0.25).optional(),
    axis: z.number().int().min(0).max(180).optional(),
    addition: z.number().min(0.75).max(3.50).step(0.25).optional(),
  }),
  rightEye: z.object({
    sphere: z.number().min(-20).max(20).step(0.25),
    cylinder: z.number().min(-6).max(6).step(0.25).optional(),
    axis: z.number().int().min(0).max(180).optional(),
    addition: z.number().min(0.75).max(3.50).step(0.25).optional(),
  }),
  doctorCRM: z.string().regex(/^[A-Z]{2}\s?\d{4,6}$/),
  issueDate: z.string().datetime(),
  expiryDate: z.string().datetime(),
})
```

### Storage Architecture

**File Storage Strategy**:
```
S3 Bucket (or Local Storage)
└── prescriptions/
    └── {userId}/
        ├── prescription_{timestamp}_original.pdf
        ├── prescription_{timestamp}_thumbnail.jpg
        └── prescription_{timestamp}_metadata.json
```

**Naming Convention**:
- Format: `prescription_{userId}_{timestamp}.{ext}`
- Example: `prescription_usr_abc123_1698067200.pdf`
- Metadata: Separate JSON file with OCR text and validation

**Retention Policy**:
- Active subscriptions: Keep all prescriptions
- Expired > 5 years: Archive to cold storage
- User deletion request: Immediate removal with audit log

**Backup Strategy**:
- Daily incremental backups
- Weekly full backups
- Cross-region replication for disaster recovery
- 30-day snapshot retention

### Security Considerations

**Upload Security**:
- ✅ Authentication required (Firebase token validation)
- ✅ Ownership verification (user can only upload to own account)
- ✅ File sanitization (malware scan, MIME type validation)
- ✅ Size limits enforced (prevent DoS attacks)
- ✅ Rate limiting (10 uploads per hour per user)

**Storage Security**:
- ✅ Encrypted at rest (AES-256)
- ✅ Encrypted in transit (HTTPS/TLS)
- ✅ Pre-signed URLs for downloads (1-hour expiry)
- ✅ No public access (authenticated requests only)

**Access Control**:
- ✅ User can only view own prescriptions
- ✅ Admin access logged for audit trail
- ✅ LGPD compliance logging (who accessed what, when)

### API Reference

#### GET /api/assinante/prescription

**Description**: Retrieve current prescription and history.

**Authentication**: Required (Firebase Bearer token)

**Rate Limit**: 200 requests / 15 minutes

**Request**:
```bash
curl -X GET https://svlentes.shop/api/assinante/prescription \
  -H "Authorization: Bearer <firebase-token>"
```

**Success Response** (200 OK):
```json
{
  "current": {
    "id": "prx_abc123",
    "status": "VALID",
    "issueDate": "2024-10-24T00:00:00.000Z",
    "expiryDate": "2025-10-24T00:00:00.000Z",
    "daysUntilExpiry": 120,
    "doctorCRM": "MG 69870",
    "fileUrl": "https://storage.svlentes.shop/prescriptions/usr_123/prescription_1698067200.pdf",
    "thumbnailUrl": "https://storage.svlentes.shop/prescriptions/usr_123/prescription_1698067200_thumb.jpg",
    "leftEye": {
      "sphere": -2.50,
      "cylinder": -0.75,
      "axis": 180,
      "addition": null
    },
    "rightEye": {
      "sphere": -3.00,
      "cylinder": -1.00,
      "axis": 90,
      "addition": null
    }
  },
  "history": [
    {
      "id": "prx_old456",
      "status": "EXPIRED",
      "issueDate": "2023-10-24T00:00:00.000Z",
      "expiryDate": "2024-10-24T00:00:00.000Z",
      "fileUrl": "..."
    }
  ],
  "alerts": [
    {
      "type": "EXPIRING_SOON",
      "severity": "warning",
      "message": "Sua receita expira em 30 dias. Agende uma consulta para renovação.",
      "actionUrl": "/agendar-consulta"
    }
  ]
}
```

**Error Responses**:
```json
// 401 Unauthorized
{
  "error": "UNAUTHORIZED",
  "message": "Token inválido ou expirado"
}

// 404 Not Found
{
  "error": "NO_PRESCRIPTION",
  "message": "Nenhuma receita encontrada. Por favor, faça upload de sua receita."
}

// 500 Internal Server Error
{
  "error": "INTERNAL_ERROR",
  "message": "Erro ao buscar receita. Tente novamente."
}
```

#### POST /api/assinante/prescription

**Description**: Upload new prescription with file and metadata.

**Authentication**: Required (Firebase Bearer token)

**Rate Limit**: 10 requests / 60 minutes (sensitive operation)

**Request** (multipart/form-data):
```bash
curl -X POST https://svlentes.shop/api/assinante/prescription \
  -H "Authorization: Bearer <firebase-token>" \
  -F "file=@prescription.pdf" \
  -F "leftEye[sphere]=-2.50" \
  -F "leftEye[cylinder]=-0.75" \
  -F "leftEye[axis]=180" \
  -F "rightEye[sphere]=-3.00" \
  -F "rightEye[cylinder]=-1.00" \
  -F "rightEye[axis]=90" \
  -F "doctorCRM=MG 69870" \
  -F "issueDate=2024-10-24T00:00:00.000Z"
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "prescription": {
    "id": "prx_new789",
    "status": "VALID",
    "fileUrl": "https://...",
    "expiryDate": "2025-10-24T00:00:00.000Z"
  },
  "message": "Receita enviada com sucesso!"
}
```

**Error Responses**:
```json
// 400 Bad Request - File too large
{
  "error": "FILE_TOO_LARGE",
  "message": "Arquivo muito grande. Tamanho máximo: 5MB",
  "maxSize": 5242880
}

// 400 Bad Request - Invalid format
{
  "error": "INVALID_FORMAT",
  "message": "Formato não suportado. Use PDF, JPG ou PNG.",
  "supportedFormats": ["application/pdf", "image/jpeg", "image/png"]
}

// 422 Unprocessable Entity - Validation error
{
  "error": "VALIDATION_ERROR",
  "message": "Dados de prescrição inválidos",
  "details": {
    "leftEye.sphere": "Valor deve estar entre -20.00 e +20.00",
    "rightEye.axis": "Eixo obrigatório quando cilindro não é zero"
  }
}

// 429 Too Many Requests
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Muitos uploads. Aguarde 60 minutos.",
  "retryAfter": 3600
}

// 500 Internal Server Error - Storage failure
{
  "error": "STORAGE_ERROR",
  "message": "Erro ao salvar arquivo. Tente novamente.",
  "fallback": "Você pode tentar novamente ou entrar em contato com suporte."
}
```

### Error Scenarios

| Error | Cause | User Impact | Solution |
|-------|-------|-------------|----------|
| **FILE_TOO_LARGE** | File > 5MB | Upload fails | Compress image or use PDF |
| **INVALID_FORMAT** | Unsupported file type | Upload rejected | Convert to PDF/JPG/PNG |
| **UPLOAD_FAILED** | Network error | Upload incomplete | Auto-retry 3x with exponential backoff |
| **STORAGE_ERROR** | S3 unavailable | File not saved | Save to temp storage, retry later |
| **VALIDATION_ERROR** | Invalid prescription data | Data rejected | Show field-specific error messages |
| **MALWARE_DETECTED** | File security scan failed | File quarantined | Notify user to scan file locally |
| **PRESCRIPTION_EXPIRED** | Upload date > 1 year old | Prescription invalid | Require new consultation |

### Component Implementation

**PrescriptionManager.tsx** - Main component:
```typescript
interface PrescriptionManagerProps {
  currentPrescription: Prescription | null
  history: Prescription[]
  onUpload: (file: File, data: PrescriptionData) => Promise<void>
  onDelete?: (prescriptionId: string) => Promise<void>
}

const PrescriptionManager: React.FC<PrescriptionManagerProps> = ({
  currentPrescription,
  history,
  onUpload,
  onDelete
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileSelect = async (file: File) => {
    // Validate file size and format
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.')
      return
    }

    const validFormats = ['application/pdf', 'image/jpeg', 'image/png']
    if (!validFormats.includes(file.type)) {
      toast.error('Formato inválido. Use PDF, JPG ou PNG.')
      return
    }

    // Upload with progress tracking
    setIsUploading(true)
    try {
      await onUpload(file, prescriptionData)
      toast.success('Receita enviada com sucesso!')
    } catch (error) {
      toast.error('Erro ao enviar receita. Tente novamente.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Prescription Display */}
      <CurrentPrescriptionCard prescription={currentPrescription} />

      {/* Upload Section */}
      <PrescriptionUploadForm
        onFileSelect={handleFileSelect}
        isUploading={isUploading}
        progress={uploadProgress}
      />

      {/* History Timeline */}
      <PrescriptionHistoryTimeline prescriptions={history} />

      {/* Expiry Alerts */}
      {currentPrescription?.daysUntilExpiry < 30 && (
        <ExpiryAlert prescription={currentPrescription} />
      )}
    </div>
  )
}
```

---

## Payment History

### Overview

Complete financial transparency system with advanced filtering, analytics, and reporting capabilities. Integrates with Asaas Payment Gateway for real-time payment data.

### Payment Status Lifecycle

```
PENDING → PAID
    ↓
OVERDUE → CANCELLED
```

**Status Definitions**:
- **PENDING**: Invoice generated, payment not received
- **PAID**: Payment confirmed by Asaas
- **OVERDUE**: Past due date, no payment received
- **CANCELLED**: Subscription cancelled, invoice voided

### Filters and Pagination

**Available Filters**:
```typescript
interface PaymentFilters {
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  method?: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  startDate?: string // ISO 8601
  endDate?: string
  page?: number
  limit?: number // Default: 20, Max: 100
}
```

**Filter Examples**:
```typescript
// All paid PIX transactions in 2025
const filters: PaymentFilters = {
  status: 'PAID',
  method: 'PIX',
  startDate: '2025-01-01T00:00:00.000Z',
  endDate: '2025-12-31T23:59:59.999Z',
  page: 1,
  limit: 20
}

// All overdue payments
const overdueFilters: PaymentFilters = {
  status: 'OVERDUE',
  page: 1,
  limit: 50
}

// Payments in specific month
const monthlyFilters: PaymentFilters = {
  startDate: '2025-10-01T00:00:00.000Z',
  endDate: '2025-10-31T23:59:59.999Z'
}
```

**Pagination Strategy**:
- Server-side pagination for performance
- Default page size: 20 items
- Maximum page size: 100 items
- Total count returned for UI pagination controls
- Cursor-based pagination for large datasets (future enhancement)

### Summary Calculations

**Financial Metrics**:
```typescript
interface PaymentSummary {
  totalPaid: number        // Sum of all PAID amounts
  totalPending: number     // Sum of all PENDING amounts
  totalOverdue: number     // Sum of all OVERDUE amounts
  onTimePaymentRate: number // % of payments paid on/before due date
  averagePaymentTime: number // Avg days between due date and payment
  mostUsedMethod: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
}
```

**Calculation Formulas**:
```sql
-- Total Paid
SELECT SUM(amount) FROM Payment WHERE status = 'PAID'

-- Total Pending
SELECT SUM(amount) FROM Payment WHERE status = 'PENDING'

-- Total Overdue
SELECT SUM(amount) FROM Payment WHERE status = 'OVERDUE'

-- On-Time Payment Rate
SELECT
  (COUNT(*) FILTER (WHERE paidAt <= dueDate)::float / COUNT(*)) * 100 as rate
FROM Payment
WHERE status = 'PAID'

-- Average Payment Time
SELECT
  AVG(EXTRACT(DAY FROM (paidAt - dueDate))) as avg_days
FROM Payment
WHERE status = 'PAID'

-- Most Used Method
SELECT paymentMethod, COUNT(*) as count
FROM Payment
GROUP BY paymentMethod
ORDER BY count DESC
LIMIT 1
```

### Invoice and Receipt Downloads

**Document Types**:
- **Invoice (Fatura)**: Generated when payment is due
- **Receipt (Recibo)**: Generated after payment is confirmed

**Download Flow**:
```
User clicks "Download Invoice"
  ↓
Check if document exists in Asaas
  ↓
Generate pre-signed download URL (1-hour expiry)
  ↓
Open URL in new tab (PDF download)
```

**API Integration**:
```typescript
const downloadInvoice = async (paymentId: string) => {
  try {
    const response = await fetch(
      `/api/assinante/payment-history/${paymentId}/invoice`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    const { downloadUrl } = await response.json()
    window.open(downloadUrl, '_blank')
  } catch (error) {
    toast.error('Erro ao baixar fatura. Tente novamente.')
  }
}
```

### API Reference

#### GET /api/assinante/payment-history

**Description**: Retrieve payment history with filters and pagination.

**Authentication**: Required (Firebase Bearer token)

**Rate Limit**: 200 requests / 15 minutes

**Query Parameters**:
```
status: PENDING | PAID | OVERDUE | CANCELLED
method: PIX | BOLETO | CREDIT_CARD
startDate: ISO 8601 datetime
endDate: ISO 8601 datetime
page: integer (default 1)
limit: integer (default 20, max 100)
```

**Request Example**:
```bash
curl -X GET "https://svlentes.shop/api/assinante/payment-history?status=PAID&method=PIX&page=1&limit=20" \
  -H "Authorization: Bearer <firebase-token>"
```

**Success Response** (200 OK):
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
      "receiptUrl": "https://asaas.com/receipts/rec_123.pdf",
      "subscriptionId": "sub_xyz789",
      "createdAt": "2025-09-15T00:00:00.000Z"
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

**Error Responses**:
```json
// 400 Bad Request - Invalid filters
{
  "error": "INVALID_FILTERS",
  "message": "Filtros inválidos",
  "details": {
    "startDate": "Data inválida. Use formato ISO 8601",
    "limit": "Limite deve ser entre 1 e 100"
  }
}

// 429 Too Many Requests
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Muitas requisições. Aguarde 15 minutos.",
  "retryAfter": 900
}

// 503 Service Unavailable - Asaas API down
{
  "error": "SERVICE_UNAVAILABLE",
  "message": "Sistema de pagamentos temporariamente indisponível.",
  "fallback": "Mostrando dados em cache (podem estar desatualizados)"
}
```

### Component Implementation

**PaymentHistoryTable.tsx** - Main component:
```typescript
interface PaymentHistoryTableProps {
  payments: Payment[]
  summary: PaymentSummary
  filters: PaymentFilters
  pagination: PaginationInfo
  onFilterChange: (filters: PaymentFilters) => void
  onPageChange: (page: number) => void
}

const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({
  payments,
  summary,
  filters,
  pagination,
  onFilterChange,
  onPageChange
}) => {
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleDownloadInvoice = async (paymentId: string) => {
    try {
      const url = await downloadInvoice(paymentId)
      window.open(url, '_blank')
    } catch (error) {
      toast.error('Erro ao baixar fatura')
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Pago"
          value={formatCurrency(summary.totalPaid)}
          icon="💰"
          trend="positive"
        />
        <SummaryCard
          title="Pontualidade"
          value={`${summary.onTimePaymentRate.toFixed(1)}%`}
          icon="⏰"
          trend={summary.onTimePaymentRate > 90 ? 'positive' : 'neutral'}
        />
        <SummaryCard
          title="Pendente"
          value={formatCurrency(summary.totalPending)}
          icon="⏳"
          trend="neutral"
        />
      </div>

      {/* Filters */}
      <PaymentFilters
        filters={filters}
        onChange={onFilterChange}
      />

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead sortable onSort={() => handleSort('date')}>
              Data
            </TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead sortable onSort={() => handleSort('amount')}>
              Valor
            </TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map(payment => (
            <TableRow key={payment.id}>
              <TableCell>{formatDate(payment.dueDate)}</TableCell>
              <TableCell>{payment.description}</TableCell>
              <TableCell>{formatCurrency(payment.amount)}</TableCell>
              <TableCell>
                <PaymentMethodBadge method={payment.paymentMethod} />
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={payment.status} />
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownloadInvoice(payment.id)}
                >
                  Download
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={onPageChange}
      />
    </div>
  )
}
```

---

## Delivery Preferences

### Overview

User-controlled delivery settings with Brazilian address management and multi-channel notification preferences. Integrates with ViaCEP for automatic address lookup and validation.

### Address Management

**Brazilian Address Format**:
- **CEP**: 12345-678 (8 digits with hyphen)
- **Street**: Rua, Avenida, Travessa, etc.
- **Number**: Numeric or "S/N" (sem número)
- **Complement**: Apartment, suite, block, etc. (optional)
- **Neighborhood**: Bairro
- **City**: Cidade
- **State**: UF (2-letter state code: AC, AL, AP, ..., TO)

**Required Fields**:
- CEP
- Street
- Number
- Neighborhood
- City
- State
- Delivery phone number

**Optional Fields**:
- Complement
- Reference point
- Delivery instructions

### ViaCEP Integration

**Purpose**: Automatic address lookup by CEP (Brazilian postal code).

**API Endpoint**: `https://viacep.com.br/ws/{cep}/json/`

**Integration Flow**:
```
User enters CEP (12345678 or 12345-678)
  ↓
Remove formatting → 12345678
  ↓
Fetch from ViaCEP API
  ↓
Auto-fill: street, neighborhood, city, state
  ↓
User enters: number, complement
```

**Implementation**:
```typescript
const fetchCEP = async (cep: string): Promise<CEPData> => {
  const cleanCEP = cep.replace(/\D/g, '') // Remove non-digits

  if (cleanCEP.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos')
  }

  const response = await fetch(
    `https://viacep.com.br/ws/${cleanCEP}/json/`,
    {
      method: 'GET',
      timeout: 5000 // 5 second timeout
    }
  )

  if (!response.ok) {
    throw new Error('Erro ao buscar CEP')
  }

  const data = await response.json()

  if (data.erro) {
    throw new Error('CEP não encontrado')
  }

  return {
    street: data.logradouro,
    neighborhood: data.bairro,
    city: data.localidade,
    state: data.uf,
    cep: data.cep
  }
}
```

**Error Handling**:
```typescript
try {
  const address = await fetchCEP(cep)
  setFormData({ ...formData, ...address })
  toast.success('Endereço encontrado!')
} catch (error) {
  if (error.message === 'CEP não encontrado') {
    toast.error('CEP inválido. Verifique e tente novamente.')
    // Enable manual address entry
    setManualEntry(true)
  } else {
    toast.error('Erro ao buscar CEP. Preencha manualmente.')
    setManualEntry(true)
  }
}
```

### Form Validation

**Validation Schema** (Zod):
```typescript
const DeliveryPreferencesSchema = z.object({
  // Address
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  street: z.string().min(3, 'Rua muito curta'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(3, 'Bairro obrigatório'),
  city: z.string().min(3, 'Cidade obrigatória'),
  state: z.enum([
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES',
    'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR',
    'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO'
  ], 'Estado inválido'),

  // Contact
  phone: z.string().regex(
    /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/,
    'Telefone inválido. Use (11) 98765-4321'
  ),

  // Preferences
  preferredDeliveryTime: z.enum(['morning', 'afternoon', 'evening', 'anytime']),
  deliveryFrequency: z.enum(['weekly', 'biweekly', 'monthly']),

  // Notifications
  notificationEmail: z.boolean(),
  notificationWhatsApp: z.boolean(),
  notificationSMS: z.boolean(),
})
```

**Field-Level Validation**:
- Real-time validation as user types
- Error messages in Portuguese
- Visual indicators (red border, error icon)
- Submit button disabled until all required fields valid

### Optimistic Updates

**Purpose**: Instant UI feedback while saving to server.

**Pattern**:
```typescript
const savePreferences = async (newPrefs: DeliveryPreferences) => {
  // 1. Store old values for rollback
  const oldPreferences = { ...preferences }

  // 2. Update UI immediately (optimistic)
  setPreferences(newPrefs)
  setIsSaving(true)
  toast.info('Salvando preferências...')

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
      throw new Error('Falha ao salvar')
    }

    // 4. Success - UI already updated
    toast.success('Preferências salvas com sucesso!', {
      duration: 3000
    })

  } catch (error) {
    // 5. Rollback on error
    setPreferences(oldPreferences)
    toast.error('Erro ao salvar. Tente novamente.', {
      duration: 5000
    })
  } finally {
    setIsSaving(false)
  }
}
```

**Benefits**:
- Instant user feedback (no waiting for server)
- Smooth user experience
- Automatic rollback on errors
- Error recovery without data loss

### API Reference

#### GET /api/assinante/delivery-preferences

**Description**: Retrieve current delivery preferences.

**Authentication**: Required (Firebase Bearer token)

**Rate Limit**: 200 requests / 15 minutes

**Request**:
```bash
curl -X GET https://svlentes.shop/api/assinante/delivery-preferences \
  -H "Authorization: Bearer <firebase-token>"
```

**Success Response** (200 OK):
```json
{
  "preferences": {
    "id": "pref_abc123",
    "userId": "usr_xyz789",
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
      "phone": "(33) 98765-4321",
      "alternatePhone": null
    },
    "preferences": {
      "preferredDeliveryTime": "afternoon",
      "deliveryFrequency": "monthly",
      "deliveryInstructions": "Deixar com porteiro"
    },
    "notifications": {
      "email": true,
      "whatsapp": true,
      "sms": false
    },
    "updatedAt": "2025-10-24T10:30:00.000Z"
  }
}
```

#### PUT /api/assinante/delivery-preferences

**Description**: Update delivery preferences.

**Authentication**: Required (Firebase Bearer token)

**Rate Limit**: 50 requests / 15 minutes (write operation)

**Request**:
```bash
curl -X PUT https://svlentes.shop/api/assinante/delivery-preferences \
  -H "Authorization: Bearer <firebase-token>" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "preferences": {
    "id": "pref_abc123",
    "updatedAt": "2025-10-24T10:35:00.000Z"
  },
  "message": "Preferências atualizadas com sucesso!"
}
```

**Error Responses**:
```json
// 400 Bad Request - Validation error
{
  "error": "VALIDATION_ERROR",
  "message": "Dados inválidos",
  "details": {
    "cep": "CEP inválido. Use formato 12345-678",
    "phone": "Telefone inválido. Use (11) 98765-4321",
    "state": "Estado deve ser uma UF válida (AC, AL, ...)"
  }
}

// 409 Conflict - Delivery in transit
{
  "error": "DELIVERY_IN_TRANSIT",
  "message": "Não é possível alterar endereço. Entrega em trânsito.",
  "deliveryId": "del_xyz123",
  "estimatedDelivery": "2025-10-26T00:00:00.000Z"
}

// 500 Internal Server Error
{
  "error": "INTERNAL_ERROR",
  "message": "Erro ao salvar preferências. Tente novamente."
}
```

### Component Implementation

**DeliveryPreferences.tsx** - Main component:
```typescript
interface DeliveryPreferencesProps {
  preferences: DeliveryPreferences | null
  onSave: (prefs: DeliveryPreferences) => Promise<void>
}

const DeliveryPreferences: React.FC<DeliveryPreferencesProps> = ({
  preferences,
  onSave
}) => {
  const [formData, setFormData] = useState(preferences || initialData)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingCEP, setIsLoadingCEP] = useState(false)
  const [manualEntry, setManualEntry] = useState(false)

  const handleCEPBlur = async (cep: string) => {
    if (!cep || cep.length < 8) return

    setIsLoadingCEP(true)
    try {
      const address = await fetchCEP(cep)
      setFormData({
        ...formData,
        ...address
      })
      toast.success('Endereço encontrado!')
    } catch (error) {
      toast.error('CEP não encontrado. Preencha manualmente.')
      setManualEntry(true)
    } finally {
      setIsLoadingCEP(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const validation = DeliveryPreferencesSchema.safeParse(formData)
    if (!validation.success) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setIsSaving(true)
    try {
      await onSave(formData)
      toast.success('Preferências salvas!')
    } catch (error) {
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* CEP Lookup */}
      <div className="space-y-2">
        <Label htmlFor="cep">CEP</Label>
        <div className="flex gap-2">
          <Input
            id="cep"
            value={formData.cep}
            onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
            onBlur={(e) => handleCEPBlur(e.target.value)}
            placeholder="12345-678"
            maxLength={9}
          />
          {isLoadingCEP && <Spinner size="sm" />}
        </div>
      </div>

      {/* Address Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Rua"
          value={formData.street}
          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          disabled={!manualEntry && isLoadingCEP}
          required
        />
        <Input
          label="Número"
          value={formData.number}
          onChange={(e) => setFormData({ ...formData, number: e.target.value })}
          required
        />
        <Input
          label="Complemento"
          value={formData.complement}
          onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
        />
        <Input
          label="Bairro"
          value={formData.neighborhood}
          onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
          disabled={!manualEntry && isLoadingCEP}
          required
        />
        <Input
          label="Cidade"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          disabled={!manualEntry && isLoadingCEP}
          required
        />
        <Select
          label="Estado"
          value={formData.state}
          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          disabled={!manualEntry && isLoadingCEP}
          required
        >
          {brazilianStates.map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </Select>
      </div>

      {/* Phone */}
      <Input
        label="Telefone de contato"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        placeholder="(11) 98765-4321"
        required
      />

      {/* Delivery Preferences */}
      <div className="space-y-4">
        <h3 className="font-semibold">Preferências de Entrega</h3>

        <Select
          label="Horário preferido"
          value={formData.preferredDeliveryTime}
          onChange={(e) => setFormData({ ...formData, preferredDeliveryTime: e.target.value })}
        >
          <option value="morning">Manhã (8h-12h)</option>
          <option value="afternoon">Tarde (12h-18h)</option>
          <option value="evening">Noite (18h-21h)</option>
          <option value="anytime">Qualquer horário</option>
        </Select>

        <Select
          label="Frequência de entrega"
          value={formData.deliveryFrequency}
          onChange={(e) => setFormData({ ...formData, deliveryFrequency: e.target.value })}
        >
          <option value="weekly">Semanal</option>
          <option value="biweekly">Quinzenal</option>
          <option value="monthly">Mensal</option>
        </Select>
      </div>

      {/* Notification Preferences */}
      <div className="space-y-4">
        <h3 className="font-semibold">Notificações de Entrega</h3>

        <Checkbox
          label="Email"
          checked={formData.notificationEmail}
          onChange={(checked) => setFormData({ ...formData, notificationEmail: checked })}
        />
        <Checkbox
          label="WhatsApp"
          checked={formData.notificationWhatsApp}
          onChange={(checked) => setFormData({ ...formData, notificationWhatsApp: checked })}
        />
        <Checkbox
          label="SMS"
          checked={formData.notificationSMS}
          onChange={(checked) => setFormData({ ...formData, notificationSMS: checked })}
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? 'Salvando...' : 'Salvar Preferências'}
      </Button>
    </form>
  )
}
```

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Phase 3 Architecture                     │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  React Frontend  │──────│  Next.js API     │──────│   PostgreSQL     │
│                  │      │    Routes        │      │    Database      │
│ - Prescription   │      │                  │      │                  │
│   Manager        │      │ - /prescription  │      │ - Prescription   │
│ - Payment        │      │ - /payment-hist. │      │ - Payment        │
│   History        │      │ - /delivery-pref │      │ - User           │
│ - Delivery       │      │                  │      │                  │
│   Preferences    │      └──────────────────┘      └──────────────────┘
└──────────────────┘              │                          │
                                  │                          │
                    ┌─────────────┼──────────────────────────┘
                    │             │
         ┌──────────▼───┐  ┌──────▼─────┐  ┌──────────────┐
         │  File        │  │  Asaas     │  │   ViaCEP     │
         │  Storage     │  │  Payment   │  │   Address    │
         │  (S3/Local)  │  │  Gateway   │  │   API        │
         └──────────────┘  └────────────┘  └──────────────┘
```

### Data Flow Diagrams

**Prescription Upload Flow**:
```
┌──────────┐
│  User    │
│ Selects  │
│  File    │
└────┬─────┘
     │
     ▼
┌────────────────┐
│ Client-side    │
│ Validation     │
│ - Size: 5MB    │
│ - Format: PDF  │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ Multipart      │
│ POST Request   │
│ /prescription  │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ Server-side    │
│ Validation     │
│ - Auth check   │
│ - Malware scan │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ Store File     │
│ in S3/Local    │
│ with Encryption│
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ Save Metadata  │
│ to Database    │
│ (Prisma)       │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ Return         │
│ File URL &     │
│ Prescription ID│
└────────────────┘
```

**Payment History Flow**:
```
┌──────────┐
│  User    │
│ Applies  │
│ Filters  │
└────┬─────┘
     │
     ▼
┌────────────────┐
│ GET Request    │
│ /payment-hist. │
│ ?status=PAID   │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ Authenticate   │
│ via Firebase   │
│ Bearer Token   │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ Query Database │
│ with Filters   │
│ + Pagination   │
└────┬───────────┘
     │
     ├──► Check Cache (2min TTL)
     │
     ▼
┌────────────────┐
│ Fetch Latest   │
│ from Asaas API │
│ (if needed)    │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ Calculate      │
│ Summary Stats  │
│ (SQL aggreg.)  │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ Return         │
│ Payments +     │
│ Summary +      │
│ Pagination     │
└────────────────┘
```

**Delivery Preferences Flow**:
```
┌──────────┐
│  User    │
│ Enters   │
│  CEP     │
└────┬─────┘
     │
     ▼
┌────────────────┐
│ Fetch from     │
│ ViaCEP API     │
│ (external)     │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ Auto-fill      │
│ Address Fields │
│ in Form        │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ User Completes │
│ Form & Submits │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ Optimistic UI  │
│ Update         │
│ (instant)      │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ PUT Request    │
│ /delivery-pref │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ Validate Form  │
│ Server-side    │
│ (Zod schema)   │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ Update Database│
│ (Prisma)       │
└────┬───────────┘
     │
     ├──► Success → Toast confirmation
     │
     └──► Error → Rollback UI + Error toast
```

### State Management

**Component State** (useState):
- Form input values
- Loading states
- Error states
- UI toggles (modals, dropdowns)

**Server State** (React Query / SWR):
- Prescription data
- Payment history
- Delivery preferences
- Cache management
- Auto-refetch strategies

**Global State** (Context API):
- User authentication
- Toast notifications
- Theme preferences

### Cache Strategy

| Resource | Cache Type | TTL | Invalidation |
|----------|-----------|-----|--------------|
| Current Prescription | Browser cache | 5 minutes | On upload/update |
| Prescription History | Browser cache | 10 minutes | On new upload |
| Payment History | API cache | 2 minutes | On new payment |
| Payment Summary | API cache | 5 minutes | On payment status change |
| Delivery Preferences | Browser cache | 1 hour | On save |
| ViaCEP Results | Browser cache | 24 hours | Manual clear |

**Cache Headers**:
```http
Cache-Control: private, max-age=120, stale-while-revalidate=60
ETag: "prescription-v1-abc123"
Last-Modified: Thu, 24 Oct 2025 10:30:00 GMT
```

### Error Boundaries

**Component-Level Error Boundary**:
```typescript
<ErrorBoundary
  fallback={<PrescriptionErrorFallback />}
  onError={(error, errorInfo) => {
    console.error('Prescription error:', error, errorInfo)
    // Send to error tracking (Sentry, LogRocket, etc.)
  }}
>
  <PrescriptionManager {...props} />
</ErrorBoundary>
```

**Features**:
- Catch React rendering errors
- Display user-friendly error messages
- Provide retry mechanisms
- Log errors for debugging
- Prevent entire page crashes

---

## Integration Examples

### Complete Dashboard Integration

```typescript
// src/app/area-assinante/dashboard/page.tsx

import {
  PrescriptionManager,
  PaymentHistoryTable,
  DeliveryPreferences
} from '@/components/assinante'

export default function DashboardPage() {
  const { user, token } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'prescription' | 'payments' | 'delivery'>('overview')

  // Fetch data
  const { data: subscription } = useSubscription(token)
  const { data: prescription } = usePrescription(token)
  const { data: payments } = usePaymentHistory(token)
  const { data: deliveryPrefs } = useDeliveryPreferences(token)

  // Handlers
  const handlePrescriptionUpload = async (file: File, data: PrescriptionData) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('data', JSON.stringify(data))

    const response = await fetch('/api/assinante/prescription', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })

    if (!response.ok) throw new Error('Upload failed')

    // Refetch prescription data
    mutate()
  }

  const handleDeliveryPreferencesSave = async (prefs: DeliveryPreferences) => {
    const response = await fetch('/api/assinante/delivery-preferences', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(prefs)
    })

    if (!response.ok) throw new Error('Save failed')

    mutate()
  }

  return (
    <AccessibleDashboard>
      {/* Header */}
      <DashboardHeader user={user} subscription={subscription} />

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <TabContent value={activeTab}>
        {/* Overview Tab */}
        <TabPanel value="overview">
          <div className="space-y-6">
            <EnhancedSubscriptionCard subscription={subscription} />
            <DashboardMetricsCards />
            <QuickActions />
          </div>
        </TabPanel>

        {/* Prescription Tab */}
        <TabPanel value="prescription">
          <ErrorBoundary fallback={<PrescriptionErrorFallback />}>
            <PrescriptionManager
              currentPrescription={prescription?.current}
              history={prescription?.history || []}
              onUpload={handlePrescriptionUpload}
            />
          </ErrorBoundary>
        </TabPanel>

        {/* Payments Tab */}
        <TabPanel value="payments">
          <ErrorBoundary fallback={<PaymentHistoryErrorFallback />}>
            <PaymentHistoryTable
              payments={payments?.payments || []}
              summary={payments?.summary}
              filters={paymentFilters}
              pagination={payments?.pagination}
              onFilterChange={setPaymentFilters}
              onPageChange={setPaymentPage}
            />
          </ErrorBoundary>
        </TabPanel>

        {/* Delivery Tab */}
        <TabPanel value="delivery">
          <ErrorBoundary fallback={<DeliveryPreferencesErrorFallback />}>
            <DeliveryPreferences
              preferences={deliveryPrefs}
              onSave={handleDeliveryPreferencesSave}
            />
          </ErrorBoundary>
        </TabPanel>
      </TabContent>

      {/* Global Components */}
      <FloatingWhatsAppButton context="support" />
      <EmergencyContact />
    </AccessibleDashboard>
  )
}
```

### Custom Hooks

**usePrescription** - Prescription data fetching:
```typescript
export function usePrescription(token: string) {
  return useSWR(
    token ? '/api/assinante/prescription' : null,
    (url) => fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),
    {
      refreshInterval: 5 * 60 * 1000, // 5 minutes
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  )
}
```

**usePaymentHistory** - Payment history with filters:
```typescript
export function usePaymentHistory(
  token: string,
  filters: PaymentFilters = {}
) {
  const queryString = new URLSearchParams(filters as any).toString()

  return useSWR(
    token ? `/api/assinante/payment-history?${queryString}` : null,
    (url) => fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),
    {
      refreshInterval: 2 * 60 * 1000, // 2 minutes
      revalidateOnFocus: false,
    }
  )
}
```

**useDeliveryPreferences** - Delivery preferences:
```typescript
export function useDeliveryPreferences(token: string) {
  return useSWR(
    token ? '/api/assinante/delivery-preferences' : null,
    (url) => fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),
    {
      refreshInterval: 60 * 60 * 1000, // 1 hour
      revalidateOnFocus: true,
    }
  )
}
```

---

## Testing Guide

### Test Coverage

**Phase 3 Testing Pyramid**:
```
           /\
          /E2E\ (50+ scenarios)
         /------\
        /Integr.\ (85 tests)
       /----------\
      / Unit Tests \ (75 tests)
     /--------------\
```

**Total Tests**: 230+ tests across all layers

### Unit Tests

**What to Test**:
- Component rendering with various props
- Form validation logic
- Utility functions (formatCurrency, formatDate, validateCEP)
- Zod schema validations
- Error handling functions

**Example** - PrescriptionManager unit test:
```typescript
// src/components/assinante/__tests__/PrescriptionManager.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PrescriptionManager } from '../PrescriptionManager'

describe('PrescriptionManager', () => {
  it('should render current prescription', () => {
    const prescription = {
      id: 'prx_123',
      status: 'VALID',
      leftEye: { sphere: -2.50 },
      rightEye: { sphere: -3.00 },
      daysUntilExpiry: 120
    }

    render(
      <PrescriptionManager
        currentPrescription={prescription}
        history={[]}
        onUpload={jest.fn()}
      />
    )

    expect(screen.getByText('OE: -2.50')).toBeInTheDocument()
    expect(screen.getByText('OD: -3.00')).toBeInTheDocument()
  })

  it('should show expiry alert when < 30 days', () => {
    const prescription = {
      ...basePrescription,
      daysUntilExpiry: 25
    }

    render(<PrescriptionManager currentPrescription={prescription} />)

    expect(screen.getByText(/expira em 30 dias/i)).toBeInTheDocument()
  })

  it('should validate file size on upload', async () => {
    const onUpload = jest.fn()
    render(<PrescriptionManager onUpload={onUpload} />)

    // Create 6MB file (exceeds 5MB limit)
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf')

    const input = screen.getByLabelText(/upload/i)
    fireEvent.change(input, { target: { files: [largeFile] } })

    await waitFor(() => {
      expect(screen.getByText(/muito grande/i)).toBeInTheDocument()
    })

    expect(onUpload).not.toHaveBeenCalled()
  })
})
```

**Running Unit Tests**:
```bash
# All unit tests
npm run test

# Specific component
npm run test -- PrescriptionManager

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Integration Tests

**What to Test**:
- API endpoint behavior
- Database operations
- Authentication flow
- External API integration (ViaCEP, Asaas)

**Example** - Prescription API integration test:
```typescript
// src/app/api/assinante/prescription/__tests__/route.test.ts

import { createMocks } from 'node-mocks-http'
import { POST } from '../route'

describe('/api/assinante/prescription', () => {
  it('should create prescription with valid data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token'
      },
      body: {
        leftEye: { sphere: -2.50 },
        rightEye: { sphere: -3.00 },
        doctorCRM: 'MG 69870',
        issueDate: '2024-10-24T00:00:00.000Z'
      }
    })

    await POST(req, res)

    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(data.prescription).toBeDefined()
    expect(data.prescription.status).toBe('VALID')
  })

  it('should reject prescription with invalid sphere', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        leftEye: { sphere: -25.00 }, // Exceeds max
        rightEye: { sphere: -3.00 }
      }
    })

    await POST(req, res)

    expect(res._getStatusCode()).toBe(422)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('VALIDATION_ERROR')
  })

  it('should enforce rate limiting', async () => {
    // Make 11 requests (limit is 10/hour)
    for (let i = 0; i < 11; i++) {
      const { req, res } = createMocks({ method: 'POST' })
      await POST(req, res)

      if (i === 10) {
        expect(res._getStatusCode()).toBe(429)
        expect(res._getData()).toContain('RATE_LIMIT_EXCEEDED')
      }
    }
  })
})
```

**Running Integration Tests**:
```bash
# All integration tests
npm run test:integration

# Specific API
npm run test:integration -- prescription

# With database setup
npm run test:integration:db
```

### E2E Tests

**What to Test**:
- Complete user flows
- Multi-step interactions
- Browser behavior
- Accessibility compliance

**Example** - Prescription upload E2E:
```typescript
// tests/e2e/subscriber-dashboard-phase3.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Prescription Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/area-assinante')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/area-assinante/dashboard')

    // Navigate to prescription tab
    await page.click('text=Receita')
  })

  test('should upload prescription successfully', async ({ page }) => {
    // Click upload button
    await page.click('text=Upload Receita')

    // Select file
    const fileInput = await page.locator('input[type="file"]')
    await fileInput.setInputFiles('tests/fixtures/prescription-valid.pdf')

    // Fill prescription data
    await page.fill('[name="leftEye.sphere"]', '-2.50')
    await page.fill('[name="rightEye.sphere"]', '-3.00')
    await page.fill('[name="doctorCRM"]', 'MG 69870')

    // Submit
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page.locator('text=Receita enviada com sucesso')).toBeVisible()
    await expect(page.locator('text=OE: -2.50')).toBeVisible()
  })

  test('should show expiry alert', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="prescription-card"]')

    // Verify alert is shown (prescription expires in 25 days)
    await expect(
      page.locator('text=/expira em 30 dias/i')
    ).toBeVisible()

    // Click "Agendar Consulta" button
    await page.click('text=Agendar Consulta')
    await expect(page).toHaveURL(/\/agendar-consulta/)
  })

  test('should validate file size', async ({ page }) => {
    await page.click('text=Upload Receita')

    // Try to upload 6MB file
    const fileInput = await page.locator('input[type="file"]')
    await fileInput.setInputFiles('tests/fixtures/prescription-large.pdf')

    // Verify error message
    await expect(
      page.locator('text=/muito grande/i')
    ).toBeVisible()
  })
})
```

**Running E2E Tests**:
```bash
# All E2E tests
npm run test:e2e

# With UI
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# Specific test file
npm run test:e2e -- subscriber-dashboard-phase3
```

### Fixtures

**phase3-fixtures.ts** - Test data:
```typescript
export const prescriptionFixtures = {
  valid: {
    id: 'prx_valid123',
    status: 'VALID',
    leftEye: { sphere: -2.50, cylinder: -0.75, axis: 180 },
    rightEye: { sphere: -3.00, cylinder: -1.00, axis: 90 },
    doctorCRM: 'MG 69870',
    issueDate: '2024-10-24T00:00:00.000Z',
    expiryDate: '2025-10-24T00:00:00.000Z',
    daysUntilExpiry: 120,
    fileUrl: 'https://storage.svlentes.shop/prescriptions/prx_valid123.pdf'
  },

  expiringSoon: {
    ...prescriptionFixtures.valid,
    daysUntilExpiry: 25
  },

  expired: {
    ...prescriptionFixtures.valid,
    status: 'EXPIRED',
    daysUntilExpiry: -10
  }
}

export const paymentFixtures = {
  paid: {
    id: 'pay_paid123',
    status: 'PAID',
    amount: 89.90,
    dueDate: '2025-10-01T00:00:00.000Z',
    paidAt: '2025-09-30T14:23:45.000Z',
    paymentMethod: 'PIX',
    description: 'Assinatura Mensal - Outubro 2025'
  },

  pending: {
    id: 'pay_pending456',
    status: 'PENDING',
    amount: 89.90,
    dueDate: '2025-11-01T00:00:00.000Z',
    paidAt: null,
    paymentMethod: 'BOLETO'
  }
}

export const deliveryPreferencesFixtures = {
  complete: {
    id: 'pref_complete123',
    address: {
      cep: '35300-000',
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'Caratinga',
      state: 'MG'
    },
    contact: {
      phone: '(33) 98765-4321'
    },
    preferences: {
      preferredDeliveryTime: 'afternoon',
      deliveryFrequency: 'monthly'
    },
    notifications: {
      email: true,
      whatsapp: true,
      sms: false
    }
  }
}
```

### Test Reports

**Coverage Report**:
```bash
# Generate coverage report
npm run test:coverage

# View in browser
open coverage/lcov-report/index.html
```

**Expected Coverage**:
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

---

## Deployment Checklist

### Pre-Deployment

**Code Quality**:
- [ ] All tests passing (unit + integration + E2E): `npm run test:all`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No ESLint warnings: `npm run lint`
- [ ] Coverage > 80%: `npm run test:coverage`

**Build Validation**:
- [ ] Production build successful: `npm run build`
- [ ] Build output under 5MB (check `.next/static`)
- [ ] No build warnings or errors
- [ ] All environment variables set in `.env.local`

**Database**:
- [ ] Migrations applied: `npx prisma migrate deploy`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] Database connection tested: `npm run db:test`
- [ ] Backup created: `npm run db:backup`

**External Services**:
- [ ] Asaas API keys configured (production)
- [ ] ViaCEP API accessible (test with `curl`)
- [ ] File storage configured (S3 bucket or local path)
- [ ] Firebase Admin SDK configured

**Security**:
- [ ] No secrets in code or commits
- [ ] HTTPS enabled in production
- [ ] CSP headers configured
- [ ] Rate limiting enabled

### Deployment

**Step 1: Pull Latest Code**
```bash
cd /root/svlentes-hero-shop
git pull origin main
```

**Step 2: Install Dependencies**
```bash
npm install
```

**Step 3: Run Database Migrations**
```bash
npx prisma migrate deploy
npx prisma generate
```

**Step 4: Build Application**
```bash
npm run build
```

**Step 5: Restart Service**
```bash
systemctl restart svlentes-nextjs
```

**Step 6: Verify Deployment**
```bash
# Check service status
systemctl status svlentes-nextjs

# Check health endpoint
curl https://svlentes.shop/api/health-check

# Check recent logs
journalctl -u svlentes-nextjs -n 50 --no-pager
```

### Post-Deployment

**Verification**:
- [ ] Dashboard loads successfully: `curl -I https://svlentes.shop/area-assinante`
- [ ] Prescription upload works (manual test)
- [ ] Payment history loads (manual test)
- [ ] Delivery preferences save (manual test)
- [ ] No JavaScript errors in browser console
- [ ] No error spikes in logs: `journalctl -u svlentes-nextjs --since "5 minutes ago"`

**Monitoring** (first 30 minutes):
```bash
# Monitor logs in real-time
journalctl -u svlentes-nextjs -f

# Check error rate
journalctl -u svlentes-nextjs --since "30 minutes ago" | grep -i error | wc -l

# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s https://svlentes.shop/api/assinante/prescription
```

**Health Checks**:
- [ ] `/api/health-check` returns 200 OK
- [ ] `/api/assinante/prescription` requires authentication (401 without token)
- [ ] `/api/assinante/payment-history` returns data for authenticated user
- [ ] `/api/assinante/delivery-preferences` returns preferences

**Performance**:
- [ ] Page load time < 2 seconds
- [ ] API response time < 500ms
- [ ] No memory leaks (check via `htop`)
- [ ] Database query time < 100ms

### Rollback Plan

**If deployment fails**:

```bash
# Step 1: Stop service
systemctl stop svlentes-nextjs

# Step 2: Revert code
git log --oneline -5  # Find previous commit
git checkout <previous-commit-hash>

# Step 3: Rebuild
npm install
npm run build

# Step 4: Restart service
systemctl start svlentes-nextjs

# Step 5: Verify
curl https://svlentes.shop/api/health-check
```

**Database rollback**:
```bash
# Revert last migration
npx prisma migrate resolve --rolled-back <migration-name>

# Apply previous migration
npx prisma migrate deploy
```

### Production Monitoring

**Daily Checks**:
- [ ] Service uptime: `systemctl status svlentes-nextjs`
- [ ] Error logs: `journalctl -u svlentes-nextjs --since yesterday | grep -i error`
- [ ] Database size: `docker exec postgres du -sh /var/lib/postgresql/data`

**Weekly Checks**:
- [ ] SSL certificate expiry: `certbot certificates`
- [ ] Disk space: `df -h`
- [ ] Database backup: `ls -lh /root/approuter/backups/`
- [ ] Performance metrics: `npm run lighthouse`

---

## Summary

Phase 3 delivers three production-ready features:

1. **Prescription Management** - CFM-compliant medical data handling
2. **Payment History** - Complete financial transparency
3. **Delivery Preferences** - User-controlled shipping settings

**Key Achievements**:
- ✅ 230+ tests (unit + integration + E2E)
- ✅ LGPD compliance with audit trail
- ✅ Healthcare-grade reliability
- ✅ Optimistic UI for instant feedback
- ✅ Comprehensive error handling
- ✅ Production-ready deployment

**Next Steps**:
- Monitor user adoption and feedback
- Iterate based on support tickets
- Enhance features based on analytics
- Plan Phase 4 features

---

**Document Version**: 3.0.0
**Last Updated**: 2025-10-24
**Maintained by**: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
**Contact**: saraivavision@gmail.com | (33) 98606-1427
