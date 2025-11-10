# 🔍 Relatório de Verificação da Integração Stripe - Produção
**Data:** 10 de novembro de 2025  
**Página:** `/planos` (Next.js)  
**Autor:** Dr. Philipe Saraiva Cruz

---

## 📋 Executive Summary

### Status Atual: ⚠️ CONFIGURAÇÃO INCOMPLETA

**Problemas Críticos Identificados:**
1. ❌ **Variáveis de ambiente Stripe NÃO CONFIGURADAS** no ambiente local
2. ⚠️ Headers CSP/Permissions-Policy podem bloquear Stripe em produção
3. ⚠️ Build do Next.js não inclui página `/planos` compilada
4. ℹ️ Endpoint de health check criado: `/api/health/stripe`

**Próximas Ações:**
1. Configurar variáveis de ambiente (`.env.local` ou `.env.production`)
2. Ajustar headers no `next.config.js`
3. Rebuildar aplicação com variáveis corretas
4. Testar integração localmente e em produção

---

## 1. ✅ Verificação dos Prefixos das Chaves Stripe

### 1.1 Arquivos de Configuração

**Status:** ❌ Nenhum arquivo `.env.local`, `.env`, ou `.env.production` encontrado

**Arquivos disponíveis:**
- ✅ `.env.example` - Template de referência
- ✅ `.env.production.template` - Template para produção
- ✅ `.env.local.example` - Template para desenvolvimento

### 1.2 Variáveis Esperadas

| Variável | Tipo | Prefixo Esperado | Local | Status |
|----------|------|------------------|-------|--------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Pública | `pk_live_` (prod) ou `pk_test_` (test) | Cliente | ❌ Não configurada |
| `STRIPE_SECRET_KEY` | Secreta | `sk_live_` (prod) ou `sk_test_` (test) | Servidor | ❌ Não configurada |
| `STRIPE_WEBHOOK_SECRET` | Secreta | `whsec_` | Servidor | ❌ Não configurada |
| `NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID` | Pública | `prctbl_` | Cliente | ⚠️ Hardcoded no código |

### 1.3 Valores Hardcoded Encontrados

**Em:** `src/components/payment/StripePricingTable.tsx` (linha 88)

```typescript
const effectivePricingTableId = pricingTableId || 
  process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID || 
  'prctbl_1SK1U5Ls8MC0aCdjGBBODqjW'  // ⚠️ Hardcoded fallback
```

**Recomendação:** ✅ Configurar `NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID` nas variáveis de ambiente

---

## 2. 🖥️ Verificação do Servidor (VPS/Docker)

### 2.1 Ambiente Local

**Status:** ❌ Variáveis de ambiente não definidas no processo atual

```bash
$ echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# (vazio)

$ echo $STRIPE_SECRET_KEY
# (vazio)
```

### 2.2 Verificação em Produção (VPS/Docker)

**Para executar no servidor de produção:**

#### Se usando Docker Compose:
```bash
docker compose exec svlentes-app env | grep -i STRIPE
```

#### Se usando systemd:
```bash
sudo systemctl show svlentes-hero-shop.service | grep -i Environment=
```

#### Verificar arquivos .env no servidor:
```bash
# Na raiz do projeto
ls -la /path/to/project/.env*

# Verificar conteúdo (seguro - só mostra prefixos)
grep STRIPE /path/to/project/.env.production | sed 's/=.*/=***REDACTED***/'
```

---

## 3. 🔨 Verificação do Build Next.js

### 3.1 Status do Build

| Item | Status | Observação |
|------|--------|------------|
| Diretório `.next` | ✅ Existe | Build presente |
| Idade do build | ✅ Recente | < 1 hora |
| Página `/planos` compilada | ⚠️ Não encontrada | Arquivo esperado: `.next/server/app/planos/page.js` |

### 3.2 Comportamento do Next.js com Variáveis de Ambiente

**IMPORTANTE:** Next.js lê variáveis `NEXT_PUBLIC_*` em **BUILD TIME**, não em runtime.

#### Variáveis Públicas (Cliente):
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Injetada no bundle JavaScript durante build
- `NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID` → Injetada no bundle JavaScript durante build

#### Variáveis Privadas (Servidor):
- `STRIPE_SECRET_KEY` → Lida em runtime (API Routes, Server Actions)
- `STRIPE_WEBHOOK_SECRET` → Lida em runtime

**Ação Necessária:**
```bash
# 1. Configurar variáveis de ambiente
cp .env.production.template .env.local
# Editar .env.local e substituir {{PLACEHOLDERS}}

# 2. Rebuildar com variáveis corretas
npm run build

# 3. Iniciar servidor
npm run start

# 4. Verificar página
open http://localhost:3000/planos
```

---

## 4. 🩺 Health Check Endpoint

### 4.1 Endpoint Criado

**URL:** `/api/health/stripe`  
**Método:** `GET`  
**Segurança:** ✅ Não expõe chaves completas, apenas prefixos e metadados

### 4.2 Exemplo de Resposta

```json
{
  "status": "healthy",
  "timestamp": "2025-11-10T12:00:00.000Z",
  "environment": "PRODUCTION",
  "configuration": {
    "publishableKey": {
      "exists": true,
      "prefix": "pk_live_",
      "length": 107,
      "environment": "PRODUCTION",
      "isValid": true
    },
    "secretKey": {
      "exists": true,
      "prefix": "sk_live_",
      "length": 107,
      "environment": "PRODUCTION",
      "isValid": true
    },
    "webhookSecret": {
      "exists": true,
      "prefix": "whsec_",
      "length": 64,
      "isValid": true
    },
    "pricingTable": {
      "exists": true,
      "prefix": "prctbl_1SK",
      "length": 28,
      "isValid": true
    }
  },
  "validation": {
    "environmentMatch": true,
    "allKeysConfigured": true,
    "allKeysValid": true,
    "pricingTableConfigured": true
  },
  "warnings": []
}
```

### 4.3 Como Testar

**Localmente:**
```bash
npm run dev
curl http://localhost:3000/api/health/stripe | jq
```

**Em Produção:**
```bash
curl https://svlentes.com.br/api/health/stripe | jq
```

---

## 5. 🔒 Verificação de Headers e CSP

### 5.1 Headers Atuais em Produção

**Testado em:** `https://svlentes.com.br/planos`

| Header | Status | Observação |
|--------|--------|------------|
| `Permissions-Policy` | ⚠️ Parcial | `payment` não especificado explicitamente |
| `Content-Security-Policy` | ⚠️ Possível bloqueio | Pode restringir domínios Stripe |
| `Strict-Transport-Security` | ✅ OK | HTTPS forçado |

### 5.2 Configuração Atual no `next.config.js`

```javascript
{
  key: 'Permissions-Policy',
  value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com" "https://checkout.stripe.com" "https://api.stripe.com")'
}
```

**Status:** ✅ Permite Stripe, mas não detectado no servidor (verificar deploy)

### 5.3 CSP Recomendado para Stripe

**Adicionar ao `next.config.js`:**

```javascript
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.stripecdn.com",
    "frame-src https://js.stripe.com https://checkout.stripe.com https://hooks.stripe.com",
    "connect-src 'self' https://api.stripe.com https://m.stripe.com https://m.stripe.network https://r.stripe.com https://q.stripe.com",
    "img-src 'self' data: https://*.stripe.com https://*.stripecdn.com",
    "style-src 'self' 'unsafe-inline' https://*.stripecdn.com",
    "font-src 'self' https://*.stripecdn.com"
  ].join('; ')
}
```

**⚠️ NOTA:** CSP está atualmente comentado no `next.config.js` (linha 46)

---

## 6. 🌐 Verificação de Conectividade com Stripe

### 6.1 Testes de Conectividade

| Domínio | Status | Observação |
|---------|--------|------------|
| `https://js.stripe.com/v3` | ✅ OK | Script principal |
| `https://js.stripe.com/v3/pricing-table.js` | ✅ OK | Pricing Table |
| `https://checkout.stripe.com` | ✅ OK | Checkout redirect |
| `https://api.stripe.com` | ❌ Falhou | Esperado - requer autenticação |
| `https://m.stripe.com` | ✅ OK | Metrics |
| `https://r.stripe.com` | ✅ OK | Resources |
| `https://q.stripe.com` | ✅ OK | Analytics |

### 6.2 Análise

- ✅ Todos os recursos públicos do Stripe estão acessíveis
- ✅ Pricing Table script carrega corretamente
- ✅ Checkout redirect disponível
- ℹ️ API Stripe retorna erro de autenticação (esperado sem credenciais)

---

## 7. 🔍 Inspeção de Rede (DevTools)

### 7.1 Instruções para Verificação Manual

**No navegador, acesse:** `https://svlentes.com.br/planos`

1. **Abrir DevTools:** `F12` ou `Cmd+Option+I` (Mac)

2. **Aba Network:**
   - Filtros: `stripe`, `js.stripe`, `checkout`, `m.stripe`, `stripecdn`
   - Recarregar página (`Cmd+R` ou `Ctrl+R`)

3. **O que procurar:**

   **✅ Esperado:**
   ```
   GET https://js.stripe.com/v3 → 200 OK
   GET https://js.stripe.com/v3/pricing-table.js → 200 OK
   GET https://m.stripe.com/... → 200 OK
   ```

   **❌ Erros a investigar:**
   ```
   GET ... → 403 Forbidden (WAF/Firewall bloqueio)
   GET ... → 404 Not Found (recurso não existe)
   OPTIONS ... → 403 (CORS preflight bloqueado)
   (blocked:mixed-content) (HTTP em página HTTPS)
   (blocked:csp) (Content Security Policy)
   ```

4. **Aba Console:**
   - Procurar erros como:
     - `Refused to load script from 'https://js.stripe.com/v3' because it violates CSP`
     - `No 'Access-Control-Allow-Origin' header`
     - `Mixed Content: The page was loaded over HTTPS, but requested an insecure resource`

### 7.2 Captura de Headers

**No Console do DevTools:**

```javascript
// Verificar Permissions Policy
fetch(window.location.href, { method: 'HEAD' })
  .then(r => r.headers.get('permissions-policy'))
  .then(p => console.log('Permissions-Policy:', p))

// Verificar CSP
fetch(window.location.href, { method: 'HEAD' })
  .then(r => r.headers.get('content-security-policy'))
  .then(p => console.log('CSP:', p))

// Verificar se Stripe está carregado
console.log('window.Stripe:', typeof window.Stripe)

// Verificar elemento pricing table
console.log('Pricing Table:', document.querySelector('stripe-pricing-table'))
```

---

## 8. 📊 Logs do Dashboard Stripe

### 8.1 Como Acessar

1. **Login:** [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. **Navegue:** Developers → Logs
3. **Filtros:**
   - Date: Últimas 24 horas
   - Method: `GET`
   - Path: `/v1/prices` ou `/v1/products`

### 8.2 O que Verificar

**✅ Logs esperados (quando página carrega):**
```
GET /v1/prices?active=true → 200 OK
GET /v1/products?active=true → 200 OK
```

**❌ Se NÃO aparecer nada:**
- Problema no cliente (CSP/CORS/WAF) impedindo requisição
- Chaves não configuradas corretamente
- Script Stripe não carregou

**⚠️ Se aparecer erros 401/403:**
- Chave inválida ou expirada
- Ambiente incorreto (test vs live)

---

## 9. 🔧 Stripe CLI - Validação Local

### 9.1 Instalação

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

**Windows:**
```powershell
scoop install stripe
```

### 9.2 Login

```bash
stripe login
```

Isso abrirá o navegador para autenticar. Escolha a conta correta (test ou live).

### 9.3 Comandos de Verificação

#### Listar Prices:
```bash
# Test mode (padrão)
stripe prices list --limit 5

# Live mode (produção)
stripe prices list --limit 5 --api-key sk_live_...
```

**Exemplo de saída:**
```
ID                          Active  Currency  Amount
price_1ABC123...            true    brl       12999
price_1DEF456...            true    brl       17999
```

#### Listar Products:
```bash
# Test mode
stripe products list --limit 5

# Live mode
stripe products list --limit 5 --api-key sk_live_...
```

#### Verificar Pricing Table:
```bash
# Buscar pricing table por ID
stripe api /v1/pricing_tables/prctbl_1SK1U5Ls8MC0aCdjGBBODqjW
```

#### Webhook Events (útil para debug):
```bash
# Listen to webhook events localmente
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## 10. ✅ Checklist Final de Integração

### 10.1 Configuração de Chaves

- [ ] **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** configurado
  - [ ] Prefixo correto: `pk_live_` (prod) ou `pk_test_` (test)
  - [ ] Comprimento: ~107 caracteres
  - [ ] Acessível no cliente (bundle JavaScript)

- [ ] **STRIPE_SECRET_KEY** configurado
  - [ ] Prefixo correto: `sk_live_` (prod) ou `sk_test_` (test)
  - [ ] Comprimento: ~107 caracteres
  - [ ] **NUNCA** exposta no cliente
  - [ ] Usada apenas em API Routes/Server Components

- [ ] **STRIPE_WEBHOOK_SECRET** configurado
  - [ ] Prefixo: `whsec_`
  - [ ] Comprimento: ~64 caracteres
  - [ ] Usado para validar webhooks

- [ ] **NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID** configurado
  - [ ] Prefixo: `prctbl_`
  - [ ] Comprimento: ~28 caracteres

### 10.2 Ambiente

- [ ] **Chaves do mesmo ambiente**
  - [ ] Ambas test (`pk_test_` + `sk_test_`) OU
  - [ ] Ambas live (`pk_live_` + `sk_live_`)

- [ ] **Build executado após configurar variáveis**
  ```bash
  npm run build
  ```

- [ ] **Variáveis visíveis no build**
  ```bash
  # Verificar se variável foi injetada
  grep -r "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" .next/
  ```

### 10.3 Headers e Segurança

- [ ] **Permissions-Policy permite Stripe**
  ```
  payment=(self "https://js.stripe.com" "https://checkout.stripe.com")
  ```

- [ ] **CSP permite domínios Stripe** (se ativo)
  - [ ] `script-src`: `https://js.stripe.com`
  - [ ] `frame-src`: `https://checkout.stripe.com`
  - [ ] `connect-src`: `https://api.stripe.com`

- [ ] **HTTPS ativo e forçado**
  - [ ] Certificado SSL válido
  - [ ] Redirect HTTP → HTTPS
  - [ ] `Strict-Transport-Security` header

- [ ] **Sem conteúdo misto (mixed content)**
  - [ ] Todas as requisições HTTPS

### 10.4 Funcionalidade

- [ ] **Página `/planos` carrega sem erros**
  - [ ] Tabela de preços visível
  - [ ] Botões de assinatura funcionam
  - [ ] Redirect para Checkout funciona

- [ ] **Endpoint `/api/health/stripe` retorna 200 OK**
  ```bash
  curl https://svlentes.com.br/api/health/stripe
  ```

- [ ] **Logs no Dashboard Stripe aparecem**
  - [ ] Requisições de preços/produtos visíveis
  - [ ] Sem erros 401/403

- [ ] **Stripe CLI valida chaves**
  ```bash
  stripe prices list --limit 5
  ```

### 10.5 Testes

- [ ] **Desenvolvimento (localhost)**
  - [ ] Variáveis em `.env.local`
  - [ ] `npm run dev`
  - [ ] Pricing table carrega
  - [ ] Console sem erros

- [ ] **Produção**
  - [ ] Variáveis em `.env.production` ou Vercel/Docker
  - [ ] Deploy completo
  - [ ] Pricing table carrega
  - [ ] DevTools Network sem bloqueios
  - [ ] Checkout funciona end-to-end

---

## 11. 🚀 Próximos Passos Recomendados

### Prioridade ALTA (Fazer Agora)

1. **Configurar Variáveis de Ambiente**
   ```bash
   # Copiar template
   cp .env.production.template .env.local
   
   # Editar e substituir {{PLACEHOLDERS}} com valores reais
   nano .env.local
   ```

2. **Obter Chaves do Dashboard Stripe**
   - Acesse: [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
   - Copie:
     - Publishable key (pk_test_... ou pk_live_...)
     - Secret key (sk_test_... ou sk_live_...)
   - Webhook secret (se já configurado)

3. **Rebuildar Aplicação**
   ```bash
   npm run build
   npm run start
   ```

4. **Testar Endpoint de Health**
   ```bash
   curl http://localhost:3000/api/health/stripe | jq
   ```

5. **Abrir Página /planos e Verificar**
   - URL: `http://localhost:3000/planos`
   - DevTools → Network (filtrar "stripe")
   - DevTools → Console (verificar erros)

### Prioridade MÉDIA (Próxima Sprint)

1. **Ajustar Headers em Produção**
   - Revisar `next.config.js`
   - Adicionar CSP se necessário
   - Deploy e verificar headers

2. **Configurar Webhooks**
   - Endpoint: `https://svlentes.com.br/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `invoice.paid`, etc.
   - Obter `STRIPE_WEBHOOK_SECRET`

3. **Implementar Testes Automatizados**
   - E2E test para fluxo de checkout
   - Integration test para API Routes
   - Health check em CI/CD

### Prioridade BAIXA (Melhorias Futuras)

1. **Adicionar Telemetria**
   - Logs estruturados para requisições Stripe
   - Alertas para falhas de payment
   - Dashboard de métricas (Sentry/Datadog)

2. **Otimizar Performance**
   - Cache de prices/products
   - Lazy loading do script Stripe
   - Server-side rendering de prices

3. **Melhorar UX**
   - Skeleton loading states
   - Error boundaries
   - Fallback para WhatsApp em caso de falha

---

## 12. 📞 Suporte e Recursos

### Documentação Oficial Stripe

- **Pricing Table:** [https://stripe.com/docs/payments/pricing-table](https://stripe.com/docs/payments/pricing-table)
- **Checkout:** [https://stripe.com/docs/payments/checkout](https://stripe.com/docs/payments/checkout)
- **API Reference:** [https://stripe.com/docs/api](https://stripe.com/docs/api)
- **CSP Guide:** [https://stripe.com/docs/security/guide#content-security-policy](https://stripe.com/docs/security/guide#content-security-policy)
- **Domínios Permitidos:** [https://stripe.com/docs/security/guide#validating-domains](https://stripe.com/docs/security/guide#validating-domains)

### Scripts Criados

- **Health Check:** `curl http://localhost:3000/api/health/stripe`
- **Verificação Completa:** `./scripts/check-stripe-integration.sh`
- **Validação Pós-Deploy:** `./scripts/validate-stripe-pricing-table.sh`

### Contato Stripe Support

- **Dashboard:** [https://dashboard.stripe.com/support](https://dashboard.stripe.com/support)
- **Email:** support@stripe.com
- **Chat:** Disponível no Dashboard

---

## 13. 📝 Conclusão

### Situação Atual

A integração Stripe está **estruturalmente correta** no código, mas **não configurada** no ambiente local. A página `/planos` utiliza o componente `StripePricingTable` que:

- ✅ Valida prefixos de chaves corretamente
- ✅ Tem fallback para buscar produtos via API
- ✅ Implementa retry logic
- ✅ Tem tratamento de erros robusto

Porém:

- ❌ Variáveis de ambiente não estão definidas
- ⚠️ Headers podem precisar ajuste em produção
- ℹ️ Endpoint de health check agora disponível para diagnóstico

### Recomendação

**AÇÃO IMEDIATA:** Configurar variáveis de ambiente e testar localmente antes de deploy em produção.

**VALIDAÇÃO:** Usar o endpoint `/api/health/stripe` para confirmar que todas as chaves estão corretas antes de testar a interface.

**MONITORAMENTO:** Após deploy, verificar:
1. Logs do Dashboard Stripe
2. DevTools Network na página /planos
3. Métricas de conversão de checkout

---

## 📎 Anexos

### A. Exemplo de .env.local

```bash
# Stripe Configuration (TEST MODE)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC123...
STRIPE_SECRET_KEY=sk_test_51ABC123...
STRIPE_WEBHOOK_SECRET=whsec_abc123...
NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID=prctbl_1SK1U5Ls8MC0aCdjGBBODqjW

# Outros...
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### B. Exemplo de .env.production

```bash
# Stripe Configuration (LIVE MODE - PRODUÇÃO)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51ABC123...
STRIPE_SECRET_KEY=sk_live_51ABC123...
STRIPE_WEBHOOK_SECRET=whsec_xyz789...
NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID=prctbl_1SK1U5Ls8MC0aCdjGBBODqjW

# Outros...
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://svlentes.com.br
```

### C. Comando de Teste Rápido

```bash
#!/bin/bash
# Teste rápido da integração Stripe

echo "🔍 Teste Rápido Stripe"
echo ""

# 1. Verificar variáveis
echo "1. Variáveis de ambiente:"
env | grep STRIPE | sed 's/=.*/=***/'

# 2. Health check
echo ""
echo "2. Health check:"
curl -s http://localhost:3000/api/health/stripe | jq '.status, .warnings'

# 3. Página /planos
echo ""
echo "3. Abrindo /planos..."
open http://localhost:3000/planos

echo ""
echo "✅ Verifique DevTools para erros!"
```

---

**FIM DO RELATÓRIO**

*Gerado automaticamente em 10/11/2025*  
*Script de verificação: `./scripts/check-stripe-integration.sh`*  
*Health endpoint: `/api/health/stripe`*
