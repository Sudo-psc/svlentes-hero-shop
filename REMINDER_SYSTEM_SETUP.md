# Setup Guide: Sistema Inteligente de Lembretes

## Quick Start

### 1. Instalar Dependências

As dependências necessárias já estão no `package.json`:

```bash
npm install
```

Dependências principais:
- `@prisma/client` - ORM para banco de dados
- `prisma` - CLI e migrations
- `resend` - Envio de emails
- Firebase (já configurado) - Push notifications
- WhatsApp API (já configurado) - Mensagens WhatsApp

### 2. Configurar Banco de Dados

#### Setup PostgreSQL Local

```bash
# Criar banco de dados
createdb svlentes_reminders

# Configurar .env
DATABASE_URL="postgresql://user:password@localhost:5432/svlentes_reminders"
```

#### Executar Migrations

```bash
# Gerar Prisma Client
npx prisma generate

# Criar tabelas
npx prisma migrate dev --name init_reminder_system

# Visualizar banco (opcional)
npx prisma studio
```

### 3. Configurar Variáveis de Ambiente

Adicione ao `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/svlentes"

# Email (Resend - já configurado)
RESEND_API_KEY="re_your_key_here"

# WhatsApp (já configurado)
WHATSAPP_API_URL="https://api.whatsapp.com/v1"
WHATSAPP_API_TOKEN="your_token"

# SMS (Twilio - opcional)
TWILIO_ACCOUNT_SID="AC_your_sid"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"

# Push Notifications (Firebase - já configurado)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Scheduler Security
CRON_SECRET="your-secure-random-secret-here"
```

### 4. Testar Sistema

```bash
# Executar testes
npm test -- reminders

# Verificar coverage
npm test -- --coverage reminders
```

### 5. Configurar Cron Jobs

#### Opção A: Vercel Cron

Adicione ao `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/v1/scheduler/process",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/v1/scheduler/snapshot",
      "schedule": "0 0 * * *"
    }
  ]
}
```

#### Opção B: AWS EventBridge

```yaml
Events:
  ProcessNotifications:
    Type: Schedule
    Properties:
      Schedule: rate(1 minute)
      Target:
        Arn: !GetAtt ProcessFunction.Arn
        
  DailySnapshot:
    Type: Schedule
    Properties:
      Schedule: cron(0 0 * * ? *)
      Target:
        Arn: !GetAtt SnapshotFunction.Arn
```

#### Opção C: Cron local (desenvolvimento)

```bash
# Adicionar ao crontab
crontab -e

# Processar notificações a cada minuto
* * * * * curl -X POST http://localhost:3000/api/v1/scheduler/process -H "Authorization: Bearer dev-secret"

# Snapshot diário à meia-noite
0 0 * * * curl -X POST http://localhost:3000/api/v1/scheduler/snapshot -H "Authorization: Bearer dev-secret"
```

## Teste Manual via API

### 1. Criar um Usuário

```bash
# Via Prisma Studio ou SQL direto
npx prisma studio
# Criar user com email e phone
```

### 2. Criar um Lembrete

```bash
curl -X POST http://localhost:3000/api/v1/reminders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "type": "REMINDER",
    "content": "Hora de trocar suas lentes!",
    "subject": "Lembrete de Troca"
  }'
```

### 3. Verificar Predição ML

```bash
curl -X POST http://localhost:3000/api/v1/ml/predict \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123"
  }'
```

### 4. Ver Analytics

```bash
curl "http://localhost:3000/api/v1/analytics/dashboard"
```

### 5. Registrar Interação

```bash
curl -X POST http://localhost:3000/api/v1/interactions \
  -H "Content-Type: application/json" \
  -d '{
    "notificationId": "notif-456",
    "userId": "user-123",
    "actionType": "OPENED"
  }'
```

## Integração com Sistema Existente

### Enviar Lembretes de Troca de Lentes

```typescript
// src/lib/lens-reminders.ts
import { reminderOrchestrator } from '@/lib/reminders'

export async function scheduleContactLensReminder(
  userId: string,
  lensType: string,
  daysUntilReplacement: number
) {
  // Agendar lembrete baseado no tipo de lente
  const scheduledAt = new Date()
  scheduledAt.setDate(scheduledAt.getDate() + daysUntilReplacement - 3) // 3 dias antes

  await reminderOrchestrator.createIntelligentReminder({
    userId,
    type: 'REMINDER',
    content: `Faltam ${daysUntilReplacement} dias para trocar suas lentes ${lensType}. Não se esqueça!`,
    subject: 'Hora de trocar suas lentes',
    metadata: {
      lensType,
      daysUntilReplacement,
    },
    scheduledAt,
  })
}
```

### Webhook para Email Opens (Resend)

```typescript
// src/app/api/webhooks/email-tracking/route.ts
import { reminderOrchestrator } from '@/lib/reminders'

export async function POST(request: Request) {
  const event = await request.json()
  
  if (event.type === 'email.opened') {
    await reminderOrchestrator.handleInteraction(
      event.data.notificationId,
      event.data.userId,
      'OPENED'
    )
  }
  
  return Response.json({ success: true })
}
```

### Webhook para WhatsApp Status

```typescript
// src/app/api/webhooks/whatsapp-status/route.ts
import { reminderOrchestrator } from '@/lib/reminders'

export async function POST(request: Request) {
  const { message_id, status, user_id } = await request.json()
  
  const actionType = status === 'read' ? 'OPENED' : 'DELIVERED'
  
  await reminderOrchestrator.handleInteraction(
    message_id,
    user_id,
    actionType
  )
  
  return Response.json({ success: true })
}
```

## Monitoramento

### Verificar Saúde do Sistema

```bash
# Check ML accuracy
curl http://localhost:3000/api/v1/ml/metrics

# Check dashboard
curl http://localhost:3000/api/v1/analytics/dashboard
```

### Logs Importantes

```typescript
// Adicionar ao seu logger
import { analyticsService } from '@/lib/reminders'

setInterval(async () => {
  const metrics = await analyticsService.getDashboardMetrics()
  console.log('Reminder System Health:', {
    last24h: metrics.global.totalSent,
    engagementRate: metrics.global.engagementRate,
    optOutRate: metrics.global.optOutRate,
  })
}, 60000) // A cada minuto
```

## Performance Tuning

### Database Indexes

O schema Prisma já inclui índices otimizados:

```prisma
@@index([userId])
@@index([status])
@@index([scheduledAt])
@@index([channel])
```

### Batch Processing

O scheduler processa até 100 notificações por vez. Ajuste conforme necessário:

```typescript
// src/lib/reminders/scheduler.ts
const count = await reminderOrchestrator.processScheduledNotifications(100) // Ajustar aqui
```

### Cache de User Behavior

Considere adicionar Redis para cache de métricas frequentes:

```typescript
// Exemplo futuro
const cachedBehavior = await redis.get(`user:${userId}:behavior`)
if (cachedBehavior) return JSON.parse(cachedBehavior)
```

## Troubleshooting

### Notificações não sendo enviadas

1. Verificar se scheduler está rodando
2. Checar logs do cron job
3. Verificar CRON_SECRET
4. Confirmar DATABASE_URL

### ML predictions com baixa acurácia

1. Aguardar acúmulo de dados (mínimo 30 dias)
2. Verificar interações sendo registradas
3. Revisar lógica de cálculo de score

### Fadiga score sempre alto

1. Reduzir frequência de envios
2. Melhorar relevância do conteúdo
3. Verificar opt-outs

## Próximos Passos

1. ✅ Sistema core implementado
2. ✅ Testes unitários
3. ✅ API endpoints
4. ✅ Documentação
5. 🔄 Integração com sistema de lentes existente
6. 🔄 Setup de cron jobs em produção
7. 🔄 Dashboard UI (Fase 2)
8. 🔄 Modelo ML avançado (Fase 2)

## Suporte

Documentação completa: `docs/INTELLIGENT_REMINDERS.md`
Issues: GitHub Issues
Contato: dev@svlentes.com.br
