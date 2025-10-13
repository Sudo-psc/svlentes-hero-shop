# Nginx Configuration Backup - Pre-Migration

**Backup Date:** 2025-10-13 13:29:23 UTC  
**Purpose:** Documentation before Caddy migration  
**Backup Location:** `migration/backups/nginx-config-backup.tar.gz`

## Current Infrastructure

### Active Domains (3)
1. **svlentes.com.br** (Primary - Next.js App)
2. **svlentes.shop** (Redirect to svlentes.com.br)
3. **saraivavision-n8n.cloud** (n8n Automation Platform)

### SSL Certificates (Let's Encrypt)
- ✅ svlentes.com.br (Expires: Check certbot certificates)
- ✅ svlentes.shop (Expires: Check certbot certificates)
- ✅ saraivavision-n8n.cloud (Expires: 2026-01-11)

### Nginx Statistics
- **Version:** nginx/1.24.0 (Ubuntu)
- **Total Config Lines:** 663 lines
- **Memory Usage:** 8.5MB
- **Worker Processes:** 4
- **Files:** 8 configuration files

---

## Configuration Details

### 1. svlentes.com.br (Primary Application)
**File:** `/etc/nginx/sites-available/svlentes.com.br`  
**Lines:** 91  
**Backend:** localhost:5000 (Next.js via systemd)

**Key Features:**
- HTTP → HTTPS redirect
- SSL/TLS 1.2, 1.3
- Security headers (HSTS, X-Frame-Options, CSP)
- Static asset caching (1 year)
- Proxy headers for Next.js

**Configuration:**
```nginx
# HTTP redirect
server {
    listen 80;
    server_name svlentes.com.br www.svlentes.com.br;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$server_name$request_uri; }
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name svlentes.com.br www.svlentes.com.br;
    
    ssl_certificate /etc/letsencrypt/live/svlentes.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/svlentes.com.br/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /_next/static {
        proxy_pass http://localhost:5000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

---

### 2. svlentes.shop (Redirect Domain)
**File:** `/etc/nginx/sites-available/svlentes.shop`  
**Lines:** 49  
**Purpose:** Redirect to svlentes.com.br

**Configuration:**
```nginx
server {
    listen 80;
    server_name svlentes.shop www.svlentes.shop;
    location / { return 301 https://svlentes.com.br$request_uri; }
}

server {
    listen 443 ssl http2;
    server_name svlentes.shop www.svlentes.shop;
    
    ssl_certificate /etc/letsencrypt/live/svlentes.shop/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/svlentes.shop/privkey.pem;
    
    location / { return 301 https://svlentes.com.br$request_uri; }
}
```

---

### 3. saraivavision-n8n.cloud (n8n Platform)
**File:** `/etc/nginx/sites-available/saraivavision-n8n.cloud`  
**Lines:** 45 (includes Certbot auto-generated)  
**Backend:** localhost:5678 (n8n Docker)

**Key Features:**
- WebSocket support (Upgrade headers)
- Extended timeouts (300s read, 75s connect)
- Auto-generated SSL by Certbot

**Configuration:**
```nginx
server {
    server_name saraivavision-n8n.cloud www.saraivavision-n8n.cloud;
    
    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/saraivavision-n8n.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/saraivavision-n8n.cloud/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
}
```

---

### 4. contact-lens-form (Legacy/Alternative)
**File:** `/etc/nginx/sites-available/contact-lens-form`  
**Lines:** 147  
**Status:** Inactive (not symlinked to sites-enabled)  
**Purpose:** Backup configuration for alternative deployment

---

## SSL Certificate Management

### Current Process (Certbot)
```bash
# List certificates
certbot certificates

# Auto-renewal (systemd timer)
systemctl list-timers | grep certbot

# Manual renewal
certbot renew

# Test renewal
certbot renew --dry-run
```

### Certificate Locations
```
/etc/letsencrypt/live/
├── svlentes.com.br/
│   ├── fullchain.pem
│   ├── privkey.pem
│   └── ...
├── svlentes.shop/
│   └── ...
└── saraivavision-n8n.cloud/
    └── ...
```

---

## Known Issues (Pre-Migration)

1. **Manual SSL Management**
   - Certbot requires separate configuration
   - Rate limiting issues experienced (Oct 12)
   - Renewal failures can cause downtime

2. **Configuration Complexity**
   - 663 lines across 8 files
   - Duplicate security headers
   - Manual proxy_set_header repetition

3. **No HTTP/3 Support**
   - Requires manual compilation
   - Not enabled in current setup

4. **Maintenance Overhead**
   - SSL renewal monitoring required
   - Manual nginx reloads after cert renewal
   - Multiple configuration files to maintain

---

## Rollback Plan

### To Restore Nginx (if migration fails)
```bash
# Stop Caddy
systemctl stop caddy
systemctl disable caddy

# Extract backup
cd /root/svlentes-hero-shop/migration/backups
tar -xzf nginx-config-backup.tar.gz -C /

# Restart Nginx
systemctl start nginx
systemctl enable nginx

# Test
nginx -t
curl -I https://svlentes.com.br
```

### Validation Checklist
- [ ] All 3 domains respond with 200 OK
- [ ] SSL certificates valid
- [ ] Next.js app accessible
- [ ] n8n platform accessible
- [ ] Redirects working (svlentes.shop → svlentes.com.br)

---

## Migration Target (Caddy)

### Expected Benefits
1. **90% reduction in config lines** (663 → ~60)
2. **Automatic SSL** management (no Certbot)
3. **HTTP/3 support** out-of-the-box
4. **Zero-downtime** SSL renewals
5. **Simpler syntax** (easier maintenance)

### Expected Trade-offs
1. **Memory usage** increase (~8.5MB → ~25MB)
2. **New syntax** to learn
3. **Different debugging** approach

---

**Next Steps:** Proceed with Caddy installation and configuration creation
