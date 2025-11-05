# Integração Completa com Stripe - Dashboard do Assinante
**Data**: 2025-11-05
**Autor**: Dr. Philipe Saraiva Cruz
**Status**: ✅ Implementado e Pronto para Teste

---

## 📋 Resumo Executivo

Implementação completa de sincronização em tempo real com o Stripe para o dashboard do assinante. Todos os links de planos e pagamentos agora redirecionam para o Stripe Customer Portal, e os dados de assinatura são buscados diretamente do Stripe.

### O Que Foi Implementado

1. ✅ **APIs de Integração**: Endpoints para buscar produtos e assinaturas do Stripe
2. ✅ **Hooks Customizados**: React hooks para gerenciar dados do Stripe no cliente
3. ✅ **Componentes Integrados**: Componentes que consomem dados em tempo real
4. ✅ **Redirecionamentos**: Links de planos e pagamentos redirecionam para Stripe Portal
5. ✅ **Documentação**: Guias completos de uso e manutenção

---

## 🎯 Objetivos Alcançados

### Requisito 1: ✅ Links de Planos → Stripe Portal
- **Navigation "Plano"**: Redireciona para Stripe Customer Portal
- **Quick Action "Plano"**: Redireciona para Stripe Portal
- **Botão "Ver Planos"**: Redireciona para Stripe Billing Portal

### Requisito 2: ✅ Área de Pagamentos → Stripe Portal
- **Navigation "Pagamentos"**: Redireciona para Stripe Portal
- **Portal de Pagamento**: Botão dedicado para Stripe Portal

### Requisito 3: ✅ Sincronização de Dados
- **Preços dos Planos**: Buscados em tempo real do Stripe
- **Assinatura Ativa**: Dados sincronizados com Stripe Subscriptions API
- **Métodos de Pagamento**: Informações atualizadas do Stripe

---

## 📁 Arquivos Criados/Modificados

### APIs Criadas

#### 1. `/api/stripe/products/route.ts`
**Propósito**: Buscar todos os produtos e preços ativos do Stripe

**Endpoint**: `GET /api/stripe/products`
**Autenticação**: Não requerida (dados públicos)
**Response**:
```typescript
{
  products: [
    {
      id: string
      name: string
      description: string | null
      images: string[]
      metadata: Record<string, string>
      active: boolean
      prices: StripePrice[]
      defaultPrice: {
        id: string
        amount: number
        currency: string
        recurring: { interval: string, interval_count: number } | null
      } | null
    }
  ],
  count: number
}
```

**Características**:
- Busca produtos ativos do Stripe
- Inclui todos os preços (mensal, anual)
- Ordenação por `metadata.sort_order` ou por preço
- Filtra produtos sem preços ativos

---

#### 2. `/api/stripe/subscription/route.ts`
**Propósito**: Buscar assinatura ativa do usuário autenticado

**Endpoint**: `GET /api/stripe/subscription`
**Autenticação**: ✅ Requerida (Firebase Bearer token)
**Headers**:
```
Authorization: Bearer <firebase-id-token>
```

**Response**:
```typescript
{
  subscription: {
    id: string
    status: string
    current_period_start: number
    current_period_end: number
    cancel_at_period_end: boolean
    canceled_at: number | null
    created: number
    plan: {
      id: string
      name: string
      description: string
      amount: number  // em centavos
      currency: string
      interval: 'month' | 'year'
      interval_count: number
    }
    payment_method: {
      type: string
      card?: {
        brand: string
        last4: string
        exp_month: number
        exp_year: number
      }
    } | null
    customer: {
      id: string
      email: string | null
    }
    latest_invoice: string | null
    billing_cycle_anchor: number
    metadata: Record<string, string>
  }
}
```

**Segurança**:
- ✅ Autenticação via Firebase Admin SDK
- ✅ Busca Stripe Customer ID por Firebase UID ou email
- ✅ Log de auditoria para compliance LGPD
- ✅ Tratamento específico de erros Stripe

**Erros Possíveis**:
- `401` - Token inválido/expirado
- `404` - Cliente/Assinatura não encontrada
- `500` - Erro interno do servidor

---

### Hooks Criados

#### 1. `useStripeSubscription`
**Localização**: `src/hooks/useStripeSubscription.ts`

**Propósito**: Hook para buscar dados da assinatura ativa do Stripe

**Uso**:
```typescript
import { useStripeSubscription } from '@/hooks/useStripeSubscription'

function MyComponent() {
  const { subscription, isLoading, error, refetch } = useStripeSubscription()

  if (isLoading) return <Loading />
  if (error) return <Error message={error} />
  if (!subscription) return <NoSubscription />

  return (
    <div>
      <h3>{subscription.plan.name}</h3>
      <p>R$ {(subscription.plan.amount / 100).toFixed(2)}/mês</p>
      <button onClick={refetch}>Atualizar</button>
    </div>
  )
}
```

**Características**:
- ✅ Autenticação automática via Firebase
- ✅ Gerenciamento de estados (loading, error, success)
- ✅ Função `refetch()` para atualizar dados manualmente
- ✅ Atualização automática quando usuário muda

**Return Type**:
```typescript
{
  subscription: StripeSubscriptionData | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}
```

---

#### 2. `useStripeProducts`
**Localização**: `src/hooks/useStripeProducts.ts`

**Propósito**: Hook para buscar catálogo de produtos/planos do Stripe

**Uso**:
```typescript
import { useStripeProducts } from '@/hooks/useStripeProducts'

function PricingPlans() {
  const { products, isLoading, error, refetch } = useStripeProducts()

  if (isLoading) return <Loading />
  if (error) return <Error message={error} />

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <PlanCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

**Características**:
- ✅ Carregamento automático ao montar componente
- ✅ Busca pública (não requer autenticação)
- ✅ Lista completa de produtos e preços
- ✅ Função `refetch()` para recarregar dados

**Return Type**:
```typescript
{
  products: StripeProduct[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}
```

---

### Componentes Criados/Modificados

#### 1. `StripeSubscriptionCard` (Novo)
**Localização**: `src/components/assinante/StripeSubscriptionCard.tsx`

**Propósito**: Wrapper que integra `EnhancedSubscriptionCard` com dados do Stripe

**Uso**:
```tsx
import { StripeSubscriptionCard } from '@/components/assinante/StripeSubscriptionCard'

function Dashboard() {
  return (
    <div>
      <h1>Minha Assinatura</h1>
      <StripeSubscriptionCard />
    </div>
  )
}
```

**Características**:
- ✅ Busca automática de dados do Stripe
- ✅ Estados de loading, error, e "sem assinatura"
- ✅ Transformação de dados Stripe → EnhancedSubscriptionCard
- ✅ Integração com Stripe Portal para todas as ações
- ✅ Skeleton loading para melhor UX

**Estados Gerenciados**:
1. **Loading**: Exibe skeleton enquanto carrega dados
2. **Error**: Mostra mensagem de erro com botão "Tentar Novamente"
3. **Sem Assinatura**: Exibe mensagem e botão "Ver Planos Disponíveis"
4. **Sucesso**: Renderiza EnhancedSubscriptionCard com dados do Stripe

---

#### 2. Dashboard Page (Modificado)
**Localização**: `src/app/area-assinante/dashboard/page.tsx`

**Mudanças Implementadas**:

1. **Import do Hook**:
```typescript
import { useStripePortal } from '@/hooks/useStripePortal'
```

2. **Inicialização do Hook**:
```typescript
const { openPortal: openStripePortal, isLoading: stripePortalLoading } = useStripePortal()
```

3. **Atualização de Navigation** (Linha 160-171):
```typescript
{
  label: 'Plano',
  icon: Layers,
  active: false,
  onClick: () => openStripePortal('/area-assinante/dashboard')  // ✅ Stripe Portal
},
{
  label: 'Pagamentos',
  icon: CreditCard,
  active: false,
  onClick: () => openStripePortal('/area-assinante/dashboard')  // ✅ Stripe Portal
},
```

4. **Atualização de Quick Actions** (Linha 146-150):
```typescript
{
  label: 'Plano',
  description: 'Gerencie sua assinatura',
  icon: Layers,
  onClick: () => openStripePortal('/area-assinante/dashboard')  // ✅ Stripe Portal
}
```

5. **Atualização do Botão "Alterar plano"** (Linha 537-539):
```typescript
<Button
  onClick={() => openStripePortal('/area-assinante/dashboard')}
  disabled={stripePortalLoading}
>
  <Layers className="h-4 w-4 mr-2" />
  {stripePortalLoading ? 'Carregando...' : 'Ver Planos'}
</Button>
```

---

## 🔐 Segurança e Autenticação

### Firebase Authentication Flow

1. **Cliente obtém ID token**:
```typescript
const token = await user.getIdToken()
```

2. **Cliente envia request**:
```typescript
fetch('/api/stripe/subscription', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

3. **Servidor verifica token**:
```typescript
import { adminAuth } from '@/lib/firebase-admin'

const decodedToken = await adminAuth.verifyIdToken(token)
const firebaseUid = decodedToken.uid
```

4. **Servidor busca dados do Stripe**:
```typescript
const customers = await stripe.customers.list({
  email: decodedToken.email,
  limit: 1
})
```

### Logs de Auditoria LGPD

Todas as requisições de assinatura são registradas:
```typescript
console.log('[STRIPE_SUBSCRIPTION_ACCESS]', {
  userId: decodedToken.uid,
  email: decodedToken.email,
  subscriptionId: subscription.id,
  timestamp: new Date().toISOString()
})
```

---

## 🎨 Fluxo de Usuário

### Cenário 1: Visualizar Assinatura Ativa

1. Usuário acessa `/area-assinante/dashboard`
2. `StripeSubscriptionCard` é renderizado
3. Hook `useStripeSubscription` busca dados do Stripe
4. Dados são transformados e exibidos no `EnhancedSubscriptionCard`
5. Usuário vê:
   - Nome do plano
   - Preço (sincronizado com Stripe)
   - Data da próxima cobrança
   - Método de pagamento (últimos 4 dígitos do cartão)
   - Status da assinatura

### Cenário 2: Alterar Plano via Stripe Portal

1. Usuário clica em "Ver Planos" ou "Plano" na navegação
2. Hook `useStripePortal` cria sessão do Billing Portal
3. Usuário é redirecionado para `https://billing.stripe.com/p/session/...`
4. Usuário visualiza planos disponíveis no Stripe
5. Usuário seleciona novo plano e confirma
6. Stripe processa mudança
7. Usuário é redirecionado de volta para `/area-assinante/dashboard`
8. Dashboard recarrega com dados atualizados do Stripe

### Cenário 3: Gerenciar Pagamentos via Stripe Portal

1. Usuário clica em "Pagamentos" na navegação ou "Portal de pagamento"
2. Hook `useStripePortal` cria sessão do Customer Portal
3. Usuário é redirecionado para Stripe Portal
4. Usuário pode:
   - Atualizar método de pagamento
   - Ver histórico de faturas
   - Baixar recibos
   - Cancelar assinatura
   - Gerenciar informações de cobrança
5. Após mudanças, usuário retorna ao dashboard

---

## 🧪 Como Testar

### 1. Teste de Build

```bash
cd /root/svlentes-hero-shop
npm run build
```

**Verificações**:
- ✅ Build completa sem erros
- ✅ Sem warnings de TypeScript
- ✅ APIs compiladas corretamente

---

### 2. Teste Local

```bash
npm run dev
```

**Passos de Teste**:

#### Teste API de Produtos:
```bash
curl http://localhost:3000/api/stripe/products | jq
```

**Resultado Esperado**:
```json
{
  "products": [
    {
      "id": "prod_...",
      "name": "Plano Express",
      "description": "...",
      "prices": [...],
      "defaultPrice": {...}
    }
  ],
  "count": 3
}
```

#### Teste API de Assinatura (requer autenticação):
```bash
TOKEN="<firebase-id-token>"
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/stripe/subscription | jq
```

**Resultado Esperado**:
```json
{
  "subscription": {
    "id": "sub_...",
    "status": "active",
    "plan": {
      "name": "Plano VIP",
      "amount": 12800,
      "currency": "brl"
    },
    "payment_method": {
      "type": "card",
      "card": {
        "brand": "visa",
        "last4": "4242"
      }
    }
  }
}
```

---

### 3. Teste de Interface

1. **Login no Dashboard**:
   - Acesse `http://localhost:3000/area-assinante/login`
   - Faça login com usuário de teste
   - Verifique redirecionamento para dashboard

2. **Verificar Sincronização de Dados**:
   - Confirme que o nome do plano corresponde ao Stripe
   - Confirme que o preço está correto
   - Verifique se a data da próxima cobrança está correta

3. **Teste de Navegação "Plano"**:
   - Clique no item "Plano" na barra lateral
   - Deve abrir Stripe Billing Portal
   - Verifique se a URL é `https://billing.stripe.com/p/session/...`
   - Retorne ao dashboard e verifique funcionamento

4. **Teste de Navegação "Pagamentos"**:
   - Clique no item "Pagamentos" na barra lateral
   - Deve abrir Stripe Customer Portal
   - Verifique redirecionamento correto

5. **Teste do Botão "Ver Planos"**:
   - Clique no botão "Ver Planos" no card de assinatura
   - Deve redirecionar para Stripe Portal
   - Verifique que o botão mostra "Carregando..." durante redirecionamento

---

### 4. Teste de Produção

```bash
# Build de produção
npm run build

# Restart do serviço
systemctl restart svlentes-nextjs

# Verificar serviço
systemctl status svlentes-nextjs

# Testar endpoint de produção
curl -I https://svlentes.com.br/api/stripe/products
```

**Resultado Esperado**:
```
HTTP/2 200
content-type: application/json
```

---

## 📊 Monitoramento e Logs

### Logs de API

**Sucesso**:
```
[STRIPE_SUBSCRIPTION_ACCESS] {
  userId: 'firebase-uid-123',
  email: 'user@example.com',
  subscriptionId: 'sub_1234567890',
  timestamp: '2025-11-05T10:30:00.000Z'
}
```

**Erro**:
```
[STRIPE_SUBSCRIPTION_ERROR] {
  code: 'auth/id-token-expired',
  message: 'Token expirado'
}
```

### Monitoramento de Performance

```bash
# Ver logs do Next.js
journalctl -u svlentes-nextjs -f

# Filtrar por erros do Stripe
journalctl -u svlentes-nextjs | grep STRIPE_

# Verificar tempo de resposta das APIs
curl -w "@curl-format.txt" -o /dev/null -s \
  https://svlentes.com.br/api/stripe/products
```

---

## 🚨 Troubleshooting

### Problema 1: "Token não fornecido"

**Erro**: `{ error: 'UNAUTHORIZED', message: 'Token não fornecido' }`

**Causa**: Frontend não está enviando o token Firebase

**Solução**:
1. Verificar se `user.getIdToken()` está sendo chamado
2. Confirmar que o header `Authorization: Bearer <token>` está sendo enviado
3. Verificar se o usuário está autenticado

---

### Problema 2: "Cliente não encontrado"

**Erro**: `{ error: 'Cliente não encontrado', status: 404 }`

**Causa**: Usuário não tem Stripe Customer ID vinculado

**Soluções**:
1. Verificar se o usuário tem `stripeCustomerId` no Firebase custom claims
2. Confirmar que o email do usuário existe no Stripe
3. Criar Stripe Customer manualmente se necessário:
```typescript
const customer = await stripe.customers.create({
  email: user.email,
  metadata: { firebaseUid: user.uid }
})
```

---

### Problema 3: "Assinatura não encontrada"

**Erro**: `{ error: 'Assinatura não encontrada', status: 404 }`

**Causa**: Usuário não possui assinatura ativa no Stripe

**Soluções**:
1. Verificar status da assinatura no Stripe Dashboard
2. Confirmar que a assinatura não foi cancelada
3. Verificar se o Stripe Customer ID está correto

---

### Problema 4: Erro ao redirecionar para Stripe Portal

**Erro**: Botão não redireciona ou mostra erro

**Causa**: Erro ao criar sessão do Billing Portal

**Debug**:
1. Verificar logs do navegador (F12 → Console)
2. Verificar logs do servidor: `journalctl -u svlentes-nextjs -f`
3. Confirmar que `STRIPE_SECRET_KEY` está configurada
4. Testar endpoint manualmente:
```bash
curl -X POST https://svlentes.com.br/api/stripe/customer-portal \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"returnUrl": "https://svlentes.com.br/area-assinante/dashboard"}'
```

---

## 🔄 Próximos Passos (Opcional)

### Melhorias Futuras

1. **Cache de Produtos**:
   - Implementar cache Redis para produtos do Stripe
   - Reduzir chamadas à API do Stripe
   - Melhorar performance

2. **Webhook de Sincronização**:
   - Criar webhook para atualizar dados localmente
   - Sincronizar mudanças de assinatura automaticamente
   - Reduzir latência na exibição de dados

3. **Suporte a Múltiplas Assinaturas**:
   - Permitir usuário ter múltiplas assinaturas
   - Exibir todas as assinaturas no dashboard
   - Gerenciar cada assinatura individualmente

4. **Analytics**:
   - Rastrear uso do Stripe Portal
   - Monitorar conversões de plano
   - Análise de cancelamentos

---

## 📝 Checklist de Deploy

Antes de fazer deploy para produção:

- [ ] ✅ Build de produção completa sem erros
- [ ] ✅ Variáveis de ambiente configuradas (STRIPE_SECRET_KEY)
- [ ] ✅ Firebase Admin SDK configurado
- [ ] ✅ Testes locais passando (APIs, UI, navegação)
- [ ] ✅ Stripe Dashboard configurado corretamente
- [ ] ✅ Customer Portal habilitado no Stripe
- [ ] ✅ Billing Portal configurado com return URL correto
- [ ] ✅ Documentação atualizada
- [ ] ✅ Logs de auditoria funcionando
- [ ] ✅ Rate limiting verificado
- [ ] ✅ HTTPS configurado (requisito do Stripe)
- [ ] ✅ Backup do banco de dados realizado

---

## 📚 Referências

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Customer Portal](https://stripe.com/docs/customer-management/integrate-customer-portal)
- [Stripe Billing Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Implementado por**: Claude Code
**Reviewed by**: Dr. Philipe Saraiva Cruz
**Status**: ✅ Pronto para Deploy e Testes Finais
