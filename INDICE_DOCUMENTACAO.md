# 📚 Índice de Documentação - SVLentes

Este documento serve como guia de navegação para toda a documentação do sistema SVLentes.

---

## 🚀 Para Começar

Se você é novo no projeto, comece por aqui:

1. **[README.md](README.md)**
   - **O que é**: Visão geral do projeto
   - **Quando ler**: Primeiro contato com o projeto
   - **Conteúdo**: Tecnologias, quick start, comandos básicos

2. **[RESUMO_IMPLEMENTACAO.md](RESUMO_IMPLEMENTACAO.md)**
   - **O que é**: Resumo de tudo que foi implementado
   - **Quando ler**: Entender o estado atual do sistema
   - **Conteúdo**: Solicitações atendidas, arquivos criados, testes realizados

3. **[SISTEMA_COMPLETO.md](SISTEMA_COMPLETO.md)**
   - **O que é**: Documentação completa do sistema
   - **Quando ler**: Visão geral técnica detalhada
   - **Conteúdo**: Componentes, arquitetura, integração Asaas, logs, backup

---

## 👨‍💻 Para Desenvolvedores

### Entendendo o Projeto

**[CLAUDE.md](CLAUDE.md)**
- **Finalidade**: Contexto completo para desenvolvimento com Claude AI
- **Público**: Desenvolvedores, Claude Code
- **Tamanho**: ~600 linhas
- **Conteúdo**:
  - Contexto de negócio (clínica oftalmológica)
  - Estrutura do projeto
  - Guidelines de desenvolvimento
  - Compliance (LGPD, CFM)
  - Tecnologias e arquitetura
  - Integração Asaas detalhada
  - Contatos e referências

### Migração e Integrações

**[MIGRACAO_STRIPE_ASAAS.md](MIGRACAO_STRIPE_ASAAS.md)**
- **Finalidade**: Guia completo da migração Stripe → Asaas
- **Público**: Desenvolvedores, tech leads
- **Tamanho**: ~500 linhas
- **Conteúdo**:
  - Motivação da migração
  - Comparação Stripe vs Asaas
  - Mudanças no código (passo a passo)
  - Configuração de produção
  - Testes e troubleshooting
  - Economia de custos (30-50%)

### Segurança

**[SEGURANCA_API_KEYS.md](SEGURANCA_API_KEYS.md)**
- **Finalidade**: Auditoria de segurança do sistema
- **Público**: Desenvolvedores, DevOps, security team
- **Tamanho**: ~200 linhas
- **Conteúdo**:
  - Resultados da auditoria (todos ✅)
  - Verificação de .gitignore
  - Análise de hardcoded keys
  - Arquitetura backend-only
  - Boas práticas
  - Procedimento em caso de vazamento

---

## 🔧 Para Operações (DevOps/SysAdmin)

### Guia Operacional Principal

**[OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md)** ⭐ **MAIS IMPORTANTE**
- **Finalidade**: Manual operacional completo do dia a dia
- **Público**: DevOps, SysAdmin, suporte técnico
- **Tamanho**: ~500 linhas
- **Conteúdo**:
  - **Sistema de Backup**
    - Execução manual (daily/weekly/monthly)
    - Configuração automática (cron jobs)
    - Localização e restauração
    - Upload para cloud (S3/GCS)
  - **Sistema de Logs**
    - Como usar o logger no código
    - Visualizar logs (systemd, nginx)
    - Configurar serviços externos (Logtail, Sentry)
  - **Monitoramento**
    - Métricas disponíveis (Web Vitals, erros)
    - Tracking personalizado
    - Alertas configurados
  - **Integração Asaas**
    - Verificar status da API
    - Monitorar transações
    - Webhooks
    - Troubleshooting
  - **Procedimentos de Emergência**
    - Sistema fora do ar
    - Vazamento de API key
    - Banco corrompido
    - Ataque DDoS
    - SSL expirado
  - **Tarefas de Manutenção**
    - Diária, semanal, mensal, trimestral

### Checklist de Deploy

**[CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md)**
- **Finalidade**: Lista de verificação para deploy em produção
- **Público**: DevOps, tech leads
- **Tamanho**: ~400 linhas
- **Conteúdo**:
  - **Pré-Deploy**
    - Testes e build
    - Variáveis de ambiente
    - Segurança
    - Banco de dados
  - **Deploy**
    - Build de produção
    - Systemd service
    - Nginx
    - SSL/TLS
  - **Pós-Deploy**
    - Verificações de funcionalidade
    - Webhook Asaas
    - Monitoramento
    - Backups
    - Performance
    - Segurança
  - **Testes em Produção**
    - Fluxo de checkout (PIX, Boleto, Cartão)
    - Notificações
    - Monitoramento em tempo real
  - **Rollback**
    - Procedimento completo se algo der errado
  - **Aprovação Final**
    - Tech Lead, Product Owner, QA

---

## 📂 Documentação por Tópico

### 🤖 Chatbot WhatsApp (LangChain + LangGraph + GPT-5)

**Documentos**:
1. [docs/CHATBOT_README.md](docs/CHATBOT_README.md) - Visão geral e índice completo
2. [docs/CHATBOT_WHATSAPP_REQUIREMENTS.md](docs/CHATBOT_WHATSAPP_REQUIREMENTS.md) - Requisitos funcionais detalhados
3. [docs/CHATBOT_TECHNICAL_ARCHITECTURE.md](docs/CHATBOT_TECHNICAL_ARCHITECTURE.md) - Arquitetura técnica e implementação
4. [docs/CHATBOT_IMPLEMENTATION_GUIDE.md](docs/CHATBOT_IMPLEMENTATION_GUIDE.md) - Guia de implementação passo-a-passo

**Stack**:
- LangChain 0.2+ (Framework AI)
- LangGraph (Orquestração de agentes)
- GPT-5 (Modelo de linguagem OpenAI)
- Qdrant (Banco de dados vetorial - memória)
- WhatsApp Business API (Meta Cloud API)
- PostgreSQL + Redis + BullMQ

**Funcionalidades**:
- ✅ 4 Agentes especializados (Sales, Support, Scheduling, Information)
- ✅ Memória persistente de conversas (Qdrant)
- ✅ Classificação inteligente de intenção
- ✅ Handoff para atendimento humano
- ✅ Integração com Asaas (links de pagamento)
- ✅ Agendamento de consultas
- ✅ Qualificação automática de leads
- ✅ Analytics e métricas em tempo real

**Configuração**:
- `.env.chatbot.example` - Template de variáveis de ambiente

---

### 💳 Pagamentos (Asaas)

**Documentos**:
1. [MIGRACAO_STRIPE_ASAAS.md](MIGRACAO_STRIPE_ASAAS.md) - Migração e comparação
2. [CLAUDE.md](CLAUDE.md#asaas-payment-integration) - Seção "Asaas Payment Integration"
3. [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#integração-asaas) - Operação e troubleshooting
4. [SISTEMA_COMPLETO.md](SISTEMA_COMPLETO.md#integração-asaas) - Visão geral da integração

**Scripts**:
- `scripts/test-asaas-connection.js` - Testar conectividade

**Código**:
- `src/lib/asaas.ts` - Cliente Asaas API v3
- `src/types/asaas.ts` - TypeScript types
- `src/app/api/webhooks/asaas/route.ts` - Webhook handler
- `src/app/api/create-checkout/route.ts` - Checkout com Asaas

---

### 🔄 Backup e Restore

**Documentos**:
1. [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#sistema-de-backup) - Guia completo
2. [SISTEMA_COMPLETO.md](SISTEMA_COMPLETO.md#sistema-de-backup) - Estratégia

**Scripts**:
- `scripts/backup-system.sh` - Executar backup
- `scripts/restore-backup.sh` - Restaurar backup
- `scripts/setup-cron.sh` - Configurar automação

**Comandos Principais**:
```bash
# Backup manual
./scripts/backup-system.sh daily

# Configurar cron jobs
./scripts/setup-cron.sh

# Restaurar
./scripts/restore-backup.sh /path/to/backup.tar.gz
```

---

### 📊 Logs e Monitoramento

**Documentos**:
1. [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#sistema-de-logs) - Sistema de logs
2. [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#monitoramento) - Monitoramento
3. [SISTEMA_COMPLETO.md](SISTEMA_COMPLETO.md#sistema-de-logs) - Estrutura de logs

**Código**:
- `src/lib/logger.ts` - Sistema de logging estruturado
- `src/lib/monitoring.ts` - Monitoramento e Web Vitals

**Comandos de Visualização**:
```bash
# Logs da aplicação
journalctl -u svlentes-nextjs -f

# Logs do Nginx
tail -f /var/log/nginx/svlentes.com.br.access.log

# Logs de backup
tail -f /var/log/svlentes-backup.log
```

---

### 🔐 Segurança

**Documentos**:
1. [SEGURANCA_API_KEYS.md](SEGURANCA_API_KEYS.md) - Auditoria completa
2. [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#procedimentos-de-emergência) - Vazamento de keys
3. [SISTEMA_COMPLETO.md](SISTEMA_COMPLETO.md#segurança) - Boas práticas

**Verificações**:
```bash
# Verificar .gitignore
git check-ignore .env.local

# Buscar hardcoded keys
grep -r "aact_prod" src/

# Verificar headers de segurança
curl -I https://svlentes.com.br
```

---

### 🚀 Deploy

**Documentos**:
1. [CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md) - Checklist completo
2. [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#procedimentos-de-emergência) - Rollback
3. [SISTEMA_COMPLETO.md](SISTEMA_COMPLETO.md#verificação-final) - Verificação final

**Comandos de Deploy**:
```bash
# Build
npm run build

# Reiniciar serviço
systemctl restart svlentes-nextjs

# Verificar status
systemctl status svlentes-nextjs

# Monitorar logs
journalctl -u svlentes-nextjs -f
```

---

## 🛠️ Scripts Disponíveis

### Operacionais

| Script | Finalidade | Documentação |
|--------|-----------|--------------|
| `scripts/backup-system.sh` | Executar backup | [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#execução-manual) |
| `scripts/restore-backup.sh` | Restaurar backup | [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#restauração-de-backup) |
| `scripts/setup-cron.sh` | Configurar cron jobs | [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#configurar-backups-automáticos) |
| `scripts/test-asaas-connection.js` | Testar Asaas API | [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#verificar-status-da-api) |
| `scripts/verify-system.sh` | Verificar sistema | [SISTEMA_COMPLETO.md](SISTEMA_COMPLETO.md#verificação-final) |

### npm Scripts

| Comando | Finalidade | Documentação |
|---------|-----------|--------------|
| `npm run dev` | Dev server | [README.md](README.md#desenvolvimento) |
| `npm run build` | Build produção | [CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md#build-de-produção) |
| `npm run start` | Start produção | [README.md](README.md#produção) |
| `npm run lint` | ESLint | [CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md#pré-deploy) |
| `npm run test` | Jest tests | [CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md#pré-deploy) |
| `npm run test:e2e` | Playwright E2E | [CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md#pré-deploy) |

---

## 🎯 Guias Rápidos (Quick Reference)

### Eu quero... fazer backup

1. **Manual**: `./scripts/backup-system.sh daily`
2. **Automático**: `./scripts/setup-cron.sh`
3. **Detalhes**: [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#sistema-de-backup)

### Eu quero... restaurar backup

1. **Listar**: `ls -lh /root/backups/svlentes/daily/`
2. **Restaurar**: `./scripts/restore-backup.sh /path/to/backup.tar.gz`
3. **Detalhes**: [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#restauração-de-backup)

### Eu quero... ver logs

1. **Aplicação**: `journalctl -u svlentes-nextjs -f`
2. **Nginx**: `tail -f /var/log/nginx/svlentes.com.br.access.log`
3. **Detalhes**: [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#visualizar-logs-da-aplicação)

### Eu quero... testar Asaas

1. **Testar**: `node scripts/test-asaas-connection.js`
2. **Detalhes**: [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#verificar-status-da-api)

### Eu quero... fazer deploy

1. **Checklist**: Abrir [CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md)
2. **Build**: `npm run build`
3. **Restart**: `systemctl restart svlentes-nextjs`
4. **Detalhes**: [CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md#deploy)

### Eu quero... resolver emergência

1. **Guia**: [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#procedimentos-de-emergência)
2. **Tipos**: Sistema fora, vazamento key, banco corrompido, DDoS, SSL

### Eu quero... entender a migração Stripe→Asaas

1. **Guia**: [MIGRACAO_STRIPE_ASAAS.md](MIGRACAO_STRIPE_ASAAS.md)
2. **Resumo**: [RESUMO_IMPLEMENTACAO.md](RESUMO_IMPLEMENTACAO.md#1️⃣-migração-stripe--asaas-)

---

## 📞 Suporte

### Quando Usar Cada Canal

**Email (saraivavision@gmail.com)**:
- Dúvidas técnicas detalhadas
- Solicitações de feature
- Relatórios de bugs

**WhatsApp (+55 33 99860-1427)**:
- Emergências (sistema fora)
- Suporte urgente
- Questões rápidas

**Instagram (@saraiva_vision)**:
- Dúvidas gerais
- Marketing
- Atendimento ao cliente

---

## 🗂️ Estrutura Completa da Documentação

```
/root/svlentes-hero-shop/
│
├── 📋 DOCUMENTAÇÃO GERAL
│   ├── README.md                      ⭐ Visão geral do projeto
│   ├── INDICE_DOCUMENTACAO.md         📚 Este arquivo (navegação)
│   ├── RESUMO_IMPLEMENTACAO.md        ✅ O que foi implementado
│   └── SISTEMA_COMPLETO.md            📖 Documentação técnica completa
│
├── 📘 DOCUMENTAÇÃO TÉCNICA
│   ├── CLAUDE.md                      🤖 Contexto para Claude AI
│   ├── MIGRACAO_STRIPE_ASAAS.md       💳 Guia de migração
│   └── SEGURANCA_API_KEYS.md          🔐 Auditoria de segurança
│
├── 📗 DOCUMENTAÇÃO OPERACIONAL
│   ├── OPERACOES_SISTEMA.md           ⭐ Manual operacional
│   └── CHECKLIST_DEPLOYMENT.md        🚀 Checklist de deploy
│
├── 🤖 DOCUMENTAÇÃO CHATBOT WHATSAPP
│   ├── docs/CHATBOT_README.md         📚 Índice e visão geral
│   ├── docs/CHATBOT_WHATSAPP_REQUIREMENTS.md  📋 Requisitos funcionais
│   ├── docs/CHATBOT_TECHNICAL_ARCHITECTURE.md 🏗️ Arquitetura técnica
│   ├── docs/CHATBOT_IMPLEMENTATION_GUIDE.md   🚀 Guia de implementação
│   └── .env.chatbot.example           ⚙️ Template de configuração
│
├── 🔧 SCRIPTS
│   ├── scripts/backup-system.sh       💾 Backup
│   ├── scripts/restore-backup.sh      ♻️  Restore
│   ├── scripts/setup-cron.sh          ⏰ Cron jobs
│   ├── scripts/test-asaas-connection.js 🧪 Teste Asaas
│   └── scripts/verify-system.sh       ✅ Verificação
│
└── 💻 CÓDIGO FONTE
    ├── src/lib/asaas.ts               💳 Cliente Asaas
    ├── src/lib/logger.ts              📊 Sistema de logs
    ├── src/lib/monitoring.ts          📈 Monitoramento
    ├── src/lib/whatsapp.ts            📱 Integração WhatsApp (existente)
    └── src/types/asaas.ts             📝 Types TypeScript
```

---

## 🏆 Documentos Mais Importantes

### Top 5 para Começar

1. **[README.md](README.md)** - Primeiro contato
2. **[RESUMO_IMPLEMENTACAO.md](RESUMO_IMPLEMENTACAO.md)** - O que foi feito
3. **[OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md)** - Operação diária
4. **[CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md)** - Deploy
5. **[SISTEMA_COMPLETO.md](SISTEMA_COMPLETO.md)** - Referência completa

### Para Cada Perfil

**👨‍💻 Desenvolvedor**:
1. [CLAUDE.md](CLAUDE.md)
2. [MIGRACAO_STRIPE_ASAAS.md](MIGRACAO_STRIPE_ASAAS.md)
3. [SISTEMA_COMPLETO.md](SISTEMA_COMPLETO.md)

**🔧 DevOps/SysAdmin**:
1. [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md)
2. [CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md)
3. [SEGURANCA_API_KEYS.md](SEGURANCA_API_KEYS.md)

**👔 Tech Lead/Manager**:
1. [RESUMO_IMPLEMENTACAO.md](RESUMO_IMPLEMENTACAO.md)
2. [SISTEMA_COMPLETO.md](SISTEMA_COMPLETO.md)
3. [MIGRACAO_STRIPE_ASAAS.md](MIGRACAO_STRIPE_ASAAS.md)

---

## 📊 Estatísticas da Documentação

| Categoria | Arquivos | Linhas Aprox. |
|-----------|----------|---------------|
| Documentação Geral | 4 | ~1.500 |
| Documentação Técnica | 3 | ~1.300 |
| Documentação Operacional | 2 | ~900 |
| **Documentação Chatbot** | **5** | **~2.500** |
| Scripts | 5 | ~1.130 |
| Código | 3 | ~1.200 |
| **TOTAL** | **22** | **~8.530** |

---

## 🔍 Busca Rápida

### Por Palavra-Chave

| Palavra-Chave | Documento Principal |
|---------------|---------------------|
| Asaas | [MIGRACAO_STRIPE_ASAAS.md](MIGRACAO_STRIPE_ASAAS.md) |
| Backup | [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#sistema-de-backup) |
| **Chatbot** | **[docs/CHATBOT_README.md](docs/CHATBOT_README.md)** |
| Deploy | [CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md) |
| Emergência | [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#procedimentos-de-emergência) |
| **LangChain** | **[docs/CHATBOT_TECHNICAL_ARCHITECTURE.md](docs/CHATBOT_TECHNICAL_ARCHITECTURE.md)** |
| **LangGraph** | **[docs/CHATBOT_TECHNICAL_ARCHITECTURE.md](docs/CHATBOT_TECHNICAL_ARCHITECTURE.md)** |
| Logs | [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#sistema-de-logs) |
| Monitoramento | [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#monitoramento) |
| Pagamentos | [MIGRACAO_STRIPE_ASAAS.md](MIGRACAO_STRIPE_ASAAS.md) |
| **Qdrant** | **[docs/CHATBOT_WHATSAPP_REQUIREMENTS.md](docs/CHATBOT_WHATSAPP_REQUIREMENTS.md)** |
| Restore | [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#restauração-de-backup) |
| Segurança | [SEGURANCA_API_KEYS.md](SEGURANCA_API_KEYS.md) |
| Stripe | [MIGRACAO_STRIPE_ASAAS.md](MIGRACAO_STRIPE_ASAAS.md) |
| Webhook | [OPERACOES_SISTEMA.md](OPERACOES_SISTEMA.md#webhooks-asaas) |
| **WhatsApp** | **[docs/CHATBOT_README.md](docs/CHATBOT_README.md)** |

---

**Última Atualização**: 2025-01-13
**Versão**: 1.0.0
**Mantido por**: Equipe SVLentes

*Este índice é atualizado sempre que nova documentação é criada.*
