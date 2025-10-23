# Local Production Deployment - Debug Guide

Debug and test production build locally before deploying to Vercel.

## Quick Diagnostic Commands

```bash
# 1. Verify environment variables
node scripts/verify-env-vars.js

# 2. Build production bundle
npm run build

# 3. Start production server locally
npm run start

# 4. Test health endpoint
curl http://localhost:5000/api/health-check

# 5. Check build output
ls -lah .next/

# 6. View build logs
npm run build 2>&1 | tee build.log
```

## Common Issues & Solutions

### Issue 1: Build Fails

**Symptoms:**
```
Error: Module not found
Error: Type error
Error: Prisma client not generated
```

**Debug Steps:**
```bash
# Check Node.js version (requires 20+)
node --version

# Clean install dependencies
rm -rf node_modules .next
npm install

# Regenerate Prisma client
npx prisma generate

# Check TypeScript errors
npx tsc --noEmit

# Check ESLint
npm run lint

# Try build again
npm run build
```

**Solution:**
```bash
# Fix TypeScript errors first
npm run lint:fix

# Ensure Prisma schema is valid
npx prisma validate
npx prisma format

# Rebuild
npm run build
```

### Issue 2: Database Connection Errors

**Symptoms:**
```
Error: Can't reach database server
PrismaClientInitializationError
Connection pool timeout
```

**Debug Steps:**
```bash
# 1. Check DATABASE_URL is set
echo $DATABASE_URL
# Or check .env files:
cat .env.local | grep DATABASE_URL

# 2. Test database connection
npx prisma db pull

# 3. Check database is running
# If using Docker PostgreSQL:
docker ps | grep postgres
docker logs postgres

# If using external database:
psql $DATABASE_URL -c "SELECT version();"

# 4. Test connection with simple query
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1\`
  .then(() => console.log('✓ Database connected'))
  .catch(e => console.error('✗ Database error:', e.message))
  .finally(() => prisma.\$disconnect());
"
```

**Solution:**
```bash
# Update DATABASE_URL format for production
# Add connection pooling:
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=1"

# Or use direct URL for local testing:
DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Push schema to database
npx prisma db push

# Verify migration
npx prisma migrate status
```

### Issue 3: Environment Variables Missing

**Symptoms:**
```
Warning: Environment variable X is not defined
TypeError: Cannot read property of undefined
500 Internal Server Error on API routes
```

**Debug Steps:**
```bash
# 1. List all loaded environment files
npm run build 2>&1 | grep "Environments:"

# 2. Check which .env files exist
ls -la .env*

# 3. Verify critical variables
node scripts/verify-env-vars.js

# 4. Check a specific variable
node -e "console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30))"

# 5. Check Next.js environment loading
node -e "
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });
console.log('Loaded vars:', Object.keys(process.env).filter(k => k.includes('ASAAS') || k.includes('DATABASE')));
"
```

**Solution:**
```bash
# Create .env.local from example
cp .env.local.example .env.local

# Fill in required variables
# Use verify script to check:
node scripts/verify-env-vars.js

# Generate missing secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -hex 32     # For REVALIDATE_SECRET

# Rebuild after adding variables
npm run build
```

### Issue 4: Production Server Won't Start

**Symptoms:**
```
Error: Port 5000 is already in use
Error: EADDRINUSE
Server crashes immediately
```

**Debug Steps:**
```bash
# 1. Check if port 5000 is in use
lsof -ti:5000

# 2. Check if systemd service is running
systemctl status svlentes-nextjs

# 3. Check what's using the port
netstat -tlnp | grep 5000

# 4. View server logs
journalctl -u svlentes-nextjs -n 50

# 5. Test on different port
PORT=3001 npm run start
```

**Solution:**
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or stop systemd service
systemctl stop svlentes-nextjs

# Or use different port for testing
PORT=3001 npm run start

# Then test
curl http://localhost:3001/api/health-check
```

### Issue 5: API Routes Return 500 Errors

**Symptoms:**
```
500 Internal Server Error
API route crashes
No error logs visible
```

**Debug Steps:**
```bash
# 1. Start server with verbose logging
NODE_ENV=production npm run start

# 2. Test specific API route
curl -v http://localhost:5000/api/health-check

# 3. Check server logs
# If using systemd:
journalctl -u svlentes-nextjs -f

# If running manually:
# Logs appear in terminal

# 4. Test with Node.js debugger
NODE_OPTIONS='--inspect' npm run start
# Then open chrome://inspect in Chrome

# 5. Add debug logging to API route
# Edit src/app/api/health-check/route.ts
# Add console.log statements
```

**Solution:**
```bash
# Check .next/server/app/api logs
ls -lah .next/server/app/api/

# Rebuild with detailed error output
NODE_ENV=production NEXT_PUBLIC_VERCEL_ENV=development npm run build

# Check for missing environment variables
node scripts/verify-env-vars.js

# Test API routes individually
curl http://localhost:5000/api/health-check
curl http://localhost:5000/api/config-health
```

### Issue 6: Static Assets Not Loading

**Symptoms:**
```
404 on /_next/static/*
Images not loading
CSS not applied
```

**Debug Steps:**
```bash
# 1. Check .next/static directory exists
ls -lah .next/static/

# 2. Verify build completed successfully
npm run build | grep "Finalizing page optimization"

# 3. Check build output size
du -sh .next/

# 4. Test static file directly
curl -I http://localhost:5000/_next/static/css/*.css
```

**Solution:**
```bash
# Clean and rebuild
rm -rf .next
npm run build

# Verify static files are generated
ls -lah .next/static/chunks/

# Check Next.js config
cat next.config.js | grep -A 5 "images"

# Test with development mode first
npm run dev
# Then switch to production
npm run build && npm run start
```

### Issue 7: Prisma Client Issues

**Symptoms:**
```
Error: Prisma Client is not ready yet
PrismaClient is unable to be run in the browser
@prisma/client did not initialize yet
```

**Debug Steps:**
```bash
# 1. Check Prisma client is generated
ls -lah node_modules/.prisma/client/

# 2. Verify schema file
npx prisma validate

# 3. Check Prisma version
npx prisma --version

# 4. View generated client
cat node_modules/.prisma/client/index.d.ts | head -20
```

**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# Update Prisma dependencies
npm update @prisma/client prisma

# Clear Prisma cache
rm -rf node_modules/.prisma

# Reinstall and regenerate
npm install
npx prisma generate

# Rebuild application
npm run build
```

### Issue 8: Memory Issues

**Symptoms:**
```
JavaScript heap out of memory
Build process killed
Server crashes under load
```

**Debug Steps:**
```bash
# 1. Check available memory
free -h

# 2. Monitor memory during build
node --max-old-space-size=4096 $(which npm) run build

# 3. Check process memory
ps aux | grep node

# 4. Monitor heap usage
node --expose-gc --max-old-space-size=4096 $(which npm) run build
```

**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Build with more memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Permanently set in package.json
# Add to scripts:
"build": "NODE_OPTIONS='--max-old-space-size=4096' next build"

# Clear cache and rebuild
rm -rf .next node_modules/.cache
npm run build
```

## Testing Production Build Locally

### Step 1: Clean Environment
```bash
# Stop any running services
systemctl stop svlentes-nextjs

# Clean build artifacts
rm -rf .next
rm -rf node_modules/.cache

# Verify environment variables
node scripts/verify-env-vars.js
```

### Step 2: Build Production Bundle
```bash
# Build with production settings
NODE_ENV=production npm run build

# Check for warnings/errors
# Expected output: "✓ Compiled successfully"
# Expected output: "✓ Generating static pages"
```

### Step 3: Start Production Server
```bash
# Start on default port (5000)
npm run start

# Or specify custom port
PORT=3001 npm run start

# Expected output: "ready - started server on 0.0.0.0:5000"
```

### Step 4: Test Critical Endpoints
```bash
# Health check
curl http://localhost:5000/api/health-check
# Expected: {"status":"ok","timestamp":"..."}

# Homepage
curl -I http://localhost:5000
# Expected: 200 OK

# API routes
curl http://localhost:5000/api/config
curl http://localhost:5000/api/config-health

# Database connection (if logged in)
curl http://localhost:5000/api/assinante/subscription
```

### Step 5: Test with Browser
```bash
# Open in browser
open http://localhost:5000

# Check browser console for errors
# Check Network tab for failed requests
# Verify images load correctly
# Test forms and interactions
```

### Step 6: Performance Testing
```bash
# Run Lighthouse audit
npm run lighthouse

# Load test with Apache Bench
ab -n 100 -c 10 http://localhost:5000/

# Monitor resource usage
htop
# Or
top -p $(pgrep -f "next-server")
```

## Production vs Development Differences

| Feature | Development | Production |
|---------|-------------|------------|
| **Port** | 3000 | 5000 |
| **Build** | Hot reload | Optimized bundle |
| **Errors** | Full stack traces | Generic messages |
| **Source Maps** | Enabled | Disabled |
| **Cache** | Disabled | Enabled |
| **Static Gen** | On-demand | Build time |
| **API Timeout** | Unlimited | 30s (Vercel) |

## Simulating Vercel Environment Locally

```bash
# Set Vercel-like environment variables
export VERCEL=1
export VERCEL_ENV=production
export NEXT_PUBLIC_VERCEL_URL=localhost:5000

# Use production database URL format
export DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1"

# Build and start
npm run build
npm run start

# Test with restricted timeouts (similar to Vercel)
timeout 30s curl http://localhost:5000/api/slow-endpoint
```

## Debugging with Chrome DevTools

```bash
# Start with Node.js inspector
NODE_OPTIONS='--inspect' npm run start

# In Chrome, navigate to:
chrome://inspect

# Click "inspect" under your Node.js process
# Set breakpoints in API routes
# Step through code execution
```

## Log Analysis

```bash
# Production logs location
tail -f .next/server/app/api/*/route.js

# System service logs
journalctl -u svlentes-nextjs -f

# Export logs for analysis
journalctl -u svlentes-nextjs --since "1 hour ago" > /tmp/svlentes.log

# Search for errors
grep -i "error" /tmp/svlentes.log
grep -i "warning" /tmp/svlentes.log
```

## Comparison: Local vs Vercel

### Test Both Environments
```bash
# Local production
npm run build && npm run start
curl http://localhost:5000/api/health-check

# Deploy to Vercel preview
vercel
# Test preview URL
curl https://svlentes-shop-xxx.vercel.app/api/health-check

# Compare responses
diff <(curl http://localhost:5000/api/health-check) \
     <(curl https://svlentes-shop-xxx.vercel.app/api/health-check)
```

## Pre-Deployment Checklist

Before deploying to Vercel, verify locally:

- [ ] Build completes successfully: `npm run build`
- [ ] Server starts without errors: `npm run start`
- [ ] Health check passes: `curl http://localhost:5000/api/health-check`
- [ ] Database connects: Test admin dashboard
- [ ] Environment variables verified: `node scripts/verify-env-vars.js`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No ESLint warnings: `npm run lint`
- [ ] Tests pass: `npm run test`
- [ ] Calculator works: Test `/calculadora`
- [ ] Forms submit correctly: Test consultation booking
- [ ] Images load: Check `/images/` assets
- [ ] Performance acceptable: `npm run lighthouse`

## Emergency Debugging

If nothing works:

```bash
# 1. Complete reset
rm -rf node_modules .next
npm cache clean --force
npm install
npx prisma generate
npm run build
npm run start

# 2. Test with minimal config
# Rename all .env files temporarily
mv .env .env.bak
mv .env.local .env.local.bak
mv .env.production .env.production.bak

# Create minimal .env.local
cat > .env.local << EOF
DATABASE_URL=postgresql://postgres:password@localhost:5432/svlentes
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:5000
EOF

# Try build
npm run build

# If it works, add variables back one at a time
```

## Getting Help

If issues persist:

1. **Check logs**: `journalctl -u svlentes-nextjs -n 100`
2. **GitHub Issues**: https://github.com/Sudo-psc/svlentes-hero-shop/issues
3. **Next.js Docs**: https://nextjs.org/docs/deployment
4. **Prisma Troubleshooting**: https://www.prisma.io/docs/guides/troubleshooting
5. **Contact**: saraivavision@gmail.com

## Useful Debug Scripts

### Quick Health Check
```bash
#!/bin/bash
echo "=== SV Lentes Health Check ==="
echo "1. Build status:"
npm run build 2>&1 | grep -E "Compiled|Error" | tail -1
echo "2. Database:"
npx prisma db pull 2>&1 | grep -E "success|Error" | head -1
echo "3. Environment:"
node scripts/verify-env-vars.js | grep "DEPLOYMENT READINESS" -A 2
echo "4. Server:"
curl -s http://localhost:5000/api/health-check | jq '.' || echo "Server not running"
```

Save as `scripts/health-check.sh` and run: `bash scripts/health-check.sh`
