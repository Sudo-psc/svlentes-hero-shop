# LGPD Audit Usage Examples

**Guia prático de como usar o sistema de auditoria LGPD**

---

## 📚 Table of Contents

1. [Import Pattern](#import-pattern)
2. [Prescription Audit Examples](#prescription-audit-examples)
3. [Payment History Audit Examples](#payment-history-audit-examples)
4. [Invoice Audit Examples](#invoice-audit-examples)
5. [Delivery Preferences Audit Examples](#delivery-preferences-audit-examples)
6. [Querying Audit Logs](#querying-audit-logs)
7. [Error Handling](#error-handling)

---

## Import Pattern

**Padrão de import para todos os endpoints**:

```typescript
import { logAudit, AuditAction } from '@/lib/audit-logger'
```

**Enum de ações disponíveis** (16 ações):

```typescript
enum AuditAction {
  // Subscription Management
  UPDATE_SHIPPING_ADDRESS,
  CHANGE_SUBSCRIPTION_PLAN,
  UPDATE_DELIVERY_PREFERENCES,
  PAUSE_SUBSCRIPTION,
  RESUME_SUBSCRIPTION,
  CANCEL_SUBSCRIPTION,

  // Payment Operations
  UPDATE_PAYMENT_METHOD,
  ACCESS_PAYMENT_HISTORY,
  DOWNLOAD_INVOICE,
  REQUEST_REFUND,

  // Medical Data (MOST SENSITIVE)
  UPLOAD_PRESCRIPTION,
  DELETE_PRESCRIPTION,
  ACCESS_PRESCRIPTION,
  UPDATE_PRESCRIPTION,

  // Personal Data Access
  ACCESS_PERSONAL_DATA,
  UPDATE_PERSONAL_INFO,
  EXPORT_PERSONAL_DATA,
  DELETE_PERSONAL_DATA,

  // Account Management
  UPDATE_EMAIL,
  UPDATE_PASSWORD,
  UPDATE_PHONE,
}
```

---

## Prescription Audit Examples

### Example 1: GET - Access Prescription List

**Endpoint**: `GET /api/assinante/prescription`

```typescript
// Registrar acesso a dados médicos (CRÍTICO - Article 11 LGPD)
// Dados de prescrição são categoria ESPECIAL (dados de saúde)
await logAudit({
  userId: user.id,
  action: AuditAction.ACCESS_PRESCRIPTION,
  entityType: 'Prescription',
  entityId: null, // Null para listagens
  oldValue: null,
  newValue: {
    accessType: 'list',
    recordCount: 2, // 1 current + 1 history
    includesCurrent: true,
    includesHistory: true,
  },
  request, // NextRequest para extrair IP/User-Agent
})
```

**Resultado no Banco**:

```json
{
  "id": "audit-123",
  "userId": "user-456",
  "action": "ACCESS_PRESCRIPTION",
  "entityType": "Prescription",
  "entityId": null,
  "oldValue": null,
  "newValue": {
    "accessType": "list",
    "recordCount": 2,
    "includesCurrent": true,
    "includesHistory": true
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "timestamp": "2025-10-30T14:30:00.000Z"
}
```

---

### Example 2: POST - Upload New Prescription

**Endpoint**: `POST /api/assinante/prescription`

```typescript
// Registrar upload de prescrição médica (CRÍTICO - dados de saúde)
// IMPORTANTE: NÃO logar conteúdo do arquivo (base64), apenas METADADOS
await logAudit({
  userId: user.id,
  action: AuditAction.UPLOAD_PRESCRIPTION,
  entityType: 'Prescription',
  entityId: `prescription-${Date.now()}`, // Mock ID
  oldValue: null, // Null para CREATE
  newValue: {
    fileName: validatedData.fileName,
    fileSize: validatedData.file?.length || 0, // Base64 size (NOT content!)
    uploadedAt: new Date().toISOString(),
    doctorName: validatedData.doctorName,
    doctorCRM: validatedData.doctorCRM,
    prescriptionDate: validatedData.prescriptionDate,
    expiresAt: expiresAt.toISOString(),
    // CRÍTICO: NÃO incluir file content, apenas metadados
  },
  request,
})
```

**Resultado no Banco**:

```json
{
  "id": "audit-789",
  "userId": "user-456",
  "action": "UPLOAD_PRESCRIPTION",
  "entityType": "Prescription",
  "entityId": "prescription-1730293800000",
  "oldValue": null,
  "newValue": {
    "fileName": "prescricao_dr_philipe.pdf",
    "fileSize": 204800,
    "uploadedAt": "2025-10-30T14:30:00.000Z",
    "doctorName": "Dr. Philipe Saraiva Cruz",
    "doctorCRM": "CRM-MG 69870",
    "prescriptionDate": "2025-10-15",
    "expiresAt": "2026-10-15T00:00:00.000Z"
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2025-10-30T14:30:00.000Z"
}
```

**⚠️ IMPORTANTE**: Note que o conteúdo do PDF NÃO está no log!

---

### Example 3: PUT - Update Prescription

**Endpoint**: `PUT /api/assinante/prescription`

```typescript
// Registrar atualização de prescrição (dados médicos sensíveis)
await logAudit({
  userId: user.id,
  action: AuditAction.UPDATE_PRESCRIPTION,
  entityType: 'Prescription',
  entityId: validatedData.prescriptionId,
  oldValue: null, // TODO: Capturar prescrição antiga quando implementar banco
  newValue: {
    prescriptionId: validatedData.prescriptionId,
    updatedFields: Object.keys(validatedData), // Quais campos foram atualizados
    timestamp: new Date().toISOString(),
  },
  request,
})
```

---

## Payment History Audit Examples

### Example 4: GET - Access Payment History

**Endpoint**: `GET /api/assinante/payment-history`

```typescript
// Registrar acesso ao histórico de pagamentos (dados financeiros sensíveis)
// LGPD Article 7: tratamento de dados financeiros requer rastreamento
await logAudit({
  userId: user.id,
  action: AuditAction.ACCESS_PAYMENT_HISTORY,
  entityType: 'Payment',
  entityId: null, // Null para listagens
  oldValue: null,
  newValue: {
    accessType: 'history',
    recordCount: formattedPayments.length,
    totalRecords: totalPayments,
    filters: {
      startDate: validatedQuery.startDate || null,
      endDate: validatedQuery.endDate || null,
      status: validatedQuery.status || null,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
    },
    // Sanitização automática de valores financeiros pelo audit-logger
  },
  request,
})
```

**Resultado no Banco**:

```json
{
  "id": "audit-101",
  "userId": "user-456",
  "action": "ACCESS_PAYMENT_HISTORY",
  "entityType": "Payment",
  "entityId": null,
  "oldValue": null,
  "newValue": {
    "accessType": "history",
    "recordCount": 20,
    "totalRecords": 150,
    "filters": {
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-10-30T23:59:59.999Z",
      "status": "RECEIVED",
      "page": 1,
      "limit": 20
    }
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2025-10-30T14:35:00.000Z"
}
```

**Insight**: Registramos os FILTROS usados, não os valores financeiros em si. Isso permite rastreamento sem expor dados sensíveis.

---

## Invoice Audit Examples

### Example 5: GET - Download Invoice

**Endpoint**: `GET /api/assinante/invoices`

```typescript
// Registrar acesso/download de faturas (documentos fiscais sensíveis)
// LGPD Article 7: tratamento de dados financeiros e fiscais requer rastreamento
await logAudit({
  userId: user.id,
  action: AuditAction.DOWNLOAD_INVOICE,
  entityType: 'Payment',
  entityId: null, // Null para listagens
  oldValue: null,
  newValue: {
    accessType: 'invoice_list',
    recordCount: payments.length,
    totalInvoices: totalInvoices,
    pagination: {
      page,
      limit,
    },
    // NÃO logar valores financeiros completos, apenas metadados
    hasDownloadUrls: payments.some(p => p.invoiceUrl || p.boletoUrl),
  },
  request,
})
```

**Resultado no Banco**:

```json
{
  "id": "audit-202",
  "userId": "user-456",
  "action": "DOWNLOAD_INVOICE",
  "entityType": "Payment",
  "entityId": null,
  "oldValue": null,
  "newValue": {
    "accessType": "invoice_list",
    "recordCount": 10,
    "totalInvoices": 50,
    "pagination": {
      "page": 1,
      "limit": 10
    },
    "hasDownloadUrls": true
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2025-10-30T14:40:00.000Z"
}
```

---

## Delivery Preferences Audit Examples

### Example 6: PUT - Update Delivery Preferences

**Endpoint**: `PUT /api/assinante/delivery-preferences`

```typescript
// Capturar estado anterior para auditoria
const oldShippingAddress = subscription.shippingAddress as any
const oldPhone = user.phone
const oldWhatsapp = user.whatsapp

// ... executar update no banco ...

// Registrar atualização de preferências de entrega (endereço + telefones)
// LGPD Article 7: tratamento de dados pessoais sensíveis requer rastreamento
await logAudit({
  userId: user.id,
  action: AuditAction.UPDATE_DELIVERY_PREFERENCES,
  entityType: 'Subscription',
  entityId: subscription.id,
  oldValue: {
    address: {
      street: oldShippingAddress?.street,
      number: oldShippingAddress?.number,
      city: oldShippingAddress?.city,
      state: oldShippingAddress?.state,
      zipCode: oldShippingAddress?.zipCode,
      // NÃO logar complemento (pode conter informações sensíveis como "apto 101")
    },
    phone: oldPhone ? `****${oldPhone.slice(-4)}` : null, // Apenas últimos 4 dígitos
    whatsapp: oldWhatsapp ? `****${oldWhatsapp.slice(-4)}` : null,
    preferredTime: oldShippingAddress?.preferredTime,
  },
  newValue: {
    address: {
      street: validatedData.deliveryAddress.street,
      number: validatedData.deliveryAddress.number,
      city: validatedData.deliveryAddress.city,
      state: validatedData.deliveryAddress.state,
      zipCode: normalizedZipCode,
      // NÃO logar complemento
    },
    phone: `****${normalizedPhone.slice(-4)}`, // Sanitização automática
    whatsapp: normalizedAltPhone ? `****${normalizedAltPhone.slice(-4)}` : null,
    preferredTime: validatedData.preferredDeliveryTime,
    hasInTransit, // Contexto: se afeta entrega atual
  },
  request,
})
```

**Resultado no Banco**:

```json
{
  "id": "audit-303",
  "userId": "user-456",
  "action": "UPDATE_DELIVERY_PREFERENCES",
  "entityType": "Subscription",
  "entityId": "sub-789",
  "oldValue": {
    "address": {
      "street": "Rua das Flores",
      "number": "123",
      "city": "Caratinga",
      "state": "MG",
      "zipCode": "35300000"
    },
    "phone": "****8026",
    "whatsapp": "****1427",
    "preferredTime": "MORNING"
  },
  "newValue": {
    "address": {
      "street": "Avenida Central",
      "number": "456",
      "city": "Caratinga",
      "state": "MG",
      "zipCode": "35300100"
    },
    "phone": "****9999",
    "whatsapp": "****8888",
    "preferredTime": "AFTERNOON",
    "hasInTransit": false
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2025-10-30T14:45:00.000Z"
}
```

**⚠️ IMPORTANTE**:
- Telefones são mascarados (`****XXXX`)
- Complemento NÃO é logado (pode conter "apto 101", "casa de fulano")
- `hasInTransit` fornece contexto sobre impacto da mudança

---

## Querying Audit Logs

### Example 7: Get User Audit Logs (Admin)

**Função utilitária disponível**:

```typescript
import { getUserAuditLogs } from '@/lib/audit-logger'

// Buscar logs de um usuário específico
const logs = await getUserAuditLogs(
  'user-456',
  {
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-10-30'),
    action: AuditAction.UPLOAD_PRESCRIPTION, // Opcional: filtrar por ação
    entityType: 'Prescription', // Opcional: filtrar por tipo
    limit: 100,
    offset: 0,
  }
)
```

**Resultado**:

```json
[
  {
    "id": "audit-789",
    "userId": "user-456",
    "action": "UPLOAD_PRESCRIPTION",
    "entityType": "Prescription",
    "entityId": "prescription-1730293800000",
    "oldValue": null,
    "newValue": { "fileName": "prescricao_dr_philipe.pdf", ... },
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2025-10-30T14:30:00.000Z",
    "user": {
      "id": "user-456",
      "name": "João Silva",
      "email": "joao@example.com"
    }
  }
]
```

---

### Example 8: Get Audit Statistics (Compliance Reporting)

**Função para relatórios de compliance**:

```typescript
import { getAuditStats } from '@/lib/audit-logger'

// Relatório do último mês
const stats = await getAuditStats(
  new Date('2025-10-01'),
  new Date('2025-10-30')
)
```

**Resultado**:

```json
{
  "totalLogs": 1500,
  "byAction": {
    "ACCESS_PRESCRIPTION": 250,
    "UPLOAD_PRESCRIPTION": 50,
    "ACCESS_PAYMENT_HISTORY": 400,
    "DOWNLOAD_INVOICE": 300,
    "UPDATE_DELIVERY_PREFERENCES": 100,
    "UPDATE_SHIPPING_ADDRESS": 200
  },
  "byEntityType": {
    "Prescription": 300,
    "Payment": 700,
    "Subscription": 500
  },
  "topUsers": [
    {
      "userId": "user-123",
      "userName": "Maria Santos",
      "count": 150
    },
    {
      "userId": "user-456",
      "userName": "João Silva",
      "count": 120
    }
  ]
}
```

---

## Error Handling

### Example 9: Audit Failure (Non-Blocking)

**O que acontece quando auditoria falha**:

```typescript
try {
  await prisma.auditLog.create({ ... })
  console.log('[AUDIT] Successfully logged action')
} catch (error) {
  // CRÍTICO: Audit logging failures should be logged but NOT prevent operations
  console.error('[AUDIT ERROR] Failed to log audit entry:', error)
  console.error('[AUDIT ERROR] Action:', action, 'User:', userId, 'Entity:', entityType)

  // Em produção, enviar alerta para monitoring
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send alert to Sentry/monitoring service
    // This is a compliance risk and needs immediate attention
  }

  // DO NOT throw - audit failures should not break user operations
  // Mas devem ser monitorados de perto
}
```

**Resultado**: A operação do usuário continua normalmente, mas o erro é logado para investigação.

---

## Best Practices

### ✅ DO's

1. **Sempre capturar estado anterior (oldValue) em UPDATEs**:
   ```typescript
   const oldData = await prisma.entity.findUnique({ where: { id } })
   // ... fazer update ...
   await logAudit({ oldValue: oldData.field, newValue: newData.field, ... })
   ```

2. **Usar `request` para capturar IP/User-Agent**:
   ```typescript
   await logAudit({
     // ...
     request, // ← IMPORTANTE: extrai IP e User-Agent automaticamente
   })
   ```

3. **Comentar O QUE e POR QUÊ está sendo auditado**:
   ```typescript
   // === LGPD AUDIT LOG ===
   // Registrar acesso a dados médicos (CRÍTICO - Article 11 LGPD)
   // Dados de prescrição são categoria ESPECIAL (dados de saúde)
   await logAudit({ ... })
   ```

4. **Sanitizar telefones e dados sensíveis ANTES de logar**:
   ```typescript
   phone: `****${phone.slice(-4)}`, // ✅ Correto
   ```

### ❌ DON'Ts

1. **NÃO logar conteúdo de arquivos**:
   ```typescript
   // ❌ ERRADO
   newValue: {
     fileContent: base64File, // ← NUNCA FAZER ISSO
   }

   // ✅ CORRETO
   newValue: {
     fileName: 'prescricao.pdf',
     fileSize: base64File.length, // Apenas metadados
   }
   ```

2. **NÃO logar complementos de endereço**:
   ```typescript
   // ❌ ERRADO
   address: {
     complement: 'apto 101', // Pode ser sensível
   }

   // ✅ CORRETO
   address: {
     street: 'Rua das Flores',
     number: '123',
     // Complement omitido propositalmente
   }
   ```

3. **NÃO logar telefones completos**:
   ```typescript
   // ❌ ERRADO
   phone: '5533999898026', // Expõe número completo

   // ✅ CORRETO
   phone: `****${phone.slice(-4)}`, // ****8026
   ```

4. **NÃO fazer `throw` em falhas de auditoria**:
   ```typescript
   // ❌ ERRADO
   try {
     await logAudit({ ... })
   } catch (error) {
     throw error // ← Quebra operação do usuário
   }

   // ✅ CORRETO
   try {
     await logAudit({ ... })
   } catch (error) {
     console.error('[AUDIT ERROR]', error)
     // Continue normalmente
   }
   ```

---

**Documentação Atualizada**: 2025-10-30
**Desenvolvedor**: Claude (Backend Architect)
**Responsável Legal**: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
