# 🚀 Deploy to Vercel - Ready to Go!

**Primary Domain**: `svlentes.com.br`
**Status**: ✅ READY FOR DEPLOYMENT

## What's Been Configured

✅ All Vercel configuration files created
✅ Domain set to `svlentes.com.br` as primary
✅ Redirects configured (`svlentes.shop` → `svlentes.com.br`)
✅ Environment variables prepared
✅ Build tested successfully (101 routes)
✅ CORS headers updated
✅ Documentation complete

## 🏃 Quick Deploy (30 Minutes)

### Step 1: Install Vercel CLI (2 minutes)
```bash
npm i -g vercel
vercel login
```

### Step 2: Setup Database (5 minutes)

**Option A: Vercel Postgres (Recommended)**
```bash
vercel postgres create svlentes-db --region gru1
vercel env pull .env.local
# Copy DATABASE_URL from .env.local
```

**Option B: Supabase (Free Tier)**
1. Go to https://supabase.com
2. Create project: "svlentes-production"
3. Copy connection string from Settings → Database
4. Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?pgbouncer=true&connection_limit=1`

### Step 3: Deploy to Vercel (5 minutes)
```bash
cd /root/svlentes-hero-shop
vercel --prod
```

Follow prompts:
- Link to existing project? **No** (create new)
- Project name: **svlentes-shop**
- Scope: **your-account**
- Link to directory? **Yes**

### Step 4: Add Environment Variables (10 minutes)

**Via Vercel Dashboard** (easier for bulk add):
1. Go to https://vercel.com/dashboard
2. Select your project → Settings → Environment Variables
3. Copy variables from `.env.vercel.example`
4. Add each variable for **Production**, **Preview**, and **Development**

**Required Variables** (minimum to get started):
```bash
DATABASE_URL=postgresql://...?pgbouncer=true&connection_limit=1
ASAAS_ENV=production
ASAAS_API_KEY_PROD=aact_prod_...
ASAAS_WEBHOOK_TOKEN=whatsapp_production_...
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://svlentes.com.br
NEXT_PUBLIC_APP_URL=https://svlentes.com.br
```

**All 30+ Variables**: See `.env.vercel.example`

### Step 5: Configure Domains (5 minutes)

In Vercel Dashboard → Domains:

1. Add `svlentes.com.br` (primary)
2. Add `www.svlentes.com.br` (redirects to primary)
3. Add `svlentes.shop` (redirects to primary)
4. Add `www.svlentes.shop` (redirects to primary)

### Step 6: Update DNS (3 minutes)

**At your DNS provider** (Registro.br, Cloudflare, etc.):

```dns
# For svlentes.com.br
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com

# For svlentes.shop
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 7: Update Webhooks (2 minutes)

**Asaas Dashboard** (https://www.asaas.com):
- Go to Configurações → Webhooks
- Update URL: `https://svlentes.com.br/api/webhooks/asaas`

**SendPulse Dashboard** (https://sendpulse.com):
- Go to WhatsApp Chatbot Settings
- Update webhook: `https://svlentes.com.br/api/webhooks/sendpulse`

### Step 8: Test Deployment (3 minutes)

```bash
# Homepage
curl -I https://svlentes.com.br

# Health check
curl https://svlentes.com.br/api/health-check

# Test in browser
open https://svlentes.com.br
```

## ✅ Deployment Checklist

### Pre-Deployment
- [x] Build completes successfully
- [x] Environment variables prepared
- [x] Domain configuration updated
- [x] Documentation created

### During Deployment
- [ ] Vercel account created
- [ ] Database provisioned (Vercel Postgres/Supabase/Neon)
- [ ] Project deployed to Vercel
- [ ] Environment variables added (all 30+)
- [ ] Domains configured
- [ ] DNS updated
- [ ] Webhooks updated

### Post-Deployment
- [ ] Homepage loads: https://svlentes.com.br
- [ ] Health check passes: https://svlentes.com.br/api/health-check
- [ ] Calculator works: https://svlentes.com.br/calculadora
- [ ] Login/register functional: https://svlentes.com.br/area-assinante/login
- [ ] SSL certificate active (green lock 🔒)
- [ ] Redirects work (www, .shop → .com.br)
- [ ] WhatsApp chatbot responds
- [ ] Payment flow works (test in sandbox)
- [ ] Performance >90 (Lighthouse)

## 📚 Documentation Reference

| Document | Purpose |
|----------|---------|
| **DEPLOY_NOW.md** (this file) | Quick deployment guide |
| **VERCEL_QUICKSTART.md** | 5-step fast-track guide |
| **VERCEL_DEPLOYMENT.md** | Comprehensive deployment guide |
| **DOMAIN_CONFIGURATION.md** | Domain setup and DNS |
| **LOCAL_PRODUCTION_DEBUG.md** | Troubleshooting guide |
| **DEPLOYMENT_SUMMARY.md** | Complete deployment overview |

## 🎯 What Happens After Deploy

### Immediate (T+0 to T+5min)
- Vercel builds your application
- SSL certificates provisioned automatically
- Application available at Vercel URL

### Short-term (T+5min to T+1hr)
- DNS propagation begins
- Some users see new site
- Monitor for errors in Vercel dashboard

### Medium-term (T+1hr to T+48hr)
- Full DNS propagation
- All users see new site
- Monitor performance and errors

### Long-term (T+48hr+)
- Stable operation confirmed
- Old systemd server can be decommissioned
- Regular monitoring continues

## 🔄 Migration Strategy

### Parallel Running (Recommended)

**Keep both systems running during migration:**

1. **Deploy to Vercel** (don't update DNS yet)
2. **Test at Vercel URL** (e.g., `svlentes-shop.vercel.app`)
3. **Migrate database** from local PostgreSQL to Vercel Postgres
4. **Test thoroughly** on Vercel deployment
5. **Update DNS** to point to Vercel
6. **Monitor 48 hours** with both systems available
7. **Decommission old server** after stable period

**Rollback**: Simply revert DNS to old server IP

### Direct Cutover (Faster, Higher Risk)

1. **Deploy to Vercel**
2. **Update DNS immediately**
3. **Monitor very closely**
4. **Keep old server running** as backup

## 💰 Cost Breakdown

### Vercel
- **Hobby Plan**: $0/month (good for <10k visitors)
- **Pro Plan**: $20/month (recommended for production)

### Database
- **Vercel Postgres**: $10-30/month (auto-scaling)
- **Supabase Free**: $0/month (500MB limit)
- **Neon Free**: $0/month (3GB limit)

**Total Estimated**: $0-50/month (similar to current VPS)

## 🆘 If Something Goes Wrong

### Build Fails
```bash
# Check locally first
npm run build

# View detailed logs
vercel logs
```

### Database Won't Connect
```bash
# Verify DATABASE_URL format
# Should include: ?pgbouncer=true&connection_limit=1

# Test connection
npx prisma db pull
```

### Missing Environment Variables
```bash
# Run verification script
node scripts/verify-env-vars.js

# Add missing variables in Vercel Dashboard
```

### Site Not Loading
```bash
# Check deployment status
vercel ls

# Check function logs
vercel logs --follow

# Verify DNS
dig svlentes.com.br +short
```

## 📞 Support

- **Documentation**: See files listed above
- **Email**: saraivavision@gmail.com
- **WhatsApp**: +55 33 98606-1427
- **GitHub Issues**: https://github.com/Sudo-psc/svlentes-hero-shop/issues

## 🎬 Ready to Deploy?

### Fastest Path (CLI)
```bash
# 1. Install and login
npm i -g vercel && vercel login

# 2. Create database
vercel postgres create svlentes-db --region gru1

# 3. Deploy
cd /root/svlentes-hero-shop && vercel --prod

# 4. Add environment variables via dashboard
# 5. Configure domains in dashboard
# 6. Update DNS records
# 7. Update webhooks
# 8. Test!
```

### Comprehensive Path
Follow: **VERCEL_DEPLOYMENT.md**

---

## 🎉 After Successful Deployment

Congratulations! Your application is now:
- ✅ Running on Vercel's global CDN
- ✅ Auto-scaling serverless functions
- ✅ Automatic SSL/HTTPS
- ✅ 99.99% uptime SLA
- ✅ Zero-downtime deployments
- ✅ Preview deployments for PRs
- ✅ Automatic Lighthouse audits

**Next deployment**: Just `git push` to master!

---

**Last updated**: 2025-10-21
**Primary domain**: svlentes.com.br
**Status**: Ready for production deployment
