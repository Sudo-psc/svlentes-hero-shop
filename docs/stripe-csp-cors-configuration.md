# Configuração CSP/CORS para Stripe Pricing Table

## Visão Geral

Este documento descreve a configuração de Content Security Policy (CSP) e CORS implementada para a integração segura do Stripe Pricing Table no domínio `svlentes.com.br/planos`.

## Arquitetura

### Stack Técnico
- **Frontend**: Next.js 14 (App Router) com React 18
- **Backend**: Next.js API Routes (Node.js)
- **Servidor Web**: Nginx (produção)
- **Pagamento**: Stripe.js v3 com Pricing Table

## Implementação

### 1. Configuração de Headers CSP no Nginx

**Arquivo**: `/nginx/production.conf`

A configuração CSP no Nginx permite os seguintes domínios Stripe:

```nginx
# Linha 113-114
add_header Content-Security-Policy "
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://accounts.google.com ...;
    frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://accounts.google.com;
    connect-src 'self' https://api.stripe.com ...;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https: blob: https://*.stripe.com;
    font-src 'self' data: https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self'
" always;
```

**Domínios Stripe Permitidos**:
- `https://js.stripe.com` - Scripts do Stripe (script-src, frame-src)
- `https://checkout.stripe.com` - Checkout iframe (frame-src)
- `https://api.stripe.com` - API calls (connect-src)
- `https://*.stripe.com` - Imagens e recursos (img-src)

### 2. Middleware Next.js com Geração de Nonce

**Arquivo**: `/middleware.js`

O middleware gera um nonce criptograficamente seguro para cada requisição:

```javascript
import crypto from 'crypto';

export function middleware(request) {
  const response = NextResponse.next();
  
  // Gerar nonce seguro
  const nonce = crypto.randomBytes(16).toString('base64');
  
  // Armazenar nonce no header
  response.headers.set('x-csp-nonce', nonce);
  
  // Aplicar CSP com nonce
  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' https://js.stripe.com 'nonce-${nonce}'`,
    // ... outros valores
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', cspHeader);
  
  return response;
}
```

**Características**:
- ✅ Nonce único por requisição (16 bytes)
- ✅ Codificação Base64 segura
- ✅ Disponível via header `x-csp-nonce`
- ✅ Aplicado automaticamente em páginas HTML

### 3. Página de Planos (/planos)

**Arquivo**: `/src/app/planos/page.tsx`

A página utiliza o componente `StripePricingTable` que:

```tsx
<StripePricingTable
  pricingTableId={process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID}
  publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
  onFallbackActivate={handleFallbackActivation}
/>
```

**Componente**: `/src/components/payment/StripePricingTable.tsx`

- Carrega `https://js.stripe.com/v3/pricing-table.js` de forma assíncrona
- Implementa retry logic (2 tentativas, 8s timeout)
- Ativa fallback em caso de falha
- Renderiza `<stripe-pricing-table>` web component

### 4. Webhook Handler

**Arquivo**: `/src/app/api/webhooks/stripe/route.ts`

Webhook seguro com:
- ✅ Verificação de assinatura Stripe
- ✅ Validação de timestamp (proteção contra replay attacks)
- ✅ Rate limiting
- ✅ Tamanho máximo de payload (10MB)
- ✅ Logging seguro sem exposição de dados sensíveis

**Eventos Processados**:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Variáveis de Ambiente

### Desenvolvimento (`.env.local`)

```bash
# Stripe Keys (obter em: Dashboard > Developers > API keys)
STRIPE_SECRET_KEY=sk_test_{{YOUR_STRIPE_SECRET_KEY}}
STRIPE_WEBHOOK_SECRET=whsec_{{YOUR_WEBHOOK_SECRET}}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_{{YOUR_PUBLISHABLE_KEY}}
NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID=prctbl_{{YOUR_PRICING_TABLE_ID}}
```

### Produção (`.env.production` ou variáveis de sistema)

```bash
# Stripe Keys de Produção
STRIPE_SECRET_KEY=sk_live_{{YOUR_STRIPE_SECRET_KEY}}
STRIPE_WEBHOOK_SECRET=whsec_{{YOUR_WEBHOOK_SECRET}}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_{{YOUR_PUBLISHABLE_KEY}}
NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID=prctbl_{{YOUR_PRICING_TABLE_ID}}
```

**Como Obter**:
1. **API Keys**: [Dashboard Stripe > Developers > API keys](https://dashboard.stripe.com/apikeys)
2. **Pricing Table ID**: [Dashboard Stripe > Products > Pricing tables](https://dashboard.stripe.com/test/pricing-tables)
3. **Webhook Secret**: [Dashboard Stripe > Developers > Webhooks](https://dashboard.stripe.com/webhooks)

## Configuração do Webhook no Stripe Dashboard

### Passo 1: Criar Endpoint

1. Acesse: **Dashboard > Developers > Webhooks**
2. Clique em **"Add endpoint"**
3. **Endpoint URL**: `https://svlentes.com.br/api/webhooks/stripe`
4. **Description**: "Webhook de assinaturas SV Lentes"

### Passo 2: Selecionar Eventos

Marque os seguintes eventos:

- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

### Passo 3: Copiar Webhook Secret

1. Após criar o webhook, clique em **"Signing secret"**
2. Copie o valor que começa com `whsec_`
3. Adicione à variável de ambiente `STRIPE_WEBHOOK_SECRET`

### Teste Local com Stripe CLI

```bash
# Instalar Stripe CLI
brew install stripe/stripe-brew/stripe  # macOS
# ou baixar de: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks para localhost
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Simular evento (em outro terminal)
stripe trigger checkout.session.completed
```

## Critérios de Sucesso

### Console do Navegador (F12)

- [ ] ✅ Sem erros de CSP relacionados a `script-src`, `frame-src` ou `connect-src`
- [ ] ✅ Sem erros de CORS ao carregar `https://js.stripe.com/v3`
- [ ] ✅ `window.Stripe` está definido após carregamento da página
- [ ] ✅ Pricing Table renderiza corretamente (visível na página)

**Como Verificar**:
```javascript
// Abrir console do navegador (F12) e executar:
console.assert(typeof window.Stripe !== 'undefined', '✅ Stripe.js carregado');

// Verificar ausência de erros CSP
const cspErrors = performance.getEntriesByType('resource')
    .filter(r => r.name.includes('stripe') && r.transferSize === 0);
console.assert(cspErrors.length === 0, '✅ Sem bloqueios CSP');
```

### Network Tab (DevTools)

- [ ] ✅ Request para `https://js.stripe.com/v3/pricing-table.js` retorna 200
- [ ] ✅ Requests para `https://api.stripe.com/*` não são bloqueados
- [ ] ✅ Nenhum request com status `blocked:csp` ou `blocked:mixed-content`

### Stripe Dashboard

- [ ] ✅ Logs em **Dashboard > Developers > Logs** mostram chamadas de API
- [ ] ✅ Eventos de webhook aparecem em **Dashboard > Developers > Webhooks**

### Funcionalidade

- [ ] ✅ Clicar em um plano abre o Checkout do Stripe
- [ ] ✅ Após pagamento de teste, webhook recebe evento `checkout.session.completed`
- [ ] ✅ Email de confirmação é enviado pelo Stripe (modo test)
- [ ] ✅ Subscription criada no banco de dados (verificar via Prisma Studio)

## Troubleshooting

### ❌ Erro: "Refused to load script from 'https://js.stripe.com'"

**Causa**: CSP bloqueando script do Stripe

**Solução**:
1. Verificar se `https://js.stripe.com` está em `script-src` no middleware.js
2. Verificar se nginx.conf está atualizado (linha 113-114)
3. Reiniciar Nginx: `sudo systemctl restart nginx`

**Comando para verificar CSP**:
```bash
curl -I https://svlentes.com.br/planos | grep -i "content-security-policy"
```

### ❌ Erro: "Refused to frame 'https://checkout.stripe.com'"

**Causa**: CSP bloqueando iframe do Checkout

**Solução**:
1. Adicionar `https://checkout.stripe.com` em `frame-src`
2. Atualizar middleware.js e nginx.conf
3. Verificar com:
```bash
curl -I https://svlentes.com.br/planos | grep -i "frame-src"
```

### ❌ Erro: "window.Stripe is undefined"

**Causa**: Script do Stripe não carregou

**Verificações**:
1. Verificar Network tab: `pricing-table.js` carregou?
2. Verificar variável de ambiente `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Testar em modo anônimo (desativar extensões do navegador)

**Script de verificação**:
```javascript
// Executar no console do navegador
const checkStripe = () => {
  if (typeof window.Stripe === 'undefined') {
    console.error('❌ Stripe.js não carregado');
    // Verificar se script tag existe
    const scripts = Array.from(document.querySelectorAll('script'));
    const stripeScript = scripts.find(s => s.src.includes('stripe.com'));
    console.log('Script encontrado?', !!stripeScript);
    if (stripeScript) console.log('Script src:', stripeScript.src);
  } else {
    console.log('✅ Stripe.js carregado com sucesso');
  }
};

setTimeout(checkStripe, 2000); // Aguardar 2s para carregar
```

### ❌ Webhook não recebe eventos

**Verificações**:
1. URL correta no Stripe Dashboard: `https://svlentes.com.br/api/webhooks/stripe`
2. Webhook Secret correto em `STRIPE_WEBHOOK_SECRET`
3. Endpoint acessível publicamente (não localhost)

**Teste com Stripe CLI**:
```bash
# Verificar conectividade
curl -X POST https://svlentes.com.br/api/webhooks/stripe \
  -H "stripe-signature: invalid" \
  -d '{"test": true}'

# Deve retornar 401 (assinatura inválida) = endpoint está funcionando
```

**Verificar logs do servidor**:
```bash
# Logs do Next.js
pm2 logs svlentes

# Logs do Nginx
tail -f /var/log/nginx/svlentes.error.log
```

### ❌ Pricing Table não aparece (tela branca)

**Causas Comuns**:
1. Variável `NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID` não configurada
2. Pricing Table ID inválido ou de ambiente errado (test/live)
3. Stripe Publishable Key inválida

**Verificação**:
```javascript
// Console do navegador
console.log('Pricing Table ID:', 
  document.querySelector('stripe-pricing-table')?.getAttribute('pricing-table-id'));
console.log('Publishable Key:', 
  document.querySelector('stripe-pricing-table')?.getAttribute('publishable-key'));
```

**Fallback Manual**: Se persistir, o sistema deve ativar o fallback automaticamente após 5 segundos.

## Monitoramento em Produção

### Logs do Stripe

**Dashboard > Developers > Logs**:
- Filtrar por `pricing_table` para ver requisições da tabela de preços
- Verificar erros 4xx/5xx

### Logs do Webhook

**Dashboard > Developers > Webhooks > [seu endpoint]**:
- Ver últimos eventos recebidos
- Status de entrega (succeeded/failed)
- Payload de cada evento

### Alertas

Configurar alertas para:
- ❌ Webhook com >5% de falhas
- ❌ Sem checkouts completados em 24h
- ❌ Erros 5xx em `/api/webhooks/stripe`

**Ferramenta recomendada**: Datadog, Sentry ou CloudWatch

## Segurança

### ✅ Proteções Implementadas

- **Replay Attack Prevention**: Validação de timestamp nos webhooks (5min tolerance)
- **Signature Verification**: Verificação HMAC SHA-256 da assinatura Stripe
- **Rate Limiting**: Nginx + Upstash Redis (20 req/s por IP)
- **Request Size Limit**: Máximo 10MB para webhooks
- **CSP Nonce**: Nonce único por requisição para scripts inline
- **HTTPS Only**: Redirecionamento automático HTTP → HTTPS
- **Secure Headers**: HSTS, X-Content-Type-Options, X-Frame-Options

### 🔒 Melhores Práticas

1. **Nunca commitar secrets**: Use `.env.local` localmente e variáveis de ambiente em produção
2. **Rotacionar Webhook Secret**: A cada 6 meses ou após vazamento suspeito
3. **Usar chaves de teste**: Em development/staging, sempre use `pk_test_` e `sk_test_`
4. **Monitorar logs**: Verificar logs diariamente para atividade suspeita
5. **Atualizar Stripe.js**: Usar versão mais recente (v3) para patches de segurança

## Performance

### Otimizações Implementadas

- ✅ **Async Loading**: Script do Stripe carregado de forma assíncrona
- ✅ **Retry Logic**: 2 tentativas automáticas com 8s timeout
- ✅ **Fallback System**: Pricing cards estáticos se Stripe falhar
- ✅ **Cache Nginx**: Cache de 7 dias para assets estáticos
- ✅ **CDN**: Stripe.js servido via CDN global

### Métricas Alvo

- Tempo de carregamento do Pricing Table: < 2s
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s

**Ferramenta**: Lighthouse CI configurado em `.lighthouserc.json`

## Referências

- [Stripe Pricing Table Docs](https://stripe.com/docs/payments/checkout/pricing-table)
- [Stripe CSP Guide](https://stripe.com/docs/security/guide#content-security-policy)
- [MDN CSP Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

## Changelog

### 2025-11-10
- ✅ Implementado CSP com nonce generation no middleware
- ✅ Atualizado nginx.conf com headers Stripe
- ✅ Adicionado `NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID` ao .env.example
- ✅ Documentação completa de configuração e troubleshooting
