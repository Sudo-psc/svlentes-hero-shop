# n8n Deployment Completo ✅

## Data: 2025-10-19

### Status do Deploy

✅ **n8n Acessível**: https://saraivavision-n8n.cloud

#### URLs Disponíveis
- **Editor**: https://saraivavision-n8n.cloud
- **Health Check**: https://saraivavision-n8n.cloud/healthz
- **Webhook Staging**: https://saraivavision-n8n.cloud/webhook/staging-deployment
- **Webhook Production**: https://saraivavision-n8n.cloud/webhook/production-deployment

### Container Configuration

```bash
Container ID: 000e4753d129
Image: n8nio/n8n:latest (v1.115.3)
Status: Running
Port: 5678 (internal) → 5678 (host)
```

**Variáveis de Ambiente:**
```
N8N_HOST=saraivavision-n8n.cloud
N8N_PROTOCOL=https
N8N_EDITOR_BASE_URL=https://saraivavision-n8n.cloud
WEBHOOK_URL=https://saraivavision-n8n.cloud/
```

### Reverse Proxy (Nginx)

**Configuração**: `/etc/nginx/sites-available/saraivavision-n8n.cloud`

```nginx
server {
    server_name saraivavision-n8n.cloud www.saraivavision-n8n.cloud;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/saraivavision-n8n.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/saraivavision-n8n.cloud/privkey.pem;
}
```

**SSL/TLS**: ✅ Let's Encrypt (Certbot)

### Workflows Ativos

#### 1. Deployment Notification Workflow
- **ID**: 9a62c9e0-eb69-47dd-ba8a-f92ce1149044
- **Status**: ✅ Ativo
- **Webhooks**:
  - Staging: `/webhook/staging-deployment`
  - Production: `/webhook/production-deployment`

#### 2. Production Monitoring & Alerts
- **ID**: 55ea7b83-0438-481f-9611-7c425cb728a8
- **Status**: ✅ Ativo
- **Schedule**: A cada 5 minutos
- **Monitoramento**:
  - Health check em https://svlentes.shop/api/health-check
  - Performance metrics
  - Error tracking

### Teste de Acesso

```bash
# Health check
curl https://saraivavision-n8n.cloud/healthz
# Response: {"status":"ok"}

# Interface principal (navegador)
open https://saraivavision-n8n.cloud
```

### GitHub Actions Integration

Adicione aos GitHub Secrets:

```bash
# Repository Settings → Secrets and variables → Actions
N8N_STAGING_WEBHOOK=https://saraivavision-n8n.cloud/webhook/staging-deployment
N8N_PRODUCTION_WEBHOOK=https://saraivavision-n8n.cloud/webhook/production-deployment
```

**Uso nos workflows:**

```yaml
# .github/workflows/deploy-production.yml
- name: Notify n8n
  run: |
    curl -X POST ${{ secrets.N8N_PRODUCTION_WEBHOOK }} \
      -H "Content-Type: application/json" \
      -d '{
        "status": "success",
        "environment": "production",
        "commit": "${{ github.sha }}",
        "actor": "${{ github.actor }}",
        "url": "https://svlentes.com.br"
      }'
```

### Configuração Pendente

#### 1. Primeiro Acesso
1. Abra https://saraivavision-n8n.cloud
2. Crie usuário admin
3. Configure senha segura

#### 2. Credenciais WhatsApp
**Tipo**: HTTP Request ou WhatsApp Business API
**Telefone**: +55 33 99898-026

#### 3. Credenciais PostgreSQL (opcional)
Para logging de deployments e métricas:

```sql
CREATE DATABASE n8ndb;
CREATE USER n8nuser WITH PASSWORD 'senha_segura';
GRANT ALL PRIVILEGES ON DATABASE n8ndb TO n8nuser;

-- Tabelas
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

### Comandos Úteis

```bash
# Ver logs do n8n
docker logs n8n -f

# Reiniciar n8n
docker restart n8n

# Verificar workflows no banco
sqlite3 /root/approuter/n8n/data/database.sqlite "SELECT * FROM workflow_entity;"

# Testar webhook manualmente
curl -X POST https://saraivavision-n8n.cloud/webhook/staging-deployment \
  -H "Content-Type: application/json" \
  -d '{"status":"success","environment":"staging","commit":"test123"}'
```

### Backup e Restore

**Backup:**
```bash
# Dados n8n
tar -czf n8n-backup-$(date +%Y%m%d).tar.gz /root/approuter/n8n/data/

# Workflows
sqlite3 /root/approuter/n8n/data/database.sqlite ".dump workflow_entity" > workflows-backup.sql
```

**Restore:**
```bash
# Usar script
bash /root/svlentes-hero-shop/scripts/restore-n8n-workflows-v2.sh
```

### Monitoramento

**Health Check Automático:**
```bash
# Adicionar ao cron (opcional)
*/5 * * * * curl -s https://saraivavision-n8n.cloud/healthz || echo "n8n down!" | mail -s "n8n Alert" admin@example.com
```

### Segurança

✅ HTTPS com Let's Encrypt
✅ Nginx reverse proxy
✅ Headers de segurança
✅ Timeouts configurados
✅ Volume persistente

### Troubleshooting

**502 Bad Gateway:**
```bash
# Verificar se n8n está rodando
docker ps | grep n8n

# Verificar logs
docker logs n8n --tail 50

# Reiniciar se necessário
docker restart n8n
```

**Workflows não ativam:**
```bash
# Verificar logs
docker logs n8n | grep -i error

# Recarregar workflows
docker restart n8n
```

### Próximos Passos

1. ✅ Deploy completo em https://saraivavision-n8n.cloud
2. ⏳ Criar usuário admin no primeiro acesso
3. ⏳ Configurar credenciais WhatsApp
4. ⏳ (Opcional) Configurar PostgreSQL para logging
5. ⏳ Adicionar webhooks ao GitHub Actions
6. ⏳ Testar workflows completos
7. ⏳ Configurar alertas personalizados

---

**Deploy concluído com sucesso!** 🎉

Acesse: https://saraivavision-n8n.cloud
