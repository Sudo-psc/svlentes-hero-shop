# Stripe Integration - Visão Geral

## Índice

1. [Introdução](#introdução)
2. [Arquitetura](#arquitetura)
3. [Componentes](#componentes)
4. [Fluxo de Pagamento](#fluxo-de-pagamento)
5. [Segurança](#segurança)
6. [Documentação Relacionada](#documentação-relacionada)

## Introdução

Esta é a documentação técnica da integração do Stripe Pricing Table com o sistema SV Lentes. A implementação garante conformidade com Content Security Policy (CSP) e CORS, sem erros no console do navegador.

### Objetivos

✅ **Integração Segura**: CSP/CORS configurados corretamente para Stripe  
✅ **UX Otimizada**: Pricing Table carrega rapidamente com fallback automático  
✅ **Resiliência**: Sistema continua funcionando mesmo se Stripe estiver indisponível  
✅ **Conformidade**: PCI DSS compliance através do Stripe (dados de cartão nunca tocam nosso servidor)

## Arquitetura

### Stack Tecnológico

```
Frontend:
  ├── Next.js 14 (App Router)
  ├── React 18
  ├── TypeScript
  └── Stripe.js v3

Backend:
  ├── Next.js API Routes
  ├── Stripe Node.js SDK v19
  ├── Prisma ORM
  └── PostgreSQL

Servidor Web:
  └── Nginx (com CSP headers)
```

### Diagrama de Fluxo

```
Usuário
   │
   ├──> Acessa /planos
   │       │
   │       ├──> Next.js Middleware
   │       │       └──> Gera CSP Nonce
   │       │
   │       ├──> Página carrega
   │       │       └──> StripePricingTable Component
   │       │               │
   │       │               ├──> Carrega pricing-table.js
   │       │               │       └──> Stripe CDN
   │       │               │
   │       │               └──> Renderiza <stripe-pricing-table>
   │       │
   │       └──> Usuário clica "Assinar"
   │               │
   │               └──> Stripe Checkout (hosted)
   │                       │
   │                       ├──> Pagamento processado
   │                       │
   │                       └──> Redirecionamento de volta
   │
   └──> Stripe envia Webhook
           │
           └──> /api/webhooks/stripe
                   │
                   ├──> Verifica assinatura
                   ├──> Valida timestamp
                   ├──> Processa evento
                   └──> Atualiza banco de dados
```

## Componentes

### 1. Middleware (`/middleware.js`)

**Responsabilidades**:
- Gerar CSP nonce único por requisição
- Aplicar headers CSP com nonce
- Configurar headers de cache para assets estáticos

**Exemplo de nonce gerado**:
```
x-csp-nonce: Rn8F3jK9pL2mQ7sT4vW1xY5zA6bC8dE0
```

### 2. Página de Planos (`/src/app/planos/page.tsx`)

**Features**:
- ✅ Carrega StripePricingTable component
- ✅ Implementa sistema de fallback
- ✅ Monitoramento de saúde do sistema
- ✅ Indicador visual de status (online/degraded/critical)

**Estado de carregamento**:
```tsx
{isLoading && (
  <div className="loading-state">
    <Spinner />
    <p>Carregando planos...</p>
  </div>
)}
```

### 3. StripePricingTable Component (`/src/components/payment/StripePricingTable.tsx`)

**Características**:
- 📦 Lazy loading do Stripe.js
- 🔄 Retry logic (2 tentativas, 8s timeout)
- 🚨 Fallback automático em caso de falha
- 📱 Otimizado para mobile

**Validações**:
```typescript
const isValidPricingTableId = 
  effectivePricingTableId?.startsWith('prctbl_');

const isValidPublishableKey = 
  effectivePublishableKey?.startsWith('pk_live_') || 
  effectivePublishableKey?.startsWith('pk_test_');
```

### 4. Webhook Handler (`/src/app/api/webhooks/stripe/route.ts`)

**Segurança**:
- ✅ Verificação de assinatura HMAC SHA-256
- ✅ Validação de timestamp (proteção contra replay attacks)
- ✅ Rate limiting
- ✅ Tamanho máximo de payload (10MB)

**Eventos processados**:
```typescript
const relevantEvents = [
  'checkout.session.completed',      // Checkout finalizado
  'customer.subscription.created',   // Assinatura criada
  'customer.subscription.updated',   // Assinatura atualizada
  'customer.subscription.deleted',   // Assinatura cancelada
  'invoice.payment_succeeded',       // Pagamento sucesso
  'invoice.payment_failed',          // Pagamento falhou
];
```

### 5. Stripe Client (`/src/lib/stripe-client.ts`)

**Configuração**:
```typescript
const stripe = new Stripe(secretKey, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
  timeout: 10000,           // 10 segundos
  maxNetworkRetries: 2,     // 2 tentativas
  telemetry: false,         // Desabilita telemetria
});
```

## Fluxo de Pagamento

### 1. Visualização de Planos

```
Usuário acessa /planos
    │
    ├─> Middleware gera nonce
    │
    ├─> Página renderiza
    │       │
    │       └─> StripePricingTable carrega
    │               │
    │               └─> Stripe.js carregado via CDN
    │                       │
    │                       └─> <stripe-pricing-table> renderizado
    │
    └─> Usuário vê tabela de preços
```

### 2. Início do Checkout

```
Usuário clica "Assinar Agora" (plano X)
    │
    └─> Stripe Checkout abre (hosted page)
            │
            ├─> URL: checkout.stripe.com/...
            │
            └─> Formulário de pagamento seguro
                    │
                    ├─> Nome no cartão
                    ├─> Número do cartão
                    ├─> Data de validade
                    ├─> CVV
                    └─> Informações de cobrança
```

**Importante**: Dados de cartão **NUNCA** passam pelo nosso servidor. Stripe cuida de tudo (PCI DSS compliance).

### 3. Processamento do Pagamento

```
Stripe processa pagamento
    │
    ├─> Sucesso
    │       │
    │       ├─> Cliente recebe email de confirmação
    │       │
    │       ├─> Stripe envia webhook: checkout.session.completed
    │       │
    │       └─> Redireciona para página de sucesso
    │
    └─> Falha
            │
            ├─> Mostra mensagem de erro
            │
            └─> Permite tentar novamente
```

### 4. Webhook e Sincronização

```
Webhook recebido em /api/webhooks/stripe
    │
    ├─> Verifica assinatura Stripe
    │       │
    │       ├─> Válida → continua
    │       └─> Inválida → retorna 401
    │
    ├─> Valida timestamp (± 5 minutos)
    │       │
    │       ├─> Dentro do range → continua
    │       └─> Fora do range → retorna 401 (replay attack)
    │
    ├─> Processa evento
    │       │
    │       ├─> checkout.session.completed
    │       │       └─> Busca subscription no Stripe
    │       │               └─> Cria no banco de dados
    │       │
    │       ├─> customer.subscription.created
    │       │       └─> Registra nova assinatura
    │       │
    │       ├─> customer.subscription.updated
    │       │       └─> Atualiza status/valores
    │       │
    │       ├─> customer.subscription.deleted
    │       │       └─> Marca como cancelada
    │       │
    │       ├─> invoice.payment_succeeded
    │       │       └─> Registra pagamento
    │       │
    │       └─> invoice.payment_failed
    │               └─> Marca como overdue
    │
    └─> Retorna 200 OK para Stripe
```

## Segurança

### Content Security Policy (CSP)

**Domínios Stripe Permitidos**:

```nginx
script-src:   https://js.stripe.com
frame-src:    https://js.stripe.com https://checkout.stripe.com
connect-src:  https://api.stripe.com
img-src:      https://*.stripe.com
```

**Nonce para Scripts Inline**:
```html
<script nonce="Rn8F3jK9pL2mQ7sT4vW1xY5zA6bC8dE0">
  console.log('Script com CSP nonce');
</script>
```

### Webhook Security

**Verificação de Assinatura**:
```typescript
const signature = headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);
```

**Proteção contra Replay Attacks**:
```typescript
const timestamp = extractTimestampFromSignature(signature);
const currentTime = Math.floor(Date.now() / 1000);

if (Math.abs(currentTime - timestamp) > 300) { // 5 minutos
  throw new Error('Webhook timestamp outside tolerance');
}
```

### Variáveis de Ambiente

**Públicas** (podem estar no frontend):
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID=prctbl_...
```

**Secretas** (apenas no backend):
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**⚠️ NUNCA** commitar secrets no Git ou expor `STRIPE_SECRET_KEY` no frontend!

## Documentação Relacionada

### Implementação

- 📄 [Configuração CSP/CORS](./stripe-csp-cors-configuration.md) - Detalhes técnicos de CSP e CORS
- 📄 [Checklist de Deploy](./stripe-deployment-checklist.md) - Passo a passo para deployment
- 📄 [Configuração Stripe](./stripe-configuration.md) - Configuração inicial do Stripe

### Referências Externas

- [Stripe Pricing Table Docs](https://stripe.com/docs/payments/checkout/pricing-table)
- [Stripe CSP Guide](https://stripe.com/docs/security/guide#content-security-policy)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe API Reference](https://stripe.com/docs/api)

### Testes

- 🧪 [Testes de Validação CSP](../tests/stripe-csp-validation.test.js)

## FAQ

### Como testar em ambiente local?

1. Use chaves de teste (pk_test_, sk_test_)
2. Configure webhook com Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
3. Acesse http://localhost:3000/planos
4. Use cartão de teste: 4242 4242 4242 4242

### Como ativar em produção?

1. Obtenha chaves de produção (pk_live_, sk_live_)
2. Configure webhook no Dashboard Stripe
3. Atualize variáveis de ambiente no servidor
4. Reinicie aplicação
5. Teste com valor baixo e cancele depois

### O que fazer se Stripe estiver fora do ar?

O sistema tem fallback automático:
1. Após 5s sem carregar, ativa modo fallback
2. Mostra pricing cards estáticos
3. Botão "Assinar" abre WhatsApp como alternativa

### Como monitorar a integração?

- **Dashboard Stripe**: Logs, Webhooks, Métricas
- **Logs do servidor**: `pm2 logs svlentes`
- **Browser Console**: Verificar erros CSP
- **Alertas**: Configurar para >5% de falhas em webhooks

## Suporte

Para dúvidas ou problemas:

1. **Documentação**: Consulte os docs acima
2. **Logs**: Verifique logs do servidor e Dashboard Stripe
3. **Stripe Support**: Dashboard > Support (chat disponível)
4. **Issues**: Abra issue no GitHub com logs relevantes

---

**Última atualização**: 2025-11-10  
**Versão**: 1.0.0  
**Autor**: Dr. Philipe Saraiva Cruz
