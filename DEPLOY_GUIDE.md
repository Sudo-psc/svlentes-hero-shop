# 🚀 Guia de Deploy - SV Lentes

## ✅ Configurações Realizadas

### 1. Domínio Principal
- **Domínio**: `svlentes.shop`
- **Ambiente**: Produção
- **SSL/HTTPS**: Configurado (HSTS enabled)

### 2. Alterações Implementadas

#### URLs Atualizadas
- ✅ Todas as referências de `svlentes.com.br` → `svlentes.shop`
- ✅ Metadata e SEO atualizados
- ✅ Sitemap atualizado
- ✅ Breadcrumbs atualizados
- ✅ Structured Data atualizado

#### Headers de Segurança
- ✅ `Strict-Transport-Security` (HSTS)
- ✅ `X-Frame-Options: SAMEORIGIN`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-XSS-Protection`
- ✅ `Content-Security-Policy`
- ✅ `Referrer-Policy`

#### Arquivos Modificados
1. `.env.example` → URLs de produção
2. `.env.production` → Criado
3. `README.md` → Contatos atualizados
4. `src/app/sitemap.ts` → Domínio atualizado
5. `src/app/**/layout.tsx` → Canonical URLs atualizados
6. `next.config.js` → Headers de segurança
7. `vercel.json` → HSTS adicionado

### 3. Build de Produção
```bash
✓ Compiled successfully in 8.0s
✓ Generating static pages (26/26)
✓ Build completo sem erros
```

## 📋 Pré-requisitos para Deploy

### Variáveis de Ambiente (Configurar no Vercel)

#### Obrigatórias
```bash
# Domínio
NEXT_PUBLIC_APP_URL=https://svlentes.shop
NEXTAUTH_URL=https://svlentes.shop

# Asaas Payment
ASAAS_ENV=production
ASAAS_API_KEY_PROD=<sua-chave-de-produção>

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=5533998601427
```

#### Opcionais (mas recomendadas)
```bash
# Database
DATABASE_URL=<postgresql-url>

# Email
RESEND_API_KEY=<sua-chave-resend>

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=<seu-ga-id>

# Monitoring
SENTRY_DSN=<seu-sentry-dsn>

# Redis
UPSTASH_REDIS_REST_URL=<redis-url>
UPSTASH_REDIS_REST_TOKEN=<redis-token>
```

## 🚀 Deploy no Vercel

### Opção 1: Deploy via CLI (Recomendado)

1. **Instalar Vercel CLI**
```bash
npm i -g vercel
```

2. **Login no Vercel**
```bash
vercel login
```

3. **Deploy para Produção**
```bash
# Deploy direto para produção
vercel --prod

# Ou deploy para preview primeiro
vercel

# Depois promover para produção
vercel --prod
```

### Opção 2: Deploy via GitHub

1. **Commit as mudanças**
```bash
git add .
git commit -m "feat: configurar domínio svlentes.shop e SSL/HSTS"
git push origin master
```

2. **Conectar repositório no Vercel**
   - Acesse https://vercel.com/new
   - Selecione o repositório `svlentes-hero-shop`
   - Configure as variáveis de ambiente
   - Deploy automático será iniciado

### Opção 3: Deploy Manual (Drag & Drop)

1. **Fazer build local**
```bash
npm run build
```

2. **Upload no Vercel**
   - Acesse https://vercel.com/new
   - Faça drag & drop da pasta `.next`

## 🔒 Configuração do Domínio

### 1. Adicionar Domínio Customizado no Vercel

1. Acesse o projeto no Vercel Dashboard
2. Vá em **Settings** → **Domains**
3. Adicione `svlentes.shop`
4. Vercel fornecerá os registros DNS necessários

### 2. Configurar DNS

Adicione estes registros no seu provedor DNS:

```dns
# A Record (para domínio raiz)
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600

# CNAME Record (para www)
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600

# CNAME Record (para Vercel)
Type: CNAME
Name: svlentes.shop
Value: cname.vercel-dns.com
TTL: 3600
```

### 3. Habilitar SSL/TLS

O Vercel automaticamente provê certificado SSL Let's Encrypt:
- ✅ Certificado gratuito
- ✅ Renovação automática
- ✅ HTTPS automático
- ✅ HTTP → HTTPS redirect

## ✅ Checklist Pós-Deploy

### Verificações Essenciais

- [ ] **Domínio acessível**: https://svlentes.shop
- [ ] **HTTPS funcionando**: Cadeado verde no navegador
- [ ] **Headers de segurança**: Verificar com https://securityheaders.com
- [ ] **SSL Labs**: Testar em https://www.ssllabs.com/ssltest/
- [ ] **Lighthouse Score**: Performance, SEO, Accessibility
- [ ] **Google Search Console**: Adicionar propriedade
- [ ] **Sitemap**: Verificar https://svlentes.shop/sitemap.xml
- [ ] **Robots.txt**: Verificar https://svlentes.shop/robots.txt

### Testes Funcionais

- [ ] **Homepage**: Vídeo hero carrega corretamente
- [ ] **Calculadora**: /calculadora funciona
- [ ] **Formulário**: Lead capture funciona
- [ ] **WhatsApp**: Botão flutuante funciona
- [ ] **Mobile**: Design responsivo OK
- [ ] **Performance**: Core Web Vitals OK

### Integrações

- [ ] **Asaas**: Webhooks configurados
- [ ] **Asaas**: Chave de produção configurada
- [ ] **WhatsApp**: Número correto (+55 33 99860-1427)
- [ ] **Analytics**: Google Analytics rastreando
- [ ] **Email**: Resend configurado (se aplicável)

## 🔍 Monitoramento Pós-Deploy

### Verificar Logs
```bash
# Ver logs em tempo real
vercel logs <deployment-url> --follow

# Ver logs de função específica
vercel logs <deployment-url> --filter=api/asaas
```

### Métricas Importantes
- **Uptime**: Monitorar disponibilidade
- **Response Time**: < 300ms para páginas estáticas
- **Error Rate**: < 0.1%
- **Build Time**: < 2 minutos

## 🚨 Troubleshooting

### Problema: Site não carrega
```bash
# Verificar deployment status
vercel ls

# Ver logs de erro
vercel logs --follow
```

### Problema: SSL não funciona
- Aguardar propagação DNS (até 48h)
- Verificar configuração de domínio no Vercel
- Forçar renovação de certificado

### Problema: Variáveis de ambiente não funcionam
- Verificar se foram configuradas no Vercel Dashboard
- Redeploy após adicionar variáveis
- Verificar prefixo `NEXT_PUBLIC_` para variáveis do cliente

### Problema: Build falha
```bash
# Limpar cache e rebuildar
rm -rf .next node_modules
npm install
npm run build
```

## 📊 Performance Optimization

### Recomendações Implementadas
- ✅ Compressão gzip/brotli
- ✅ Cache headers otimizados
- ✅ Image optimization (Next.js Image)
- ✅ Code splitting automático
- ✅ Static generation para páginas
- ✅ CDN global (Vercel Edge Network)

### Próximas Otimizações
- [ ] Implementar Redis para caching
- [ ] Adicionar ISR (Incremental Static Regeneration)
- [ ] Implementar lazy loading para componentes pesados
- [ ] Adicionar analytics de performance

## 📞 Suporte

**Equipe SV Lentes:**
- WhatsApp: +55 33 99860-1427
- Email: saraivavision@gmail.com

**Documentação:**
- Next.js: https://nextjs.org/docs
- Vercel: https://vercel.com/docs
- Asaas: https://docs.asaas.com

---

**Status**: ✅ Pronto para deploy em produção
**Data**: 2025-10-12
**Versão**: 1.0.0
