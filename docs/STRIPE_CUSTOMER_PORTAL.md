# Stripe Customer Portal Integration

## Visão Geral

A integração do **Stripe Customer Portal** permite que assinantes gerenciem suas próprias assinaturas, métodos de pagamento e informações de faturamento de forma segura e autônoma, sem necessidade de intervenção do suporte.

**Autor:** Dr. Philipe Saraiva Cruz  
**Última Atualização:** 30 de Outubro de 2025

---

## 📋 Índice

1. [Recursos Disponíveis](#recursos-disponíveis)
2. [Configuração](#configuração)
3. [Uso na Aplicação](#uso-na-aplicação)
4. [Fluxo de Autenticação](#fluxo-de-autenticação)
5. [Exemplos de Código](#exemplos-de-código)
6. [Segurança e Compliance](#segurança-e-compliance)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Recursos Disponíveis

Os assinantes podem gerenciar no Stripe Customer Portal:

### Gerenciamento de Assinatura
- ✅ Visualizar detalhes da assinatura atual
- ✅ Alterar plano (upgrade/downgrade)
- ✅ Cancelar assinatura
- ✅ Reativar assinatura cancelada
- ✅ Ver histórico de mudanças

### Gerenciamento de Pagamento
- ✅ Adicionar novos métodos de pagamento
- ✅ Atualizar cartão de crédito existente
- ✅ Definir método de pagamento padrão
- ✅ Remover métodos de pagamento antigos

### Faturamento e Faturas
- ✅ Visualizar todas as faturas (pagas e pendentes)
- ✅ Fazer download de faturas em PDF
- ✅ Ver histórico de pagamentos
- ✅ Atualizar informações de cobrança

### Informações da Conta
- ✅ Atualizar email de cobrança
- ✅ Alterar endereço de cobrança
- ✅ Ver informações do cliente

---

## ⚙️ Configuração

### 1. Configurar Stripe Dashboard

1. Acesse o [Stripe Dashboard](https://dashboard.stripe.com)
2. Navegue para **Settings > Billing > Customer Portal**
3. Ative o Customer Portal
4. Configure as opções desejadas:
   - **Subscription management**: Permitir alteração de planos
   - **Payment methods**: Permitir adicionar/remover métodos
   - **Invoice history**: Mostrar histórico completo
   - **Cancellation reasons**: Coletar feedback ao cancelar

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no `.env.local`:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here

# Base URL (production)
NEXT_PUBLIC_BASE_URL=https://svlentes.com.br
```

⚠️ **Importante:** Nunca commitar chaves de API no repositório!

### 3. Verificar Configuração do Firebase

Certifique-se de que os usuários tenham o campo `stripeCustomerId` no metadata:

```typescript
// Ao criar assinatura, salvar Stripe Customer ID
await admin.auth().setCustomUserClaims(userId, {
  stripeCustomerId: customer.id,
})
```

---

## 🚀 Uso na Aplicação

### Componentes Disponíveis

#### 1. **StripePortalButton** (Recomendado)

Botão completo com loading states e tratamento de erros:

```tsx
import { StripePortalButton } from '@/components/assinante/StripePortalButton'

function MyComponent() {
  return (
    <StripePortalButton
      variant="default"
      size="lg"
      fullWidth
      returnUrl="/area-assinante/dashboard?tab=payment"
    >
      Gerenciar Minha Assinatura
    </StripePortalButton>
  )
}
```

#### 2. **StripePortalIconButton**

Botão compacto (apenas ícone):

```tsx
import { StripePortalIconButton } from '@/components/assinante/StripePortalButton'

function MyComponent() {
  return (
    <StripePortalIconButton
      returnUrl="/area-assinante/dashboard"
      className="absolute top-4 right-4"
    />
  )
}
```

#### 3. **StripePortalCard**

Card completo para dashboard:

```tsx
import { StripePortalCard } from '@/components/assinante/StripePortalButton'

function MyComponent() {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <StripePortalCard returnUrl="/area-assinante/dashboard" />
      {/* Outros cards */}
    </div>
  )
}
```

### Hook Personalizado

Para controle total, use o hook `useStripePortal`:

```tsx
import { useStripePortal } from '@/hooks/useStripePortal'

function MyComponent() {
  const { openPortal, isLoading, error, isAvailable } = useStripePortal()

  const handleClick = async () => {
    await openPortal('/area-assinante/dashboard?success=true')
  }

  if (!isAvailable) {
    return <p>Portal não disponível</p>
  }

  return (
    <div>
      <button onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Abrindo portal...' : 'Gerenciar Assinatura'}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  )
}
```

---

## 🔐 Fluxo de Autenticação

### 1. Cliente Clica no Botão

```typescript
// Cliente clica em "Gerenciar Assinatura"
await openPortal('/area-assinante/dashboard')
```

### 2. Hook Obtém Token Firebase

```typescript
// useStripePortal.ts
const token = await user.getIdToken()
```

### 3. API Verifica Token e Cria Sessão

```typescript
// /api/stripe/customer-portal/route.ts
const decodedToken = await verifyIdToken(token)
const session = await stripe.billingPortal.sessions.create({
  customer: stripeCustomerId,
  return_url: 'https://svlentes.com.br/area-assinante/dashboard',
})
```

### 4. Cliente é Redirecionado

```typescript
// Hook redireciona para Stripe
window.location.href = session.url
```

### 5. Após Gerenciamento, Retorna ao App

O cliente é automaticamente redirecionado para a `return_url` configurada.

---

## 📝 Exemplos de Código

### Exemplo Completo: Quick Actions

```tsx
import { createQuickActions } from '@/components/assinante/QuickActions'
import { useStripePortal } from '@/hooks/useStripePortal'

function Dashboard() {
  const { openPortal, isAvailable } = useStripePortal()

  const actions = createQuickActions({
    onOrdersClick: () => setShowOrders(true),
    onInvoicesClick: () => setShowInvoices(true),
    onSettingsClick: () => router.push('/configuracoes'),
    onScheduleClick: () => window.open('https://booking.com', '_blank'),
    onPaymentClick: () => setShowPaymentModal(true),
    onAddressClick: () => setShowAddressModal(true),
    onSupportClick: () => openWhatsApp(),
    onBenefitsClick: () => setShowBenefits(true),
    onStripePortalClick: isAvailable
      ? () => openPortal('/area-assinante/dashboard?tab=payment')
      : undefined,
    pendingOrders: 2,
    unreadMessages: 0,
  })

  return <QuickActions actions={actions} />
}
```

### Exemplo: Integração com Modais

```tsx
function PaymentSettings() {
  const { openPortal, isLoading } = useStripePortal()
  const [showLocalModal, setShowLocalModal] = useState(false)

  return (
    <div className="space-y-4">
      {/* Opção 1: Gerenciar via Stripe (recomendado) */}
      <div className="border-2 border-cyan-200 rounded-lg p-6 bg-cyan-50">
        <h3 className="font-semibold mb-2">Gerenciar no Stripe</h3>
        <p className="text-sm text-gray-600 mb-4">
          Gerencie todos os aspectos da sua assinatura de forma segura
        </p>
        <StripePortalButton variant="default" fullWidth />
      </div>

      {/* Opção 2: Atualizar apenas método de pagamento localmente */}
      <div className="border rounded-lg p-6">
        <h3 className="font-semibold mb-2">Atualização Rápida</h3>
        <p className="text-sm text-gray-600 mb-4">
          Atualize apenas o método de pagamento
        </p>
        <Button onClick={() => setShowLocalModal(true)}>
          Atualizar Cartão
        </Button>
      </div>
    </div>
  )
}
```

---

## 🛡️ Segurança e Compliance

### Autenticação

- ✅ Tokens Firebase verificados server-side
- ✅ Sessões temporárias do Stripe (expiram em 1 hora)
- ✅ HTTPS obrigatório em produção
- ✅ CORS configurado corretamente

### Logging e Auditoria (LGPD)

Todos os acessos ao portal são logados:

```typescript
console.log('[STRIPE_PORTAL_ACCESS]', {
  userId: decodedToken.uid,
  email: decodedToken.email,
  stripeCustomerId,
  timestamp: new Date().toISOString(),
  ip: request.headers.get('x-forwarded-for'),
})
```

### Dados Sensíveis

- ❌ **NUNCA** armazenar dados de cartão no banco
- ✅ Usar apenas Stripe Customer ID e last4 digits
- ✅ PCI DSS compliance garantido pelo Stripe
- ✅ Conformidade com LGPD (Lei Geral de Proteção de Dados)

---

## 🔧 Troubleshooting

### Erro: "Cliente não encontrado no Stripe"

**Causa:** Usuário não tem `stripeCustomerId` associado

**Solução:**
```typescript
// Verificar se customer existe
const customers = await stripe.customers.list({
  email: user.email,
  limit: 1,
})

if (customers.data.length === 0) {
  // Criar novo customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.displayName,
    metadata: { firebaseUid: user.uid },
  })
}
```

### Erro: "Sessão expirada"

**Causa:** Token Firebase expirado (> 1 hora)

**Solução:** O hook automaticamente pede novo token. Se persistir, fazer logout/login.

### Portal não abre (popup bloqueado)

**Causa:** Navegador bloqueando popups

**Solução:** Nossa implementação usa `window.location.href` (não popup), evitando esse problema.

### Erro: "Portal não configurado"

**Causa:** Stripe Customer Portal não ativado no dashboard

**Solução:**
1. Acesse Stripe Dashboard
2. Settings > Billing > Customer Portal
3. Ative "Allow customers to..."

---

## 📊 Métricas e Monitoramento

### Logs Importantes

```bash
# Sucesso
[STRIPE_PORTAL_ACCESS] { userId: "abc123", email: "user@example.com", ... }

# Erro de autenticação
[STRIPE_PORTAL_ERROR] { code: "auth/invalid-credential", ... }

# Erro do Stripe
[STRIPE_PORTAL_ERROR] { type: "StripeInvalidRequestError", ... }
```

### Métricas Sugeridas

- Taxa de uso do portal (% de assinantes que acessam)
- Ações mais comuns (mudança de plano, atualização de cartão)
- Taxa de cancelamento via portal vs outras vias
- Tempo médio de sessão no portal

---

## 🔗 Recursos Adicionais

- [Stripe Customer Portal Docs](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Stripe API Reference](https://stripe.com/docs/api/customer_portal)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Firebase Auth](https://firebase.google.com/docs/auth)

---

## ✅ Checklist de Implementação

- [x] Stripe Customer Portal ativado no dashboard
- [x] API route `/api/stripe/customer-portal` criada
- [x] Hook `useStripePortal` implementado
- [x] Componente `StripePortalButton` criado
- [x] Integração no dashboard (`AccessibleDashboard`)
- [x] Integração no card de assinatura (`EnhancedSubscriptionCard`)
- [x] Variáveis de ambiente configuradas
- [ ] Testar em ambiente de produção
- [ ] Configurar webhooks do Stripe
- [ ] Implementar analytics

---

**Nota:** Esta integração substitui a URL estática anterior (`STRIPE_BILLING_PORTAL_URL`) por um sistema dinâmico e seguro baseado em API, garantindo melhor segurança e experiência do usuário.

**Dúvidas ou problemas?** Entre em contato com a equipe de desenvolvimento ou consulte a documentação oficial do Stripe.
