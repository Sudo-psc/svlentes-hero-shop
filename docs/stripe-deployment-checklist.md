# Checklist de Deploy - Stripe Pricing Table Integration

## Pré-Requisitos

### 1. Conta Stripe Configurada

- [ ] Conta Stripe criada e verificada
- [ ] Modo Test configurado e testado
- [ ] Modo Live ativado (requer verificação de identidade)
- [ ] Produtos e preços criados no Dashboard
- [ ] Pricing Table criada e configurada

### 2. Ambiente de Desenvolvimento

- [ ] Node.js >= 20.0.0 instalado
- [ ] npm >= 10.0.0 instalado
- [ ] Git configurado
- [ ] Acesso ao repositório `Sudo-psc/svlentes-hero-shop`

## Configuração Local (Development)

### Passo 1: Clonar Repositório

```bash
git clone https://github.com/Sudo-psc/svlentes-hero-shop.git
cd svlentes-hero-shop
```

### Passo 2: Instalar Dependências

```bash
npm install
```

**Dependências Stripe**:
- ✅ `stripe` (v19.1.0) - SDK do Stripe para Node.js
- ✅ `@stripe/stripe-js` (v8.1.0) - Stripe.js para frontend

### Passo 3: Configurar Variáveis de Ambiente

Criar arquivo `.env.local`:

```bash
cp .env.example .env.local
```

Editar `.env.local` e adicionar chaves de **TEST**:

```bash
# Stripe Test Keys (Dashboard > Developers > API keys)
STRIPE_SECRET_KEY=sk_test_{{YOUR_STRIPE_SECRET_KEY_HERE}}
STRIPE_WEBHOOK_SECRET=whsec_{{YOUR_WEBHOOK_SECRET_HERE}}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_{{YOUR_PUBLISHABLE_KEY_HERE}}
NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID=prctbl_{{YOUR_PRICING_TABLE_ID}}

# Outras variáveis necessárias...
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Como Obter as Chaves**:
1. Acesse: https://dashboard.stripe.com/test/apikeys
2. Copie "Publishable key" (pk_test_...)
3. Revele e copie "Secret key" (sk_test_...)
4. Para Webhook Secret: Configure webhook localmente (ver Passo 4)

### Passo 4: Configurar Webhook Local (Stripe CLI)

**Instalar Stripe CLI**:

```bash
# macOS
brew install stripe/stripe-brew/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin

# Windows
scoop install stripe
```

**Autenticar**:
```bash
stripe login
# Seguir instruções para autenticar no navegador
```

**Forward webhooks para localhost**:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copiar o webhook signing secret exibido (começa com `whsec_`) e adicionar ao `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_{{COPY_SECRET_FROM_STRIPE_CLI}}
```

### Passo 5: Criar Pricing Table no Stripe

1. Acesse: https://dashboard.stripe.com/test/pricing-tables
2. Clique em **"Create pricing table"**
3. Adicione produtos (criar novos ou usar existentes):
   - **Plano Mensal**: R$ 149,90/mês
   - **Plano Anual**: R$ 1.499,00/ano (economia de ~17%)
   - **Plano Premium**: R$ 249,90/mês
4. Configurar aparência:
   - **Call to action button text**: "Assinar Agora"
   - **Currency**: BRL (R$)
   - **Allow promotion codes**: Ativo
5. Clicar em **"Create pricing table"**
6. Copiar o **Pricing Table ID** (prctbl_...)
7. Adicionar ao `.env.local`:

```bash
NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID=prctbl_1SK1U5Ls8MC0aCdjGBBODqjW
```

### Passo 6: Testar Localmente

```bash
# Terminal 1: Iniciar servidor de desenvolvimento
npm run dev

# Terminal 2: Forward webhooks (manter rodando)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Acessar**: http://localhost:3000/planos

**Verificar**:
- [ ] Pricing Table carrega sem erros
- [ ] Sem erros de CSP no console (F12)
- [ ] Botão "Assinar Agora" redireciona para Checkout
- [ ] Completar pagamento de teste (cartão: 4242 4242 4242 4242)
- [ ] Webhook recebe evento `checkout.session.completed`
- [ ] Subscription criada no banco de dados

## Configuração em Staging

### Passo 1: Deploy para Vercel/Servidor Staging

**Vercel**:
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --env-file .env.staging
```

**Servidor próprio**:
```bash
# Build
npm run build

# Copiar build para servidor
rsync -avz .next/ user@staging.svlentes.com.br:/var/www/svlentes/

# Restart PM2
ssh user@staging.svlentes.com.br "pm2 restart svlentes"
```

### Passo 2: Configurar Variáveis de Ambiente no Staging

**Vercel**:
```bash
vercel env add STRIPE_SECRET_KEY
# Cole: sk_test_...

vercel env add STRIPE_WEBHOOK_SECRET
# Cole o valor do Stripe Dashboard (começa com whsec_)

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# Cole: pk_test_...

vercel env add NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID
# Cole: prctbl_...
```

**Servidor próprio** (adicionar ao `.env.production` ou usar systemd):
```bash
export STRIPE_SECRET_KEY="sk_test_{{YOUR_SECRET_KEY}}"
export STRIPE_WEBHOOK_SECRET="whsec_{{YOUR_WEBHOOK_SECRET}}"
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_{{YOUR_PUBLISHABLE_KEY}}"
export NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID="prctbl_{{YOUR_PRICING_TABLE_ID}}"
```

### Passo 3: Configurar Webhook no Stripe Dashboard (Staging)

1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Clique em **"Add endpoint"**
3. **Endpoint URL**: `https://staging.svlentes.com.br/api/webhooks/stripe`
4. **Description**: "Staging - Webhooks de assinaturas"
5. **Events to send**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
6. Clicar em **"Add endpoint"**
7. Copiar **Signing secret** (whsec_...) e atualizar variável de ambiente:

```bash
# Vercel
vercel env add STRIPE_WEBHOOK_SECRET production
# Cole o novo whsec_...

# Servidor próprio
# Atualizar .env.production e reiniciar app
```

### Passo 4: Testar em Staging

**Checklist de Testes**:
- [ ] Acessar `https://staging.svlentes.com.br/planos`
- [ ] Pricing Table carrega corretamente
- [ ] Console do navegador sem erros de CSP
- [ ] Network tab: todos os requests para Stripe retornam 200
- [ ] Clicar em "Assinar Agora" abre Checkout
- [ ] Completar pagamento de teste
- [ ] Verificar Dashboard Stripe > Events: evento `checkout.session.completed` recebido
- [ ] Verificar logs do servidor: webhook processado com sucesso
- [ ] Verificar banco de dados: subscription criada

**Comandos de Verificação**:
```bash
# Verificar headers CSP
curl -I https://staging.svlentes.com.br/planos | grep -i "content-security"

# Testar webhook endpoint
curl -X POST https://staging.svlentes.com.br/api/webhooks/stripe \
  -H "stripe-signature: invalid" \
  -d '{"test": true}'
# Deve retornar 401 Unauthorized

# Ver logs
ssh user@staging.svlentes.com.br "pm2 logs svlentes --lines 100"
```

## Deploy em Produção

### ⚠️ ATENÇÃO: Usar Chaves de PRODUÇÃO

**IMPORTANTE**:
- Use chaves que começam com `pk_live_` e `sk_live_` (não `pk_test_` e `sk_test_`)
- Teste extensivamente em staging antes de produção
- Configure alertas de monitoramento

### Passo 1: Obter Chaves de Produção

1. Ativar modo Live no Stripe:
   - Completar verificação de identidade
   - Adicionar informações bancárias
   - Ativar conta
2. Acesse: https://dashboard.stripe.com/apikeys (sem "/test/")
3. Copiar chaves de produção

### Passo 2: Configurar Variáveis de Ambiente (Produção)

**No servidor de produção**:

```bash
# SSH para servidor
ssh user@svlentes.com.br

# Editar arquivo de variáveis de ambiente
sudo nano /etc/systemd/system/svlentes.service.d/override.conf

# Adicionar:
[Service]
Environment="STRIPE_SECRET_KEY=sk_live_{{YOUR_LIVE_SECRET_KEY}}"
Environment="STRIPE_WEBHOOK_SECRET=whsec_{{YOUR_WEBHOOK_SECRET}}"
Environment="NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_{{YOUR_LIVE_PUBLISHABLE_KEY}}"
Environment="NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID=prctbl_{{YOUR_PRICING_TABLE_ID}}"
Environment="NODE_ENV=production"

# Recarregar systemd
sudo systemctl daemon-reload

# Reiniciar aplicação
sudo systemctl restart svlentes
```

**Ou usando PM2 ecosystem.config.js**:
```javascript
module.exports = {
  apps: [{
    name: 'svlentes',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      STRIPE_SECRET_KEY: 'sk_live_...',
      STRIPE_WEBHOOK_SECRET: 'whsec_...',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_live_...',
      NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID: 'prctbl_...'
    }
  }]
};
```

### Passo 3: Atualizar Nginx (Produção)

```bash
# SSH para servidor
ssh user@svlentes.com.br

# Backup da configuração atual
sudo cp /etc/nginx/sites-available/svlentes /etc/nginx/sites-available/svlentes.backup

# Copiar nova configuração
sudo cp /var/www/svlentes/nginx/production.conf /etc/nginx/sites-available/svlentes

# Testar configuração
sudo nginx -t

# Se OK, recarregar Nginx
sudo systemctl reload nginx
```

### Passo 4: Configurar Webhook de Produção

1. Acesse: https://dashboard.stripe.com/webhooks (sem "/test/")
2. Clique em **"Add endpoint"**
3. **Endpoint URL**: `https://svlentes.com.br/api/webhooks/stripe`
4. **Description**: "Produção - Webhooks de assinaturas SV Lentes"
5. **Events to send**: (mesmos eventos de staging)
6. Copiar **Signing secret** e atualizar variável de ambiente
7. **Reiniciar aplicação** para aplicar nova variável

### Passo 5: Deploy do Código

```bash
# No servidor de produção
cd /var/www/svlentes
git pull origin main

# Instalar dependências (se houver atualizações)
npm install --production

# Build
npm run build

# Reiniciar aplicação
pm2 restart svlentes

# Verificar status
pm2 status
pm2 logs svlentes --lines 50
```

### Passo 6: Verificação Pós-Deploy (Produção)

**Checklist Crítico**:
- [ ] Site acessível: https://svlentes.com.br
- [ ] Página /planos carrega sem erros
- [ ] Console sem erros de CSP
- [ ] Headers CSP corretos:
  ```bash
  curl -I https://svlentes.com.br/planos | grep -i "content-security-policy"
  ```
- [ ] Pricing Table renderiza corretamente
- [ ] Fazer compra de teste (cartão real com valor baixo, cancelar depois)
- [ ] Webhook recebe evento no Dashboard > Webhooks
- [ ] Subscription criada no banco de dados
- [ ] Email de confirmação enviado pelo Stripe

**Monitoramento nas primeiras 24h**:
- [ ] Verificar logs a cada hora: `pm2 logs svlentes`
- [ ] Monitorar Dashboard Stripe > Logs
- [ ] Verificar métricas: conversão de checkout
- [ ] Alertas configurados (Sentry, Datadog, etc)

### Passo 7: Rollback (se necessário)

**Se algo der errado**:

```bash
# Reverter para versão anterior
cd /var/www/svlentes
git log --oneline -5  # Ver últimos commits
git checkout <commit-anterior>

# Rebuild
npm run build

# Reiniciar
pm2 restart svlentes

# Ou usar script de rollback
npm run deploy:rollback
```

**Reverter Nginx**:
```bash
sudo cp /etc/nginx/sites-available/svlentes.backup /etc/nginx/sites-available/svlentes
sudo nginx -t
sudo systemctl reload nginx
```

## Monitoramento e Manutenção

### Logs a Monitorar

**Logs do Aplicativo**:
```bash
# PM2
pm2 logs svlentes

# Systemd
journalctl -u svlentes -f

# Arquivos de log (se configurado)
tail -f /var/log/svlentes/app.log
```

**Logs do Nginx**:
```bash
tail -f /var/log/nginx/svlentes.access.log
tail -f /var/log/nginx/svlentes.error.log
```

**Logs do Stripe**:
- Dashboard > Developers > Logs: https://dashboard.stripe.com/logs
- Dashboard > Webhooks > [seu endpoint]: Ver eventos recebidos

### Métricas a Acompanhar

**Dashboard Stripe**:
- Número de checkouts iniciados
- Taxa de conversão (checkout → pagamento)
- Valor médio de assinatura
- Churn rate (cancelamentos)

**Aplicação**:
- Tempo de resposta do `/api/webhooks/stripe`
- Taxa de erro 5xx
- Uptime da aplicação

**Alertas Recomendados**:
- 🚨 Webhook com >5% de falhas
- 🚨 Sem novos checkouts em 24h
- 🚨 Erro 5xx em webhooks
- 🚨 Tempo de resposta >5s

### Manutenção Regular

**Semanal**:
- [ ] Revisar logs de erro
- [ ] Verificar webhooks falhados no Dashboard Stripe
- [ ] Revisar métricas de conversão

**Mensal**:
- [ ] Atualizar dependências (`npm outdated`, `npm update`)
- [ ] Verificar atualizações do Stripe.js
- [ ] Revisar taxa de conversão vs. mês anterior
- [ ] Backup do banco de dados

**Trimestral**:
- [ ] Rotacionar secrets (opcional, se suspeita de vazamento)
- [ ] Revisar e otimizar CSP (remover domínios não usados)
- [ ] Auditoria de segurança (`npm audit`)

## Troubleshooting em Produção

### Problema: Checkout não abre

**Sintomas**: Botão "Assinar Agora" não redireciona para Checkout

**Verificações**:
1. Console do navegador: Há erros JavaScript?
2. Network tab: Request para `/api/stripe/create-checkout` retorna 200?
3. Variáveis de ambiente corretas?

```bash
# SSH para servidor
ssh user@svlentes.com.br

# Verificar variáveis
pm2 env svlentes | grep STRIPE

# Testar API manualmente
curl -X POST https://svlentes.com.br/api/stripe/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_test_id"}'
```

### Problema: Webhook não recebe eventos

**Sintomas**: Pagamentos completam mas não aparecem no banco de dados

**Verificações**:
1. Dashboard Stripe > Webhooks: Eventos estão sendo enviados?
2. Endpoint URL correto: `https://svlentes.com.br/api/webhooks/stripe`
3. Webhook Secret correto na variável de ambiente?

```bash
# Verificar logs do webhook
pm2 logs svlentes | grep webhook

# Testar endpoint manualmente
curl -X POST https://svlentes.com.br/api/webhooks/stripe \
  -H "stripe-signature: invalid" \
  -d '{"test": true}'
# Deve retornar 401 (assinatura inválida) = endpoint funcionando
```

**Solução**: Reenviar webhooks falhados manualmente no Dashboard Stripe > Webhooks > Events > [evento] > Resend

### Problema: CSP bloqueando recursos Stripe

**Sintomas**: Console mostra "Refused to load...", Pricing Table não aparece

**Verificações**:
```bash
# Verificar headers CSP
curl -I https://svlentes.com.br/planos | grep -i "content-security-policy"

# Verificar se contém:
# - script-src ... https://js.stripe.com
# - frame-src ... https://js.stripe.com https://checkout.stripe.com
# - connect-src ... https://api.stripe.com
```

**Solução**: Atualizar nginx.conf conforme documentação e recarregar:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Contatos de Suporte

**Stripe Support**:
- Dashboard: https://dashboard.stripe.com/support
- Email: support@stripe.com
- Chat: Disponível no Dashboard (canto inferior direito)

**Documentação**:
- Pricing Table: https://stripe.com/docs/payments/checkout/pricing-table
- CSP: https://stripe.com/docs/security/guide#content-security-policy
- Webhooks: https://stripe.com/docs/webhooks

## Changelog

### 2025-11-10
- ✅ Checklist de deploy completo criado
- ✅ Instruções para dev, staging e produção
- ✅ Troubleshooting de problemas comuns
- ✅ Scripts de verificação e rollback
