# Security Roadmap - SVLentes Healthcare Platform

**Last Updated**: 2025-10-30
**Status**: In Progress
**Compliance Focus**: LGPD, HIPAA-aligned, Healthcare Data Protection

---

## Executive Summary

This document outlines actionable security improvements for the SVLentes platform, addressing identified gaps from security analysis and ensuring compliance with healthcare data protection standards.

---

## Critical Security Tasks

### 🔴 HIGH PRIORITY

#### 1. Password Policy Enhancement
**Status**: ⏳ Pending
**Owner**: Backend Team
**Target Date**: 2025-11-15
**Priority**: 🔴 CRITICAL

**Current State**:
- Basic password validation exists
- No complexity requirements enforced

**Required Changes**:
- Increase minimum password length to **12 characters**
- Enforce complexity requirements:
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 digit
  - At least 1 special character (!@#$%^&*)
- Implement password strength meter in UI
- Add password history (prevent reuse of last 5 passwords)

**Implementation Locations**:
- `src/lib/validation/password-schema.ts` - Zod schema update
- `src/app/api/auth/register/route.ts` - Server-side validation
- `src/components/auth/RegisterForm.tsx` - Client-side validation + strength meter
- Database: Add `password_history` table for tracking

**Acceptance Criteria**:
- [ ] Zod schema enforces all complexity rules
- [ ] Server-side validation rejects weak passwords
- [ ] Client shows real-time strength feedback
- [ ] Password history prevents reuse
- [ ] Unit tests cover all validation scenarios
- [ ] E2E tests verify registration flow with weak/strong passwords

**Regulatory Compliance**:
- LGPD Art. 46 - Security measures for sensitive data
- NIST SP 800-63B - Digital Identity Guidelines

---

#### 2. Rate Limiting Implementation
**Status**: ⏳ Pending
**Owner**: Backend Team
**Target Date**: 2025-11-20
**Priority**: 🔴 CRITICAL

**Current State**:
- No rate limiting on authentication endpoints
- Vulnerable to brute force attacks

**Required Changes**:
- Implement rate limiting middleware with configurable thresholds
- **Authentication Endpoints**:
  - `/api/auth/login`: 5 attempts per 15 minutes per IP
  - `/api/auth/register`: 3 attempts per hour per IP
  - `/api/auth/reset-password`: 3 attempts per hour per email
- **CAPTCHA Integration**:
  - Trigger after 3 failed login attempts
  - Use hCaptcha or reCAPTCHA v3
- **IP Blocking**:
  - Temporary block (30 minutes) after 10 failed attempts
  - Permanent block after 50 attempts (manual review required)

**Implementation Locations**:
- `src/middleware/rate-limit.ts` - Core rate limiting logic
- `src/app/api/auth/*/route.ts` - Apply to all auth endpoints
- `src/lib/redis-client.ts` - Redis for distributed rate limit tracking
- Environment: Add `REDIS_URL`, `HCAPTCHA_SECRET_KEY`

**Technology Stack**:
- **upstash/ratelimit** for Redis-based rate limiting
- **hCaptcha** for CAPTCHA challenges
- **Express rate-limit** as fallback for non-Redis environments

**Acceptance Criteria**:
- [ ] Rate limits enforced on all auth endpoints
- [ ] CAPTCHA appears after 3 failures
- [ ] IP blocks activate correctly
- [ ] Admin dashboard shows blocked IPs
- [ ] Monitoring alerts on suspicious activity
- [ ] Load testing confirms performance impact < 5%

**Regulatory Compliance**:
- LGPD Art. 46 - Access control
- OWASP A07:2021 - Identification and Authentication Failures

---

#### 3. Sensitive Data Logging Audit
**Status**: ⏳ Pending
**Owner**: DevOps + Backend Team
**Target Date**: 2025-11-10
**Priority**: 🔴 CRITICAL

**Current State**:
- Console.log statements may expose sensitive data
- No structured logging with PII redaction

**Required Changes**:
- **Audit all logging statements**:
  - Scan codebase for `console.log`, `console.error`, `console.warn`
  - Identify logs containing: email, phone, CPF, prescription data, payment info
- **Implement structured logging**:
  - Use `winston` or `pino` for production
  - Automatic PII redaction for sensitive fields
  - Log levels: ERROR, WARN, INFO, DEBUG (no DEBUG in production)
- **Redaction Rules**:
  - Email: `user@example.com` → `u***@e***.com`
  - Phone: `+5511999998888` → `+55119****8888`
  - CPF: `123.456.789-00` → `***.***.789-**`
  - Tokens: Always redact completely
  - UIDs: Hash or truncate to last 4 chars

**Implementation Locations**:
- `src/lib/logger.ts` - Winston/Pino configuration with redaction
- Replace all `console.*` with `logger.*` calls
- `src/middleware/logging.ts` - Request/response logging middleware
- `.env` - Add `LOG_LEVEL=info` for production

**Code Pattern**:
```typescript
// ❌ BAD
console.log('User login:', user.email, user.uid)

// ✅ GOOD
logger.info('User login successful', {
  userId: hashUserId(user.uid),
  // email is auto-redacted by logger config
})
```

**Acceptance Criteria**:
- [ ] Zero `console.*` calls in production code
- [ ] All logs use structured logger with redaction
- [ ] PII redaction tested for all sensitive fields
- [ ] Log aggregation (e.g., Datadog, LogDNA) configured
- [ ] Audit trail logs are immutable (append-only)
- [ ] Log retention policy: 30 days operational, 1 year audit logs

**Regulatory Compliance**:
- LGPD Art. 46 - Security and confidentiality
- LGPD Art. 37 - Audit logs required for sensitive data processing

---

### 🟡 MEDIUM PRIORITY

#### 4. Webhook Signature Verification
**Status**: ⏳ Pending
**Owner**: Backend Team
**Target Date**: 2025-12-01
**Priority**: 🟡 MEDIUM

**Current State**:
- Asaas webhook endpoints exist but signature verification is incomplete
- Potential for webhook spoofing attacks

**Required Changes**:
- Implement HMAC signature verification for all webhooks:
  - `/api/webhooks/asaas` - Asaas payment webhooks
  - `/api/webhooks/sendpulse` - WhatsApp webhooks
- Reject requests with invalid/missing signatures
- Log all verification failures for security monitoring

**Implementation Locations**:
- `src/lib/webhook-verification.ts` - Shared verification logic
- `src/app/api/webhooks/asaas/route.ts` - Asaas-specific implementation
- `src/app/api/webhooks/sendpulse/route.ts` - SendPulse-specific implementation
- Environment: `ASAAS_WEBHOOK_SECRET`, `SENDPULSE_WEBHOOK_SECRET`

**Acceptance Criteria**:
- [ ] All webhook requests verified before processing
- [ ] Invalid signatures return 401 Unauthorized
- [ ] Security alerts triggered on repeated failures
- [ ] Unit tests mock webhook signatures
- [ ] Documentation updated with verification process

**Regulatory Compliance**:
- OWASP A07:2021 - Identification and Authentication Failures

---

#### 5. Environment Variable Security Audit
**Status**: ⏳ Pending
**Owner**: DevOps Team
**Target Date**: 2025-12-05
**Priority**: 🟡 MEDIUM

**Current State**:
- Production secrets may be hardcoded or improperly managed
- No secrets rotation policy

**Required Changes**:
- **Audit all environment variables**:
  - Verify no secrets in code/config files
  - Ensure all prod secrets use secure secret management (e.g., AWS Secrets Manager, Vercel Secrets)
- **Secrets Rotation**:
  - `NEXTAUTH_SECRET`: Rotate every 90 days
  - `ASAAS_API_KEY_PROD`: Rotate every 180 days
  - `DATABASE_URL`: Rotate password every 90 days
  - OpenAI, Firebase keys: Monitor for leaks, rotate immediately if exposed
- **JWT Configuration**:
  - Remove any fallback to development secrets in production
  - Enforce strong signing algorithms (RS256 or ES256)

**Implementation Locations**:
- `.env.example` - Document all required secrets
- `src/lib/env-validation.ts` - Runtime validation of secrets
- CI/CD - Add secret scanning (e.g., GitGuardian, Snyk)

**Acceptance Criteria**:
- [ ] All production secrets stored in secure secret management
- [ ] No secrets in version control (verify with git-secrets)
- [ ] Rotation schedule documented and automated
- [ ] Secrets validation runs on app startup
- [ ] Failed validation prevents app from starting

**Regulatory Compliance**:
- LGPD Art. 46 - Data security
- OWASP A02:2021 - Cryptographic Failures

---

#### 6. File Upload Security (Prescription Images)
**Status**: ⏳ Pending
**Owner**: Backend Team
**Target Date**: 2025-12-10
**Priority**: 🟡 MEDIUM

**Current State**:
- Prescription upload endpoints exist but security hardening needed
- Mock file storage (TODO: S3/R2 implementation)

**Required Changes**:
- **File Validation**:
  - Allowed types: PDF, JPEG, PNG only
  - Max file size: 10MB
  - Validate MIME type AND file magic numbers (not just extension)
  - Scan for malware (ClamAV or cloud-based scanner)
- **Storage Security**:
  - Implement S3 or Cloudflare R2 (remove mock)
  - Enable server-side encryption (SSE-KMS)
  - Presigned URLs for upload/download (time-limited, single-use)
  - Strict bucket policies (no public access)
- **Access Control**:
  - Only prescription owner can view/download
  - Medical staff with proper authorization
  - Audit log every file access

**Implementation Locations**:
- `src/app/api/assinante/prescription/route.ts` - Upload endpoint hardening
- `src/lib/file-storage.ts` - S3/R2 integration
- `src/lib/file-validation.ts` - File type and malware scanning

**Acceptance Criteria**:
- [ ] File type validation (magic numbers + MIME)
- [ ] Malware scanning on all uploads
- [ ] S3/R2 with encryption enabled
- [ ] Presigned URLs with 15-minute expiry
- [ ] Access control enforced (RBAC)
- [ ] Audit logs for all file operations

**Regulatory Compliance**:
- LGPD Art. 46 - Security of sensitive data
- OWASP A04:2021 - Insecure Design (file upload vulnerabilities)

---

### 🟢 LOW PRIORITY (Nice-to-Have)

#### 7. Content Security Policy (CSP) Hardening
**Status**: ⏳ Pending
**Owner**: Frontend Team
**Target Date**: 2026-01-15
**Priority**: 🟢 LOW

**Current State**:
- CSP headers exist in `next.config.js` but could be stricter

**Required Changes**:
- Tighten CSP directives:
  - `script-src 'self'` (remove 'unsafe-inline' where possible)
  - Add nonce-based script loading for inline scripts
  - `img-src 'self' data: https://trusted-cdn.com`
- Implement CSP reporting:
  - `report-uri /api/csp-report`
  - Monitor violations for XSS attempts

**Acceptance Criteria**:
- [ ] CSP report-only mode tested for 2 weeks
- [ ] No legitimate functionality broken
- [ ] CSP enforced in production
- [ ] Violations monitored and alerted

**Regulatory Compliance**:
- OWASP A03:2021 - Injection (XSS prevention)

---

#### 8. Dependency Vulnerability Scanning
**Status**: 🔄 Ongoing
**Owner**: DevOps Team
**Priority**: 🟢 LOW

**Current State**:
- `npm audit` run manually
- No automated vulnerability monitoring

**Required Changes**:
- Integrate **Snyk** or **Dependabot** for automated scanning
- Weekly vulnerability reports
- Auto-create PRs for security patches
- Block PRs with high/critical vulnerabilities

**Acceptance Criteria**:
- [ ] Automated scanning in CI/CD
- [ ] Vulnerabilities fixed within SLA (Critical: 7 days, High: 30 days)
- [ ] Dashboard shows vulnerability trends

---

## LGPD Compliance Checklist

### Data Protection Requirements
- [ ] **Encryption at Rest**: AES-256 for database and file storage
- [ ] **Encryption in Transit**: TLS 1.3+ for all connections
- [ ] **Access Control**: RBAC with least privilege principle
- [ ] **Audit Trails**: Immutable logs for all sensitive data access (Art. 37)
- [ ] **Consent Management**: Explicit consent recorded for data processing (Art. 7)
- [ ] **Data Minimization**: Only collect necessary data (Art. 6)
- [ ] **Right to Erasure**: Automated data deletion process (Art. 18)
- [ ] **Breach Notification**: Process to notify ANPD within 72 hours (Art. 48)
- [ ] **Data Portability**: Export user data in machine-readable format (Art. 18)
- [ ] **DPIA**: Data Protection Impact Assessment for high-risk processing

### Responsible Parties
- **Data Controller**: SaraivaVision - Dr. Philipe Saraiva Cruz
- **DPO Contact**: [To be assigned]
- **Security Team**: [Assign owner]

---

## Monitoring & Alerting

### Security Metrics Dashboard
- **Authentication Failures**: Alert on >10 failures/minute
- **Rate Limit Triggers**: Alert on >50 blocks/hour
- **Webhook Verification Failures**: Alert on >5 failures/hour
- **File Upload Failures**: Alert on malware detection
- **CSP Violations**: Alert on >100 violations/day
- **Dependency Vulnerabilities**: Weekly digest report

### Tools
- **Monitoring**: Datadog, New Relic, or Prometheus
- **SIEM**: Cloudflare Zero Trust or AWS GuardDuty
- **Incident Response**: PagerDuty or Opsgenie

---

## Pre-Production Deployment Checklist

Before any production deployment, verify:

- [ ] All **HIGH** priority items completed
- [ ] Security testing completed:
  - [ ] OWASP Top 10 penetration testing
  - [ ] Authentication/authorization testing
  - [ ] SQL injection testing
  - [ ] XSS testing
  - [ ] CSRF protection verified
- [ ] Code review completed by security-aware developer
- [ ] Secrets audit: no hardcoded credentials
- [ ] Logging audit: no PII in logs
- [ ] LGPD compliance sign-off from DPO
- [ ] Incident response plan updated
- [ ] Backup and recovery tested

---

## Version History

| Version | Date       | Changes                          | Author       |
|---------|------------|----------------------------------|--------------|
| 1.0     | 2025-10-30 | Initial security roadmap created | Claude Code  |

---

## References

- [LGPD Lei nº 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [OWASP Top 10 (2021)](https://owasp.org/Top10/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CIS Critical Security Controls](https://www.cisecurity.org/controls)
