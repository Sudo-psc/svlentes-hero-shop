# Security Key Rotation Guide

**🔴 CRITICAL SECURITY INCIDENT RESPONSE**

This guide provides step-by-step instructions for rotating all API keys and credentials that were exposed in the `.env.local` file. This incident occurred on 2025-11-05 when production secrets were committed to version control.

---

## ⚠️ Incident Summary

**Date**: 2025-11-05
**Severity**: CRITICAL
**Impact**: Production API keys exposed in `.env.local` file
**Status**: Remediation in progress

**Exposed Credentials**:
1. ✅ Stripe Live API Keys (Secret Key + Webhook Secret)
2. ✅ Firebase Admin Service Account Private Key
3. ✅ OpenAI API Key
4. ✅ LangChain API Key
5. ✅ Airtable Personal Access Token
6. ✅ Resend API Key
7. ✅ SendPulse App ID, App Secret, Bot ID
8. ⚠️ PostgreSQL Database Password

---

## 🚨 Immediate Actions Required

### Priority 1: Payment Gateways (CRITICAL)

#### 1.1 Stripe Key Rotation

**Why Critical**: Direct access to payment processing and customer payment data.

**Steps**:
1. Log in to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Navigate to **Developers → API Keys**
3. Click **"Reveal live key token"** for the exposed secret key
4. Click **"Roll key"** to generate a new secret key immediately
5. Copy the new secret key to `.env.local`:
   ```bash
   STRIPE_SECRET_KEY=sk_live_NEW_KEY_HERE
   ```
6. Update publishable key if needed:
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_NEW_KEY_HERE
   ```
7. Navigate to **Developers → Webhooks**
8. Delete the existing webhook endpoint or rotate the signing secret
9. Update webhook secret in `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_NEW_SECRET_HERE
   ```
10. Test webhook: `stripe trigger payment_intent.succeeded`
11. Restart application: `systemctl restart svlentes-nextjs`
12. Verify payment flow in production

**Verification**:
```bash
# Test Stripe API connection
curl https://api.stripe.com/v1/customers \
  -u "sk_live_NEW_KEY_HERE:" \
  -X GET

# Should return customer list (200 OK)
```


---

### Priority 2: Authentication & Infrastructure

#### 2.1 Firebase Admin SDK Key Rotation

**Why Critical**: Server-side authentication, full Firebase access including user management.

**Steps**:
1. Log in to [Firebase Console](https://console.firebase.google.com)
2. Navigate to **Project Settings → Service Accounts**
3. Click **"Generate new private key"**
4. Download the JSON file (keep it secure)
5. Delete or revoke the old service account key
6. Convert JSON to single-line string (escape newlines):
   ```bash
   cat service-account.json | jq -c . | sed 's/\\/\\\\/g'
   ```
7. Update in `.env.local`:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
   ```
8. Restart application: `systemctl restart svlentes-nextjs`
9. Test authentication flow

**Verification**:
```bash
# Check Firebase Admin initialization in logs
journalctl -u svlentes-nextjs -n 50 | grep "Firebase Admin"

# Should show successful initialization
```

#### 2.2 Database Password Rotation

**Why Important**: Direct access to all application data including user information.

**Steps**:
1. Connect to PostgreSQL as superuser:
   ```bash
   docker exec -it postgres psql -U postgres
   ```
2. Change password for n8nuser:
   ```sql
   ALTER USER n8nuser WITH PASSWORD 'NEW_SECURE_PASSWORD_HERE';
   ```
3. Update in `.env.local`:
   ```bash
   DATABASE_URL="postgresql://n8nuser:NEW_SECURE_PASSWORD_HERE@localhost:5433/svlentes_subscribers?schema=public"
   ```
4. Update in n8n configuration if used:
   ```bash
   cd /root/approuter
   # Update .env file
   POSTGRES_PASSWORD=NEW_SECURE_PASSWORD_HERE
   ```
5. Restart services:
   ```bash
   systemctl restart svlentes-nextjs
   docker compose restart postgres
   ```
6. Test database connection:
   ```bash
   npx prisma db pull
   ```

---

### Priority 3: External Services

#### 3.1 OpenAI API Key Rotation

**Why Important**: AI-powered customer support, potential cost abuse if exposed.

**Steps**:
1. Log in to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Navigate to **API Keys**
3. Click **"Revoke"** on the exposed key
4. Click **"Create new secret key"**
5. Copy the new key to `.env.local`:
   ```bash
   OPENAI_API_KEY=sk-proj-NEW_KEY_HERE
   ```
6. Restart application: `systemctl restart svlentes-nextjs`
7. Test AI chatbot functionality

**Verification**:
```bash
# Test OpenAI API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-proj-NEW_KEY_HERE"

# Should return model list (200 OK)
```

#### 3.2 LangChain/LangSmith Key Rotation

**Why Important**: AI monitoring and debugging access.

**Steps**:
1. Log in to [LangSmith](https://smith.langchain.com/settings)
2. Navigate to **Settings → API Keys**
3. Delete the exposed key
4. Click **"Create API Key"**
5. Copy the new key to `.env.local`:
   ```bash
   LANGCHAIN_API_KEY=lsv2_pt_NEW_KEY_HERE
   ```
6. Restart application: `systemctl restart svlentes-nextjs`

#### 3.3 Airtable Token Rotation

**Why Important**: Access to subscription management data.

**Steps**:
1. Log in to [Airtable](https://airtable.com/create/tokens)
2. Navigate to **Account → Tokens**
3. Revoke the exposed personal access token
4. Create a new token with permissions:
   - `data.records:read`
   - `data.records:write`
5. Update in `.env.local`:
   ```bash
   AIRTABLE_API_KEY=pat_NEW_TOKEN_HERE
   ```
6. Restart application: `systemctl restart svlentes-nextjs`

**Verification**:
```bash
# Test Airtable API
curl "https://api.airtable.com/v0/meta/bases" \
  -H "Authorization: Bearer pat_NEW_TOKEN_HERE"

# Should return bases list (200 OK)
```

#### 3.4 Resend Email Key Rotation

**Why Important**: Email service access for transactional emails.

**Steps**:
1. Log in to [Resend](https://resend.com/api-keys)
2. Navigate to **API Keys**
3. Delete the exposed key
4. Click **"Create API Key"**
5. Update in `.env.local`:
   ```bash
   RESEND_API_KEY=re_NEW_KEY_HERE
   ```
6. Restart application: `systemctl restart svlentes-nextjs`
7. Test email sending functionality

**Verification**:
```bash
# Test Resend API
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer re_NEW_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"from":"test@yourdomain.com","to":"test@example.com","subject":"Test","html":"Test"}'

# Should return email ID (200 OK)
```

#### 3.5 SendPulse Credentials Rotation

**Why Important**: WhatsApp Business integration and customer communication.

**Steps**:
1. Log in to [SendPulse](https://sendpulse.com/integrations/whatsapp)
2. Navigate to **Integrations → WhatsApp → API**
3. Regenerate App ID and App Secret:
   - Click **"Regenerate credentials"**
4. Update in `.env.local`:
   ```bash
   SENDPULSE_APP_ID=NEW_APP_ID_HERE
   SENDPULSE_APP_SECRET=NEW_APP_SECRET_HERE
   SENDPULSE_BOT_ID=VERIFY_BOT_ID_HERE

   # Legacy aliases
   SENDPULSE_CLIENT_ID=NEW_APP_ID_HERE
   SENDPULSE_CLIENT_SECRET=NEW_APP_SECRET_HERE
   ```
5. Verify Bot ID is correct (may not need rotation)
6. Restart application: `systemctl restart svlentes-nextjs`
7. Test WhatsApp webhook functionality

**Verification**:
- Send test WhatsApp message to chatbot number
- Verify webhook receives message
- Check logs: `journalctl -u svlentes-nextjs -f | grep "SendPulse"`

---

## 📋 Post-Rotation Checklist

### Application Health Checks

```bash
# 1. Check application status
systemctl status svlentes-nextjs

# 2. View recent logs for errors
journalctl -u svlentes-nextjs -n 100 --no-pager

# 3. Test health endpoint
curl -f https://svlentes.com.br/api/health-check

# 4. Test authenticated endpoints
curl -H "Authorization: Bearer VALID_TOKEN" \
  https://svlentes.com.br/api/assinante/subscription

# 5. Run E2E tests
npm run test:e2e

# 6. Monitor error logs
tail -f /var/log/nginx/error.log
```

### Payment System Verification

```bash
# Test Stripe test mode
# Visit: https://svlentes.com.br/assinar
# Use test card: 4242 4242 4242 4242
```

### WhatsApp Integration Verification

1. Send message to chatbot: +55 33 99989-8026
2. Verify automated response received
3. Check webhook logs: `journalctl -u svlentes-nextjs -f | grep "webhook/sendpulse"`
4. Test AI intent detection with sample queries

---

## 🔒 Security Best Practices Going Forward

### 1. Environment Variable Management

**DO**:
- ✅ Use `.env.local` for local development secrets
- ✅ Use environment variables in production (systemd service file)
- ✅ Keep `.env.local.example` updated with placeholders
- ✅ Document required permissions for each API key
- ✅ Use separate keys for development/staging/production
- ✅ Rotate keys quarterly or after any suspected exposure

**DON'T**:
- ❌ Never commit `.env.local` to version control
- ❌ Never hardcode secrets in source code
- ❌ Never share API keys via Slack/email/chat
- ❌ Never use production keys in development
- ❌ Never log full API keys (mask them)

### 2. Git Configuration

Add to `.gitignore`:
```gitignore
# Environment files
.env
.env.local
.env.*.local
.env.development.local
.env.test.local
.env.production.local

# Backup files
*.env.backup
*.env.old
```

Check current tracking:
```bash
git ls-files | grep "\.env"
```

If `.env.local` is tracked, remove it:
```bash
git rm --cached .env.local
git commit -m "security: remove .env.local from version control"
```

### 3. Secret Scanning

Install git-secrets:
```bash
# On Ubuntu/Debian
apt-get install git-secrets

# Initialize in repository
cd /root/svlentes-hero-shop
git secrets --install
git secrets --register-aws
git secrets --register-azure
```

Add custom patterns:
```bash
git secrets --add 'sk_live_[a-zA-Z0-9]{48}'  # Stripe live keys
git secrets --add 'sk_test_[a-zA-Z0-9]{48}'  # Stripe test keys
git secrets --add 'sk-proj-[a-zA-Z0-9]+'     # OpenAI keys
```

### 4. Access Control

Production environment variables should be set in:
```bash
# Edit systemd service file
sudo systemctl edit svlentes-nextjs

# Add environment variables
[Service]
Environment="STRIPE_SECRET_KEY=sk_live_..."
```

Restrict file permissions:
```bash
chmod 600 /root/svlentes-hero-shop/.env.local
chown root:root /root/svlentes-hero-shop/.env.local
```

### 5. Monitoring & Alerts

Set up alerts for:
- Failed authentication attempts (Firebase, Clerk)
- Unusual API usage patterns (OpenAI, Stripe)
- Webhook failures (Asaas, SendPulse)
- High error rates in logs
- Suspicious database queries

Example monitoring:
```bash
# Watch for authentication errors
journalctl -u svlentes-nextjs -f | grep -i "auth.*error"

# Monitor API rate limits
journalctl -u svlentes-nextjs -f | grep -i "rate.*limit"

# Track payment failures
journalctl -u svlentes-nextjs -f | grep -i "payment.*failed"
```

---

## 📞 Incident Response Contacts

**Technical Lead**: Dr. Philipe Saraiva Cruz
**Email**: saraivavision@gmail.com
**WhatsApp**: +55 33 98606-1427

**Service Providers**:
- **Stripe Support**: https://support.stripe.com
- **Firebase Support**: https://firebase.google.com/support
- **OpenAI Support**: https://help.openai.com

---

## 📊 Rotation Status Tracking

| Service | Priority | Status | Rotated Date | Next Rotation |
|---------|----------|--------|--------------|---------------|
| Stripe | CRITICAL | ⏳ Pending | - | ASAP |
| Firebase Admin | HIGH | ⏳ Pending | - | ASAP |
| OpenAI | MEDIUM | ⏳ Pending | - | ASAP |
| LangChain | MEDIUM | ⏳ Pending | - | ASAP |
| Airtable | MEDIUM | ⏳ Pending | - | ASAP |
| Resend | MEDIUM | ⏳ Pending | - | ASAP |
| SendPulse | MEDIUM | ⏳ Pending | - | ASAP |
| Database Password | LOW | ⏳ Pending | - | Within 7 days |

**Update this table as keys are rotated**.

---

## 🎯 Summary

**Total Exposed Credentials**: 9 services
**Estimated Rotation Time**: 2-3 hours
**Business Impact**: Minimal if completed within 24 hours
**Risk Level**: HIGH until all keys rotated

**Next Steps**:
1. ✅ Secrets removed from `.env.local` (placeholders added)
2. ✅ Created `.env.local.example` template
3. ⏳ Rotate all production keys following this guide
4. ⏳ Verify all services working after rotation
5. ⏳ Implement git-secrets to prevent future incidents
6. ⏳ Set up monitoring alerts
7. ⏳ Schedule quarterly key rotation

---

**Document Version**: 1.0
**Last Updated**: 2025-11-05
**Author**: Claude Code (AI Assistant)
**Reviewed By**: Pending
