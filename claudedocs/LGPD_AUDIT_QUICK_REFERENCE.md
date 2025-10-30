# LGPD Audit Quick Reference Card

**Quick reference para desenvolvedores implementando auditoria LGPD**

---

## 🚀 Quick Start

### 1. Import

```typescript
import { logAudit, AuditAction } from '@/lib/audit-logger'
```

### 2. Basic Usage

```typescript
await logAudit({
  userId: user.id,
  action: AuditAction.YOUR_ACTION,
  entityType: 'EntityName',
  entityId: entity.id,
  oldValue: oldData,
  newValue: newData,
  request, // ← Extrai IP/User-Agent automaticamente
})
```

---

## 📊 Ações Disponíveis (16 total)

### Subscription (6)
- `UPDATE_SHIPPING_ADDRESS`
- `CHANGE_SUBSCRIPTION_PLAN`
- `UPDATE_DELIVERY_PREFERENCES`
- `PAUSE_SUBSCRIPTION`
- `RESUME_SUBSCRIPTION`
- `CANCEL_SUBSCRIPTION`

### Payment (4)
- `UPDATE_PAYMENT_METHOD`
- `ACCESS_PAYMENT_HISTORY`
- `DOWNLOAD_INVOICE`
- `REQUEST_REFUND`

### Medical (4) - **CRÍTICO**
- `UPLOAD_PRESCRIPTION`
- `DELETE_PRESCRIPTION`
- `ACCESS_PRESCRIPTION`
- `UPDATE_PRESCRIPTION`

### Personal Data (4)
- `ACCESS_PERSONAL_DATA`
- `UPDATE_PERSONAL_INFO`
- `EXPORT_PERSONAL_DATA`
- `DELETE_PERSONAL_DATA`

---

## 📋 Quando Auditar?

| Operação | Auditar? | Ação | Prioridade |
|----------|----------|------|------------|
| GET (dados médicos) | ✅ SIM | `ACCESS_PRESCRIPTION` | CRÍTICA |
| POST (upload médico) | ✅ SIM | `UPLOAD_PRESCRIPTION` | CRÍTICA |
| PUT (atualizar médico) | ✅ SIM | `UPDATE_PRESCRIPTION` | CRÍTICA |
| DELETE (médico) | ✅ SIM | `DELETE_PRESCRIPTION` | CRÍTICA |
| GET (histórico financeiro) | ✅ SIM | `ACCESS_PAYMENT_HISTORY` | ALTA |
| GET (faturas) | ✅ SIM | `DOWNLOAD_INVOICE` | ALTA |
| PUT (endereço/telefone) | ✅ SIM | `UPDATE_DELIVERY_PREFERENCES` | MÉDIA |
| PUT (endereço entrega) | ✅ SIM | `UPDATE_SHIPPING_ADDRESS` | MÉDIA |
| GET (dados públicos) | ❌ NÃO | N/A | N/A |
| GET (listagem produtos) | ❌ NÃO | N/A | N/A |

---

## ✅ Checklist de Implementação

### Antes de Auditar
- [ ] Importei `logAudit` e `AuditAction`?
- [ ] Identifiquei o `userId` autenticado?
- [ ] Defini corretamente `entityType` e `entityId`?
- [ ] Capturei `oldValue` para UPDATEs?
- [ ] Passei `request` para capturar IP/User-Agent?

### Durante Auditoria
- [ ] Usei a ação (`AuditAction`) correta?
- [ ] Sanitizei dados sensíveis (telefones, cartões)?
- [ ] NÃO loguei conteúdo de arquivos?
- [ ] NÃO loguei complementos de endereço?
- [ ] Comentei o POR QUÊ da auditoria?

### Após Auditoria
- [ ] Auditoria é non-blocking (não `throw` em erros)?
- [ ] Testei que operações continuam se auditoria falhar?
- [ ] Verifiquei logs no banco de dados?

---

## 🔒 Sanitização de Dados

### Automática (pelo audit-logger)
- ✅ `password` → `[REDACTED]`
- ✅ `token` → `[REDACTED]`
- ✅ `apiKey` → `[REDACTED]`
- ✅ `creditCard` → `****1234` (últimos 4)
- ✅ `cvv` → `[REDACTED]`

### Manual (você deve fazer)
- ⚠️ Telefones → `****${phone.slice(-4)}`
- ⚠️ Complemento → NÃO logar
- ⚠️ Arquivos → Apenas metadados (nome, tamanho)

---

## 📝 Patterns

### Pattern 1: CREATE (POST)

```typescript
// Executar operação
const result = await prisma.entity.create({ data: newData })

// Auditar
await logAudit({
  userId: user.id,
  action: AuditAction.CREATE_ACTION,
  entityType: 'Entity',
  entityId: result.id,
  oldValue: null, // ← Null para CREATE
  newValue: { field: result.field },
  request,
})
```

### Pattern 2: UPDATE (PUT)

```typescript
// 1. Capturar estado anterior
const oldData = await prisma.entity.findUnique({ where: { id } })

// 2. Executar update
const result = await prisma.entity.update({ where: { id }, data: newData })

// 3. Auditar com oldValue e newValue
await logAudit({
  userId: user.id,
  action: AuditAction.UPDATE_ACTION,
  entityType: 'Entity',
  entityId: id,
  oldValue: oldData.field, // ← Estado anterior
  newValue: result.field,  // ← Estado novo
  request,
})
```

### Pattern 3: READ (GET) - Dados Sensíveis

```typescript
// Buscar dados
const data = await prisma.entity.findMany({ where: { userId: user.id } })

// Auditar acesso (SEM incluir dados retornados)
await logAudit({
  userId: user.id,
  action: AuditAction.ACCESS_ACTION,
  entityType: 'Entity',
  entityId: null, // ← Null para listagens
  oldValue: null,
  newValue: {
    recordCount: data.length, // ← Apenas metadados
    filters: { status: 'active' },
  },
  request,
})
```

### Pattern 4: DELETE

```typescript
// 1. Capturar estado antes de deletar
const oldData = await prisma.entity.findUnique({ where: { id } })

// 2. Executar delete
await prisma.entity.delete({ where: { id } })

// 3. Auditar
await logAudit({
  userId: user.id,
  action: AuditAction.DELETE_ACTION,
  entityType: 'Entity',
  entityId: id,
  oldValue: oldData.field, // ← O que foi deletado
  newValue: null, // ← Null para DELETE
  request,
})
```

---

## ⚠️ Common Mistakes

### ❌ Erro 1: Logar Conteúdo de Arquivo

```typescript
// ERRADO
newValue: {
  fileContent: base64File, // ← NUNCA!
}

// CORRETO
newValue: {
  fileName: file.name,
  fileSize: base64File.length, // Apenas metadados
}
```

### ❌ Erro 2: Logar Telefone Completo

```typescript
// ERRADO
phone: user.phone, // ← "5533999898026"

// CORRETO
phone: `****${user.phone.slice(-4)}`, // ← "****8026"
```

### ❌ Erro 3: Throw em Erro de Auditoria

```typescript
// ERRADO
try {
  await logAudit({ ... })
} catch (error) {
  throw error // ← Quebra operação do usuário
}

// CORRETO
try {
  await logAudit({ ... })
} catch (error) {
  console.error('[AUDIT ERROR]', error)
  // Continue normalmente - auditoria é non-blocking
}
```

### ❌ Erro 4: Esquecer Request

```typescript
// ERRADO
await logAudit({
  userId: user.id,
  action: AuditAction.ACTION,
  // ... sem request
})

// CORRETO
await logAudit({
  userId: user.id,
  action: AuditAction.ACTION,
  // ...
  request, // ← IP/User-Agent automático
})
```

---

## 🔍 Querying Logs

### Get User Logs

```typescript
import { getUserAuditLogs } from '@/lib/audit-logger'

const logs = await getUserAuditLogs('user-id', {
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-10-30'),
  action: AuditAction.UPLOAD_PRESCRIPTION, // Optional
  limit: 100,
})
```

### Get Statistics

```typescript
import { getAuditStats } from '@/lib/audit-logger'

const stats = await getAuditStats(
  new Date('2025-10-01'),
  new Date('2025-10-30')
)

// Returns: { totalLogs, byAction, byEntityType, topUsers }
```

---

## 📚 Documentação Completa

- **Implementation Guide**: `claudedocs/LGPD_IMPLEMENTATION.md`
- **Audit Integration Summary**: `claudedocs/LGPD_AUDIT_INTEGRATION_SUMMARY.md`
- **Usage Examples**: `claudedocs/LGPD_AUDIT_USAGE_EXAMPLES.md`
- **Source Code**: `src/lib/audit-logger.ts`
- **Prisma Schema**: `prisma/schema.prisma` (AuditLog model)

---

## 🆘 Troubleshooting

### Audit não aparece no banco
1. Verificar se Prisma está conectado: `npx prisma studio`
2. Verificar logs de erro: `console.error('[AUDIT ERROR]')`
3. Verificar se `userId` está correto
4. Verificar se tabela `AuditLog` existe no schema

### Auditoria está quebrando operações
1. Verificar se há `throw` no catch da auditoria (NÃO DEVE TER)
2. Verificar timeout do banco de dados
3. Verificar se Prisma está gerando erros

### IP sempre aparece como `null`
1. Verificar se Nginx está configurado com `x-forwarded-for`
2. Verificar se `request` está sendo passado para `logAudit`
3. Testar localmente: IP será `::1` (localhost IPv6)

---

**Quick Reference Version**: 1.0
**Last Updated**: 2025-10-30
**Author**: Claude (Backend Architect)
