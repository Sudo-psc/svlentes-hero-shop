# LGPD Implementation Guide - SVLentes Healthcare Platform

**Document Version**: 1.0
**Last Updated**: 2025-10-30
**Compliance Status**: 🟡 In Progress
**Responsible Controller**: SaraivaVision - Dr. Philipe Saraiva Cruz (CRM-MG 69.870)

---

## Executive Summary

This document details the implementation of Lei Geral de Proteção de Dados (LGPD - Brazilian Data Protection Law) compliance measures for the SVLentes contact lens subscription platform. It covers data security, user rights, consent management, and operational procedures to ensure full regulatory compliance.

---

## Table of Contents

1. [Legal Framework & Scope](#legal-framework--scope)
2. [Data Encryption](#data-encryption)
3. [Data Retention Policy](#data-retention-policy)
4. [Audit Trail & Logging](#audit-trail--logging)
5. [Access Controls](#access-controls)
6. [Data Subject Rights (DSR)](#data-subject-rights-dsr)
7. [Consent Management](#consent-management)
8. [Breach Notification](#breach-notification)
9. [Implementation Status Matrix](#implementation-status-matrix)
10. [Responsible Parties](#responsible-parties)

---

## Legal Framework & Scope

### Applicable Legislation
- **LGPD**: Lei nº 13.709/2018 (Brazilian General Data Protection Law)
- **CFM Resolution 2.314/2022**: Telemedicine and digital health services
- **Lei nº 13.787/2018**: Digital prescription regulations

### Data Categories Processed

#### Personal Data (Art. 5, I)
- **Identification**: Name, CPF, email, phone number
- **Address**: Street, city, state, CEP (for delivery)
- **Account**: User ID, registration date, authentication tokens

#### Sensitive Personal Data (Art. 5, II) - Enhanced Protection Required
- **Medical Prescriptions**: Digital copies of contact lens prescriptions
  - Prescription issuer (ophthalmologist CRM)
  - Lens specifications (power, type, brand)
  - Prescription validity period
- **Health Data**: Medical appointment history, consultation records
- **Biometric Data**: None currently collected

#### Legal Bases for Processing (Art. 7 & Art. 11)
| Data Type | Legal Basis | LGPD Article |
|-----------|-------------|--------------|
| Name, email, phone | Execution of contract (subscription service) | Art. 7, V |
| Delivery address | Execution of contract (delivery logistics) | Art. 7, V |
| Medical prescription | Protection of life and health (Art. 11, II) + Explicit consent (Art. 11, I) | Art. 11, I & II |
| Appointment history | Execution of contract + Healthcare provision | Art. 7, V & Art. 11, II |
| Payment data | Execution of contract | Art. 7, V |
| Marketing communications | Explicit consent | Art. 7, I |

---

## Data Encryption

### 1. Encryption at Rest

#### Database Encryption
**Implementation Status**: ✅ IMPLEMENTED
**Location**: PostgreSQL configuration

- **Algorithm**: AES-256
- **Key Management**:
  - Primary: AWS KMS (Key Management Service)
  - Rotation: Automatic key rotation every 90 days
  - Backup keys: Encrypted with master key, stored in separate region
- **Encrypted Tables**:
  - `users` - All columns (especially email, phone, CPF)
  - `subscriptions` - Delivery address, billing info
  - `prescriptions` - File path, metadata, issuer CRM
  - `whatsapp_conversations` - Message content
  - `support_tickets` - Ticket description and comments

**Configuration Reference**: `config/database-encryption.yml`

**Verification Command**:
```bash
# Verify PostgreSQL encryption
SELECT name, setting FROM pg_settings WHERE name LIKE '%encryption%';
```

---

#### File Storage Encryption
**Implementation Status**: ⏳ PENDING (Currently mocked - Issue #42)
**Target**: S3 or Cloudflare R2

**Required Configuration**:
- **Algorithm**: AES-256-GCM
- **Encryption Mode**: Server-Side Encryption with KMS (SSE-KMS)
- **Bucket Policy**:
  - Block all public access
  - Enforce encryption on PUT operations
  - Deny unencrypted uploads

**S3 Example Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::svlentes-prescriptions/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "aws:kms"
        }
      }
    }
  ]
}
```

**Implementation Files** (to be created):
- `src/lib/file-storage.ts` - S3/R2 client with encryption
- `src/app/api/assinante/prescription/upload/route.ts` - Presigned URL generation

---

### 2. Encryption in Transit

#### TLS Configuration
**Implementation Status**: ✅ IMPLEMENTED
**Location**: Nginx reverse proxy (`/etc/nginx/sites-available/svlentes.com.br`)

- **TLS Version**: TLS 1.3 (preferred), TLS 1.2 (minimum)
- **Cipher Suites** (Strong only):
  ```
  TLS_AES_256_GCM_SHA384
  TLS_CHACHA20_POLY1305_SHA256
  TLS_AES_128_GCM_SHA256
  ECDHE-RSA-AES256-GCM-SHA384
  ```
- **HSTS**: Enabled with `max-age=31536000; includeSubDomains; preload`
- **Certificate Authority**: Let's Encrypt (auto-renewed via Certbot)
- **Certificate Expiry Monitoring**: Certbot systemd timer checks daily

**Verification**:
```bash
# Test TLS configuration
openssl s_client -connect svlentes.com.br:443 -tls1_3
# Check HSTS header
curl -I https://svlentes.com.br | grep Strict-Transport-Security
```

---

#### API Communication Security
- **Internal Services**: All service-to-service communication over TLS
- **Third-Party APIs**:
  - Asaas: TLS 1.2+ enforced
  - SendPulse: TLS 1.2+ enforced
  - OpenAI: TLS 1.3
- **Webhook Endpoints**: HMAC signature verification (See SECURITY_ROADMAP.md #4)

---

## Data Retention Policy

### Retention Periods (LGPD Art. 15 & Art. 16)

| Data Category | Retention Period | Legal Basis | Deletion Trigger |
|---------------|------------------|-------------|------------------|
| **Medical Prescriptions** | **20 years** | CFM Resolution 1.638/2002 (minimum medical record retention) | After 20 years OR user deletion request with medical waiver |
| Subscription data (active) | Duration of contract + 5 years | Art. 7, V (contract execution) + fiscal obligations | End of subscription + 5 years |
| Delivery address | Duration of contract + 1 year | Art. 7, V (contract execution) | End of subscription + 1 year |
| Payment history | 5 years | Brazilian tax law (fiscal documents) | 5 years after transaction |
| Support tickets | 2 years | Art. 7, VI (legitimate interest) | 2 years after closure |
| WhatsApp conversations | 90 days | Art. 7, IX (legitimate interest) | 90 days OR user deletion request |
| Audit logs (security) | 1 year | Art. 37 (security audit requirement) | 1 year from creation |
| Audit logs (medical data access) | 5 years | Art. 37 + healthcare regulations | 5 years from access event |
| Marketing consent | Until revoked | Art. 7, I (consent) | Immediate upon revocation |
| Anonymous analytics | Indefinite | Art. 12 (anonymized data exception) | Not applicable |

### Automated Deletion Workflows

**Implementation Status**: ⏳ PARTIALLY IMPLEMENTED
**Location**: `src/lib/data-retention/`

**Cron Jobs** (to be implemented):
```typescript
// Example: Daily cleanup job
// File: src/lib/cron/data-retention-cleanup.ts
import cron from 'node-cron'

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  await deleteExpiredWhatsAppConversations() // 90 days old
  await deleteExpiredSupportTickets() // 2 years old
  await deleteExpiredAuditLogs() // 1 year old (non-medical)
  await anonymizeOldSubscriptions() // 5 years after cancellation
})
```

**Database Indexes for Efficiency**:
```sql
-- Enable efficient date-based deletion
CREATE INDEX idx_whatsapp_created_at ON whatsapp_conversations(created_at);
CREATE INDEX idx_support_tickets_closed_at ON support_tickets(closed_at);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

---

## Audit Trail & Logging

### Purpose (LGPD Art. 37)
**Requirement**: Record all operations involving sensitive personal data, especially medical prescriptions and health information.

### Audit Log Structure

**Implementation Status**: ✅ IMPLEMENTED
**Location**: `audit_logs` table (PostgreSQL)

**Schema**:
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES users(id), -- Who performed the action
  action_type VARCHAR(50) NOT NULL, -- e.g., 'prescription_view', 'data_export'
  resource_type VARCHAR(50) NOT NULL, -- e.g., 'prescription', 'subscription'
  resource_id UUID, -- ID of the affected resource
  ip_address INET, -- Source IP (hashed for LGPD)
  user_agent TEXT, -- Browser/device info
  status VARCHAR(20) NOT NULL, -- 'success', 'denied', 'error'
  metadata JSONB, -- Additional context (must not contain PII)
  hash VARCHAR(64) NOT NULL -- SHA-256 hash of log entry for immutability
);

-- Immutability enforcement
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_update_audit_logs
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
```

**Logged Actions**:
- **Prescription Access**:
  - `prescription_upload` - New prescription uploaded
  - `prescription_view` - Prescription viewed by user/staff
  - `prescription_download` - Prescription file downloaded
  - `prescription_delete` - Prescription deletion requested
- **Data Subject Rights**:
  - `data_export_request` - User requested data export
  - `data_deletion_request` - User requested data deletion
  - `consent_granted` - User granted consent for processing
  - `consent_revoked` - User revoked consent
- **Administrative Access**:
  - `admin_user_view` - Admin viewed user profile
  - `admin_prescription_access` - Admin accessed medical data
  - `support_ticket_access` - Support staff accessed ticket

**Immutability Verification**:
- Each log entry hashed with SHA-256 (includes timestamp + user_id + action)
- Hash stored in `hash` column
- Database trigger prevents UPDATE/DELETE operations
- Periodic hash chain verification job

**Retention**:
- Medical data access logs: 5 years
- Security logs: 1 year
- Stored in append-only database or WORM storage

---

### Log Access Controls
- **Who Can Access Audit Logs**:
  - DPO (Data Protection Officer): Full access
  - System Administrator: Read-only access
  - User: Own audit logs only (via `/api/profile/audit-log`)
- **Authentication**: Multi-factor authentication required for DPO/admin access
- **Monitoring**: Audit log access is itself logged (meta-audit)

---

## Access Controls

### Role-Based Access Control (RBAC)

**Implementation Status**: ✅ PARTIALLY IMPLEMENTED
**Location**: `src/lib/rbac/` + Firebase/Clerk authentication

**Roles**:

#### 1. **Customer** (Subscriber)
**Permissions**:
- ✅ View own subscription details
- ✅ Upload own prescriptions
- ✅ View/download own prescriptions
- ✅ Update delivery address
- ✅ Update payment method
- ✅ Request data export
- ✅ Request account deletion
- ❌ Access other users' data
- ❌ Access admin functions

**Implementation**: `src/middleware/auth-customer.ts`

---

#### 2. **Support Agent**
**Permissions**:
- ✅ View customer subscription status (read-only)
- ✅ View support tickets
- ✅ Create/update support tickets
- ⏳ View limited user data (name, email, subscription ID only - no medical data)
- ❌ Access prescriptions without explicit user consent
- ❌ Modify subscription plans
- ❌ Process refunds

**Implementation**: `src/middleware/auth-support.ts` (to be created)

---

#### 3. **Medical Staff** (Ophthalmologists)
**Permissions**:
- ✅ View prescriptions for verification purposes
- ✅ Validate prescription authenticity
- ✅ Flag invalid prescriptions
- ❌ Access non-medical user data (addresses, payment info)
- ❌ Administrative functions

**Implementation**: `src/middleware/auth-medical.ts` (to be created)

**LGPD Note**: Medical staff access requires:
- Professional CRM registration verification
- Signed confidentiality agreement
- Logged access (audit trail)

---

#### 4. **Administrator**
**Permissions**:
- ✅ Full system access (with audit logging)
- ✅ User management
- ✅ Subscription management
- ✅ Access audit logs
- ✅ Configure system settings

**Implementation**: Firebase custom claims or Clerk organization roles

**LGPD Note**: Admin access to sensitive data requires:
- Multi-factor authentication (MFA)
- Justification for access (recorded in audit log)
- DPO notification for bulk data access

---

### Principle of Least Privilege
- **Default Deny**: All actions denied unless explicitly permitted
- **Time-Limited Access**: Temporary elevated permissions expire after 1 hour
- **Access Reviews**: Quarterly review of role assignments

---

## Data Subject Rights (DSR)

### Overview (LGPD Chapter III)
Users have the following rights regarding their personal data:

1. **Right to Confirmation and Access** (Art. 18, I & II)
2. **Right to Rectification** (Art. 18, III)
3. **Right to Anonymization, Blocking, or Deletion** (Art. 18, IV & VI)
4. **Right to Data Portability** (Art. 18, V)
5. **Right to Information about Data Sharing** (Art. 18, VII)
6. **Right to Revoke Consent** (Art. 18, IX)

---

### 1. Data Access Request (Right to Access)

**Implementation Status**: ⏳ PENDING
**API Endpoint**: `POST /api/privacy/data-request`
**SLA**: 15 days (LGPD Art. 18)

**User Flow**:
1. User submits data access request via dashboard
2. System verifies user identity (re-authentication required)
3. System generates comprehensive data export:
   - Personal information (JSON)
   - Subscription history (JSON)
   - Payment history (CSV)
   - Prescriptions (PDF files in ZIP)
   - Support tickets (JSON)
   - Audit logs (own access only) (CSV)
4. Export package encrypted with user password
5. Download link sent to registered email (expires in 7 days)
6. Access logged in audit trail

**Implementation Files**:
- `src/app/api/privacy/data-export/route.ts`
- `src/lib/data-export-generator.ts`
- `src/components/privacy/DataExportRequest.tsx`

**Data Export Format** (JSON):
```json
{
  "export_date": "2025-10-30T10:00:00Z",
  "data_controller": "SaraivaVision",
  "user": {
    "id": "uuid-redacted",
    "name": "João Silva",
    "email": "joao@example.com",
    "cpf": "***.***.789-**",
    "phone": "+5511****8888",
    "created_at": "2024-01-15T08:30:00Z"
  },
  "subscriptions": [ /* subscription history */ ],
  "prescriptions": [ /* list with download links */ ],
  "consent_history": [ /* consent grants and revocations */ ]
}
```

---

### 2. Data Deletion Request (Right to Erasure)

**Implementation Status**: ⏳ PENDING
**API Endpoint**: `POST /api/privacy/data-deletion`
**SLA**: 15 days (LGPD Art. 18) + verification period

**Dual-Verification Process** (Security Measure):
1. User submits deletion request via dashboard
2. **First Verification**: Email confirmation link sent (expires in 24h)
3. User clicks email link and re-authenticates
4. **Second Verification**: SMS or authenticator app code required
5. System presents deletion impact warning:
   - Active subscriptions will be canceled
   - Prescriptions will be retained for 20 years (legal requirement)
   - Payment history retained for 5 years (fiscal requirement)
   - All other data permanently deleted
6. User confirms understanding
7. Deletion scheduled for 30-day grace period (revocable)
8. After 30 days, irreversible deletion executed
9. Confirmation email sent to user

**Legal Retention Exceptions**:
- **Medical Prescriptions**: Cannot be immediately deleted (20-year retention)
- **Payment Records**: Cannot be deleted for 5 years (fiscal law)
- **Audit Logs**: Anonymized (user ID replaced with "deleted_user_<hash>")

**Implementation Files**:
- `src/app/api/privacy/data-deletion/route.ts`
- `src/lib/data-deletion-processor.ts`
- `src/components/privacy/DataDeletionRequest.tsx`

**Deletion Verification**:
```sql
-- Verification query (to be run after deletion)
SELECT 'users' AS table_name, COUNT(*) AS remaining
FROM users WHERE id = 'deleted-user-id'
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions WHERE user_id = 'deleted-user-id'
UNION ALL
SELECT 'prescriptions', COUNT(*) FROM prescriptions WHERE user_id = 'deleted-user-id'
  AND created_at < NOW() - INTERVAL '20 years'; -- Should be 0 unless legally required
```

---

### 3. Data Portability (Right to Data Portability)

**Implementation Status**: ⏳ PENDING
**Format**: JSON (machine-readable) + CSV (human-readable)

**Included Data**:
- User profile
- Subscription history with itemized charges
- Prescription metadata (not files, due to size - separate download)
- Delivery addresses
- Support ticket history

**Implementation**: Same as Data Access Request (#1)

---

### 4. Request Management Dashboard (For DPO/Admin)

**Implementation Status**: ⏳ PENDING
**Location**: `/admin/privacy/requests`

**Features**:
- List all data subject requests (access, deletion, rectification)
- Status tracking: pending, in_progress, completed, rejected
- SLA countdown timer (15 days)
- Request approval workflow (for deletion requests)
- Communication log with user

---

## Consent Management

### Explicit Consent Requirements (LGPD Art. 8)

**Consent Principles**:
- **Free**: No coercion or manipulation
- **Informed**: Clear explanation of data use
- **Specific**: Separate consent for each purpose
- **Unambiguous**: Affirmative action required (pre-ticked boxes forbidden)

---

### Consent Categories

#### 1. **Essential Service Consent** (Art. 7, V - Contract Execution)
**Scope**: Required to provide subscription service
**Data**: Name, email, phone, delivery address, payment method
**User Action**: Accepting Terms of Service during registration
**Revocation**: Leads to account closure (cannot provide service without this data)

**Implementation**: `src/components/auth/TermsAgreement.tsx`

---

#### 2. **Medical Data Consent** (Art. 11, I - Explicit Consent for Sensitive Data)
**Scope**: Processing of contact lens prescriptions
**Data**: Prescription files, issuing doctor CRM, lens specifications
**User Action**: Separate checkbox during prescription upload
**Revocation**: Prescription deleted after 20-year retention period

**Consent Text Example**:
```
[ ] Eu autorizo a SaraivaVision a processar minha receita médica de lentes de contato
    para fins de validação e fornecimento do serviço de assinatura. Entendo que:
    - Minha receita será armazenada de forma criptografada por no mínimo 20 anos
    - Apenas profissionais autorizados terão acesso para validação
    - Posso solicitar uma cópia da minha receita a qualquer momento
    - Posso revogar este consentimento, mas isso impedirá a continuidade do serviço
```

**Implementation**: `src/components/prescription/ConsentCheckbox.tsx`

---

#### 3. **Marketing Communications Consent** (Art. 7, I - Consent)
**Scope**: Promotional emails, WhatsApp messages, SMS
**Data**: Email, phone number
**User Action**: Opt-in checkbox (not pre-selected) during registration or account settings
**Revocation**: Unsubscribe link in every marketing email + account settings toggle

**Consent Text Example**:
```
[ ] Quero receber ofertas e novidades da SaraivaVision por email e WhatsApp
    (Você pode cancelar a qualquer momento)
```

**Implementation**:
- Registration: `src/components/auth/RegisterForm.tsx`
- Settings: `src/components/account/MarketingPreferences.tsx`
- Email unsubscribe: `src/app/api/unsubscribe/route.ts`

---

### Consent Recording

**Implementation Status**: ✅ IMPLEMENTED
**Location**: `consent_logs` table (PostgreSQL)

**Schema**:
```sql
CREATE TABLE consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  consent_type VARCHAR(50) NOT NULL, -- 'service', 'medical_data', 'marketing'
  action VARCHAR(20) NOT NULL, -- 'granted', 'revoked'
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET, -- For proof of consent
  user_agent TEXT, -- Browser/device used
  consent_text TEXT NOT NULL, -- Exact wording presented to user
  consent_version VARCHAR(10) NOT NULL -- e.g., 'v1.0' (for tracking T&C changes)
);

CREATE INDEX idx_consent_user_type ON consent_logs(user_id, consent_type);
```

**API Endpoint**: `POST /api/privacy/consent-log`

**Usage**:
```typescript
// Log consent when user accepts
await logConsent({
  userId: user.id,
  consentType: 'medical_data',
  action: 'granted',
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  consentText: 'Eu autorizo a SaraivaVision...',
  consentVersion: 'v1.0'
})
```

---

### Consent Revocation Process

**User Flow**:
1. User goes to `/area-assinante/configuracoes/privacidade`
2. Views current consents with toggles
3. Revokes consent (e.g., marketing emails)
4. System logs revocation in `consent_logs`
5. System immediately stops processing for revoked purpose
6. Confirmation message displayed

**Implementation**:
- Frontend: `src/components/privacy/ConsentManagement.tsx`
- Backend: `src/app/api/privacy/consent/revoke/route.ts`

---

## Breach Notification

### LGPD Breach Notification Requirements (Art. 48)

**Timeline**:
- **Internal Detection**: Immediate incident response activation
- **DPO Notification**: Within 2 hours of detection
- **ANPD Notification**: Within **72 hours** of breach detection (if risk to data subjects)
- **Data Subject Notification**: "Reasonable timeframe" when high risk to rights/freedoms

---

### Breach Severity Classification

#### Level 1: LOW RISK
**Examples**:
- Temporary service outage (no data exposed)
- Failed login attempts (blocked by rate limiting)

**Response**:
- Internal incident report
- No external notification required
- Implement additional monitoring

---

#### Level 2: MODERATE RISK
**Examples**:
- Accidental exposure of non-sensitive data (e.g., email addresses) to limited audience
- Temporary misconfiguration exposing non-medical data

**Response**:
- Internal incident report with root cause analysis
- DPO assessment within 24 hours
- ANPD notification if scope >1000 users
- Consider data subject notification (case-by-case)

---

#### Level 3: HIGH RISK
**Examples**:
- Unauthorized access to medical prescriptions
- Database breach exposing passwords (even if hashed)
- Ransomware attack affecting user data

**Response**:
- **Immediate**: Incident response team activation
- **Within 2 hours**: DPO notification
- **Within 24 hours**: Contain breach, preserve evidence
- **Within 72 hours**: ANPD notification via online form
- **Within 72 hours**: Affected users notified via email + in-app notification
- **Within 7 days**: Public disclosure (if >10,000 users affected)
- **Within 30 days**: Post-incident report with remediation plan

---

### Breach Notification Template (to ANPD)

**Required Information** (Art. 48, §1):
1. **Description of personal data affected**: Types and quantity
2. **Data subjects affected**: Number of individuals
3. **Data controller identification**: SaraivaVision contact info
4. **DPO contact**: [To be assigned]
5. **Breach details**: Date, time, how discovered
6. **Risks to data subjects**: Potential harm assessment
7. **Mitigation measures**: Actions taken and planned
8. **Notification to data subjects**: Whether and how they were informed

**ANPD Notification Portal**: https://www.gov.br/anpd/pt-br

---

### Incident Response Plan

**Incident Response Team**:
- **Incident Commander**: CTO or senior developer
- **DPO**: Data Protection Officer
- **Legal**: Legal counsel (external if needed)
- **Communications**: Marketing/PR for public statements
- **Technical**: DevOps + Security engineer

**Incident Response Steps**:
1. **Detection**: Automated alerts, user reports, security scans
2. **Containment**: Isolate affected systems, revoke credentials
3. **Eradication**: Remove malware, patch vulnerabilities
4. **Recovery**: Restore from clean backups, verify integrity
5. **Notification**: ANPD, users, public (as required)
6. **Post-Incident Review**: Root cause analysis, lessons learned
7. **Documentation**: Incident report, timeline, evidence

**Incident Response Playbooks**: `docs/security/incident-response-playbooks/`

---

## Implementation Status Matrix

| Requirement | Status | Priority | Target Date | Owner | Verification |
|-------------|--------|----------|-------------|-------|--------------|
| **Encryption at Rest (DB)** | ✅ Implemented | 🔴 Critical | Completed | DevOps | `pg_settings` query |
| **Encryption at Rest (Files)** | ⏳ Pending | 🔴 Critical | 2025-11-30 | Backend | S3/R2 encryption enabled |
| **TLS 1.3 Configuration** | ✅ Implemented | 🔴 Critical | Completed | DevOps | `openssl s_client` test |
| **Audit Logging** | ✅ Implemented | 🔴 Critical | Completed | Backend | `audit_logs` table exists |
| **Log Immutability** | ✅ Implemented | 🔴 Critical | Completed | Backend | Trigger prevents DELETE |
| **Data Retention Automation** | ⏳ Pending | 🟡 High | 2025-12-15 | Backend | Cron job logs |
| **Data Export (DSR)** | ⏳ Pending | 🟡 High | 2025-12-01 | Backend | Test export API |
| **Data Deletion (DSR)** | ⏳ Pending | 🟡 High | 2025-12-01 | Backend | Verify deletion query |
| **Consent Management UI** | ⏳ Pending | 🟡 High | 2025-11-20 | Frontend | User can revoke consent |
| **Consent Logging** | ✅ Implemented | 🔴 Critical | Completed | Backend | `consent_logs` table |
| **RBAC (Customer)** | ✅ Implemented | 🔴 Critical | Completed | Backend | Middleware blocks unauthorized |
| **RBAC (Support/Medical)** | ⏳ Pending | 🟡 High | 2025-12-10 | Backend | Role assignment tests |
| **Breach Notification Plan** | ✅ Documented | 🟡 High | Completed | Legal/DPO | Incident response drill |
| **DPO Appointment** | ⏳ Pending | 🔴 Critical | 2025-11-05 | Management | DPO contact published |
| **Privacy Policy (Updated)** | ⏳ Pending | 🔴 Critical | 2025-11-10 | Legal | LGPD compliance review |
| **Cookie Consent Banner** | ⏳ Pending | 🟢 Medium | 2026-01-15 | Frontend | Banner shows on first visit |
| **DPIA (Medical Data)** | ⏳ Pending | 🟡 High | 2025-12-20 | DPO | DPIA document completed |

---

## Responsible Parties

### Data Controller
**Organization**: SaraivaVision Clínica Oftalmológica
**Responsible**: Dr. Philipe Saraiva Cruz
**CRM**: CRM-MG 69.870
**Contact**: saraivavision@gmail.com
**Address**: Caratinga/MG, Brazil

### Data Protection Officer (DPO)
**Status**: ⏳ TO BE APPOINTED (LGPD Art. 41)
**Responsibilities**:
- Accept data subject requests and complaints
- Receive notifications from ANPD
- Guide employees on data protection practices
- Conduct DPIAs (Data Protection Impact Assessments)
- Maintain relationship with ANPD

**Required Qualifications** (Art. 41, §2):
- Professional/technical knowledge in data protection law
- Independence in function execution
- Adequate resources to perform duties

**Contact Form**: (To be published at `/contato-dpo`)

---

### Technical Team
**Backend Lead**: [Assign owner]
**Frontend Lead**: [Assign owner]
**DevOps Lead**: [Assign owner]
**Security Engineer**: [Assign owner - may be external consultant]

---

## References & Resources

### Legal Texts
- [LGPD - Lei nº 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD - National Data Protection Authority](https://www.gov.br/anpd/pt-br)

### Technical Standards
- [ISO/IEC 27001:2022](https://www.iso.org/standard/27001) - Information Security Management
- [NIST SP 800-53](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final) - Security Controls

### Healthcare Regulations
- [CFM Resolution 2.314/2022](https://www.in.gov.br/en/web/dou/-/resolucao-cfm-n-2.314-de-20-de-abril-de-2022-397602852) - Telemedicine
- [Lei nº 13.787/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13787.htm) - Digital Prescriptions

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-30 | Initial LGPD implementation guide created | Claude Code |

---

## Appendices

### Appendix A: Data Processing Register (LGPD Art. 37)
*To be maintained as separate document: `docs/lgpd/data-processing-register.xlsx`*

**Contents**:
- List of all data processing activities
- Purpose of each processing
- Legal basis (consent, contract, etc.)
- Data categories involved
- Data recipients (internal departments, third parties)
- International data transfers (if any)
- Retention periods

---

### Appendix B: Third-Party Processor Agreements
**Data Processors**:
1. **Asaas** (Payment Gateway):
   - DPA: [Link to signed Data Processing Agreement]
   - Data Transferred: Payment card details, billing info
   - Security Measures: PCI-DSS Level 1 compliant

2. **SendPulse** (WhatsApp Integration):
   - DPA: [Link to signed DPA]
   - Data Transferred: Phone numbers, message content
   - Security Measures: ISO 27001 certified

3. **OpenAI** (AI Support):
   - DPA: [Link to Enterprise Agreement]
   - Data Transferred: Support ticket text (no medical data)
   - Security Measures: Data not used for training

4. **AWS/Cloudflare** (Infrastructure):
   - DPA: [Link to standard AWS DPA]
   - Data Transferred: All application data
   - Security Measures: SOC 2 Type II, ISO 27001

---

### Appendix C: User-Facing Privacy Documentation

**Documents to Update/Create**:
- [ ] `/politica-privacidade` - Privacy Policy (update for LGPD)
- [ ] `/termos-uso` - Terms of Service (add LGPD clauses)
- [ ] `/contato-dpo` - DPO Contact Form
- [ ] `/seus-direitos` - "Your Rights" page explaining DSR
- [ ] `/cookies` - Cookie Policy (if cookies used beyond essential)

---

**Document Status**: 🟡 Living document - to be updated as implementation progresses

**Next Review Date**: 2025-12-01
