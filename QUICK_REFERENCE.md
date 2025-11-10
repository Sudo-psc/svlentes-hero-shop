# ⚡ Referência Rápida - svlentes.com.br

## 🎯 Status Atual

**TUDO FUNCIONANDO ✅**

1. ✅ Erro 503 → Resolvido
2. ✅ Content-Type → Correto
3. ✅ CSP Trusted Types → **COMPLETO**
   - Next.js: ✅
   - Google API: ✅
   - Firebase: ✅
   - Stripe: ✅

---

## 🧪 Teste Rápido

```bash
# Teste completo 503
/root/svlentes-hero-shop/test-503-fix.sh

# Teste Google API
/tmp/test-google-api.sh

# Ver CSP
curl -I https://svlentes.com.br/ | grep "trusted-types"
```

---

## 🔧 Comandos Essenciais

### Reiniciar Tudo
```bash
sudo systemctl reload nginx
pkill -f next-server && cd /root/svlentes-hero-shop && npx next start -p 5000 -H 0.0.0.0 &
```

### Ver Logs
```bash
sudo tail -f /var/log/nginx/error.log | grep -E "503|limit"
```

---

## 📊 CSP Atual (Completo)

```
trusted-types nextjs nextjs#bundler nextjs#script gapi#gapi goog#html default stripe-js decodeHTMLEntitiesPolicy 'allow-duplicates'
```

**Inclui**:
- `nextjs*` - Framework Next.js
- `gapi#gapi` - Google API
- `goog#html` - Google HTML
- `stripe-js` - Stripe SDK
- `default` - Fallback

---

## 📁 Arquivos Importantes

- **Nginx**: `/etc/nginx/sites-available/svlentes.com.br`
- **Next.js**: `/root/svlentes-hero-shop/next.config.js`
- **Backup**: `*.backup.20251109-201235`

---

## 🆘 Problemas?

### Google Login não funciona
```bash
# Verificar CSP tem gapi
curl -I https://svlentes.com.br/ | grep "gapi"

# Ver erros no console do navegador
# Deve estar limpo agora
```

### Erro 503 voltou
```bash
# Verificar rate limiting
sudo tail -50 /var/log/nginx/error.log | grep "limiting"

# Aumentar se necessário
sudo nano /etc/nginx/sites-available/svlentes.com.br
# limit_conn conn_limit_per_ip 100;
```

---

## 🔄 Rollback Rápido

```bash
sudo cp /etc/nginx/sites-available/svlentes.com.br.backup.20251109-201235 /etc/nginx/sites-available/svlentes.com.br
sudo systemctl reload nginx
cd /root/svlentes-hero-shop
cp next.config.js.backup.20251109-201235 next.config.js
npm run build && pkill -f next-server && npx next start -p 5000 -H 0.0.0.0 &
```

---

## 📚 Documentação

- `ERRORS_FIXED.md` - Correções Trusted Types
- `README_CORRECOES.md` - Visão geral
- `SOLUCAO_ERRO_503_CSP.md` - Análise técnica
- `INDEX_DOCUMENTACAO.md` - Índice completo

---

## ✅ Checklist Diário

- [ ] Executar `test-503-fix.sh`
- [ ] Executar `test-google-api.sh`
- [ ] Verificar logs por "limiting"
- [ ] Testar Google Login manualmente
- [ ] Console do navegador limpo

---

**Última Atualização**: 2025-11-09 21:58 UTC  
**Status**: ✅ **100% OPERACIONAL**  
**Google Login**: ✅ **FUNCIONANDO**
