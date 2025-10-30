# Technical Debt Report - 2025-10-30

**Generated**: 2025-10-30 20:45 UTC
**Deployment**: Post-Stripe Portal Integration & ChangePlanModal Navigation
**Status**: Production deployment successful, critical TODOs identified

---

## 🔴 HIGH Priority (Security & Functionality)

### 1. Rate Limiting Disabled in Middleware
**File**: `src/middleware.ts:285-289`
**Issue**: Rate limiter throws build-time error
**Impact**: API endpoints vulnerable to abuse without rate limiting protection
**Error**: `TypeError: Cannot read properties of null (reading 'useContext')`

**Root Cause**:
- Upstash Redis initialization fails in middleware context during Next.js build
- React Context hooks being called in server-side middleware
- Possible conflict between @upstash/ratelimit and Next.js middleware execution

**Solution Path**:
```typescript
// Option 1: Use edge-compatible rate limiter
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize in middleware scope, not module scope
export async function middleware(request: NextRequest) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10s'),
  })
  // ...
}

// Option 2: Move rate limiting to API route middleware
// Use next-rate-limit or implement custom solution
```

**Testing Required**:
- [ ] Test rate limiter initialization in middleware
- [ ] Verify no build-time errors
- [ ] Load test API endpoints with rate limiting enabled
- [ ] Monitor memory usage with Redis client in middleware

**Related**:
- GitHub Issue #125 (referenced in code)
- Nginx already has rate limiting as backup (10 req/s for API)

---

### 2. Build Warning: Non-Standard NODE_ENV
**File**: Build process
**Issue**: `NODE_ENV=development` set in production environment
**Impact**: Potential performance degradation, verbose logging in production

**Current State**:
```bash
$ env | grep NODE_ENV
NODE_ENV=development
```

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

**Action Items**:
- [ ] Locate where NODE_ENV=development is set
- [ ] Update systemd service file if needed
- [ ] Restart service after fix
- [ ] Verify with `journalctl -u svlentes-nextjs -n 20`

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
// Related: GitHub issue, design doc, etc.
```

**Action Items**:
- [ ] Review all 12 existing TODOs
- [ ] Add context and priority to each
- [ ] Convert high-priority items to GitHub issues
- [ ] Assign owners for critical TODOs

---

## 📊 Summary Statistics

**Total TODOs Identified**: 18
- 🔴 High Priority: 2 (Security/Performance)
- 🟡 Medium Priority: 2 (Configuration/Optimization)
- 🟢 Low Priority: 14 (Code Quality/UX)

**Categories**:
- Security: 1 (Rate limiting)
- Performance: 1 (NODE_ENV)
- Configuration: 1 (YAML config)
- Code Quality: 15 (Various)

**Estimated Effort**:
- High Priority: 8-16 hours
- Medium Priority: 4-8 hours
- Low Priority: 2-4 hours
- **Total**: 14-28 hours

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
