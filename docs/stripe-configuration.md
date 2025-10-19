# Configuração do Stripe como Fallback

Este documento explica como configurar o Stripe como método de pagamento alternativo (fallback) para o sistema SV Lentes.

## Visão Geral

O sistema SV Lentes utiliza o **Asaas** como processador de pagamento principal. O **Stripe** foi implementado como método alternativo (fallback) para casos em que o Asaas não esteja disponível ou para clientes que preferem pagamento internacional.

## Arquivos Implementados

### 1. Componentes
- `/src/components/ui/stripe-fallback.tsx` - Componente de pagamento Stripe
- `/src/components/payment/PaymentMethodSelector.tsx` - Seletor de métodos de pagamento
- `/src/components/payment/StripeScript.tsx` - Script do Stripe carregado no layout
- `/src/components/payment/PaymentTestModal.tsx` - Modal para testes
- `/src/app/test-payment/page.tsx` - Página de testes

### 2. APIs
- `/src/app/api/stripe/create-checkout/route.ts` - API para criar sessões de checkout
- `/src/app/api/webhooks/stripe/route.ts` - Webhook para eventos do Stripe

### 3. Configurações
- `/src/app/layout.tsx` - Layout atualizado com script do Stripe
- `.env.local.example` - Exemplo de variáveis de ambiente

## Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu `.env.local`:

```bash
# Stripe Payment Integration (Fallback)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publica_aqui
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta_aqui
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret_aqui
```

### 2. Obtenção das Chaves

1. **Crie uma conta Stripe**: [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Modo de Teste**: Use as chaves de teste (`pk_test_...` e `sk_test_...`)
3. **Modo de Produção**: Use as chaves de produção (`pk_live_...` e `sk_live_...`)

### 3. Configuração do Webhook

1. No dashboard Stripe, vá para **Developers > Webhooks**
2. **Add endpoint**: `https://svlentes.com.br/api/webhooks/stripe`
3. **Selecione eventos**:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

4. **Copie o webhook secret** e adicione às variáveis de ambiente

## Uso

### 1. Página de Testes

Acesse `https://svlentes.com.br/test-payment` para testar a integração.

### 2. Fluxo de Pagamento

1. **Seleção de Plano**: Cliente escolhe um plano
2. **Método de Pagamento**: Opção entre Asaas (principal) e Stripe (fallback)
3. **Checkout Stripe**: Redirecionado para Checkout seguro do Stripe
4. **Webhook**: Retorno automático para confirmação de pagamento

### 3. Teste de Cartão

Use estes dados para testes no modo sandbox:
- **Número**: 4242 4242 4242 4242
- **Validade**: Qualquer data futura
- **CVV**: Qualquer código de 3 dígitos
- **Nome**: Qualquer nome

## Funcionalidades

### ✅ Implementado
- [x] Componente de pagamento Stripe
- [x] API de checkout
- [x] Webhook handler
- [x] Tratamento de erros
- [x] Validação de configuração
- [x] Página de testes
- [x] Interface de seleção de método
- [x] Logging e monitoramento

### 🔄 Próximo Passos
- [ ] Integração com banco de dados para assinaturas
- [ ] Sincronização com sistema existente
- [ ] Notificações por email
- [ ] Dashboard administrativo

## Monitoramento

Os eventos do Stripe são registrados no sistema de logs:
- `stripe_checkout_attempt` - Tentativa de checkout
- `stripe_checkout_created` - Checkout criado
- `stripe_subscription_created` - Assinatura criada
- `stripe_webhook_ignored` - Eventos ignorados

## Segurança

- ✅ Validação de assinatura de webhook
- ✅ Verificação de configuração
- ✅ Tratamento seguro de dados
- ✅ Logging sem dados sensíveis

## Troubleshooting

### Stripe não configurado
Se aparecer "Stripe não está configurado", verifique as variáveis de ambiente.

### Erro de webhook
Verifique se o webhook secret está correto e se o endpoint está acessível.

### Problemas de CORS
O Stripe redireciona automaticamente para as URLs configuradas.

## Suporte

Para dúvidas sobre a configuração do Stripe:
- [Documentação Stripe](https://stripe.com/docs)
- [Dashboard Stripe](https://dashboard.stripe.com)
- Logs do sistema em `/api/stripe/create-checkout`