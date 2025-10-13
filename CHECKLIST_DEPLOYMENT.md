# Checklist de Deploy - SVLentes

Este documento fornece uma lista de verificação completa para deploy do sistema SVLentes em produção.

## 📋 Pré-Deploy

### Ambiente de Desenvolvimento

- [ ] Todos os testes estão passando
  ```bash
  npm run test
  npm run test:e2e
  ```

- [ ] Build de produção executado com sucesso
  ```bash
  npm run build
  ```

- [ ] Linting sem erros
  ```bash
  npm run lint
  ```

- [ ] TypeScript compilando sem erros
  ```bash
  npm run type-check
  ```

- [ ] Dependências atualizadas e auditadas
  ```bash
  npm audit
  npm outdated
  ```

### Variáveis de Ambiente

- [ ] `.env.local` configurado com valores de produção
  - [ ] `NODE_ENV=production`
  - [ ] `NEXT_PUBLIC_APP_URL=https://svlentes.com.br`
  - [ ] `NEXTAUTH_URL=https://svlentes.com.br`
  - [ ] `NEXTAUTH_SECRET` (gerado com openssl)
  - [ ] `DATABASE_URL` (PostgreSQL de produção)
  - [ ] `ASAAS_ENV=production`
  - [ ] `ASAAS_API_KEY_PROD` (válido e testado)

- [ ] `.env.local` não está no git
  ```bash
  git check-ignore .env.local
  # Deve retornar: .env.local
  ```

- [ ] Arquivo `.env.local.example` atualizado (sem valores reais)

### Segurança

- [ ] Nenhuma API key hardcoded no código
  ```bash
  grep -r "aact_prod" src/
  # Não deve retornar resultados
  ```

- [ ] Nenhuma senha no código
  ```bash
  grep -r "password.*=" src/ | grep -v "password:"
  ```

- [ ] `.gitignore` atualizado
  ```bash
  cat .gitignore | grep -E "(\.env|node_modules|\.next)"
  ```

- [ ] HTTPS configurado e funcionando
  ```bash
  curl -I https://svlentes.com.br
  # Deve retornar: HTTP/2 200
  ```

### Banco de Dados

- [ ] Migrations executadas
  ```bash
  npm run db:migrate
  ```

- [ ] Schema sincronizado
  ```bash
  npm run db:push
  ```

- [ ] Backup do banco antes do deploy
  ```bash
  ./scripts/backup-system.sh manual
  ```

- [ ] Conectividade com banco testada
  ```bash
  npm run db:studio
  ```

---

## 🚀 Deploy

### Build de Produção

- [ ] Instalar dependências
  ```bash
  cd /root/svlentes-hero-shop
  npm ci --production=false
  ```

- [ ] Executar build
  ```bash
  npm run build
  ```

- [ ] Verificar arquivos gerados
  ```bash
  ls -lh .next/
  # Deve conter: static/, server/, BUILD_ID
  ```

### Systemd Service

- [ ] Service file configurado
  ```bash
  cat /etc/systemd/system/svlentes-nextjs.service
  ```

- [ ] Daemon recarregado
  ```bash
  systemctl daemon-reload
  ```

- [ ] Service habilitado
  ```bash
  systemctl enable svlentes-nextjs
  ```

- [ ] Service iniciado
  ```bash
  systemctl start svlentes-nextjs
  ```

- [ ] Service status OK
  ```bash
  systemctl status svlentes-nextjs
  # Deve mostrar: Active: active (running)
  ```

### Nginx

- [ ] Configuração do site presente
  ```bash
  cat /etc/nginx/sites-available/svlentes.com.br
  ```

- [ ] Site habilitado
  ```bash
  ls -l /etc/nginx/sites-enabled/svlentes.com.br
  ```

- [ ] Configuração válida
  ```bash
  nginx -t
  # Deve retornar: syntax is ok, test is successful
  ```

- [ ] Nginx recarregado
  ```bash
  systemctl reload nginx
  ```

- [ ] Nginx status OK
  ```bash
  systemctl status nginx
  # Deve mostrar: Active: active (running)
  ```

### SSL/TLS

- [ ] Certificado instalado
  ```bash
  certbot certificates
  # Deve listar: svlentes.com.br
  ```

- [ ] Certificado válido
  ```bash
  curl -I https://svlentes.com.br
  # Deve retornar: HTTP/2 200
  ```

- [ ] Auto-renovação configurada
  ```bash
  systemctl list-timers | grep certbot
  # Deve mostrar: certbot.timer
  ```

- [ ] Teste de renovação OK
  ```bash
  certbot renew --dry-run
  ```

---

## ✅ Pós-Deploy

### Verificação de Funcionalidade

- [ ] Homepage carregando
  ```bash
  curl -I https://svlentes.com.br
  # Deve retornar: 200 OK
  ```

- [ ] Assets estáticos carregando
  ```bash
  curl -I https://svlentes.com.br/_next/static/css/...
  # Deve retornar: 200 OK
  ```

- [ ] API respondendo
  ```bash
  curl -X POST https://svlentes.com.br/api/test
  ```

- [ ] Teste de conexão Asaas
  ```bash
  node scripts/test-asaas-connection.js
  # Deve retornar: ✅ Conectado à API Asaas
  ```

### Webhook Asaas

- [ ] URL webhook configurada no Asaas
  - Dashboard → Configurações → Webhooks
  - URL: `https://svlentes.com.br/api/webhooks/asaas`

- [ ] Teste de webhook OK
  ```bash
  curl -X POST https://svlentes.com.br/api/webhooks/asaas \
    -H "Content-Type: application/json" \
    -d '{"event":"PAYMENT_RECEIVED","payment":{"id":"test"}}'
  # Deve retornar: 200 OK
  ```

### Monitoramento

- [ ] Logs da aplicação funcionando
  ```bash
  journalctl -u svlentes-nextjs -n 20
  ```

- [ ] Logs do Nginx funcionando
  ```bash
  tail -f /var/log/nginx/svlentes.com.br.access.log
  ```

- [ ] Sistema de monitoramento ativo
  - Verificar: `src/lib/monitoring.ts`
  - Web Vitals sendo capturados

- [ ] Google Analytics configurado (se aplicável)
  ```bash
  cat .env.local | grep NEXT_PUBLIC_GA_ID
  ```

### Backups

- [ ] Script de backup testado
  ```bash
  ./scripts/backup-system.sh daily
  # Deve criar backup em /root/backups/svlentes/daily/
  ```

- [ ] Cron jobs configurados
  ```bash
  crontab -l | grep backup-system
  # Deve mostrar: 3 linhas (daily, weekly, monthly)
  ```

- [ ] Log de backup criado
  ```bash
  ls -l /var/log/svlentes-backup.log
  ```

- [ ] Restore testado (em ambiente de teste)
  ```bash
  ./scripts/restore-backup.sh /path/to/backup.tar.gz --database-only
  ```

### Performance

- [ ] Tempo de resposta < 2s
  ```bash
  curl -w "@curl-format.txt" -o /dev/null -s https://svlentes.com.br
  ```

- [ ] Core Web Vitals OK
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
  - Verificar em: [PageSpeed Insights](https://pagespeed.web.dev/)

- [ ] Compression habilitado
  ```bash
  curl -I -H "Accept-Encoding: gzip" https://svlentes.com.br
  # Deve conter: Content-Encoding: gzip
  ```

### Segurança

- [ ] Headers de segurança presentes
  ```bash
  curl -I https://svlentes.com.br | grep -E "(Strict-Transport|X-Frame|X-Content)"
  ```

- [ ] HTTPS enforcement ativo
  ```bash
  curl -I http://svlentes.com.br
  # Deve redirecionar para: https://
  ```

- [ ] API keys seguras (não expostas)
  ```bash
  curl https://svlentes.com.br/api/test
  # Não deve revelar: ASAAS_API_KEY
  ```

- [ ] Auditoria de segurança realizada
  - Revisar: `SEGURANCA_API_KEYS.md`

---

## 🧪 Testes em Produção

### Fluxo de Checkout

- [ ] Página inicial carrega
- [ ] Formulário de contato funciona
- [ ] Página de planos carrega
- [ ] Seleção de plano funciona
- [ ] Checkout PIX funciona
  - [ ] QR Code é gerado
  - [ ] Cobrança criada no Asaas
  - [ ] Webhook recebido após pagamento
- [ ] Checkout Boleto funciona
  - [ ] Boleto é gerado
  - [ ] URL do boleto válida
- [ ] Checkout Cartão funciona
  - [ ] Tokenização funciona
  - [ ] Cobrança processada

### Notificações

- [ ] Email de confirmação enviado
- [ ] WhatsApp notification funciona
- [ ] Webhooks processados corretamente

### Monitoramento em Tempo Real

- [ ] Acompanhar logs durante teste
  ```bash
  journalctl -u svlentes-nextjs -f
  ```

- [ ] Verificar Dashboard Asaas
  - Cobranças criadas
  - Status correto

---

## 📊 Métricas de Sucesso

### KPIs de Deploy

- [ ] **Uptime**: 100% nos primeiros 15 minutos
- [ ] **Response Time**: < 2 segundos (p95)
- [ ] **Error Rate**: 0% em transações
- [ ] **Successful Checkouts**: > 0 (testar ao menos 1)

### Monitoramento Contínuo (Primeiras 24h)

- [ ] Hora 1: Verificar logs e métricas
- [ ] Hora 6: Verificar transações Asaas
- [ ] Hora 12: Verificar performance e erros
- [ ] Hora 24: Revisar todas as métricas

---

## 🔄 Rollback (Se Necessário)

### Procedimento de Rollback

Se algo der errado, execute:

1. **Parar serviço atual**
   ```bash
   systemctl stop svlentes-nextjs
   ```

2. **Restaurar código anterior**
   ```bash
   git checkout main~1
   npm ci
   npm run build
   ```

3. **Restaurar banco de dados**
   ```bash
   ./scripts/restore-backup.sh /root/backups/svlentes/daily/ULTIMO_BACKUP.tar.gz
   ```

4. **Reiniciar serviço**
   ```bash
   systemctl start svlentes-nextjs
   ```

5. **Verificar**
   ```bash
   systemctl status svlentes-nextjs
   curl -I https://svlentes.com.br
   ```

---

## 📞 Suporte Pós-Deploy

### Contatos

- **Equipe Técnica**: saraivavision@gmail.com
- **WhatsApp**: +55 33 99860-1427
- **Asaas Suporte**: suporte@asaas.com / (31) 3349-5780

### Documentação

- [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md) - Guia operacional completo
- [SEGURANCA_API_KEYS.md](SEGURANCA_API_KEYS.md) - Auditoria de segurança
- [MIGRACAO_STRIPE_ASAAS.md](MIGRACAO_STRIPE_ASAAS.md) - Guia de migração

---

## ✅ Aprovação Final

- [ ] **Tech Lead**: ___________________ Data: ___/___/___
- [ ] **Product Owner**: _______________ Data: ___/___/___
- [ ] **QA**: __________________________ Data: ___/___/___

---

**Última Atualização**: 2025-01-13
**Versão**: 1.0.0
**Deploy ID**: _________________
**Git Commit**: `git rev-parse --short HEAD`
