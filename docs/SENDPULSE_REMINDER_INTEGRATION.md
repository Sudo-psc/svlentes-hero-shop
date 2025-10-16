# SendPulse Reminder System Integration

Complete guide for integrating the intelligent reminder system with SendPulse API for multi-channel notifications.

## Overview

The reminder system leverages SendPulse API to deliver personalized reminders through multiple channels:
- **WhatsApp**: Interactive messages with quick reply buttons
- **SMS**: Text-based reminders
- **Email**: Rich HTML formatted reminders
- **Push**: Mobile push notifications (future)

## Architecture

```
┌─────────────────────────────────────────┐
│   Intelligent Reminder System           │
│                                          │
│  ┌────────────┐      ┌──────────────┐  │
│  │ ML Engine  │─────▶│ Channel      │  │
│  │ (Predict)  │      │ Optimizer    │  │
│  └────────────┘      └──────┬───────┘  │
│                             │           │
│  ┌─────────────────────────▼────────┐  │
│  │  SendPulse Reminder Service      │  │
│  │  - Channel routing               │  │
│  │  - Template formatting           │  │
│  │  - Contact management            │  │
│  └──────────────┬───────────────────┘  │
│                 │                       │
└─────────────────┼───────────────────────┘
                  │
         ┌────────▼─────────┐
         │  SendPulse API   │
         │  - WhatsApp      │
         │  - SMS           │
         │  - Email         │
         └──────────────────┘
```

## Setup

### 1. Environment Variables

Add to `.env.local`:

```bash
# SendPulse Configuration
SENDPULSE_API_TOKEN=your_api_token_here
SENDPULSE_WEBHOOK_TOKEN=your_webhook_token_here
NEXT_PUBLIC_SENDPULSE_PHONE_NUMBER_ID=your_phone_number_id

# Database for reminder tracking
DATABASE_URL=postgresql://user:password@localhost:5432/svlentes
```

### 2. Database Migration

The reminder system requires these Prisma models:
- `User` (with preferences, phone, email)
- `UserBehavior` (engagement metrics)
- `Notification` (reminder records)
- `Interaction` (tracking user responses)
- `MLPrediction` (ML-based channel predictions)
- `Campaign` (bulk reminder campaigns)
- `AnalyticsSnapshot` (daily metrics)

Run migration:
```bash
npx prisma generate
npx prisma db push
```

## API Endpoints

### Send Single Reminder

```bash
POST /api/reminders/send
Content-Type: application/json

{
  "reminder": {
    "userId": "user_123",
    "phone": "+5533998980026",
    "email": "customer@example.com",
    "name": "João Silva",
    "message": "Olá! Sua próxima entrega de lentes está agendada para amanhã. Confirme o endereço de entrega.",
    "subject": "Entrega de Lentes Agendada",
    "quickReplies": [
      "Confirmar endereço",
      "Alterar endereço",
      "Falar com atendente"
    ],
    "metadata": {
      "orderId": "order_456",
      "deliveryDate": "2024-10-18"
    }
  },
  "channel": "WHATSAPP"
}
```

Response:
```json
{
  "success": true,
  "message": "Reminder sent successfully via WHATSAPP",
  "channel": "WHATSAPP"
}
```

### Schedule Reminder

```bash
POST /api/reminders/schedule
Content-Type: application/json

{
  "reminder": {
    "userId": "user_123",
    "phone": "+5533998980026",
    "message": "Lembrete: Sua consulta com oftalmologista é amanhã às 14h.",
    "scheduledAt": "2024-10-17T13:00:00Z"
  },
  "channel": "WHATSAPP"
}
```

Response:
```json
{
  "success": true,
  "status": "scheduled",
  "message": "Reminder scheduled",
  "scheduledAt": "2024-10-17T13:00:00.000Z",
  "channel": "WHATSAPP"
}
```

### Send Bulk Reminders

```bash
POST /api/reminders/bulk
Content-Type: application/json

{
  "reminders": [
    {
      "userId": "user_1",
      "phone": "+5533998980026",
      "message": "Renovação de assinatura disponível!"
    },
    {
      "userId": "user_2",
      "phone": "+5533998980027",
      "message": "Renovação de assinatura disponível!"
    }
  ],
  "channel": "WHATSAPP"
}
```

Response:
```json
{
  "success": true,
  "result": {
    "sent": 2,
    "failed": 0,
    "total": 2,
    "successRate": "100.00%"
  },
  "channel": "WHATSAPP"
}
```

## Usage Examples

### Example 1: Subscription Renewal Reminder

```typescript
import { sendPulseReminderService } from '@/lib/reminders/sendpulse-reminder-service'
import { NotificationChannel } from '@/types/reminders'

async function sendRenewalReminder(userId: string, user: any, subscription: any) {
  const reminder = {
    userId,
    phone: user.whatsapp || user.phone,
    email: user.email,
    name: user.name,
    message: `Olá ${user.name}! Sua assinatura de lentes será renovada em 3 dias. Valor: R$ ${subscription.monthlyValue}`,
    subject: 'Renovação de Assinatura - SV Lentes',
    quickReplies: [
      'Confirmar renovação',
      'Alterar forma de pagamento',
      'Cancelar assinatura'
    ],
    metadata: {
      subscriptionId: subscription.id,
      renewalDate: subscription.renewalDate,
      amount: subscription.monthlyValue
    }
  }

  const success = await sendPulseReminderService.sendReminder(
    reminder,
    NotificationChannel.WHATSAPP
  )

  if (success) {
    console.log('Renewal reminder sent successfully')
  }
}
```

### Example 2: Delivery Notification

```typescript
async function sendDeliveryReminder(order: any, user: any) {
  const reminder = {
    userId: user.id,
    phone: user.whatsapp || user.phone,
    email: user.email,
    name: user.name,
    message: `📦 Boa notícia! Seu pedido saiu para entrega.\n\nCódigo de rastreamento: ${order.trackingCode}\n\nPrevisão: ${order.estimatedDelivery}`,
    subject: 'Pedido em Rota de Entrega',
    quickReplies: [
      'Rastrear pedido',
      'Alterar endereço',
      'Contatar entregador'
    ],
    metadata: {
      orderId: order.id,
      trackingCode: order.trackingCode
    }
  }

  // Send via WhatsApp with fallback to SMS
  let success = await sendPulseReminderService.sendReminder(
    reminder,
    NotificationChannel.WHATSAPP
  )

  if (!success) {
    success = await sendPulseReminderService.sendReminder(
      reminder,
      NotificationChannel.SMS
    )
  }
}
```

### Example 3: Appointment Reminder with Scheduling

```typescript
async function scheduleAppointmentReminder(appointment: any, user: any) {
  const reminderTime = new Date(appointment.date)
  reminderTime.setHours(reminderTime.getHours() - 24) // 24h before

  const reminder = {
    userId: user.id,
    phone: user.whatsapp || user.phone,
    email: user.email,
    name: user.name,
    message: `🏥 Lembrete: Você tem consulta com ${appointment.doctor} amanhã às ${appointment.time}.\n\nLocal: ${appointment.location}`,
    subject: 'Lembrete de Consulta',
    scheduledAt: reminderTime,
    quickReplies: [
      'Confirmar presença',
      'Remarcar',
      'Ver detalhes'
    ],
    metadata: {
      appointmentId: appointment.id
    }
  }

  const status = await sendPulseReminderService.scheduleReminder(
    reminder,
    NotificationChannel.WHATSAPP
  )

  console.log(`Appointment reminder: ${status}`)
}
```

### Example 4: Bulk Campaign

```typescript
async function sendMonthlyPromotionCampaign(activeUsers: any[]) {
  const reminders = activeUsers.map(user => ({
    userId: user.id,
    phone: user.whatsapp || user.phone,
    email: user.email,
    name: user.name,
    message: `🎉 Promoção Especial!\n\nOlá ${user.name}, aproveite 20% de desconto em todas as lentes este mês!`,
    subject: 'Promoção Especial - SV Lentes',
    quickReplies: [
      'Ver produtos',
      'Aplicar desconto',
      'Saber mais'
    ],
    metadata: {
      campaignId: 'monthly_promo_2024_10',
      discount: 20
    }
  }))

  const result = await sendPulseReminderService.sendBulkReminders(
    reminders,
    NotificationChannel.WHATSAPP
  )

  console.log(`Campaign results:`, result)
}
```

## Message Templates

### Subscription Reminder
```
Olá {name}! 

Sua assinatura de lentes será renovada em {days} dias.
💰 Valor: R$ {amount}

Deseja confirmar a renovação?
```

### Delivery Update
```
📦 Seu pedido está a caminho!

Código de rastreamento: {trackingCode}
Previsão de entrega: {deliveryDate}

Acompanhe sua entrega em tempo real.
```

### Appointment Reminder
```
🏥 Lembrete de Consulta

Data: {appointmentDate}
Horário: {appointmentTime}
Médico: {doctorName}
Local: {location}

Não esqueça de levar sua receita médica!
```

## Best Practices

### 1. Channel Selection
Use ML predictions to select optimal channel:
```typescript
import { MLService } from '@/lib/reminders/ml-service'

const prediction = await MLService.predictBestChannel(userId)
const channel = prediction.channel // Uses user behavior data
```

### 2. Rate Limiting
Respect user preferences for notification frequency:
```typescript
const userBehavior = await prisma.userBehavior.findUnique({
  where: { userId }
})

if (userBehavior.currentFatigueScore > 80) {
  // Skip notification - user is fatigued
  return
}
```

### 3. Personalization
Always personalize messages:
```typescript
const message = `Olá ${user.name}! ${baseMessage}`
```

### 4. Quick Replies
Provide actionable options:
```typescript
const quickReplies = [
  'Confirmar',      // Primary action
  'Ver detalhes',   // Information
  'Falar com atendente' // Support
]
```

### 5. Metadata Tracking
Include context for analytics:
```typescript
metadata: {
  campaignId: 'renewal_2024_10',
  subscriptionId: subscription.id,
  reminderType: 'renewal',
  daysBeforeRenewal: 3
}
```

## Monitoring

### Track Metrics
Monitor via analytics API:
```bash
GET /api/v1/analytics/engagement?startDate=2024-10-01&endDate=2024-10-31
```

Key metrics:
- Delivery rate per channel
- Open rate
- Click rate (quick reply interactions)
- Conversion rate
- Opt-out rate
- Response time

### Health Checks
```bash
# Test SendPulse connection
GET /api/sendpulse?action=test

# Check reminder queue
GET /api/reminders?status=scheduled
```

## Troubleshooting

### Common Issues

1. **Phone number format errors**
   - Always use international format: `+5533998980026`
   - Remove special characters: `( ) - .`

2. **Rate limiting**
   - Maximum 100 messages per bulk request
   - Recommended: 1000ms delay between individual sends

3. **Message not delivered**
   - Check user's WhatsApp opt-in status
   - Verify phone number is valid
   - Review SendPulse account status

4. **Quick replies not showing**
   - Maximum 3 quick reply buttons for WhatsApp
   - Each button text limited to 20 characters

## Security

- API tokens stored in environment variables
- Webhook verification via token
- User data encrypted in database
- LGPD compliance for Brazilian users
- Opt-out mechanism required

## Support

- SendPulse API Docs: https://sendpulse.com/integrations/api
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
- Internal Documentation: `/docs/REMINDER_SYSTEM_SUMMARY.md`
