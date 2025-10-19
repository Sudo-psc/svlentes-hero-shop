# Feature Flags System

Sistema completo de feature flags para controle granular de funcionalidades no SVLentes.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Instalação e Configuração](#instalação-e-configuração)
- [Uso Básico](#uso-básico)
- [Funcionalidades Avançadas](#funcionalidades-avançadas)
- [Interface Administrativa](#interface-administrativa)
- [API Reference](#api-reference)
- [Melhores Práticas](#melhores-práticas)

## Visão Geral

O sistema de feature flags permite:

- ✅ **Controle granular**: Ative/desative features sem deploy
- 🎯 **Rollout percentual**: Liberação gradual para percentuais de usuários
- 👥 **Targeting por usuário**: Habilite features para usuários específicos
- 🌍 **Ambientes separados**: Development, Staging, Production
- 📊 **Logs detalhados**: Auditoria completa de avaliações
- ⚡ **Cache local**: Performance otimizada com atualização a cada 5 minutos
- 🔍 **Analytics**: Estatísticas de uso e efetividade

## Instalação e Configuração

### 1. Aplicar Migrations

```bash
# Gerar e aplicar migrations do Prisma
npx prisma generate
npx prisma migrate dev --name add_feature_flags

# Seed inicial de flags essenciais
npx ts-node prisma/seed-feature-flags.ts
```

### 2. Variáveis de Ambiente

Adicione ao `.env.local`:

```bash
# Feature Flags Configuration
NODE_ENV=development  # development | staging | production
DATABASE_URL="postgresql://..."
```

### 3. Verificar Instalação

```bash
# Executar testes
npm run test -- src/lib/__tests__/feature-flags.test.ts

# Verificar no Prisma Studio
npx prisma studio
```

## Uso Básico

### Verificar se Feature está Ativa

```typescript
import { isFeatureEnabled } from '@/lib/feature-flags';

// Em um componente React
export default function CheckoutPage() {
  const [newCheckout, setNewCheckout] = useState(false);

  useEffect(() => {
    async function checkFlag() {
      const enabled = await isFeatureEnabled('new_checkout_flow', userId);
      setNewCheckout(enabled);
    }
    checkFlag();
  }, [userId]);

  if (newCheckout) {
    return <NewCheckoutFlow />;
  }

  return <LegacyCheckoutFlow />;
}
```

### Em API Routes

```typescript
import { isFeatureEnabled } from '@/lib/feature-flags';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);

  // Verificar se feature está ativa
  const isPIXEnabled = await isFeatureEnabled('pix_payment', userId);

  if (isPIXEnabled) {
    // Processar pagamento PIX
    return handlePIXPayment(request);
  }

  // Fallback para métodos tradicionais
  return handleLegacyPayment(request);
}
```

### Server Components

```typescript
import { isFeatureEnabled } from '@/lib/feature-flags';

export default async function PricingPage() {
  const dynamicPricing = await isFeatureEnabled('dynamic_pricing');

  return (
    <div>
      <h1>Planos e Preços</h1>
      {dynamicPricing ? <DynamicPricingTable /> : <StaticPricingTable />}
    </div>
  );
}
```

## Funcionalidades Avançadas

### Avaliação Detalhada

```typescript
import { evaluateFeatureFlag } from '@/lib/feature-flags';

const result = await evaluateFeatureFlag('smart_reminders', userId);

console.log(result);
// {
//   enabled: true,
//   reason: 'percentage_rollout',
//   metadata: {
//     rolloutPercentage: 50,
//     userBucket: 23,
//     userId: 'user-123'
//   }
// }
```

### Criação de Flags Programaticamente

```typescript
import { upsertFeatureFlag } from '@/lib/feature-flags';
import { FeatureFlagStatus, FeatureFlagEnvironment } from '@prisma/client';

await upsertFeatureFlag({
  name: 'Nova Feature X',
  key: 'feature_x',
  description: 'Descrição detalhada da feature',
  status: FeatureFlagStatus.INACTIVE,
  rolloutPercentage: 0,
  targetEnvironments: [FeatureFlagEnvironment.DEVELOPMENT],
  owner: 'Engineering Team',
  tags: ['experimental', 'high-priority'],
});
```

### Ativação e Rollout Gradual

```typescript
import {
  activateFeatureFlag,
  updateRolloutPercentage,
} from '@/lib/feature-flags';

// Ativar feature
await activateFeatureFlag(
  'new_checkout_flow',
  'admin@svlentes.shop',
  'Iniciando teste A/B'
);

// Rollout gradual
await updateRolloutPercentage('new_checkout_flow', 10, 'admin', 'Fase 1: 10%');
// ... monitorar métricas ...
await updateRolloutPercentage('new_checkout_flow', 25, 'admin', 'Fase 2: 25%');
// ... métricas positivas ...
await updateRolloutPercentage('new_checkout_flow', 100, 'admin', 'Rollout completo');
```

### Targeting de Usuários Específicos

```typescript
// Beta testers ou early adopters
await upsertFeatureFlag({
  key: 'beta_features',
  name: 'Beta Features Access',
  description: 'Acesso antecipado a features em beta',
  status: FeatureFlagStatus.ACTIVE,
  rolloutPercentage: 0, // Não usar rollout percentual
  targetUserIds: [
    'user-beta-1',
    'user-beta-2',
    'user-vip-3',
  ],
  tags: ['beta', 'early-access'],
});
```

### Estatísticas e Analytics

```typescript
import { getFeatureFlagStats } from '@/lib/feature-flags';

// Últimos 7 dias
const since = new Date();
since.setDate(since.getDate() - 7);

const stats = await getFeatureFlagStats('new_checkout_flow', since);

console.log(stats);
// {
//   totalEvaluations: 15234,
//   enabledCount: 7542,
//   disabledCount: 7692,
//   enabledPercentage: 49.5,
//   reasonBreakdown: {
//     'percentage_rollout': 7500,
//     'target_user': 42,
//     'inactive': 5000,
//     'environment_mismatch': 2692
//   }
// }
```

## Interface Administrativa

Acesse `http://localhost:3000/admin/feature-flags` para gerenciar flags visualmente.

### Funcionalidades da UI

- ✅ **Criar novas flags** com formulário completo
- 🔄 **Toggle ativo/inativo** com um clique
- 📊 **Slider de rollout** para ajuste em tempo real
- 📈 **Visualizar estatísticas** de avaliações
- 🏷️ **Tags e filtros** para organização
- 📝 **Histórico de mudanças** com auditoria

### Screenshots

#### Dashboard Principal
- Lista todas as flags com status visual
- Controles rápidos de ativação/desativação
- Indicadores de rollout percentual

#### Criação de Flag
- Formulário com validação
- Suporte a targeting de usuários
- Configuração de ambientes
- Tags e metadata

#### Estatísticas
- Gráficos de distribuição
- Breakdown por motivo de avaliação
- Métricas de performance

## API Reference

### Core Functions

#### `isFeatureEnabled(flagKey, userId?, options?)`

Verifica se uma feature está ativa.

**Parameters:**
- `flagKey` (string): Chave única da flag
- `userId` (string, opcional): ID do usuário para rollout percentual
- `options` (object, opcional):
  - `environment`: Ambiente específico
  - `skipLogging`: Pular registro de log

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const enabled = await isFeatureEnabled('new_feature', 'user-123');
```

---

#### `evaluateFeatureFlag(flagKey, userId?, options?)`

Avalia flag com resultado detalhado.

**Returns:** `Promise<FeatureFlagEvaluationResult>`

```typescript
interface FeatureFlagEvaluationResult {
  enabled: boolean;
  reason: string;
  metadata?: Record<string, any>;
}
```

---

#### `upsertFeatureFlag(config)`

Cria ou atualiza uma flag.

**Parameters:**
```typescript
interface FeatureFlagConfig {
  name: string;
  key: string;
  description: string;
  status?: FeatureFlagStatus;
  rolloutPercentage?: number;
  targetUserIds?: string[];
  targetEnvironments?: FeatureFlagEnvironment[];
  metadata?: Record<string, any>;
  owner?: string;
  tags?: string[];
}
```

---

#### `activateFeatureFlag(flagKey, changedBy?, reason?)`

Ativa uma flag.

**Example:**
```typescript
await activateFeatureFlag('new_feature', 'admin@example.com', 'Go live');
```

---

#### `deactivateFeatureFlag(flagKey, changedBy?, reason?)`

Desativa uma flag.

---

#### `updateRolloutPercentage(flagKey, percentage, changedBy?, reason?)`

Atualiza percentual de rollout (0-100).

**Example:**
```typescript
await updateRolloutPercentage('new_feature', 50, 'admin', 'Expanding to 50%');
```

---

#### `getFeatureFlagStats(flagKey, since?)`

Retorna estatísticas de avaliações.

**Returns:**
```typescript
{
  totalEvaluations: number;
  enabledCount: number;
  disabledCount: number;
  enabledPercentage: number;
  reasonBreakdown: Record<string, number>;
}
```

---

#### `getAllFeatureFlags()`

Lista todas as flags.

---

#### `getFeatureFlagLogs(flagKey, limit?)`

Retorna histórico de mudanças de uma flag.

## Melhores Práticas

### 1. Naming Convention

```typescript
// ✅ BOM
'new_checkout_flow'
'pix_payment'
'subscription_pause'

// ❌ RUIM
'newCheckoutFlow'  // camelCase
'PIX_PAYMENT'      // UPPERCASE
'feature1'         // não descritivo
```

### 2. Rollout Gradual

```typescript
// Estratégia recomendada para features críticas:

// Fase 1: Beta interno (usuários específicos)
await upsertFeatureFlag({
  key: 'critical_feature',
  targetUserIds: ['internal-user-1', 'internal-user-2'],
  rolloutPercentage: 0,
  status: FeatureFlagStatus.ACTIVE,
});

// Fase 2: 5% de usuários reais
await updateRolloutPercentage('critical_feature', 5);
// Monitorar por 2-3 dias

// Fase 3: 25% se métricas OK
await updateRolloutPercentage('critical_feature', 25);
// Monitorar por 1 semana

// Fase 4: 100% rollout
await updateRolloutPercentage('critical_feature', 100);
```

### 3. Tags e Organização

```typescript
// Use tags para categorizar
await upsertFeatureFlag({
  key: 'experimental_ai_support',
  tags: [
    'ai',              // Tecnologia
    'support',         // Domínio
    'experimental',    // Estágio
    'high-risk',       // Risco
  ],
});
```

### 4. Cleanup de Flags Antigas

```typescript
// Remover flags obsoletas regularmente
// Flags 100% ativas há 3+ meses podem ser removidas
// e a feature integrada permanentemente ao código

import { cleanupOldEvaluations } from '@/lib/feature-flags';

// Manutenção: rodar mensalmente
await cleanupOldEvaluations(30); // Mantém últimos 30 dias
```

### 5. Tratamento de Erros

```typescript
// Sempre tenha fallback para falhas
try {
  const enabled = await isFeatureEnabled('new_feature', userId);
  if (enabled) {
    return <NewFeature />;
  }
} catch (error) {
  // Log error mas não quebre a aplicação
  console.error('Feature flag error:', error);
  // Fallback para versão estável
}

return <LegacyFeature />;
```

### 6. Performance

```typescript
// Cache é automático mas você pode otimizar:

// ❌ Não faça isso (múltiplas chamadas)
const flag1 = await isFeatureEnabled('flag_1');
const flag2 = await isFeatureEnabled('flag_2');
const flag3 = await isFeatureEnabled('flag_3');

// ✅ Faça isso (batch evaluation)
const [flag1, flag2, flag3] = await Promise.all([
  isFeatureEnabled('flag_1'),
  isFeatureEnabled('flag_2'),
  isFeatureEnabled('flag_3'),
]);
```

### 7. LGPD e Compliance

```typescript
// Para features que afetam dados sensíveis
await upsertFeatureFlag({
  key: 'medical_data_export',
  description: 'Permite exportação de dados médicos - requer consentimento LGPD',
  tags: ['lgpd', 'medical', 'compliance'],
  metadata: {
    requiresConsent: true,
    dataCategory: 'sensitive',
    legalBasis: 'explicit_consent',
  },
});

// Validar consentimento antes de usar
const hasConsent = await checkLGPDConsent(userId, 'medical_data_export');
const enabled = await isFeatureEnabled('medical_data_export', userId);

if (enabled && hasConsent) {
  // Permitir exportação
}
```

## Troubleshooting

### Flag não está sendo avaliada corretamente

1. Verificar se a flag existe: `npx prisma studio`
2. Checar status: deve estar `ACTIVE`
3. Verificar ambiente: `targetEnvironments` inclui ambiente atual
4. Inspecionar logs: `getFeatureFlagLogs('flag_key')`

### Cache não está atualizando

```typescript
// Forçar refresh do cache
import { refreshCache } from '@/lib/feature-flags';

// Cache atualiza automaticamente a cada 5 minutos
// Se precisar forçar, reinicie o processo Node.js
```

### Performance lenta

```typescript
// Verificar quantas avaliações estão sendo registradas
const stats = await getFeatureFlagStats('slow_flag');
console.log(stats.totalEvaluations);

// Se muito alto, considerar usar skipLogging em high-traffic paths
await isFeatureEnabled('high_traffic_flag', userId, { skipLogging: true });
```

## Suporte

Para dúvidas ou problemas:
- 📧 Email: dev@svlentes.shop
- 📝 Documentation: `/docs/FEATURE_FLAGS.md`
- 🐛 Issues: GitHub Issues
