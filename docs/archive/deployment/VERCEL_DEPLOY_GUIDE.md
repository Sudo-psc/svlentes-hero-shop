# 🚀 Guia de Deploy para Vercel - SVLentes

## ✅ Pré-requisitos Verificados

- [x] Build rodando sem erros (`npm run build` ✓)
- [x] CLI da Vercel instalada
- [x] Configuração `vercel.json` criada
- [x] `.vercelignore` otimizado
- [x] Variáveis de ambiente mapeadas

## 📋 Passos para Deploy

### 1. Login na Vercel

```bash
vercel login
```

Escolha o método de autenticação (GitHub, GitLab, Bitbucket ou Email).

### 2. Deploy Inicial (Preview)

```bash
cd /root/svlentes-hero-shop
vercel
```

O CLI vai perguntar:
- **Set up and deploy?** → Yes
- **Which scope?** → Selecione sua conta/organização
- **Link to existing project?** → No (primeira vez) ou Yes (se já existe)
- **Project name?** → svlentes-hero-shop (ou o nome que preferir)
- **Directory?** → ./ (pressione Enter)
- **Override settings?** → No (usar vercel.json)

### 3. Configurar Variáveis de Ambiente

#### Opção A: Via Dashboard (Recomendado)

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto `svlentes-hero-shop`
3. Vá em **Settings** → **Environment Variables**
4. Adicione TODAS as variáveis do arquivo `.env.production`:

**Variáveis CRÍTICAS para adicionar:**

```bash
# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app

# Firebase (copie do .env.production)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=svlentes.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=svlentes
# ... (todas as outras)

# Firebase Admin (IMPORTANTE: usar formato JSON inline)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Database
DATABASE_URL=postgresql://...

# Asaas (PRODUÇÃO)
ASAAS_ENV=production
ASAAS_API_KEY_PROD=aact_prod_...
ASAAS_WEBHOOK_TOKEN=...

# Resend
RESEND_API_KEY=re_...

# OpenAI & LangSmith
OPENAI_API_KEY=sk-proj-...
LANGCHAIN_API_KEY=lsv2_pt_...
LANGCHAIN_TRACING_V2=true

# NextAuth
NEXTAUTH_SECRET=<gere um novo com: openssl rand -base64 32>
```

⚠️ **IMPORTANTE**: 
- Marque variáveis sensíveis como **"Sensitive"**
- Aplique para: **Production**, **Preview** e **Development**
- Use valores DIFERENTES para `NEXTAUTH_SECRET` em prod

#### Opção B: Via CLI

```bash
# Adicionar uma variável
vercel env add NOME_DA_VARIAVEL production

# Listar variáveis
vercel env ls

# Remover variável
vercel env rm NOME_DA_VARIAVEL production
```

### 4. Deploy para Produção

Após configurar as variáveis:

```bash
vercel --prod
```

Ou faça push para o repositório Git (se conectado ao GitHub).

### 5. Configurar Domínio Customizado

#### Adicionar svlentes.shop (domínio principal)

1. No Dashboard: **Settings** → **Domains**
2. Adicione: `svlentes.shop`
3. Configure os DNS records:
   ```
   Tipo: A
   Nome: @
   Valor: 76.76.21.21
   
   Tipo: CNAME
   Nome: www
   Valor: cname.vercel-dns.com
   ```

#### Redirecionar svlentes.com.br → saraivavision.com.br

Isso JÁ ESTÁ configurado no `vercel.json`. Basta:

1. Adicionar `svlentes.com.br` como domínio
2. O Vercel vai automaticamente redirecionar para `saraivavision.com.br/lentes`

### 6. Habilitar Analytics e Monitoring

```bash
vercel --enable-analytics
```

Ou no Dashboard:
- **Analytics** → Enable
- **Speed Insights** → Enable
- **Web Vitals** → Enable

## 🔍 Verificação Pós-Deploy

### Teste os Endpoints Críticos

```bash
# Health Check
curl https://seu-dominio.vercel.app/api/health-check

# Firebase Auth (deve retornar 401 ou dados)
curl https://seu-dominio.vercel.app/api/auth/verify-email

# Asaas Webhook (deve retornar método não permitido)
curl -X GET https://seu-dominio.vercel.app/api/webhooks/asaas

# Admin (deve redirecionar para login)
curl -I https://seu-dominio.vercel.app/admin/dashboard
```

### Verifique os Logs

```bash
vercel logs
```

Ou no Dashboard: **Deployments** → Clique no deployment → **Logs**

### Teste o Build Completo

```bash
# Verificar todas as rotas
curl https://seu-dominio.vercel.app/
curl https://seu-dominio.vercel.app/planos
curl https://seu-dominio.vercel.app/calculadora
curl https://seu-dominio.vercel.app/area-assinante/login
```

## 🚨 Troubleshooting

### Erro: "Missing environment variable"

1. Verifique se TODAS as variáveis do `.env.production` foram adicionadas
2. Re-deploy: `vercel --prod`
3. Check logs: `vercel logs --follow`

### Erro: "Firebase Admin not initialized"

O `FIREBASE_SERVICE_ACCOUNT_KEY` deve ser uma string JSON em UMA LINHA:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"svlentes",...}'
```

### Erro: "Database connection failed"

1. Verifique se o `DATABASE_URL` está correto
2. Certifique-se que o banco está acessível publicamente
3. Configure IP whitelist no provedor do banco (se necessário)

### Build falha

```bash
# Rode localmente primeiro
npm run build

# Limpe cache e tente novamente
vercel --prod --force
```

### Timeout em Functions

As functions têm limite de 30s (configurado em `vercel.json`). Se precisar mais:

1. Dashboard → **Settings** → **Functions**
2. Aumente o **Max Duration** (requer plano Pro)

## 📊 Monitoramento Contínuo

### Configurar Cron Jobs

Já configurado em `vercel.json`:
```json
"crons": [{
  "path": "/api/health-check",
  "schedule": "0 */5 * * *"  // A cada 5 horas
}]
```

### Webhooks de Deploy

Configure no GitHub/GitLab para deploy automático:
- **Push para `main`** → Deploy automático para produção
- **Pull Request** → Deploy preview automático

### Alertas

Configure em: **Settings** → **Notifications**
- Deployment Failed
- Function Errors
- Domain Issues

## 🎯 Comandos Úteis

```bash
# Deploy preview
vercel

# Deploy produção
vercel --prod

# Logs em tempo real
vercel logs --follow

# Listar deployments
vercel ls

# Promover preview para produção
vercel promote <deployment-url>

# Rollback (redeploy anterior)
vercel rollback

# Inspecionar deployment
vercel inspect <deployment-url>

# Remover deployment
vercel rm <deployment-id>
```

## 🔐 Segurança

### Checklist de Segurança

- [ ] `NEXTAUTH_SECRET` gerado com `openssl rand -base64 32`
- [ ] API keys marcadas como "Sensitive" no Vercel
- [ ] `ASAAS_API_KEY_PROD` nunca commitado no Git
- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY` mantido seguro
- [ ] Headers de segurança configurados (já em `vercel.json`)
- [ ] CORS configurado corretamente para APIs
- [ ] Webhook tokens validados (Asaas, SendPulse)

## 📚 Recursos

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/concepts/projects/domains)
- [Edge Network](https://vercel.com/docs/edge-network/overview)

## 🎉 Deploy Completo!

Após seguir todos os passos, seu app estará:
- ✅ Rodando em produção na Vercel
- ✅ Com SSL automático (HTTPS)
- ✅ CDN global (Edge Network)
- ✅ Analytics habilitado
- ✅ Domínio customizado configurado
- ✅ Redirecionamentos funcionando
- ✅ Cron jobs ativos
- ✅ Logs e monitoring configurados

**URL de Produção:** https://seu-dominio.vercel.app ou https://svlentes.shop

---

**Próximos Passos Recomendados:**
1. Configure Google Search Console para o novo domínio
2. Atualize sitemap e robots.txt
3. Configure Vercel Analytics para insights de performance
4. Teste todos os fluxos críticos (checkout, autenticação, etc.)
5. Configure alertas de erro no Vercel + Sentry/LogRocket
