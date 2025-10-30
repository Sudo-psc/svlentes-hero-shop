# 🚀 Quick Deploy Guide - Performance Optimizations

**TODAS AS OTIMIZAÇÕES JÁ ESTÃO IMPLEMENTADAS**
Este guia mostra como fazer deploy em produção.

## ⚡ Deploy em 4 Passos

### 1. Instalar Nova Dependência
```bash
cd /root/svlentes-hero-shop
npm install
```

### 2. Build de Produção
```bash
npm run build
```

### 3. Restart Serviço
```bash
systemctl restart svlentes-nextjs
```

### 4. Verificar
```bash
curl -I https://svlentes.com.br
journalctl -u svlentes-nextjs -n 50
```

## ✅ Testes Pós-Deploy

### Service Worker
1. Abrir https://svlentes.com.br
2. F12 > Application > Service Workers
3. Status: "activated and is running" ✅

### Performance
```bash
# Lighthouse audit
npm run lighthouse

# Bundle analysis
npm run build:analyze
```

### Compressão
```bash
curl -H "Accept-Encoding: gzip" -I https://svlentes.com.br | grep -i encoding
# Deve mostrar: content-encoding: gzip
```

## 📊 Métricas Esperadas

- LCP: < 2.5s ✅
- FID: < 100ms ✅
- CLS: < 0.1 ✅
- Performance Score: 90+ ✅

## 📚 Documentação Completa

Ver: `claudedocs/OPTIMIZATION_SUMMARY.md`

---

**Deploy Time:** ~5 minutos
**Downtime:** ~10 segundos (restart)
**Risk Level:** ⬇️ Baixo (apenas otimizações)
