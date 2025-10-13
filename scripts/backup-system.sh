#!/bin/bash

###############################################################################
# Sistema de Backup Automático - SV Lentes
#
# Este script realiza backup de:
# - Banco de dados (PostgreSQL)
# - Arquivos de configuração
# - Logs da aplicação
# - Dados de transações
#
# Uso:
#   ./scripts/backup-system.sh [daily|weekly|monthly]
#
# Cron jobs sugeridos:
#   0 2 * * * /root/svlentes-hero-shop/scripts/backup-system.sh daily
#   0 3 * * 0 /root/svlentes-hero-shop/scripts/backup-system.sh weekly
#   0 4 1 * * /root/svlentes-hero-shop/scripts/backup-system.sh monthly
###############################################################################

set -e # Exit on error

# Configurações
BACKUP_TYPE="${1:-daily}"
PROJECT_ROOT="/root/svlentes-hero-shop"
BACKUP_ROOT="/root/backups/svlentes"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_ROOT}/${BACKUP_TYPE}/${TIMESTAMP}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Criar diretório de backup
create_backup_dir() {
    log_info "Creating backup directory: ${BACKUP_DIR}"
    mkdir -p "${BACKUP_DIR}"/{database,config,logs,transactions}
}

# Backup do banco de dados
backup_database() {
    log_info "Starting database backup..."

    if [ -z "$DATABASE_URL" ]; then
        log_warning "DATABASE_URL not set, skipping database backup"
        return
    fi

    # Extrair informações da connection string
    # Format: postgresql://user:password@host:port/database
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

    # Backup usando pg_dump
    PGPASSWORD="$DB_PASS" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-owner \
        --no-acl \
        --format=custom \
        --file="${BACKUP_DIR}/database/svlentes_${TIMESTAMP}.dump"

    # Backup em SQL text format (para fácil visualização)
    PGPASSWORD="$DB_PASS" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-owner \
        --no-acl \
        --file="${BACKUP_DIR}/database/svlentes_${TIMESTAMP}.sql"

    # Comprimir backup SQL
    gzip "${BACKUP_DIR}/database/svlentes_${TIMESTAMP}.sql"

    log_success "Database backup completed"
}

# Backup de arquivos de configuração
backup_config() {
    log_info "Starting configuration backup..."

    # Backup de arquivos essenciais (sem credenciais)
    cp "${PROJECT_ROOT}/.env.example" "${BACKUP_DIR}/config/" 2>/dev/null || true
    cp "${PROJECT_ROOT}/package.json" "${BACKUP_DIR}/config/"
    cp "${PROJECT_ROOT}/next.config.js" "${BACKUP_DIR}/config/" 2>/dev/null || true
    cp "${PROJECT_ROOT}/tailwind.config.js" "${BACKUP_DIR}/config/" 2>/dev/null || true
    cp "${PROJECT_ROOT}/tsconfig.json" "${BACKUP_DIR}/config/" 2>/dev/null || true

    # Backup de documentação
    cp -r "${PROJECT_ROOT}/docs" "${BACKUP_DIR}/config/" 2>/dev/null || true
    cp "${PROJECT_ROOT}/README.md" "${BACKUP_DIR}/config/" 2>/dev/null || true
    cp "${PROJECT_ROOT}/CLAUDE.md" "${BACKUP_DIR}/config/" 2>/dev/null || true

    log_success "Configuration backup completed"
}

# Backup de logs
backup_logs() {
    log_info "Starting logs backup..."

    # Logs do Next.js (se existirem)
    if [ -d "${PROJECT_ROOT}/.next/logs" ]; then
        cp -r "${PROJECT_ROOT}/.next/logs" "${BACKUP_DIR}/logs/nextjs"
    fi

    # Logs do sistema (systemd)
    if command -v journalctl &> /dev/null; then
        journalctl -u svlentes-nextjs --since "7 days ago" > "${BACKUP_DIR}/logs/systemd.log" 2>/dev/null || true
    fi

    # Logs do Nginx
    if [ -f "/var/log/nginx/svlentes.com.br.access.log" ]; then
        cp /var/log/nginx/svlentes.com.br.access.log "${BACKUP_DIR}/logs/nginx-access.log" 2>/dev/null || true
        cp /var/log/nginx/svlentes.com.br.error.log "${BACKUP_DIR}/logs/nginx-error.log" 2>/dev/null || true
    fi

    # Comprimir logs
    find "${BACKUP_DIR}/logs" -type f -name "*.log" -exec gzip {} \;

    log_success "Logs backup completed"
}

# Backup de dados de transações (exportar do banco)
backup_transactions() {
    log_info "Starting transactions data backup..."

    if [ -z "$DATABASE_URL" ]; then
        log_warning "DATABASE_URL not set, skipping transactions backup"
        return
    fi

    # Exportar tabelas de transações (se existirem)
    PGPASSWORD="$DB_PASS" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "\COPY (SELECT * FROM payments ORDER BY created_at DESC LIMIT 10000) TO '${BACKUP_DIR}/transactions/payments.csv' WITH CSV HEADER" \
        2>/dev/null || log_warning "Payments table not found or empty"

    PGPASSWORD="$DB_PASS" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "\COPY (SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 10000) TO '${BACKUP_DIR}/transactions/subscriptions.csv' WITH CSV HEADER" \
        2>/dev/null || log_warning "Subscriptions table not found or empty"

    # Comprimir CSVs
    find "${BACKUP_DIR}/transactions" -type f -name "*.csv" -exec gzip {} \;

    log_success "Transactions backup completed"
}

# Criar arquivo de metadados
create_metadata() {
    log_info "Creating backup metadata..."

    cat > "${BACKUP_DIR}/metadata.json" <<EOF
{
  "backup_type": "${BACKUP_TYPE}",
  "timestamp": "${TIMESTAMP}",
  "date": "$(date -Iseconds)",
  "hostname": "$(hostname)",
  "environment": "${NODE_ENV:-production}",
  "git_commit": "$(cd ${PROJECT_ROOT} && git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(cd ${PROJECT_ROOT} && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "nextjs_version": "$(cd ${PROJECT_ROOT} && node -p "require('./package.json').dependencies.next" 2>/dev/null || echo 'unknown')",
  "node_version": "$(node --version)",
  "backup_size": "$(du -sh ${BACKUP_DIR} | cut -f1)"
}
EOF

    log_success "Metadata created"
}

# Comprimir backup completo
compress_backup() {
    log_info "Compressing backup..."

    cd "${BACKUP_ROOT}/${BACKUP_TYPE}"
    tar -czf "${TIMESTAMP}.tar.gz" "${TIMESTAMP}"
    rm -rf "${TIMESTAMP}"

    log_success "Backup compressed: ${TIMESTAMP}.tar.gz"
}

# Limpar backups antigos
cleanup_old_backups() {
    log_info "Cleaning up old backups..."

    # Retenção baseada no tipo
    case $BACKUP_TYPE in
        daily)
            # Manter últimos 7 dias
            find "${BACKUP_ROOT}/daily" -name "*.tar.gz" -mtime +7 -delete
            log_success "Removed daily backups older than 7 days"
            ;;
        weekly)
            # Manter últimas 4 semanas
            find "${BACKUP_ROOT}/weekly" -name "*.tar.gz" -mtime +28 -delete
            log_success "Removed weekly backups older than 28 days"
            ;;
        monthly)
            # Manter últimos 12 meses
            find "${BACKUP_ROOT}/monthly" -name "*.tar.gz" -mtime +365 -delete
            log_success "Removed monthly backups older than 365 days"
            ;;
    esac
}

# Verificar integridade do backup
verify_backup() {
    log_info "Verifying backup integrity..."

    local backup_file="${BACKUP_ROOT}/${BACKUP_TYPE}/${TIMESTAMP}.tar.gz"

    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi

    # Testar compressão
    if tar -tzf "$backup_file" > /dev/null 2>&1; then
        log_success "Backup integrity verified"
        return 0
    else
        log_error "Backup integrity check failed!"
        return 1
    fi
}

# Enviar notificação
send_notification() {
    local status=$1
    local message=$2

    log_info "Sending notification..."

    # Webhook (Slack/Discord/etc)
    if [ -n "$BACKUP_WEBHOOK_URL" ]; then
        curl -X POST "$BACKUP_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"status\":\"$status\",\"message\":\"$message\",\"timestamp\":\"$(date -Iseconds)\"}" \
            2>/dev/null || log_warning "Failed to send webhook notification"
    fi

    # Email (se configurado)
    if [ -n "$BACKUP_EMAIL" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "SVLentes Backup ${status}" "$BACKUP_EMAIL" \
            2>/dev/null || log_warning "Failed to send email notification"
    fi
}

# Copiar para S3/Cloud Storage (opcional)
upload_to_cloud() {
    log_info "Uploading backup to cloud storage..."

    local backup_file="${BACKUP_ROOT}/${BACKUP_TYPE}/${TIMESTAMP}.tar.gz"

    # AWS S3
    if [ -n "$AWS_S3_BUCKET" ] && command -v aws &> /dev/null; then
        aws s3 cp "$backup_file" "s3://${AWS_S3_BUCKET}/backups/svlentes/${BACKUP_TYPE}/${TIMESTAMP}.tar.gz" \
            && log_success "Uploaded to AWS S3" \
            || log_warning "Failed to upload to AWS S3"
    fi

    # Google Cloud Storage
    if [ -n "$GCS_BUCKET" ] && command -v gsutil &> /dev/null; then
        gsutil cp "$backup_file" "gs://${GCS_BUCKET}/backups/svlentes/${BACKUP_TYPE}/${TIMESTAMP}.tar.gz" \
            && log_success "Uploaded to Google Cloud Storage" \
            || log_warning "Failed to upload to GCS"
    fi
}

# Função principal
main() {
    echo "================================"
    echo "SV Lentes Backup System"
    echo "Type: ${BACKUP_TYPE}"
    echo "Timestamp: ${TIMESTAMP}"
    echo "================================"
    echo ""

    # Carregar variáveis de ambiente
    if [ -f "${PROJECT_ROOT}/.env.local" ]; then
        export $(grep -v '^#' "${PROJECT_ROOT}/.env.local" | xargs)
    fi

    # Executar backup
    create_backup_dir
    backup_database
    backup_config
    backup_logs
    backup_transactions
    create_metadata
    compress_backup

    # Verificar e limpar
    if verify_backup; then
        cleanup_old_backups
        upload_to_cloud

        # Calcular tamanho do backup
        backup_size=$(du -sh "${BACKUP_ROOT}/${BACKUP_TYPE}/${TIMESTAMP}.tar.gz" | cut -f1)

        send_notification "SUCCESS" "Backup ${BACKUP_TYPE} completed successfully. Size: ${backup_size}"

        echo ""
        log_success "Backup completed successfully!"
        log_info "Location: ${BACKUP_ROOT}/${BACKUP_TYPE}/${TIMESTAMP}.tar.gz"
        log_info "Size: ${backup_size}"
    else
        send_notification "FAILED" "Backup ${BACKUP_TYPE} failed integrity check"
        log_error "Backup failed!"
        exit 1
    fi
}

# Executar
main
