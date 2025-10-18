# Security Guidelines - SendPulse WhatsApp Integration

## Overview

This document provides security guidelines for the SendPulse WhatsApp chatbot integration, including known vulnerabilities, mitigation strategies, and implementation recommendations.

---

## 🔴 Critical Security Issues

### 1. Webhook Signature Verification (HIGH PRIORITY)

**Status**: ⚠️ **NOT IMPLEMENTED**

**Risk Level**: HIGH

**Description**:
The webhook endpoint (`/api/webhooks/sendpulse`) currently does not validate cryptographic signatures from SendPulse. This makes the endpoint vulnerable to spoofing attacks where malicious actors could inject fake messages.

**Current Implementation**:
```typescript
// src/lib/sendpulse-client.ts:612-616
validateWebhook(payload: string, signature: string): boolean {
  // TODO: Implement webhook signature validation if SendPulse provides it
  return !!this.webhookToken
}
```

**Impact**:
- Unauthorized message injection
- Fake customer interactions
- Data integrity compromise
- Potential LGPD violations from processing unverified data

**Mitigation Steps**:

#### Step 1: Check SendPulse API Documentation
Verify if SendPulse WhatsApp API provides webhook signature validation:
- Review: https://sendpulse.com/integrations/api/whatsapp
- Check webhook documentation for signature headers
- Common header names: `X-SendPulse-Signature`, `X-Webhook-Signature`, `X-Hub-Signature`

#### Step 2: Implement HMAC Verification (if supported)
```typescript
import crypto from 'crypto'

validateWebhook(payload: string, signature: string): boolean {
  if (!this.webhookToken) {
    throw new Error('SENDPULSE_WEBHOOK_TOKEN not configured')
  }

  // Generate HMAC signature
  const hmac = crypto
    .createHmac('sha256', this.webhookToken)
    .update(payload)
    .digest('hex')

  // Timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hmac)
  )
}
```

#### Step 3: Update Webhook Handler
```typescript
// src/app/api/webhooks/sendpulse/route.ts
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-sendpulse-signature')

    // Validate signature
    if (!signature || !sendPulseClient.validateWebhook(rawBody, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    const body = JSON.parse(rawBody)
    // ... rest of webhook processing
  } catch (error) {
    // ...
  }
}
```

#### Step 4: Alternative - IP Whitelisting (if no signature support)
If SendPulse doesn't provide signature validation:
```typescript
const SENDPULSE_IP_RANGES = [
  // Add SendPulse IP ranges from their documentation
  '1.2.3.4/24',
  '5.6.7.8/24',
]

function isFromSendPulse(request: NextRequest): boolean {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip

  return SENDPULSE_IP_RANGES.some(range => {
    // Use ip-range-check library
    return ipRangeCheck(ip, range)
  })
}
```

---

## 🟡 Medium Priority Issues

### 2. Environment Variable Validation

**Status**: ✅ **IMPLEMENTED** (via `env-validator.ts`)

**Description**:
Environment validation utility now enforces required configuration on startup.

**Usage**:
```typescript
// Add to application initialization (e.g., middleware.ts or layout.tsx)
import { requireValidSendPulseEnv } from '@/lib/sendpulse/env-validator'

// Validate on startup (fails fast if misconfigured)
requireValidSendPulseEnv()
```

### 3. Rate Limiting

**Status**: ✅ **IMPLEMENTED** (via `rate-limiter.ts`)

**Description**:
Token bucket rate limiter prevents API abuse.

**Recommendation**: Add additional rate limiting at webhook endpoint level:
```typescript
// Using Next.js middleware or Vercel Edge Config
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
})

export async function POST(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // ... webhook processing
}
```

### 4. Error Information Leakage

**Status**: ✅ **PARTIALLY FIXED**

**Remaining Issues**:
- Some `console.error()` calls still expose internal details
- Error responses may include stack traces

**Recommendation**:
```typescript
// Use structured logger everywhere
import { logger, LogCategory } from '@/lib/logger'

// Instead of:
console.error('SendPulse API error:', error)

// Use:
logger.error(LogCategory.API, 'SendPulse API request failed', error, {
  endpoint: '/contacts/send',
  // Phone numbers will be automatically sanitized
})
```

---

## 🟢 Best Practices Implemented

### ✅ LGPD Compliance - PII Sanitization

**Implementation**: Phone number masking in logger (`logger.ts:298-303`)

Example:
```typescript
// Before: 5533999898026
// After:  5533****8026
```

All phone numbers in logs are automatically sanitized for LGPD compliance.

### ✅ OAuth2 Token Management

**Implementation**: Secure token caching with expiry (`sendpulse-auth.ts`)
- Tokens cached with 60-second safety margin
- No tokens logged or exposed in responses
- Automatic refresh on expiry

### ✅ Error Handling

**Implementation**: Custom error classes (`sendpulse/errors.ts`)
- `SendPulseContactError`: Contact operation failures
- `SendPulseMessageError`: Message sending failures
- `ConversationWindowExpiredError`: 24-hour window violations

---

## Security Checklist

### Pre-Production

- [ ] **Implement webhook signature verification** (HIGH PRIORITY)
- [ ] **Test webhook security** with invalid signatures
- [ ] **Enable IP whitelisting** if signature validation not available
- [ ] **Configure rate limiting** at Nginx/Vercel level
- [ ] **Review all environment variables** are set correctly
- [ ] **Test error handling** doesn't expose sensitive data
- [ ] **Audit all console.log statements** and replace with structured logger

### Production

- [ ] **Enable production logging** to external service (DataDog, Sentry)
- [ ] **Monitor webhook endpoint** for suspicious activity
- [ ] **Set up alerts** for failed authentication attempts
- [ ] **Regular security audits** of SendPulse integration
- [ ] **Rotate webhook tokens** every 90 days
- [ ] **Review access logs** for unauthorized access attempts

### LGPD Compliance

- [ ] **Verify phone number masking** in all logs
- [ ] **Implement data retention policy** (90-day conversation history)
- [ ] **Document data processing** activities
- [ ] **Implement user data export** functionality
- [ ] **Implement user data deletion** functionality
- [ ] **Audit third-party data sharing** (SendPulse)

---

## Incident Response

### Suspected Webhook Compromise

1. **Immediate Actions**:
   - Rotate `SENDPULSE_WEBHOOK_TOKEN` immediately
   - Update token in SendPulse dashboard
   - Review recent webhook logs for suspicious activity
   - Check for unauthorized message sends

2. **Investigation**:
   - Audit all messages received in last 24 hours
   - Identify any fake customer interactions
   - Review database for data integrity issues
   - Check for LGPD compliance violations

3. **Recovery**:
   - Implement webhook signature verification
   - Add IP whitelisting as additional layer
   - Notify affected customers if PII exposed
   - Document incident for compliance reporting

### OAuth Token Exposure

1. **Immediate Actions**:
   - Rotate `SENDPULSE_APP_ID` and `SENDPULSE_APP_SECRET`
   - Invalidate all active sessions
   - Review API usage logs for unauthorized access

2. **Prevention**:
   - Ensure `.env.local` is in `.gitignore`
   - Never commit credentials to version control
   - Use secret management service (Vercel Secrets, AWS Secrets Manager)
   - Enable 2FA on SendPulse account

---

## Contact Security Team

For security concerns or to report vulnerabilities:

**Email**: saraivavision@gmail.com
**WhatsApp**: +55 33 99989-8026

**Responsible Disclosure**:
We follow responsible disclosure practices. Please report security issues privately before public disclosure.

---

## References

- [SendPulse API Documentation](https://sendpulse.com/integrations/api/whatsapp)
- [OWASP Webhook Security](https://owasp.org/www-community/vulnerabilities/Webhook_Security)
- [LGPD Official Guidelines](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
- [WhatsApp Business API Security](https://developers.facebook.com/docs/whatsapp/business-management-api/guides/security)

---

**Last Updated**: 2025-10-17
**Document Version**: 1.0
**Maintained By**: SVLentes Development Team
