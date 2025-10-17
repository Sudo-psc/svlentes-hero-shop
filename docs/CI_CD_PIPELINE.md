# CI/CD Pipeline Documentation

Complete guide for the SVLentes continuous integration and deployment pipeline.

## Overview

The SVLentes CI/CD pipeline automates testing, security scanning, and deployment using GitHub Actions, with monitoring and notifications via n8n workflows.

**Pipeline Architecture:**
```
Code Push → CI Tests → Security Scan → Build → Deploy → Health Check → Notify
```

## Workflows

### 1. CI - Test Automation (`ci.yml`)

**Triggers:**
- Push to `main`, `master`, or `develop` branches
- Pull requests to `main`, `master`, or `develop` branches

**Jobs:**
- **Lint**: ESLint + TypeScript type checking
- **Unit Tests**: Jest with coverage reports
- **E2E Tests**: Playwright browser automation
- **Build Check**: Production bundle verification
- **Security Scan**: npm audit for vulnerabilities

**Runtime**: ~5-8 minutes

**Artifacts:**
- Code coverage reports (Codecov)
- Playwright test reports (7-day retention)
- Security audit reports (30-day retention)

### 2. Deploy to Staging (`deploy-staging.yml`)

**Triggers:**
- Push to `develop` branch
- Manual workflow dispatch

**Environment:** `staging`

**Steps:**
1. Checkout code and install dependencies
2. Run tests (unit + lint)
3. Build with staging environment variables
4. SSH to staging server
5. Backup current deployment
6. Deploy new build
7. Run database migrations
8. Restart staging service
9. Health check verification
10. Send notification to n8n

**Rollback**: Automatic on health check failure

**URL**: https://staging.svlentes.shop

### 3. Deploy to Production (`deploy-production.yml`)

**Triggers:**
- Push to `main` or `master` branch
- Manual workflow dispatch

**Environment:** `production`

**Steps:**
1. Checkout code and install dependencies
2. **Full test suite** (unit, E2E, lint, type check)
3. Build with production environment variables
4. Create deployment backup (code + database)
5. SSH to production server
6. Deploy new build with git commit tracking
7. Run database migrations (Prisma)
8. Restart production systemd service
9. Multi-retry health check (5 attempts)
10. Smoke test critical endpoints
11. Send success/failure notification to n8n

**Rollback**: Automatic on failure with git revert

**URL**: https://svlentes.shop

**Safety Features:**
- Full test suite required
- Automated backups before deployment
- Multi-retry health checks
- Automatic rollback on failure
- Critical endpoint smoke tests
- Database backup included

### 4. Security - Kluster (`security-kluster.yml`)

**Triggers:**
- Push to `main`, `master`, or `develop` branches
- Pull requests
- Manual workflow dispatch

**Scans:**
- **Dependency validation**: npm audit + Kluster integration
- **Security headers**: Validates CSP, HSTS, X-Frame-Options, etc.
- **Environment secrets**: Detects hardcoded secrets
- **LGPD compliance**: Validates privacy endpoints
- **Healthcare compliance**: Verifies CRM credentials and emergency info
- **Payment security**: Validates Asaas webhook token implementation

**Outputs:**
- Security report (30-day retention)
- PR comment with scan summary
- Automated recommendations

**LGPD Endpoints Validated:**
- `/api/privacy/consent-log`
- `/api/privacy/data-request`
- `/politica-privacidade`

**Healthcare Requirements:**
- Medical professional credentials (CRM-MG 69.870)
- Emergency contact information
- Regulatory disclaimers

## Deployment Process

### Staging Deployment

```bash
# Triggered automatically on push to develop
git checkout develop
git pull origin develop
# Make changes
git add .
git commit -m "feat: new feature"
git push origin develop

# GitHub Actions will automatically:
# 1. Run tests
# 2. Build application
# 3. Deploy to staging.svlentes.shop
# 4. Run health checks
# 5. Send notifications
```

### Production Deployment

```bash
# Merge to main/master
git checkout master
git merge develop
git push origin master

# GitHub Actions will automatically:
# 1. Run FULL test suite (unit + E2E)
# 2. Create backup (code + database)
# 3. Build production bundle
# 4. Deploy to production server
# 5. Run database migrations
# 6. Restart systemd service
# 7. Verify with smoke tests
# 8. Send notifications

# Manual deployment (emergency)
gh workflow run deploy-production.yml
```

### Manual Deployment

```bash
# Via GitHub CLI
gh workflow run deploy-staging.yml
gh workflow run deploy-production.yml

# Via GitHub UI
# 1. Go to Actions tab
# 2. Select workflow
# 3. Click "Run workflow"
# 4. Choose branch
# 5. Click "Run workflow" button
```

## Environment Variables

### Required for CI/CD

See `.github/SECRETS_SETUP.md` for complete configuration guide.

**GitHub Secrets:**
```
NEXT_PUBLIC_WHATSAPP_NUMBER=553399898026
ASAAS_API_KEY_PROD=<production-key>
ASAAS_API_KEY_SANDBOX=<sandbox-key>
ASAAS_WEBHOOK_TOKEN=<webhook-token>
DATABASE_URL_STAGING=postgresql://...
DATABASE_URL_PROD=postgresql://...
SSH_PRIVATE_KEY=<deploy-key>
SSH_HOST=<server-ip>
SSH_USER=deploy
N8N_WEBHOOK_URL=https://saraivavision-n8n.cloud/webhook
```

### Environment-Specific

**Staging:**
- `NEXT_PUBLIC_APP_URL=https://staging.svlentes.shop`
- `ASAAS_ENV=sandbox`
- Port: 3001
- Service: `svlentes-staging`

**Production:**
- `NEXT_PUBLIC_APP_URL=https://svlentes.shop`
- `ASAAS_ENV=production`
- Port: 5000
- Service: `svlentes-nextjs`

## Monitoring & Alerting

### n8n Workflows

**1. Deployment Notifications**
- Webhook triggers from GitHub Actions
- WhatsApp notifications to operations team
- Deployment logging to PostgreSQL
- Post-deployment health checks

**2. Production Monitoring**
- Runs every 5 minutes
- Health check: `/api/health-check`
- Performance metrics: `/api/monitoring/performance`
- Error tracking: `/api/monitoring/errors`
- WhatsApp alerts on failures

### Monitoring Endpoints

**`GET /api/health-check`**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-17T00:00:00.000Z",
  "services": {
    "database": "connected",
    "api": "operational"
  }
}
```

**`GET /api/monitoring/performance`**
```json
{
  "timestamp": "2025-01-17T00:00:00.000Z",
  "responseTime": 45,
  "server": {
    "uptime": 86400,
    "memory": { "heapUsed": 150, "heapTotal": 512 },
    "nodeVersion": "v20.x.x"
  },
  "health": {
    "status": "healthy",
    "memoryPressure": "normal"
  }
}
```

**`GET /api/monitoring/errors`**
- Returns recent error logs
- Used by n8n for alert triggers

### Alert Thresholds

- **Health check failure**: Critical alert → Immediate notification
- **Response time > 3000ms**: Performance warning
- **Error count > 10**: High error alert
- **Memory pressure > 90%**: Resource alert

## Scripts

### Health Check (`scripts/ci/health-check.sh`)

**Usage:**
```bash
./scripts/ci/health-check.sh [production|staging] [max_retries] [retry_delay]

# Examples
./scripts/ci/health-check.sh production
./scripts/ci/health-check.sh staging 5 10
```

**Checks:**
1. Internal health endpoint (localhost)
2. Public health endpoint
3. Critical pages (homepage, calculator, subscription)
4. API endpoints
5. Performance (response time)
6. Systemd service status

**Exit Codes:**
- `0`: All checks passed
- `1`: One or more checks failed

### Rollback (`scripts/ci/rollback.sh`)

**Usage:**
```bash
./scripts/ci/rollback.sh [production|staging] [backup_id|latest]

# Examples
./scripts/ci/rollback.sh production latest
./scripts/ci/rollback.sh staging svlentes-20250117_143000
```

**Process:**
1. Stop current service
2. Create safety backup
3. Restore from specified backup
4. Restore git commit (if available)
5. Restore database (optional)
6. Restart service
7. Run health checks

**Safety Features:**
- Confirmation prompt
- Safety backup before rollback
- List of available backups
- Health check after rollback

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing locally
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] LGPD compliance validated
- [ ] Security scan clean
- [ ] Backup strategy verified

### Post-Deployment

- [ ] Health checks passing
- [ ] Critical pages accessible
- [ ] Database migrations applied
- [ ] Monitoring alerts configured
- [ ] Performance metrics normal
- [ ] Error logs reviewed
- [ ] Team notified

## Troubleshooting

### Build Failures

**Symptom**: GitHub Actions build fails

**Solutions:**
```bash
# Check TypeScript errors
npm run lint
npx tsc --noEmit

# Verify dependencies
npm ci
npm audit

# Test build locally
npm run build
```

### Deployment Failures

**Symptom**: Deployment health check fails

**Solutions:**
```bash
# SSH to server
ssh user@server

# Check service status
systemctl status svlentes-nextjs
journalctl -u svlentes-nextjs -n 100

# Verify application
curl http://localhost:5000/api/health-check

# Check system resources
free -h
df -h
```

### Rollback Procedure

**When to rollback:**
- Health checks failing after deployment
- Critical bugs in production
- Database migration issues
- Performance degradation

**How to rollback:**
```bash
# SSH to production server
ssh user@server
cd /root/svlentes-hero-shop

# List available backups
ls -lh ~/backups/

# Execute rollback
./scripts/ci/rollback.sh production latest

# Verify rollback
curl https://svlentes.shop/api/health-check
systemctl status svlentes-nextjs
```

### n8n Webhook Not Triggering

**Symptoms:**
- No deployment notifications
- Monitoring alerts not working

**Solutions:**
```bash
# Verify webhook URL
echo $N8N_WEBHOOK_URL

# Test webhook manually
curl -X POST $N8N_WEBHOOK_URL/staging-deployment \
  -H "Content-Type: application/json" \
  -d '{"status": "success", "test": true}'

# Check n8n workflow status
# - Open n8n UI
# - Verify workflow is active (not paused)
# - Check execution logs
```

### Database Migration Issues

**Symptoms:**
- Deployment fails at migration step
- Database schema mismatch

**Solutions:**
```bash
# Check migration status
npx prisma migrate status

# Review pending migrations
npx prisma migrate diff

# Rollback last migration (if needed)
# Note: Prisma doesn't support automatic rollback
# You need to manually revert or create new migration

# Force migration (use with caution)
npx prisma migrate deploy --force
```

## Best Practices

### Code Quality

- Write tests for new features
- Maintain >80% code coverage
- Follow ESLint rules
- Use TypeScript strictly
- Run Kluster reviews in development

### Security

- Never commit secrets
- Use environment variables
- Rotate credentials regularly (90 days)
- Review security scan results
- Keep dependencies updated
- Validate LGPD compliance

### Deployment

- Deploy to staging first
- Test critical user flows
- Monitor for 10 minutes post-deployment
- Keep backups for 30 days
- Document deployment issues
- Communicate with team

### Monitoring

- Check health endpoints regularly
- Review error logs daily
- Monitor performance trends
- Set up appropriate alerts
- Respond to alerts promptly
- Document incidents

## Emergency Procedures

### Production Down

1. **Check health endpoints**
   ```bash
   curl https://svlentes.shop/api/health-check
   ```

2. **Check service status**
   ```bash
   ssh user@server
   systemctl status svlentes-nextjs
   ```

3. **Review logs**
   ```bash
   journalctl -u svlentes-nextjs -n 100 --no-pager
   ```

4. **Restart service**
   ```bash
   systemctl restart svlentes-nextjs
   ```

5. **If issue persists, rollback**
   ```bash
   ./scripts/ci/rollback.sh production latest
   ```

6. **Notify team** via WhatsApp and email

### Critical Bug in Production

1. **Assess severity** (user impact, data safety)
2. **If severe, rollback immediately**
3. **If moderate, prepare hotfix**
   ```bash
   git checkout -b hotfix/issue-description
   # Make minimal fix
   git commit -m "fix: critical issue"
   git push origin hotfix/issue-description
   # Create PR to master
   ```
4. **Merge and deploy hotfix**
5. **Verify fix in production**
6. **Document incident**

### Database Issues

1. **Stop deployments** (disable GitHub Actions)
2. **Assess database state**
   ```bash
   docker exec postgres psql -U n8nuser svlentes_prod -c "\dt"
   ```
3. **Create database backup**
   ```bash
   docker exec postgres pg_dump -U n8nuser svlentes_prod > emergency-backup.sql
   ```
4. **If corruption, restore from backup**
5. **Verify data integrity**
6. **Resume deployments**

## Metrics & KPIs

### Deployment Metrics

- **Deployment frequency**: Target 5-10/week
- **Lead time**: Target <30 minutes
- **Change failure rate**: Target <5%
- **Mean time to recovery**: Target <15 minutes

### Application Metrics

- **Uptime**: Target 99.9%
- **Response time**: Target <2 seconds
- **Error rate**: Target <0.5%
- **Test coverage**: Target >80%

### Security Metrics

- **Vulnerability scan frequency**: Every commit
- **Critical vulnerabilities**: Target 0
- **Secret exposure incidents**: Target 0
- **Compliance violations**: Target 0

## Support & Resources

- **GitHub Actions Documentation**: https://docs.github.com/actions
- **n8n Documentation**: https://docs.n8n.io
- **Prisma Migrations**: https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Project CLAUDE.md**: `/root/svlentes-hero-shop/CLAUDE.md`
- **Secrets Setup Guide**: `.github/SECRETS_SETUP.md`
