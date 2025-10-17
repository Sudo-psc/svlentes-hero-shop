# Nginx Reverse Proxy - Complete Guide

## Overview

This guide covers the Nginx reverse proxy configuration for the SV Lentes production environment.

**System Information:**
- **Nginx Version**: 1.24.0
- **Primary Domain**: svlentes.com.br
- **Alternative Domain**: svlentes.shop (redirects to primary)
- **Backend**: Next.js on localhost:5000
- **SSL**: Let's Encrypt certificates via Certbot

## Architecture

```
Internet (HTTPS)
      ↓
┌─────────────────────────────┐
│   Nginx:443 (SSL Termination)│
│   - svlentes.com.br          │
│   - svlentes.shop            │
└─────────────────────────────┘
      ↓
localhost:5000 (Next.js App)
      ↓
PostgreSQL:5433 (Database)
```

## Configuration Files

### File Structure
```
/etc/nginx/
├── nginx.conf                           # Main configuration
├── sites-available/
│   ├── svlentes.com.br                 # Primary domain config
│   ├── svlentes.shop                   # Redirect config
│   ├── saraivavision-n8n.cloud         # n8n automation
│   └── default                         # Default server
└── sites-enabled/                       # Symlinks to active sites
    ├── svlentes.com.br -> ../sites-available/svlentes.com.br
    ├── svlentes.shop -> ../sites-available/svlentes.shop
    └── saraivavision-n8n.cloud -> ../sites-available/saraivavision-n8n.cloud
```

### Primary Configuration (svlentes.com.br)

**Key Features:**
- **HTTP → HTTPS** redirect on port 80
- **SSL/TLS** termination with HTTP/2
- **Proxy** to Next.js on localhost:5000
- **Static asset caching** for performance
- **Security headers** (HSTS, X-Frame-Options, etc.)

**Caching Strategy:**
- `/_next/static/*` → 365 days (immutable)
- Images/Fonts → 1 year expiry
- Dynamic content → No cache

### Redirect Configuration (svlentes.shop)

**Purpose:** Redirect all traffic to primary domain (svlentes.com.br)

**Behavior:**
- HTTP traffic → HTTPS redirect
- HTTPS traffic → 301 redirect to svlentes.com.br

## SSL Certificate Management

### Certificate Locations
```
/etc/letsencrypt/live/svlentes.com.br/
├── fullchain.pem       # Certificate + intermediate chain
├── privkey.pem         # Private key
├── cert.pem            # Certificate only
└── chain.pem           # Intermediate chain

/etc/letsencrypt/live/svlentes.shop/
└── (same structure)
```

### Auto-Renewal Setup

**Systemd Timer:**
```bash
# Check timer status
systemctl status certbot.timer

# View next renewal time
systemctl list-timers certbot.timer

# Manual trigger
systemctl start certbot.service
```

**Renewal Process:**
1. Certbot checks certificate expiry (runs daily)
2. If < 30 days remaining, renews automatically
3. Nginx reloads configuration after renewal
4. Email notifications sent on failure

### Manual Certificate Operations

```bash
# List all certificates
certbot certificates

# Renew specific certificate
certbot renew --cert-name svlentes.com.br

# Force renewal (testing)
certbot renew --force-renewal --dry-run

# Add new domain
certbot certonly --nginx -d newdomain.com -d www.newdomain.com

# Delete certificate
certbot delete --cert-name svlentes.shop
```

## Cache Management

### Understanding Nginx Caching

**Static Assets (`/_next/static`):**
- Cached for **365 days**
- `Cache-Control: public, max-age=31536000, immutable`
- Browser will NOT request new versions until cache expires

**Images/Fonts:**
- Cached for **1 year**
- `Cache-Control: public, immutable`

**Dynamic Pages:**
- No caching (`proxy_cache_bypass $http_upgrade`)

### Cache Clearing Workflow

When deploying changes that aren't reflecting:

```bash
# 1. Clear Next.js build cache
cd /root/svlentes-hero-shop
rm -rf .next

# 2. Rebuild application
npm run build

# 3. Restart Next.js service
systemctl restart svlentes-nextjs

# 4. Reload Nginx (not strictly necessary)
systemctl reload nginx

# 5. Verify deployment
curl -I https://svlentes.com.br
```

**Important:** Users will still see old content due to browser cache. They need to:
- Hard refresh: **Ctrl + F5** (Windows/Linux) or **Cmd + Shift + R** (Mac)
- Or clear browser cache manually

### Cache Busting Strategy

Next.js automatically adds content hashes to static files:
```
/_next/static/chunks/main-abc123def456.js
```

The hash changes when content changes, forcing browsers to fetch new files.

## Common Operations

### Configuration Testing

```bash
# Test configuration syntax
nginx -t

# Expected output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# View full parsed configuration
nginx -T | less
```

### Service Management

```bash
# Status check
systemctl status nginx

# Reload configuration (no downtime)
systemctl reload nginx

# Restart service (brief downtime)
systemctl restart nginx

# Start/Stop
systemctl start nginx
systemctl stop nginx

# Enable auto-start on boot
systemctl enable nginx
```

### Log Monitoring

```bash
# Real-time access logs
tail -f /var/log/nginx/svlentes.com.br.access.log

# Real-time error logs
tail -f /var/log/nginx/error.log

# Search for specific error
grep "error" /var/log/nginx/error.log | tail -20

# View logs with systemd
journalctl -u nginx -f

# Check last 100 lines
journalctl -u nginx -n 100 --no-pager
```

### Port Management

```bash
# Check what's using port 80/443
netstat -tlnp | grep -E ":80|:443"
lsof -ti:443

# Expected output:
# tcp  0.0.0.0:80   LISTEN  782/nginx
# tcp  0.0.0.0:443  LISTEN  782/nginx

# Kill process on port (if needed)
lsof -ti:443 | xargs kill -9
```

## Troubleshooting

### Configuration Warnings

**Warning:** `protocol options redefined for [::]:443`

**Cause:** Multiple virtual hosts use the same SSL settings

**Resolution:** This is safe to ignore. It's a known behavior when multiple server blocks share the same port with different SSL certificates.

### Port Conflicts

**Error:** `bind: address already in use`

**Diagnosis:**
```bash
# Find what's using the port
netstat -tlnp | grep 443
lsof -ti:443

# Check if Caddy is running (old reverse proxy)
systemctl status caddy
```

**Resolution:**
```bash
# Stop conflicting service
systemctl stop caddy
systemctl disable caddy

# Start Nginx
systemctl start nginx
```

### SSL Certificate Issues

**Problem:** SSL certificate expired or invalid

**Diagnosis:**
```bash
# Check certificate expiry
certbot certificates

# View certificate details
openssl x509 -in /etc/letsencrypt/live/svlentes.com.br/fullchain.pem -text -noout | grep "Not After"

# Test SSL connection
openssl s_client -connect svlentes.com.br:443 -servername svlentes.com.br
```

**Resolution:**
```bash
# Manual renewal
certbot renew --force-renewal

# Reload Nginx
systemctl reload nginx

# Verify
curl -vI https://svlentes.com.br 2>&1 | grep "SSL certificate"
```

### Changes Not Reflecting

**Problem:** Code changes deployed but not visible on website

**Diagnosis:**
1. Check if Next.js build succeeded
2. Verify service restarted
3. Check browser cache
4. Verify Nginx is proxying correctly

**Resolution:**
```bash
# Complete cache clear workflow
cd /root/svlentes-hero-shop
rm -rf .next                        # Clear build cache
npm run build                       # Rebuild
systemctl restart svlentes-nextjs   # Restart service
systemctl reload nginx              # Reload proxy

# Verify deployment
curl -I https://svlentes.com.br

# Check if backend is responding
curl -I http://localhost:5000

# Test proxy is working
curl -H "Host: svlentes.com.br" http://localhost
```

**Client-side:**
- Hard refresh: Ctrl + F5 (Windows/Linux) or Cmd + Shift + R (Mac)
- Or incognito/private browsing mode

### 502 Bad Gateway

**Cause:** Nginx can't reach Next.js backend

**Diagnosis:**
```bash
# Check if Next.js is running
systemctl status svlentes-nextjs

# Check if port 5000 is open
curl http://localhost:5000

# Check Next.js logs
journalctl -u svlentes-nextjs -n 50
```

**Resolution:**
```bash
# Restart Next.js service
systemctl restart svlentes-nextjs

# If port is occupied
lsof -ti:5000 | xargs kill -9
systemctl restart svlentes-nextjs
```

### 504 Gateway Timeout

**Cause:** Request took too long to complete

**Check timeouts in config:**
```nginx
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

**Resolution:**
- Investigate slow API endpoints
- Check database performance
- Review application logs
- Consider increasing timeouts if legitimate

## Security Best Practices

### Security Headers

Current configuration includes:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

### TLS Configuration

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

### Testing Security

```bash
# SSL Labs test
curl -s "https://api.ssllabs.com/api/v3/analyze?host=svlentes.com.br" | jq

# Security headers check
curl -I https://svlentes.com.br | grep -E "Strict-Transport|X-Frame|X-Content"

# TLS version check
openssl s_client -connect svlentes.com.br:443 -tls1_2
```

## Performance Optimization

### Current Optimizations

1. **HTTP/2**: Enabled for multiplexing
2. **Gzip Compression**: Enabled in main config
3. **Static Asset Caching**: 365 days for `/_next/static`
4. **Keep-Alive**: Connection reuse enabled
5. **Proxy Buffering**: Enabled for backend responses

### Monitoring Performance

```bash
# Response time testing
curl -w "@-" -o /dev/null -s https://svlentes.com.br <<'EOF'
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer:  %{time_pretransfer}\n
time_redirect:  %{time_redirect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
EOF

# Check cache hit rate
grep "X-Cache" /var/log/nginx/svlentes.com.br.access.log | wc -l
```

### Tuning Recommendations

For high-traffic scenarios, consider:
```nginx
# In /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 2048;

# Enable gzip compression types
gzip_types text/plain text/css application/json application/javascript;
gzip_comp_level 6;

# Buffer sizes
client_body_buffer_size 128k;
client_max_body_size 10M;
```

## Backup & Recovery

### Configuration Backup

```bash
# Backup Nginx configuration
tar -czf nginx-config-backup-$(date +%Y%m%d).tar.gz /etc/nginx/

# Backup to safe location
cp nginx-config-backup-*.tar.gz /root/backups/
```

### Restore Configuration

```bash
# Extract backup
tar -xzf nginx-config-backup-20251017.tar.gz -C /

# Test configuration
nginx -t

# Reload if valid
systemctl reload nginx
```

## Maintenance Checklist

### Weekly
- [ ] Check service status: `systemctl status nginx`
- [ ] Review error logs: `tail -100 /var/log/nginx/error.log`
- [ ] Monitor SSL expiry: `certbot certificates`

### Monthly
- [ ] Test auto-renewal: `certbot renew --dry-run`
- [ ] Review access logs for anomalies
- [ ] Backup configuration files
- [ ] Update documentation if changes made

### Before Deployment
- [ ] Test configuration: `nginx -t`
- [ ] Backup current config
- [ ] Clear Next.js cache: `rm -rf .next`
- [ ] Rebuild application: `npm run build`
- [ ] Restart services
- [ ] Verify deployment
- [ ] Monitor logs for errors

## Quick Reference

### Essential Commands

| Operation | Command |
|-----------|---------|
| Test config | `nginx -t` |
| Reload | `systemctl reload nginx` |
| Restart | `systemctl restart nginx` |
| Status | `systemctl status nginx` |
| View logs | `tail -f /var/log/nginx/error.log` |
| SSL info | `certbot certificates` |
| Renew SSL | `certbot renew` |
| Port check | `netstat -tlnp \| grep 443` |

### Important Paths

| Resource | Path |
|----------|------|
| Main config | `/etc/nginx/nginx.conf` |
| Site configs | `/etc/nginx/sites-available/` |
| Active sites | `/etc/nginx/sites-enabled/` |
| Access logs | `/var/log/nginx/*.access.log` |
| Error logs | `/var/log/nginx/error.log` |
| SSL certs | `/etc/letsencrypt/live/` |

### Emergency Contacts

- **System Admin**: Check `/root/CLAUDE.md` for contact info
- **Nginx Docs**: https://nginx.org/en/docs/
- **Let's Encrypt Support**: https://community.letsencrypt.org/
