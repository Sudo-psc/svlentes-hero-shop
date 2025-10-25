# SendPulse SMS Integration Setup

**Created**: 2025-10-25
**Purpose**: Configure SendPulse SMS channel for order and delivery notifications

## Overview

SendPulse already integrated for WhatsApp chatbot - extending to SMS notifications for:
- Order status updates
- Tracking confirmations
- Delivery notifications
- Cancellation alerts
- Support ticket assignments

## SendPulse SMS Configuration

### 1. Environment Variables

Add to `.env.local`:
```bash
# SendPulse SMS Configuration
SENDPULSE_SMS_ENABLED=true
SENDPULSE_SMS_SENDER_NAME="SVLentes" # Max 11 characters
SENDPULSE_SMS_DEFAULT_COUNTRY="+55" # Brazil country code
```

### 2. SendPulse SMS API Endpoints

```typescript
// SMS Sending Endpoint
POST https://api.sendpulse.com/sms/send

// Headers
Authorization: Bearer ${SENDPULSE_ACCESS_TOKEN}
Content-Type: application/json

// Payload
{
  "phones": ["+5533999898026"],  // Array of phone numbers with country code
  "message": "Your order has been shipped! Track: BR123456789",
  "sender": "SVLentes"  // Sender name (max 11 chars)
}
```

### 3. Notification Service Integration

Create `/src/lib/sendpulse-sms-client.ts`:

```typescript
import { sendPulseAuthClient } from './sendpulse-auth'

export interface SMSNotification {
  phone: string  // Format: +5533999898026
  message: string
  metadata?: {
    orderId?: string
    ticketId?: string
    type: 'order_status' | 'tracking' | 'delivery' | 'cancellation' | 'support'
  }
}

export class SendPulseSMSClient {
  private async getAccessToken(): Promise<string> {
    // Reuse existing SendPulse authentication
    const auth = await sendPulseAuthClient.ensureValidToken()
    return auth.access_token
  }

  async sendSMS(notification: SMSNotification): Promise<boolean> {
    const token = await this.getAccessToken()

    const response = await fetch('https://api.sendpulse.com/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phones: [notification.phone],
        message: notification.message,
        sender: process.env.SENDPULSE_SMS_SENDER_NAME || 'SVLentes'
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[SendPulse SMS] Send failed:', error)
      return false
    }

    return true
  }

  // Send order status notification
  async sendOrderStatus(phone: string, orderNumber: string, status: string): Promise<boolean> {
    const message = `SVLentes: Seu pedido ${orderNumber} foi ${status}. Acompanhe em svlentes.shop/area-assinante`
    return this.sendSMS({
      phone,
      message,
      metadata: { orderId: orderNumber, type: 'order_status' }
    })
  }

  // Send tracking update
  async sendTrackingUpdate(phone: string, trackingCode: string): Promise<boolean> {
    const message = `SVLentes: Seu pedido foi postado! Código de rastreio: ${trackingCode}. Acompanhe nos Correios.`
    return this.sendSMS({
      phone,
      message,
      metadata: { type: 'tracking' }
    })
  }

  // Send delivery confirmation
  async sendDeliveryConfirmation(phone: string, orderNumber: string): Promise<boolean> {
    const message = `SVLentes: Seu pedido ${orderNumber} foi entregue! Como foi sua experiência? Avalie em svlentes.shop`
    return this.sendSMS({
      phone,
      message,
      metadata: { orderId: orderNumber, type: 'delivery' }
    })
  }

  // Send cancellation notification
  async sendCancellationNotification(phone: string, orderNumber: string, reason: string): Promise<boolean> {
    const message = `SVLentes: Seu pedido ${orderNumber} foi cancelado. Motivo: ${reason}. Dúvidas? WhatsApp: (33) 98606-1427`
    return this.sendSMS({
      phone,
      message,
      metadata: { orderId: orderNumber, type: 'cancellation' }
    })
  }

  // Send support ticket assignment
  async sendTicketAssignment(phone: string, ticketNumber: string, agentName: string): Promise<boolean> {
    const message = `SVLentes: Seu ticket ${ticketNumber} foi atribuído para ${agentName}. Aguarde retorno em breve.`
    return this.sendSMS({
      phone,
      message,
      metadata: { ticketId: ticketNumber, type: 'support' }
    })
  }
}

export const sendPulseSMS = new SendPulseSMSClient()
```

### 4. Usage in API Endpoints

Update existing order status endpoint:

```typescript
// src/app/api/admin/orders/[id]/status/route.ts

import { sendPulseSMS } from '@/lib/sendpulse-sms-client'

// After updating order status
if (newStatus === 'SHIPPED' && order.trackingCode) {
  const user = await prisma.user.findUnique({
    where: { id: order.subscription.userId }
  })

  if (user?.phone) {
    await sendPulseSMS.sendTrackingUpdate(
      user.phone,
      order.trackingCode
    )
  }
}

if (newStatus === 'DELIVERED') {
  const user = await prisma.user.findUnique({
    where: { id: order.subscription.userId }
  })

  if (user?.phone) {
    await sendPulseSMS.sendDeliveryConfirmation(
      user.phone,
      order.id
    )
  }
}
```

## SendPulse SMS Pricing (Brazil)

**SendPulse SMS Rates**:
- Brazil (local): ~R$ 0.10 per SMS
- SMS character limit: 160 characters (Portuguese)
- Concatenated SMS: 2-3 parts for longer messages
- Delivery rate: 95-98% in Brazil

**Monthly Estimates**:
- 100 orders/month × 2 SMS each = 200 SMS
- Cost: ~R$ 20/month
- Included in SendPulse subscription: Check current plan

## Implementation Checklist

- [x] Add Prescription Prisma model
- [x] Add TicketHistory Prisma model
- [x] Document SendPulse SMS integration
- [ ] Create `/src/lib/sendpulse-sms-client.ts`
- [ ] Update order status API to send SMS
- [ ] Update support ticket API to send SMS
- [ ] Add SMS notification preferences to User model
- [ ] Test SMS delivery to Brazilian numbers
- [ ] Add error handling and retry logic
- [ ] Monitor SMS delivery rates

## LGPD Compliance

**User Consent Required**:
- Explicit opt-in for SMS notifications
- Add SMS consent checkbox to registration
- Store consent in ConsentLog model
- Allow opt-out at any time

**Opt-Out Mechanism**:
- Include "Responda SAIR para cancelar" in each SMS
- Webhook to handle opt-out responses
- Update user preferences immediately

## Error Handling

**SMS Send Failures**:
1. Log failure to database
2. Create Notification record with status = FAILED
3. Retry after 5 minutes (max 3 retries)
4. Escalate to WhatsApp if SMS fails
5. Create support ticket for persistent failures

## Testing

**Test SMS Delivery**:
```typescript
// Test in development
import { sendPulseSMS } from '@/lib/sendpulse-sms-client'

await sendPulseSMS.sendSMS({
  phone: '+5533999898026',  // Test number
  message: 'Teste de SMS - SVLentes',
  metadata: { type: 'order_status' }
})
```

## Monitoring

**Track SMS Metrics**:
- Delivery rate per notification type
- Average delivery time
- Opt-out rate
- Cost per month
- Failure patterns

Store in `AnalyticsSnapshot.smsMetrics`:
```json
{
  "sent": 200,
  "delivered": 196,
  "failed": 4,
  "optOuts": 2,
  "deliveryRate": 0.98,
  "avgCostPerSMS": 0.10
}
```

## Next Steps

1. **Activate SMS in SendPulse Dashboard**
   - Login to SendPulse
   - Enable SMS channel
   - Configure sender name
   - Add credits for Brazil

2. **Implement SMS Client**
   - Create `/src/lib/sendpulse-sms-client.ts`
   - Add authentication reuse
   - Test with development number

3. **Update APIs**
   - Order status notifications (TODO #6)
   - Tracking updates (TODO #7)
   - Delivery confirmations (TODO #8)
   - Cancellation alerts (TODO #9)
   - Support assignments (TODO #10)

4. **Add User Preferences**
   - SMS consent checkbox
   - Opt-in/opt-out management
   - Notification preferences

---

**Status**: ✅ **DOCUMENTED** - Ready for implementation
**Unblocks**: TODOs #6, #7, #8, #9, #10 (5 notification TODOs)
