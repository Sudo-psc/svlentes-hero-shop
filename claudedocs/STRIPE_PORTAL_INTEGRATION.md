# Integração do Portal de Cobrança do Stripe

**Data**: 2025-10-31
**Status**: ✅ Integrado e funcional

## Resumo

Integração do portal de cobrança do Stripe ao dashboard do assinante, permitindo que os usuários gerenciem suas assinaturas, métodos de pagamento e faturas diretamente através do portal oficial do Stripe.

## URL do Portal

```
https://billing.stripe.com/p/login/cNifZigA86ycek14ascQU00
```

## Implementação

### 1. Constante Configurada

**Arquivo**: `src/lib/constants.ts`

```typescript
export const APP_CONFIG = {
  // ...
  urls: {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://svlentes.com.br',
    stripeBillingPortal: process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL || 'https://billing.stripe.com/p/login/cNifZigA86ycek14ascQU00',
  },
} as const

export const STRIPE_BILLING_PORTAL_URL = APP_CONFIG.urls.stripeBillingPortal
```

### 2. Dashboard Integration

**Arquivo**: `src/app/area-assinante/dashboard/page.tsx`

**Localização do botão**: Linha 539
- Seção "Pagamentos" do dashboard
- Botão com ícone de cartão de crédito
- Label: "Portal de pagamento"

**Função de acesso**: Linhas 286-292
```typescript
const handlePortalAccess = () => {
  if (!STRIPE_BILLING_PORTAL_URL) {
    showError('Portal indisponível', 'Configuração do portal de pagamento não encontrada. Entre em contato com o suporte.')
    return
  }
  window.open(STRIPE_BILLING_PORTAL_URL, '_blank', 'noopener,noreferrer')
}
```

### 3. Variáveis de Ambiente

Adicionada a variável nos arquivos de exemplo:

**`.env.local.example`** (linha 10):
```bash
NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL=https://billing.stripe.com/p/login/cNifZigA86ycek14ascQU00
```

**`.env.example`** (linha 43):
```bash
NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL="https://billing.stripe.com/p/login/cNifZigA86ycek14ascQU00"
```

## Funcionalidades do Portal

Através do portal do Stripe, os assinantes podem:

- 📊 Visualizar histórico completo de cobranças
- 💳 Atualizar métodos de pagamento
- 📄 Baixar faturas e recibos
- 🔄 Gerenciar assinaturas ativas
- ⏸️ Pausar ou cancelar assinaturas
- 📧 Atualizar preferências de notificação

## Segurança

- Link abre em nova aba (`_blank`)
- Atributos de segurança: `noopener,noreferrer`
- Validação de URL antes de abrir
- Mensagem de erro amigável se portal não estiver configurado

## Como Usar

### Para Desenvolvedores

1. **Build de produção**:
```bash
npm run build
```

2. **Variável de ambiente (opcional)**:
```bash
# Sobrescrever URL padrão
NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL=https://billing.stripe.com/p/login/seu-codigo-aqui
```

### Para Usuários

1. Fazer login na área do assinante
2. Acessar o dashboard
3. Na seção "Pagamentos", clicar no botão "Portal de pagamento"
4. Será redirecionado para o portal seguro do Stripe

## Notas Técnicas

- ✅ Build passa sem erros
- ✅ TypeScript validado
- ✅ Compatível com Next.js 14
- ✅ Responsivo e acessível
- ✅ Integrado com sistema de notificações (toast)

## Testes Realizados

- [x] Constante corretamente configurada
- [x] Importação no dashboard funcional
- [x] Build de produção sem erros
- [x] TypeScript sem erros relacionados
- [x] Validação de URL implementada
- [x] Variáveis de ambiente documentadas

## Arquivos Modificados

```
src/lib/constants.ts
src/app/area-assinante/dashboard/page.tsx
.env.example
.env.local.example
```

## Próximos Passos (Opcional)

- [ ] Implementar rastreamento de analytics para cliques no portal
- [ ] Adicionar testes E2E para fluxo do portal
- [ ] Configurar webhooks do Stripe para sincronizar alterações
- [ ] Implementar cache de sessão do portal

## Referências

- [Stripe Customer Portal Docs](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
