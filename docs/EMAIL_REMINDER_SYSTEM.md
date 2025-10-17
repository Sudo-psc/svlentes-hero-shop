# Email Reminder System - SV Lentes

## Overview

The SV Lentes reminder system now uses **email as the primary communication channel** via the Resend API. This change was made after discovering that SendPulse's WhatsApp API does not support programmatic message sending.

## ✅ What's Working

### Email Delivery System
- **Service**: Resend API
- **Status**: ✅ Fully functional
- **Free Tier**: 3,000 emails/month
- **From Address**: `contato@svlentes.com.br`
- **Deliverability**: Excellent

### Reminder Types Implemented

1. **Subscription Renewal** (`subscription_renewal`)
   - 3 days before renewal
   - 1 day before renewal
   - On renewal day

2. **Order Delivery** (`order_delivery`)
   - Order shipped notification
   - Tracking code included
   - Estimated delivery date

3. **Appointment Reminder** (`appointment`)
   - Medical follow-up appointments
   - Date and time details
   - Location information

4. **General Reminders** (`general`)
   - Custom notifications
   - Flexible message format

## Architecture

### Core Files

#### Email Reminder Service
**File**: `src/lib/reminders/email-reminder-service.ts`

```typescript
import { emailReminderService } from '@/lib/reminders/email-reminder-service'

// Send subscription renewal reminder
await emailReminderService.sendSubscriptionRenewalReminder(
  'user@example.com',
  'John Doe',
  3, // days until renewal
  '20/10/2025' // renewal date
)

// Send order delivery reminder
await emailReminderService.sendOrderDeliveryReminder(
  'user@example.com',
  'John Doe',
  'BR123456789BR', // tracking code
  '22/10/2025' // estimated delivery
)

// Send custom reminder
await emailReminderService.sendReminder({
  userId: 'user-123',
  email: 'user@example.com',
  name: 'John Doe',
  message: 'Custom message here',
  reminderType: 'general',
  metadata: { custom: 'data' }
})
```

#### Email Service (Base)
**File**: `src/lib/email.ts`

Base email sending functionality used by reminder service.

### API Endpoints

#### 1. Send Single Reminder
**Endpoint**: `POST /api/reminders/send`

**Request**:
```json
{
  "reminder": {
    "userId": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "message": "Your subscription renews in 3 days!",
    "subject": "Subscription Renewal Reminder",
    "reminderType": "subscription_renewal"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Reminder sent successfully via email",
  "channel": "EMAIL"
}
```

#### 2. Send Bulk Reminders
**Endpoint**: `POST /api/reminders/bulk`

**Request**:
```json
{
  "reminders": [
    {
      "userId": "user-1",
      "email": "user1@example.com",
      "name": "User One",
      "message": "Reminder 1"
    },
    {
      "userId": "user-2",
      "email": "user2@example.com",
      "name": "User Two",
      "message": "Reminder 2"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "result": {
    "sent": 2,
    "failed": 0,
    "total": 2,
    "successRate": "100.00%"
  },
  "channel": "EMAIL"
}
```

#### 3. Schedule Reminder
**Endpoint**: `POST /api/reminders/schedule`

Currently sends immediately. For scheduled sending, integrate with a job queue (see Future Enhancements).

## Email Templates

### Design System
- **Primary Color**: Cyan (#06b6d4)
- **Gradient**: 135deg, #06b6d4 → #0891b2
- **Font**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
- **Max Width**: 600px (optimal for email clients)

### Template Structure
1. **Header**: SV Lentes branding with gradient
2. **Greeting**: Personalized with user's name
3. **Message Box**: Highlighted with left border and icon
4. **Action Button**: Call-to-action (CTA) link
5. **Help Section**: Contact information
6. **Footer**: Company info and unsubscribe notice

### Icons by Type
- 🔔 Subscription Renewal
- 📦 Order Delivery
- 👓 Appointment
- 💬 General

## Configuration

### Environment Variables

```bash
# Resend API (Required)
RESEND_API_KEY=re_your_api_key_here

# Email Configuration
NEXT_PUBLIC_EMAIL_FROM=contato@svlentes.com.br
EMAIL_FROM=SV Lentes <noreply@svlentes.shop>
```

### Resend Setup

1. **Sign up** at [resend.com](https://resend.com)
2. **Add domain**: svlentes.com.br
3. **Verify DNS records**:
   - SPF: `v=spf1 include:_spf.resend.com ~all`
   - DKIM: Provided by Resend
   - DMARC: `v=DMARC1; p=none`
4. **Generate API key**
5. **Add to `.env.local`**

## Testing

### Test Scripts

#### 1. Direct Resend API Test
```bash
node scripts/test-resend-direct.js
```
Tests basic Resend connectivity.

#### 2. Complete Email Reminder Test
```bash
node scripts/test-email-inline.mjs
```
Tests all 4 reminder types end-to-end.

**Expected Output**:
```
✅ Passed: 4/4
📬 Check your inbox at: contato@svlentes.com.br
```

### Manual Testing via API

```bash
# Test single reminder
curl -X POST http://localhost:3000/api/reminders/send \
  -H "Content-Type: application/json" \
  -d '{
    "reminder": {
      "userId": "test",
      "email": "your@email.com",
      "name": "Test User",
      "message": "Test reminder",
      "reminderType": "general"
    }
  }'
```

## Usage Examples

### Subscription Renewal Flow

```typescript
// In your subscription service
import { emailReminderService } from '@/lib/reminders/email-reminder-service'

async function checkUpcomingRenewals() {
  const subscriptions = await getSubscriptionsRenewingIn(3) // 3 days
  
  for (const sub of subscriptions) {
    await emailReminderService.sendSubscriptionRenewalReminder(
      sub.user.email,
      sub.user.name,
      3,
      sub.renewalDate
    )
  }
}
```

### Order Shipping Notification

```typescript
import { emailReminderService } from '@/lib/reminders/email-reminder-service'

async function notifyOrderShipped(order) {
  await emailReminderService.sendOrderDeliveryReminder(
    order.user.email,
    order.user.name,
    order.trackingCode,
    order.estimatedDelivery
  )
}
```

### Appointment Reminders

```typescript
import { emailReminderService } from '@/lib/reminders/email-reminder-service'

async function sendAppointmentReminders() {
  const appointments = await getAppointmentsTomorrow()
  
  for (const apt of appointments) {
    await emailReminderService.sendAppointmentReminder(
      apt.user.email,
      apt.user.name,
      apt.date,
      apt.time
    )
  }
}
```

## Performance & Limits

### Resend API Limits
- **Free Tier**: 3,000 emails/month
- **Rate Limit**: 10 requests/second
- **Batch Size**: 100 recipients per request
- **Email Size**: 40 MB maximum

### Recommendations
- **Bulk Operations**: Use `/api/reminders/bulk` for multiple emails
- **Rate Limiting**: Add 200ms delay between bulk sends
- **Error Handling**: Retry failed sends with exponential backoff
- **Monitoring**: Track success/failure rates

## Troubleshooting

### Common Issues

#### 1. Emails Not Sending
- ✅ Check RESEND_API_KEY is set
- ✅ Verify domain is verified in Resend
- ✅ Check email address format
- ✅ Review Resend logs at resend.com/logs

#### 2. Emails Going to Spam
- ✅ Verify SPF/DKIM/DMARC records
- ✅ Use authenticated domain
- ✅ Avoid spam trigger words
- ✅ Include unsubscribe link

#### 3. API Errors
- ✅ Check API rate limits
- ✅ Verify request payload structure
- ✅ Check server logs: `journalctl -u svlentes-nextjs -f`

## Future Enhancements

### Scheduled Sending
Integrate with job queue for true scheduled sending:

**Options**:
- **BullMQ** (Redis-based, recommended)
- **Agenda** (MongoDB-based)
- **node-cron** (Simple, in-process)

**Implementation**:
```typescript
import { Queue } from 'bullmq'

const emailQueue = new Queue('email-reminders', {
  connection: { host: 'localhost', port: 6379 }
})

await emailQueue.add('send-reminder', {
  reminder: {...},
  sendAt: new Date('2025-10-20T10:00:00')
}, {
  delay: calculateDelay(sendAt)
})
```

### Analytics & Tracking
- Open rate tracking (Resend supports this)
- Click-through rate monitoring
- Bounce/complaint handling
- Engagement metrics dashboard

### Advanced Features
- **A/B Testing**: Test different subject lines/content
- **Personalization**: Dynamic content based on user data
- **Templates**: Visual template builder
- **Multilingual**: i18n support for emails

## Migration from SendPulse

### What Changed
- ❌ SendPulse WhatsApp API (not supported)
- ✅ Resend Email API (primary channel)
- ✅ Same reminder logic and scheduling
- ✅ Improved template design
- ✅ Better deliverability

### Deprecated Files
- `src/lib/sendpulse-whatsapp.ts` - WhatsApp client (keep for reference)
- `src/lib/reminders/sendpulse-reminder-service.ts` - Multi-channel service (replaced)

### New Files
- `src/lib/reminders/email-reminder-service.ts` - Email-only service
- `scripts/test-email-inline.mjs` - Comprehensive email tests

## Support

### Resources
- [Resend Documentation](https://resend.com/docs)
- [Email Best Practices](https://resend.com/docs/best-practices)
- [SendPulse API Limitations](./SENDPULSE_API_LIMITATIONS.md)

### Contact
- **Technical Issues**: Check project issues
- **Email Deliverability**: Contact Resend support
- **Feature Requests**: Create GitHub issue

## Summary

✅ **Email reminders fully functional**  
✅ **4 reminder types implemented**  
✅ **Professional HTML templates**  
✅ **Tested end-to-end**  
✅ **3,000 free emails/month**  
✅ **Production-ready**

The email reminder system is now the primary notification channel for SV Lentes, providing reliable, professional, and scalable communication with subscribers.
