# n8n User Configuration Backup

## Data: 2025-10-19

### User Account

**Email**: philipe_cruz@outlook.com
**Nome**: Philipe Cruz
**Role**: global:owner (Owner/Admin)
**Status**: Active
**Created**: 2025-10-19 01:26:01 UTC

### Personalization Survey
```json
{
  "version": "v4",
  "personalization_survey_submitted_at": "2025-10-19T01:43:21.276Z",
  "personalization_survey_n8n_version": "1.115.3"
}
```

### Credentials Configured

#### 1. GitHub API Credential
- **Name**: GitHub account
- **Type**: githubApi
- **Created**: 2025-10-19 01:47:10 UTC
- **Status**: Active

### Settings

#### User Management
```
userManagement.isInstanceOwnerSetUp: true
userManagement.authenticationMethod: email
```

#### Source Control (Git Integration)
```json
{
  "branchName": "main",
  "connectionType": "ssh",
  "keyGeneratorType": "ed25519"
}
```

**SSH Keys**: Configured (encrypted)
- Public Key: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIA70LutAsHpRuktXRSpjZRWXL14KNALcS2t1JtLp4BG n8n deploy key`

#### UI Settings
```
ui.banners.dismissed: ["V1"]
```

#### LDAP
```json
{
  "loginEnabled": false,
  "loginLabel": "",
  "synchronizationEnabled": false,
  "synchronizationInterval": 60
}
```

### Database Export

**User ID**: 650cb67f-a9fc-4270-b9d6-a2987ee1a987

```sql
-- User record
INSERT INTO user (
  id, email, firstName, lastName, password, 
  personalizationAnswers, createdAt, updatedAt, 
  settings, disabled, mfaEnabled, lastActiveAt, roleSlug
) VALUES (
  '650cb67f-a9fc-4270-b9d6-a2987ee1a987',
  'philipe_cruz@outlook.com',
  'philipe',
  'cruz',
  '$2a$10$/MkOo1ABeEYpA4sIVkcXCOjtP15dUgA1S1K26eyCkUyuQDBqd3EqW',
  '{"version":"v4","personalization_survey_submitted_at":"2025-10-19T01:43:21.276Z","personalization_survey_n8n_version":"1.115.3"}',
  '2025-10-19 01:26:01.792',
  '2025-10-19 02:00:44',
  '{"userActivated":false}',
  0,
  0,
  '2025-10-18',
  'global:owner'
);

-- GitHub Credential
INSERT INTO credentials_entity (
  id, name, data, type, createdAt, updatedAt, disabled
) VALUES (
  'QW2CmqYDfnO9tv9L',
  'GitHub account',
  'U2FsdGVkX19bIim1Pa/g6HaLhf6r1EV9TCv99QJt5yKUIMCY1kPE/HAp+oBNvKzwyTa9hMOrCcQCpvCO8TDP4ar/XdklOP4FM+hKOFQUCivxLtBh97e4tfxYqcmyfdfiGX920BvD24geDBf3SvRqAQvagRXTagkL/4XhKd6sDP5MyZUJxMVJv9ZRcAPa5piUgIRFadVcj8DaUfV+0b72Sg==',
  'githubApi',
  '2025-10-19 01:47:10.087',
  '2025-10-19 01:47:10.081',
  0
);
```

### Full Database Backup

**Localização**: `/root/approuter/n8n/data/database.sqlite`

**Backup Command**:
```bash
# Backup completo do banco
sqlite3 /root/approuter/n8n/data/database.sqlite .dump > n8n-full-backup-$(date +%Y%m%d).sql

# Backup apenas do usuário
sqlite3 /root/approuter/n8n/data/database.sqlite "SELECT * FROM user WHERE email='philipe_cruz@outlook.com';" > user-backup.sql

# Backup de credenciais
sqlite3 /root/approuter/n8n/data/database.sqlite ".dump credentials_entity" > credentials-backup.sql

# Backup de settings
sqlite3 /root/approuter/n8n/data/database.sqlite ".dump settings" > settings-backup.sql
```

### Restore Instructions

#### Para nova instância n8n:

1. **Copiar dados completos**:
```bash
# Parar n8n
docker stop n8n

# Copiar database.sqlite para nova instância
cp /root/approuter/n8n/data/database.sqlite /caminho/novo/n8n/data/

# Reiniciar
docker start n8n
```

2. **Ou importar via SQL**:
```bash
# Criar dump completo
sqlite3 /root/approuter/n8n/data/database.sqlite .dump > n8n-complete-dump.sql

# Em nova instância
sqlite3 /caminho/novo/database.sqlite < n8n-complete-dump.sql
```

3. **Restaurar apenas usuário e credenciais** (em instância limpa):
```bash
# Importar user
sqlite3 /caminho/novo/database.sqlite < user-backup.sql

# Importar credenciais
sqlite3 /caminho/novo/database.sqlite < credentials-backup.sql

# Importar settings
sqlite3 /caminho/novo/database.sqlite < settings-backup.sql
```

### Volumes Docker

**Volume Mount**: `/root/approuter/n8n/data:/home/node/.n8n`

**Conteúdo**:
```
/root/approuter/n8n/data/
├── binaryData/
├── config
├── credentials/
├── database.sqlite      # Banco principal
├── git/
├── nodes/
├── ssh/
└── workflows/
```

### Migração para Novo Servidor

#### Opção 1: Backup completo do volume
```bash
# No servidor antigo
cd /root/approuter/n8n
tar -czf n8n-volume-backup.tar.gz data/

# Transferir para novo servidor
scp n8n-volume-backup.tar.gz user@new-server:/root/approuter/n8n/

# No novo servidor
cd /root/approuter/n8n
tar -xzf n8n-volume-backup.tar.gz

# Iniciar n8n
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

#### Opção 2: Exportar workflows via n8n UI
1. Acesse https://saraivavision-n8n.cloud
2. Vá em cada workflow
3. Clique em "Download" para exportar JSON
4. Na nova instância, importe os JSONs

### Acesso Atual

**URL**: https://saraivavision-n8n.cloud
**Email**: philipe_cruz@outlook.com
**Senha**: [armazenada de forma segura - hash bcrypt]

### Segurança

- ✅ Senha criptografada com bcrypt
- ✅ Credenciais criptografadas (AES)
- ✅ SSH keys geradas e configuradas
- ✅ MFA: Não habilitado (pode ser ativado em Settings)

### Recomendações

1. **Habilitar MFA**: Settings → Security → Two-Factor Authentication
2. **Backup Regular**: Agendar backup diário do database.sqlite
3. **Monitorar Acesso**: Verificar logs em `n8nEventLog.log`
4. **Atualizar Senha**: Periodicamente via UI
5. **Backup Offsite**: Copiar backups para outro servidor/cloud

### Support

Se precisar resetar senha:
```bash
# Via Docker
docker exec -it n8n n8n user-management:reset --email=philipe_cruz@outlook.com
```

---

**Backup criado**: 2025-10-19 02:00 UTC
**n8n Version**: 1.115.3
