# Documentação de Segurança - Autorização Granular APIs de Assinante

## 🔒 Visão Geral

Este documento descreve a implementação de autorização granular nas APIs de assinante (`/api/assinante/*`) para prevenir acesso não autorizado entre usuários.

**Compliance:** LGPD Art. 6º, VI - Princípio da Segurança  
**OWASP:** A01:2021 - Broken Access Control  
**Severidade:** 🔴 CRÍTICA

## 🎯 Problema Resolvido

### Cenário de Ataque (ANTES da correção)

1. User A autentica com Firebase ✅
2. User A modifica request para incluir `subscriptionId` do User B
3. API `/api/assinante/delivery-status` retornava dados do User B ❌

**Impacto:** Vazamento de dados pessoais e financeiros entre usuários

### Solução Implementada (DEPOIS da correção)

1. User A autentica com Firebase ✅
2. User A modifica request para incluir `subscriptionId` do User B
3. API valida ownership: `subscription.userId === authenticatedUser.id` ✅
4. API retorna `403 FORBIDDEN` com log de auditoria ✅

## 🛡️ Helpers de Validação de Ownership

Implementados em `src/lib/api-error-handler.ts`:

### 1. validateSubscriptionOwnership

Valida que uma assinatura pertence ao usuário autenticado.

```typescript
const subscription = await validateSubscriptionOwnership(
  prisma,
  subscriptionId,
  user.id,
  context
)

if (subscription instanceof NextResponse) {
  return subscription // Erro 403 - acesso negado
}
```

**Comportamento:**
- ✅ Retorna subscription se `subscription.userId === user.id`
- ❌ Retorna `403 FORBIDDEN` se ownership não validado
- 📝 Loga tentativa de acesso não autorizado (auditoria LGPD)

### 2. validatePaymentOwnership

Valida que um pagamento pertence ao usuário autenticado.

```typescript
const payment = await validatePaymentOwnership(
  prisma,
  paymentId,
  user.id,
  context
)

if (payment instanceof NextResponse) {
  return payment // Erro 403
}
```

### 3. validateOrderOwnership

Valida que um pedido pertence ao usuário autenticado (via subscription).

```typescript
const order = await validateOrderOwnership(
  prisma,
  orderId,
  user.id,
  context
)

if (order instanceof NextResponse) {
  return order // Erro 403
}
```

## 📋 Padrão de Implementação

### API que ACEITA IDs como parâmetros

Quando a API aceita `subscriptionId`, `paymentId`, ou `orderId` como parâmetro:

```typescript
export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  const context = {
    api: '/api/assinante/exemplo',
    requestId,
    timestamp: new Date(),
  }

  // 1. Validar autenticação
  const authResult = await validateFirebaseAuth(
    request.headers.get('Authorization'),
    adminAuth,
    context
  )

  if (authResult instanceof NextResponse) {
    return authResult // 401 UNAUTHORIZED
  }

  const { uid } = authResult

  // 2. Buscar usuário
  const user = await prisma.user.findUnique({
    where: { firebaseUid: uid },
  })

  if (!user) {
    return ApiErrorHandler.handleError(
      ErrorType.NOT_FOUND,
      'Usuário não encontrado',
      context
    )
  }

  // 3. Obter subscriptionId da request
  const { searchParams } = new URL(request.url)
  const subscriptionId = searchParams.get('subscriptionId')

  // 4. CRÍTICO: Validar ownership
  const subscription = await validateSubscriptionOwnership(
    prisma,
    subscriptionId,
    user.id,
    { ...context, userId: user.id }
  )

  if (subscription instanceof NextResponse) {
    return subscription // 403 FORBIDDEN
  }

  // 5. Processar request normalmente
  // ...
}
```

### API que busca recursos por userId (Padrão Seguro)

Quando a API busca recursos filtrados por `userId` (sem aceitar IDs externos):

```typescript
export async function GET(request: NextRequest) {
  // 1. Validar autenticação
  const authResult = await validateFirebaseAuth(...)
  const { uid } = authResult

  // 2. Buscar usuário
  const user = await prisma.user.findUnique({
    where: { firebaseUid: uid },
  })

  // 3. Buscar recursos SEMPRE filtrando por user.id
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: user.id, // ← SEMPRE filtrar por userId
      status: 'ACTIVE',
    },
  })

  // Já é seguro - não precisa de validação extra
}
```

## 🔍 Status de Segurança das APIs

### ✅ APIs Seguras (padrão correto desde o início)

Estas APIs NUNCA aceitam IDs como parâmetros - sempre filtram por `user.id`:

| API | Status | Método de Proteção |
|-----|--------|-------------------|
| `/api/assinante/subscription` | ✅ SEGURA | Filtra `userId: user.id` |
| `/api/assinante/payment-history` | ✅ SEGURA | Filtra `userId: user.id` |
| `/api/assinante/prescription` | ✅ SEGURA | Filtra `userId: user.id` |
| `/api/assinante/delivery-preferences` | ✅ SEGURA | Filtra `userId: user.id` |
| `/api/assinante/orders` | ✅ SEGURA | Filtra `userId: user.id` via subscriptions |
| `/api/assinante/invoices` | ✅ SEGURA | Filtra `userId: user.id` via subscriptions |
| `/api/assinante/delivery-timeline` | ✅ SEGURA | Filtra `userId: user.id` |
| `/api/assinante/dashboard-metrics` | ✅ SEGURA | Filtra `userId: user.id` |
| `/api/assinante/savings-widget` | ✅ SEGURA | Filtra `userId: user.id` |
| `/api/assinante/contextual-actions` | ✅ SEGURA | Filtra `userId: user.id` |

### 🔧 API Corrigida

| API | Status Anterior | Status Atual | Correção |
|-----|----------------|--------------|----------|
| `/api/assinante/delivery-status` | ❌ VULNERÁVEL | ✅ SEGURA | Adicionado `validateSubscriptionOwnership` |

## 📊 Resposta de Erro Segura

### ✅ CORRETO: Retornar 403 FORBIDDEN

```json
{
  "error": "AUTHORIZATION",
  "message": "Você não tem permissão para acessar este recurso.",
  "requestId": "req_1234567890_abc123",
  "timestamp": "2025-10-30T14:30:00.000Z"
}
```

**Por que 403 (não 404)?**
- 403 não vaza informação sobre existência do recurso
- 404 permitiria enumerar IDs válidos de outros usuários
- Melhor prática OWASP para prevenção de information disclosure

### ❌ INCORRETO: Retornar 404 NOT FOUND

```json
{
  "error": "NOT_FOUND",
  "message": "Assinatura não encontrada"
}
```

**Problema:** Revela que o recurso não existe ou que o usuário não tem acesso

## 📝 Auditoria LGPD

Todas as tentativas de acesso não autorizado são logadas:

```typescript
console.warn('[SECURITY] Tentativa de acesso não autorizado:', {
  subscriptionId: 'sub-b-123',
  userId: 'user-a-456',
  api: '/api/assinante/delivery-status',
  requestId: 'req_xyz',
  timestamp: '2025-10-30T14:30:00.000Z',
})
```

**Características:**
- ✅ Inclui timestamp ISO 8601 para rastreabilidade
- ✅ Não expõe PII (apenas IDs)
- ✅ Rastreável via `requestId`
- ✅ Permite análise de padrões de ataque

## 🧪 Testes de Segurança

### Testes Unitários

Arquivo: `src/__tests__/security/authorization.test.ts`

Valida:
- ✅ Acesso permitido a recursos próprios
- ✅ Acesso negado a recursos de outros usuários com 403
- ✅ Logs de auditoria em tentativas não autorizadas
- ✅ Tratamento de erros de banco de dados
- ✅ Formato consistente de resposta de erro

### Testes E2E

Arquivo: `src/__tests__/security/delivery-status-authorization.test.ts`

Cenários:
- ✅ User A acessa própria subscription → 200 OK
- ✅ User A tenta acessar subscription do User B → 403 FORBIDDEN
- ✅ Request sem autenticação → 401 UNAUTHORIZED
- ✅ Token Firebase inválido → 401 UNAUTHORIZED
- ✅ Usuário não encontrado no banco → 404 NOT FOUND
- ✅ subscriptionId inválido → 400 BAD REQUEST

## 🚀 Como Executar Testes de Segurança

```bash
# Testes unitários de autorização
npm run test -- security/authorization

# Testes E2E da API delivery-status
npm run test -- security/delivery-status-authorization

# Todos os testes de segurança
npm run test -- security/
```

## 📚 Referências

- [OWASP A01:2021 - Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [LGPD Art. 6º, VI - Princípio da Segurança](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [CWE-639: Authorization Bypass Through User-Controlled Key](https://cwe.mitre.org/data/definitions/639.html)

## 🔄 Manutenção

### Ao criar nova API de assinante:

1. ✅ Sempre autenticar com `validateFirebaseAuth`
2. ✅ Sempre buscar usuário por `firebaseUid`
3. ✅ Se aceitar IDs como parâmetros, validar ownership
4. ✅ Se buscar recursos, filtrar por `userId: user.id`
5. ✅ Retornar 403 (não 404) para acesso não autorizado
6. ✅ Adicionar testes de segurança

### Checklist de Code Review:

- [ ] API autentica usuário via Firebase?
- [ ] API valida ownership de recursos com IDs externos?
- [ ] Queries filtram por `userId` do usuário autenticado?
- [ ] Erros de autorização retornam 403 (não 404)?
- [ ] Tentativas de acesso não autorizado são logadas?
- [ ] Testes cobrem cenários de acesso cross-user?

## 🆘 Suporte

Em caso de dúvidas ou problemas de segurança:

1. Revise este documento
2. Consulte os testes em `src/__tests__/security/`
3. Verifique os helpers em `src/lib/api-error-handler.ts`
4. Se identificar vulnerabilidade, abra issue com tag `security` 🔴
