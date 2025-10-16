# SendPulse WhatsApp Integration Guide

This guide explains how to integrate SV Lentes chatbot with SendPulse WhatsApp API.

## Overview

The system has been migrated to use SendPulse as an intermediary for WhatsApp messaging, providing:
- Reliable message delivery
- Webhook handling for incoming messages
- Contact management
- Message status tracking
- Interactive messaging support

## Prerequisites

1. **SendPulse Account**: Active SendPulse account with WhatsApp API access
2. **API Tokens**: SendPulse API token and webhook verification token
3. **Approved WhatsApp Business**: Verified WhatsApp Business number

## Configuration

### Environment Variables

Add these variables to your `.env.local` file:

```bash
# SendPulse WhatsApp Integration
SENDPULSE_API_TOKEN=your_sendpulse_api_token_here
SENDPULSE_WEBHOOK_TOKEN=your_webhook_verification_token_here
NEXT_PUBLIC_SENDPULSE_PHONE_NUMBER_ID=your_phone_number_id_here
```

### Getting SendPulse Credentials

1. **API Token**:
   - Go to [SendPulse Dashboard](https://sendpulse.com)
   - Navigate to Settings → API
   - Create new API token with WhatsApp permissions
   - Copy the token to `SENDPULSE_API_TOKEN`

2. **Webhook Token**:
   - In SendPulse WhatsApp settings, configure webhooks
   - Generate a verification token
   - Copy to `SENDPULSE_WEBHOOK_TOKEN`

3. **Phone Number ID**:
   - In WhatsApp Business settings, find your phone number ID
   - Copy to `NEXT_PUBLIC_SENDPULSE_PHONE_NUMBER_ID`

## API Endpoints

### SendPulse Management API

#### Test Connection
```bash
GET /api/sendpulse?action=test
```

#### Get Account Info
```bash
GET /api/sendpulse?action=account
```

#### Register Webhook
```bash
POST /api/sendpulse
{
  "action": "register-webhook",
  "webhookUrl": "https://svlentes.shop/api/webhooks/sendpulse"
}
```

#### Send Message
```bash
POST /api/sendpulse
{
  "action": "send-message",
  "phone": "+553399898026",
  "message": "Hello from SV Lentes!",
  "quickReplies": ["Option 1", "Option 2"]
}
```

#### Create Contact
```bash
POST /api/sendpulse
{
  "action": "create-contact",
  "phone": "+553399898026",
  "name": "Customer Name",
  "email": "customer@example.com",
  "variables": {
    "subscription_status": "active",
    "last_order": "2024-01-15"
  },
  "tags": ["vip", "subscription"]
}
```

### Webhook Endpoint

#### Incoming Messages (Brazilian API)
SendPulse sends WhatsApp messages to:
```
POST /api/webhooks/sendpulse
```

Brazilian API webhook payload structure:
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "business_account_id",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "phone_number_id": "your_phone_number_id"
        },
        "contacts": [{
          "profile": {
            "name": "Customer Name"
          },
          "wa_id": "553399898026"
        }],
        "messages": [{
          "from": "553399898026",
          "id": "msg_123",
          "timestamp": "1705315400",
          "text": {
            "body": "Hello, I need help with my contact lenses"
          },
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}
```

#### Legacy Webhook Format (for backward compatibility)
```json
{
  "event": "message.new",
  "message": {
    "id": "msg_123",
    "text": {
      "body": "Hello"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "from": "+553399898026",
    "to": "+5533112345678"
  },
  "contact": {
    "id": "contact_456",
    "name": "Customer Name",
    "phone": "+553399898026",
    "variables": {},
    "tags": []
  }
}
```

## Integration Architecture

### Message Flow

1. **Customer sends WhatsApp message**
2. **SendPulse receives message** and forwards to webhook
3. **Webhook processor** extracts message content and contact info
4. **LangChain processor** analyzes intent and generates response
5. **SendPulse client** sends response back via WhatsApp
6. **Support system** tracks conversation and creates tickets if needed

### Components

1. **SendPulse Client** (`/src/lib/sendpulse-client.ts`)
   - Manages API communication
   - Handles message sending/receiving
   - Contact management
   - Webhook registration

2. **Webhook Handler** (`/src/app/api/webhooks/sendpulse/route.ts`)
   - Processes incoming webhooks
   - Integrates with LangChain for AI processing
   - Manages conversation flow
   - Handles escalation

3. **Management API** (`/src/app/api/sendpulse/route.ts`)
   - Administrative functions
   - Testing utilities
   - Webhook registration
   - Manual message sending

## Testing

### Test Webhook Reception

```bash
# Test webhook with sample message
curl -X POST http://localhost:3000/api/webhooks/sendpulse \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message.new",
    "message": {
      "id": "test_msg_123",
      "text": {
        "body": "Olá, preciso de ajuda com minhas lentes"
      },
      "timestamp": "2024-01-15T10:30:00Z",
      "from": "+553399898026",
      "to": "+5533112345678"
    },
    "contact": {
      "id": "test_contact_456",
      "name": "Cliente Teste",
      "phone": "+553399898026"
    }
  }'
```

### Test Message Sending

```bash
# Send test message
curl -X POST http://localhost:3000/api/sendpulse \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send-message",
    "phone": "+553399898026",
    "message": "Olá! Como posso ajudar você hoje?",
    "quickReplies": ["Ver produtos", "Falar com atendente", "Agendar consulta"]
  }'
```

## Message Types Supported

### Text Messages
- Plain text content
- Supports Portuguese language

### Interactive Messages
- **Quick Reply Buttons**: Up to 10 options
- **List Messages**: Multiple sections with rows
- **Button Messages**: Call-to-action buttons

### Media Messages
- **Images**: JPG, PNG, GIF (up to 5MB)
- **Documents**: PDF, DOC, DOCX (up to 25MB)
- **Audio**: MP3, OGG (up to 16MB)
- **Video**: MP4, 3GP (up to 16MB)

## Error Handling

### Common Errors

1. **Invalid API Token**:
   - Check `SENDPULSE_API_TOKEN` environment variable
   - Verify token permissions in SendPulse dashboard

2. **Webhook Verification Failed**:
   - Ensure `SENDPULSE_WEBHOOK_TOKEN` matches webhook configuration
   - Check webhook URL is accessible

3. **Phone Number Format**:
   - Use international format: +55DD900000000
   - Remove special characters: ( ) -

4. **Message Size Limits**:
   - Text: 4096 characters
   - Media: Respect file size limits

### Logging

All SendPulse interactions are logged:
```javascript
console.log(`SendPulse message sent to ${phone}:`, result)
console.log(`Quick replies: ${quickReplies.join(', ')}`)
console.error('SendPulse API error:', error)
```

## Security

### Webhook Security
- Token-based verification
- HTTPS required for production
- Request validation

### API Security
- Bearer token authentication
- Request rate limiting
- Input sanitization

## Monitoring

### Health Checks
Monitor these metrics:
- Webhook response time
- Message delivery success rate
- API error rates
- Conversation completion rates

### Analytics
Track via support analytics dashboard:
- Conversation volume
- Intent classification accuracy
- Escalation rates
- Customer satisfaction

## Troubleshooting

### Debug Mode
Enable verbose logging by setting:
```bash
DEBUG=sendpulse:*
```

### Common Issues

1. **Messages not arriving**:
   - Check webhook registration
   - Verify phone number format
   - Check SendPulse account status

2. **Slow responses**:
   - Check OpenAI API response time
   - Verify network connectivity
   - Monitor webhook processing time

3. **Intent detection issues**:
   - Review LangChain prompts
   - Check message preprocessing
   - Validate training data

## Migration from Direct WhatsApp API

To migrate from the previous WhatsApp Cloud API integration:

1. **Update environment variables** with SendPulse tokens
2. **Register new webhook** URL with SendPulse
3. **Test message flow** using SendPulse endpoints
4. **Update any external integrations** to use new webhook URL
5. **Monitor performance** and adjust as needed

## Support

For SendPulse-specific issues:
- [SendPulse Documentation](https://sendpulse.com/integrations/whatsapp)
- [SendPulse Support](https://sendpulse.com/support)

For integration issues:
- Check application logs
- Test with SendPulse management API
- Verify webhook configuration