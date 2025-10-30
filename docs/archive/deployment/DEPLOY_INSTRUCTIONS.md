# 🚀 Instruções de Deploy - SVLentes

## Status do Projeto

✅ **Build Production:** Concluído com sucesso (101 rotas)
✅ **Logo Component:** Corrigido e otimizado
✅ **Testes Playwright:** Criados (logo visibility)
✅ **Verificação kluster:** 0 issues encontradas

## Deploy para Vercel

### Opção 1: Deploy via CLI (Recomendado)

```bash
# 1. Fazer login no Vercel
vercel login

# 2. Deploy para produção
vercel --prod

# O Vercel CLI irá:
# - Detectar automaticamente o projeto Next.js
# - Fazer upload dos arquivos
# - Executar o build na nuvem
# - Gerar URL de produção
```

### Opção 2: Deploy via GitHub (Integração Contínua)

1. **Push para GitHub**
   ```bash
   git push origin master
   ```

2. **Conectar Repositório na Vercel**
   - Acesse https://vercel.com/new
   - Selecione "Import Git Repository"
   - Escolha `Sudo-psc/svlentes-hero-shop`
   - Configure as variáveis de ambiente (ver seção abaixo)

3. **Deploy Automático**
   - A Vercel detecta commits no master
   - Build e deploy acontecem automaticamente
   - URL de produção atualizada em ~2-3 minutos

### Opção 3: Deploy via Dashboard Vercel

1. Acesse https://vercel.com/dashboard
2. Clique em "Add New Project"
3. Importe o repositório `svlentes-hero-shop`
4. Configure conforme abaixo

## ⚙️ Configuração de Variáveis de Ambiente

**CRÍTICO:** Adicione estas variáveis no painel da Vercel antes do deploy:

### Variáveis Essenciais

```bash
# Next.js
NEXT_PUBLIC_APP_URL=https://svlentes.com.br
NEXTAUTH_URL=https://svlentes.com.br
NEXTAUTH_SECRET=<gerar novo secret>

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=<seu_api_key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=svlentes.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=svlentes
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=svlentes.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<seu_sender_id>
NEXT_PUBLIC_FIREBASE_APP_ID=<seu_app_id>

# Database (Neon/Supabase)
DATABASE_URL=postgresql://user:password@host:5432/svlentes?sslmode=require

# Stripe (Pagamentos)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<seu_publishable_key>
STRIPE_SECRET_KEY=<seu_secret_key>
STRIPE_WEBHOOK_SECRET=<seu_webhook_secret>

# Asaas (Pagamentos Brasil)
ASAAS_API_KEY=<seu_api_key>
ASAAS_WEBHOOK_TOKEN=<seu_webhook_token>

# Resend (Email)
RESEND_API_KEY=<seu_api_key>

# LangChain/LangSmith (Observabilidade)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=<seu_api_key>
LANGCHAIN_PROJECT=svlentes-whatsapp-support
```

### Gerar NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## 🔧 Configurações do Projeto Vercel

### Build Settings

- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (padrão)
- **Output Directory:** `.next` (padrão)
- **Install Command:** `npm install` (padrão)
- **Node Version:** 20.x (especificado no package.json)

### Domínios Personalizados

1. **Domínio Principal:** svlentes.com.br
   - Adicionar na seção "Domains"
   - Configurar DNS A/CNAME conforme instruções da Vercel

2. **Domínio Redirect:** svlentes.shop → svlentes.com.br
   - Adicionar como domínio secundário
   - Configurar redirect via `vercel.json` (já incluído)

## 📝 Checklist Pós-Deploy

- [ ] Verificar URL de produção carregando corretamente
- [ ] Testar logo no header e footer
- [ ] Verificar página /calculadora
- [ ] Testar área do assinante (/area-assinante)
- [ ] Verificar webhooks (Stripe/Asaas)
- [ ] Testar emails (Resend)
- [ ] Validar domínios personalizados
- [ ] Configurar SSL/TLS (automático na Vercel)
- [ ] Verificar Analytics funcionando

## 🐛 Troubleshooting

### Build Falha

```bash
# Rodar build local primeiro
npm run build

# Se passar local, verificar variáveis de ambiente na Vercel
```

### Erros de Runtime

- Verificar logs na Vercel Dashboard
- Confirmar todas as variáveis de ambiente configuradas
- Validar DATABASE_URL com SSL habilitado

### Problemas de Domínio

- DNS pode levar até 48h para propagar
- Verificar configuração CNAME/A records
- Usar `dig svlentes.com.br` para debug

## 📊 Monitoramento

### Vercel Analytics

- Habilitado automaticamente
- Acesse: https://vercel.com/[seu-projeto]/analytics

### LangSmith (Chatbot)

- Observabilidade habilitada via LANGCHAIN_TRACING_V2
- Dashboard: https://smith.langchain.com/

## 🔄 Deploy de Atualizações

```bash
# Fazer mudanças
git add .
git commit -m "feat: nova feature"
git push origin master

# Vercel detecta e faz deploy automaticamente
# Ou use: vercel --prod (deploy manual)
```

## ✅ Status Atual

- **Branch:** master
- **Último Build:** ✅ Sucesso (101 rotas)
- **Testes:** ✅ Logo visibility implementado
- **Verificação:** ✅ kluster 0 issues
- **Pronto para Deploy:** ✅ SIM

## 🆘 Suporte

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deploy:** https://nextjs.org/docs/deployment
- **GitHub Issues:** https://github.com/Sudo-psc/svlentes-hero-shop/issues

---

**Última atualização:** 2025-10-24
**Status:** ✅ Pronto para produção
