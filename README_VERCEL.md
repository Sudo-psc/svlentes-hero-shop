# Vercel Deployment Files

This directory contains complete documentation for deploying SV Lentes to Vercel.

## 📋 Quick Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| **DEPLOY_NOW.md** | 🚀 Quick start guide | Ready to deploy now |
| **VERCEL_QUICKSTART.md** | ⚡ 5-step fast guide | 30-minute deployment |
| **VERCEL_DEPLOYMENT.md** | 📖 Complete guide | Comprehensive deployment |
| **DOMAIN_CONFIGURATION.md** | 🌐 Domain setup | DNS and domain config |
| **LOCAL_PRODUCTION_DEBUG.md** | 🔧 Troubleshooting | Debug issues |
| **DEPLOYMENT_SUMMARY.md** | 📊 Overview | Complete summary |

## 🚀 Get Started

### Fastest Path (30 minutes)
1. Read: **DEPLOY_NOW.md**
2. Run: `vercel --prod`
3. Add environment variables in Vercel dashboard
4. Update DNS
5. Done!

### Comprehensive Path (2-3 hours)
1. Read: **VERCEL_DEPLOYMENT.md**
2. Set up external database
3. Test locally
4. Deploy to Vercel
5. Configure domains
6. Migrate data
7. Monitor and validate

## 📚 Documentation Structure

```
DEPLOY_NOW.md
├─ Quick 8-step deployment
├─ Environment variables list
├─ DNS configuration
└─ Testing checklist

VERCEL_QUICKSTART.md
├─ 5-step guide
├─ Database options
├─ Domain setup
└─ Common issues

VERCEL_DEPLOYMENT.md
├─ Complete step-by-step guide
├─ Database migration
├─ Environment configuration
├─ Domain setup
├─ Webhook configuration
├─ Testing procedures
├─ Troubleshooting
└─ Rollback plan

DOMAIN_CONFIGURATION.md
├─ Primary domain: svlentes.com.br
├─ Redirect configuration
├─ DNS records
└─ SEO considerations

LOCAL_PRODUCTION_DEBUG.md
├─ Build troubleshooting
├─ Database connection issues
├─ Environment variable problems
├─ Performance debugging
└─ Log analysis

DEPLOYMENT_SUMMARY.md
├─ Deployment status
├─ Configuration overview
├─ Migration strategy
├─ Cost breakdown
└─ Support resources
```

## ✅ Pre-Deployment Checklist

Before starting deployment:

- [ ] Vercel account created (https://vercel.com)
- [ ] Database provider chosen (Vercel Postgres/Supabase/Neon)
- [ ] Environment variables ready (see `.env.vercel.example`)
- [ ] API keys accessible (Asaas, SendPulse, Firebase, etc.)
- [ ] DNS access confirmed
- [ ] Webhooks can be updated (Asaas, SendPulse)

## 🎯 Primary Domain

**svlentes.com.br** is the primary domain.

All alternative domains redirect to primary:
- www.svlentes.com.br → svlentes.com.br
- svlentes.shop → svlentes.com.br
- www.svlentes.shop → svlentes.com.br

## 📞 Support

- Email: saraivavision@gmail.com
- WhatsApp: +55 33 98606-1427
- GitHub: https://github.com/Sudo-psc/svlentes-hero-shop

## 🔗 Useful Links

- Vercel Documentation: https://vercel.com/docs
- Next.js on Vercel: https://vercel.com/docs/frameworks/nextjs
- Prisma Deployment: https://www.prisma.io/docs/guides/deployment
- Vercel Postgres: https://vercel.com/docs/storage/vercel-postgres

---

**Status**: ✅ Ready for deployment  
**Last updated**: 2025-10-21
