# Guia de Deployment - Integração Stripe Corrigida

**Data**: 2025-11-02
**Autor**: Dr. Philipe Saraiva Cruz
**Status**: 🚀 PRONTO PARA DEPLOYMENT

---

## 📋 Sumário das Correções Implementadas

### ✅ Fase 1: Schema do Banco de Dados

- [x] Adicionado `stripeCustomerId` ao model User
- [x] Adicionado `stripeSubscriptionId` e `provider` ao model Subscription
- [x] Adicionado campos Stripe ao model Payment (`stripePaymentId`, `stripeCustomerId`, `stripeSubscriptionId`, `stripeInvoiceId`)
- [x] Adicionado campo `provider` ao model Payment
- [x] Criados índices para otimização de queries

### ✅ Fase 2: Correções de Código

- [x] Corrigido customer linking no webhook handler (agora usa `stripeCustomerId`)
- [x] Implementado auto-create customer no portal endpoint
- [x] Movido publishable key para variável de ambiente
- [x] Corrigido uso de campos no Payment model (agora usa campos Stripe corretos)

### ✅ Fase 3: Ferramentas e Documentação

- [x] Criado script de configuração: `scripts/setup-stripe.sh`
- [x] Criada documentação de webhooks: `STRIPE_WEBHOOK_CONFIGURATION_2025-11-02.md`
- [x] Criado guia de deployment (este documento)

---

## 🚀 Processo de Deployment

### Passo 1: Backup do Banco de Dados

**⚠️ CRÍTICO**: Sempre faça backup antes de rodar migrações em produção!

```bash
# Backup PostgreSQL
cd /root/approuter/scripts
./backup-n8n.sh

# Ou backup manual
docker exec postgres pg_dump -U n8nuser svlentes_subscribers > backup_pre_stripe_$(date +%Y%m%d_%H%M%S).sql
```

### Passo 2: Atualizar Código

```bash
cd /root/svlentes-hero-shop

# Se usando Git
git pull origin main

# Verificar alterações
git status
git log --oneline -5
```

### Passo 3: Gerar e Aplicar Migração Prisma

```bash
# Gerar arquivo de migração
npx prisma migrate dev --name add_stripe_fields

# OU aplicar migração existente (se já foi gerada)
npx prisma migrate deploy

# Gerar Prisma Client atualizado
npx prisma generate
```

**Migração Gerada** (para referência):

```sql
-- AlterTable User
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" VARCHAR(255);
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");
CREATE INDEX "idx_users_stripe_customer_id" ON "users"("stripe_customer_id");

-- AlterTable Subscription
ALTER TABLE "subscriptions" ADD COLUMN "stripe_subscription_id" VARCHAR(255);
ALTER TABLE "subscriptions" ADD COLUMN "provider" VARCHAR(50);
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");
CREATE INDEX "idx_subscriptions_stripe_id" ON "subscriptions"("stripe_subscription_id");
CREATE INDEX "idx_subscriptions_provider" ON "subscriptions"("provider");

-- AlterTable Payment
ALTER TABLE "payments" ADD COLUMN "provider" VARCHAR(50) NOT NULL;
ALTER TABLE "payments" ADD COLUMN "stripe_payment_id" VARCHAR(255);
ALTER TABLE "payments" ADD COLUMN "stripe_customer_id" VARCHAR(255);
ALTER TABLE "payments" ADD COLUMN "stripe_subscription_id" VARCHAR(255);
ALTER TABLE "payments" ADD COLUMN "stripe_invoice_id" VARCHAR(255);
ALTER TABLE "payments" ALTER COLUMN "asaas_payment_id" DROP NOT NULL;
ALTER TABLE "payments" ALTER COLUMN "asaas_customer_id" DROP NOT NULL;
CREATE INDEX "idx_payments_provider" ON "payments"("provider");
CREATE INDEX "idx_payments_stripe_id" ON "payments"("stripe_payment_id");
CREATE INDEX "idx_payments_stripe_invoice_id" ON "payments"("stripe_invoice_id");
```

### Passo 4: Configurar Variáveis de Ambiente

```bash
# Opção 1: Script automático (recomendado)
./scripts/setup-stripe.sh

# Opção 2: Manual
nano .env.local
```

**Variáveis Necessárias**:

```bash
# Stripe Payment Integration
STRIPE_SECRET_KEY=sk_live_seu_secret_key_aqui
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_seu_publishable_key_aqui
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret_aqui
```

**⚠️ IMPORTANTE**:
- Para **produção**: use chaves `sk_live_...` e `pk_live_...`
- Para **teste**: use chaves `sk_test_...` e `pk_test_...`
- Obtenha as chaves em: https://dashboard.stripe.com/apikeys

### Passo 5: Build de Produção

```bash
# Limpar cache anterior
rm -rf .next

# Build otimizado
npm run build

# Verificar build
ls -lh .next
```

**Saída Esperada**:
```
✓ Compiled successfully
✓ Generating static pages (112/112)
✓ Build completed
```

### Passo 6: Reiniciar Serviço

```bash
# Reiniciar Next.js (systemd)
systemctl restart svlentes-nextjs

# Verificar status
systemctl status svlentes-nextjs

# Ver logs em tempo real
journalctl -u svlentes-nextjs -f
```

**Saída Esperada**:
```
✓ Ready in 500-700ms
```

### Passo 7: Configurar Webhooks no Stripe

Siga o guia: `STRIPE_WEBHOOK_CONFIGURATION_2025-11-02.md`

**Resumo Rápido**:

1. Acesse: https://dashboard.stripe.com/webhooks
2. Adicione endpoint: `https://svlentes.com.br/api/webhooks/stripe`
3. Selecione eventos:
   - `checkout.session.completed`
   - `customer.subscription.*`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copie o webhook secret (`whsec_...`)
5. Atualize `.env.local` com o secret
6. Reinicie a aplicação

---

## ✅ Checklist de Verificação Pós-Deployment

### Banco de Dados

- [ ] Backup realizado com sucesso
- [ ] Migração aplicada sem erros
- [ ] Campos Stripe criados nas tabelas users, subscriptions, payments
- [ ] Índices criados corretamente

```bash
# Verificar schema
npx prisma studio
# Abra tabelas: users, subscriptions, payments
# Verifique colunas: stripe_customer_id, stripe_subscription_id, provider, etc.
```

### Variáveis de Ambiente

- [ ] `STRIPE_SECRET_KEY` configurado e válido
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` configurado e válido
- [ ] `STRIPE_WEBHOOK_SECRET` configurado e válido
- [ ] Chaves correspondem ao ambiente (teste ou produção)

```bash
# Validar env vars
grep STRIPE .env.local

# Testar disponibilidade no Node
node -e "console.log('SECRET:', process.env.STRIPE_SECRET_KEY ? '✅ OK' : '❌ Missing')"
```

### Build e Serviço

- [ ] Build compilado sem erros
- [ ] Serviço svlentes-nextjs ativo
- [ ] Nginx proxy funcionando
- [ ] SSL certificado válido

```bash
# Verificar build
npm run build

# Verificar serviço
systemctl status svlentes-nextjs
systemctl status nginx

# Testar conectividade
curl -I https://svlentes.com.br
curl -I https://svlentes.com.br/planos
```

### Funcionalidades Stripe

- [ ] Pricing table exibida em `/planos`
- [ ] Checkout funcional com cartão de teste
- [ ] Webhook endpoint acessível
- [ ] Webhooks configurados no Stripe Dashboard
- [ ] Eventos recebidos e processados corretamente

```bash
# Testar pricing table
curl -I https://svlentes.com.br/planos

# Testar webhook endpoint
curl -I https://svlentes.com.br/api/webhooks/stripe
# Deve retornar: 405 Method Not Allowed (correto, POST é esperado)

# Monitorar logs de webhook
journalctl -u svlentes-nextjs -f | grep STRIPE
```

### Portal do Cliente

- [ ] Botão "Gerenciar Assinatura" aparece no dashboard
- [ ] Portal do cliente abre corretamente
- [ ] Auto-create customer funciona para novos usuários

```bash
# Teste manual:
# 1. Faça login em https://svlentes.com.br/area-assinante/dashboard
# 2. Verifique se o botão aparece
# 3. Clique e verifique redirecionamento ao Stripe Portal
```

---

## 🧪 Testes Funcionais

### Teste 1: Criar Nova Assinatura

1. Acesse: https://svlentes.com.br/planos
2. Selecione um plano
3. Use cartão de teste: `4242 4242 4242 4242`
4. Complete checkout
5. Verifique:
   - Redirecionamento para página de sucesso
   - Webhook `checkout.session.completed` recebido
   - Assinatura criada no banco com `provider = 'stripe'`
   - User atualizado com `stripeCustomerId`

**Validação no Banco**:
```sql
-- Via Prisma Studio ou psql
SELECT id, email, stripe_customer_id FROM users WHERE stripe_customer_id IS NOT NULL;
SELECT id, plan_type, provider, stripe_subscription_id FROM subscriptions WHERE provider = 'stripe';
```

### Teste 2: Portal do Cliente

1. Faça login em https://svlentes.com.br/area-assinante/dashboard
2. Clique em "Gerenciar Assinatura"
3. Verifique:
   - Redirecionamento ao Stripe Customer Portal
   - Informações corretas da assinatura
   - Opções de cancelamento/atualização disponíveis

### Teste 3: Processamento de Pagamento

**Com Stripe CLI**:
```bash
stripe listen --forward-to https://svlentes.com.br/api/webhooks/stripe
stripe trigger invoice.payment_succeeded
```

**Verificação**:
- Webhook recebido e processado (status 200)
- Payment criado no banco com `provider = 'stripe'`
- Subscription atualizada com `lastPaymentDate`

### Teste 4: Falha de Pagamento

```bash
stripe trigger invoice.payment_failed
```

**Verificação**:
- Subscription marcada como `OVERDUE`
- Payment criado com status `OVERDUE`
- `daysOverdue` calculado corretamente

---

## 🐛 Troubleshooting

### Erro: Migration failed

**Sintomas**:
```
Error: Migration `add_stripe_fields` failed to apply cleanly to the shadow database
```

**Solução**:
```bash
# Reset shadow database
npx prisma migrate reset

# OU force apply
npx prisma migrate deploy --force
```

### Erro: Publishable key não encontrado

**Sintomas**:
- Pricing table não renderiza
- Console: `undefined` para publishable key

**Solução**:
```bash
# Verificar env var
grep NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY .env.local

# Deve ter valor que começa com pk_test_ ou pk_live_
# Se não, rode:
./scripts/setup-stripe.sh

# Reconstrua e reinicie
npm run build
systemctl restart svlentes-nextjs
```

### Erro: Customer não encontrado em webhook

**Sintomas**:
```
[PAYMENT] User not found for subscription Error: Customer: cus_xxxxx
```

**Solução**:
```bash
# Verificar se migração foi aplicada
npx prisma studio
# Tabela users deve ter coluna stripe_customer_id

# Se não tiver, aplique migração:
npx prisma migrate deploy

# Teste novo checkout para criar customer corretamente
```

### Erro: Webhook signature validation failed

**Sintomas**:
```
[PAYMENT] Invalid Stripe signature
```

**Solução**:
```bash
# 1. Verificar webhook secret
grep STRIPE_WEBHOOK_SECRET .env.local

# 2. Copiar novamente do Stripe Dashboard
# https://dashboard.stripe.com/webhooks

# 3. Atualizar .env.local

# 4. Reiniciar
systemctl restart svlentes-nextjs
```

---

## 📊 Monitoramento Pós-Deployment

### Logs Críticos

```bash
# Monitorar tudo relacionado a Stripe
journalctl -u svlentes-nextjs -f | grep -i stripe

# Monitorar apenas webhooks
journalctl -u svlentes-nextjs -f | grep STRIPE_WEBHOOK

# Monitorar apenas erros
journalctl -u svlentes-nextjs -f | grep -E "ERROR|Error|error"
```

### Métricas Importantes

| Métrica | O que Monitorar | Valor Esperado |
|---------|-----------------|----------------|
| **Webhook Success Rate** | Status 200 vs 4xx/5xx | > 95% |
| **Checkout Completion** | checkout.session.completed events | 100% dos checkouts |
| **Customer Linking** | Users com stripeCustomerId | 100% após checkout |
| **Payment Recording** | Payments criados com provider='stripe' | 100% dos payments |
| **Subscription Sync** | Subscriptions com stripeSubscriptionId | 100% das subscriptions |

### Dashboard Stripe

Monitorar diariamente:

1. **Payments**: https://dashboard.stripe.com/payments
2. **Subscriptions**: https://dashboard.stripe.com/subscriptions
3. **Customers**: https://dashboard.stripe.com/customers
4. **Webhooks**: https://dashboard.stripe.com/webhooks
   - Success rate
   - Response time
   - Failed deliveries

---

## 🔄 Rollback Plan

### Se algo der errado:

#### Rollback do Código

```bash
cd /root/svlentes-hero-shop

# Restaurar versão anterior
git log --oneline -5
git checkout [commit-hash-anterior]

# Rebuild
npm run build
systemctl restart svlentes-nextjs
```

#### Rollback do Banco de Dados

```bash
# Restaurar backup
docker exec -i postgres psql -U n8nuser svlentes_subscribers < backup_pre_stripe_YYYYMMDD_HHMMSS.sql

# Recarregar schema
npx prisma db pull
npx prisma generate
```

#### Desativar Stripe Temporariamente

```bash
# Comentar webhooks no Stripe Dashboard (não deletar!)
# Remover env vars temporariamente
nano .env.local
# Comente: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET

# Rebuild
npm run build
systemctl restart svlentes-nextjs
```

---

## 📝 Checklist Final

- [ ] **Backup realizado**
- [ ] **Migração Prisma aplicada**
- [ ] **Env vars configuradas**
- [ ] **Build compilado sem erros**
- [ ] **Serviço reiniciado e ativo**
- [ ] **Webhooks configurados no Stripe**
- [ ] **Pricing table funcional**
- [ ] **Checkout testado com sucesso**
- [ ] **Webhook testado e processado**
- [ ] **Portal do cliente funcional**
- [ ] **Logs monitorados sem erros**
- [ ] **Documentação lida e entendida**

---

## 🎉 Conclusão

Após seguir todos os passos deste guia, a integração Stripe estará totalmente funcional e corrigida, com:

- ✅ Schema do banco atualizado
- ✅ Customer linking corrigido
- ✅ Auto-create customer implementado
- ✅ Publishable key usando env var
- ✅ Webhooks configurados e funcionais
- ✅ Sistema de pagamentos completo

---

## 📚 Próximos Passos (Opcional)

1. **Monitoramento Avançado**:
   - Configurar alertas para falhas de webhook
   - Implementar dashboard de métricas Stripe

2. **Melhorias**:
   - Adicionar testes automatizados para endpoints Stripe
   - Implementar rate limiting no portal endpoint
   - Adicionar notificações de falha de pagamento

3. **Otimizações**:
   - Caching de customer lookups
   - Batch processing de webhooks
   - Performance monitoring

---

**Documento gerado em**: 2025-11-02
**Autor**: Dr. Philipe Saraiva Cruz
**Versão**: 1.0.0
**Status**: Pronto para Deployment em Produção

**Contato**: saraivavision@gmail.com
