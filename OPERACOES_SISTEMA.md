# Guia de Operações do Sistema SVLentes

Este documento fornece instruções completas para operação, monitoramento e manutenção do sistema SVLentes em produção.

## 📋 Índice

1. [Sistema de Backup](#sistema-de-backup)
2. [Sistema de Logs](#sistema-de-logs)
3. [Monitoramento](#monitoramento)
4. [Integração Asaas](#integração-asaas)
5. [Procedimentos de Emergência](#procedimentos-de-emergência)
6. [Tarefas de Manutenção](#tarefas-de-manutenção)

---

## 🔄 Sistema de Backup

### Execução Manual

#### Backup Diário
```bash
cd /root/svlentes-hero-shop
./scripts/backup-system.sh daily
```

#### Backup Semanal (Domingos)
```bash
./scripts/backup-system.sh weekly
```

#### Backup Mensal (Primeiro dia do mês)
```bash
./scripts/backup-system.sh monthly
```

### Configuração de Backups Automáticos

#### 1. Criar Cron Jobs

Edite o crontab:
```bash
crontab -e
```

Adicione as seguintes linhas:
```bash
# Backup diário às 2h da manhã
0 2 * * * /root/svlentes-hero-shop/scripts/backup-system.sh daily >> /var/log/svlentes-backup.log 2>&1

# Backup semanal aos domingos às 3h da manhã
0 3 * * 0 /root/svlentes-hero-shop/scripts/backup-system.sh weekly >> /var/log/svlentes-backup.log 2>&1

# Backup mensal no primeiro dia do mês às 4h da manhã
0 4 1 * * /root/svlentes-hero-shop/scripts/backup-system.sh monthly >> /var/log/svlentes-backup.log 2>&1
```

#### 2. Verificar Cron Jobs Configurados
```bash
crontab -l
```

#### 3. Verificar Logs de Backup
```bash
tail -f /var/log/svlentes-backup.log
```

### Localização dos Backups

Os backups são armazenados em:
```
/root/backups/svlentes/
├── daily/      # Últimos 7 dias
├── weekly/     # Últimas 4 semanas
└── monthly/    # Últimos 12 meses
```

### Restauração de Backup

#### Listar Backups Disponíveis
```bash
ls -lh /root/backups/svlentes/daily/
ls -lh /root/backups/svlentes/weekly/
ls -lh /root/backups/svlentes/monthly/
```

#### Restaurar Backup Completo
```bash
cd /root/svlentes-hero-shop
./scripts/restore-backup.sh /root/backups/svlentes/daily/20250113_020000.tar.gz
```

#### Restaurar Apenas Banco de Dados
```bash
./scripts/restore-backup.sh /root/backups/svlentes/daily/20250113_020000.tar.gz --database-only
```

#### Restaurar Sem Confirmações (Automático)
```bash
./scripts/restore-backup.sh /root/backups/svlentes/daily/20250113_020000.tar.gz --force
```

### Backup em Cloud (Opcional)

#### Configurar Upload AWS S3

1. Instale AWS CLI:
```bash
apt-get install awscli
aws configure
```

2. Edite `scripts/backup-system.sh` e configure:
```bash
CLOUD_BACKUP_ENABLED=true
CLOUD_PROVIDER="s3"
S3_BUCKET="svlentes-backups"
```

#### Configurar Upload Google Cloud Storage

1. Instale gcloud CLI:
```bash
curl https://sdk.cloud.google.com | bash
gcloud init
```

2. Edite `scripts/backup-system.sh` e configure:
```bash
CLOUD_BACKUP_ENABLED=true
CLOUD_PROVIDER="gcs"
GCS_BUCKET="svlentes-backups"
```

---

## 📊 Sistema de Logs

### Como Usar o Logger

O sistema de logs está implementado em `src/lib/logger.ts` e oferece logging estruturado por categorias.

#### Exemplo de Uso em Código

```typescript
import { logger } from '@/lib/logger'

// Log de pagamento
logger.logPayment('payment_created', {
  userId: 'user_123',
  metadata: {
    amount: 99.90,
    paymentMethod: 'PIX',
    asaasPaymentId: 'pay_xyz'
  }
})

// Log de webhook
logger.logWebhook('PAYMENT_RECEIVED', {
  metadata: {
    paymentId: 'pay_xyz',
    value: 99.90
  }
})

// Log de API
logger.logAPI('POST', '/api/create-checkout', {
  statusCode: 200,
  duration: 1234,
  metadata: {
    plan: 'monthly',
    billingType: 'PIX'
  }
})

// Log de segurança
logger.logSecurity('api_key_access', {
  metadata: {
    environment: 'production',
    source: 'checkout'
  }
})
```

### Níveis de Log

```typescript
LogLevel.DEBUG      // Informações de debug (desenvolvimento)
LogLevel.INFO       // Informações gerais (operação normal)
LogLevel.WARN       // Avisos (atenção necessária)
LogLevel.ERROR      // Erros (falha em operação)
LogLevel.FATAL      // Erros críticos (sistema comprometido)
```

### Categorias de Log

```typescript
LogCategory.PAYMENT      // Transações de pagamento
LogCategory.WEBHOOK      // Eventos de webhook
LogCategory.API          // Requisições de API
LogCategory.AUTH         // Autenticação
LogCategory.SECURITY     // Eventos de segurança
LogCategory.PERFORMANCE  // Métricas de performance
LogCategory.BUSINESS     // Eventos de negócio
LogCategory.SYSTEM       // Eventos de sistema
```

### Visualizar Logs da Aplicação

#### Logs do Next.js (systemd)
```bash
# Logs em tempo real
journalctl -u svlentes-nextjs -f

# Últimas 100 linhas
journalctl -u svlentes-nextjs -n 100

# Filtrar por data
journalctl -u svlentes-nextjs --since "2025-01-13 00:00:00"

# Filtrar por nível (error, warning)
journalctl -u svlentes-nextjs -p err
```

#### Logs do Nginx
```bash
# Access log
tail -f /var/log/nginx/svlentes.com.br.access.log

# Error log
tail -f /var/log/nginx/error.log

# Filtrar erros 5xx
grep " 5[0-9][0-9] " /var/log/nginx/svlentes.com.br.access.log
```

### Configurar Serviço de Log Externo

#### Opção 1: Logtail (Betterstack)

1. Crie conta em [logtail.com](https://logtail.com)
2. Obtenha o source token
3. Instale o agente:
```bash
curl -s https://logtail.com/install.sh | bash
```
4. Configure o token:
```bash
echo "SOURCE_TOKEN=your_token_here" > /etc/logtail/logtail.conf
systemctl restart logtail
```

#### Opção 2: Sentry

1. Crie conta em [sentry.io](https://sentry.io)
2. Adicione ao `.env.local`:
```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```
3. Instale dependência:
```bash
npm install @sentry/nextjs
```
4. Configure em `src/lib/monitoring.ts` (já preparado)

---

## 📈 Monitoramento

### Sistema de Monitoramento

O sistema de monitoramento está implementado em `src/lib/monitoring.ts` e monitora automaticamente:

- **Core Web Vitals**: LCP, FID, CLS, TTFB
- **Performance**: Page load time, resource loading
- **Erros**: JavaScript errors, unhandled promises
- **Conversões**: Checkouts, assinaturas
- **Ações de Usuário**: Clicks, form submissions

### Métricas Disponíveis

#### Métricas de Performance
```typescript
// LCP (Largest Contentful Paint) - Deve ser < 2.5s
// FID (First Input Delay) - Deve ser < 100ms
// CLS (Cumulative Layout Shift) - Deve ser < 0.1
// TTFB (Time to First Byte) - Deve ser < 600ms
// Page Load Time - Deve ser < 3s
```

#### Como Adicionar Tracking Personalizado

```typescript
import { trackConversion, trackUserAction } from '@/lib/monitoring'

// Rastrear conversão
trackConversion('subscription_created', 99.90, {
  plan: 'monthly',
  billingType: 'PIX'
})

// Rastrear ação do usuário
trackUserAction('clicked_whatsapp_button', {
  page: '/home',
  section: 'hero'
})
```

### Alertas Configurados

O sistema envia alertas quando:

- **Erros > 10/hora**: Threshold de erros excedido
- **LCP > 2.5s**: Performance abaixo do aceitável
- **FID > 100ms**: Interatividade lenta
- **Page Load > 3s**: Carregamento lento

### Configurar Alertas por Webhook

Adicione ao `.env.local`:
```bash
MONITORING_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
ALERT_EMAIL_RECIPIENTS=admin@svlentes.com.br,tech@svlentes.com.br
```

### Dashboards Recomendados

#### Google Analytics 4
- Já configurado via `NEXT_PUBLIC_GA_ID`
- Métricas personalizadas enviadas automaticamente
- Acesse: [analytics.google.com](https://analytics.google.com)

#### Vercel Analytics (Se hospedado na Vercel)
- Ative em: Vercel Dashboard → Project → Analytics
- Métricas de Core Web Vitals automáticas
- Real User Monitoring (RUM)

---

## 💳 Integração Asaas

### Verificar Status da API

```bash
cd /root/svlentes-hero-shop
node scripts/test-asaas-connection.js
```

Saída esperada:
```
✅ Conectado à API Asaas com sucesso!
Status: 200
Conta: {
  "object": "account",
  "name": "Saraiva Vision Care LTDA",
  "email": "saraivavision@gmail.com",
  ...
}
```

### Monitorar Transações

#### Via Painel Asaas
1. Acesse: [https://www.asaas.com](https://www.asaas.com)
2. Login com credenciais da clínica
3. Dashboard → Cobranças

#### Via Logs da Aplicação
```bash
# Filtrar logs de pagamento
journalctl -u svlentes-nextjs | grep "LogCategory.PAYMENT"

# Filtrar webhooks recebidos
journalctl -u svlentes-nextjs | grep "LogCategory.WEBHOOK"
```

### Webhooks Asaas

O endpoint de webhook está em: `https://svlentes.com.br/api/webhooks/asaas`

#### Eventos Processados
- `PAYMENT_CREATED`: Cobrança criada
- `PAYMENT_UPDATED`: Status atualizado
- `PAYMENT_CONFIRMED`: Pagamento confirmado
- `PAYMENT_RECEIVED`: Pagamento recebido
- `PAYMENT_OVERDUE`: Cobrança vencida
- `PAYMENT_DELETED`: Cobrança cancelada
- `PAYMENT_RESTORED`: Cobrança restaurada
- `PAYMENT_REFUNDED`: Pagamento estornado
- `PAYMENT_RECEIVED_IN_CASH_UNDONE`: Estorno de dinheiro

#### Verificar Webhooks no Asaas
1. Dashboard Asaas → Configurações → Webhooks
2. Verifique se a URL está configurada: `https://svlentes.com.br/api/webhooks/asaas`
3. Teste o webhook usando a função "Testar Webhook"

### Troubleshooting Asaas

#### Problema: Pagamento não foi criado

**Verificar**:
```bash
# 1. Testar conexão
node scripts/test-asaas-connection.js

# 2. Verificar logs
journalctl -u svlentes-nextjs -n 100 | grep -i error

# 3. Verificar variáveis de ambiente
cat .env.local | grep ASAAS
```

#### Problema: Webhook não está sendo recebido

**Verificar**:
```bash
# 1. Testar endpoint
curl -X POST https://svlentes.com.br/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -d '{"event":"PAYMENT_RECEIVED","payment":{"id":"test"}}'

# 2. Verificar logs do Nginx
tail -f /var/log/nginx/svlentes.com.br.access.log | grep webhook

# 3. Verificar logs da aplicação
journalctl -u svlentes-nextjs -f | grep webhook
```

#### Problema: PIX QR Code não está sendo gerado

**Verificar**:
```typescript
// src/app/api/create-checkout/route.ts
// Certifique-se de que o billingType é 'PIX'
// Certifique-se de que getPixQrCode() está sendo chamado
```

---

## 🚨 Procedimentos de Emergência

### 1. Sistema Fora do Ar

#### Verificar Status dos Serviços
```bash
systemctl status svlentes-nextjs
systemctl status nginx
systemctl status postgresql
```

#### Reiniciar Serviços
```bash
# Next.js
systemctl restart svlentes-nextjs

# Nginx
systemctl restart nginx

# PostgreSQL (se necessário)
systemctl restart postgresql
```

#### Verificar Logs de Erro
```bash
journalctl -u svlentes-nextjs -p err -n 50
tail -f /var/log/nginx/error.log
```

### 2. Vazamento de API Key

#### Ações Imediatas
1. **Revogar chave comprometida**:
   - Acesse: [Asaas Dashboard → API → Tokens](https://www.asaas.com)
   - Delete o token comprometido

2. **Gerar nova chave**:
   - Gere novo token no Asaas
   - Atualize `.env.local`:
   ```bash
   nano /root/svlentes-hero-shop/.env.local
   # Atualize ASAAS_API_KEY_PROD=nova_chave_aqui
   ```

3. **Reiniciar aplicação**:
   ```bash
   systemctl restart svlentes-nextjs
   ```

4. **Verificar conexão**:
   ```bash
   node scripts/test-asaas-connection.js
   ```

5. **Monitorar transações suspeitas**:
   - Verifique Dashboard Asaas
   - Revise logs: `journalctl -u svlentes-nextjs --since "1 hour ago"`

### 3. Banco de Dados Corrompido

#### Restaurar do Backup Mais Recente
```bash
# 1. Listar backups
ls -lh /root/backups/svlentes/daily/

# 2. Restaurar (com confirmação)
cd /root/svlentes-hero-shop
./scripts/restore-backup.sh /root/backups/svlentes/daily/MAIS_RECENTE.tar.gz

# 3. Reiniciar aplicação
systemctl restart svlentes-nextjs
```

### 4. Ataque DDoS ou Tráfego Anormal

#### Verificar Tráfego
```bash
# IPs mais frequentes
tail -n 10000 /var/log/nginx/svlentes.com.br.access.log | awk '{print $1}' | sort | uniq -c | sort -nr | head -20

# Requisições por minuto
tail -f /var/log/nginx/svlentes.com.br.access.log | pv -l -i 1 -r > /dev/null
```

#### Bloquear IP Suspeito
```bash
# Adicionar ao Nginx
nano /etc/nginx/sites-available/svlentes.com.br

# Dentro do bloco server:
deny 123.456.789.0;

# Recarregar Nginx
nginx -t && systemctl reload nginx
```

#### Ativar Cloudflare (Recomendado)
1. Adicione domínio ao Cloudflare
2. Atualize DNS records
3. Ative "I'm Under Attack" mode se necessário

### 5. Certificado SSL Expirado

#### Renovar Certificado
```bash
# Renovar manualmente
certbot renew --force-renewal

# Recarregar Nginx
systemctl reload nginx

# Verificar
curl -I https://svlentes.com.br
```

---

## 🔧 Tarefas de Manutenção

### Diária

- [ ] Verificar status dos serviços: `systemctl status svlentes-nextjs nginx`
- [ ] Verificar logs de erro: `journalctl -u svlentes-nextjs -p err --since today`
- [ ] Verificar transações Asaas: [Dashboard Asaas](https://www.asaas.com)
- [ ] Backup automático (2h AM via cron)

### Semanal

- [ ] Revisar logs de aplicação: `journalctl -u svlentes-nextjs --since "1 week ago" | less`
- [ ] Verificar espaço em disco: `df -h`
- [ ] Verificar backups: `ls -lh /root/backups/svlentes/weekly/`
- [ ] Atualizar dependências npm: `npm outdated`
- [ ] Backup semanal (Domingo 3h AM via cron)

### Mensal

- [ ] Atualizar dependências: `npm update`
- [ ] Revisar métricas de performance: Google Analytics / Vercel
- [ ] Revisar custos Asaas: Dashboard → Relatórios
- [ ] Testar restore de backup: `./scripts/restore-backup.sh --database-only`
- [ ] Verificar certificados SSL: `certbot certificates`
- [ ] Backup mensal (1º dia 4h AM via cron)
- [ ] Limpar logs antigos: `journalctl --vacuum-time=30d`

### Trimestral

- [ ] Auditoria de segurança completa
- [ ] Revisar e atualizar documentação
- [ ] Testar procedimentos de emergência
- [ ] Revisar configurações de firewall
- [ ] Atualizar sistema operacional: `apt update && apt upgrade`

---

## 📞 Contatos de Emergência

### Equipe Técnica
- **Email**: saraivavision@gmail.com
- **WhatsApp**: +55 33 99860-1427

### Serviços Externos
- **Asaas Suporte**: suporte@asaas.com / (31) 3349-5780
- **Vercel Support**: https://vercel.com/support
- **Certbot/Let's Encrypt**: https://community.letsencrypt.org

---

## 📚 Referências

- [Documentação Asaas API v3](https://docs.asaas.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [LGPD - Lei Geral de Proteção de Dados](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)

---

**Última Atualização**: 2025-01-13
**Versão**: 1.0.0
**Responsável**: Sistema SVLentes
