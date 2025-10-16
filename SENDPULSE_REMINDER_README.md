# SendPulse Reminder System Integration - Quick Start

## What's Integrated

The intelligent reminder system is now fully integrated with SendPulse API, providing:

✅ **Multi-Channel Reminders**
- WhatsApp (with quick reply buttons)
- SMS
- Email (rich HTML formatting)
- Push notifications (planned)

✅ **Smart Features**
- ML-based channel selection
- User behavior tracking
- Fatigue score management
- Scheduled reminders
- Bulk campaigns

✅ **SendPulse Integration**
- Contact management
- Message templates
- Webhook support
- Interactive messages

## Quick Usage

### 1. Send WhatsApp Reminder

```bash
curl -X POST http://localhost:3000/api/reminders/send \
  -H "Content-Type: application/json" \
  -d '{
    "reminder": {
      "userId": "user_123",
      "phone": "+5533998980026",
      "name": "João Silva",
      "message": "Sua renovação de assinatura será em 3 dias!",
      "quickReplies": ["Confirmar", "Ver detalhes", "Contatar suporte"]
    },
    "channel": "WHATSAPP"
  }'
```

### 2. Schedule Reminder

```bash
curl -X POST http://localhost:3000/api/reminders/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "reminder": {
      "userId": "user_123",
      "phone": "+5533998980026",
      "message": "Lembrete: Consulta amanhã às 14h",
      "scheduledAt": "2024-10-17T13:00:00Z"
    },
    "channel": "WHATSAPP"
  }'
```

### 3. Send Email Reminder

```bash
curl -X POST http://localhost:3000/api/reminders/send \
  -H "Content-Type: application/json" \
  -d '{
    "reminder": {
      "userId": "user_123",
      "email": "customer@example.com",
      "name": "Maria Santos",
      "message": "Seu pedido foi enviado!",
      "subject": "Pedido em Trânsito"
    },
    "channel": "EMAIL"
  }'
```

### 4. Bulk Campaign

```bash
curl -X POST http://localhost:3000/api/reminders/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "reminders": [
      {
        "userId": "user_1",
        "phone": "+5533998980026",
        "message": "Promoção especial: 20% OFF!"
      },
      {
        "userId": "user_2",
        "phone": "+5533998980027",
        "message": "Promoção especial: 20% OFF!"
      }
    ],
    "channel": "WHATSAPP"
  }'
```

## Files Created

### Core Services
- `src/lib/reminders/sendpulse-reminder-service.ts` - SendPulse reminder integration
- `src/lib/sendpulse-client.ts` - SendPulse API client (already existed)

### API Endpoints
- `src/app/api/reminders/send/route.ts` - Send single reminder
- `src/app/api/reminders/schedule/route.ts` - Schedule reminder
- `src/app/api/reminders/bulk/route.ts` - Bulk reminders

### Documentation
- `docs/SENDPULSE_REMINDER_INTEGRATION.md` - Complete integration guide
- `SENDPULSE_REMINDER_README.md` - This quick start guide

### Database Models (in prisma/schema.prisma)
- `Notification` - Reminder records
- `UserBehavior` - Engagement metrics
- `Interaction` - User interactions
- `MLPrediction` - ML predictions
- `Campaign` - Bulk campaigns
- `AnalyticsSnapshot` - Daily metrics

## Environment Variables

Add to `.env.local`:

```bash
# SendPulse Configuration (OAuth2)
SENDPULSE_CLIENT_ID=your_client_id_here
SENDPULSE_CLIENT_SECRET=your_client_secret_here
SENDPULSE_WEBHOOK_TOKEN=your_webhook_token_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/svlentes
```

**Como obter credenciais:**
1. Acesse [SendPulse Settings → API](https://login.sendpulse.com/settings)
2. Copie o **ID** para `SENDPULSE_CLIENT_ID`
3. Copie o **Secret** para `SENDPULSE_CLIENT_SECRET`

## Supported Channels

```typescript
enum NotificationChannel {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  PUSH = 'PUSH'  // Coming soon
}
```

## Code Examples

### In TypeScript/React

```typescript
import { sendPulseReminderService } from '@/lib/reminders/sendpulse-reminder-service'
import { NotificationChannel } from '@/types/reminders'

// Send subscription renewal reminder
async function notifyRenewal(user, subscription) {
  const reminder = {
    userId: user.id,
    phone: user.whatsapp,
    email: user.email,
    name: user.name,
    message: `Olá ${user.name}! Sua assinatura será renovada em 3 dias. Valor: R$ ${subscription.monthlyValue}`,
    subject: 'Renovação de Assinatura',
    quickReplies: [
      'Confirmar renovação',
      'Alterar pagamento',
      'Falar com suporte'
    ],
    metadata: {
      subscriptionId: subscription.id,
      renewalDate: subscription.renewalDate
    }
  }

  const success = await sendPulseReminderService.sendReminder(
    reminder,
    NotificationChannel.WHATSAPP
  )

  return success
}
```

### With ML Channel Prediction

```typescript
import { MLService } from '@/lib/reminders/ml-service'

async function sendSmartReminder(user, message) {
  // Predict best channel based on user behavior
  const prediction = await MLService.predictBestChannel(user.id)
  
  const reminder = {
    userId: user.id,
    phone: user.whatsapp,
    email: user.email,
    name: user.name,
    message
  }

  // Use predicted channel
  const success = await sendPulseReminderService.sendReminder(
    reminder,
    prediction.channel
  )

  // Fallback to secondary channel if failed
  if (!success && prediction.fallback.length > 0) {
    await sendPulseReminderService.sendReminder(
      reminder,
      prediction.fallback[0]
    )
  }
}
```

## API Response Examples

### Success Response
```json
{
  "success": true,
  "message": "Reminder sent successfully via WHATSAPP",
  "channel": "WHATSAPP"
}
```

### Scheduled Response
```json
{
  "success": true,
  "status": "scheduled",
  "message": "Reminder scheduled",
  "scheduledAt": "2024-10-17T13:00:00.000Z",
  "channel": "WHATSAPP"
}
```

### Bulk Response
```json
{
  "success": true,
  "result": {
    "sent": 48,
    "failed": 2,
    "total": 50,
    "successRate": "96.00%"
  },
  "channel": "WHATSAPP"
}
```

### Error Response
```json
{
  "error": "Failed to send reminder",
  "details": "Phone number is required for WhatsApp reminders"
}
```

## Testing

### Test SendPulse Connection
```bash
curl http://localhost:3000/api/sendpulse?action=test
```

### Test Single Reminder
```bash
curl -X POST http://localhost:3000/api/reminders/send \
  -H "Content-Type: application/json" \
  -d '{
    "reminder": {
      "userId": "test_user",
      "phone": "+5533998980026",
      "message": "Test reminder"
    },
    "channel": "WHATSAPP"
  }'
```

## Next Steps

1. **Configure Environment Variables**
   - Set up SendPulse API tokens
   - Configure database connection

2. **Run Database Migration**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Test Integration**
   - Send test reminders via API
   - Verify SendPulse delivery
   - Check webhook functionality

4. **Implement Use Cases**
   - Subscription renewals
   - Delivery notifications
   - Appointment reminders
   - Promotional campaigns

5. **Monitor Performance**
   - Track delivery rates
   - Analyze user engagement
   - Optimize channel selection

## Documentation

- **Complete Guide**: `docs/SENDPULSE_REMINDER_INTEGRATION.md`
- **SendPulse API**: `docs/SENDPULSE_INTEGRATION.md`
- **Reminder System**: `docs/REMINDER_SYSTEM_SUMMARY.md`
- **API Reference**: Endpoint documentation in route files

## Support

For issues or questions:
- Review documentation in `/docs`
- Check SendPulse API status
- Verify environment variables
- Test with sample payloads

## Status

✅ **Completed**
- SendPulse client integration
- Multi-channel support (WhatsApp, SMS, Email)
- API endpoints for send/schedule/bulk
- Contact management
- Quick reply buttons
- Email HTML formatting

📋 **Pending**
- Database migration execution
- Environment variable configuration
- Production testing
- ML model training data
- Push notification support

🔄 **In Progress**
- Webhook processing optimization
- Analytics dashboard
- Campaign management UI
