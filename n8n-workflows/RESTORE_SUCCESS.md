# n8n Workflows - Restauração Completa ✅

## Data: 2025-10-19

### Workflows Restaurados

#### 1. Deployment Notification Workflow
- **ID**: 9a62c9e0-eb69-47dd-ba8a-f92ce1149044
- **Status**: Ativo ✅
- **Triggers**: 2 webhooks
  - `/staging-deployment` - Notificações de deploy staging
  - `/production-deployment` - Notificações de deploy produção

**Funcionalidades:**
- Recebe webhooks do GitHub Actions
- Verifica status do deployment (success/failure)
- Envia notificações WhatsApp
- Realiza health check pós-deploy
- Registra logs em PostgreSQL

#### 2. Production Monitoring & Alerts
- **ID**: 55ea7b83-0438-481f-9611-7c425cb728a8
- **Status**: Ativo ✅
- **Trigger**: Schedule (a cada 5 minutos)

**Funcionalidades:**
- Monitora health check da produção
- Verifica métricas de performance
- Rastreia contagem de erros
- Alertas automáticos via WhatsApp
- Logging de métricas em PostgreSQL

### Estado do Sistema

#### Container n8n
- **Versão**: 1.115.3 (atualizada)
- **Status**: Running ✅
- **Porta**: 5678
- **Health**: OK
- **Data Volume**: /root/approuter/n8n/data

#### Database
- **Tipo**: SQLite
- **Localização**: /root/approuter/n8n/data/database.sqlite
- **Workflows**: 2 registrados
- **Tamanho**: 516KB

### Configuração Pendente ⚠️

Para utilizar os workflows completamente, configure:

#### 1. Credenciais WhatsApp
```
Tipo: HTTP Header Auth ou WhatsApp Business API
Telefone destino: +55 33 99898-026
```

#### 2. Credenciais PostgreSQL
```
Host: localhost (ou IP do servidor PostgreSQL)
Database: n8ndb
User: n8nuser
Password: [configurar]
```

#### 3. Database Schema
Execute no PostgreSQL:

```sql
CREATE TABLE deployment_log (
  id SERIAL PRIMARY KEY,
  environment VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  commit VARCHAR(100),
  actor VARCHAR(100),
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE monitoring_log (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  health_status INTEGER,
  response_time INTEGER,
  error_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. GitHub Actions Webhooks
Adicione aos GitHub Secrets:

```bash
N8N_STAGING_WEBHOOK=http://[seu-servidor]:5678/webhook/staging-deployment
N8N_PRODUCTION_WEBHOOK=http://[seu-servidor]:5678/webhook/production-deployment
```

### Acesso

**n8n Interface**: http://localhost:5678

**Endpoints:**
- Health: http://localhost:5678/healthz
- Webhook Staging: http://localhost:5678/webhook/staging-deployment
- Webhook Production: http://localhost:5678/webhook/production-deployment

### Próximos Passos

1. ✅ Workflows restaurados
2. ⏳ Acessar interface n8n (http://localhost:5678)
3. ⏳ Configurar credenciais WhatsApp
4. ⏳ Configurar credenciais PostgreSQL
5. ⏳ Testar workflows manualmente
6. ⏳ Configurar webhooks no GitHub
7. ⏳ Ativar monitoramento automático

### Backup Automático

Os workflows foram restaurados a partir de:
- `/root/svlentes-hero-shop/n8n-workflows/deployment-notification.json`
- `/root/svlentes-hero-shop/n8n-workflows/monitoring-alerts.json`

Scripts de restauração disponíveis em:
- `/root/svlentes-hero-shop/scripts/restore-n8n-workflows-v2.sh`

### Troubleshooting

**Workflows não aparecem na interface:**
```bash
# Verificar banco de dados
sqlite3 /root/approuter/n8n/data/database.sqlite "SELECT * FROM workflow_entity;"

# Reiniciar container
docker restart n8n
```

**Erro de conexão:**
```bash
# Verificar logs
docker logs n8n -f

# Verificar health
curl http://localhost:5678/healthz
```

### Rollback

Se necessário reverter:
```bash
# Remover workflows
sqlite3 /root/approuter/n8n/data/database.sqlite "DELETE FROM workflow_entity;"

# Restaurar novamente
bash /root/svlentes-hero-shop/scripts/restore-n8n-workflows-v2.sh
```
