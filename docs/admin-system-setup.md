# Sistema Administrativo SV Lentes - Guia de Instalação e Configuração

## Visão Geral

Este documento descreve como instalar e configurar o sistema administrativo completo para a plataforma SV Lentes. O sistema inclui:

- Gestão de usuários administrativos com roles e permissões
- Sistema de auditoria completo
- Painel administrativo robusto
- Sistema de suporte avançado
- Gestão financeira detalhada
- Analytics e monitoramento

## 📋 Pré-requisitos

### Requisitos de Sistema
- PostgreSQL 13+ (já configurado no projeto)
- Node.js 18+ (já instalado)
- Ambiente Next.js 15 (já configurado)

### Conhecimentos Necessários
- SQL básico para verificação de migrações
- Prisma CLI para gerenciamento de database
- Noções de segurança para configuração inicial

## 🚀 Instalação

### 1. Backup do Database Atual

```bash
# Antes de aplicar as migrações, faça um backup
cd /root/svlentes-hero-shop
pg_dump $DATABASE_URL > backup_before_admin_system.sql
```

### 2. Aplicar Migrações do Sistema Administrativo

```bash
# Gerar cliente Prisma atualizado
npx prisma generate

# Aplicar migração SQL do sistema administrativo
psql $DATABASE_URL < prisma/migrations/001_add_admin_system.sql

# OU usando Prisma Migrate (se preferir)
npx prisma migrate dev --name add-admin-system
```

### 3. Verificar Instalação

```bash
# Verificar se as tabelas foram criadas
npx prisma db pull

# Visualizar schema atualizado
npx prisma studio
```

## 👥 Usuários Administrativos Padrão

O sistema cria 5 usuários administrativos padrão:

### Super Administrador
- **Email**: `admin@svlentes.com.br`
- **Senha**: `Admin123!`
- **Permissões**: Acesso total ao sistema
- **Função**: Configuração e manutenção do sistema

### Gerente de Operações
- **Email**: `manager@svlentes.com.br`
- **Senha**: `Manager123!`
- **Permissões**: Gestão de usuários, assinaturas, pedidos e suporte
- **Função**: Gestão do dia a dia das operações

### Agente de Suporte
- **Email**: `support@svlentes.com.br`
- **Senha**: `Support123!`
- **Permissões**: Gestão de tickets de suporte
- **Função**: Atendimento ao cliente

### Analista Financeiro
- **Email**: `finance@svlentes.com.br`
- **Senha**: `Finance123!`
- **Permissões**: Relatórios financeiros e gestão de pagamentos
- **Função**: Análise financeira e controle

### Visualizador
- **Email**: `viewer@svlentes.com.br`
- **Senha**: `Viewer123!`
- **Permissões**: Acesso somente leitura
- **Função**: Consulta de informações

## 🔐 Segurança - Configuração Inicial

### 1. Alterar Senhas Padrão

**CRÍTICO**: Altere todas as senhas padrão imediatamente após a instalação:

```sql
-- Exemplo de como alterar senha via SQL
UPDATE admin_users
SET password = '$2b$10$NOVA_HASH_SENHA_AQUI'
WHERE email = 'admin@svlentes.com.br';
```

### 2. Configurar 2FA

Para usuários críticos, configure autenticação de dois fatores:

```sql
-- Habilitar 2FA para Super Admin
UPDATE admin_users
SET two_factor_enabled = true,
    two_factor_secret = 'SECRETO_2FA_AQUI'
WHERE email = 'admin@svlentes.com.br';
```

### 3. Configurar Whitelist de IPs

```sql
-- Adicionar IPs confiáveis para Super Admin
UPDATE admin_users
SET ip_whitelist = ARRAY['192.168.1.100', '200.200.200.200']
WHERE email = 'admin@svlentes.com.br';
```

## 🔧 Configuração do Sistema

### 1. Variáveis de Ambiente

Adicione ao seu `.env.local`:

```env
# Sistema Administrativo
ADMIN_SESSION_TIMEOUT=3600000  # 1 hora em milissegundos
ADMIN_MAX_LOGIN_ATTEMPTS=5
ADMIN_LOCKOUT_DURATION=900000  # 15 minutos em milissegundos
ADMIN_JWT_SECRET=seu_jwt_secret_admin_aqui

# Configurações de Segurança
ADMIN_ENFORCE_2FA=false  # Mudar para true em produção
ADMIN_IP_WHITELIST_ENABLED=false
ADMIN_SESSION_ENCRYPTION=true

# Notificações Administrativas
ADMIN_EMAIL_NOTIFICATIONS=true
ADMIN_WEBHOOK_URL=https://seu-webhook.com/admin-alerts
```

### 2. Configurar Nginx para Painel Administrativo

Crie arquivo `/etc/nginx/sites-available/admin.svlentes.shop`:

```nginx
server {
    listen 443 ssl http2;
    server_name admin.svlentes.shop;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/admin.svlentes.shop/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.svlentes.shop/privkey.pem;

    # Security Headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=admin_limit:10m rate=10r/s;
    limit_req zone=admin_limit burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout for admin operations
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Restrict access to admin endpoints
    location /api/admin {
        # IP whitelist if enabled
        # allow 192.168.1.0/24;
        # deny all;

        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Habilitar Site Administrativo

```bash
sudo ln -s /etc/nginx/sites-available/admin.svlentes.shop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Obter Certificado SSL

```bash
sudo certbot certonly --nginx -d admin.svlentes.shop
```

## 📊 Estrutura do Sistema

### Hierarquia de Permissões

```
SUPER_ADMIN (Nível 5)
├── Todos os acessos
├── Configuração do sistema
├── Gestão de usuários admin
└── Logs e auditoria

ADMIN (Nível 4)
├── Acesso a quase todas as funcionalidades
├── Gestão de usuários
├── Configurações limitadas
└── Relatórios completos

MANAGER (Nível 3)
├── Gestão operacional
├── Usuários e assinaturas
├── Suporte e pedidos
└── Relatórios básicos

SUPPORT_AGENT (Nível 2)
├── Gestão de suporte
├── Visualização limitada
├── Atendimento ao cliente
└── Logs de suporte

FINANCIAL_ANALYST (Nível 2)
├── Relatórios financeiros
├── Gestão de pagamentos
├── Análise de dados
└── Exportação de relatórios

VIEWER (Nível 1)
├── Acesso somente leitura
├── Visualização de dashboards
├── Relatórios básicos
└── Sem permissões de escrita
```

### Modelo de Dados

O sistema estende os modelos existentes com campos administrativos:

#### Usuários
- `is_managed_by_admin`: Indica se o usuário é gerenciado por admin
- `assigned_admin_id`: ID do admin responsável
- `risk_score`: Score de risco (0-100)
- `flagged_for_review`: Marcação para revisão

#### Assinaturas
- `is_managed_by_admin`: Gestão administrativa
- `assigned_admin_id`: Admin responsável
- `risk_level`: Nível de risco (low/medium/high/critical)
- `payment_attempts`: Contador de tentativas de pagamento
- `custom_pricing`: Preços personalizados

#### Pedidos
- `is_managed_by_admin`: Gestão administrativa
- `assigned_admin_id`: Admin responsável
- `priority`: Prioridade do pedido
- `flagged_for_review`: Marcação para revisão
- `quality_checked`: Controle de qualidade

## 🎛️ Funcionalidades do Painel Administrativo

### Dashboard Principal
- Visão geral de métricas
- Gráficos interativos
- Indicadores em tempo real
- Alertas e notificações

### Gestão de Usuários
- Listagem com filtros avançados
- Edição em massa
- Histórico de atividades
- Controles de segurança

### Assinaturas
- Gestão completa de assinaturas
- Cancelamento e pausa
- Ajustes manuais
- Análise de churn

### Suporte
- Sistema completo de tickets
- Chat integrado
- Base de conhecimento
- SLA e métricas

### Financeiro
- Relatórios detalhados
- Gestão de reembolsos
- Análise de receita
- Conciliação bancária

### Sistema
- Logs e auditoria
- Configurações
- Monitoramento
- Backup e restore

## 🔍 Monitoramento e Manutenção

### Logs Importantes

```bash
# Logs do sistema administrativo
tail -f /var/log/nginx/admin.svlentes.shop.access.log
tail -f /var/log/nginx/error.log

# Logs da aplicação
journalctl -u svlentes-nextjs -f

# Logs específicos do admin (se configurados)
tail -f /var/log/svlentes/admin.log
```

### Monitoramento de Saúde

```sql
-- Verificar saúde do sistema
SELECT * FROM system_health
WHERE environment = 'production'
ORDER BY created_at DESC LIMIT 10;

-- Verificar eventos de segurança recentes
SELECT * FROM security_events
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Verificar ações administrativas recentes
SELECT * FROM admin_actions
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Backup Automático

```bash
# Criar script de backup para dados administrativos
cat > /root/scripts/backup_admin_data.sh << 'EOF'
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups/admin"
DB_URL="postgresql://user:password@localhost:5432/database"

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Backup das tabelas administrativas
pg_dump $DB_URL -t admin_users -t admin_sessions -t admin_actions \
    -t permission_history -t user_reviews -t subscription_reviews \
    -t support_tickets -t ticket_messages -t financial_transactions \
    -t refunds -t security_events -t system_logs \
    > $BACKUP_DIR/admin_data_$DATE.sql

# Comprimir backup
gzip $BACKUP_DIR/admin_data_$DATE.sql

# Remover backups antigos (manter últimos 7 dias)
find $BACKUP_DIR -name "admin_data_*.sql.gz" -mtime +7 -delete

echo "Backup administrativo concluído: $BACKUP_DIR/admin_data_$DATE.sql.gz"
EOF

chmod +x /root/scripts/backup_admin_data.sh

# Adicionar ao crontab para backup diário às 2h
echo "0 2 * * * /root/scripts/backup_admin_data.sh" | crontab -
```

## 🚨 Solução de Problemas

### Problemas Comuns

#### 1. Login não funciona
```bash
# Verificar se usuário existe
SELECT email, is_active, role FROM admin_users WHERE email = 'admin@svlentes.com.br';

# Verificar sessões ativas
SELECT * FROM admin_sessions WHERE admin_user_id = 'admin-super-001' AND status = 'ACTIVE';
```

#### 2. Permissões não funcionando
```bash
# Verificar permissões do usuário
SELECT email, role, permissions FROM admin_users WHERE email = 'admin@svlentes.com.br';

# Verificar histórico de mudanças de permissão
SELECT * FROM permission_history WHERE admin_user_id = 'admin-super-001';
```

#### 3. Dashboard não carrega
```bash
# Verificar configurações do dashboard
SELECT * FROM dashboard_configs WHERE admin_user_id = 'admin-super-001';

# Verificar cache do analytics
SELECT * FROM analytics_cache WHERE data_type = 'overview_summary';
```

#### 4. Logs de auditoria não aparecem
```bash
# Verificar se há logs recentes
SELECT COUNT(*) FROM admin_actions WHERE created_at > NOW() - INTERVAL '1 hour';

# Forçar criação de log de teste
INSERT INTO admin_actions (
    admin_user_id, admin_email, action, resource_type,
    action_type, ip_address, user_agent
) VALUES (
    'admin-super-001', 'admin@svlentes.com.br', 'TEST_ACTION',
    'system', 'read', '127.0.0.1', 'test-user-agent'
);
```

### Recuperação de Sistema

#### Reset de Senha de Admin
```sql
-- Gerar nova hash de senha (usando bcrypt no seu código)
UPDATE admin_users
SET password = '$2b$10$NOVA_HASH_AQUI',
    failed_login_attempts = 0,
    locked_until = NULL
WHERE email = 'admin@svlentes.com.br';
```

#### Limpeza de Sessões
```sql
-- Limpar todas as sessões ativas
UPDATE admin_sessions
SET status = 'TERMINATED', terminated_at = NOW()
WHERE status = 'ACTIVE';
```

#### Restauração de Backup
```bash
# Parar aplicação
systemctl stop svlentes-nextjs

# Restaurar backup
gunzip -c /root/backups/admin/admin_data_YYYYMMDD_HHMMSS.sql.gz | psql $DATABASE_URL

# Reiniciar aplicação
systemctl start svlentes-nextjs
```

## 📚 Documentação Adicional

### API Administrativa
- Endpoints em `/api/admin/*`
- Autenticação via JWT
- Rate limiting aplicado
- Logs automáticos

### Relatórios Disponíveis
- Relatório de usuários
- Relatório financeiro
- Relatório de suporte
- Relatório de sistema

### Integrações
- Webhooks para eventos críticos
- Exportação de dados
- APIs externas
- Sistema de notificações

## 🆘 Suporte

Para problemas com o sistema administrativo:

1. **Logs**: Verifique logs específicos primeiro
2. **Documentação**: Consulte este guia e a documentação da API
3. **Backup**: Tenha sempre um backup recente disponível
4. **Segurança**: Em caso de suspeita de comprometimento, bloqueie acessos imediatamente

### Contatos de Emergência
- **Suporte Técnico**: suporte@saraivavision.com.br
- **Segurança**: security@saraivavision.com.br
- **WhatsApp Administrativo**: +55 33 99989-8026

---

**IMPORTANTE**: Este é um sistema com acesso a dados sensíveis. Mantenha senhas seguras, configure autenticação 2FA e monitore acessos regularmente.