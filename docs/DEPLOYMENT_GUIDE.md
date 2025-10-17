# Deployment Runbook

Quick reference guide for deploying SVLentes application.

## Quick Commands

### Check Status
```bash
# Production status
systemctl status svlentes-nextjs
curl https://svlentes.shop/api/health-check

# Staging status
systemctl status svlentes-staging
curl https://staging.svlentes.shop/api/health-check

# View logs
journalctl -u svlentes-nextjs -f
journalctl -u svlentes-staging -f
```

### Deploy via Git Push
```bash
# Staging
git push origin develop

# Production
git push origin master
```

### Manual Deployment
```bash
# Via GitHub CLI
gh workflow run deploy-production.yml
gh workflow run deploy-staging.yml

# Manual on server
cd /root/svlentes-hero-shop
git pull origin master
npm ci
npm run build
systemctl restart svlentes-nextjs
```

### Rollback
```bash
# Production
./scripts/ci/rollback.sh production latest

# Staging
./scripts/ci/rollback.sh staging latest

# Specific backup
./scripts/ci/rollback.sh production svlentes-20250117_143000
```

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test && npm run test:e2e`)
- [ ] Build successful (`npm run build`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No lint errors (`npm run lint`)
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Security scan clean
- [ ] Code reviewed and approved

## Deployment Steps

### 1. Staging Deployment

```bash
# Automatic via GitHub Actions
git checkout develop
git pull origin develop
git add .
git commit -m "feat: your feature"
git push origin develop

# Wait 5-8 minutes for CI/CD
# Check https://staging.svlentes.shop
```

### 2. Production Deployment

```bash
# Merge develop to master
git checkout master
git merge develop
git push origin master

# Wait 8-12 minutes for full CI/CD
# Monitor: https://github.com/your-org/svlentes/actions
# Verify: https://svlentes.shop
```

### 3. Emergency Hotfix

```bash
# Create hotfix branch
git checkout master
git checkout -b hotfix/critical-issue

# Make minimal fix
# ... edit files ...
git add .
git commit -m "fix: critical issue description"

# Push and create PR
git push origin hotfix/critical-issue
gh pr create --base master --head hotfix/critical-issue

# After approval, merge and deploy
git checkout master
git merge hotfix/critical-issue
git push origin master
```

## Post-Deployment Verification

### Automated Checks (via CI/CD)
- Health endpoint responding
- Critical pages accessible
- API endpoints operational
- Performance metrics normal
- No critical errors in logs

### Manual Checks
```bash
# Test critical flows
1. Visit homepage: https://svlentes.shop
2. Test calculator: https://svlentes.shop/calculadora
3. Test subscription: https://svlentes.shop/assinar
4. Test consultation booking: https://svlentes.shop/agendar-consulta

# Check monitoring
curl https://svlentes.shop/api/monitoring/performance
curl https://svlentes.shop/api/monitoring/errors

# Review logs
ssh user@server
journalctl -u svlentes-nextjs -n 50 --no-pager
```

### User Acceptance Testing
- [ ] Form submissions working
- [ ] WhatsApp integration functional
- [ ] Payment flow operational (test mode)
- [ ] Email notifications sending
- [ ] Calculator accurate
- [ ] Mobile responsive
- [ ] No console errors

## Rollback Procedure

### When to Rollback
- Critical bugs affecting user experience
- Health checks consistently failing
- Database issues preventing operation
- Security vulnerability discovered
- Performance degradation >50%

### How to Rollback

**Option 1: Automated Script**
```bash
ssh user@server
cd /root/svlentes-hero-shop
./scripts/ci/rollback.sh production latest
```

**Option 2: Manual Rollback**
```bash
ssh user@server
cd /root/svlentes-hero-shop

# Stop service
systemctl stop svlentes-nextjs

# Restore from backup
BACKUP=$(ls -t ~/backups/ | head -1)
rm -rf .next
cp -r ~/backups/$BACKUP/.next .

# Restore git commit
git checkout $(cat ~/backups/$BACKUP/git-commit.txt)

# Reinstall and rebuild
npm ci
npm run build

# Restart service
systemctl start svlentes-nextjs

# Verify
curl http://localhost:5000/api/health-check
```

**Option 3: Revert Git Commit**
```bash
# Find problematic commit
git log --oneline -10

# Revert commit
git revert <commit-hash>
git push origin master

# CI/CD will automatically deploy reverted version
```

## Troubleshooting

### Service Won't Start

**Check:**
```bash
systemctl status svlentes-nextjs
journalctl -u svlentes-nextjs -n 100 --no-pager
```

**Common Issues:**
- Port 5000 already in use: `lsof -ti:5000 | xargs kill -9`
- Missing environment variables: Check `/root/svlentes-hero-shop/.env.local`
- Build failed: Run `npm run build` manually
- Permissions: Check file ownership `ls -la`

### Health Check Failing

**Check:**
```bash
# Test locally
curl http://localhost:5000/api/health-check

# Check service status
systemctl status svlentes-nextjs

# Check system resources
free -h
df -h

# Check database connectivity
docker ps | grep postgres
```

**Solutions:**
- Restart service: `systemctl restart svlentes-nextjs`
- Clear cache: `rm -rf .next && npm run build`
- Check logs: `journalctl -u svlentes-nextjs -n 100`

### Database Migration Errors

**Check Migration Status:**
```bash
npx prisma migrate status
npx prisma migrate diff
```

**Resolve Issues:**
```bash
# Regenerate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# If blocked, check database
docker exec postgres psql -U n8nuser svlentes_prod -c "\dt"
```

### Performance Issues

**Check Metrics:**
```bash
curl https://svlentes.shop/api/monitoring/performance
```

**Common Causes:**
- High memory usage: Restart service
- Slow database queries: Review query performance
- High traffic: Check server resources
- Large bundle size: Review build output

**Solutions:**
```bash
# Restart service
systemctl restart svlentes-nextjs

# Check system resources
htop
df -h
free -h

# Review application logs
journalctl -u svlentes-nextjs -n 100 | grep -i error
```

## Monitoring

### Real-Time Monitoring
```bash
# Application logs
journalctl -u svlentes-nextjs -f

# System resources
htop

# Network connections
netstat -tulpn | grep 5000

# Disk usage
df -h
```

### n8n Monitoring Workflow
- Runs every 5 minutes
- Checks `/api/health-check`
- Monitors `/api/monitoring/performance`
- Tracks `/api/monitoring/errors`
- Sends WhatsApp alerts on failures

### Alert Contacts
- **Operations Team**: +55 33 99898-026 (WhatsApp)
- **n8n Dashboard**: https://saraivavision-n8n.cloud
- **GitHub Actions**: https://github.com/your-org/svlentes/actions

## Maintenance Windows

### Scheduled Maintenance
- **Frequency**: Monthly (first Sunday, 2:00-4:00 AM BRT)
- **Tasks**:
  - Dependency updates
  - Security patches
  - Database maintenance
  - Backup verification

### Maintenance Procedure
```bash
# 1. Announce maintenance
# 2. Create full backup
cd /root/svlentes-hero-shop
npm run build
./scripts/ci/rollback.sh production latest  # Creates backup

# 3. Update dependencies
npm update
npm audit fix

# 4. Test updates
npm test
npm run test:e2e
npm run build

# 5. Deploy
git add package*.json
git commit -m "chore: update dependencies"
git push origin master

# 6. Verify deployment
curl https://svlentes.shop/api/health-check

# 7. Monitor for 30 minutes
journalctl -u svlentes-nextjs -f
```

## Emergency Contacts

**Technical Escalation:**
1. DevOps Team: +55 33 99898-026
2. Database Admin: (backup contact)
3. Infrastructure Provider: (hosting support)

**Business Escalation:**
1. Dr. Philipe Saraiva Cruz: (medical oversight)
2. Operations Manager: (business decisions)
3. Legal Compliance: (LGPD issues)

## Backup Strategy

### Automated Backups
- **Deployment backups**: Created before each production deploy
- **Retention**: 5 most recent backups
- **Location**: `~/backups/svlentes-*`
- **Contents**: Code (.next), environment (.env.local), database dump

### Manual Backup
```bash
# Create backup
BACKUP_DIR=~/backups/manual-$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cd /root/svlentes-hero-shop
cp -r .next $BACKUP_DIR/
cp .env.local $BACKUP_DIR/
git rev-parse HEAD > $BACKUP_DIR/git-commit.txt
docker exec postgres pg_dump -U n8nuser svlentes_prod > $BACKUP_DIR/database.sql

echo "Backup created: $BACKUP_DIR"
```

### Restore from Backup
```bash
# Use rollback script (recommended)
./scripts/ci/rollback.sh production <backup-name>

# Or manual restore
BACKUP_DIR=~/backups/svlentes-20250117_143000
cd /root/svlentes-hero-shop
systemctl stop svlentes-nextjs
rm -rf .next
cp -r $BACKUP_DIR/.next .
cp $BACKUP_DIR/.env.local .
git checkout $(cat $BACKUP_DIR/git-commit.txt)
systemctl start svlentes-nextjs
```

## Security Incidents

### Suspected Security Breach
1. **Immediate**: Disable public access (edit Caddy config)
2. **Investigate**: Review access logs and application logs
3. **Assess**: Determine scope and impact
4. **Contain**: Rotate credentials, patch vulnerability
5. **Recover**: Restore from clean backup if needed
6. **Report**: Document incident, notify stakeholders

### Credential Compromise
```bash
# 1. Rotate GitHub secrets
gh secret set ASAAS_API_KEY_PROD --body "new-key"
gh secret set SSH_PRIVATE_KEY < new-key-file

# 2. Rotate database password
# - Update PostgreSQL password
# - Update DATABASE_URL secret
# - Redeploy application

# 3. Rotate Asaas API keys
# - Generate new keys in Asaas dashboard
# - Update GitHub secrets
# - Redeploy application

# 4. Review access logs
journalctl -u svlentes-nextjs -S today | grep -i error
```

## Performance Optimization

### Regular Optimization Tasks
- Monitor bundle size: `npm run build` output
- Review dependencies: `npm audit`
- Check image optimization: Review `public/` folder
- Database query performance: Review Prisma queries
- Cache effectiveness: Check response times

### Optimization Commands
```bash
# Analyze bundle size
npm run build -- --analyze

# Update dependencies
npm update
npm audit fix

# Optimize images
npm run optimize:icons
npm run optimize:logo

# Clear build cache
rm -rf .next
npm run build
```

## Additional Resources

- **Main Documentation**: `/root/svlentes-hero-shop/CLAUDE.md`
- **CI/CD Pipeline**: `/root/svlentes-hero-shop/docs/CI_CD_PIPELINE.md`
- **Secrets Setup**: `/root/svlentes-hero-shop/.github/SECRETS_SETUP.md`
- **n8n Workflows**: `/root/svlentes-hero-shop/n8n-workflows/README.md`
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **GitHub Actions**: https://docs.github.com/actions
