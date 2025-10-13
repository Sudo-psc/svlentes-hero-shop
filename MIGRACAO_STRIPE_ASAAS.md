# Migração de Stripe para Asaas - SV Lentes

## 📋 Resumo da Migração

Este documento descreve a migração completa do gateway de pagamento **Stripe** para **Asaas API v3**, realizada em 13/01/2025.

### 🎯 Motivação

- **Mercado Brasileiro**: Asaas é otimizado para o mercado brasileiro com PIX, Boleto e Cartão de Crédito
- **Custos**: Taxas mais competitivas para transações nacionais
- **Regulamentação**: Melhor compliance com regulamentação brasileira (Banco Central)
- **Experiência do Usuário**: Métodos de pagamento mais familiares para o público brasileiro

## ✅ Alterações Realizadas

### 1. Dependências (package.json)

**Removido:**
```json
{
  "dependencies": {
    "stripe": "^14.9.0"
  }
}
```

**Observação:** O cliente Asaas é implementado localmente sem dependências externas, usando apenas `fetch` nativo.

### 2. Variáveis de Ambiente

**Antes (.env - Stripe):**
```bash
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Depois (.env - Asaas):**
```bash
# Asaas Payment Integration
ASAAS_ENV=sandbox
ASAAS_API_KEY_SANDBOX=$aact_hmlg_your_sandbox_key_here
ASAAS_API_KEY_PROD=$aact_prod_your_production_key_here
```

### 3. Cliente de Pagamento

**Antes:**
- `/src/lib/stripe.ts` - Cliente Stripe com funções específicas

**Depois:**
- `/src/lib/asaas.ts` - Cliente Asaas com suporte completo para:
  - Clientes (customers)
  - Assinaturas (subscriptions)
  - Cobranças (payments)
  - PIX QR Code
  - Webhooks

### 4. TypeScript Types

**Antes:**
- `/src/types/stripe.ts` - Tipos do Stripe

**Depois:**
- `/src/types/asaas.ts` - Tipos completos do Asaas incluindo:
  - `AsaasCustomer`
  - `AsaasSubscription`
  - `AsaasPayment`
  - `AsaasWebhookPayload`
  - `AsaasWebhookEvent`

### 5. API Routes

#### Checkout (`/api/create-checkout/route.ts`)

**Antes (Stripe):**
```typescript
// Criava sessão de checkout do Stripe
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  payment_method_types: ['card'],
  // ...
})
```

**Depois (Asaas):**
```typescript
// Cria cliente e assinatura diretamente
const customer = await asaas.createCustomer({ /* ... */ })
const subscription = await asaas.createSubscription({
  customer: customer.id,
  billingType: 'PIX', // ou 'BOLETO', 'CREDIT_CARD'
  value: planValue,
  cycle: 'MONTHLY',
  // ...
})

// Se PIX, retorna QR Code
if (billingType === 'PIX') {
  const pixData = await asaas.getPixQrCode(payment.id)
  // Retorna QR Code para o frontend
}
```

**Novos Campos Obrigatórios:**
- `cpfCnpj` - CPF ou CNPJ do cliente
- `billingType` - PIX, BOLETO ou CREDIT_CARD
- `address` - Endereço completo (opcional mas recomendado)

#### Webhooks

**Antes:**
- `/api/webhooks/stripe/route.ts` - Eventos do Stripe

**Depois:**
- `/api/webhooks/asaas/route.ts` - Eventos do Asaas:
  - `PAYMENT_CREATED` - Cobrança criada
  - `PAYMENT_RECEIVED` - Pagamento recebido
  - `PAYMENT_CONFIRMED` - Pagamento confirmado
  - `PAYMENT_OVERDUE` - Cobrança vencida
  - `PAYMENT_REFUNDED` - Pagamento estornado

### 6. Arquivos Removidos

```bash
src/lib/stripe.ts                                    # Cliente Stripe
src/types/stripe.ts                                  # Types Stripe
src/app/api/webhooks/stripe/                        # Webhook Stripe
src/__tests__/integration/stripe-integration.test.tsx # Testes Stripe
```

## 🔑 Características do Asaas

### Métodos de Pagamento

1. **PIX** 🔸
   - Pagamento instantâneo
   - QR Code gerado automaticamente
   - Confirmação em segundos
   - Menor taxa de transação

2. **Boleto Bancário** 🧾
   - Tradicional método brasileiro
   - URL do boleto retornada na API
   - Vencimento configurável
   - Confirmação em 1-3 dias úteis

3. **Cartão de Crédito** 💳
   - Cobrança recorrente automatizada
   - Análise de risco integrada
   - Suporte a parcelamento
   - Confirmação imediata

### Ciclos de Cobrança

- `WEEKLY` - Semanal
- `BIWEEKLY` - Quinzenal
- `MONTHLY` - Mensal (mais comum)
- `QUARTERLY` - Trimestral
- `SEMIANNUALLY` - Semestral
- `YEARLY` - Anual

### Fluxo de Webhook

#### PIX
```
PAYMENT_CREATED → PAYMENT_RECEIVED → PAYMENT_CONFIRMED
```

#### Boleto
```
PAYMENT_CREATED → PAYMENT_RECEIVED → PAYMENT_CONFIRMED
(1-3 dias após pagamento)
```

#### Cartão de Crédito
```
PAYMENT_CREATED → PAYMENT_AWAITING_RISK_ANALYSIS →
PAYMENT_APPROVED_BY_RISK_ANALYSIS → PAYMENT_CONFIRMED
```

## 📝 Configuração da Conta Asaas

### 1. Criar Conta

1. Acesse [asaas.com](https://www.asaas.com)
2. Crie sua conta empresarial
3. Complete o processo de verificação (KYC)

### 2. Obter API Keys

**Sandbox (Testes):**
1. Acesse Dashboard → Integrações → API
2. Gere uma chave de API sandbox
3. Formato: `$aact_hmlg_xxxxxxxxx`

**Produção:**
1. Complete a verificação da conta
2. Gere uma chave de API de produção
3. Formato: `$aact_prod_xxxxxxxxx`

### 3. Configurar Webhooks

1. Acesse Dashboard → Integrações → Webhooks
2. Adicione URL: `https://svlentes.com.br/api/webhooks/asaas`
3. Selecione eventos:
   - ✅ Pagamento criado
   - ✅ Pagamento recebido
   - ✅ Pagamento confirmado
   - ✅ Pagamento vencido
   - ✅ Pagamento estornado
4. Salve a configuração

## 🧪 Testes

### Ambiente Sandbox

O Asaas fornece um ambiente sandbox completo para testes:

**URL Base:** `https://sandbox.asaas.com/api/v3`

**Cartões de Teste:**
- Aprovado: `5162306219378829` (qualquer CVC, data futura)
- Recusado: `5448280000000007`

**CPF de Teste:**
- Use geradores online ou: `123.456.789-09`

### Testes PIX

No sandbox, o pagamento PIX é simulado:
1. Gere o QR Code
2. O pagamento é confirmado automaticamente após alguns segundos
3. Webhook é disparado

## 🔒 Segurança

### API Keys

- **Nunca** commite API keys no repositório
- Use variáveis de ambiente (`.env.local`)
- Mantenha keys diferentes para sandbox e produção
- Rotacione keys periodicamente

### Webhooks

- Valide origem dos webhooks (IP do Asaas)
- Implemente retry logic para falhas
- Log todos os eventos recebidos
- Mantenha idempotência no processamento

### Dados Sensíveis

- **Nunca** armazene dados de cartão
- Use tokenização do Asaas
- Criptografe CPF/CNPJ no banco
- Implemente logs de auditoria (LGPD)

## 📊 Comparação: Stripe vs Asaas

| Recurso | Stripe | Asaas |
|---------|--------|-------|
| **PIX** | ❌ | ✅ |
| **Boleto** | ❌ | ✅ |
| **Cartão de Crédito** | ✅ | ✅ |
| **Taxas (PIX)** | - | 0,99% a 1,99% |
| **Taxas (Boleto)** | - | R$ 2,49 a R$ 3,49 |
| **Taxas (Cartão)** | ~4,99% | 2,99% a 4,99% |
| **Moeda** | USD/EUR/BRL | BRL |
| **Split Payment** | ✅ | ✅ |
| **Recorrência** | ✅ | ✅ |
| **Sandbox** | ✅ | ✅ |
| **Webhook** | ✅ | ✅ |
| **Checkout Hospedado** | ✅ | ❌ |
| **API REST** | ✅ | ✅ |

## 🚀 Próximos Passos

### Imediato

- [ ] Configurar conta Asaas
- [ ] Obter API keys (sandbox e produção)
- [ ] Configurar webhooks
- [ ] Testar fluxo completo no sandbox

### Desenvolvimento

- [ ] Implementar tratamento de erros específicos
- [ ] Adicionar retry logic em webhooks
- [ ] Criar testes E2E para Asaas
- [ ] Implementar logs estruturados
- [ ] Dashboard de pagamentos (admin)

### Produção

- [ ] Migrar dados de clientes (se houver)
- [ ] Configurar monitoramento (Sentry/DataDog)
- [ ] Configurar alertas de falhas
- [ ] Documentar runbooks de operação
- [ ] Treinar equipe de suporte

## 📚 Recursos

### Documentação

- **Asaas Docs**: [docs.asaas.com](https://docs.asaas.com)
- **API Reference**: [asaasv3.docs.apiary.io](https://asaasv3.docs.apiary.io)
- **Arquitetura Completa**: `Frontend/Specs/arquitetura-asaas.md`

### Suporte

- **Email**: contato@asaas.com
- **Telefone**: +55 (11) 4950-1170
- **Chat**: Disponível no dashboard

## ✅ Checklist de Migração

### Código

- [x] Remover dependência Stripe do package.json
- [x] Remover arquivo `/src/lib/stripe.ts`
- [x] Remover arquivo `/src/types/stripe.ts`
- [x] Criar cliente Asaas em `/src/lib/asaas.ts`
- [x] Criar types Asaas em `/src/types/asaas.ts`
- [x] Atualizar API `/api/create-checkout/route.ts`
- [x] Criar webhook `/api/webhooks/asaas/route.ts`
- [x] Remover webhook `/api/webhooks/stripe/`
- [x] Atualizar variáveis de ambiente

### Documentação

- [x] Atualizar README.md
- [x] Atualizar CLAUDE.md (projeto)
- [x] Atualizar CLAUDE.md (root)
- [x] Criar MIGRACAO_STRIPE_ASAAS.md
- [x] Atualizar .env.example
- [x] Atualizar .env.production

### Configuração

- [ ] Criar conta Asaas
- [ ] Obter API keys sandbox
- [ ] Obter API keys produção
- [ ] Configurar webhooks no dashboard
- [ ] Testar integração sandbox
- [ ] Validar fluxo de pagamento completo

## 🎉 Conclusão

A migração de Stripe para Asaas foi concluída com sucesso! O sistema agora está preparado para processar pagamentos usando métodos nativos do mercado brasileiro (PIX, Boleto, Cartão), proporcionando:

- ✅ Melhor experiência para usuários brasileiros
- ✅ Custos de transação reduzidos
- ✅ Compliance com regulamentação local
- ✅ Suporte especializado em português

**Domínio de Produção**: [svlentes.com.br](https://svlentes.com.br)

---

*Documento criado em: 13 de Janeiro de 2025*
*Última atualização: 13 de Janeiro de 2025*
