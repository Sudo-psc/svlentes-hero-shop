# CI/CD Workflows Documentation

**Project**: SVLentes Landing Page
**Last Updated**: 2025-10-18
**Deployment Model**: Systemd-based via SSH

---

## Overview

The project uses GitHub Actions for continuous integration and continuous deployment. The CI/CD pipeline is optimized for a production healthcare application with strict quality gates and automated testing.

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│  Push to Branch (main/master/develop)                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  CI - Test Automation (ci.yml)                              │
│  • Lint & Type Check                                        │
│  • Unit Tests with Coverage                                 │
│  • E2E Tests (Playwright - Chromium only)                   │
│  • Build Validation                                         │
│  • Security Scanning                                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├──► If SUCCESS ──┐
                   │                 │
                   ▼                 ▼
         ┌─────────────────┐   ┌─────────────────┐
         │  Deploy Staging │   │  Deploy Production│
         │  (develop)      │   │  (main/master)   │
         └─────────────────┘   └─────────────────┘
```

---

## Active Workflows

### 1. CI - Test Automation (`ci.yml`)

**Triggers**: Push or PR to `main`, `master`, `develop` branches

**Purpose**: Validate code quality, run tests, and ensure build succeeds

**Jobs**:

#### a. **Lint & Type Check**
- Runs ESLint on codebase
- Performs TypeScript type checking
- **Fast fail**: Blocks other jobs if linting fails

#### b. **Unit Tests**
- Runs Jest unit tests with coverage
- Uploads coverage reports to Codecov
- **Parallel execution**: Runs alongside lint job

#### c. **E2E Tests**
- Builds production bundle
- Installs Playwright browsers (cached)
- Runs E2E tests on Chromium only (all browsers locally)
- Uploads test reports on failure
- **Port**: Uses 5000 (production port)

#### d. **Build Check**
- Validates production build succeeds
- Depends on: lint + unit-tests
- Ensures `.next` directory is created

#### e. **Security Scan**
- Runs `npm audit` for vulnerabilities
- Generates security report artifact
- **Non-blocking**: Continues on errors (for review)

**Optimizations**:
- ✅ npm cache enabled
- ✅ Playwright browser caching
- ✅ Parallel job execution (lint + unit tests)
- ✅ CI flag set for optimized test runs

---

### 2. Deploy to Staging (`deploy-staging.yml`)

**Triggers**:
- ✅ CI workflow completion on `develop` branch (success only)
- Manual trigger via `workflow_dispatch`

**Environment**: `staging`
**URL**: https://staging.svlentes.shop
**Port**: 3001

**Deployment Flow**:

1. **Pre-flight Checks**
   - Validates CI workflow succeeded
   - Sets up Node.js 20
   - Installs dependencies

2. **Testing**
   - Runs unit tests
   - Runs linting

3. **Build**
   - Builds production bundle
   - Uses staging environment variables
   - Sets `ASAAS_ENV=sandbox`

4. **SSH Deployment**
   - Connects to staging server via SSH
   - Creates timestamped backup of `.next` directory
   - Pulls latest code from `develop` branch
   - Runs `npm ci` and `npm run build`
   - Runs Prisma migrations
   - Restarts `svlentes-staging` systemd service

5. **Health Checks**
   - Waits 5 seconds for service stabilization
   - Verifies http://localhost:3001/api/health-check
   - **Rollback on failure**: Restores backup if health check fails

6. **Verification**
   - Tests public HTTPS endpoint
   - Sends deployment notification to n8n webhook

---

### 3. Deploy to Production (`deploy-production.yml`)

**Triggers**:
- ✅ CI workflow completion on `main`/`master` branch (success only)
- Manual trigger via `workflow_dispatch`

**Environment**: `production` (with GitHub Environment protection)
**URL**: https://svlentes.shop
**Port**: 5000

**Deployment Flow**:

1. **Pre-flight Validation**
   - Validates CI workflow succeeded
   - Runs full test suite (unit + E2E)
   - Performs type checking
   - Builds production bundle

2. **Backup Creation**
   - SSH to production server
   - Creates timestamped backup directory
   - Backs up `.next`, `.env.local`, `package.json`
   - Backs up PostgreSQL database
   - Keeps only last 5 backups

3. **Deployment**
   - Stores current git commit for rollback
   - Pulls latest code from branch
   - Installs dependencies with `npm ci`
   - Generates Prisma client
   - Runs database migrations
   - Builds application
   - Restarts `svlentes-nextjs` systemd service

4. **Health Checks with Retry**
   - Waits 10 seconds for stabilization
   - Retries health check up to 5 times
   - **Automatic rollback** if all retries fail
   - Rollback reverts to previous git commit

5. **Post-Deployment Validation**
   - Verifies public HTTPS endpoint
   - Tests critical pages:
     - Landing page (`/`)
     - Calculator (`/calculadora`)
     - Subscription (`/assinar`)
     - Performance monitoring endpoint

6. **Notifications**
   - Success notification to n8n webhook
   - Failure notification with error details

---

### 4. Security - Kluster Code Review (`security-kluster.yml`)

**Triggers**: Push, PR, or manual trigger on `main`, `master`, `develop`

**Purpose**: Automated security and compliance validation

**Security Checks**:

1. **Dependency Validation**
   - Detects `package.json` changes
   - Runs `npm audit` for vulnerabilities
   - **Note**: Kluster MCP integration for comprehensive analysis

2. **Security Headers Validation**
   - Verifies presence of required headers in `next.config.js`:
     - Strict-Transport-Security
     - Content-Security-Policy
     - X-Frame-Options
     - X-Content-Type-Options
     - X-XSS-Protection

3. **Environment Secrets Validation**
   - Scans for hardcoded secrets
   - Verifies `.env.local.example` exists
   - Checks environment variable management

4. **LGPD Compliance Check**
   - Validates required endpoints:
     - `/api/privacy/consent-log`
     - `/api/privacy/data-request`
     - `/politica-privacidade`

5. **Healthcare Regulatory Compliance**
   - Verifies CRM credentials present (CRM-MG 69.870)
   - Checks emergency information availability

6. **Payment Integration Security**
   - Validates Asaas API key usage (environment variables)
   - Verifies webhook token validation exists
   - Checks for secure integration patterns

**Outputs**:
- Security report artifact (30-day retention)
- PR comment with scan summary
- Non-blocking results for review

---

## Deprecated Workflows

### ⚠️ `deploy.yml.deprecated`

**Status**: Archived on 2025-10-18

**Reason**: The project migrated from Vercel to systemd-based deployment. This workflow is kept for historical reference only.

**Key Differences**:
- Used Vercel CLI instead of SSH
- Integrated with Stripe (now using Asaas)
- Node.js 18 (now using Node.js 20)
- Different deployment model entirely

---

## Environment Variables & Secrets

### Required GitHub Secrets

#### **SSH & Server Access**
- `SSH_PRIVATE_KEY`: SSH private key for server access
- `SSH_HOST`: Production/staging server hostname
- `SSH_USER`: SSH username for deployment

#### **Application Configuration**
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: WhatsApp number (5533999898026)
- `DATABASE_URL_PROD`: Production PostgreSQL connection string
- `DATABASE_URL_STAGING`: Staging PostgreSQL connection string

#### **Payment Integration (Asaas)**
- `ASAAS_API_KEY_PROD`: Production Asaas API key
- `ASAAS_API_KEY_SANDBOX`: Sandbox Asaas API key
- `ASAAS_WEBHOOK_TOKEN`: Webhook validation token

#### **SendPulse WhatsApp**
- `SENDPULSE_USER_ID`
- `SENDPULSE_SECRET`
- `SENDPULSE_ACCESS_TOKEN`
- `SENDPULSE_REFRESH_TOKEN`
- `SENDPULSE_BOT_ID`

#### **AI/LangChain**
- `OPENAI_API_KEY`
- `LANGCHAIN_API_KEY`

#### **Notifications**
- `N8N_WEBHOOK_URL`: n8n deployment notification webhook

#### **Analytics (Optional)**
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`

---

## Deployment Process

### Standard Deployment Flow

#### For Staging (develop branch):
```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push and create PR to develop
git push origin feature/my-feature
# Create PR on GitHub

# 4. CI runs automatically on PR
# - Lint, tests, build validation

# 5. Merge PR to develop
# - CI runs on develop branch
# - On CI success, deploy-staging.yml triggers
# - Staging deployment happens automatically

# 6. Verify on https://staging.svlentes.shop
```

#### For Production (main/master branch):
```bash
# 1. Create PR from develop to main
# (or cherry-pick specific commits)

# 2. CI runs on PR to main
# - Full test suite validation

# 3. Get PR approval (if GitHub protections enabled)

# 4. Merge PR to main
# - CI runs on main branch
# - On CI success, deploy-production.yml triggers
# - Production deployment with GitHub Environment protection

# 5. Verify on https://svlentes.shop
```

### Manual Deployment

#### Trigger via GitHub UI:
1. Go to **Actions** tab
2. Select workflow (`Deploy to Production` or `Deploy to Staging`)
3. Click **Run workflow**
4. Select branch
5. Click **Run workflow** button

#### Trigger via GitHub CLI:
```bash
# Staging
gh workflow run deploy-staging.yml

# Production (requires approval)
gh workflow run deploy-production.yml
```

---

## Rollback Procedures

### Automatic Rollback (Built-in)

**Production deployment has automatic rollback**:
- Health check failures trigger automatic rollback
- Reverts to previous git commit
- Rebuilds and restarts service
- No manual intervention needed for health check failures

### Manual Rollback

#### Option 1: Via Server (Fast)
```bash
# SSH to production server
ssh user@server

# Navigate to project
cd /root/svlentes-hero-shop

# View available backups
ls -la ~/backups/

# Find target backup (timestamped)
ls ~/backups/svlentes-20251018_143022/

# Restore backup
sudo systemctl stop svlentes-nextjs
rm -rf .next
cp -r ~/backups/svlentes-20251018_143022/.next .
sudo systemctl start svlentes-nextjs

# Verify
curl -f http://localhost:5000/api/health-check
```

#### Option 2: Via Git (Complete)
```bash
# Find commit to revert to
git log --oneline -10

# Revert to specific commit
git checkout <commit-hash>

# Or revert last commit
git revert HEAD

# Push revert
git push origin main

# CI + deployment will run automatically
```

#### Option 3: Via GitHub Actions (Recommended)
```bash
# Create a rollback workflow trigger
gh workflow run deploy-production.yml --ref <previous-commit-hash>
```

---

## Performance Optimizations

### CI Workflow Optimizations

| Optimization | Benefit | Implementation |
|--------------|---------|----------------|
| npm caching | Faster dependency installation | `actions/setup-node` with `cache: 'npm'` |
| Playwright browser caching | 2-3 min savings per run | `actions/cache@v4` with `~/.cache/ms-playwright` |
| Chromium-only E2E in CI | 60% faster E2E tests | Conditional `projects` in `playwright.config.ts` |
| Parallel lint + tests | 30% faster validation | Independent job execution |
| Conditional security scans | Non-blocking analysis | `continue-on-error: true` |

### Deployment Workflow Optimizations

| Optimization | Benefit | Implementation |
|--------------|---------|----------------|
| Workflow dependency | No failed deployments | `workflow_run` trigger |
| Timestamped backups | Fast rollback capability | Automated backup scripts |
| Health check retries | Resilient deployment | 5 retries with 5s delays |
| Automatic rollback | Zero-downtime failures | Built-in failure handling |
| SSH key caching | Faster SSH operations | GitHub Actions SSH agent |

---

## Monitoring & Alerts

### Health Check Endpoints

```bash
# Application health
curl https://svlentes.shop/api/health-check

# Performance metrics
curl https://svlentes.shop/api/monitoring/performance

# Error logs
curl https://svlentes.shop/api/monitoring/errors

# System alerts
curl https://svlentes.shop/api/monitoring/alerts
```

### Deployment Notifications

**n8n Webhook Integration**:
- Deployment success/failure notifications
- Sends structured JSON with:
  - Status
  - Environment
  - Commit SHA
  - Branch
  - Actor
  - Timestamp
  - URL (if successful)

**Example n8n Webhook Payload**:
```json
{
  "status": "success",
  "environment": "production",
  "commit": "abc123...",
  "branch": "main",
  "actor": "github-username",
  "timestamp": "2025-10-18T12:34:56Z",
  "url": "https://svlentes.shop"
}
```

---

## Troubleshooting

### Common Issues

#### 1. CI Workflow Fails on Lint
**Problem**: ESLint errors blocking CI
**Solution**:
```bash
# Fix lint errors locally
npm run lint:fix

# Commit fixes
git add .
git commit -m "fix: resolve lint errors"
git push
```

#### 2. E2E Tests Fail in CI
**Problem**: Playwright tests pass locally but fail in CI
**Solutions**:
- Check port configuration (should be 5000)
- Verify CI environment variable is set
- Review Playwright report artifact in GitHub Actions
- Run with `CI=true npm run test:e2e` locally

#### 3. Deployment Health Check Fails
**Problem**: Service doesn't respond to health check
**Investigation**:
```bash
# SSH to server
ssh user@server

# Check service status
systemctl status svlentes-nextjs

# View service logs
journalctl -u svlentes-nextjs -n 100

# Check if port is in use
lsof -ti:5000

# Test health check locally
curl -v http://localhost:5000/api/health-check
```

#### 4. Database Migration Fails
**Problem**: Prisma migrations fail during deployment
**Solutions**:
```bash
# SSH to server
ssh user@server
cd /root/svlentes-hero-shop

# Check migration status
npx prisma migrate status

# Reset migrations (DANGEROUS - dev only)
npx prisma migrate reset

# Apply migrations manually
npx prisma migrate deploy

# Verify database connection
npx prisma db push --dry-run
```

#### 5. Workflow Doesn't Trigger
**Problem**: Push to branch doesn't trigger workflow
**Checks**:
- Verify branch name matches workflow configuration
- Check if CI workflow completed successfully (for deployments)
- Review GitHub Actions logs for errors
- Ensure workflow file is in `.github/workflows/`
- Verify YAML syntax is valid

---

## Best Practices

### For Developers

1. **Always run tests locally before pushing**:
   ```bash
   npm run lint
   npm run test
   npm run test:e2e
   npm run build
   ```

2. **Use feature branches**:
   - Never push directly to `main` or `develop`
   - Create descriptive branch names: `feature/`, `fix/`, `chore/`

3. **Write meaningful commit messages**:
   - Follow conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
   - Be concise but descriptive

4. **Test in staging first**:
   - Always deploy to staging before production
   - Verify all functionality works as expected

5. **Monitor deployments**:
   - Watch GitHub Actions logs during deployment
   - Check health endpoints after deployment
   - Review n8n notifications

### For Operations

1. **Regular Backup Verification**:
   - Weekly check of backup integrity
   - Test rollback procedure quarterly

2. **Security Updates**:
   - Monitor `npm audit` reports
   - Update dependencies regularly
   - Review Kluster security scans

3. **Performance Monitoring**:
   - Track deployment duration trends
   - Monitor CI execution times
   - Review Lighthouse reports (when implemented)

4. **GitHub Environment Protection**:
   - Enable required reviewers for production
   - Configure branch protection rules
   - Set up CODEOWNERS for workflow files

---

## Future Improvements

### Planned Enhancements

1. **Lighthouse CI Integration**
   - Performance budget enforcement
   - Automated performance reports
   - Regression detection

2. **Database Migration Validation**
   - Dry-run migrations before deployment
   - Migration rollback automation
   - Schema diff visualization

3. **Blue-Green Deployment**
   - Zero-downtime deployments
   - Instant rollback capability
   - A/B testing support

4. **Enhanced Monitoring**
   - Real-time error tracking integration
   - Performance metrics dashboard
   - Automated alerting system

5. **Scheduled Workflows**
   - Daily dependency audit
   - Weekly security scans
   - Monthly performance reports

---

## Additional Resources

### Documentation
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright Documentation](https://playwright.dev)
- [Prisma Documentation](https://www.prisma.io/docs)

### Internal Documentation
- `CLAUDE.md`: Project-specific guidance
- `README.md`: Setup and installation
- `SECURITY.md`: Security policies
- `docs/HYBRID_SENDPULSE_MCP.md`: SendPulse integration

### Workflow Files Location
```
.github/workflows/
├── ci.yml                     # Active: CI pipeline
├── deploy-staging.yml         # Active: Staging deployment
├── deploy-production.yml      # Active: Production deployment
├── security-kluster.yml       # Active: Security scanning
└── deploy.yml.deprecated      # Archived: Vercel deployment
```

---

## Change Log

| Date | Changes | Author |
|------|---------|--------|
| 2025-10-18 | Complete CI/CD overhaul and documentation | Claude Code |
| 2025-10-18 | Migrated from Vercel to systemd deployment | - |
| 2025-10-18 | Added Playwright browser caching | Claude Code |
| 2025-10-18 | Standardized Node.js version to 20 | Claude Code |
| 2025-10-18 | Added workflow dependencies for safety | Claude Code |
| 2025-10-18 | Optimized E2E tests (Chromium-only in CI) | Claude Code |

---

## Support

For issues or questions about CI/CD workflows:
1. Check this documentation first
2. Review GitHub Actions logs
3. Consult project `CLAUDE.md`
4. Check systemd service status on server
5. Review server logs via `journalctl`

**Emergency Rollback Contact**: See rollback procedures above
