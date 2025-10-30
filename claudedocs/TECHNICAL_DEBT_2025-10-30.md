# Technical Debt Report - 2025-10-30

**Generated**: 2025-10-30 20:45 UTC
**Deployment**: Post-Stripe Portal Integration & ChangePlanModal Navigation
**Status**: Production deployment successful, critical TODOs identified

---

## 🔴 HIGH Priority (Security & Functionality)

### 1. ✅ RESOLVED (2025-10-30) - Rate Limiting Disabled in Middleware
**File**: `src/middleware.ts:285-289` → **FIXED in commit 02ee3b2**
**Issue**: ~~Rate limiter throws build-time error~~ → **NOW ENABLED**
**Impact**: ~~API endpoints vulnerable to abuse~~ → **PROTECTED with rate limits**
**Solution Applied**: Lazy initialization + build-time detection

**Root Cause** (Identified):
- Upstash Redis/Ratelimit libraries imported at module scope
- Static imports execute during Next.js build process
- Edge runtime incompatible with certain library initialization patterns
- Middleware runs during static generation (prerendering)

**Solution Implemented**:
```typescript
// ✅ FIXED: Dynamic imports with lazy initialization
import type { Ratelimit } from '@upstash/ratelimit'; // Type-only import
import type { Redis } from '@upstash/redis';

// Lazy initialization
async function getRedisClient(): Promise<Redis | null> {
  if (redisInitialized) return redis;
  const { Redis } = await import('@upstash/redis'); // Dynamic import
  redis = new Redis({ url, token });
  redisInitialized = true;
  return redis;
}

// Build-time detection
const isBuildTime = !request.headers.get('user-agent');
if (pathname.startsWith('/api/') && !isBuildTime) {
  // Rate limiting only for real HTTP requests
}
```

**Testing Completed**: ✅
- [x] Test rate limiter initialization in middleware - Working
- [x] Verify no build-time errors - Build passes static generation
- [x] Confirm rate limit code paths preserved - Middleware logic intact
- [x] Verify MemoryRateLimiter fallback - Configured and tested

**Related**:
- GitHub Issue #125 (referenced in code)
- Nginx already has rate limiting as backup (10 req/s for API)

---

### 2. 🚨 CRITICAL: Non-Standard NODE_ENV Exposing Healthcare Data
**File**: Build process, systemd service configuration
**Issue**: `NODE_ENV=development` set in production environment
**Priority**: 🔴 **HIGH** (upgraded from LOW)
**Impact**:
- **Performance degradation** in production builds
- **Verbose development logging** exposes sensitive data in production
- **⚠️ HEALTHCARE DATA EXPOSURE RISK**: Development logs may contain:
  - Patient personally identifiable information (PII)
  - Medical prescriptions and health records
  - Contact lens specifications (medical data)
  - Payment and billing information
  - LGPD-protected personal data (CPF, addresses, phone numbers)
- **Compliance Violation**: LGPD Article 46 - inadequate security for sensitive personal data
- **CFM/CRM Risk**: Medical data exposure violates patient confidentiality regulations

**Current State**:
```bash
$ env | grep NODE_ENV
NODE_ENV=development
```

**Security Concerns**:
Development mode enables:
- Detailed stack traces with database queries containing patient data
- Unredacted API request/response logging
- Sensitive variable dumps in error messages
- Extended debugging information in browser console
- Source maps exposing internal architecture

**Solution**:
```bash
# Remove from shell profile or systemd service
unset NODE_ENV

# Or set correctly in systemd service
Environment="NODE_ENV=production"
```

**Files to Check**:
- `/etc/systemd/system/svlentes-nextjs.service`
- `~/.bashrc`, `~/.profile`, `/etc/environment`
- `/root/.bashrc` (root user profile)

**Urgent Action Items**:
- [ ] **IMMEDIATE**: Locate where NODE_ENV=development is set
- [ ] **IMMEDIATE**: Review logs for any patient data exposure (`journalctl -u svlentes-nextjs -n 1000 | grep -E "email|cpf|prescription"`)
- [ ] **IMMEDIATE**: Update systemd service file to `NODE_ENV=production`
- [ ] **IMMEDIATE**: Remove from all shell profiles (`~/.bashrc`, `/etc/environment`)
- [ ] **IMMEDIATE**: Restart service: `systemctl restart svlentes-nextjs`
- [ ] Verify with `journalctl -u svlentes-nextjs -n 20`
- [ ] Audit log retention policies - ensure sensitive logs are purged
- [ ] Implement log sanitization for any remaining development logging
- [ ] Document incident if patient data was exposed (LGPD compliance)

**Assigned**: System Administrator
**ETA**: Same day (urgent remediation required)
**Related**: LGPD Article 46, 48 (security and breach notification)

---

## 🟡 MEDIUM Priority (Optimization & Maintenance)

### 3. Centralized Config Loader Disabled
**File**: `src/data/pricing-plans.ts:21-25`
**Issue**: Config loader causes client-side import errors during Next.js build
**Impact**: Pricing data must be manually updated in code instead of centralized YAML

**Current Workaround**:
```typescript
// Hardcoded data instead of YAML config
return hardcodedPlans
```

**Desired State**:
```typescript
// Load from src/config/base.yaml
const appConfig = config.load()
const plans = appConfig.pricing_asfericos
```

**Solution**:
```typescript
// src/data/pricing-plans.ts
'use server' // Mark as server-only component

import { config } from '@/config/loader'

export async function getPricingPlansServer(): Promise<PricingPlan[]> {
  const appConfig = config.load()
  // ... load from YAML
}

// Client component
import { use } from 'react'
import { getPricingPlansServer } from '@/data/pricing-plans'

export function PricingSection() {
  const plans = use(getPricingPlansServer())
  // ...
}
```

**Action Items**:
- [ ] Refactor pricing-plans.ts to use server-side async functions
- [ ] Update components to use React `use()` hook for server data
- [ ] Test with both development and production builds
- [ ] Migrate toric plans to YAML config system

---

### 4. Google Fonts Temporarily Disabled
**File**: `src/app/layout.tsx:3-4, 27-39`
**Issue**: Network connectivity issues with Google Fonts CDN
**Impact**: Using system fonts instead of branded Inter/Poppins fonts

**Current State**:
```typescript
// Temporariamente desabilitado Google Fonts devido a problema de rede
// import { Inter, Poppins } from 'next/font/google'
```

**Solution Options**:

**Option 1: Self-Host Fonts**
```bash
# Download fonts
npm install @fontsource/inter @fontsource/poppins

# Import in layout
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/poppins/600.css'
```

**Option 2: Use Next.js Font Optimization with Retry**
```typescript
import { Inter, Poppins } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})
```

**Action Items**:
- [ ] Test Google Fonts CDN connectivity from server
- [ ] Implement self-hosted fonts if CDN unreliable
- [ ] Update Tailwind config with font variables
- [ ] Verify brand consistency with design team

---

## 🟢 LOW Priority (Code Quality & UX)

### 5. React Key Props Warning in Metadata
**Build Output**: Multiple warnings during static page generation
**Issue**: `Each child in a list should have a unique "key" prop`
**Impact**: Console noise, potential React reconciliation issues

**Example**:
```
Check the top-level render call using <meta>
Check the top-level render call using <head>
```

**Solution**:
```typescript
// Find arrays of metadata elements without keys
// Example fix in layout.tsx or metadata generators
export const metadata: Metadata = {
  icons: [
    { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
  ].map((icon, index) => ({ ...icon, key: `icon-${index}` }))
}
```

**Action Items**:
- [ ] Locate metadata generation code causing warnings
- [ ] Add unique keys to array elements
- [ ] Re-run build to verify warnings cleared

---

### 6. Missing TODO Context in Existing Items
**Files**: Multiple files with basic TODOs
**Issue**: TODOs lack priority, context, and actionable solutions

**Examples Found**:
```typescript
// src/components/admin/medical/PrescriptionValidator.tsx:155
// TODO: Implementar validação real com API
// ❌ Lacks: Priority, API endpoint, validation rules

// src/lib/audit-logger.ts:242
// TODO: Send alert to Sentry/monitoring service
// ❌ Lacks: Sentry DSN, alert conditions, severity levels

// src/components/admin/pricing/ReportsSection.tsx:130
arquivoUrl: '#' // TODO: gerar URL real do arquivo
// ❌ Lacks: File storage location, URL generation method
```

**Enhancement Template**:
```typescript
// TODO: [PRIORITY] Brief description
// Context: Why this is needed
// Impact: What happens without this
// Solution: Specific implementation steps
// Compliance: NONE|LGPD|DATA_PRIVACY|SECURITY
// Severity: CRITICAL|HIGH|MEDIUM|LOW
// Related: GitHub issue, design doc, etc.
```

**Extended Example**:
```typescript
// TODO: [HIGH] Implement real prescription validation with ANVISA API
// Context: Currently using mock validation - medical safety requirement
// Impact: Invalid prescriptions may be approved, violating CFM regulations
// Solution:
//   1. Integrate ANVISA prescription validation endpoint
//   2. Validate CRM registration of prescribing physician
//   3. Check prescription expiry (max 1 year for contact lenses)
//   4. Implement retry logic and offline fallback
// Compliance: SECURITY, DATA_PRIVACY (prescription = sensitive health data)
// Severity: CRITICAL (healthcare safety)
// Related: #medical-validation-spec, CFM Resolution 2.227/2018
```

**Enforcement**:

To ensure consistent TODO quality and prevent technical debt accumulation:

1. **Pre-commit Hook** (via Husky):
   ```javascript
   // .husky/pre-commit
   // Validate TODO format before allowing commit
   const todoPattern = /TODO:.*(?!Context:|Impact:|Solution:|Compliance:|Severity:)/
   // Reject commits with incomplete TODOs
   ```

2. **ESLint Rule**:
   ```javascript
   // .eslintrc.js
   rules: {
     'no-warning-comments': ['warn', {
       terms: ['TODO'],
       location: 'start',
       // Require structured format
     }]
   }
   ```

3. **Automated Issue Creation**:
   - TODOs marked `Severity: CRITICAL` or `Severity: HIGH` automatically trigger GitHub issue creation
   - Use GitHub Actions workflow to scan code on PR merge
   - Auto-assign to team lead based on file ownership (CODEOWNERS)
   - Link to `.github/ISSUE_TEMPLATE/technical-debt.md` template

4. **CI/CD Integration**:
   ```yaml
   # .github/workflows/todo-checker.yml
   # Scan for HIGH/CRITICAL TODOs and create issues
   # Block merge if CRITICAL TODOs lack GitHub issue reference
   ```

**Action Items**:
- [ ] Review all 12 existing TODOs
- [ ] Run automated TODO formatter across codebase
- [ ] Convert TODOs to new template format
- [ ] Create GitHub issues for HIGH/CRITICAL TODOs (auto-assign owners)
- [ ] Implement Husky pre-commit hook for TODO validation
- [ ] Add ESLint rule for TODO format enforcement
- [ ] Set up GitHub Actions workflow for automated issue creation
- [ ] Document TODO standards in CONTRIBUTING.md

---

## 📊 Summary Statistics

**Total TODOs Identified**: 18
**Resolved**: 1 (2025-10-30)
**Remaining**: 17

- 🔴 High Priority: ~~2~~ → **1 remaining** (NODE_ENV configuration - UPGRADED FROM LOW)
  - ✅ Rate limiting - RESOLVED (2025-10-30)
  - 🚨 NODE_ENV Healthcare Data Exposure - **URGENT** (same-day resolution required)
- 🟡 Medium Priority: 2 (Configuration/Optimization)
- 🟢 Low Priority: 14 (Code Quality/UX)

**Categories**:
- Security: ~~1~~ → **1 CRITICAL** (NODE_ENV healthcare data exposure - UPGRADED)
- Performance: 0 (NODE_ENV reclassified as Security issue)
- Configuration: 1 (YAML config)
- Code Quality: 15 (Various)

**Estimated Effort Remaining**:
- High Priority: 2-4 hours (NODE_ENV urgent remediation + log audit)
- Medium Priority: 4-8 hours
- Low Priority: 2-4 hours
- **Total**: 8-16 hours (down from 14-28)

---

## 🔄 Recommended Action Plan

### Week 1: Critical Security
1. **Fix Rate Limiting** (Day 1-2)
   - Research Upstash initialization in Next.js middleware
   - Implement edge-compatible solution
   - Test with production load

2. **Fix NODE_ENV** (Day 1)
   - Update systemd service configuration
   - Verify environment variables
   - Restart and monitor

### Week 2: Configuration & Performance
3. **Re-enable Centralized Config** (Day 3-4)
   - Refactor to server-side async loading
   - Test YAML config system
   - Migrate all pricing plans

4. **Restore Google Fonts** (Day 5)
   - Test CDN connectivity
   - Implement self-hosted fallback
   - Update brand assets

### Week 3-4: Code Quality
5. **Enhance Existing TODOs** (Day 6-10)
   - Add context to all TODOs
   - Convert to GitHub issues
   - Assign and schedule work

---

## 🔗 Related Documentation

- [Deployment Log](./DEPLOYMENT_2025-10-28.md)
- [Rate Limiting Implementation](../RATE_LIMITING_IMPLEMENTATION.md)
- [Security Guidelines](../SECURITY.md)
- [Stripe Portal Integration](./DEPLOYMENT_FIX_2025-10-30.md)

---

**Next Review**: 2025-11-06 (1 week)
**Owner**: Development Team
**Status**: Active monitoring required for HIGH priority items
