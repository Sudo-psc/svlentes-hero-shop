# SendPulse WhatsApp - Quick Reference Card

## 🔑 Environment Variables

```bash
SENDPULSE_CLIENT_ID=your-client-id
SENDPULSE_CLIENT_SECRET=your-client-secret
SENDPULSE_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_WHATSAPP_NUMBER=553399898026
```

## 📡 API Endpoints

### Send Message
```bash
POST /api/sendpulse/messages
Content-Type: application/json

{
  "phone": "5511999999999",
  "message": "Your message text",
  "context": "consultation"  # optional
}
```

### Webhook (Receive Messages)
```bash
POST /api/webhooks/sendpulse
# Automatically configured in SendPulse dashboard
```

### Get Contact
```bash
GET /api/sendpulse/messages?phone=5511999999999
```

## 🤖 Automatic Response Keywords

| Keywords | Response |
|----------|----------|
| agendar, consulta | Consultation scheduling info |
| plano, preço, valor | Pricing and plans |
| ajuda, suporte | Support menu |
| others | Welcome message |

## 🔧 Testing Commands

```bash
# Interactive test tool
node scripts/test-sendpulse.js

# Send test message
curl -X POST http://localhost:3000/api/sendpulse/messages \
  -H "Content-Type: application/json" \
  -d '{"phone": "5511999999999", "message": "Test"}'

# Simulate webhook
curl -X POST http://localhost:3000/api/webhooks/sendpulse \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message_received",
    "contact": {"phone": "5511999999999"},
    "message": {"id": "1", "type": "text", "text": "Olá"}
  }'
```

## 📊 Monitoring

```bash
# View SendPulse logs
journalctl -u svlentes-nextjs -f | grep SendPulse

# Count messages today
journalctl -u svlentes-nextjs --since today | grep "Message sent via SendPulse" | wc -l

# View errors
journalctl -u svlentes-nextjs -p err -n 50 | grep SendPulse
```

## 🚨 Quick Troubleshooting

| Issue | Check |
|-------|-------|
| Auth failed | Verify CLIENT_ID and CLIENT_SECRET |
| No webhooks | Check webhook URL in SendPulse dashboard |
| Message not sent | Verify phone format (no + symbol) |
| Invalid signature | Check WEBHOOK_SECRET matches SendPulse |

## 📚 Documentation

- **Full Integration**: `SENDPULSE_INTEGRATION.md`
- **Setup Guide**: `SENDPULSE_SETUP_GUIDE.md`
- **Code**: `src/lib/sendpulse.ts`
- **Tests**: `src/lib/__tests__/sendpulse.test.ts`

## 🔗 External Links

- [SendPulse API Docs](https://sendpulse.com/api)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [SendPulse Dashboard](https://sendpulse.com/login)
