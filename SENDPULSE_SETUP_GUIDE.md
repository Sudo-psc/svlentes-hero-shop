# SendPulse WhatsApp Integration - Setup Guide

## Prerequisites

1. **SendPulse Account**: Create an account at https://sendpulse.com
2. **WhatsApp Business API**: Verified WhatsApp Business account connected to SendPulse
3. **Server Access**: Ability to set environment variables in production

## Step-by-Step Setup

### 1. Create SendPulse Account and Get API Credentials

1. Go to https://sendpulse.com and sign up
2. Navigate to **Settings** → **API**
3. Click **Add New API User**
4. Copy your **Client ID** and **Client Secret**
5. Save these credentials securely

### 2. Connect WhatsApp Business to SendPulse

1. In SendPulse dashboard, go to **WhatsApp** section
2. Click **Connect WhatsApp Business Account**
3. Follow the Facebook Business verification process
4. Complete the WhatsApp Business API setup
5. Verify your WhatsApp Business phone number

### 3. Configure Environment Variables

Add the following to your `.env.production` file:

```bash
# SendPulse API Credentials
SENDPULSE_CLIENT_ID="your-client-id-here"
SENDPULSE_CLIENT_SECRET="your-client-secret-here"
SENDPULSE_WEBHOOK_SECRET="generate-a-random-secret-here"

# WhatsApp Configuration
NEXT_PUBLIC_WHATSAPP_NUMBER="553399898026"
WHATSAPP_VERIFY_TOKEN="your-verify-token-here"
```

**Generate secure secrets:**
```bash
# For SENDPULSE_WEBHOOK_SECRET
openssl rand -hex 32

# For WHATSAPP_VERIFY_TOKEN
openssl rand -hex 16
```

### 4. Set Up Webhook in SendPulse

1. In SendPulse dashboard, go to **WhatsApp** → **Settings**
2. Find the **Webhook URL** section
3. Enter your webhook URL:
   ```
   https://svlentes.com.br/api/webhooks/sendpulse
   ```
4. Enter your `SENDPULSE_WEBHOOK_SECRET` in the webhook secret field
5. Select events to receive:
   - ✅ Message Received
   - ✅ Message Sent
   - ✅ Message Delivered
   - ✅ Message Read
   - ✅ Message Failed
6. Save the webhook configuration
7. Click **Test Webhook** to verify it's working

### 5. Deploy and Restart Application

```bash
# On production server
cd /home/runner/work/svlentes-hero-shop/svlentes-hero-shop

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Restart the service
sudo systemctl restart svlentes-nextjs

# Check status
sudo systemctl status svlentes-nextjs
```

### 6. Verify Integration

#### Test 1: Check API Health
```bash
curl https://svlentes.com.br/api/health-check
```

#### Test 2: Send Test Message (requires valid credentials)
```bash
curl -X POST https://svlentes.com.br/api/sendpulse/messages \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "message": "Test message from SV Lentes"
  }'
```

Expected response:
```json
{
  "success": true,
  "messageId": "msg_xxx",
  "status": "sent",
  "timestamp": "2025-10-16T21:00:00.000Z"
}
```

#### Test 3: Use Interactive Test Tool
```bash
# From project directory
node scripts/test-sendpulse.js
```

### 7. Monitor Logs

```bash
# View application logs
journalctl -u svlentes-nextjs -f

# Filter for SendPulse events
journalctl -u svlentes-nextjs -f | grep SendPulse

# View last 100 lines
journalctl -u svlentes-nextjs -n 100
```

## Common Issues and Solutions

### Issue 1: Authentication Failed

**Error:** `SendPulse authentication failed`

**Solution:**
1. Verify `SENDPULSE_CLIENT_ID` and `SENDPULSE_CLIENT_SECRET` are correct
2. Check if API user is active in SendPulse dashboard
3. Ensure no extra spaces in environment variables

### Issue 2: Webhook Not Receiving Messages

**Error:** No webhook events received

**Solution:**
1. Verify webhook URL is correctly set in SendPulse: `https://svlentes.com.br/api/webhooks/sendpulse`
2. Check if webhook secret matches `SENDPULSE_WEBHOOK_SECRET`
3. Test webhook manually in SendPulse dashboard
4. Check server firewall allows incoming connections
5. Verify SSL certificate is valid

### Issue 3: Message Send Failed

**Error:** `Failed to send WhatsApp message`

**Solution:**
1. Verify phone number format (must include country code without +)
2. Check if recipient has WhatsApp installed
3. Ensure WhatsApp Business account is verified
4. Check SendPulse account limits and quotas
5. Review SendPulse dashboard for any errors

### Issue 4: Invalid Phone Number

**Error:** `Invalid phone number`

**Solution:**
- Phone numbers must be in format: `[country_code][number]`
- Example: `5511999999999` (Brazil: 55, Area: 11, Number: 999999999)
- Remove any spaces, dashes, or special characters
- Do not include the `+` symbol

## Testing Scenarios

### Scenario 1: Customer Initiates Conversation

1. Customer sends "Olá" to your WhatsApp Business number
2. SendPulse receives message
3. Webhook triggers at `/api/webhooks/sendpulse`
4. System detects it's a general greeting
5. Automatic welcome response is sent via SendPulse
6. Customer receives welcome message with options

**Expected Log Output:**
```
Processing SendPulse event: message_received
Incoming message from 5511999999999 (João Silva): { type: 'text', text: 'Olá', ... }
Message sent via SendPulse to 5511999999999: { message_id: 'msg_123', status: 'sent' }
```

### Scenario 2: Customer Asks About Pricing

1. Customer sends "Quanto custa o plano?"
2. System detects pricing keywords
3. Automatic pricing response sent
4. Customer receives plan details

### Scenario 3: Customer Wants to Schedule

1. Customer sends "Quero agendar consulta"
2. System detects consultation keywords
3. Automatic consultation response sent
4. Customer receives scheduling information

### Scenario 4: Website Lead Converts to WhatsApp

1. User fills form on website
2. Frontend calls `/api/sendpulse/messages` with context
3. Message sent to customer via SendPulse
4. Customer receives personalized message

## Monitoring and Analytics

### Key Metrics to Track

1. **Message Volume**
   - Messages sent per day
   - Messages received per day
   - Response time

2. **Conversation Success**
   - Conversations started
   - Conversations converted to consultations
   - Average conversation length

3. **Error Rate**
   - Failed message sends
   - Webhook processing errors
   - Authentication failures

### Log Monitoring Commands

```bash
# Count messages sent today
journalctl -u svlentes-nextjs --since today | grep "Message sent via SendPulse" | wc -l

# Count messages received today
journalctl -u svlentes-nextjs --since today | grep "Incoming message from" | wc -l

# View errors only
journalctl -u svlentes-nextjs -p err -n 50

# Export logs for analysis
journalctl -u svlentes-nextjs --since "2025-10-16" --until "2025-10-17" > sendpulse-logs.txt
```

## Production Checklist

Before going live, verify:

- [ ] SendPulse API credentials configured correctly
- [ ] Webhook URL accessible from internet
- [ ] HTTPS/SSL certificate valid
- [ ] Webhook secret is secure and matches SendPulse config
- [ ] WhatsApp Business account verified and active
- [ ] Phone number format tested and working
- [ ] All automatic responses reviewed and approved
- [ ] Error handling tested
- [ ] Monitoring and alerting configured
- [ ] Backup plan documented
- [ ] Team trained on using the system

## Rollback Plan

If issues occur in production:

1. **Disable webhook in SendPulse dashboard**
   - This stops incoming message processing
   - Existing messages will queue

2. **Revert environment variables**
   ```bash
   # Temporarily remove SendPulse credentials
   # This disables outgoing messages
   ```

3. **Restart application**
   ```bash
   sudo systemctl restart svlentes-nextjs
   ```

4. **Fall back to manual WhatsApp Web**
   - Direct customers to use web form
   - Manual response via WhatsApp Web

## Support Resources

- **SendPulse Documentation**: https://sendpulse.com/api
- **SendPulse Support**: support@sendpulse.com
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp
- **Integration Code**: See `SENDPULSE_INTEGRATION.md`

## Next Steps

1. Test thoroughly in staging environment
2. Configure SendPulse templates for common responses
3. Set up monitoring dashboards
4. Train support team on new system
5. Create runbooks for common operations
6. Plan phased rollout (10% → 50% → 100% of traffic)
