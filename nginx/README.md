# Nginx Production Setup

This folder ships an opinionated Nginx configuration tailored for the SV Lentes Next.js application.

## Key Features
- Reverse proxy to the standalone Next.js server on `127.0.0.1:5000`
- Automatic HTTPS redirect with HTTP/2, TLS 1.2/1.3, OCSP stapling, and strong ciphers
- Brotli + gzip compression, immutable caching for static assets, and upstream cache for ISR data
- Security headers aligned with the Next.js configuration (`Content-Security-Policy`, `HSTS`, etc.)
- Basic DDoS protection with connection and request limiting
- Structured logging (`request_time`, `upstream_response_time`) compatible with Logstash or Datadog
- Graceful fallback and SPA-friendly `try_files` implementation

## Deployment Checklist
1. Copy `production.conf` to `/etc/nginx/nginx.conf` (or include via `/etc/nginx/conf.d/svlentes.conf`).
2. Ensure `ngx_brotli` is installed. If unavailable, comment the `load_module` lines.
3. Create `/var/cache/nginx` with `www-data` ownership: `sudo mkdir -p /var/cache/nginx && sudo chown www-data:www-data /var/cache/nginx`.
4. Place Let's Encrypt certificates under `/etc/letsencrypt/live/svlentes.com.br/`.
5. Provide a minimal `snippets/letsencrypt.conf` to handle HTTP-01 challenges if not already present.
6. Test the configuration: `sudo nginx -t`.
7. Reload Nginx: `sudo systemctl reload nginx`.

## Rolling Updates
- Reloading Nginx (`systemctl reload nginx`) is zero-downtime.
- The upstream Next.js app should be managed by systemd or PM2 (see `systemd/nextjs.service` and `ecosystem.config.js`).
- Keep `proxy_cache_path` on a persistent disk to retain ISR/SSG caches across reloads.

## Troubleshooting Tips
- Use `sudo tail -f /var/log/nginx/svlentes.error.log` for quick diagnostics.
- For 502/504 errors, confirm the Next.js process is active (`systemctl status nextjs.service`).
- Clear asset cache via `sudo rm -rf /var/cache/nginx/*` if stale content persists.
