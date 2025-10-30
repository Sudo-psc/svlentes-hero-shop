# Deployment Fix - October 30, 2025

## Issues Identified

### 1. CSP Blocking Clerk Authentication
**Problem**: Content Security Policy was blocking Clerk.js from loading
**Error**: `Refused to load https://clerk.svlentes.com.br/npm/@clerk/clerk-js@5/dist/clerk.browser.js`

### 2. 404 Errors for Static Assets
**Problem**: All static files (JS chunks, images, videos, favicons) returning 404
**Root Cause**: Next.js standalone output doesn't automatically copy public and static files

### 3. MIME Type Errors
**Problem**: Files served with wrong Content-Type causing browser to reject them
**Root Cause**: Related to 404 issue - files weren't being served at all

## Root Cause Analysis

The application uses Next.js **standalone output mode** (`output: 'standalone'` in next.config.js), which creates a minimal production server in `.next/standalone/`. However, this mode has a known limitation:

- **Public files** (`public/` directory) are NOT automatically copied
- **Static files** (`.next/static/` directory) are NOT automatically copied
- The standalone server runs from `.next/standalone/` working directory
- Without these files, all assets return 404

## Solutions Implemented

### 1. Updated CSP for Clerk
**File**: `next.config.js:95-122`

Added Clerk domains to all CSP directives:
```javascript
// Development and Production CSP
"script-src": "*.clerk.accounts.dev *.clerk.com clerk.svlentes.com.br"
"style-src": "*.clerk.accounts.dev *.clerk.com"
"img-src": "*.clerk.accounts.dev *.clerk.com img.clerk.com"
"connect-src": "*.clerk.accounts.dev *.clerk.com api.clerk.com clerk.svlentes.com.br"
"frame-src": "*.clerk.accounts.dev *.clerk.com"
```

### 2. Created Post-Build Script
**File**: `scripts/post-build.sh`

Automated script that runs after every build:
```bash
#!/bin/bash
# Copies public/ to .next/standalone/public/
# Copies .next/static/ to .next/standalone/.next/static/
```

### 3. Updated Build Command
**File**: `package.json:11`

```json
"build": "next build && bash scripts/post-build.sh"
```

Now `npm run build` automatically:
1. Builds the Next.js application
2. Copies public files to standalone directory
3. Copies static files to standalone directory

## Verification Steps

### Test Static Assets
```bash
# Favicon
curl -I https://svlentes.com.br/favicon.ico
# Expected: HTTP/1.1 200 OK

# Images
curl -I https://svlentes.com.br/images/logo.jpeg
# Expected: HTTP/1.1 200 OK

# Videos
curl -I https://svlentes.com.br/Videos/hero-full-width.mp4
# Expected: HTTP/1.1 200 OK

# JS Chunks
curl -I https://svlentes.com.br/_next/static/chunks/[hash].js
# Expected: HTTP/1.1 200 OK with Content-Type: application/javascript
```

### Test CSP Headers
```bash
curl -I https://svlentes.com.br | grep "Content-Security-Policy"
# Should include: *.clerk.accounts.dev *.clerk.com clerk.svlentes.com.br
```

### Test Service Health
```bash
systemctl status svlentes-nextjs
# Should show: Active: active (running)
```

## Future Deployment Process

### Standard Deployment
```bash
cd /root/svlentes-hero-shop

# 1. Build (includes post-build script)
npm run build

# 2. Restart service
systemctl restart svlentes-nextjs

# 3. Verify
curl -I https://svlentes.com.br/favicon.ico
curl -I https://svlentes.com.br
```

### Manual File Copy (if needed)
```bash
# Only needed if post-build script fails
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
systemctl restart svlentes-nextjs
```

## Technical Details

### Systemd Service Configuration
**File**: `/etc/systemd/system/svlentes-nextjs.service`
```ini
WorkingDirectory=/root/svlentes-hero-shop/.next/standalone
ExecStart=/usr/bin/node server.js
```

The service runs from the standalone directory, which is why files must be copied there.

### Nginx Configuration
**File**: `/etc/nginx/sites-available/svlentes.com.br`

Nginx proxies all requests to `localhost:5000` (Next.js):
```nginx
location /_next/static {
    proxy_pass http://nextjs_backend;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

### Browser Caching
Static assets are cached for 1 year:
- Users may need hard refresh (Ctrl+F5) after updates
- Nginx caches `/_next/static` for 365 days
- Consider versioning strategy for critical updates

## Lessons Learned

1. **Standalone Output Limitations**: Always copy public and static files when using `output: 'standalone'`
2. **Post-Build Automation**: Automate file copying to prevent deployment issues
3. **CSP Testing**: Test third-party integrations (Clerk) against CSP before production
4. **Working Directory Awareness**: Understand where production server runs from

## Related Documentation

- Next.js Standalone Output: https://nextjs.org/docs/advanced-features/output-file-tracing
- CSP Configuration: `/root/svlentes-hero-shop/next.config.js:92-150`
- Nginx Config: `/etc/nginx/sites-available/svlentes.com.br`
- Systemd Service: `/etc/systemd/system/svlentes-nextjs.service`

## Status

✅ **All issues resolved**
- Clerk authentication loads correctly
- All static assets (JS, CSS, images, videos) serve properly
- MIME types correct
- Production deployment stable
- Automated post-build process in place
