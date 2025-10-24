# Backend Implementation - Fase 2 do Portal do Assinante

## Resumo Executivo

Implementação completa das APIs backend para a Fase 2 do Portal do Assinante, incluindo:
- ✅ API de Status de Entrega em Tempo Real
- ✅ API de Atalhos Contextuais
- ✅ Melhorias no Endpoint de WhatsApp

**Localização**: `/root/svlentes-hero-shop/src/app/api/assinante/`

---

## 1. API de Status de Entrega em Tempo Real

**Arquivo**: `src/app/api/assinante/delivery-status/route.ts`

### Funcionalidade

Endpoint `GET /api/assinante/delivery-status` que retorna:

```typescript
{
  currentDelivery: {
    orderId: string | null,
    orderNumber: string | null,
    status: 'preparing' | 'pending' | 'shipped' | 'in_transit' | 'delivered',
    progress: number, // 0-100%
    estimatedArrival: string, // ISO date
    daysRemaining: number,
    trackingCode?: string,
    trackingUrl?: string,
    lastUpdate: string, // ISO date
    timeline: Array<{
      status: string,
      timestamp: string,
      location?: string,
      description: string
    }>
  },
  subscription: {
    id: string,
    planType: string,
    nextBillingDate: string
  }
}
```

### Lógica Implementada

**Cálculo de Progresso (0-100%)**:
- `PENDING` → 20%
- `SHIPPED` → 40%
- `IN_TRANSIT` → 60%
- `DELIVERED` → 100%

**Duas Modalidades**:

1. **Entrega Real** (quando existe Order pendente):
   - Busca `Order` com `deliveryStatus != DELIVERED`
   - Retorna dados reais de tracking
   - Timeline com eventos reais do pedido
   - URL de rastreamento dos Correios

2. **Entrega Estimada** (quando não existe Order pendente):
   - Calcula baseado em `nextBillingDate`
   - Estimativa: envio em 2 dias + entrega em 7 dias
   - Timeline com previsões
   - Status: "preparing"

**Segurança**:
- Autenticação Firebase via Bearer token
- Rate limiting: 200 req/15min
- Validação de userId via Prisma
- Sem exposição de PII nos logs

---

## 2. API de Atalhos Contextuais

**Arquivo**: `src/app/api/assinante/contextual-actions/route.ts`

### Funcionalidade

Endpoint `GET /api/assinante/contextual-actions` que retorna:

```typescript
{
  primaryActions: Array<{
    id: string,
    label: string,
    description: string,
    icon: string, // Lucide icon name
    url: string,
    variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger',
    priority: number
  }>,
  alerts: Array<{
    type: 'info' | 'warning' | 'error',
    message: string,
    action?: {
      label: string,
      url: string
    }
  }>,
  metadata: {
    subscriptionStatus: string,
    hasOverduePayment: boolean,
    isPaused: boolean,
    daysUntilRenewal: number | null,
    prescriptionAgeInDays: number,
    unreadNotifications: number
  }
}
```

### Lógica Contextual Implementada

**Prioridade 1 (Crítica)**:

1. **Pagamento Overdue**:
   - Trigger: `Payment.dueDate < now` AND `status = OVERDUE`
   - Ação: "Regularizar Pagamento" (variant: danger)
   - Alerta: erro com link para pagamento

2. **Assinatura Pausada**:
   - Trigger: `Subscription.status = PAUSED`
   - Ação: "Reativar Assinatura" (variant: success)
   - Alerta: warning com instruções

**Prioridade 2 (Alta)**:

3. **Próximo de Renovação**:
   - Trigger: `daysUntilRenewal <= 7` AND `status = ACTIVE`
   - Ação: "Renovar Agora" (variant: primary)
   - Alerta: info com contagem regressiva

4. **Prescrição Antiga**:
   - Trigger: `(now - startDate) > 365 dias`
   - Ação: "Agendar Reavaliação" (variant: warning)
   - Alerta: recomendação médica

**Prioridade 3-6 (Normal)**:

5. **Notificações Acumuladas**:
   - Trigger: `notifications.length > 3` (últimos 7 dias)
   - Ação: "Ver Avisos Importantes" (variant: secondary)

6. **Ações Sempre Disponíveis**:
   - "Falar no WhatsApp" (priority: 5)
   - "Ver Histórico" (priority: 6)

**Análise de Dados**:
- Busca `Subscription` com status ACTIVE/PAUSED/OVERDUE
- Inclui `orders` (mais recente), `payments` (pendentes), `notifications`
- Cálculo de idade da prescrição
- Detecção de contextos críticos

---

## 3. Melhorias no Endpoint de WhatsApp

**Arquivos Modificados**:
- `src/app/api/whatsapp-redirect/route.ts`
- `src/lib/whatsapp.ts`

### Novos Contextos Adicionados

Expandido de 6 para 9 contextos:

```typescript
context: 'hero' | 'pricing' | 'consultation' | 'support'
  | 'calculator' | 'emergency'
  | 'renewal' | 'delivery' | 'payment' // NOVOS
```

**Mensagens Pré-formatadas**:

1. **renewal** - Renovação de Assinatura:
   ```
   Olá! Sou assinante SV Lentes e gostaria de informações sobre renovação.
   Minha dúvida é sobre:
   • Antecipação da próxima entrega
   • Ajuste do plano
   • Atualização de dados
   ```

2. **delivery** - Acompanhar Entrega:
   ```
   Olá! Sou assinante SV Lentes e gostaria de acompanhar minha entrega.
   Preciso saber:
   • Status atual do pedido
   • Previsão de chegada
   • Código de rastreamento
   ```

3. **payment** - Suporte de Pagamento:
   ```
   Olá! Sou assinante SV Lentes e preciso de suporte com pagamento.
   Minha dúvida é sobre:
   • Regularização de pendência
   • Alteração de método de pagamento
   • Consulta de fatura
   ```

### Parâmetros Contextuais Adicionados

```typescript
contextData: {
  page: string,
  section?: string,
  planInterest?: string,
  calculatedEconomy?: number,
  customMessage?: string,
  subscriptionId?: string, // NOVO - ID da assinatura
  orderId?: string,        // NOVO - ID do pedido
}
```

**Uso**:
```typescript
// Exemplo: Botão "Falar no WhatsApp" no dashboard
const url = `/api/whatsapp-redirect?context=support&subscriptionId=${sub.id}`

// Exemplo: Ação contextual de renovação
{
  id: 'whatsapp_renewal',
  url: `/api/whatsapp-redirect?context=renewal&subscriptionId=${sub.id}`
}

// Exemplo: Acompanhar entrega específica
{
  id: 'whatsapp_delivery',
  url: `/api/whatsapp-redirect?context=delivery&orderId=${order.id}`
}
```

---

## Padrões e Segurança

### Autenticação
- **Firebase Admin SDK**: Validação de Bearer token
- Verificação de `firebaseUid` no Prisma
- Resposta 401 para tokens inválidos ou expirados
- Resposta 503 quando Firebase Admin não disponível

### Rate Limiting
- **Leitura**: 200 requisições em 15 minutos
- **Escrita**: 50 requisições em 15 minutos
- Configuração: `rateLimitConfigs` de `@/lib/rate-limit`

### LGPD Compliance
- Sem PII em logs (apenas IDs)
- Auditoria via `console.error/warn`
- Dados sensíveis retornados apenas para usuário autenticado
- Nenhum dado de terceiros exposto

### Error Handling
```typescript
try {
  // Lógica principal
} catch (error: any) {
  console.error('[API /api/assinante/...] Erro:', error.message)
  return NextResponse.json(
    { error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
    { status: 500 }
  )
}
```

### Response Pattern
```typescript
// Sucesso
{
  data: {...},
  metadata: {
    subscriptionStatus,
    timestamp: new Date().toISOString()
  }
}

// Erro
{
  error: 'ERROR_CODE',
  message: 'Mensagem amigável'
}
```

---

## Integração com Frontend

### Exemplo de Uso - Delivery Status

```typescript
// Dashboard component
const { data, error } = await fetch('/api/assinante/delivery-status', {
  headers: {
    'Authorization': `Bearer ${firebaseToken}`
  }
})

if (data.currentDelivery) {
  // Renderizar timeline
  <DeliveryTimeline
    status={data.currentDelivery.status}
    progress={data.currentDelivery.progress}
    timeline={data.currentDelivery.timeline}
    trackingUrl={data.currentDelivery.trackingUrl}
  />
}
```

### Exemplo de Uso - Contextual Actions

```typescript
// Dashboard component
const { primaryActions, alerts } = await fetch('/api/assinante/contextual-actions', {
  headers: {
    'Authorization': `Bearer ${firebaseToken}`
  }
})

// Renderizar ações com prioridade
{primaryActions.map(action => (
  <Button
    key={action.id}
    variant={action.variant}
    href={action.url}
  >
    <Icon name={action.icon} />
    {action.label}
  </Button>
))}

// Renderizar alertas
{alerts.map(alert => (
  <Alert type={alert.type}>
    {alert.message}
    {alert.action && (
      <Button href={alert.action.url}>
        {alert.action.label}
      </Button>
    )}
  </Alert>
))}
```

### Exemplo de Uso - WhatsApp Contextual

```typescript
// Botão de ação contextual
<Button
  variant="secondary"
  href={`/api/whatsapp-redirect?context=renewal&subscriptionId=${subscriptionId}`}
  target="_blank"
>
  <MessageCircle className="w-4 h-4" />
  Falar sobre Renovação
</Button>
```

---

## Considerações de Performance

### Database Queries Otimizadas

**Delivery Status**:
```typescript
// Single query com includes
prisma.user.findUnique({
  where: { firebaseUid },
  include: {
    subscriptions: {
      where: { status: 'ACTIVE' },
      include: {
        orders: {
          where: { deliveryStatus: { not: 'DELIVERED' } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      take: 1
    }
  }
})
```

**Contextual Actions**:
```typescript
// Busca estratégica com filtros
prisma.user.findUnique({
  include: {
    subscriptions: {
      where: { status: { in: ['ACTIVE', 'PAUSED', 'OVERDUE'] } },
      include: {
        orders: { take: 1 },
        payments: {
          where: { status: { in: ['PENDING', 'OVERDUE'] } },
          take: 1
        }
      },
      take: 1
    },
    notifications: {
      where: {
        status: { in: ['SENT', 'DELIVERED'] },
        createdAt: { gte: last7Days }
      }
    }
  }
})
```

### Caching Strategy (Futuro)

Endpoints são stateless e podem ser cacheados:
- Cache-Control: `private, max-age=300` (5 minutos)
- Invalidação: mudança em Order/Payment/Subscription
- Redis para cache distribuído em produção

---

## Testes Recomendados

### Unit Tests (Futuros)
- `delivery-status.test.ts`: Testar cálculo de progresso e timeline
- `contextual-actions.test.ts`: Testar lógica de priorização
- `whatsapp-redirect.test.ts`: Validar novos contextos

### Integration Tests (Futuros)
- Autenticação Firebase
- Rate limiting
- Queries Prisma
- Error handling

### E2E Tests (Futuros)
- Fluxo completo: login → dashboard → ações contextuais
- WhatsApp redirect com contexto
- Delivery tracking

---

## Deployment

### Variáveis de Ambiente Necessárias

```bash
# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Database
DATABASE_URL=
DATABASE_DIRECT_URL=

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=5533999898026
```

### Build & Deploy

```bash
# 1. Verificar tipos TypeScript
npm run lint

# 2. Build production
npm run build

# 3. Restart systemd service
systemctl restart svlentes-nextjs

# 4. Verificar health
curl -I https://svlentes.shop/api/health-check
```

---

## Próximos Passos (Recomendações)

### Melhorias Futuras

1. **Caching com Redis**:
   - Implementar cache de 5min para delivery-status
   - Invalidação automática em webhooks Asaas

2. **Webhooks de Rastreamento**:
   - Integração com API dos Correios
   - Atualização automática de Order.deliveryStatus
   - Push notifications para usuários

3. **Analytics**:
   - Rastrear cliques em ações contextuais
   - Medir conversão de alertas
   - Dashboard interno para equipe

4. **ML/AI**:
   - Priorização dinâmica baseada em comportamento
   - Previsão de churn (pausas/cancelamentos)
   - Recomendações personalizadas

5. **Testes**:
   - Coverage mínimo de 80%
   - E2E com Playwright
   - Load testing (k6)

---

## Resumo de Arquivos

### Criados
- ✅ `src/app/api/assinante/delivery-status/route.ts` (274 linhas)
- ✅ `src/app/api/assinante/contextual-actions/route.ts` (307 linhas)

### Modificados
- ✅ `src/app/api/whatsapp-redirect/route.ts` (adicionados 3 contextos)
- ✅ `src/lib/whatsapp.ts` (adicionadas 3 mensagens pré-formatadas)

### Total
- **~600 linhas** de código backend implementadas
- **3 endpoints** prontos para produção
- **0 testes** implementados (recomendação para próxima fase)

---

## Validação Pré-Deploy

### Checklist

- [x] Autenticação Firebase implementada
- [x] Rate limiting configurado
- [x] LGPD compliance (sem PII em logs)
- [x] Error handling robusto
- [x] TypeScript strict mode
- [x] Prisma queries otimizadas
- [x] Documentação inline
- [ ] Testes unitários (pendente)
- [ ] Testes E2E (pendente)
- [ ] Load testing (pendente)

---

**Autor**: Backend Architect Persona
**Data**: 2025-10-24
**Status**: ✅ Implementação Completa - Pronto para Integração Frontend
