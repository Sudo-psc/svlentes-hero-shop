# Vercel Deployment Quick Start Guide

**TL;DR**: 5-step guide to deploy SV Lentes to Vercel in ~30 minutes.

## Prerequisites Quick Check
- [ ] Vercel account created (https://vercel.com)
- [ ] GitHub repository access
- [ ] Database ready (Vercel Postgres/Supabase/Neon)
- [ ] API keys collected (see `.env.vercel.example`)

## Step 1: Database Setup (5 minutes)

### Option A: Vercel Postgres (Easiest)
```bash
npm i -g vercel
vercel login
vercel postgres create svlentes-db
vercel env pull .env.local
# Copy DATABASE_URL from .env.local
```

### Option B: Supabase (Free tier available)
1. Go to https://supabase.com → New Project
2. Name: "svlentes-production"
3. Copy connection string: Settings → Database
4. Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?pgbouncer=true&connection_limit=1`

### Option C: Neon (Serverless Postgres)
1. Go to https://neon.tech → New Project
2. Name: "svlentes-production"
3. Copy connection string from dashboard
4. Already includes connection pooling

## Step 2: Prepare Environment Variables (5 minutes)

Copy `.env.vercel.example` → `.env.production.vercel` and fill in:

**Critical Variables (Must Have):**
```bash
# Database
DATABASE_URL=postgresql://...?pgbouncer=true&connection_limit=1

# Asaas Payment
ASAAS_ENV=production
ASAAS_API_KEY_PROD=your_key
ASAAS_WEBHOOK_TOKEN=your_token

# NextAuth
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://svlentes.shop

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

**Important Variables (Recommended):**
```bash
# SendPulse WhatsApp
SENDPULSE_APP_ID=...
SENDPULSE_APP_SECRET=...
SENDPULSE_BOT_ID=...

# OpenAI
OPENAI_API_KEY=...

# Email
RESEND_API_KEY=...
```

## Step 3: Deploy to Vercel (10 minutes)

### Via Dashboard (Recommended)
1. Go to https://vercel.com/new
2. Import Git Repository → Select `Sudo-psc/svlentes-hero-shop`
3. Configure:
   - Project Name: `svlentes-shop`
   - Framework: Next.js (auto-detected)
   - Root: `./`
4. Add Environment Variables:
   - Copy each variable from `.env.production.vercel`
   - Paste into Vercel dashboard
   - Select: Production + Preview + Development
5. Click **Deploy**
6. Wait ~3-5 minutes for build

### Via CLI (Alternative)
```bash
cd /root/svlentes-hero-shop
vercel login
vercel link
# Add environment variables one by one:
vercel env add DATABASE_URL production
vercel env add ASAAS_API_KEY_PROD production
# ... (repeat for all variables)
vercel --prod
```

## Step 4: Configure Domains (5 minutes)

1. **Add Domains in Vercel**
   - Go to Project → Settings → Domains
   - Add: `svlentes.shop`, `www.svlentes.shop`
   - Add: `svlentes.com.br`, `www.svlentes.com.br`

2. **Update DNS Records**

   **At your DNS provider (Registro.br, Cloudflare, etc.):**
   ```
   # For svlentes.shop
   A     @      76.76.21.21
   CNAME www    cname.vercel-dns.com

   # For svlentes.com.br
   A     @      76.76.21.21
   CNAME www    cname.vercel-dns.com
   ```

3. **Wait for DNS propagation** (5-60 minutes)
4. **Verify SSL** - Vercel auto-provisions certificates

## Step 5: Test & Verify (5 minutes)

```bash
# Test endpoints
curl -I https://svlentes.shop
curl https://svlentes.shop/api/health-check

# Check in browser
open https://svlentes.shop
open https://svlentes.shop/calculadora
open https://svlentes.shop/area-assinante
```

### Quick Test Checklist
- [ ] Homepage loads correctly
- [ ] `/api/health-check` returns 200
- [ ] Calculator works (`/calculadora`)
- [ ] Database connection works (try login)
- [ ] SSL certificate shows green lock
- [ ] No console errors in browser

## Post-Deployment Tasks

### Update Webhooks (5 minutes)
**Asaas Dashboard:**
- URL: `https://svlentes.shop/api/webhooks/asaas`
- Token: Must match `ASAAS_WEBHOOK_TOKEN`

**SendPulse Dashboard:**
- URL: `https://svlentes.shop/api/webhooks/sendpulse`

### Database Migration (If migrating from existing DB)
```bash
# Export from current database
docker exec postgres pg_dump -U n8nuser n8ndb > /tmp/backup.sql

# Import to new database
psql $DATABASE_URL < /tmp/backup.sql

# Or push fresh schema
npx prisma db push
npm run db:seed  # Optional: seed with initial data
```

### Monitor Deployment
```bash
# View logs
vercel logs --follow

# Check analytics
# Go to Vercel Dashboard → Analytics
```

## Common Issues & Quick Fixes

### Build Failed
**Issue**: "Build failed with error"
**Fix**:
```bash
# Test build locally first
npm run build
npm run lint
npx prisma generate
```

### Database Connection Error
**Issue**: "Can't reach database server"
**Fix**:
- Verify `DATABASE_URL` format includes `?pgbouncer=true&connection_limit=1`
- Test connection: `npx prisma db pull`
- Check database is publicly accessible

### Missing Environment Variables
**Issue**: "Environment variable X is not defined"
**Fix**:
- Go to Vercel Dashboard → Settings → Environment Variables
- Add missing variable for Production, Preview, and Development
- Redeploy: `vercel --prod --force`

### Domain Not Working
**Issue**: Domain shows "Domain Not Found"
**Fix**:
- Verify DNS records are correct (use `dig svlentes.shop`)
- Wait for DNS propagation (up to 48 hours)
- Check domain is added in Vercel Dashboard → Domains

### Webhooks Not Received
**Issue**: Asaas/SendPulse webhooks not working
**Fix**:
- Update webhook URLs in respective dashboards
- Verify URL is publicly accessible: `curl https://svlentes.shop/api/webhooks/asaas`
- Check Vercel Function Logs for errors

## Rollback Plan

If something goes wrong:

```bash
# Option 1: Rollback to previous Vercel deployment
vercel rollback

# Option 2: Restart systemd service on original server
ssh your-server
systemctl start svlentes-nextjs
# Update DNS back to original server IP
```

## Next Steps After Deployment

1. **Monitor for 24-48 hours** - Check logs, errors, performance
2. **Run performance audit** - `npm run lighthouse`
3. **Test payment flow** - Use Asaas sandbox mode first
4. **Test WhatsApp integration** - Send test messages
5. **Verify email delivery** - Test consultation booking
6. **Set up alerts** - Configure Vercel notifications
7. **Update documentation** - Note any changes or issues
8. **Decommission old server** - After stable period (7 days recommended)

## Cost Estimate

**Vercel Pro Plan**: $20/month
- 1TB bandwidth
- 1,000GB-hours functions
- Production + Preview deployments
- Custom domains
- Analytics

**Database**:
- Vercel Postgres: $10-30/month
- Supabase Free: $0/month (500MB limit)
- Neon Free: $0/month (3GB limit)

**Total**: $0-50/month depending on traffic

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Project Issues**: https://github.com/Sudo-psc/svlentes-hero-shop/issues
- **Contact**: saraivavision@gmail.com

---

**Ready to deploy?** Start with Step 1 above!

For detailed instructions, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
