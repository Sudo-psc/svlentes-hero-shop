# 🧪 Guia de Setup: Stripe Test Mode para Testes E2E
**Data**: 2025-11-05
**Objetivo**: Configurar ambiente de teste com Stripe Test Mode real
**Tempo Estimado**: 2-3 horas

---

## 📋 Visão Geral

Este guia configura o ambiente de teste para usar **credenciais Stripe reais em modo test**, permitindo que os 870 testes E2E executem com sucesso.

**Benefícios**:
- ✅ Testa integração Stripe completa
- ✅ Valida comportamento real da API
- ✅ Detecta problemas de integração antes de produção
- ✅ Sem necessidade de mocking

**Trade-offs**:
- ⚠️ Testes mais lentos (chamadas API reais)
- ⚠️ Requer conta Stripe (gratuita para test mode)
- ⚠️ Requer conexão internet

---

## 📝 Pré-requisitos

### 1. Acesso ao Stripe Dashboard
- [ ] Conta Stripe criada em https://dashboard.stripe.com/register
- [ ] Email verificado
- [ ] Login efetuado

### 2. Acesso ao Firebase Console
- [ ] Projeto Firebase existente ou novo
- [ ] Authentication habilitado
- [ ] Usuários de teste criados

### 3. Ambiente Local
- [ ] Node.js 20+ instalado
- [ ] Projeto clonado: `/root/svlentes-hero-shop`
- [ ] Dependências instaladas: `npm install`

---

## 🔧 Parte 1: Configurar Stripe Test Mode

### Passo 1.1: Acessar Stripe Dashboard Test Mode

1. **Login no Stripe**: https://dashboard.stripe.com/login
2. **Ativar Test Mode**: No canto superior direito, verifique que está em **"Test mode"**
   - Deve exibir um switch ou badge "Viewing test data"
   - Se estiver em "Live mode", clique para alternar para "Test mode"

### Passo 1.2: Obter API Keys de Test Mode

1. **Navegar para API Keys**:
   - Menu lateral: **Developers** → **API keys**
   - URL direta: https://dashboard.stripe.com/test/apikeys

2. **Copiar as chaves**:
   ```
   Publishable key: pk_test_51...
   Secret key: sk_test_51...  (clique em "Reveal test key token")
   ```

3. **Armazenar temporariamente** (vamos usar depois):
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51..."
   STRIPE_SECRET_KEY="sk_test_51..."
   ```

⚠️ **IMPORTANTE**: Estas chaves são de **test mode** e seguras para commit (mas não recomendado). Use variáveis de ambiente.

---

### Passo 1.3: Criar Produtos de Teste

Vamos criar os mesmos planos que existem em produção:

#### Produto 1: Express Mensal

1. **Navegar para Products**:
   - Menu lateral: **Products** → **+ Add product**
   - URL: https://dashboard.stripe.com/test/products/create

2. **Preencher detalhes**:
   ```
   Name: Express Mensal
   Description: Assinatura mensal express de lentes de contato

   Pricing model: Standard pricing
   Price: R$ 128.00 (ou 128.00 em sua moeda)
   Billing period: Monthly

   Currency: BRL (Brazilian Real)
   ```

3. **Salvar** e copiar:
   ```
   Product ID: prod_...
   Price ID: price_...
   ```

#### Produto 2: VIP Anual

1. **Criar novo produto**: **+ Add product**

2. **Preencher detalhes**:
   ```
   Name: VIP Anual
   Description: Assinatura anual VIP de lentes de contato

   Pricing model: Standard pricing
   Price: R$ 91.00 (ou 91.00 em sua moeda) - MENSAL
   Billing period: Monthly (mas será cobrado anualmente)

   OU

   Price: R$ 1092.00 (ou 1092.00) - ANUAL
   Billing period: Yearly

   Currency: BRL
   ```

3. **Salvar** e copiar:
   ```
   Product ID: prod_...
   Price ID: price_...
   ```

**Nota sobre preços anuais**:
- Se o preço é R$ 91/mês cobrado anualmente = R$ 1092/ano
- Configure como `R$ 1092` + `Billing period: Yearly`
- OU `R$ 91` + `Billing period: Monthly` (menos comum)

---

### Passo 1.4: Criar Clientes de Teste

Vamos criar customers que correspondem aos usuários de teste do Firebase.

#### Customer 1: test@example.com

1. **Navegar para Customers**:
   - Menu lateral: **Customers** → **+ Add customer**
   - URL: https://dashboard.stripe.com/test/customers/create

2. **Preencher detalhes**:
   ```
   Email: test@example.com
   Name: Usuario Teste A
   Description: Test user for E2E tests

   Shipping address (opcional):
   Street: Rua Teste, 123
   City: Caratinga
   State: MG
   Postal code: 35300-000
   Country: Brazil
   ```

3. **Salvar** e copiar:
   ```
   Customer ID: cus_...
   ```

#### Customer 2: usuario.a@test.svlentes.shop

1. **Criar novo customer**: **+ Add customer**

2. **Preencher detalhes**:
   ```
   Email: usuario.a@test.svlentes.shop
   Name: Usuario A
   Description: Test user A for E2E tests

   Shipping address:
   Street: Rua Teste A, 456
   City: Caratinga
   State: MG
   Postal code: 35300-001
   Country: Brazil
   ```

3. **Salvar** e copiar:
   ```
   Customer ID: cus_...
   ```

---

### Passo 1.5: Criar Subscriptions de Teste

#### Subscription 1: Express Mensal para test@example.com

1. **No perfil do customer `test@example.com`**:
   - Clique no customer criado
   - Seção **Subscriptions** → **Create subscription**

2. **Configurar subscription**:
   ```
   Product: Express Mensal (selecione da lista)
   Price: R$ 128.00 / month (o preço criado antes)

   Start date: Today (ou data específica)
   Billing cycle anchor: Today

   Payment method: Add test card
     Card number: 4242 4242 4242 4242
     Expiry: 12/34
     CVC: 123
     ZIP: 35300-000
   ```

3. **Criar** e copiar:
   ```
   Subscription ID: sub_...
   Status: active
   ```

#### Subscription 2: VIP Anual para usuario.a@test.svlentes.shop

1. **No perfil do customer `usuario.a@test.svlentes.shop`**:
   - Seção **Subscriptions** → **Create subscription**

2. **Configurar subscription**:
   ```
   Product: VIP Anual
   Price: R$ 1092.00 / year (ou R$ 91.00 / month)

   Start date: Today

   Payment method: Add test card
     Card number: 5555 5555 5555 4444 (Mastercard)
     Expiry: 12/35
     CVC: 456
     ZIP: 35300-001
   ```

3. **Criar** e copiar:
   ```
   Subscription ID: sub_...
   Status: active
   ```

---

### Passo 1.6: Configurar Webhook (Opcional para Testes)

Se os testes precisarem validar webhooks:

1. **Navegar para Webhooks**:
   - Menu: **Developers** → **Webhooks** → **Add endpoint**
   - URL: https://dashboard.stripe.com/test/webhooks/create

2. **Configurar endpoint**:
   ```
   Endpoint URL: http://localhost:3000/api/webhooks/stripe

   Events to send:
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
   ```

3. **Salvar** e copiar:
   ```
   Webhook signing secret: whsec_...
   ```

---

## 🔥 Parte 2: Configurar Firebase Test Users

### Passo 2.1: Criar Projeto Firebase de Teste (se não existir)

1. **Acessar Firebase Console**: https://console.firebase.google.com/

2. **Criar novo projeto** (ou usar existente):
   ```
   Project name: svlentes-test
   Enable Google Analytics: No (para testes)
   ```

3. **Navegar para Authentication**:
   - Menu lateral: **Build** → **Authentication**
   - Clicar em **Get started**

4. **Habilitar Email/Password**:
   - Aba **Sign-in method**
   - **Email/Password** → Enable
   - Salvar

---

### Passo 2.2: Criar Usuários de Teste

#### Usuário 1: test@example.com

1. **Aba Users** → **Add user**

2. **Preencher**:
   ```
   Email: test@example.com
   Password: testpassword123
   User UID: (será gerado automaticamente)
   ```

3. **Copiar o UID gerado**:
   ```
   UID: AbCdEf123456...
   ```

#### Usuário 2: usuario.a@test.svlentes.shop

1. **Add user**

2. **Preencher**:
   ```
   Email: usuario.a@test.svlentes.shop
   Password: testpassword123
   User UID: (gerado automaticamente)
   ```

3. **Copiar o UID**:
   ```
   UID: XyZ789...
   ```

---

### Passo 2.3: Obter Firebase Credentials

#### Credenciais do Client SDK:

1. **Project Settings** (ícone de engrenagem) → **Project settings**

2. **Aba General** → Seção **Your apps**

3. **Web app** → Se não existir, clique em **</> Add app**
   ```
   App nickname: SVLentes Test
   ```

4. **Copiar Firebase config**:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "svlentes-test.firebaseapp.com",
     projectId: "svlentes-test",
     storageBucket: "svlentes-test.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:..."
   };
   ```

#### Credenciais do Admin SDK:

1. **Project Settings** → **Service accounts**

2. **Generate new private key**

3. **Salvar arquivo JSON** (ex: `svlentes-test-firebase-adminsdk.json`)

4. **Extrair campos necessários**:
   ```json
   {
     "type": "service_account",
     "project_id": "svlentes-test",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@svlentes-test.iam.gserviceaccount.com",
     "client_id": "...",
     ...
   }
   ```

---

## ⚙️ Parte 3: Configurar Ambiente de Teste

### Passo 3.1: Atualizar .env.test

```bash
# Abrir arquivo
nano /root/svlentes-hero-shop/.env.test
```

**Substituir as seções relevantes**:

```bash
# =============================================================================
# STRIPE TEST MODE - REAL CREDENTIALS
# =============================================================================
# Obtidas do Stripe Dashboard → Developers → API keys (Test mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51..."
STRIPE_SECRET_KEY="sk_test_51..."
STRIPE_WEBHOOK_SECRET="whsec_..." # Se configurou webhook

# IDs dos produtos criados no Stripe
STRIPE_TEST_PRODUCT_EXPRESS="prod_..."  # Express Mensal
STRIPE_TEST_PRODUCT_VIP="prod_..."      # VIP Anual
STRIPE_TEST_PRICE_EXPRESS="price_..."   # Preço Express
STRIPE_TEST_PRICE_VIP="price_..."       # Preço VIP

# IDs dos customers de teste criados no Stripe
STRIPE_TEST_CUSTOMER_1="cus_..."        # test@example.com
STRIPE_TEST_CUSTOMER_2="cus_..."        # usuario.a@test.svlentes.shop

# IDs das subscriptions de teste criadas no Stripe
STRIPE_TEST_SUBSCRIPTION_1="sub_..."    # test@example.com
STRIPE_TEST_SUBSCRIPTION_2="sub_..."    # usuario.a@test.svlentes.shop

# =============================================================================
# FIREBASE TEST MODE - REAL CREDENTIALS
# =============================================================================
# Client SDK (Frontend)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="svlentes-test.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="svlentes-test"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="svlentes-test.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:..."

# Admin SDK (Backend) - Copie do arquivo JSON baixado
FIREBASE_PROJECT_ID="svlentes-test"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@svlentes-test.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"

# =============================================================================
# TEST USER CREDENTIALS
# =============================================================================
# Credenciais dos usuários criados no Firebase Authentication
TEST_USER_EMAIL="test@example.com"
TEST_USER_PASSWORD="testpassword123"
TEST_USER_UID="AbCdEf123456..." # UID do Firebase

TEST_USER_2_EMAIL="usuario.a@test.svlentes.shop"
TEST_USER_2_PASSWORD="testpassword123"
TEST_USER_2_UID="XyZ789..." # UID do Firebase

# =============================================================================
# DATABASE (CONTINUA USANDO POSTGRESQL PARA TESTES)
# =============================================================================
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/svlentes_test"

# Outros campos permanecem iguais...
```

---

### Passo 3.2: Criar Script de Sincronização Stripe → Database

Como os testes usam seeding do Prisma, precisamos sincronizar os IDs do Stripe com o database.

**Criar arquivo**: `/root/svlentes-hero-shop/prisma/seed-stripe-sync.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

async function main() {
  console.log('🔄 Syncing Stripe test data with database...')

  // 1. Sync User 1 (test@example.com)
  const user1 = await prisma.user.upsert({
    where: { email: process.env.TEST_USER_EMAIL! },
    update: {
      firebaseUid: process.env.TEST_USER_UID!,
      stripeCustomerId: process.env.STRIPE_TEST_CUSTOMER_1!
    },
    create: {
      email: process.env.TEST_USER_EMAIL!,
      name: 'Usuario Teste A',
      firebaseUid: process.env.TEST_USER_UID!,
      stripeCustomerId: process.env.STRIPE_TEST_CUSTOMER_1!,
      emailVerified: true
    }
  })

  console.log('✅ User 1 synced:', user1.email)

  // 2. Sync User 2 (usuario.a@test.svlentes.shop)
  const user2 = await prisma.user.upsert({
    where: { email: process.env.TEST_USER_2_EMAIL! },
    update: {
      firebaseUid: process.env.TEST_USER_2_UID!,
      stripeCustomerId: process.env.STRIPE_TEST_CUSTOMER_2!
    },
    create: {
      email: process.env.TEST_USER_2_EMAIL!,
      name: 'Usuario A',
      firebaseUid: process.env.TEST_USER_2_UID!,
      stripeCustomerId: process.env.STRIPE_TEST_CUSTOMER_2!,
      emailVerified: true
    }
  })

  console.log('✅ User 2 synced:', user2.email)

  // 3. Fetch and sync subscriptions from Stripe
  const sub1 = await stripe.subscriptions.retrieve(
    process.env.STRIPE_TEST_SUBSCRIPTION_1!,
    { expand: ['default_payment_method', 'plan.product'] }
  )

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: sub1.id },
    update: {
      status: sub1.status.toUpperCase(),
      currentPeriodEnd: new Date(sub1.current_period_end * 1000),
      currentPeriodStart: new Date(sub1.current_period_start * 1000)
    },
    create: {
      userId: user1.id,
      stripeSubscriptionId: sub1.id,
      stripePriceId: sub1.items.data[0].price.id,
      stripeProductId: (sub1.plan as any).product,
      status: sub1.status.toUpperCase(),
      currentPeriodStart: new Date(sub1.current_period_start * 1000),
      currentPeriodEnd: new Date(sub1.current_period_end * 1000),
      cancelAtPeriodEnd: sub1.cancel_at_period_end
    }
  })

  console.log('✅ Subscription 1 synced:', sub1.id)

  const sub2 = await stripe.subscriptions.retrieve(
    process.env.STRIPE_TEST_SUBSCRIPTION_2!,
    { expand: ['default_payment_method', 'plan.product'] }
  )

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: sub2.id },
    update: {
      status: sub2.status.toUpperCase(),
      currentPeriodEnd: new Date(sub2.current_period_end * 1000),
      currentPeriodStart: new Date(sub2.current_period_start * 1000)
    },
    create: {
      userId: user2.id,
      stripeSubscriptionId: sub2.id,
      stripePriceId: sub2.items.data[0].price.id,
      stripeProductId: (sub2.plan as any).product,
      status: sub2.status.toUpperCase(),
      currentPeriodStart: new Date(sub2.current_period_start * 1000),
      currentPeriodEnd: new Date(sub2.current_period_end * 1000),
      cancelAtPeriodEnd: sub2.cancel_at_period_end
    }
  })

  console.log('✅ Subscription 2 synced:', sub2.id)

  console.log('🎉 Stripe sync completed!')
}

main()
  .catch((e) => {
    console.error('❌ Sync failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

**Adicionar script ao package.json**:

```json
{
  "scripts": {
    "db:seed:stripe": "tsx prisma/seed-stripe-sync.ts"
  }
}
```

---

### Passo 3.3: Executar Sincronização

```bash
cd /root/svlentes-hero-shop

# 1. Garantir que .env.test está correto
cat .env.test | grep STRIPE_TEST

# 2. Executar sincronização
npm run db:seed:stripe

# Deve exibir:
# 🔄 Syncing Stripe test data with database...
# ✅ User 1 synced: test@example.com
# ✅ User 2 synced: usuario.a@test.svlentes.shop
# ✅ Subscription 1 synced: sub_...
# ✅ Subscription 2 synced: sub_...
# 🎉 Stripe sync completed!
```

---

## ✅ Parte 4: Executar Testes E2E

### Passo 4.1: Preparar Ambiente

```bash
cd /root/svlentes-hero-shop

# 1. Instalar dependências (se necessário)
npm install

# 2. Build da aplicação
npm run build

# 3. Iniciar servidor de desenvolvimento
npm run dev

# Aguardar mensagem:
# ✓ Ready in XXXms
# - Local: http://localhost:3000
```

---

### Passo 4.2: Executar Testes

Em um **novo terminal**:

```bash
cd /root/svlentes-hero-shop

# Executar todos os testes E2E do dashboard
npx playwright test e2e/subscriber-dashboard*.spec.ts

# Ou com UI para debug
npx playwright test e2e/subscriber-dashboard*.spec.ts --ui

# Ou apenas testes de acessibilidade
npx playwright test e2e/subscriber-dashboard-accessibility.spec.ts
```

---

### Passo 4.3: Validar Resultados

**Sucesso esperado**:

```
Running 870 tests using 2 workers

  ✓  1 [chromium] › subscriber-dashboard-accessibility.spec.ts:20:9 › WCAG 2.1 ... (2.1s)
  ✓  2 [chromium] › subscriber-dashboard-accessibility.spec.ts:28:9 › WCAG 2.1 ... (2.3s)
  ✓  3 [chromium] › subscriber-dashboard-accessibility.spec.ts:36:9 › WCAG 2.1 ... (1.9s)
  ...

  870 passed (15m)
```

**Se houver falhas**:
1. Verificar `.env.test` - todos os IDs corretos?
2. Verificar Stripe Dashboard - subscriptions estão ativas?
3. Verificar Firebase Console - usuários existem?
4. Verificar logs do servidor: `npm run dev` mostra erros?

---

## 🐛 Troubleshooting

### Erro: "Invalid API key provided"

**Causa**: Chave Stripe incorreta ou não em test mode

**Solução**:
1. Verificar que está em **Test mode** no Stripe Dashboard
2. Copiar novamente as chaves de https://dashboard.stripe.com/test/apikeys
3. Verificar que começam com `pk_test_` e `sk_test_`
4. Atualizar `.env.test`

---

### Erro: "No such subscription: sub_..."

**Causa**: Subscription ID incorreto ou não existe

**Solução**:
1. Acessar Stripe Dashboard → Customers
2. Verificar subscriptions dos customers de teste
3. Copiar IDs corretos
4. Executar `npm run db:seed:stripe` novamente

---

### Erro: "Firebase: Error (auth/user-not-found)"

**Causa**: Usuário não existe no Firebase Authentication

**Solução**:
1. Acessar Firebase Console → Authentication → Users
2. Verificar que `test@example.com` existe
3. Senha está definida como `testpassword123`
4. Copiar UID correto
5. Atualizar `.env.test` com UID correto

---

### Erro: "Timeout waiting for dashboard to load"

**Causa**: Dashboard não carrega após login

**Possíveis soluções**:
1. **Verificar servidor dev**: `http://localhost:3000` acessível?
2. **Verificar console do browser**: Erros JavaScript?
3. **Verificar Network tab**: Chamadas API falhando?
4. **Verificar autenticação**: Token Firebase válido?
5. **Verificar Stripe API**: Subscriptions retornando dados?

**Debug detalhado**:
```bash
# Ver logs do servidor
npm run dev

# Em outro terminal, abrir Playwright com UI
npx playwright test e2e/subscriber-dashboard-accessibility.spec.ts --ui --headed

# Observar:
# - Login funcionou?
# - Redirecionamento para dashboard ocorreu?
# - API /api/stripe/subscription retorna 200?
# - Dashboard renderiza elementos?
```

---

## 📊 Validação Final

### Checklist de Validação:

- [ ] ✅ Stripe Test Mode configurado com produtos e subscriptions
- [ ] ✅ Firebase Test Project configurado com usuários
- [ ] ✅ `.env.test` atualizado com todas as credenciais reais
- [ ] ✅ Script de sincronização executado com sucesso
- [ ] ✅ Servidor dev rodando sem erros
- [ ] ✅ Testes E2E executando sem timeouts
- [ ] ✅ Pelo menos 1 teste passando completamente

### Teste Manual Rápido:

```bash
# 1. Testar login manualmente
open http://localhost:3000/area-assinante/login

# 2. Login com:
Email: test@example.com
Password: testpassword123

# 3. Deve redirecionar para:
http://localhost:3000/area-assinante/dashboard

# 4. Dashboard deve exibir:
- Nome do usuário
- Subscription ativa
- Plano "Express Mensal"
- Próxima data de billing
- Método de pagamento (Visa •••• 4242)

# 5. Se tudo aparece corretamente, os testes devem passar!
```

---

## 🎯 Próximos Passos

Após setup completo e testes passando:

1. **Automatizar Setup** (opcional):
   - Criar script que cria produtos/customers via API
   - Adicionar ao CI/CD pipeline
   - Documentar em `.github/workflows/`

2. **Expandir Cobertura**:
   - Adicionar mais cenários de teste
   - Testar edge cases (subscription cancelada, falha de pagamento)
   - Testar webhooks

3. **Manutenção**:
   - Renovar subscriptions de teste mensalmente
   - Atualizar test data conforme produtos mudam
   - Sincronizar com produção

---

## 📝 Notas Importantes

### Sobre Custos:
- ✅ Stripe Test Mode é **100% gratuito**
- ✅ Firebase Authentication com <10.000 usuários é **gratuito**
- ✅ Não há cobrança por chamadas API em test mode

### Sobre Segurança:
- ⚠️ Não commitar chaves no git (usar `.env.test` que está em `.gitignore`)
- ⚠️ Chaves de test mode são seguras mas evitar exposição pública
- ⚠️ Usar chaves diferentes para CI/CD vs desenvolvimento local

### Sobre Manutenção:
- 🔄 Subscriptions de teste não renovam automaticamente após 1 ano
- 🔄 Pode precisar recriar subscriptions periodicamente
- 🔄 Produtos e preços podem ser atualizados quando necessário

---

## 🔗 Links Úteis

### Stripe:
- Dashboard Test Mode: https://dashboard.stripe.com/test
- API Keys: https://dashboard.stripe.com/test/apikeys
- Test Cards: https://stripe.com/docs/testing#cards
- API Documentation: https://stripe.com/docs/api

### Firebase:
- Console: https://console.firebase.google.com/
- Auth Documentation: https://firebase.google.com/docs/auth
- Test Users Guide: https://firebase.google.com/docs/auth/web/start

### Playwright:
- Documentation: https://playwright.dev/
- Test UI Mode: https://playwright.dev/docs/test-ui-mode
- Debugging: https://playwright.dev/docs/debug

---

## ✅ Checklist Completo

### Setup Inicial:
- [ ] Conta Stripe criada e verificada
- [ ] Projeto Firebase criado e configurado
- [ ] Node.js e dependências instaladas

### Stripe Configuration:
- [ ] Test mode ativado
- [ ] API keys copiadas
- [ ] Produto "Express Mensal" criado (R$ 128/mês)
- [ ] Produto "VIP Anual" criado (R$ 1092/ano ou R$ 91/mês)
- [ ] Customer `test@example.com` criado
- [ ] Customer `usuario.a@test.svlentes.shop` criado
- [ ] Subscription ativa para customer 1
- [ ] Subscription ativa para customer 2
- [ ] (Opcional) Webhook configurado

### Firebase Configuration:
- [ ] Authentication habilitado (Email/Password)
- [ ] Usuário `test@example.com` criado (senha: testpassword123)
- [ ] Usuário `usuario.a@test.svlentes.shop` criado
- [ ] Client SDK credentials copiadas
- [ ] Admin SDK JSON baixado e extraído

### Environment Setup:
- [ ] `.env.test` atualizado com Stripe keys
- [ ] `.env.test` atualizado com Firebase credentials
- [ ] `.env.test` atualizado com test user UIDs
- [ ] `.env.test` atualizado com Stripe IDs (products, prices, customers, subscriptions)

### Database Sync:
- [ ] Script `seed-stripe-sync.ts` criado
- [ ] Script adicionado ao `package.json`
- [ ] Sync executado com sucesso
- [ ] Database contém users com stripeCustomerId correto
- [ ] Database contém subscriptions com stripeSubscriptionId correto

### Test Execution:
- [ ] Build executado: `npm run build`
- [ ] Dev server iniciado: `npm run dev`
- [ ] Testes executados: `npx playwright test`
- [ ] Pelo menos 1 teste passando
- [ ] Nenhum timeout observado
- [ ] Dashboard carrega corretamente

### Validation:
- [ ] Login manual funciona
- [ ] Dashboard exibe subscription correta
- [ ] Dados do Stripe aparecem (plano, preço, billing date)
- [ ] Console do browser sem erros
- [ ] Server logs sem erros

---

**Criado por**: Claude Code
**Data**: 2025-11-05
**Status**: 📋 AGUARDANDO EXECUÇÃO
**Próximo Passo**: Seguir guia passo a passo para configurar Stripe Test Mode
