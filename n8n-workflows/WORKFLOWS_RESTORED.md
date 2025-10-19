# n8n Workflows Restaurados ✅

## Data: 2025-10-19 02:05 UTC

### Status: COMPLETO

✅ Workflows restaurados com todos os nodes
✅ Workflows ativados automaticamente
✅ Webhooks configurados
✅ Schedule configurado

---

## Workflow 1: Deployment Notification Workflow

**ID**: eb24c233-f15f-46d4-b870-8d7068b08a33
**Status**: ✅ Ativo
**Nodes**: 7 completos

### Nodes Configurados:

1. **Webhook - Staging Deployment**
   - Type: n8n-nodes-base.webhook
   - Path: `/webhook/staging-deployment`
   - Method: POST
   - URL: https://saraivavision-n8n.cloud/webhook/staging-deployment

2. **Webhook - Production Deployment**
   - Type: n8n-nodes-base.webhook
   - Path: `/webhook/production-deployment`
   - Method: POST
   - URL: https://saraivavision-n8n.cloud/webhook/production-deployment

3. **Check Status - Staging**
   - Type: n8n-nodes-base.if
   - Condition: status === "success"

4. **Check Status - Production**
   - Type: n8n-nodes-base.if
   - Condition: status === "success"

5. **WhatsApp Success Notification**
   - Type: n8n-nodes-base.httpRequest
   - URL: https://api.whatsapp.com/send
   - Phone: 553399898026
   - Message: "✅ Deployment SUCCESS..."

6. **WhatsApp Failure Notification**
   - Type: n8n-nodes-base.httpRequest
   - URL: https://api.whatsapp.com/send
   - Phone: 553399898026
   - Message: "⚠️ Deployment FAILED..."

7. **Health Check After Deployment**
   - Type: n8n-nodes-base.httpRequest
   - URL: {{url}}/api/health-check
   - Timeout: 10000ms

### Fluxo de Execução:

```
Webhook (Staging/Production)
    ↓
Check Status (IF)
    ↓
    ├─→ SUCCESS → WhatsApp Success → Health Check
    └─→ FAILURE → WhatsApp Failure
```

### Teste do Webhook:

```bash
# Staging
curl -X POST https://saraivavision-n8n.cloud/webhook/staging-deployment \
  -H "Content-Type: application/json" \
  -d '{
    "status": "success",
    "environment": "staging",
    "commit": "abc123",
    "actor": "developer",
    "timestamp": "2025-10-19T02:00:00Z",
    "url": "https://staging.svlentes.shop"
  }'

# Production
curl -X POST https://saraivavision-n8n.cloud/webhook/production-deployment \
  -H "Content-Type: application/json" \
  -d '{
    "status": "success",
    "environment": "production",
    "commit": "def456",
    "actor": "github-actions",
    "timestamp": "2025-10-19T02:00:00Z",
    "url": "https://svlentes.com.br"
  }'
```

---

## Workflow 2: Production Monitoring & Alerts

**ID**: e3434ab1-22c2-4426-bd45-f6c0e9a10ad3
**Status**: ✅ Ativo
**Nodes**: 7 completos

### Nodes Configurados:

1. **Schedule - Every 5 Minutes**
   - Type: n8n-nodes-base.scheduleTrigger
   - Interval: 5 minutes
   - Executa automaticamente

2. **Health Check - Production**
   - Type: n8n-nodes-base.httpRequest
   - URL: https://svlentes.shop/api/health-check
   - Timeout: 10000ms

3. **Performance Metrics**
   - Type: n8n-nodes-base.httpRequest
   - URL: https://svlentes.shop/api/monitoring/performance
   - Timeout: 10000ms

4. **Check Health Status**
   - Type: n8n-nodes-base.if
   - Condition: responseCode !== 200

5. **Check Response Time**
   - Type: n8n-nodes-base.if
   - Condition: responseTime > 3000ms

6. **Alert - Health Check Failed**
   - Type: n8n-nodes-base.httpRequest
   - URL: https://api.whatsapp.com/send
   - Phone: 553399898026
   - Message: "🚨 CRITICAL ALERT - Health check FAILED"

7. **Alert - Slow Performance**
   - Type: n8n-nodes-base.httpRequest
   - URL: https://api.whatsapp.com/send
   - Phone: 553399898026
   - Message: "⚠️ PERFORMANCE ALERT - Slow response time"

### Fluxo de Execução:

```
Schedule (Every 5 min)
    ↓
    ├─→ Health Check → Check Status → [FAIL] → Alert Critical
    └─→ Performance Metrics → Check Time → [SLOW] → Alert Performance
```

### Próxima Execução:

O workflow executará automaticamente a cada 5 minutos.

---

## Configuração Necessária

### 1. WhatsApp Integration

⚠️ **Pendente**: Configurar API WhatsApp Business

**Opções**:

#### A) WhatsApp Business API (Oficial)
- Criar conta em https://business.whatsapp.com
- Obter API credentials
- Configurar em n8n Credentials

#### B) API Alternativa (Twilio, MessageBird, etc)
```bash
# Exemplo Twilio
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token: your_auth_token
WhatsApp Number: +14155238886
```

#### C) Webhook alternativo (Slack, Discord, Email)
Modificar nodes para usar outro serviço de notificação.

### 2. PostgreSQL (Opcional)

Para adicionar logging de métricas:

```sql
CREATE DATABASE n8ndb;
CREATE USER n8nuser WITH PASSWORD 'senha_segura';

CREATE TABLE deployment_log (
  id SERIAL PRIMARY KEY,
  environment VARCHAR(50),
  status VARCHAR(20),
  commit VARCHAR(100),
  actor VARCHAR(100),
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE monitoring_log (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  health_status INTEGER,
  response_time INTEGER,
  error_count INTEGER
);
```

Adicionar nodes PostgreSQL nos workflows.

---

## GitHub Actions Integration

### Adicionar aos Secrets:

```
N8N_STAGING_WEBHOOK=https://saraivavision-n8n.cloud/webhook/staging-deployment
N8N_PRODUCTION_WEBHOOK=https://saraivavision-n8n.cloud/webhook/production-deployment
```

### Exemplo de uso em workflow:

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy
        run: |
          # seu script de deploy
          
      - name: Notify n8n
        if: always()
        run: |
          STATUS="${{ job.status == 'success' && 'success' || 'failure' }}"
          curl -X POST ${{ secrets.N8N_PRODUCTION_WEBHOOK }} \
            -H "Content-Type: application/json" \
            -d "{
              \"status\": \"$STATUS\",
              \"environment\": \"production\",
              \"commit\": \"${{ github.sha }}\",
              \"actor\": \"${{ github.actor }}\",
              \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
              \"url\": \"https://svlentes.com.br\"
            }"
```

---

## Verificação

### 1. Workflows Ativos
```bash
sqlite3 /root/approuter/n8n/data/database.sqlite \
  "SELECT name, active FROM workflow_entity WHERE name != 'My workflow';"
```

Resultado esperado:
```
Deployment Notification Workflow|1
Production Monitoring & Alerts|1
```

### 2. Nodes por Workflow
```bash
sqlite3 /root/approuter/n8n/data/database.sqlite \
  "SELECT name, json_array_length(nodes) as node_count FROM workflow_entity WHERE name != 'My workflow';"
```

Resultado esperado:
```
Deployment Notification Workflow|7
Production Monitoring & Alerts|7
```

### 3. Acessar Interface
https://saraivavision-n8n.cloud

Login: philipe_cruz@outlook.com

---

## Troubleshooting

### Workflows não aparecem na UI:
```bash
docker restart n8n
```

### Webhooks retornam 404:
- Verificar se workflows estão ativos
- Verificar path do webhook no banco de dados
- Testar: `curl https://saraivavision-n8n.cloud/webhook/staging-deployment`

### Schedule não executa:
- Verificar logs: `docker logs n8n -f`
- Workflows ativos executam a cada 5 minutos automaticamente

---

## Backup

```bash
# Backup completo
sqlite3 /root/approuter/n8n/data/database.sqlite .dump > n8n-backup.sql

# Restore
bash /root/svlentes-hero-shop/scripts/restore-n8n-workflows-complete.sh
```

---

**✅ Restauração Completa!**

Acesse: https://saraivavision-n8n.cloud
