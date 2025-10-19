# n8n Backups

## Arquivos

### 1. Database Backup (SQL)
- **Arquivo**: `n8n-full-backup-*.sql`
- **Conteúdo**: Dump completo do SQLite
- **Uso**: 
  ```bash
  sqlite3 /caminho/database.sqlite < n8n-full-backup-*.sql
  ```

### 2. Volume Backup (TAR.GZ)
- **Arquivo**: `n8n-volume-backup-*.tar.gz`
- **Conteúdo**: Todos os dados do volume Docker
- **Uso**:
  ```bash
  tar -xzf n8n-volume-backup-*.tar.gz -C /root/approuter/n8n/
  ```

## Restore Completo

```bash
# 1. Parar container
docker stop n8n && docker rm n8n

# 2. Restaurar volume
cd /root/approuter/n8n
tar -xzf /root/svlentes-hero-shop/backups/n8n/n8n-volume-backup-*.tar.gz

# 3. Iniciar novo container
docker run -d \
  --name n8n \
  --restart unless-stopped \
  -p 5678:5678 \
  -e N8N_HOST=saraivavision-n8n.cloud \
  -e N8N_PROTOCOL=https \
  -e WEBHOOK_URL=https://saraivavision-n8n.cloud/ \
  -e N8N_EDITOR_BASE_URL=https://saraivavision-n8n.cloud \
  -v /root/approuter/n8n/data:/home/node/.n8n \
  n8nio/n8n:latest
```

## User Credentials

**Email**: philipe_cruz@outlook.com
**Role**: Owner/Admin
**Created**: 2025-10-19

Para resetar senha:
```bash
docker exec -it n8n n8n user-management:reset --email=philipe_cruz@outlook.com
```
