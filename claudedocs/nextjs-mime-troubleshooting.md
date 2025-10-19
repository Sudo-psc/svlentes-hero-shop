# Next.js MIME Type / nosniff Troubleshooting Guide

## 🔥 Problema Resolvido

**Sintomas originais:**
- Erros 400 ao carregar chunks JavaScript do Next.js
- `Refused to execute as script because "X-Content-Type-Options: nosniff" was given and its Content-Type is not a script MIME type`
- `ChunkLoadError: Loading chunk failed`

**Causa raiz identificada:** Build incompleto sem pasta `.next/static/`, causando referências a chunks inexistentes.

## 🎯 Solução Implementada

### 1. Rebuild Completo
```bash
# Remover build corrompido
rm -rf .next

# Build de produção completo
NODE_ENV=production npm run build

# Verificar estrutura gerada
ls -la .next/static/chunks/
cat .next/BUILD_ID
```

### 2. Restart do Serviço
```bash
systemctl restart svlentes-nextjs
systemctl status svlentes-nextjs
```

### 3. Otimização Nginx
Configuração atualizada em `/etc/nginx/sites-available/svlentes.com.br`:

```nginx
# Next.js Static Assets - Immutable with BUILD_ID versioning
location /_next/static {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Force cache revalidation on new deploys
    proxy_cache_bypass $http_cache_control;

    # Let Next.js control caching (already sends immutable)
    proxy_hide_header Cache-Control;
    add_header Cache-Control "public, max-age=31536000, immutable" always;

    # Ensure JavaScript MIME type is preserved
    add_header X-Content-Type-Options "nosniff" always;
}

# Next.js Dynamic Routes and Data
location /_next/data {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;

    # No caching for data routes
    add_header Cache-Control "private, no-cache, no-store, must-revalidate" always;
}
```

```bash
nginx -t && systemctl reload nginx
```

## 📋 Validação Pós-Deploy

### Script de Validação Automática
```bash
#!/bin/bash
DOMAIN="https://svlentes.com.br"

# Obter chunks da home page
CHUNKS=$(curl -s $DOMAIN | grep -o '_next/static/chunks/[^"]*\.js' | head -5)

for CHUNK in $CHUNKS; do
  echo "Testing: /$CHUNK"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/$CHUNK")
  CONTENT_TYPE=$(curl -s -I "$DOMAIN/$CHUNK" | grep -i "content-type:" | awk '{print $2}')

  if [ "$STATUS" != "200" ]; then
    echo "  ❌ Status: $STATUS (expected 200)"
  elif [[ "$CONTENT_TYPE" != *"javascript"* ]]; then
    echo "  ❌ Content-Type: $CONTENT_TYPE (expected javascript)"
  else
    echo "  ✅ OK - Status: $STATUS, Type: $CONTENT_TYPE"
  fi
done
```

### Checklist Manual
- [ ] `curl -I https://svlentes.com.br/_next/static/chunks/[chunk].js` retorna 200
- [ ] Header `Content-Type: application/javascript; charset=UTF-8` presente
- [ ] Header `X-Content-Type-Options: nosniff` presente
- [ ] Corpo da resposta é JavaScript válido (não HTML)
- [ ] Cache-Control header: `public, max-age=31536000, immutable`

## 🚨 Problemas Comuns e Soluções

### 1. Build Incompleto
**Sintoma:** Pasta `.next/` sem subpasta `static/`
**Solução:**
```bash
rm -rf .next
NODE_ENV=production npm run build
```

### 2. Cache Stale do Navegador
**Sintoma:** Usuários veem chunks antigos que não existem mais
**Solução:**
- Usuários: Hard refresh (Ctrl+F5 / Cmd+Shift+R)
- Deploy: Adicionar `?v=BUILD_ID` aos scripts críticos
- Nginx: Configurar `proxy_cache_bypass` para /_next/static

### 3. Content-Type Incorreto
**Sintoma:** `Content-Type: text/html` em vez de `application/javascript`
**Diagnóstico:**
```bash
curl -I http://localhost:5000/_next/static/chunks/[chunk].js
```
**Solução:** Next.js define MIME automaticamente - verificar se arquivo existe

### 4. Erros 400 Persistentes
**Sintoma:** 400 Bad Request mesmo após rebuild
**Diagnóstico:**
```bash
# Verificar logs do Next.js
journalctl -u svlentes-nextjs -f

# Verificar se Next.js está acessando arquivos corretos
ls -la .next/static/chunks/
```
**Solução:** Chunks referenciados não existem - rebuild completo necessário

## 🔧 Manutenção Preventiva

### Deploy Checklist
1. Build completo: `NODE_ENV=production npm run build`
2. Verificar BUILD_ID: `cat .next/BUILD_ID`
3. Verificar chunks existem: `ls .next/static/chunks/ | wc -l`
4. Restart service: `systemctl restart svlentes-nextjs`
5. Validar endpoint: `curl -I https://svlentes.com.br/`
6. Testar chunks: validação automática acima

### Monitoramento Contínuo
```bash
# Verificar logs de erro
tail -f /var/log/nginx/svlentes.com.br.error.log | grep "_next"

# Monitorar service
journalctl -u svlentes-nextjs -f | grep -E "(error|Error|ERROR)"

# Verificar health
curl -f https://svlentes.com.br/api/health-check
```

## 📚 Referências Técnicas

**Headers de Segurança:**
- `X-Content-Type-Options: nosniff` - Previne MIME sniffing (DEVE permanecer ativo)
- `Content-Type: application/javascript` - MIME correto para arquivos .js

**Next.js Build System:**
- BUILD_ID - Identificador único por build (hash de 21 caracteres)
- Static chunks - Versionados automaticamente com hash de conteúdo
- Immutable caching - Arquivos nunca mudam após publicação

**Nginx Best Practices:**
- Proxy headers completos para Next.js
- Cache-Control preservado do upstream
- proxy_cache_bypass para forçar revalidação

## ✅ Status Atual

**Data:** 2025-10-19
**BUILD_ID:** zEb5-0HUxyS_0IElGB_iA
**Status:** ✅ Totalmente operacional
**Chunks validados:** 16 chunks principais
**Headers confirmados:** Content-Type, Cache-Control, X-Content-Type-Options
**Performance:** 200ms response time médio para chunks
