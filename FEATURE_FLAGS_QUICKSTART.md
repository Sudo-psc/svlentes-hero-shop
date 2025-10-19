# Feature Flags - Quick Start Guide

## 🚀 Instalação (5 minutos)

```bash
# 1. Aplicar migrations
npx prisma generate
npx prisma migrate dev --name add_feature_flags

# 2. Seed inicial
npx ts-node prisma/seed-feature-flags.ts

# 3. Verificar no Prisma Studio
npx prisma studio
```

## 📖 Uso Básico

### Em Componentes React

```tsx
import { isFeatureEnabled } from '@/lib/feature-flags';

function MyComponent({ userId }) {
  const [newUI, setNewUI] = useState(false);

  useEffect(() => {
    async function check() {
      const enabled = await isFeatureEnabled('new_ui', userId);
      setNewUI(enabled);
    }
    check();
  }, [userId]);

  return newUI ? <NewUI /> : <OldUI />;
}
```

### Em API Routes

```ts
import { isFeatureEnabled } from '@/lib/feature-flags';

export async function POST(req: NextRequest) {
  const userId = getUserId(req);

  if (await isFeatureEnabled('beta_feature', userId)) {
    return handleBetaFlow();
  }

  return handleNormalFlow();
}
```

### Em Server Components

```tsx
import { isFeatureEnabled } from '@/lib/feature-flags';

export default async function Page() {
  const showNew = await isFeatureEnabled('new_layout');

  return showNew ? <NewLayout /> : <OldLayout />;
}
```

## 🎛️ Interface Admin

Acesse: `http://localhost:3000/admin/feature-flags`

**Funcionalidades:**
- ✅ Criar/editar flags
- 🔄 Toggle ativo/inativo
- 📊 Ajustar rollout (slider 0-100%)
- 📈 Ver estatísticas
- 🏷️ Organizar com tags

## 📊 Principais Funções

| Função | Uso | Retorno |
|--------|-----|---------|
| `isFeatureEnabled(key, userId?)` | Verificar se ativa | `boolean` |
| `evaluateFeatureFlag(key, userId?)` | Detalhes da avaliação | `{ enabled, reason, metadata }` |
| `activateFeatureFlag(key, by?, reason?)` | Ativar flag | `void` |
| `updateRolloutPercentage(key, %, by?, reason?)` | Ajustar rollout | `void` |
| `getFeatureFlagStats(key, since?)` | Estatísticas | `{ total, enabled, %, breakdown }` |

## 🎯 Rollout Gradual Recomendado

```typescript
// Fase 1: Beta interno (usuários específicos)
await upsertFeatureFlag({
  key: 'new_feature',
  targetUserIds: ['beta-user-1', 'beta-user-2'],
  status: 'ACTIVE',
  rolloutPercentage: 0,
});

// Fase 2: 5% público
await updateRolloutPercentage('new_feature', 5);
// ⏳ Monitorar 2-3 dias

// Fase 3: 25%
await updateRolloutPercentage('new_feature', 25);
// ⏳ Monitorar 1 semana

// Fase 4: 100%
await updateRolloutPercentage('new_feature', 100);
```

## 🏷️ Flags Essenciais Criadas

| Flag Key | Descrição | Status |
|----------|-----------|--------|
| `whatsapp_ai_support` | IA para WhatsApp | 🟢 ACTIVE (100%) |
| `pix_payment` | Pagamento PIX | 🟢 ACTIVE (100%) |
| `smart_reminders` | Lembretes ML | 🟢 ACTIVE (50%) |
| `prescription_upload` | Upload de receita | 🟢 ACTIVE (100%) |
| `emergency_contact` | Botão emergência | 🟢 ACTIVE (100%) |
| `delivery_tracking` | Rastreamento | 🟢 ACTIVE (100%) |
| `lgpd_compliance` | Dashboard LGPD | 🟢 ACTIVE (100%) |
| `beta_features` | Acesso beta | 🟢 ACTIVE (5%) |
| `new_checkout_flow` | Novo checkout | 🔴 INACTIVE |
| `subscription_pause` | Pausar assinatura | 🔴 INACTIVE |
| `referral_program` | Programa indicação | 🔴 INACTIVE |

## 💡 Exemplos Práticos

### Teste A/B

```tsx
const showVariantB = await isFeatureEnabled('ab_test_calculator', userId);

return showVariantB ? <VariantB /> : <VariantA />;
```

### Rollout por Ambiente

```tsx
await upsertFeatureFlag({
  key: 'experimental',
  targetEnvironments: ['DEVELOPMENT', 'STAGING'], // Não em produção
});
```

### Targeting de Usuários VIP

```tsx
await upsertFeatureFlag({
  key: 'vip_features',
  targetUserIds: ['vip-1', 'vip-2', 'vip-3'],
  rolloutPercentage: 0, // Só usuários específicos
});
```

## 🔍 Debug e Troubleshooting

### Verificar Status de Flag

```bash
# Prisma Studio
npx prisma studio

# Ou via API
curl http://localhost:3000/api/admin/feature-flags
```

### Ver Logs de Avaliação

```typescript
import { getFeatureFlagLogs } from '@/lib/feature-flags';

const logs = await getFeatureFlagLogs('my_flag', 50);
console.log(logs);
```

### Estatísticas Detalhadas

```typescript
import { getFeatureFlagStats } from '@/lib/feature-flags';

const stats = await getFeatureFlagStats('my_flag');
console.log(`Ativa em ${stats.enabledPercentage.toFixed(1)}% das avaliações`);
```

## 🧪 Testes

```bash
# Executar testes unitários
npm run test -- src/lib/__tests__/feature-flags.test.ts

# Com coverage
npm run test:coverage
```

## 📚 Documentação Completa

Para detalhes avançados, consulte:
- 📖 **Documentação Completa**: `/docs/FEATURE_FLAGS.md`
- 💻 **Exemplos de Código**: `/src/components/examples/FeatureFlagExample.tsx`
- 🧪 **Testes**: `/src/lib/__tests__/feature-flags.test.ts`

## ⚡ Performance

- ✅ **Cache automático**: Atualiza a cada 5 minutos
- ✅ **Avaliação local**: Sem chamadas de rede após cache
- ✅ **Logs assíncronos**: Não bloqueia avaliação
- ✅ **Indexes otimizados**: Queries rápidas no Postgres

## 🔒 Segurança e Compliance

- ✅ **Audit trail completo**: Todos os changes logados
- ✅ **LGPD ready**: Metadados para compliance
- ✅ **Fail-safe**: Erro = feature desativada (seguro)
- ✅ **Multi-ambiente**: Dev/Staging/Prod isolados

## 🎓 Próximos Passos

1. ✅ Criar sua primeira flag via admin UI
2. ✅ Implementar toggle em um componente
3. ✅ Testar rollout gradual (0% → 100%)
4. ✅ Monitorar estatísticas
5. ✅ Explorar targeting avançado

---

**Precisa de ajuda?**
- 📧 dev@svlentes.shop
- 📚 `/docs/FEATURE_FLAGS.md`
