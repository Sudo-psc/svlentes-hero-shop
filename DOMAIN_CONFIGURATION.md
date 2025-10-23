# Domain Configuration - svlentes.com.br (Primary)

## Domain Strategy

**Primary Domain**: `svlentes.com.br`
**Alternative Domains**: `svlentes.shop` (redirects to primary)

All traffic is now configured to serve from `svlentes.com.br`.

## Configuration Changes Made

### 1. Updated vercel.json Redirects
**Before:**
- `svlentes.com.br` → redirected to `saraivavision.com.br/lentes`
- `svlentes.shop` → no redirect

**After:**
- `svlentes.com.br` → **Primary domain (serves application)**
- `www.svlentes.com.br` → redirects to `svlentes.com.br`
- `svlentes.shop` → redirects to `svlentes.com.br`
- `www.svlentes.shop` → redirects to `svlentes.com.br`

### 2. Updated CORS Headers
**API CORS**: Changed from `svlentes.shop` to `svlentes.com.br`

### 3. Updated Environment Variables
All environment files now use `https://svlentes.com.br`:
- `.env.local`
- `.env.production`
- `.env.vercel.example`

Variables updated:
- `NEXT_PUBLIC_APP_URL=https://svlentes.com.br`
- `NEXTAUTH_URL=https://svlentes.com.br`

## DNS Configuration for Vercel

When deploying to Vercel, configure DNS as follows:

### For svlentes.com.br (Primary)
```dns
# A Record (root domain)
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600

# CNAME Record (www subdomain)
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### For svlentes.shop (Alternative - redirects to .com.br)
```dns
# A Record (root domain)
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600

# CNAME Record (www subdomain)
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

## Vercel Domain Setup

### Step 1: Add Primary Domain
1. Go to Vercel Project → Settings → Domains
2. Click "Add Domain"
3. Enter: `svlentes.com.br`
4. Click "Add"
5. Follow DNS verification instructions

### Step 2: Add www Subdomain
1. Click "Add Domain"
2. Enter: `www.svlentes.com.br`
3. Select: "Redirect to svlentes.com.br"
4. Click "Add"

### Step 3: Add Alternative Domains
1. Click "Add Domain"
2. Enter: `svlentes.shop`
3. Click "Add"
4. Enter: `www.svlentes.shop`
5. These will automatically redirect per vercel.json configuration

### Step 4: Verify SSL Certificates
- Vercel automatically provisions SSL certificates
- Wait 2-5 minutes for DNS propagation
- Verify at: https://svlentes.com.br
- Should show green lock icon 🔒

## Webhook URLs to Update

After deployment, update webhook URLs in external services:

### Asaas Payment Gateway
**Dashboard**: https://www.asaas.com/config/webhooks
**URL**: `https://svlentes.com.br/api/webhooks/asaas`
**Token**: Use value from `ASAAS_WEBHOOK_TOKEN` environment variable

### SendPulse WhatsApp
**Dashboard**: https://sendpulse.com/chatbots/whatsapp
**URL**: `https://svlentes.com.br/api/webhooks/sendpulse`

## Environment Variables for Vercel

Copy these to Vercel Dashboard → Settings → Environment Variables:

```bash
# Application URL
NEXT_PUBLIC_APP_URL=https://svlentes.com.br
NEXTAUTH_URL=https://svlentes.com.br

# Database (use external PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=1

# Asaas Payment
ASAAS_ENV=production
ASAAS_API_KEY_PROD=your_production_key
ASAAS_WEBHOOK_TOKEN=your_webhook_secret

# NextAuth
NEXTAUTH_SECRET=<generate: openssl rand -base64 32>

# ... (copy all other variables from .env.vercel.example)
```

## Testing URLs

After deployment, test these endpoints:

### Homepage
```bash
curl -I https://svlentes.com.br
# Expected: 200 OK
```

### Health Check
```bash
curl https://svlentes.com.br/api/health-check
# Expected: {"status":"ok","timestamp":"..."}
```

### Redirects
```bash
# www should redirect to non-www
curl -I https://www.svlentes.com.br
# Expected: 308 Permanent Redirect → https://svlentes.com.br

# .shop should redirect to .com.br
curl -I https://svlentes.shop
# Expected: 308 Permanent Redirect → https://svlentes.com.br
```

### SSL Certificate
```bash
openssl s_client -connect svlentes.com.br:443 -servername svlentes.com.br
# Should show valid certificate from Vercel/Let's Encrypt
```

## Migration from Current Setup

### Current Nginx Configuration
Your current server uses:
- `/etc/nginx/sites-available/svlentes.com.br` → proxies to localhost:5000
- `/etc/nginx/sites-available/svlentes.shop` → redirects to svlentes.com.br

### Migration Strategy

**Option 1: Gradual Migration (Recommended)**
1. Deploy to Vercel (keep DNS pointing to current server)
2. Test Vercel deployment at temporary URL
3. Update DNS for `svlentes.shop` first (point to Vercel)
4. Monitor for 24-48 hours
5. Update DNS for `svlentes.com.br` (point to Vercel)
6. Decommission Nginx/systemd after 7 days

**Option 2: Immediate Cutover**
1. Deploy to Vercel
2. Update DNS for both domains simultaneously
3. Monitor closely for 48 hours
4. Keep Nginx/systemd running as backup (don't decommission immediately)

### DNS Update Timeline
```
T+0:     Update DNS records → Point to Vercel
T+5min:  DNS starts propagating
T+1hr:   ~50% of users see new site
T+24hr:  ~99% of users see new site
T+48hr:  Full propagation complete
```

## Rollback Plan

If issues occur after DNS update:

```bash
# Revert DNS to original server IP
# (Your current server IP from: curl -4 ifconfig.me)

# Check current server IP
ssh your-server "curl -4 ifconfig.me"

# Update DNS A records back to that IP
# Wait 5-60 minutes for propagation

# Verify rollback
curl -I https://svlentes.com.br
# Should resolve to old server
```

## Monitoring After Deployment

### Check DNS Propagation
```bash
# Check from different locations
dig svlentes.com.br +short
dig @8.8.8.8 svlentes.com.br +short  # Google DNS
dig @1.1.1.1 svlentes.com.br +short  # Cloudflare DNS

# Should all return: 76.76.21.21 (Vercel IP)
```

### Monitor Traffic
- Vercel Dashboard → Analytics → Real-time visitors
- Vercel Dashboard → Functions → Error rate
- Vercel Dashboard → Logs → Recent function invocations

### Check Errors
```bash
# View Vercel function logs
vercel logs --follow

# Check specific endpoint
curl https://svlentes.com.br/api/monitoring/errors
```

## SEO Considerations

### 301 Redirects
All redirects in vercel.json use `"permanent": true`:
- `www.svlentes.com.br` → `svlentes.com.br` (301)
- `svlentes.shop` → `svlentes.com.br` (301)
- Preserves SEO ranking
- Search engines will update indexed URLs

### Sitemap
Update sitemap URLs after deployment:
- Endpoint: `/api/sitemap` (already configured in rewrites)
- Submit updated sitemap to Google Search Console
- URL: `https://svlentes.com.br/sitemap.xml`

### Robots.txt
- Endpoint: `/api/robots` (already configured in rewrites)
- URL: `https://svlentes.com.br/robots.txt`

## Summary

**Primary URL**: `https://svlentes.com.br`
**All alternative domains redirect to primary**

**Configuration files updated:**
- ✅ `vercel.json` - Redirects and CORS
- ✅ `.env.local` - Local development
- ✅ `.env.production` - Production build
- ✅ `.env.vercel.example` - Template for Vercel

**Next steps:**
1. Deploy to Vercel
2. Add domains in Vercel dashboard
3. Update DNS records
4. Update webhooks (Asaas, SendPulse)
5. Test all redirects
6. Monitor for 48 hours
7. Decommission old server after stable period

---

*Configuration updated: 2025-10-21*
*Primary domain: svlentes.com.br*
