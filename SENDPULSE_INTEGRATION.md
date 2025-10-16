# SendPulse WhatsApp Integration

## Overview

This integration uses SendPulse as an intermediary service to send and receive WhatsApp messages. SendPulse provides a robust API for managing WhatsApp Business communications, including:

- Sending text messages
- Sending template messages
- Receiving incoming messages via webhooks
- Contact management
- Message status tracking

## Architecture

```
┌─────────────────┐      ┌──────────────┐      ┌─────────────────┐
│   SV Lentes     │◄────►│  SendPulse   │◄────►│   WhatsApp      │
│   Application   │      │     API      │      │   Business API  │
└─────────────────┘      └──────────────┘      └─────────────────┘
```

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```bash
# SendPulse API Credentials
SENDPULSE_CLIENT_ID="your-client-id"
SENDPULSE_CLIENT_SECRET="your-client-secret"
SENDPULSE_WEBHOOK_SECRET="your-webhook-secret"

# WhatsApp Configuration
NEXT_PUBLIC_WHATSAPP_NUMBER="553399898026"
WHATSAPP_VERIFY_TOKEN="your-verify-token"
```

### Getting SendPulse Credentials

1. Sign up for a SendPulse account at https://sendpulse.com
2. Navigate to Settings → API → WhatsApp
3. Create a new API user and obtain your Client ID and Client Secret
4. Configure your WhatsApp Business account in SendPulse
5. Set up webhook URL for receiving messages

## API Endpoints

### 1. Send Messages via SendPulse

**Endpoint:** `POST /api/sendpulse/messages`

Send WhatsApp messages using SendPulse as the intermediary.

#### Request Body

```json
{
  "phone": "5511999999999",
  "message": "Custom message text",
  "context": "consultation",
  "userData": {
    "nome": "João Silva",
    "email": "joao@example.com"
  },
  "contextData": {
    "page": "pricing",
    "planInterest": "Premium"
  }
}
```

#### Response

```json
{
  "success": true,
  "messageId": "msg_12345",
  "status": "sent",
  "timestamp": "2025-10-16T21:00:00.000Z"
}
```

### 2. Receive Messages from SendPulse

**Endpoint:** `POST /api/webhooks/sendpulse`

Webhook endpoint for receiving incoming WhatsApp messages from SendPulse.

#### Webhook Payload Example

```json
{
  "event": "message_received",
  "timestamp": 1697500800,
  "contact": {
    "phone": "5511999999999",
    "name": "João Silva"
  },
  "message": {
    "id": "msg_12345",
    "type": "text",
    "text": "Quero agendar uma consulta"
  }
}
```

### 3. Get Contact Information

**Endpoint:** `GET /api/sendpulse/messages?phone=5511999999999`

Retrieve contact information from SendPulse.

## Automatic Response System

The integration includes an intelligent automatic response system that processes incoming messages based on keywords:

### Response Triggers

| Keywords | Response Type | Action |
|----------|--------------|--------|
| "agendar", "consulta" | Consultation | Provides consultation scheduling information |
| "plano", "preço", "valor" | Pricing | Shows available subscription plans |
| "ajuda", "suporte" | Support | Displays support menu with options |
| Others | Default | Welcome message with service options |

### Example Automatic Responses

#### Consultation Request
```
Ótimo! Você gostaria de agendar uma consulta com Dr. Philipe? 📅

Nosso horário de atendimento é:
• Segunda a Sexta: 8h às 18h
• Sábado: 8h às 12h

Para agendar, compartilhe sua preferência de:
1. Dia da semana
2. Período (manhã/tarde)
```

#### Pricing Inquiry
```
Veja nossos planos de assinatura SV Lentes: 💰

🔹 Plano Básico - R$ 149/mês
🔹 Plano Premium - R$ 249/mês
🔹 Plano VIP - R$ 349/mês
```

## Integration with Existing WhatsApp System

The SendPulse integration complements the existing WhatsApp redirect system:

1. **Frontend interactions** → Generate contextual messages → Send via SendPulse API
2. **Incoming messages** → SendPulse webhook → Automatic response processor
3. **Support team** → Can send manual messages via SendPulse API

## Usage Examples

### Sending a Message from Backend

```typescript
import { getSendPulseClient } from '@/lib/sendpulse';

const client = getSendPulseClient();

// Send text message
await client.sendTextMessage(
  '5511999999999',
  'Olá! Sua consulta foi agendada para amanhã às 10h.'
);

// Send template message
await client.sendTemplateMessage(
  '5511999999999',
  'appointment_reminder',
  {
    name: 'João',
    date: '17/10/2025',
    time: '10:00'
  }
);
```

### Handling Webhook Events

The webhook handler automatically processes incoming messages:

```typescript
// Webhook receives message
{
  "event": "message_received",
  "contact": { "phone": "5511999999999" },
  "message": { "text": "Quero agendar consulta" }
}

// System automatically sends appropriate response
// based on message content
```

## Security

### Webhook Signature Verification

All webhook requests are verified using HMAC-SHA256:

```typescript
const signature = request.headers.get('X-SendPulse-Signature');
const isValid = verifyWebhookSignature(payload, signature, webhookSecret);
```

### API Authentication

SendPulse API uses OAuth 2.0 client credentials flow:
- Token automatically refreshed when expired
- Secure credential storage in environment variables
- No credentials exposed to client-side code

## Testing

Run the SendPulse integration tests:

```bash
npm test -- sendpulse
```

### Manual Testing

1. **Test message sending:**
```bash
curl -X POST http://localhost:3000/api/sendpulse/messages \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "message": "Test message"
  }'
```

2. **Test webhook (using SendPulse webhook simulator):**
```bash
curl -X POST http://localhost:3000/api/webhooks/sendpulse \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message_received",
    "contact": {"phone": "5511999999999"},
    "message": {"id": "1", "type": "text", "text": "Olá"}
  }'
```

## Monitoring and Logs

All SendPulse interactions are logged for monitoring:

```
Processing SendPulse event: message_received
Incoming message from 5511999999999 (João Silva): {...}
Message sent via SendPulse to 5511999999999: {...}
```

Monitor logs using:
```bash
# Production (systemd)
journalctl -u svlentes-nextjs -f | grep SendPulse

# Development
npm run dev | grep SendPulse
```

## Error Handling

The integration includes comprehensive error handling:

- **Authentication failures** → Automatic retry with new token
- **Rate limiting** → Exponential backoff
- **Invalid phone numbers** → Validation and error response
- **Network errors** → Logged and reported to monitoring system

## Next Steps

1. **Set up SendPulse account** and obtain API credentials
2. **Configure environment variables** in production
3. **Set webhook URL** in SendPulse dashboard: `https://svlentes.com.br/api/webhooks/sendpulse`
4. **Test integration** with development phone number
5. **Monitor webhook events** and message delivery
6. **Customize automatic responses** based on business needs

## Resources

- [SendPulse API Documentation](https://sendpulse.com/api)
- [SendPulse WhatsApp Guide](https://sendpulse.com/support/whatsapp-api)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

## Support

For issues with the integration:
1. Check logs for error messages
2. Verify API credentials are correct
3. Ensure webhook URL is properly configured in SendPulse
4. Review SendPulse account status and limits
