# Solução Completa - Erros 503 e CSP no svlentes.com.br

## 🔍 DIAGNÓSTICO COMPLETO

### Problema 1: Erro 503 (FALSO POSITIVO)
**Status**: ✅ IDENTIFICADO - NÃO é erro 503 real!

**Causa Raiz**: Rate limiting excessivo no Nginx bloqueando conexões legítimas
- O Nginx está retornando 503 porque está limitando conexões por IP
- Log mostra: `limiting connections by zone "conn_limit_per_ip"`
- Limite atual: **20 conexões simultâneas por IP** (linha 79 do svlentes.com.br)
- Next.js carrega ~25-40 chunks JavaScript simultaneamente via HTTP/2
- Resultado: Conexões bloqueadas = Erro 503 no navegador

### Problema 2: Content-Type
**Status**: ⚠️ CONFIGURAÇÃO OK, mas pode melhorar
- Nginx já está configurado para proxy_pass para Next.js
- Next.js serve com Content-Type correto
- Problema é rate limiting impedindo chegada dos arquivos

### Problema 3: CSP Trusted Types
**Status**: ❌ REQUER CORREÇÃO
- Configuração atual: `trusted-types 'default' 'stripe-js'`
- Problema: Aspas extras e falta de políticas necessárias
- Correção necessária: `trusted-types default stripe-js decodeHTMLEntitiesPolicy`

---

## 🔧 SOLUÇÕES IMPLEMENTADAS

### Solução 1: Ajustar Rate Limiting no Nginx

O problema principal é o limite de conexões simultâneas muito baixo para aplicações Next.js modernas.

#### Configuração Atual (PROBLEMÁTICA):
```nginx
limit_conn conn_limit_per_ip 20;  # Linha 79 - MUITO BAIXO!
```

#### Configuração Corrigida:
```nginx
# Para páginas comuns - limite moderado
limit_conn conn_limit_per_ip 100;

# Para static assets - limite maior
location ^~ /_next/static/ {
    limit_conn conn_limit_per_ip 200;  # Permite mais conexões para chunks
    # ... resto da config
}
```

### Solução 2: Content-Type Headers

Nginx já está configurado corretamente, mas vamos garantir:

```nginx
location ^~ /_next/static/ {
    proxy_pass http://nextjs_backend;
    proxy_http_version 1.1;
    
    # Garantir Content-Type correto
    add_header X-Content-Type-Options "nosniff" always;
    
    # Headers específicos para JS
    location ~* \.js$ {
        add_header Content-Type "application/javascript; charset=utf-8" always;
    }
    
    # Headers específicos para CSS
    location ~* \.css$ {
        add_header Content-Type "text/css; charset=utf-8" always;
    }
    
    # ... resto da config
}
```

### Solução 3: Corrigir CSP Trusted Types no next.config.js

```javascript
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://apis.google.com https://www.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://js.stripe.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://svlentes.firebaseapp.com",
    "trusted-types default stripe-js decodeHTMLEntitiesPolicy 'allow-duplicates'"
  ].join('; ')
}
```

---

## 📝 ARQUIVOS DE CONFIGURAÇÃO COMPLETOS

### 1. Nginx - svlentes.com.br (CORRIGIDO)

**Localização**: `/etc/nginx/sites-available/svlentes.com.br`

**Mudanças Necessárias**:

```nginx
# Linha 79 - ALTERAR DE:
limit_conn conn_limit_per_ip 20;

# PARA:
limit_conn conn_limit_per_ip 100;

# Linha 242-258 - ALTERAR SEÇÃO /_next/static/ PARA:
location ^~ /_next/static/ {
    # Limite maior para assets estáticos
    limit_conn conn_limit_per_ip 200;
    
    proxy_pass http://nextjs_backend;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    # Garantir Content-Type correto para JS
    location ~* \.js$ {
        proxy_pass http://nextjs_backend;
        add_header Content-Type "application/javascript; charset=utf-8" always;
        add_header X-Content-Type-Options "nosniff" always;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }
    
    # Garantir Content-Type correto para CSS
    location ~* \.css$ {
        proxy_pass http://nextjs_backend;
        add_header Content-Type "text/css; charset=utf-8" always;
        add_header X-Content-Type-Options "nosniff" always;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }

    # Long-term caching para outros assets
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Connection keep-alive
    proxy_set_header Connection "";
}
```

### 2. Next.js - next.config.js (CORRIGIDO)

**Localização**: `/root/svlentes-hero-shop/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    forceSwcTransforms: true,
  },
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://apis.google.com https://www.googleapis.com https://accounts.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.stripe.com https://js.stripe.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseapp.com https://*.googleapis.com",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://svlentes.firebaseapp.com https://accounts.google.com",
              "trusted-types default stripe-js decodeHTMLEntitiesPolicy 'allow-duplicates'",
              "require-trusted-types-for 'script'"
            ].join('; ')
          }
        ]
      }
    ]
  }
};

module.exports = nextConfig;
```

---

## 🚀 COMANDOS DE APLICAÇÃO

### Passo 1: Backup das configurações atuais
```bash
sudo cp /etc/nginx/sites-available/svlentes.com.br /etc/nginx/sites-available/svlentes.com.br.backup.$(date +%Y%m%d)
cp /root/svlentes-hero-shop/next.config.js /root/svlentes-hero-shop/next.config.js.backup.$(date +%Y%m%d)
```

### Passo 2: Aplicar correções Nginx
```bash
# Editar arquivo
sudo nano /etc/nginx/sites-available/svlentes.com.br

# Testar configuração
sudo nginx -t

# Se OK, recarregar
sudo systemctl reload nginx

# Verificar status
sudo systemctl status nginx
```

### Passo 3: Aplicar correções Next.js
```bash
cd /root/svlentes-hero-shop

# Editar next.config.js com as correções

# Rebuild
npm run build

# Reiniciar servidor
pkill -f "next-server"
sleep 2
next start -p 5000 -H 0.0.0.0 &
```

### Passo 4: Limpar cache do Nginx
```bash
# Limpar cache de proxy
sudo rm -rf /var/lib/nginx/proxy/*

# Recarregar novamente
sudo systemctl reload nginx
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### Antes de aplicar:
- [ ] Backup do Nginx config criado
- [ ] Backup do next.config.js criado
- [ ] Next.js está rodando na porta 5000
- [ ] Nginx está ativo e funcionando

### Durante aplicação:
- [ ] `nginx -t` passou sem erros
- [ ] Next.js rebuild sem erros
- [ ] Servidor Next.js reiniciado

### Após aplicação:
- [ ] Acessar https://svlentes.com.br
- [ ] Abrir DevTools → Network
- [ ] Verificar que chunks JS carregam com status 200
- [ ] Verificar Content-Type: application/javascript
- [ ] Verificar Console sem erros de CSP
- [ ] Testar Google Login (usa trusted types)

---

## 🔍 COMANDOS DE DIAGNÓSTICO

### Verificar logs em tempo real:
```bash
# Nginx error log
sudo tail -f /var/log/nginx/error.log | grep -E "503|limit|static"

# Nginx access log
sudo tail -f /var/log/nginx/access.log | grep "/_next/static"

# Next.js logs
pm2 logs --lines 100  # Se usando PM2
# OU
journalctl -u nextjs -f  # Se usando systemd
```

### Verificar conexões atuais:
```bash
# Conexões por IP
sudo netstat -an | grep :443 | grep ESTABLISHED | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn

# Total de conexões
sudo netstat -an | grep :443 | wc -l
```

### Testar Content-Type:
```bash
# Testar chunk específico
curl -I https://svlentes.com.br/_next/static/chunks/2117-9547f6c37199f50b.js

# Deve retornar:
# HTTP/2 200
# content-type: application/javascript
# x-content-type-options: nosniff
```

### Testar CSP:
```bash
# Verificar header CSP
curl -I https://svlentes.com.br | grep -i "content-security-policy"

# Deve conter:
# trusted-types default stripe-js decodeHTMLEntitiesPolicy 'allow-duplicates'
```

---

## 📊 MONITORAMENTO PÓS-IMPLEMENTAÇÃO

### Métricas a observar:

1. **Erros 503 devem desaparecer**
   - Antes: ~10-20 chunks falhando por página
   - Depois: 0 erros 503

2. **Tempo de carregamento**
   - Antes: Lento devido a retries
   - Depois: Rápido, todos chunks em paralelo

3. **Console do navegador**
   - Antes: Erros CSP de trusted-types
   - Depois: Sem erros CSP

4. **Google Login**
   - Antes: Pode falhar devido a CSP
   - Depois: Funciona perfeitamente

### Logs esperados após correção:
```
# Nginx - SEM mais erros de rate limiting
# Antes: limiting connections by zone "conn_limit_per_ip"
# Depois: Ausência deste erro

# Browser Console - SEM erros CSP
# Antes: Refused to create TrustedHTML policy 'default'
# Depois: Sem erros
```

---

## 🆘 TROUBLESHOOTING

### Se erros 503 persistirem:

1. **Verificar upstream**:
```bash
curl http://127.0.0.1:5000/_next/static/chunks/2117-9547f6c37199f50b.js
# Deve retornar 200 com conteúdo JS
```

2. **Aumentar ainda mais limites**:
```nginx
limit_conn conn_limit_per_ip 300;  # Aumentar se necessário
```

3. **Verificar conexões no Next.js**:
```bash
netstat -an | grep :5000 | wc -l
# Se próximo de max_conns=100, aumentar no upstream
```

### Se Content-Type estiver incorreto:

1. **Forçar no Nginx**:
```nginx
types {
    application/javascript js;
    text/css css;
}
```

2. **Verificar módulo mime no Nginx**:
```bash
sudo nginx -V 2>&1 | grep -o with-http_addition_module
```

### Se CSP bloquear scripts:

1. **Verificar console do navegador** para ver qual política está bloqueando
2. **Adicionar domínio necessário** ao CSP
3. **Usar 'unsafe-inline' temporariamente** para debug (REMOVER em produção)

---

## 📚 REFERÊNCIAS

- [Nginx Rate Limiting](http://nginx.org/en/docs/http/ngx_http_limit_conn_module.html)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [CSP Trusted Types](https://web.dev/trusted-types/)
- [HTTP/2 Connection Coalescing](https://daniel.haxx.se/blog/2016/08/18/http2-connection-coalescing/)

---

**Última Atualização**: 2025-11-09
**Status**: Solução completa pronta para implementação
**Prioridade**: CRÍTICA - Afeta todos os usuários
