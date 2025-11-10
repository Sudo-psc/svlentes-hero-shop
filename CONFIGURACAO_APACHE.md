# Configuração Apache para Next.js - svlentes.com.br

> **NOTA**: Este servidor está usando **Nginx**. Este arquivo é fornecido como referência caso você precise migrar para Apache ou tenha outro servidor usando Apache.

---

## 📋 CONFIGURAÇÃO APACHE EQUIVALENTE

### Arquivo: `/etc/apache2/sites-available/svlentes.com.br.conf`

```apache
# Rate Limiting Module (requer mod_ratelimit e mod_qos)
<IfModule mod_qos.c>
    # Limite global de conexões por IP
    QS_SrvMaxConnPerIP 100
    
    # Limites específicos para static assets
    <LocationMatch "^/_next/static/">
        QS_SrvMaxConnPerIP 200
    </LocationMatch>
</IfModule>

# Redirect HTTP to HTTPS
<VirtualHost *:80>
    ServerName svlentes.com.br
    ServerAlias www.svlentes.com.br
    
    # Let's Encrypt validation
    Alias /.well-known/acme-challenge/ /var/www/certbot/.well-known/acme-challenge/
    <Directory /var/www/certbot/.well-known/acme-challenge/>
        Require all granted
    </Directory>
    
    # Redirect to HTTPS
    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/.well-known/acme-challenge/
    RewriteRule ^(.*)$ https://%{HTTP_HOST}$1 [R=301,L]
</VirtualHost>

# HTTPS Server
<VirtualHost *:443>
    ServerName svlentes.com.br
    ServerAlias www.svlentes.com.br
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/svlentes.com.br/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/svlentes.com.br/privkey.pem
    SSLCertificateChainFile /etc/letsencrypt/live/svlentes.com.br/chain.pem
    
    # Modern SSL Configuration
    SSLProtocol -all +TLSv1.2 +TLSv1.3
    SSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    SSLHonorCipherOrder on
    
    # Enable HTTP/2
    Protocols h2 http/1.1
    
    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Content Security Policy
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://apis.google.com https://www.googleapis.com https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.stripe.com https://js.stripe.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseapp.com https://*.googleapis.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://svlentes.firebaseapp.com https://accounts.google.com; trusted-types default stripe-js decodeHTMLEntitiesPolicy 'allow-duplicates'; require-trusted-types-for 'script'"
    
    # Proxy to Next.js
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:5000/
    ProxyPassReverse / http://127.0.0.1:5000/
    
    # WebSocket support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://127.0.0.1:5000/$1 [P,L]
    
    # Static Assets with aggressive caching
    <LocationMatch "^/_next/static/">
        # Higher connection limit for static assets
        <IfModule mod_qos.c>
            QS_SrvMaxConnPerIP 200
        </IfModule>
        
        # Caching headers
        Header always set Cache-Control "public, max-age=31536000, immutable"
        Header always set X-Content-Type-Options "nosniff"
        
        # MIME types enforcement
        <FilesMatch "\.js$">
            Header always set Content-Type "application/javascript; charset=UTF-8"
        </FilesMatch>
        
        <FilesMatch "\.css$">
            Header always set Content-Type "text/css; charset=UTF-8"
        </FilesMatch>
    </LocationMatch>
    
    # API endpoints with stricter rate limiting
    <LocationMatch "^/api/">
        <IfModule mod_qos.c>
            QS_SrvMaxConnPerIP 50
            QS_LocRequestLimitMatch "^/api/(auth|login|register)" 10
        </IfModule>
    </LocationMatch>
    
    # Health check endpoint
    <Location /api/health-check>
        ProxyPass http://127.0.0.1:5000/api/health-check
        ProxyPassReverse http://127.0.0.1:5000/api/health-check
        
        # Don't log health checks
        SetEnvIf Request_URI "^/api/health-check$" dontlog
        CustomLog /var/log/apache2/access.log combined env=!dontlog
    </Location>
    
    # Static files from public directory
    Alias /images /root/svlentes-hero-shop/public/images
    Alias /favicon.ico /root/svlentes-hero-shop/public/favicon.ico
    Alias /robots.txt /root/svlentes-hero-shop/public/robots.txt
    
    <Directory /root/svlentes-hero-shop/public>
        Require all granted
        Options -Indexes +FollowSymLinks
        
        # Image caching
        <FilesMatch "\.(jpg|jpeg|png|gif|ico|webp|svg)$">
            Header set Cache-Control "public, max-age=31536000, immutable"
        </FilesMatch>
        
        # Font caching
        <FilesMatch "\.(woff|woff2|ttf|eot|otf)$">
            Header set Cache-Control "public, max-age=31536000, immutable"
            Header set Access-Control-Allow-Origin "*"
        </FilesMatch>
    </Directory>
    
    # Compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
        AddOutputFilterByType DEFLATE text/javascript application/javascript application/x-javascript
        AddOutputFilterByType DEFLATE application/json application/xml application/xhtml+xml
        AddOutputFilterByType DEFLATE application/rss+xml application/atom+xml
        AddOutputFilterByType DEFLATE image/svg+xml
    </IfModule>
    
    # Enable KeepAlive for better performance
    KeepAlive On
    MaxKeepAliveRequests 100
    KeepAliveTimeout 5
    
    # Logs
    ErrorLog /var/log/apache2/svlentes-error.log
    CustomLog /var/log/apache2/svlentes-access.log combined
</VirtualHost>

# Enable necessary Apache modules
<IfModule !mod_ssl.c>
    LoadModule ssl_module modules/mod_ssl.so
</IfModule>
<IfModule !mod_proxy.c>
    LoadModule proxy_module modules/mod_proxy.so
</IfModule>
<IfModule !mod_proxy_http.c>
    LoadModule proxy_http_module modules/mod_proxy_http.so
</IfModule>
<IfModule !mod_proxy_wstunnel.c>
    LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
</IfModule>
<IfModule !mod_headers.c>
    LoadModule headers_module modules/mod_headers.so
</IfModule>
<IfModule !mod_rewrite.c>
    LoadModule rewrite_module modules/mod_rewrite.so
</IfModule>
<IfModule !mod_http2.c>
    LoadModule http2_module modules/mod_http2.so
</IfModule>
```

---

## 🔧 INSTALAÇÃO E CONFIGURAÇÃO

### 1. Instalar módulos necessários:

```bash
# Módulos básicos
sudo apt-get install -y apache2

# Habilitar módulos
sudo a2enmod ssl
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod headers
sudo a2enmod rewrite
sudo a2enmod http2
sudo a2enmod deflate

# Para rate limiting (opcional mas recomendado)
sudo apt-get install -y libapache2-mod-qos
sudo a2enmod qos
```

### 2. Criar arquivo de configuração:

```bash
sudo nano /etc/apache2/sites-available/svlentes.com.br.conf
# Cole a configuração acima
```

### 3. Habilitar site e desabilitar default:

```bash
sudo a2ensite svlentes.com.br
sudo a2dissite 000-default
```

### 4. Testar e aplicar:

```bash
# Testar configuração
sudo apache2ctl configtest

# Se OK, aplicar
sudo systemctl reload apache2

# Verificar status
sudo systemctl status apache2
```

---

## 📊 COMPARAÇÃO NGINX vs APACHE

| Recurso | Nginx | Apache |
|---------|-------|--------|
| Performance HTTP/2 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Uso de Memória | Baixo | Médio |
| Rate Limiting | Nativo e eficiente | Requer mod_qos |
| Configuração | Mais simples | Mais verbosa |
| Compatibilidade | Moderno | Universal |
| Recomendação para Next.js | ✅ **PREFERIDO** | ⚠️ Funciona bem |

---

## 🔍 TROUBLESHOOTING APACHE

### Problema: Erros 503

```bash
# Verificar logs
sudo tail -f /var/log/apache2/svlentes-error.log

# Verificar se proxy está funcionando
curl http://127.0.0.1:5000/

# Verificar módulo proxy
apache2ctl -M | grep proxy
```

### Problema: Rate limiting não funciona

```bash
# Verificar se mod_qos está instalado
apache2ctl -M | grep qos

# Se não, instalar
sudo apt-get install libapache2-mod-qos
sudo a2enmod qos
sudo systemctl restart apache2
```

### Problema: Content-Type incorreto

```bash
# Verificar MIME types
grep "application/javascript" /etc/mime.types

# Se necessário, adicionar ao config
AddType application/javascript .js
AddType text/css .css
```

---

## 📝 NOTAS IMPORTANTES

1. **Este servidor usa Nginx**, não Apache. Esta configuração é fornecida apenas como referência.

2. **mod_qos** é necessário para rate limiting equivalente ao Nginx. Alternativas:
   - mod_evasive (mais simples, menos recursos)
   - mod_security (mais complexo, mais recursos)

3. **Performance**: Nginx é geralmente mais performático para aplicações Next.js devido a:
   - Melhor handling de conexões concorrentes
   - Menor uso de memória
   - Rate limiting nativo mais eficiente

4. **Migração**: Se considerar migrar de Nginx para Apache:
   - Teste em ambiente de staging primeiro
   - Compare performance (use Apache Bench ou similar)
   - Monitore uso de recursos

---

## 🚀 COMANDOS ÚTEIS APACHE

```bash
# Status do Apache
sudo systemctl status apache2

# Testar configuração
sudo apache2ctl configtest

# Reload (sem downtime)
sudo systemctl reload apache2

# Restart (com breve downtime)
sudo systemctl restart apache2

# Ver módulos carregados
apache2ctl -M

# Ver configuração ativa
apache2ctl -S

# Monitorar logs em tempo real
sudo tail -f /var/log/apache2/svlentes-error.log
sudo tail -f /var/log/apache2/svlentes-access.log

# Verificar performance
sudo apache2ctl status
```

---

## 📚 REFERÊNCIAS

- [Apache mod_proxy Documentation](https://httpd.apache.org/docs/2.4/mod/mod_proxy.html)
- [Apache mod_qos Documentation](http://mod-qos.sourceforge.net/)
- [Apache HTTP/2 Guide](https://httpd.apache.org/docs/2.4/howto/http2.html)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Nota Final**: Esta configuração Apache NÃO está em uso no servidor atual. O servidor está usando **Nginx** com as correções aplicadas conforme documentado em `CORRECAO_APLICADA_SUCESSO.md`.
