# Backend APIs Implementadas - Portal do Assinante (Issue #31 - Fase 1)

**Data**: 2025-10-23
**Autor**: Dr. Philipe Saraiva Cruz
**Projeto**: SV Lentes - Next.js 15 Landing Page

## Resumo Executivo

Implementadas 3 APIs REST para o portal do assinante, fornecendo dados consolidados para o dashboard. Todas as APIs seguem os padrões de segurança, autenticação e performance do projeto.

---

## 1. API de Métricas do Dashboard

### Endpoint
```
GET /api/assinante/dashboard-metrics
```

### Localização
```
/root/svlentes-hero-shop/src/app/api/assinante/dashboard-metrics/route.ts
```

### Resposta JSON
```typescript
{
  totalSaved: number,           // Total economizado vs compra avulsa
  lensesReceived: number,       // Total de lentes recebidas
  daysUntilNextDelivery: number, // Dias até próxima entrega
  deliveryOnTimeRate: number    // Taxa de pontualidade (%)
}
```

### Lógica de Cálculo

#### 1. Total Economizado (totalSaved)
```typescript
// Fórmula: Custo teórico avulso - Total pago
const theoreticalRetailPrice = monthlyValue * 1.5 // 50% mais caro
const theoreticalRetailTotal = theoreticalRetailPrice * monthsActive
const totalSaved = theoreticalRetailTotal - totalPaid
```

**Critérios:**
- Considera apenas pagamentos com status `RECEIVED` ou `CONFIRMED`
- Assume que compra avulsa custa 50% a mais que a assinatura
- Retorna 0 se valor for negativo (proteção contra cenários inválidos)

#### 2. Lentes Recebidas (lensesReceived)
```typescript
// COUNT de Orders com deliveryStatus = 'DELIVERED'
const lensesReceived = await prisma.order.count({
  where: {
    subscriptionId: subscription.id,
    deliveryStatus: 'DELIVERED'
  }
})
```

**Critérios:**
- Conta apenas entregas efetivamente concluídas (status `DELIVERED`)
- Exclui pedidos pendentes, cancelados ou em trânsito

#### 3. Dias até Próxima Entrega (daysUntilNextDelivery)
```typescript
// DIFF entre nextBillingDate e hoje
const daysUntilNextDelivery = Math.ceil(
  (nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
)
```

**Critérios:**
- Usa `subscription.nextBillingDate` ou fallback para `renewalDate`
- Arredonda para cima com `Math.ceil()`
- Retorna 0 se data já passou (proteção contra valores negativos)

#### 4. Taxa de Pontualidade (deliveryOnTimeRate)
```typescript
// (entregas no prazo / total entregas) * 100
allDeliveries.forEach(order => {
  if (order.deliveredAt <= order.estimatedDelivery) {
    onTimeDeliveries++
  }
})
const deliveryOnTimeRate = (onTimeDeliveries / allDeliveries.length) * 100
```

**Critérios:**
- Compara `deliveredAt` com `estimatedDelivery`
- Considera "no prazo" quando entregue até ou antes da data estimada
- Retorna 100% se ainda não teve entregas (otimista inicial)
- Arredonda para inteiro com `Math.round()`

---

## 2. API de Timeline de Entregas

### Endpoint
```
GET /api/assinante/delivery-timeline
```

### Localização
```
/root/svlentes-hero-shop/src/app/api/assinante/delivery-timeline/route.ts
```

### Resposta JSON
```typescript
{
  pastDeliveries: Array<{
    id: string,
    orderDate: string,           // ISO 8601
    shippingDate: string | null,
    deliveredAt: string | null,
    estimatedDelivery: string | null,
    status: DeliveryStatus,
    trackingCode: string | null,
    products: Json,
    totalAmount: number,
    deliveryAddress: Json,
    onTime: boolean | null       // Se foi entregue no prazo
  }>,
  nextDelivery: {
    estimatedDate: string,       // ISO 8601
    daysRemaining: number,
    status: string,              // 'scheduled' | 'pending' | 'shipped' | 'in_transit'
    trackingCode: string | null,
    orderId: string | null
  }
}
```

### Lógica de Cálculo

#### 1. Entregas Passadas (pastDeliveries)
```typescript
const pastDeliveries = await prisma.order.findMany({
  where: {
    subscriptionId: subscription.id,
    deliveryStatus: 'DELIVERED'
  },
  orderBy: { deliveredAt: 'desc' },
  take: 3  // Últimas 3 entregas
})
```

**Critérios:**
- Retorna apenas status `DELIVERED` (entregas concluídas)
- Ordena por `deliveredAt` decrescente (mais recente primeiro)
- Limita a 3 resultados
- Calcula flag `onTime` comparando `deliveredAt` com `estimatedDelivery`

#### 2. Próxima Entrega (nextDelivery)
```typescript
// Busca pedido pendente/em trânsito
const nextPendingOrder = await prisma.order.findFirst({
  where: {
    deliveryStatus: { in: ['PENDING', 'SHIPPED', 'IN_TRANSIT'] }
  }
})

// Se tem pedido pendente, usa estimativa dele
if (nextPendingOrder) {
  nextDeliveryEstimate = nextPendingOrder.estimatedDelivery || nextBillingDate
  nextDeliveryStatus = nextPendingOrder.deliveryStatus
} else {
  // Se não tem pedido, assume próximo ciclo + 6 dias processamento
  nextDeliveryEstimate = new Date(nextBillingDate)
  nextDeliveryEstimate.setDate(nextDeliveryEstimate.getDate() + 6)
  nextDeliveryStatus = 'scheduled'
}
```

**Critérios:**
- Prioriza pedido em andamento se existir
- Se não tem pedido pendente, estima baseado no `nextBillingDate + 6 dias`
- Status `scheduled` indica que ainda não foi criado o pedido
- Calcula `daysRemaining` com `Math.max(0, ...)` para não retornar negativo

---

## 3. API de Economia Acumulada

### Endpoint
```
GET /api/assinante/savings-widget
```

### Localização
```
/root/svlentes-hero-shop/src/app/api/assinante/savings-widget/route.ts
```

### Resposta JSON
```typescript
{
  totalSavings: number,
  savingsThisMonth: number,
  savingsTrend: Array<{
    month: string,    // Formato: "Jan/2025"
    amount: number
  }>,
  metadata: {
    monthsActive: number,
    averageMonthlySavings: number,
    subscriptionStartDate: string  // ISO 8601
  }
}
```

### Lógica de Cálculo

#### 1. Economia Total (totalSavings)
```typescript
// Mesmo cálculo da API dashboard-metrics
const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0)
const theoreticalRetailTotal = theoreticalRetailPrice * monthsActive
const totalSavings = theoreticalRetailTotal - totalPaid
```

#### 2. Economia no Mês Atual (savingsThisMonth)
```typescript
const currentMonthPayments = allPayments.filter(p => {
  const paymentDate = p.paymentDate || p.confirmedDate
  const date = new Date(paymentDate)
  return date.getMonth() === currentMonth && date.getFullYear() === currentYear
})

const currentMonthPaid = currentMonthPayments.reduce(...)
const currentMonthRetailCost = theoreticalRetailPrice * currentMonthPayments.length
const savingsThisMonth = currentMonthRetailCost - currentMonthPaid
```

**Critérios:**
- Filtra pagamentos do mês/ano atual
- Usa `paymentDate` ou fallback para `confirmedDate`
- Aplica mesma lógica de economia (avulso - pago)

#### 3. Tendência Mensal (savingsTrend)
```typescript
// Últimos 6 meses com economia por mês
for (let i = 5; i >= 0; i--) {
  const targetDate = new Date(now)
  targetDate.setMonth(targetDate.getMonth() - i)

  const monthPayments = allPayments.filter(/* filtro mês/ano */)
  const monthSavings = monthRetailCost - monthPaid

  savingsTrend.push({
    month: targetDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
    amount: Math.max(0, Math.round(monthSavings * 100) / 100)
  })
}
```

**Critérios:**
- Retorna últimos 6 meses (incluindo mês atual)
- Formato de mês: `"Jan/2025"` (pt-BR)
- Economia por mês calculada individualmente
- Array ordenado cronologicamente (mais antigo primeiro)

#### 4. Metadata Adicional
- `monthsActive`: Total de meses com pagamentos confirmados
- `averageMonthlySavings`: `totalSavings / monthsActive`
- `subscriptionStartDate`: Data de início da assinatura

---

## Requisitos Técnicos Implementados

### Autenticação
- ✅ Firebase Admin SDK via header `Authorization: Bearer <token>`
- ✅ Validação de token Firebase
- ✅ Verificação de `firebaseUid` no banco de dados
- ✅ Status 401 se não autenticado
- ✅ Status 404 se assinatura não encontrada

### Rate Limiting
- ✅ 200 requisições em 15 minutos (leitura)
- ✅ Implementado via `@/lib/rate-limit`
- ✅ Configuração: `rateLimitConfigs.read`

### Error Handling
- ✅ Try-catch em todas operações
- ✅ Logs estruturados com contexto
- ✅ Mensagens de erro descritivas
- ✅ Status codes apropriados (401, 404, 500, 503)

### TypeScript
- ✅ Tipos estritos
- ✅ Nenhum uso de `any` (corrigido após lint)
- ✅ Inferência de tipos do Prisma
- ✅ Interfaces bem definidas nas respostas

### Performance
- ✅ Queries otimizadas com `select` específico
- ✅ Uso de índices do Prisma (userId, subscriptionId, status)
- ✅ Agregações no banco (count, filter)
- ✅ Sem N+1 queries
- ✅ `dynamic = 'force-dynamic'` para dados em tempo real

---

## Considerações de Performance

### Otimizações Aplicadas

#### 1. Query Optimization
```typescript
// ✅ BOM: Busca apenas campos necessários
const subscription = await prisma.subscription.findFirst({
  select: {
    id: true,
    monthlyValue: true,
    nextBillingDate: true
  }
})

// ❌ EVITADO: Buscar todos os campos desnecessariamente
const subscription = await prisma.subscription.findFirst()
```

#### 2. Database Aggregations
```typescript
// ✅ BOM: COUNT no banco de dados
const lensesReceived = await prisma.order.count({
  where: { deliveryStatus: 'DELIVERED' }
})

// ❌ EVITADO: Buscar tudo e contar em memória
const allOrders = await prisma.order.findMany()
const lensesReceived = allOrders.filter(o => o.deliveryStatus === 'DELIVERED').length
```

#### 3. Índices Utilizados
Todas as queries aproveitam índices existentes no schema Prisma:
- `idx_subscriptions_user_id`
- `idx_subscriptions_status`
- `idx_payments_user_id`
- `idx_payments_subscription_id`
- `idx_payments_status`
- `idx_orders_subscription_id`
- `idx_orders_delivery_status`

#### 4. Redução de Payload
- Transformação de dados no backend (ex: `Number(decimal)`)
- Formato de data ISO 8601 consistente
- Apenas campos necessários na resposta
- Arredondamento de valores decimais (2 casas)

### Estimativa de Performance

**Complexidade de Queries:**
- `dashboard-metrics`: O(log n) para buscas indexadas + O(n) para agregações em `payments` e `orders`
- `delivery-timeline`: O(1) para limite de 3 resultados + índices
- `savings-widget`: O(n) para processamento de tendência mensal (limitado a 6 meses)

**Tempo de Resposta Estimado:**
- Banco com 1.000 pagamentos: ~50-100ms
- Banco com 10.000 pagamentos: ~100-200ms
- Banco com 100.000 pagamentos: ~200-500ms

**Gargalos Potenciais:**
- `savings-widget` com muitos pagamentos (mitigado por filtragem de datas)
- Cálculo de pontualidade com muitas entregas (otimizado com loop simples)

**Melhorias Futuras:**
- Cache Redis para métricas consolidadas (TTL 5-10 minutos)
- Materialização de agregações em tabela separada (via jobs)
- Paginação se histórico de entregas crescer muito

---

## Testes Recomendados

### Testes Unitários (Jest)
```typescript
describe('Dashboard Metrics API', () => {
  it('should calculate total savings correctly')
  it('should count delivered orders only')
  it('should return 0 for negative days until delivery')
  it('should calculate delivery rate as 100% with no deliveries')
})
```

### Testes de Integração (Playwright)
```typescript
test('Dashboard metrics returns valid data', async ({ request }) => {
  const response = await request.get('/api/assinante/dashboard-metrics', {
    headers: { Authorization: `Bearer ${validToken}` }
  })
  expect(response.status()).toBe(200)
  const data = await response.json()
  expect(data.totalSaved).toBeGreaterThanOrEqual(0)
  expect(data.lensesReceived).toBeGreaterThanOrEqual(0)
})
```

### Testes de Carga
- Rate limit: verificar 200 req/15min
- Concorrência: 10 usuários simultâneos
- Latência: < 500ms para 95% das requisições

---

## Segurança

### Proteções Implementadas

1. **Autenticação**: Firebase Admin SDK com validação de token
2. **Autorização**: Usuário só acessa seus próprios dados (via `userId` do token)
3. **Rate Limiting**: Proteção contra abuso (200 req/15min)
4. **Validação de Entrada**: Headers obrigatórios verificados
5. **Error Handling**: Sem vazamento de informações sensíveis nos erros
6. **SQL Injection**: Protegido pelo Prisma ORM
7. **Logs Seguros**: Não loga dados sensíveis (tokens, senhas)

### LGPD Compliance
- ✅ Acesso apenas a dados do próprio usuário
- ✅ Sem compartilhamento de dados entre usuários
- ✅ Logs com contexto mas sem dados pessoais
- ✅ Resposta estruturada sem campos sensíveis desnecessários

---

## Status Final

### Arquivos Criados
```
✅ /root/svlentes-hero-shop/src/app/api/assinante/dashboard-metrics/route.ts (5.4KB)
✅ /root/svlentes-hero-shop/src/app/api/assinante/delivery-timeline/route.ts (6.0KB)
✅ /root/svlentes-hero-shop/src/app/api/assinante/savings-widget/route.ts (6.2KB)
```

### Linting
```
✅ Nenhum erro de lint nas 3 APIs
✅ Warnings de `@typescript-eslint/no-unused-vars` corrigidos
✅ Warnings de `@typescript-eslint/no-explicit-any` corrigidos
```

### Próximos Passos (Issue #31 - Fase 2)

1. **Frontend Components**:
   - Criar `DashboardMetricsWidget.tsx`
   - Criar `DeliveryTimelineWidget.tsx`
   - Criar `SavingsChartWidget.tsx`

2. **Data Fetching**:
   - Implementar hooks React Query/SWR
   - Gerenciar estado de loading/error
   - Cache client-side

3. **UI/UX**:
   - Gráficos de tendência (savings trend)
   - Timeline visual de entregas
   - Animações de transição

4. **Testes E2E**:
   - Playwright para fluxo completo
   - Verificar autenticação Firebase
   - Validar cálculos de economia

---

## Referências

- **Prisma Schema**: `/root/svlentes-hero-shop/prisma/schema.prisma`
- **Padrão de API**: `/root/svlentes-hero-shop/src/app/api/assinante/subscription/route.ts`
- **Issue Tracking**: GitHub Issue #31 - Portal do Assinante
- **Documentação do Projeto**: `/root/svlentes-hero-shop/CLAUDE.md`

---

**Autor**: Dr. Philipe Saraiva Cruz
**Data**: 2025-10-23
**Versão**: 1.0
