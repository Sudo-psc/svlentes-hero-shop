# Vercel Deployment Guide - SV Lentes

Complete guide to deploy the SV Lentes Next.js application to Vercel.

## Prerequisites

- [x] GitHub repository configured: `https://github.com/Sudo-psc/svlentes-hero-shop.git`
- [ ] Vercel account (create at https://vercel.com)
- [ ] External PostgreSQL database (recommended: Vercel Postgres, Supabase, or Neon)
- [ ] All API keys ready (Asaas, SendPulse, OpenAI, Firebase, etc.)

## Architecture Changes

### Current (Systemd)
```
Nginx → Next.js (localhost:5000) → Local PostgreSQL
```

### Vercel (Serverless)
```
Vercel Edge → Serverless Functions → External PostgreSQL (Vercel Postgres/Supabase/Neon)
```

**Key Differences:**
- Serverless functions instead of long-running process
- External database required (Vercel can't host PostgreSQL directly)
- Automatic SSL/HTTPS (no Nginx needed)
- Global CDN for static assets
- Automatic deployment on git push

## Step 1: Prepare External Database

### Option A: Vercel Postgres (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Create Postgres database:
   ```bash
   vercel postgres create svlentes-db
   ```
4. Link to project:
   ```bash
   vercel link
   vercel env pull .env.local
   ```
5. Copy `DATABASE_URL` and `POSTGRES_PRISMA_URL` from `.env.local`

### Option B: Supabase
1. Create account at https://supabase.com
2. Create new project: "svlentes-production"
3. Copy connection string from Settings → Database
4. Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?pgbouncer=true&connection_limit=1`

### Option C: Neon
1. Create account at https://neon.tech
2. Create new project: "svlentes-production"
3. Copy connection string from Dashboard
4. Format includes built-in connection pooling

### Database Migration
```bash
# From current server database to new Vercel-compatible database

# 1. Export current data
cd /root/approuter/scripts
./backup-n8n.sh  # Backup current data

# 2. Update DATABASE_URL in .env.local with new external database URL

# 3. Push Prisma schema to new database
npx prisma db push

# 4. (Optional) Seed with initial data
npm run db:seed

# 5. Migrate production data (if needed)
# Export from current DB:
docker exec postgres pg_dump -U n8nuser n8ndb > /tmp/production_backup.sql

# Import to new DB (replace URL with your new database):
psql postgresql://user:pass@host:5432/dbname < /tmp/production_backup.sql
```

## Step 2: Configure Environment Variables

### Create `.env.production.vercel` from Template
Copy `.env.vercel.example` and fill in all values:

```bash
# Required Environment Variables for Vercel

# 1. Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://svlentes.shop  # Your Vercel domain
NEXT_PUBLIC_WHATSAPP_NUMBER=5533999898026

# 2. Database (CRITICAL - Use external database URL)
DATABASE_URL=postgresql://user:password@host:5432/database?pgbouncer=true&connection_limit=1
DATABASE_DIRECT_URL=postgresql://user:password@host:5432/database  # For migrations

# 3. Firebase Authentication
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}  # Full JSON as string

# 4. Asaas Payment Integration (CRITICAL)
ASAAS_ENV=production
ASAAS_API_KEY_PROD=your_production_asaas_key
ASAAS_WEBHOOK_TOKEN=your_webhook_secret

# 5. SendPulse WhatsApp Integration
SENDPULSE_APP_ID=your_app_id
SENDPULSE_APP_SECRET=your_app_secret
SENDPULSE_BOT_ID=your_bot_id

# 6. AI/OpenAI Integration
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langchain_key
LANGCHAIN_PROJECT=svlentes-whatsapp-chatbot

# 7. Email Service (Resend)
RESEND_API_KEY=your_resend_key
NEXT_PUBLIC_EMAIL_FROM=contato@svlentes.com.br

# 8. NextAuth (Generate new secret!)
NEXTAUTH_SECRET=your_nextauth_secret_min_32_chars
NEXTAUTH_URL=https://svlentes.shop

# 9. WordPress Integration (if used)
WORDPRESS_API_URL=https://svlentes.com.br/wp-json/wp/v2
NEXT_PUBLIC_WORDPRESS_URL=https://svlentes.com.br/wp
REVALIDATE_SECRET=your_revalidate_secret

# 10. Airtable Integration (if used)
AIRTABLE_API_KEY=your_airtable_key
AIRTABLE_BASE_ID=your_base_id
SUBSCRIPTION_DEMO_MODE=false

# 11. WhatsApp Verification
WHATSAPP_VERIFY_TOKEN=your_verify_token

# 12. Feature Flags
NEXT_PUBLIC_ENABLE_GITHUB_AUTH=true
```

**Generate Secrets:**
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate REVALIDATE_SECRET
openssl rand -hex 32

# Generate WHATSAPP_VERIFY_TOKEN
openssl rand -hex 16
```

## Step 3: Vercel Project Setup

### Option A: Via Vercel Dashboard (Recommended)

1. **Connect GitHub Repository**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select `Sudo-psc/svlentes-hero-shop`
   - Click "Import"

2. **Configure Project**
   - Project Name: `svlentes-shop`
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (leave as root)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

3. **Add Environment Variables**
   - Click "Environment Variables" section
   - For each variable in `.env.production.vercel`:
     - Click "Add New"
     - Name: Variable name (e.g., `DATABASE_URL`)
     - Value: Variable value
     - Environment: Select "Production", "Preview", and "Development"
   - **IMPORTANT**: Add all 30+ environment variables

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~3-5 minutes)
   - Verify deployment at `https://svlentes-shop.vercel.app`

### Option B: Via Vercel CLI

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link project
cd /root/svlentes-hero-shop
vercel link

# 4. Add environment variables (interactive)
vercel env add DATABASE_URL production
# Enter value when prompted
# Repeat for all environment variables

# 5. Or import from file
vercel env pull .env.vercel.production  # Pull from Vercel
vercel env import .env.production.vercel  # Push to Vercel (if you have a file)

# 6. Deploy to production
vercel --prod
```

## Step 4: Custom Domain Configuration

### Add Custom Domains

1. **Via Vercel Dashboard**
   - Go to Project → Settings → Domains
   - Add `svlentes.shop`
   - Add `svlentes.com.br`
   - Add `www.svlentes.shop`
   - Add `www.svlentes.com.br`

2. **Configure DNS Records**

   **For svlentes.shop:**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21 (Vercel IP)

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

   **For svlentes.com.br:**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **SSL Certificates**
   - Vercel automatically provisions SSL certificates
   - No manual Let's Encrypt setup needed
   - Certificates auto-renew

## Step 5: Configure Redirects

The `vercel.json` already includes redirects:
- `svlentes.com.br` → `https://saraivavision.com.br/lentes`
- `www.svlentes.com.br` → `https://saraivavision.com.br/lentes`

**Update if needed** in `vercel.json`:
```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "svlentes.com.br" }],
      "destination": "https://saraivavision.com.br/lentes",
      "permanent": true
    }
  ]
}
```

## Step 6: Webhook Configuration

### Update Webhook URLs

**Asaas Webhooks:**
- Login to Asaas Dashboard
- Go to Configurações → Webhooks
- Update URL to: `https://svlentes.shop/api/webhooks/asaas`
- Verify token matches `ASAAS_WEBHOOK_TOKEN`

**SendPulse Webhooks:**
- Login to SendPulse
- Go to WhatsApp Chatbot Settings
- Update webhook URL: `https://svlentes.shop/api/webhooks/sendpulse`

## Step 7: Database Migration & Seeding

```bash
# 1. Ensure DATABASE_URL points to external database
# (Should already be configured in Vercel environment variables)

# 2. Generate Prisma Client locally
npx prisma generate

# 3. Push schema to production database
# This runs on Vercel automatically during build
# To run manually:
npx prisma db push --force-reset  # CAUTION: Resets database

# 4. Seed database with initial data (if needed)
npm run db:seed

# 5. Verify database connection
npx prisma studio  # Opens GUI to verify data
```

## Step 8: Testing Deployment

### Automated Tests
```bash
# Before deploying, run all tests locally
npm run test                 # Unit tests
npm run test:resilience      # Resilience tests
npm run test:integration     # Integration tests
npm run test:e2e            # E2E tests

# Verify build
npm run build
```

### Manual Testing Checklist

- [ ] **Homepage**: Visit `https://svlentes.shop` - should load
- [ ] **Health Check**: `https://svlentes.shop/api/health-check` - should return 200
- [ ] **Database Connection**: Check `/area-assinante` - should connect to DB
- [ ] **Calculator**: Test `/calculadora` - should calculate savings
- [ ] **Payment Integration**: Test subscription flow with Asaas sandbox
- [ ] **WhatsApp Integration**: Send test message to chatbot number
- [ ] **Form Submissions**: Test consultation scheduling
- [ ] **SSL Certificate**: Verify HTTPS lock icon in browser
- [ ] **Performance**: Run Lighthouse audit - should score >90

### Performance Monitoring
```bash
# From local machine
npm run lighthouse  # Run against deployed URL

# Update lighthouse config to point to Vercel domain
# Edit .lighthouserc.js:
# url: 'https://svlentes.shop'
```

## Step 9: Monitoring & Alerts

### Vercel Analytics
- Enable in Project → Analytics
- Monitor Web Vitals (LCP, FID, CLS)
- Track page performance

### Vercel Logs
```bash
# View real-time logs
vercel logs --follow

# View specific deployment logs
vercel logs [deployment-url]
```

### Error Tracking
- Monitor `/api/monitoring/errors` endpoint
- Set up alerts for critical errors
- Review Vercel Function Logs regularly

## Step 10: Continuous Deployment

### Automatic Deployment
Vercel automatically deploys on:
- **Production**: Push to `master` branch → `https://svlentes.shop`
- **Preview**: Pull requests → Unique preview URL
- **Development**: Push to other branches → Preview deployment

### Manual Deployment
```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# Promote preview to production
vercel promote [deployment-url]
```

## Migration from Systemd to Vercel

### Parallel Running (Recommended)
1. Deploy to Vercel first
2. Test thoroughly on Vercel domain
3. Keep systemd version running
4. Update DNS to point to Vercel
5. Monitor for 24-48 hours
6. Decommission systemd version if stable

### Cutover Steps
```bash
# 1. Final backup of current system
cd /root/approuter/scripts
./backup-n8n.sh

# 2. Export production database
docker exec postgres pg_dump -U n8nuser n8ndb > /tmp/final_backup.sql

# 3. Import to Vercel database
psql $DATABASE_URL < /tmp/final_backup.sql

# 4. Update DNS records to point to Vercel
# (See Step 4: Custom Domain Configuration)

# 5. Verify deployment
curl -I https://svlentes.shop/api/health-check

# 6. Monitor logs
vercel logs --follow

# 7. After 48 hours of stable operation:
systemctl stop svlentes-nextjs
systemctl disable svlentes-nextjs
```

## Troubleshooting

### Build Failures

**Problem**: Build fails on Vercel
```bash
# Check build logs in Vercel dashboard
# Common issues:
1. Missing environment variables → Add in Vercel dashboard
2. TypeScript errors → Run `npm run lint` locally
3. Database connection → Verify DATABASE_URL is correct
4. Prisma generation → Ensure schema.prisma is valid
```

**Solution**:
```bash
# Test build locally
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Verify Prisma
npx prisma generate
npx prisma validate
```

### Database Connection Issues

**Problem**: "Can't reach database server"
```bash
# Verify DATABASE_URL format
# Should include connection pooling for serverless:
postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=1

# Test connection
npx prisma db pull  # Should pull schema successfully
```

### Environment Variable Issues

**Problem**: Missing or incorrect environment variables
```bash
# List all environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local

# Add missing variable
vercel env add VARIABLE_NAME production
```

### Webhook Failures

**Problem**: Webhooks not received
- Check webhook URL is publicly accessible
- Verify no trailing slashes
- Confirm authentication tokens match
- Check Vercel Function Logs for errors

### Performance Issues

**Problem**: Slow function execution
- Check function timeout (max 30s in vercel.json)
- Optimize database queries
- Enable connection pooling
- Use Prisma Accelerate for better performance

## Cost Estimation

### Vercel Pricing
- **Hobby Plan** (Free):
  - 100GB bandwidth/month
  - 100GB-hours function execution
  - 6,000 minutes build time
  - Suitable for: Low traffic (<10k visitors/month)

- **Pro Plan** ($20/month):
  - 1TB bandwidth/month
  - 1,000GB-hours function execution
  - 24,000 minutes build time
  - Suitable for: Production traffic (50k+ visitors/month)

### Database Costs
- **Vercel Postgres**: $10-100/month (based on storage)
- **Supabase**: Free tier available, paid from $25/month
- **Neon**: Free tier available, paid from $19/month

### Estimated Monthly Cost
- **Low Traffic** (<5k visitors): $0-10/month (Hobby + free DB)
- **Medium Traffic** (20k visitors): $30-50/month (Pro + DB)
- **High Traffic** (100k+ visitors): $100-200/month (Pro + scaled DB)

## Rollback Plan

### Immediate Rollback to Systemd
```bash
# 1. Revert DNS to point to original server
# Update A records to server IP

# 2. Restart systemd service
systemctl start svlentes-nextjs
systemctl status svlentes-nextjs

# 3. Verify service is running
curl -I https://svlentes.shop/api/health-check

# 4. Monitor logs
journalctl -u svlentes-nextjs -f
```

### Vercel Rollback
```bash
# Rollback to previous deployment
vercel rollback

# Or specify deployment URL
vercel rollback [previous-deployment-url]
```

## Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database connected and migrated
- [ ] Custom domains configured with DNS
- [ ] SSL certificates active (auto by Vercel)
- [ ] Webhooks updated (Asaas, SendPulse)
- [ ] Payment integration tested (sandbox first)
- [ ] WhatsApp chatbot tested
- [ ] All API endpoints responding
- [ ] Health check passing
- [ ] Performance metrics acceptable (Lighthouse >90)
- [ ] Error monitoring configured
- [ ] Backup strategy in place
- [ ] Team has access to Vercel dashboard
- [ ] Documentation updated
- [ ] Old systemd service decommissioned (after stable period)

## Support & Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Next.js on Vercel**: https://vercel.com/docs/frameworks/nextjs
- **Prisma on Vercel**: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
- **Vercel Community**: https://github.com/vercel/community
- **Project Repository**: https://github.com/Sudo-psc/svlentes-hero-shop

## Next Steps

1. **Set up Vercel account** at https://vercel.com
2. **Provision external database** (Vercel Postgres recommended)
3. **Configure all environment variables** from `.env.vercel.example`
4. **Import GitHub repository** to Vercel
5. **Test deployment** on Vercel preview URL
6. **Configure custom domains** once stable
7. **Update webhooks** to point to Vercel
8. **Monitor for 48 hours** before full cutover
9. **Decommission systemd version** once stable

---

**Questions or Issues?**
Contact: saraivavision@gmail.com
WhatsApp: +55 33 98606-1427
