# Sistema SVLentes - Documentação Completa

Este documento fornece uma visão geral completa do sistema SVLentes após a configuração de produção.

## 📚 Índice de Documentação

### Documentos Principais

1. **[README.md](README.md)** - Visão geral do projeto e quick start
2. **[CLAUDE.md](CLAUDE.md)** - Contexto completo para desenvolvimento com Claude
3. **[OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md)** - Guia operacional completo
4. **[CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md)** - Checklist de deploy
5. **[MIGRACAO_STRIPE_ASAAS.md](MIGRACAO_STRIPE_ASAAS.md)** - Guia de migração Stripe → Asaas
6. **[SEGURANCA_API_KEYS.md](SEGURANCA_API_KEYS.md)** - Auditoria de segurança

---

## 🎯 Status Atual do Sistema

### ✅ Componentes Implementados

| Componente | Status | Localização | Notas |
|------------|--------|-------------|-------|
| **Frontend** | ✅ Configurado | `src/` | Next.js 15 + TypeScript + Tailwind |
| **API Asaas** | ✅ Integrado | `src/lib/asaas.ts` | Cliente completo v3 |
| **Webhooks** | ✅ Implementado | `src/app/api/webhooks/asaas/` | Todos eventos suportados |
| **Autenticação** | ✅ Configurado | NextAuth.js | Secret gerado |
| **Logging** | ✅ Implementado | `src/lib/logger.ts` | Sistema estruturado |
| **Monitoramento** | ✅ Implementado | `src/lib/monitoring.ts` | Web Vitals + Erros |
| **Backup** | ✅ Implementado | `scripts/backup-system.sh` | Daily/Weekly/Monthly |
| **Restore** | ✅ Implementado | `scripts/restore-backup.sh` | Restore seguro |
| **Testes** | ✅ Implementado | `scripts/test-asaas-connection.js` | Conectividade OK |

### 🔐 Configuração de Segurança

| Item | Status | Detalhes |
|------|--------|----------|
| **API Key Asaas** | ✅ Configurada | Produção ativa |
| **NextAuth Secret** | ✅ Gerado | 256-bit secure |
| **HTTPS** | ✅ Ativo | Let's Encrypt SSL |
| **Environment Vars** | ✅ Protegidas | `.env.local` git-ignored |
| **Auditoria** | ✅ Completa | Nenhuma vulnerabilidade |

### 📊 Infraestrutura

| Serviço | Status | Comando de Verificação |
|---------|--------|------------------------|
| **Next.js** | ✅ Running | `systemctl status svlentes-nextjs` |
| **Nginx** | ✅ Running | `systemctl status nginx` |
| **PostgreSQL** | ✅ Running | `systemctl status postgresql` |
| **Certbot** | ✅ Active | `systemctl list-timers \| grep certbot` |

---

## 🚀 Quick Start

### Para Desenvolvedores

```bash
# 1. Clone e instale
git clone <repo>
cd svlentes-hero-shop
npm install

# 2. Configure ambiente
cp .env.local.example .env.local
nano .env.local  # Adicione as chaves

# 3. Execute em desenvolvimento
npm run dev

# 4. Acesse
# http://localhost:3000
```

### Para Operações (Produção)

```bash
# Verificar status
systemctl status svlentes-nextjs

# Ver logs em tempo real
journalctl -u svlentes-nextjs -f

# Reiniciar aplicação
systemctl restart svlentes-nextjs

# Executar backup manual
cd /root/svlentes-hero-shop
./scripts/backup-system.sh daily
```

---

## 🔧 Scripts Disponíveis

### Scripts npm

```bash
npm run dev              # Servidor de desenvolvimento (porta 3000)
npm run build           # Build de produção
npm run start           # Inicia servidor de produção
npm run lint            # ESLint
npm run type-check      # TypeScript check
npm run test            # Jest tests
npm run test:e2e        # Playwright E2E
```

### Scripts de Sistema

```bash
# Backup e Restore
./scripts/backup-system.sh [daily|weekly|monthly]
./scripts/restore-backup.sh <backup.tar.gz> [--database-only] [--force]

# Setup
./scripts/setup-cron.sh                    # Configura cron jobs automáticos

# Testes
node scripts/test-asaas-connection.js      # Testa API Asaas
```

---

## 💳 Integração Asaas

### Configuração

**Ambiente**: Produção
**Base URL**: `https://api.asaas.com/v3`
**API Key**: Configurada em `.env.local`

### Métodos de Pagamento Suportados

- ✅ **PIX**: Pagamento instantâneo com QR Code
- ✅ **Boleto Bancário**: Método tradicional brasileiro
- ✅ **Cartão de Crédito**: Pagamentos recorrentes

### Webhooks Processados

| Evento | Descrição | Handler |
|--------|-----------|---------|
| `PAYMENT_CREATED` | Cobrança criada | ✅ Implementado |
| `PAYMENT_RECEIVED` | Pagamento recebido | ✅ Implementado |
| `PAYMENT_CONFIRMED` | Pagamento confirmado | ✅ Implementado |
| `PAYMENT_OVERDUE` | Cobrança vencida | ✅ Implementado |
| `PAYMENT_REFUNDED` | Pagamento estornado | ✅ Implementado |

**Webhook URL**: `https://svlentes.com.br/api/webhooks/asaas`

### Teste de Conectividade

```bash
node scripts/test-asaas-connection.js
```

**Saída esperada**:
```
✅ Conectado à API Asaas com sucesso!
Status: 200
Conta: { object: 'account', name: '...' }
```

---

## 📊 Sistema de Logs

### Estrutura de Logs

O sistema utiliza logging estruturado implementado em `src/lib/logger.ts`:

#### Níveis de Log
- `DEBUG`: Informações detalhadas de debug
- `INFO`: Operações normais
- `WARN`: Avisos que requerem atenção
- `ERROR`: Erros em operações
- `FATAL`: Erros críticos do sistema

#### Categorias de Log
- `PAYMENT`: Transações de pagamento
- `WEBHOOK`: Eventos de webhook
- `API`: Requisições de API
- `AUTH`: Autenticação
- `SECURITY`: Eventos de segurança
- `PERFORMANCE`: Métricas de performance
- `BUSINESS`: Eventos de negócio
- `SYSTEM`: Eventos de sistema

### Visualizar Logs

```bash
# Logs da aplicação (systemd)
journalctl -u svlentes-nextjs -f

# Logs do Nginx
tail -f /var/log/nginx/svlentes.com.br.access.log
tail -f /var/log/nginx/error.log

# Logs de backup
tail -f /var/log/svlentes-backup.log
```

### Exemplo de Uso no Código

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

// Log de erro
logger.logError('api_error', new Error('Connection timeout'), {
  endpoint: '/api/create-checkout',
  statusCode: 500
})
```

---

## 📈 Sistema de Monitoramento

### Métricas Automáticas

O sistema de monitoramento (`src/lib/monitoring.ts`) captura automaticamente:

#### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTFB** (Time to First Byte): < 600ms

#### Performance
- Page Load Time
- Resource Loading
- API Response Time

#### Erros
- JavaScript Errors
- Unhandled Promise Rejections
- API Errors

### Tracking Personalizado

```typescript
import { trackConversion, trackUserAction } from '@/lib/monitoring'

// Rastrear conversão
trackConversion('subscription_created', 99.90, {
  plan: 'monthly',
  billingType: 'PIX'
})

// Rastrear ação do usuário
trackUserAction('clicked_cta', {
  button: 'hero_cta',
  page: '/home'
})
```

### Alertas Configurados

O sistema envia alertas quando:
- **Erros > 10/hora**: Threshold de erros excedido
- **LCP > 2.5s**: Performance ruim
- **FID > 100ms**: Interatividade lenta
- **Page Load > 3s**: Carregamento lento

---

## 🔄 Sistema de Backup

### Estratégia de Backup

#### Tipos de Backup

| Tipo | Frequência | Retenção | Horário |
|------|------------|----------|---------|
| **Daily** | Diário | 7 dias | 2:00 AM |
| **Weekly** | Semanal (Domingo) | 28 dias | 3:00 AM |
| **Monthly** | Mensal (Dia 1) | 365 dias | 4:00 AM |

#### O que é Feito Backup

- ✅ **Banco de Dados PostgreSQL**
  - Custom dump format (`.dump`)
  - SQL format (`.sql`)

- ✅ **Arquivos de Configuração**
  - `package.json`
  - `.env.local.example`
  - Configurações Next.js/Tailwind

- ✅ **Logs da Aplicação**
  - Systemd logs
  - Nginx logs

- ✅ **Dados de Transações**
  - Exports CSV (se disponíveis)

- ✅ **Metadata**
  - Git commit hash
  - Timestamp
  - Versões de dependências

### Localização dos Backups

```
/root/backups/svlentes/
├── daily/
│   ├── 20250113_020000.tar.gz
│   ├── 20250114_020000.tar.gz
│   └── ...
├── weekly/
│   ├── 20250105_030000.tar.gz
│   └── ...
└── monthly/
    ├── 20250101_040000.tar.gz
    └── ...
```

### Executar Backup Manual

```bash
cd /root/svlentes-hero-shop

# Backup diário
./scripts/backup-system.sh daily

# Backup semanal
./scripts/backup-system.sh weekly

# Backup mensal
./scripts/backup-system.sh monthly
```

### Configurar Backups Automáticos

```bash
# Executar script de setup (configura cron jobs)
sudo ./scripts/setup-cron.sh

# Verificar cron jobs configurados
crontab -l

# Verificar logs de backup
tail -f /var/log/svlentes-backup.log
```

### Restaurar Backup

```bash
# Listar backups disponíveis
ls -lh /root/backups/svlentes/daily/

# Restaurar backup completo
./scripts/restore-backup.sh /root/backups/svlentes/daily/20250113_020000.tar.gz

# Restaurar apenas banco de dados
./scripts/restore-backup.sh /root/backups/svlentes/daily/20250113_020000.tar.gz --database-only

# Restaurar sem confirmações (automático)
./scripts/restore-backup.sh /root/backups/svlentes/daily/20250113_020000.tar.gz --force
```

---

## 🔐 Segurança

### Auditoria de Segurança

Uma auditoria completa foi realizada em 2025-01-13. Resultados:

| Verificação | Status | Detalhes |
|-------------|--------|----------|
| **.gitignore** | ✅ Válido | `.env.local` git-ignored |
| **Hardcoded Keys** | ✅ Nenhuma | Nenhuma chave no código |
| **Frontend Exposure** | ✅ Seguro | APIs apenas backend |
| **HTTPS** | ✅ Ativo | Let's Encrypt SSL |
| **Headers** | ✅ Configurados | HSTS, X-Frame-Options, etc. |

Ver detalhes completos em: [SEGURANCA_API_KEYS.md](SEGURANCA_API_KEYS.md)

### Boas Práticas Implementadas

1. ✅ **API Keys**
   - Nunca committed no git
   - Armazenadas em `.env.local`
   - Diferentes para sandbox/produção
   - Acesso restrito ao backend

2. ✅ **Autenticação**
   - NextAuth.js com secret seguro
   - Hash bcrypt para senhas
   - JWT com expiração

3. ✅ **HTTPS**
   - Certificado SSL/TLS válido
   - HSTS habilitado
   - HTTP → HTTPS redirect

4. ✅ **Headers de Segurança**
   - `Strict-Transport-Security`
   - `X-Frame-Options`
   - `X-Content-Type-Options`
   - `Referrer-Policy`

### Procedimento em Caso de Vazamento

Se uma API key vazar:

1. **Revogar imediatamente** no Dashboard Asaas
2. **Gerar nova chave** de produção
3. **Atualizar `.env.local`** com nova chave
4. **Reiniciar aplicação**: `systemctl restart svlentes-nextjs`
5. **Monitorar transações** nas próximas 24h
6. **Documentar incidente** para auditoria

Ver procedimento completo em: [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#procedimentos-de-emergência)

---

## 📞 Suporte e Contatos

### Equipe Técnica

- **Email**: saraivavision@gmail.com
- **WhatsApp**: +55 33 99860-1427
- **Instagram**: [@saraiva_vision](https://instagram.com/saraiva_vision)

### Serviços Externos

- **Asaas Suporte**: suporte@asaas.com / (31) 3349-5780
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Certbot/Let's Encrypt**: [community.letsencrypt.org](https://community.letsencrypt.org)

---

## 📖 Referências Técnicas

### Documentação Oficial

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Asaas API v3 Documentation](https://docs.asaas.com)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Regulamentações

- [LGPD - Lei Geral de Proteção de Dados](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [CFM - Conselho Federal de Medicina](https://portal.cfm.org.br)
- [Asaas Terms of Service](https://www.asaas.com/termos-de-uso)

---

## 🗺️ Roadmap

### Implementado (v1.0.0)

- ✅ Landing page com Next.js 15
- ✅ Integração Asaas API v3
- ✅ Webhooks de pagamento
- ✅ Sistema de logging estruturado
- ✅ Monitoramento de performance
- ✅ Backup automatizado
- ✅ SSL/HTTPS configurado
- ✅ Documentação completa

### Próximas Funcionalidades (v1.1.0)

- [ ] Dashboard de administração
- [ ] Gestão de assinaturas
- [ ] Histórico de pagamentos
- [ ] Notificações por email
- [ ] Integração WhatsApp Business API
- [ ] Analytics avançado

### Futuro (v2.0.0)

- [ ] App mobile (React Native)
- [ ] Sistema de agendamento
- [ ] Telemedicina (consultas online)
- [ ] Programa de fidelidade
- [ ] Marketplace de produtos

---

## 📊 Métricas de Sucesso

### KPIs Atuais

| Métrica | Target | Status Atual |
|---------|--------|--------------|
| **Uptime** | > 99.9% | Monitorar |
| **Response Time** | < 2s (p95) | Monitorar |
| **Error Rate** | < 0.1% | Monitorar |
| **Conversion Rate** | > 2% | A definir |
| **Payment Success** | > 98% | Monitorar |

### Ferramentas de Acompanhamento

- **Google Analytics**: Tráfego e conversões
- **Asaas Dashboard**: Transações e pagamentos
- **Vercel Analytics**: Performance e Web Vitals
- **Custom Monitoring**: `src/lib/monitoring.ts`

---

## 🎓 Como Contribuir

### Para Desenvolvedores

1. **Fork** o repositório
2. **Clone** localmente
3. **Crie branch**: `git checkout -b feature/nome-da-feature`
4. **Desenvolva** e **teste**
5. **Commit**: Use mensagens descritivas
6. **Push**: `git push origin feature/nome-da-feature`
7. **Pull Request**: Descreva as mudanças

### Padrões de Código

- **TypeScript**: Tipagem estrita
- **ESLint**: Seguir configuração do projeto
- **Prettier**: Formatação automática
- **Commits**: Conventional Commits (feat, fix, docs, etc.)

### Testes

Toda nova funcionalidade deve incluir:
- ✅ Testes unitários (Jest)
- ✅ Testes de integração
- ✅ Testes E2E (Playwright) para fluxos críticos

---

## 📝 Changelog

### v1.0.0 (2025-01-13)

**Adicionado**:
- ✨ Sistema completo de pagamentos com Asaas API v3
- ✨ Webhooks de pagamento (PIX, Boleto, Cartão)
- ✨ Sistema de logging estruturado
- ✨ Monitoramento de performance e erros
- ✨ Sistema de backup automatizado (daily/weekly/monthly)
- ✨ Scripts de restore com segurança
- ✨ Testes de conectividade Asaas
- ✨ Documentação operacional completa
- ✨ Checklist de deployment
- ✨ Auditoria de segurança

**Removido**:
- ❌ Integração Stripe (migrado para Asaas)

**Alterado**:
- 🔄 Domínio principal: svlentes.com.br
- 🔄 Ambiente: Produção ativa
- 🔄 NextAuth secret gerado (256-bit)

**Corrigido**:
- 🐛 Dependências Stripe removidas
- 🐛 Environment variables atualizadas
- 🐛 Configuração HTTPS/SSL

---

## ✅ Verificação Final

Antes de considerar o sistema pronto para produção, verifique:

- [ ] Todos os testes passando
- [ ] Build de produção sem erros
- [ ] API Asaas conectada e testada
- [ ] Webhooks configurados e funcionando
- [ ] SSL/HTTPS ativo e válido
- [ ] Logs funcionando corretamente
- [ ] Backups configurados (cron jobs)
- [ ] Documentação completa e atualizada
- [ ] Auditoria de segurança aprovada
- [ ] Checklist de deploy concluído

---

**Sistema SVLentes**
**Versão**: 1.0.0
**Última Atualização**: 2025-01-13
**Status**: ✅ Pronto para Produção

**Desenvolvido para**:
Saraiva Vision Care LTDA
Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
Caratinga/MG, Brasil

---

Para suporte técnico ou dúvidas, consulte:
- [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md) - Operações diárias
- [CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md) - Deploy
- [SEGURANCA_API_KEYS.md](SEGURANCA_API_KEYS.md) - Segurança
- [MIGRACAO_STRIPE_ASAAS.md](MIGRACAO_STRIPE_ASAAS.md) - Migração

**Email**: saraivavision@gmail.com
**WhatsApp**: +55 33 99860-1427
