# 📋 Verificação de Integração Stripe - Documentação

> **Criado em:** 10 de novembro de 2025  
> **Status:** ⚠️ Configuração Pendente  
> **Prioridade:** 🔴 Alta

---

## 🚀 Início Rápido

### Para Gerentes e POs
👉 **Leia primeiro:** [`STRIPE_EXECUTIVE_SUMMARY.md`](./STRIPE_EXECUTIVE_SUMMARY.md)  
📊 Resumo executivo com status, checklist e próximos passos

### Para Desenvolvedores (Setup Rápido)
👉 **Guia de 5 minutos:** [`STRIPE_QUICK_SETUP.md`](./STRIPE_QUICK_SETUP.md)  
⚡ Comandos copy-paste para configurar rapidamente

### Para Análise Técnica Detalhada
👉 **Relatório completo:** [`STRIPE_INTEGRATION_VERIFICATION_REPORT.md`](./STRIPE_INTEGRATION_VERIFICATION_REPORT.md)  
📖 13 seções com análise profunda de headers, CSP, conectividade, etc.

### Para Referência de Recursos
👉 **Índice de recursos:** [`STRIPE_RESOURCES_INDEX.md`](./STRIPE_RESOURCES_INDEX.md)  
📚 Catálogo de scripts, endpoints, componentes e documentação

---

## 📁 Estrutura da Documentação

```
docs/
├── README_STRIPE_VERIFICATION.md  ← Você está aqui
├── STRIPE_EXECUTIVE_SUMMARY.md    ← Sumário executivo
├── STRIPE_QUICK_SETUP.md          ← Setup rápido (5 min)
├── STRIPE_INTEGRATION_VERIFICATION_REPORT.md  ← Relatório completo
└── STRIPE_RESOURCES_INDEX.md      ← Índice de recursos

scripts/
├── check-stripe-integration.sh    ← Verificação completa local
├── test-stripe-setup.sh          ← Teste pós-configuração
└── check-production-stripe.sh    ← Verificação em produção (SSH)

src/app/api/health/
└── stripe/
    └── route.ts                   ← Health check endpoint
```

---

## 🎯 Situação Atual

### ✅ O que JÁ está pronto:

1. **Código da integração Stripe**
   - Componente `StripePricingTable` implementado
   - Validação de prefixos de chaves
   - Fallback automático
   - Tratamento de erros

2. **Ferramentas de diagnóstico**
   - 3 scripts automatizados
   - Endpoint de health check
   - Documentação completa

3. **Conectividade**
   - Domínios Stripe acessíveis
   - HTTPS configurado

### ❌ O que FALTA:

1. **Variáveis de ambiente**
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` não configurada
   - `STRIPE_SECRET_KEY` não configurada

2. **Build atualizado**
   - Página `/planos` precisa ser recompilada com variáveis

---

## 🔧 Como Configurar (TL;DR)

```bash
# 1. Obter chaves
# → Dashboard: https://dashboard.stripe.com/test/apikeys

# 2. Criar .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_SUA_CHAVE
STRIPE_SECRET_KEY=sk_test_SUA_CHAVE
NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID=prctbl_1SK1U5Ls8MC0aCdjGBBODqjW
NEXT_PUBLIC_BASE_URL=http://localhost:3000
EOF

# 3. Build e start
npm run build
npm run start

# 4. Testar
./scripts/test-stripe-setup.sh
open http://localhost:3000/planos
```

**Tempo estimado:** 15 minutos

---

## 📊 Scripts Disponíveis

### 1. Verificação Completa
```bash
./scripts/check-stripe-integration.sh
```
**O que faz:**
- Verifica prefixos das chaves
- Valida build do Next.js
- Testa conectividade Stripe
- Analisa headers (CSP, Permissions-Policy)

**Quando usar:** Antes e depois de configurar

---

### 2. Teste Rápido
```bash
./scripts/test-stripe-setup.sh
```
**O que faz:**
- Valida `.env.local`
- Confirma prefixos
- Testa health check
- Resultado: ✅ OK ou ❌ ERRO

**Quando usar:** Após configurar e fazer build

---

### 3. Verificação em Produção
```bash
# Via SSH no servidor
ssh user@svlentes.com.br
./scripts/check-production-stripe.sh
```
**O que faz:**
- Detecta tipo de deploy (Docker/Systemd)
- Lista variáveis (seguro - só prefixos)
- Testa health check em produção
- Exibe logs recentes

**Quando usar:** Diagnosticar problemas em produção

---

## 🔌 Endpoint de Health Check

**URL:** `/api/health/stripe`  
**Método:** `GET`

```bash
# Local
curl http://localhost:3000/api/health/stripe | jq

# Produção
curl https://svlentes.com.br/api/health/stripe | jq
```

**Resposta (exemplo):**
```json
{
  "status": "healthy",
  "environment": "TEST",
  "configuration": {
    "publishableKey": {
      "prefix": "pk_test_",
      "isValid": true
    },
    "secretKey": {
      "prefix": "sk_test_",
      "isValid": true
    }
  },
  "warnings": []
}
```

**Segurança:** ✅ Nunca expõe chaves completas

---

## 📋 Checklist de Validação

### Desenvolvimento Local
- [ ] Chaves copiadas do Dashboard
- [ ] `.env.local` criado
- [ ] `npm run build` executado
- [ ] Health check retorna "healthy"
- [ ] Página `/planos` carrega pricing table
- [ ] Console sem erros

### Produção
- [ ] Variáveis configuradas no Vercel/VPS
- [ ] Deploy completo
- [ ] Health check produção OK
- [ ] Pricing table visível
- [ ] Checkout funciona
- [ ] Logs no Dashboard Stripe

---

## 🆘 Troubleshooting

### Pricing table não aparece
**Verificar:**
1. Console do navegador (F12)
2. Network tab → filtrar "stripe"
3. Health check: `curl localhost:3000/api/health/stripe | jq`

**Soluções:**
```bash
# Limpar cache
rm -rf .next
npm run build

# Verificar variáveis
cat .env.local | grep STRIPE

# Testar setup
./scripts/test-stripe-setup.sh
```

---

### Health check "degraded"
**Ver warnings:**
```bash
curl localhost:3000/api/health/stripe | jq '.warnings'
```

**Corrigir conforme mensagens** (ex: chaves de ambientes diferentes, prefixos inválidos)

---

### Chaves de ambientes diferentes
**Erro:** Publishable é `pk_test_` mas Secret é `sk_live_`

**Solução:** Usar chaves do MESMO ambiente
```bash
# Ambas test
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# OU ambas live
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

---

## 📞 Suporte

### Documentação Oficial Stripe
- **Pricing Table:** https://stripe.com/docs/payments/pricing-table
- **CSP Guide:** https://stripe.com/docs/security/guide#content-security-policy
- **Dashboard:** https://dashboard.stripe.com

### Recursos Criados
- Scripts: `./scripts/check-*.sh`
- Health endpoint: `/api/health/stripe`
- Docs completas neste diretório

### Contato
- **Stripe Support:** support@stripe.com
- **Dashboard Support:** https://dashboard.stripe.com/support

---

## 🎓 Conceitos Importantes

### Prefixos de Chaves

| Prefixo | Tipo | Ambiente | Onde usar |
|---------|------|----------|-----------|
| `pk_test_` | Pública | Test | Cliente |
| `pk_live_` | Pública | Live | Cliente |
| `sk_test_` | Secreta | Test | Servidor |
| `sk_live_` | Secreta | Live | Servidor |

### Build Time vs Runtime

**`NEXT_PUBLIC_*` (Build Time):**
- Injetadas durante `npm run build`
- Acessíveis no cliente
- Mudar → rebuild necessário

**Outras (Runtime):**
- Lidas em execução (API Routes)
- Nunca expostas ao cliente
- Mudar → restart necessário

---

## 📈 Próximos Passos

### 1. Hoje (Alta Prioridade)
- [ ] Configurar `.env.local`
- [ ] `npm run build`
- [ ] Testar localmente

### 2. Esta Semana (Média)
- [ ] Deploy produção
- [ ] Configurar webhooks
- [ ] Validar fluxo completo

### 3. Próximo Sprint (Baixa)
- [ ] Testes E2E
- [ ] Telemetria (Sentry)
- [ ] Otimizações

---

## 🎬 Começar Agora

**Passo 1:** Ler [`STRIPE_EXECUTIVE_SUMMARY.md`](./STRIPE_EXECUTIVE_SUMMARY.md)  
**Passo 2:** Seguir [`STRIPE_QUICK_SETUP.md`](./STRIPE_QUICK_SETUP.md)  
**Passo 3:** Testar com `./scripts/test-stripe-setup.sh`

**Tempo total:** ~15 minutos

---

**Boa configuração! 🚀**
