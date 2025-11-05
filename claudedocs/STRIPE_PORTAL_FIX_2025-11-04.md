# Stripe Customer Portal - Fix Implementation

**Data**: 2025-11-04
**Autor**: Dr. Philipe Saraiva Cruz

## 🔍 Problemas Identificados

### 1. Botão de Portal Não Funcionava
**Sintoma**: Botão "Gerenciar plano e pagamentos" no dashboard do assinante não direcionava para o Stripe Customer Portal.

**Causa Raiz**: Dashboard usava URL estática hardcoded (`STRIPE_BILLING_PORTAL_URL`) que apontava para um login genérico do Stripe (`https://billing.stripe.com/p/login/...`), em vez de criar uma sessão dinâmica por usuário.

**Impacto**:
- ❌ Usuários não conseguiam acessar o portal de gerenciamento
- ❌ Não era possível alterar plano ou método de pagamento
- ❌ UX quebrada - botão não fazia nada ou redirecionava para local errado

### 2. Dados Não Sincronizados (Percepção)
**Realidade**: Dados ESTAVAM sincronizados via webhooks do Stripe, mas o portal não podia ser acessado para visualização.

**Verificação**: Webhooks do Stripe estão completos e funcionando:
- ✅ `customer.subscription.created` → Cria subscription no banco
- ✅ `customer.subscription.updated` → Atualiza status, valor, data de renovação
- ✅ `customer.subscription.deleted` → Marca como cancelada
- ✅ `invoice.payment_succeeded` → Registra pagamento bem-sucedido
- ✅ `invoice.payment_failed` → Registra falha de pagamento

---

## ✅ Correções Implementadas

### 1. Substituição de URL Estática por API Dinâmica

**Arquivo**: `/src/app/area-assinante/dashboard/page.tsx`

**Antes** (❌ Incorreto):
```typescript
import { STRIPE_BILLING_PORTAL_URL } from '@/lib/constants'

const handlePortalAccess = () => {
  if (!STRIPE_BILLING_PORTAL_URL) {
    showError('Portal indisponível', 'Configuração não encontrada')
    return
  }
  showInfo('Redirecionando...', 'Portal de gerenciamento')
  window.open(STRIPE_BILLING_PORTAL_URL, '_blank', 'noopener,noreferrer')
}
```

**Depois** (✅ Correto):
```typescript
import { useStripePortal } from '@/hooks/useStripePortal'

const { openPortal, isLoading: portalLoading, error: portalError } = useStripePortal()

const handlePortalAccess = async () => {
  showInfo('Redirecionando...', 'Abrindo portal de gerenciamento seguro...')

  try {
    await openPortal('https://svlentes.com.br/area-assinante/dashboard')
    // openPortal automatically redirects on success
  } catch (err) {
    showError(
      'Erro ao abrir portal',
      portalError || 'Não foi possível acessar o portal. Tente novamente.'
    )
  }
}
```

**Benefícios**:
- ✅ Sessão criada dinamicamente por usuário via Stripe API
- ✅ Autenticação via Firebase ID token
- ✅ Auto-criação de Customer no Stripe se não existir
- ✅ Return URL configurável
- ✅ Error handling apropriado com feedback ao usuário

---

### 2. Confirmação da Infraestrutura Existente

**API Customer Portal** (`/src/app/api/stripe/customer-portal/route.ts`):
- ✅ **Já implementada corretamente**
- ✅ Autenticação Firebase Admin
- ✅ Busca ou cria Stripe Customer ID automaticamente
- ✅ Cria sessão do Billing Portal via Stripe API
- ✅ Logging para auditoria LGPD
- ✅ Error handling robusto

**Hook useStripePortal** (`/src/hooks/useStripePortal.ts`):
- ✅ **Já implementado corretamente**
- ✅ State management (loading, error)
- ✅ Verifica se Stripe está configurado
- ✅ Obtém Firebase ID token automaticamente
- ✅ Chama API com autenticação
- ✅ Redireciona automaticamente para portal

**Webhooks Stripe** (`/src/app/api/webhooks/stripe/route.ts`):
- ✅ **Já implementados e funcionando**
- ✅ Verificação de assinatura webhook (segurança)
- ✅ Sincronização de subscription status
- ✅ Sincronização de valores e datas
- ✅ Criação automática se não existir
- ✅ Logging completo

---

## 🔧 Fluxo Corrigido

### Portal de Gerenciamento (Customer Portal)

1. **Usuário clica em "Gerenciar plano e pagamentos"**
   ```typescript
   handlePortalAccess() // Dispara toast "Redirecionando..."
   ```

2. **Hook useStripePortal obtém token Firebase**
   ```typescript
   const token = await user.getIdToken()
   ```

3. **Chama API `/api/stripe/customer-portal`**
   ```typescript
   POST /api/stripe/customer-portal
   Headers: { Authorization: Bearer <firebase-token> }
   Body: { returnUrl: 'https://svlentes.com.br/area-assinante/dashboard' }
   ```

4. **API verifica autenticação e busca/cria Stripe Customer**
   ```typescript
   - Verifica Firebase token
   - Busca stripeCustomerId no user claims
   - Se não existir: busca por email no Stripe
   - Se não existir: cria novo customer no Stripe
   - Atualiza Firebase custom claims com stripeCustomerId
   ```

5. **API cria sessão do Billing Portal**
   ```typescript
   const session = await stripe.billingPortal.sessions.create({
     customer: stripeCustomerId,
     return_url: returnUrl
   })
   ```

6. **Hook redireciona para URL da sessão**
   ```typescript
   window.location.href = session.url
   ```

7. **Usuário gerencia assinatura no Stripe**
   - Atualizar método de pagamento
   - Alterar plano
   - Cancelar assinatura
   - Ver histórico de faturas
   - Baixar recibos

8. **Stripe notifica via webhook**
   ```typescript
   POST /api/webhooks/stripe
   Event: customer.subscription.updated
   ```

9. **Webhook sincroniza dados no banco**
   ```typescript
   await prisma.subscription.update({
     where: { id: subscription.id },
     data: {
       status: statusMap[subscription.status],
       monthlyValue: amount,
       renewalDate: new Date(subscription.current_period_end * 1000)
     }
   })
   ```

10. **Dashboard reflete mudanças automaticamente**
    - Dados atualizados via `useSubscription` hook
    - Revalidação automática após retorno

---

## 📊 Verificação de Sincronização Stripe → Database

### Events Tratados pelo Webhook

| Evento Stripe | Status Prisma | Ação no Banco |
|---------------|---------------|---------------|
| `subscription.created` | `ACTIVE` | Cria subscription com dados do Stripe |
| `subscription.updated` | Mapeado | Atualiza status, valor, data renovação |
| `subscription.deleted` | `CANCELLED` | Marca subscription como cancelada |
| `invoice.payment_succeeded` | - | Registra pagamento bem-sucedido |
| `invoice.payment_failed` | `OVERDUE` | Marca como overdue, registra falha |
| `payment_intent.succeeded` (PIX) | - | Registra pagamento PIX |

### Mapping de Status

```typescript
const statusMap: Record<string, any> = {
  'active': 'ACTIVE',
  'trialing': 'ACTIVE',
  'past_due': 'OVERDUE',
  'canceled': 'CANCELLED',
  'unpaid': 'SUSPENDED',
  'incomplete': 'PENDING_ACTIVATION',
  'incomplete_expired': 'EXPIRED'
}
```

### Campos Sincronizados

- ✅ `status` - Status da assinatura
- ✅ `monthlyValue` - Valor mensal (convertido de cents)
- ✅ `renewalDate` - Data próxima renovação (unix timestamp → Date)
- ✅ `stripeSubscriptionId` - ID da subscription no Stripe
- ✅ `stripeCustomerId` - ID do customer no Stripe
- ✅ `stripePriceId` - ID do price no Stripe
- ✅ `planType` - Nome do plano (de price.nickname)
- ✅ `paymentMethod` - Método de pagamento

---

## 🧪 Testando as Correções

### 1. Teste do Portal (Frontend)
```bash
1. Login no dashboard: https://svlentes.com.br/area-assinante/login
2. Acesse: https://svlentes.com.br/area-assinante/dashboard
3. Clique em "Gerenciar plano e pagamentos"
4. ✅ Deve abrir o Stripe Customer Portal
5. ✅ Deve mostrar assinatura do usuário
6. ✅ Deve permitir atualizar cartão, plano, etc.
```

### 2. Teste da API (Backend)
```bash
# Obter Firebase ID token do usuário logado
TOKEN="<firebase-id-token>"

# Chamar API do portal
curl -X POST https://svlentes.com.br/api/stripe/customer-portal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"returnUrl": "https://svlentes.com.br/area-assinante/dashboard"}'

# Response esperado:
{
  "url": "https://billing.stripe.com/p/session/...",
  "customerId": "cus_..."
}
```

### 3. Teste de Webhooks
```bash
# Ver logs de webhooks recentes
journalctl -u svlentes-nextjs -f | grep STRIPE

# Verificar webhooks configurados no Stripe Dashboard
https://dashboard.stripe.com/webhooks

# Endpoint webhook deve estar configurado:
https://svlentes.com.br/api/webhooks/stripe
```

### 4. Teste de Sincronização
```bash
# No Stripe Dashboard:
1. Atualizar uma subscription (status, valor, etc)
2. Verificar no banco de dados:

# Via Prisma Studio
npx prisma studio

# Ou via SQL direto
psql $DATABASE_URL -c "SELECT id, status, monthlyValue, renewalDate FROM subscriptions WHERE userId = '<user-id>' ORDER BY updatedAt DESC LIMIT 1;"
```

---

## 🔒 Segurança e Compliance

### Autenticação
- ✅ Firebase Admin SDK valida ID tokens
- ✅ Tokens verificados em cada request
- ✅ Sessões expiram após timeout
- ✅ Return URLs restritas ao domínio

### LGPD Compliance
- ✅ Logging de acessos ao portal (Art. 37)
```typescript
console.log('[STRIPE_PORTAL_ACCESS]', {
  userId: decodedToken.uid,
  email: decodedToken.email,
  stripeCustomerId,
  timestamp: new Date().toISOString(),
  ip: request.headers.get('x-forwarded-for')
})
```

### Webhook Security
- ✅ Verificação de assinatura Stripe
- ✅ Reject requests sem assinatura válida
- ✅ Idempotência via event IDs
- ✅ Logging de todos eventos recebidos

---

## 📈 Próximos Passos

### Melhorias Sugeridas
1. **Telemétrica**: Adicionar tracking de uso do portal (quantos usuários acessam, quais ações fazem)
2. **Notificações**: Email ao usuário após mudanças via portal
3. **Analytics**: Dashboard admin com estatísticas de uso do portal
4. **Teste E2E**: Adicionar teste Playwright do fluxo completo
5. **Monitoring**: Alertas se API do portal falhar repetidamente

### SEO Quick Wins Pendentes
- ⏳ Meta Tags (3 páginas restantes)
- ⏳ LocalBusiness Schema
- ⏳ Click-to-Call implementation
- ⏳ Alt Text optimization

---

## ✅ Status Final

| Item | Status | Observação |
|------|--------|------------|
| Botão portal Stripe | ✅ Corrigido | Usa hook useStripePortal |
| API customer portal | ✅ Funcionando | Implementação completa |
| Hook useStripePortal | ✅ Funcionando | State management correto |
| Webhooks Stripe | ✅ Funcionando | Sincronização completa |
| Build production | ✅ Success | 66s compile |
| Service restart | ✅ Success | svlentes-nextjs running |
| Site accessible | ✅ Success | 200 OK |

**Deploy Date**: 2025-11-04 19:08 UTC
**Version**: Next.js 16.0.1
**Status**: ✅ PRODUCTION READY

---

**Author**: Dr. Philipe Saraiva Cruz
**Generated**: Claude Code - SuperClaude Framework
