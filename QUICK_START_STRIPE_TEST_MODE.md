# ⚡ Quick Start: Stripe Test Mode Setup

**Tempo Estimado**: 2-3 horas
**Guia Completo**: `claudedocs/STRIPE_TEST_MODE_SETUP_GUIDE_2025-11-05.md`

---

## 🎯 Objetivo

Configurar ambiente de teste com credenciais **Stripe reais em test mode** para que os 870 testes E2E funcionem.

---

## 📋 Checklist Rápido

### 1. Setup Stripe (30-45 min)

```bash
# 1. Acesse Stripe Dashboard em Test Mode
https://dashboard.stripe.com/test

# 2. Copie API Keys
Developers → API keys
- pk_test_51...
- sk_test_51...

# 3. Crie 2 Produtos
Products → Add product
- Express Mensal: R$ 128/mês
- VIP Anual: R$ 1092/ano (ou R$ 91/mês)

# 4. Crie 2 Customers
Customers → Add customer
- test@example.com
- usuario.a@test.svlentes.shop

# 5. Crie 2 Subscriptions
Em cada customer:
- Add subscription
- Escolha produto criado
- Payment: 4242 4242 4242 4242 (card de teste)
```

### 2. Setup Firebase (20-30 min)

```bash
# 1. Acesse Firebase Console
https://console.firebase.google.com/

# 2. Crie/Use Projeto
Project name: svlentes-test

# 3. Habilite Authentication
Build → Authentication → Get started
Enable: Email/Password

# 4. Crie 2 Usuários
Users → Add user
- test@example.com (senha: testpassword123)
- usuario.a@test.svlentes.shop (senha: testpassword123)
Copie os UIDs gerados!

# 5. Baixe Credentials
Project Settings → Service accounts
→ Generate new private key
Salve JSON
```

### 3. Configure .env.test (15-20 min)

```bash
# Editar arquivo
nano /root/svlentes-hero-shop/.env.test

# Substituir seções:

# STRIPE (do Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51..."
STRIPE_SECRET_KEY="sk_test_51..."
STRIPE_TEST_CUSTOMER_1="cus_..."  # test@example.com
STRIPE_TEST_CUSTOMER_2="cus_..."  # usuario.a@...
STRIPE_TEST_SUBSCRIPTION_1="sub_..."  # Express Mensal
STRIPE_TEST_SUBSCRIPTION_2="sub_..."  # VIP Anual

# FIREBASE (do Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="svlentes-test"
FIREBASE_PROJECT_ID="svlentes-test"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-...@svlentes-test.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# TEST USERS (do Firebase Authentication)
TEST_USER_EMAIL="test@example.com"
TEST_USER_PASSWORD="testpassword123"
TEST_USER_UID="AbCdEf123456..."  # UID do Firebase

TEST_USER_2_EMAIL="usuario.a@test.svlentes.shop"
TEST_USER_2_PASSWORD="testpassword123"
TEST_USER_2_UID="XyZ789..."  # UID do Firebase
```

### 4. Sincronizar Database (5 min)

```bash
cd /root/svlentes-hero-shop

# Executar sync Stripe → Database
npm run db:seed:stripe

# Deve exibir:
# 🔄 Syncing Stripe test data with database...
# ✅ User 1 synced: test@example.com
# ✅ User 2 synced: usuario.a@test.svlentes.shop
# ✅ Subscription 1 synced: sub_...
# ✅ Subscription 2 synced: sub_...
# 🎉 Stripe sync completed!
```

### 5. Executar Testes (10-15 min)

```bash
# Terminal 1: Iniciar dev server
npm run dev

# Terminal 2: Executar testes
npx playwright test e2e/subscriber-dashboard*.spec.ts

# Sucesso esperado:
# Running 870 tests using 2 workers
# ✓ 1 [chromium] › ... (2.1s)
# ✓ 2 [chromium] › ... (2.3s)
# ...
# 870 passed (15m)
```

---

## 🔍 Validação Rápida

### Teste Manual (5 min)

```bash
# 1. Abrir browser
open http://localhost:3000/area-assinante/login

# 2. Login
Email: test@example.com
Password: testpassword123

# 3. Deve mostrar dashboard com:
✅ Nome do usuário
✅ Subscription ativa
✅ Plano "Express Mensal"
✅ Próxima billing date
✅ Payment method (Visa •••• 4242)

# 4. Se tudo aparecer, os testes vão passar! 🎉
```

---

## 🆘 Problemas Comuns

### Erro: "Invalid API key provided"
```bash
# Solução:
1. Verificar Stripe Dashboard está em Test mode (não Live)
2. Copiar novamente as keys de https://dashboard.stripe.com/test/apikeys
3. Keys devem começar com pk_test_ e sk_test_
4. Atualizar .env.test
```

### Erro: "No such subscription"
```bash
# Solução:
1. Verificar subscription ID está correto no Stripe Dashboard
2. Subscription deve estar ACTIVE (não canceled ou incomplete)
3. Copiar ID correto (começa com sub_)
4. Executar npm run db:seed:stripe novamente
```

### Erro: "Firebase: auth/user-not-found"
```bash
# Solução:
1. Criar usuário no Firebase Console → Authentication
2. Email: test@example.com
3. Password: testpassword123
4. Copiar UID gerado
5. Atualizar TEST_USER_UID no .env.test
```

### Testes ainda timeout
```bash
# Debug:
1. Verificar dev server rodando: curl http://localhost:3000
2. Verificar .env.test completo (todos os IDs corretos)
3. Executar teste com UI: npx playwright test --ui
4. Ver console do browser para erros JavaScript
5. Ver logs do servidor: npm run dev (ver erros de API)
```

---

## 📁 Arquivos Criados

```
✅ claudedocs/STRIPE_TEST_MODE_SETUP_GUIDE_2025-11-05.md (guia completo, 1000+ linhas)
✅ prisma/seed-stripe-sync.ts (script de sincronização)
✅ package.json (adicionado script: db:seed:stripe)
✅ QUICK_START_STRIPE_TEST_MODE.md (este arquivo)
```

---

## 🔗 Links Úteis

- **Stripe Test Dashboard**: https://dashboard.stripe.com/test
- **Stripe Test Cards**: https://stripe.com/docs/testing#cards
- **Firebase Console**: https://console.firebase.google.com/
- **Guia Completo**: `claudedocs/STRIPE_TEST_MODE_SETUP_GUIDE_2025-11-05.md`

---

## ✅ Próximos Passos Após Setup

1. ✅ Testes E2E passando
2. ⏳ Integrar StripeSubscriptionCard no dashboard
3. ⏳ Adicionar navegação mobile
4. ⏳ Configurar CI/CD com testes automatizados

---

**Criado**: 2025-11-05
**Status**: 📋 Pronto para execução
**Tempo Total**: 2-3 horas (inclui todos os steps)
