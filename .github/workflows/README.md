# GitHub Actions Workflows

This directory contains CI/CD workflows for the SVLentes project.

## Current Workflows

### New Infrastructure (Systemd-based)

These workflows deploy to the production server using systemd services:

- **`ci.yml`**: Continuous integration with automated testing
- **`deploy-staging.yml`**: Deploy to staging environment
- **`deploy-production.yml`**: Deploy to production environment
- **`security-kluster.yml`**: Security and compliance scanning

### Legacy Infrastructure (Vercel-based)

- **`deploy.yml`**: Legacy Vercel deployment workflow (deprecated)

## Deployment Strategy

The project currently uses **systemd-based deployment** on a dedicated server:

- **Production**: https://svlentes.shop (Port 5000, systemd service)
- **Staging**: https://staging.svlentes.shop (Port 3001, systemd service)
- **Reverse Proxy**: Caddy for SSL/TLS termination

## Migration from Vercel

If migrating from Vercel to systemd deployment:

1. **Update secrets** (see `.github/SECRETS_SETUP.md`):
   - Remove: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
   - Add: `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER`

2. **Disable legacy workflow**:
   ```bash
   # Rename to prevent execution
   mv .github/workflows/deploy.yml .github/workflows/deploy.yml.disabled
   ```

3. **Configure new workflows**:
   - Set up SSH access to deployment servers
   - Configure database connection strings
   - Set up n8n webhook URLs
   - Test staging deployment first

## Workflow Execution Order

### On Push to `develop`:
1. `ci.yml` → Run tests and build check
2. `security-kluster.yml` → Security scanning
3. `deploy-staging.yml` → Deploy to staging

### On Push to `main`/`master`:
1. `ci.yml` → Full test suite
2. `security-kluster.yml` → Security scanning
3. `deploy-production.yml` → Deploy to production

## Manual Workflow Execution

```bash
# Via GitHub CLI
gh workflow run ci.yml
gh workflow run deploy-staging.yml
gh workflow run deploy-production.yml
gh workflow run security-kluster.yml

# Via GitHub UI
# Actions tab → Select workflow → Run workflow button
```

## Workflow Artifacts

- **Code Coverage**: 30 days retention
- **Playwright Reports**: 7 days retention
- **Security Reports**: 30 days retention

## Monitoring Integration

All deployment workflows integrate with n8n for:
- WhatsApp notifications to operations team
- Deployment logging to PostgreSQL
- Automated health checks
- Performance monitoring

## Troubleshooting

### Workflow Not Triggering

- Check branch name matches trigger configuration
- Verify GitHub Actions is enabled for repository
- Review workflow syntax with `yamllint`

### Deployment Failures

- Check secrets are configured correctly
- Verify SSH access to deployment servers
- Review workflow logs in GitHub Actions tab
- Test deployment scripts manually on server

### Security Scan Failures

- Review security-report.md artifact
- Address flagged vulnerabilities
- Update dependencies if needed
- Check LGPD compliance endpoints

## Additional Resources

- **CI/CD Pipeline Documentation**: `/docs/CI_CD_PIPELINE.md`
- **Deployment Guide**: `/docs/DEPLOYMENT_GUIDE.md`
- **Secrets Setup**: `.github/SECRETS_SETUP.md`
- **Project Overview**: `/CLAUDE.md`
