# GitHub Secrets Configuration Guide

This guide provides instructions for configuring GitHub repository secrets required for the CI/CD pipeline.

## Required Secrets

### Application Configuration

#### NEXT_PUBLIC_WHATSAPP_NUMBER
- **Value**: `553399898026`
- **Usage**: WhatsApp contact integration
- **Required for**: All environments

### Payment Integration (Asaas)

#### ASAAS_API_KEY_PROD
- **Value**: Production API key from Asaas dashboard
- **Usage**: Production payment processing
- **Required for**: Production deployment
- **Security**: Never commit or expose this value

#### ASAAS_API_KEY_SANDBOX
- **Value**: Sandbox API key from Asaas dashboard
- **Usage**: Staging/testing payment processing
- **Required for**: Staging deployment and testing
- **Security**: Can be rotated frequently for testing

#### ASAAS_WEBHOOK_TOKEN
- **Value**: Webhook verification token from Asaas
- **Usage**: Validate incoming Asaas webhooks
- **Required for**: All environments
- **Security**: Must match Asaas dashboard configuration

### Database Configuration

#### DATABASE_URL_STAGING
- **Format**: `postgresql://user:password@host:port/database`
- **Example**: `postgresql://n8nuser:password@localhost:5432/svlentes_staging`
- **Usage**: Staging database connection
- **Required for**: Staging deployment

#### DATABASE_URL_PROD
- **Format**: `postgresql://user:password@host:port/database`
- **Example**: `postgresql://n8nuser:password@localhost:5432/svlentes_prod`
- **Usage**: Production database connection
- **Required for**: Production deployment
- **Security**: Use strong password, restrict access

### SSH Deployment

#### SSH_PRIVATE_KEY
- **Value**: Private SSH key for deployment access
- **Format**: Full private key including headers
- **Usage**: Deploy to production/staging servers
- **Required for**: All deployments
- **Generation**:
  ```bash
  ssh-keygen -t ed25519 -C "github-actions-deploy"
  # Copy private key: cat ~/.ssh/id_ed25519
  # Add public key to server: ssh-copy-id user@server
  ```

#### SSH_HOST
- **Value**: Server hostname or IP
- **Example**: `123.45.67.89` or `svlentes.shop`
- **Usage**: Deployment target server
- **Required for**: All deployments

#### SSH_USER
- **Value**: SSH username for deployment
- **Example**: `root` or `deploy`
- **Usage**: SSH connection username
- **Required for**: All deployments
- **Security**: Use dedicated deployment user with limited permissions

### Monitoring & Notifications

#### N8N_WEBHOOK_URL
- **Value**: n8n instance base URL
- **Example**: `https://saraivavision-n8n.cloud/webhook`
- **Usage**: Deployment and monitoring notifications
- **Required for**: Production monitoring
- **Note**: Append specific webhook paths in workflows

### Optional Integrations

#### RESEND_API_KEY
- **Value**: API key from Resend email service
- **Usage**: Email notifications and transactional emails
- **Required for**: Email functionality (optional)

#### NEXTAUTH_SECRET
- **Value**: Random secure string (32+ characters)
- **Usage**: NextAuth.js session encryption
- **Required for**: Authentication features (if implemented)
- **Generation**: `openssl rand -base64 32`

#### NEXT_PUBLIC_GA_MEASUREMENT_ID
- **Value**: Google Analytics measurement ID
- **Example**: `G-XXXXXXXXXX`
- **Usage**: Analytics tracking
- **Required for**: Analytics (optional)

## Setting Up Secrets in GitHub

### Via GitHub UI

1. Navigate to repository settings
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter secret name and value
5. Click **Add secret**

### Via GitHub CLI

```bash
# Install GitHub CLI if needed
# brew install gh  # macOS
# apt install gh   # Linux

# Authenticate
gh auth login

# Add secrets
gh secret set ASAAS_API_KEY_PROD
gh secret set ASAAS_API_KEY_SANDBOX
gh secret set SSH_PRIVATE_KEY < ~/.ssh/id_ed25519
gh secret set SSH_HOST --body "your-server.com"
gh secret set SSH_USER --body "deploy"
gh secret set DATABASE_URL_PROD --body "postgresql://..."
gh secret set N8N_WEBHOOK_URL --body "https://n8n.example.com/webhook"
```

## Environment-Specific Configuration

### Staging Environment

```bash
# Required secrets for staging
NEXT_PUBLIC_WHATSAPP_NUMBER=553399898026
ASAAS_API_KEY_SANDBOX=<sandbox-key>
ASAAS_WEBHOOK_TOKEN=<webhook-token>
DATABASE_URL_STAGING=postgresql://...
SSH_PRIVATE_KEY=<deploy-key>
SSH_HOST=<server>
SSH_USER=deploy
N8N_WEBHOOK_URL=https://saraivavision-n8n.cloud/webhook
```

### Production Environment

```bash
# Required secrets for production
NEXT_PUBLIC_WHATSAPP_NUMBER=553399898026
ASAAS_API_KEY_PROD=<production-key>
ASAAS_WEBHOOK_TOKEN=<webhook-token>
DATABASE_URL_PROD=postgresql://...
SSH_PRIVATE_KEY=<deploy-key>
SSH_HOST=<server>
SSH_USER=deploy
N8N_WEBHOOK_URL=https://saraivavision-n8n.cloud/webhook
NEXTAUTH_SECRET=<secret>
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Security Best Practices

### Secret Management

1. **Rotation**: Rotate sensitive secrets regularly (90 days recommended)
2. **Least Privilege**: Use dedicated service accounts with minimal permissions
3. **Audit**: Review secret access logs periodically
4. **Encryption**: All secrets encrypted at rest by GitHub
5. **No Hardcoding**: Never commit secrets to repository

### SSH Key Security

```bash
# Generate dedicated deployment key
ssh-keygen -t ed25519 -f github-actions-deploy -C "github-actions@svlentes"

# Set appropriate permissions
chmod 600 github-actions-deploy
chmod 644 github-actions-deploy.pub

# Add public key to server
cat github-actions-deploy.pub | ssh user@server "cat >> ~/.ssh/authorized_keys"

# Copy private key to GitHub secret (entire file)
cat github-actions-deploy
```

### Database Connection Security

```bash
# Use connection string format with encoded password
# If password contains special characters, URL-encode them
# Example: p@ssw0rd becomes p%40ssw0rd

# Recommended: Use SSL/TLS for database connections
postgresql://user:password@host:5432/db?sslmode=require
```

## Verification Checklist

Before enabling CI/CD pipelines, verify:

- [ ] All required secrets added to GitHub repository
- [ ] SSH key pair generated and configured correctly
- [ ] Public key added to deployment servers
- [ ] Database connections tested from GitHub Actions runners
- [ ] Webhook URLs confirmed with n8n instance
- [ ] Asaas API keys verified (sandbox and production)
- [ ] Webhook tokens match Asaas dashboard configuration
- [ ] Environment-specific secrets set correctly
- [ ] No secrets hardcoded in source code
- [ ] `.env.local.example` updated with all required variables

## Testing Secret Configuration

### Test SSH Connection

```bash
# From local machine with private key
ssh -i github-actions-deploy user@server "echo 'Connection successful'"
```

### Test Database Connection

```bash
# PostgreSQL connection test
psql "postgresql://user:password@host:5432/database" -c "SELECT 1"
```

### Test Asaas API Key

```bash
# Test sandbox key
curl https://sandbox.asaas.com/api/v3/customers \
  -H "access_token: $ASAAS_API_KEY_SANDBOX"

# Test production key (use carefully)
curl https://www.asaas.com/api/v3/customers \
  -H "access_token: $ASAAS_API_KEY_PROD"
```

### Test n8n Webhook

```bash
# Test webhook endpoint
curl -X POST $N8N_WEBHOOK_URL/test \
  -H "Content-Type: application/json" \
  -d '{"test": "message"}'
```

## Troubleshooting

### Secret Not Available in Workflow

- Verify secret name matches exactly (case-sensitive)
- Check secret is set at repository level (not organization)
- Confirm workflow has permission to access secrets
- Review workflow syntax: `${{ secrets.SECRET_NAME }}`

### SSH Connection Failures

- Verify private key format (include headers)
- Check server SSH configuration allows key authentication
- Confirm public key added to correct user's authorized_keys
- Test SSH connection manually before workflow execution

### Database Connection Errors

- Verify connection string format is correct
- Check database server allows connections from GitHub IPs
- Confirm username and password are correct
- Test connection from similar external IP address

### Webhook Not Triggering

- Verify webhook URL is accessible publicly
- Check n8n workflow is active (not paused)
- Confirm webhook path matches workflow configuration
- Review n8n execution logs for errors

## Support & Resources

- **GitHub Secrets Documentation**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Asaas API Documentation**: https://docs.asaas.com/
- **n8n Webhook Documentation**: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- **PostgreSQL Connection Strings**: https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING
