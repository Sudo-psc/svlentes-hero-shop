# SendPulse WhatsApp API Limitations - Technical Investigation

## Date: 2025-10-17

## Investigation Summary

After extensive API testing, we've discovered that **SendPulse's REST API does NOT support programmatic WhatsApp message sending** via standard POST endpoints.

## Test Results

### ✅ Working Endpoints (Read-Only)
- `GET /oauth/access_token` - OAuth2 authentication
- `GET /whatsapp/account` - Account information
- `GET /whatsapp/bots` - List configured bots
- `GET /whatsapp/contacts` - List contacts
- `GET /whatsapp/chats` - Get conversations
- `GET /whatsapp/templates` - List templates (empty)

### ❌ Non-Working Endpoints (404 Not Found)
- `POST /whatsapp/contacts/sendMessage` - Send message
- `POST /whatsapp/contacts/{id}/reply` - Reply to contact
- `POST /whatsapp/contacts/{id}/send` - Send to contact
- `POST /whatsapp/messages/send` - Send message
- `POST /whatsapp/send` - Direct send
- `POST /whatsapp/bots/{id}/message` - Bot message
- `POST /chatbots/messages/send` - Chatbot message
- `POST /whatsapp/flows/trigger` - Trigger flow
- `GET /whatsapp/bots/{id}/flows` - Get flows
- `GET /whatsapp/bots/{id}/triggers` - Get triggers

## Root Cause Analysis

### 1. **SendPulse is a Chatbot Platform, Not a Message API**
SendPulse WhatsApp integration is designed for:
- **Incoming message handling** (webhooks)
- **Automated chatbot responses** (flow-based)
- **Interactive chatbot UI** (web interface)

It is NOT designed for:
- Programmatic outbound messages
- Reminder systems
- Notification broadcasting
- Transactional messages via API

### 2. **WhatsApp Business API Restrictions**
WhatsApp Business API has strict rules:
- **24-hour window**: Can only send free-form messages within 24h of user's last message
- **Template messages**: Outside 24h window, must use pre-approved templates
- **No cold messaging**: Cannot initiate conversations without user opt-in

SendPulse likely:
- Restricts API access to comply with WhatsApp policies
- Forces users to use chatbot flows (controlled environment)
- Prevents API abuse and policy violations

### 3. **SendPulse Business Model**
SendPulse monetizes through:
- Chatbot builder subscriptions
- Flow automation tools
- Web-based campaign management

Providing full API access would:
- Bypass their chatbot builder
- Reduce platform value
- Risk WhatsApp compliance issues

## Recommended Solutions

### Option 1: WhatsApp Cloud API (Direct Integration) ⭐ RECOMMENDED
**Pros:**
- Full programmatic control
- Native WhatsApp features
- Free tier: 1,000 conversations/month
- Well-documented REST API
- Template message support
- Rich media support

**Cons:**
- Requires Facebook Business Manager setup
- Need to create/approve message templates
- More complex initial setup

**Implementation:**
```typescript
// Use official WhatsApp Business API
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

async function sendWhatsAppMessage(to: string, message: string) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: 'reminder_notification',
          language: { code: 'pt_BR' },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: message }]
            }
          ]
        }
      })
    }
  )
  return response.json()
}
```

### Option 2: Twilio WhatsApp API
**Pros:**
- Simple integration
- Good documentation
- Pay-as-you-go pricing
- Template approval through Twilio

**Cons:**
- Not free (pricing per message)
- Still requires template approval

### Option 3: Keep SendPulse for Chatbot Only
**Use SendPulse for:**
- Customer support chatbot
- Interactive FAQ
- Webhook-based responses

**Use separate service for:**
- Reminders (Email + SMS via Resend/Twilio)
- Transactional notifications (Email)
- Bulk campaigns (Email)

## Immediate Action Plan

### Phase 1: Pivot to Email/SMS (Already Working)
Since we already have **Resend API** configured for email:
1. ✅ Email reminders (already configured)
2. Add SMS via Twilio (if needed)
3. Keep SendPulse for chatbot support only

### Phase 2: WhatsApp Cloud API Setup (Optional)
If WhatsApp reminders are critical:
1. Create Facebook Business Manager account
2. Set up WhatsApp Business Account
3. Get phone number verified
4. Create message templates
5. Wait for template approval (24-48 hours)
6. Integrate WhatsApp Cloud API

### Phase 3: Update Documentation
- Update system architecture docs
- Remove SendPulse message sending code
- Add WhatsApp Cloud API integration guide

## Files to Update

### Remove/Deprecate:
- ❌ `src/lib/sendpulse-whatsapp.ts` - sendMessage methods
- ❌ `src/lib/reminders/sendpulse-reminder-service.ts` - WhatsApp channel
- ❌ All test scripts for message sending

### Keep:
- ✅ `src/app/api/webhooks/sendpulse/route.ts` - For chatbot webhooks
- ✅ OAuth2 client - For reading contacts/chats

### Add (if going with WhatsApp Cloud API):
- ➕ `src/lib/whatsapp-cloud-api.ts` - Direct WhatsApp integration
- ➕ `src/lib/reminders/whatsapp-reminder-service.ts` - New reminder service

## Cost Comparison

### SendPulse (Current)
- Free: 1,000 conversations/month
- Works for: Chatbot only
- Cannot do: Programmatic messages ❌

### WhatsApp Cloud API
- Free: 1,000 conversations/month
- Works for: Everything
- Full API access ✅

### Email (Resend - Already Have)
- Free: 3,000 emails/month
- Works perfectly for reminders ✅

## Recommendation

**For SVlentes use case (subscription reminders):**

1. **Primary channel: Email** ✅
   - Resend API already configured
   - Perfect for subscription reminders
   - No restrictions, full control

2. **Secondary channel: SMS** (if needed)
   - Add Twilio SMS API
   - Reliable for urgent notifications

3. **WhatsApp: Phase 2** (optional enhancement)
   - Migrate to WhatsApp Cloud API
   - Use only for critical reminders
   - Requires template approval process

4. **SendPulse: Keep for chatbot**
   - Customer support automation
   - FAQ responses
   - Interactive conversations

## Next Steps

1. **Immediate (Today):**
   - Update reminder system to use Email as primary channel
   - Remove WhatsApp sending code from SendPulse client
   - Document SendPulse as "Chatbot/Webhook only"

2. **Short-term (This Week):**
   - Test email reminder flow end-to-end
   - Set up SMS via Twilio (optional)
   - Configure SendPulse webhook for support chatbot

3. **Long-term (Next Month):**
   - Evaluate need for WhatsApp reminders
   - If needed: Set up WhatsApp Cloud API
   - Create and submit message templates

## References

- [WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [SendPulse Chatbot Guide](https://sendpulse.com/knowledge-base/chatbot/)
- [Resend API Docs](https://resend.com/docs)
