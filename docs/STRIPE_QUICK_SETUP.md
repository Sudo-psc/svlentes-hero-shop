# 🚀 Guia Rápido: Configuração Stripe em 5 Minutos

## ⚡ Setup Rápido

### 1. Obter Chaves do Stripe (2 min)

**Acesse:** https://dashboard.stripe.com/test/apikeys

Copie as chaves:
- ✅ **Publishable key:** `pk_test_...` (ou `pk_live_...` para produção)
- ✅ **Secret key:** `sk_test_...` (ou `sk_live_...` para produção)

### 2. Criar Arquivo .env.local (1 min)

```bash
# Na raiz do projeto
cat > .env.local << 'EOF'
# Stripe Test Mode
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_COLE_SUA_CHAVE_AQUI
STRIPE_SECRET_KEY=sk_test_COLE_SUA_CHAVE_AQUI
STRIPE_WEBHOOK_SECRET=whsec_OPCIONAL_POR_ENQUANTO
NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID=prctbl_1SK1U5Ls8MC0aCdjGBBODqjW

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
EOF
```

**Substitua** `COLE_SUA_CHAVE_AQUI` pelas chaves reais do Dashboard.

### 3. Rebuildar e Iniciar (2 min)

```bash
# Instalar dependências (se necessário)
npm install

# Build com variáveis de ambiente
npm run build

# Iniciar servidor
npm run start
```

### 4. Verificar Health Check (30 seg)

```bash
# Em outro terminal
curl http://localhost:3000/api/health/stripe | jq

# Deve retornar:
# {
#   "status": "healthy",
#   "environment": "TEST",
#   ...
# }
```

### 5. Testar Página /planos (30 seg)

**Abrir no navegador:** http://localhost:3000/planos

**DevTools (F12):**
- ✅ Network → Filtrar "stripe" → Deve ver requisições 200 OK
- ✅ Console → Sem erros vermelhos

---

## ✅ Checklist Rápido

- [ ] Chaves copiadas do Dashboard Stripe
- [ ] Arquivo `.env.local` criado com chaves
- [ ] `npm run build` executado
- [ ] `npm run start` rodando
- [ ] Health check retorna `"status": "healthy"`
- [ ] Página `/planos` carrega tabela de preços
- [ ] Console sem erros

---

## 🔧 Troubleshooting Rápido

### Erro: "Stripe não está configurado"

**Solução:**
```bash
# Verificar se variáveis estão definidas
node -e "console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)"

# Se retornar undefined, rebuild:
npm run build
```

### Pricing Table não aparece

**Solução 1:** Verificar console do navegador
```javascript
// No DevTools Console
console.log(document.querySelector('stripe-pricing-table'))
console.log(typeof window.Stripe)
```

**Solução 2:** Limpar cache e recarregar
```bash
# Terminal
rm -rf .next
npm run build
npm run start
```

### Health check retorna "degraded"

**Solução:**
```bash
# Ver warnings
curl http://localhost:3000/api/health/stripe | jq '.warnings'

# Corrigir conforme mensagens
```

---

## 🌐 Deploy para Produção

### Variáveis no Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Set production environment variables
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Cole: pk_live_...

vercel env add STRIPE_SECRET_KEY production
# Cole: sk_live_...

# Redeploy
vercel --prod
```

### Variáveis no VPS/Docker

```bash
# SSH no servidor
ssh user@svlentes.com.br

# Editar .env.production
cd /path/to/project
nano .env.production

# Adicionar:
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
# STRIPE_SECRET_KEY=sk_live_...

# Rebuild e restart
docker compose down
docker compose up -d --build

# Ou se systemd:
sudo systemctl restart svlentes-hero-shop
```

### Verificar em Produção

```bash
# Health check
curl https://svlentes.com.br/api/health/stripe | jq

# Deve retornar:
# {
#   "status": "healthy",
#   "environment": "PRODUCTION",
#   ...
# }
```

---

## 📞 Ajuda

**Script Completo:** `./scripts/check-stripe-integration.sh`  
**Relatório Detalhado:** `./docs/STRIPE_INTEGRATION_VERIFICATION_REPORT.md`  
**Health Endpoint:** `/api/health/stripe`

**Stripe Dashboard:** https://dashboard.stripe.com  
**Suporte:** support@stripe.com
