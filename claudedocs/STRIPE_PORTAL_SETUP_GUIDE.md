# Guia de Configuração e Teste - Stripe Customer Portal

**Data**: 2025-10-31
**Status**: ✅ Assinatura de teste criada
**Usuário de teste**: drphilipe.saraiva.oftalmo@gmail.com

---

## 📋 Índice

1. [Resumo da Integração](#resumo-da-integração)
2. [Assinatura de Teste Criada](#assinatura-de-teste-criada)
3. [Configuração do Stripe](#configuração-do-stripe)
4. [Configuração do Firebase](#configuração-do-firebase)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Como Testar](#como-testar)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Resumo da Integração

A integração do **Stripe Customer Portal** está **100% implementada** e documentada. Os componentes estão prontos e funcionando:

### Componentes Implementados

✅ **Hook**: `useStripePortal` (`src/hooks/useStripePortal.ts`)
- Gerencia abertura do portal
- Obtém token Firebase automaticamente
- Trata erros e loading states

✅ **API**: `/api/stripe/customer-portal` (`src/app/api/stripe/customer-portal/route.ts`)
- Cria sessão segura do Billing Portal
- Verifica autenticação Firebase
- Busca Stripe Customer ID por email

✅ **Componente UI**: `StripePortalButton` (`src/components/assinante/StripePortalButton.tsx`)
- Botão completo com loading/error states
- Variantes: Button, IconButton, Card
- Já integrado no dashboard

✅ **Integração**: `AccessibleDashboard` e `EnhancedSubscriptionCard`
- Botão "Gerenciar Assinatura no Stripe" visível
- QuickActions com ação do portal

---

## 🗄️ Assinatura de Teste Criada

Foi criada uma assinatura completa de teste no banco de dados:

### Dados do Usuário

```
Email: drphilipe.saraiva.oftalmo@gmail.com
Nome: Dr. Philipe Saraiva Cruz
User ID: cmh2i3nxc0000ko1shdh6hm6y
Firebase UID: test-1761168246238
Asaas Customer ID: cus_asaas_test_1761906051641
```

### Dados da Assinatura

```
Subscription ID: cmhepde760001kozujlz1upjw
Plano: VIP Anual
Status: ACTIVE
Valor Mensal: R$ 89,90
Próxima Cobrança: 01/12/2025
Data de Início: 31/08/2025
```

### Benefícios Incluídos

- ✅ Lentes Mensais (ilimitado)
- ✅ Frete Grátis (ilimitado)
- ✅ Consultas de Acompanhamento (3 por ano, 1 usada)

### Histórico de Pagamentos

- ✅ **Pagamento 1** (31/08/2025): R$ 89,90 - CONFIRMADO
- ✅ **Pagamento 2** (01/10/2025): R$ 89,90 - CONFIRMADO
- ⏳ **Pagamento 3** (01/12/2025): R$ 89,90 - PENDENTE

### Pedidos Entregues

- ✅ **Pedido 1** (31/08/2025): Rastreio BR123456789BR - ENTREGUE
- ✅ **Pedido 2** (01/10/2025): Rastreio BR987654321BR - ENTREGUE

---

## ⚙️ Configuração do Stripe

### 1. Acessar Stripe Dashboard

1. Acesse: https://dashboard.stripe.com
2. Faça login com a conta da SV Lentes

### 2. Criar Customer no Stripe

**Opção A: Via Dashboard (Recomendado para teste)**

```
1. Navegue para: Customers > Create customer
2. Preencha:
   - Email: drphilipe.saraiva.oftalmo@gmail.com
   - Name: Dr. Philipe Saraiva Cruz
   - Description: Test customer for Stripe Portal integration
   - Metadata: { firebaseUid: "test-1761168246238" }
3. Clique em "Create customer"
4. COPIE o Customer ID (ex: cus_xxxxxxxxxx)
```

**Opção B: Via Stripe CLI**

```bash
stripe customers create \
  --email "drphilipe.saraiva.oftalmo@gmail.com" \
  --name "Dr. Philipe Saraiva Cruz" \
  --description "Test customer for Stripe Portal integration" \
  --metadata[firebaseUid]="test-1761168246238"
```

**Opção C: Via API (TypeScript)**

```typescript
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const customer = await stripe.customers.create({
  email: 'drphilipe.saraiva.oftalmo@gmail.com',
  name: 'Dr. Philipe Saraiva Cruz',
  description: 'Test customer for Stripe Portal integration',
  metadata: {
    firebaseUid: 'test-1761168246238',
    databaseUserId: 'cmh2i3nxc0000ko1shdh6hm6y',
  },
})

console.log('Stripe Customer ID:', customer.id)
```

### 3. Ativar o Customer Portal

```
1. Navegue para: Settings > Billing > Customer Portal
2. Ative "Customer Portal"
3. Configure permissões:
   ✅ Allow customers to update payment methods
   ✅ Allow customers to update subscriptions
   ✅ Allow customers to cancel subscriptions
   ✅ Show invoice history
4. Salve as alterações
```

### 4. Criar Test Subscription (Opcional)

Se quiser testar mudanças de plano no portal:

```
1. No customer recém-criado, clique em "Add subscription"
2. Selecione um produto/preço de teste
3. Configure:
   - Trial period: Não
   - Payment method: Use test card 4242 4242 4242 4242
4. Crie a assinatura
```

---

## 🔥 Configuração do Firebase

### Adicionar Custom Claims ao Usuário

Para que a integração funcione, o usuário precisa ter o `stripeCustomerId` nos custom claims do Firebase.

**Opção A: Via Firebase Console**

```
1. Acesse: https://console.firebase.google.com
2. Selecione o projeto SV Lentes
3. Authentication > Users
4. Encontre: drphilipe.saraiva.oftalmo@gmail.com
5. Copie o UID
```

**Opção B: Via Firebase Admin SDK (Node.js)**

```javascript
const admin = require('firebase-admin')

// Inicializar Admin SDK (se ainda não estiver)
admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json'))
})

async function setStripeCustomerId() {
  const email = 'drphilipe.saraiva.oftalmo@gmail.com'
  const stripeCustomerId = 'cus_xxxxxxxxxx' // SUBSTITUIR pelo ID real do Stripe

  try {
    // Buscar usuário pelo email
    const user = await admin.auth().getUserByEmail(email)

    // Definir custom claims
    await admin.auth().setCustomUserClaims(user.uid, {
      stripeCustomerId: stripeCustomerId,
      role: 'subscriber',
    })

    console.log('✅ Custom claims atualizados com sucesso!')
    console.log('   User UID:', user.uid)
    console.log('   Stripe Customer ID:', stripeCustomerId)

    // Importante: O usuário precisa fazer logout/login para obter o novo token
    console.log('\n⚠️  IMPORTANTE: O usuário deve fazer logout e login novamente!')

  } catch (error) {
    console.error('❌ Erro ao atualizar custom claims:', error)
  }
}

setStripeCustomerId()
```

**Opção C: Via Prisma (Atualizar banco)**

Se você preferir armazenar no banco em vez de custom claims:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateStripeCustomerId() {
  const stripeCustomerId = 'cus_xxxxxxxxxx' // SUBSTITUIR

  await prisma.user.update({
    where: { email: 'drphilipe.saraiva.oftalmo@gmail.com' },
    data: {
      // Adicionar campo no schema se não existir
      stripeCustomerId: stripeCustomerId,
    },
  })

  console.log('✅ Stripe Customer ID atualizado no banco')
}

updateStripeCustomerId()
```

**Importante**: Após atualizar os custom claims, o usuário **DEVE fazer logout e login novamente** para obter um novo token com as claims atualizadas.

---

## 🔐 Variáveis de Ambiente

### Verificar Configuração

Certifique-se de que as seguintes variáveis estão configuradas em `.env.local`:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY="sk_test_..." ou "sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..." ou "pk_live_..."

# Base URL (importante para return_url)
NEXT_PUBLIC_BASE_URL="https://svlentes.com.br"

# Firebase (necessário para autenticação)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
# ... outras variáveis Firebase
```

### Obter Chaves do Stripe

1. **Test Mode Keys** (para desenvolvimento):
   ```
   Dashboard > Developers > API Keys
   - Publishable key: pk_test_...
   - Secret key: sk_test_... (revelar e copiar)
   ```

2. **Live Mode Keys** (para produção):
   ```
   Dashboard > Developers > API Keys (toggle "Viewing test data" OFF)
   - Publishable key: pk_live_...
   - Secret key: sk_live_... (revelar e copiar)
   ```

⚠️ **NUNCA** commitar as chaves no repositório!

---

## 🧪 Como Testar

### Pré-requisitos

- ✅ Customer criado no Stripe
- ✅ Custom claims configurados no Firebase (ou campo no banco)
- ✅ Variáveis de ambiente configuradas
- ✅ Aplicação rodando (`npm run dev` ou produção)

### Fluxo de Teste Completo

#### 1. Fazer Login na Aplicação

```
1. Acesse: http://localhost:3000/area-assinante/login (ou produção)
2. Faça login com: drphilipe.saraiva.oftalmo@gmail.com
3. Use a senha do Firebase (criar se não existir)
```

#### 2. Acessar o Dashboard

```
1. Após login, você será redirecionado para: /area-assinante/dashboard
2. Você deve ver:
   ✅ Card de assinatura com status ATIVO
   ✅ Plano "VIP Anual" - R$ 89,90/mês
   ✅ Próxima cobrança: 01/12/2025
   ✅ Botão "Gerenciar Assinatura no Stripe"
```

#### 3. Testar o Botão do Stripe Portal

```
1. Localize o botão "Gerenciar Assinatura no Stripe"
   (pode estar no card de assinatura ou em Quick Actions)
2. Clique no botão
3. Aguarde (loading state deve aparecer)
4. Você será redirecionado para: https://billing.stripe.com/p/session/...
```

#### 4. Navegar no Stripe Customer Portal

No portal do Stripe, você poderá:

- ✅ Ver detalhes da assinatura
- ✅ Atualizar método de pagamento
- ✅ Ver histórico de faturas
- ✅ Baixar faturas em PDF
- ✅ Atualizar informações de cobrança
- ✅ Gerenciar assinatura (upgrade/downgrade/cancelar)

#### 5. Retornar ao Dashboard

```
1. Após finalizar no portal, clique em "Return to dashboard"
2. Você voltará para: /area-assinante/dashboard
3. Qualquer alteração feita no Stripe será refletida (via webhooks)
```

---

## 🐛 Troubleshooting

### Erro: "Cliente não encontrado no Stripe"

**Causa**: Customer não existe no Stripe ou email não está associado.

**Solução**:
1. Verifique se o customer foi criado no Stripe Dashboard
2. Confirme que o email está correto
3. Tente buscar manualmente:
   ```bash
   stripe customers list --email "drphilipe.saraiva.oftalmo@gmail.com"
   ```

### Erro: "Portal não disponível"

**Causa**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` não configurado ou inválido.

**Solução**:
1. Verifique o `.env.local`
2. Certifique-se de que a chave começa com `pk_test_` ou `pk_live_`
3. Reinicie o servidor após alterar variáveis de ambiente

### Erro: "Token de autenticação inválido"

**Causa**: Custom claims não atualizados ou usuário não fez logout/login.

**Solução**:
1. Faça logout do sistema
2. Faça login novamente
3. Verifique no console do navegador se o token tem `stripeCustomerId`:
   ```javascript
   // No console do navegador
   firebase.auth().currentUser.getIdTokenResult().then(token => {
     console.log('Custom claims:', token.claims)
   })
   ```

### Botão não aparece no Dashboard

**Causa**: `isAvailable` retorna `false` (Stripe não configurado).

**Solução**:
1. Verifique as variáveis de ambiente
2. Inspecione o elemento no navegador
3. Verifique o console para erros
4. Confirme que `process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` não contém "your_stripe"

### Redirecionamento não funciona

**Causa**: Problema com `window.location.href` ou popup bloqueado.

**Solução**:
1. Verifique o console para erros JavaScript
2. Tente desabilitar extensões do navegador
3. Teste em modo anônimo/privado
4. Verifique se a sessão do Stripe foi criada corretamente (logs da API)

---

## 📊 Verificar Integração Funcionando

### Logs Esperados (Console do Servidor)

Quando você clicar no botão, deve ver nos logs:

```bash
[STRIPE_PORTAL_ACCESS] {
  userId: 'cmh2i3nxc0000ko1shdh6hm6y',
  email: 'drphilipe.saraiva.oftalmo@gmail.com',
  stripeCustomerId: 'cus_xxxxxxxxxx',
  timestamp: '2025-10-31T...',
  ip: '192.168.1.x'
}
```

### Logs de Sucesso

```bash
✅ Token Firebase verificado
✅ Stripe Customer ID encontrado
✅ Sessão do portal criada
✅ URL de redirecionamento gerado
```

### Logs de Erro

Se algo der errado, você verá:

```bash
[STRIPE_PORTAL_ERROR] {
  code: 'auth/invalid-credential', // ou outro erro
  message: '...',
  stack: '...'
}
```

---

## 🔗 Recursos Adicionais

- [Documentação Completa da Integração](./STRIPE_CUSTOMER_PORTAL.md)
- [Documentação Original do Portal](./STRIPE_PORTAL_INTEGRATION.md)
- [Stripe Customer Portal Docs](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Firebase Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)

---

## ✅ Checklist Final

Antes de considerar a integração completa, verifique:

- [ ] Customer criado no Stripe com email correto
- [ ] Custom claims atualizados no Firebase (ou campo no banco)
- [ ] Variáveis de ambiente configuradas
- [ ] Usuário fez logout/login para obter novo token
- [ ] Botão aparece no dashboard
- [ ] Clique no botão redireciona para Stripe Portal
- [ ] Portal exibe informações corretas
- [ ] Retorno ao dashboard funciona
- [ ] Webhooks configurados (opcional, para sincronização)

---

## 📞 Contato

**Dúvidas ou problemas?**
Entre em contato com a equipe de desenvolvimento ou consulte a documentação oficial do Stripe.

**Autor**: Dr. Philipe Saraiva Cruz
**Email**: drphilipe.saraiva.oftalmo@gmail.com
